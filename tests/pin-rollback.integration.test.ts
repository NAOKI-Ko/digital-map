import { randomUUID } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import { prisma } from '../server/utils/prisma'
import { resolveEffectivePinAppearance } from '../shared/utils/pin-appearance'
const integration = process.env.DATABASE_URL ? describe : describe.skip
integration('WU65 additive rollback rehearsal', () => {
  it('freezes inherited appearance into legacy columns before an old reader is used', async () => {
    const url = new URL(process.env.DATABASE_URL!)
    if (!['localhost', '127.0.0.1'].includes(url.hostname) || !(url.pathname.startsWith('/digital_map_test_') || url.pathname === '/digital_map_ci')) throw new Error('Disposable test database required')
    const slug = `rollback-${randomUUID()}`
    const rollback = new Error('REHEARSAL_ROLLBACK')
    await expect(prisma.$transaction(async tx => {
      const tenant = await tx.tenant.create({ data: { name: slug, slug } })
      const map = await tx.map.create({ data: { name: slug, slug, tenantId: tenant.id } })
      const floor = await tx.mapFloor.create({ data: { mapId: map.id, name: '1F', illustrationUrl: '/fixture.png', imageWidth: 100, imageHeight: 100 } })
      const category = await tx.category.create({ data: { mapId: map.id, tenantId: tenant.id, name: '展示', pinDefaultType: 'preset', pinDefaultIconId: 'kanji:●', pinDefaultColor: '#047857', pinDefaultSize: 'large' } })
      const spot = await tx.spot.create({ data: { tenantId: tenant.id, floorId: floor.id, name: 'Rollback exhibit', pinSourceMode: 'category', pinSourceCategoryId: category.id, x: .2, y: .4, isPublished: true, spotCategories: { create: { categoryId: category.id } } }, include: { pinSourceCategory: true } })
      const appearance = resolveEffectivePinAppearance(spot)
      const frozen = await tx.spot.update({ where: { id: spot.id }, data: { ...appearance, pinSourceMode: 'individual', pinSourceCategoryId: null } })
      const { pinSourceMode: _mode, pinSourceCategoryId: _source, ...legacyReader } = frozen
      expect(resolveEffectivePinAppearance(legacyReader)).toEqual(appearance)
      expect(frozen).toMatchObject({ x: .2, y: .4, isPublished: true })
      expect(await tx.spotCategory.count({ where: { spotId: spot.id } })).toBe(1)
      throw rollback
    })).rejects.toBe(rollback)
    expect(await prisma.tenant.count({ where: { slug } })).toBe(0)
  })
})
