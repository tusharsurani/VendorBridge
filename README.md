# VendorBridge

VendorBridge is a modern, smart procurement ERP designed to streamline vendor management, RFQs, approvals, purchase orders, and invoicing—all in one centralized platform.

## Features

*   **Role-Based Access Control:** Secure access tailored for different roles:
    *   **Admin:** Full system access, activity logs, and reporting.
    *   **Manager:** Approvals, high-level overview, and reporting.
    *   **Procurement Officer:** Manage vendors, RFQs, POs, and Invoices.
    *   **Vendor:** Submit quotations, view assigned POs, and manage their profile.
*   **Vendor Management:** Onboard, track, and manage vendor relationships and performance.
*   **RFQ (Request for Quotation):** Create and publish RFQs to invite bids from vendors.
*   **Quotation Comparison:** Easily compare received quotations to make informed decisions.
*   **Approval Workflows:** Structured approval processes for quotes and vendors.
*   **Purchase Orders (POs):** Generate, track, and manage purchase orders seamlessly.
*   **Invoicing:** Manage GST-compliant invoices with automated tax calculations and tracking.
*   **Analytics & Reports:** Gain insights into procurement spend and vendor performance.

## Tech Stack

*   **Frontend:** React, TypeScript, Vite
*   **Styling:** Tailwind CSS, shadcn/ui
*   **Routing:** React Router
*   **State Management & Data Fetching:** Zustand, React Query (@tanstack/react-query)
*   **Backend & Database:** Supabase (PostgreSQL, Authentication, Row Level Security)
*   **PDF Generation:** @react-pdf/renderer
*   **Icons:** Lucide React

## Getting Started

### Prerequisites

*   Node.js (v18 or higher)
*   npm or yarn
*   A Supabase project

### Installation & Setup

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/tusharsurani/VendorBridge.git
    cd VendorBridge
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Environment Configuration:**
    Create a `.env` file in the root directory and add your Supabase credentials:
    ```env
    VITE_SUPABASE_URL=your_supabase_project_url
    VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
    ```

4.  **Database Setup:**
    Execute the SQL scripts found in the `supabase/` directory in your Supabase SQL editor to set up the schema, roles, and Row Level Security (RLS) policies.
    *   Run `supabase/migration.sql` for the initial schema setup.
    *   Run `supabase/patch_manager_role.sql` if you need to patch an existing database to grant Manager roles appropriate access.

5.  **Start the development server:**
    ```bash
    npm run dev
    ```
    The application will be available at `http://localhost:5173`.

## Demo Accounts

The login page provides quick access demo accounts to test different role capabilities without needing to sign up:

*   **Admin:** `admin@vendorbridge.com`
*   **Procurement Officer:** `officer@vendorbridge.com`
*   **Manager:** `manager@vendorbridge.com`
*   **Vendor:** `vendor@techsupply.com`

*Note: Passwords are automatically filled when selecting a demo account card.*

## License

This project is proprietary.
