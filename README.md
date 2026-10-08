# Registro de Gastos

Aplicación personal de control de presupuesto, gastos, costos e ingresos. Next.js (App Router) + Prisma + PostgreSQL (Neon) + login propio + Vercel Blob (fotos de boletas), pensada para correr local y desplegarse en Vercel.

## Módulos

- **Login** — acceso con cuenta (correo/contraseña) con login propio (tabla `users` + cookie de sesión firmada). Toda la app está protegida: sin sesión, redirige a `/login`.
- **Registro** — registrar movimientos manuales (ingresos, costos, gastos) diarios, semanales o mensuales.
- **Dashboard** — resumen del mes, gasto por categoría, tendencia de ingresos vs. gastos, presupuesto vs. real.
- **Presupuesto** — define el presupuesto mensual por categoría y clasifica cada categoría (tipo: ingreso/costo/gasto, prioridad: alta/media/baja).
- **Consejos** — alertas automáticas (categorías sobre presupuesto o de baja prioridad con gasto) + un agente de IA que busca en internet alternativas más baratas (ej. planes de celular/internet) usando la API de Claude.

Los datos de tu Excel (`Planificacion Semanal.xlsx`, pestañas `Presupuesto 2026` y `Presupuesto 2026 REAL`) se usaron solo como **dato de muestra inicial** (`prisma/seed.ts` + `prisma/seed-data.json`) — la base de datos es la fuente de verdad desde el primer registro nuevo.

Todas las cuentas que inicien sesión ven y editan el **mismo presupuesto compartido** (pensado para un grupo familiar) — no hay datos separados por usuario, solo control de acceso.

## Requisitos

- Node.js 20+
- Una base PostgreSQL en [Neon](https://neon.com) (plan gratuito; no se pausa ni se borra por inactividad)
- Un store de [Vercel Blob](https://vercel.com/docs/storage/vercel-blob) con acceso **público** (fotos de boletas)
- Una API key de Anthropic (para el módulo de Consejos con IA)

## Variables de entorno

| Variable | Para qué |
|---|---|
| `DATABASE_URL` | Conexión a Neon **con pooler** (host con `-pooler`). La integración Vercel ↔ Neon la crea sola. |
| `DIRECT_URL` | Conexión **directa** (sin pooler), usada por `prisma migrate`. Si no existe se usa `DATABASE_URL_UNPOOLED` (la crea la integración). |
| `AUTH_SECRET` | Clave para firmar la cookie de sesión. Mínimo 32 caracteres: `openssl rand -base64 32`. |
| `AUTH_ALLOWED_EMAILS` | (Opcional) Correos autorizados a crear cuenta, separados por coma. La **primera** cuenta siempre se puede crear; después, solo estos correos. |
| `BLOB_READ_WRITE_TOKEN` | Token de Vercel Blob. Se crea solo al conectar el Blob store al proyecto. |
| `ANTHROPIC_API_KEY` | Módulo de consejos con IA. |

## Configuración local

1. Instala dependencias (ya instaladas si vienes del setup inicial):
   ```bash
   npm install
   ```
2. Copia `.env.example` a `.env.local` y completa las variables de la tabla de arriba.
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

1. En el proyecto de Vercel: **Storage → Create → Neon (Postgres)** y conéctalo al proyecto (crea `DATABASE_URL`, `DATABASE_URL_UNPOOLED`, etc.).
2. **Storage → Create → Blob** (acceso público) y conéctalo al proyecto (crea `BLOB_READ_WRITE_TOKEN`).
3. En **Settings → Environment Variables** agrega `AUTH_SECRET`, `ANTHROPIC_API_KEY` y, si quieres, `AUTH_ALLOWED_EMAILS`.
4. Redeploy. El build ejecuta `prisma migrate deploy` (`scripts/migrate.mjs`), así que las tablas se crean solas.
5. Entra a `/login` → **Crear cuenta** con tu correo (la primera cuenta no necesita autorización).

## Modelo de datos (Prisma)

- `Category` — nombre, tipo (`INGRESO`/`COSTO`/`GASTO`), prioridad (`ALTA`/`MEDIA`/`BAJA`), frecuencia habitual.
- `Movement` — cada movimiento registrado (fecha, monto, frecuencia, nota).
- `BudgetItem` — presupuesto planificado por categoría/año/mes.
- `AdviceItem` — consejos guardados (de regla o de IA), con estado (pendiente/aplicado/descartado).

- `User` — cuentas con acceso (correo + hash scrypt de la contraseña). La sesión es una cookie `httpOnly` firmada con `AUTH_SECRET` (`src/lib/auth`); `src/proxy.ts` protege todas las rutas.

## Agente de consejos con IA

`src/lib/anthropic.ts` usa el SDK oficial de Anthropic (`claude-opus-5` por defecto, configurable con `CONSEJOS_AI_MODEL`) con la herramienta de búsqueda web para investigar alternativas reales, y luego estructura los hallazgos en JSON. Se dispara manualmente desde el botón "Generar consejos con IA" en `/consejos` (consume tokens de tu API key cada vez que se usa).
