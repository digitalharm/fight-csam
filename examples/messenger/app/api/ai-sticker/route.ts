import { NextRequest, NextResponse } from "next/server";
import { db, rid, type Message } from "@/lib/store";
import { classifyPrompt } from "@/lib/tools/promptshield";
import { signClaim } from "@/lib/tools/c2pa";

export const runtime = "nodejs";

interface Body {
  prompt: string;
}

export async function POST(req: NextRequest) {
  const { prompt } = (await req.json()) as Body;
  const now = new Date().toISOString();

  // 1. PromptShield gate — runs before any (simulated) generation compute.
  const cls = classifyPrompt(prompt ?? "");

  if (cls.verdict !== "allow") {
    db.addModerationEvent({
      id: rid("evt"),
      kind: cls.verdict === "block" ? "prompt-block" : "prompt-review",
      detail: `PromptShield ${cls.verdict} (score ${cls.score.toFixed(2)}) on an AI-sticker prompt. ${cls.reasoning}`,
      createdAt: now,
    });
    return NextResponse.json({ verdict: cls.verdict, score: cls.score, reasoning: cls.reasoning });
  }

  // 2. Allowed → "generate" a deterministic placeholder sticker (no real model
  //    call needed to demonstrate the provenance flow) and sign it with C2PA.
  const signed = signClaim({
    claimId: rid("c2pa"),
    producer: "SafeMessenger AI Art",
    aiGenerated: true,
    generator: "demo-diffusion-v0",
  });

  const msg: Message = {
    id: rid("m"),
    channelId: "art",
    author: "ada",
    body: `🎨 generated: "${prompt}"`,
    verdict: "clean",
    createdAt: now,
  };
  db.addMessage(msg);

  return NextResponse.json({
    verdict: "allow",
    score: cls.score,
    reasoning: cls.reasoning,
    provenance: {
      producer: signed.claim.producer,
      generator: signed.claim.generator,
      signature: signed.signature,
      verified: signed.verified,
    },
  });
}
