import { setAuthTokenGetter } from "@workspace/api-client-react";

const TOKEN_KEY = "kana_admin_token";

export function getAuthToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setAuthToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearAuthToken() {
  localStorage.removeItem(TOKEN_KEY);
}

// Register the getter so API client automatically attaches it
setAuthTokenGetter(getAuthToken);
