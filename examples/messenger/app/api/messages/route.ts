import { NextRequest, NextResponse } from "next/server";
import { db, rid, type Message } from "@/lib/store";
import { scanImage } from "@/lib/tools/shield";
import { openCustody } from "@/lib/tools/evidencevault";
import { fileSandboxReport } from "@/lib/tools/cybertip";

export const runtime = "nodejs";

function decodeBase64(b64: string): Uint8Array {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

export async function GET(req: NextRequest) {
  const channelId = req.nextUrl.searchParams.get("channel") ?? "general";
  return NextResponse.json({ messages: db.messages(channelId) });
}

interface PostBody {
  channelId: string;
  author: string;
  body: string;
  /** Optional image as raw base64 (no data: prefix) + metadata. */
  image?: { base64: string; filename: string; contentType: string };
}

export async function POST(req: NextRequest) {
  const payload = (await req.json()) as PostBody;
  const channelId = payload.channelId || "general";
  const author = payload.author || "ada";
  const now = new Date().toISOString();

  // No image → plain message, no scan needed.
  if (!payload.image) {
    const msg: Message = {
      id: rid("m"),
      channelId,
      author,
      body: payload.body ?? "",
      verdict: "clean",
      createdAt: now,
    };
    db.addMessage(msg);
    return NextResponse.json({ message: msg });
  }

  // Image path: run the CSAM-Shield pipeline.
  const bytes = decodeBase64(payload.image.base64);
  const scan = scanImage(bytes);

  if (!scan.blocked) {
    const msg: Message = {
      id: rid("m"),
      channelId,
      author,
      body: payload.body ?? "",
      attachment: {
        id: rid("att"),
        filename: payload.image.filename,
        contentType: payload.image.contentType,
        pdqHex: scan.pdqHex,
        sizeBytes: bytes.length,
      },
      verdict: "clean",
      createdAt: now,
    };
    db.addMessage(msg);
    return NextResponse.json({ message: msg, scan });
  }

  // Blocked: open custody (EvidenceVault), file a sandbox report (CyberTip CLI),
  // record a moderation event. The bytes are never stored — only the hash.
  const custody = await openCustody({
    contentRefHash: scan.pdqHex,
    operator: "csam-shield",
    purpose: "automated-block",
  });
  const matched = scan.results.find((r) => r.matchedSource);
  const report = fileSandboxReport({
    custodyId: custody.id,
    matchedSource: matched?.matchedSource ?? "local",
  });

  const event = db.addModerationEvent({
    id: rid("evt"),
    kind: "image-block",
    detail: scan.results.map((r) => `${r.detector}:${r.verdict}${r.reason ? ` (${r.reason})` : ""}`).join("; "),
    cyberTipRef: report.clientReference,
    custodyId: custody.id,
    matchedSource: matched?.matchedSource,
    matchedDistance: matched?.matchedDistance,
    createdAt: now,
  });

  const blockedMsg: Message = {
    id: rid("m"),
    channelId,
    author,
    body: payload.body ?? "",
    verdict: "blocked",
    reason: "Image matched a known-bad hash. It was not posted; the incident was logged and a sandbox report was filed.",
    createdAt: now,
  };
  db.addMessage(blockedMsg);

  return NextResponse.json({
    message: blockedMsg,
    scan,
    block: {
      custodyId: custody.id,
      cyberTipRef: report.clientReference,
      curlPreview: report.curlPreview,
      eventId: event.id,
    },
  });
}
