import Config from 'react-native-config';

import {Env, envSchema} from './env.schema';

const parsed = envSchema.safeParse(Config);

if (!parsed.success) {
  const issues = parsed.error.issues
    .map(issue => `${issue.path.join('.')}: ${issue.message}`)
    .join('; ');
  throw new Error(
    `Variáveis de ambiente inválidas ou ausentes (.env): ${issues}`,
  );
}

export const env: Env = parsed.data;
