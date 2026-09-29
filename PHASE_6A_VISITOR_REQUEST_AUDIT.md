# PHASE 6A — VISITOR REQUEST DEEP AUDIT

**Module:** Visitor Registration (`src/app/visitorrequest/page.tsx`)  
**Project:** `Orgchart_TTI_onprem`  
**Date:** 2026-09-29  
**Refactor Phase:** Phase 6A (Audit + Domain Types + API Service)

---

## 1. Current Page Responsibilities

`src/app/visitorrequest/page.tsx` (1,299 lines) is a monolithic client-side page handling multi-category visitor pre-registration:
1. **Visitor Category Selection:**
   - `Vendor / Contractor` (with radio toggle between Vendor and Contractor)
   - `MIL / TTI Expat` (`MIL/TTI Expat / SHTP Business trip`)
   - `Interviewee` (Job candidate registration for HR-TA / Security)
2. **Role-Based Category Access Control:**
   - `Security` role: Strictly restricted to `Interviewee` requests only. If Security user visits the page, category defaults to `Interviewee`, and attempting to select other categories triggers a block alert.
   - `Interviewee` category: Requires `Hr Visitor` app role or `admin` or `Security`. Standard users are blocked from selecting Interviewee.
3. **Dynamic Multi-row Guest / Candidate Management:**
   - Vendor/Expat visitors: Array of guests (`name`, `title`, `company`), max 15.
   - Interviewee candidates: Array of candidates (`name`, `jobTitle`, `interviewDepartment`, `interviewerName`), max 20.
   - Add row, remove row.
   - Vietnamese IME-safe string input filtering (`cleanNameInput`) to prevent diacritic distortion during typing.
   - Title Case string formatting on blur / submit (`formatName`, `capitalizeWords`).
   - Excel template generation & download via SheetJS (`xlsx`).
   - Excel file upload & parsing into candidate / visitor state.
4. **Site & Date Planning:**
   - Visiting site toggle (`SHTP`, `DDK`, or both `SHTP/DDK`).
   - Working days limit calculation (`addWorkingDays`): Vendor/Contractor max 7 working days; Expat max 6 months.
   - Dynamic `maxEndDate` recalculation on start date change.
   - For Interviewee: single day visit (`endDate` equals `startDate`), with specific `startTime` and `interviewArea`.
5. **Host Department & Room Reservation (Expat only):**
   - Cascader selection: BU -> Functional Dept -> Department.
   - Read-only display of auto-resolved Functional Host and Department Host info.
   - Multi-room selection from `FacilityRoom` items filtered by site.
   - BU Leader notification banner when room selection exceeds 60% of total site rooms.
6. **Final Requirements (Expat only):**
   - Factory tour toggle (Yes/No).
   - Meal registration toggle (Yes/No) + Charged Cost Center input (`000-00-0000`).
7. **Form Validation & Review Modal:**
   - Name length and character validation (min 2 characters).
   - Full review summary modal rendered via `createPortal(..., document.body)`.
   - Confirmation triggers API call to `/api/requests`.
8. **Navigation & Dashboard View:**
   - Tab switching between `'request'` and `'dashboard'` (embedding `<Dashboard />` from `../visitordashboard/page`).
   - On successful submission, resets state and navigates to `/visitordashboard?tab=interviewee` or `/visitordashboard?tab=general`.

---

## 2. Entity & Domain Inventory

| Entity | Description | Current Location in Code |
|---|---|---|
| `VisitorItem` | Visitor entry in array for Vendor/Contractor and Expat requests | Inline object in `formData.visitors` |
| `IntervieweeItem` | Candidate entry in array for Interviewee requests | Inline object in `formData.interviewees` |
| `VisitorRequestFormData` | Comprehensive client form state holding all categories and fields | Inline object in `useState(formData)` |
| `CreateVisitorRequestPayload` | Transformed JSON payload sent to `POST /api/requests` | Inline constructed object in `handleSubmit` |
| `FacilityRoom` | Facility room / area item for room reservations | `any[]` in `rooms` state |
| `MeetingRoom` | Meeting room used for Interview area cascader | `any[]` in `meetingRooms` state |
| `HostDepartment` | Host department cascader options | `any[]` in `hostDepartments` state |

---

## 3. API Endpoint Inventory

| Endpoint | HTTP Method | Query Params | Request Payload | Response Shape |
|---|---|---|---|---|
| `/api/admin/rooms` | `GET` | None | None | `{ rooms: FacilityRoom[] }` |
| `/api/admin/meeting-rooms` | `GET` | None | None | `{ meetingRooms: MeetingRoom[] }` |
| `/api/admin/host-departments` | `GET` | `all=false` | None | `{ hostDepartments: HostDepartment[] }` |
| `/api/requests` | `POST` | None | `CreateVisitorRequestPayload` (JSON) | `{ id: string }` or `{ error: string }` |

---

## 4. HTTP Methods

- `GET` (3 endpoints)
- `POST` (1 endpoint)

---

## 5. Request Payload of Each API

### `POST /api/requests`
```typescript
{
    visitors: Array<{
        name: string;
        title?: string;
        company?: string;
        interviewDepartment?: string;
        interviewerName?: string;
    }>;
    visitorName: string;
    visitorTitle: string;
    currentCompany: string;
    purposeOfVisit: string;
    purposeDetail?: string;
    startDate: string;
    endDate: string;
    visitorCategory: string;
    visitingSite: string;
    details: {
        factoryTour?: string;
        mealRegistration?: string;
        costCenter?: string;
        startTime?: string;
        interviewArea?: string;
        bu?: string;
        functionalDept?: string;
        department?: string;
    };
    roomIds?: string[];
    bu?: string;
    functionalDept?: string;
    department?: string;
    intervieweeName?: string;
    jobTitle?: string;
    interviewDepartment?: string;
    interviewerName?: string;
    startTime?: string;
    interviewArea?: string;
}
```

---

## 6. Response Shape of Each API

1. `GET /api/admin/rooms`:
   ```typescript
   { rooms: FacilityRoom[] }
   ```
2. `GET /api/admin/meeting-rooms`:
   ```typescript
   { meetingRooms: MeetingRoom[] }
   ```
3. `GET /api/admin/host-departments?all=false`:
   ```typescript
   { hostDepartments: HostDepartment[] }
   ```
4. `POST /api/requests`:
   ```typescript
   // Success (200 / 201)
   { id: string, message?: string }
   // Error (400, 401, 403, 500)
   { error: string }
   ```

---

## 7. Form Data Structures

In `page.tsx`:
```typescript
interface VisitorRequestFormData {
    visitors: VisitorItem[];
    interviewees: IntervieweeItem[];
    startDate: string;
    endDate: string;
    purposeOfVisit: string;
    visitorCategory: string;
    visitingSite: string;
    purposeDetail: string;
    details: {
        factoryTour: string;
        mealRegistration: string;
        costCenter: string;
    };
    roomIds: string[];
    intervieweeName: string;
    jobTitle: string;
    interviewDepartment: string;
    interviewerName: string;
    startTime: string;
    interviewArea: string;
    bu: string;
    functionalDept: string;
    department: string;
}
```

---

## 8. Business Rules

1. **Security Role Isolation:** Users with `Security` role and without `admin` / `Hr Visitor` can only create `Interviewee` requests.
2. **HR Visitor Role Requirement:** Only users with `Hr Visitor`, `Security`, or `admin` can register interviewees.
3. **Quota Limits:** Max 20 candidates per Interviewee request; max 15 visitors per General/Expat request.
4. **Working Days Duration Cap:**
   - Vendor/Contractor: Maximum 7 working days from `startDate` (weekends excluded).
   - Expat: Maximum 6 months from `startDate`.
   - Interviewee: `endDate` strictly mirrors `startDate`.
5. **Site-specific Room Filtering:** Room list is dynamically filtered to match selected `visitingSite` (`SHTP` or `DDK`). If `SHTP/DDK` is selected, all rooms are available.
6. **BU Leader Notification Trigger:** If room selection exceeds 60% of total active rooms, warning is displayed informing submitter that request will require BU Leader approval.
7. **Host Department Cascade:** BU selection filters Functional Departments, which in turn filters Departments and resolves the host contact names.
8. **Vietnamese Diacritics Protection:** IME inputs are guarded to prevent keystroke loss, followed by title casing on blur.

---

## 9. Validation Rules

- `name` / `interviewerName`: Letters only, minimum 2 characters.
- `startDate`: Required, cannot be earlier than today (`min={todayStr}`).
- `endDate`: Required, bounded between `startDate` and calculated `maxEndDate`.
- `startTime` & `interviewArea`: Mandatory for Interviewee requests.
- `purposeDetail`: Mandatory for Vendor/Contractor requests.
- `costCenter`: Mandatory if `mealRegistration === 'Yes'`.
- `bu`, `functionalDept`, `department`: Mandatory for Expat requests.

---

## 10. Loading and Error States

- Submit button shows `PROCESSING...` and is disabled while `loading` is true.
- Alert popups inform the user of HTTP or server errors (`Lỗi: ...` or `Lỗi máy chủ nội bộ. Vui lòng thử lại sau.`).
- Excel parser displays user-friendly alert on template or format mismatch.

---

## 11. Mutation → Refetch / Update Sequence

1. User clicks `SUBMIT REQUEST` on form -> Form performs client-side field validation.
2. Review modal opens with full registration summary.
3. User clicks `Confirm & Submit` in modal -> `handleSubmit()` is called.
4. Form sets `loading = true`.
5. `POST /api/requests` is executed.
6. On success:
   - Alert: `'Registration successful!'`
   - Form resets to default initial state (`step = 1`, empty rows).
   - Router push to `/visitordashboard?tab=interviewee` (if Interviewee) or `/visitordashboard?tab=general`.
7. `loading` reset in `finally` block.

---

## 12. Interfaces / Types Declared Directly in Page

Currently, `page.tsx` declares **zero** strict interfaces:
- `rooms` is `any[]`
- `hostDepartments` is `any[]`
- `meetingRooms` is `any[]`
- `Input` helper props is `any`
- `updateDetails(key, value: any)`
- Form data has an implicit inferred object type without a dedicated interface.

---

## 13. Duplication with Existing Types

- `FacilityRoom`, `MeetingRoom`, `HostDepartment` exist in `src/types/rooms.types.ts`.
- `Visitor` exists in `src/types/visitor.types.ts`.
- `SessionUser` exists in `src/types/user.types.ts`.
- In `page.tsx`, these domain objects were loosely handled as `any[]`.

---

## 14. Existing `any` Count in Page

- **23 instances of `any`** in `src/app/visitorrequest/page.tsx` across component props, state variables, event handlers, and data arrays.

---

## 15. Utility / Helper Logic Currently Duplicated or Embedded

- `cleanNameInput(str)`: RegEx symbol stripping for Vietnamese IME compatibility.
- `formatName(str)`: Unicode NFC normalization + Title Case converter.
- `capitalizeWords(str)`: Unicode word capitalization.
- `parseLocalDate(dateStr)`: Local date parsing avoiding UTC offset shifts.
- `formatDateISO(d)`: Date to `YYYY-MM-DD` string.
- `addWorkingDays(startDate, days)`: Weekend-skipping date arithmetic.
- Excel download & upload handling via `XLSX`.

---

## 16. Entity Dependencies

- `VisitorRequest` depends on:
  - `FacilityRoom` (via `roomIds` for Expats)
  - `MeetingRoom` (via `interviewArea` for Interviewees)
  - `HostDepartment` (via `bu`, `functionalDept`, `department` for Expats)
  - `SessionUser` (via NextAuth session for submitter ID and role gating)

---

## 17. Sections Eligible for Future Extraction (Phase 6B+)

1. `CategorySelector.tsx`: The 3 category cards (Vendor/Contractor, Expat, Interviewee).
2. `VisitorListSection.tsx`: General visitor table rows + Add/Remove + Excel upload/template.
3. `CandidateListSection.tsx`: Interviewee candidate table rows + Add/Remove + Excel upload/template.
4. `VisitDetailsSection.tsx`: Dates, site toggle, purpose, interview area cascader.
5. `HostDepartmentSection.tsx`: BU / Functional Dept / Department cascaders + host display.
6. `RoomSelectionSection.tsx`: Room area checkboxes + BU Leader ratio warning.
7. `FinalRequirementsSection.tsx`: Factory tour, meal registration, cost center.
8. `ReviewRegistrationModal.tsx`: The pre-submission review portal modal.
9. `visitorRequestUtils.ts`: Pure date, string formatting, and Excel helpers.

---

## 18. Protected Contracts

- `POST /api/requests` endpoint and exact JSON payload structure.
- `GET /api/admin/rooms`, `GET /api/admin/meeting-rooms`, `GET /api/admin/host-departments?all=false`.
- Role verification logic for `Security`, `Hr Visitor`, `admin`.
- Success redirect routes to `/visitordashboard?tab=interviewee` and `/visitordashboard?tab=general`.

---

## 19. Refactor Risks

- **Diacritic/IME Degradation:** Typing in Vietnamese with Telex/VNI might break if input handling or controlled state updates are altered.
- **Date Shift:** UTC date conversions can cause 1-day shifts in Vietnam (GMT+7) if `parseLocalDate` is altered.
- **Payload Incompatibility:** Backend route handler relies on exact top-level and `details` fields (such as `enhancedDetails`).
- **Authorization Bypass:** If category restrictions for `Security` or `Hr Visitor` are weakened, security policies are violated.

---

## 20. Target Architecture Structure

```text
src/
├── app/
│   └── visitorrequest/
│       └── page.tsx
│
├── features/
│   └── visitor/
│       └── request/
│           └── services/
│               └── visitorRequestApi.ts
│
└── types/
    └── visitor-request.types.ts
```
