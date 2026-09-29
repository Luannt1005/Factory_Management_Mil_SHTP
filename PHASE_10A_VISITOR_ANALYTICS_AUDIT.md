# PHASE 10A — VISITOR ANALYTICS AUDIT REPORT

> **Module:** Visitor Analytics & Audit Logging (`src/app/visitoranalytics/`)  
> **Target Feature:** `src/features/visitor/analytics/`  
> **Status:** Phase 10A — Audit + Domain Types + API Service  

---

## 1. Current Structure & Responsibilities

`src/app/visitoranalytics/` provides executive oversight, operational KPI tracking, visitor trend forecasting, and physical gate audit logging across Milwaukee Tool Vietnam facilities (SHTP and DDK).

### Current File Inventory:
```text
src/app/visitoranalytics/
├── components/
│   └── CheckInOutLogs.tsx            # Gate audit logs viewer & Excel report generator (758 lines)
└── page.tsx                          # Analytics dashboard & tab coordinator (463 lines)
```

### Core Responsibilities:
1. **Overview Analytics (`page.tsx`):**
   - High-level KPI summary cards (Visitors Today + growth, Currently Present, Total This Week + growth, Average Stay Duration + delta).
   - Trend Area Chart (Recharts) visualizing weekly visitor volume over the past 7 weeks.
   - Business Unit Donut Chart (Recharts) contrasting Milwaukee (MIL) vs Share Function (SF).
   - Weekly Periodic Distribution Bar Graph (T2 to CN / Monday to Sunday).
   - Visitor Category Distribution Progress Bars (Vendor, Contractor, MIL-TTI Expat, Interviewee).
   - Top 7 Department Attendance Table with stacked BU breakdown.
   - Real-time New Registration Activity Feed with pulsing live status indicators.
   - 60-second auto-refresh polling interval for live data feed.
2. **Check-in/Out History Logs (`CheckInOutLogs.tsx`):**
   - Security gate audit trail tracking every gate transaction (`CHECK_IN`, `CHECK_OUT`, `INPUT_CARD`, `REVERSE`).
   - Granular multi-dimensional filtering: free-text search, action type, operator SSO account, date range, hourly time range (`HH:mm`), and quick date/time presets.
   - Live synchronization toggle with 30-second background polling.
   - Client-side pagination with selectable page limits (15, 25, 50, 100).
   - Large-scale Excel export via SheetJS (`xlsx`) supporting up to 100,000 records matching current filter criteria.

---

## 2. Dashboard Sections & Presentation

1. **Top Navigation Tabs:**
   - `Overview Analytics`: Primary analytical charts and KPI summaries.
   - `Check-in/Out History Logs`: Full security action log table with "Audit Logs" badge.
2. **Analytics Filter Bar:**
   - Period Filter: `'all' | 'today' | 'week' | 'month' | 'year'`.
   - Business Unit (BU) Filter: `'all' | 'MIL' | 'SF'`.
   - Status Filter: `'all' | 'IN PROCESS' | 'COMPLETE' | 'REJECTED'`.
   - Category Filter: `'all' | 'MIL/TTI Expat / SHTP Business trip' | 'Vendor' | 'Contractor' | 'Interviewee'`.
3. **Stat Cards Row (4 KPIs):**
   - Visitors Today (vs yesterday growth %).
   - Currently Present on campus (`CHECKED_IN`).
   - Total This Week (vs last week growth %).
   - Average Stay Time in minutes (vs last week delta).
4. **Trends & Distribution Charts:**
   - 7-Week Visitor Trends Area Chart with gradient fill and Recharts tooltip.
   - BU Distribution Donut Chart with MIL vs Share Function visit count.
5. **Periodic Report:**
   - Bar chart measuring daily traffic from Monday (`T2`) to Sunday (`CN`).
6. **Visitor Category Report:**
   - Horizontal percentage progress bars with color-coded legend and absolute counts.
7. **Department Attendance & Recent Activity Feed:**
   - Top 7 departments attendance table with two-color stacked bars (MIL vs SF).
   - Recent 20 registration logs with animated pulse badges and relative timestamps.
8. **Check-in/Out Audit Log Toolbar & Table:**
   - 3-row filter bar: search input, action dropdown, operator dropdown, date presets, custom dates, time presets, and custom hours.
   - Actions toolbar: Reset filters, total count, 30s Live Sync toggle, manual refresh, and Excel export.
   - Audit table: Timestamp, Operator (SSO Account + Avatar), Action Badge, Card No., Visitor Info, Request Code, Details.
   - Pagination controls: rows per page selector, Prev/Next, and 5-page window with ellipsis.

---

## 3. Entities & Database Tables

| Entity | Description | Database Origin |
|---|---|---|
| `VisitorRequest` | Standard visitor pre-registration envelope. | `Visitor_database` -> `"VisitorRequest"` |
| `IntervieweeRequest` | Recruitment candidate visit request envelope. | `Visitor_database` -> `"IntervieweeRequest"` |
| `VisitorCheckInOut` | Real-time visitor gate presence records. | `Visitor_database` -> `"VisitorCheckInOut"` |
| `checkinout_action_history` | Immutable security audit log tracking operator, action, card number, and metadata. | `Visitor_database` -> `checkinout_action_history` |
| `User` | User profile of submitters and operators. | `Visitor_database` -> `"User"` |

---

## 4. Analytics Metrics & Calculation Inventory

| Metric | Source / Table | Backend vs Frontend | Formula / Aggregation |
|---|---|---|---|
| `visitorsToday` | `BaseReqs` (CTE) | Backend SQL | `COUNT(*)` where `DATE("startDate") = CURRENT_DATE` |
| `visitorsTodayGrowth` | `BaseReqs` (CTE) | Backend SQL | `((today - yesterday) / yesterday) * 100` (or 100% if yesterday is 0) |
| `currentlyPresent` | `"VisitorCheckInOut"` + `BaseReqs` | Backend SQL | `COUNT(*)` where `status = 'CHECKED_IN'` |
| `totalThisWeek` | `BaseReqs` (CTE) | Backend SQL | `COUNT(*)` where `"startDate" >= date_trunc('week', CURRENT_DATE)` |
| `weekGrowth` | `BaseReqs` (CTE) | Backend SQL | `((thisWeek - lastWeek) / lastWeek) * 100` |
| `avgStayMinutes` | `BaseReqs` (CTE) | Backend SQL | `AVG(EXTRACT(EPOCH FROM ("endDate" - "startDate")) / 60)` |
| `avgStayChange` | `BaseReqs` (CTE) | Backend SQL | `thisWeekAvg - lastWeekAvg` (in minutes) |
| `trendData` | `BaseReqs` (CTE) | Backend SQL | Weekly grouping for past 7 weeks (`date_trunc('week', "startDate")`) |
| `periodicData` | `BaseReqs` (CTE) | Backend SQL | Daily grouping for current week (`EXTRACT(ISODOW FROM "startDate")`) normalized to T2–CN |
| `categoryData` | `BaseReqs` (CTE) | Backend SQL | `COUNT(*)` grouped by `category`, mapped to standardized display names, percentage calculated |
| `departmentData` | `BaseReqs` (CTE) | Backend SQL | `COUNT(*)` grouped by `department` and `bu`, sorted descending, top 7 selected |
| `buDistribution` | `BaseReqs` (CTE) | Backend SQL | Total MIL visits vs Share Function visits |
| `recentActivity` | `BaseReqs` (CTE) | Backend SQL | 20 most recent requests ordered by `"createdAt" DESC` |
| `checkinoutLogs` | `checkinout_action_history` | Backend SQL | Paginated audit log records matching filters, ordered by `created_at DESC` |
| `logOperators` | `checkinout_action_history` | Backend SQL | Distinct operators with action counts, ordered by `count DESC` |

---

## 5. Filters Inventory

### 5.1. Overview Analytics Filters (`page.tsx`)
- **Period (`periodFilter`):** `'all' | 'today' | 'week' | 'month' | 'year'`. Computes `startDate` and `endDate` on frontend before making API call.
- **BU (`buFilter`):** `'all' | 'MIL' | 'SF'`.
- **Status (`statusFilter`):** `'all' | 'IN PROCESS' | 'COMPLETE' | 'REJECTED'`.
- **Category (`categoryFilter`):** `'all' | 'MIL/TTI Expat / SHTP Business trip' | 'Vendor' | 'Contractor' | 'Interviewee'`.

### 5.2. Audit Logs Filters (`CheckInOutLogs.tsx`)
- **Search (`search`):** Case-insensitive string search against visitor name, visitor code, request ID, request code, card number, operator username, and operator name.
- **Action Type (`actionFilter`):** `'ALL' | 'CHECK_IN' | 'CHECK_OUT' | 'INPUT_CARD' | 'REVERSE'`.
- **Operator (`operatorFilter`):** `'ALL'` or specific operator SSO username.
- **Date Range:** `startDate` and `endDate` (`YYYY-MM-DD`). Supported by presets: `'all' | 'today' | 'week' | 'month'`.
- **Time Range:** `startTime` and `endTime` (`HH:mm`). Supported by presets: `'all' | 'morning' (06:00-12:00) | 'afternoon' (12:00-18:00) | 'night' (18:00-23:59)`.
- **Pagination:** `page` (1-indexed) and `limit` (default 15, options: 15, 25, 50, 100).
- **Auto-Refresh:** `autoRefresh` boolean (toggles 30s background poll).

---

## 6. API Inventory & Contract Specification

### 6.1. Overview Table

| Endpoint | Method | Params / Query | Body | Response Shape | Used In |
|---|---|---|---|---|---|
| `/api/visitor_admin/analytics` | `GET` | `startDate`, `endDate`, `bu`, `status`, `category` | None | `GetVisitorAnalyticsResponse` | `src/app/visitoranalytics/page.tsx:47` |
| `/api/visitor_admin/checkinout_logs` | `GET` | `search`, `action`, `performedBy`, `startDate`, `endDate`, `startTime`, `endTime`, `page`, `limit` | None | `GetCheckInOutLogsResponse` | `CheckInOutLogs.tsx:95` (fetchLogs) |
| `/api/visitor_admin/checkinout_logs` | `GET` | Same filters + `export=true`, `limit=100000` | None | `GetCheckInOutLogsResponse` | `CheckInOutLogs.tsx:184` (handleExportExcel) |

### 6.2. Detailed Contract: `GET /api/visitor_admin/analytics`
- **Method:** `GET`
- **Query Parameters:**
  - `startDate`: string (optional, format: `YYYY-MM-DD`)
  - `endDate`: string (optional, format: `YYYY-MM-DD`)
  - `bu`: `'all' | 'MIL' | 'SF'` (optional)
  - `status`: string (optional, e.g. `'IN PROCESS'`, `'COMPLETE'`, `'REJECTED'`)
  - `category`: string (optional, e.g. `'Vendor'`, `'Contractor'`, `'Interviewee'`, `'MIL/TTI Expat / SHTP Business trip'`)
- **Response Shape (200 OK):**
  ```json
  {
    "summary": {
      "visitorsToday": 42,
      "visitorsTodayGrowth": 15,
      "currentlyPresent": 18,
      "totalThisWeek": 210,
      "weekGrowth": 8,
      "avgStayMinutes": 185,
      "avgStayChange": -12
    },
    "trendData": [
      { "label": "Tuần 1", "value": 150 },
      { "label": "Tuần 2", "value": 180 }
    ],
    "periodicData": [
      { "label": "T2", "value": 35 },
      { "label": "T3", "value": 45 },
      { "label": "CN", "value": 5 }
    ],
    "categoryData": [
      { "name": "Vendor", "value": 85, "percentage": 40 },
      { "name": "Contractor", "value": 55, "percentage": 26 }
    ],
    "departmentData": [
      { "name": "Manufacturing", "MIL": 45, "SF": 10, "total": 55 }
    ],
    "buDistribution": [
      { "name": "MIL", "value": 140 },
      { "name": "Share Function", "value": 70 }
    ],
    "recentActivity": [
      {
        "name": "Nguyen Van A",
        "details": "Đơn đăng ký mới - Vendor",
        "status": "APPROVED",
        "time": "09/29/2026, 14:30"
      }
    ]
  }
  ```

### 6.3. Detailed Contract: `GET /api/visitor_admin/checkinout_logs`
- **Method:** `GET`
- **Query Parameters:**
  - `search`: string (optional)
  - `action`: string (optional, `'ALL' | 'CHECK_IN' | 'CHECK_OUT' | 'INPUT_CARD' | 'REVERSE'`)
  - `performedBy`: string (optional, operator username)
  - `startDate`, `endDate`: string (optional, `YYYY-MM-DD`)
  - `startTime`, `endTime`: string (optional, `HH:mm`)
  - `page`: number (default: 1)
  - `limit`: number (default: 15, export: 100000)
  - `export`: boolean string (`'true' | 'false'`)
- **Response Shape (200 OK):**
  ```json
  {
    "logs": [
      {
        "id": "uuid",
        "requestId": "req-123",
        "requestCode": "VR-2026-001",
        "visitorIndex": 0,
        "visitorCode": "V-001",
        "visitorName": "John Doe",
        "action": "CHECK_IN",
        "cardNumber": "1042",
        "performedBy": "security.guard@ttigroup.com.vn",
        "performedByName": "Nguyen Security",
        "details": {},
        "createdAt": "2026-09-29T08:00:00.000Z"
      }
    ],
    "pagination": {
      "total": 540,
      "page": 1,
      "limit": 15,
      "totalPages": 36
    },
    "operators": [
      {
        "username": "security.guard@ttigroup.com.vn",
        "name": "Nguyen Security",
        "count": 128
      }
    ]
  }
  ```

---

## 7. RBAC & Access Control Rules

- Access to `/visitoranalytics` requires production permission checks in `hasPageAccess('/visitoranalytics')` or `hasPageAccess('/visitoradmin')`.
- For `/api/visitor_admin/checkinout_logs`, access is permitted if the user has access to `/visitoranalytics`, `/visitoradmin`, or `/visitoradmin/checkinout`.
- 401 Unauthorized returned if unauthenticated; 403 Forbidden returned if user lacks permissions.
- In UI, authentication failures trigger login redirection.

---

## 8. Existing Types Reused vs New Domain Types

- **Reused from Existing Domain Types:**
  - `VisitorLogEntry` (from `src/types/visitor.types.ts`): used directly for individual log entries.
- **Newly Defined in `src/types/visitor-analytics.types.ts`:**
  - `VisitorAnalyticsPeriodFilter`: `'all' | 'today' | 'week' | 'month' | 'year'`
  - `GetVisitorAnalyticsParams`: query parameters for analytics endpoint
  - `VisitorAnalyticsSummary`: 4 KPI metrics with growth/delta values
  - `VisitorAnalyticsTrendItem`: weekly trend datapoint
  - `VisitorAnalyticsPeriodicItem`: daily distribution datapoint (T2–CN)
  - `VisitorAnalyticsCategoryItem`: category attendance breakdown
  - `VisitorAnalyticsDepartmentItem`: department breakdown by BU
  - `VisitorAnalyticsBUItem`: BU distribution item
  - `VisitorAnalyticsRecentActivityItem`: recent activity item
  - `GetVisitorAnalyticsResponse`: full envelope returned by analytics API
  - `GetCheckInOutLogsParams`: query parameters for check-in/out logs endpoint
  - `CheckInOutLogsOperatorItem`: operator item in logs response
  - `CheckInOutLogsPagination`: pagination envelope
  - `GetCheckInOutLogsResponse`: full envelope returned by logs API

---

## 9. API Service Candidate (`visitorAnalyticsApi.ts`)

Centralizes all network communications for analytics and check-in/out action logs:

```text
src/features/visitor/analytics/services/visitorAnalyticsApi.ts
├── VisitorAnalyticsApiError (custom error class with status & data)
└── visitorAnalyticsApi
    ├── getAnalytics(params?: GetVisitorAnalyticsParams): Promise<GetVisitorAnalyticsResponse>
    ├── getCheckInOutLogs(params?: GetCheckInOutLogsParams): Promise<GetCheckInOutLogsResponse>
    └── exportCheckInOutLogs(params?: Omit<GetCheckInOutLogsParams, 'page' | 'limit' | 'export'>): Promise<GetCheckInOutLogsResponse>
```

---

## 10. Technical Debt & Component Extraction Plan (Phase 10B)

1. **Page Monolith:** `page.tsx` (463 lines) embeds tab navigation, Recharts graphs (AreaChart, PieChart), custom HTML bars, department tables, and stat card components.
2. **Component Monolith:** `CheckInOutLogs.tsx` (758 lines) combines large multi-row filter form controls, live polling timers, pagination controls, SheetJS Excel formatting, and full table markup.
3. **Phase 10B Planned Components:**
   - `VisitorAnalyticsTabs.tsx`: Tab navigation between Overview and Audit Logs.
   - `VisitorAnalyticsFilters.tsx`: Overview period, BU, status, and category selectors.
   - `VisitorAnalyticsStatCards.tsx`: 4 KPI summary cards with growth indicators.
   - `VisitorAnalyticsCharts.tsx`: Trends AreaChart and BU PieChart.
   - `VisitorAnalyticsDepartmentTable.tsx`: Department attendance table and recent activity feed.
   - `CheckInOutLogsToolbar.tsx`: Complex filter controls for security logs.
   - `CheckInOutLogsTable.tsx`: Security audit table with action badges and pagination.
