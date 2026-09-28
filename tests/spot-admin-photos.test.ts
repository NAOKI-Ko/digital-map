import { describe, expect, it } from 'vitest'
import { toAdminSpotDetail } from '../server/utils/spot'
const base = { id: 's', floorId: 'f', floor: { name: '1F' }, name: '展示', photosJson: ['/uploads/legacy.png'], photos: [], spotCategories: [], fieldValues: [], translations: [], fieldValueTranslations: [], pinSourceMode: 'individual', pinIconType: 'preset', pinIconId: 'kanji:●', pinIconImageUrl: null, pinColor: '#C7401F', pinSize: 'medium', createdAt: new Date(), updatedAt: new Date() }
describe('admin effective photos', () => {
  it('preserves legacy URLs with no managed associations', () => {
    expect(toAdminSpotDetail(base as never)).toMatchObject({ photos: ['/uploads/legacy.png'], photoAssetIds: [null] })
  })
  it('uses ordered managed associations and assets consistently with visitor photos and list count', () => {
    const photos = ['second', 'first'].map(id => ({ assetId: id, asset: { storageKey: `${id}.png`, variants: [{ kind: 'display', storageKey: `${id}-display.webp` }] } }))
    expect(toAdminSpotDetail({ ...base, photos } as never)).toMatchObject({ photos: ['/uploads/second-display.webp', '/uploads/first-display.webp'], photoAssetIds: ['second', 'first'] })
  })
})
