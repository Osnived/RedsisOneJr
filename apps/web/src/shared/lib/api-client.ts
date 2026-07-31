import type { ApiErrorResponse, LoginResponse } from '@redsis/contracts';
import { env } from './env';
import { useAuthStore } from '@/stores/auth.store';

/** Error de API con la forma que devuelve el backend, para que la UI pueda reaccionar. */
export class ApiError extends Error {
  readonly statusCode: number;
  readonly fieldErrors: Record<string, string[]> | undefined;

  constructor(statusCode: number, message: string, fieldErrors?: Record<string, string[]>) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.fieldErrors = fieldErrors;
  }
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  body?: unknown;
  /** Omite el token y no intenta renovar la sesión. Se usa en login y refresh. */
  anonymous?: boolean;
  signal?: AbortSignal;
}

/**
 * Única puerta de salida hacia el backend.
 *
 * Ningún componente llama a `fetch` directamente (AGENTS.md): así el manejo de
 * tokens, la renovación y el formato de error existen en un solo lugar.
 */
async function request<TResponse>(path: string, options: RequestOptions = {}): Promise<TResponse> {
  const response = await send(path, options);

  // Un 401 en una petición autenticada significa que el access token caducó:
  // se renueva una sola vez y se reintenta. Si vuelve a fallar, se cierra sesión.
  if (response.status === 401 && !options.anonymous) {
    const renewed = await renewSession();

    if (!renewed) {
      useAuthStore.getState().clearSession();
      throw new ApiError(401, 'La sesión expiró. Vuelve a iniciar sesión.');
    }

    const retried = await send(path, options);
    return parse<TResponse>(retried);
  }

  return parse<TResponse>(response);
}

function send(path: string, options: RequestOptions): Promise<Response> {
  const headers = new Headers({ Accept: 'application/json' });

  if (options.body !== undefined) {
    headers.set('Content-Type', 'application/json');
  }

  if (!options.anonymous) {
    const accessToken = useAuthStore.getState().tokens?.accessToken;

    if (accessToken) {
      headers.set('Authorization', `Bearer ${accessToken}`);
    }
  }

  const requestInit: RequestInit = {
    method: options.method ?? 'GET',
    headers,
  };

  if (options.body !== undefined) {
    requestInit.body = JSON.stringify(options.body);
  }

  if (options.signal) {
    requestInit.signal = options.signal;
  }

  return fetch(`${env.VITE_API_URL}${path}`, requestInit);
}

async function parse<TResponse>(response: Response): Promise<TResponse> {
  if (response.status === 204) {
    return undefined as TResponse;
  }

  const text = await response.text();
  const payload: unknown = text.length > 0 ? JSON.parse(text) : null;

  if (!response.ok) {
    const error = payload as ApiErrorResponse | null;
    throw new ApiError(
      response.status,
      error?.message ?? 'No se pudo completar la operación',
      error?.errors,
    );
  }

  return payload as TResponse;
}

/**
 * Renovación compartida: si llegan varios 401 a la vez, todos esperan la misma
 * petición de refresco en lugar de lanzar una cada uno (lo que revocaría
 * el token recién emitido por la rotación).
 */
let pendingRenewal: Promise<boolean> | null = null;

function renewSession(): Promise<boolean> {
  pendingRenewal ??= performRenewal().finally(() => {
    pendingRenewal = null;
  });

  return pendingRenewal;
}

async function performRenewal(): Promise<boolean> {
  const refreshToken = useAuthStore.getState().tokens?.refreshToken;

  if (!refreshToken) {
    return false;
  }

  try {
    const response = await send('/auth/refresh', {
      method: 'POST',
      body: { refreshToken },
      anonymous: true,
    });

    if (!response.ok) {
      return false;
    }

    const renewed = (await response.json()) as LoginResponse;
    useAuthStore.getState().setSession(renewed.user, renewed.tokens);
    return true;
  } catch {
    return false;
  }
}

export const apiClient = {
  get: <TResponse>(path: string, signal?: AbortSignal): Promise<TResponse> =>
    request<TResponse>(path, signal ? { signal } : {}),

  post: <TResponse>(path: string, body?: unknown): Promise<TResponse> =>
    request<TResponse>(path, { method: 'POST', body }),

  patch: <TResponse>(path: string, body?: unknown): Promise<TResponse> =>
    request<TResponse>(path, { method: 'PATCH', body }),

  delete: <TResponse>(path: string): Promise<TResponse> =>
    request<TResponse>(path, { method: 'DELETE' }),

  /** Peticiones sin sesión: login y refresco. */
  anonymousPost: <TResponse>(path: string, body: unknown): Promise<TResponse> =>
    request<TResponse>(path, { method: 'POST', body, anonymous: true }),
};
