/*
CPAL-1.0 License

The contents of this file are subject to the Common Public Attribution License
Version 1.0. (the "License"); you may not use this file except in compliance
with the License. You may obtain a copy of the License at
https://github.com/EtherealEngine/etherealengine/blob/dev/LICENSE.
The License is based on the Mozilla Public License Version 1.1, but Sections 14
and 15 have been added to cover use of software over a computer network and 
provide for limited attribution for the Original Developer. In addition, 
Exhibit A has been modified to be consistent with Exhibit B.

Software distributed under the License is distributed on an "AS IS" basis,
WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License for the
specific language governing rights and limitations under the License.

The Original Code is Ethereal Engine.

The Original Developer is the Initial Developer. The Initial Developer of the
Original Code is the Ethereal Engine team.

All portions of the code written by the Ethereal Engine team are Copyright © 2021-2023 
Ethereal Engine. All Rights Reserved.
*/

import { NotAuthenticated } from '@feathersjs/errors'
import { Paginated } from '@feathersjs/feathers/lib'
import crypto from 'crypto'
import { iff, isProvider } from 'feathers-hooks-common'

import logger from '@etherealengine/common/src/logger'
import { serverSettingPath, ServerSettingType } from '@etherealengine/engine/src/schemas/setting/server-setting.schema'

import { Application } from '../../../declarations'
import authenticate from '../../hooks/authenticate'
import setResponseStatusCode from '../../hooks/set-response-status-code'
import { getUserRepos } from '../../projects/project/github-helper'
import { UnauthorizedException } from '../../util/exceptions/exception'
import { GithubRepoAccess } from './github-repo-access.class'
import githubRepoAccessDocs from './github-repo-access.docs'
import hooks from './github-repo-access.hooks'
import createModel from './github-repo-access.model'

declare module '@etherealengine/common/declarations' {
  interface ServiceTypes {
    'github-repo-access': any
    'github-repo-access-webhook': any
    'github-repo-access-refresh': any
  }
}

const SIG_HEADER_NAME = 'x-hub-signature-256'
const SIG_HASH_ALGORITHM = 'sha256'

/**
 * Initialize our service with any options it requires and docs
 */
export default (app: Application): void => {
  const options = {
    Model: createModel(app),
    paginate: app.get('paginate'),
    multi: true
  }

  const event = new GithubRepoAccess(options, app)
  event.docs = githubRepoAccessDocs

  app.use('github-repo-access', event)

  const service = app.service('github-repo-access')

  service.hooks(hooks)

  app.use('github-repo-access-webhook', {
    create: async (data, params): Promise<string> => {
      try {
        const secret = ((await app.service(serverSettingPath).find()) as Paginated<ServerSettingType>).data[0]
          .githubWebhookSecret
        const sig = Buffer.from(params.headers[SIG_HEADER_NAME] || '', 'utf8')
        const hmac = crypto.createHmac(SIG_HASH_ALGORITHM, secret)
        const digest = Buffer.from(SIG_HASH_ALGORITHM + '=' + hmac.update(JSON.stringify(data)).digest('hex'), 'utf8')
        if (sig.length !== digest.length || !crypto.timingSafeEqual(digest, sig)) {
          throw new UnauthorizedException('Invalid secret')
        }
        const { blocked_user, member, membership } = data
        const ghUser = member
          ? member.login
          : membership
          ? membership.user.login
          : blocked_user
          ? blocked_user.login
          : null
        if (!ghUser) return ''
        const githubIdentityProvider = await app.service('identity-provider').Model.findOne({
          where: {
            type: 'github',
            accountIdentifier: ghUser
          }
        })
        if (!githubIdentityProvider) return ''
        const user = await app.service('user').get(githubIdentityProvider.userId)
        // GitHub's API doesn't always reflect changes to user repo permissions right when a webhook is sent.
        // 10 seconds should be more than enough time for the changes to propagate.
        setTimeout(() => {
          app.service('github-repo-access-refresh').find({ user })
        }, 10000)
        return ''
      } catch (err) {
        console.error(err)
        throw err
      }
    }
  })

  app.service('github-repo-access-webhook').hooks({
    after: {
      create: [setResponseStatusCode(200)]
    }
  })
  app.use('github-repo-access-refresh', {
    find: async (params): Promise<void> => {
      try {
        const githubIdentityProvider = await (app.service('identity-provider') as any).Model.findOne({
          where: {
            userId: params.user.id,
            type: 'github'
          }
        })
        if (githubIdentityProvider) {
          const existingGithubRepoAccesses = await app.service('github-repo-access').Model.findAll({
            paginate: false,
            where: {
              identityProviderId: githubIdentityProvider.id
            }
          })
          const githubRepos = await getUserRepos(githubIdentityProvider.oauthToken)
          await Promise.all(
            githubRepos.map(async (repo) => {
              const matchingAccess = existingGithubRepoAccesses.find((access) => access.repo === repo.html_url)
              const hasWriteAccess = repo.permissions.admin || repo.permissions.maintain || repo.permissions.push
              if (!matchingAccess)
                await app.service('github-repo-access').create({
                  repo: repo.html_url,
                  identityProviderId: githubIdentityProvider.id,
                  hasWriteAccess
                })
              else
                await app.service('github-repo-access').patch(matchingAccess.id, {
                  hasWriteAccess
                })
            })
          )
          const urlsOnly = githubRepos.map((repo) => repo.html_url)
          await Promise.all(
            existingGithubRepoAccesses.map(async (repoAccess) => {
              if (urlsOnly.indexOf(repoAccess.repo) < 0) await app.service('github-repo-access').remove(repoAccess.id)
            })
          )
        }
        return
      } catch (err) {
        logger.error(err)
        throw err
      }
    }
  })

  app.service('github-repo-access-refresh').hooks({
    before: {
      find: [iff(isProvider('external'), authenticate() as any)]
    }
  })
}
