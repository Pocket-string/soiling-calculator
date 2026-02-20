import { z } from 'zod'

export const consumeInviteSchema = z.object({
  token: z.string().min(1, 'Token requerido'),
  full_name: z.string().min(2, 'Nombre debe tener al menos 2 caracteres'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
})

export type ConsumeInviteInput = z.infer<typeof consumeInviteSchema>
