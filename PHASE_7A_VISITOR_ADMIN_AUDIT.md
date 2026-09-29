# PHASE 7A — VISITOR ADMIN AUDIT REPORT

> **Module:** Visitor Admin (`src/app/visitoradmin/page.tsx`)  
> **Target Feature:** `src/features/visitor/admin/`  
> **Status:** Phase 7A — Audit + Domain Types + API Service  

---

## 1. Executive Summary & Page Responsibilities

`src/app/visitoradmin/page.tsx` (1,149 lines) serves as the primary administrative back-office portal for managing all visitor and interviewee requests across the SHTP and DDK facilities.

### Current Responsibilities:
1. **Request Management & Tab Separation:** Dual-mode tab toggle (`General Visitors` vs `Interviewee`).
2. **Filtering & Searching:** Multi-criteria search (Request Code, Submitter Name/Email/Department, Date Ranges, Completion Dates, Multi-select Sites, Multi-select Categories, Multi-select Status).
3. **Data Grid & Selection:** Large table rendering with batch selection, pagination, visual status badges, approval progress indicators, and action buttons.
4. **Quick Approval / Rejection:** Direct status mutation (`COMPLETE` or `REJECTED`) for requests.
5. **Batch Deletion:** Deletion of selected requests with confirmation dialog.
6. **Detailed View Modal:** Popup modal rendering comprehensive visitor information, sub-visitor lists, candidate lists, host department details, visit dates, cost centers, factory tours, and area approvals.
7. **Request Editing Modal (`EditRequestModal.tsx`):** Allows administrative updates to dates, category, site, details, and visitor/candidate lists via `PUT /api/requests/[id]`.
8. **Excel Export (`ExcelJS`):** High-volume export (limit: 999,999) with customized Milwaukee-branded red headers, frozen header panes, host department cross-referencing, and per-visitor/candidate row expansion.

---

## 2. Entity & Domain Inventory

| Entity | Description | Storage / DB Table |
|---|---|---|
| `VisitorRequest` | Core request record containing visitor/submitter info, date ranges, status, category, site. | `Visitor_database` -> `"VisitorRequest"` |
| `RequestApproval` | Approval status for specific room areas, manager, or VP approvals. | `Visitor_database` -> `"RequestApproval"` |
| `RoomArea` | Linked physical room area assigned to an approval step. | `Visitor_database` -> `"RoomArea"` |
| `User` (Profile) | Employee profile of the submitter (name, department, email). | `Visitor_database` -> `"User"` |
| `HostDepartment` | Department organizational hierarchy and designated host names (BU, Functional Dept, Department). | `Visitor_database` -> `"HostDepartment"` |
| `VisitorItem` | Sub-visitor record parsed from `visitors` JSON column. | Embedded in `VisitorRequest.visitors` |
| `IntervieweeCandidate` | Candidate record parsed from `visitors` or embedded in `details`. | Embedded in `VisitorRequest.visitors` / `details` |

---

## 3. API Inventory & Contract Specification

| Method | Endpoint | Description | Request Payload | Response Shape |
|---|---|---|---|---|
| `GET` | `/api/visitor_admin/requests` | Fetch paginated requests with filters | Query params: `tab`, `page`, `limit`, `startDate`, `completeStartDate`, `completeEndDate`, `site`, `category`, `code`, `submitter`, `status` | `{ requests: VisitorAdminRequestRecord[], pagination: { total, page, limit, totalPages } }` |
| `PATCH` | `/api/visitor_admin/requests` | Update request or approval status | `{ id: string, status: string }` or `{ approvalId: string, status: string }` | `{ message: string, data?: VisitorAdminRequestRecord }` |
| `DELETE` | `/api/visitor_admin/requests` | Delete selected requests by IDs | `{ ids: string[] }` | `{ message: string }` |
| `GET` | `/api/admin/host-departments` | Fetch host department mapping for export | None | `{ hostDepartments: HostDepartment[] }` |
| `PUT` | `/api/requests/[id]` | Update request details and visitors (Edit Modal) | `{ start_date, end_date, visitor_category, visiting_site, details, visitors, interviewee_name?, job_title?, interview_department? }` | `{ message: string, data: VisitorAdminRequestRecord }` |

---

## 4. Business Rules & Logic

1. **Tab Filtering:**
   - `general`: Filters out `visitorCategory = 'Interviewee'`.
   - `interviewee`: Filters strictly `visitorCategory = 'Interviewee'`.
2. **Category Aliases:**
   - When filtering `Vendor` or `Contractor`, backend automatically expands query to match legacy `'Vendor/Contractor'`.
3. **Approval Status Hierarchy:**
   - Status color coding: `COMPLETE` / `APPROVED` (Green `#10b981`), `REJECTED` (Red `#ef4444`), `PENDING` / `IN PROCESS` (Amber `#f59e0b`).
   - If all zone approvals are approved -> request status becomes `COMPLETE`.
   - If all rejected -> request status becomes `REJECTED`.
4. **Completion Date Logic:**
   - Requests in `COMPLETE` or `APPROVED` display `updated_at` (or `created_at` for legacy) as Completion Date.
5. **Excel Export Formatting:**
   - Flattens multi-visitor requests into individual visitor rows (`Code + V1, V2...`).
   - Resolves host names (`functional_host_name`, `department_host_name`) by joining with `HostDepartment`.
   - Applies Milwaukee red header style (`#DB011C`) with white bold text and frozen top row.

---

## 5. Permission & Authorization Rules

1. **Page-level Access:** Requires permission for `/visitoradmin` checked via Next.js middleware and `hasPageAccess('/visitoradmin')` in API route handlers.
2. **Redirect on 401 / 403:** If request returns 401 or 403, frontend redirects to `/login?redirect=/visitoradmin`.

---

## 6. Current Technical Debt & Issues Identified

1. **Excessive `any` Usage:**
   - `requests: any[]`
   - `selectedRequest: any`
   - `editingRequest: any`
   - `EditRequestModal({ request: any, onSave: (updatedData: any) => void })`
   - `formData: any`
   - Multiple `parseDetails(details: any)` and `flatMap((r: any) => ...)`
2. **Monolithic Page Structure:**
   - Inline Excel export generation with dynamic import of `exceljs`.
   - Inline Detailed View Modal (lines 872–1134, ~262 lines).
   - In-page filter bar with custom date range and multi-select dropdowns.
   - Separate modal `EditRequestModal.tsx` in `src/app/visitoradmin/`.
3. **Direct `fetch()` Calls:**
   - 5 direct `fetch()` calls in `page.tsx`.
   - 1 direct `fetch()` call in `EditRequestModal.tsx`.

---

## 7. Protected Contracts (DO NOT MODIFY)

1. **Route URLs:** `/visitoradmin` must remain unchanged.
2. **API Routes:**
   - `/api/visitor_admin/requests` (`GET`, `PATCH`, `DELETE`)
   - `/api/requests/[id]` (`PUT`)
   - `/api/admin/host-departments` (`GET`)
3. **Database Schema:** Tables `"VisitorRequest"`, `"RequestApproval"`, `"RoomArea"`, `"User"`, `"HostDepartment"`.
4. **Authentication & RBAC:** Session evaluation and `/visitoradmin` page access guards.

---

## 8. Target Feature Architecture for Module

```text
src/
├── app/
│   └── visitoradmin/
│       ├── page.tsx                    # Coordinator page
│       ├── EditRequestModal.tsx        # To be extracted in Phase 7B
│       ├── checkinout/                 # Dedicated sub-module (Phase 8)
│       └── rooms/                      # Refactored in Phase 5
│
├── features/
│   └── visitor/
│       └── admin/
│           ├── services/
│           │   └── visitorAdminApi.ts   # Unified API service (Phase 7A)
│           ├── components/             # (Phase 7B candidates)
│           │   ├── RequestDetailModal.tsx
│           │   ├── AdminFilterBar.tsx
│           │   ├── GeneralRequestsTable.tsx
│           │   ├── IntervieweeRequestsTable.tsx
│           │   └── ExcelExportButton.tsx
│           └── utils/                  # Domain-specific export / formatting helpers
│
└── types/
    └── visitor-admin.types.ts           # Unified domain & API types
```

---

## 9. Phase 7A Scope & Boundaries

- **In Scope:**
  1. Define complete domain types in `src/types/visitor-admin.types.ts`.
  2. Implement `src/features/visitor/admin/services/visitorAdminApi.ts` covering all 5 API endpoints.
  3. Refactor `src/app/visitoradmin/page.tsx` and `EditRequestModal.tsx` to use `visitorAdminApi` and typed models.
  4. Full verification via `tsc`, `build`, and `git diff`.
- **Out of Scope (Phase 7B):**
  - No UI redesign.
  - No component extraction yet.
  - No changes to `checkinout/`.
  - No commit/push.
