// La integración de Vercel <-> Supabase guarda las credenciales con sus propios
// nombres (POSTGRES_PRISMA_URL, etc.) en vez de los que usa este proyecto
// (DATABASE_URL, etc.). Esto rellena esos nombres una sola vez, al arrancar el
// servidor, para no tener que duplicar variables de entorno a mano en Vercel.
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
fallback("DIRECT_URL", "POSTGRES_URL_NON_POOLING");
