# PHASE 8A — CHECK-IN / CHECK-OUT AUDIT REPORT

> **Module:** Check-In / Check-Out Management (`src/app/visitoradmin/checkinout/page.tsx`)  
> **Target Feature:** `src/features/visitor/checkinout/`  
> **Status:** Phase 8A — Audit + Domain Types + API Service  

---

## 1. Current Structure & Page Responsibilities

`src/app/visitoradmin/checkinout/page.tsx` (942 lines) provides real-time security gate operations and receptionist workflows for on-premise visitor access control at the SHTP and DDK manufacturing plants.

### Current File Structure:
```text
src/app/visitoradmin/checkinout/
├── components/
│   └── RequestCheckInModal.tsx       # Modal for bulk/individual check-in/out per request (409 lines)
└── page.tsx                          # Main coordinator page for check-in/out operations (942 lines)
```

### Core Responsibilities:
1. **Real-time Dual View Modes:**
   - **Visitor View (`viewMode = 'visitor'`):** Flattens multi-visitor requests into individual visitor rows for rapid physical card assignment, single-click Check In / Check Out, and instant audit trail.
   - **Group View (`viewMode = 'group'`):** Groups visitors by request envelope (`requestCode` / `requestId`), expandable accordion rows, with batch modal access.
2. **Hardware Barcode / QR Scanner Integration:**
   - Global `keydown` buffer listening on the `window` to intercept USB/Bluetooth scanner gun inputs anywhere on the page (detecting typing speed < 80ms vs human keystrokes).
   - Automatically handles carriage return / tab delimiter (`Enter` / `Tab`), strips URL prefixes (`#`, paths), queries the server or local cache, and pops up the `RequestCheckInModal` immediately for the scanned badge/code.
3. **Filtering & Searching:**
   - Text search across request ID, submitter name, visitor name, visitor code, card number.
   - Specific visitor name filter with Vietnamese diacritics removal (`removeAccents`).
   - Single date filter with quick "Today" shortcut.
   - Multi-select status filter (`PENDING`, `CHECKED_IN`, `CHECKED_OUT`).
   - Multi-select category filter (`Vendor`, `Contractor`, `MIL / TTI EXPAT`, `Interviewee`).
   - Multi-select site filter (`SHTP`, `DDK`, `SHTP / DDK`).
4. **Card Management & Assignment:**
   - In-table direct card number editing (`onBlur` triggers `UPDATE_CARD`).
   - Real-time card mapping per visitor (`cardNumbers[requestId-visitorIndex]`).
5. **State Mutation & Optimistic Local Updates:**
   - Actions: `CHECK_IN`, `CHECK_OUT`, `RESET`, `UPDATE_CARD`.
   - Optimistic local updates in `history` and `scannedRequest` upon successful API response without full page reload.
6. **Summary Statistics:**
   - Calculates on-site count (`CHECKED_IN`), departed count (`CHECKED_OUT`), and total visitors for the active date filter.

---

## 2. Entities & Domain Inventory

| Entity | Description | Source / DB Origin |
|---|---|---|
| `VisitorCheckInOut` | Core gate log entity tracking individual visitor check-in, check-out, card number, timestamp, and status. | `Visitor_database` -> `"VisitorCheckInOut"` |
| `CombinedRequests` | Virtual CTE combining approved/completed standard `VisitorRequest` and `IntervieweeRequest`. | `Visitor_database` -> `"VisitorRequest"`, `"IntervieweeRequest"` |
| `FlattenedVisitors` | Virtual CTE unnesting JSON array of visitors from requests with ordinals. | Virtual CTE join on `visitors` JSON |
| `checkinout_action_history` | Audit log table tracking actor, timestamp, action type, card number, and metadata for every gate event. | `Visitor_database` -> `checkinout_action_history` |
| `VisitorRequestData` | Request envelope containing metadata (submitter, dates, site, category, purpose, visitor list). | `Visitor_database` -> `"VisitorRequest"` |
| `Visitor` | Individual visitor item nested inside request (name, company, title, code, card number, status, times). | Embedded JSON / `"VisitorCheckInOut"` |
| `VisitorLogEntry` | Historical record of past check-in/out mutations. | `Visitor_database` -> `checkinout_action_history` |

---

## 3. API Inventory & Contract Specification

### 3.1. Endpoints Overview

| Method | Endpoint | Description | Request Query / Body | Response Shape |
|---|---|---|---|---|
| `GET` | `/api/visitor_admin/checkinout/history` | Fetch request envelopes with nested visitor check-in statuses and pagination. | Query: `date`, `category`, `site`, `search`, `page`, `limit` | `{ requests: CheckInOutRequestRecord[], pagination: { total, page, limit, totalPages } }` |
| `POST` | `/api/visitor_admin/checkinout` | Execute gate action (`CHECK_IN`, `CHECK_OUT`, `RESET`, `UPDATE_CARD`). | Body: `{ action, requestId, requestCode, visitorIndex, visitorName, visitorCode, cardNumber }` | `{ message: string }` |
| `GET` | `/api/visitor_admin/checkinout` | Fetch flattened visitors with stats (Available in API, used for alternative analytics). | Query: `date`, `startDate`, `endDate`, `requestCode`, `category`, `status`, `search`, `page`, `limit` | `{ visitors: FlattenedVisitorRecord[], todayStats: CheckInOutStats, pagination: ... }` |

### 3.2. Detailed Contract: `GET /api/visitor_admin/checkinout/history`
- **Query Parameters:**
  - `date`: string (optional, format: `YYYY-MM-DD`)
  - `category`: string (optional, comma-separated categories)
  - `site`: string (optional, comma-separated sites)
  - `search`: string (optional, search term for ID, code, submitter, visitor)
  - `page`: number (default: 1)
  - `limit`: number (default: 15; in `page.tsx` called with `500` for client-side pagination, or `10` for barcode lookup)
- **Response Shape (200 OK):**
  ```json
  {
    "requests": [
      {
        "requestId": "string",
        "requestCode": "string",
        "submitterName": "string",
        "submitterDepartment": "string",
        "visitorCategory": "string",
        "visitingSite": "string",
        "purposeOfVisit": "string",
        "purposeDetail": "string",
        "startDate": "string",
        "endDate": "string",
        "status": "string",
        "createdAt": "string",
        "visitors": [
          {
            "visitorName": "string",
            "visitorTitle": "string",
            "visitorCompany": "string",
            "submitterName": "string",
            "interviewDepartment": "string | null",
            "interviewerName": "string | null",
            "visitorCode": "string",
            "checkInOutStatus": "PENDING | CHECKED_IN | CHECKED_OUT",
            "cardNumber": "string | null",
            "checkInTime": "string | null",
            "checkOutTime": "string | null",
            "visitorIndex": 0
          }
        ]
      }
    ],
    "pagination": {
      "total": 100,
      "page": 1,
      "limit": 500,
      "totalPages": 1
    }
  }
  ```

### 3.3. Detailed Contract: `POST /api/visitor_admin/checkinout`
- **Headers:** `Content-Type: application/json`
- **Request Body:**
  ```json
  {
    "action": "CHECK_IN" | "CHECK_OUT" | "RESET" | "UPDATE_CARD",
    "requestId": "string",
    "requestCode": "string",
    "visitorIndex": 0,
    "visitorName": "string",
    "visitorCode": "string",
    "cardNumber": "string | null"
  }
  ```
- **Response Shape:**
  - 200 OK: `{ "message": "Checked in successfully" | "Checked out successfully" | "Reset status to PENDING successfully" | "Card updated successfully" }`
  - 400 Bad Request: `{ "error": "Missing required parameters" | "Invalid action" }`
  - 401 Unauthorized: `{ "error": "Unauthorized" }`
  - 403 Forbidden: `{ "error": "Forbidden" }`
  - 500 Internal Server Error: `{ "error": "Internal server error", "details": "..." }`

---

## 4. State Inventory

### 4.1. Page-Level States (`page.tsx`)
1. `history: CheckInOutRequestRecord[]` — Loaded request records from server.
2. `loading: boolean` — Network loading indicator for history fetch.
3. `filters: { date: string, search: string, visitorName: string }` — User search filters.
4. `statusFilters: string[]` — Selected status filter pills.
5. `categories: string[]` — Selected category filter pills.
6. `sites: string[]` — Selected site filter pills.
7. `viewMode: 'group' | 'visitor'` — Active visualization tab.
8. `currentPage: number` — Client-side pagination index (1-based).
9. `expandedRequest: string | null` — Request ID currently expanded in Group View.
10. `actionLoading: string | null` — Identifier (`${requestId}-${visitorIndex}`) of item currently performing check-in/out mutation.
11. `cardNumbers: Record<string, string>` — Staged security card numbers keyed by `${requestId}-${visitorIndex}`.
12. `scanLoading: boolean` — Scanner lookup network state.
13. `scanError: string | null` — Error banner message for invalid barcode scans.
14. `scannedRequest: CheckInOutRequestRecord | null` — Active request selected for modal check-in/out.
15. `isModalOpen: boolean` — Visibility of `RequestCheckInModal`.
16. `barcodeBufferRef: useRef<string>` — Silent buffer for hardware scanner keystrokes.
17. `lastKeyTimeRef: useRef<number>` — Keystroke delta timer for scanner discrimination.

### 4.2. Modal States (`RequestCheckInModal.tsx`)
1. `mounted: boolean` — Hydration state for React portal rendering into `document.body`.
2. `bulkLoading: boolean` — Loading state during bulk check-in all or check-out all operations.
3. `notification: { type: 'success' | 'error', message: string } | null` — In-modal feedback alert.

---

## 5. Business Rules & Logic

1. **Hardware Scanner Gun Capture:**
   - Intercepts all keydown events at the window capture phase.
   - If interval between keypresses is > 150ms, clears buffer (human typing detected).
   - If user is typing inside an `<input>` and interval > 80ms, clears buffer.
   - Scanner terminates with `Enter` or `Tab`. If accumulated buffer >= 4 characters, triggers `handleLookupRequest(candidate)`.
   - Strips URL paths (e.g. `https://host/requests/V12345` -> `V12345`) and leading `#` symbols.
2. **Request Lookup Precedence:**
   - Checks `history` in client state first. If found, opens modal immediately with zero network latency.
   - If not found locally, queries `/api/visitor_admin/checkinout/history?search=${code}&limit=10`.
   - Only requests with status `APPROVED` or `COMPLETE` are returned by the backend CTE.
3. **Status Transitions:**
   - `PENDING` -> `CHECKED_IN` (Check In button enabled, records `checkInTime = NOW()`).
   - `CHECKED_IN` -> `CHECKED_OUT` (Check Out button enabled, records `checkOutTime = NOW()`).
   - `CHECKED_OUT` -> No further check-in permitted unless `RESET` is invoked by Admin.
4. **Card Number Assignment:**
   - Typing in Card Number field updates local state `cardNumbers`.
   - On `blur`, sends `UPDATE_CARD` action to persist card number even if visitor is still `PENDING`.
5. **Bulk Operations in Modal:**
   - "Check In All": Iterates all visitors in `PENDING` status sequentially.
   - "Check Out All": Iterates all visitors in `CHECKED_IN` status sequentially with confirmation dialog.
6. **Category & Site Filtering:**
   - Site matching treats `'SHTP/DDK'` and `'Both'` as matching either `'SHTP'` or `'DDK'`.
   - Category badges highlight interviewee vs vendors vs expat.
7. **Client-Side Diacritics Matching:**
   - Name and text search use `removeAccents()` from `@/utils/string` for Vietnamese accent-insensitive matching.

---

## 6. Permission & RBAC Rules

1. **Page Access Authorization:**
   - Next.js middleware guards `/visitoradmin/checkinout` route.
   - Route handlers verify `hasPageAccess('/visitoradmin/checkinout') || hasPageAccess('/visitoradmin')`.
   - Unauthenticated sessions return `401 Unauthorized`; unauthorized roles return `403 Forbidden`.
   - Frontend redirects to `/login?redirect=/visitoradmin/checkinout` on 401/403.
2. **Role-Specific Capabilities:**
   - `Security` role: Can check in, check out, update card numbers, and scan badges. Reset button is **hidden**.
   - `Receptionist` role: Can check in, check out, update card numbers, and scan badges. Reset button is **hidden**.
   - `Admin` role: Can perform all operations including `RESET` action to revert a visitor back to `PENDING` with cleared timestamps.

---

## 7. Component Candidates for Phase 8B

1. `CheckInOutFilters.tsx` — Search inputs, date picker with "Today" shortcut, status/category/site multi-selects, view toggle.
2. `CheckInOutStats.tsx` — Top-level metrics cards (Total Requests, Total Visitors, Currently On Site, Departed).
3. `VisitorViewTable.tsx` — Dense flat table for individual visitors with inline card assignment and action buttons.
4. `GroupViewTable.tsx` — Hierarchical expandable table grouping visitors under request headers.
5. `ScannerNotification.tsx` — Floating toast banners for scan lookup and errors.
6. `RequestCheckInModal.tsx` — Move from `src/app/visitoradmin/checkinout/components/` to `src/features/visitor/checkinout/components/`.

---

## 8. Service Candidates

- `src/features/visitor/checkinout/services/checkinoutApi.ts`
  - `getCheckInOutHistory(params: CheckInOutHistoryParams): Promise<CheckInOutHistoryResponse>`
  - `lookupCheckInOutRequest(code: string, limit?: number): Promise<CheckInOutHistoryResponse>`
  - `performCheckInOutAction(payload: CheckInOutActionPayload): Promise<CheckInOutActionResponse>`
  - `CheckInOutApiError` (error wrapper with HTTP status)

---

## 9. Type Candidates

- `src/types/checkinout.types.ts`
  - `CheckInOutAction`: `'CHECK_IN' | 'CHECK_OUT' | 'RESET' | 'UPDATE_CARD' | 'REVERSE' | 'INPUT_CARD'`
  - `CheckInOutActionPayload`
  - `CheckInOutActionResponse`
  - `CheckInOutHistoryParams`
  - `CheckInOutVisitorRecord`
  - `CheckInOutRequestRecord`
  - `CheckInOutProcessedVisitor`
  - `CheckInOutPagination`
  - `CheckInOutHistoryResponse`
  - `CheckInOutViewMode`
  - `CheckInOutFilterState`
  - `CheckInOutStats`

---

## 10. Existing Reusable Types & Utils

- **From `src/types/visitor.types.ts`:**
  - `VisitorCheckInOutStatus` (`'PENDING' | 'CHECKED_IN' | 'CHECKED_OUT'`)
  - `Visitor`
  - `VisitorRequestData`
  - `VisitorLogEntry`
- **From `src/utils/`:**
  - `removeAccents` (`@/utils/string`)
  - `formatDateShort`, `formatDateTime` (`@/utils/date`)
  - `getCategoryBadgeClass`, `getStatusBadgeClass` (`@/utils/badge`)

---

## 11. Technical Debt Identified

1. **Inline `any` types in `page.tsx`:**
   - `history: any[]`
   - `scannedRequest: any`
   - `(v: any)` in `handleAction`, visitor mapping, and table rendering.
   - `(req: any)` in group rendering.
2. **Direct `fetch()` calls in `page.tsx`:**
   - Line 78: `fetch('/api/visitor_admin/checkinout/history?...')`
   - Line 106: `fetch('/api/visitor_admin/checkinout', { method: 'POST', ... })`
   - Line 214: `fetch('/api/visitor_admin/checkinout/history?search=...')`
3. **Component location:**
   - `RequestCheckInModal.tsx` resides under `src/app/visitoradmin/checkinout/components/` instead of `features/`.

---

## 12. Risks

1. **Hardware Scanner Timing Sensitivity:**
   - Scanner gun keystroke listener uses precise millisecond intervals (`timeDiff > 150`, `timeDiff > 80`). Any latency or asynchronous handler interference could break barcode entry. Must be preserved untouched.
2. **Optimistic Updates:**
   - Check-in/out mutations update `history` and `scannedRequest` in memory so security personnel see immediate feedback. Service integration must maintain synchronous local state updating.
3. **Card Assignment on Blur:**
   - Security guards scan or type cards and click outside. The `onBlur` event must reliably fire `UPDATE_CARD` without race conditions.

---

## 13. Explicitly Protected Behavior & Contracts

1. **Route URLs:** `/visitoradmin/checkinout` must remain identical.
2. **API Routes & Payloads:**
   - `/api/visitor_admin/checkinout/history`
   - `/api/visitor_admin/checkinout`
   Payload keys (`action`, `requestId`, `requestCode`, `visitorIndex`, `visitorName`, `visitorCode`, `cardNumber`) must never change.
3. **Database Schema:** Tables `"VisitorCheckInOut"`, `"VisitorRequest"`, `"IntervieweeRequest"`, `checkinout_action_history`.
4. **RBAC Rules:** Roles `Security` and `Receptionist` have reset button hidden.
5. **Scanner listener:** Retain the exact keyboard buffer and timing logic.
