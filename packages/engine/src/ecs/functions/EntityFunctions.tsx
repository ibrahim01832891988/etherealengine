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

import * as bitECS from 'bitecs'
import React from 'react'

import { Engine } from '../classes/Engine'
import { Entity, UndefinedEntity } from '../classes/Entity'
import { EntityRemovedComponent, removeAllComponents, setComponent } from './ComponentFunctions'

export const createEntity = (): Entity => {
  let entity = bitECS.addEntity(Engine.instance)
  if (entity === 0) entity = bitECS.addEntity(Engine.instance) // always discard entity 0 since we do a lot of `if (entity)` checks
  return entity as Entity
}

export const removeEntity = (entity: Entity, immediately = false) => {
  if (!entity || !entityExists(entity)) throw new Error(`[removeEntity]: Entity ${entity} does not exist in the world`)

  const promise = removeAllComponents(entity)
  setComponent(entity, EntityRemovedComponent, true)

  if (immediately) {
    bitECS.removeEntity(Engine.instance, entity)
  }

  return promise
}

export const entityExists = (entity: Entity) => {
  return bitECS.entityExists(Engine.instance, entity)
}

export const EntityContext = React.createContext(UndefinedEntity)

export const useEntityContext = () => {
  return React.useContext(EntityContext)
}
