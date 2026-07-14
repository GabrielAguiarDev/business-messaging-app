import {z} from 'zod';

export const forgotPasswordSchema = z.object({
  email: z.email('Informe um email válido'),
});

export type ForgotPasswordSchema = z.infer<typeof forgotPasswordSchema>;
