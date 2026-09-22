"use client";

import { useTransition } from "react";
import { Check, ExternalLink, X } from "lucide-react";
import { actualizarEstadoConsejo } from "./actions";
import { ESTADO_CONSEJO_LABEL, FUENTE_CONSEJO_LABEL } from "@/lib/constants";
import { formatCLP } from "@/lib/format";

type Item = {
  id: string;
  title: string;
  description: string;
  source: "REGLA" | "IA";
  status: "PENDIENTE" | "APLICADO" | "DESCARTADO";
  estimatedSavings: unknown;
  sourceUrl: string | null;
  category: { name: string } | null;
};

const STATUS_STYLE: Record<Item["status"], string> = {
  PENDIENTE: "bg-amber-50 text-amber-700",
  APLICADO: "bg-green-50 text-[#0ca30c]",
  DESCARTADO: "bg-slate-100 text-slate-500",
};

export function ConsejoCard({ item }: { item: Item }) {
  const [isPending, startTransition] = useTransition();

  return (
    <li className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-medium text-slate-900">{item.title}</p>
          <p className="text-xs text-slate-400">
            {item.category?.name ?? "General"} · {FUENTE_CONSEJO_LABEL[item.source]}
          </p>
        </div>
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLE[item.status]}`}>
          {ESTADO_CONSEJO_LABEL[item.status]}
        </span>
      </div>

      <p className="text-sm text-slate-600">{item.description}</p>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-3 text-xs text-slate-500">
          {Number(item.estimatedSavings ?? 0) > 0 && <span>Ahorro estimado: {formatCLP(item.estimatedSavings as number)}/mes</span>}
          {item.sourceUrl && (
            <a href={item.sourceUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-emerald-700 hover:underline">
              Fuente <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>
        {item.status === "PENDIENTE" && (
          <div className="flex gap-1.5">
            <button
              disabled={isPending}
              onClick={() => startTransition(() => actualizarEstadoConsejo(item.id, "APLICADO"))}
              className="flex items-center gap-1 rounded-md bg-emerald-600 px-2 py-1 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              <Check className="h-3.5 w-3.5" /> Aplicado
            </button>
            <button
              disabled={isPending}
              onClick={() => startTransition(() => actualizarEstadoConsejo(item.id, "DESCARTADO"))}
              className="flex items-center gap-1 rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-200 disabled:opacity-50"
            >
              <X className="h-3.5 w-3.5" /> Descartar
            </button>
          </div>
        )}
      </div>
    </li>
  );
}
