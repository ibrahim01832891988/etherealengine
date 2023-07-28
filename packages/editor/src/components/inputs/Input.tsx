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

import styled from 'styled-components'

/**
 * BorderColor used to return border color.
 *
 * @param  {object} props
 * @param  {string} defaultColor
 */
function borderColor(props, defaultColor) {
  if (props.canDrop) {
    return 'var(--blue)'
  } else if (props.error) {
    return 'var(--error)'
  } else {
    return defaultColor
  }
}

/**
 * Used to provide styles for input field.
 *
 * @type {styled component}
 */
const Input = styled.input`
  background-color: ${(props) => (props.disabled ? 'var(--disabled)' : 'var(--inputBackground)')};
  border-radius: 4px;
  border: 1px solid ${(props) => borderColor(props, 'var(--inputOutline)')};
  color: ${(props) => (props.disabled ? 'var(--disabledText)' : 'var(--textColor)')};
  height: 24px;
  padding: 6px 8px;

  &:hover {
    border-color: 'var(--blueHover)';
  }

  &:focus {
    border-color: 'var(--blue)';
  }

  &:disabled {
    background-color: 'var(--disabled)';
    color: 'var(--disabledText)';
  }

  &:focus-visible {
    outline: none;
  }
`
/**
 * Used to render component view.
 */
export default Input
