import { z } from 'zod'

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  WHOP_API_KEY: z.string().min(1, 'WHOP_API_KEY is required'),
  WHOP_APP_ID: z.string().optional(),
  LOG_LEVEL: z
    .enum(['debug', 'info', 'warn', 'error'])
    .optional(),
})

export type Env = z.infer<typeof envSchema>

export const env: Env = envSchema.parse({
  DATABASE_URL: process.env.DATABASE_URL,
  WHOP_API_KEY: process.env.WHOP_API_KEY,
  WHOP_APP_ID: process.env.WHOP_APP_ID,
  LOG_LEVEL: process.env.LOG_LEVEL?.trim(),
})

export default env
