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

import React, { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'

import FormField from '../inputs/FormField'
import StringInput from '../inputs/StringInput'
import PreviewDialog from './PreviewDialog'

/**
 * SaveNewSceneDialog used to show dialog when to save new scene.
 *
 * @param       {string} thumbnailUrl
 * @param       {string} initialName
 * @param       {function} onConfirm
 * @param       {function} onCancel
 * @constructor
 */
export function SaveNewSceneDialog({ thumbnailUrl, initialName, onConfirm, onCancel }) {
  const [name, setName] = useState(initialName)
  const { t } = useTranslation()

  const onChangeName = useCallback(
    (value) => {
      setName(value)
    },
    [setName]
  )

  /**
   * onConfirmCallback callback function is used handle confirm dialog.
   *
   * @type {function}
   */
  const onConfirmCallback = useCallback(
    (e) => {
      e.preventDefault()
      onConfirm({ name })
    },
    [name, onConfirm]
  )

  /**
   * onCancelCallback callback function used to handle cancel of dialog.
   *
   * @type {function}
   */
  const onCancelCallback = useCallback(
    (e) => {
      e.preventDefault()
      onCancel()
    },
    [onCancel]
  )

  //returning view for dialog view.
  return (
    <PreviewDialog
      imageSrc={thumbnailUrl}
      title={t('editor:dialog.saveNewScene.title')}
      onConfirm={onConfirmCallback}
      onCancel={onCancelCallback}
      confirmLabel={t('editor:dialog.saveNewScene.lbl-confirm')}
    >
      <FormField>
        <label htmlFor="name">{t('editor:dialog.saveNewScene.lbl-name')}</label>
        <StringInput
          id="name"
          required
          pattern={'[A-Za-z0-9-\':"!@#$%^&*(),.?~ ]{4,64}'}
          title={t('editor:dialog.saveNewScene.info-name')}
          value={name}
          onChange={onChangeName}
        />
      </FormField>
    </PreviewDialog>
  )
}

export default SaveNewSceneDialog
