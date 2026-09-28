import { createHash } from 'node:crypto'
import type { Prisma } from '~~/prisma/generated/client'
import { spotBulkSchema, type SpotBulkInput } from '~~/shared/schemas/spot-bulk'
import { pinSourceInclude } from './pin-appearance'
import { resolveEffectivePinAppearance, pinSourceLabel } from '~~/shared/utils/pin-appearance'

/** One read/validation path for preview and transactional apply. No coordinates in planned writes. */
export async function planSpotBulk(tx: Prisma.TransactionClient, map: { id: string, tenantId: string }, input: SpotBulkInput) {
  const spotIds = [...new Set(input.spotIds)].sort()
  const spots = await tx.spot.findMany({ where: { id: { in: spotIds }, tenantId: map.tenantId, floor: { mapId: map.id } }, include: { floor: { select: { name: true } }, pinSourceCategory: pinSourceInclude, spotCategories: { include: { category: true } } }, orderBy: { id: 'asc' } })
  if (spots.length !== spotIds.length) throw createError({ statusCode: 404, statusMessage: '選択したスポットが見つかりません。変更は保存されていません。' })
  const categories = await tx.category.findMany({ where: { mapId: map.id, tenantId: map.tenantId } })
  const targetCategoryId = 'categoryId' in input ? input.categoryId : undefined
  const category = categories.find(item => item.id === targetCategoryId)
  if (targetCategoryId && !category) throw createError({ statusCode: 422, statusMessage: '選択したカテゴリーが見つかりません。' })
  const floor = input.action === 'assignFloor' ? await tx.mapFloor.findFirst({ where: { id: input.floorId, mapId: map.id } }) : null
  if (input.action === 'assignFloor' && !floor) throw createError({ statusCode: 422, statusMessage: '選択したフロアが見つかりません。' })
  const rows = spots.map(spot => {
    let error: string | null = null
    let description = ''
    let changed = false
    const before = resolveEffectivePinAppearance(spot)
    let after = before
    let data: Prisma.SpotUncheckedUpdateInput = {}
    let sourceId: string | null = spot.pinSourceCategoryId
    const memberIds = spot.spotCategories.map(item => item.categoryId)
    if (input.action === 'assignFloor') {
      if ([spot.x, spot.y, spot.lat, spot.lng].some(value => value !== null) || spot.isPublished) error = '座標または公開対象設定があります。個別に配置を確認してください。'
      description = `${spot.floor.name} → ${floor!.name}（座標は変更しません）`
      changed = spot.floorId !== floor!.id; data = { floorId: floor!.id }
    }
    else if (input.action === 'publish' || input.action === 'unpublish') {
      const target = input.action === 'publish'
      if (target && (spot.x === null || spot.y === null)) error = '未配置のため公開対象にできません。'
      description = `${spot.isPublished ? '公開対象' : '対象外'} → ${target ? '公開対象' : '対象外'}`
      changed = spot.isPublished !== target; data = { isPublished: target }
    }
    else if (input.action === 'addCategory' || input.action === 'removeCategory') {
      if (input.action === 'removeCategory' && spot.pinSourceCategoryId === category!.id) error = 'PIN用カテゴリーです。先に設定元を変更・解除してください。'
      changed = input.action === 'addCategory' ? !memberIds.includes(category!.id) : memberIds.includes(category!.id)
      description = `カテゴリー「${category!.name}」を${input.action === 'addCategory' ? '追加' : '外す'}（他の所属は維持）`
    }
    else if (input.action === 'pinSource') {
      const mode = input.mode === 'soleCategory' ? 'category' : input.mode
      sourceId = mode === 'category' ? input.mode === 'soleCategory' ? (memberIds.length === 1 ? memberIds[0]! : null) : (category?.id ?? null) : null
      if (mode === 'category' && (!sourceId || !memberIds.includes(sourceId))) error = input.mode === 'soleCategory' ? '所属カテゴリーが1つではありません。明示的に選んでください。' : '選択したカテゴリーに所属していません。'
      const source = categories.find(item => item.id === sourceId)
      if (!error) after = resolveEffectivePinAppearance({ ...spot, ...before, pinSourceMode: mode, pinSourceCategory: source })
      data = { ...(mode === 'individual' ? before : {}), pinSourceMode: mode, pinSourceCategoryId: sourceId }
      changed = spot.pinSourceMode !== mode || spot.pinSourceCategoryId !== sourceId
      description = `${pinSourceLabel(spot.pinSourceMode, spot.pinSourceCategory?.name)} → ${pinSourceLabel(mode, source?.name)}${mode === 'category' && !source?.pinDefaultType ? '（既定未設定：標準ピン）' : ''}`
    }
    else { changed = true; description = 'スポットを削除（元に戻せません）' }
    return { id: spot.id, name: spot.name, floorName: spot.floor.name, version: spot.liveVersion, error, description, changed, before, after, data, sourceId }
  })
  const { reviewToken: _token, ...command } = spotBulkSchema.parse(input)
  const relevantCategoryIds = new Set(rows.map(row => row.sourceId).filter(Boolean))
  const revisions = categories.filter(item => relevantCategoryIds.has(item.id)).map(item => [item.id, item.pinDefaultRevision]).sort()
  const token = createHash('sha256').update(JSON.stringify({ command: { ...command, spotIds }, versions: rows.map(row => [row.id, row.version]), revisions, rows })).digest('hex')
  return { rows, token, category, total: rows.length, changed: rows.filter(row => row.changed).length, unchanged: rows.filter(row => !row.changed).length }
}
export function publicBulkPlan(plan: Awaited<ReturnType<typeof planSpotBulk>>) {
  return { reviewToken: plan.token, total: plan.total, changed: plan.changed, unchanged: plan.unchanged, rows: plan.rows.map(({ data: _data, sourceId: _sourceId, ...row }) => row) }
}
