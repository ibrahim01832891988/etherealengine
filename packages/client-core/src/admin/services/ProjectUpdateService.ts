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

import { none } from '@hookstate/core'

import { ProjectBranchInterface } from '@etherealengine/common/src/interfaces/ProjectBranchInterface'
import { ProjectCommitInterface } from '@etherealengine/common/src/interfaces/ProjectCommitInterface'
import {
  DefaultUpdateSchedule,
  ProjectInterface,
  ProjectUpdateType
} from '@etherealengine/common/src/interfaces/ProjectInterface'
import { matches, Validator } from '@etherealengine/engine/src/common/functions/MatchesUtils'
import { defineAction, defineState, dispatchAction, getMutableState } from '@etherealengine/hyperflux'

export const ProjectUpdateState = defineState({
  name: 'ProjectUpdateState',
  initial: () => ({})
})

const initializeProjectUpdateReceptor = (action: typeof ProjectUpdateActions.initializeProjectUpdate.matches._TYPE) => {
  const state = getMutableState(ProjectUpdateState)
  return state[action.project.name].set({
    branchProcessing: false,
    destinationProcessing: false,
    sourceURL: '',
    destinationURL: '',
    destinationValid: false,
    destinationError: '',
    sourceValid: false,
    commitsProcessing: false,
    sourceURLError: '',
    branchError: '',
    commitError: '',
    showBranchSelector: false,
    showCommitSelector: false,
    branchData: [],
    commitData: [],
    selectedBranch: '',
    sourceVsDestinationProcessing: false,
    sourceVsDestinationError: '',
    sourceProjectMatchesDestination: false,
    destinationProjectName: '',
    destinationRepoEmpty: false,
    sourceProjectName: '',
    sourceVsDestinationChecked: false,
    selectedSHA: '',
    projectName: '',
    submitDisabled: true,
    triggerSetDestination: '',
    updateType: 'none' as ProjectUpdateType,
    updateSchedule: DefaultUpdateSchedule
  })
}

const clearProjectUpdateReceptor = (action: typeof ProjectUpdateActions.clearProjectUpdates.matches._TYPE) => {
  const state = getMutableState(ProjectUpdateState)
  return state[action.project.name].set(none)
}

const setProjectUpdateFieldReceptor = (action: typeof ProjectUpdateActions.setProjectUpdateField.matches._TYPE) => {
  const state = getMutableState(ProjectUpdateState)
  if (state[action.project.name] && state[action.project.name][action.fieldName])
    return state[action.project.name][action.fieldName].set(action.value)
  return state
}

const mergeProjectUpdateFieldReceptor = (action: typeof ProjectUpdateActions.mergeProjectUpdateField.matches._TYPE) => {
  const state = getMutableState(ProjectUpdateState)
  if (state[action.project.name] && state[action.project.name][action.fieldName]) {
    const field = state[action.project.name][action.fieldName]
    const matchIndex = field.value!.findIndex((fieldItem) => {
      return fieldItem != null && fieldItem[action.uniquenessField] === action.value[action.uniquenessField]
    })
    if (matchIndex !== -1) return field[matchIndex].set(action.value)
    else return field.merge([action.value])
  }
  return state
}

export const ProjectUpdateReceptors = {
  initializeProjectUpdateReceptor,
  clearProjectUpdateReceptor,
  setProjectUpdateFieldReceptor,
  mergeProjectUpdateFieldReceptor
}

export const ProjectUpdateService = {
  initializeProjectUpdate: (project: ProjectInterface) => {
    dispatchAction(ProjectUpdateActions.initializeProjectUpdate({ project }))
  },
  clearProjectUpdate: (project: ProjectInterface) => {
    dispatchAction(ProjectUpdateActions.clearProjectUpdates({ project }))
  },
  setSourceURL: (project: ProjectInterface, sourceURL: string) => {
    dispatchAction(ProjectUpdateActions.setProjectUpdateField({ project, fieldName: 'sourceURL', value: sourceURL }))
  },
  setDestinationURL: (project: ProjectInterface, destinationURL: string) => {
    dispatchAction(
      ProjectUpdateActions.setProjectUpdateField({ project, fieldName: 'destinationURL', value: destinationURL })
    )
  },
  setBranchProcessing: (project: ProjectInterface, processing: boolean) => {
    dispatchAction(
      ProjectUpdateActions.setProjectUpdateField({ project, fieldName: 'branchProcessing', value: processing })
    )
  },
  setDestinationProcessing: (project: ProjectInterface, processing: boolean) => {
    dispatchAction(
      ProjectUpdateActions.setProjectUpdateField({ project, fieldName: 'destinationProcessing', value: processing })
    )
  },
  setSourceValid: (project: ProjectInterface, valid: boolean) => {
    dispatchAction(ProjectUpdateActions.setProjectUpdateField({ project, fieldName: 'sourceValid', value: valid }))
  },
  setDestinationValid: (project: ProjectInterface, valid: boolean) => {
    dispatchAction(ProjectUpdateActions.setProjectUpdateField({ project, fieldName: 'destinationValid', value: valid }))
  },
  setDestinationError: (project: ProjectInterface, error: string) => {
    dispatchAction(ProjectUpdateActions.setProjectUpdateField({ project, fieldName: 'destinationError', value: error }))
  },
  setCommitsProcessing: (project: ProjectInterface, processing: boolean) => {
    dispatchAction(
      ProjectUpdateActions.setProjectUpdateField({ project, fieldName: 'commitsProcessing', value: processing })
    )
  },
  setSourceURLError: (project: ProjectInterface, error: string) => {
    dispatchAction(ProjectUpdateActions.setProjectUpdateField({ project, fieldName: 'sourceURLError', value: error }))
  },
  setBranchError: (project: ProjectInterface, error: string) => {
    dispatchAction(ProjectUpdateActions.setProjectUpdateField({ project, fieldName: 'branchError', value: error }))
  },
  setCommitError: (project: ProjectInterface, error: string) => {
    dispatchAction(ProjectUpdateActions.setProjectUpdateField({ project, fieldName: 'commitError', value: error }))
  },
  setShowBranchSelector: (project: ProjectInterface, show: boolean) => {
    dispatchAction(
      ProjectUpdateActions.setProjectUpdateField({ project, fieldName: 'showBranchSelector', value: show })
    )
  },
  setShowCommitSelector: (project: ProjectInterface, show: boolean) => {
    dispatchAction(
      ProjectUpdateActions.setProjectUpdateField({ project, fieldName: 'showCommitSelector', value: show })
    )
  },
  setBranchData: (project: ProjectInterface, data: ProjectBranchInterface[]) => {
    dispatchAction(ProjectUpdateActions.setProjectUpdateField({ project, fieldName: 'branchData', value: data }))
  },
  setCommitData: (project: ProjectInterface, data: ProjectCommitInterface[]) => {
    dispatchAction(ProjectUpdateActions.setProjectUpdateField({ project, fieldName: 'commitData', value: data }))
  },
  mergeCommitData: (project: ProjectInterface, data: ProjectCommitInterface) => {
    dispatchAction(
      ProjectUpdateActions.mergeProjectUpdateField({
        project,
        fieldName: 'commitData',
        uniquenessField: 'commitSHA',
        value: data
      })
    )
  },
  setSelectedBranch: (project: ProjectInterface, branchName: string) => {
    dispatchAction(
      ProjectUpdateActions.setProjectUpdateField({ project, fieldName: 'selectedBranch', value: branchName })
    )
  },
  setSourceVsDestinationProcessing: (project: ProjectInterface, processing: boolean) => {
    dispatchAction(
      ProjectUpdateActions.setProjectUpdateField({
        project,
        fieldName: 'sourceVsDestinationProcessing',
        value: processing
      })
    )
  },
  setSourceVsDestinationError: (project: ProjectInterface, error: string) => {
    dispatchAction(
      ProjectUpdateActions.setProjectUpdateField({ project, fieldName: 'sourceVsDestinationError', value: error })
    )
  },
  setSourceVsDestinationChecked: (project: ProjectInterface, checked: boolean) => {
    dispatchAction(
      ProjectUpdateActions.setProjectUpdateField({ project, fieldName: 'sourceVsDestinationChecked', value: checked })
    )
  },
  setSourceProjectMatchesDestination: (project: ProjectInterface, matches: boolean) => {
    dispatchAction(
      ProjectUpdateActions.setProjectUpdateField({
        project,
        fieldName: 'sourceProjectMatchesDestination',
        value: matches
      })
    )
  },
  setDestinationProjectName: (project: ProjectInterface, projectName: string) => {
    dispatchAction(
      ProjectUpdateActions.setProjectUpdateField({ project, fieldName: 'destinationProjectName', value: projectName })
    )
  },
  setDestinationRepoEmpty: (project: ProjectInterface, empty: boolean) => {
    dispatchAction(
      ProjectUpdateActions.setProjectUpdateField({ project, fieldName: 'destinationRepoEmpty', value: empty })
    )
  },
  setSourceProjectName: (project: ProjectInterface, projectName: string) => {
    dispatchAction(
      ProjectUpdateActions.setProjectUpdateField({ project, fieldName: 'sourceProjectName', value: projectName })
    )
  },
  setSelectedSHA: (project: ProjectInterface, commitSHA: string) => {
    dispatchAction(ProjectUpdateActions.setProjectUpdateField({ project, fieldName: 'selectedSHA', value: commitSHA }))
  },
  setSubmitDisabled: (project: ProjectInterface, disabled: boolean) => {
    dispatchAction(
      ProjectUpdateActions.setProjectUpdateField({ project, fieldName: 'submitDisabled', value: disabled })
    )
  },
  setProjectName: (project: ProjectInterface, projectName: string) => {
    dispatchAction(
      ProjectUpdateActions.setProjectUpdateField({ project, fieldName: 'projectName', value: projectName })
    )
  },
  setTriggerSetDestination: (project: ProjectInterface, trigger: string) => {
    ProjectUpdateService.setUpdateType(project, project.updateType || 'none')
    ProjectUpdateService.setUpdateSchedule(project, project.updateSchedule || DefaultUpdateSchedule)

    dispatchAction(
      ProjectUpdateActions.setProjectUpdateField({ project, fieldName: 'triggerSetDestination', value: trigger })
    )
  },
  setUpdateType: (project: ProjectInterface, type: ProjectUpdateType) => {
    dispatchAction(ProjectUpdateActions.setProjectUpdateField({ project, fieldName: 'updateType', value: type }))
  },
  setUpdateSchedule: (project: ProjectInterface, schedule: string) => {
    dispatchAction(
      ProjectUpdateActions.setProjectUpdateField({ project, fieldName: 'updateSchedule', value: schedule })
    )
  },

  resetSourceState: (project: ProjectInterface, { resetSourceURL = true, resetBranch = true }) => {
    if (resetSourceURL) ProjectUpdateService.setSourceURL(project, '')
    if (resetBranch) {
      ProjectUpdateService.setSelectedBranch(project, '')
      ProjectUpdateService.setBranchData(project, [])
      ProjectUpdateService.setShowBranchSelector(project, false)
    }
    ProjectUpdateService.setSelectedSHA(project, '')
    ProjectUpdateService.setCommitData(project, [])
    ProjectUpdateService.setShowCommitSelector(project, false)
    ProjectUpdateService.setSubmitDisabled(project, true)
    ProjectUpdateService.setSourceURLError(project, '')
    ProjectUpdateService.setBranchError(project, '')
    ProjectUpdateService.setCommitError(project, '')
    ProjectUpdateService.setSourceValid(project, false)
    ProjectUpdateService.setSourceProjectName(project, '')
    ProjectUpdateService.setSourceProjectMatchesDestination(project, false)
    ProjectUpdateService.setSourceVsDestinationError(project, '')
  },

  resetDestinationState: (project: ProjectInterface, { resetDestinationURL = true }) => {
    ProjectUpdateService.setSubmitDisabled(project, true)
    if (resetDestinationURL) ProjectUpdateService.setDestinationURL(project, '')
    ProjectUpdateService.setDestinationValid(project, false)
    ProjectUpdateService.setDestinationError(project, '')
    ProjectUpdateService.setSourceProjectMatchesDestination(project, false)
    ProjectUpdateService.setDestinationProjectName(project, '')
    ProjectUpdateService.setDestinationRepoEmpty(project, false)
    ProjectUpdateService.setSourceVsDestinationError(project, '')
    ProjectUpdateService.setTriggerSetDestination(project, '')
  }
}

export class ProjectUpdateActions {
  static clearProjectUpdates = defineAction({
    type: 'ee.client.ProjectUpdate.CLEAR_PROJECT_UPDATE' as const,
    project: matches.object as Validator<unknown, ProjectInterface>
  })

  static initializeProjectUpdate = defineAction({
    type: 'ee.client.ProjectUpdate.INITIALIZE_PROJECT_UPDATE' as const,
    project: matches.object as Validator<unknown, ProjectInterface>
  })

  static setProjectUpdateField = defineAction({
    type: 'ee.client.ProjectUpdate.SET_PROJECT_UPDATE_FIELD' as const,
    project: matches.object as Validator<unknown, ProjectInterface>,
    fieldName: matches.string,
    value: matches.any
  })

  static mergeProjectUpdateField = defineAction({
    type: 'ee.client.ProjectUpdate.MERGE_PROJECT_UPDATE_FIELD' as const,
    project: matches.object as Validator<unknown, ProjectInterface>,
    fieldName: matches.string,
    uniquenessField: matches.string,
    value: matches.any
  })
}
