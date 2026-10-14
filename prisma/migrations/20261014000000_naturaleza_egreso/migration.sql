CREATE TYPE "NaturalezaEgreso" AS ENUM ('FIJO', 'VARIABLE');
ALTER TABLE "categories" ADD COLUMN "naturaleza" "NaturalezaEgreso";
