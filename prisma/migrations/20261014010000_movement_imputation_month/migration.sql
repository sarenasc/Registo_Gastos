ALTER TABLE "movements" ADD COLUMN "imputationDate" TIMESTAMP(3);
CREATE INDEX "movements_categoryId_imputationDate_idx" ON "movements"("categoryId", "imputationDate");
