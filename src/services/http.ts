import axios from 'axios';
import env from '@/config/env';

const AUTH_COOKIE_NAME = 'jwt';

const getCookie = (name: string) => {
  const cookie = document.cookie
    .split('; ')
    .find((item) => item.startsWith(`${encodeURIComponent(name)}=`));

  return cookie ? decodeURIComponent(cookie.substring(name.length + 1)) : '';
};

export const getAuthToken = () => getCookie(AUTH_COOKIE_NAME);

export const setAuthToken = (token: string, expiresAt?: string) => {
  const payload = decodeJwtPayload(token);
  const jwtExpiresAt = typeof payload?.exp === 'number' ? payload.exp * 1000 : undefined;
  const responseExpiresAt = expiresAt ? Date.parse(expiresAt) : undefined;
  const expirationTimes = [jwtExpiresAt, responseExpiresAt].filter(
    (value): value is number => typeof value === 'number' && !Number.isNaN(value),
  );
  const expiresAtMilliseconds = expirationTimes.length ? Math.min(...expirationTimes) : undefined;
  const expires =
    expiresAtMilliseconds !== undefined
      ? `; Max-Age=${Math.max(0, Math.floor((expiresAtMilliseconds - Date.now()) / 1000))}`
      : '';
  const secure = window.location.protocol === 'https:' ? '; Secure' : '';

  document.cookie = `${AUTH_COOKIE_NAME}=${encodeURIComponent(token)}; Path=/; SameSite=Lax${expires}${secure}`;
};

export const clearAuthToken = () => {
  document.cookie = `${AUTH_COOKIE_NAME}=; Path=/; Max-Age=0; SameSite=Lax`;
};

const decodeJwtPayload = (token: string): Record<string, unknown> | null => {
  const parts = token.split('.');
  if (parts.length !== 3) return null;

  try {
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
    const json = atob(padded);
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return null;
  }
};

export const isValidJwtToken = (token: string) => {
  if (!token) return false;

  const payload = decodeJwtPayload(token);
  if (!payload) return false;

  const exp = payload.exp;
  if (typeof exp === 'number') {
    const nowInSeconds = Math.floor(Date.now() / 1000);
    if (exp <= nowInSeconds) return false;
  }

  return true;
};

export const canManageCollection = () => {
  return isValidJwtToken(getAuthToken());
};

const http = axios.create({
  baseURL: env.apiBaseUrl,
});

export default http;
