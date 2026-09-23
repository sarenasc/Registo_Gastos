-- CreateTable
CREATE TABLE "fuel_plans" (
    "id" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "pricePerLiter" DECIMAL(8,2) NOT NULL,
    "kmPerLiter" DECIMAL(6,2) NOT NULL,
    "kmPorDia" INTEGER[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fuel_plans_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "fuel_plans_year_month_key" ON "fuel_plans"("year", "month");
