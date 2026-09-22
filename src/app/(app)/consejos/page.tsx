import { prisma } from "@/lib/prisma";
import { getTotalesPorCategoria } from "@/lib/queries";
import { generarInsightsRegla } from "@/lib/consejos-reglas";
import { InsightsRegla } from "./InsightsRegla";
import { GenerarIAButton } from "./GenerarIAButton";
import { ConsejoCard } from "./ConsejoCard";

export const dynamic = "force-dynamic";

export default async function ConsejosPage() {
  const now = new Date();
  const [totales, consejos] = await Promise.all([
    getTotalesPorCategoria(now.getFullYear(), now.getMonth() + 1),
    prisma.adviceItem.findMany({
      include: { category: true },
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
      take: 40,
    }),
  ]);

  const insights = generarInsightsRegla(totales);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Consejos</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Alertas automáticas de tu presupuesto y sugerencias de la IA para bajar gastos o mejorar tus ingresos.
          </p>
        </div>
        <GenerarIAButton />
      </div>

      <div>
        <h2 className="mb-3 text-lg font-medium text-slate-900 dark:text-slate-100">Alertas de este mes</h2>
        <InsightsRegla insights={insights} />
      </div>

      <div>
        <h2 className="mb-3 text-lg font-medium text-slate-900 dark:text-slate-100">Consejos guardados</h2>
        {consejos.length === 0 ? (
          <p className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-500">
            Aún no hay consejos guardados. Guarda una alerta de arriba o genera sugerencias con IA.
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {consejos.map((c) => (
              <ConsejoCard key={c.id} item={c} />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
