import { PrismaClient, TipoCategoria } from "@prisma/client";
import seedData from "./seed-data.json";

const prisma = new PrismaClient();

// Misma nota que usa la grilla de Registro mensual: asi la grilla reconoce estas filas
// y las edita en vez de crear un segundo total para el mismo mes.
const IMPORT_NOTE = "Registro mensual";

async function main() {
  console.log(`Sembrando datos de ejemplo desde Excel (año ${seedData.anio})...`);

  const categoryIdByName = new Map<string, string>();

  for (const cat of seedData.categorias) {
    const type: TipoCategoria = cat.tipo === "INGRESO" ? "INGRESO" : "GASTO";
    const category = await prisma.category.upsert({
      where: { name: cat.nombre },
      update: {},
      create: {
        name: cat.nombre,
        type,
      },
    });
    categoryIdByName.set(cat.nombre, category.id);

    if ("marcado_bajar" in cat && cat.marcado_bajar) {
      const existing = await prisma.adviceItem.findFirst({
        where: { categoryId: category.id, title: "Marcado para reducir (importado de Excel)" },
      });
      if (!existing) {
        await prisma.adviceItem.create({
          data: {
            categoryId: category.id,
            title: "Marcado para reducir (importado de Excel)",
            description: `En tu planilla anterior habías marcado "${cat.nombre}" como un gasto a bajar. Revísalo en Consejos para definir una acción concreta.`,
            source: "REGLA",
            status: "PENDIENTE",
          },
        });
      }
    }
  }

  console.log(`Categorías creadas/actualizadas: ${categoryIdByName.size}`);

  const plan = await prisma.budgetPlan.upsert({
    where: { year_version: { year: seedData.anio, version: 1 } },
    update: {},
    create: { year: seedData.anio, version: 1, status: "ABIERTO" },
  });

  let presupuestosOmitidos = 0;
  for (const b of seedData.presupuestos) {
    const categoryId = categoryIdByName.get(b.categoria);
    if (!categoryId) continue;
    if (typeof b.monto !== "number" || !Number.isFinite(b.monto)) {
      presupuestosOmitidos++;
      continue;
    }
    await prisma.budgetItem.upsert({
      where: {
        planId_categoryId_month: {
          planId: plan.id,
          categoryId,
          month: b.mes,
        },
      },
      update: { plannedAmount: b.monto },
      create: {
        planId: plan.id,
        categoryId,
        year: seedData.anio,
        month: b.mes,
        plannedAmount: b.monto,
      },
    });
  }
  console.log(`Presupuestos sembrados: ${seedData.presupuestos.length - presupuestosOmitidos} (omitidos por monto inválido: ${presupuestosOmitidos})`);

  let movementCount = 0;
  let movimientosOmitidos = 0;
  for (const m of seedData.movimientos_historicos) {
    const categoryId = categoryIdByName.get(m.categoria);
    if (!categoryId) continue;
    if (typeof m.monto !== "number" || !Number.isFinite(m.monto)) {
      movimientosOmitidos++;
      continue;
    }
    const date = new Date(Date.UTC(seedData.anio, m.mes - 1, 1));
    const existente = await prisma.movement.findFirst({ where: { categoryId, date, frequency: "MENSUAL", note: IMPORT_NOTE } });
    if (existente) continue;
    await prisma.movement.create({
      data: { categoryId, date, amount: m.monto, frequency: "MENSUAL", note: IMPORT_NOTE },
    });
    movementCount++;
  }
  console.log(`Movimientos históricos sembrados: ${movementCount} (omitidos por monto inválido: ${movimientosOmitidos})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
