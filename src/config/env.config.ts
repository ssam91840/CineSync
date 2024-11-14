import { z } from 'zod';

// Environment variable schema
const envSchema = z.object({
  SOURCE_DIR: z.string().optional(),
  DESTINATION_DIR: z.string().optional(),
  USE_SOURCE_STRUCTURE: z.preprocess(
    (val) => val === 'true' || val === true,
    z.boolean()
  ).optional(),
  LOG_LEVEL: z.enum(['DEBUG', 'INFO', 'WARN', 'ERROR']).optional(),
  TMDB_API_KEY: z.string().optional(),
  MAX_PROCESSES: z.preprocess(
    (val) => Number(val),
    z.number().int().positive()
  ).optional(),
  SKIP_EXTRAS_FOLDER: z.preprocess(
    (val) => val === 'true' || val === true,
    z.boolean()
  ).optional(),
  EXTRAS_MAX_SIZE_MB: z.preprocess(
    (val) => Number(val),
    z.number().int().positive()
  ).optional(),
  DB_BATCH_SIZE: z.preprocess(
    (val) => Number(val),
    z.number().int().positive()
  ).optional(),
  DB_MAX_WORKERS: z.preprocess(
    (val) => Number(val),
    z.number().int().positive()
  ).optional(),
}).partial();

// Type inference
export type EnvConfig = z.infer<typeof envSchema>;

// Default values for environment variables
const defaultEnv: EnvConfig = {
  SOURCE_DIR: '/path/to/files',
  DESTINATION_DIR: '/home/mine',
  USE_SOURCE_STRUCTURE: false,
  LOG_LEVEL: 'DEBUG',
  MAX_PROCESSES: 5,
  SKIP_EXTRAS_FOLDER: true,
  EXTRAS_MAX_SIZE_MB: 100,
  DB_BATCH_SIZE: 1000,
  DB_MAX_WORKERS: 4,
};

// Process environment variables
const processEnvVariables = (): EnvConfig => {
  try {
    const env = {
      SOURCE_DIR: import.meta.env.SOURCE_DIR ?? defaultEnv.SOURCE_DIR,
      DESTINATION_DIR: import.meta.env.DESTINATION_DIR ?? defaultEnv.DESTINATION_DIR,
      USE_SOURCE_STRUCTURE: import.meta.env.USE_SOURCE_STRUCTURE ?? defaultEnv.USE_SOURCE_STRUCTURE,
      LOG_LEVEL: import.meta.env.LOG_LEVEL ?? defaultEnv.LOG_LEVEL,
      TMDB_API_KEY: import.meta.env.TMDB_API_KEY,
      MAX_PROCESSES: import.meta.env.MAX_PROCESSES ?? defaultEnv.MAX_PROCESSES,
      SKIP_EXTRAS_FOLDER: import.meta.env.SKIP_EXTRAS_FOLDER ?? defaultEnv.SKIP_EXTRAS_FOLDER,
      EXTRAS_MAX_SIZE_MB: import.meta.env.EXTRAS_MAX_SIZE_MB ?? defaultEnv.EXTRAS_MAX_SIZE_MB,
      DB_BATCH_SIZE: import.meta.env.DB_BATCH_SIZE ?? defaultEnv.DB_BATCH_SIZE,
      DB_MAX_WORKERS: import.meta.env.DB_MAX_WORKERS ?? defaultEnv.DB_MAX_WORKERS,
    };

    return envSchema.parse(env);
  } catch (error) {
    console.error('Environment validation failed:', error);
    return defaultEnv;
  }
};

// Export validated environment config
export const env = processEnvVariables();

// Hook for accessing environment variables
export const useEnvConfig = () => {
  return env;
};