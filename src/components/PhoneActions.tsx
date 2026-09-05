import type { ComplianceState, NormalizedPhone } from "@/lib/types";

export function PhoneActions({
  phone,
  compliance,
  email,
}: {
  phone: NormalizedPhone | null;
  compliance: ComplianceState;
  email: string | null;
}) {
  if (compliance.blocked) {
    return (
      <div className="flex flex-col gap-2">
        <div className="flex gap-2">
          <span className="cursor-not-allowed rounded-full bg-gray-100 px-4 py-2 text-sm font-medium text-gray-400">
            Llamar
          </span>
          <span className="cursor-not-allowed rounded-full bg-gray-100 px-4 py-2 text-sm font-medium text-gray-400">
            WhatsApp
          </span>
          {email && (
            <a
              href={`mailto:${email}`}
              className="rounded-full bg-kontaktu-black px-4 py-2 text-sm font-medium text-white transition hover:bg-black"
            >
              Escribir email
            </a>
          )}
        </div>
        <p className="text-xs font-medium text-rose-600">No llamar — este contacto lo pidió expresamente.</p>
      </div>
    );
  }

  if (!phone) {
    return <p className="text-sm text-gray-400">Sin teléfono registrado</p>;
  }

  return (
    <div className="flex gap-2">
      <a
        href={phone.telLink}
        className="rounded-full bg-kontaktu-orange px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-kontaktu-orange-deep"
      >
        Llamar
      </a>
      <a
        href={phone.waLink}
        target="_blank"
        rel="noopener noreferrer"
        className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-emerald-700"
      >
        WhatsApp
      </a>
    </div>
  );
}
