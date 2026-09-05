import { NextResponse } from "next/server";
import { listContacts } from "@/lib/contacts-repo";
import { simulateLatency } from "@/lib/simulate-latency";

export async function GET() {
  await simulateLatency();
  const contacts = await listContacts();
  return NextResponse.json({ contacts });
}
