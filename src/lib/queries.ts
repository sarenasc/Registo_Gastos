import { prisma } from "@/lib/prisma";
import { toNumber } from "@/lib/format";
import { obtenerPlanParaComparar } from "@/lib/presupuesto";

export async function getCategorias() {
  return prisma.category.findMany({
    where: { archived: false },
    orderBy: [{ type: "asc" }, { name: "asc" }],
  });
}

// Prisma serializa los montos como `Decimal`, una instancia de clase que React
// no puede enviar de un Server Component a un Client Component. Se convierte
// a `number` plano aquí, en el borde entre la consulta y la UI.

export async function getMovimientos(limit = 30) {
  const rows = await prisma.movement.findMany({
    include: { category: true },
    orderBy: { date: "desc" },
    take: limit,
  });
  return rows.map((m) => ({ ...m, amount: toNumber(m.amount) }));
}

export async function getMovimientosRango(desde: Date, hasta: Date) {
  const rows = await prisma.movement.findMany({
    where: { date: { gte: desde, lt: hasta } },
    include: { category: true },
    orderBy: { date: "desc" },
  });
  return rows.map((m) => ({ ...m, amount: toNumber(m.amount) }));
}

export type ResumenMes = {
  ingresos: number;
  gastosYCostos: number;
  saldo: number;
};

export async function getResumenMes(year: number, month: number): Promise<ResumenMes> {
  const desde = new Date(Date.UTC(year, month - 1, 1));
  const hasta = new Date(Date.UTC(year, month, 1));
  const movimientos = await getMovimientosRango(desde, hasta);

  let ingresos = 0;
  let gastosYCostos = 0;
  for (const m of movimientos) {
    const monto = toNumber(m.amount);
    if (m.category.type === "INGRESO") ingresos += monto;
    else gastosYCostos += monto;
  }
  return { ingresos, gastosYCostos, saldo: ingresos - gastosYCostos };
}

export type TotalPorCategoria = {
  categoryId: string;
  nombre: string;
  tipo: string;
  prioridad: string;
  real: number;
  presupuestado: number;
};

export async function getTotalesPorCategoria(
  year: number,
  month: number,
  modoPresupuesto: "original" | "ultima" = "ultima"
): Promise<TotalPorCategoria[]> {
  const planComparacion = await obtenerPlanParaComparar(year, modoPresupuesto);

  const [categorias, movimientos, presupuestos] = await Promise.all([
    getCategorias(),
    getMovimientosRango(new Date(Date.UTC(year, month - 1, 1)), new Date(Date.UTC(year, month, 1))),
    planComparacion ? prisma.budgetItem.findMany({ where: { planId: planComparacion.id, month } }) : Promise.resolve([]),
  ]);

  const realPorCategoria = new Map<string, number>();
  for (const m of movimientos) {
    realPorCategoria.set(m.categoryId, (realPorCategoria.get(m.categoryId) ?? 0) + toNumber(m.amount));
  }
  const presupuestoPorCategoria = new Map<string, number>();
  for (const b of presupuestos) {
    presupuestoPorCategoria.set(b.categoryId, toNumber(b.plannedAmount));
  }

  return categorias.map((c) => ({
    categoryId: c.id,
    nombre: c.name,
    tipo: c.type,
    prioridad: c.priority,
    real: realPorCategoria.get(c.id) ?? 0,
    presupuestado: presupuestoPorCategoria.get(c.id) ?? 0,
  }));
}

export type PuntoTendencia = {
  year: number;
  month: number;
  label: string;
  ingresos: number;
  gastos: number;
};

export async function getTendenciaMensual(mesesAtras: number, anclaYear: number, anclaMonth: number): Promise<PuntoTendencia[]> {
  const puntos: PuntoTendencia[] = [];
  for (let i = mesesAtras - 1; i >= 0; i--) {
    const fecha = new Date(Date.UTC(anclaYear, anclaMonth - 1 - i, 1));
    const year = fecha.getUTCFullYear();
    const month = fecha.getUTCMonth() + 1;
    const resumen = await getResumenMes(year, month);
    puntos.push({
      year,
      month,
      label: fecha.toLocaleDateString("es-CL", { month: "short", year: "2-digit", timeZone: "UTC" }),
      ingresos: resumen.ingresos,
      gastos: resumen.gastosYCostos,
    });
  }
  return puntos;
}
