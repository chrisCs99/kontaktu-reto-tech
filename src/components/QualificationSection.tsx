import type { QualificationGroup } from "@/lib/types";
import { formatDate } from "@/lib/dates";

const SOURCE_STYLES: Record<string, string> = {
  ia: "bg-sky-50 text-sky-700",
  humano: "bg-orange-50 text-kontaktu-orange-deep",
  desconocido: "bg-gray-100 text-gray-500",
};

export function QualificationSection({ groups }: { groups: QualificationGroup[] }) {
  const hasFacts = groups.some((g) => g.facts.length > 0);

  if (!hasFacts) {
    return (
      <section className="rounded-card bg-white p-5 shadow-float ring-1 ring-black/5">
        <h2 className="font-brand text-lg font-semibold">Cualificación</h2>
        <p className="mt-2 text-sm text-gray-500">
          Todavía no hay datos de cualificación para este contacto. Aparecerán aquí en cuanto haya una llamada,
          conversación o edición manual que los aporte.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-card bg-white p-5 shadow-float ring-1 ring-black/5">
      <h2 className="font-brand text-lg font-semibold">Cualificación</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {groups
          .filter((g) => g.facts.length > 0)
          .map((group) => (
            <div key={group.key} className="rounded-2xl bg-surface-2 p-4">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500">{group.label}</h3>
              <dl className="mt-3 space-y-3">
                {group.facts.map((fact) => (
                  <div key={fact.key} className="flex flex-col gap-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <dt className="text-sm text-gray-500">{fact.label}</dt>
                      <dd className="text-right text-sm font-semibold text-kontaktu-black">{fact.displayValue}</dd>
                    </div>
                    <div className="flex items-center justify-end gap-2 text-xs">
                      <span className={`rounded-full px-2 py-0.5 font-medium ${SOURCE_STYLES[fact.sourceKind]}`}>
                        {fact.sourceLabel}
                      </span>
                      {fact.updatedAt && <span className="text-gray-400">{formatDate(fact.updatedAt)}</span>}
                    </div>
                  </div>
                ))}
              </dl>
            </div>
          ))}
      </div>
    </section>
  );
}
