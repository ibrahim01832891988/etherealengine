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

import { getContentType } from '@etherealengine/common/src/utils/getContentType'
import { MediaPrefabs } from '@etherealengine/engine/src/audio/systems/MediaSystem'
import { Entity } from '@etherealengine/engine/src/ecs/classes/Entity'
import { ImageComponent } from '@etherealengine/engine/src/scene/components/ImageComponent'
import { MediaComponent } from '@etherealengine/engine/src/scene/components/MediaComponent'
import { ModelComponent } from '@etherealengine/engine/src/scene/components/ModelComponent'
import { PrefabComponent } from '@etherealengine/engine/src/scene/components/PrefabComponent'
import { ScenePrefabs } from '@etherealengine/engine/src/scene/systems/SceneObjectUpdateSystem'

import { updateProperties } from '../components/properties/Util'
import { EditorControlFunctions } from './EditorControlFunctions'

/**
 * Adds media node from passed url. Type of the media will be detected automatically
 * @param url URL of the passed media
 * @param parent Parent node will be set as parent to newly created node
 * @param before Newly created node will be set before this node in parent's children array
 * @returns Newly created media node
 */
export async function addMediaNode(url: string, parent?: Entity | null, before?: Entity | null) {
  const contentType = (await getContentType(url)) || ''
  const { hostname } = new URL(url)

  let prefabType = ''
  let updateFunc = null! as Function

  let node: Entity | null = null

  if (contentType.startsWith('prefab/')) {
    prefabType = ScenePrefabs.prefab
    updateFunc = () => updateProperties(PrefabComponent, { src: url }, [node!])
  } else if (contentType.startsWith('model/')) {
    prefabType = ScenePrefabs.model
    updateFunc = () => updateProperties(ModelComponent, { src: url }, [node!])
  } else if (contentType.startsWith('video/') || hostname.includes('twitch.tv') || hostname.includes('youtube.com')) {
    prefabType = MediaPrefabs.video
    updateFunc = () => updateProperties(MediaComponent, { paths: [url] }, [node!])
  } else if (contentType.startsWith('image/')) {
    prefabType = ScenePrefabs.image
    updateFunc = () => updateProperties(ImageComponent, { source: url }, [node!])
  } else if (contentType.startsWith('audio/')) {
    prefabType = MediaPrefabs.audio
    updateFunc = () => updateProperties(MediaComponent, { paths: [url] }, [node!])
  } else if (url.includes('.uvol')) {
    prefabType = MediaPrefabs.volumetric
    updateFunc = () => updateProperties(MediaComponent, { paths: [url] }, [node!])
  }

  if (prefabType) {
    node = EditorControlFunctions.createObjectFromPrefab(prefabType, parent, before!)

    if (node) updateFunc()
  }

  return node
}
