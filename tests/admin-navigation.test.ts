import { describe, expect, it } from 'vitest'
import {
  buildAdminNavigation,
  buildMapEditSubnavigation,
  buildSpotSubnavigation,
  isAdminNavigationItemActive,
} from '../app/utils/admin-navigation'

describe('WU-50 single-map workspace navigation model', () => {
  it('OWNERへ単一Map navigationとOWNER専用destinationを返す', () => {
    const items = buildAdminNavigation({ mapId: 'map-a', isOwner: true, hasAssignedSpots: false })
    expect(items.map(item => item.id)).toEqual(expect.arrayContaining([
      'workspace-home', 'illustration-map', 'real-map', 'spots', 'categories', 'publish', 'analytics', 'revisions', 'map-editors', 'members', 'audit', 'organization-settings',
    ]))
    expect(items.find(item => item.id === 'real-map')).toMatchObject({ disabled: true, status: '準備中', to: '' })
    expect(items.map(item => item.id)).not.toContain('assigned-spots')
  })

  it('Map EDITORからOWNER専用destinationを除外する', () => {
    const items = buildAdminNavigation({ mapId: 'map-a', isOwner: false, hasAssignedSpots: false })
    expect(items.map(item => item.id)).toEqual(expect.arrayContaining(['workspace-home', 'illustration-map', 'real-map', 'spots', 'publish', 'analytics', 'revisions']))
    expect(items.map(item => item.id)).not.toEqual(expect.arrayContaining(['map-editors', 'members', 'audit', 'organization-settings']))
  })

  it('Spot EditorだけならMap管理を表示せず、assignmentがある場合だけ担当Spotを表示する', () => {
    const assigned = buildAdminNavigation({ mapId: null, isOwner: false, hasAssignedSpots: true })
    expect(assigned.map(item => item.id)).toEqual(['workspace-home', 'assigned-spots'])
    expect(buildAdminNavigation({ mapId: null, isOwner: false, hasAssignedSpots: false }).map(item => item.id)).toEqual(['workspace-home'])
  })

  it('Map編集の子routeとOrganization hashを正しくactiveにする', () => {
    const items = buildAdminNavigation({ mapId: 'map-a', isOwner: true, hasAssignedSpots: false })
    const mapEdit = items.find(item => item.id === 'illustration-map')!
    const members = items.find(item => item.id === 'members')!
    const settings = items.find(item => item.id === 'organization-settings')!
    expect(isAdminNavigationItemActive(mapEdit, '/admin/maps/map-a/floors/floor-a/georeference')).toBe(true)
    expect(isAdminNavigationItemActive(members, '/admin/organization', '#members')).toBe(true)
    expect(isAdminNavigationItemActive(settings, '/admin/organization')).toBe(true)
    expect(isAdminNavigationItemActive(members, '/admin/organization', '#settings')).toBe(false)
  })

  it('route-backed subnavigationは既存URLを保持する', () => {
    expect(buildMapEditSubnavigation('map-a').map(item => item.to)).toEqual([
      '/admin/maps/map-a/settings', '/admin/maps/map-a/floors', '/admin/maps/map-a/editor', '/admin/maps/map-a/fields',
    ])
    expect(buildSpotSubnavigation('map-a').map(item => item.to)).toEqual([
      '/admin/maps/map-a/spots', '/admin/maps/map-a/spots/import', '/admin/maps/map-a/revisions',
    ])
  })
})
