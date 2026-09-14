import { basename } from 'node:path'
import { mediaGcGraceDays } from './media-variants'
import { summarizeMediaUsage, type MediaUsageCounts } from './media'

export type GcCandidate = { id: string, createdAt: Date, storageKey: string, _count: MediaUsageCounts }

export function planMediaGc(assets: GcCandidate[], now = new Date(), graceDays = mediaGcGraceDays) {
  const cutoff = new Date(now.getTime() - graceDays * 86_400_000)
  return assets.filter(asset => summarizeMediaUsage(asset._count).total === 0 && asset.createdAt <= cutoff && basename(asset.storageKey) === asset.storageKey)
}
