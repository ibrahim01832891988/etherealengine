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

import { Hook, HookContext, Paginated } from '@feathersjs/feathers'

import { Instance } from '@etherealengine/common/src/interfaces/Instance'
import { Location as LocationType } from '@etherealengine/common/src/interfaces/Location'
import { matchInstancePath } from '@etherealengine/engine/src/schemas/matchmaking/match-instance.schema'

import { Application } from '../../declarations'
import { getFreeInstanceserver } from '../networking/instance-provision/instance-provision.class'
import logger from '../ServerLogger'

export default (): Hook => {
  return async (context: HookContext<Application>): Promise<HookContext> => {
    const { app, result } = context
    const matchInstanceId = result?.id
    const connection = result?.connection
    const gameMode = result?.gameMode

    if (!connection) {
      // assignment is not found yet
      return context
    }
    if (!gameMode) {
      // throw error?!
      throw new Error('Unexpected response from match finder. ' + JSON.stringify(result))
    }

    const locationName = 'game-' + gameMode
    const location = (await app.service('location').find({
      query: {
        name: locationName
      }
    })) as Paginated<LocationType>
    if (!location.data.length) {
      // throw error?!
      throw new Error(`Location for match type '${gameMode}'(${locationName}) is not found.`)
    }

    const freeInstance = await getFreeInstanceserver({ app, iteration: 0, locationId: location.data[0].id })
    try {
      const existingInstance = (await app.service('instance').find({
        query: {
          ipAddress: `${freeInstance.ipAddress}:${freeInstance.port}`,
          locationId: location.data[0].id,
          ended: false
        }
      })) as Paginated<Instance>

      let instanceId
      if (existingInstance.total === 0) {
        const newInstance = {
          ipAddress: `${freeInstance.ipAddress}:${freeInstance.port}`,
          currentUsers: 0,
          locationId: location.data[0].id,
          assigned: true,
          assignedAt: new Date()
        }
        const newInstanceResult = (await app.service('instance').create(newInstance)) as Instance
        instanceId = newInstanceResult.id
      } else {
        instanceId = existingInstance.data[0].id
      }

      // matchInstanceId
      await app.service(matchInstancePath).patch(matchInstanceId, {
        instanceServer: instanceId
      })

      context.result.instanceServer = instanceId
    } catch (e) {
      logger.error(e, `Matchmaking instance create error: ${e.message || e.errors[0].message}`)
      // TODO: check error? skip?
    }

    return context
  }
}
