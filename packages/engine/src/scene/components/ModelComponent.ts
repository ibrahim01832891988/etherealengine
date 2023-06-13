import { useEffect } from 'react'
import { Mesh, Scene } from 'three'

import { EntityUUID } from '@etherealengine/common/src/interfaces/EntityUUID'
import { StaticResourceInterface } from '@etherealengine/common/src/interfaces/StaticResourceInterface'
import { getState, none } from '@etherealengine/hyperflux'

import { AssetLoader } from '../../assets/classes/AssetLoader'
import { EngineState } from '../../ecs/classes/EngineState'
import {
  defineComponent,
  getComponent,
  getMutableComponent,
  hasComponent,
  removeComponent,
  setComponent,
  useComponent,
  useOptionalComponent
} from '../../ecs/functions/ComponentFunctions'
import { entityExists, removeEntity, useEntityContext } from '../../ecs/functions/EntityFunctions'
import { EntityTreeComponent } from '../../ecs/functions/EntityTree'
import { BoundingBoxComponent } from '../../interaction/components/BoundingBoxComponents'
import { SourceType } from '../../renderer/materials/components/MaterialSource'
import { removeMaterialSource } from '../../renderer/materials/functions/MaterialLibraryFunctions'
import { ObjectLayers } from '../constants/ObjectLayers'
import { generateMeshBVH } from '../functions/bvhWorkerPool'
import { addError, removeError } from '../functions/ErrorFunctions'
import { parseGLTFModel } from '../functions/loadGLTFModel'
import { enableObjectLayer } from '../functions/setObjectLayers'
import { addObjectToGroup, GroupComponent, removeObjectFromGroup } from './GroupComponent'
import { LODComponent } from './LODComponent'
import { SceneAssetPendingTagComponent } from './SceneAssetPendingTagComponent'
import { SceneObjectComponent } from './SceneObjectComponent'
import { UUIDComponent } from './UUIDComponent'

export type ModelResource = {
  src?: string
  gltfStaticResource?: StaticResourceInterface
  glbStaticResource?: StaticResourceInterface
  fbxStaticResource?: StaticResourceInterface
  usdzStaticResource?: StaticResourceInterface
  id?: EntityUUID
}

export const ModelComponent = defineComponent({
  name: 'EE_model',
  jsonID: 'gltf-model',

  onInit: (entity) => {
    return {
      src: '',
      resource: null as ModelResource | null,
      generateBVH: true,
      avoidCameraOcclusion: false,
      scene: null as Scene | null
    }
  },

  toJSON: (entity, component) => {
    return {
      src: component.src.value,
      resource: component.resource.value,
      generateBVH: component.generateBVH.value,
      avoidCameraOcclusion: component.avoidCameraOcclusion.value
    }
  },

  onSet: (entity, component, json) => {
    if (!json) return
    if (typeof json.src === 'string' && json.src !== component.src.value) component.src.set(json.src)
    if (typeof json.resource === 'object') {
      const resource = json.resource ? (json.resource as ModelResource) : ({ src: json.src } as ModelResource)
      component.resource.set(resource)
    }
    if (typeof json.generateBVH === 'boolean' && json.generateBVH !== component.generateBVH.value)
      component.generateBVH.set(json.generateBVH)

    /**
     * Add SceneAssetPendingTagComponent to tell scene loading system we should wait for this asset to load
     */
    if (!getState(EngineState).sceneLoaded && hasComponent(entity, SceneObjectComponent))
      setComponent(entity, SceneAssetPendingTagComponent)
  },

  onRemove: (entity, component) => {
    if (component.scene.value) {
      removeObjectFromGroup(entity, component.scene.value)
      component.scene.set(null)
    }
    LODComponent.lodsByEntity[entity].value && LODComponent.lodsByEntity[entity].set(none)
    removeMaterialSource({ type: SourceType.MODEL, path: component.src.value })
  },

  errors: ['LOADING_ERROR', 'INVALID_URL'],

  reactor: ModelReactor
})

function ModelReactor() {
  const entity = useEntityContext()
  const modelComponent = useComponent(entity, ModelComponent)
  const groupComponent = useOptionalComponent(entity, GroupComponent)
  const model = modelComponent.value
  const source =
    model.resource?.gltfStaticResource?.url ||
    model.resource?.glbStaticResource?.url ||
    model.resource?.fbxStaticResource?.url ||
    model.resource?.usdzStaticResource?.url ||
    model.src

  // update src
  useEffect(() => {
    if (source === model.scene?.userData?.src) return

    try {
      if (model.scene && model.scene.userData.src && model.scene.userData.src !== model.src) {
        try {
          removeMaterialSource({ type: SourceType.MODEL, path: model.scene.userData.src })
        } catch (e) {
          if (e?.name === 'MaterialNotFound') {
            console.warn('could not find material in source ' + model.scene.userData.src)
          } else {
            throw e
          }
        }
      }
      if (!model.src) return

      const uuid = getComponent(entity, UUIDComponent)
      const fileExtension = model.src.split('.').pop()?.toLowerCase()
      switch (fileExtension) {
        case 'glb':
        case 'gltf':
        case 'fbx':
        case 'usdz':
          AssetLoader.load(
            model.src,
            {
              ignoreDisposeGeometry: model.generateBVH,
              uuid
            },
            (loadedAsset) => {
              loadedAsset.scene.animations = loadedAsset.animations
              if (!entityExists(entity)) return
              removeError(entity, ModelComponent, 'LOADING_ERROR')
              loadedAsset.scene.userData.src = model.src
              loadedAsset.scene.userData.type === 'glb' && delete loadedAsset.scene.userData.type
              model.scene && removeObjectFromGroup(entity, model.scene)
              modelComponent.scene.set(loadedAsset.scene)
              if (!hasComponent(entity, SceneAssetPendingTagComponent)) return
              removeComponent(entity, SceneAssetPendingTagComponent)
            },
            (onprogress) => {
              if (!hasComponent(entity, SceneAssetPendingTagComponent)) return
              SceneAssetPendingTagComponent.loadingProgress.merge({
                [entity]: {
                  loadedAmount: onprogress.loaded,
                  totalAmount: onprogress.total
                }
              })
            }
          )
          break
        default:
          throw new Error(`Model type '${fileExtension}' not supported`)
      }
    } catch (err) {
      console.error(err)
      addError(entity, ModelComponent, 'LOADING_ERROR', err.message)
    }
  }, [modelComponent.src])

  useEffect(() => {
    const scene = modelComponent.scene.value
    if (!scene) return
    enableObjectLayer(scene, ObjectLayers.Camera, model.avoidCameraOcclusion)
  }, [modelComponent.avoidCameraOcclusion, modelComponent.scene])

  // update scene
  useEffect(() => {
    const scene = modelComponent.scene.get({ noproxy: true })

    if (!scene) return
    addObjectToGroup(entity, scene)

    if (groupComponent?.value?.find((group: any) => group === scene)) return
    parseGLTFModel(entity)
    setComponent(entity, BoundingBoxComponent)

    let active = true

    if (model.generateBVH) {
      const bvhDone = [] as Promise<void>[]
      scene.traverse((obj: Mesh) => {
        bvhDone.push(generateMeshBVH(obj))
      })
      // trigger group state invalidation when bvh is done
      Promise.all(bvhDone).then(() => {
        if (!active) return
        const group = getMutableComponent(entity, GroupComponent)
        if (group) group.set([...group.value])
      })
    }

    return () => {
      removeObjectFromGroup(entity, scene)
      active = false
    }
  }, [modelComponent.scene, model.generateBVH])

  return null
}
