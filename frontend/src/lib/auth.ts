import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const SESSION_COOKIE = "loom_session";

type JwtPayload = {
  exp?: number;
  sub?: string;
};

function decodeJwtPayload(token: string): JwtPayload | null {
  try {
    const encodedPayload = token.split(".")[1];

    if (!encodedPayload) {
      return null;
    }

    return JSON.parse(
      Buffer.from(encodedPayload, "base64url").toString("utf8"),
    ) as JwtPayload;
  } catch {
    return null;
  }
}

export function getTokenExpiration(token: string): number | null {
  const expiration = decodeJwtPayload(token)?.exp;
  return typeof expiration === "number" ? expiration : null;
}

export function isTokenActive(token: string | undefined): token is string {
  if (!token) {
    return false;
  }

  const expiration = getTokenExpiration(token);
  return expiration !== null && expiration * 1000 > Date.now();
}

export async function getSessionToken(): Promise<string | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  return isTokenActive(token) ? token : null;
}

export function attachSessionCookie(response: NextResponse, token: string) {
  const expiration = getTokenExpiration(token);

  if (!expiration || expiration * 1000 <= Date.now()) {
    throw new Error("The backend returned an invalid or expired token.");
  }

  response.cookies.set({
    name: SESSION_COOKIE,
    value: token,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: new Date(expiration * 1000),
  });
}

export function clearSessionCookie(response: NextResponse) {
  response.cookies.set({
    name: SESSION_COOKIE,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}
