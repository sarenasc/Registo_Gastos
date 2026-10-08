import { createHmac, timingSafeEqual } from "node:crypto";

// Sesión "stateless": la cookie lleva {id, email, exp} firmado con HMAC-SHA256
// usando AUTH_SECRET. No se guarda nada en la base; cerrar sesión = borrar cookie.
// Este módulo no importa Prisma ni next/headers para poder usarse en proxy.ts.

export const SESSION_COOKIE = "rg_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 días

export type Session = { id: string; email: string; exp: number };

function secret(): string {
  const s = process.env.AUTH_SECRET;
  if (!s || s.length < 32) {
    throw new Error("Falta AUTH_SECRET (mínimo 32 caracteres) en las variables de entorno.");
  }
  return s;
}

function sign(payload: string): string {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

export function createSessionToken(user: { id: string; email: string }): string {
  const session: Session = {
    id: user.id,
    email: user.email,
    exp: Math.floor(Date.now() / 1000) + SESSION_MAX_AGE,
  };
  const payload = Buffer.from(JSON.stringify(session)).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export function verifySessionToken(token: string | undefined | null): Session | null {
  if (!token) return null;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;

  const expected = Buffer.from(sign(payload));
  const given = Buffer.from(signature);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;

  try {
    const session = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as Session;
    if (typeof session.id !== "string" || typeof session.email !== "string") return null;
    if (typeof session.exp !== "number" || session.exp < Date.now() / 1000) return null;
    return session;
  } catch {
    return null;
  }
}

export const sessionCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: SESSION_MAX_AGE,
};
