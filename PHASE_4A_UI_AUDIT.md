# PHASE 4A — SHARED UI COMPONENT AUDIT REPORT

> **Document Status:** Comprehensive Audit Completed
> **Target Scope:** `src/app/` and `src/components/`
> **Commit Base:** `dc2f2d1`
> **Rule Compliance:** Zero source code changes made. No directories (`src/components/ui/` or `src/features/`) created.

---

## 1. Executive Summary

A comprehensive, non-destructive audit of all user interface elements across `src/app/` and `src/components/` was conducted to identify repetitive UI implementations, styling inconsistencies, accessibility oversights, and evaluate viable candidates for shared components.

### Key Observations:
1. **Button Proliferation:** Over 12 distinct implementations of primary Milwaukee red buttons exist across modules, each re-declaring hex color codes (`#db011c`, `#bd011c`, `#b52427`, `#b90118`), padding, and border radii.
2. **Modal Inconsistency:** Modals currently use two conflicting paradigms: Headless UI `<Dialog>` transitions (in `EditNodeModal`, `NodeDetailsModal`) versus raw React portals with manual Escape key / scroll-lock listeners (in `RequestCheckInModal`, `ReviewChangesModal`, `rooms/page.tsx`).
3. **Heavy Code Duplication:**
   - `HeadcountAddModal.tsx` and `HeadcountEditModal.tsx` share **>90% duplicate JSX and field-inference logic**.
   - `CoreTeamOrgChart.tsx` and `OpsSupportOrgChart.tsx` share **>85% duplicate helper functions, avatar handling, node cards, and modal renderers**.
4. **Accessibility (a11y) Gaps:** Universal lack of `aria-label` attributes on icon-only buttons (close, filter toggles, expanders), absence of `htmlFor` / `id` bindings in dynamic forms, and incomplete modal ARIA attributes.
5. **Inline Styles vs Tailwind:** Significant legacy inline style usage (`style={{ ... }}`) remains concentrated in `src/app/visitorrequest/page.tsx` (~1,299 lines).

---

## 2. Comprehensive UI Patterns Audit

### 2.1 Buttons

| Pattern | Detected ClassNames / Styles | Locations Detected | Behavior & State |
|---|---|---|---|
| **Primary Milwaukee Action** | `bg-[#db011c] hover:bg-[#b90118] text-white font-bold text-xs/text-sm px-4 py-2 rounded-lg shadow-sm transition-all` | `visitoradmin/page.tsx`, `visitoradmin/rooms/page.tsx`, `visitoradmin/checkinout/page.tsx`, `visitorrequest/page.tsx` | Often has `disabled:opacity-50`, inline spinning SVG on `loading`. Text is uppercase in some pages, title-case in others. |
| **Primary System Red** | `bg-[#b52427] hover:bg-[#9a1e21] text-white font-medium text-sm px-4 py-2 rounded-lg min-w-[100px]` | `systemadmin/components/RoleManagement.tsx`, `systemadmin/components/UserManagement.tsx` | Hardcoded variant `#b52427` instead of standard brand red token. |
| **Primary Amber / Save** | `bg-amber-600 hover:bg-amber-700 text-white font-bold text-sm px-5 py-2 rounded-lg shadow-sm shadow-amber-200` | `HeadcountEditModal.tsx` | Used specifically for edit mutations. |
| **Primary Indigo / Add** | `bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm px-5 py-2 rounded-lg shadow-sm shadow-indigo-200` | `HeadcountAddModal.tsx`, `SheetAddModal.tsx` | Used for insertion mutations in Headcount domain. |
| **Secondary Neutral** | `bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 text-xs font-semibold px-3 py-2 rounded-lg shadow-xs transition-colors` | All modal footers (`Cancel` buttons), filter toolbars | Consistent styling, handles hover states cleanly. |
| **Danger / Destructive** | `bg-red-50 hover:bg-red-100 text-[#db011c] text-xs font-bold rounded-lg px-3 py-2` or `bg-red-600 hover:bg-red-700 text-white` | `visitoradmin/page.tsx` (Bulk Delete), `rooms/page.tsx` | Inconsistent: sometimes ghost red, sometimes solid red. |
| **Success / Excel Export** | `bg-[#10b981] hover:bg-[#059669] text-white text-xs font-bold px-3.5 py-2 rounded shadow-sm flex items-center gap-1.5` | `visitoradmin/page.tsx`, `visitoradmin/checkinout/page.tsx` | Hardcoded hex emerald colors with inline SVG icons. |
| **Icon-Only Buttons** | `p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer` | Modal close buttons, table row actions (edit, delete, expand) | Missing `aria-label` or `title` in >70% of occurrences. |

---

### 2.2 Form Inputs & Controls

| Pattern | Detected ClassNames / Styles | Locations Detected | Behavior & Inconsistencies |
|---|---|---|---|
| **Text & Number Input** | `w-full h-10 px-3 rounded-lg border border-gray-200 bg-gray-50 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all text-sm text-gray-800` | `HeadcountAddModal`, `HeadcountEditModal`, `SheetAddModal` | Focus ring color varies (`indigo-100` vs `red-100` vs `focus:border-[#db011c]`). |
| **Filter Date Input** | `px-2 py-1.5 bg-white border border-gray-300 rounded text-xs focus:outline-none focus:border-[#db011c]` | `visitoradmin/page.tsx`, `visitoradmin/checkinout/page.tsx` | Raw browser native datepicker triggers without uniform placeholder styling. |
| **Select Dropdowns** | `w-full h-10 px-3 rounded-lg border border-gray-200 bg-gray-50 focus:bg-white text-sm` | `HeadcountAddModal`, `SheetAddModal`, `rooms/page.tsx` | Native `<select>` elements with varying default option placeholders. |
| **Custom Filter Dropdown** | `MultiSelectDropdown.tsx` (custom portal-based dropdown with checkboxes) | `visitoradmin/page.tsx`, `visitoradmin/checkinout/page.tsx` | Fully functional, handles clicks outside and multi-select filters. Good pattern candidate. |
| **Inline Styled Input** | `style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }}` | `visitorrequest/page.tsx` | Uses inline style objects and manual `onFocus`/`onBlur` handlers to switch border colors. |

---

### 2.3 Badges & Status Indicators

Centralized utilities already established in Phase 2B (`src/utils/badge.ts`):
- `getCategoryBadgeClass`: Maps categories (`Vendor`, `Contractor`, `Interviewee`, `Expat`) to text/background colors.
- `getStatusBadgeClass`: Maps statuses (`Approved`, `Complete`, `Rejected`, `Pending`) to color classes.

#### Audit Findings on Badges:
1. **Adherence:** `visitoradmin/checkinout/page.tsx` and `RequestCheckInModal.tsx` successfully consume `getCategoryBadgeClass` and `getStatusBadgeClass`.
2. **Non-adherence (Technical Debt):**
   - `visitoradmin/page.tsx`: Uses custom inline color styling for badges: `style={{ backgroundColor: ... }}`.
   - `visitordashboard/page.tsx`: Uses inline styles with hardcoded status objects instead of the centralized utility.
   - `systemadmin/components/UserManagement.tsx`: Implements raw Tailwind classes (`bg-green-50 text-green-700`, `bg-gray-100 text-gray-600`) directly.
   - `CoreTeamOrgChart.tsx` and `OpsSupportOrgChart.tsx`: Hardcode 6 custom Span of Control badges using custom hex values (`#d4c3ea`, `#bec3ed`, `#a4cbb4`, `#deb5a2`, `#a2c5c5`).

---

### 2.4 Cards & Stat Containers

A clear distinction was observed between **Statistical / KPI Cards** and **Profile / Entity Cards**:

1. **KPI Stat Cards (Dashboard & Analytics):**
   - Pattern A (`src/app/visitoranalytics/page.tsx`):
     `bg-white rounded-xl border border-gray-100 p-4 shadow-sm flex flex-col justify-between h-[120px] hover:shadow-md`
     Contains large numerical metric (`text-4xl font-black`), title, icon in top right, and percentage growth badge (`formatGrowth`).
   - Pattern B (`src/app/dashboard/components/Multi_card.tsx`):
     `min-h-[72px] bg-[var(--color-bg-card)] rounded-lg shadow-sm flex flex-col items-center justify-center border hover:shadow-md cursor-pointer`
     Interactive filter toggle card with active ring highlight (`border-[#C40000] ring-2 ring-red-100`).
2. **Profile & Entity Cards (OrgChart):**
   - Pattern: Max-width 170px, header banner, avatar photo with fallback initials, title, and sub-reports grid.
   - Distinct business logic (click-to-inspect, zoom scaling); should **not** be merged with general KPI cards.

---

### 2.5 Modals & Dialogs

Across the application, modals are split into two paradigms:

| Implementation Type | Examples | Characteristics |
|---|---|---|
| **Headless UI `<Dialog>`** | `src/app/customize/components/EditNodeModal.tsx`, `src/app/orgchart/NodeDetailsModal.tsx` | Uses `@headlessui/react` `<Transition>` and `<Dialog>`. Handles keyboard Escape, backdrop click, focus trap, and ARIA attributes cleanly. |
| **Raw React Portal** | `src/app/visitoradmin/checkinout/components/RequestCheckInModal.tsx`, `src/app/visitoradmin/rooms/page.tsx`, `src/app/visitorrequest/page.tsx` | Uses `createPortal(..., document.body)`. Manually sets `document.body.style.overflow = 'hidden'` and adds `window.addEventListener('keydown')` for Escape. |
| **Inline Conditional Div** | `src/components/HeadcountAddModal.tsx`, `src/components/HeadcountEditModal.tsx`, `src/components/ReviewChangesModal.tsx`, `src/components/SheetAddModal.tsx` | Directly renders `<div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm">`. Lacks portal rendering (can suffer from z-index/parent stacking context bugs). |

---

### 2.6 Data Tables

Four primary data tables exist in the application:
1. `SheetManagerTable.tsx` (Orgchart HR Data): Virtualized / paginated table with complex cell inline editing and column-based search.
2. `visitoradmin/page.tsx` (Requests Table): Full-width table with sticky black header (`bg-[#1a1a1a] text-white text-[10px] font-black uppercase`), row selection checkboxes, and action buttons.
3. `visitoradmin/checkinout/page.tsx` (Security Check-In/Out): Table wrapped in `overflow-x-auto min-w-[1360px]` with live visitor status indicators and bulk action buttons.
4. `visitoradmin/rooms/page.tsx` (Room & Department Management): Tables with inline row-editing states (`editingMeetingRoom`, `editingHostDept`).

**Table Common Standard Found:**
- Outer container: `overflow-hidden bg-white rounded-xl border border-gray-200 shadow-sm`.
- Scroll wrapper: `overflow-x-auto min-w-full`.
- Semantic `table` with `min-w-[1000px]` to `min-w-[1360px]`.
- Sticky or fixed-style headers with uppercase `text-[10px]` or `text-xs`.

---

### 2.7 Loading, Empty, and Error States

1. **Spinners & Skeletons:**
   - Central component exists: `src/components/Spinner.tsx` (exports `Spinner`, `BouncingDots`, `PulsingRing`, `Skeleton`, `CardSkeleton`, `TableSkeleton`, `ChartSkeleton`).
   - Inconsistency: Many pages do not use `src/components/Spinner.tsx`, opting instead for ad-hoc inline spinners:
     `<div className="w-12 h-12 border-4 border-red-200 border-t-red-600 rounded-full animate-spin"></div>` (in `CoreTeamOrgChart`, `OpsSupportOrgChart`, `visitoradmin/page.tsx`, `visitoranalytics/page.tsx`).
2. **Empty States:**
   - No shared `EmptyState` component exists.
   - Multiple ad-hoc implementations:
     - `rooms/page.tsx`: `<div className="text-center py-8 text-gray-400">No rooms found.</div>`
     - `visitoradmin/page.tsx`: `<td colSpan={...} className="p-8 text-center text-gray-400">No records found</td>`
3. **Error Banners:**
   - Inline alert box: `<div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100 flex items-center gap-2"><span className="font-bold">Error:</span> {error}</div>` repeated in `HeadcountAddModal`, `HeadcountEditModal`, and `SheetAddModal`.

---

## 3. Accessibility (a11y) Audit

> [!WARNING]
> This section is an informative audit report only. No code modifications have been made.

1. **Missing `aria-label` on Icon-Only Buttons:**
   - Modal close buttons (`<button onClick={onClose}><XMarkIcon className="w-6 h-6" /></button>`) in `HeadcountAddModal`, `HeadcountEditModal`, `ReviewChangesModal`, and `rooms/page.tsx` have no `aria-label="Close modal"` attribute.
   - Table inline action buttons (Edit, Delete, Refresh, Clear) contain only SVG icons without accessible text or `aria-label`.
2. **Modal Dialog Semantics:**
   - Modals in `src/components/` (`HeadcountAddModal`, `HeadcountEditModal`, `ReviewChangesModal`) render simple `<div>` structures lacking `role="dialog"`, `aria-modal="true"`, and `aria-labelledby`.
   - Modals using `@headlessui/react` (`EditNodeModal`, `NodeDetailsModal`) are accessible and pass dialog semantics properly.
3. **Form Label Association:**
   - In `HeadcountAddModal`, `HeadcountEditModal`, and `visitorrequest/page.tsx`, `<label>` elements are placed next to `<input>` elements but lack `htmlFor` matching the input's `id`. Screen readers cannot associate the field purpose reliably.
4. **Color Contrast:**
   - Secondary text styled as `text-[10px] text-gray-400` in table headers and filter subtitles yields a contrast ratio below 3:1 against white backgrounds, failing WCAG AA (requires 4.5:1 for normal text).
   - In `OpsSupportOrgChart.tsx`, badge colors `#d4c3ea` with text `#4d2d76` meet AA standards, but `#e2e8f0` with `#475569` is borderline for small text.

---

## 4. Styling Consistency Audit (Design System Alignment)

Cross-referenced with `DESIGN_SYSTEM.md` and `src/app/globals.css`:

1. **Brand Red Inconsistencies:**
   - The primary brand color in `DESIGN_SYSTEM.md` is `--color-primary-mwk` (`#bd011c`).
   - In active UI pages (`visitoradmin/page.tsx`, `visitorrequest/page.tsx`, `rooms/page.tsx`), hardcoded `#db011c` is used in **over 45 places**.
   - In `systemadmin/components/UserManagement.tsx`, hardcoded `#b52427` is used.
   - Hover states vary between `hover:bg-red-700`, `hover:bg-[#b90118]`, and `hover:bg-[#9a1e21]`.
2. **Border Radii Inconsistencies:**
   - Cards and containers mix `rounded`, `rounded-md`, `rounded-lg`, `rounded-xl`, and `rounded-2xl` without hierarchy rationale.
   - Standard established in `DESIGN_SYSTEM.md`: Cards = `rounded-xl` (`12px`), Buttons & Inputs = `rounded-lg` (`8px`), Badges = `rounded-full` or `rounded-md`.
3. **Repeated Tailwind Patterns:**
   - Input focus pattern: `focus:outline-none focus:ring-2 focus:ring-[#db011c]/20 focus:border-[#db011c]`.
   - Card container pattern: `bg-white rounded-xl border border-gray-200/80 shadow-xs`.
   - Table wrapper pattern: `overflow-hidden bg-white rounded-xl border border-gray-200 shadow-sm`.

---

## 5. In-Depth Component Comparisons

### 5.1 HeadcountAddModal vs HeadcountEditModal

A detailed line-by-line comparison between `src/components/HeadcountAddModal.tsx` (198 lines) and `src/components/HeadcountEditModal.tsx` (211 lines):

| Feature / Aspect | `HeadcountAddModal.tsx` | `HeadcountEditModal.tsx` | Analysis |
|---|---|---|---|
| **Props Interface** | `{ isOpen, onClose, onSave(data, quantity), columns }` | `{ isOpen, onClose, onSave(data, quantity), initialData, columns, count }` | **Compatible**: `EditModal` only adds `initialData` and `count`. |
| **State** | `formData`, `quantity` (default 1), `loading`, `error` | `formData`, `quantity` (default `count`), `loading`, `error` | **Identical state shape**. |
| **`useEffect` Initialization** | Resets `formData` to `{}`, `quantity` to 1, `error` to `null` | Prepopulates `formData` from `initialData`, `quantity` from `count` | Standard create vs update form behavior. |
| **Validation & Submit** | Validates `quantity >= 1` and `formData['Job Title']` | Validates `quantity >= 1` and `formData['Job Title']` | **100% Identical**. |
| **`getInputType(col)`** | Infers `date`, `select`, or `text` based on column string matching | Infers `date`, `select`, or `text` based on column string matching | **100% Duplicate function**. |
| **Form Fields JSX** | Dynamic map over `displayColumns` generating `<input>` or `<select>` | Dynamic map over `displayColumns` generating `<input>` or `<select>` | **100% Duplicate markup**. |
| **Quantity Input Box** | Blue/indigo banner with counter | Indigo banner with differential label ("Will create X" / "Will remove Y") | Slight UX variation in helper text. |
| **Header Icon & Title** | `UserPlusIcon` (Indigo) + "Add Open Headcount" | `PencilSquareIcon` (Amber) + "Edit Open Headcount" | Theme color difference (Indigo vs Amber). |
| **Footer Action Button** | Indigo button: `Add {quantity} Open Headcounts` | Amber button: `Save Changes` | Submit label difference. |

#### Architectural Assessment:
`HeadcountAddModal` and `HeadcountEditModal` should **not** remain two independent files long-term. In a future refactoring phase (Phase 4B/5), they can be merged into a single polymorphic component:
`HeadcountFormModal.tsx` with a `mode: 'add' | 'edit'` prop, eliminating ~180 lines of duplicate code.

---

### 5.2 CoreTeamOrgChart vs OpsSupportOrgChart

A detailed comparison between `src/components/CoreTeamOrgChart.tsx` (524 lines) and `src/components/OpsSupportOrgChart.tsx` (476 lines):

| Element / Logic | `CoreTeamOrgChart.tsx` | `OpsSupportOrgChart.tsx` | Duplicate Status |
|---|---|---|---|
| **`Employee` Interface** | Lines 5–12 | Lines 5–12 | **100% Duplicate**. |
| **`shortenReportName`** | Lines 26–41 | Lines 22–37 | **100% Duplicate**. Converts "Nguyen Van A" to "N.V.A". |
| **`mapNameToChart`** | Lines 44–46 | Lines 40–42 | **100% Duplicate**. |
| **`mapTitleToChart`** | Lines 49–61 | Lines 45–57 | **100% Duplicate**. Abbreviates long titles. |
| **`shortenReportTitle`** | Lines 64–80 | Lines 60–76 | **100% Duplicate**. |
| **`isSupervisorOrManager`** | Lines 83–95 | Lines 79–91 | **100% Duplicate**. |
| **`getCategoryHeader`** | Lines 99–101 | Lines 95–97 | **100% Duplicate**. |
| **Scale / Zoom Calculation** | Lines 113–131 | Lines 109–127 | **100% Duplicate logic**. |
| **Photo Avatar Renderer** | Lines 170–198 | Lines 166–194 | **100% Duplicate**. |
| **Card JSX (`renderLeaderCard`)**| Lines 206–256 | Lines 202–252 | **100% Duplicate**. |
| **Modal Inspector (`renderDetailsModal`)**| Lines 258–370 | Lines 254–366 | **100% Duplicate JSX and Span of Control badges**. |
| **Layout Tree Structure** | VP (HK Lee) -> Split: Tien/Quyen (left) & Jeff Searl + 6 reports (right) | Root (Quyen) -> Grid of direct reports across rows | **Different Tree Topology**. |
| **API Endpoint** | `/api/orgchart/core-team` | `/api/orgchart/ops-support` | Different data source. |

#### Architectural Assessment:
- Over **320 lines of code** (helpers, photo rendering, card rendering, and inspector modal) are copy-pasted between these two files.
- The visualizer logic and helpers can be extracted into shared chart primitives (`OrgChartCard`, `OrgChartInspectorModal`, `orgchart.helpers.ts`), while keeping the distinct layout topology for Core Team vs Ops Support.

---

## 6. Candidate Shared Components Matrix

Based on actual occurrences and behavioral consistency across the codebase:

| Candidate Component | Detected Usages | Pattern Consistency | Behavioral Consistency | Recommended Action | Priority |
|---|---:|---|---|---|---|
| **`Button`** | 50+ | High | High | **Yes, implement as shared UI component** with variants (`primary`, `secondary`, `outline`, `danger`, `ghost`) and built-in loading spinner support. | **P1 (Highest)** |
| **`Input` / `FormInput`** | 40+ | Moderate | High | **Yes, implement as shared UI component** with standard focus styles, label, error message, and `id`/`htmlFor` accessibility binding. | **P1** |
| **`Badge`** | 35+ | High | High | **Yes, implement as shared UI component** utilizing Phase 2B's `src/utils/badge.ts` color tokens. | **P1** |
| **`Modal` / `DialogPrimitive`** | 12 | Moderate | High | **Yes, implement as shared UI primitive** based on `@headlessui/react` `<Dialog>` to standardize Escape key, backdrop clicks, scroll-lock, and accessibility. | **P1** |
| **`Spinner` / `LoadingOverlay`** | 15+ | High | High | **Yes, promote existing `src/components/Spinner.tsx`** to standard usage across all pages to eliminate duplicate inline SVG spinners. | **P2** |
| **`EmptyState`** | 8 | Moderate | High | **Yes, implement as shared UI component** (icon, title, description, optional action button). | **P2** |
| **`StatCard`** | 12 | Moderate | Moderate | **Yes, create shared `StatCard`** for dashboards (value, title, trend, icon) while keeping Orgchart profile cards domain-specific. | **P2** |
| **`Table` Primitive** | 6 | Moderate | Low | **No Universal Table**. Instead, create modular primitives: `TableContainer`, `TableHead`, `TableRow`, `TableCell`, `TableEmpty`. | **P3** |

---

## 7. Proposed Target UI Architecture (Future Phases)

> [!NOTE]
> This is a structural proposal for future phases. **No files or folders were created in Phase 4A.**

```text
src/
└── components/
    └── ui/                      # Candidate for Phase 4B
        ├── Button.tsx           # Primary, secondary, outline, danger, ghost, loading
        ├── Input.tsx            # Accessible text, number, date input wrapper
        ├── Select.tsx           # Standardized select input with label & error
        ├── Badge.tsx            # Consumes src/utils/badge.ts
        ├── Modal.tsx            # Headless UI Dialog wrapper with standard transitions
        ├── StatCard.tsx         # Dashboard KPI statistic card
        ├── EmptyState.tsx       # Standard empty state with action slot
        └── Spinner.tsx          # Migration of existing Spinner to ui/
```

---

## 8. Verification Results

Verification commands executed upon audit completion:

```bash
# 1. TypeScript Verification
npx tsc --noEmit
# Exit code: 0 (PASS)

# 2. Production Build Verification
npm run build
# Exit code: 0 (PASS)

# 3. Git Working Tree Status
git status
# Untracked files:
#   PHASE_4A_UI_AUDIT.md
# No source code modified. Working tree clean of accidental changes.
```

---

## 9. Conclusion & Next Steps

Phase 4A has successfully cataloged all recurring UI patterns, accessibility requirements, and component duplication across `Orgchart_TTI_onprem`.

**Next Phase Recommendation (Phase 4B):**
1. Review this audit report and approve candidate components.
2. Select the first batch of core primitives to implement in `src/components/ui/` (`Button`, `Badge`, `Modal`).
3. Migrate `HeadcountAddModal` and `HeadcountEditModal` into a unified `HeadcountFormModal`.

---
*Report generated in strict adherence to Phase 4A rules: No source code changes, no commit, no push.*
