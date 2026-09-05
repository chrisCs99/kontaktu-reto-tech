const LOWERCASE_CONNECTORS = new Set(["de", "del", "la", "las", "los", "y"]);

/** Normaliza "JOSÉ LUIS MARTÍN CABRERA" y "carmen ruiz" a formato título consistente. */
export function toTitleCase(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .map((word, index) => {
      if (index > 0 && LOWERCASE_CONNECTORS.has(word)) return word;
      return word.charAt(0).toLocaleUpperCase("es-ES") + word.slice(1);
    })
    .join(" ");
}

export function initialsFrom(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const first = parts[0][0] ?? "";
  const second = parts.length > 1 ? parts[1][0] ?? "" : "";
  return (first + second).toLocaleUpperCase("es-ES");
}
