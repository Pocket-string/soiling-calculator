import { z } from 'zod'

export const readingSchema = z.object({
  plant_id: z.string().uuid('ID de planta inválido'),
  reading_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha inválido (YYYY-MM-DD)'),
  reading_date_end: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha inválido (YYYY-MM-DD)').optional(),
  kwh_real: z.coerce.number().min(0, 'Los kWh no pueden ser negativos'),
  reading_type: z.enum(['DAILY', 'WEEKLY', 'MONTHLY']).default('DAILY'),
  is_cleaning_day: z.coerce.boolean().default(false),
})

export type ReadingSchema = z.infer<typeof readingSchema>
