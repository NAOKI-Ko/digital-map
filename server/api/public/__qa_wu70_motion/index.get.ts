import { createWu68Fixture } from '../__qa_wu68/index.get'
// Development-only stress fixture. No DB/publication or canonical data writes.
export default defineEventHandler(() => {
  const response = createWu68Fixture()
  response.map.name = '有松まち歩き · Category QA'
  const floor = response.map.floors[0]!
  const names = ['歴史・文化', '食べる・カフェ', '伝統工芸とものづくり体験', '買い物・おみやげ', '寺社と史跡をめぐる', '季節の花と自然散策', 'お子さまと楽しめるスポット', '雨の日も楽しめる屋内施設', '多目的トイレ・休憩所', 'バリアフリー対応の観光案内', '鉄道・バス・公共交通', '宿泊・滞在', '地域の祭り・イベント', 'フォトスポット', '駐車場・駐輪場', '医療・緊急時のご案内', '町並み保存地区の歴史的建造物・公開施設', 'VisitorInformationAndAccessibilityServices']
  const icons = ['material:museum', 'material:restaurant', 'material:festival', 'material:storefront']
  floor.spots.forEach((spot, index) => {
    const cat = index % names.length
    spot.categories = [{ id: `motion-category-${cat}`, name: names[cat]!, order: cat, iconType: 'preset', iconPresetId: icons[cat % icons.length]!, iconImageUrl: null }]
  })
  const second = structuredClone(floor)
  second.id = 'motion-floor-2'; second.name = '散策エリア 2F'
  second.spots.forEach(spot => { spot.id += '-2F' })
  response.map.floors = [floor, second]
  return response
})
