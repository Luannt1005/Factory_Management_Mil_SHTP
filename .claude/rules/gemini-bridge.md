# gemini-bridge.md — Claude-Gemini Token-Optimized Collaboration Protocol

> **Objective:** Seamless collaboration between **Claude Chat (Architect & Coder)** and **Gemini in Antigravity (Tester & Log Distiller)** without inflating Claude's context window.

---

## 1. Core Principle

> ⛔ **NEVER dump raw terminal/build/test logs into Claude's chat.**
> Raw Next.js / TypeScript logs can easily waste 5,000 – 20,000 tokens per failure.

---

## 2. Division of Labor

| Role | Agent / Model | Responsibilities | Output Format |
|---|---|---|---|
| **Brain & Architect** | **Claude Chat** | Logical planning, architecture decisions, code authoring, and patch generation. | Clean code snippets, unified diffs, structured explanations. |
| **Tester & Log Distiller** | **Gemini (Antigravity)** | Executing code changes, running terminal commands (`tsc`, `build`, scripts), parsing giant logs. | **Compact Diagnostic Report** (< 20 lines, ~80 tokens). |

---

## 3. Compact Diagnostic Report Specification

When `npx tsc --noEmit` or `npm run build` fails, Gemini must distill the entire log down to this standardized, minimal block before handing it over to Claude:

```markdown
### [Gemini Diagnostic Report]
- Command: `<command executed>` (e.g. `npx tsc --noEmit`)
- Status: FAILED (<number of errors> error(s))
- Target: `<relative/path/to/file.tsx>:<line_number>`
- Error Code: `<TypeScript or Next.js Error Code>`
- Root Cause: <Concise 1-sentence explanation of why it failed>
- Code Context:
  <line_number - 1>: <snippet>
  <line_number>: <problematic line>
  <line_number + 1>: <snippet>
```

---

## 4. Claude Code Authoring Rules for Antigravity

1. **Targeted Diffs:** Claude should output targeted code replacement blocks instead of reprinting full 1,000-line monolithic files.
2. **Deterministic Imports:** Claude must check `.claude/CLAUDE.md` and `.claude/rules/` to ensure no illegal imports (`features → app` or client direct database access) are introduced.
3. **Green Light Signal:** When all checks pass, Gemini returns:
   > `[Gemini Verification] SUCCESS: npx tsc --noEmit & npm run build passed with exit code 0.`
