-- CreateEnum
CREATE TYPE "TipoCategoria" AS ENUM ('INGRESO', 'COSTO', 'GASTO');

-- CreateEnum
CREATE TYPE "Prioridad" AS ENUM ('ALTA', 'MEDIA', 'BAJA');

-- CreateEnum
CREATE TYPE "Frecuencia" AS ENUM ('DIARIA', 'SEMANAL', 'MENSUAL', 'ANUAL', 'PUNTUAL');

-- CreateEnum
CREATE TYPE "FuenteConsejo" AS ENUM ('REGLA', 'IA');

-- CreateEnum
CREATE TYPE "EstadoConsejo" AS ENUM ('PENDIENTE', 'APLICADO', 'DESCARTADO');

-- CreateTable
CREATE TABLE "categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "TipoCategoria" NOT NULL,
    "priority" "Prioridad" NOT NULL DEFAULT 'MEDIA',
    "frequency" "Frecuencia" NOT NULL DEFAULT 'MENSUAL',
    "color" TEXT,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "movements" (
    "id" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "frequency" "Frecuencia" NOT NULL DEFAULT 'PUNTUAL',
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "movements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "budget_items" (
    "id" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "plannedAmount" DECIMAL(12,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "budget_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "advice_items" (
    "id" TEXT NOT NULL,
    "categoryId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "source" "FuenteConsejo" NOT NULL,
    "estimatedSavings" DECIMAL(12,2),
    "sourceUrl" TEXT,
    "status" "EstadoConsejo" NOT NULL DEFAULT 'PENDIENTE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "advice_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "categories_name_key" ON "categories"("name");

-- CreateIndex
CREATE INDEX "movements_categoryId_date_idx" ON "movements"("categoryId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "budget_items_categoryId_year_month_key" ON "budget_items"("categoryId", "year", "month");

-- AddForeignKey
ALTER TABLE "movements" ADD CONSTRAINT "movements_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "budget_items" ADD CONSTRAINT "budget_items_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "advice_items" ADD CONSTRAINT "advice_items_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;
