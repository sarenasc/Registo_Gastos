import { PrismaClient, TipoCategoria } from "@prisma/client";
import seedData from "./seed-data.json";

const prisma = new PrismaClient();

const IMPORT_NOTE = "Importado desde Excel (dato de muestra inicial)";

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

  for (const b of seedData.presupuestos) {
    const categoryId = categoryIdByName.get(b.categoria);
    if (!categoryId) continue;
    await prisma.budgetItem.upsert({
      where: {
        categoryId_year_month: {
          categoryId,
          year: seedData.anio,
          month: b.mes,
        },
      },
      update: { plannedAmount: b.monto },
      create: {
        categoryId,
        year: seedData.anio,
        month: b.mes,
        plannedAmount: b.monto,
      },
    });
  }
  console.log(`Presupuestos sembrados: ${seedData.presupuestos.length}`);

  await prisma.movement.deleteMany({ where: { note: IMPORT_NOTE } });
  let movementCount = 0;
  for (const m of seedData.movimientos_historicos) {
    const categoryId = categoryIdByName.get(m.categoria);
    if (!categoryId) continue;
    await prisma.movement.create({
      data: {
        categoryId,
        date: new Date(Date.UTC(seedData.anio, m.mes - 1, 1)),
        amount: m.monto,
        frequency: "MENSUAL",
        note: IMPORT_NOTE,
      },
    });
    movementCount++;
  }
  console.log(`Movimientos históricos sembrados: ${movementCount}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
