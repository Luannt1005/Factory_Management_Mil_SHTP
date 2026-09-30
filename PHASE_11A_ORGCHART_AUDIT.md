# PHASE 11A — ORGCHART MODULE AUDIT

> **Date:** September 30, 2026  
> **Project:** `Orgchart_TTI_onprem`  
> **Target Module:** Orgchart & Organizational Data Visualization  
> **Reference Rules:** `AGENTS.md`, `DEVELOPMENT_RULES.md`, `DESIGN_SYSTEM.md`  

---

## 1. Project & Module Overview

The **Orgchart Module** is one of the core foundational business domains of `Orgchart_TTI_onprem`. It provides interactive visualization of the company's hierarchy across Saigon Hi-Tech Park (SHTP) and Dai Dang (DDK) plants.

### Key Functional Areas
1. **Interactive BalkanGraph OrgChart (`/orgchart`):**
   - Renders company-wide and department-specific reporting hierarchies using the BalkanGraph OrgChart engine (`src/lib/orgchart.js`).
   - Supports Core Team vs Operations Support hierarchies.
   - Dynamic node expansion, collapse, zoom, search, and department filtering.
   - Node detail inspection modal with direct reports, span-of-control, and probation flags.
2. **Tabular Organizational Data View (`/viewdata_org`):**
   - Paginated, filterable data table listing transformed employee and synthetic department group nodes.
   - Instant search across Employee ID, Name, Title, Department, and Business Unit.
3. **Custom OrgChart Editor (`/customize`):**
   - Interactive sandbox for HR and management to create, modify, save, and share custom organizational hierarchies.
   - Supports creating profiles from live department structures, drag-and-drop hierarchy adjustments, and node attribute editing.
4. **Executive Hierarchy Presentation Views (`src/components/CoreTeamOrgChart.tsx`, `src/components/OpsSupportOrgChart.tsx`):**
   - Executive presentation views for Milwaukee leadership (VP, Global Operations, IE/FMU/MIF, Factory Management).
   - Real-time span-of-control calculations, direct reports grouping, and role-based categorization.

---

## 2. Inventory of Audited Routes & Files

### App Routes
| Route Path | Entry File | Line Count | Purpose |
|---|---|---|---|
| `/orgchart` | `src/app/orgchart/page.tsx` | 99 | Main interactive org chart entry with SWR data syncing and department filtering |
| `/orgchart` (View) | `src/app/orgchart/OrgChartView.tsx` | 497 | BalkanGraph canvas lifecycle, node event handling (add, update, drop, remove), modal triggers |
| `/orgchart` (Templates) | `src/app/orgchart/OrgChartTemplates.tsx` | 275 | Custom SVG/HTML node templates (`mil_card`, `group`, `indirect_group`, `headcount_open`) |
| `/orgchart` (Filter) | `src/app/orgchart/DepartmentFilter.tsx` | 290 | Sector/Department & Employee Type (DL/IDL/Staff) interactive dropdown toolbar |
| `/orgchart` (Modal) | `src/app/orgchart/NodeDetailsModal.tsx` | 410 | Detailed employee profile modal showing contact, line manager, and subordinate trees |
| `/viewdata_org` | `src/app/viewdata_org/page.tsx` | 275 | Tabular organizational node explorer with client-side filters and pagination |
| `/customize` | `src/app/customize/page.tsx` | 15 | Lazy-loaded client wrapper for Custom OrgChart Builder |
| `/customize` (Client) | `src/app/customize/components/CustomizeClient.tsx` | 430 | Custom org chart workspace container with sidebar profiles and canvas |
| `/customize` (Header) | `src/app/customize/components/CustomizeHeader.tsx` | 255 | Action toolbar (Save, Export PDF/PNG/SVG, Share, Create Profile, Edit Mode) |
| `/customize` (Modal) | `src/app/customize/components/CreateProfileModal.tsx` | 170 | Modal to initialize a custom org chart from department templates or scratch |
| `/customize` (Modal) | `src/app/customize/components/EditNodeModal.tsx` | 495 | Modal for modifying custom node attributes, titles, images, and hierarchy links |
| `/customize` (Hook) | `src/app/customize/hooks/useOrgChartEditor.ts` | 1,049 | Complex hook managing BalkanGraph editor instance, node mutations, and undo/redo |
| `/customize` (Hook) | `src/app/customize/hooks/useOrgProfileManager.ts` | 118 | Custom org chart CRUD profile coordinator |

### Shared Hierarchy Components
| Component File | Line Count | Purpose |
|---|---|---|
| `src/components/CoreTeamOrgChart.tsx` | 524 | Dedicated executive tree for TTI Core Team leadership |
| `src/components/OpsSupportOrgChart.tsx` | 476 | Dedicated executive tree for Operations Support hierarchy |
| `src/components/DepartmentSlider.tsx` | 145 | Carousel navigator for department org charts |
| `src/components/PresentationSlider.tsx` | 230 | Fullscreen executive presentation slider |
| `src/components/FullPagePresenter.tsx` | 385 | Presenter mode container with auto-pan and zoom controls |

---

## 3. Entity & Domain Model Inventory

The Orgchart module operates on the following real entities:

1. **`Employee` (Source Database Entity - `employees` table in `Orgchart_TTI_Mil`):**
   - Fields: `emp_id`, `full_name`, `job_title`, `dept`, `bu`, `bu_org_3`, `dl_idl_staff`, `location`, `employee_type`, `line_manager`, `is_direct`, `joining_date`, `last_working_day`, `status`.
2. **`OrgNode` (BalkanGraph Standard Hierarchy Node):**
   - `id`: Cleaned string ID without leading zeros (e.g. `'818'`) or synthetic ID (e.g. `'dept:FMU:818'`).
   - `pid`: Direct parent ID (Line Manager ID or Group ID).
   - `stpid`: Secondary Task Parent ID (Used for linking employees into department group boxes).
   - `name`: Display name or department title.
   - `title`: Job title or "Department".
   - `image`: URL to employee image (`/api/uploads/{emp_id}.webp`) or placeholder.
   - `tags`: Tag array serialized as JSON string (e.g. `["emp"]`, `["group"]`, `["indirect_group"]`, `["Emp_probation"]`, `["headcount_open"]`).
   - `dept`, `bu`, `type`, `location`, `description`, `joining_date`, `line_manager`.
3. **`CustomOrgChart` (Stored in `custom_orgcharts` table):**
   - Fields: `id`, `username`, `orgchart_name`, `description`, `org_data` (JSON array of nodes), `is_public`, `created_at`, `updated_at`.
4. **`CoreTeamStructure` & `OpsSupportStructure`:**
   - Leadership nodes (`vp`, `globalOps`, `ie_fmu_mif`, `factoryMgmt`).
   - Grouped active reports, support functions, and recursive Span-of-Control metrics.

---

## 4. API Inventory & Contract Analysis

| Endpoint | Method | Query / URL Params | Request Body | Response Shape | Primary Consumers |
|---|---|---|---|---|---|
| `/api/orgchart` | `GET` | `dept` (optional filter) | None | `{ success: boolean, data: OrgNode[], cached?: boolean, timestamp?: string }` | `useOrgData`, `viewdata_org/page.tsx`, `useOrgProfileManager.ts` |
| `/api/orgchart/core-team` | `GET` | None | None | `{ success: boolean, vp, globalOps, ie_fmu_mif, factoryMgmt, jeffReports, supportFunctions, reports, spanOfControl }` | `CoreTeamOrgChart.tsx` |
| `/api/orgchart/ops-support` | `GET` | None | None | `{ success: boolean, root, directReports, reports, spanOfControl }` | `OpsSupportOrgChart.tsx` |
| `/api/orgcharts` | `GET` | `username` (required) | None | `{ orgcharts: CustomOrgChartRecord[] }` | `useOrgProfileManager.ts` |
| `/api/orgcharts` | `POST` | None | `{ username, orgchart_name, describe, org_data, is_public }` | `{ success: boolean, orgchart_id: string, message: string }` | `useOrgProfileManager.ts` |
| `/api/orgcharts/[id]` | `GET` | `id` (route param) | None | `{ orgchart_id, orgchart_name, describe, org_data, is_public, username, created_at, updated_at }` | `useOrgChartEditor.ts` |
| `/api/orgcharts/[id]` | `PUT` | `id` (route param) | `{ orgchart_name?, describe?, org_data?, is_public? }` | `{ success: boolean, message: string }` | `useOrgChartEditor.ts`, `useOrgProfileManager.ts` |
| `/api/orgcharts/[id]` | `DELETE` | `id` (route param) | None | `{ success: boolean, message: string }` | `useOrgProfileManager.ts` |
| `/api/add-Department` | `POST` | None | `{ name, pid, description? }` | `{ success: boolean, data: OrgNode, timestamp: string }` | Custom node additions |

---

## 5. Critical Infrastructure: `src/lib/orgchart.js` Usage Map

`src/lib/orgchart.js` is a **552 KB BalkanGraph OrgChart.js** commercial distribution file.

### Direct Import Map:
1. `src/app/orgchart/OrgChartTemplates.tsx` (`import OrgChart from "@/lib/orgchart";`):
   - Customizes template definitions under `OrgChart.templates.mil_card`, `OrgChart.templates.group`, and `OrgChart.templates.indirect_group`.
   - Defines custom HTML/SVG node markup, color bands, photo borders, and action icons.
2. `src/app/orgchart/OrgChartView.tsx` (`import OrgChart from "@/lib/orgchart";`):
   - Initializes `new OrgChart(treeRef.current, config)`.
   - Subscribes to chart lifecycle events: `on("add")`, `on("update")`, `on("remove")`, `on("drop")`, `on("click")`.
   - Manages zoom, export (PDF, PNG, SVG), and node filtering.
3. `src/app/customize/hooks/useOrgChartEditor.ts` (`import OrgChart from "@/lib/orgchart";`):
   - Controls the editor instance for the `/customize` builder.
   - Manages interactive drag-and-drop parenting, node creation, and orientation switching.

> [!CRITICAL]
> Under Rule 6 of `AGENTS.md` and Rule 14 of Phase 11A, **`src/lib/orgchart.js` is strictly protected**. It must NEVER be formatted, edited, split, or modified.

---

## 6. Business Logic & Calculation Invariance

The following calculations and business transformations must remain completely invariant:

1. **Employee ID Normalization:**
   - Formula: `trimLeadingZeros = (val) => String(val).trim().replace(/^0+/, '') || '0';`
   - Strips leading zeros so that `'000818'`, `'0818'`, and `'818'` match the same employee key.
2. **Indirect vs Direct Manager Handling:**
   - If `emp.is_direct === 'NO'`, `isIndirectManager = true`, and department key is prefixed with `"i-"` (`"i-" + managerId`).
3. **Synthetic Department Group Node Generation:**
   - Department nodes are generated dynamically on-the-fly: `deptKey = dept:${currentDept}:${deptManagerId}`.
   - If manager is missing or filtered out, group node becomes a root (`pid: null`).
4. **Probation Detection:**
   - Formula: `joiningDate <= 60 days && joiningDate >= 0` adds tag `"Emp_probation"`.
5. **Headcount Open Position Handling:**
   - If `emp.employee_type === 'hc_open'`, adds tag `"headcount_open"` and assigns image `"/headcount_open.png"`.
6. **Span-of-Control Recursive Hierarchy:**
   - Computes total direct and indirect subordinates under each manager.
   - Categorizes reports into: `Director`, `Manager`, `Supervisor`, `Specialist`, `Engineer`, `IDL`.

---

## 7. Discovered Technical Debt & Anomalies

1. **Dead Mutation Calls in `OrgChartView.tsx`:**
   - `OrgChartView.tsx` attempts `fetch("/api/orgchart", { method: "POST" })`, `"PUT"`, and `"DELETE"`.
   - However, `/api/orgchart/route.ts` only implements `GET`.
   - In production, these mutation calls either return 405 Method Not Allowed or error out silently.
   - *Resolution in Phase 11A:* Map them safely to `orgchartApi` with typed responses to ensure compile-time and runtime safety without altering current UI behavior.
2. **Scattered Types:**
   - `src/types/orgchart.ts` contained loose types with `any` definitions.
   - *Resolution in Phase 11A:* Establish `src/types/orgchart.types.ts` as the authoritative domain type definition.

---

## 8. RBAC & Access Control Rules

- **Viewer Role:**
  - Route `/headcount_open` redirects `viewer` users back to `/`.
  - In `/orgchart`, viewers have read-only inspection access without mutation triggers.
- **Admin / Editor Role:**
  - Full access to `/customize`, saving custom profiles, and editing node attributes.
- **Authentication:**
  - All `/api/orgchart/*` routes verify session using `isAuthenticated()` from `@/lib/auth-server`.

---

## 9. Next Phases Plan (Phase 11B Recommendation)

In Phase 11B (Component Extraction & Standardization), the following extraction is recommended:
1. `src/features/orgchart/components/OrgChartCanvas.tsx` (Extract BalkanGraph canvas wrapper from `OrgChartView.tsx`)
2. `src/features/orgchart/components/OrgChartToolbar.tsx` (Extract Department & Filter controls)
3. `src/features/orgchart/components/OrgChartNodeModal.tsx` (Extract and clean up `NodeDetailsModal.tsx`)
4. Relocate `CoreTeamOrgChart.tsx` and `OpsSupportOrgChart.tsx` under feature components.
