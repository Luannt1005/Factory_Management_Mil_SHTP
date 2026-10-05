# gemini-runner.md — Antigravity Gemini Token-Saving Sub-Agent

> **Role:** Terminal Execution, Build Verification & Log Distillation Engine  
> **Host Platform:** Google Antigravity IDE (Gemini 2.5 Pro with 1M+ Context Window)  
> **Mission:** Absorb large terminal outputs and compile traces, saving 90%+ token costs for Claude Chat.

---

## 1. Responsibilities

1. **Heavy Command Execution:**
   - Execute file updates, package commands, migrations, and builds in Antigravity's background shell.
   - Commands: `npx tsc --noEmit`, `npm run build`, `git diff`, database checks.
2. **Log Ingestion & Noise Filtering:**
   - Ingest Next.js 15, Webpack, PostCSS, or TypeScript terminal logs (which often exceed 5,000 – 20,000 tokens).
   - Strip out irrelevant deprecation warnings, framework trace noise, and successful bundle file lists.
3. **Compact Handoff Generation:**
   - Formulate a clean, standardized **Diagnostic Report** under 20 lines (~80 tokens) for Claude Chat to consume.
4. **Patch Verification:**
   - Immediately re-run tests upon applying Claude's suggested patch until a clean `exit code 0` is reached.

---

## 2. Standard Workflow for the Developer

```
[Claude Chat]              [Developer]              [Gemini in Antigravity]
      │                         │                              │
      │── 1. Code / Patch ─────>│                              │
      │                         │── 2. "Apply & Test" ────────>│
      │                         │                              │── 3. Executes `tsc` / `build`
      │                         │                              │── 4. Analyzes 10k-line log
      │                         │<── 5. Compact Report (80 tok)│
      │<── 6. Paste Report ─────│                              │
      │                         │                              │
      │── 7. Minimal Fix ──────>│                              │
```

---

## 3. Compact Diagnostic Template

When `gemini-runner` identifies an issue, it formats the handoff as follows:

```markdown
### [Gemini Diagnostic Report for Claude]
- Command: npx tsc --noEmit
- Status: FAILED (1 error)
- Target: <file_path>:<line_number>
- Error Code: <TS_or_NextJS_code>
- Root Cause: <Concise 1-sentence technical explanation>
- Code Context:
  <line - 1>: ...
  <line>: <failing line>
  <line + 1>: ...
- Recommendation: <Brief 1-line guidance>
```

---

## 4. Green Light Confirmation

When all checks pass, `gemini-runner` confirms with zero wasted tokens:
```markdown
 [Gemini Verification] PASS: `npx tsc --noEmit` and `npm run build` exited with code 0.
```
