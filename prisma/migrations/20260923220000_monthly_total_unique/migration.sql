-- Un solo "Registro mensual" por categoria y mes (dia 1 a las 00:00 UTC).
-- Evita que el Dashboard sume dos totales mensuales del mismo mes.
CREATE UNIQUE INDEX "movements_monthly_total_key"
ON "movements" ("categoryId", "date")
WHERE "note" = 'Registro mensual' AND "frequency" = 'MENSUAL';
