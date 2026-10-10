# ACP Mobile App - Final Task Execution List

## 1. Real-Time Push & Status Notifications
- [x] Wire job status notifications (Assigned, Started, Completed, Payment Received) to Customer app.
- [x] Wire job assignment alerts to Technician app.
- [x] Wire new booking & payment alerts to Admin app.

## 2. Network Error Message Polish
- [x] Update `api.js` error interceptor to show `"No internet connection. Please check your network and try again."` on network failure.

## 3. Dynamic Service Pricing & Live Calculation
- [x] Add `basePrice` and `perTonAddon` fields to Admin Services (`AdminServicesScreen.js`).
- [x] Implement live price calculator in `CustomerBookingScreen.js` based on AC Ton capacity and units.

## 4. Admin Sub-Tabs & Phone Gallery Image Picker
- [x] Add AC Products Sub-Tab (Add, Edit, Delete).
- [x] Add AC Services Sub-Tab (Add, Edit, Delete).
- [x] Integrate `expo-image-picker` gallery image selection for Admin Product & Service photo uploads.

## 5. Admin Customer Management & Job Dispatch
- [x] Add Customer Modal in `AdminCustomersScreen.js`.
- [x] Add "Create Job & Assign Technician" action on customer cards.

## 6. Technician Work Completion & Admin Payment Approval
- [x] Maintain Technician job completion flow with evidence photos.
- [x] Add Admin **"Approve Payment / Received"** action to update status to `Paid & Completed`.

## 7. Strict Form Validation
- [x] Enforce Step 1, Step 2, Step 3 validation in `CustomerBookingScreen.js`.
- [x] Enforce Product Buy Form validation in `CustomerProductsScreen.js`.
- [x] Enforce Admin input validations across all forms.

## 8. Deployment & EAS Build
- [ ] Commit all files to Git.
- [ ] Push to GitHub `main` branch.
- [ ] Trigger EAS build for final Android preview APK.
