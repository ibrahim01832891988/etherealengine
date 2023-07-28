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

import { useHookstate } from '@hookstate/core'
import React from 'react'

import { TransformPivot } from '@etherealengine/engine/src/scene/constants/transformConstants'
import { getMutableState } from '@etherealengine/hyperflux'

import AdjustIcon from '@mui/icons-material/Adjust'

import { setTransformPivot, toggleTransformPivot } from '../../../functions/transformFunctions'
import { EditorHelperState } from '../../../services/EditorHelperState'
import SelectInput from '../../inputs/SelectInput'
import { InfoTooltip } from '../../layout/Tooltip'
import * as styles from '../styles.module.scss'

const transformPivotOptions = [
  { label: 'Selection', value: TransformPivot.Selection },
  { label: 'Center', value: TransformPivot.Center },
  { label: 'Bottom', value: TransformPivot.Bottom },
  { label: 'Origin', value: TransformPivot.Origin }
]

const TransformPivotTool = () => {
  const editorHelperState = useHookstate(getMutableState(EditorHelperState))

  return (
    <div className={styles.toolbarInputGroup} id="transform-pivot">
      <InfoTooltip title="[X] Toggle Transform Pivot">
        <button onClick={toggleTransformPivot as any} className={styles.toolButton}>
          <AdjustIcon fontSize="small" />
        </button>
      </InfoTooltip>
      <SelectInput
        key={editorHelperState.transformPivot.value}
        className={styles.selectInput}
        onChange={setTransformPivot}
        options={transformPivotOptions}
        value={editorHelperState.transformPivot.value}
        creatable={false}
        isSearchable={false}
      />
    </div>
  )
}

export default TransformPivotTool
