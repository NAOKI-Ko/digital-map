export type AdminIconName =
  | 'analytics'
  | 'approval'
  | 'assignment'
  | 'audit'
  | 'category'
  | 'edit'
  | 'editors'
  | 'home'
  | 'maps'
  | 'people'
  | 'paper'
  | 'publish'
  | 'settings'
  | 'spot'

export type AdminNavigationGroupId = 'organization' | 'map' | 'operations' | 'team' | 'management'

export interface AdminNavigationItem {
  id: string
  label: string
  shortLabel: string
  icon: AdminIconName
  to: string
  group: AdminNavigationGroupId
  rail: boolean
  activePaths: string[]
  exact?: boolean
  activeHash?: string
  disabled?: boolean
  status?: string
}

export interface AdminNavigationContext {
  mapId: string | null
  isOwner: boolean
  hasAssignedSpots: boolean
}

export const adminNavigationGroupLabels: Record<AdminNavigationGroupId, string> = {
  organization: 'ワークスペース',
  map: 'マップ',
  operations: '公開・運用',
  team: 'チーム',
  management: '管理',
}

function mapPath(mapId: string, suffix = '') {
  return `/admin/maps/${mapId}${suffix}`
}

export function buildAdminNavigation(context: AdminNavigationContext): AdminNavigationItem[] {
  const items: AdminNavigationItem[] = [{
    id: 'workspace-home',
    label: 'ホーム',
    shortLabel: 'ホーム',
    icon: 'home',
    to: context.mapId ? mapPath(context.mapId) : '/admin/dashboard',
    group: 'organization',
    rail: true,
    activePaths: context.mapId ? [mapPath(context.mapId)] : ['/admin/dashboard'],
    exact: true,
  }]

  if (context.hasAssignedSpots) {
    items.push({
      id: 'assigned-spots',
      label: '担当スポット',
      shortLabel: '担当スポット',
      icon: 'assignment',
      to: '/admin/spot-editor',
      group: 'organization',
      rail: true,
      activePaths: ['/admin/spot-editor'],
    })
  }

  if (context.mapId) {
    items.push(
      {
        id: 'illustration-map', label: 'イラストマップ', shortLabel: 'イラストマップ', icon: 'edit', to: mapPath(context.mapId, '/editor'),
        group: 'map', rail: true,
        activePaths: [
          mapPath(context.mapId, '/settings'),
          mapPath(context.mapId, '/floors'),
          mapPath(context.mapId, '/editor'),
          mapPath(context.mapId, '/fields'),
        ],
      },
      {
        id: 'real-map', label: 'リアルマップ', shortLabel: 'リアルマップ（準備中）', icon: 'maps', to: '',
        group: 'map', rail: false, activePaths: [], disabled: true, status: '準備中',
      },
      {
        id: 'spots', label: 'スポット', shortLabel: 'スポット', icon: 'spot', to: mapPath(context.mapId, '/spots'),
        group: 'map', rail: true, activePaths: [mapPath(context.mapId, '/spots')],
      },
      {
        id: 'categories', label: 'カテゴリー', shortLabel: 'カテゴリー', icon: 'category', to: mapPath(context.mapId, '/categories'),
        group: 'map', rail: false, activePaths: [mapPath(context.mapId, '/categories')],
      },
      {
        id: 'publish', label: '公開', shortLabel: '公開', icon: 'publish', to: mapPath(context.mapId, '/publish'),
        group: 'operations', rail: true, activePaths: [mapPath(context.mapId, '/publish')],
      },
      {
        id: 'paper', label: '紙マップ', shortLabel: '紙マップ', icon: 'paper', to: mapPath(context.mapId, '/paper'),
        group: 'operations', rail: true, activePaths: [mapPath(context.mapId, '/paper')],
      },
      {
        id: 'analytics', label: 'アクセス状況', shortLabel: 'アクセス状況', icon: 'analytics', to: mapPath(context.mapId, '/analytics'),
        group: 'operations', rail: false, activePaths: [mapPath(context.mapId, '/analytics')],
      },
      {
        id: 'revisions', label: '承認待ち', shortLabel: '承認待ち', icon: 'approval', to: mapPath(context.mapId, '/revisions'),
        group: 'team', rail: false, activePaths: [mapPath(context.mapId, '/revisions')],
      },
    )

    if (context.isOwner) {
      items.push({
        id: 'map-editors', label: 'マップ編集者', shortLabel: 'マップ編集者', icon: 'editors', to: mapPath(context.mapId, '/editors'),
        group: 'team', rail: false, activePaths: [mapPath(context.mapId, '/editors')],
      })
    }
  }

  if (context.isOwner) {
    items.push(
      {
        id: 'members', label: 'メンバー', shortLabel: 'メンバー', icon: 'people', to: '/admin/organization#members',
        group: 'team', rail: false, activePaths: ['/admin/organization'], exact: true, activeHash: '#members',
      },
      {
        id: 'audit', label: '操作履歴', shortLabel: '操作履歴', icon: 'audit', to: '/admin/organization/audit',
        group: 'management', rail: false, activePaths: ['/admin/organization/audit'],
      },
      {
        id: 'organization-settings', label: 'ワークスペース設定', shortLabel: 'ワークスペース設定', icon: 'settings', to: '/admin/organization#settings',
        group: 'management', rail: false, activePaths: ['/admin/organization'], exact: true, activeHash: '#settings',
      },
    )
  }

  return items
}

export function isAdminNavigationItemActive(item: AdminNavigationItem, path: string, hash = '') {
  if (item.id === 'organization-settings' && path === '/admin/organization' && !hash) return true
  if (item.activeHash && hash !== item.activeHash) return false
  if (!item.activeHash && path === '/admin/organization' && hash) return false
  return item.activePaths.some(activePath => item.exact
    ? path === activePath
    : path === activePath || path.startsWith(`${activePath}/`))
}

export function buildMapEditSubnavigation(mapId: string) {
  return [
    { label: '基本設定', to: mapPath(mapId, '/settings') },
    { label: 'フロア・イラスト', to: mapPath(mapId, '/floors') },
    { label: 'ピン配置', to: mapPath(mapId, '/editor') },
    { label: 'スポット項目', to: mapPath(mapId, '/fields') },
  ]
}

export function buildSpotSubnavigation(mapId: string) {
  return [
    { label: '一覧', to: mapPath(mapId, '/spots') },
    { label: 'CSVでまとめて登録', to: mapPath(mapId, '/spots/import') },
    { label: '承認待ち', to: mapPath(mapId, '/revisions') },
  ]
}
