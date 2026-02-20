import { z } from 'zod'

export const leadSchema = z.object({
  name: z.string().min(2, 'Nombre mínimo 2 caracteres').max(100),
  email: z.string().email('Email inválido'),
  location_country: z.string().min(2, 'País requerido').max(100),
  location_city: z.string().min(2, 'Ciudad requerida').max(100),
  system_kwp: z.coerce.number().min(0.1, 'Potencia mínima 0.1 kWp').max(10000),
  inverter_brand: z.enum(['Huawei', 'SMA', 'Fronius', 'SolarEdge', 'Growatt', 'Otro'] as const),
  inverter_model: z.string().max(100).optional(),
  reporting_frequency: z.enum(['daily', 'weekly', 'monthly'] as const, 'Selecciona una frecuencia'),
  can_commit_weekly: z.preprocess((v) => v === 'true', z.boolean()),
  gdpr_consent: z.literal('true', 'Debes aceptar la política de privacidad'),
})

export type LeadFormData = z.infer<typeof leadSchema>
