// kmPorDia: indice 0 = lunes ... 6 = domingo.
export const DIAS_SEMANA = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"] as const;

/** Cuantas veces cae cada dia de la semana (lunes primero) en un mes calendario. */
export function contarDiasSemana(year: number, month: number): number[] {
  const conteo = Array(7).fill(0);
  const diasDelMes = new Date(Date.UTC(year, month, 0)).getUTCDate();
  for (let d = 1; d <= diasDelMes; d++) {
    const dow = new Date(Date.UTC(year, month - 1, d)).getUTCDay(); // 0 = domingo
    conteo[(dow + 6) % 7]++;
  }
  return conteo;
}

export type ResultadoBencina = { kmMes: number; litros: number; costo: number };

export function calcularBencina(year: number, month: number, kmPorDia: number[], kmPorLitro: number, precioLitro: number): ResultadoBencina {
  const conteo = contarDiasSemana(year, month);
  const kmMes = conteo.reduce((acc, veces, i) => acc + veces * (kmPorDia[i] ?? 0), 0);
  const litros = kmPorLitro > 0 ? kmMes / kmPorLitro : 0;
  return { kmMes, litros, costo: Math.round(litros * precioLitro) };
}
