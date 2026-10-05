# power-automate.md — Power Automate Integration Skill

> **Skill Name:** `power-automate`  
> **Purpose:** Manage webhook dispatching, payload contracts, run ID tracking, and email notification flows.

---

## 1. Webhook Endpoints

Configured in `.env.local`:
- `POWER_AUTOMATE_FOR_LEAVE_URL`: Room and host approval dispatch flow
- `POWER_AUTOMATE_VP_APPROVAL_URL`: VP-level escalation flow (>60% rooms)
- `POWER_AUTOMATE_EMAIL_NOTIFICATION_URL`: Interviewee / Direct notification flow
- `POWER_AUTOMATE_ADMIN_DECISION_URL`: Admin manual Approve / Reject decision webhook

---

## 2. Admin Decision Payload Contract

When an admin updates a request's status in Visitor Admin (`src/app/api/visitor_admin/requests/route.ts`), the following payload is dispatched:

```json
{
  "event": "ADMIN_DECISION",
  "action": "APPROVED",
  "status": "APPROVED",
  "requestId": "REQ_ID",
  "power_automate_run_id": "08584107699862955655413771342CU19",
  "power_automate_run_url": "https://make.powerautomate.com/environments/Default-8b8cc6cf-0eaa-4b64-98e4-6d4672c44930/flows/bffa6e65-ca94-43ee-8416-f14054f729a5/runs/...",
  "submitter": {
    "id": "username_or_id",
    "name": "Full Name",
    "email": "user@ttigroup.com.vn",
    "department": "Engineering"
  },
  "visitorDetails": {
    "visitorName": "Visitor Name",
    "visitorTitle": "Job Title",
    "currentCompany": "Company",
    "visitorCategory": "Expat",
    "visitingSite": "SHTP",
    "startDate": "...",
    "endDate": "...",
    "purposeOfVisit": "Audit",
    "purposeDetail": "...",
    "totalVisitors": 1
  },
  "visitorsList": [ ... ],
  "roomApprovals": [ ... ],
  "adminDecision": {
    "decision": "APPROVED",
    "updatedBy": "Admin Name",
    "adminEmail": "admin@ttigroup.com.vn",
    "comment": "",
    "updatedAt": "2026-10-01T14:35:00.000Z"
  }
}
```

---

## 3. Power Automate Run URL Generation

```typescript
const buildPowerAutomateRunUrl = (runId?: string | null) => {
    if (!runId) return null;
    return `https://make.powerautomate.com/environments/Default-8b8cc6cf-0eaa-4b64-98e4-6d4672c44930/flows/bffa6e65-ca94-43ee-8416-f14054f729a5/runs/${runId}`;
};
```
This is linked in `src/features/visitor/admin/components/VisitorDetailModal.tsx` so admins can open the exact workflow run directly.
