import type { NormalizedPhone } from "./types";

/**
 * US "Teléfonos siempre bien". El dataset trae teléfonos en 4 formas distintas:
 * "+34 655 12 34 56", "0034612889034", "699112233", "+34-644-556-677",
 * "+34600000000". Todas son números españoles (fijo o móvil de 9 dígitos),
 * así que asumimos +34 como prefijo por defecto cuando no viene explícito.
 * Esta es una decisión de dominio, no un normalizador de teléfonos genérico.
 */
export function normalizePhone(raw: string | null | undefined): NormalizedPhone | null {
  if (!raw) return null;

  let digits = raw.replace(/[^\d+]/g, "");
  if (digits.startsWith("00")) digits = `+${digits.slice(2)}`;
  if (!digits.startsWith("+")) {
    digits = digits.length === 9 ? `+34${digits}` : `+${digits}`;
  }

  const withoutPlus = digits.slice(1);
  if (withoutPlus.length < 9) return null;

  const countryCode = withoutPlus.startsWith("34") ? "34" : withoutPlus.slice(0, withoutPlus.length - 9);
  const nationalNumber = withoutPlus.slice(countryCode.length);

  const groups = nationalNumber.match(/.{1,3}/g) ?? [nationalNumber];
  const display = `+${countryCode} ${groups.join(" ")}`;
  const e164 = `+${countryCode}${nationalNumber}`;

  return {
    e164,
    display,
    digitsOnly: `${countryCode}${nationalNumber}`,
    telLink: `tel:${e164}`,
    waLink: `https://wa.me/${countryCode}${nationalNumber}`,
  };
}
