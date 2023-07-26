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

import React from 'react'

import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import Autocomplete from '@mui/material/Autocomplete'
import FormControl from '@mui/material/FormControl'
import MenuItem from '@mui/material/MenuItem'
import Select, { SelectChangeEvent } from '@mui/material/Select'
import TextField from '@mui/material/TextField'

import styles from './selectInput.module.scss'

interface SelectInputProp<T> {
  value: T | string
  options: Array<{ label: string; value: T }>
  onChange?: (value: T | string) => void
  placeholder?: string
  disabled?: boolean
  creatable?: boolean
  className?: string
  isSearchable?: boolean
}
export function SelectInput<T extends string | ReadonlyArray<string> | number | undefined>({
  value,
  options,
  onChange,
  placeholder = 'Select...',
  disabled,
  creatable,
  isSearchable
}: SelectInputProp<T>) {
  const [valueSelected, setValue] = React.useState(value)
  const [valueAutoSelected, setAutoValue] = React.useState(options.find((el) => el.value === value)?.label)

  const handleChange = (event: SelectChangeEvent<T>) => {
    setValue(event.target.value)
    onChange?.(event.target.value)
  }

  const onValueChanged = (event, values) => {
    setAutoValue(values.label)
    onChange?.(values.value)
  }

  const Component = isSearchable ? (
    <Autocomplete
      options={options.map(({ label }) => label)}
      onChange={onValueChanged}
      freeSolo={creatable}
      disablePortal
      value={valueAutoSelected}
      fullWidth
      size="small"
      classes={{
        root: styles.autoComplete,
        input: styles.inputfield,
        inputRoot: styles.inputWrapper,
        endAdornment: styles.adornmentContainer,
        popupIndicator: styles.adornment,
        clearIndicator: styles.adornment,
        popper: styles.popper,
        paper: styles.paper,
        option: styles.option
      }}
      renderInput={(params) => (
        <TextField
          {...params}
          variant="outlined"
          disabled={disabled}
          classes={{
            root: styles.inputfieldContainer
          }}
        />
      )}
    />
  ) : (
    <FormControl fullWidth>
      <Select
        labelId="select-label"
        id="select"
        value={valueSelected}
        onChange={handleChange}
        placeholder={placeholder}
        size="small"
        classes={{
          select: styles.select,
          icon: styles.icon
        }}
        disabled={disabled}
        MenuProps={{
          classes: { paper: styles.paper },
          sx: {
            // https://stackoverflow.com/a/69403132/2077741
            '&& .Mui-selected': {
              backgroundColor: 'var(--dropdownMenuSelectedBackground)'
            }
          }
        }}
        IconComponent={ExpandMoreIcon}
      >
        {options.map((option, index) => (
          <MenuItem value={option.value} key={String(option.value) + String(index)} classes={{ root: styles.menuItem }}>
            {option.label}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  )

  return <>{Component}</>
}

export default SelectInput
