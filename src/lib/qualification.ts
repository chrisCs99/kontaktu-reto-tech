import type { QualificationFact, QualificationGroup } from "./types";

const GROUP_LABELS: Record<string, string> = {
  sale: "Compra",
  rental: "Alquiler",
  shared: "Comunes",
};

const KEY_LABELS: Record<string, string> = {
  zones: "Zonas",
  budget: "Presupuesto",
  bedrooms: "Habitaciones",
  financing: "Financiación",
  terrace: "Terraza",
  has_pets: "Mascotas",
  urgency: "Urgencia",
  floor_pref: "Planta preferida",
  elevator: "Ascensor",
  orientation: "Orientación",
  garage: "Garaje",
  accesibilidad_movilidad_reducida: "Accesibilidad (movilidad reducida)",
  net_income: "Ingresos netos",
};

const CURRENCY_KEYS = ["budget", "net_income", "income", "precio"];

function humanizeKey(key: string): string {
  if (KEY_LABELS[key]) return KEY_LABELS[key];
  return key
    .replace(/_/g, " ")
    .replace(/^./, (c) => c.toLocaleUpperCase("es-ES"));
}

function isCurrencyKey(key: string): boolean {
  return CURRENCY_KEYS.some((k) => key.toLowerCase().includes(k));
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
    useGrouping: true,
  }).format(value);
}

/** Los valores de un hecho de cualificación pueden ser casi cualquier cosa: string,
 * número, booleano, array, o un objeto de rango ({max}/{min,max}). Esto los
 * convierte todos en algo legible sin romper con tipos que no anticipamos. */
function formatValue(key: string, value: unknown): string {
  if (value === null || value === undefined) return "—";

  if (typeof value === "boolean") return value ? "Sí" : "No";

  if (typeof value === "number") return isCurrencyKey(key) ? formatCurrency(value) : String(value);

  if (typeof value === "string") {
    const numeric = Number(value.replace(/[.\s€]/g, "").replace(",", "."));
    if (isCurrencyKey(key) && !Number.isNaN(numeric) && value.match(/[\d]/)) {
      return formatCurrency(numeric);
    }
    return value;
  }

  if (Array.isArray(value)) return value.map((v) => formatValue(key, v)).join(", ");

  if (typeof value === "object") {
    const obj = value as Record<string, unknown>;
    if ("max" in obj || "min" in obj) {
      const min = obj.min !== undefined ? formatValue(key, obj.min) : null;
      const max = obj.max !== undefined ? formatValue(key, obj.max) : null;
      if (min && max) return `${min} – ${max}`;
      return `Hasta ${max ?? min}`;
    }
    return Object.entries(obj)
      .map(([k, v]) => `${humanizeKey(k)}: ${formatValue(k, v)}`)
      .join(" · ");
  }

  return String(value);
}

function sourceLabel(source: string | undefined): { label: string; kind: "ia" | "humano" | "desconocido" } {
  if (!source) return { label: "Origen desconocido", kind: "desconocido" };
  if (source === "manual") return { label: "Editado por un humano", kind: "humano" };
  if (source === "explicit") return { label: "Dicho por el cliente (IA)", kind: "ia" };
  return { label: source, kind: "desconocido" };
}

function buildFact(key: string, raw: unknown): QualificationFact | null {
  if (raw === null || raw === undefined) return null;

  // Forma "envuelta": { value, source, confidence?, updatedAt?, sourceRef? }
  if (typeof raw === "object" && !Array.isArray(raw) && "value" in (raw as Record<string, unknown>)) {
    const wrapped = raw as Record<string, unknown>;
    const { label, kind } = sourceLabel(wrapped.source as string | undefined);
    return {
      key,
      label: humanizeKey(key),
      value: wrapped.value,
      displayValue: formatValue(key, wrapped.value),
      source: (wrapped.source as string) ?? "desconocido",
      sourceLabel: label,
      sourceKind: kind,
      confidence: (wrapped.confidence as string) ?? null,
      updatedAt: (wrapped.updatedAt as string) ?? null,
    };
  }

  // Forma "suelta": valor plano, sin envoltorio (p. ej. net_income: 3200)
  return {
    key,
    label: humanizeKey(key),
    value: raw,
    displayValue: formatValue(key, raw),
    source: "explicit",
    sourceLabel: sourceLabel("explicit").label,
    sourceKind: "ia",
    confidence: null,
    updatedAt: null,
  };
}

/**
 * qualification_data llega en formas muy distintas entre contactos:
 * - null
 * - objeto anidado { qualification: { sale, rental, shared, _meta } }
 * - string JSON sin parsear (c-003)
 * - objeto con claves sueltas fuera de "qualification" (c-008: net_income,
 *   income_verified, income_source, income_updated_at describen UN hecho,
 *   no cuatro) — las reagrupamos usando el sufijo de la clave hermana.
 */
export function buildQualificationGroups(raw: unknown): QualificationGroup[] {
  let data: unknown = raw;

  if (typeof data === "string") {
    try {
      data = JSON.parse(data);
    } catch {
      console.warn("qualification_data es un string que no es JSON válido, se ignora", raw);
      return [];
    }
  }

  if (!data || typeof data !== "object") return [];

  const root = data as Record<string, unknown>;
  const groups = new Map<string, QualificationFact[]>();

  const pushFact = (groupKey: string, fact: QualificationFact | null) => {
    if (!fact) return;
    const list = groups.get(groupKey) ?? [];
    list.push(fact);
    groups.set(groupKey, list);
  };

  const qualification = root.qualification as Record<string, unknown> | undefined;
  if (qualification && typeof qualification === "object") {
    for (const [groupKey, groupValue] of Object.entries(qualification)) {
      if (groupKey === "_meta" || !groupValue || typeof groupValue !== "object") continue;
      for (const [factKey, factValue] of Object.entries(groupValue as Record<string, unknown>)) {
        pushFact(groupKey, buildFact(factKey, factValue));
      }
    }
  }

  // Claves sueltas al nivel raíz (fuera de "qualification"): agrupar por prefijo.
  const consumedSuffixes = ["_verified", "_source", "_updated_at", "_sourceref"];
  const rootKeys = Object.keys(root).filter((k) => k !== "qualification");
  const suffixedKeys = new Set(
    rootKeys.filter((k) => consumedSuffixes.some((suffix) => k.toLowerCase().endsWith(suffix)))
  );

  for (const key of rootKeys) {
    if (suffixedKeys.has(key)) continue;
    const verified = root[`${key}_verified`];
    const source = root[`${key}_source`];
    const updatedAt = root[`${key}_updated_at`];
    const { label, kind } = verified === true
      ? { label: "Verificado por un humano", kind: "humano" as const }
      : sourceLabel((source as string) ?? "explicit");

    pushFact("shared", {
      key,
      label: humanizeKey(key),
      value: root[key],
      displayValue: formatValue(key, root[key]),
      source: (source as string) ?? "explicit",
      sourceLabel: label,
      sourceKind: kind,
      confidence: null,
      updatedAt: (updatedAt as string) ?? null,
    });
  }

  return Array.from(groups.entries()).map(([key, facts]) => ({
    key,
    label: GROUP_LABELS[key] ?? humanizeKey(key),
    facts,
  }));
}
