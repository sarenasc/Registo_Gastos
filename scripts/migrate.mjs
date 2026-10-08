// Aplica las migraciones pendientes de Prisma a la base (Neon) durante el build
// de Vercel, así no hay que correr `prisma migrate deploy` a mano.
// Rellena DATABASE_URL / DIRECT_URL desde los nombres que crea la integración
// Vercel <-> Neon (misma lógica que src/lib/env.ts).
import { spawnSync } from "node:child_process";

function fallback(target, ...sources) {
  if (process.env[target]) return;
  const source = sources.find((s) => process.env[s]);
  if (source) process.env[target] = process.env[source];
}

fallback("DATABASE_URL", "POSTGRES_PRISMA_URL", "POSTGRES_URL");
fallback("DIRECT_URL", "DATABASE_URL_UNPOOLED", "POSTGRES_URL_NON_POOLING", "DATABASE_URL");

if (!process.env.DATABASE_URL) {
  console.warn("[migrate] Sin DATABASE_URL: se omiten las migraciones.");
  process.exit(0);
}

const result = spawnSync("npx", ["prisma", "migrate", "deploy"], { stdio: "inherit", shell: process.platform === "win32" });
process.exit(result.status ?? 1);
