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

import React, { useEffect } from 'react'
import { useTranslation } from 'react-i18next'

import InputSelect, { InputMenuItem } from '@etherealengine/client-core/src/common/components/InputSelect'
import InputText from '@etherealengine/client-core/src/common/components/InputText'
import { getMutableState, useHookstate } from '@etherealengine/hyperflux'
import { loadConfigForProject } from '@etherealengine/projects/loadConfigForProject'
import Box from '@etherealengine/ui/src/primitives/mui/Box'
import Button from '@etherealengine/ui/src/primitives/mui/Button'
import Grid from '@etherealengine/ui/src/primitives/mui/Grid'
import Typography from '@etherealengine/ui/src/primitives/mui/Typography'

import { ProjectService, ProjectState } from '../../../common/services/ProjectService'
import { AuthState } from '../../../user/services/AuthService'
import { AdminProjectSettingsState, ProjectSettingService } from '../../services/Setting/ProjectSettingService'
import styles from '../../styles/settings.module.scss'

interface ProjectSetting {
  key: string
  value: any
}

const Project = () => {
  const { t } = useTranslation()
  const user = useHookstate(getMutableState(AuthState).user)
  const projectState = useHookstate(getMutableState(ProjectState))
  const projects = projectState.projects
  const projectSettingState = useHookstate(getMutableState(AdminProjectSettingsState))
  const projectSetting = projectSettingState.projectSetting

  const settings = useHookstate<Array<ProjectSetting> | []>([])
  const selectedProject = useHookstate(
    projects.get({ noproxy: true }).length > 0 ? projects.get({ noproxy: true })[0].id : ''
  )

  ProjectService.useAPIListeners()

  useEffect(() => {
    ProjectService.fetchProjects()
  }, [])

  useEffect(() => {
    if (selectedProject.value) {
      resetSettingsFromSchema()
    }
  }, [selectedProject.value])

  useEffect(() => {
    if (projectSetting.value && projectSetting.value?.length > 0) {
      let tempSettings = JSON.parse(JSON.stringify(settings.value))

      for (let [index, setting] of tempSettings.entries()) {
        const savedSetting = projectSetting.value.filter((item) => item.key === setting.key)
        if (savedSetting.length > 0) {
          tempSettings[index].value = savedSetting[0].value
        }
      }

      settings.set(tempSettings)
    }
  }, [projectSetting])

  const resetSettingsFromSchema = async () => {
    const projectName = projects.value.filter((proj) => proj.id === selectedProject.value)
    const projectConfig = projectName?.length > 0 && (await loadConfigForProject(projectName[0].name))

    if (projectConfig && projectConfig?.settings) {
      let tempSetting = [] as ProjectSetting[]

      for (let setting of projectConfig.settings) {
        tempSetting.push({ key: setting.key, value: '' })
      }

      settings.set(tempSetting)
      ProjectSettingService.fetchProjectSetting(selectedProject.value)
    } else {
      settings.set([])
    }
  }

  useEffect(() => {
    if (user?.id?.value != null && selectedProject.value) {
    }
  }, [user?.id?.value, selectedProject.value])

  const handleProjectChange = (e) => {
    const { value } = e.target
    selectedProject.set(value)
  }

  const handleValueChange = (index, e) => {
    const tempSetting = JSON.parse(JSON.stringify(settings.value))

    tempSetting[index].value = e.target.value
    settings.set(tempSetting)
  }

  const handleCancel = () => {
    resetSettingsFromSchema()
  }

  const handleSubmit = () => {
    ProjectSettingService.updateProjectSetting(selectedProject.value, settings.value)
  }

  const projectsMenu: InputMenuItem[] = projects.value.map((el) => {
    return {
      label: el.name,
      value: el.id
    }
  })

  return (
    <Box>
      <Typography component="h1" className={styles.settingsHeading}>
        {t('admin:components.setting.project')}
      </Typography>
      <div className={styles.root}>
        <Grid container spacing={3}>
          <Grid item xs={6} sm={6}>
            <InputSelect
              name="selectProject"
              label={t('admin:components.setting.project')}
              value={selectedProject.value}
              menu={projectsMenu}
              onChange={handleProjectChange}
            />
          </Grid>

          <Grid item container xs={12}>
            {settings?.length > 0 ? (
              settings.value.map((setting, index) => (
                <Grid item container key={index} spacing={1} xs={12}>
                  <Grid item xs={6}>
                    <InputText name="key" label="Key Name" value={setting.key || ''} disabled />
                  </Grid>
                  <Grid item xs={6}>
                    <InputText
                      name="value"
                      label="Value"
                      value={setting.value || ''}
                      onChange={(e) => handleValueChange(index, e)}
                    />
                  </Grid>
                </Grid>
              ))
            ) : (
              <Grid item marginBottom="20px">
                <Typography>No schema available in xrengine.config.ts</Typography>
              </Grid>
            )}
          </Grid>
        </Grid>
        {settings?.value?.length > 0 && (
          <Grid item container xs={12}>
            <Button sx={{ maxWidth: '100%' }} variant="outlined" onClick={handleCancel}>
              {t('admin:components.common.cancel')}
            </Button>
            <Button
              sx={{ maxWidth: '100%', ml: 1 }}
              variant="contained"
              className={styles.gradientButton}
              onClick={handleSubmit}
            >
              {t('admin:components.common.save')}
            </Button>
          </Grid>
        )}
      </div>
    </Box>
  )
}

export default Project
