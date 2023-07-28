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

import Icon from '@etherealengine/ui/src/primitives/mui/Icon'

export const SidebarItems = (allowedRoutes) => [
  allowedRoutes.analytics && {
    name: 'user:dashboard.dashboard',
    path: '/admin',
    icon: <Icon type="Dashboard" style={{ color: 'white' }} />
  },
  allowedRoutes.server && {
    name: 'user:dashboard.server',
    path: '/admin/server',
    icon: <Icon type="Storage" style={{ color: 'white' }} />
  },
  allowedRoutes.projects && {
    name: 'user:dashboard.projects',
    path: '/admin/projects',
    icon: <Icon type="Code" style={{ color: 'white' }} />
  },
  allowedRoutes.routes && {
    name: 'user:dashboard.routes',
    path: '/admin/routes',
    icon: <Icon type="Shuffle" style={{ color: 'white' }} />
  },
  allowedRoutes.location && {
    name: 'user:dashboard.locations',
    path: '/admin/locations',
    icon: <Icon type="NearMe" style={{ color: 'white' }} />
  },
  allowedRoutes.instance && {
    name: 'user:dashboard.instance',
    path: '/admin/instance',
    icon: <Icon type="DirectionsRun" style={{ color: 'white' }} />
  },
  allowedRoutes.party && {
    name: 'user:dashboard.parties',
    path: '/admin/parties',
    icon: <Icon type="CalendarViewDay" style={{ color: 'white' }} />
  },
  allowedRoutes.user && {
    name: 'user:dashboard.users',
    path: '/admin/users',
    icon: <Icon type="SupervisorAccount" style={{ color: 'white' }} />
  },
  allowedRoutes.invite && {
    name: 'user:dashboard.invites',
    path: '/admin/invites',
    icon: <Icon type="PersonAdd" style={{ color: 'white' }} />
  },
  allowedRoutes.groups && {
    name: 'user:dashboard.groups',
    path: '/admin/groups',
    icon: <Icon type="GroupAdd" style={{ color: 'white' }} />
  },
  allowedRoutes.globalAvatars && {
    name: 'user:dashboard.avatars',
    path: '/admin/avatars',
    icon: <Icon type="Accessibility" style={{ color: 'white' }} />
  },
  allowedRoutes.static_resource && {
    name: 'user:dashboard.resources',
    path: '/admin/resources',
    icon: <Icon type="PermMedia" style={{ color: 'white' }} />
  },
  allowedRoutes.benchmarking && {
    name: 'user:dashboard.benchmarking',
    path: '/admin/benchmarking',
    icon: <Icon type="Timeline" style={{ color: 'white' }} />
  },
  allowedRoutes.settings && {
    name: 'user:dashboard.setting',
    path: '/admin/settings',
    icon: <Icon type="Settings" style={{ color: 'white' }} />
  },
  allowedRoutes.bot && {
    name: 'user:dashboard.bots',
    path: '/admin/bots',
    icon: <Icon type="Toys" style={{ color: 'white' }} />
  },
  allowedRoutes.recording && {
    name: 'user:dashboard.recordings',
    path: '/admin/recordings',
    icon: <Icon type="Videocam" style={{ color: 'white' }} />
  }
]
