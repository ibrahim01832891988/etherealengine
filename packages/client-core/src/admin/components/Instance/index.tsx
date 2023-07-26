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

import { getMutableState, useHookstate } from '@etherealengine/hyperflux'
import Button from '@etherealengine/ui/src/primitives/mui/Button'
import Grid from '@etherealengine/ui/src/primitives/mui/Grid'

import { NotificationService } from '../../../common/services/NotificationService'
import Search from '../../common/Search'
import { AdminInstanceServerState } from '../../services/InstanceserverService'
import { AdminInstanceService } from '../../services/InstanceService'
import styles from '../../styles/admin.module.scss'
import InstanceTable from './InstanceTable'
import PatchInstanceserver from './PatchInstanceserver'

const Instance = () => {
  const search = useHookstate('')
  const patchInstanceserverOpen = useHookstate(false)
  const patch = useHookstate(getMutableState(AdminInstanceServerState).patch)

  AdminInstanceService.useAPIListeners()

  useEffect(() => {
    if (patch.value) {
      NotificationService.dispatchNotify(patch.value.message, { variant: patch.value.status ? 'success' : 'error' })
    }
  }, [patch.value])

  const handleChange = (e: any) => {
    search.set(e.target.value)
  }

  return (
    <div>
      <Grid container spacing={1} className={styles.mb10px}>
        <Grid item xs={12} sm={8}>
          <Search text="instance" handleChange={handleChange} />
        </Grid>
        <Grid item xs={12} sm={4}>
          <Button
            className={styles.openModalBtn}
            type="submit"
            variant="contained"
            onClick={() => patchInstanceserverOpen.set(true)}
          >
            Patch Instanceserver
          </Button>
        </Grid>
      </Grid>
      <InstanceTable className={styles.rootTableWithSearch} search={search.value} />
      {patchInstanceserverOpen.value && <PatchInstanceserver open onClose={() => patchInstanceserverOpen.set(false)} />}
    </div>
  )
}

export default Instance
