import type { ComplianceState } from "./types";

/**
 * US "Cumplimiento". No hay un campo booleano "no_llamar" en el dataset: la
 * señal está repartida entre tags libres (["no-llamar"]) y texto libre en
 * notes/interacciones ("dejen de llamarme"). Detectamos ambas y distinguimos
 * dos niveles: bloqueo duro (no llamar, hay petición explícita) vs.
 * preferencia blanda (prefiere email, pero no lo pidió expresamente).
 */
const HARD_BLOCK_PATTERNS = [
  /no\s+llam/i,
  /dejen?\s+de\s+llamar/i,
  /solo\s+(por\s+)?email/i,
  /únicamente\s+(por\s+)?email/i,
  /unicamente\s+(por\s+)?email/i,
  /no\s+contactar\s+por\s+tel[eé]fono/i,
];

const SOFT_PREFERENCE_PATTERNS = [/prefiere\s+(el\s+)?contacto\s+por\s+email/i, /prefiere\s+email/i];

export function evaluateCompliance(tags: string[], notes: string | null): ComplianceState {
  const hasBlockTag = tags.some((tag) => tag.toLowerCase().includes("no-llamar"));
  const text = notes ?? "";

  const hardMatch = HARD_BLOCK_PATTERNS.find((pattern) => pattern.test(text));
  if (hasBlockTag || hardMatch) {
    return {
      blocked: true,
      reason: notes ?? "Este contacto ha pedido no ser llamado.",
      softPreference: null,
    };
  }

  const softMatch = SOFT_PREFERENCE_PATTERNS.find((pattern) => pattern.test(text));
  if (softMatch) {
    return { blocked: false, reason: null, softPreference: notes };
  }

  return { blocked: false, reason: null, softPreference: null };
}
