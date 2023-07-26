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

export function pathResolver() {
  //const hostPath = getState(EngineState).publicPath.replace(/:\d{4}$/, '')
  //const cacheRe = new RegExp(`([^\\\/]+\/projects)\/([^\/]+)\/(.*$)`)
  const cacheRe = new RegExp(`(https://[^\\/]+)/projects/([^/]+)/(.*$)`)
  //                          1: project path -- 2: project name -- 3: internal path
  return cacheRe
}

export function getFileName(path: string) {
  return /[^\\/]+$/.exec(path)?.[0] ?? ''
}

export function getRelativeURI(path: string) {
  return pathResolver().exec(path)?.[3] ?? ''
}

export function getProjectName(path: string) {
  return pathResolver().exec(path)?.[2] ?? ''
}

export function modelResourcesPath(modelName: string) {
  return `model-resources/${modelName.split('.').at(-2)!}`
}
