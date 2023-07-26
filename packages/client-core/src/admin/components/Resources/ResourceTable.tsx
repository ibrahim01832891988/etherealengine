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

import ConfirmDialog from '@etherealengine/client-core/src/common/components/ConfirmDialog'
import { StaticResourceInterface } from '@etherealengine/common/src/interfaces/StaticResourceInterface'
import { getMutableState, useHookstate } from '@etherealengine/hyperflux'
import Box from '@etherealengine/ui/src/primitives/mui/Box'

import { AuthState } from '../../../user/services/AuthService'
import TableComponent from '../../common/Table'
import { resourceColumns, ResourceData } from '../../common/variables/resource'
import { AdminResourceState, RESOURCE_PAGE_LIMIT, ResourceService } from '../../services/ResourceService'
import styles from '../../styles/admin.module.scss'
import ResourceDrawer, { ResourceDrawerMode } from './ResourceDrawer'

interface Props {
  className?: string
  search: string
}

const ResourceTable = ({ className, search }: Props) => {
  const { t } = useTranslation()
  const user = useHookstate(getMutableState(AuthState).user).value
  const adminResourceState = useHookstate(getMutableState(AdminResourceState))
  const adminResources = adminResourceState.resources
  const adminResourceCount = adminResourceState.total

  const page = useHookstate(0)
  const rowsPerPage = useHookstate(RESOURCE_PAGE_LIMIT)
  const openConfirm = useHookstate(false)
  const resourceId = useHookstate('')
  const resourceKey = useHookstate('')
  const fieldOrder = useHookstate('asc')
  const sortField = useHookstate('key')
  const openResourceDrawer = useHookstate(false)
  const resourceData = useHookstate<StaticResourceInterface | null>(null)

  const handlePageChange = (event: unknown, newPage: number) => {
    ResourceService.fetchAdminResources(newPage, search, sortField.value, fieldOrder.value)
    page.set(newPage)
  }

  useEffect(() => {
    if (adminResourceState.fetched.value) {
      ResourceService.fetchAdminResources(page.value, search, sortField.value, fieldOrder.value)
    }
  }, [fieldOrder.value])

  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    rowsPerPage.set(parseInt(event.target.value, 10))
    page.set(0)
  }

  useEffect(() => {
    ResourceService.fetchAdminResources(0, search, sortField.value, fieldOrder.value)
  }, [user?.id, search, adminResourceState.updateNeeded.value])

  const createData = (el: StaticResourceInterface): ResourceData => {
    return {
      el,
      id: el.id,
      key: el.key,
      mimeType: el.mimeType,
      project: el.project,
      action: (
        <>
          <a
            className={styles.actionStyle}
            onClick={() => {
              resourceData.set(el)
              openResourceDrawer.set(true)
            }}
          >
            <span className={styles.spanWhite}>{t('admin:components.common.view')}</span>
          </a>
          <a
            className={styles.actionStyle}
            onClick={() => {
              resourceId.set(el.id)
              resourceKey.set(el.key)
              openConfirm.set(true)
            }}
          >
            <span className={styles.spanDange}>{t('admin:components.common.delete')}</span>
          </a>
        </>
      )
    }
  }

  const rows = adminResources.get({ noproxy: true }).map((el) => {
    return createData(el)
  })

  const submitRemoveResource = async () => {
    await ResourceService.removeResource(resourceId.value)
    openConfirm.set(false)
  }

  return (
    <Box className={className}>
      <TableComponent
        allowSort={false}
        fieldOrder={fieldOrder.value}
        setSortField={sortField.set}
        setFieldOrder={fieldOrder.set}
        rows={rows}
        column={resourceColumns}
        page={page.value}
        rowsPerPage={rowsPerPage.value}
        count={adminResourceCount.value}
        handlePageChange={handlePageChange}
        handleRowsPerPageChange={handleRowsPerPageChange}
      />

      <ConfirmDialog
        open={openConfirm.value}
        description={`${t('admin:components.resources.confirmResourceDelete')} '${resourceKey.value}'?`}
        onClose={() => openConfirm.set(false)}
        onSubmit={submitRemoveResource}
      />

      {resourceData.value && openResourceDrawer.value && (
        <ResourceDrawer
          open
          mode={ResourceDrawerMode.ViewEdit}
          selectedResource={resourceData.value}
          onClose={() => openResourceDrawer.set(false)}
        />
      )}
    </Box>
  )
}

export default ResourceTable
