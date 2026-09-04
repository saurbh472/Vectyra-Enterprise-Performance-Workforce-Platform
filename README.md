<div align="center">

# 🔷 V E C T Y R A
### Team Roadmaps • Task Execution • 360° Talent Intelligence

![Vectyra Hero Banner](./vectyra_banner.jpg)

<p align="center">
  <img src="https://img.shields.io/badge/Node.js-20.x-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/Express.js-4.x-000000?style=for-the-badge&logo=express&logoColor=white" alt="Express" />
  <img src="https://img.shields.io/badge/PostgreSQL-16-4169E1?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/Docker-Ready-2496ED?style=for-the-badge&logo=docker&logoColor=white" alt="Docker" />
  <img src="https://img.shields.io/badge/Security-RBAC%20%2B%20JWT-critical?style=for-the-badge" alt="Security" />
</p>

</div>

---

## 🌟 Overview

**Vectyra** is a unified, enterprise-grade Performance & Execution Operating System that bridges the gap between **strategic team roadmaps**, **on-the-ground task execution**, and **confidential 360° employee appraisals**.

Designed for high-velocity engineering, product, and cross-functional teams, Vectyra replaces fragmented spreadsheets and basic survey forms with a centralized, data-driven intelligence hub.

---

## ✨ Key Features

### 🗺️ 1. Team Strategic Roadmaps & Task Execution
* **Quarterly Roadmap Management:** Managers and leadership plan roadmaps across Q1–Q4 with strategic milestones.
* **Deliverable Breakdown & Assignments:** Break milestones down into actionable tasks, assign individual owners, set priorities (Low, Medium, High, Critical), and track deadlines.
* **Granular Task Statuses:** Team members advance tasks in real-time (`To Do`, `In Progress`, `Under Review`, `Completed`, `Blocked`).

### 🎯 2. Confidential 360° Appraisal Engine
* **Role-Isolated Executive Feedback Routing:**
  * Feedback submitted for **Super Admin** is routed **strictly to HR** (hidden from Super Admin to eliminate bias).
  * Feedback submitted for **HR** is routed **strictly to Super Admin** (hidden from HR).
  * All other reviews across the organization are accessible by both Super Admin and HR.
* **Multi-Angle Reviews:** Self-assessments, peer reviews, direct manager evaluations, and cross-functional ratings.
* **My Submissions Vault:** Employees and managers can privately review everything they have submitted without exposing company-wide peer ratings.

### 📊 3. Technical Skill Matrix & Competency Radars
* **Domain-Specific Skill Mapping:** Tailored competency benchmarks for specialized teams (SDN Controller, Core 5G, Backend Platform, QA, Product, HR).
* **Multi-Level Scoring:** 1 to 5 competency evaluations (Beginner to Subject Matter Expert).

### 📈 4. Executive Analytics & Health Hub
* **Real-time KPI Scorecards:** Active reviews, roadmap health velocity, eNPS scores, and feedback volume.
* **Interactive Competency Radar:** Visual radar charts highlighting organizational strengths and training opportunities.
* **Department Benchmark Matrix:** Comparison of engagement, roadmap delivery speed, and competency ratings by department.

---

## 🔒 Role-Based Access Control (RBAC)

| Capability / Module | Employee 👤 | Manager 🏆 | Admin (HR) ⚙️ | Super Admin 👑 |
| :--- | :---: | :---: | :---: | :---: |
| **Submit 360° Feedback** | ✅ | ✅ | ✅ | ✅ |
| **View Own Submissions** | ✅ (Own Only) | ✅ (Own Only) | ✅ (Own Only) | ✅ (Own Only) |
| **Feedback for Super Admin** | ❌ Blocked | ❌ Blocked | ✅ **Routed to HR** | ❌ **Hidden** |
| **Feedback for HR (Admin)** | ❌ Blocked | ❌ Blocked | ❌ **Hidden** | ✅ **Routed to Super Admin** |
| **Team Roadmaps & Tasks** | ✅ (Own Team) | ✅ (Managed Teams) | ✅ **All Teams (Read-Only)** | ✅ **All Teams (Full Control)** |
| **Create Roadmaps & Assign Tasks** | ❌ Blocked | ✅ **Own Team** | ❌ **Read-Only** | ✅ **All Teams** |
| **Update Assigned Task Progress** | ✅ (Own Tasks) | ✅ | ❌ **Read-Only** | ✅ |
| **User & Account Provisioning** | ❌ Blocked | ❌ Blocked | ✅ | ✅ |
| **Executive Analytics Hub** | ❌ Blocked | ❌ Blocked | ✅ | ✅ |

---

## 🚀 Quick Start & Deployment

### 🐳 Option A: Docker Compose (Recommended for VMs / Production)

Deploy unified single-container frontend/backend with persistent PostgreSQL:

```bash
# 1. Build and start containers in the background
docker compose up -d --build

# 2. View running logs
docker compose logs -f app
```

Access the portal on any machine in your network at:
`http://<YOUR_VM_IP>:3000`

---

### 💻 Option B: Local Development

```bash
# 1. Install dependencies
npm install

# 2. Configure environment in .env
PORT=3000
DATABASE_URL=postgres://postgres:postgres@localhost:5432/vectyra
JWT_SECRET=your_jwt_secret

# 3. Start the server
npm run dev
```

---

## 🔑 Default Super Admin Credentials

* **Email:** `saurabhsharma@niralnetworks.in`
* **Password:** `superadmin`

---

## 📄 License & Attribution

Internal Enterprise Platform — Built with Node.js, Express, PostgreSQL, and Modern CSS.
