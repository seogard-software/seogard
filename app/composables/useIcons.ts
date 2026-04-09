type IconName =
  | 'dashboard'
  | 'globe'
  | 'settings'
  | 'logout'
  | 'alert-triangle'
  | 'plus'
  | 'search'
  | 'chevron-right'
  | 'chevron-down'
  | 'arrow-up'
  | 'arrow-down'
  | 'check'
  | 'x'
  | 'clock'
  | 'pages'
  | 'chart-bar'
  | 'shield-check'
  | 'bell'
  | 'radar'
  | 'user'
  | 'activity'
  | 'refresh-cw'
  | 'zap'
  | 'folder'
  | 'file'
  | 'sort-asc'
  | 'sort-desc'
  | 'arrow-left'
  | 'chevron-left'
  | 'code'
  | 'building'
  | 'users'
  | 'user-plus'
  | 'help-circle'
  | 'copy'

const ICON_PATHS: Record<IconName, string> = {
  dashboard:
    'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1',
  globe:
    'M12 21a9 9 0 100-18 9 9 0 000 18zM3.6 9h16.8M3.6 15h16.8M12 3a15 15 0 014 9 15 15 0 01-4 9 15 15 0 01-4-9 15 15 0 014-9z',
  settings:
    'M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4',
  logout:
    'M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1',
  'alert-triangle':
    'M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z',
  plus: 'M12 5v14m-7-7h14',
  search:
    'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z',
  'chevron-right': 'M9 5l7 7-7 7',
  'chevron-down': 'M19 9l-7 7-7-7',
  'arrow-up': 'M5 15l7-7 7 7',
  'arrow-down': 'M19 9l-7 7-7-7',
  check: 'M5 13l4 4L19 7',
  x: 'M6 18L18 6M6 6l12 12',
  clock:
    'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
  pages:
    'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
  'chart-bar':
    'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
  'shield-check':
    'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
  bell:
    'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9',
  radar:
    'M12 12m-2 0a2 2 0 104 0 2 2 0 10-4 0M12 12m-6 0a6 6 0 1012 0 6 6 0 10-12 0M12 12m-10 0a10 10 0 1020 0 10 10 0 10-20 0M12 12V2',
  user:
    'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
  activity:
    'M22 12h-4l-3 9L9 3l-3 9H2',
  'refresh-cw':
    'M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15',
  zap: 'M13 10V3L4 14h7v7l9-11h-7z',
  folder:
    'M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z',
  file:
    'M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zM14 2v6h6',
  'sort-asc': 'M3 4h13M3 8h9M3 12h5m8-8v16m0 0l-3-3m3 3l3-3',
  'sort-desc': 'M3 4h13M3 8h9M3 12h5m8 8V4m0 0L13 7m3-3l3 3',
  'arrow-left': 'M19 12H5m0 0l7 7m-7-7l7-7',
  'chevron-left': 'M15 19l-7-7 7-7',
  code: 'M16 18l6-6-6-6M8 6l-6 6 6 6',
  building: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
  users: 'M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75',
  'user-plus': 'M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M8.5 11a4 4 0 100-8 4 4 0 000 8zM20 8v6M23 11h-6',
  'help-circle': 'M12 22a10 10 0 100-20 10 10 0 000 20zM9.09 9a3 3 0 015.83 1c0 2-3 3-3 3M12 17h.01',
  copy: 'M8 4v12a2 2 0 002 2h8a2 2 0 002-2V7.242a2 2 0 00-.602-1.43L16.083 2.57A2 2 0 0014.685 2H10a2 2 0 00-2 2zM16 18v2a2 2 0 01-2 2H6a2 2 0 01-2-2V9a2 2 0 012-2h2',
}

export function useIcons() {
  function getIconPath(name: IconName): string {
    return ICON_PATHS[name]
  }

  return { getIconPath, ICON_PATHS }
}

export type { IconName }
