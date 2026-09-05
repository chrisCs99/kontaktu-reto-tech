import "server-only";
import { readFile } from "node:fs/promises";
import path from "node:path";
import type { RawDataset } from "./raw-types";
import type { NormalizedContact } from "./types";
import { normalizeContact } from "./normalize-contact";
import { normalizePhone } from "./phone";
import { detectDuplicates } from "./duplicates";
import { toTitleCase } from "./names";

const DATA_PATH = path.join(process.cwd(), "src/data/contactos.json");

let cache: NormalizedContact[] | null = null;

/**
 * Decisiones de scope de datos (documentadas también en el README):
 * - El export mezcla contactos de dos organizaciones (ORG-0031 y ORG-0047).
 *   Un agente de Miralvento no debería ver leads de otra agencia, así que
 *   filtramos por la organización del propio dataset (organization.id).
 * - is_test: true son contactos de prueba del CRM ("Prueba Prueba"): los
 *   excluimos por completo, como haría cualquier bandeja de trabajo real.
 */
async function loadDataset(): Promise<NormalizedContact[]> {
  if (cache) return cache;

  const file = await readFile(DATA_PATH, "utf-8");
  const dataset = JSON.parse(file) as RawDataset;

  const scoped = dataset.contacts.filter(
    (contact) => contact.organization_id === dataset.organization.id && !contact.is_test
  );

  const candidates = scoped.map((contact) => ({
    id: contact.id,
    name: contact.full_name ? toTitleCase(contact.full_name) : contact.id,
    phoneDigits: normalizePhone(contact.phone)?.digitsOnly ?? null,
  }));
  const duplicateMap = detectDuplicates(candidates);

  cache = scoped.map((contact) => normalizeContact(contact, duplicateMap.get(contact.id) ?? []));
  return cache;
}

export async function listContacts(): Promise<NormalizedContact[]> {
  const contacts = await loadDataset();
  return [...contacts].sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""));
}

export async function getContactById(id: string): Promise<NormalizedContact | null> {
  const contacts = await loadDataset();
  return contacts.find((contact) => contact.id === id) ?? null;
}
