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

/**
 * Devuelve el plan (version) mas reciente del año pedido para mostrar/editar.
 * Si el año no tiene ningun plan todavia, lo crea copiando los montos del
 * plan mas reciente del año anterior (si existe) - asi el presupuesto nuevo
 * arranca con lo ya planificado en vez de partir en blanco.
 */
export async function obtenerOCrearPlanEditable(year: number): Promise<PlanConItems> {
  const existente = await ultimoPlanDelAnio(year);
  if (existente) {
    const items = await prisma.budgetItem.findMany({ where: { planId: existente.id } });
    return {
      ...existente,
      items: items.map((i) => ({ categoryId: i.categoryId, month: i.month, plannedAmount: toNumber(i.plannedAmount) })),
    };
  }

  const planAnterior = await ultimoPlanDelAnio(year - 1);
  const itemsAnteriores = planAnterior ? await prisma.budgetItem.findMany({ where: { planId: planAnterior.id } }) : [];

  const nuevoPlan = await prisma.budgetPlan.create({
    data: {
      year,
      version: 1,
      status: "ABIERTO",
      items: {
        create: itemsAnteriores.map((i) => ({
          categoryId: i.categoryId,
          year,
          month: i.month,
          plannedAmount: i.plannedAmount,
        })),
      },
    },
    include: { items: true },
  });

  return {
    ...nuevoPlan,
    items: nuevoPlan.items.map((i) => ({ categoryId: i.categoryId, month: i.month, plannedAmount: toNumber(i.plannedAmount) })),
  };
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
