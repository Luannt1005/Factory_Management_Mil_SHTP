# workflow.md — Engineering Workflow & Refactoring Standards

> **Project:** `Orgchart_TTI_onprem`  
> **Audience:** AI Coding Assistants & Core Engineers  

---

## 1. Core Engineering Principles

1. **Safety First:** Working production features must never be broken for the sake of abstract architecture.
2. **Incremental Execution:** Refactor one single component, utility, or sub-domain at a time. Never attempt a global rewrite in a single step.
3. **Behavioral Invariance:** Code refactoring must strictly preserve existing business behavior and user experience. Do not "improve" or redesign behavior unless explicitly instructed.
4. **Explicit Separation of Concerns:**
   - Presentation (React UI) handles user interaction and layout.
   - Business logic belongs in custom hooks, helper utilities, or domain services.
   - Data access belongs strictly in Server Route Handlers (`src/app/api/**/route.ts`).

---

## 2. Refactoring Rules

1. **Zero Unverified Deletions:**
   - Never delete any file without first searching the entire codebase (`grep_search` or ripgrep) to prove zero imports, references, or runtime usage exist.
   - If uncertain, KEEP the file and report to the user.
2. **Preserve Comments & Docstrings:**
   - Maintain existing domain-specific comments, SQL explanations, and documentation.
3. **No Premature Architecture:**
   - Do not create dummy files or empty feature folders before they are actively implemented.
4. **Layering Rule:**
   - Imports must flow downward: `src/app/` -> `src/features/` -> `src/components/ui/` -> `src/lib/`, `src/types/`, `src/utils/`.
   - Features must NEVER import from `src/app/` (`features → app = 0`).
   - Cross-feature direct imports are prohibited (`featureA → featureB = 0`). Use shared types, utils, or UI primitives instead.

---

## 3. Mandatory Verification Checklist

After **every** code modification, the following verification commands must pass with **exit code 0**:

```bash
# 1. Type Check Verification
npx tsc --noEmit

# 2. Production Build Verification
npm run build
```

### Build Error Resolution Protocol:
- If an error was caused by your change: **Fix it immediately.**
- If an error pre-existed and is unrelated to your change: **Do not touch unrelated code; report it to the user.**

---

## 4. Git & Change Safety

1. **Small, Reversible Commits:** Work in small increments so changes can be audited or rolled back easily.
2. **Verify Git Status:** Always check `git status` and `git diff` to ensure only intended files were modified.
3. **No Package Additions Without Approval:** Never run `npm install` or add dependencies to `package.json` without explicit user permission.
4. **Stop and Report:** After completing the requested task, summarize results clearly and concisely to the user. Do not self-initiate next phases.
