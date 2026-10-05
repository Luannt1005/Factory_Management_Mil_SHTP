# design.md — Design System & UI Specifications

> **Project:** `Orgchart_TTI_onprem`  
> **Brand:** Milwaukee Tool / Techtronic Industries (TTI) Vietnam  
> **Style Engine:** Tailwind CSS v4 + CSS Variables in `src/app/globals.css`  

---

## 1. Design Philosophy

This design system is purpose-built for an **On-Premise Industrial Factory Management Platform**:

1. **High Information Density:** Manufacturing supervisors, security gate guards, and HR specialists require compact, scannable layouts without excessive whitespace.
2. **Brand Alignment:** Centered around Milwaukee Tool's identity: Red accents, stark high contrast, slate neutrals, and crisp typography.
3. **Resilience & Responsiveness:** Strict minimum widths on data tables to prevent horizontal layout collapse on factory workstations, touch tablets, or scaled displays.
4. **No Inline Styles:** Use Tailwind utility classes and CSS variables. Avoid arbitrary inline `style={{ ... }}` blocks for colors, padding, and layout.

---

## 2. Brand Colors & Design Tokens

### 2.1 Brand Reds

| Token / Value | Role | Usage Area |
|---|---|---|
| `#db011c` / `--color-primary-mwk` | **Milwaukee Digital Red** | Primary brand color across Visitor Management, Security, and Navigation |
| `#bd011c` | **Deep Milwaukee Red** | Legacy Orgchart, Sheet Manager, and Node Editor buttons |
| `hover:bg-red-700` (`#b91c1c`) | **Button Hover** | Primary button interactive hover state |
| `bg-red-50 text-red-700` | **Negative / Rejected** | Rejection badges, alert callouts, overstay notifications |

### 2.2 Surface & Backgrounds

| Token | Light Value | Purpose |
|---|---|---|
| `--color-bg-page` | `#eaedf1` (Slate 100) | Main viewport background behind layout shell |
| `--color-bg-card` | `#ffffff` (Pure White) | Modals, data cards, KPI tiles, table wrappers |
| `--color-bg-muted` | `#f8fafc` (Slate 50) | Table headers, disabled inputs, preview panes |
| `--color-border` | `#e5e7eb` (Gray 200) | Card boundaries, dividers, input borders |

### 2.3 Semantic Status Badges

| Status | Background | Text | Border | Scope |
|---|---|---|---|---|
| **Approved / Success** | `bg-green-50` | `text-green-700` | `border-green-200` | Approved requests, Checked-in visitors, Active users |
| **Pending / In Process** | `bg-orange-50` | `text-orange-700` | `border-orange-200` | Pending approvals, Expected arrivals |
| **Rejected / Error** | `bg-red-50` | `text-red-700` | `border-red-200` | Rejected requests, Security alerts |
| **Interviewee** | `bg-emerald-50` | `text-emerald-700` | `border-emerald-200` | Candidate recruitment workflows |
| **Expat / Business Trip**| `bg-purple-50` | `text-purple-700` | `border-purple-200` | Executive / Expat visitors |
| **Contractor** | `bg-cyan-50` | `text-cyan-700` | `border-cyan-200` | On-site contractors & construction |

---

## 3. Typography Scale

- **Font Family:** `'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`
- **Tailored for High Density:**
  - Micro metadata / Badges: `text-[10px]` or `text-[11px]` font-bold uppercase
  - Table cell content: `text-xs` (`12px`) font-medium
  - Form input labels: `text-xs` (`12px`) font-bold text-gray-700
  - Section headers: `text-sm` (`14px`) font-bold text-gray-900
  - Page titles: `text-xl` to `text-2xl` font-extrabold tracking-tight

---

## 4. UI Patterns & Standards

### 4.1 Responsive Data Table Standard
All tabular data views with multiple columns **must** adhere to this container wrapper:
```tsx
<div className="w-full overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
    <table className="w-full min-w-[1200px] border-collapse text-left text-xs">
        <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-bold uppercase tracking-wider">
            {/* Headers */}
        </thead>
        <tbody className="divide-y divide-gray-100">
            {/* Rows */}
        </tbody>
    </table>
</div>
```

### 4.2 Shared Dashboard UI Components
When creating or modifying dashboard pages (`/dashboard`, `/visitoranalytics`, `/visitordashboard`), use shared components from `src/components/ui/` or `src/components/dashboard/`:
- `Card`: Standard white rounded container (`rounded-2xl border border-gray-100 shadow-sm`)
- `MetricCard`: KPI display tile with title, metric value, icon, and trend badge
- `ChartCard`: Chart wrapper with title, actions toolbar, and responsive sizing
- `ChartTheme.ts` & `ChartTooltip.tsx`: Unified Recharts color tokens and tooltips
