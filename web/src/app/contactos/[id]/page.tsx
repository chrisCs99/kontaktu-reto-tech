"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import type { NormalizedContact } from "@/lib/types";
import { Avatar } from "@/components/Avatar";
import { ChannelBadge } from "@/components/ChannelBadge";
import { PhoneActions } from "@/components/PhoneActions";
import { ComplianceBanner } from "@/components/ComplianceBanner";
import { DuplicateBanner } from "@/components/DuplicateBanner";
import { QualificationSection } from "@/components/QualificationSection";
import { InteractionTimeline } from "@/components/InteractionTimeline";
import { formatDate } from "@/lib/dates";

type LoadState = "loading" | "error" | "not_found" | "ready";

export default function ContactDetailPage() {
  const params = useParams<{ id: string }>();
  const [contact, setContact] = useState<NormalizedContact | null>(null);
  const [state, setState] = useState<LoadState>("loading");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setState("loading");
      try {
        const res = await fetch(`/api/contacts/${params.id}`);
        if (res.status === 404) {
          if (!cancelled) setState("not_found");
          return;
        }
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (!cancelled) {
          setContact(data.contact);
          setState("ready");
        }
      } catch {
        if (!cancelled) setState("error");
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [params.id]);

  return (
    <div className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-6">
      <Link href="/" className="mb-6 inline-block text-sm text-gray-400 hover:text-kontaktu-black">
        ← Contactos
      </Link>

      {state === "loading" && (
        <div className="space-y-4">
          <div className="h-32 animate-pulse rounded-card bg-surface-2" />
          <div className="h-48 animate-pulse rounded-card bg-surface-2" />
          <div className="h-64 animate-pulse rounded-card bg-surface-2" />
        </div>
      )}

      {state === "error" && (
        <div className="rounded-card bg-white p-6 text-center shadow-float ring-1 ring-black/5">
          <p className="font-medium text-rose-600">No hemos podido cargar esta ficha.</p>
          <button
            type="button"
            onClick={() => location.reload()}
            className="mt-3 rounded-full bg-kontaktu-black px-4 py-2 text-sm font-medium text-white"
          >
            Reintentar
          </button>
        </div>
      )}

      {state === "not_found" && (
        <div className="rounded-card bg-white p-6 text-center shadow-float ring-1 ring-black/5">
          <p className="font-medium text-kontaktu-black">No encontramos este contacto.</p>
          <p className="mt-1 text-sm text-gray-500">Puede que se haya eliminado o que el enlace sea incorrecto.</p>
          <Link
            href="/"
            className="mt-3 inline-block rounded-full bg-kontaktu-black px-4 py-2 text-sm font-medium text-white"
          >
            Volver al listado
          </Link>
        </div>
      )}

      {state === "ready" && contact && (
        <div className="space-y-4">
          <ComplianceBanner compliance={contact.compliance} />
          <DuplicateBanner duplicates={contact.duplicates} />

          <section className="rounded-card bg-white p-5 shadow-float ring-1 ring-black/5">
            <div className="flex flex-wrap items-start gap-4">
              <Avatar seed={contact.id} initials={contact.initials} size="lg" />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="font-brand text-xl font-semibold text-kontaktu-black">{contact.displayName}</h1>
                  <ChannelBadge channelKey={contact.channel.key} label={contact.channel.label} />
                </div>
                {contact.nameSource !== "full_name" && (
                  <p className="mt-0.5 text-xs text-gray-400">
                    Sin nombre registrado — mostrando {contact.nameSource === "phone" ? "el teléfono" : contact.nameSource === "email" ? "el email" : "un identificador genérico"}.
                  </p>
                )}
                <dl className="mt-2 space-y-0.5 text-sm text-gray-500">
                  {contact.phone && <dd>{contact.phone.display}</dd>}
                  {contact.email && <dd>{contact.email}</dd>}
                  <dd>Alta: {formatDate(contact.createdAt)}</dd>
                </dl>
              </div>
            </div>

            <div className="mt-4">
              <PhoneActions phone={contact.phone} compliance={contact.compliance} email={contact.email} />
            </div>
          </section>

          <QualificationSection groups={contact.qualificationGroups} />
          <InteractionTimeline interactions={contact.interactions} />
        </div>
      )}
    </div>
  );
}
