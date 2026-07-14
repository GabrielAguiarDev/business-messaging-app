import {z} from 'zod';

export const envSchema = z.object({
  API_URL: z.url(),
});

export type Env = z.infer<typeof envSchema>;
