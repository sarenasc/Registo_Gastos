import { contarDiasSemana } from "@/lib/bencina";

export type Unidad = "UNIDAD" | "KILO" | "LITRO";

export const UNIDAD_LABEL: Record<Unidad, string> = { UNIDAD: "unidad", KILO: "kilo", LITRO: "litro" };
export const UNIDAD_PLURAL: Record<Unidad, string> = { UNIDAD: "unidades", KILO: "kilos", LITRO: "litros" };

/** Hay que conocer el peso de una unidad cuando el precio y la cantidad estan en unidades distintas (kilo <-> unidad). */
export function necesitaPeso(priceBasis: Unidad, quantityBasis: Unidad) {
  return (priceBasis === "KILO" && quantityBasis === "UNIDAD") || (priceBasis === "UNIDAD" && quantityBasis === "KILO");
}

/** Combinaciones validas: mismas unidades, o kilo <-> unidad con peso por unidad. Litro solo con litro. */
export function validarUnidades(priceBasis: Unidad, quantityBasis: Unidad, unitWeightGrams: number | null): string | null {
  if (priceBasis === quantityBasis) return null;
  if (!necesitaPeso(priceBasis, quantityBasis)) return "El litro solo se puede combinar con litro.";
  if (!unitWeightGrams || unitWeightGrams <= 0) return "Indica cuánto pesa una unidad (en gramos).";
  return null;
}

/** Convierte la cantidad anotada a la unidad en que esta expresado el precio. */
export function cantidadEnUnidadDePrecio(cantidad: number, quantityBasis: Unidad, priceBasis: Unidad, unitWeightGrams: number | null) {
  if (quantityBasis === priceBasis) return cantidad;
  const w = unitWeightGrams ?? 0;
  if (quantityBasis === "UNIDAD" && priceBasis === "KILO") return (cantidad * w) / 1000;
  if (quantityBasis === "KILO" && priceBasis === "UNIDAD") return w > 0 ? (cantidad * 1000) / w : 0;
  return cantidad;
}

export type ItemConsumo = { priceBasis: Unidad; quantityBasis: Unidad; unitWeightGrams: number | null };

export function calcularConsumo(year: number, month: number, qtyPorDia: number[], price: number, item: ItemConsumo) {
  const conteo = contarDiasSemana(year, month);
  const cantidadMes = conteo.reduce((acc, veces, i) => acc + veces * (qtyPorDia[i] ?? 0), 0);
  const enPrecio = cantidadEnUnidadDePrecio(cantidadMes, item.quantityBasis, item.priceBasis, item.unitWeightGrams);
  return { cantidadMes, costo: Math.round(enPrecio * price) };
}
