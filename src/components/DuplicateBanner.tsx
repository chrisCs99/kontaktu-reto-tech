import Link from "next/link";
import type { DuplicateMatch } from "@/lib/types";

export function DuplicateBanner({ duplicates }: { duplicates: DuplicateMatch[] }) {
  if (duplicates.length === 0) return null;

  return (
    <div className="flex items-start gap-3 rounded-2xl bg-sky-50 px-4 py-3 text-sm text-sky-900 ring-1 ring-sky-200">
      <span aria-hidden>🔗</span>
      <div>
        <p className="font-semibold">Posible contacto duplicado</p>
        <ul className="mt-1 space-y-1 text-sky-800">
          {duplicates.map((match) => (
            <li key={match.contactId}>
              También aparece como{" "}
              <Link href={`/contactos/${match.contactId}`} className="font-medium underline underline-offset-2">
                {match.name}
              </Link>{" "}
              ({match.reason}).
            </li>
          ))}
        </ul>
        <p className="mt-2 text-xs text-sky-700">
          Propuesta de fusión: conservar la ficha con más interacciones/cualificación como principal, combinar el
          histórico de interacciones de ambas en un único timeline, y quedarse con el hecho más reciente de cada
          clave de cualificación cuando choquen. Requiere confirmación humana antes de fusionar — no lo hacemos
          automáticamente.
        </p>
      </div>
    </div>
  );
}
