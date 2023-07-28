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

import { NotFound } from '@feathersjs/errors'
import { Id, Params } from '@feathersjs/feathers'
import { KnexAdapter, KnexAdapterOptions, KnexAdapterParams } from '@feathersjs/knex/lib'

import { getTicketsAssignment } from '@etherealengine/matchmaking/src/functions'
import {
  MatchTicketAssignmentQuery,
  MatchTicketAssignmentType
} from '@etherealengine/matchmaking/src/match-ticket-assignment.schema'
import config from '@etherealengine/server-core/src/appconfig'

import { Application } from '../../../declarations'
import { emulate_getTicketsAssignment } from '../emulate'

export interface MatchTicketAssignmentParams extends KnexAdapterParams<MatchTicketAssignmentQuery> {
  userId?: string
}

/**
 * A class for MatchTicketAssignment service
 */
export class MatchTicketAssignmentService<
  T = MatchTicketAssignmentType,
  ServiceParams extends Params = MatchTicketAssignmentParams
> extends KnexAdapter<MatchTicketAssignmentType, MatchTicketAssignmentParams> {
  app: Application

  constructor(options: KnexAdapterOptions, app: Application) {
    super(options)
    this.app = app
  }

  async get(id: Id, params: MatchTicketAssignmentParams) {
    let assignment: MatchTicketAssignmentType
    try {
      if (config.server.matchmakerEmulationMode) {
        assignment = await emulate_getTicketsAssignment(this.app, id, params['identity-provider'].userId)
      } else {
        assignment = await getTicketsAssignment(String(id))
      }
    } catch (e) {
      // todo: handle other errors. like no connection, etc....
      throw new NotFound(e.message, e)
    }

    return assignment
  }
}
