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

import { useEffect } from 'react'
import { Object3D } from 'three'

import { defineQuery, getComponent, removeQuery } from '../ecs/functions/ComponentFunctions'
import { defineSystem } from '../ecs/functions/SystemFunctions'
import { GroupComponent } from '../scene/components/GroupComponent'
import { HighlightComponent } from './components/HighlightComponent'
import { EngineRenderer } from './WebGLRendererSystem'

const highlightedObjectQuery = defineQuery([GroupComponent, HighlightComponent])

const addToSelection = (obj: Object3D) => {
  EngineRenderer.instance.effectComposer.OutlineEffect.selection.add(obj)
}

const execute = () => {
  if (!EngineRenderer.instance.effectComposer.OutlineEffect) return

  EngineRenderer.instance.effectComposer.OutlineEffect.selection.clear()

  for (const entity of highlightedObjectQuery()) {
    const group = getComponent(entity, GroupComponent)
    for (const object of group) object.traverse(addToSelection)
  }
}

export const HighlightSystem = defineSystem({
  uuid: 'ee.engine.HighlightSystem',
  execute
})
