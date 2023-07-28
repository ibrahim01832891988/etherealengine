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

import { Paginated } from '@feathersjs/feathers'

import { CreateEditUser, UserInterface, UserSeed } from '@etherealengine/common/src/interfaces/User'
import { matches, Validator } from '@etherealengine/engine/src/common/functions/MatchesUtils'
import { defineAction, defineState, dispatchAction, getMutableState } from '@etherealengine/hyperflux'

import { API } from '../../API'
import { NotificationService } from '../../common/services/NotificationService'
import { AuthService, AuthState } from '../../user/services/AuthService'

//State
export const USER_PAGE_LIMIT = 10
export const AdminUserState = defineState({
  name: 'AdminUserState',
  initial: () => ({
    users: [] as Array<UserInterface>,
    singleUser: UserSeed as UserInterface,
    skip: 0,
    limit: USER_PAGE_LIMIT,
    total: 0,
    retrieving: false,
    fetched: false,
    updateNeeded: true,
    skipGuests: false,
    lastFetched: 0
  })
})

const fetchedSingleUserReceptor = (action: typeof AdminUserActions.fetchedSingleUser.matches._TYPE) => {
  const state = getMutableState(AdminUserState)
  return state.merge({ singleUser: action.data, updateNeeded: false })
}

const loadedUsersReceptor = (action: typeof AdminUserActions.loadedUsers.matches._TYPE) => {
  const state = getMutableState(AdminUserState)
  return state.merge({
    users: action.userResult.data,
    skip: action.userResult.skip,
    limit: action.userResult.limit,
    total: action.userResult.total,
    retrieving: false,
    fetched: true,
    updateNeeded: false,
    lastFetched: Date.now()
  })
}

const userAdminRemovedReceptor = (action: typeof AdminUserActions.userAdminRemoved.matches._TYPE) => {
  const state = getMutableState(AdminUserState)
  return state.merge({ updateNeeded: true })
}

const userCreatedReceptor = (action: typeof AdminUserActions.userCreated.matches._TYPE) => {
  const state = getMutableState(AdminUserState)
  return state.merge({ updateNeeded: true })
}

const userPatchedReceptor = (action: typeof AdminUserActions.userPatched.matches._TYPE) => {
  const state = getMutableState(AdminUserState)
  return state.merge({ updateNeeded: true })
}

const searchedUserReceptor = (action: typeof AdminUserActions.searchedUser.matches._TYPE) => {
  const state = getMutableState(AdminUserState)
  return state.merge({
    users: action.userResult.data,
    skip: action.userResult.skip,
    limit: action.userResult.limit,
    total: action.userResult.total,
    retrieving: false,
    fetched: true,
    updateNeeded: false,
    lastFetched: Date.now()
  })
}

const setSkipGuestsReceptor = (action: typeof AdminUserActions.setSkipGuests.matches._TYPE) => {
  const state = getMutableState(AdminUserState)
  return state.merge({
    skipGuests: action.skipGuests,
    updateNeeded: true
  })
}

const resetFilterReceptor = (action: typeof AdminUserActions.resetFilter.matches._TYPE) => {
  const state = getMutableState(AdminUserState)
  return state.merge({
    skipGuests: false,
    updateNeeded: true
  })
}

export const AdminUserReceptors = {
  fetchedSingleUserReceptor,
  loadedUsersReceptor,
  userAdminRemovedReceptor,
  userCreatedReceptor,
  userPatchedReceptor,
  searchedUserReceptor,
  setSkipGuestsReceptor,
  resetFilterReceptor
}

//Service
export const AdminUserService = {
  fetchSingleUserAdmin: async (id: string) => {
    try {
      const result = await API.instance.client.service('user').get(id)
      dispatchAction(AdminUserActions.fetchedSingleUser({ data: result }))
    } catch (err) {
      NotificationService.dispatchNotify(err.message, { variant: 'error' })
    }
  },
  fetchUsersAsAdmin: async (value: string | null = null, skip = 0, sortField = 'name', orderBy = 'asc') => {
    const userState = getMutableState(AdminUserState)
    const user = getMutableState(AuthState).user
    const skipGuests = userState.skipGuests.value
    try {
      if (user.scopes?.value?.find((scope) => scope.type === 'admin:admin')) {
        let sortData = {}

        if (sortField.length > 0) {
          sortData[sortField] = orderBy === 'desc' ? 0 : 1
        }

        const params = {
          query: {
            $sort: {
              ...sortData
            },
            $skip: skip * USER_PAGE_LIMIT,
            $limit: USER_PAGE_LIMIT,
            action: 'admin',
            search: value
          }
        }
        if (skipGuests) {
          ;(params.query as any).isGuest = false
        }
        const userResult = (await API.instance.client.service('user').find(params)) as Paginated<UserInterface>
        dispatchAction(AdminUserActions.loadedUsers({ userResult }))
      }
    } catch (err) {
      NotificationService.dispatchNotify(err.message, { variant: 'error' })
    }
  },
  createUser: async (user: CreateEditUser) => {
    try {
      const result = (await API.instance.client.service('user').create(user)) as UserInterface
      dispatchAction(AdminUserActions.userCreated({ user: result }))
    } catch (err) {
      NotificationService.dispatchNotify(err.message, { variant: 'error' })
    }
  },
  patchUser: async (id: string, user: CreateEditUser) => {
    try {
      const result = (await API.instance.client.service('user').patch(id, user)) as UserInterface
      dispatchAction(AdminUserActions.userPatched({ user: result }))
      if (id === getMutableState(AuthState).user.id.value) await AuthService.loadUserData(id)
    } catch (err) {
      NotificationService.dispatchNotify(err.message, { variant: 'error' })
    }
  },
  removeUserAdmin: async (id: string) => {
    const result = (await API.instance.client.service('user').remove(id)) as UserInterface
    dispatchAction(AdminUserActions.userAdminRemoved({ data: result }))
  },
  setSkipGuests: async (skipGuests: boolean) => {
    dispatchAction(AdminUserActions.setSkipGuests({ skipGuests }))
  },
  resetFilter: () => {
    dispatchAction(AdminUserActions.resetFilter({}))
  }
}

//Action
export class AdminUserActions {
  static fetchedSingleUser = defineAction({
    type: 'ee.client.AdminUser.SINGLE_USER_ADMIN_LOADED' as const,
    data: matches.object as Validator<unknown, UserInterface>
  })

  static loadedUsers = defineAction({
    type: 'ee.client.AdminUser.ADMIN_LOADED_USERS' as const,
    userResult: matches.object as Validator<unknown, Paginated<UserInterface>>
  })

  static userCreated = defineAction({
    type: 'ee.client.AdminUser.USER_ADMIN_CREATED' as const,
    user: matches.object as Validator<unknown, UserInterface>
  })

  static userPatched = defineAction({
    type: 'ee.client.AdminUser.USER_ADMIN_PATCHED' as const,
    user: matches.object as Validator<unknown, UserInterface>
  })

  static userAdminRemoved = defineAction({
    type: 'ee.client.AdminUser.USER_ADMIN_REMOVED' as const,
    data: matches.object as Validator<unknown, UserInterface>
  })

  static searchedUser = defineAction({
    type: 'ee.client.AdminUser.USER_SEARCH_ADMIN' as const,
    userResult: matches.object as Validator<unknown, Paginated<UserInterface>>
  })

  static setSkipGuests = defineAction({
    type: 'ee.client.AdminUser.SET_SKIP_GUESTS' as const,
    skipGuests: matches.boolean
  })

  static resetFilter = defineAction({
    type: 'ee.client.AdminUser.RESET_USER_FILTER' as const
  })
}
