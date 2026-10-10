# ACP Mobile App - Final Production Plan

## 1. Real-Time Push & Status Notifications (Customer, Technician, Admin)
- **Customer Notifications**:
  - Receive real-time notification when Admin assigns a Technician ("Technician Asif Khan assigned to your booking #ACR-XXX").
  - Receive notification when Technician starts work ("Technician has started work").
  - Receive notification when Job is Completed ("Work finished, please rate your technician").
  - Receive notification when Payment is Approved ("Payment received: Paid & Completed").
- **Technician & Admin Notifications**:
  - Technician receives alert when new job is assigned.
  - Admin receives alert when new customer order landed or job completed.

## 2. Production Friendly Network Error Messages
- **Global Network Error Handling (`api.js`)**:
  - Replace technical server URL timeouts with clean user-friendly text: `"No internet connection. Please check your network and try again."` when offline or disconnected.

## 3. Dynamic Service Pricing & Live Calculation
- **Admin Service Pricing Control**:
  - Add `basePrice` (for 1.0 Ton / 1 unit) and `perTonAddon` buffer to Service model & Admin form.
- **Customer Live Price Calculation**:
  - Automatically calculate and display estimated service cost `Rs XXXX` in real-time as customer selects AC capacity (1.0 Ton, 1.5 Ton, 2.0 Ton) or units in `CustomerBookingScreen.js`.
- **Dynamic Real-Time Sync**:
  - Any new Service or Product added by Admin immediately appears on Customer App in real time.

## 4. Admin Products & Services Management Sub-Tabs + Gallery Image Picker
- **Dedicated Sub-Tabs**:
  - Separate sub-tabs for AC Products (List/Add/Edit/Delete) and AC Services (List/Add/Edit/Delete).
- **Gallery Image Selection (`expo-image-picker`)**:
  - Enable picking photos directly from device camera roll / gallery for both products and services (with URL fallback).

## 5. Admin Customer Management & Job Dispatch
- **Add Customer Modal**:
  - Admin can add new customers manually (Name, Phone, Email, Address, Company).
- **Direct Job Creation & Technician Assignment**:
  - Admin can click "Create Job & Assign Tech" directly on any customer card, enter service details, pick a technician, and dispatch immediately.

## 6. Technician Execution & Admin Payment Approval
- **Field Job Execution**:
  - Technician starts job (`status = 'in_progress'`), uploads evidence photos, and marks physical work complete (`status = 'completed'`).
- **Admin Payment Approval**:
  - Admin verifies payment and taps **"Approve Payment / Received"** (`paymentStatus = 'paid'`).
- **Customer Status View**:
  - Customer order updates to **"Paid & Completed"**.

## 7. Strict Form Validation Across All Forms
- Enforce mandatory validation on Booking steps, Product Buy form, and Admin forms so no form can be submitted empty or without required fields.
