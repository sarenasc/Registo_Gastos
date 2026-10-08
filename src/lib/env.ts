// La integración de Vercel <-> Neon guarda las credenciales con sus propios
// nombres (DATABASE_URL_UNPOOLED, POSTGRES_PRISMA_URL, etc.). Esto rellena los
// nombres que usa este proyecto (DATABASE_URL, DIRECT_URL) una sola vez al
// arrancar, para no tener que duplicar variables a mano en Vercel.
// scripts/migrate.mjs aplica la misma lógica antes de `prisma migrate deploy`.
function fallback(target: string, ...sources: string[]) {
  if (process.env[target]) return;
  for (const source of sources) {
    if (process.env[source]) {
      process.env[target] = process.env[source];
      return;
    }
  }
}

fallback("DATABASE_URL", "POSTGRES_PRISMA_URL", "POSTGRES_URL");
fallback("DIRECT_URL", "DATABASE_URL_UNPOOLED", "POSTGRES_URL_NON_POOLING", "DATABASE_URL");
