# Registro de Gastos

Aplicación personal de control de presupuesto, gastos, costos e ingresos. Next.js (App Router) + Prisma + PostgreSQL (Supabase) + Supabase Auth, pensada para correr local y desplegarse en Vercel.

## Módulos

- **Login** — acceso con cuenta (correo/contraseña) vía Supabase Auth. Toda la app está protegida: sin sesión, redirige a `/login`.
- **Registro** — registrar movimientos manuales (ingresos, costos, gastos) diarios, semanales o mensuales.
- **Dashboard** — resumen del mes, gasto por categoría, tendencia de ingresos vs. gastos, presupuesto vs. real.
- **Presupuesto** — define el presupuesto mensual por categoría y clasifica cada categoría (tipo: ingreso/costo/gasto, prioridad: alta/media/baja).
- **Consejos** — alertas automáticas (categorías sobre presupuesto o de baja prioridad con gasto) + un agente de IA que busca en internet alternativas más baratas (ej. planes de celular/internet) usando la API de Claude.

Los datos de tu Excel (`Planificacion Semanal.xlsx`, pestañas `Presupuesto 2026` y `Presupuesto 2026 REAL`) se usaron solo como **dato de muestra inicial** (`prisma/seed.ts` + `prisma/seed-data.json`) — la base de datos es la fuente de verdad desde el primer registro nuevo.

Todas las cuentas que inicien sesión ven y editan el **mismo presupuesto compartido** (pensado para un grupo familiar) — no hay datos separados por usuario, solo control de acceso.

## Requisitos

- Node.js 20+
- Un proyecto de [Supabase](https://supabase.com) (Postgres + Auth)
- Una API key de Anthropic (para el módulo de Consejos con IA)

## Configuración de Supabase (una vez)

1. Crea un proyecto en [supabase.com](https://supabase.com/dashboard).
2. **Project Settings → Database → Connection string**: copia la conexión con **pooler** (puerto 6543, modo `Transaction`) para `DATABASE_URL`, y la conexión **directa** (puerto 5432) para `DIRECT_URL`.
3. **Project Settings → API**: copia `Project URL` (`NEXT_PUBLIC_SUPABASE_URL`) y `anon public key` (`NEXT_PUBLIC_SUPABASE_ANON_KEY`).
4. **Authentication → URL Configuration**: agrega `http://localhost:3000/auth/callback` y, cuando tengas el dominio de Vercel, `https://<tu-dominio>.vercel.app/auth/callback` en *Redirect URLs*.
5. (Opcional, recomendado para uso familiar) **Authentication → Providers → Email**: desactiva "Confirm email" si quieres que las cuentas nuevas puedan entrar sin confirmar por correo, o déjalo activo para mayor seguridad.

## Configuración local

1. Instala dependencias (ya instaladas si vienes del setup inicial):
   ```bash
   npm install
   ```
2. Copia `.env.example` a `.env.local` y completa `DATABASE_URL`, `DIRECT_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` y `ANTHROPIC_API_KEY`.
3. Aplica el esquema a la base de datos:
   ```bash
   npx prisma migrate dev --name init
   ```
4. Carga los datos de muestra desde el Excel (opcional pero recomendado la primera vez):
   ```bash
   npx tsx prisma/seed.ts
   ```
5. Levanta el servidor de desarrollo:
   ```bash
   npm run dev
   ```
   Abre [http://localhost:3000](http://localhost:3000) y crea tu cuenta desde la pestaña "Crear cuenta" del login.

## Despliegue en Vercel

Este repo se sube a GitHub listo para importar en Vercel:

1. En Vercel: **Add New → Project** → importa `sarenasc/Registo_Gastos`.
2. En **Settings → Environment Variables** agrega (Production y Preview): `DATABASE_URL`, `DIRECT_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `ANTHROPIC_API_KEY`.
3. Después del primer deploy, agrega la URL de producción a los *Redirect URLs* de Supabase (paso 4 de arriba).
4. Corre las migraciones contra la base de Supabase (una vez, desde tu máquina con `.env.local` apuntando a Supabase): `npx prisma migrate deploy`.

## Modelo de datos (Prisma)

- `Category` — nombre, tipo (`INGRESO`/`COSTO`/`GASTO`), prioridad (`ALTA`/`MEDIA`/`BAJA`), frecuencia habitual.
- `Movement` — cada movimiento registrado (fecha, monto, frecuencia, nota).
- `BudgetItem` — presupuesto planificado por categoría/año/mes.
- `AdviceItem` — consejos guardados (de regla o de IA), con estado (pendiente/aplicado/descartado).

La autenticación (usuarios, sesiones) la maneja Supabase Auth directamente — no hay tabla de usuarios propia en Prisma.

## Agente de consejos con IA

`src/lib/anthropic.ts` usa el SDK oficial de Anthropic (`claude-opus-5` por defecto, configurable con `CONSEJOS_AI_MODEL`) con la herramienta de búsqueda web para investigar alternativas reales, y luego estructura los hallazgos en JSON. Se dispara manualmente desde el botón "Generar consejos con IA" en `/consejos` (consume tokens de tu API key cada vez que se usa).
