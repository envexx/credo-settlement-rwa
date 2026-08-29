# Credo Three-Day Sprint Orchestration Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Coordinate three independent workstreams into one verified hackathon submission without changing Credo's core behavior.

**Architecture:** Three agents own disjoint surfaces: Demo/UX, Developer Integration, and Evidence/QA. Each workstream produces independently testable commits; daily integration gates prevent shared-file collisions and incomplete work from reaching the release candidate.

**Tech Stack:** Git, Next.js 16.3.3, React 19, TypeScript, Node test runner, ESLint, Prettier, Markdown

---

## Plan map and ownership

| Owner | Plan | Exclusive files |
|---|---|---|
| Agent 1 | `2026-08-30-demo-ux.md` | playground, recovery page/components, site header/mobile nav |
| Agent 2 | `2026-08-30-developer-integration.md` | `docs/integration/**`, deployment manifest, integration tests |
| Agent 3 | `2026-08-30-evidence-quality.md` | evidence index/tests, QA checklist, final verification |

Shared files require a lock before editing:

- Agent 2 is default owner of `README.md` and `src/app/infra/page.tsx`.
- Agent 3 is default owner of `docs/PROGRESS.md` and final QA records.
- Agent 1 proposes product-copy test additions to Agent 3 if both need the file.
- No agent stages the user's existing PDF deletion/replacement.

The lock message is:

```text
LOCK docs/PROGRESS.md — owner Agent 3 — purpose record the verified gate
```

### Task 1: Establish the baseline

**Files:**
- Read: `AGENTS.md`
- Read: `package.json`
- Read: `docs/superpowers/specs/2026-08-30-three-day-product-roadmap-design.md`
- Modify: `docs/PROGRESS.md`

- [ ] **Step 1: Record repository state**

```powershell
git status --short --branch
git log -5 --oneline
```

Expected: branch, starting commit, and pre-existing PDF changes are recorded.

- [ ] **Step 2: Read installed Next.js guidance**

```powershell
Get-Content -Raw node_modules/next/dist/docs/03-architecture/accessibility.md
rg --files node_modules/next/dist/docs/01-app | rg 'page\.md$|link\.md$'
```

Read the relevant App Router page/link guide found by the second command before any code change.

- [ ] **Step 3: Run baseline verification separately**

```powershell
npm test
npm run typecheck
npm run lint
npm run format:check
npm run build
```

Expected: every command exits 0. A pre-existing failure is recorded verbatim and assigned to Agent 3 before feature work.

- [ ] **Step 4: Record actual results**

Append the observed branch, commit, preserved user changes, test count, check
results, and installed Next.js version to `docs/PROGRESS.md` under:

```markdown
## 30 August 2026 — three-day sprint baseline
```

Write only observed values copied from Steps 1 and 3.

- [ ] **Step 5: Commit**

```powershell
git add docs/PROGRESS.md
git commit -m "docs(progress): record sprint baseline"
```

Expected: PDF files remain unstaged.

### Task 2: Dispatch workstreams

**Files:**
- Read: the three workstream plans in this directory

- [ ] **Step 1: Give each agent exactly one plan**

Every prompt includes:

```text
Follow the assigned plan task-by-task. Do not change contracts, public API
behavior, authentication, payment rules, database models, migrations, or
security boundaries. If a core change appears necessary, stop and write a TDD.
```

- [ ] **Step 2: Require task reports**

```text
Task completed:
Files changed:
Focused checks and results:
Commit:
Blocker or cross-agent dependency:
```

- [ ] **Step 3: Enforce commits at task boundaries**

Expected: no agent combines unrelated UX, documentation, and evidence changes in one commit.

### Task 3: Day 1 gate — remove uncertainty

**Files:**
- Modify: `docs/PROGRESS.md`

- [ ] **Step 1: Review every Day 1 commit**

```powershell
$reportedCommit = git rev-parse HEAD
git show --stat --oneline $reportedCommit
git show --check $reportedCommit
```

Use each reported commit hash. Expected: coherent scope and no PDF changes.

- [ ] **Step 2: Confirm ownership and red tests**

Add and complete with evidence:

```markdown
### Day 1 gate

- [ ] Playground lifecycle has an owner and failing test
- [ ] Recovery flow has an owner and failing test
- [ ] Mobile navigation has an owner and failing test
- [ ] Integration claims were checked against source
- [ ] Evidence inventory and QA matrix exist
- [ ] No workstream depends on an unapproved core change
```

- [ ] **Step 3: Run each agent's focused test**

Expected: completed increments are green. A deliberately red test may exist only immediately before its paired implementation, never at the shared-branch gate.

- [ ] **Step 4: Commit the gate**

```powershell
git add docs/PROGRESS.md
git commit -m "docs(progress): close day-one sprint gate"
```

### Task 4: Day 2 gate — integrate the shared story

**Files:**
- Modify: `docs/PROGRESS.md`

- [ ] **Step 1: Integrate in dependency order**

```text
1. Shared lifecycle terminology
2. Playground and recovery UI
3. Mobile navigation
4. Manifest and integration documentation
5. Evidence narrative and QA automation
```

- [ ] **Step 2: Run integration checks**

```powershell
npm test
npm run typecheck
npm run lint
npm run format:check
```

Expected: all exit 0.

- [ ] **Step 3: Apply cut rules**

For every cut item, record its name, observed reason, and one concrete next
action under this heading:

```markdown
### Cut from the three-day sprint
```

Do not add the section when nothing was cut. Cut P2 before reducing P0 or the
essential P1 integration path.

- [ ] **Step 4: Commit the gate**

```powershell
git add docs/PROGRESS.md
git commit -m "docs(progress): close day-two integration gate"
```

### Task 5: Day 3 gate — stabilize and freeze

**Files:**
- Modify: `docs/PROGRESS.md`

- [ ] **Step 1: Freeze features**

Confirm there is no new page, API, dependency, contract, data model, or large visual redesign beginning on Day 3.

- [ ] **Step 2: Run fresh final checks**

```powershell
npm test
npm run typecheck
npm run lint
npm run format:check
npm run build
git diff --check origin/main...HEAD
```

Expected: every command exits 0.

- [ ] **Step 3: Execute manual QA**

Complete `docs/QA-CHECKLIST.md` at the specified mobile and desktop sizes. Record failures with reproduction steps; never mark an unobserved row as passed.

- [ ] **Step 4: Rehearse the demo**

Run both paths:

1. Live path: reserve, pay, save recovery URL, monitor proof.
2. Fallback path: clearly transition to historical public evidence if the live proof is still pending.

- [ ] **Step 5: Record the release candidate**

Record the observed commit hash, automated results, manual results, rehearsal
duration, known limitations, and approval requirements under the heading

```markdown
## Three-day release candidate
```

- [ ] **Step 6: Commit**

```powershell
git add docs/PROGRESS.md docs/QA-CHECKLIST.md
git commit -m "docs(progress): record hackathon release candidate"
```

Expected: release candidate is local, verified, and not pushed or deployed.
