import { NextResponse } from "next/server";
import { getCategorias } from "@/lib/queries";
import { obtenerPlanActual, obtenerPlanPorVersion } from "@/lib/presupuesto";
import { generarExcelPresupuesto } from "@/lib/exportar-presupuesto";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const year = Number(searchParams.get("year")) || new Date().getFullYear();
  const version = Number(searchParams.get("version")) || null;

  const plan = version ? await obtenerPlanPorVersion(year, version) : await obtenerPlanActual(year);
  if (!plan) return NextResponse.json({ error: `No existe el presupuesto ${year}` }, { status: 404 });

  const categorias = await getCategorias();
  const buffer = await generarExcelPresupuesto({
    year,
    version: plan.version,
    estado: plan.status,
    categorias: categorias.map((c) => ({ id: c.id, name: c.name, type: c.type })),
    items: plan.items,
  });

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="Presupuesto_${year}_v${plan.version}.xlsx"`,
      "Cache-Control": "no-store",
    },
  });
}
