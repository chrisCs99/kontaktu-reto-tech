import type { RawContact, RawInteraction } from "./raw-types";
import type { DuplicateMatch, NormalizedContact, NormalizedInteraction } from "./types";
import { normalizePhone } from "./phone";
import { toTitleCase, initialsFrom } from "./names";
import { normalizeChannel } from "./channels";
import { buildQualificationGroups } from "./qualification";
import { evaluateCompliance } from "./compliance";
import { toIso } from "./dates";

function resolveDisplayName(
  fullName: string | null,
  phoneDisplay: string | null,
  email: string | null
): { displayName: string; nameSource: NormalizedContact["nameSource"] } {
  if (fullName && fullName.trim()) {
    return { displayName: toTitleCase(fullName), nameSource: "full_name" };
  }
  if (phoneDisplay) {
    return { displayName: phoneDisplay, nameSource: "phone" };
  }
  if (email) {
    return { displayName: email, nameSource: "email" };
  }
  return { displayName: "Contacto sin identificar", nameSource: "fallback" };
}

function normalizeInteraction(raw: RawInteraction): NormalizedInteraction {
  const channel = normalizeChannel(raw.channel);
  const direction = raw.direction === "inbound" || raw.direction === "outbound" ? raw.direction : "unknown";
  const metadata = raw.metadata ?? null;

  return {
    id: raw.id,
    channel: channel.key,
    channelLabel: channel.label,
    direction,
    content: raw.content,
    createdAt: toIso(raw.created_at),
    transcriptExcerpt: (metadata?.transcript_excerpt as string) ?? null,
    durationSec: (metadata?.duration_sec as number) ?? null,
    metadata,
  };
}

export function normalizeContact(raw: RawContact, duplicates: DuplicateMatch[] = []): NormalizedContact {
  const phone = normalizePhone(raw.phone);
  const { displayName, nameSource } = resolveDisplayName(raw.full_name, phone?.display ?? null, raw.email);
  const tags = raw.tags ?? [];
  const interactions = (raw.interactions ?? [])
    .map(normalizeInteraction)
    .sort((a, b) => (a.createdAt ?? "").localeCompare(b.createdAt ?? ""));

  const qualificationGroups = buildQualificationGroups(raw.qualification_data);

  return {
    id: raw.id,
    organizationId: raw.organization_id,
    displayName,
    nameSource,
    initials: nameSource === "full_name" ? initialsFrom(displayName) : "•",
    phone,
    rawPhone: raw.phone,
    email: raw.email,
    channel: normalizeChannel(raw.lead_source),
    contactType: raw.contact_type,
    createdAt: toIso(raw.created_at),
    isTest: raw.is_test ?? false,
    tags,
    notes: raw.notes ?? null,
    qualificationGroups,
    hasQualification: qualificationGroups.some((g) => g.facts.length > 0),
    interactions,
    compliance: evaluateCompliance(tags, raw.notes ?? null),
    aiHandoff: {
      pending: raw.ai_handoff ?? false,
      reason: raw.handoff_reason ?? null,
      requestedAt: toIso(raw.handoff_requested_at ?? null),
    },
    duplicates,
  };
}
