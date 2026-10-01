# DESIGN_SYSTEM.md — Design Tokens & UI Pattern Specifications

> **Project:** `Orgchart_TTI_onprem` (Factory Management System — Milwaukee Tool SHTP & DDK)  
> **Framework:** Next.js 15 App Router + Tailwind CSS v4  
> **Status:** Phase 3 Foundation (Audited Reality, Zero Speculative Tokens)

---

## 1. Design Principles

This Design System is tailored specifically for an **On-Premise Industrial Factory Management Platform**:

1. **High Information Density:** Manufacturing supervisors, security guards, and HR staff require compact, scannable data layouts without excessive whitespace.
2. **Brand Alignment:** Centered around Milwaukee Tool's identity: Red accents, dark slate neutrals, and stark, high-contrast visual cues.
3. **Documenting Reality:** Documents the actual tokens and patterns present in the codebase. Does not invent speculative tokens or enforce unverified unifications.
4. **Resilience & Responsiveness:** Strict container minimum widths for multi-column data tables to prevent collapse on factory workstations, tablets, or scaled displays.
5. **Zero Breaking Changes:** Built by auditing and formalizing existing production CSS patterns without breaking any existing styles.

---

## 2. Color System & Design Tokens

### 2.1 Current Active Brand Tokens (Source of Truth in `src/app/globals.css`)

The project currently has two distinct red token definitions in `:root`, serving different application areas:

| Token Name | Defined Value | Current Active Usage | Semantic Scope |
|---|---|---|---|
| `--color-primary-mwk` | `#bd011c` | `SheetAddModal.tsx`, `sheet.module.css`, `login.module.css`, `OrgChart.module.css`, `EditNodeModal.tsx` | Milwaukee Brand Red used across Orgchart, Headcount, Sheet Manager, and Authentication. |
| `--color-primary-mwk-dark` | `#8a010f` | `SheetAddModal.tsx`, `login.module.css`, `EditNodeModal.tsx` | Hover / Dark gradient stop for `--color-primary-mwk`. |
| `--color-primary-mwk-light`| `#f8f9fa` | `SheetAddModal.tsx`, `EditNodeModal.tsx` | Tinted background / focus ring offset for `--color-primary-mwk`. |
| `--color-primary` | `#c40000` | `.kpi-card.active` in `globals.css`, `api/orgchart/route.ts` | Dashboard KPI card active state and initial dashboard template accents. |
| `--color-primary-light` | `#fee2e2` | `.kpi-card.active` outline glow in `globals.css` | Focus ring glow for active KPI cards. |
| `--color-primary-dark` | `#991b1b` | Defined in `globals.css` | Darker red variant in dashboard palette. |

---

### 2.2 Alternate / Legacy Brand Tokens & Hardcoded Values

| Color Value | Number of Usages | Key Files Affected | Semantic Meaning & Relationship | Status |
|---|---|---|---|---|
| `#db011c` | **264+** | `visitorrequest/page.tsx`, `visitoranalytics/page.tsx`, `checkinout/page.tsx`, `MultiSelectDropdown.tsx`, `admin-layout.css` | Hardcoded hex used across all Visitor Management and Security modules. Represents the standard digital Milwaukee Red. | **Migration Candidate:** To be unified with `--color-primary-mwk` in a future refactoring phase after approval. |
| `#bd011c` | **7+** | `globals.css`, `appfooter.css`, `loading.css`, `signup.module.css`, and via `var(--color-primary-mwk)` | Pre-existing token systematically wired into Orgchart, Sheet Manager, and Login. **NOT a typo** — it is an active production token with deliberate usage. | **Active Token (Legacy / Alternate):** Maintained as-is to preserve existing visual appearance. |
| `#c40000` | **3** | `globals.css` (`--color-primary`), `api/orgchart/route.ts` | Initial theme primary token used on Dashboard KPI cards. | **Active Token:** Maintained for Dashboard KPI cards. |
| `#b52427` | **1** | `UserManagement.tsx` | Text color on compact role tags. | **Migration Candidate:** Can be unified to brand red token in future phase. |
| `red-600` (`#dc2626`) | **25+** | `OpsSupportOrgChart.tsx`, `CoreTeamOrgChart.tsx`, `profile/page.tsx`, `EditNodeModal.tsx` | Standard Tailwind utility for action buttons and org chart connecting branches. | **Active Tailwind Utility:** Retained as standard utility. |
| `red-700` (`#b91c1c`) | **8+** | `visitoradmin/page.tsx`, `profile/page.tsx`, `EditNodeModal.tsx` | Standard hover state (`hover:bg-red-700`) for primary buttons. | **Active Tailwind Utility:** Retained as standard hover utility. |

---

### 2.3 Surface & Background Tokens

| Token | Light Mode Value | Dark Mode Value (`.dark`) | Purpose |
|---|---|---|---|
| `--color-bg-page` | `#eaedf1` (Slate 100) | `#0f172a` (Slate 900) | Main viewport background behind layout shell. |
| `--color-bg-card` | `#ffffff` (Pure White) | `#1e293b` (Slate 800) | Widget containers, data tables, modals, cards. |
| `--color-bg-muted` | `#f8fafc` (Slate 50) | `#0f172a` (Slate 900) | Table header background, disabled inputs, cascader floor panes. |

---

### 2.4 Typography & Content Tokens

| Token | Light Mode Value | Dark Mode Value (`.dark`) | Purpose |
|---|---|---|---|
| `--color-text-title` | `#0f172a` (Slate 900) | `#ffffff` | Page titles, modal headings, metric values. |
| `--color-text-body` | `#334155` (Slate 700) | `#cbd5e1` (Slate 300) | Table cells, form field values, body text. |
| `--color-text-muted` | `#64748b` (Slate 500) | `#94a3b8` (Slate 400) | Field labels, metadata subtitles, breadcrumb items. |
| `--color-text-light` | `#94a3b8` (Slate 400) | `#64748b` (Slate 500) | Placeholders, disabled text, decorative timestamps. |

---

### 2.5 Border & Divider Tokens

| Token | Light Mode Value | Dark Mode Value (`.dark`) | Purpose |
|---|---|---|---|
| `--color-border` | `#e5e7eb` (Gray 200) | `#334155` (Slate 700) | Card borders, dropdown boundaries, navigation dividers. |
| `--color-border-light` | `#f3f4f6` (Gray 100) | `#1e293b` (Slate 800) | Subtle row separators, table internal dividers. |

---

### 2.6 Semantic Status Colors (From Utilities & Badges)

| State | Background Class | Text Class | Border Class | Target Usage |
|---|---|---|---|---|
| **Success / Approved** | `bg-green-50` (`#f0fdf4`) | `text-green-700` (`#15803d`) | `border-green-200` | Approved requests, Checked-in visitors, Active users. |
| **Pending / In Process**| `bg-orange-50` (`#fff7ed`) | `text-orange-700` (`#c2410c`) | `border-orange-200` | Pending approvals, Expected arrivals, Waiting steps. |
| **Error / Rejected** | `bg-red-50` (`#fef2f2`) | `text-red-700` / `text-[#db011c]` | `border-red-200` | Rejected requests, Overstay alerts, Validation errors. |
| **Vendor / Info** | `bg-blue-50` (`#eff6ff`) | `text-blue-700` (`#1d4ed8`) | `border-blue-200` | Vendor badges, information callouts. |
| **Contractor** | `bg-cyan-50` (`#ecfeff`) | `text-cyan-700` (`#0e7490`) | `border-cyan-200` | Contractor category badges. |
| **Interviewee** | `bg-emerald-50` (`#ecfdf5`)| `text-emerald-700` (`#047857`)| `border-emerald-200`| Interviewee / Recruitment candidates. |
| **Expat / Business Trip**| `bg-purple-50` (`#faf5ff`)| `text-purple-700` (`#7e22ce`)| `border-purple-200` | MIL/TTI Expat badges, Executive visitor flags. |

---

## 3. Typography Scale

* **Font Family:** `'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`
* **Characteristics:** High legibility at compact sizes (`10px` to `13px`) tailored for factory and operations management.

| Level | Size | Weight | Tailwind Class | Typical Usage |
|---|---|---|---|---|
| **H1** | `22px` (`1.375rem`) | `700` / `900` | `text-xl md:text-2xl font-black` | Page titles (e.g. "Check-In / Out Management"). |
| **H2** | `16px` (`1rem`) | `600` / `700` | `text-base font-bold` | Modal titles, section card headers. |
| **H3** | `14px` (`0.875rem`) | `600` | `text-sm font-semibold` | Sub-section headings, chart titles. |
| **Body** | `13px` (`0.8125rem`)| `400` / `500` | `text-xs md:text-[13px]` | Table data cells, form input text, modal body copy. |
| **Label (Compact)**| `10px` / `11px` | `700` / `900` | `text-[10px] uppercase font-bold tracking-wider` | Form input labels, column headers (`<th>`), filter tags. |
| **Badge / Caption**| `9px` / `10px` | `700` / `900` | `text-[9px] uppercase font-black tracking-tight` | Status pill text, counter badges, mini tags. |

---

## 4. Spacing Scale

Built on a compact 4px grid in `globals.css`:

| Token | Size | Typical Usage |
|---|---|---|
| `--space-xs` | `4px` (`0.25rem`) | Chip padding, icon-text gap, input vertical padding. |
| `--space-sm` | `8px` (`0.5rem`) | Button padding (vertical), small gap in filter rows. |
| `--space-md` | `12px` (`0.75rem`) | Input horizontal padding, card internal row gap. |
| `--space-lg` | `16px` (`1rem`) | Card padding, modal internal padding, table header padding. |
| `--space-xl` | `20px` (`1.25rem`) | Layout section padding, main view gaps. |
| `--space-2xl`| `24px` (`1.5rem`) | Page header margin, modal header to body distance. |

---

## 5. Border Radius & Shadows

### Border Radius
* `rounded-sm` (`4px`): Mini status indicators, progress bar ends.
* `rounded-md` (`6px`): Compact action buttons, filter preset buttons.
* `rounded-lg` (`8px`): Standard form inputs, select dropdowns, cascader panels.
* `rounded-xl` (`12px`): Dashboard cards, table containers, modal windows.
* `rounded-full` (`9999px`): Status pills, notification counters, user avatars.

### Shadows
* `shadow-xs` / `shadow-sm`: `0 1px 2px rgba(0, 0, 0, 0.05)` — Cards, inputs, table containers.
* `shadow-md`: `0 4px 6px -1px rgba(0, 0, 0, 0.1)` — Hover states, dropdown menus.
* `shadow-2xl`: `0 25px 50px -12px rgba(0, 0, 0, 0.25)` — Modal dialogs with dark overlay.

---

## 6. Documented UI Patterns (Existing Codebase)

### 6.1 Buttons
* **Primary Milwaukee Button:**
  ```tsx
  className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-[#db011c] hover:bg-red-700 text-white text-xs font-bold rounded-lg shadow-sm transition-colors active:translate-y-px disabled:opacity-50"
  ```
* **Secondary / Outline Button:**
  ```tsx
  className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 hover:bg-gray-50 text-gray-700 dark:text-gray-200 text-xs font-semibold rounded-lg shadow-xs transition-colors"
  ```
* **Danger Button:**
  ```tsx
  className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-[#db011c] text-xs font-bold rounded-lg transition-colors"
  ```
* **Icon-Only Button:**
  ```tsx
  className="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-md transition-colors"
  ```

### 6.2 Form Inputs & Search
* **Text Input:**
  ```tsx
  className="w-full text-xs font-medium border border-gray-200 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#db011c] focus:border-[#db011c] shadow-xs transition-all"
  ```
* **Input Label:**
  ```tsx
  className="block text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1"
  ```

### 6.3 KPI Metric Cards
* **KPI Card Container:**
  ```tsx
  className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200/80 dark:border-slate-700 p-4 shadow-sm flex items-center justify-between transition-all hover:shadow-md"
  ```
* **Value & Label:**
  ```tsx
  <div className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">{metric}</div>
  <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mt-0.5">{title}</div>
  ```

### 6.4 Responsive Data Tables
* **Standard Table Layout Wrapper:**
  ```tsx
  <div className="w-full overflow-hidden bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm flex flex-col">
    <div className="overflow-x-auto min-w-full">
      <table className="w-full border-collapse text-left min-w-[1200px]">
        <thead className="bg-gray-50/95 dark:bg-slate-700/80 sticky top-0 text-[10px] font-black uppercase text-gray-500 dark:text-gray-400 tracking-wider border-b border-gray-200 dark:border-slate-600">
          {/* th elements */}
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-slate-700/60 text-xs">
          {/* tr elements */}
        </tbody>
      </table>
    </div>
  </div>
  ```

### 6.5 Status & Category Badges
* Implemented via centralized helper [`getCategoryBadgeClass`](file:///c:/Users/luan.nguyen/Desktop/test%20org/Orgchart_TTI_onprem/src/utils/badge.ts) and [`getStatusBadgeClass`](file:///c:/Users/luan.nguyen/Desktop/test%20org/Orgchart_TTI_onprem/src/utils/badge.ts):
  ```tsx
  <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase whitespace-nowrap ${getCategoryBadgeClass(category)}`}>
    {category}
  </span>
  ```

### 6.6 Modal Dialog Structure
* **Overlay & Window:**
  ```tsx
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-gray-100 dark:border-slate-700 max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-700 flex justify-between items-center">
        <h3 className="text-base font-bold text-gray-900 dark:text-white">{title}</h3>
        <button className="text-gray-400 hover:text-gray-600">✕</button>
      </div>
      {/* Scrollable Body */}
      <div className="p-6 overflow-y-auto flex-1">...</div>
      {/* Footer Actions */}
      <div className="px-6 py-3 bg-gray-50 dark:bg-slate-700/50 border-t border-gray-100 dark:border-slate-700 flex justify-end gap-2">...</div>
    </div>
  </div>
  ```

---

## 7. Legacy CSS Audit

| File | Status | Location | Notes |
|---|---|---|---|
| `globals.css` | **ACTIVE** | `src/app/globals.css` | Root design tokens, dark mode overrides, print styles. |
| `admin-layout.css`| **ACTIVE** | `src/styles/admin-layout.css` | Imported by `src/app/orgchart/page.tsx`. |
| `appfooter.css` | **ACTIVE** | `src/styles/appfooter.css` | Imported by `src/components/app.footer.tsx`. |
| `loading.css` | **ACTIVE** | `src/styles/loading.css` | Imported by `src/components/loading-screen.tsx`. |
| `OrgChart.module.css`| **ACTIVE**| `src/app/orgchart/OrgChart.module.css`| Imported by `OrgChartView.tsx` & `CustomizeClient.tsx`. |
| `sheet.module.css` | **ACTIVE** | `src/app/sheetmanager/sheet.module.css` | Imported by `SheetManagerTable.tsx`, `HeadcountManager.tsx`. |
| `login.module.css` | **ACTIVE** | `src/app/login/login.module.css` | Imported by `login/page.tsx`. |
| `signup.module.css`| **ACTIVE**| `src/app/signup/signup.module.css`| Imported by `signup/page.tsx`. |
| `view_account.css` | **ACTIVE** | `src/app/view_account/view_account.css` | Imported by `view_account/page.tsx`. |
| `viewdata.module.css`| **ACTIVE**| `src/app/viewdata_org/viewdata.module.css`| Imported by `viewdata_org/page.tsx`. |
| `appheader.css` | **ORPHAN CANDIDATE** | `src/styles/appheader.css` (442 lines) | 0 imports (consumer `app.header.tsx` was deleted in Phase 1). |
| `app.module.css` | **ORPHAN CANDIDATE** | `src/styles/app.module.css` (90 bytes) | 0 imports across entire repository. |
| `dashboard.module.css`| **ORPHAN CANDIDATE**| `src/app/dashboard/dashboard.module.css` | 0 imports across entire repository. |
| `page.module.css` | **ORPHAN CANDIDATE** | `src/app/page.module.css` | 0 imports across entire repository. |

---

## 8. Accessibility Baseline & Gap Analysis

1. **Icon-Only Buttons Missing Accessible Labels:**
   - Action buttons in `UserManagement.tsx`, `PendingApprovals.tsx`, `RequestCheckInModal.tsx`, and `SheetManagerTable.tsx` use SVG icons (`<PencilSquareIcon />`, `<TrashIcon />`, `<XMarkIcon />`) without `aria-label` or `<span className="sr-only">`.
2. **Form Label-Input Association:**
   - In `visitorrequest/page.tsx` and `RequestCheckInModal.tsx`, form labels are rendered as plain `<div>` or `<label>` without an `htmlFor` matching the `<input id="...">`.
3. **Modal Semantic Dialog Attributes:**
   - Existing modals render plain `<div>` wrappers instead of declaring `role="dialog"`, `aria-modal="true"`, and `aria-labelledby="..."`.
4. **Focus Rings:**
   - Some input elements use `focus:outline-none` without an explicit `focus:ring-2 focus:ring-[#db011c]` replacement, diminishing keyboard focus visibility for keyboard-only users.

---

## 9. Phase 15A Component Specifications & Migration Conventions

### 9.1 Shared UI Primitives (`src/components/ui/`)

#### 1. Button (`src/components/ui/Button.tsx`)
- **Variants:**
  - `primary`: Milwaukee digital red background (`#db011c`), white text, hover `#b90118`, active `#9a0114`, focus ring `#db011c/30`.
  - `secondary`: White background, border `gray-200`, text `gray-700`, hover `gray-50`.
  - `outline`: Transparent background, border `#db011c`, text `#db011c`, hover `red-50`.
  - `danger`: Red background (`bg-red-600`), white text, hover `bg-red-700`.
  - `ghost`: Transparent background, hover `gray-100`, text `gray-600`.
- **Sizes:** `sm` (compact tables/toolbars), `md` (standard forms), `lg` (prominent actions).
- **Interactive States:** Native `loading` spinner with auto-disabled click prevention, `disabled` opacity/cursor handling, forwardRef support.

#### 2. Input (`src/components/ui/Input.tsx`)
- **Structure:** Encapsulates standard `<label>`, `<input>`, and error/helper text with accessible label-id association.
- **States:** Default (border `gray-200`, focus border `#db011c`, focus ring `red-100`), Error (border `red-400`, focus border `red-500`, helper text in red), Disabled (background `gray-100`, text `gray-400`).

#### 3. Badge (`src/components/ui/Badge.tsx`)
- **Status Mapping:** Integrated with `getStatusBadgeClass` and `getCategoryBadgeClass` from `src/utils/badge.ts`.
- **Variants:** `default` (slate), `success` (green), `danger` (red), `warning` (amber), `info` (blue).
- **Sizes:** `sm` (`text-[10px]` pill), `md` (`text-xs` pill).

#### 4. Modal (`src/components/ui/Modal.tsx`)
- **Headless UI Foundation:** Uses `@headlessui/react` `<Dialog>` and `<Transition>` with accessible `role="dialog"` and `aria-modal="true"`.
- **Features:** Keyboard Escape key listener, backdrop blur overlay (`bg-slate-900/50`), scrollable body, fixed header and footer slots, standard close button with `aria-label`.

### 9.2 Form Patterns
- Standard label typography: `text-xs font-semibold text-gray-700 block mb-1`.
- Mandatory indicator: `<span className="text-[#db011c]">*</span>`.
- Field vertical spacing: `space-y-1.5`.
- Form grid layout: `grid grid-cols-1 md:grid-cols-2 gap-4`.
- Action buttons in modal footer: Cancel (`Button variant="secondary"`) on the left/first, Submit/Save (`Button variant="primary"`) on the right.

### 9.3 Table Visual Patterns
- Container: `bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col`.
- Header: Sticky top-0, background `bg-[#fcf5f5]` or `bg-gray-50/95`, column header text `text-[10px] font-bold uppercase tracking-wider text-[#b52427]` or `text-gray-500`.
- Body: `divide-y divide-gray-100`, row hover `hover:bg-gray-50/50 transition-colors`.
- Action cells: Fixed or compact width, flex container with `gap-1` or `gap-2`, icon-only buttons with explicit `aria-label` and `title`.

### 9.4 Accessibility Conventions
1. **Icon-Only Buttons:** Every icon-only button must provide `aria-label="<Action Name>"` matching its `title`.
2. **Interactive Cursors:** Buttons and interactive elements must declare `cursor-pointer`.
3. **Form Association:** Labels must either wrap the control or reference the control's `id` via `htmlFor`.
4. **Keyboard Focus:** Elements must retain visible outline/ring states (`focus:ring-1 focus:ring-[#db011c]` or `focus-visible:ring-2`).

### 9.5 Migration Conventions
1. **Zero Logic Changes:** Adopting Design System primitives must never modify event handlers, form payloads, API calls, or validation rules.
2. **Selective Component Mapping:** Native `<button>` and `<input>` elements are migrated when props and layout are directly compatible. Specialized controls (custom date pickers, Excel cascaders, canvas overlays) remain intact.
3. **Batch Verification:** Each feature batch must verify TypeScript compilation (`npx tsc --noEmit`) and git diff hygiene before progressing.

---

## 10. Phase 15B Shared Primitives Specifications

### 10.1 Select (`src/components/ui/Select.tsx`)
* **Purpose:** Provides a consistent, accessible single-select dropdown primitive built on Headless UI's `Listbox`.
* **When to use:**
  - Standard single-selection dropdowns in forms, modal dialogs, and filter toolbars (e.g., status, category, app module).
  - When keyboard navigation, active highlight, and brand focus rings are needed.
* **When NOT to use:**
  - Specialized multi-select checkbox controls (e.g. `ExcelColumnFilter`).
  - Hierarchical cascading pickers (e.g. `MeetingRoomCascader`).
  - Browser-native HTML select elements where custom styling is strictly constrained by third-party canvas or layout engines.
* **Props:**
  - `label?: string`
  - `value?: string`
  - `onChange?: (value: string) => void`
  - `options: SelectOption[]` (`{ value: string; label: string; disabled?: boolean }`)
  - `placeholder?: string`
  - `disabled?: boolean`
  - `error?: string`
  - `helperText?: string`
  - `required?: boolean`
  - `id?: string`
  - `name?: string`
  - `className?: string`
* **Accessibility:**
  - Automatically associates `<label>` with `<ListboxButton>` using generated or explicit `id`.
  - Full keyboard control: `Space`/`Enter` to open, `ArrowUp`/`ArrowDown` to navigate, `Enter` to select, `Escape` to close.
  - Declares `aria-invalid` on error and links helper text via `aria-describedby`.
* **Example:**
  ```tsx
  <Select
    label="Status"
    value={status}
    onChange={setStatus}
    options={[
      { value: 'Active', label: 'Active' },
      { value: 'Inactive', label: 'Inactive' },
    ]}
  />
  ```

### 10.2 EmptyState (`src/components/ui/EmptyState.tsx`)
* **Purpose:** Standardizes empty views for tables, card lists, search results, and filters across all domains.
* **When to use:**
  - When an array or query returns 0 items after loading completes (`!loading && items.length === 0`).
  - Inside table rows (`<tr><td colSpan={...}><EmptyState ... /></td></tr>`), card containers, or panels.
* **When NOT to use:**
  - Initial loading states (use `TableSkeleton` instead).
  - Landing pages or hero presentation sections.
* **Props:**
  - `title: string`
  - `description?: string`
  - `icon?: React.ReactNode` (defaults to neutral `InboxIcon`)
  - `action?: React.ReactNode` (optional call-to-action button or reset control)
  - `className?: string`
* **Accessibility:**
  - Uses semantic heading (`<h3>`) and descriptive text (`<p>`) with high readability.
  - Decorative icons are marked `aria-hidden="true"`.
* **Example:**
  ```tsx
  <EmptyState
    title="No visitors found"
    description="Try adjusting your date range or filter criteria."
    action={<Button variant="outline" size="sm" onClick={resetFilters}>Clear filters</Button>}
  />
  ```

### 10.3 TableSkeleton (`src/components/ui/TableSkeleton.tsx`)
* **Purpose:** Visual skeleton loading placeholder for tabular data, preventing abrupt layout shifts.
* **When to use:**
  - Inside `<tbody>` elements during data fetching (`loading && <TableSkeleton rows={5} columns={headers.length} />`).
* **When NOT to use:**
  - Interactive OrgChart canvas (BalkanGraph has its own loading indicator).
  - Page-level initial boot spinners (use full-screen spinner).
  - Non-tabular card grids.
* **Props:**
  - `rows?: number` (default: 5)
  - `columns?: number` (default: 5)
  - `className?: string`
* **Accessibility:**
  - Renders valid table rows (`<tr><td>...</td></tr>`) with `animate-pulse` placeholders to preserve column dimensions without throwing DOM nesting warnings.
* **Example:**
  ```tsx
  <tbody className="divide-y divide-gray-100">
    {loading ? (
      <TableSkeleton rows={6} columns={8} />
    ) : items.length === 0 ? (
      <tr>
        <td colSpan={8} className="py-12">
          <EmptyState title="No items found" />
        </td>
      </tr>
    ) : (
      items.map(item => <ItemRow key={item.id} item={item} />)
    )}
  </tbody>
  ```

### 10.4 FormField (`src/components/ui/FormField.tsx`)
* **Purpose:** A lightweight, behavior-generic layout wrapper providing standard label, error text, helper text, and accessibility wiring for any form control.
* **When to use:**
  - Wrapping controls that do not have built-in label/error handling (e.g. `<textarea>`, custom pickers, compound controls, or `<Select>`).
* **When NOT to use:**
  - Direct `<Input>` instances that already provide their own built-in `label`, `error`, and `helperText` properties.
  - In complex schema-driven form generators (keep forms lightweight and direct).
* **Props:**
  - `label?: string`
  - `htmlFor?: string`
  - `error?: string`
  - `helperText?: string`
  - `required?: boolean`
  - `children: React.ReactNode`
  - `className?: string`
* **Accessibility:**
  - Links label to target element via `htmlFor`.
  - Associates error message through `{htmlFor}-error` id for screen readers.
* **Example:**
  ```tsx
  <FormField label="Description" htmlFor="role-desc" helperText="Max 250 characters">
    <textarea id="role-desc" className="..." value={desc} onChange={...} />
  </FormField>
  ```

### 10.5 Alert (`src/components/ui/Alert.tsx`)
* **Purpose:** Inline and section-level feedback banner communicating operation results, validation errors, warnings, and informational notices.
* **When to use:**
  - Form operation errors (e.g. "Unable to save role", "Failed to update user").
  - Inline feedback banners at the top of modal dialogs or form sections.
  - Operation success or system warnings within page views.
* **When NOT to use:**
  - Micro field-level validation errors (use `Input` `error` prop or `FormField` `error` instead).
  - Status chips/badges inside table rows (use `Badge` instead).
  - Global floating notifications across page transitions (reserved for future Toast system).
* **Props:**
  - `variant?: 'info' | 'success' | 'warning' | 'error'` (default: `'info'`)
  - `title?: string`
  - `children: React.ReactNode`
  - `icon?: React.ReactNode`
  - `className?: string`
  - `onClose?: () => void`
* **Accessibility:**
  - Error alerts declare `role="alert"` for assertive screen reader announcement.
  - Success, warning, and info alerts declare `role="status"` for polite announcement.
  - Decorative icons are marked `aria-hidden="true"`.
  - Dismiss button includes explicit `aria-label="Dismiss alert"`.
* **Example:**
  ```tsx
  <Alert variant="error" title="Unable to save role">
    {error}
  </Alert>
  ```

---

## 11. Complete Shared Primitives Catalog (Phase 15 Master Reference)

| Primitive | Path | Responsibility | Primary Context |
|---|---|---|---|
| **Button** | `src/components/ui/Button.tsx` | Standardized button with `primary`, `secondary`, `outline`, `danger`, `ghost` variants and built-in loading spinner. | Actions, forms, table toolbars, modal footers. |
| **Input** | `src/components/ui/Input.tsx` | Controlled text input with label, required asterisk, focus rings, helper text, and error states. | Single-line form inputs, search bars. |
| **Badge** | `src/components/ui/Badge.tsx` | Status pill chip with semantic color mapping (`success`, `warning`, `danger`, `info`, `default`). | Table status columns, tags, role indicators. |
| **Modal** | `src/components/ui/Modal.tsx` | Accessible dialog shell built on `@headlessui/react` `Dialog` with backdrop blur and Escape listener. | Modal popups, creation/edit flows. |
| **Select** | `src/components/ui/Select.tsx` | Keyboard-navigable single-select dropdown built on `@headlessui/react` `Listbox`. | Form dropdowns, filter toolbars. |
| **EmptyState** | `src/components/ui/EmptyState.tsx` | Standardized visual presentation for zero-result queries and empty tables/cards. | Empty table rows, empty filter results. |
| **TableSkeleton** | `src/components/ui/TableSkeleton.tsx` | Animated pulsing skeleton rows preserving column widths during asynchronous fetch. | Table body loading state. |
| **FormField** | `src/components/ui/FormField.tsx` | Lightweight label, helper text, and error wrapper for compound or non-input controls. | Textarea, custom pickers, compound controls. |
| **Alert** | `src/components/ui/Alert.tsx` | Inline feedback banner with semantic color schemes (`error`, `success`, `warning`, `info`) and accessible ARIA roles. | Form operation errors, status notices. |

---

## 12. Specialized Controls Intentionally Preserved

The following controls have domain-specific, third-party, or performance-critical interaction models that must **NOT** be forced into generic UI wrappers:

1. **`ExcelColumnFilter` (`src/features/visitor/rooms/components/ExcelColumnFilter.tsx`):** Custom multi-value checkbox popover with anchored floating portal menus.
2. **`MeetingRoomCascader` (`src/features/visitor/request/components/MeetingRoomCascader.tsx`):** Dynamic multi-level hierarchical tree picker with nested parent-child selection logic.
3. **Native Date & Datetime-Local Pickers:** Rely on browser-native `.showPicker()` API and ISO serialization in visitor workflows.
4. **BalkanGraph Canvas Elements:** Interactive SVG node interactions and pan/zoom handlers are directly managed by `@balkangraph/orgchart.js`.
5. **Interactive Recharts Visuals:** SVG charts in Visitor Dashboard and Analytics.
