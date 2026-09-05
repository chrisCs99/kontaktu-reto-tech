/**
 * El dataset trae fechas en al menos 4 formas: ISO 8601 ("2026-07-08T10:28:00Z"),
 * fecha española sin hora ("11/07/2026"), fecha española con hora
 * ("10/07/2026 18:42") y timestamp unix en segundos (1782259200). Esta función
 * las homogeneiza a Date | null para poder ordenar el timeline cronológicamente.
 */
export function parseFlexibleDate(input: string | number | null | undefined): Date | null {
  if (input === null || input === undefined || input === "") return null;

  if (typeof input === "number") {
    const ms = input < 10_000_000_000 ? input * 1000 : input;
    const date = new Date(ms);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  const isoLike = /^\d{4}-\d{2}-\d{2}/;
  if (isoLike.test(input)) {
    const date = new Date(input);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  const esFormat = input.match(/^(\d{2})\/(\d{2})\/(\d{4})(?:\s+(\d{2}):(\d{2}))?$/);
  if (esFormat) {
    const [, day, month, year, hour, minute] = esFormat;
    const date = new Date(
      Number(year),
      Number(month) - 1,
      Number(day),
      hour ? Number(hour) : 0,
      minute ? Number(minute) : 0
    );
    return Number.isNaN(date.getTime()) ? null : date;
  }

  const fallback = new Date(input);
  return Number.isNaN(fallback.getTime()) ? null : fallback;
}

export function toIso(input: string | number | null | undefined): string | null {
  const date = parseFlexibleDate(input);
  return date ? date.toISOString() : null;
}

export function formatDate(iso: string | null, withTime = false): string {
  if (!iso) return "Fecha desconocida";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "Fecha desconocida";
  return date.toLocaleString("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  });
}
