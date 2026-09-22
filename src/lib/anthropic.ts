import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";

const MODEL = process.env.CONSEJOS_AI_MODEL || "claude-opus-5";

export const ConsejoSchema = z.object({
  categoria: z
    .string()
    .describe("Nombre exacto de la categoría de gasto a la que aplica (debe coincidir con una de las categorías dadas), o 'general' si no aplica a una categoría específica"),
  titulo: z.string().describe("Título corto y accionable, en español, máximo 80 caracteres"),
  descripcion: z
    .string()
    .describe("Explicación breve, concreta y accionable en español. Si encontraste una alternativa real (plan, proveedor, precio), nómbrala explícitamente."),
  ahorro_estimado_mensual: z.number().describe("Ahorro estimado mensual en pesos chilenos (CLP). Usa 0 si no puedes estimarlo."),
  url_fuente: z.string().nullable().describe("URL de la fuente si encontraste la alternativa buscando en internet, o null si es un consejo general"),
});

export const ConsejosResponseSchema = z.object({
  consejos: z.array(ConsejoSchema).max(8),
});

export type Consejo = z.infer<typeof ConsejoSchema>;

type CandidatoConsejo = {
  categoria: string;
  tipo: string;
  prioridad: string;
  real: number;
  presupuestado: number;
};

function assertApiKey() {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error(
      "Falta ANTHROPIC_API_KEY. Agrégala a tu archivo .env.local (ver .env.example) y a las variables de entorno del proyecto en Vercel."
    );
  }
}

export async function generarConsejosConIA(candidatos: CandidatoConsejo[]): Promise<Consejo[]> {
  assertApiKey();
  const client = new Anthropic();

  const listado = candidatos
    .map(
      (c) =>
        `- ${c.categoria} (tipo: ${c.tipo}, prioridad: ${c.prioridad}): gasto real este mes $${c.real.toLocaleString("es-CL")}` +
        (c.presupuestado > 0 ? `, presupuestado $${c.presupuestado.toLocaleString("es-CL")}` : "")
    )
    .join("\n");

  const researchSystemPrompt = [
    "Eres un asesor financiero personal chileno, práctico y directo.",
    "Te doy una lista de categorías de gasto de una persona (con su gasto real del mes) que son candidatas a optimizar,",
    "porque están sobre presupuesto o tienen baja prioridad para la persona.",
    "Para categorías que correspondan a servicios o suscripciones con mercado competitivo en Chile (celular, internet, streaming, seguros, etc.),",
    "usa la herramienta de búsqueda web para encontrar UNA alternativa real y más barata (plan de otra compañía, promoción vigente, etc.),",
    "cita el proveedor y el precio que encontraste, y guarda la URL de la fuente.",
    "Para categorías que no tengan una alternativa de mercado buscable (arriendo, comida, colegio, etc.), da un consejo práctico y concreto para reducir el gasto, sin inventar URLs.",
    "Sé realista con los montos: nunca inventes un ahorro sin justificarlo con lo que encontraste o con un cálculo razonable.",
    "Responde en español de Chile, en un texto plano describiendo cada hallazgo (no en JSON todavía).",
  ].join(" ");

  let messages: Anthropic.MessageParam[] = [
    {
      role: "user",
      content: `Estas son las categorías candidatas:\n${listado}\n\nInvestiga y dame tus hallazgos y consejos, uno por categoría (máximo 8 en total).`,
    },
  ];

  let researchText = "";
  for (let i = 0; i < 6; i++) {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 8000,
      system: researchSystemPrompt,
      tools: [{ type: "web_search_20260209", name: "web_search", max_uses: 6 }],
      messages,
    });

    const textBlocks = response.content.filter((b): b is Anthropic.TextBlock => b.type === "text");
    researchText = textBlocks.map((b) => b.text).join("\n");

    if (response.stop_reason === "pause_turn") {
      messages = [...messages, { role: "assistant", content: response.content }];
      continue;
    }
    break;
  }

  if (!researchText) return [];

  const structured = await client.messages.parse({
    model: MODEL,
    max_tokens: 4000,
    output_config: {
      format: zodOutputFormat(ConsejosResponseSchema),
      effort: "low",
    },
    messages: [
      {
        role: "user",
        content: `Convierte este análisis en la lista estructurada de consejos. Categorías válidas: ${candidatos.map((c) => c.categoria).join(", ")}, o "general".\n\nAnálisis:\n${researchText}`,
      },
    ],
  });

  return structured.parsed_output?.consejos ?? [];
}
