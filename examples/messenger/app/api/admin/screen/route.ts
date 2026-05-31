import { NextResponse } from "next/server";
import { screenExport } from "@/lib/tools/trainguard";

export const runtime = "nodejs";

/** Admin: run TrainGuard over the (synthetic) "export for training" corpus. */
export async function POST() {
  const report = await screenExport();
  return NextResponse.json({ report });
}
