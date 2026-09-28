# DEVELOPMENT_RULES.md — Engineering & Refactoring Standards

> **Project:** `Orgchart_TTI_onprem` (Factory Management System — Milwaukee Tool SHTP & DDK)  
> **Purpose:** Detailed coding conventions, architectural boundaries, and refactoring guidelines.

---

## 1. Core Principles

1. **Safety First:** Working production features must never be broken for the sake of abstract architecture.
2. **Incremental Evolution:** Refactoring must proceed step-by-step in small, verifiable increments. Big-bang rewrites are strictly prohibited.
3. **Explicit Separation of Concerns:**
   - Presentation (React UI) handles user interaction and display.
   - Business logic belongs in custom hooks, helper utilities, or domain services.
   - Data access belongs in Server Route Handlers or designated server utilities.

---

## 2. Code Quality & TypeScript Standards

### 2.1 Typing Guidelines
* **Avoid `any`:** `any` defeats the purpose of TypeScript. Use strict interfaces or specific type aliases.
* **Shared Types:** Place interfaces used across multiple files in `src/types/` (e.g. `src/types/visitor.types.ts`).
* **Feature-Specific Types:** Types used strictly inside a single component or feature should be defined within that component/feature file until wider usage is required.
* **Strict Null Checks:** Always handle potential `null` or `undefined` values from API responses and database queries safely using optional chaining (`?.`) and nullish coalescing (`??`).

### 2.2 DRY (Don't Repeat Yourself)
* **No Duplicate Helper Functions:**
  - Common formatting helpers (e.g. `formatDateShort`, `formatDateTime`, `formatTimeOnly`, `removeAccents`) must not be re-implemented inside individual page files. They must be imported from a centralized utility file under `src/utils/`.
  - Common status badges and styling logic (e.g. `getCategoryBadgeClass`, `getStatusBadgeClass`) must be centralized.
* **No Duplicate Modals:**
  - If two modals share >80% of form fields and layout (e.g., `HeadcountAddModal` and `HeadcountEditModal`), merge them into a single polymorphic modal (e.g., `HeadcountFormModal`) with an `isEdit` mode.

### 2.3 Single Responsibility
* Components must focus on presentation and user interaction.
* Do not combine data fetching, complex data transformation, validation algorithms, and 500 lines of JSX inside a single page file.
* Extract large sub-sections (such as tabs, data tables, filter toolbars, and modals) into dedicated sub-components.

---

## 3. API & Data Access Rules

### 3.1 Route Handlers (`src/app/api/**/route.ts`)
* All API routes must follow Next.js 15 App Router conventions (`export async function GET(request: Request) { ... }`).
* Always return proper HTTP status codes:
  - `200 OK` for successful queries.
  - `201 Created` for successful resource creations.
  - `400 Bad Request` for validation failures.
  - `401 Unauthorized` for missing authentication.
  - `403 Forbidden` for role/permission denial.
  - `404 Not Found` for missing resources.
  - `500 Internal Server Error` for unhandled exceptions.

### 3.2 Client-Side Data Fetching
* Do not duplicate fetch logic across different components.
* Wrap fetch operations with descriptive error logging and user-friendly error messages.
* When a feature is refactored, encapsulate its API calls into a feature-specific service module (e.g. `src/features/visitor/services/visitorApi.ts`) rather than executing raw `fetch` calls deep inside UI trees.

### 3.3 Preserving API Contracts
* **DO NOT** modify API route URLs during architecture refactoring.
* **DO NOT** change the shape of existing request JSON bodies or response JSON payloads. External callers and client components rely on these exact property names.

---

## 4. Database Rules

### 4.1 Boundary Isolation
* **Direct database access from Client Components is STRICTLY FORBIDDEN.**
* Only Server Route Handlers (`src/app/api/**/route.ts`) or server-side functions may import database connection pools.

### 4.2 Pool Management
* The application uses two distinct on-premise PostgreSQL pools:
  1. `src/lib/db.ts` (`pool`): Connects to `Orgchart_TTI_Mil` (organization, users, headcount, roles).
  2. `src/lib/visitor-db.ts` (`visitorPool`): Connects to `Visitor_database` (visitor requests, check-in logs, rooms, interviewees).
* Always release acquired clients when using explicit transactions:
  ```typescript
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    // queries...
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
  ```

### 4.3 Query Security & Performance
* **Always use parameterized queries:**
  ```typescript
  // CORRECT:
  await pool.query('SELECT * FROM employees WHERE id = $1', [employeeId]);

  // STRICTLY FORBIDDEN (SQL Injection Risk):
  await pool.query(`SELECT * FROM employees WHERE id = '${employeeId}'`);
  ```
* Do not modify database schemas, table definitions, or constraints during refactoring.

---

## 5. Routing & Page Architecture

* **App Router Structure:**
  - `src/app/` is responsible for routing, layout wrappers, and metadata.
  - Pages (`page.tsx`) should act as **composition roots**. A page should assemble layout, load initial data or render feature components, and delegate detailed rendering to components.
* **Route Invariance:**
  - Existing page URLs must not be changed without explicit business approval.
  - Role-based route protection is governed by `src/middleware.ts` — do not bypass or conflict with middleware definitions.

---

## 6. Component Organization

### 6.1 Current Reality vs Target Architecture
* **Current State:** A flat `src/components/` directory containing both shared UI and feature-specific components.
* **Target Direction:**
  - `src/components/ui/`: Reusable, domain-agnostic UI primitives (Button, Modal, Input, Badge, Table, Tooltip).
  - `src/components/layout/`: App shell components (Header, Sidebar, AppFooter, Breadcrumbs).
  - `src/features/<feature_name>/components/`: Domain-specific components (e.g. `VisitorRequestForm`, `RoomReservationModal`, `OrgChartTree`).

### 6.2 Component Rules
* Do not place business-specific components inside `src/components/ui/`.
* Keep component props strictly typed via interfaces.
* Prefer function components with explicit TypeScript interfaces (`interface Props { ... }`).
* Avoid prop drilling: use Context or dedicated custom hooks for feature-wide state.

---

## 7. Styling & Design System Rules

### 7.1 Unified Design Tokens
* **Brand Primary:** Milwaukee Red (`#db011c` / `var(--mwk-primary)`).
* Avoid creating arbitrary inline styles (`style={{ backgroundColor: '#db011c' }}`). Use Tailwind utility classes or theme CSS variables.
* Dark mode is supported via CSS variables in `src/app/globals.css`. Do not hardcode fixed bright white backgrounds (`bg-white`) where `bg-[var(--color-bg-card)]` or responsive dark mode classes (`dark:bg-slate-800`) are expected.

### 7.2 Tables & Responsive Layouts
* All data tables with more than 5 columns must be responsive:
  - Enclose the `<table>` in an `overflow-x-auto` wrapper.
  - Give the `<table>` a fixed minimum width (e.g. `min-w-[1200px]` or `min-w-[1360px]`).
  - Use sticky headers (`sticky top-0`) with distinct z-indexes for smooth scrolling.

### 7.3 Modal Dialogs
* Modals must include:
  - An accessible backdrop with blur and dark overlay.
  - Escape key listener or click-outside handler to close.
  - Keyboard trap and scroll locking on `document.body` while open.
  - Clear header, scrollable body area, and action footer.

---

## 8. Refactoring Safety Protocol

When refactoring any file or feature:

1. **Pre-check:** Review the existing file and its dependencies before writing code.
2. **Isolate Scope:** Refactor only the designated file or function. Do not make cosmetic changes to adjacent files.
3. **No Unrequested "Improvements":** Do not modify business flows or validation rules unless explicitly asked.
4. **Mandatory Quality Gate:** Every change must pass:
   ```bash
   npx tsc --noEmit
   npm run build
   ```
5. **Reversibility:** Ensure every change is clean and traceable in `git diff`.
