/** Tipos "flojos" para el JSON crudo tal y como sale del export. A propósito
 * no son estrictos: el dataset es heterogéneo y forzar un tipo rígido aquí
 * solo movería los `any` a otro sitio. La normalización estricta ocurre en
 * normalize-contact.ts, que es lo único que el resto de la app consume. */
export interface RawInteraction {
  id: string;
  channel: string;
  direction: string;
  created_at: string | number | null;
  content: string | null;
  metadata: Record<string, unknown> | null;
}

export interface RawContact {
  id: string;
  organization_id: string;
  full_name: string | null;
  phone: string | null;
  email: string | null;
  lead_source: string | null;
  contact_type: string | null;
  created_at: string | number | null;
  is_test?: boolean;
  tags?: string[] | null;
  notes?: string | null;
  qualification_data?: unknown;
  ai_handoff?: boolean;
  handoff_reason?: string | null;
  handoff_requested_at?: string | null;
  interactions: RawInteraction[];
}

export interface RawDataset {
  organization: { id: string; name: string };
  exported_at: string;
  contacts: RawContact[];
}
