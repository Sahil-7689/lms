// ─── HTTP Client with automatic token injection & refresh ─────────────────────
//
// Usage:
//   import apiClient from '../services/apiClient';
//   const data = await apiClient.get('/api/v1/users/profile');
//   const data = await apiClient.post('/api/v1/users/login', { email, password });
//
// ─────────────────────────────────────────────────────────────────────────────

import * as SecureStore from 'expo-secure-store';
import { API_BASE_URL, API_TIMEOUT_MS, ENDPOINTS, STORAGE_KEYS } from '../config/api';

// ─── Internal helpers ─────────────────────────────────────────────────────────

async function getAccessToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(STORAGE_KEYS.ACCESS_TOKEN);
  } catch {
    return null;
  }
}

async function getRefreshToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(STORAGE_KEYS.REFRESH_TOKEN);
  } catch {
    return null;
  }
}

async function storeTokens(accessToken: string, refreshToken: string): Promise<void> {
  await SecureStore.setItemAsync(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
  await SecureStore.setItemAsync(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
}

async function clearTokens(): Promise<void> {
  await SecureStore.deleteItemAsync(STORAGE_KEYS.ACCESS_TOKEN);
  await SecureStore.deleteItemAsync(STORAGE_KEYS.REFRESH_TOKEN);
  await SecureStore.deleteItemAsync(STORAGE_KEYS.USER);
}

// Prevent multiple simultaneous refresh calls
let isRefreshing = false;
let refreshCallbacks: Array<(token: string | null) => void> = [];

function onRefreshComplete(token: string | null) {
  refreshCallbacks.forEach(cb => cb(token));
  refreshCallbacks = [];
}

async function attemptTokenRefresh(): Promise<string | null> {
  if (isRefreshing) {
    // Queue and wait for the ongoing refresh
    return new Promise(resolve => {
      refreshCallbacks.push(resolve);
    });
  }

  isRefreshing = true;
  try {
    const refreshToken = await getRefreshToken();
    if (!refreshToken) {
      onRefreshComplete(null);
      return null;
    }

    const response = await fetch(`${API_BASE_URL}${ENDPOINTS.REFRESH}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      await clearTokens();
      onRefreshComplete(null);
      return null;
    }

    const data = await response.json();
    const responseData = data.data ? data.data : data;
    const newAccessToken: string = responseData.token ?? responseData.accessToken;
    const newRefreshToken: string = responseData.refreshToken ?? refreshToken;

    await storeTokens(newAccessToken, newRefreshToken);
    onRefreshComplete(newAccessToken);
    return newAccessToken;
  } catch {
    await clearTokens();
    onRefreshComplete(null);
    return null;
  } finally {
    isRefreshing = false;
  }
}

// ─── Core fetch wrapper ───────────────────────────────────────────────────────

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  headers?: Record<string, string>;
  /** Skip auth header (used for login / register) */
  skipAuth?: boolean;
  /** Retry counter */
  _retryCount?: number;
}

const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 1000;

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function request<T = unknown>(
  endpoint: string,
  options: RequestOptions = {},
): Promise<T> {
  const { method = 'GET', body, headers = {}, skipAuth = false, _retryCount = 0 } = options;

  // Build headers
  const reqHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...headers,
  };

  if (!skipAuth) {
    const token = await getAccessToken();
    if (token) {
      reqHeaders['Authorization'] = `Bearer ${token}`;
    }
  }

  // Timeout via AbortController
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

  let response: Response | undefined;
  let fetchError: any;

  try {
    response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method,
      headers: reqHeaders,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
  } catch (err: any) {
    fetchError = err;
  } finally {
    clearTimeout(timer);
  }

  // Handle Fetch Errors (e.g. Network offline, Timeout)
  if (!response) {
    const isTimeout = fetchError?.name === 'AbortError';
    const errorMsg = isTimeout 
      ? 'Request timed out. Please check your connection and try again.' 
      : 'Network error. Please ensure you are connected to the internet.';

    if (_retryCount < MAX_RETRIES) {
      await sleep(RETRY_DELAY_MS);
      return request<T>(endpoint, { ...options, _retryCount: _retryCount + 1 });
    }
    throw new ApiClientError(errorMsg, 0, null);
  }

  // ── 401 → try silent token refresh ───────────────────────────────────────
  if (response.status === 401 && !skipAuth && _retryCount === 0) {
    const newToken = await attemptTokenRefresh();
    if (newToken) {
      // Retry with fresh token (using retry count 1 to prevent infinite 401 loops)
      return request<T>(endpoint, { ...options, _retryCount: 1 });
    }
    // Refresh failed — caller will receive the 401 error
  }

  // ── 5xx Server Errors → Retry ──────────────────────────────────────────
  if (response.status >= 500 && _retryCount < MAX_RETRIES) {
    await sleep(RETRY_DELAY_MS);
    return request<T>(endpoint, { ...options, _retryCount: _retryCount + 1 });
  }

  // ── Parse body ────────────────────────────────────────────────────────────
  const contentType = response.headers.get('content-type') ?? '';
  let data: any = null;
  try {
    data = contentType.includes('application/json')
      ? await response.json()
      : await response.text();
  } catch (e) {
    data = null;
  }

  if (!response.ok) {
    const errData = data as any;
    let message = errData?.message ?? errData?.error ?? `HTTP ${response.status} Error`;
    
    // Extract validation errors from FreeAPI structure if they exist
    if (Array.isArray(errData?.errors) && errData.errors.length > 0) {
      const errorMessages = errData.errors.map((errObj: Record<string, string>) => {
        return Object.values(errObj)[0]; // Extract the error string
      });
      message = errorMessages.join('\n');
    }

    // Enhance user-friendly messages for common status codes
    if (response.status === 403) {
      message = "You don't have permission to access this resource.";
    } else if (response.status === 404) {
      message = "The requested resource could not be found.";
    } else if (response.status >= 500) {
      message = "Our servers are currently experiencing issues. Please try again later.";
    }

    throw new ApiClientError(message, response.status, data);
  }

  return data as T;
}

// ─── Custom error class ───────────────────────────────────────────────────────

export class ApiClientError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly data: unknown,
  ) {
    super(message);
    this.name = 'ApiClientError';
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

const apiClient = {
  get: <T = unknown>(endpoint: string, opts?: Omit<RequestOptions, 'method' | 'body'>) =>
    request<T>(endpoint, { ...opts, method: 'GET' }),

  post: <T = unknown>(endpoint: string, body?: unknown, opts?: Omit<RequestOptions, 'method' | 'body'>) =>
    request<T>(endpoint, { ...opts, method: 'POST', body }),

  put: <T = unknown>(endpoint: string, body?: unknown, opts?: Omit<RequestOptions, 'method' | 'body'>) =>
    request<T>(endpoint, { ...opts, method: 'PUT', body }),

  patch: <T = unknown>(endpoint: string, body?: unknown, opts?: Omit<RequestOptions, 'method' | 'body'>) =>
    request<T>(endpoint, { ...opts, method: 'PATCH', body }),

  delete: <T = unknown>(endpoint: string, opts?: Omit<RequestOptions, 'method' | 'body'>) =>
    request<T>(endpoint, { ...opts, method: 'DELETE' }),

  // Expose token helpers so AuthService / AuthContext can use them
  storeTokens,
  clearTokens,
  getAccessToken,
  getRefreshToken,
};

export default apiClient;
