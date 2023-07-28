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

import {
  BufferGeometry,
  ColorRepresentation,
  DirectionalLight,
  Float32BufferAttribute,
  LineBasicMaterial,
  LineSegments,
  Object3D
} from 'three'

import { ObjectLayers } from '../constants/ObjectLayers'
import { setObjectLayers } from '../functions/setObjectLayers'

export default class EditorDirectionalLightHelper extends Object3D {
  color: ColorRepresentation
  lightPlane: LineSegments<BufferGeometry, LineBasicMaterial>
  targetLine: LineSegments<BufferGeometry, LineBasicMaterial>
  name: string
  directionalLight: DirectionalLight

  constructor(directionalLight: DirectionalLight, size?: number, color?: ColorRepresentation) {
    super()
    this.directionalLight = directionalLight
    this.name = 'directional-light-helper'
    if (color) this.color = color

    if (size === undefined) size = 1

    const material = new LineBasicMaterial()

    let geometry = new BufferGeometry()
    geometry.setAttribute(
      'position',
      new Float32BufferAttribute(
        [
          -size,
          size,
          0,
          size,
          size,
          0,
          size,
          size,
          0,
          size,
          -size,
          0,
          size,
          -size,
          0,
          -size,
          -size,
          0,
          -size,
          -size,
          0,
          -size,
          size,
          0,
          -size,
          size,
          0,
          size,
          -size,
          0,
          size,
          size,
          0,
          -size,
          -size,
          0
        ],
        3
      )
    )

    this.lightPlane = new LineSegments(geometry, material)
    this.add(this.lightPlane)

    geometry = new BufferGeometry()
    const t = size * 0.1
    geometry.setAttribute(
      'position',
      new Float32BufferAttribute([-t, t, 0, 0, 0, 1, t, t, 0, 0, 0, 1, t, -t, 0, 0, 0, 1, -t, -t, 0, 0, 0, 1], 3)
    )

    this.targetLine = new LineSegments(geometry, material)
    this.add(this.targetLine)

    setObjectLayers(this, ObjectLayers.NodeHelper)
  }

  update() {
    if (!this.directionalLight) return
    if (this.color !== undefined) {
      this.lightPlane.material.color.set(this.color)
      this.targetLine.material.color.set(this.color)
    } else {
      this.lightPlane.material.color.copy(this.directionalLight!.color)
      this.targetLine.material.color.copy(this.directionalLight!.color)
    }
  }

  dispose() {
    this.lightPlane.geometry.dispose()
    this.lightPlane.material.dispose()
    this.targetLine.geometry.dispose()
    this.targetLine.material.dispose()
  }
}
