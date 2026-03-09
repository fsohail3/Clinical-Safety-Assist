import { API_BASE_URL } from "@/config";

let _isAuthenticated = false;

export function setAuthenticated(val: boolean) {
  _isAuthenticated = val;
}

export function isAuthenticatedFlag() {
  return _isAuthenticated;
}

export async function apiRequest<T = any>(
  method: string,
  path: string,
  body?: any
): Promise<T> {
  const headers: Record<string, string> = {};

  if (body) {
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    credentials: "include",
  });

  if (!res.ok) {
    if (res.status === 401) {
      _isAuthenticated = false;
    }
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || `Request failed with status ${res.status}`);
  }

  const text = await res.text();
  if (!text) return {} as T;

  try {
    return JSON.parse(text);
  } catch {
    return {} as T;
  }
}

export async function fetchUser() {
  const user = await apiRequest<{
    id: string;
    email?: string;
    firstName?: string;
    lastName?: string;
    profileImageUrl?: string;
  }>("GET", "/api/auth/user");
  _isAuthenticated = true;
  return user;
}

export async function fetchUsage() {
  return apiRequest<{
    freeQueriesUsed: number;
    hasSubscription: boolean;
    totalQueriesUsed: number;
  }>("GET", "/api/me/usage");
}
