import { getCategorias, getMovimientosMensualesAnio } from "@/lib/queries";
import { generarExcelPresupuesto } from "@/lib/exportar-presupuesto";
import { MESES } from "@/lib/constants";

export const dynamic = "force-dynamic";

/** GET ?year=2026&meses=1,2,3 -> Excel con lo registrado (real) de esos meses. */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const year = Number(searchParams.get("year")) || new Date().getFullYear();
  const pedidos = (searchParams.get("meses") ?? "")
    .split(",")
    .map(Number)
    .filter((m) => Number.isInteger(m) && m >= 1 && m <= 12);
  const elegidos = pedidos.length ? [...new Set(pedidos)].sort((a, b) => a - b) : MESES.map((_, i) => i + 1);

  const [categorias, registros] = await Promise.all([getCategorias(), getMovimientosMensualesAnio(year)]);

  const buffer = await generarExcelPresupuesto({
    year,
    version: 0,
    estado: "ABIERTO",
    titulo: `Registro mensual real ${year} - ${elegidos.map((m) => MESES[m - 1]).join(", ")}`,
    hoja: `Real ${year}`,
    categorias: categorias.map((c) => ({ id: c.id, name: c.name, type: c.type })),
    items: registros.map((r) => ({ categoryId: r.categoryId, month: r.month, plannedAmount: r.amount })),
    meses: elegidos,
  });

  const sufijo = elegidos.length === 12 ? "" : `_${elegidos.join("-")}`;
  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="Registro_real_${year}${sufijo}.xlsx"`,
      "Cache-Control": "no-store",
    },
  });
}
