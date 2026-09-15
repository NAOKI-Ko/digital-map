import { z } from 'zod'
import { mapLocales } from '../constants/map-languages'

export const mapLocaleSchema = z.enum(mapLocales)

export const mapLanguagesUpdateSchema = z.object({
  enabledLocales: z.array(mapLocaleSchema).min(1).max(mapLocales.length),
}).strict().refine(value => new Set(value.enabledLocales).size === value.enabledLocales.length, {
  path: ['enabledLocales'],
  message: '同じ言語を重複して追加できません。',
})
