import "server-only";
import { cookies } from "next/headers";
import { sealData, unsealData } from "iron-session";
import { SESSION_COOKIE } from "./session-cookie";

export type SessionData = {
  userId?: string;
};

const MAX_AGE = 60 * 60 * 24 * 30; // 30 días

function password() {
  const value = process.env.SESSION_PASSWORD;
  if (!value || value.length < 32) {
    throw new Error("SESSION_PASSWORD debe tener al menos 32 caracteres");
  }
  return value;
}

export async function getSession(): Promise<SessionData> {
  const cookie = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!cookie) return {};
  try {
    return await unsealData<SessionData>(cookie, { password: password(), ttl: MAX_AGE });
  } catch {
    return {};
  }
}

export async function createSession(userId: string) {
  const sealed = await sealData({ userId } satisfies SessionData, {
    password: password(),
    ttl: MAX_AGE,
  });
  (await cookies()).set(SESSION_COOKIE, sealed, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function deleteSession() {
  (await cookies()).delete(SESSION_COOKIE);
}
