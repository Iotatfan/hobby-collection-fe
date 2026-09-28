import http from '@/services/http';

type AdminTokenResponse = {
  token?: unknown;
  access_token?: unknown;
  data?:
    | {
        token?: unknown;
        access_token?: unknown;
        expires_at?: unknown;
      }
    | string;
};

const getTokenFromResponse = (response: { data?: AdminTokenResponse }) => {
  const body = response.data;
  const nestedData = body?.data;

  const token =
    body?.token ??
    body?.access_token ??
    (typeof nestedData === 'object' ? (nestedData.token ?? nestedData.access_token) : nestedData);

  if (typeof token !== 'string' || !token) {
    throw new Error('The admin login response did not contain a JWT token.');
  }

  const expiresAt =
    typeof nestedData === 'object' && typeof nestedData.expires_at === 'string'
      ? nestedData.expires_at
      : undefined;

  return { token, expiresAt };
};

const login = async (password: string) => {
  const response = await http.post('/admin/token', { password });
  return getTokenFromResponse(response);
};

const authServices = { login };

export default authServices;
