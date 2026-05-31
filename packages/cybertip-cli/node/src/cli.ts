#!/usr/bin/env node
/**
 * cybertip — NCMEC CyberTipline CLI
 *
 *   cybertip validate <report.json>
 *   cybertip dry-run  <report.json>                 (validate + print wire payload)
 *   cybertip submit   <report.json> [--mode ...]     (dry-run | sandbox | production)
 *     --mode dry-run                                 default; validate + wire payload, no network
 *     --mode sandbox --sandbox-url <URL>             emit the curl-equivalent (no network I/O)
 *     --sandbox                                      shorthand for --mode sandbox
 *     --mode production                              BLOCKED: counsel sign-off required
 *   cybertip --version
 */

import { readFile } from "node:fs/promises";
import { submit, ProductionSubmitBlocked, type SubmitMode } from "./submit.js";
import { validateReport, type CyberTipReport } from "./model/report.js";

interface ParsedArgs {
  positionals: string[];
  flags: Record<string, string | boolean>;
}

function parseArgs(argv: string[]): ParsedArgs {
  const positionals: string[] = [];
  const flags: Record<string, string | boolean> = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === undefined) continue;
    if (a.startsWith("--")) {
      const key = a.slice(2);
      const next = argv[i + 1];
      if (next !== undefined && !next.startsWith("--")) {
        flags[key] = next;
        i++;
      } else {
        flags[key] = true;
      }
    } else {
      positionals.push(a);
    }
  }
  return { positionals, flags };
}

function resolveMode(flags: Record<string, string | boolean>): SubmitMode {
  if (flags.production) return "production";
  if (flags.sandbox) return "sandbox";
  const m = flags.mode;
  if (m === "sandbox" || m === "production" || m === "dry-run") return m;
  return "dry-run";
}

async function loadReport(path: string): Promise<CyberTipReport> {
  const content = await readFile(path, "utf-8");
  return JSON.parse(content) as CyberTipReport;
}

async function main(argv: string[]): Promise<number> {
  const { positionals, flags } = parseArgs(argv);

  if (positionals.length === 0 || flags.help || flags.h) {
    printUsage();
    return 0;
  }
  if (flags.version || flags.V) {
    console.log("@digitalharm/cybertip-cli 0.5 (sandbox simulation; production counsel-gated)");
    return 0;
  }

  const cmd = positionals[0];
  const path = positionals[1];

  if (cmd === "validate") {
    if (!path) {
      console.error("validate: report path required");
      return 2;
    }
    const report = await loadReport(path);
    const errors = validateReport(report);
    if (errors.length === 0) {
      console.log("OK — report shape is valid");
      return 0;
    }
    for (const err of errors) console.error(`ERROR: ${err}`);
    return 1;
  }

  // dry-run (legacy positional command) and submit both route through submit().
  if (cmd === "dry-run" || cmd === "submit") {
    if (!path) {
      console.error(`${cmd}: report path required`);
      return 2;
    }
    const mode: SubmitMode = cmd === "dry-run" ? "dry-run" : resolveMode(flags);
    const sandboxUrl =
      typeof flags["sandbox-url"] === "string" ? (flags["sandbox-url"] as string) : undefined;

    const report = await loadReport(path);
    try {
      const result = submit(report, mode, sandboxUrl);
      for (const line of result.logLines) console.error(line);
      if (result.curlPreview) {
        console.log("# SIMULATED — no request was sent. Run this yourself with a real ESP credential:");
        console.log(result.curlPreview);
      } else {
        console.log(
          JSON.stringify(
            { ok: result.ok, mode: result.mode, errors: result.errors, wirePayload: result.wirePayload },
            null,
            2,
          ),
        );
      }
      return result.ok ? 0 : 1;
    } catch (err) {
      if (err instanceof ProductionSubmitBlocked) {
        console.error(`submit: ${err.message}`);
        return 2;
      }
      throw err;
    }
  }

  console.error(`unknown command: ${cmd}`);
  printUsage();
  return 1;
}

function printUsage(): void {
  console.log(`cybertip — NCMEC CyberTipline CLI

  cybertip validate <report.json>                 Validate report shape
  cybertip dry-run  <report.json>                 Validate + print wire payload (no network I/O)
  cybertip submit   <report.json> [--mode M]      M = dry-run (default) | sandbox | production
      --mode sandbox --sandbox-url <URL>          Emit the curl-equivalent (no network I/O;
                                                  URL also reads from NCMEC_SANDBOX_URL)
      --sandbox                                   Shorthand for --mode sandbox
      --mode production                           BLOCKED — counsel sign-off required
  cybertip --version
`);
}

const exitCode = await main(process.argv.slice(2));
process.exit(exitCode);
