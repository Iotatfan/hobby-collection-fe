import type { Page } from "@playwright/test";

type JwtPayload = {
  exp: number;
  sub: string;
  role: string;
};

const base64UrlEncode = (value: string) => {
  return Buffer.from(value)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
};

export const createJwtToken = (payloadOverrides?: Partial<JwtPayload>) => {
  const header = { alg: "HS256", typ: "JWT" };
  const payload: JwtPayload = {
    exp: Math.floor(Date.now() / 1000) + 60 * 60,
    sub: "playwright-user",
    role: "manager",
    ...payloadOverrides,
  };

  return `${base64UrlEncode(JSON.stringify(header))}.${base64UrlEncode(JSON.stringify(payload))}.test-signature`;
};

export const setManagerJwt = async (page: Page) => {
  const token = createJwtToken();
  await page.addInitScript((jwtToken) => {
    window.localStorage.setItem("jwt", jwtToken);
  }, token);
};

export const clearJwt = async (page: Page) => {
  await page.addInitScript(() => {
    window.localStorage.removeItem("jwt");
  });
};
