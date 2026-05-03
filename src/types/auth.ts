// ─── Shared TypeScript types for authentication ───────────────────────────────

export interface User {
  id?: string;
  _id?: string; // FreeAPI uses _id
  email: string;
  username: string;
  role?: string;
  avatar?: string;
  createdAt?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse {
  success: boolean;
  user?: User;
  error?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  username: string;
  email: string;
  password: string;
}

// Shape of a successful login/register API response body
export interface ApiAuthSuccess {
  token: string;         // access token (some APIs call it "accessToken")
  accessToken?: string;  // alternative key
  refreshToken: string;
  user: User;
}

// Shape of a failed API response body
export interface ApiError {
  message?: string;
  error?: string;
}
