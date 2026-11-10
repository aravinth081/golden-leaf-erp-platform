# Golden Leaf Finance

A modern financial management and loan tracking web application built with React, TypeScript, Vite, Tailwind CSS, and Firebase.

## Features

- **Dashboard**: Real-time financial metrics, collections overview, and analytics
- **Customer & Loan Management**: Track borrowers, active loans, EMIs, and repayments
- **Collection History & Receipts**: Digital receipt generation with PDF export and print support
- **Role-based Access & Security**: Secure Firestore security rules and authentication
- **Multilingual Support**: Internationalization (i18n) support
- **Offline & PWA Ready**: Mobile-friendly PWA setup

## Tech Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS, Framer Motion
- **Backend / Services**: Firebase (Auth, Firestore, Storage)
- **State & Data**: Zustand, TanStack React Query
- **Utilities**: Lucide Icons, date-fns, jsPDF, Recharts

## Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Configuration
Create a `.env` file from `.env.example` and set your Firebase and Cloudinary credentials:
```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### 3. Run Development Server
```bash
npm run dev
```

### 4. Run Automated Security & RBAC Tests
```bash
npm test
```

### 5. Build for Production
```bash
npm run build
```

## Role Hierarchy & RBAC Architecture

### Hierarchy Ranks (Highest to Lowest)
1. **Super Admin** (`admin` - Rank 100): System master authority, company settings, billing, integrations, full management of all roles.
2. **HR & Payroll Finance Manager** (`hr_payroll_manager` - Rank 80): Corporate-wide HR & Payroll authority across **ALL branches**. Can manage staff of rank < 80 (Branch Manager and lower), initiate/approve segregated payroll runs, CTC builder with effective dating, statutory filings, F&F settlements, and finance expense clearances.
3. **Area Manager** (`area_manager` - Rank 70): Multi-branch cluster supervision.
4. **Branch Manager** (`branch_manager` - Rank 60): Single-branch operational supervisor. First-level manager approval on leave and branch expenses. Scoped strictly to own branch; **denied access** to salary/CTC, bank accounts, KYC vault, payroll runs, and hiring sandbox.
5. **Credit Manager** (`credit_manager` - Rank 50): KYC and loan risk underwriting.
6. **Finance & Accounts Officer** (`accountant` - Rank 45): Daily closing and accounts.
7. **Internal Auditor** (`auditor` - Rank 40): Independent inspection & audit trail logs.
8. **Operations Officer** (`operations_officer` - Rank 30): Daily branch collection reconciliations.
9. **Loan Officer** (`loan_officer` - Rank 25): Customer onboarding and loan processing.
10. **Recovery Officer** (`recovery_officer` - Rank 20): Route recovery and late collections.
11. **Customer Relationship Officer (CRO)** (`collection_agent` - Rank 10): Field collections and receipts.

### Institutional Role-Permission Matrix

| Module & Action | Super Admin (`admin`) | HR & Payroll Finance Manager (`hr_payroll_manager`) | Branch Manager (`branch_manager`) |
| :--- | :---: | :---: | :---: |
| **System Settings & Billing** | ✅ Full | ❌ Denied | ❌ Denied |
| **Role & Security Config** | ✅ Full | ❌ Denied | ❌ Denied |
| **User Account Provisioning** | ✅ All Roles | ✅ Branch Manager & Lower | ❌ Denied |
| **Branch Scope** | Company-Wide (All) | Company-Wide (All) | Own Branch Only |
| **Employee Master & KYC Vault** | ✅ Full | ✅ Full (All Branches) | ❌ Restricted |
| **Salary Revisions (Effective Dating)**| ✅ Full | ✅ Full (All Cycles) | ❌ Denied |
| **Payroll Runs (Maker: Initiate)** | ✅ Allowed | ✅ Allowed (`payroll.initiate`) | ❌ Denied |
| **Payroll Runs (Checker: Approve)** | ✅ Allowed (Segregated) | ✅ Allowed (Segregated) | ❌ Denied |
| **Self-Approval of Payroll/Bank** | ❌ Blocked (403) | ❌ Blocked (403) | ❌ Blocked (403) |
| **Bank Detail Revision Flow** | ✅ Maker / Checker | ✅ Maker / Checker | ❌ Denied |
| **NEFT/ACH Bank File Export** | ✅ Full | ✅ Full | ❌ Denied |
| **Statutory Filings (TDS/PF/ESI/PT)**| ✅ Full | ✅ Full | ❌ Denied |
| **Leave Approval** | ✅ Full | ✅ Company-Wide | ✅ 1st-Step (Own Branch) |
| **Full & Final (F&F) Settlement** | ✅ Checklist & Payout | ✅ Payout (Post-Checklist) | ❌ Denied |
| **F&F Checklist Verification** | ✅ IT/Admin Only | ❌ Blocked (Admin Required) | ❌ Denied |
| **Expense Approval** | ✅ Full | ✅ Step 2 (Finance/GL) | ✅ Step 1 (Manager/Branch) |
| **Hiring Sandbox & ESOP Tracking**| ✅ Full | ✅ Full / Read-Only | ❌ Denied |
| **Payroll GL Ledger Postings** | ✅ Full | ✅ Read-Only | ❌ Denied |
| **Period Lock Management** | ✅ Full | ✅ Full | ❌ Denied |
| **Immutable Audit Trail** | ✅ Read-Only | ✅ Append-Only Logs | ❌ Denied |

### Maker-Checker Segregation
All financial disbursements and bank revisions enforce strict server-level segregation of duties. The user who initiates a draft payroll run or creates a bank account change request cannot approve the same record. Self-approval attempts throw an explicit `403 Forbidden: Maker-Checker violation` error. This rule applies equally to Super Admins.

### HR & Payroll Finance Module Specification (Enterprise Controls)
- **Sub-Module 1: Employee Master & KYC Vault**: Digital onboarding vault (PAN, Aadhaar, Bank Details, Offer Letter) with real-time Background Verification (BGV) status tracking and departmental Cost Center mapping (Tech, Operations, Compliance, Sales).
- **Sub-Module 2: Flexible CTC & Payroll Engine**: Flexible CTC structure builder (Basic, HRA, Special Allowance, Variable Pay) separating fixed monthly burn from variable incentives; automated pro-rata calculations for joiners/leavers and RBI NEFT batch transfer export.
- **Sub-Module 3: Statutory Compliance Engine**: Automated Section 192 (Salaries) and Section 194J/194C (Contractor 10% / 1-2% withholding) tax computation; PF (ECR) & ESI contribution registers; Balance Sheet statutory liability tracking (Accounts 2110, 2120, 2100).
- **Sub-Module 4: Attendance, Leave & Terminal Settlements**: Direct LOP-to-payroll auto-deduction linkage; Accrued Leave Liability balance sheet provisions; Full & Final (F&F) settlements gated by a 3-step IT/Admin hardware and credential revocation check.
- **Sub-Module 5: Two-Step Reimbursement Workflow**: Multi-level claim approvals (Branch Manager Step 1 → Finance Step 2); GL code tagging (`GL-6101`, `GL-6102`, `GL-6103`); automated 18% GST Input Tax Credit (ITC) qualification.
- **Automated General Ledger 5-Account Posting Template**:
  - `5100`: Salaries & Wages Expense (Dr) [GrossCTC tagged by Cost Center]
  - `5120`: Employer Statutory Contribution Expense (Dr) [EmployerContrib PF/ESI]
  - `To 2110`: TDS / Withholding Income Tax Payable (Cr) [TaxDeducted]
  - `To 2120`: Provident Fund & Statutory Dues Payable (Cr) [TotalPF_ESI]
  - `To 2100`: Net Salaries Payable / Bank Clearing (Cr) [NetTakeHome]
- **Interactive Hiring Sandbox**: Real-time runway and burn-rate modeler simulating prospective headcount additions and cash runway impact.

