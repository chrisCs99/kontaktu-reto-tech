import type { ComplianceState } from "@/lib/types";

export function ComplianceBanner({ compliance }: { compliance: ComplianceState }) {
  if (compliance.blocked) {
    return (
      <div className="flex items-start gap-3 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-800 ring-1 ring-rose-200">
        <span aria-hidden>⛔</span>
        <div>
          <p className="font-semibold">No llamar</p>
          <p className="text-rose-700">{compliance.reason}</p>
        </div>
      </div>
    );
  }

  if (compliance.softPreference) {
    return (
      <div className="flex items-start gap-3 rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-800 ring-1 ring-amber-200">
        <span aria-hidden>✉️</span>
        <div>
          <p className="font-semibold">Preferencia de contacto</p>
          <p className="text-amber-700">{compliance.softPreference}</p>
        </div>
      </div>
    );
  }

  return null;
}
