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

---

## 2. Recent Functional Additions

### Power Automate Workflow Run ID
- Database column `power_automate_run_id TEXT` added to `"VisitorRequest"` in PostgreSQL database `Visitor_database`.
- Index `idx_visitor_request_power_automate_run_id` created.
- Migration script preserved in `scripts/add_power_automate_run_id.js`.
- Linked in Visitor Admin Detail Modal with direct navigation to the Power Automate run execution URL.
- Added webhook dispatcher `sendAdminDecisionWebhook` in `src/app/api/visitor_admin/requests/route.ts` triggered when Admin clicks Approve or Reject.

### Excel Export Template (Visitor Admin)
- Standardized to exactly 25 columns in `src/app/visitoradmin/page.tsx`:
  `Request Code | Visitor Code | Visitor Name | Visitor Title | Visitor Company | Submitter Name | Submitter Department | Start Date | End Date | Visitor Category | Purpose Of Visit | Purpose Detail | Visiting Site | BU | Host Functional Dept | Func Host Name | Host Department | Dept Host Name | Cost Center | Factory Tour | Meal Registration | Status | Approval Progress | Submit Date | Completion Date`
- Formatted codes without `#` and `-` (e.g. `E01102603` and `E01102603V1`).

---

## 3. Known Technical Debt & Ongoing Considerations

1. **Coordinator Components in `src/components/`:**
   - `HeadcountManager.tsx`, `SheetManagerTable.tsx`, and `DataImport.tsx` currently reside in `src/components/`. They will be migrated to `src/features/headcount/` in a dedicated phase.
2. **Dual Database Connectivity:**
   - Must be kept separate: `src/lib/db.ts` for Orgchart/Users/Auth and `src/lib/visitor-db.ts` for Visitor/Rooms/Security. Never cross-import pools.
3. **BalkanGraph Distribution (`src/lib/orgchart.js`):**
   - 552 KB vendor distribution file. Must never be reformatted or modified directly.
