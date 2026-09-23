-- CreateEnum
CREATE TYPE "EstadoPresupuesto" AS ENUM ('ABIERTO', 'CERRADO');

-- CreateTable
CREATE TABLE "budget_plans" (
    "id" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "version" INTEGER NOT NULL,
    "status" "EstadoPresupuesto" NOT NULL DEFAULT 'ABIERTO',
    "label" TEXT,
    "closedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "budget_plans_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "budget_plans_year_version_key" ON "budget_plans"("year", "version");

-- Backfill: un plan v1 (ABIERTO) por cada año que ya tenga budget_items,
-- para no perder los montos ya cargados/editados.
INSERT INTO "budget_plans" ("id", "year", "version", "status", "createdAt")
SELECT gen_random_uuid()::text, "year", 1, 'ABIERTO', CURRENT_TIMESTAMP
FROM (SELECT DISTINCT "year" FROM "budget_items") t;

-- AlterTable: agregar planId (nullable primero para poder backfillear)
ALTER TABLE "budget_items" ADD COLUMN "planId" TEXT;

-- Backfill de planId en las filas existentes
UPDATE "budget_items" bi
SET "planId" = bp."id"
FROM "budget_plans" bp
WHERE bp."year" = bi."year" AND bp."version" = 1;

-- Ahora que todas las filas tienen planId, se vuelve obligatorio
ALTER TABLE "budget_items" ALTER COLUMN "planId" SET NOT NULL;

-- DropIndex (constraint anterior, ahora reemplazada por una que incluye planId)
DROP INDEX "budget_items_categoryId_year_month_key";

-- CreateIndex
CREATE UNIQUE INDEX "budget_items_planId_categoryId_month_key" ON "budget_items"("planId", "categoryId", "month");

-- AddForeignKey
ALTER TABLE "budget_items" ADD CONSTRAINT "budget_items_planId_fkey" FOREIGN KEY ("planId") REFERENCES "budget_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;
