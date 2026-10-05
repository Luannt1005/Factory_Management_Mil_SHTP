# verify-build.md — Verification Skill

> **Skill Name:** `verify-build`  
> **Purpose:** Execute standard TypeScript type checking and production build verification, troubleshooting common errors.

---

## 1. When to Use

Execute this skill after any code changes to TypeScript files, components, API route handlers, or dependency configs.

---

## 2. Automated Execution Steps (Token-Saving)

### Step 1: Type Checking (with Gemini Distiller)
Run the automated verification script:
```bash
node scripts/gemini_distiller.js tsc
```
- **Target:** `[Gemini Verification] SUCCESS: npx tsc --noEmit passed with exit code 0.`
- **Auto-distillation:** If any error occurs, Gemini 3.8 Flash automatically parses the raw log and outputs only a concise `< 15` line Diagnostic Report, protecting Claude's context window.

### Step 2: Production Build
Verify Next.js compilation:
```bash
node scripts/gemini_distiller.js build
```
- **Target:** All routes pass compilation.
- **Note on Dev Server Conflict:** If the local dev server is currently running, Windows file locks on the `.next` directory can occasionally cause `ENOENT [PageNotFoundError]`. If this occurs, stop the dev server or run `node scripts/gemini_distiller.js tsc` to confirm code validity.
