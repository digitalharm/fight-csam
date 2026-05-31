import { test } from "node:test";
import assert from "node:assert/strict";
import {
  generateClientReference,
  redactForLog,
  validateReport,
  type CyberTipReport,
} from "./report.js";
import {
  submitDryRun,
  submit,
  ProductionSubmitBlocked,
  COUNSEL_REQUIRED_MESSAGE,
} from "../submit.js";

function validReport(): CyberTipReport {
  return {
    clientReference: "cybertip-test-12345678",
    reportingPerson: {
      orgName: "Test Org",
      espId: "ESP-TEST-001",
      contactEmail: "trust@test.example",
    },
    incident: {
      incidentType: "csam-distribution",
      incidentDateTimeIso: "2026-05-30T12:00:00Z",
      description: "Detected via CSAM-Shield on file upload at 2026-05-30T12:00Z.",
      severity: "A",
      evidenceRefs: ["urn:evidencevault:abc123"],
    },
  };
}

test("validateReport: valid report has no errors", () => {
  assert.deepEqual(validateReport(validReport()), []);
});

test("validateReport: missing client reference fails", () => {
  const r = validReport();
  r.clientReference = "";
  const errors = validateReport(r);
  assert.match(errors[0] ?? "", /clientReference/);
});

test("validateReport: short description fails", () => {
  const r = validReport();
  r.incident.description = "short";
  const errors = validateReport(r);
  assert.ok(errors.some((e) => e.includes("description")));
});

test("validateReport: malformed datetime fails", () => {
  const r = validReport();
  r.incident.incidentDateTimeIso = "yesterday";
  const errors = validateReport(r);
  assert.ok(errors.some((e) => e.includes("ISO 8601")));
});

test("validateReport: empty evidenceRefs fails", () => {
  const r = validReport();
  r.incident.evidenceRefs = [];
  const errors = validateReport(r);
  assert.ok(errors.some((e) => e.includes("evidenceRefs")));
});

test("validateReport: victim age out of range fails", () => {
  const r = validReport();
  r.victim = { age: 25 };
  const errors = validateReport(r);
  assert.ok(errors.some((e) => e.includes("victim.age")));
});

test("validateReport: bad email fails", () => {
  const r = validReport();
  r.reportingPerson.contactEmail = "not-an-email";
  const errors = validateReport(r);
  assert.ok(errors.some((e) => e.includes("contactEmail")));
});

test("generateClientReference: shape", () => {
  const ref = generateClientReference(() => 1717000000000);
  assert.match(ref, /^cybertip-1717000000000-[0-9a-f]{8}$/);
});

test("redactForLog: strips contact details and evidence pointers", () => {
  const summary = redactForLog(validReport());
  assert.equal(summary.incidentType, "csam-distribution");
  assert.equal(summary.evidenceCount, 1);
  // Contact email should not appear.
  assert.equal(JSON.stringify(summary).includes("trust@test.example"), false);
});

test("submitDryRun: produces wire payload without network I/O", () => {
  const result = submitDryRun(validReport());
  assert.equal(result.ok, true);
  assert.equal(result.errors.length, 0);
  // Wire payload uses SHOUTY_CASE keys per NCMEC spec.
  assert.ok((result.wirePayload as any).REPORTING_PERSON);
  assert.ok((result.wirePayload as any).INCIDENT);
});

test("submitDryRun: returns errors on invalid report", () => {
  const r = validReport();
  r.clientReference = "";
  const result = submitDryRun(r);
  assert.equal(result.ok, false);
  assert.ok(result.errors.length > 0);
});

test("submit dry-run: builds payload, no curl preview", () => {
  const result = submit(validReport(), "dry-run");
  assert.equal(result.ok, true);
  assert.equal(result.mode, "dry-run");
  assert.equal(result.curlPreview, "");
});

test("submit sandbox: emits curl preview, no real POST", () => {
  const result = submit(validReport(), "sandbox", "https://sandbox.example/report");
  assert.equal(result.ok, true);
  assert.equal(result.mode, "sandbox");
  assert.ok(result.curlPreview.startsWith("curl -X POST"));
  assert.ok(result.curlPreview.includes("https://sandbox.example/report"));
  // Never emits a real credential — only the placeholder.
  assert.ok(result.curlPreview.includes("<ESP_CREDENTIAL>"));
  assert.ok(result.logLines.some((l) => l.includes("SIMULATED")));
});

test("submit sandbox: requires a URL", () => {
  const saved = process.env.NCMEC_SANDBOX_URL;
  delete process.env.NCMEC_SANDBOX_URL;
  try {
    const result = submit(validReport(), "sandbox");
    assert.equal(result.ok, false);
    assert.ok(result.errors.some((e) => e.includes("NCMEC_SANDBOX_URL")));
  } finally {
    if (saved !== undefined) process.env.NCMEC_SANDBOX_URL = saved;
  }
});

test("submit production: blocked with counsel-required error", () => {
  assert.throws(
    () => submit(validReport(), "production"),
    (err: unknown) => {
      assert.ok(err instanceof ProductionSubmitBlocked);
      assert.equal((err as Error).message, COUNSEL_REQUIRED_MESSAGE);
      return true;
    },
  );
});
