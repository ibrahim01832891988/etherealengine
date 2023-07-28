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

import { FollowCameraComponent } from '../../camera/components/FollowCameraComponent'
import { CameraMode } from '../../camera/types/CameraMode'
import { Entity } from '../../ecs/classes/Entity'
import { getComponent } from '../../ecs/functions/ComponentFunctions'

type SwitchCameraModeProps = {
  cameraMode: CameraMode
  pointerLock?: boolean
}

let changeTimeout: any = undefined
export const switchCameraMode = (
  cameraEntity: Entity,
  args: SwitchCameraModeProps = { pointerLock: false, cameraMode: CameraMode.ThirdPerson },
  force = false
): void => {
  if (!force) {
    if (changeTimeout !== undefined) return
    changeTimeout = setTimeout(() => {
      clearTimeout(changeTimeout)
      changeTimeout = undefined
    }, 250)
  }

  const cameraFollow = getComponent(cameraEntity, FollowCameraComponent)
  if (!cameraFollow) return
  cameraFollow.mode = args.cameraMode

  if (cameraFollow.mode === CameraMode.FirstPerson) {
    cameraFollow.phi = 0
    cameraFollow.locked = true
  }
}
