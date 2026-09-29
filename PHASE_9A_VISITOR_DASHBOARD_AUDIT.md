# PHASE 9A — VISITOR DASHBOARD AUDIT REPORT

> **Module:** Visitor Dashboard (`src/app/visitordashboard/page.tsx`)  
> **Target Feature:** `src/features/visitor/dashboard/`  
> **Status:** Phase 9A — Audit + Domain Types + API Service  

---

## 1. Current Structure & Page Responsibilities

`src/app/visitordashboard/page.tsx` (1,086 lines) serves as the primary tracking, review, and request management interface for submitters and operational personnel (HR & Security) at Milwaukee Tool / TTI Vietnam plants.

### Current File Structure:
```text
src/app/visitordashboard/
└── page.tsx                          # Coordinator and monolithic view (1,086 lines)
```

### Core Responsibilities:
1. **Submitter Request Tracking:**
   - Displays all visitor and interviewee requests submitted by the currently logged-in user.
   - Provides status monitoring, category badges, visit duration, and detailed multi-step workflow states.
2. **Tabbed Navigation:**
   - **General Visitors (`activeTab = 'general'`):** Lists general visitors (Vendor, Contractor, MIL/TTI Expat, etc.) with approval workflow statuses across departments and facility areas.
   - **Interviewee (`activeTab = 'interviewee'`):** Lists interviewee recruitment requests with interview schedules, departments, interviewers, and meeting room areas.
3. **Approval Workflow Dot Indicators & Tooltips:**
   - Visualizes multi-stage approvals (`RequestApproval`) as color-coded status badges / dots (Amber = Pending, Green = Approved, Red = Rejected).
   - Tooltips show target area name, assigned approver email, and routing status (e.g. "Routing to Line Manager...").
4. **Auto-Polling Mechanism:**
   - Actively checks requests for approvals pending Power Automate routing (`Pending Manager Assignment` or null approver email).
   - Runs a silent background poll every 3 seconds (up to 6 times = 18s) to update approval assignments without blocking UI state.
5. **Interviewee Request Editing (Self-Service Mutation):**
   - Allows request submitters to edit candidate lists, visit date, interview start time, meal registration, factory tour, and meeting room assignment.
   - Enforces a strict quota of maximum 3 edits per request (`edit_count < 3`).
   - Validates candidate count (1 to 20 candidates), formats candidate and interviewer names with Vietnamese NFC capitalization, and updates via API.
6. **Request Details Portal Modal:**
   - Full read-only breakdown of request parameters: visitor roster, approval workflows, visit dates, sites, purpose, cost centers, and meeting room info.

---

## 2. Dashboard Sections

The dashboard UI is divided into the following concrete visual and functional sections:

1. **Tab Switcher:**
   - `General Visitors`: visible only to non-Security users (`!isSecurity`).
   - `Interviewee`: accessible to users with `Hr Visitor` or `Security` roles (`canAccessInterviewee = isHrVisitor || isSecurity`). Shows warning alert if unprivileged users click it.
2. **Filter & Search Bar:**
   - Date range pickers: `From` (`startDate`) and `To` (`endDate`).
   - "Clear Filters" action link when filters are populated.
   - Search input: text search for Request Code / Visitor / Company with Enter key listener and Search button.
   - Request counter: `Showing {requests.length} of {pagination.total} requests`.
3. **Data Table:**
   - **General Visitors Table:**
     - Columns: `Visitor request code`, `Visitor / Company`, `Category`, `Visit Period`, `Workflows`, `Overall Status`, `Details`.
     - Multi-visitor indicator: `(+ N)` badge if `visitors` JSON has > 1 visitor.
     - Workflows column: colored dots for each room/department approval with interactive tooltips.
   - **Interviewee Table:**
     - Columns: `Visitor request code`, `Interviewee`, `Department / Interviewer`, `Schedule Date`, `Schedule Time`, `Area`, `Details`.
     - Edit button: visible if `edit_count < 3`; otherwise displays disabled "Max Edits (3/3)" badge.
     - Details action button.
   - Empty state: displays icon and message when no requests match the active filters.
4. **Pagination Controls:**
   - Previous / Next buttons.
   - Direct numeric page buttons (displays up to 5 pages).
5. **Request Details Modal (Portal):**
   - Modal overlay anchored to `document.body` via `createPortal`.
   - General visitor details layout: Visitor roster card list, request ref, status pill, category, visit dates, purpose & purpose detail, site, cost center, factory tour, and area approvals card with approver email and routing status.
   - Interviewee details layout: Candidate roster card list with interview department and interviewer, schedule date, time, interview area, visiting site, and an "Edit Request" button if allowed.
6. **Edit Interviewee Modal (Portal):**
   - Modal overlay with header showing request code and edit quota (`N/3`).
   - Candidate List Table: index, full name input, job title, department, interviewer name, and delete row action.
   - "Add Candidate" button (enforces max 20 candidates).
   - Schedule & Area Details grid: Schedule Date, Schedule Time, Meal Registration dropdown, Factory Tour dropdown, and Interview Area (Meeting Room) dropdown grouped by floor.
   - Cancel and "Save Changes" action buttons with loading spinner/state.

---

## 3. Entities & Domain Inventory

| Entity | Description | Source / DB Table |
|---|---|---|
| `VisitorRequest` | Core request record containing submitter link, category, visiting dates, purpose, JSON details, and status. | `Visitor_database` -> `"VisitorRequest"` |
| `IntervieweeRequest` | Legacy / specific request format for recruitment candidate visits. | `Visitor_database` -> `"VisitorRequest"` (category: `Interviewee`) |
| `Visitor` | Nested visitor item stored in JSON string within `VisitorRequest.visitors`. | Embedded JSON in `"VisitorRequest"` |
| `CandidateItem` | Candidate entry stored in JSON within Interviewee requests (name, title, company, interviewDepartment, interviewerName). | Embedded JSON in `"VisitorRequest"` |
| `RequestApproval` | Approval workflow step assigned to a room area or manager/VP with status (`PENDING`, `APPROVED`, `REJECTED`). | `Visitor_database` -> `"RequestApproval"` |
| `RoomArea` | Facility or room area associated with a request approval. | `Visitor_database` -> `"RoomArea"` |
| `MeetingRoom` | Physical meeting room entity with `id`, `floorName`, `roomName` used for Interview Area selection. | `Visitor_database` -> `"MeetingRoom"` |
| `User` | User profile of the logged-in submitter linked via `submitterId`. | `Visitor_database` -> `"User"` |

---

## 4. State Inventory

The component state in `src/app/visitordashboard/page.tsx` consists of:

| State Variable | Type | Initial Value | Purpose |
|---|---|---|---|
| `requests` | `any[]` (to be typed: `VisitorDashboardRequestRecord[]`) | `[]` | List of visitor/interviewee requests for active page and tab. |
| `loading` | `boolean` | `true` | Table loading indicator state. |
| `pagination` | `{ total: number, page: number, limit: number, totalPages: number }` | `{ total: 0, page: 1, limit: 20, totalPages: 0 }` | Server-side pagination tracker. |
| `startDate` | `string` | `''` | Filter: start date (`YYYY-MM-DD`). |
| `endDate` | `string` | `''` | Filter: end date (`YYYY-MM-DD`). |
| `searchTerm` | `string` | `''` | Filter: text query for request ID, visitor name, company. |
| `selectedRequest` | `VisitorDashboardRequestRecord \| null` | `null` | Currently opened request in the Details modal. |
| `editingInterviewee` | `VisitorDashboardRequestRecord \| null` | `null` | Request record currently being modified in Edit modal. |
| `editFormData` | `any` (to be typed: `UpdateIntervieweeRequestPayload`) | `{}` | Mutable form state for editing an interviewee request. |
| `saving` | `boolean` | `false` | Mutation submission loading indicator. |
| `activeTab` | `'general' \| 'interviewee'` | `'general'` | Active dashboard view mode. |
| `mounted` | `boolean` | `false` | Client-side mount flag for portals. |
| `meetingRooms` | `MeetingRoom[]` | `[]` | Meeting room options fetched from `/api/admin/meeting-rooms`. |
| `abortControllerRef` | `useRef<AbortController \| null>` | `null` | Tracks active request to cancel pending fetch requests on tab/filter change. |

---

## 5. API Inventory & Contract Specification

### 5.1. Overview Table

| API Endpoint | Method | Query / Path Params | Request Body | Response Shape | Purpose & Usage |
|---|---|---|---|---|---|
| `/api/admin/meeting-rooms` | `GET` | None | None | `{ meetingRooms: MeetingRoom[] }` | Fetches meeting rooms for the Interview Area dropdown in the Edit modal. |
| `/api/requests` | `GET` | `tab`, `page`, `limit`, `startDate`, `endDate`, `search` | None | `{ requests: VisitorDashboardRequestRecord[], pagination: VisitorDashboardPagination }` | Fetches paginated requests belonging to current user for the given tab. Supports AbortSignal and silent auto-polling. |
| `/api/interviewee_requests/[id]` | `PUT` | `id` (path) | `UpdateIntervieweeRequestPayload` | `{ message: string, editCount?: number }` | Updates candidate list and schedule/room details (max 3 edits). |

### 5.2. Detailed Contract: `GET /api/requests`
- **Method:** `GET`
- **URL Format:** `/api/requests?tab=${tab}&page=${page}&limit=${limit}&startDate=${startDate}&endDate=${endDate}&search=${search}`
- **Query Parameters:**
  - `tab`: `'general' | 'interviewee'` (required)
  - `page`: integer (default: 1)
  - `limit`: integer (default: 20)
  - `startDate`: string (optional, `YYYY-MM-DD`)
  - `endDate`: string (optional, `YYYY-MM-DD`)
  - `search`: string (optional, matches `id`, `visitorName`, `currentCompany`)
- **Headers:** standard session cookie
- **Response Shape (200 OK):**
  ```json
  {
    "requests": [
      {
        "id": "uuid",
        "status": "PENDING | APPROVED | REJECTED | COMPLETE",
        "visitor_name": "string",
        "visitor_title": "string",
        "current_company": "string",
        "start_date": "ISO-date",
        "end_date": "ISO-date",
        "purpose_of_visit": "string",
        "visitor_category": "string",
        "visiting_site": "string",
        "purpose_detail": "string | null",
        "details": "string (JSON) | object",
        "visitors": "string (JSON) | null",
        "edit_count": 0,
        "created_at": "ISO-date",
        "request_approvals": [
          {
            "id": "uuid",
            "status": "PENDING | APPROVED | REJECTED",
            "approver_email": "string | null",
            "room_areas": {
              "name": "string",
              "category": "string"
            }
          }
        ]
      }
    ],
    "pagination": {
      "total": 100,
      "page": 1,
      "limit": 20,
      "totalPages": 5
    }
  }
  ```
- **Authentication:** `401 Unauthorized` triggers client-side redirect: `router.push('/login?redirect=' + pathname)`.

### 5.3. Detailed Contract: `PUT /api/interviewee_requests/[id]`
- **Method:** `PUT`
- **Path Parameter:** `id` (Request ID)
- **Request Body (JSON):**
  ```json
  {
    "visitors": [
      {
        "name": "Nguyen Van A",
        "title": "Software Engineer",
        "company": "IT Department",
        "interviewDepartment": "IT Department",
        "interviewerName": "Tran Thi B"
      }
    ],
    "startDate": "2026-09-30",
    "startTime": "09:30",
    "interviewArea": "Floor 2 - Meeting Room 201",
    "mealRegistration": "Yes | No",
    "factoryTour": "Yes | No",
    "visitingSite": "SHTP"
  }
  ```
- **Response Shape (200 OK):**
  ```json
  {
    "message": "Request updated successfully",
    "editCount": 2
  }
  ```
- **Error Response (400 / 401 / 500):**
  ```json
  {
    "error": "Maximum edit limit (3 times) reached"
  }
  ```

---

## 6. Business Rules

1. **Submitter Ownership & Isolation:**
   - In `/api/requests`, requests are scoped strictly to the current user's profile (`WHERE r."submitterId" = $1`). Users only view their own submissions.
2. **Category & Tab Partitioning:**
   - `general`: filters `r."visitorCategory" != 'Interviewee'`.
   - `interviewee`: filters `r."visitorCategory" = 'Interviewee'`.
3. **Role-Based Tab Constraints:**
   - Security users (`isSecurity = true`) are strictly forced to the `interviewee` tab; the `general` tab button is completely hidden from their view.
   - Non-HR / non-Security users clicking the `interviewee` tab are blocked with an alert: `"You need Hr Visitor or Security role to view Interviewee requests."`
   - URL query parameter `?tab=interviewee` initializes the tab on first load only if permitted.
4. **Auto-Polling on Pending Routing:**
   - When requests contain any approval with `approver_email === 'Pending Manager Assignment'` or `approver_email === null`, the page starts a 3-second background polling loop (up to 6 times / 18 seconds max) using `isSilent = true`.
   - Background polling updates request data and synchronizes the active Details modal without resetting loading spinners.
5. **Interviewee Request Editing Quota:**
   - Max 3 edits per request (`edit_count < 3`). Once `edit_count >= 3`, the Edit button is replaced with "Max Edits (3/3)" and editing is blocked on both client and server.
6. **Candidate Validation & Normalization:**
   - Enforces 1 to 20 candidates per request.
   - Candidate names and interviewer names are sanitized (`cleanNameInput`) and formatted using Vietnamese Unicode NFC title-casing (`formatName`).
   - All string inputs (job title, department) are trimmed.
   - Schedule date, time, and interview area are mandatory.
7. **Status Color System:**
   - `APPROVED` / `COMPLETE`: `#10b981` (Green)
   - `REJECTED`: `#ef4444` (Red)
   - `PENDING` / other: `#f59e0b` (Amber)

---

## 7. RBAC & Access Control Rules

| Role / Flag | Definition in Code | Access & Permissions |
|---|---|---|
| **Admin** | `(session?.user)?.role === 'admin'` | Full access to General and Interviewee tabs. Can view details and edit interviewee requests. |
| **HR Visitor** | `appRoleNames.includes('Hr Visitor') \|\| isAdmin` | Full access to General and Interviewee tabs. Can view details and edit interviewee requests. |
| **Security** | `appRoleNames.includes('Security') && !isAdmin && !isHrVisitor` | Locked strictly to `interviewee` tab. General tab is hidden. Can view details and edit interviewee requests. |
| **General User** | Authenticated user without HR/Security roles | Can view own General requests. Blocked from Interviewee tab with modal alert. |
| **Unauthenticated** | `401 Unauthorized` | Redirects to `/login?redirect=${encodeURIComponent(pathname)}`. |

---

## 8. Existing Reusable Types

| Type Name | Source Path | Dashboard Reusability |
|---|---|---|
| `MeetingRoom` | `src/types/rooms.types.ts` | Reuse directly for `meetingRooms` state and dropdown options. |
| `RequestApprovalRecord` | `src/types/visitor-admin.types.ts` | Reuse directly for `request_approvals` array in request records. |
| `VisitorRequestData` | `src/types/visitor.types.ts` | Reference for core request properties. |

---

## 9. Type Candidates (`src/types/visitor-dashboard.types.ts`)

To avoid duplicating existing types and prevent `any`, the following domain types will be defined in `src/types/visitor-dashboard.types.ts`:

- `VisitorDashboardTab`: `'general' | 'interviewee'`
- `VisitorDashboardCandidateItem`: typed candidate entry in Interviewee requests.
- `VisitorDashboardParsedDetails`: parsed JSON details payload (`startTime`, `interviewArea`, `mealRegistration`, `factoryTour`, `costCenter`).
- `VisitorDashboardRequestRecord`: complete request record returned by `GET /api/requests`.
- `VisitorDashboardPagination`: pagination state envelope.
- `GetVisitorDashboardRequestsParams`: query params for `/api/requests`.
- `GetVisitorDashboardRequestsResponse`: response envelope for `/api/requests`.
- `UpdateIntervieweeRequestPayload`: body for `PUT /api/interviewee_requests/[id]`.
- `UpdateIntervieweeRequestResponse`: response for `PUT /api/interviewee_requests/[id]`.
- `GetMeetingRoomsResponse`: response envelope for `/api/admin/meeting-rooms`.

---

## 10. Service Candidates (`src/features/visitor/dashboard/services/visitorDashboardApi.ts`)

Encapsulates all Dashboard HTTP communications:

1. `getMeetingRooms(): Promise<GetMeetingRoomsResponse>`
2. `getMyRequests(params: GetVisitorDashboardRequestsParams, signal?: AbortSignal): Promise<GetVisitorDashboardRequestsResponse>`
3. `updateIntervieweeRequest(id: string, payload: UpdateIntervieweeRequestPayload): Promise<UpdateIntervieweeRequestResponse>`
4. Custom error class: `VisitorDashboardApiError` containing HTTP status and server error message.

---

## 11. Component Candidates (Planned for Phase 9B)

1. `VisitorDashboardTabs.tsx`: Tab switcher between General and Interviewee views with role-based restriction alerts.
2. `VisitorDashboardFilters.tsx`: Date range pickers, text search input, and clear filters action.
3. `VisitorDashboardTable.tsx`: Multi-tab data table with status dots, tooltips, and action buttons.
4. `VisitorDetailModal.tsx`: Request details modal portal with visitor/candidate cards and workflow approval status.
5. `VisitorEditIntervieweeModal.tsx`: Edit Interviewee modal portal with dynamic candidate table and meeting room picker.

---

## 12. Technical Debt Identified

1. **Direct `fetch()` calls inside Page Component:**
   - 3 direct fetch calls in `page.tsx` (`/api/admin/meeting-rooms`, `/api/requests`, `/api/interviewee_requests/[id]`).
2. **Extensive use of `any`:**
   - Over 15 instances of `any` across `requests`, `selectedRequest`, `editingInterviewee`, `editFormData`, `meetingRooms`, and helper callbacks.
3. **Inline Styles on Form Inputs:**
   - Custom `Input` and `InputLabel` helper components defined with extensive inline style objects at the bottom of `page.tsx`.
4. **Duplicate Name Sanitization Logic:**
   - `cleanNameInput` and `formatName` duplicated from `visitorrequest/page.tsx`.

---

## 13. Risks & Mitigations

| Risk | Mitigation |
|---|---|
| **Auto-polling loop causing UI freeze or infinite loops** | Retain identical `setInterval` logic, max 6 polls condition, and `isSilent` flag in `visitorDashboardApi` calls. |
| **AbortController cancellation breaking during fast tab switching** | Preserve signal passing from `abortControllerRef.current.signal` into `visitorDashboardApi.getMyRequests`. |
| **Authentication 401 redirect handling** | Catch `VisitorDashboardApiError` with `status === 401` and trigger `router.push('/login?redirect=...')`. |
| **Editing Interviewee losing candidate formatting** | Retain Vietnamese NFC character normalization and title-casing prior to sending payload to API service. |

---

## 14. Explicitly Protected Contracts

- **Route URLs:** `/visitordashboard` must remain unchanged.
- **API Endpoints & Contracts:**
  - `GET /api/admin/meeting-rooms`
  - `GET /api/requests`
  - `PUT /api/interviewee_requests/[id]`
- **Protected Files (Must NEVER be touched):**
  - `src/middleware.ts`
  - `src/lib/authOptions.ts`
  - `src/lib/db.ts`
  - `src/lib/visitor-db.ts`
  - `src/lib/orgchart.js`
  - `nginx.conf`
  - `ecosystem.config.js`
  - `.env.local`
