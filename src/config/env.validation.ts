import { z } from 'zod';

export const validateEnvironmentUpdate = (data: Record<string, unknown>) => {
  const envSchema = z.record(z.string(), z.union([z.string(), z.number(), z.boolean()]));
  return envSchema.parse(data);
}; 