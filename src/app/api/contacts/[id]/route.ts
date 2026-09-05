import { NextResponse } from "next/server";
import { getContactById } from "@/lib/contacts-repo";
import { simulateLatency } from "@/lib/simulate-latency";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  await simulateLatency();
  const { id } = await params;
  const contact = await getContactById(id);

  if (!contact) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  return NextResponse.json({ contact });
}
