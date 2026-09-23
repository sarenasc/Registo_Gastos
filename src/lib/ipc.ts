export type IpcMes = { year: number; month: number; valor: number };

// Serie mensual del IPC (variacion % mensual, base publicada por el INE / Banco Central de Chile),
// obtenida de la API publica mindicador.cl.
async function ipcDelAnio(year: number): Promise<IpcMes[]> {
  try {
    const res = await fetch(`https://mindicador.cl/api/ipc/${year}`, {
      next: { revalidate: 60 * 60 * 12 },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return [];
    const data = (await res.json()) as { serie?: { fecha: string; valor: number }[] };
    return (data.serie ?? []).map((s) => {
      const f = new Date(s.fecha);
      // La fecha llega como primer dia del mes en hora de Chile (03:00/04:00 UTC).
      return { year: f.getUTCFullYear(), month: f.getUTCMonth() + 1, valor: s.valor };
    });
  } catch {
    return [];
  }
}

export async function obtenerSerieIpc(desdeYear: number, hastaYear: number): Promise<IpcMes[]> {
  const years = Array.from({ length: hastaYear - desdeYear + 1 }, (_, i) => desdeYear + i);
  const series = await Promise.all(years.map(ipcDelAnio));
  return series.flat().sort((a, b) => a.year - b.year || a.month - b.month);
}

/** Variacion acumulada (%) entre dos meses, ambos incluidos. */
export function ipcAcumulado(serie: IpcMes[], desde: { year: number; month: number }, hasta: { year: number; month: number }) {
  const idx = (y: number, m: number) => y * 12 + m;
  const a = idx(desde.year, desde.month);
  const b = idx(hasta.year, hasta.month);
  let factor = 1;
  let meses = 0;
  for (const s of serie) {
    const i = idx(s.year, s.month);
    if (i >= a && i <= b) {
      factor *= 1 + s.valor / 100;
      meses++;
    }
  }
  return { porcentaje: (factor - 1) * 100, factor, meses };
}
