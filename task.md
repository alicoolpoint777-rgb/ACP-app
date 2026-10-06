# ACP Mobile App - Final Audit & Technician Integration Task Plan

## 1. Technician App Audit & Backend Integration
- [x] **TechnicianJobsScreen.js**
  - [x] Remove hardcoded dummy jobs fallback.
  - [x] Fetch live assigned bookings from `GET /api/bookings` (filtered by technician role).
  - [x] Add Pull-to-refresh & clean empty state for technicians with no assigned jobs.
- [x] **TechnicianJobDetailsScreen.js**
  - [x] Wire job status updates (`assigned` -> `in_progress` -> `completed`).
  - [x] Wire evidence photo upload / proof of work (before/after images) before completion.
  - [x] Wire customer phone call & location navigation actions.
- [x] **TechnicianTasksScreen.js**
  - [x] Connect daily checklist / task list to live backend database endpoints (`/api/tasks`).
  - [x] Update task completion state in real-time.
- [x] **TechnicianProfileScreen.js**
  - [x] Wire profile details & live performance stats (Completed Jobs, Total Earnings, Rating, Reviews).
  - [x] Wire Status Toggle (Status: Available / Active vs Status: On Leave via `PATCH /api/technicians/me/status`).

## 2. Admin App & Revenue Flow Audit
- [x] **AdminRequestsScreen.js**
  - [x] Verify dispatching booking to a technician updates `assignedTechnician` and sets `status` to `'assigned'`.
  - [x] Support assigning and reassigning technicians across pending, confirmed, and assigned bookings.
- [x] **AdminTechniciansScreen.js**
  - [x] Verify technician creation (`POST /api/technicians`) sets email, phone, password, and employee ID properly.
- [x] **AdminDashboardScreen.js**
  - [x] Verify Revenue calculation correctly includes `completed` service bookings AND AC product sales.
  - [x] Verify stats cards update dynamically with live database values.

## 3. Customer App Flow Verification
- [x] **CustomerBookingScreen.js & CustomerProductsScreen.js**
  - [x] Ensure booking creation (`POST /api/bookings`) and AC purchases (`POST /api/purchases`) persist correctly in MongoDB.
- [x] **CustomerOrdersScreen.js & CustomerRequestsScreen.js**
  - [x] Combine service bookings and AC product purchases in customer order tracking.

## 4. End-to-End Verification & Build
- [x] Test complete lifecycle: Admin creates Tech -> Tech logs in -> Tech sees job -> Tech completes job -> Revenue updates on Admin Dashboard.
- [ ] Commit all code changes to GitHub repository `alicoolpoint777-rgb/ACP-app`.
- [ ] Launch EAS Android preview build and get downloadable APK URL.
