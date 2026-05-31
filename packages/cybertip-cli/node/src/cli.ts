#!/usr/bin/env node
/**
 * cybertip — NCMEC CyberTipline CLI
 *
 *   cybertip validate <report.json>
 *   cybertip dry-run <report.json>          (validates + prints wire payload)
 *   cybertip submit <report.json>           (BLOCKED in scaffold; counsel review required)
 *   cybertip --version
 */

import { readFile } from "node:fs/promises";
import { submitDryRun } from "./submit.js";
import { validateReport, type CyberTipReport } from "./model/report.js";

async function loadReport(path: string): Promise<CyberTipReport> {
  const content = await readFile(path, "utf-8");
  return JSON.parse(content) as CyberTipReport;
}

async function main(argv: string[]): Promise<number> {
  if (argv.length === 0 || argv[0] === "--help" || argv[0] === "-h") {
    printUsage();
    return 0;
  }
  if (argv[0] === "--version" || argv[0] === "-V") {
    console.log("@digitalharm/cybertip-cli scaffold (counsel-gated)");
    return 0;
  }

  const cmd = argv[0];
  const path = argv[1];

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

  if (cmd === "dry-run") {
    if (!path) {
      console.error("dry-run: report path required");
      return 2;
    }
    const report = await loadReport(path);
    const result = submitDryRun(report);
    console.log(JSON.stringify(result, null, 2));
    return result.ok ? 0 : 1;
  }

  if (cmd === "submit") {
    console.error(
      "submit: BLOCKED in scaffold. The production submission path is gated on outside-counsel review of\n" +
        "  packages/cybertip-cli/docs/counsel-scope-brief.md\n" +
        "and an active NCMEC ESP credential. See\n" +
        "  https://github.com/digitalharm/digitalharm-oss/blob/main/docs/roadmap.md",
    );
    return 2;
  }

  console.error(`unknown command: ${cmd}`);
  printUsage();
  return 1;
}

function printUsage(): void {
  console.log(`cybertip — NCMEC CyberTipline CLI

  cybertip validate <report.json>     Validate report shape
  cybertip dry-run <report.json>      Validate + print wire payload (no network I/O)
  cybertip submit <report.json>       BLOCKED in scaffold (counsel review required)
  cybertip --version
`);
}

const exitCode = await main(process.argv.slice(2));
process.exit(exitCode);
