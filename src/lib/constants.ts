export const MESES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
] as const;

export const TIPO_LABEL: Record<string, string> = {
  INGRESO: "Ingreso",
  COSTO: "Costo",
  GASTO: "Gasto",
};

export const PRIORIDAD_LABEL: Record<string, string> = {
  ALTA: "Alta",
  MEDIA: "Media",
  BAJA: "Baja",
};

export const FRECUENCIA_LABEL: Record<string, string> = {
  DIARIA: "Diaria",
  SEMANAL: "Semanal",
  MENSUAL: "Mensual",
  ANUAL: "Anual",
  PUNTUAL: "Puntual",
};

export const ESTADO_CONSEJO_LABEL: Record<string, string> = {
  PENDIENTE: "Pendiente",
  APLICADO: "Aplicado",
  DESCARTADO: "Descartado",
};

export const FUENTE_CONSEJO_LABEL: Record<string, string> = {
  REGLA: "Regla",
  IA: "IA",
};
