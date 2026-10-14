"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth/server";
import { toNumber } from "@/lib/format";
import { filtroImputacion } from "@/lib/imputacion";

const movimientoSchema = z.object({
  categoryId: z.string().min(1, "Selecciona una categoría"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Selecciona una fecha válida").refine((date) => {
    const parsed = new Date(`${date}T12:00:00.000Z`);
    return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === date;
  }, "Selecciona una fecha válida"),
  amount: z.coerce.number().positive("El monto debe ser mayor a 0"),
  imputationMonth: z.string().regex(/^[1-9]\d{3}-(0[1-9]|1[0-2])$/, "Selecciona el mes de imputación"),
  frequency: z.enum(["DIARIA", "SEMANAL", "MENSUAL", "ANUAL", "PUNTUAL"]),
  note: z.string().optional(),
  receiptUrl: z.string().url().optional(),
});

export type MovimientoExistente = { id: string; date: string; amount: number; frequency: string; note: string | null; receiptUrl: string | null };
export type CrearMovimientoState = { error?: string; success?: boolean; existentes?: MovimientoExistente[] } | undefined;

export async function crearMovimiento(_prev: CrearMovimientoState, formData: FormData): Promise<CrearMovimientoState> {
  if (!await getSession()) return { error: "Inicia sesión para guardar movimientos." };
  const operation = formData.get("operation") || "";
  if (!["", "add", "edit"].includes(String(operation))) return { error: "Opción inválida." };
  const parsed = movimientoSchema.safeParse({
    categoryId: formData.get("categoryId"),
    date: formData.get("date"),
    amount: formData.get("amount"),
    imputationMonth: formData.get("imputationMonth") || String(formData.get("date") ?? "").slice(0, 7),
    frequency: formData.get("frequency"),
    note: formData.get("note") || undefined,
    receiptUrl: formData.get("receiptUrl") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  const { categoryId, date, amount, frequency, note, receiptUrl, imputationMonth } = parsed.data;
  if (!await prisma.category.findFirst({ where: { id: categoryId, archived: false }, select: { id: true } })) return { error: "La categoría ya no está disponible." };

  const desde = new Date(`${imputationMonth}-01T00:00:00.000Z`);
  const hasta = new Date(Date.UTC(desde.getUTCFullYear(), desde.getUTCMonth() + 1, 1));
  const where = {
    categoryId,
    AND: [filtroImputacion(desde, hasta)],
  };
  const data = {
      categoryId,
      date: new Date(`${date}T12:00:00.000Z`),
      imputationDate: desde,
      amount,
      frequency,
      note: note || null,
      receiptUrl: receiptUrl || null,
  };
  try {
    if (operation === "edit") {
      const id = formData.get("movementId");
      if (typeof id !== "string" || !id) return { error: "Selecciona el movimiento que quieres editar." };
      const result = await prisma.movement.updateMany({ where: { ...where, id }, data });
      if (result.count === 0) return { error: "El movimiento ya no existe o cambió de mes o categoría. Vuelve a buscarlo." };
    } else {
      if (operation !== "add") {
        const existentes = await prisma.movement.findMany({
          where,
          select: { id: true, date: true, amount: true, frequency: true, note: true, receiptUrl: true },
          orderBy: [{ createdAt: "desc" }, { id: "asc" }],
        });
        if (existentes.length) return { existentes: existentes.map((m) => ({ ...m, date: m.date.toISOString().slice(0, 10), amount: toNumber(m.amount) })) };
      }
      await prisma.movement.create({ data });
    }
  } catch {
    return { error: "No se pudo guardar el movimiento. Intenta nuevamente." };
  }

  revalidatePath("/registro");
  revalidatePath("/registro/mensual");
  revalidatePath("/dashboard");
  revalidatePath("/presupuesto");
  revalidatePath("/egresos");
  revalidatePath("/consejos");
  return { success: true };
}

export async function eliminarMovimiento(id: string) {
  await prisma.movement.delete({ where: { id } });
  revalidatePath("/registro");
  revalidatePath("/registro/mensual");
  revalidatePath("/dashboard");
  revalidatePath("/presupuesto");
  revalidatePath("/egresos");
}

const categoriaSchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio"),
  type: z.enum(["INGRESO", "COSTO", "GASTO"]),
  priority: z.enum(["ALTA", "MEDIA", "BAJA"]),
  frequency: z.enum(["DIARIA", "SEMANAL", "MENSUAL", "ANUAL", "PUNTUAL"]),
});

export type CrearCategoriaState = { error?: string; ok?: string } | undefined;

export async function crearCategoria(_prev: CrearCategoriaState, formData: FormData): Promise<CrearCategoriaState> {
  if (!await getSession()) return { error: "Inicia sesión para crear categorías." };
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
  revalidatePath("/categorias");
  revalidatePath("/dashboard");
  revalidatePath("/egresos");
  return { ok: "Categoría creada." };
}
