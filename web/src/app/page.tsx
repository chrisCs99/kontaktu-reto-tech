"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { NormalizedContact } from "@/lib/types";
import { Avatar } from "@/components/Avatar";
import { ChannelBadge } from "@/components/ChannelBadge";
import { formatDate } from "@/lib/dates";

type LoadState = "loading" | "error" | "ready";

export default function ContactsListPage() {
  const [contacts, setContacts] = useState<NormalizedContact[]>([]);
  const [state, setState] = useState<LoadState>("loading");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setState("loading");
      try {
        const res = await fetch("/api/contacts");
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (!cancelled) {
          setContacts(data.contacts);
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
  }, []);

  return (
    <div className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-6">
      <header className="mb-6 flex items-baseline justify-between">
        <div>
          <p className="font-brand text-sm font-semibold uppercase tracking-widest text-kontaktu-orange">Kontaktu</p>
          <h1 className="font-brand text-2xl font-semibold text-kontaktu-black">Contactos</h1>
        </div>
        {state === "ready" && <span className="text-sm text-gray-400">{contacts.length} contactos</span>}
      </header>

      {state === "loading" && (
        <ul className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <li key={i} className="h-20 animate-pulse rounded-card bg-surface-2" />
          ))}
        </ul>
      )}

      {state === "error" && (
        <div className="rounded-card bg-white p-6 text-center shadow-float ring-1 ring-black/5">
          <p className="font-medium text-rose-600">No hemos podido cargar los contactos.</p>
          <button
            type="button"
            onClick={() => location.reload()}
            className="mt-3 rounded-full bg-kontaktu-black px-4 py-2 text-sm font-medium text-white"
          >
            Reintentar
          </button>
        </div>
      )}

      {state === "ready" && contacts.length === 0 && (
        <div className="rounded-card bg-white p-6 text-center text-gray-500 shadow-float ring-1 ring-black/5">
          Todavía no hay contactos.
        </div>
      )}

      {state === "ready" && contacts.length > 0 && (
        <ul className="space-y-2">
          {contacts.map((contact) => {
            const lastInteraction = contact.interactions[contact.interactions.length - 1];
            return (
              <li key={contact.id}>
                <Link
                  href={`/contactos/${contact.id}`}
                  className="flex items-center gap-4 rounded-card bg-white p-4 shadow-float ring-1 ring-black/5 transition hover:ring-kontaktu-orange/40"
                >
                  <Avatar seed={contact.id} initials={contact.initials} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate font-medium text-kontaktu-black">{contact.displayName}</p>
                      {contact.compliance.blocked && (
                        <span className="shrink-0 text-xs font-semibold text-rose-600">⛔ No llamar</span>
                      )}
                      {contact.duplicates.length > 0 && (
                        <span className="shrink-0 text-xs font-semibold text-sky-600">🔗 Posible duplicado</span>
                      )}
                    </div>
                    <p className="truncate text-sm text-gray-400">
                      {lastInteraction ? lastInteraction.content ?? "Sin resumen" : "Sin interacciones todavía"}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1 text-xs text-gray-400">
                    <ChannelBadge channelKey={contact.channel.key} label={contact.channel.label} />
                    <span>{formatDate(contact.createdAt)}</span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
