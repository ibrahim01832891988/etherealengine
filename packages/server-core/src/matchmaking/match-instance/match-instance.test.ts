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

import assert from 'assert'
import nock from 'nock'

import { destroyEngine } from '@etherealengine/engine/src/ecs/classes/Engine'
import { matchInstancePath } from '@etherealengine/engine/src/schemas/matchmaking/match-instance.schema'
import { FRONTEND_SERVICE_URL } from '@etherealengine/matchmaking/src/functions'
import { matchTicketAssignmentPath } from '@etherealengine/matchmaking/src/match-ticket-assignment.schema'
import { matchTicketPath, MatchTicketType } from '@etherealengine/matchmaking/src/match-ticket.schema'

import { Application } from '../../../declarations'
import { createFeathersKoaApp } from '../../createApp'

interface User {
  id: string
}

interface ticketsTestData {
  id: string
  ticket: MatchTicketType
  connection: string
  user: User
}

describe.skip('matchmaking match-instance service', () => {
  let scope: nock.Scope
  const ticketsNumber = 3
  const users: User[] = []
  const tickets: ticketsTestData[] = []
  const gameMode = 'test-private-test'
  const tier = 'bronze'

  const commonLocationSettings = {
    locationType: 'public',
    videoEnabled: false,
    audioEnabled: false
  }

  let location

  const connections = [Math.random().toString(16), Math.random().toString(16)]
  const emptyAssignmentReplyBody = {
    result: {
      assignment: {
        connection: ''
      }
    }
  }

  let app: Application
  before(async () => {
    app = createFeathersKoaApp()
    await app.setup()

    scope = nock(FRONTEND_SERVICE_URL)

    const ticketsService = app.service(matchTicketPath)

    scope
      .post('/tickets')
      .times(connections.length * ticketsNumber)
      .reply(200, () => {
        return { id: 'tst' + Math.random().toString() }
      })

    await app.service('location').Model.destroy({
      where: {
        slugifiedName: `game-${gameMode}`
      }
    })

    location = await app.service('location').create(
      {
        name: `game-${gameMode}`,
        slugifiedName: `game-${gameMode}`,
        maxUsersPerInstance: 30,
        sceneId: `test/game-${gameMode}`,
        location_settings: commonLocationSettings as any,
        isLobby: false,
        isFeatured: false
      } as any,
      {}
    )

    const usersPromises: Promise<any>[] = []
    const ticketsPromises: Promise<any>[] = []
    connections.forEach((connection) => {
      for (let i = 0; i < ticketsNumber; i++) {
        const userPromise = app.service('user').create({
          name: 'Test #' + Math.random(),
          isGuest: true
        })
        usersPromises.push(userPromise)

        userPromise.then((user) => {
          ticketsPromises.push(
            ticketsService.create({ gameMode, attributes: { [tier]: tier } }).then((ticketResponse) => {
              const ticket = Array.isArray(ticketResponse) ? ticketResponse[0] : ticketResponse
              return {
                id: ticket.id,
                ticket: ticket,
                connection: connection,
                user: user
              }
            })
          )
        })
      }
    })
    users.push(...(await Promise.all(usersPromises)))

    // apiKey = await app.service('user-api-key').create({
    //     userId: user.id
    // })
    //
    // apiKey = await app.service('user-api-key').find({
    //   query: {
    //     userId: user.id
    //   }
    // })
    // console.log('api key', apiKey)
    // params.headers = { authorization: apiKey + ' ' + user.id }

    tickets.push(...(await Promise.all(ticketsPromises)))
  })
  after(async () => {
    const cleanupPromises: Promise<any>[] = []

    // delete tickets
    tickets.forEach((ticket) => {
      if (!ticket?.id) return
      scope.delete('/tickets/' + ticket.id).reply(200, { id: ticket.id })
      cleanupPromises.push(app.service(matchTicketPath).remove(ticket.id))
    })
    tickets.length = 0

    users.map((user) => {
      cleanupPromises.push(app.service('user').remove(user.id))
    })
    users.length = 0

    cleanupPromises.push(app.service('location').remove(location.id, {}))

    await Promise.all(cleanupPromises)
    return destroyEngine()
  })

  afterEach(() => {
    nock.cleanAll()
  })

  it('assigns players to one server', async () => {
    const assignmentService = app.service(matchTicketAssignmentPath)
    const connection = connections[0]
    const connectionTickets = tickets.filter((t) => t.connection === connection)

    connectionTickets.forEach((ticket) => {
      scope
        .get(`/tickets/${ticket.id}/assignments`)
        .reply(200, { result: { assignment: { connection: ticket.connection } } })
    })

    // made with promise all to make all request work asynchronous
    const assignments = await Promise.all(
      connectionTickets.map((ticket, index) => {
        return assignmentService.get(ticket.id, { 'identity-provider': { userId: ticket.user.id } } as any)
      })
    )

    const matchInstance = await app.service(matchInstancePath).find({
      query: {
        connection: connection
        // ended: false
      }
    })
    assert(Array.isArray(matchInstance))
    assert(matchInstance.length === 1)

    // test cleanup
    await app.service(matchInstancePath).remove(matchInstance[0].id)

    const instanceServerInstance = await app.service('instance').get(matchInstance[0].instanceServer!)
    assert(instanceServerInstance)
    assert(!instanceServerInstance.ended)

    // just in case, check that assignments have instance id and location name
    // it should be set in one of hooks
    assert((assignments[0] as any).instanceId)
    assert((assignments[0] as any).locationName)

    // cleanup created instance
    await app.service('instance').remove(instanceServerInstance.id)
  })

  // it will create null:null instance server on localhost for second match
  it('assigns two packs of players to different servers', async () => {
    const assignmentService = app.service(matchTicketAssignmentPath)

    tickets.forEach((ticket) => {
      scope
        .get(`/tickets/${ticket.id}/assignments`)
        .reply(200, { result: { assignment: { connection: ticket.connection } } })
    })

    // made with promise all to make all request work asynchronous
    await Promise.all(
      tickets.map((ticket, index) => {
        return assignmentService.get(ticket.id, { 'identity-provider': { userId: ticket.user.id } } as any)
      })
    )

    const matchInstance = await app.service(matchInstancePath).find({
      query: {
        connection: {
          $in: connections
        }
      }
    })
    assert(Array.isArray(matchInstance))
    assert(matchInstance.length === connections.length)

    // test cleanup
    await Promise.all(matchInstance.map((mi) => app.service(matchInstancePath).remove(mi.id)))
    await Promise.all(matchInstance.map((mi) => app.service('instance').remove(mi.instanceServer!)))
  })

  it('does not assign players if match is not found', async () => {
    const assignmentService = app.service(matchTicketAssignmentPath)

    tickets.forEach((ticket) => {
      scope.get(`/tickets/${ticket.id}/assignments`).reply(200, emptyAssignmentReplyBody)
    })

    // made with promise all to make all request work asynchronous
    await Promise.all(
      tickets.map((ticket, index) => {
        return assignmentService.get(ticket.id, { 'identity-provider': { userId: users[index].id } } as any)
      })
    )

    const matchInstance = await app.service(matchInstancePath).find({
      query: {
        connection: ''
      }
    })
    assert(Array.isArray(matchInstance))
    assert(matchInstance.length === 0)
  })
})
