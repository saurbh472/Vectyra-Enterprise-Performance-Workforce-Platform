# Vectyra — Team Roadmaps, Task Execution & 360° Talent Intelligence Setup & Security Guide

Welcome to **Vectyra**, your company's unified platform for Team Roadmaps, Task Execution, and 360° Talent Appraisals powered by **PostgreSQL** & **Node.js Express**.

---

## 🔒 Security Architecture & Role-Based Access Control (RBAC)

Security and employee privacy are strictly enforced at **both** the backend REST API layer and frontend UI layer:

### Role Permissions Matrix:

| Feature / Page | Employee 👤 | Manager 🏆 | Admin (HR) ⚙️ | Super Admin 👑 |
| :--- | :---: | :---: | :---: | :---: |
| **Submit Feedback (Self, Peers, Managers, HR)** | ✅ | ✅ | ✅ | ✅ |
| **View Own Submissions ("My Submissions")** | ✅ (Only Own) | ✅ (Only Own) | ✅ (Only Own) | ✅ (Only Own) |
| **Feedback for Super Admin** | ❌ Blocked | ❌ Blocked | ✅ **Routed to HR Only** | ❌ **Hidden from Super Admin** |
| **Feedback for HR (Admin)** | ❌ Blocked | ❌ Blocked | ❌ **Hidden from HR** | ✅ **Routed to Super Admin Only** |
| **Feedback for Employees & Managers** | ❌ Blocked | ❌ Blocked | ✅ Visible | ✅ Visible |
| **Company-Wide Feedback Oversight** | ❌ Blocked | ❌ Blocked | ✅ | ✅ |
| **Analytics & Sentiment Charts** | ❌ Blocked | ❌ Blocked | ✅ | ✅ |
| **View Team Roadmaps & Tasks** | ✅ (Own Team) | ✅ (Managed Teams) | ✅ **All Teams (Read-Only)** | ✅ **All Teams** |
| **Create / Edit Roadmaps** | ❌ Blocked | ✅ **Own Team** | ❌ **Blocked (Read-Only)** | ✅ **All Teams** |
| **Assign / Edit Tasks to Members** | ❌ Blocked | ✅ **Own Team** | ❌ **Blocked (Read-Only)** | ✅ **All Teams** |
| **Update Assigned Task Status & %** | ✅ (Own Tasks) | ✅ | ❌ **Blocked (Read-Only)** | ✅ |
| **User Provisioning (Create User)** | ❌ Blocked | ❌ Blocked | ✅ | ✅ |
| **Teams & Department Admin** | ❌ Blocked | ❌ Blocked | ✅ | ✅ |
| **Org Chart & Directory** | ❌ Blocked | ❌ Blocked | ✅ | ✅ |

### Dual-Layer Security & Dynamic Feedback & Roadmap Routing Safeguards:
1. **Team Roadmap & Task Execution Architecture**:
   - **Managers**: Can create quarterly roadmaps for their team, break them down into tasks, and assign deliverables to individual team members with priorities and deadlines.
   - **Super Admin**: Has unrestricted authority to view, create, edit, assign, and delete roadmaps and tasks across all teams.
   - **HR (`admin`)**: Has **company-wide read-only visibility** to monitor roadmaps across all teams (who is assigned what and when), but **cannot modify, create, or delete** any roadmaps or tasks.
   - **Team Members (Employees)**: Can view their team's roadmaps and deliverables assigned to them, and advance their task status/progress.
2. **Confidential Executive Feedback Routing**:
   - Feedback submitted for **Super Admin** is routed **strictly to HR** (hidden from Super Admin to eliminate bias).
   - Feedback submitted for **HR** is routed **strictly to Super Admin** (hidden from HR).
   - All other feedback across the organisation is viewable by **both Super Admin and HR**.
3. **Manager & Employee Privacy Boundary**:
   - Managers, Team Leads, and Employees can submit feedback for themselves, peers, and leaders.
   - Company ratings and other employees' evaluations are strictly blocked from their view; they can only view their own submissions under "My Submissions".
3. **JWT & Bcrypt Authentication**: Users authenticate via secure JSON Web Tokens (JWT). Passwords are encrypted with `bcryptjs`.
4. **SuperAdmin Account Provisioning**: Self-registration is removed. Accounts are provisioned by SuperAdmins/Admins from the **User Management** panel.
5. **Backend RBAC Middleware**: Server endpoints strictly enforce permissions based on token claims and database role checks.

---

## 🚀 Running the Server with PostgreSQL

### Step 1: Install Dependencies
Open terminal in the project directory and run:
```bash
npm install
```

### Step 2: Configure Environment (Optional for Local PostgreSQL)
Set environment variables or create a `.env` file:
```env
PORT=3000
DATABASE_URL=postgres://postgres:postgres@localhost:5432/vectyra
JWT_SECRET=your_secure_jwt_secret_key
```

### Step 3: Start the Server
```bash
npm start
```
The application will launch on `http://localhost:3000`.

---

## 👑 Default Super Admin Credentials

When the server starts for the first time, it initializes default accounts:

- **Email**: `superadmin@company.com`
- **Password**: `demo123`

You can sign in with these credentials, navigate to **User Management** (`/users`), and click **"+ Create New User Account"** to provision credentials for your team members!
