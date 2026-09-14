import { z } from 'zod'

const optionalText = (max: number) => z.string().trim().max(max).optional().nullable()

export const mapTranslationSchema = z.object({
  englishEnabled: z.boolean(),
  name: optionalText(100),
  description: optionalText(2000),
}).strict()

export const spotTranslationSchema = z.object({
  name: optionalText(100),
  description: optionalText(5000),
  address: optionalText(500),
  hoursText: optionalText(1000),
  holidayText: optionalText(1000),
  customValues: z.record(z.string(), z.string().max(5000).nullable()).default({}),
}).strict()

export const nameTranslationSchema = z.object({ name: optionalText(100) }).strict()
export const labelTranslationSchema = z.object({ label: optionalText(100) }).strict()
