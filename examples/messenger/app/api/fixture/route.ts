import { NextResponse } from "next/server";
import { knownBadFixtureBytes } from "@/lib/tools/detectkit";

export const runtime = "nodejs";

/** Serve the synthetic flagged fixture (base64) so the UI can post it. */
export function GET() {
  const bytes = knownBadFixtureBytes();
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return NextResponse.json({ base64: btoa(bin) });
}
