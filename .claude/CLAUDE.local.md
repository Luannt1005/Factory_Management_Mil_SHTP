# CLAUDE.local.md — Local Developer Environment Notes (Private)

> **Note:** This file contains private local developer conventions and environment instructions. Do not commit sensitive factory credentials.

---

## 1. Local Runtime Environment

- **Development Port:** Default local port is `3001` or `3000`.
- **Active Dev Server:** `npm run dev`
- **NextAuth Local Callback:** Check `NEXTAUTH_URL` in `.env.local` matches the local test URL:
  - e.g., `NEXTAUTH_URL=http://localhost:3001` or `http://10.147.117.78:3001`

---

## 2. On-Premise Database Connectivity

The application connects to dual PostgreSQL servers:
1. `Orgchart_TTI_Mil`: Organization, employee, headcount data, and NextAuth account profiles.
2. `Visitor_database`: Pre-registrations, security check-in/out logs, room bookings, and host departments.

When developing locally away from the factory LAN, ensure you are connected to the TTI corporate VPN or SSH port-forwarding tunnel to reach PostgreSQL port `5432`.

---

## 3. Power Automate Webhooks

Local test requests can trigger configured cloud flows:
- `POWER_AUTOMATE_FOR_LEAVE_URL`: Room and host approval dispatch flow
- `POWER_AUTOMATE_EMAIL_NOTIFICATION_URL`: Standard interviewee / notification flow
- `POWER_AUTOMATE_ADMIN_DECISION_URL`: Admin approve/reject notification flow

When debugging flow triggers locally, inspect the browser console or server terminal for `[AdminDecision Webhook]` log messages.

---

## 4. PM2 & Cluster Mode (Production Deployment)

When deploying to the on-premise production server:
```bash
pm2 start ecosystem.config.js --env production
```
Ensure `--max-http-header-size=65536` is preserved to handle Azure AD bearer tokens with large group membership claims.
