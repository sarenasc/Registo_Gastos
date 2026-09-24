import ExcelJS from "exceljs";
import { MESES } from "@/lib/constants";

type Categoria = { id: string; name: string; type: "INGRESO" | "COSTO" | "GASTO" };
type Item = { categoryId: string; month: number; plannedAmount: number };

const FUENTE = "Arial";
const FORMATO_MONTO = "#,##0;-#,##0";
const FORMATO_SALDO = "#,##0;[Red]-#,##0";

const relleno = (argb: string): ExcelJS.Fill => ({ type: "pattern", pattern: "solid", fgColor: { argb } });
const colLetra = (n: number) => String.fromCharCode(64 + n); // 1 -> A

/**
 * Misma estructura que la planilla original: ingresos arriba con su total y el
 * saldo, luego el bloque "Gastos" con los 12 meses, Total Año y % del total.
 * Los totales son formulas, asi que el archivo se recalcula si se edita.
 */
export async function generarExcelPresupuesto(opts: {
  year: number;
  version: number;
  estado: "ABIERTO" | "CERRADO";
  categorias: Categoria[];
  items: Item[];
  /** Meses (1-12) a incluir; por defecto los 12. */
  meses?: number[];
  /** Reemplaza el titulo y el nombre de la hoja (ej. para el registro real). */
  titulo?: string;
  hoja?: string;
}): Promise<Buffer> {
  const { year, version, estado, categorias, items } = opts;
  const meses = (opts.meses?.length ? [...new Set(opts.meses)].filter((m) => m >= 1 && m <= 12).sort((a, b) => a - b) : MESES.map((_, i) => i + 1));
  const parcial = meses.length < 12;
  const wb = new ExcelJS.Workbook();
  wb.creator = "Registro de Gastos";
  wb.calcProperties.fullCalcOnLoad = true;
  const ws = wb.addWorksheet(opts.hoja ?? `Presupuesto ${year}`, { views: [{ state: "frozen", xSplit: 1, ySplit: 0 }] });

  const montos = new Map<string, number[]>();
  for (const c of categorias) montos.set(c.id, Array(12).fill(0));
  for (const i of items) {
    const arr = montos.get(i.categoryId);
    if (arr) arr[i.month - 1] = i.plannedAmount;
  }

  const ingresos = categorias.filter((c) => c.type === "INGRESO");
  const gastos = categorias.filter((c) => c.type !== "INGRESO");

  const COL_MES1 = 2; // B
  const COL_TOTAL = COL_MES1 + meses.length; // primera columna despues de los meses
  const COL_PCT = COL_TOTAL + 1;
  const LT = colLetra(COL_TOTAL);
  const ultimaMes = colLetra(COL_TOTAL - 1); // M

  ws.getColumn(1).width = 30;
  for (let c = COL_MES1; c <= COL_TOTAL; c++) ws.getColumn(c).width = 13;
  ws.getColumn(COL_PCT).width = 11;

  const titulo = ws.getCell("A1");
  titulo.value = opts.titulo ?? `Presupuesto ${year} - versión ${version} (${estado === "CERRADO" ? "cerrado" : "abierto"})`;
  titulo.font = { name: FUENTE, bold: true, size: 14 };

  const encabezado = (fila: number, etiqueta: string, conPct: boolean) => {
    const row = ws.getRow(fila);
    row.getCell(1).value = etiqueta;
    meses.forEach((m, i) => (row.getCell(COL_MES1 + i).value = MESES[m - 1]));
    row.getCell(COL_TOTAL).value = parcial ? "Total" : "Total Año";
    if (conPct) row.getCell(COL_PCT).value = "%";
    const hasta = conPct ? COL_PCT : COL_TOTAL;
    for (let c = 1; c <= hasta; c++) {
      const cell = row.getCell(c);
      cell.font = { name: FUENTE, bold: true, color: { argb: "FFFFFFFF" } };
      cell.fill = relleno("FF1F4E78");
      cell.alignment = { horizontal: c === 1 ? "left" : "right" };
    }
  };

  const escribirCategoria = (fila: number, c: Categoria, colorFuente: string) => {
    const row = ws.getRow(fila);
    row.getCell(1).value = c.name;
    row.getCell(1).font = { name: FUENTE };
    const delMes = meses.map((m) => (montos.get(c.id) ?? [])[m - 1] ?? 0);
    delMes.forEach((m, i) => {
      const cell = row.getCell(COL_MES1 + i);
      cell.value = m;
      cell.numFmt = FORMATO_MONTO;
      cell.font = { name: FUENTE, color: { argb: colorFuente } };
    });
    const total = row.getCell(COL_TOTAL);
    total.value = { formula: `SUM(B${fila}:${ultimaMes}${fila})`, result: delMes.reduce((a, b) => a + b, 0) };
    total.numFmt = FORMATO_MONTO;
    total.font = { name: FUENTE, bold: true, color: { argb: colorFuente } };
  };

  const filaTotal = (fila: number, etiqueta: string, desde: number, hasta: number, colorFondo: string) => {
    const row = ws.getRow(fila);
    row.getCell(1).value = etiqueta;
    for (let c = COL_MES1; c <= COL_TOTAL; c++) {
      const L = colLetra(c);
      row.getCell(c).value = { formula: hasta >= desde ? `SUM(${L}${desde}:${L}${hasta})` : "0" };
      row.getCell(c).numFmt = FORMATO_MONTO;
    }
    for (let c = 1; c <= COL_TOTAL; c++) {
      row.getCell(c).font = { name: FUENTE, bold: true };
      row.getCell(c).fill = relleno(colorFondo);
    }
  };

  // --- Ingresos ---
  let fila = 3;
  encabezado(fila, "Ingresos", false);
  const iniIng = fila + 1;
  ingresos.forEach((c, i) => escribirCategoria(iniIng + i, c, "FF2A78D6"));
  const finIng = iniIng + ingresos.length - 1;
  fila = finIng + 1;
  const filaTotalIngresos = fila;
  filaTotal(filaTotalIngresos, "Total ingresos", iniIng, finIng, "FFDDEBF7");

  // --- Saldo (se completa cuando se conoce la fila de total gastos) ---
  const filaSaldo = filaTotalIngresos + 2;

  // --- Gastos ---
  const filaEncGastos = filaSaldo + 2;
  encabezado(filaEncGastos, "Gastos", true);
  const iniGas = filaEncGastos + 1;
  gastos.forEach((c, i) => escribirCategoria(iniGas + i, c, "FFD03B3B"));
  const finGas = iniGas + gastos.length - 1;
  const filaTotalGastos = finGas + 1;
  filaTotal(filaTotalGastos, "Total gastos", iniGas, finGas, "FFFCE4D6");

  // % de participacion de cada gasto en el total anual
  for (let f = iniGas; f <= finGas; f++) {
    const cell = ws.getRow(f).getCell(COL_PCT);
    cell.value = { formula: `IF($${LT}$${filaTotalGastos}=0,0,${LT}${f}/$${LT}$${filaTotalGastos})` };
    cell.numFmt = "0.0%";
    cell.font = { name: FUENTE };
  }

  // Saldo = ingresos - gastos, por mes y anual
  const rowSaldo = ws.getRow(filaSaldo);
  rowSaldo.getCell(1).value = "Saldo del mes";
  for (let c = COL_MES1; c <= COL_TOTAL; c++) {
    const L = colLetra(c);
    rowSaldo.getCell(c).value = { formula: `${L}${filaTotalIngresos}-${L}${filaTotalGastos}` };
    rowSaldo.getCell(c).numFmt = FORMATO_SALDO;
  }
  for (let c = 1; c <= COL_TOTAL; c++) {
    rowSaldo.getCell(c).font = { name: FUENTE, bold: true };
    rowSaldo.getCell(c).fill = relleno("FFE2EFDA");
  }

  const buffer = await wb.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
