export type IpcMes = { year: number; month: number; valor: number };

// Serie mensual del IPC (variación % mensual publicada por el INE).
// Fuente principal: API de la CMF (requiere CMF_API_KEY, gratuita en api.cmfchile.cl).
// Respaldo: mindicador.cl, que es lento y en 2026 dejó de publicar el IPC.
const CACHE = { next: { revalidate: 60 * 60 * 12 } } as const;

function parseValor(v: unknown): number {
  return typeof v === "number" ? v : Number(String(v).replace(/\./g, "").replace(",", "."));
}

async function ipcCmf(year: number): Promise<IpcMes[]> {
  const key = process.env.CMF_API_KEY;
  if (!key) return [];
  try {
    const url = `https://api.cmfchile.cl/api-sbifv3/recursos_api/ipc/${year}?apikey=${encodeURIComponent(key)}&formato=json`;
    const res = await fetch(url, { ...CACHE, signal: AbortSignal.timeout(10000) });
    if (!res.ok) return [];
    const data = (await res.json()) as Record<string, unknown>;
    // Respuesta: { "IPCs": [{ "Valor": "0,3", "Fecha": "2026-01-01" }, ...] }
    const lista = (data.IPCs ?? Object.values(data).find(Array.isArray) ?? []) as { Valor?: unknown; Fecha?: string }[];
    return lista
      .filter((x) => x.Fecha && x.Valor !== undefined)
      .map((x) => {
        const [y, m] = x.Fecha!.split("-").map(Number);
        return { year: y, month: m, valor: parseValor(x.Valor) };
      })
      .filter((x) => x.year === year && x.month >= 1 && x.month <= 12 && Number.isFinite(x.valor));
  } catch {
    return [];
  }
}

async function ipcMindicador(year: number): Promise<IpcMes[]> {
  try {
    const res = await fetch(`https://mindicador.cl/api/ipc/${year}`, { ...CACHE, signal: AbortSignal.timeout(12000) });
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

async function ipcDelAnio(year: number): Promise<IpcMes[]> {
  const cmf = await ipcCmf(year);
  if (cmf.length > 0) return cmf;
  return ipcMindicador(year);
}

export function tieneFuenteCmf() {
  return Boolean(process.env.CMF_API_KEY);
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
