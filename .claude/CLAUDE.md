# CLAUDE.md — Project Master Guide & AI Brain

> **Project:** `Orgchart_TTI_onprem`  
> **Brand / Factory:** Milwaukee Tool / Techtronic Industries (TTI) Vietnam (SHTP & DDK Plants)  
> **Domain:** On-Premise Factory Management, OrgChart Analytics & Visitor Security Control  
> **Framework:** Next.js 15 (App Router, React 18, TypeScript 5, Tailwind CSS v4)  

---

## 1. Project Overview

`Orgchart_TTI_onprem` is an on-premise Factory Management System developed for Milwaukee Tool manufacturing facilities in Vietnam (Saigon Hi-Tech Park - SHTP and Dai Dang - DDK).

### Main Business Domains

1. **Orgchart & Headcount Analytics (`/orgchart`, `/dashboard`, `/customize`, `/headcount_open`, `/sheetmanager`)**
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
   - Power Automate integration for automated email approvals and notification webhooks.

---

## 2. Directory Architecture & Layering

```
.claude/
├── CLAUDE.md               # Master project brain & index
├── CLAUDE.local.md         # Local developer environment guidelines (private)
├── settings.json           # Permissions, approved commands, hooks
├── settings.local.json     # Private local settings
├── memory.md               # Living project memory & architecture status
├── rules/                  # Modular engineering rules
│   ├── workflow.md         # Refactoring guidelines, git safety, verification standards
│   ├── design.md           # Milwaukee Tool Design System & UI tokens
│   └── tech-defaults.md    # Next.js 15, PostgreSQL, NextAuth, TypeScript standards
├── agents/                 # Specialized sub-agent personas
│   ├── architect.md        # Architectural boundary & dependency auditor
│   ├── reviewer.md         # Code review & contract protection inspector
│   └── visitor-security.md # Visitor pre-registration & security gate domain specialist
└── skills/                 # Reusable domain tasks & automated recipes
    ├── verify-build.md     # Type checking and production build verification
    ├── export-excel.md     # Standard 25-column Excel export maintenance
    ├── power-automate.md   # Webhook payloads and approval flow integration
    └── db-migration.md     # Dual-database PostgreSQL schema migrations
```

### Source Tree (`src/`)

```
src/
├── app/                    # Next.js App Router (pages, layouts, route handlers)
│   ├── api/                # Backend API routes (Postgres pools, NextAuth, Graph API)
│   ├── (domains)/          # Route entry points
├── features/               # Domain-Driven Feature Modules (Clean Architecture)
│   ├── visitor/            # admin, analytics, checkinout, dashboard, request, rooms
│   ├── orgchart/           # components, hooks, services, utils
│   ├── headcount/          # components, services
│   └── systemadmin/        # components, services
├── components/             # Shared Layout & Coordinator Components
│   └── ui/                 # Reusable UI primitives (Card, MetricCard, Button, Modal)
├── hooks/                  # Global React hooks
├── lib/                    # Core Infrastructure & Database Connectivity
├── types/                  # Centralized TypeScript domain interfaces
└── utils/                  # Pure utility helpers (date, formatting, strings)
```

---

## 3. Protected Files & Contracts (DO NOT MODIFY UNLESS EXPLICITLY INSTRUCTED)

The following files represent critical production infrastructure, database connectivity, or authentication contracts:

```text
src/middleware.ts       # RBAC access control; modifying breaks production routing
src/lib/authOptions.ts  # Azure AD SSO, token refresh & plant role assignments
src/lib/db.ts           # PostgreSQL pool for Orgchart_TTI_Mil
src/lib/visitor-db.ts   # PostgreSQL pool for Visitor_database
src/lib/orgchart.js     # BalkanGraph vendor distribution bundle (552 KB)
nginx.conf              # Large HTTP header handling (64 KB for Azure AD SSO)
ecosystem.config.js     # PM2 cluster configuration
.env.local              # Production secrets, DB credentials, SSO keys
```

### Protected Contracts:
- **Route URLs:** Existing URLs (`/visitoradmin/checkinout`, `/orgchart`, `/visitorrequest`, etc.) must not be broken.
- **API Endpoints:** Existing route paths (`/api/requests`, `/api/visitor_admin/requests`, etc.) must remain stable.
- **API Payloads:** Do not alter JSON request or response structures without approval.
- **Database Schema:** Do not alter table/column names or foreign keys during refactoring.

---

## 4. Automated Token-Saving Verification Commands

> ⚡ **MANDATORY FOR CLAUDE:** To avoid inflating your context window with thousands of lines of terminal output, NEVER run raw `npx tsc` directly. Always use the Gemini Distiller:

```bash
# 1. Type Check Verification (absorbs log noise, returns ~10 lines if error)
node scripts/gemini_distiller.js tsc

# 2. Production Build Verification
node scripts/gemini_distiller.js build
```

If errors occur, Gemini 3.8 Flash automatically intercepts the full log, distills the root cause into a compact report (<80 tokens), and outputs only that minimal diagnostic block for you to fix.

---

## 5. Navigation & References

- Refactoring & Safety Rules: [`.claude/rules/workflow.md`](file:///.claude/rules/workflow.md)
- Design Tokens & UI System: [`.claude/rules/design.md`](file:///.claude/rules/design.md)
- Tech Stack & Dual Database Rules: [`.claude/rules/tech-defaults.md`](file:///.claude/rules/tech-defaults.md)
- Project Memory & Current State: [`.claude/memory.md`](file:///.claude/memory.md)
