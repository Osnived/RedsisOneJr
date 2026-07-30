import { z } from 'zod';

/**
 * Variables de entorno del frontend.
 *
 * Se validan al arrancar para que un despliegue mal configurado falle de
 * inmediato, en lugar de producir peticiones a una URL vacía.
 */
const envSchema = z.object({
  VITE_API_URL: z.string().min(1).default('/api'),
  VITE_GOOGLE_MAPS_API_KEY: z.string().optional(),
});

const parsed = envSchema.safeParse(import.meta.env);

if (!parsed.success) {
  const details = parsed.error.issues
    .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
    .join('; ');
  throw new Error(`Configuración del frontend inválida: ${details}`);
}

export const env = parsed.data;
