import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { workspaceRoleLabel, workspaceSelectionAction } from '~/utils/workspace-navigation'

const navigation = readFileSync('app/components/admin/AdminNavigation.vue', 'utf8')
const workspaces = readFileSync('app/pages/admin/workspaces/index.vue', 'utf8')
const styles = readFileSync('app/assets/css/tailwind.css', 'utf8')
const navigationModel = readFileSync('app/utils/admin-navigation.ts', 'utf8')

describe('WU-51 navigation and workspace contracts', () => {
  it('sidebar context is navigation plus static map context without selectors', () => {
    expect(navigation).not.toContain('<select')
    expect(navigation).toContain('to="/admin/workspaces"')
    expect(navigation).toContain('ワークスペースを切り替える')
    expect(navigation).toContain("currentMap?.name ?? 'マップ未作成'")
    expect(navigation).not.toContain('switchOrganization')
    expect(navigation).not.toContain('admin-context-popover')
  })

  it('workspace selection models current and different workspaces without conflating roles', () => {
    expect(workspaceSelectionAction('workspace-a', 'workspace-a')).toBe('navigate')
    expect(workspaceSelectionAction('workspace-b', 'workspace-a')).toBe('switch')
    expect(workspaceRoleLabel('OWNER')).toBe('オーナー')
    expect(workspaceRoleLabel('MEMBER')).toBe('メンバー')
  })

  it('workspace list uses existing API and returns through the dashboard boundary', () => {
    expect(workspaces).toContain("useFetch<{\n  activeOrganizationId: string")
    expect(workspaces).toContain("$fetch('/api/organizations/active'")
    expect(workspaces).toContain("reloadNuxtApp({ path: '/admin/dashboard', force: true })")
    expect(workspaces).toContain('使用中')
    expect(workspaces).not.toContain('新しいワークスペース')
  })

  it('focus system uses one terracotta field/control language and no black 3px global outline', () => {
    expect(styles).toContain('outline: 2px solid #c7401f')
    expect(styles).toContain('box-shadow: 0 0 0 3px #fbe8e3')
    expect(styles).toContain('border-color: #c7401f')
    expect(styles).not.toContain('outline: 3px solid #1c1917')
  })

  it('high-risk navigation vocabulary uses canonical labels', () => {
    expect(navigationModel).toContain("label: '公開'")
    expect(navigationModel).toContain("label: 'アクセス状況'")
    expect(navigationModel).toContain("label: '操作履歴'")
    expect(navigationModel).not.toMatch(/label: '(公開管理|アクセス解析|監査ログ)'/)
  })
})
