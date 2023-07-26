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

import { createState, SetInitialStateAction, State, useHookstate } from '@hookstate/core'
import type { Function, Object, String } from 'ts-toolbelt'

import { DeepReadonly } from '@etherealengine/common/src/DeepReadonly'
import multiLogger from '@etherealengine/common/src/logger'
import { resolveObject } from '@etherealengine/common/src/utils/resolveObject'
import { isClient } from '@etherealengine/engine/src/common/functions/getEnvironment'

import {
  Action,
  ActionCreator,
  ActionQueueDefinition,
  ActionShape,
  defineActionQueue,
  removeActionQueue
} from './ActionFunctions'
import { HyperFlux, HyperStore } from './StoreFunctions'

export * from '@hookstate/core'

const logger = multiLogger.child({ component: 'hyperflux:State' })

export const NO_PROXY = { noproxy: true }

export type StateActionReceptor<S, A extends ActionShape<Action>> = [
  ActionCreator<A>,
  (state: State<S>, action: any) => void
]

export type StateDefinition<S> = {
  name: string
  initial: SetInitialStateAction<S>
  receptors?: StateActionReceptor<S, any>[]
  receptorActionQueue?: ActionQueueDefinition
  onCreate?: (store: HyperStore, state: State<S>) => void
}

const StateDefinitions = new Set<string>()

export function defineState<S>(definition: StateDefinition<S>) {
  if (StateDefinitions.has(definition.name)) throw new Error(`State ${definition.name} already defined`)
  StateDefinitions.add(definition.name)
  return definition as StateDefinition<S> & { _TYPE: S }
}

export function registerState<S>(StateDefinition: StateDefinition<S>) {
  logger.info(`registerState ${StateDefinition.name}`)

  const initial =
    typeof StateDefinition.initial === 'function'
      ? (StateDefinition.initial as Function)()
      : JSON.parse(JSON.stringify(StateDefinition.initial))
  HyperFlux.store.valueMap[StateDefinition.name] = initial
  HyperFlux.store.stateMap[StateDefinition.name] = createState(initial)
  HyperFlux.store.stateMap[StateDefinition.name].attach(() => ({
    id: Symbol('update root state value map'),
    init: () => ({
      onSet(arg) {
        if (arg.path.length === 0 && typeof arg.value === 'object')
          HyperFlux.store.valueMap[StateDefinition.name] = arg.value
      }
    })
  }))
  if (StateDefinition.onCreate) StateDefinition.onCreate(HyperFlux.store, getMutableState(StateDefinition))

  if (StateDefinition.receptors) {
    StateDefinition.receptorActionQueue = defineActionQueue(StateDefinition.receptors.map((r) => r[0].matches as any))
    HyperFlux.store.getCurrentReactorRoot()?.cleanupFunctions.add(() => {
      removeActionQueue(StateDefinition.receptorActionQueue!)
    })
  }
}

export function receiveActions<S>(StateDefinition: StateDefinition<S>) {
  if (!StateDefinition.receptors) throw new Error(`State ${StateDefinition.name} has no receptors.`)
  const store = HyperFlux.store
  if (!store.stateMap[StateDefinition.name]) registerState(StateDefinition)
  const actions = StateDefinition.receptorActionQueue?.() // TODO: should probably put the receptor query in the store, not the state definition
  if (!actions) return
  const state = store.stateMap[StateDefinition.name] as State<S>
  for (const a of actions) {
    // TODO: implement state snapshots, rewind / replay when receiving actions out of order, etc.
    for (const receptor of StateDefinition.receptors) {
      receptor[0].matches.test(a) && receptor[1](state, a)
    }
  }
}

export function getMutableState<S>(StateDefinition: StateDefinition<S>) {
  if (!HyperFlux.store.stateMap[StateDefinition.name]) registerState(StateDefinition)
  return HyperFlux.store.stateMap[StateDefinition.name] as State<S>
}

export function getState<S>(StateDefinition: StateDefinition<S>) {
  if (!HyperFlux.store.stateMap[StateDefinition.name]) registerState(StateDefinition)
  return HyperFlux.store.valueMap[StateDefinition.name] as DeepReadonly<S>
}

export function useMutableState<S, P extends string>(StateDefinition: StateDefinition<S>): State<S>
export function useMutableState<S, P extends string>(
  StateDefinition: StateDefinition<S>,
  path: Function.AutoPath<State<S>, P>
): Object.Path<State<S>, String.Split<P, '.'>>
export function useMutableState<S, P extends string>(
  StateDefinition: StateDefinition<S>,
  path?: Function.AutoPath<State<S>, P>
): Object.Path<State<S>, String.Split<P, '.'>> {
  const rootState = getMutableState(StateDefinition)
  const resolvedState = path ? resolveObject(rootState, path as any) : rootState
  return useHookstate(resolvedState) as any
}

const stateNamespaceKey = 'ee.hyperflux'

/**
 * Automatically synchronises specific root paths of a hyperflux state definition with the localStorage.
 * Values get automatically populated if they exist in localStorage and saved when they are changed.
 * @param {StateDefinition} stateDefinition
 * @param {string[]} keys the root paths to synchronise
 *
 * TODO: #7384 this api need to be revisited; we are syncing local state without doing any validation,
 * so if we ever change the acceptable values for a given state key, we will have to do a migration
 * or fallback to a default value, but we can't do that without knowing what the acceptable values are, which means
 * we need to pass in a schema or validator function to this function (we should use ts-pattern for this).
 */
export const syncStateWithLocalStorage = (stateDefinition: ReturnType<typeof defineState<any>>, keys: string[]) => {
  if (!isClient) return
  const state = getMutableState(stateDefinition)

  for (const key of keys) {
    const storedValue = localStorage.getItem(`${stateNamespaceKey}.${stateDefinition.name}.${key}`)
    if (storedValue !== null && storedValue !== 'undefined') state[key].set(JSON.parse(storedValue))
  }

  state.attach(() => ({
    id: Symbol('syncStateWithLocalStorage'),
    init: () => ({
      onSet(arg) {
        for (const key of keys) {
          if (state[key].value === undefined)
            localStorage.removeItem(`${stateNamespaceKey}.${stateDefinition.name}.${key}`)
          else
            localStorage.setItem(
              `${stateNamespaceKey}.${stateDefinition.name}.${key}`,
              JSON.stringify(state[key].get({ noproxy: true }))
            )
        }
      }
    })
  }))
}
