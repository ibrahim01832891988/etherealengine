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

import { CubeTexture, Material, Texture } from 'three'

import { getState } from '@etherealengine/hyperflux'

import {
  extractDefaults,
  materialToDefaultArgs
} from '../../../../renderer/materials/functions/MaterialLibraryFunctions'
import { MaterialLibraryState } from '../../../../renderer/materials/MaterialLibrary'
import createReadableTexture from '../../../functions/createReadableTexture'
import { GLTFWriter } from '../GLTFExporter'
import { ExporterExtension } from './ExporterExtension'

export type EEMaterialExtensionType = {
  uuid: string
  name: string
  prototype: string
  args: { [field: string]: any }
  plugins: string[]
}

export default class EEMaterialExporterExtension extends ExporterExtension {
  constructor(writer: GLTFWriter) {
    super(writer)
    this.name = 'EE_material'
    this.matCache = new Map()
  }

  matCache: Map<any, any>

  writeMaterial(material: Material, materialDef) {
    const argData = materialToDefaultArgs(material)
    if (!argData) return
    const result: any = {}
    Object.entries(argData).map(([k, v]) => {
      switch (v.type) {
        case 'texture':
          if (material[k]) {
            if (k === 'envMap') return //for skipping environment maps which cause errors
            if ((material[k] as CubeTexture).isCubeTexture) return //for skipping environment maps which cause errors
            const texture = material[k] as Texture
            const mapDef = { index: this.writer.processTexture(texture) }
            this.writer.options.flipY && (texture.repeat.y *= -1)
            this.writer.applyTextureTransform(mapDef, texture)
            result[k] = mapDef
          } else result[k] = material[k]
          break
        default:
          result[k] = material[k]
          break
      }
    })
    delete materialDef.pbrMetallicRoughness
    delete materialDef.normalTexture
    delete materialDef.emissiveTexture
    delete materialDef.emissiveFactor
    const materialEntry = getState(MaterialLibraryState).materials[material.uuid]
    materialDef.extensions = materialDef.extensions ?? {}
    materialDef.extensions[this.name] = {
      uuid: material.uuid,
      name: material.name,
      prototype: materialEntry?.prototype ?? material.userData.type ?? material.type,
      plugins: materialEntry?.plugins ?? material.userData.plugins ?? [],
      args: result
    }
    this.writer.extensionsUsed[this.name] = true
  }
}
