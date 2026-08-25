export function getVisibleCategoryCount(
  availableWidth: number,
  allButtonWidth: number,
  categoryWidths: readonly number[],
  overflowButtonWidth: number,
  gap: number,
) {
  if (categoryWidths.length === 0) return 0

  const allCategoriesWidth = allButtonWidth
    + categoryWidths.reduce((total, width) => total + width, 0)
    + gap * categoryWidths.length

  if (allCategoriesWidth <= availableWidth) return categoryWidths.length

  let usedWidth = allButtonWidth + overflowButtonWidth + gap
  let visibleCount = 0
  for (const width of categoryWidths) {
    const nextWidth = usedWidth + gap + width
    if (nextWidth > availableWidth) break
    usedWidth = nextWidth
    visibleCount += 1
  }
  return visibleCount
}
