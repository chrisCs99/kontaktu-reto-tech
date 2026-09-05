"use client";

import { useState } from "react";
import type { NormalizedInteraction } from "@/lib/types";
import { formatDate } from "@/lib/dates";
import { ChannelBadge } from "./ChannelBadge";

function DirectionLabel({ direction }: { direction: NormalizedInteraction["direction"] }) {
  if (direction === "inbound") return <span className="text-gray-400">Entrante</span>;
  if (direction === "outbound") return <span className="text-gray-400">Saliente</span>;
  return null;
}

function InteractionItem({ interaction }: { interaction: NormalizedInteraction }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <li className="relative pb-6 pl-6 last:pb-0">
      <span className="absolute left-0 top-1.5 h-2 w-2 rounded-full bg-kontaktu-orange" aria-hidden />
      <span className="absolute left-[3px] top-4 bottom-0 w-px bg-gray-200 last:hidden" aria-hidden />

      <div className="flex flex-wrap items-center gap-2 text-xs">
        <ChannelBadge channelKey={interaction.channel} label={interaction.channelLabel} />
        <DirectionLabel direction={interaction.direction} />
        <span className="text-gray-400">{formatDate(interaction.createdAt, true)}</span>
        {interaction.durationSec && (
          <span className="text-gray-400">· {Math.round(interaction.durationSec / 60)} min</span>
        )}
      </div>

      {interaction.content && <p className="mt-1.5 text-sm text-kontaktu-black">{interaction.content}</p>}

      {Boolean(interaction.metadata?.property_ref) && (
        <p className="mt-1 text-xs text-gray-400">Ref. propiedad: {String(interaction.metadata?.property_ref)}</p>
      )}

      {interaction.transcriptExcerpt && (
        <div className="mt-2">
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="text-xs font-medium text-kontaktu-orange-deep underline underline-offset-2"
          >
            {expanded ? "Ocultar transcripción" : "Ver transcripción"}
          </button>
          {expanded && (
            <pre className="mt-2 whitespace-pre-wrap rounded-xl bg-surface-2 p-3 font-mono text-xs text-gray-700">
              {interaction.transcriptExcerpt}
            </pre>
          )}
        </div>
      )}
    </li>
  );
}

export function InteractionTimeline({ interactions }: { interactions: NormalizedInteraction[] }) {
  if (interactions.length === 0) {
    return (
      <section className="rounded-card bg-white p-5 shadow-float ring-1 ring-black/5">
        <h2 className="font-brand text-lg font-semibold">Interacciones</h2>
        <p className="mt-2 text-sm text-gray-500">Todavía no hay interacciones registradas con este contacto.</p>
      </section>
    );
  }

  const chronological = [...interactions].reverse();

  return (
    <section className="rounded-card bg-white p-5 shadow-float ring-1 ring-black/5">
      <h2 className="font-brand text-lg font-semibold">Interacciones</h2>
      <ol className="mt-4">
        {chronological.map((interaction) => (
          <InteractionItem key={interaction.id} interaction={interaction} />
        ))}
      </ol>
    </section>
  );
}
