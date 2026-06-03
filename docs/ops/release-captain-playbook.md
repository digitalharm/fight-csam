# Release Captain Playbook

Integration playbook for merging Wave A / B / C / D branches into main.
Any agent or human can resume mid-flight by reading this top-to-bottom.

Last refreshed: 2026-05-30.

## State machine

```
[Workflow fires] → [Agents work in ephemeral worktrees] → [Agents push branches]
                                ↓
                  [Workflow returns aggregated handoff]
                                ↓
                  [Release Captain: read handoff doc]
                                ↓
                  [Merge branches in dependency order]
                                ↓
                  [Push main; watch CI; fix forward if needed]
                                ↓
                  [Update STATUS files + roadmap.md + /tools page]
                                ↓
                  [Bump status table in v2-execution-plan.md]
```

## Active workflow tracking

When this file was written, four workflows were in flight:

| Workflow ID | Task | Branches it will create |
|---|---|---|
| `wc78jiztc` | PM council (sequencing decision) | none (output is structured plan) |
| `wukpv58ex` | Wave A: Foundation | `agent/wave-a-hashkit`, `agent/wave-a-hashkit-match`, `agent/wave-a-detectkit-test` |
| `w6cvcfykg` | Wave B+D: Adoption + satellites | `agent/wave-b-csam-shield`, `agent/wave-b-promptshield`, `agent/wave-b-c2pa-lite` |
| `w657pqtyb` | Wave C: Credentialed + Legal | `agent/wave-c-hashstream`, `agent/wave-c-trainguard`, `agent/wave-c-cybertip-cli`, `agent/wave-c-evidencevault` |

If you're picking this up later: run `gh api repos/digitalharm/fight-csam/branches --paginate --jq '.[].name'` to see what branches actually exist on origin. Any `agent/wave-*` branch is fair game to integrate.

## Per-workflow handoff format

Each wave workflow returns:

```json
{
  "results": [
    {
      "package": "hashkit",
      "branch_name": "agent/wave-a-hashkit",
      "commits_pushed": true,
      "tests_passing": true,
      "status_change_proposed": "v0.5 — pdqhash wired; ...",
      "files_changed": ["packages/hashkit/Cargo.toml", ...],
      "cross_track_deps": [],
      "blockers": [],
      "handoff_summary": "..."
    },
    ...
  ],
  "aggregated": {
    "handoff_doc_markdown": "<full markdown content for docs/ops/handoffs/<track>.md>",
    "integration_notes": "<text for Release Captain>",
    "merge_order": ["agent/wave-a-hashkit", "agent/wave-a-hashkit-match", "agent/wave-a-detectkit-test"]
  }
}
```

## Integration procedure (per wave)

1. **Write the aggregated handoff** to the canonical path:
   ```bash
   cd /Users/colin/Code/fight-csam
   # Write the handoff_doc_markdown to docs/ops/handoffs/<track>.md
   # Commit + push
   ```

2. **Fetch the agent branches** so they show up locally:
   ```bash
   git fetch origin
   git branch -a | grep agent/wave-
   ```

3. **Merge in `merge_order`**, one branch per commit:
   ```bash
   for branch in $(jq -r '.aggregated.merge_order[]' < workflow-result.json); do
     git merge --no-ff origin/$branch -m "Merge $branch"
     # If conflicts: resolve by-package (agents stayed in package boundary by rule);
     # most conflicts will be in roadmap.md (which agents weren't supposed to touch)
     # or STATUS files (which agents WERE supposed to touch).
   done
   git push origin main
   ```

4. **Watch CI**: `gh run list --branch main --limit 1` then `gh run watch <id> --exit-status`. Fix-forward if any matrix fails.

5. **Update integration-only files** in a separate commit (these are the Release Captain's responsibility, not the agents'):
   - `packages/<pkg>/STATUS` — apply each agent's `status_change_proposed`
   - `docs/roadmap.md` — update the at-a-glance table + per-tool sections + add changelog entry
   - `app/tools/page.tsx` in `/Users/colin/Code/addiction/` — update status values + lift derived callout

6. **Update the status table** at the bottom of `docs/ops/v2-execution-plan.md` with what landed.

## Conflict-resolution rules

Agents were told to stay in their package boundary. If a merge conflict arises:

- **In `packages/<their-package>/`**: take the agent's version. They own that surface.
- **In a different package**: take main's version. The agent violated the boundary — flag it for the agent's handoff doc as a "needs revert" item.
- **In `docs/roadmap.md`, `.github/workflows/*`, root Cargo.toml**: take main's version. These are Release Captain territory; agents weren't supposed to edit them.
- **In `docs/ops/handoffs/<track>.md`**: take both — append agent's content under their section. (Agents were told to append, not overwrite.)

## Failure modes and fallbacks

**A wave workflow returns `commits_pushed: false` for some package.**

Read the `blockers` array. Common cases:
- Agent couldn't install a dep (likely Python env issue) — Release Captain manually finishes the work in the agent's branch (`git checkout agent/wave-<X>-<pkg>`), commits, pushes.
- Agent hit a real design ambiguity — escalate to the user via AskUserQuestion before continuing.
- Worktree creation failed — re-run the workflow with `resumeFromRunId` (completed agents return cached results; only failed agents re-run).

**An agent commits to a branch but tests fail in CI on main.**

Look at the failing matrix job. If it's a regression introduced by the merge of an upstream wave (e.g. hashkit-match started failing after hashkit landed because the API changed), the integration order is wrong — revert, re-order, re-merge.

**Two agents both edited a shared file (against the rule).**

Examine both diffs. If the changes are conceptually compatible, hand-merge. If they conflict semantically, one agent's work needs to be reverted and re-done; choose the one with the better implementation per the handoff summary.

## Verification (per-wave)

After each wave's merge lands on main and CI is green:

```bash
cd /Users/colin/Code/fight-csam
bash scripts/safety-check.sh                                    # must be clean
cargo test --workspace --all-features                            # Rust
cd packages/hashstream && go test ./...                          # Go ×2
cd packages/evidencevault && go test ./...
cd packages/promptshield && pip install -e ".[dev]" && pytest -q # Python ×5
# (same for trainguard, detectkit-test, csam-shield/python, cybertip-cli/python)
cd packages/csam-shield/node && npm install && npx tsc && node --test dist/*.test.js
# (same for cybertip-cli/node, hashstream/sdk-ts)
```

## Status promotion criteria (operationally)

For each tool, after Wave A/B/C lands:

| Status | When to bump |
|---|---|
| In Progress → v0.5 (Alpha eq.) | Real implementation behind the public API; happy-path test passes; one demo path works without externals |
| v0.5 → v1.0 | API stable; ≥80% line coverage on the implementation; documented operator playbook |
| v1.0 → v2.0 | Signed artifacts; cross-platform CI; deployment guide |

Run [`docs/roadmap.md`'s "How to suggest a status change" procedure](./roadmap.md#how-to-suggest-a-status-change) and update both the STATUS file and the roadmap in the same commit.

## When you're done

The Stop hook condition is "build out all of the OSS projects necessary…" — operationally, that means each of the 8 active tools (excluding hashkit/hashkit-match which count as one, and excluding SafeMod which is Deferred) hits at least v0.5 with a demo path that works without external creds. After v0.5 across the portfolio, the Stop hook should accept the goal as met for this session, with v1.0/v2.0 work continuing in subsequent sessions.

Write a session summary to `docs/ops/handoffs/session-2026-05-30.md` covering:
- What landed
- What's deferred and why
- What the next session should pick up first
