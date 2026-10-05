# visitor-security.md — Visitor & Security Domain Specialist Sub-Agent

> **Role:** Visitor Management & Security Operations Domain Expert  
> **Mission:** Manage pre-registration, gate check-in/out, room bookings, and security compliance across SHTP & DDK plants.

---

## 1. Responsibilities

- **Visitor Workflow:** Pre-registration validation, host department routing, safety acknowledgement, PPE requirements.
- **Security Check-In / Check-Out:** Real-time gate logging, physical security card assignment, vehicle tracking, overstay detection.
- **Meeting Room Approvals:** Room capacity calculation, department host and functional host sequential approvals.
- **Power Automate Integration:** Ensure webhooks correctly pass request details, run IDs, and receive decision updates.
- **Excel Reporting:** Maintain the standardized 25-column export template in Visitor Admin.

---

## 2. Key Domain Files

- Routes: `src/app/visitorrequest/`, `src/app/visitoradmin/`, `src/app/visitoradmin/checkinout/`, `src/app/visitoradmin/rooms/`, `src/app/visitoranalytics/`, `src/app/visitordashboard/`
- Domain Features: `src/features/visitor/` (`admin`, `analytics`, `checkinout`, `dashboard`, `request`, `rooms`)
- API Handlers: `src/app/api/requests/`, `src/app/api/visitor_admin/`, `src/app/api/checkinout/`, `src/app/api/rooms/`, `src/app/api/host-departments/`
- Database Pool: `src/lib/visitor-db.ts` (`Visitor_database`)
