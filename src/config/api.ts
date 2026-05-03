// ─── API Configuration ────────────────────────────────────────────────────────
// Replace API_BASE_URL with your actual backend URL.
// For local development with Expo on a physical device, use your machine's
// LAN IP (e.g. http://192.168.1.10:3000). For Android emulator use
// http://10.0.2.2:3000. For iOS simulator use http://localhost:3000.
// ─────────────────────────────────────────────────────────────────────────────

export const API_BASE_URL = 'https://api.freeapi.app';

export const API_TIMEOUT_MS = 15_000; // 15 seconds

export const ENDPOINTS = {
  // Auth
  LOGIN:    '/api/v1/users/login',
  REGISTER: '/api/v1/users/register',
  LOGOUT:   '/api/v1/users/logout',
  REFRESH:  '/api/v1/users/refresh-token',
  PROFILE:  '/api/v1/users/current-user',
} as const;

/** SecureStore key names */
export const STORAGE_KEYS = {
  ACCESS_TOKEN:  'lms_access_token',
  REFRESH_TOKEN: 'lms_refresh_token',
  USER:          'lms_user',
} as const;
