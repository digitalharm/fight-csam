"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Tab = "chat" | "art" | "moderation" | "about";

interface Attachment {
  filename: string;
  pdqHex: string;
  sizeBytes: number;
}
interface Message {
  id: string;
  author: string;
  body: string;
  attachment?: Attachment;
  verdict: "clean" | "blocked" | "pending" | "review";
  reason?: string;
  createdAt: string;
}
interface Channel {
  id: string;
  name: string;
  topic: string;
}

const CHANNELS: Channel[] = [
  { id: "general", name: "# general", topic: "Drop an image to see the shield run." },
  { id: "art", name: "# ai-art", topic: "Generate AI stickers — prompts screened first." },
];

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(",")[1] ?? "");
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function Page() {
  const [tab, setTab] = useState<Tab>("chat");
  return (
    <div className="app">
      <div className="topbar">
        <div className="brand">
          Safe<span className="tag">Messenger</span>
        </div>
        <div className="sub">fight-csam reference app · server-visible content (not E2EE)</div>
        <div className="tabs">
          {(["chat", "art", "moderation", "about"] as Tab[]).map((t) => (
            <button key={t} className={`tab ${tab === t ? "active" : ""}`} onClick={() => setTab(t)}>
              {t === "chat" ? "Chat" : t === "art" ? "AI Art" : t === "moderation" ? "Moderation" : "About"}
            </button>
          ))}
        </div>
      </div>
      <div className="main">
        {tab === "chat" && <ChatView />}
        {tab === "art" && <ArtView />}
        {tab === "moderation" && <ModerationView />}
        {tab === "about" && <AboutView />}
      </div>
    </div>
  );
}

function ChatView() {
  const [channelId, setChannelId] = useState("general");
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [lastBlock, setLastBlock] = useState<{ curlPreview: string; custodyId: string; cyberTipRef: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    const r = await fetch(`/api/messages?channel=${channelId}`);
    const j = await r.json();
    setMessages(j.messages ?? []);
  }, [channelId]);

  useEffect(() => {
    load();
  }, [load]);

  async function send(image?: { base64: string; filename: string; contentType: string }) {
    setBusy(true);
    setLastBlock(null);
    try {
      const r = await fetch("/api/messages", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ channelId, author: "ada", body: text, image }),
      });
      const j = await r.json();
      if (j.block) setLastBlock(j.block);
      setText("");
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const base64 = await fileToBase64(file);
    await send({ base64, filename: file.name, contentType: file.type || "application/octet-stream" });
    if (fileRef.current) fileRef.current.value = "";
  }

  async function sendFlaggedFixture() {
    const r = await fetch("/api/fixture");
    const j = await r.json();
    await send({ base64: j.base64, filename: "flagged-test-image.png", contentType: "image/png" });
  }

  return (
    <>
      <div className="sidebar">
        <h3>Channels</h3>
        {CHANNELS.map((c) => (
          <button key={c.id} className={`channel ${channelId === c.id ? "active" : ""}`} onClick={() => setChannelId(c.id)}>
            {c.name}
            <span className="topic">{c.topic}</span>
          </button>
        ))}
      </div>
      <div className="content">
        <div className="stream">
          {messages.map((m) => (
            <div key={m.id} className={`msg ${m.verdict === "blocked" ? "blocked" : ""}`}>
              <div className="av">{m.author.slice(0, 2)}</div>
              <div>
                <div>
                  <span className="who">{m.author}</span>
                  <span className="when">{new Date(m.createdAt).toLocaleTimeString()}</span>
                  {m.verdict === "clean" && m.attachment && <span className="pill ok" style={{ marginLeft: 8 }}>scanned</span>}
                  {m.verdict === "blocked" && <span className="pill block" style={{ marginLeft: 8 }}>blocked</span>}
                </div>
                {m.body && <div className="text">{m.body}</div>}
                {m.verdict === "blocked" && <div className="text">{m.reason}</div>}
                {m.attachment && (
                  <div className="att">
                    🖼 {m.attachment.filename} · PDQ <code style={{ fontFamily: "var(--mono)" }}>{m.attachment.pdqHex.slice(0, 16)}…</code>
                  </div>
                )}
              </div>
            </div>
          ))}
          {lastBlock && (
            <div className="blockcard">
              <div><b>Upload blocked by CSAM-Shield.</b> The bytes were never stored — only the hash.</div>
              <div style={{ marginTop: 6 }}>EvidenceVault custody: <code>{lastBlock.custodyId}</code></div>
              <div>CyberTip sandbox ref: <code>{lastBlock.cyberTipRef}</code></div>
              <div style={{ marginTop: 6 }}>Sandbox request that <i>would</i> be sent (no network call made):</div>
              <code>{lastBlock.curlPreview}</code>
            </div>
          )}
        </div>
        <div className="composer">
          <div className="row">
            <textarea rows={1} placeholder={`Message ${CHANNELS.find((c) => c.id === channelId)?.name}`} value={text} onChange={(e) => setText(e.target.value)} />
            <button className="btn" onClick={() => fileRef.current?.click()} disabled={busy}>📎 Image</button>
            <button className="btn primary" onClick={() => send()} disabled={busy || !text}>Send</button>
          </div>
          <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={onPickFile} />
          <div className="hint">
            Any image you attach is hashed and matched against the list (it'll be clean).{" "}
            <a onClick={sendFlaggedFixture} style={{ cursor: "pointer" }}>Try a flagged test image →</a>{" "}
            (a synthetic non-CSAM fixture whose hash is seeded as "known-bad" to demo a block).
          </div>
        </div>
      </div>
    </>
  );
}

function ArtView() {
  const [prompt, setPrompt] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<any>(null);

  async function generate() {
    setBusy(true);
    setResult(null);
    try {
      const r = await fetch("/api/ai-sticker", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      setResult(await r.json());
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="panel-view">
      <h2>AI sticker generator</h2>
      <p className="lead">
        Every prompt is screened by <b>PromptShield</b> (the conjunction principle: a block needs both a
        minor-indicator <i>and</i> a sexual-context signal) before any compute is spent. Allowed images are signed
        with <b>C2PA-Lite</b> provenance (Ed25519). Try a benign prompt, then something that trips one signal vs. both.
      </p>
      <div className="card">
        <div className="row" style={{ display: "flex", gap: 8 }}>
          <input
            type="text"
            style={{ flex: 1, background: "var(--panel-2)", border: "1px solid var(--rule)", color: "var(--text)", borderRadius: 8, padding: "10px 12px", fontSize: 14 }}
            placeholder="a watercolor fox in a sweater"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />
          <button className="btn primary" onClick={generate} disabled={busy || !prompt}>Generate</button>
        </div>
      </div>
      {result && (
        <div className="card">
          {result.verdict === "block" ? (
            <div><span className="pill block">blocked</span> &nbsp;PromptShield refused this prompt. Score {result.score?.toFixed?.(2)}. No image generated, no compute spent.</div>
          ) : result.verdict === "review" ? (
            <div><span className="pill warn">review</span> &nbsp;Held for human review. Score {result.score?.toFixed?.(2)}.</div>
          ) : (
            <>
              <div><span className="pill ok">allowed</span> &nbsp;Score {result.score?.toFixed?.(2)}. Generated + signed.</div>
              <div className="kv" style={{ marginTop: 10 }}>
                <span>Provenance</span><span>{result.provenance?.producer} · {result.provenance?.generator}</span>
                <span>C2PA signature</span><span><code>{result.provenance?.signature?.slice(0, 48)}…</code></span>
                <span>Signature valid</span><span>{result.provenance?.verified ? "✓ verified (Ed25519)" : "✗"}</span>
              </div>
            </>
          )}
          {result.reasoning && <div className="hint" style={{ marginTop: 8 }}>{result.reasoning}</div>}
        </div>
      )}
    </div>
  );
}

function ModerationView() {
  const [events, setEvents] = useState<any[]>([]);
  const [report, setReport] = useState<any>(null);
  const [screening, setScreening] = useState(false);
  useEffect(() => {
    fetch("/api/moderation").then((r) => r.json()).then((j) => setEvents(j.events ?? []));
  }, []);
  async function runScreen() {
    setScreening(true);
    try {
      const r = await fetch("/api/admin/screen", { method: "POST" });
      setReport((await r.json()).report);
    } finally {
      setScreening(false);
    }
  }
  return (
    <div className="panel-view">
      <h2>Moderation queue</h2>
      <p className="lead">
        Every block produces a <b>CyberTip CLI</b> sandbox report and an <b>EvidenceVault</b> tamper-evident custody
        record (hash-chained; the bytes are never stored). <b>SafeMod</b> — the moderator-wellbeing toolkit — is
        deferred by design and shown as a stub.
      </p>

      <div className="card">
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ flex: 1 }}>
            <b>TrainGuard</b> — screen the message corpus before exporting it for model training.
            <div className="hint" style={{ marginTop: 4 }}>Scans every message/attachment hash against the list and emits a signed compliance report.</div>
          </div>
          <button className="btn" onClick={runScreen} disabled={screening}>Run export screen</button>
        </div>
        {report && (
          <div className="kv" style={{ marginTop: 12 }}>
            <span>Report</span><span><code>{report.reportId}</code></span>
            <span>Dataset</span><span>{report.datasetId} · {report.datasetSize} items</span>
            <span>Flagged</span><span>{report.matchesTotal} {report.matchesTotal > 0 ? `(${report.flaggedItemIds.join(", ")})` : ""}</span>
            <span>Signature</span><span><code>{report.signature?.slice(0, 32)}…</code></span>
          </div>
        )}
      </div>

      {events.length === 0 && <div className="empty">No moderation events yet. Block a flagged test image in Chat.</div>}
      {events.map((e) => (
        <div key={e.id} className="card">
          <div><span className="pill block">{e.kind}</span> <span className="when" style={{ color: "var(--subtle)", fontSize: 11 }}>{new Date(e.createdAt).toLocaleString()}</span></div>
          <div className="kv" style={{ marginTop: 10 }}>
            <span>Detail</span><span>{e.detail}</span>
            {e.matchedSource && <><span>Matched list</span><span>{e.matchedSource} (Hamming {e.matchedDistance})</span></>}
            <span>CyberTip ref</span><span><code>{e.cyberTipRef}</code></span>
            {e.custody && <>
              <span>Custody record</span><span><code>{e.custody.id}</code></span>
              <span>Content hash</span><span><code>{e.custody.contentRefHash?.slice(0, 32)}…</code></span>
              <span>Retention</span><span>{e.custody.retentionSchedule}</span>
              <span>Chain intact</span><span>{e.custody.intact ? "✓ verified" : "✗ tampered"}</span>
            </>}
          </div>
        </div>
      ))}
      <div className="card" style={{ opacity: 0.7 }}>
        <div><span className="pill">deferred</span> &nbsp;<b>SafeMod</b> — moderator wellbeing</div>
        <div className="hint" style={{ marginTop: 6 }}>
          Exposure tracking, image shrouding, rotation, wellbeing surveys. Deferred indefinitely (GDPR
          special-category mental-health data is the wrong load for a solo maintainer; better spun out).
        </div>
      </div>
    </div>
  );
}

function AboutView() {
  const rows: [string, string, string][] = [
    ["HashKit", "PDQ hash of every upload", "adapter (Rust→WASM in prod)"],
    ["hashkit-match", "Hamming match vs. the list", "adapter (Rust→WASM in prod)"],
    ["DetectKit-Test", "synthetic flagged fixture", "real (Python in CI)"],
    ["CSAM-Shield", "upload-scan dispatch + policy", "mirrors @digitalharm/csam-shield"],
    ["PromptShield", "AI-prompt screening", "mirrors @digitalharm/promptshield"],
    ["HashStream", "served hash-list snapshot", "mirrors SDK + seeded snapshot"],
    ["TrainGuard", "screen export-for-training", "mirrors @digitalharm/trainguard"],
    ["CyberTip CLI", "sandbox NCMEC report on block", "mirrors @digitalharm/cybertip-cli"],
    ["EvidenceVault", "tamper-evident custody record", "adapter (Go service in prod)"],
    ["C2PA-Lite", "sign AI-generated images", "real Ed25519 (node:crypto)"],
  ];
  return (
    <div className="panel-view">
      <h2>How the 10 tools are wired in</h2>
      <p className="lead">
        This is a deliberately small, server-visible-content messenger (think Discord / Telegram cloud chats),
        <b> not end-to-end encrypted</b> — server-side hash matching only works on content the server can see. An E2EE
        app would need a fundamentally different (and contested) client-side approach, which is out of scope.
        Nothing here ships a hash list or real CSAM; the "flagged" fixture is a synthetic non-CSAM image.
      </p>
      <div className="toolmap">
        <table>
          <thead><tr><th>Tool</th><th>Role in this app</th><th>Integration</th></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r[0]}><td className="tool">{r[0]}</td><td>{r[1]}</td><td style={{ color: "var(--muted)" }}>{r[2]}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
