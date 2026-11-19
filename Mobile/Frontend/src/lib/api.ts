import { API_URL } from './config';
import { supabase } from './supabase';

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export type Query = Record<string, string | number | boolean | null | undefined>;
const TIMEOUT_MS = 20_000;

async function request<T>(method: string, path: string, body?: unknown, query?: Query): Promise<T> {
  let url = API_URL + path;
  if (query) {
    const qs = Object.entries(query)
      .filter(([, v]) => v !== undefined && v !== null && v !== '')
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
      .join('&');
    if (qs) url += `?${qs}`;
  }
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (supabase) {
    const { data } = await supabase.auth.getSession();
    if (data.session) headers.Authorization = `Bearer ${data.session.access_token}`;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  let res: Response;
  try {
    res = await fetch(url, { method, headers, body: body !== undefined ? JSON.stringify(body) : undefined, signal: controller.signal });
  } catch (err) {
    const timedOut = (err as Error).name === 'AbortError';
    throw new ApiError(0, timedOut ? 'timeout' : 'network_error', timedOut ? 'The store is taking too long to respond. Please try again.' : "We couldn't reach the store. Check your connection and try again.");
  } finally {
    clearTimeout(timer);
  }
  if (res.status === 204) return undefined as T;
  const json = await res.json().catch(() => null);
  if (!res.ok) {
    const e = json?.error;
    throw new ApiError(res.status, e?.code ?? 'error', e?.message ?? `Request failed (${res.status})`, e?.details);
  }
  return json as T;
}

export const api = {
  get: <T>(path: string, query?: Query) => request<T>('GET', path, undefined, query),
  post: <T>(path: string, body: unknown = {}) => request<T>('POST', path, body),
  put: <T>(path: string, body: unknown = {}) => request<T>('PUT', path, body),
  patch: <T>(path: string, body: unknown = {}) => request<T>('PATCH', path, body),
  del: <T = void>(path: string) => request<T>('DELETE', path),
};

export function errorMessage(e: unknown): string {
  if (e instanceof Error && e.message) return e.message;
  return 'Something went wrong. Please try again.';
}

export const isNotFound = (e: unknown) => e instanceof ApiError && e.status === 404;
