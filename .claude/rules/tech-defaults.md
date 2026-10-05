# tech-defaults.md — Technology Stack & Engineering Defaults

> **Project:** `Orgchart_TTI_onprem`  
> **Tech Stack:** Next.js 15 App Router | TypeScript 5 | Dual PostgreSQL | NextAuth Azure AD SSO  

---

## 1. Next.js 15 App Router Standards

- **Route Handlers (`src/app/api/**/route.ts`):**
  - Implement explicit HTTP methods (`GET`, `POST`, `PUT`, `PATCH`, `DELETE`).
  - Add `export const dynamic = 'force-dynamic';` when handling live database queries or headers.
  - Return standardized JSON responses with proper HTTP status codes:
    - `200 OK` / `201 Created`
    - `400 Bad Request` (Validation errors)
    - `401 Unauthorized` / `403 Forbidden`
    - `500 Internal Server Error` (With safe internal logging; never expose raw stack traces to client)

- **Client vs Server Components:**
  - Client components must declare `'use client'` at the top.
  - **Client components must NEVER import database pools (`db.ts` or `visitor-db.ts`).**
  - Data fetching in client components must go through domain API services (`src/features/*/services/`) calling `/api/...`.

---

## 2. Dual PostgreSQL Database Rules

The system connects to two independent on-premise PostgreSQL databases:

```
┌─────────────────────────────────┐       ┌─────────────────────────────────┐
│       src/lib/db.ts             │       │      src/lib/visitor-db.ts      │
│     (getDbConnection / pool)    │       │  (getVisitorDbConnection / pool)│
├─────────────────────────────────┤       ├─────────────────────────────────┤
│ Database: Orgchart_TTI_Mil      │       │ Database: Visitor_database      │
│ Tables:                         │       │ Tables:                         │
│ - User                          │       │ - VisitorRequest                │
│ - Role                          │       │ - RequestApproval               │
│ - OrgNode                       │       │ - RoomArea                      │
│ - Headcount                     │       │ - HostDepartment                │
│ - SheetData                     │       │ - CheckInOutLog                 │
└─────────────────────────────────┘       └─────────────────────────────────┘
```

### Critical Rules:
1. **Never Mix Pools:** Do not run queries for `VisitorRequest` on `db.ts`, and do not run queries for `OrgNode` on `visitor-db.ts`.
2. **Parameterized Queries Only:** Concatenating user input into SQL queries is strictly prohibited to prevent SQL injection.
   ```typescript
   // CORRECT
   await visitorPool.query('SELECT * FROM "VisitorRequest" WHERE id = $1', [requestId]);

   // PROHIBITED
   await visitorPool.query(`SELECT * FROM "VisitorRequest" WHERE id = '${requestId}'`);
   ```
3. **Transaction Safety:** When performing multi-statement operations, always release the client in a `finally` block:
   ```typescript
   const client = await visitorPool.connect();
   try {
       await client.query('BEGIN');
       // statements...
       await client.query('COMMIT');
   } catch (err) {
       await client.query('ROLLBACK');
       throw err;
   } finally {
       client.release();
   }
   ```

---

## 3. TypeScript Standards

1. **Strict Types (No `any`):** Use strict interfaces, domain models, or `unknown` with type guards.
2. **Centralize Domain Types:** All shared data contracts live in `src/types/`:
   - `visitor.types.ts`: Core visitor entities
   - `visitor-admin.types.ts`: Visitor admin requests, filters, tables
   - `visitor-request.types.ts`: Pre-registration forms & payloads
   - `rooms.types.ts`: Meeting rooms, room categories, host departments
   - `user.types.ts`: User accounts, app roles, session profile
   - `orgchart.types.ts`: Hierarchy nodes, BalkanGraph integration
3. **Avoid Force Casting (`as any`):** Let TypeScript infer types where possible; define explicit return types for API functions.

---

## 4. Authentication & Access Control

- **NextAuth (`src/lib/authOptions.ts`):** Azure Active Directory MSAL OAuth2 + Microsoft Graph API.
- **RBAC Roles:** `admin`, `security`, `hr_ta`, `approver`, `user`.
- **Server Guard:** Use `hasPageAccess('/path')` in route handlers before executing privileged mutations.
