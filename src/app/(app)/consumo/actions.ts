"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { volcarCostosAlPresupuesto } from "@/lib/presupuesto";
import { calcularConsumo, validarUnidades, type Unidad } from "@/lib/consumo";

const unidad = z.enum(["UNIDAD", "KILO", "LITRO"]);

export async function crearProducto(name: string, priceBasis: Unidad, quantityBasis: Unidad, unitWeightGrams: number | null): Promise<{ error?: string; id?: string }> {
  const parsed = z.object({ name: z.string().trim().min(1, "Ponle un nombre"), priceBasis: unidad, quantityBasis: unidad }).safeParse({ name, priceBasis, quantityBasis });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };

  const peso = unitWeightGrams && unitWeightGrams > 0 ? Math.round(unitWeightGrams) : null;
  const errorUnidades = validarUnidades(priceBasis, quantityBasis, peso);
  if (errorUnidades) return { error: errorUnidades };

  try {
    const item = await prisma.consumptionItem.create({
      data: { name: parsed.data.name, priceBasis, quantityBasis, unitWeightGrams: priceBasis === quantityBasis ? null : peso },
    });
    revalidatePath("/consumo");
    return { id: item.id };
  } catch {
    return { error: "Ya existe un producto con ese nombre" };
  }
}

export async function eliminarProducto(itemId: string) {
  await prisma.consumptionItem.delete({ where: { id: itemId } });
  revalidatePath("/consumo");
}

const mesSchema = z.object({
  month: z.number().int().min(1).max(12),
  price: z.number().min(0),
  qtyPorDia: z.array(z.number().min(0).max(100000)).length(7),
});

export async function guardarPlanConsumo(itemId: string, year: number, meses: z.infer<typeof mesSchema>[]): Promise<{ error?: string } | undefined> {
  const parsed = z.array(mesSchema).safeParse(meses);
  if (!parsed.success) return { error: "Revisa los valores: no pueden ser negativos." };

  await prisma.$transaction(
    parsed.data.map((m) =>
      prisma.consumptionPlan.upsert({
        where: { itemId_year_month: { itemId, year, month: m.month } },
        update: { price: m.price, qtyPorDia: m.qtyPorDia },
        create: { itemId, year, month: m.month, price: m.price, qtyPorDia: m.qtyPorDia },
      })
    )
  );
  revalidatePath("/consumo");
  return undefined;
}

export async function aplicarConsumoAlPresupuesto(itemId: string, year: number, categoryId: string, crearSiFalta = false): Promise<{ error?: string; ok?: string }> {
  const item = await prisma.consumptionItem.findUnique({ where: { id: itemId }, include: { plans: { where: { year } } } });
  if (!item) return { error: "El producto ya no existe." };

  const costos = item.plans.map((p) => ({
    month: p.month,
    costo: calcularConsumo(year, p.month, p.qtyPorDia, Number(p.price), item).costo,
  }));
  const res = await volcarCostosAlPresupuesto(year, categoryId, costos, crearSiFalta);
  revalidatePath("/presupuesto");
  revalidatePath("/consumo");
  return res;
}
