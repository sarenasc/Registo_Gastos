"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { calcularBencina } from "@/lib/bencina";
import { crearPlanDelAnio } from "@/lib/presupuesto";

const mesSchema = z.object({
  month: z.number().int().min(1).max(12),
  pricePerLiter: z.number().min(0),
  kmPerLiter: z.number().min(0.1),
  kmPorDia: z.array(z.number().int().min(0).max(5000)).length(7),
});

export async function guardarPlanBencina(year: number, meses: z.infer<typeof mesSchema>[]): Promise<{ error?: string } | undefined> {
  const parsed = z.array(mesSchema).safeParse(meses);
  if (!parsed.success) return { error: "Revisa los valores: el rendimiento (km/l) debe ser mayor a 0 y los km no pueden ser negativos." };

  await prisma.$transaction(
    parsed.data.map((m) =>
      prisma.fuelPlan.upsert({
        where: { year_month: { year, month: m.month } },
        update: { pricePerLiter: m.pricePerLiter, kmPerLiter: m.kmPerLiter, kmPorDia: m.kmPorDia },
        create: { year, month: m.month, pricePerLiter: m.pricePerLiter, kmPerLiter: m.kmPerLiter, kmPorDia: m.kmPorDia },
      })
    )
  );
  revalidatePath("/bencina");
  return undefined;
}

/** Copia el costo mensual de bencina al presupuesto abierto del año, en la categoria elegida. */
export async function aplicarBencinaAlPresupuesto(year: number, categoryId: string, crearSiFalta = false): Promise<{ error?: string; ok?: string }> {
  let plan = await prisma.budgetPlan.findFirst({ where: { year }, orderBy: { version: "desc" } });
  if (!plan && crearSiFalta) {
    await crearPlanDelAnio(year, true);
    plan = await prisma.budgetPlan.findFirst({ where: { year }, orderBy: { version: "desc" } });
  }
  if (!plan) return { error: `El presupuesto ${year} aún no está creado.` };
  if (plan.status === "CERRADO") return { error: `El presupuesto ${year} está cerrado. Abre una nueva versión en Presupuesto para poder modificarlo.` };

  const planes = await prisma.fuelPlan.findMany({ where: { year } });
  if (planes.length === 0) return { error: "Primero guarda el plan de bencina." };

  await prisma.$transaction(
    planes.map((p) => {
      const { costo } = calcularBencina(year, p.month, p.kmPorDia, Number(p.kmPerLiter), Number(p.pricePerLiter));
      return prisma.budgetItem.upsert({
        where: { planId_categoryId_month: { planId: plan.id, categoryId, month: p.month } },
        update: { plannedAmount: costo },
        create: { planId: plan.id, categoryId, year, month: p.month, plannedAmount: costo },
      });
    })
  );
  revalidatePath("/presupuesto");
  revalidatePath("/bencina");
  return { ok: `Se actualizaron ${planes.length} meses del presupuesto ${year} (versión ${plan.version}).` };
}
