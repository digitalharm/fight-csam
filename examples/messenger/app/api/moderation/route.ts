import { NextResponse } from "next/server";
import { db } from "@/lib/store";
import { verifyCustody, getCustody } from "@/lib/tools/evidencevault";

export const runtime = "nodejs";

/** Moderator view: every block, with its custody record + chain verification. */
export async function GET() {
  const events = db.moderationEvents();
  const enriched = await Promise.all(
    events.map(async (e) => {
      const custody = e.custodyId ? getCustody(e.custodyId) : undefined;
      const custodyIntact = e.custodyId ? await verifyCustody(e.custodyId) : undefined;
      return {
        ...e,
        custody: custody
          ? {
              id: custody.id,
              contentRefHash: custody.contentRefHash,
              retentionSchedule: custody.retentionSchedule,
              entryCount: custody.entries.length,
              intact: custodyIntact,
            }
          : undefined,
      };
    }),
  );
  return NextResponse.json({ events: enriched });
}
