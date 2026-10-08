"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { createSessionToken, SESSION_COOKIE, sessionCookieOptions } from "@/lib/auth/session";

export type AuthState = { error?: string; info?: string } | undefined;

const credencialesSchema = z.object({
  email: z.string().trim().toLowerCase().email("Correo inválido."),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres."),
  next: z.string().optional(),
});

// Solo se aceptan rutas internas para evitar redirecciones a sitios externos.
function destinoSeguro(next: string | undefined) {
  return next && next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";
}

async function abrirSesion(user: { id: string; email: string }) {
  const store = await cookies();
  store.set(SESSION_COOKIE, createSessionToken(user), sessionCookieOptions);
}

function leer(formData: FormData) {
  return credencialesSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    next: formData.get("next") || undefined,
  });
}

export async function iniciarSesion(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = leer(formData);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  const { email, password, next } = parsed.data;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return { error: "Correo o contraseña incorrectos." };
  }

  await abrirSesion(user);
  redirect(destinoSeguro(next));
}

// Crear cuenta solo está permitido si:
//  - todavía no existe ninguna cuenta (primer uso), o
//  - el correo está en AUTH_ALLOWED_EMAILS (lista separada por comas).
// Así nadie de afuera puede registrarse y ver el presupuesto familiar.
function correoPermitido(email: string) {
  const lista = (process.env.AUTH_ALLOWED_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return lista.includes(email);
}

export async function crearCuenta(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = leer(formData);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  const { email, password, next } = parsed.data;

  const total = await prisma.user.count();
  if (total > 0 && !correoPermitido(email)) {
    return { error: "Este correo no está autorizado para crear una cuenta." };
  }
  if (await prisma.user.findUnique({ where: { email } })) {
    return { error: "Ya existe una cuenta con ese correo. Inicia sesión." };
  }

  const user = await prisma.user.create({
    data: { email, passwordHash: await hashPassword(password) },
  });

  await abrirSesion(user);
  redirect(destinoSeguro(next));
}

export async function cerrarSesion() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
  redirect("/login");
}
