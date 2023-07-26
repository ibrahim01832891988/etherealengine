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

import { useState } from '@hookstate/core'
import React, { useEffect } from 'react'
import { useTranslation } from 'react-i18next'

import InputSelect, { InputMenuItem } from '@etherealengine/client-core/src/common/components/InputSelect'
import InputText from '@etherealengine/client-core/src/common/components/InputText'
import { getMutableState, useHookstate } from '@etherealengine/hyperflux'
import Button from '@etherealengine/ui/src/primitives/mui/Button'
import Container from '@etherealengine/ui/src/primitives/mui/Container'
import DialogActions from '@etherealengine/ui/src/primitives/mui/DialogActions'
import DialogTitle from '@etherealengine/ui/src/primitives/mui/DialogTitle'

import { AuthState } from '../../../user/services/AuthService'
import DrawerView from '../../common/DrawerView'
import { InstanceserverService } from '../../services/InstanceserverService'
import { AdminLocationService, AdminLocationState } from '../../services/LocationService'
import styles from '../../styles/admin.module.scss'

interface Props {
  open: boolean
  onClose: () => void
}

const PatchInstanceserver = ({ open, onClose }: Props) => {
  const state = useState({
    location: '',
    locationError: '',
    count: 1
  })

  const { t } = useTranslation()
  const user = useHookstate(getMutableState(AuthState).user)
  const adminLocationState = useHookstate(getMutableState(AdminLocationState))
  const adminLocations = adminLocationState.locations

  useEffect(() => {
    if (user?.id.value && adminLocationState.updateNeeded.value) {
      AdminLocationService.fetchAdminLocations()
    }
  }, [user?.id?.value, adminLocationState.updateNeeded.value])

  const locationsMenu: InputMenuItem[] = adminLocations.value.map((el) => {
    return {
      label: el.name,
      value: el.id
    }
  })

  useEffect(() => {
    if (adminLocationState.created.value) {
      onClose()
      state.location.set('')
    }
  }, [adminLocationState.created.value])

  const handleChangeLocation = (e) => {
    const { value } = e.target
    state.merge({
      location: value,
      locationError: value.length < 2 ? 'Location is required!' : ''
    })
  }

  const handleChangeCount = (e) => {
    const { value } = e.target
    state.count.set(value)
  }

  const handleSubmit = () => {
    let locationError = ''
    if (!state.location.value) {
      locationError = "Location can't be empty"
      state.locationError.set(locationError)
    } else {
      InstanceserverService.patchInstanceserver(state.location.value, state.count.value)
      onClose()
    }
  }

  return (
    <DrawerView open={open} onClose={onClose}>
      <Container maxWidth="sm" className={styles.mt20}>
        <DialogTitle className={styles.textAlign}>{t('admin:components.setting.patchInstanceserver')}</DialogTitle>

        <InputSelect
          name="location"
          label={t('admin:components.instance.location')}
          value={state.location.value}
          error={state.locationError.value}
          menu={locationsMenu}
          onChange={handleChangeLocation}
        />
        <InputText
          type="number"
          name="location"
          label={t('admin:components.instance.count')}
          value={state.count.value}
          onChange={handleChangeCount}
        />
        <DialogActions>
          <Button onClick={onClose} className={styles.outlinedButton}>
            {t('admin:components.common.cancel')}
          </Button>
          <Button className={styles.gradientButton} onClick={handleSubmit}>
            {t('admin:components.common.submit')}
          </Button>
        </DialogActions>
      </Container>
    </DrawerView>
  )
}

export default PatchInstanceserver
