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

import { Id, NullableId, Params, Query, ServiceMethods } from '@feathersjs/feathers'
import appRootPath from 'app-root-path'
import path from 'path'

import { ModelTransformParameters } from '@etherealengine/engine/src/assets/classes/ModelTransform'
import { Application } from '@etherealengine/server-core/declarations'

import { transformModel } from './model-transform.helpers'

interface CreateParams {
  src: string
  transformParameters: ModelTransformParameters
}

interface GetParams {
  filter: string
}

export class ModelTransform implements ServiceMethods<any> {
  app: Application
  docs: any
  rootPath: string

  constructor(app: Application) {
    this.app = app
    this.rootPath = path.join(appRootPath.path, 'packages/projects/projects')
  }

  patch(id: NullableId, data: Partial<any>, params?: Params<Query> | undefined): Promise<any> {
    return Promise.resolve({})
  }

  processPath(inPath: string): [string, string] {
    const pathData = /.*projects\/(.*)\.(glb|gltf)$/.exec(inPath)
    if (!pathData) throw Error('could not extract path data')
    const [_, filePath, extension] = pathData
    return [path.join(this.rootPath, filePath), extension]
  }

  async find(params?: Params): Promise<any> {
    return {}
  }

  async get(id: Id, params?: Params): Promise<any> {
    return {}
  }

  async update(id: Id, params?: Params): Promise<any> {
    return {}
  }

  async remove(id: Id, params?: Params): Promise<any> {
    return {}
  }

  async setup() {}

  async create(createParams: CreateParams, params?: Params): Promise<any> {
    try {
      const transformParms = createParams.transformParameters
      const [commonPath, extension] = this.processPath(createParams.src)
      const inPath = `${commonPath}.${extension}`
      const outPath = transformParms.dst
        ? `${commonPath.replace(/[^/]+$/, transformParms.dst)}.${extension}`
        : `${commonPath}-transformed.${extension}`
      const resourceUri = transformParms.resourceUri ?? ''
      return await transformModel(this.app, { src: inPath, dst: outPath, resourceUri, parms: transformParms })
    } catch (e) {
      console.error('error transforming model')
      console.error(e)
    }
  }
}
