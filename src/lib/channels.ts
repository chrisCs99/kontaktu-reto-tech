/**
 * lead_source llega como "VOICE_CALL", "llamada", "VOZ" (mismo canal, 3
 * grafías distintas), "whatsapp"/"WHATSAPP", etc. Normalizamos a una clave
 * canónica para poder pintar un badge consistente (R2).
 */
const CHANNEL_MAP: Record<string, { key: string; label: string }> = {
  voice_call: { key: "voice", label: "Llamada (IA)" },
  llamada: { key: "voice", label: "Llamada (IA)" },
  voz: { key: "voice", label: "Llamada (IA)" },
  voice: { key: "voice", label: "Llamada (IA)" },
  whatsapp: { key: "whatsapp", label: "WhatsApp" },
  website: { key: "web", label: "Formulario web" },
  web_form: { key: "web", label: "Formulario web" },
  meta_lead_ads: { key: "meta", label: "Meta Ads" },
  witei: { key: "import", label: "Importado (Witei)" },
  crm: { key: "import", label: "Importado (CRM)" },
  email: { key: "email", label: "Email" },
};

export function normalizeChannel(raw: string | null | undefined): { key: string; label: string } {
  if (!raw) return { key: "unknown", label: "Origen desconocido" };
  const key = raw.trim().toLowerCase();
  return CHANNEL_MAP[key] ?? { key: "unknown", label: raw };
}
