# PHASE 13A — SYSTEM ADMIN AUDIT

> **Domain:** System Administration, User Accounts, Roles & Permissions, SSO Pending Approvals  
> **Project:** `Orgchart_TTI_onprem`  
> **Author:** Antigravity AI  
> **Status:** AUDITED — READY FOR SERVICE & TYPE INTEGRATION  

---

## 1. Executive Summary

The **System Admin** domain controls identity, access control (RBAC), application roles, permissions, and pending account approvals for the factory management system at Milwaukee Tool Vietnam (SHTP & DDK plants).

This audit documents:
1. Exact system admin routes, components, and API routes.
2. User and role entities with full database schemas.
3. Dual-mode authentication (Azure AD MSAL OAuth2 + Legacy Bcrypt Credentials).
4. RBAC policy enforcement at Middleware (`src/middleware.ts`), Server (`src/lib/auth-server.ts`), and Client (`src/app/systemadmin/page.tsx`).
5. SSO auto-provisioning and Pending Approval workflow for non-SHTP/DDK accounts.
6. API contracts and migration plan to `systemAdminApi.ts`.

---

## 2. Exact System Admin Scope & Files

### A. Route URLs
| Route URL | Access Rule | Description |
|---|---|---|
| `/systemadmin` | `token.role === 'admin'` | Main System Admin portal with 3 tabs: User Accounts, Roles & Permissions, Pending Approvals |
| `/view_account` | `token.role === 'admin'` (or user) | Legacy standalone user management view (Vietnamese UI) |
| `/admin` | `token.role === 'admin' \|\| token.orgchart_role === 'admin'` | Headcount/Import admin dashboard (Belongs to Headcount domain, NOT System Admin) |

### B. Client-Side Pages & Components
- [`src/app/systemadmin/page.tsx`](file:///c:/Users/luan.nguyen/Desktop/test%20org/Orgchart_TTI_onprem/src/app/systemadmin/page.tsx) — Main System Admin layout with authorization gate (`role === 'admin'`) and tab switcher (`users`, `roles`, `pending`).
- [`src/app/systemadmin/components/UserManagement.tsx`](file:///c:/Users/luan.nguyen/Desktop/test%20org/Orgchart_TTI_onprem/src/app/systemadmin/components/UserManagement.tsx) — User accounts table, search/filter by status, pagination, create/edit modal with role assignment checkboxes.
- [`src/app/systemadmin/components/RoleManagement.tsx`](file:///c:/Users/luan.nguyen/Desktop/test%20org/Orgchart_TTI_onprem/src/app/systemadmin/components/RoleManagement.tsx) — App roles list, create/edit modal with page-level permission checkbox matrix across System Admin, OrgChart, and Visitor modules.
- [`src/app/systemadmin/components/PendingApprovals.tsx`](file:///c:/Users/luan.nguyen/Desktop/test%20org/Orgchart_TTI_onprem/src/app/systemadmin/components/PendingApprovals.tsx) — Grid of user cards awaiting administrator login approval, with Approve / Reject action buttons.
- [`src/app/view_account/page.tsx`](file:///c:/Users/luan.nguyen/Desktop/test%20org/Orgchart_TTI_onprem/src/app/view_account/page.tsx) — Legacy user accounts view.

### C. Server-Side Infrastructure & APIs (READ ONLY)
- [`src/middleware.ts`](file:///c:/Users/luan.nguyen/Desktop/test%20org/Orgchart_TTI_onprem/src/middleware.ts) — Edge middleware enforcing JWT validation, global admin bypass, unrestricted routes, and RBAC page matching via `token.allowedPages`.
- [`src/lib/authOptions.ts`](file:///c:/Users/luan.nguyen/Desktop/test%20org/Orgchart_TTI_onprem/src/lib/authOptions.ts) — NextAuth configuration handling Azure AD SSO, MS Graph API details, automatic role assignment, and pending approval classification.
- [`src/lib/auth-server.ts`](file:///c:/Users/luan.nguyen/Desktop/test%20org/Orgchart_TTI_onprem/src/lib/auth-server.ts) — Server-side session verification helper (`isAuthenticated()`, `unauthorizedResponse()`, `hasPageAccess()`).
- [`src/app/api/users/route.ts`](file:///c:/Users/luan.nguyen/Desktop/test%20org/Orgchart_TTI_onprem/src/app/api/users/route.ts) — CRUD endpoints for user accounts (`GET`, `POST`, `PUT`, `DELETE`).
- [`src/app/api/roles/route.ts`](file:///c:/Users/luan.nguyen/Desktop/test%20org/Orgchart_TTI_onprem/src/app/api/roles/route.ts) — CRUD endpoints for application roles (`GET`, `POST`, `PUT`, `DELETE`).

---

## 3. Domain Entities & Database Contracts

### Entity 1: User Account (`users` table in `Orgchart_TTI_Mil`)
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    role VARCHAR(50) DEFAULT 'user',               -- Global role: 'admin', 'user', 'viewer'
    orgchart_role VARCHAR(50) DEFAULT 'user',      -- OrgChart module role: 'admin', 'user'
    visitor_role VARCHAR(50) DEFAULT 'user',       -- Legacy visitor role
    employee_id VARCHAR(50),
    email VARCHAR(150),
    status VARCHAR(50) DEFAULT 'Active',           -- 'Active', 'Inactive', 'Pending Approval'
    department VARCHAR(100),
    job_title VARCHAR(100),
    location VARCHAR(100),                         -- e.g. 'SHTP', 'DDK', 'SEZ'
    app_role_ids UUID[],                           -- Array of app_roles.id
    last_login TIMESTAMP,
    sso_provider VARCHAR(50),                      -- e.g. 'azure-ad'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Entity 2: Application Role (`app_roles` table in `Orgchart_TTI_Mil`)
```sql
CREATE TABLE app_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,                    -- e.g. 'User Visitor', 'Admin Orgchart', 'Hr Visitor'
    app_module VARCHAR(50) NOT NULL,               -- 'Global', 'Orgchart', 'Visitor'
    description TEXT,
    permissions JSONB DEFAULT '[]'::jsonb,         -- Array of allowed page routes: ['/dashboard', '/orgchart', ...]
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 4. RBAC & Authorization Architecture

### A. Global vs Modular Roles
1. **Global Admin (`role === 'admin'`)**:
   - Superuser status.
   - Bypasses all page permission checks in `src/middleware.ts`.
   - Has exclusive access to `/systemadmin` to create users, edit roles, and approve accounts.
2. **Modular App Roles (`app_roles`)**:
   - Each role defines a list of route paths (`permissions`) it allows.
   - Example default roles created on system setup:
     - `User Visitor`: Allows access to `/visitorrequest` and `/visitordashboard`.
     - `Admin Orgchart`: Allows access to `/orgchart`, `/dashboard`, `/headcount_open`, `/import_hr_data`, `/sheetmanager`.
     - `Hr Visitor`: Allows access to HR-TA interviewee visitor registration.
3. **Session Token Assembly (`src/lib/authOptions.ts` - `jwt` & `session` callbacks)**:
   - On login, queries all roles from `app_roles` matching `users.app_role_ids`.
   - Aggregates all `permissions` arrays into `token.allowedPages`.
   - Middleware compares requested `request.nextUrl.pathname` against `token.allowedPages`.

### B. Route Access Matrix
| Route Path | Unrestricted | Requires Global Admin | Requires Permission in `allowedPages` |
|---|:---:|:---:|:---:|
| `/` | YES | NO | NO |
| `/introduction/*` | YES | NO | NO |
| `/profile` | YES | NO | NO |
| `/access-denied` | YES | NO | NO |
| `/systemadmin` | NO | YES | `'/systemadmin'` (or admin) |
| `/dashboard` | NO | NO | `'/dashboard'` |
| `/orgchart` | NO | NO | `'/orgchart'` |
| `/headcount_open` | NO | NO | `'/headcount_open'` |
| `/import_hr_data` | NO | NO | `'/import_hr_data'` |
| `/sheetmanager` | NO | NO | `'/sheetmanager'` |
| `/visitordashboard` | NO | NO | `'/visitordashboard'` |
| `/visitorrequest` | NO | NO | `'/visitorrequest'` |
| `/visitoradmin` | NO | NO | `'/visitoradmin'` |
| `/visitoradmin/rooms` | NO | NO | `'/visitoradmin/rooms'` |
| `/visitoradmin/checkinout` | NO | NO | `'/visitoradmin/checkinout'` |
| `/visitoranalytics` | NO | NO | `'/visitoranalytics'` |

---

## 5. SSO & Pending Approval Workflow

### Automatic User Provisioning via Azure AD SSO (`signIn` callback in `authOptions.ts`):
1. **First-time login of a corporate user**:
   - Azure AD token is retrieved.
   - MS Graph API is called to fetch `jobTitle`, `department`, `officeLocation`.
2. **Auto-Approve Criteria**:
   - Location contains `SHTP` or `DDK`, OR department contains `HR-TA`.
   - Result: `status = 'Active'`.
3. **Pending Approval Criteria**:
   - Location is non-SHTP/DDK and department is not HR-TA (e.g. Corporate, Regional, Outsourced).
   - Result: `status = 'Pending Approval'`. User is redirected to `/access-denied`.
4. **Approval by System Admin (`PendingApprovals.tsx`)**:
   - Admin reviews pending cards at `/systemadmin`.
   - **Approve**: Sends `PUT /api/users` with `{ id, ..., status: "Active" }`. User can now log in.
   - **Reject**: Sends `PUT /api/users` with `{ id, ..., status: "Inactive" }`. User remains blocked.

---

## 6. System Admin API Inventory

| Endpoint | Method | Query / URL Param | Body Payload | Response Format | Consumer |
|---|:---:|---|---|---|---|
| `/api/users` | `GET` | — | None | `{ success: boolean, data: UserAccount[] }` | `UserManagement`, `PendingApprovals`, `view_account` |
| `/api/users` | `POST` | — | `CreateUserPayload` | `{ success: boolean, data: UserAccount, message: string }` | `UserManagement`, `view_account` |
| `/api/users` | `PUT` | — | `UpdateUserPayload` | `{ success: boolean, message: string }` | `UserManagement`, `PendingApprovals`, `view_account` |
| `/api/users` | `DELETE` | `?id={id}` | None | `{ success: boolean, message: string }` | `UserManagement`, `view_account` |
| `/api/roles` | `GET` | — | None | `{ success: boolean, data: SystemAdminRole[] }` | `RoleManagement`, `UserManagement` |
| `/api/roles` | `POST` | — | `CreateRolePayload` | `{ success: boolean, data: SystemAdminRole, message: string }` | `RoleManagement` |
| `/api/roles` | `PUT` | — | `UpdateRolePayload` | `{ success: boolean, data: SystemAdminRole, message: string }` | `RoleManagement` |
| `/api/roles` | `DELETE` | `?id={id}` | None | `{ success: boolean, message: string }` | `RoleManagement` |

---

## 7. Migration Plan for Direct Fetch Calls

All raw `fetch(...)` calls in `src/app/systemadmin/components/`:
1. `PendingApprovals.tsx`:
   - Line 21: `fetch("/api/users")` -> `systemAdminApi.getPendingUsers()`
   - Line 56: `fetch("/api/users", { method: "PUT" })` -> `systemAdminApi.approveUser(user)`
   - Line 89: `fetch("/api/users", { method: "PUT" })` -> `systemAdminApi.rejectUser(user)`
2. `RoleManagement.tsx`:
   - Line 71: `fetch("/api/roles")` -> `systemAdminApi.getRoles()`
   - Line 101: `fetch("/api/roles?id=...", { method: "DELETE" })` -> `systemAdminApi.deleteRole(role.id)`
   - Line 131: `fetch("/api/roles", { method: "POST"|"PUT" })` -> `systemAdminApi.createRole` / `systemAdminApi.updateRole`
3. `UserManagement.tsx`:
   - Line 66: `fetch("/api/users")` -> `systemAdminApi.getUsers()`
   - Line 67: `fetch("/api/roles")` -> `systemAdminApi.getRoles()`
   - Line 115: `fetch("/api/users?id=...", { method: "DELETE" })` -> `systemAdminApi.deleteUser(user.id)`
   - Line 178: `fetch("/api/users", { method: "POST" })` -> `systemAdminApi.createUser(...)`
   - Line 227: `fetch("/api/users", { method: "PUT" })` -> `systemAdminApi.updateUser(...)`

---

## 8. Protected Contracts & Rules

1. **NO modification of protected files**:
   - `src/middleware.ts` (READ ONLY)
   - `src/lib/authOptions.ts` (READ ONLY)
   - `src/lib/db.ts` (READ ONLY)
   - `src/lib/visitor-db.ts` (READ ONLY)
   - `src/lib/orgchart.js` (READ ONLY)
   - `nginx.conf`, `ecosystem.config.js`, `.env.local` (READ ONLY)
2. **Session & JWT contracts must remain unchanged**:
   - `token.role`, `token.allowedPages`, `token.app_role_ids`, `token.app_role_names`.
3. **Database schemas and column names must remain unchanged**:
   - `users.role`, `users.orgchart_role`, `users.visitor_role`, `users.app_role_ids`, `users.status`.
   - `app_roles.permissions`, `app_roles.app_module`.
4. **No cross-domain pollution**:
   - Headcount APIs (`/api/sheet`, `/api/import_excel`) remain strictly in `headcountApi.ts`.
   - Visitor APIs remain in `visitorApi.ts`.
   - System Admin APIs only manage users and app roles.
