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
import { ReflexContainer, ReflexElement, ReflexSplitter } from 'react-reflex'

import LoadingView from '@etherealengine/client-core/src/common/components/LoadingView'
import { ServerInfoInterface } from '@etherealengine/common/src/interfaces/ServerInfo'
import { getMutableState, useHookstate } from '@etherealengine/hyperflux'
import Box from '@etherealengine/ui/src/primitives/mui/Box'
import Card from '@etherealengine/ui/src/primitives/mui/Card'
import CardActionArea from '@etherealengine/ui/src/primitives/mui/CardActionArea'
import CardContent from '@etherealengine/ui/src/primitives/mui/CardContent'
import Grid from '@etherealengine/ui/src/primitives/mui/Grid'
import Typography from '@etherealengine/ui/src/primitives/mui/Typography'

import { AdminServerInfoState, ServerInfoService } from '../../services/ServerInfoService'
import styles from '../../styles/admin.module.scss'
import ServerTable from './ServerTable'

import 'react-reflex/styles.css'

import { AdminServerLogsState } from '../../services/ServerLogsService'
import ServerLogs from './ServerLogs'

const Server = () => {
  const { t } = useTranslation()
  const selectedCard = useHookstate('all')
  const serverInfo = useHookstate(getMutableState(AdminServerInfoState))
  const serverLogs = useHookstate(getMutableState(AdminServerLogsState))

  let displayLogs = serverLogs.podName.value ? true : false

  useEffect(() => {
    if (serverInfo.updateNeeded.value) ServerInfoService.fetchServerInfo()
  }, [serverInfo.updateNeeded.value])

  if (!serverInfo.value.fetched) {
    return (
      <LoadingView title={t('admin:components.server.loading')} variant="body2" sx={{ position: 'absolute', top: 0 }} />
    )
  }

  return (
    <Box sx={{ height: 'calc(100% - 106px)' }}>
      <Grid container spacing={1} className={styles.mb10px}>
        {serverInfo.servers.get({ noproxy: true }).map((item, index) => (
          <Grid item key={item.id} xs={12} sm={6} md={2}>
            <ServerItemCard
              key={index}
              data={item}
              isSelected={selectedCard.value === item.id}
              onCardClick={selectedCard.set}
            />
          </Grid>
        ))}
      </Grid>
      {!displayLogs && <ServerTable selectedCard={selectedCard.value} />}
      {displayLogs && (
        <ReflexContainer orientation="horizontal">
          <ReflexElement flex={0.45} style={{ display: 'flex', flexDirection: 'column' }}>
            <ServerTable selectedCard={selectedCard.value} />
          </ReflexElement>

          <ReflexSplitter />

          <ReflexElement flex={0.55} style={{ overflow: 'hidden' }}>
            <ServerLogs />
          </ReflexElement>
        </ReflexContainer>
      )}
    </Box>
  )
}

interface ServerItemProps {
  data: ServerInfoInterface
  isSelected: boolean
  onCardClick: (key: string) => void
}

const ServerItemCard = ({ data, isSelected, onCardClick }: ServerItemProps) => {
  return (
    <Card className={`${styles.rootCardNumber} ${isSelected ? styles.selectedCard : ''}`}>
      <CardActionArea onClick={() => onCardClick(data.id)}>
        <CardContent className="text-center">
          <Typography variant="h5" component="h5" className={styles.label}>
            {data.label}
          </Typography>
          <Typography variant="body1" component="p" className={styles.label}>
            {data.pods.filter((item) => item.status === 'Running').length}/{data.pods.length}
          </Typography>
        </CardContent>
      </CardActionArea>
    </Card>
  )
}

export default Server
