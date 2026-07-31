import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ALL_APP_MODULES, type AuthTokens } from '@redsis/contracts';
import { ApiError, apiClient } from './api-client';
import { useAuthStore } from '@/stores/auth.store';

const TOKENS: AuthTokens = { accessToken: 'access-1', refreshToken: 'refresh-1', expiresIn: 900 };

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function authenticate(): void {
  useAuthStore.getState().setSession(
    {
      id: 'user-1',
      email: 'admin@redsis.com',
      fullName: 'Administrador',
      isActive: true,
      roles: ['administrador'],
      modules: ALL_APP_MODULES.slice(),
      permissions: [],
    },
    TOKENS,
  );
}

describe('apiClient', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('adjunta el access token en las peticiones autenticadas', async () => {
    authenticate();
    fetchMock.mockResolvedValue(jsonResponse({ ok: true }));

    await apiClient.get('/users');

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const headers = init.headers as Headers;
    expect(headers.get('Authorization')).toBe('Bearer access-1');
  });

  it('no adjunta token en las peticiones anónimas', async () => {
    authenticate();
    fetchMock.mockResolvedValue(jsonResponse({ ok: true }));

    await apiClient.anonymousPost('/auth/login', { email: 'a@b.com', password: 'x' });

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const headers = init.headers as Headers;
    expect(headers.get('Authorization')).toBeNull();
  });

  it('devuelve undefined ante un 204 sin cuerpo', async () => {
    authenticate();
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }));

    await expect(apiClient.delete('/users/user-2')).resolves.toBeUndefined();
  });

  it('convierte un error de la API en ApiError conservando el mensaje', async () => {
    authenticate();
    // Cada llamada devuelve una respuesta nueva: el cuerpo solo puede leerse una vez.
    fetchMock.mockImplementation(() =>
      Promise.resolve(
        jsonResponse(
          { statusCode: 403, message: 'Permisos insuficientes: faltan users.view' },
          403,
        ),
      ),
    );

    await expect(apiClient.get('/users')).rejects.toMatchObject({
      name: 'ApiError',
      statusCode: 403,
      message: expect.stringContaining('users.view') as unknown as string,
    });
  });

  it('conserva los errores por campo que envía el backend', async () => {
    authenticate();
    fetchMock.mockResolvedValue(
      jsonResponse(
        {
          statusCode: 400,
          message: 'Datos inválidos',
          errors: { validation: ['correo inválido'] },
        },
        400,
      ),
    );

    await expect(apiClient.post('/users', {})).rejects.toMatchObject({
      statusCode: 400,
      fieldErrors: { validation: ['correo inválido'] },
    });
  });

  describe('renovación de sesión', () => {
    it('renueva el token y reintenta la petición tras un 401', async () => {
      authenticate();
      fetchMock
        .mockResolvedValueOnce(jsonResponse({ statusCode: 401, message: 'Unauthorized' }, 401))
        .mockResolvedValueOnce(
          jsonResponse({
            user: {
              id: 'user-1',
              email: 'admin@redsis.com',
              fullName: 'Administrador',
              isActive: true,
              roles: [],
              modules: ALL_APP_MODULES.slice(),
              permissions: [],
            },
            tokens: { accessToken: 'access-2', refreshToken: 'refresh-2', expiresIn: 900 },
          }),
        )
        .mockResolvedValueOnce(jsonResponse({ total: 1 }));

      const result = await apiClient.get<{ total: number }>('/users');

      expect(result).toEqual({ total: 1 });
      expect(useAuthStore.getState().tokens?.accessToken).toBe('access-2');
      // El reintento debe llevar el token nuevo, no el caducado.
      const [, retryInit] = fetchMock.mock.calls[2] as [string, RequestInit];
      expect((retryInit.headers as Headers).get('Authorization')).toBe('Bearer access-2');
    });

    it('cierra la sesión cuando la renovación falla', async () => {
      authenticate();
      fetchMock
        .mockResolvedValueOnce(jsonResponse({ statusCode: 401, message: 'Unauthorized' }, 401))
        .mockResolvedValueOnce(jsonResponse({ statusCode: 401, message: 'Unauthorized' }, 401));

      await expect(apiClient.get('/users')).rejects.toThrow(/sesión expiró/);
      expect(useAuthStore.getState().isAuthenticated()).toBe(false);
    });

    it('no intenta renovar si no hay refresh token', async () => {
      fetchMock.mockResolvedValue(jsonResponse({ statusCode: 401, message: 'Unauthorized' }, 401));

      await expect(apiClient.get('/users')).rejects.toThrow(ApiError);
      // Solo la petición original: sin sesión no hay nada que renovar.
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it('no renueva ante un 401 de una petición anónima', async () => {
      fetchMock.mockResolvedValue(
        jsonResponse({ statusCode: 401, message: 'Credenciales inválidas' }, 401),
      );

      await expect(
        apiClient.anonymousPost('/auth/login', { email: 'a@b.com', password: 'mala' }),
      ).rejects.toThrow(/Credenciales inválidas/);
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it('comparte una única renovación entre peticiones simultáneas', async () => {
      authenticate();
      fetchMock.mockImplementation((path: string) => {
        if (typeof path === 'string' && path.includes('/auth/refresh')) {
          return Promise.resolve(
            jsonResponse({
              user: {
                id: 'user-1',
                email: 'admin@redsis.com',
                fullName: 'Administrador',
                isActive: true,
                roles: [],
                modules: ALL_APP_MODULES.slice(),
                permissions: [],
              },
              tokens: { accessToken: 'access-2', refreshToken: 'refresh-2', expiresIn: 900 },
            }),
          );
        }

        const accessToken = useAuthStore.getState().tokens?.accessToken;

        return Promise.resolve(
          accessToken === 'access-2'
            ? jsonResponse({ ok: true })
            : jsonResponse({ statusCode: 401, message: 'Unauthorized' }, 401),
        );
      });

      await Promise.all([apiClient.get('/users'), apiClient.get('/roles')]);

      const refreshCalls = fetchMock.mock.calls.filter(([path]) =>
        String(path).includes('/auth/refresh'),
      );
      expect(refreshCalls).toHaveLength(1);
    });
  });
});
