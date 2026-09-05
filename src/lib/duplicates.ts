import type { DuplicateMatch } from "./types";

interface DuplicateCandidate {
  id: string;
  name: string;
  phoneDigits: string | null;
}

/**
 * US "Posibles duplicados". Señal elegida: mismo teléfono normalizado a
 * dígitos (E.164 sin "+"). Es la señal más fiable disponible en este dataset
 * heterogéneo — el dataset trae exactamente un caso (Carmen Ruiz Delgado /
 * carmen ruiz, mismo número en dos formatos). No cruzamos por nombre porque
 * con datos tan sucios (mayúsculas, nombres parciales) da demasiados falsos
 * positivos para un score defendible en el tiempo disponible.
 */
export function detectDuplicates(contacts: DuplicateCandidate[]): Map<string, DuplicateMatch[]> {
  const byPhone = new Map<string, DuplicateCandidate[]>();

  for (const contact of contacts) {
    if (!contact.phoneDigits) continue;
    const group = byPhone.get(contact.phoneDigits) ?? [];
    group.push(contact);
    byPhone.set(contact.phoneDigits, group);
  }

  const result = new Map<string, DuplicateMatch[]>();
  for (const group of byPhone.values()) {
    if (group.length < 2) continue;
    for (const contact of group) {
      const matches = group
        .filter((other) => other.id !== contact.id)
        .map((other) => ({
          contactId: other.id,
          name: other.name,
          reason: "Mismo teléfono, distinto formato",
        }));
      result.set(contact.id, matches);
    }
  }

  return result;
}
