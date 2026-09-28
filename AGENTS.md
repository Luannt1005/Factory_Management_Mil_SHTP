# AGENTS.md — AI Coding Assistant & Developer Guide

> **Project:** `Orgchart_TTI_onprem`  
> **Brand / Factory:** Milwaukee Tool / Techtronic Industries (TTI) Vietnam (SHTP & DDK Plants)  
> **Status:** Active Production & Continuous Enhancement  

This document serves as the **authoritative guide and source of truth** for all AI coding assistants (and human engineers) working on this codebase. Adherence to the rules in this document is **mandatory**.

---

## 1. Project Overview

`Orgchart_TTI_onprem` is an on-premise Factory Management System developed for the Milwaukee Tool manufacturing facilities in Vietnam (Saigon Hi-Tech Park - SHTP and Dai Dang - DDK).

### Main Business Domains

1. **Orgchart & Headcount Analytics (`/orgchart`, `/dashboard`, `/customize`, `/headcount_open`)**
   - Interactive organizational hierarchy charts powered by BalkanGraph OrgChart.js.
   - Core Team vs Operations Support hierarchy visualization.
   - Headcount planning, open positions tracking, and departmental analytics.
   - Dynamic custom org chart builder with node editing, drag-and-drop hierarchy adjustments, and export capabilities.
   - HR data import and synchronization from Excel spreadsheets.

2. **Visitor Management & Security Control (`/visitorrequest`, `/visitoradmin`, `/visitoradmin/checkinout`, `/visitoradmin/rooms`, `/visitoranalytics`, `/visitordashboard`)**
   - Visitor pre-registration workflow (guest info, host department, purpose, safety compliance).
   - Interviewee registration and scheduling for HR-TA recruitment.
   - Meeting room booking, capacity management, and approval workflows.
   - Security gate check-in / check-out with real-time logging, vehicle tracking, and security card assignment.
   - Analytical dashboards monitoring visitor traffic, peak hours, and safety audits.

---

## 2. Technology Stack

| Layer | Technology | Details / Version |
|---|---|---|
| **Framework** | Next.js 15 (App Router) | Version `15.5.15` with React 18 |
| **Language** | TypeScript | Version `^5` (Strict type checking) |
| **Styling** | Tailwind CSS v4 | PostCSS + `@tailwindcss/postcss`, CSS variables |
| **Database** | Dual On-Prem PostgreSQL | `Orgchart_TTI_Mil` (Org/Users) & `Visitor_database` (Visitor/Security) |
| **Database Client** | `node-postgres` (`pg`) | Connection pooling via `pg.Pool` |
| **Authentication** | NextAuth.js v4 | Azure Active Directory (MSAL OAuth2) + Microsoft Graph API |
| **Legacy Auth** | BCrypt + JWT | Fallback local username/password accounts for service/admin roles |
| **Icons & UI** | Lucide React | Modern SVG icons |
| **Data Tables / Export** | SheetJS (`xlsx`) | Excel import, export, and report generation |
| **Hosting & Process** | Node.js + PM2 | Cluster mode with `--max-http-header-size=65536` |
| **Reverse Proxy** | Nginx | SSL termination, reverse proxy, large header buffer handling |

---

## 3. Current Architecture (Reality Check)

To work effectively on this project, you must understand its **current reality**, not an idealized assumption:

* **Route-Centric Structure:** Most business logic and state currently reside directly inside page components under `src/app/`.
* **Monolithic Pages (Technical Debt):**
  - `src/app/visitoradmin/rooms/page.tsx` (~1,549 lines) — Contains 4 tabs (Meeting Rooms, Room Categories, Host Departments, All Rooms), custom portal dropdowns, modals, and raw fetch calls.
  - `src/app/visitorrequest/page.tsx` (~1,299 lines) — Contains heavy multi-step forms, extensive inline CSS styles (`style={{ ... }}`), and Excel import logic.
  - `src/app/visitoradmin/page.tsx` (~1,149 lines) — Comprehensive request management table with embedded modal workflows.
  - `src/app/visitordashboard/page.tsx` (~1,050 lines) — Analytics dashboard with inline charts and aggregations.
* **Flat Components Folder:** `src/components/` contains 26 components mixing generic UI, modals, layout, and domain-specific org chart renderers.
* **No `features/` Directory Yet:** A domain-driven feature folder structure does not exist yet.
* **No Unified Service Layer Yet:** Pages and components frequently invoke `fetch('/api/...')` directly with inline error handling.
* **Dual Database Access:** Data access is split across two separate database pools (`src/lib/db.ts` for Orgchart/Auth and `src/lib/visitor-db.ts` for Visitor system).

---

## 4. Target Architecture Direction

The codebase is being refactored **incrementally** toward a feature-oriented, modular architecture.

```text
src/
├── app/                 # Next.js App Router (Routing, layout wrappers, route handlers only)
├── components/
│   ├── ui/              # Generic, reusable UI primitives (Button, Modal, Input, Badge, Table)
│   └── layout/          # Application shell (Header, Sidebar, Footer, Navigation)
├── features/            # Domain-driven feature modules (created incrementally per phase)
│   ├── visitor/         # Visitor registration, approvals, check-in/out, room bookings
│   ├── orgchart/        # Hierarchy visualization, custom chart editor, node components
│   ├── headcount/       # Headcount tracking, open position planning, HR data tables
│   └── systemadmin/     # User management, role assignment, system audit logs
├── hooks/               # Shared custom React hooks (usePagination, useDebounce, etc.)
├── lib/                 # Core infrastructure (DB pools, authOptions, external clients)
├── constants/           # Shared constants, enums, navigation menus
├── types/               # Shared TypeScript interfaces and domain types
└── utils/               # Pure helper functions (formatting, date calculations, string utils)
```

> [!CRITICAL]
> **DO NOT** create all these directories upfront! Directories in `src/features/` and `src/components/ui/` must only be created during specific, approved refactoring phases when migrating that particular domain.

---

## 5. Important Directories

| Directory | Purpose / Responsibility |
|---|---|
| `src/app/` | Next.js App Router entry points, pages, layouts, and API route handlers (`/api/**/route.ts`). |
| `src/components/` | Existing shared and page-specific components (to be organized over time). |
| `src/hooks/` | React custom hooks (e.g. `useUser`, `useDebounce`, `useClickOutside`). |
| `src/lib/` | Infrastructure code: PostgreSQL database pools, NextAuth configuration, vendor bundles. |
| `src/types/` | TypeScript type declarations and shared interfaces. |
| `src/constant/` | Constant values, status definitions, navigation items. |
| `src/styles/` | Global styles, typography, and legacy component CSS. |
| `public/` | Static assets, Milwaukee logos, placeholder employee images. |
| `scripts/` | Database migration and operational scripts. |
| `scratch/` | Scratchpad inspection scripts and diagnostic logs (do not touch without approval). |

---

## 6. Protected Files (DO NOT MODIFY)

The following files represent critical production infrastructure, database connectivity, or authentication contracts. **Agents must NEVER modify these files unless the user explicitly requests changes to them:**

```text
src/middleware.ts
src/lib/authOptions.ts
src/lib/db.ts
src/lib/visitor-db.ts
src/lib/orgchart.js
nginx.conf
ecosystem.config.js
.env.local
```

### Why They Are Protected:
1. `src/middleware.ts`: Controls production RBAC access using `ALL_DISTINCT_PAGES`. Modifying route matching or auth logic will immediately cause production `/access-denied` lockouts.
2. `src/lib/authOptions.ts`: Configures Azure AD SSO, token refresh, and automatic role assignment for HR-TA, SHTP, and DDK plants.
3. `src/lib/db.ts` & `src/lib/visitor-db.ts`: Maintain PostgreSQL connection pools to on-premise production databases.
4. `src/lib/orgchart.js`: 552 KB BalkanGraph vendor distribution file. Must not be formatted, altered, or refactored.
5. `nginx.conf` & `ecosystem.config.js`: Production server configurations handling 64 KB HTTP headers required for Azure AD corporate tokens.
6. `.env.local`: Contains sensitive production secrets, DB credentials, and SSO keys.

---

## 7. Protected Contracts

During any refactoring, cleanup, or enhancement, you must preserve the following contracts **without changes**:

* **Route URLs:** Existing URLs (e.g. `/visitoradmin/checkinout`, `/orgchart`, `/visitorrequest`) must not be renamed or broken.
* **API Endpoints:** Existing API route paths (`/api/requests`, `/api/visitor_admin/checkinout`, etc.) must remain stable.
* **API Payloads:** Do not alter JSON request or response structures, as existing UI and integration scripts depend on them.
* **Database Schema:** Do not alter table names, column names, foreign keys, or column types during refactoring.
* **Authentication & Authorization:** Preserve user roles (`admin`, `security`, `hr_ta`, `approver`, `user`) and access rules.

---

## 8. Refactoring Rules for AI Agents

1. **Incremental Execution:** Refactor one single component, utility, or sub-domain at a time. Never attempt a global rewrite in a single step.
2. **Behavioral Invariance:** Code refactoring must strictly preserve existing business behavior and user experience. Do not "improve" or redesign behavior unless explicitly instructed.
3. **No Unverified Deletions:** Never delete any file without first searching the entire codebase (`grep_search`) to prove zero imports, references, or runtime usage exist. If uncertain, KEEP the file and report to the user.
4. **No Premature Architecture:** Do not create dummy files or empty feature folders before they are actively implemented.
5. **Preserve Comments & Docstrings:** Do not remove existing domain-specific comments, SQL explanations, or documentation.

---

## 9. API & Data Access Rules

1. **Route Handlers:** API routes must reside in `src/app/api/**/route.ts` using standard Next.js 15 route signatures (`GET`, `POST`, `PUT`, `DELETE`).
2. **No Direct DB Calls from Client:** UI components with `'use client'` must **never** import database pools (`db.ts` or `visitor-db.ts`). Database operations belong strictly in route handlers or server-side utilities.
3. **Parameterized Queries Only:** Never concatenate user input into SQL queries. Always use `$1, $2, ...` parameters to prevent SQL injection.
4. **Safe Error Handling:** Catch all database and runtime exceptions. Do not expose raw database errors or stack traces to the client response.

---

## 10. UI & Design System Rules

1. **Brand Identity:** Primary brand color is **Milwaukee Red** (`#db011c` / `--mwk-primary`). Secondary colors are dark neutrals (charcoal, slate, white).
2. **Design Tokens:** Prefer standard Tailwind classes and CSS variables defined in `src/app/globals.css`. Do not introduce random hex color codes.
3. **No Inline Styles:** Avoid inline `style={{ ... }}` blocks for layout or colors. Use Tailwind utility classes.
4. **Responsive Table Standard:** All data tables with many columns must be implemented with semantic `<table>` elements wrapped in an `overflow-x-auto` container with an explicit minimum width (e.g. `min-w-[1200px]` or `min-w-[1360px]`) to prevent layout collapse on smaller screens.

---

## 11. TypeScript Rules

1. **No `any`:** Avoid using `any`. Use proper interface definitions, union types, or `unknown` with type guards.
2. **Centralize Domain Types:** Place shared domain types in `src/types/` (e.g. `src/types/visitor.types.ts`, `src/types/orgchart.types.ts`).
3. **Avoid Type Assertions:** Minimize `as any` or unsafe type casts. Let TypeScript infer types where possible.

---

## 12. Verification Requirements

After **every** code modification, the following verification commands must pass with **exit code 0**:

```bash
# 1. Type Check Verification
npx tsc --noEmit

# 2. Production Build Verification
npm run build
```

If either command fails:
- If the error was caused by your change, **fix it immediately**.
- If the error pre-existed and is unrelated to your change, **do not touch unrelated code**; report it to the user.

---

## 13. Git & Change Safety Rules

1. **Small, Reversible Commits:** Work in small increments so changes can be audited or rolled back easily.
2. **Verify Git Status:** Always run `git status` to verify that only intended files were modified or created.
3. **No Package Additions Without Approval:** Do not run `npm install` or add dependencies to `package.json` without explicit user permission.
4. **Stop and Report:** After completing the requested task, stop calling tools and report clear, concise results to the user. Do not self-initiate next phases.
