export interface QualificationFact {
  key: string;
  label: string;
  value: unknown;
  displayValue: string;
  source: string;
  sourceLabel: string;
  sourceKind: "ia" | "humano" | "desconocido";
  confidence?: string | null;
  updatedAt: string | null;
}

export interface QualificationGroup {
  key: string;
  label: string;
  facts: QualificationFact[];
}

export interface NormalizedInteraction {
  id: string;
  channel: string;
  channelLabel: string;
  direction: "inbound" | "outbound" | "unknown";
  content: string | null;
  createdAt: string | null;
  transcriptExcerpt: string | null;
  durationSec: number | null;
  metadata: Record<string, unknown> | null;
}

export interface NormalizedPhone {
  e164: string;
  display: string;
  digitsOnly: string;
  waLink: string;
  telLink: string;
}

export interface ComplianceState {
  blocked: boolean;
  reason: string | null;
  softPreference: string | null;
}

export interface DuplicateMatch {
  contactId: string;
  name: string;
  reason: string;
}

export interface NormalizedContact {
  id: string;
  organizationId: string;
  displayName: string;
  nameSource: "full_name" | "phone" | "email" | "fallback";
  initials: string;
  phone: NormalizedPhone | null;
  rawPhone: string | null;
  email: string | null;
  channel: { key: string; label: string };
  contactType: string | null;
  createdAt: string | null;
  isTest: boolean;
  tags: string[];
  notes: string | null;
  qualificationGroups: QualificationGroup[];
  hasQualification: boolean;
  interactions: NormalizedInteraction[];
  compliance: ComplianceState;
  aiHandoff: { pending: boolean; reason: string | null; requestedAt: string | null };
  duplicates: DuplicateMatch[];
}
