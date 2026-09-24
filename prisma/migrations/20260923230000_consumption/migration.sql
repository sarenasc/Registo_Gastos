-- CreateEnum
CREATE TYPE "UnidadMedida" AS ENUM ('UNIDAD', 'KILO', 'LITRO');

-- CreateTable
CREATE TABLE "consumption_items" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "priceBasis" "UnidadMedida" NOT NULL,
    "quantityBasis" "UnidadMedida" NOT NULL,
    "unitWeightGrams" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "consumption_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "consumption_plans" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "price" DECIMAL(12,2) NOT NULL,
    "qtyPorDia" DOUBLE PRECISION[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "consumption_plans_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "consumption_items_name_key" ON "consumption_items"("name");

-- CreateIndex
CREATE UNIQUE INDEX "consumption_plans_itemId_year_month_key" ON "consumption_plans"("itemId", "year", "month");

-- AddForeignKey
ALTER TABLE "consumption_plans" ADD CONSTRAINT "consumption_plans_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "consumption_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;
