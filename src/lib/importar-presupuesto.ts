import ExcelJS from "exceljs";
import { MESES } from "@/lib/constants";

export type CeldaImportada = { categoria: string; month: number; monto: number };

export const normalizar = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim()
    .toLowerCase();

const MES_POR_NOMBRE = new Map<string, number>(MESES.map((m, i) => [normalizar(m), i + 1]));

function valorCelda(v: ExcelJS.CellValue): string | number | null {
  if (v == null) return null;
  if (typeof v === "number" || typeof v === "string") return v;
  if (typeof v === "object" && "result" in v) return valorCelda(v.result as ExcelJS.CellValue);
  if (typeof v === "object" && "richText" in v) return v.richText.map((t) => t.text).join("");
  return null;
}

/**
 * Lee un Excel con la estructura del export (categorias en la columna A, meses en
 * el encabezado). Sirve tambien para exports de solo algunos meses. Ignora filas
 * de totales/saldo y celdas vacias.
 */
export async function leerExcelPresupuesto(buffer: ArrayBuffer): Promise<CeldaImportada[]> {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buffer);
  const ws = wb.worksheets[0];
  if (!ws) return [];

  const resultado: CeldaImportada[] = [];
  let columnasMes = new Map<number, number>(); // columna -> mes

  ws.eachRow({ includeEmpty: false }, (row) => {
    const encabezado = new Map<number, number>();
    row.eachCell({ includeEmpty: false }, (cell, col) => {
      const v = valorCelda(cell.value);
      if (typeof v === "string" && col > 1) {
        const mes = MES_POR_NOMBRE.get(normalizar(v));
        if (mes) encabezado.set(col, mes);
      }
    });
    if (encabezado.size > 0) {
      columnasMes = encabezado;
      return;
    }
    if (columnasMes.size === 0) return;

    const nombre = valorCelda(row.getCell(1).value);
    if (typeof nombre !== "string" || !nombre.trim()) return;
    const n = normalizar(nombre);
    if (n.startsWith("total") || n.startsWith("saldo")) return;

    for (const [col, month] of columnasMes) {
      const v = valorCelda(row.getCell(col).value);
      const monto = typeof v === "number" ? v : typeof v === "string" && v.trim() !== "" ? Number(v.replace(/\./g, "").replace(",", ".")) : NaN;
      if (Number.isFinite(monto)) resultado.push({ categoria: nombre.trim(), month, monto: Math.round(monto) });
    }
  });

  return resultado;
}
