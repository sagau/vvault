# VVAULT – Role-Based SaaS Dashboard App

VVAULT is a multi-tenant, role-based web application designed to provide secure dashboards for companies, admins, and vendors. The goal of the app is to combine security, collaboration, and scalability into a single streamlined platform.

## Core Goals

- **Role-based access control (RBAC)**: Users sign in with Firebase Auth and are granted roles (superAdmin, admin, vendor) through custom claims. Each role unlocks a unique dashboard experience with tailored permissions.
- **Company isolation**: All company data is sandboxed to ensure no cross-company data leaks, supporting a scalable multi-tenant structure.
- **Collaboration workflows**: Companies can manage jobs and tasks, share files with vendors, and track vendor acknowledgments in real time.
- **Security first**: Firestore security rules enforce least privilege by role and company ID, with tests (checkRules.js) validating access.
- **Developer productivity**: Includes reset/seed scripts to bootstrap data and consistent layouts for SuperAdmin, Admin, and Vendor dashboards.

## High-Level Feature Set

- **SuperAdmin**: manage companies, assign admins, oversee all data.
- **Admin**: manage jobs, tasks, vendors, and file sharing within their company.
- **Vendor**: access tasks and shared files securely, with a simple dashboard UI.
- **Global**: file repository (Firestore + Firebase Storage), job/task management, secure messaging.

## Getting Started

1. Clone the repo: `git clone https://github.com/sagau/vvault.git`
2. Install dependencies: `npm install`
3. Set up Firebase: Add `serviceAccountKey.json` and `.env` with `COMPANY_ID`, `SUPERADMIN_UID`, etc.
4. Run the app: `npm run dev`
5. Seed data: `npm run reset`

This gives a clear mission statement and helps onboard contributors, team, or investors.
