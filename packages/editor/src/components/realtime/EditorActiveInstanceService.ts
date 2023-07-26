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

import { LocationInstanceConnectionAction } from '@etherealengine/client-core/src/common/services/LocationInstanceConnectionService'
import { AuthState } from '@etherealengine/client-core/src/user/services/AuthService'
import { UserId } from '@etherealengine/common/src/interfaces/UserId'
import logger from '@etherealengine/common/src/logger'
import { matches, Validator } from '@etherealengine/engine/src/common/functions/MatchesUtils'
import { Engine } from '@etherealengine/engine/src/ecs/classes/Engine'
import { defineAction, defineState, dispatchAction, getMutableState, getState } from '@etherealengine/hyperflux'

export type ActiveInstance = {
  id: string
  location: string
  currentUsers: number
  // todo: assignedAt so we can sort by most recent?
}

export const EditorActiveInstanceState = defineState({
  name: 'EditorActiveInstanceState',
  initial: () => ({
    activeInstances: [] as ActiveInstance[],
    fetching: false
  })
})

export const EditorActiveInstanceServiceReceptor = (action): any => {
  const state = getMutableState(EditorActiveInstanceState)
  matches(action)
    .when(EditorActiveInstanceAction.fetchingActiveInstances.matches, (action) => {
      return state.merge({ fetching: true })
    })
    .when(EditorActiveInstanceAction.fetchedActiveInstances.matches, (action) => {
      return state.merge({ activeInstances: action.activeInstances, fetching: false })
    })
}

//Service
export const EditorActiveInstanceService = {
  provisionServer: async (locationId: string, instanceId: string, sceneId: string) => {
    logger.info({ locationId, instanceId, sceneId }, 'Provision World Server Editor')
    const token = getState(AuthState).authUser.accessToken
    const provisionResult = await Engine.instance.api.service('instance-provision').find({
      query: {
        locationId: locationId,
        instanceId: instanceId,
        sceneId: sceneId,
        token: token
      }
    })
    if (provisionResult.ipAddress && provisionResult.port) {
      dispatchAction(
        LocationInstanceConnectionAction.serverProvisioned({
          instanceId: provisionResult.id as UserId,
          ipAddress: provisionResult.ipAddress,
          port: provisionResult.port,
          roomCode: provisionResult.roomCode,
          locationId: locationId!,
          sceneId: sceneId!
        })
      )
    }
  },
  getActiveInstances: async (sceneId: string) => {
    dispatchAction(EditorActiveInstanceAction.fetchingActiveInstances({}))
    const activeInstances = await Engine.instance.api.service('instances-active').find({
      query: { sceneId }
    })
    dispatchAction(EditorActiveInstanceAction.fetchedActiveInstances({ activeInstances }))
  }
}

//Action
export class EditorActiveInstanceAction {
  static fetchingActiveInstances = defineAction({
    type: 'ee.editor.EditorActiveInstance.FETCHING_ACTIVE_INSTANCES' as const
  })

  static fetchedActiveInstances = defineAction({
    type: 'ee.editor.EditorActiveInstance.FETCHED_ACTIVE_INSTANCES' as const,
    activeInstances: matches.array as Validator<unknown, ActiveInstance[]>
  })
}
