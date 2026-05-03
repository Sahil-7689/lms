// ─── Auth Service ─────────────────────────────────────────────────────────────
//
// Wraps all /api/v1/users/* endpoints and manages token + user persistence.
//
// ─────────────────────────────────────────────────────────────────────────────

import * as SecureStore from 'expo-secure-store';
import apiClient, { ApiClientError } from './apiClient';
import { ENDPOINTS, STORAGE_KEYS } from '../config/api';
import type {
  User,
  AuthResponse,
  LoginPayload,
  RegisterPayload,
  ApiAuthSuccess,
} from '../types/auth';

class AuthService {
  // ── Token helpers (thin wrappers so the rest of the app never touches SecureStore directly) ──

  async getAccessToken(): Promise<string | null> {
    return apiClient.getAccessToken();
  }

  async storeTokens(accessToken: string, refreshToken: string): Promise<void> {
    return apiClient.storeTokens(accessToken, refreshToken);
  }

  async clearTokens(): Promise<void> {
    return apiClient.clearTokens();
  }

  // ── User persistence ──────────────────────────────────────────────────────

  async storeUser(user: User): Promise<void> {
    try {
      await SecureStore.setItemAsync(STORAGE_KEYS.USER, JSON.stringify(user));
    } catch (err) {
      console.warn('[AuthService] Failed to persist user:', err);
    }
  }

  async getStoredUser(): Promise<User | null> {
    try {
      const raw = await SecureStore.getItemAsync(STORAGE_KEYS.USER);
      if (!raw) return null;
      return JSON.parse(raw) as User;
    } catch {
      return null;
    }
  }

  // ── Login ─────────────────────────────────────────────────────────────────
  // POST /api/v1/users/login

  async login(email: string, password: string): Promise<AuthResponse> {
    try {
      const payload: LoginPayload = { email, password };
      const data = await apiClient.post<ApiAuthSuccess>(ENDPOINTS.LOGIN, payload, {
        skipAuth: true, // no token yet
      });

      const responseData = data as any;
      // Handle FreeAPI's nested { data: { user, accessToken, refreshToken } } structure
      const payloadData = responseData.data ? responseData.data : responseData;

      const accessToken = payloadData.token ?? payloadData.accessToken ?? '';
      await this.storeTokens(accessToken, payloadData.refreshToken);
      await this.storeUser(payloadData.user);

      return { success: true, user: payloadData.user };
    } catch (err) {
      const message = err instanceof ApiClientError
        ? err.message
        : 'Network error. Please check your connection.';
      return { success: false, error: message };
    }
  }

  // ── Register ──────────────────────────────────────────────────────────────
  // POST /api/v1/users/register

  async register(username: string, email: string, password: string): Promise<AuthResponse> {
    try {
      const payload: RegisterPayload = { username, email, password };
      const data = await apiClient.post<ApiAuthSuccess>(ENDPOINTS.REGISTER, payload, {
        skipAuth: true,
      });

      const responseData = data as any;
      const payloadData = responseData.data ? responseData.data : responseData;

      // FreeAPI does not return tokens on register (requires email verification)
      const accessToken = payloadData.token ?? payloadData.accessToken;
      if (accessToken) {
        await this.storeTokens(accessToken, payloadData.refreshToken);
        await this.storeUser(payloadData.user);
      }

      return { success: true, user: payloadData.user };
    } catch (err) {
      const message = err instanceof ApiClientError
        ? err.message
        : 'Network error. Please check your connection.';
      return { success: false, error: message };
    }
  }

  // ── Fetch fresh profile ───────────────────────────────────────────────────
  // GET /api/v1/users/profile   (requires valid access token)

  async fetchProfile(): Promise<User | null> {
    try {
      const data = await apiClient.get<any>(ENDPOINTS.PROFILE);
      const responseData = data.data ? data.data : data;
      // Some APIs wrap user, others return it directly
      const user = responseData.user ?? responseData;
      await this.storeUser(user);
      return user;
    } catch {
      return null;
    }
  }

  // ── Validate token + auto-login ───────────────────────────────────────────
  // Returns the user if the stored token is valid (or was refreshed successfully)

  async restoreSession(): Promise<User | null> {
    const token = await this.getAccessToken();
    if (!token) return null;

    // Try to fetch profile with the stored token.
    // apiClient already handles 401 → refresh internally.
    const user = await this.fetchProfile();
    if (user) return user;

    // Profile fetch failed even after refresh attempt — use cached user as
    // a fallback (offline mode) if token still exists after the attempt.
    const stillHasToken = await this.getAccessToken();
    if (stillHasToken) {
      return this.getStoredUser();
    }

    return null;
  }

  // ── Update Profile Picture ────────────────────────────────────────────────
  // Updates the user's avatar locally in AsyncStorage

  async updateAvatar(uri: string): Promise<User | null> {
    const user = await this.getStoredUser();
    if (!user) return null;
    const updatedUser = { ...user, avatar: uri };
    await this.storeUser(updatedUser);
    return updatedUser;
  }

  // ── Logout ────────────────────────────────────────────────────────────────
  // POST /api/v1/users/logout  (best-effort; always clears local data)

  async logout(): Promise<void> {
    try {
      await apiClient.post(ENDPOINTS.LOGOUT);
    } catch {
      // Server-side logout is best-effort
    } finally {
      await this.clearTokens();
    }
  }
}

export default new AuthService();
export type { User, AuthResponse };
