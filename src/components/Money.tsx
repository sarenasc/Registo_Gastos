"use client";

import { clsx } from "clsx";
import { usePrivacy } from "@/lib/privacy-context";
import { formatCLP } from "@/lib/format";

const MASK = "•••••";

/** Monto simple, sin signo ni color propio (hereda el color del texto que lo rodea). */
export function Money({ value, className }: { value: number; className?: string }) {
  const { hidden } = usePrivacy();
  return <span className={className}>{hidden ? MASK : formatCLP(value)}</span>;
}

/** Monto con signo y color según el tipo de categoría: gasto/costo en rojo y negativo, ingreso en azul y positivo. */
export function SignedMoney({ value, tipo, className }: { value: number; tipo: string; className?: string }) {
  const { hidden } = usePrivacy();
  const esIngreso = tipo === "INGRESO";
  const texto = hidden ? MASK : `${esIngreso ? "+" : "-"}${formatCLP(Math.abs(value))}`;

  return <span className={clsx(esIngreso ? "text-[#2a78d6]" : "text-[#d03b3b]", "font-semibold", className)}>{texto}</span>;
}
