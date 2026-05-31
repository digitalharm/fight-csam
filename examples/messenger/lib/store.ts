/**
 * In-memory data store for the example messenger.
 *
 * Zero-config by design: the whole app runs on a module-level singleton so it
 * deploys to Vercel with no database to provision. State lives for the life of
 * a warm serverless instance and resets on cold start — perfectly fine for a
 * feature testbed, and the seam (`Store`) is deliberately small so you can drop
 * in a real adapter (Postgres/Neon, Vercel KV, etc.) without touching the
 * route handlers.
 *
 * Nothing in here is CSAM-specific; it's an ordinary messenger's data model.
 * The detection/prevention wiring lives in `lib/tools/*` and the API routes.
 */

export type MessageVerdict = "clean" | "blocked" | "pending" | "review";

export interface Attachment {
  id: string;
  filename: string;
  contentType: string;
  /** Hex perceptual hash computed at upload time (see lib/tools/hashkit). */
  pdqHex: string;
  /** Bytes are NOT persisted in this demo — only the hash + metadata. */
  sizeBytes: number;
}

export interface Message {
  id: string;
  channelId: string;
  author: string;
  body: string;
  attachment?: Attachment;
  verdict: MessageVerdict;
  /** Human-readable reason when blocked/held. */
  reason?: string;
  createdAt: string; // ISO 8601
}

export interface Channel {
  id: string;
  name: string;
  topic: string;
}

/** A moderation event — every block/hold the shield produces lands here. */
export interface ModerationEvent {
  id: string;
  kind: "image-block" | "prompt-block" | "prompt-review";
  detail: string;
  /** Cross-references into the other tools' artifacts. */
  cyberTipRef?: string;
  custodyId?: string;
  matchedSource?: string;
  matchedDistance?: number;
  createdAt: string;
}

export interface DemoUser {
  handle: string;
  displayName: string;
  role: "member" | "moderator";
}

interface StoreShape {
  users: DemoUser[];
  channels: Channel[];
  messages: Message[];
  moderationEvents: ModerationEvent[];
}

// --- the singleton -------------------------------------------------------- //

declare global {
  // Survive Next.js dev hot-reload (module re-eval) by stashing on globalThis.
  // eslint-disable-next-line no-var
  var __dh_messenger_store: StoreShape | undefined;
}

function seed(): StoreShape {
  const now = new Date().toISOString();
  return {
    users: [
      { handle: "ada", displayName: "Ada", role: "member" },
      { handle: "lin", displayName: "Lin", role: "member" },
      { handle: "mod", displayName: "Sam (mod)", role: "moderator" },
    ],
    channels: [
      { id: "general", name: "# general", topic: "Say hi. Drop an image to see the shield run." },
      { id: "art", name: "# ai-art", topic: "Generate AI stickers — prompts are screened first." },
    ],
    messages: [
      {
        id: "m-welcome",
        channelId: "general",
        author: "mod",
        body:
          "Welcome. This is a server-visible-content messenger (NOT end-to-end encrypted) " +
          "with all 10 digitalharm-oss tools wired in. Upload an image to watch the CSAM-Shield " +
          "pipeline run; try the # ai-art channel for prompt-screened generation.",
        verdict: "clean",
        createdAt: now,
      },
    ],
    moderationEvents: [],
  };
}

function store(): StoreShape {
  if (!globalThis.__dh_messenger_store) {
    globalThis.__dh_messenger_store = seed();
  }
  return globalThis.__dh_messenger_store;
}

// --- accessors ------------------------------------------------------------ //

export const db = {
  channels: () => store().channels,
  users: () => store().users,

  messages(channelId: string): Message[] {
    return store()
      .messages.filter((m) => m.channelId === channelId)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  },

  addMessage(m: Message): Message {
    store().messages.push(m);
    return m;
  },

  moderationEvents(): ModerationEvent[] {
    return [...store().moderationEvents].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  addModerationEvent(e: ModerationEvent): ModerationEvent {
    store().moderationEvents.push(e);
    return e;
  },
};

/** Short random id without pulling in a uuid dependency. */
export function rid(prefix: string): string {
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  return `${prefix}-${hex}`;
}
