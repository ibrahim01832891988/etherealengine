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
import { AdminBot } from '@etherealengine/common/src/interfaces/AdminBot'
import { BotCommandData } from '@etherealengine/engine/src/schemas/bot/bot-command.schema'
import { getMutableState, useHookstate } from '@etherealengine/hyperflux'
import Accordion from '@etherealengine/ui/src/primitives/mui/Accordion'
import AccordionDetails from '@etherealengine/ui/src/primitives/mui/AccordionDetails'
import AccordionSummary from '@etherealengine/ui/src/primitives/mui/AccordionSummary'
import Grid from '@etherealengine/ui/src/primitives/mui/Grid'
import Icon from '@etherealengine/ui/src/primitives/mui/Icon'
import IconButton from '@etherealengine/ui/src/primitives/mui/IconButton'
import Typography from '@etherealengine/ui/src/primitives/mui/Typography'

import { NotificationService } from '../../../common/services/NotificationService'
import { AuthState } from '../../../user/services/AuthService'
import AddCommand from '../../common/AddCommand'
import { AdminBotCommandService, AdminBotsCommandState } from '../../services/BotsCommand'
import { AdminBotService, AdminBotState } from '../../services/BotsService'
import styles from '../../styles/admin.module.scss'
import UpdateBot from './UpdateBot'

const DisplayBots = () => {
  const expanded = useHookstate<string | false>('panel0')
  const command = useHookstate<BotCommandData>({
    name: '',
    description: ''
  })
  const openUpdateBot = useHookstate(false)
  const openConfirm = useHookstate(false)
  const bot = useHookstate<AdminBot | undefined>(undefined)
  const botName = useHookstate('')
  const botId = useHookstate('')

  const handleChangeCommand = (e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
    const { name, value } = e.target
    command.merge({ [name]: value })
  }

  const handleChange = (panel: string) => (event: React.ChangeEvent<{}>, isExpanded: boolean) => {
    expanded.set(isExpanded ? panel : false)
  }
  const botAdmin = useHookstate(getMutableState(AdminBotState))
  const botCommand = useHookstate(getMutableState(AdminBotsCommandState))
  const user = useHookstate(getMutableState(AuthState).user)
  const botAdminData = botAdmin.bots
  const { t } = useTranslation()

  useEffect(() => {
    if (user.id.value && botAdmin.updateNeeded.value) {
      AdminBotService.fetchBotAsAdmin()
    }
  }, [botAdmin.updateNeeded.value, user?.id?.value])

  const handleOpenUpdateBot = (inputBot) => {
    bot.set(inputBot)
    openUpdateBot.set(true)
  }

  const submitCommandBot = (id: string) => {
    const data: BotCommandData = {
      name: command.name.value,
      description: command.description.value,
      botId: id
    }
    AdminBotCommandService.createBotCommand(data)
    command.set({
      name: '',
      description: ''
    })
  }

  const submitRemoveBot = async () => {
    await AdminBotService.removeBots(botId.value)
    openConfirm.set(false)
  }

  const botRefresh = async () => {
    if (botCommand.updateNeeded.value) await AdminBotService.fetchBotAsAdmin()
  }

  const removeCommand = async (id) => {
    await AdminBotCommandService.removeBotsCommand(id)
    botRefresh()
  }

  const addCommand = (id) => {
    if (command.name.value) {
      submitCommandBot(id)
      botRefresh()
    } else {
      NotificationService.dispatchNotify(t('admin:components.bot.commandRequired'), { variant: 'error' })
    }
  }

  return (
    <div className={styles.botRootRight}>
      {botAdminData.get({ noproxy: true }).map((bot, index) => {
        return (
          <Accordion
            expanded={expanded.value === `panel${index}`}
            onChange={handleChange(`panel${index}`)}
            key={bot.id}
          >
            <AccordionSummary
              expandIcon={<Icon type="ExpandMore" />}
              aria-controls={`panel${index}bh-content`}
              id={`panel${index}bh-header`}
              className={styles.summary}
            >
              <Typography className={styles.heading}>{bot?.name}</Typography>
              <Typography className={styles.secondaryHeading}>{bot?.description}</Typography>
            </AccordionSummary>
            <AccordionDetails className={styles.botDetails}>
              <div style={{ width: '100%' }}>
                <Grid container spacing={5}>
                  <Grid item xs={8}>
                    <Grid container spacing={5}>
                      <Grid item xs={4}>
                        <Typography className={styles.thirdHeading} component="h1">
                          {t('admin:components.bot.location')}:
                        </Typography>
                        <Typography className={styles.thirdHeading} component="h1">
                          {t('admin:components.bot.instance')}:
                        </Typography>
                      </Grid>
                      <Grid item xs={8}>
                        <Typography className={styles.secondaryHeading} style={{ marginTop: '15px' }} component="h1">
                          {bot?.location?.name}
                        </Typography>
                        <Typography className={styles.secondaryHeading} style={{ marginTop: '15px' }} component="h1">
                          {bot?.instance?.ipAddress}
                        </Typography>
                      </Grid>
                    </Grid>
                  </Grid>
                  <Grid item xs={4} style={{ display: 'flex' }}>
                    <div style={{ marginLeft: 'auto' }}>
                      <IconButton
                        onClick={() => handleOpenUpdateBot(bot)}
                        size="large"
                        icon={<Icon type="Edit" style={{ color: 'var(--iconButtonColor)' }} />}
                      />
                      <IconButton
                        onClick={() => {
                          botId.set(bot.id)
                          botName.set(bot.name)
                          openConfirm.set(true)
                        }}
                        size="large"
                        icon={<Icon type="Delete" style={{ color: 'var(--iconButtonColor)' }} />}
                      />
                    </div>
                  </Grid>
                </Grid>

                <Typography
                  className={styles.secondaryHeading}
                  style={{ marginTop: '25px', marginBottom: '10px' }}
                  component="h1"
                >
                  {t('admin:components.bot.addMoreCommand')}
                </Typography>

                <AddCommand
                  command={command.value}
                  handleChangeCommand={handleChangeCommand}
                  addCommandData={() => addCommand(bot.id)}
                  commandData={bot.botCommands ?? []}
                  removeCommand={removeCommand}
                />
              </div>
            </AccordionDetails>
          </Accordion>
        )
      })}

      <UpdateBot open={openUpdateBot.value} onClose={() => openUpdateBot.set(false)} bot={bot.value} />

      <ConfirmDialog
        open={openConfirm.value}
        description={`${t('admin:components.bot.confirmBotDelete')} '${botName.value}'?`}
        onClose={() => openConfirm.set(false)}
        onSubmit={submitRemoveBot}
      />
    </div>
  )
}

export default DisplayBots
