"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

const movimientoSchema = z.object({
  categoryId: z.string().min(1, "Selecciona una categoría"),
  date: z.string().min(1, "Selecciona una fecha"),
  amount: z.coerce.number().positive("El monto debe ser mayor a 0"),
  frequency: z.enum(["DIARIA", "SEMANAL", "MENSUAL", "ANUAL", "PUNTUAL"]),
  note: z.string().optional(),
  receiptUrl: z.string().url().optional(),
});

export type CrearMovimientoState = { error?: string } | undefined;

export async function crearMovimiento(_prev: CrearMovimientoState, formData: FormData): Promise<CrearMovimientoState> {
  const parsed = movimientoSchema.safeParse({
    categoryId: formData.get("categoryId"),
    date: formData.get("date"),
    amount: formData.get("amount"),
    frequency: formData.get("frequency"),
    note: formData.get("note") || undefined,
    receiptUrl: formData.get("receiptUrl") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  const { categoryId, date, amount, frequency, note, receiptUrl } = parsed.data;

  await prisma.movement.create({
    data: {
      categoryId,
      date: new Date(`${date}T12:00:00.000Z`),
      amount,
      frequency,
      note: note || null,
      receiptUrl: receiptUrl || null,
    },
  });

  revalidatePath("/registro");
  revalidatePath("/dashboard");
  revalidatePath("/presupuesto");
  return undefined;
}

export async function eliminarMovimiento(id: string) {
  await prisma.movement.delete({ where: { id } });
  revalidatePath("/registro");
  revalidatePath("/dashboard");
  revalidatePath("/presupuesto");
}

const categoriaSchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio"),
  type: z.enum(["INGRESO", "COSTO", "GASTO"]),
  priority: z.enum(["ALTA", "MEDIA", "BAJA"]),
  frequency: z.enum(["DIARIA", "SEMANAL", "MENSUAL", "ANUAL", "PUNTUAL"]),
});

export type CrearCategoriaState = { error?: string } | undefined;

export async function crearCategoria(_prev: CrearCategoriaState, formData: FormData): Promise<CrearCategoriaState> {
  const parsed = categoriaSchema.safeParse({
    name: formData.get("name"),
    type: formData.get("type"),
    priority: formData.get("priority"),
    frequency: formData.get("frequency"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  try {
    await prisma.category.create({ data: parsed.data });
  } catch {
    return { error: "Ya existe una categoría con ese nombre" };
  }

  revalidatePath("/registro");
  revalidatePath("/registro/mensual");
  revalidatePath("/presupuesto");
  return undefined;
}
