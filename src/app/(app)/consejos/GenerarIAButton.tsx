"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Wand2 } from "lucide-react";

export function GenerarIAButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState<string | null>(null);

  async function generar() {
    setLoading(true);
    setMensaje(null);
    try {
      const res = await fetch("/api/consejos/generar", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setMensaje(data.error ?? "Ocurrió un error generando consejos.");
      } else if (data.creados === 0) {
        setMensaje(data.mensaje ?? "Sin nuevas sugerencias.");
      } else {
        setMensaje(`Se generaron ${data.creados} consejo(s) nuevos.`);
        startTransition(() => router.refresh());
      }
    } catch {
      setMensaje("No se pudo conectar con el servicio de IA.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={generar}
        disabled={loading || isPending}
        className="flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-60"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
        Generar consejos con IA
      </button>
      {mensaje && <p className="text-xs text-slate-500">{mensaje}</p>}
    </div>
  );
}
