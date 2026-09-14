import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const feedback = readFileSync(new URL('../app/components/ui/SaveFeedback.vue', import.meta.url), 'utf8')
const spotCreate = readFileSync(new URL('../app/pages/admin/maps/[mapId]/spots/new.vue', import.meta.url), 'utf8')
const spotEdit = readFileSync(new URL('../app/pages/admin/maps/[mapId]/spots/[spotId].vue', import.meta.url), 'utf8')
const mapCreate = readFileSync(new URL('../app/pages/admin/maps/new.vue', import.meta.url), 'utf8')
const mapSetup = readFileSync(new URL('../app/pages/admin/maps/[mapId]/setup.vue', import.meta.url), 'utf8')
const floors = readFileSync(new URL('../app/pages/admin/maps/[mapId]/floors.vue', import.meta.url), 'utf8')
const categories = readFileSync(new URL('../app/pages/admin/maps/[mapId]/categories.vue', import.meta.url), 'utf8')
const fields = readFileSync(new URL('../app/pages/admin/maps/[mapId]/fields.vue', import.meta.url), 'utf8')
const settings = readFileSync(new URL('../app/pages/admin/maps/[mapId]/settings.vue', import.meta.url), 'utf8')

describe('save feedback standard', () => {
  it('distinguishes saving, success and error with accessible live semantics', () => {
    expect(feedback).toContain("'idle' | 'saving' | 'success' | 'error'")
    expect(feedback).toContain(":role=\"state === 'error' ? 'alert' : 'status'\"")
    expect(feedback).toContain('aria-live')
  })

  it('shows create success after navigation for Map and Spot creation', () => {
    expect(mapCreate).toContain("saved: 'map-created'")
    expect(mapSetup).toContain("route.query.saved === 'map-created'")
    expect(spotCreate).toContain("saved: 'spot-created'")
    expect(spotCreate).toContain('{ external: true }')
    expect(spotEdit).toContain("route.query.saved === 'spot-created'")
  })

  it('applies the shared feedback pattern to core update flows', () => {
    for (const source of [spotEdit, floors, categories, fields, settings]) {
      expect(source).toContain('<SaveFeedback')
      expect(source).toContain("'saving'")
      expect(source).toContain("'success'")
      expect(source).toContain("'error'")
    }
  })

  it('prevents repeated submissions while core forms are saving', () => {
    expect(spotEdit).toContain(':is-submitting="isSubmitting"')
    expect(floors).toContain(':disabled="isCreating"')
    expect(categories).toContain(':disabled="isSaving"')
    expect(fields).toContain(':disabled="saveState === \'saving\'"')
  })
})
