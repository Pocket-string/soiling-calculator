import { z } from 'zod'

export const solarEdgeConfigSchema = z.object({
  provider: z.literal('solaredge'),
  api_key: z.string().min(10, 'API key debe tener al menos 10 caracteres'),
  site_id: z.string().min(1, 'Site ID es requerido'),
})

export const huaweiConfigSchema = z.object({
  provider: z.literal('huawei'),
  user_name: z.string().min(1, 'Usuario es requerido'),
  system_code: z.string().min(1, 'System code es requerido'),
  region: z.enum(['eu5', 'intl', 'la5'], {
    error: 'Region debe ser eu5, intl, o la5',
  }),
})

export const integrationConfigSchema = z.discriminatedUnion('provider', [
  solarEdgeConfigSchema,
  huaweiConfigSchema,
])

export type SolarEdgeConfig = z.infer<typeof solarEdgeConfigSchema>
export type HuaweiConfig = z.infer<typeof huaweiConfigSchema>
export type IntegrationConfig = z.infer<typeof integrationConfigSchema>
