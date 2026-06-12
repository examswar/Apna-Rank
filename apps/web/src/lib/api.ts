// API client for the Apna Rank Fastify server.
// All calls go to the same origin (/api/v1/*) — next.config.ts rewrites them
// to the API server, so the httpOnly refresh cookie survives sameSite: strict.

export interface ApiErrorBody {
  code: string;
  message: string;
}

interface ApiEnvelope<T> {
  success: boolean;
  data: T | null;
  error: ApiErrorBody | null;
}

export class ApiError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export interface AuthUser {
  id: string;
  phone: string;
  name: string;
  email?: string | null;
  role?: string;
  languagePref?: string;
  isMinor?: boolean;
}

const TOKEN_KEY = "ar_access_token";
const USER_KEY = "ar_user";

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function setSession(accessToken: string, user: AuthUser) {
  localStorage.setItem(TOKEN_KEY, accessToken);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export async function apiFetch<T>(
  path: string,
  options: { method?: string; body?: unknown } = {},
): Promise<T> {
  const token = getAccessToken();
  const res = await fetch(`/api/v1${path}`, {
    method: options.method ?? "GET",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    credentials: "include",
  });

  let json: ApiEnvelope<T> | null = null;
  try {
    json = (await res.json()) as ApiEnvelope<T>;
  } catch {
    // non-JSON response (proxy down, gateway error)
  }

  if (!res.ok || !json?.success) {
    throw new ApiError(
      json?.error?.code ?? "NETWORK_ERROR",
      json?.error?.message ?? "Server se connect nahi ho paya. Phir try karo.",
      res.status,
    );
  }

  return json.data as T;
}

export const authApi = {
  sendOtp(phone: string) {
    return apiFetch<{ message: string }>("/auth/otp/send", {
      method: "POST",
      body: { phone },
    });
  },

  verifyOtp(payload: { phone: string; otp: string; name?: string; dob?: string }) {
    return apiFetch<{ accessToken: string; user: AuthUser }>("/auth/otp/verify", {
      method: "POST",
      body: payload,
    });
  },

  logout() {
    return apiFetch<{ message: string }>("/auth/logout", { method: "POST" });
  },

  me() {
    return apiFetch<AuthUser>("/auth/me");
  },
};
