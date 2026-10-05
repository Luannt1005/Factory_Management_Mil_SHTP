# memory.md — Living Project Memory & Architectural State

> **Repository:** `Orgchart_TTI_onprem`  
> **Last Updated:** October 2026  
> **Status:** Active Production & Continuous Enhancement  

---

## 1. Architectural Evolution History

### Phase 1 – 13: Feature Modularization
- Split monolithic domain code into `src/features/`:
  - `src/features/visitor/`: `admin`, `analytics`, `checkinout`, `dashboard`, `request`, `rooms`
  - `src/features/orgchart/`: `components`, `hooks`, `services`, `utils`
  - `src/features/headcount/`: `components`, `services`
  - `src/features/systemadmin/`: `components`, `services`
- Strict separation of concerns: Page components under `src/app/` act as thin routing wrappers.
- Centralized HTTP API services in `src/features/*/services/` replacing raw `fetch` calls.

### Phase 14A: Final Architecture Audit & Shims Cleanup
- Eliminated 19 dead re-export shims (-2,484 lines of dead code).
- Enforced strict top-to-bottom dependency hierarchy (`app → features → types/utils/lib`).
- Zero cross-feature coupling (`featureA → featureB = 0`).

### Phase 17C & 17D: Dashboard UI & Visual Standardization
- Unified visual language for OrgChart Dashboard and Visitor Analytics:
  - Created shared dashboard UI components (`Card`, `ChartCard`, `MetricCard`, `PageHeader`, `FilterBar`, `TableCard`).
  - Centralized chart themes and tooltips (`ChartTheme.ts`, `ChartTooltip.tsx`).
  - Standardized font sizes, borders, radii, and Milwaukee brand accents across all charts.

### Phase 18: Codebase Standardization (branch `refactor/standardization`, Oct 2026)
- **Security:** parameterized `visitor_admin/analytics` filters (was SQL injection), `import_excel` delete and `sheet` pagination; BEGIN/COMMIT/ROLLBACK now run on a dedicated `PoolClient`; API 500s return generic messages; auth guards on `admin/meeting-rooms`, `orgcharts`, `admin/upload-employee-image` (+ path traversal check).
- **Layering:** every business page under `src/app/` is a thin wrapper around a `features/<domain>/components/*View.tsx`; contexts live in `src/contexts/`; `components/` no longer imports `app/` or `features/`; `/visitorrequest` composes the visitor dashboard through a `dashboardSlot` prop.
- **Design tokens:** `@theme inline` in `globals.css` exposes `mwk`, `mwk-hover`, `mwk-dark`, `mwk-soft`, `status-success|error|warning`; shared status pill/dot helpers in `src/utils/badge.ts`.
- **Types:** `src/types/next-auth.d.ts` augments `Session['user']`; headcount sheet rows (`RawSheetRow`, `EditableSheetRow`), orgchart editor (`EditorOrgNode`, `EditNodeSaveData`) and account (`UserProfile`) types centralized.

---

## 2. Recent Functional Additions

### Power Automate Workflow Run ID
- Database column `power_automate_run_id TEXT` added to `"VisitorRequest"` in PostgreSQL database `Visitor_database`.
- Index `idx_visitor_request_power_automate_run_id` created.
- Migration script preserved in `scripts/add_power_automate_run_id.js`.
- Linked in Visitor Admin Detail Modal with direct navigation to the Power Automate run execution URL.
- Added webhook dispatcher `sendAdminDecisionWebhook` in `src/app/api/visitor_admin/requests/route.ts` triggered when Admin clicks Approve or Reject.

### Excel Export Template (Visitor Admin)
- Standardized to exactly 25 columns in `src/features/visitor/admin/components/VisitorAdminView.tsx`:
  `Request Code | Visitor Code | Visitor Name | Visitor Title | Visitor Company | Submitter Name | Submitter Department | Start Date | End Date | Visitor Category | Purpose Of Visit | Purpose Detail | Visiting Site | BU | Host Functional Dept | Func Host Name | Host Department | Dept Host Name | Cost Center | Factory Tour | Meal Registration | Status | Approval Progress | Submit Date | Completion Date`
- Formatted codes without `#` and `-` (e.g. `E01102603` and `E01102603V1`).

---

## 3. Known Technical Debt & Ongoing Considerations

1. **Remaining `any` at the BalkanGraph boundary:**
   - `src/lib/orgchart.d.ts` is an untyped stub, so event callbacks in `useOrgChartEditor.ts` / `OrgChartCanvas.tsx` still use `any`.
2. **Sticky-header sheet tables:**
   - `SheetManagerTableCore` / `HeadcountOpenTable` keep `overflow: hidden` wrappers; adding `overflow-x-auto` would break their sticky header (needs a max-height scroll container decision).
3. **Dual Database Connectivity:**
   - Must be kept separate: `src/lib/db.ts` for Orgchart/Users/Auth and `src/lib/visitor-db.ts` for Visitor/Rooms/Security. Never cross-import pools.
4. **BalkanGraph Distribution (`src/lib/orgchart.js`):**
   - 552 KB vendor distribution file. Must never be reformatted or modified directly.
