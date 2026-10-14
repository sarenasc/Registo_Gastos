import type { Prisma } from "@prisma/client";

// Los registros anteriores conservan el mes de su fecha original.
export function filtroImputacion(desde: Date, hasta: Date): Prisma.MovementWhereInput {
  return {
    OR: [
      { imputationDate: { gte: desde, lt: hasta } },
      { imputationDate: null, date: { gte: desde, lt: hasta } },
    ],
  };
}
