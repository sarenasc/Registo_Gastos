import { prisma } from "@/lib/prisma";
import { toNumber } from "@/lib/format";

export type PlanConItems = {
  id: string;
  year: number;
  version: number;
  status: "ABIERTO" | "CERRADO";
  closedAt: Date | null;
  items: { categoryId: string; month: number; plannedAmount: number }[];
};

async function ultimoPlanDelAnio(year: number) {
  return prisma.budgetPlan.findFirst({ where: { year }, orderBy: { version: "desc" } });
}

/** Plan (version) mas reciente del año, o null si ese año todavia no tiene presupuesto. No crea nada. */
export async function obtenerPlanActual(year: number): Promise<PlanConItems | null> {
  const existente = await ultimoPlanDelAnio(year);
  if (!existente) return null;
  const items = await prisma.budgetItem.findMany({ where: { planId: existente.id } });
  return {
    ...existente,
    items: items.map((i) => ({ categoryId: i.categoryId, month: i.month, plannedAmount: toNumber(i.plannedAmount) })),
  };
}

/**
 * Crea la v1 del año. Con `copiarDelAnterior` parte con los montos de la ultima
 * version del año previo, ajustados por `ajustePct` (ej. IPC); si no, en blanco.
 */
export async function crearPlanDelAnio(year: number, copiarDelAnterior: boolean, ajustePct = 0) {
  if (await ultimoPlanDelAnio(year)) return;

  const planAnterior = copiarDelAnterior ? await ultimoPlanDelAnio(year - 1) : null;
  const itemsAnteriores = planAnterior ? await prisma.budgetItem.findMany({ where: { planId: planAnterior.id } }) : [];
  const factor = 1 + ajustePct / 100;

  await prisma.budgetPlan.create({
    data: {
      year,
      version: 1,
      status: "ABIERTO",
      items: {
        create: itemsAnteriores.map((i) => ({
          categoryId: i.categoryId,
          year,
          month: i.month,
          plannedAmount: Math.round(toNumber(i.plannedAmount) * factor),
        })),
      },
    },
  });
}

export async function obtenerPlanPorVersion(year: number, version: number): Promise<PlanConItems | null> {
  const plan = await prisma.budgetPlan.findUnique({ where: { year_version: { year, version } }, include: { items: true } });
  if (!plan) return null;
  return {
    ...plan,
    items: plan.items.map((i) => ({ categoryId: i.categoryId, month: i.month, plannedAmount: toNumber(i.plannedAmount) })),
  };
}

/** Todas las versiones de un año, mas nuevas primero. */
export async function historialDeVersiones(year: number) {
  return prisma.budgetPlan.findMany({ where: { year }, orderBy: { version: "desc" } });
}

export async function cerrarPlan(planId: string) {
  await prisma.budgetPlan.update({ where: { id: planId }, data: { status: "CERRADO", closedAt: new Date() } });
}

/** Crea la siguiente version (copia del plan cerrado) para poder seguir editando. */
export async function abrirNuevaVersion(planId: string) {
  const actual = await prisma.budgetPlan.findUniqueOrThrow({ where: { id: planId }, include: { items: true } });

  const nuevo = await prisma.budgetPlan.create({
    data: {
      year: actual.year,
      version: actual.version + 1,
      status: "ABIERTO",
      items: {
        create: actual.items.map((i) => ({
          categoryId: i.categoryId,
          year: actual.year,
          month: i.month,
          plannedAmount: i.plannedAmount,
        })),
      },
    },
  });

  return nuevo.id;
}

/**
 * Plan a usar como referencia de comparacion en el Dashboard.
 * "original" = version 1 (la primera vez que se cerro/planifico el año).
 * "ultima" = la version mas reciente, tenga o no cerrada.
 */
export async function obtenerPlanParaComparar(year: number, modo: "original" | "ultima") {
  if (modo === "original") {
    return prisma.budgetPlan.findUnique({ where: { year_version: { year, version: 1 } } });
  }
  return ultimoPlanDelAnio(year);
}

/**
 * Escribe un costo por mes en una categoria del presupuesto del año (version mas
 * reciente). Si el año no tiene presupuesto y `crearSiFalta`, lo crea copiando el
 * año anterior. No modifica presupuestos cerrados.
 */
export async function volcarCostosAlPresupuesto(
  year: number,
  categoryId: string,
  costos: { month: number; costo: number }[],
  crearSiFalta: boolean
): Promise<{ error?: string; ok?: string }> {
  let plan = await ultimoPlanDelAnio(year);
  if (!plan && crearSiFalta) {
    await crearPlanDelAnio(year, true);
    plan = await ultimoPlanDelAnio(year);
  }
  if (!plan) return { error: `El presupuesto ${year} aún no está creado.` };
  if (plan.status === "CERRADO") return { error: `El presupuesto ${year} está cerrado. Abre una nueva versión en Presupuesto para poder modificarlo.` };
  if (costos.length === 0) return { error: "Primero guarda el plan." };

  const planId = plan.id;
  await prisma.$transaction(
    costos.map((c) =>
      prisma.budgetItem.upsert({
        where: { planId_categoryId_month: { planId, categoryId, month: c.month } },
        update: { plannedAmount: c.costo },
        create: { planId, categoryId, year, month: c.month, plannedAmount: c.costo },
      })
    )
  );
  return { ok: `Se actualizaron ${costos.length} meses del presupuesto ${year} (versión ${plan.version}).` };
}
