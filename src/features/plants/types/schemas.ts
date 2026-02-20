import { z } from 'zod'

export const plantSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').max(100),
  latitude: z.coerce.number().min(-90, 'Latitud mínima -90').max(90, 'Latitud máxima 90'),
  longitude: z.coerce.number().min(-180, 'Longitud mínima -180').max(180, 'Longitud máxima 180'),
  num_modules: z.coerce.number().int('Debe ser un número entero').min(1, 'Mínimo 1 módulo'),
  module_power_wp: z.coerce.number().min(1, 'Potencia mínima 1 Wp').max(1000, 'Potencia máxima 1000 Wp'),
  module_area_m2: z.coerce.number().min(0.1, 'Área mínima 0.1 m²').max(10, 'Área máxima 10 m²'),
  tilt_degrees: z.coerce.number().min(0).max(90).default(30),
  azimuth_degrees: z.coerce.number().min(0).max(360).default(180),
  noct: z.coerce.number().min(20, 'NOCT mínimo 20°C').max(80, 'NOCT máximo 80°C').default(45),
  temp_coeff_percent: z.coerce.number().min(-1, 'Mínimo -1%/°C').max(0, 'Debe ser negativo o cero').default(-0.4),
  module_efficiency: z.coerce.number().min(0.01).max(0.5).default(0.20),
  energy_price_eur: z.coerce.number().min(0.001, 'Precio minimo 0.001/kWh').default(0.12),
  cleaning_cost_eur: z.coerce.number().min(0.1, 'Costo minimo 0.1').default(150),
  currency: z.enum(['EUR', 'USD', 'CLP', 'GBP']).default('EUR'),
})

export type PlantSchema = z.infer<typeof plantSchema>
