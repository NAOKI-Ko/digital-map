import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

describe('WU-40 AI-UAT operation feedback', () => {
  it('shows an actionable stale-revision conflict and prevents repeated approval', () => {
    const source = readFileSync(join(process.cwd(), 'app/pages/admin/maps/[mapId]/revisions.vue'), 'utf8')
    expect(source).toContain("error?.response?.status === 409")
    expect(source).toContain('公開中のSpotが更新されたため承認できません')
    expect(source).toContain(':disabled="processingId === revision.id"')
  })

  it('does not render an editable form after a Spot Editor loses access', () => {
    const source = readFileSync(join(process.cwd(), 'app/pages/admin/spot-editor/[spotId].vue'), 'utf8')
    expect(source).toContain('error: loadError')
    expect(source).toContain('v-if="loadError" role="alert"')
    expect(source).toContain('<template v-else>')
  })
})
