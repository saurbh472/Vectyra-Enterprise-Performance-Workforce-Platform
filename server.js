const express = require('express');
const cors = require('cors');
const path = require('path');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

process.on('unhandledRejection', (reason) => {
  console.warn('⚠️ Unhandled Rejection caught:', reason?.message || reason);
});

process.on('uncaughtException', (err) => {
  console.warn('⚠️ Uncaught Exception caught:', err.message);
});

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);
const HOST = process.env.HOST || '0.0.0.0';
const JWT_SECRET = process.env.JWT_SECRET || 'vectyra_super_secret_jwt_key_2026';

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// ═══════════════════════════════════════════════════════════════════════
// POSTGRES DB CONNECTION POOL & IN-MEMORY STORE FALLBACK
// ═══════════════════════════════════════════════════════════════════════
const pgConfig = {
  connectionString: process.env.DATABASE_URL,
  host: process.env.PGHOST || 'localhost',
  port: parseInt(process.env.PGPORT || '5432', 10),
  user: process.env.PGUSER || 'postgres',
  password: process.env.PGPASSWORD || 'postgres',
  database: process.env.PGDATABASE || 'vectyra',
  ssl: process.env.PGSSL === 'true' ? { rejectUnauthorized: false } : false,
  connectionTimeoutMillis: 5000,
  idleTimeoutMillis: 30000
};

// ═══════════════════════════════════════════════════════════════════════
// HARDCODED DEFAULT SUPER ADMIN CREDENTIALS & IDEMPOTENT CREATION
// ═══════════════════════════════════════════════════════════════════════
const HARDCODED_SUPERADMIN_EMAIL = 'admin@gmail.com';
const HARDCODED_SUPERADMIN_PASS  = 'superadmin';
const HARDCODED_SUPERADMIN_NAME  = 'Super Admin';

let pool = null;
let usePg = false;

// Fallback in-memory state if Postgres is not configured/accessible
let memDepartments = [
  { id: 'd1', name: 'Engineering', created_at: new Date().toISOString() },
  { id: 'd2', name: 'Product & Design', created_at: new Date().toISOString() },
  { id: 'd3', name: 'Human Resources', created_at: new Date().toISOString() },
  { id: 'd4', name: 'Marketing & Sales', created_at: new Date().toISOString() },
  { id: 'd5', name: 'Customer Support', created_at: new Date().toISOString() }
];

let memTeams = [
  { id: 't-qa', name: 'Quality Assurance & Testing', department: 'Engineering', manager_id: 'u2', created_at: new Date().toISOString() },
  { id: 't1', name: 'Frontend Engineering', department: 'Engineering', manager_id: 'u2', created_at: new Date().toISOString() },
  { id: 't2', name: 'Backend Platform', department: 'Engineering', manager_id: 'u2', created_at: new Date().toISOString() },
  { id: 't3', name: 'Product Experience', department: 'Product & Design', manager_id: 'u2', created_at: new Date().toISOString() },
  { id: 't4', name: 'HR Operations', department: 'Human Resources', manager_id: 'u3', created_at: new Date().toISOString() },
  { id: 't5', name: 'Growth Marketing', department: 'Marketing & Sales', manager_id: 'u2', created_at: new Date().toISOString() }
];

let memProfiles = [];
let memFeedback = [];
let memCycles = [
  { id: 'c1', title: 'Q3 2026 Performance Review', start_date: '2026-07-01', end_date: '2026-09-30', status: 'active', created_at: new Date().toISOString() },
  { id: 'c2', title: 'H1 2026 Annual Assessment', start_date: '2026-01-01', end_date: '2026-06-30', status: 'completed', created_at: new Date().toISOString() }
];

let memQuarterlyReviews = [
  {
    id: 'qr-seed-1',
    employee_id: 'u-superadmin-default',
    manager_id: 'u-superadmin-default',
    team_id: 't2',
    quarter: 'Q2 (April - July)',
    year: 2026,
    status: 'reviewed',
    is_unlocked: false,
    overall_score: 4.90,
    created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
    self_review_data: {
      months: [
        { month: 'April, 2026', targets: ['Master Core Platform architecture'], contributions: ['Integrated ELK & Observability Stack'], topContribution: { targetResult: '100% ELK logs integrated', goodPractice: 'Modular service separation', lessonLearnt: 'Distributed platform flow' } },
        { month: 'May, 2026', targets: ['REST API Gateway integration'], contributions: ['Refactored RBAC code'], topContribution: { targetResult: '40% latency reduction', goodPractice: 'Pair review', lessonLearnt: 'Keycloak token caching' } },
        { month: 'June, 2026', targets: ['PostgreSQL & Caching research'], contributions: ['Verified RBAC statistics'], topContribution: { targetResult: 'Query indexing verified', goodPractice: 'Automated test suites', lessonLearnt: 'Partition management' } },
        { month: 'July, 2026', targets: ['Database scalability improvements'], contributions: ['Designed system architecture'], topContribution: { targetResult: 'Multi-site support finalized', goodPractice: 'E2E tests', lessonLearnt: 'High availability clustering' } }
      ],
      goalsForNextQuarter: '• Complete and stabilize Kubernetes cloud deployment.\n• Improve observability with Prometheus.',
      areasOfImprovement: '• Deepen cloud-native architecture & Kubernetes orchestration knowledge.',
      suggestions: '• Regular knowledge-sharing sessions for backend engineering.',
      managerFeedback: 'Exceptional strategic direction and platform leadership across all quarterly initiatives.'
    },
    kpi_data: [
      { id: 'kpi1', name: 'Timeline Adherence', selfRating: 5, example: 'Delivered all sprint deliverables on time.', challenges: 'None', managerRating: 5, managerComments: 'Flawless execution.' },
      { id: 'kpi2', name: 'Initiative Taking', selfRating: 5, example: 'Spearheaded ELK stack logging and RBAC token caching.', challenges: 'None', managerRating: 5, managerComments: 'Proactive leadership.' }
    ],
    skill_matrix_data: [
      { id: 'st-1', category: 'Topics', skill_name: 'Design Pattern', selfRating: 5, comments: 'Extensive use of Gang of Four patterns', trainingRequired: 'NO', managerRating: 5 },
      { id: 'st-2', category: 'Topics', skill_name: 'Schema Designing', selfRating: 5, comments: 'Designed scalable multi-tenant Postgres schema', trainingRequired: 'NO', managerRating: 5 }
    ]
  },
  {
    id: 'qr-seed-2',
    employee_id: 'u4',
    manager_id: 'u2',
    team_id: 't1',
    quarter: 'Q1 (Jan - March)',
    year: 2026,
    status: 'reviewed',
    is_unlocked: false,
    overall_score: 4.80,
    created_at: new Date(Date.now() - 120 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
    self_review_data: {
      months: [
        { month: 'January, 2026', targets: ['Build UI Component library'], contributions: ['Created 15 reusable design tokens'], topContribution: { targetResult: 'UI consistency achieved', goodPractice: 'Atomic CSS tokens', lessonLearnt: 'Design system modularity' } },
        { month: 'February, 2026', targets: ['Optimize bundle size'], contributions: ['Implemented code splitting with Vite'], topContribution: { targetResult: 'Bundle size reduced by 35%', goodPractice: 'Lazy loading routes', lessonLearnt: 'Tree shaking techniques' } },
        { month: 'March, 2026', targets: ['Web Accessibility compliance'], contributions: ['Passed ARIA accessibility audit'], topContribution: { targetResult: 'WCAG 2.1 AA certified', goodPractice: 'Screen reader testing', lessonLearnt: 'Focus ring management' } }
      ],
      goalsForNextQuarter: '• Expand React component test coverage with Jest and Cypress.\n• Optimize Core Web Vitals.',
      areasOfImprovement: '• Deepen state management optimization for large data tables.',
      suggestions: '• Shared design token repository across frontend teams.',
      managerFeedback: 'Marcus has shown outstanding growth in UI component architecture and frontend performance.'
    },
    kpi_data: [
      { id: 'kpi1', name: 'Quality of Work', selfRating: 5, example: 'Zero regression defects reported in Q1 release.', challenges: 'None', managerRating: 5, managerComments: 'Very high code quality.' }
    ],
    skill_matrix_data: [
      { id: 'st-f1', category: 'Framework', skill_name: 'ReactJS Component Architecture & Hooks', selfRating: 5, comments: 'Expert level custom hooks', trainingRequired: 'NO', managerRating: 5 }
    ]
  }
];
let memSkillTemplates = [
  // ═══════════════════════════════════════════════════════════════════════
  // MASTER TEMPLATE 1: QA / QUALITY ASSURANCE & TESTING TEMPLATE
  // ═══════════════════════════════════════════════════════════════════════
  // 1. Programming Understanding for Tools Development
  { id: 'st-qa-1', template_name: 'QA / Quality Assurance & Testing Template', team_id: 't-qa', category: 'Programming Understanding for Tools Development', skill_name: 'Data Structures & Algorithms', scope: 'Tools & Automation', is_backend: true, is_frontend: true },
  { id: 'st-qa-2', template_name: 'QA / Quality Assurance & Testing Template', team_id: 't-qa', category: 'Programming Understanding for Tools Development', skill_name: 'Java and Python based tools development', scope: 'Automation Framework', is_backend: true, is_frontend: true },
  { id: 'st-qa-3', template_name: 'QA / Quality Assurance & Testing Template', team_id: 't-qa', category: 'Programming Understanding for Tools Development', skill_name: 'Git Management', scope: 'Version Control', is_backend: true, is_frontend: true },
  { id: 'st-qa-4', template_name: 'QA / Quality Assurance & Testing Template', team_id: 't-qa', category: 'Programming Understanding for Tools Development', skill_name: 'Github Copilot/Claude (AI tools)', scope: 'AI Productivity', is_backend: true, is_frontend: true },

  // 2. Linux & System Administration
  { id: 'st-qa-5', template_name: 'QA / Quality Assurance & Testing Template', team_id: 't-qa', category: 'Linux & System Administration', skill_name: 'Linux Commands, Linux Networking', scope: 'OS & Systems', is_backend: true, is_frontend: false },
  { id: 'st-qa-6', template_name: 'QA / Quality Assurance & Testing Template', team_id: 't-qa', category: 'Linux & System Administration', skill_name: 'Shell Scripting', scope: 'Scripting & Automation', is_backend: true, is_frontend: false },

  // 3. Networking Fundamentals (Concept and Configuration)
  { id: 'st-qa-7', template_name: 'QA / Quality Assurance & Testing Template', team_id: 't-qa', category: 'Networking Fundamentals (Concept and Configuration)', skill_name: 'TLS Handshake, IPSEC (IP Security)', scope: 'Security & Cryptography', is_backend: true, is_frontend: false },
  { id: 'st-qa-8', template_name: 'QA / Quality Assurance & Testing Template', team_id: 't-qa', category: 'Networking Fundamentals (Concept and Configuration)', skill_name: 'Routing, VLAN (IP Routing Eco System)', scope: 'Network Protocols', is_backend: true, is_frontend: false },
  { id: 'st-qa-9', template_name: 'QA / Quality Assurance & Testing Template', team_id: 't-qa', category: 'Networking Fundamentals (Concept and Configuration)', skill_name: 'DNS, DHCP, NAT, IPV4/IPV6, TCP/IP, UDP, OSI Model (IP Eco System)', scope: 'Core Networking', is_backend: true, is_frontend: false },

  // 4. 5G Core & 3GPP Standards (Architecture and Configuration)
  { id: 'st-qa-10', template_name: 'QA / Quality Assurance & Testing Template', team_id: 't-qa', category: '5G Core & 3GPP Standards (Architecture and Configuration)', skill_name: '3GPP Standards & Architecture', scope: '5G Core, Telecom', is_backend: true, is_frontend: false },
  { id: 'st-qa-11', template_name: 'QA / Quality Assurance & Testing Template', team_id: 't-qa', category: '5G Core & 3GPP Standards (Architecture and Configuration)', skill_name: 'QoS Concepts, Network Slicing', scope: '5G Slicing & Performance', is_backend: true, is_frontend: false },
  { id: 'st-qa-12', template_name: 'QA / Quality Assurance & Testing Template', team_id: 't-qa', category: '5G Core & 3GPP Standards (Architecture and Configuration)', skill_name: 'SBA (Service Based Architecture), NiraOS Core Message Build, Handler and IE', scope: '5G Architecture', is_backend: true, is_frontend: false },
  { id: 'st-qa-13', template_name: 'QA / Quality Assurance & Testing Template', team_id: 't-qa', category: '5G Core & 3GPP Standards (Architecture and Configuration)', skill_name: 'Procedures for registration, pdu session, handover', scope: '5G Call Flows', is_backend: true, is_frontend: false },
  { id: 'st-qa-14', template_name: 'QA / Quality Assurance & Testing Template', team_id: 't-qa', category: '5G Core & 3GPP Standards (Architecture and Configuration)', skill_name: '5G Protocols like NAS, NGAP, PFCP, GTP, SCTP', scope: '5G Protocols', is_backend: true, is_frontend: false },
  { id: 'st-qa-15', template_name: 'QA / Quality Assurance & Testing Template', team_id: 't-qa', category: '5G Core & 3GPP Standards (Architecture and Configuration)', skill_name: 'REST API and JSON', scope: 'API Specs', is_backend: true, is_frontend: true },
  { id: 'st-qa-16', template_name: 'QA / Quality Assurance & Testing Template', team_id: 't-qa', category: '5G Core & 3GPP Standards (Architecture and Configuration)', skill_name: 'NEF, CHF, NWDAF, ML', scope: 'Advanced 5G Services', is_backend: true, is_frontend: false },

  // 5. IMS Technologies (Architecture and Configuration)
  { id: 'st-qa-17', template_name: 'QA / Quality Assurance & Testing Template', team_id: 't-qa', category: 'IMS Technologies (Architecture and Configuration)', skill_name: 'IMS Architecture', scope: 'Voice & IMS', is_backend: true, is_frontend: false },
  { id: 'st-qa-18', template_name: 'QA / Quality Assurance & Testing Template', team_id: 't-qa', category: 'IMS Technologies (Architecture and Configuration)', skill_name: 'DNS In IMS', scope: 'IMS Infrastructure', is_backend: true, is_frontend: false },
  { id: 'st-qa-19', template_name: 'QA / Quality Assurance & Testing Template', team_id: 't-qa', category: 'IMS Technologies (Architecture and Configuration)', skill_name: 'IMS Call Flows & Services for SIP Registration, INVITE, BYE, CALL HOLD/RESUME, FORWARD', scope: 'SIP & Call Flows', is_backend: true, is_frontend: false },
  { id: 'st-qa-20', template_name: 'QA / Quality Assurance & Testing Template', team_id: 't-qa', category: 'IMS Technologies (Architecture and Configuration)', skill_name: 'Different Voice and Video CODECS', scope: 'Media & Codecs', is_backend: true, is_frontend: false },

  // 6. Packet Analysis & Troubleshooting
  { id: 'st-qa-21', template_name: 'QA / Quality Assurance & Testing Template', team_id: 't-qa', category: 'Packet Analysis & Troubleshooting', skill_name: 'Wireshark, tcpdump, PCAP Analysis', scope: 'Troubleshooting & PCAP', is_backend: true, is_frontend: false },

  // 7. Cloud Native & Virtualization
  { id: 'st-qa-22', template_name: 'QA / Quality Assurance & Testing Template', team_id: 't-qa', category: 'Cloud Native & Virtualization', skill_name: 'Docker', scope: 'Containers', is_backend: true, is_frontend: false },
  { id: 'st-qa-23', template_name: 'QA / Quality Assurance & Testing Template', team_id: 't-qa', category: 'Cloud Native & Virtualization', skill_name: 'Kubernetes', scope: 'Orchestration', is_backend: true, is_frontend: false },
  { id: 'st-qa-24', template_name: 'QA / Quality Assurance & Testing Template', team_id: 't-qa', category: 'Cloud Native & Virtualization', skill_name: 'Container Networking', scope: 'CNI & Virtualization', is_backend: true, is_frontend: false },

  // 8. Database
  { id: 'st-qa-25', template_name: 'QA / Quality Assurance & Testing Template', team_id: 't-qa', category: 'Database', skill_name: 'MySQL', scope: 'Relational DB', is_backend: true, is_frontend: false },
  { id: 'st-qa-26', template_name: 'QA / Quality Assurance & Testing Template', team_id: 't-qa', category: 'Database', skill_name: 'Timescale DB', scope: 'Time-Series DB', is_backend: true, is_frontend: false },

  // 9. Performance & Optimization
  { id: 'st-qa-27', template_name: 'QA / Quality Assurance & Testing Template', team_id: 't-qa', category: 'Performance & Optimization', skill_name: 'DPDK', scope: 'Data Plane Development', is_backend: true, is_frontend: false },
  { id: 'st-qa-28', template_name: 'QA / Quality Assurance & Testing Template', team_id: 't-qa', category: 'Performance & Optimization', skill_name: 'SR-IOV', scope: 'High-Performance I/O', is_backend: true, is_frontend: false },

  // 10. Infrastructure Knowledge
  { id: 'st-qa-29', template_name: 'QA / Quality Assurance & Testing Template', team_id: 't-qa', category: 'Infrastructure Knowledge', skill_name: 'Firewalls', scope: 'Security & Firewalls', is_backend: true, is_frontend: false },
  { id: 'st-qa-30', template_name: 'QA / Quality Assurance & Testing Template', team_id: 't-qa', category: 'Infrastructure Knowledge', skill_name: 'MPLS', scope: 'Telecom Routing', is_backend: true, is_frontend: false },

  // 11. Engineering Practices and Documentation
  { id: 'st-qa-31', template_name: 'QA / Quality Assurance & Testing Template', team_id: 't-qa', category: 'Engineering Practices and Documentation', skill_name: 'Design Document Preparation Understanding', scope: 'Documentation', is_backend: true, is_frontend: true },
  { id: 'st-qa-32', template_name: 'QA / Quality Assurance & Testing Template', team_id: 't-qa', category: 'Engineering Practices and Documentation', skill_name: 'Architecture Diagram Understanding', scope: 'Architecture', is_backend: true, is_frontend: true },
  { id: 'st-qa-33', template_name: 'QA / Quality Assurance & Testing Template', team_id: 't-qa', category: 'Engineering Practices and Documentation', skill_name: 'Sequence Diagram Preparation', scope: 'Design', is_backend: true, is_frontend: true },
  { id: 'st-qa-34', template_name: 'QA / Quality Assurance & Testing Template', team_id: 't-qa', category: 'Engineering Practices and Documentation', skill_name: 'Call Flow Documentation', scope: 'Telecom Docs', is_backend: true, is_frontend: false },
  { id: 'st-qa-35', template_name: 'QA / Quality Assurance & Testing Template', team_id: 't-qa', category: 'Engineering Practices and Documentation', skill_name: 'API Documentation understanding', scope: 'API Docs', is_backend: true, is_frontend: true },
  { id: 'st-qa-36', template_name: 'QA / Quality Assurance & Testing Template', team_id: 't-qa', category: 'Engineering Practices and Documentation', skill_name: 'Test Case Design & Writing & Test Plan Preparation', scope: 'QA & Test Planning', is_backend: true, is_frontend: true },
  { id: 'st-qa-37', template_name: 'QA / Quality Assurance & Testing Template', team_id: 't-qa', category: 'Engineering Practices and Documentation', skill_name: 'Feature Design & Review & Presentation', scope: 'Product Specs', is_backend: true, is_frontend: true },
  { id: 'st-qa-38', template_name: 'QA / Quality Assurance & Testing Template', team_id: 't-qa', category: 'Engineering Practices and Documentation', skill_name: 'Customer Issue Handling (Time to respond, analysis and root Cause Analysis)', scope: 'RCA & Support', is_backend: true, is_frontend: true },
  { id: 'st-qa-39', template_name: 'QA / Quality Assurance & Testing Template', team_id: 't-qa', category: 'Engineering Practices and Documentation', skill_name: 'CoPilot and Clause Input Prompt', scope: 'Prompt Engineering', is_backend: true, is_frontend: true },

  // 12. AI tools and methodology
  { id: 'st-qa-40', template_name: 'QA / Quality Assurance & Testing Template', team_id: 't-qa', category: 'AI tools and methodology', skill_name: 'AI Tools (CoPilot & Claude) for test case design and documentation', scope: 'AI Test Automation', is_backend: true, is_frontend: true },

  // ═══════════════════════════════════════════════════════════════════════
  // MASTER TEMPLATE 2: SDN / BACKEND PLATFORM TEMPLATE (Team t2)
  // ═══════════════════════════════════════════════════════════════════════
  { id: 'st-1', template_name: 'SDN / Backend Platform Template', team_id: 't2', category: 'Topics', skill_name: 'Design Pattern', scope: 'Backend, Frontend', is_backend: true, is_frontend: true },
  { id: 'st-2', template_name: 'SDN / Backend Platform Template', team_id: 't2', category: 'Topics', skill_name: 'Schema Designing', scope: 'Backend', is_backend: true, is_frontend: false },
  { id: 'st-3', template_name: 'SDN / Backend Platform Template', team_id: 't2', category: 'Topics', skill_name: 'Threading', scope: 'Backend', is_backend: true, is_frontend: false },
  { id: 'st-4', template_name: 'SDN / Backend Platform Template', team_id: 't2', category: 'Topics', skill_name: 'OOPs', scope: 'Backend', is_backend: true, is_frontend: false },
  { id: 'st-5', template_name: 'SDN / Backend Platform Template', team_id: 't2', category: 'Topics', skill_name: 'Caching', scope: 'Backend', is_backend: true, is_frontend: false },
  { id: 'st-6', template_name: 'SDN / Backend Platform Template', team_id: 't2', category: 'Topics', skill_name: 'Browser Cookies and Storage', scope: 'Frontend', is_backend: false, is_frontend: true },
  { id: 'st-7', template_name: 'SDN / Backend Platform Template', team_id: 't2', category: 'Topics', skill_name: 'Linux OS', scope: 'Backend, DevOps', is_backend: true, is_frontend: true },
  { id: 'st-8', template_name: 'SDN / Backend Platform Template', team_id: 't2', category: 'Topics', skill_name: 'Cloud Infrastructure & K8s', scope: 'Cloud & DevOps', is_backend: true, is_frontend: true },
  { id: 'st-9', template_name: 'SDN / Backend Platform Template', team_id: 't2', category: 'Topics', skill_name: 'Distributed Systems & Resilience', scope: 'Architecture', is_backend: true, is_frontend: true },
  { id: 'st-10', template_name: 'SDN / Backend Platform Template', team_id: 't2', category: 'Topics', skill_name: 'Virtualization', scope: 'DevOps, Cloud', is_backend: true, is_frontend: false },
  { id: 'st-11', template_name: 'SDN / Backend Platform Template', team_id: 't2', category: 'Topics', skill_name: 'Microservices', scope: 'Backend, Architecture', is_backend: true, is_frontend: false },
  { id: 'st-12', template_name: 'SDN / Backend Platform Template', team_id: 't2', category: 'Topics', skill_name: 'API Gateway Routing', scope: 'Backend Architecture', is_backend: true, is_frontend: true },

  // Framework
  { id: 'st-17', template_name: 'SDN / Backend Platform Template', team_id: 't2', category: 'Framework', skill_name: 'Spring Boot', scope: 'Backend', is_backend: true, is_frontend: false },
  { id: 'st-18', template_name: 'SDN / Backend Platform Template', team_id: 't2', category: 'Framework', skill_name: 'Thymeleaf', scope: 'Full Stack', is_backend: true, is_frontend: false },
  { id: 'st-21', template_name: 'SDN / Backend Platform Template', team_id: 't2', category: 'Language', skill_name: 'Java', scope: 'Backend', is_backend: true, is_frontend: false },
  { id: 'st-22', template_name: 'SDN / Backend Platform Template', team_id: 't2', category: 'Language', skill_name: 'JavaScript', scope: 'Full Stack', is_backend: true, is_frontend: true },
  { id: 'st-27', template_name: 'SDN / Backend Platform Template', team_id: 't2', category: 'Tools', skill_name: 'Redis Cache', scope: 'Backend Caching', is_backend: true, is_frontend: false },
  { id: 'st-28', template_name: 'SDN / Backend Platform Template', team_id: 't2', category: 'Tools', skill_name: 'Prometheus & Grafana', scope: 'Observability & Metrics', is_backend: true, is_frontend: false },
  { id: 'st-35', template_name: 'SDN / Backend Platform Template', team_id: 't2', category: 'Database', skill_name: 'TimescaleDB', scope: 'Time-Series DB', is_backend: true, is_frontend: true },

  // ═══════════════════════════════════════════════════════════════════════
  // MASTER TEMPLATE 3: FRONTEND ENGINEERING TEMPLATE (Team t1)
  // ═══════════════════════════════════════════════════════════════════════
  { id: 'st-f1', template_name: 'Frontend Engineering Template', team_id: 't1', category: 'Framework', skill_name: 'ReactJS Component Architecture & Hooks', scope: 'Frontend, UI Components' },
  { id: 'st-f2', template_name: 'Frontend Engineering Template', team_id: 't1', category: 'State Management', skill_name: 'Redux & Context State Management', scope: 'State Management' },
  { id: 'st-f3', template_name: 'Frontend Engineering Template', team_id: 't1', category: 'Styling', skill_name: 'Modern CSS & Responsive Design Systems', scope: 'UI Components' },
  { id: 'st-f4', template_name: 'Frontend Engineering Template', team_id: 't1', category: 'Performance', skill_name: 'Web Vitals & Bundle Size Optimization', scope: 'Performance & Web Vitals' },
  { id: 'st-f5', template_name: 'Frontend Engineering Template', team_id: 't1', category: 'Testing', skill_name: 'Jest & Cypress Automated Testing', scope: 'Testing' },
  { id: 'st-f6', template_name: 'Frontend Engineering Template', team_id: 't1', category: 'Accessibility', skill_name: 'Web Accessibility (a11y) & ARIA Standards', scope: 'UI Components' },
  { id: 'st-f7', template_name: 'Frontend Engineering Template', team_id: 't1', category: 'Tooling', skill_name: 'Vite / Webpack Build Pipeline & Code Splitting', scope: 'Performance & Web Vitals' },

  // ═══════════════════════════════════════════════════════════════════════
  // MASTER TEMPLATE 4: GROWTH MARKETING TEMPLATE (Team t5)
  // ═══════════════════════════════════════════════════════════════════════
  { id: 'st-m1', template_name: 'Growth Marketing Template', team_id: 't5', category: 'Channels', skill_name: 'Search Engine Optimization (SEO)', scope: 'SEO, Growth' },
  { id: 'st-m2', template_name: 'Growth Marketing Template', team_id: 't5', category: 'Channels', skill_name: 'Google Ads & PPC Campaigns', scope: 'Paid Media' },
  { id: 'st-m3', template_name: 'Growth Marketing Template', team_id: 't5', category: 'Content', skill_name: 'Technical Blog & Case Study Writing', scope: 'Content Writing' },
  { id: 'st-m4', template_name: 'Growth Marketing Template', team_id: 't5', category: 'Analytics', skill_name: 'Google Analytics 4 & Funnel Tracking', scope: 'Growth Marketing' },
  { id: 'st-m5', template_name: 'Growth Marketing Template', team_id: 't5', category: 'Channels', skill_name: 'Social Media & LinkedIn B2B Outreach', scope: 'Social Media, Branding' },

  // ═══════════════════════════════════════════════════════════════════════
  // MASTER TEMPLATE 5: HR OPERATIONS TEMPLATE (Team t4)
  // ═══════════════════════════════════════════════════════════════════════
  { id: 'st-h1', template_name: 'HR Operations Template', team_id: 't4', category: 'Talent', skill_name: 'Technical Talent Acquisition & Sourcing', scope: 'Recruitment' },
  { id: 'st-h2', template_name: 'HR Operations Template', team_id: 't4', category: 'Operations', skill_name: 'Payroll Processing & Statutory Compliance', scope: 'Payroll & Compliance' },
  { id: 'st-h3', template_name: 'HR Operations Template', team_id: 't4', category: 'Culture', skill_name: 'Employee Engagement & Performance Cycles', scope: 'Culture & Engagement' },
  { id: 'st-h4', template_name: 'HR Operations Template', team_id: 't4', category: 'Policy', skill_name: 'HR Policy Drafting & Conflict Resolution', scope: 'Employee Relations' },

  // ═══════════════════════════════════════════════════════════════════════
  // MASTER TEMPLATE 6: PRODUCT & DESIGN TEMPLATE (Team t3)
  // ═══════════════════════════════════════════════════════════════════════
  { id: 'st-p1', template_name: 'Product & Design Template', team_id: 't3', category: 'Design', skill_name: 'Figma UI/UX & Design Systems', scope: 'UI Design, Design Systems' },
  { id: 'st-p2', template_name: 'Product & Design Template', team_id: 't3', category: 'Research', skill_name: 'User Interviews & Usability Testing', scope: 'UX Research' },
  { id: 'st-p3', template_name: 'Product & Design Template', team_id: 't3', category: 'Product', skill_name: 'PRD Drafting & Roadmap Prioritization', scope: 'Product Strategy' },
  { id: 'st-p4', template_name: 'Product & Design Template', team_id: 't3', category: 'Analytics', skill_name: 'Product Analytics & User Flow Optimization', scope: 'Product Analytics' },

  // ═══════════════════════════════════════════════════════════════════════
  // MASTER TEMPLATE 7: MARTECH & WEB ENGINEERING TEMPLATE (Team t5 / MarTech)
  // ═══════════════════════════════════════════════════════════════════════
  { id: 'st-mw-1', template_name: 'MarTech & Web Engineering Template', team_id: 't5', category: 'Email Infrastructure, Deliverability & Compliance', skill_name: 'Bounce rate control', description: 'Maintain hard bounce rate within agreed threshold (e.g., <1-1.5%) through categorization and cleanup', scope: 'Quality of Work' },
  { id: 'st-mw-2', template_name: 'MarTech & Web Engineering Template', team_id: 't5', category: 'Email Infrastructure, Deliverability & Compliance', skill_name: 'Opt-out / unsubscribe compliance', description: '100% campaigns using automated unsubscribe and opt-out workflows with zero manual errors', scope: 'Quality of Work' },
  { id: 'st-mw-3', template_name: 'MarTech & Web Engineering Template', team_id: 't5', category: 'Email Infrastructure, Deliverability & Compliance', skill_name: 'Deliverability health monitoring', description: 'Monthly report on sender reputation, spam complaints, and list quality', scope: 'Quality of Work' },

  { id: 'st-mw-4', template_name: 'MarTech & Web Engineering Template', team_id: 't5', category: 'Marketing Automation & Webinar Communication', skill_name: 'Automated workflows built/optimized', description: '3-5 core workflows for webinar reminders, follow-ups, and nurture journeys maintained', scope: 'Timelines (Deliverables)' },
  { id: 'st-mw-5', template_name: 'MarTech & Web Engineering Template', team_id: 't5', category: 'Marketing Automation & Webinar Communication', skill_name: 'Webinar attendance rate', description: 'Improved attendance (registrations to attendees) driven by reminder automation; positive QoQ trend', scope: 'Quality of Work' },
  { id: 'st-mw-6', template_name: 'MarTech & Web Engineering Template', team_id: 't5', category: 'Marketing Automation & Webinar Communication', skill_name: 'Time to deploy communication flows', description: 'End-to-end webinar/campaign flow live within 3-5 working days', scope: 'Timelines (Deliverables)' },

  { id: 'st-mw-7', template_name: 'MarTech & Web Engineering Template', team_id: 't5', category: 'Website Performance, Security & UX', skill_name: 'Website load time and performance', description: 'Core pages within target load time thresholds on desktop and mobile after caching optimization (Less than 3 Secs)', scope: 'Quality of Work' },
  { id: 'st-mw-8', template_name: 'MarTech & Web Engineering Template', team_id: 't5', category: 'Website Performance, Security & UX', skill_name: 'Security and anti-spam incidents', description: 'Zero major security incidents; timely patches and configuration updates', scope: 'Quality of Work' },
  { id: 'st-mw-9', template_name: 'MarTech & Web Engineering Template', team_id: 't5', category: 'Website Performance, Security & UX', skill_name: 'Completion of key web projects', description: 'Homepage and key page redesigns delivered within agreed timelines and quality benchmarks', scope: 'Timelines (Deliverables)' },

  { id: 'st-mw-10', template_name: 'MarTech & Web Engineering Template', team_id: 't5', category: 'Design System & Brand Implementation', skill_name: 'Standardized Canva design system deployment', description: 'Brand templates, guideline kits, and asset libraries created and maintained', scope: 'Initiatives' },
  { id: 'st-mw-11', template_name: 'MarTech & Web Engineering Template', team_id: 't5', category: 'Design System & Brand Implementation', skill_name: 'Adoption of standardized templates', description: '>=70% of internal creatives built using approved templates', scope: 'Quality of Work' },
  { id: 'st-mw-12', template_name: 'MarTech & Web Engineering Template', team_id: 't5', category: 'Design System & Brand Implementation', skill_name: 'Periodic design standards review', description: 'At least one documented design system refinement per quarter', scope: 'Initiatives' },

  { id: 'st-mw-13', template_name: 'MarTech & Web Engineering Template', team_id: 't5', category: 'Data Intelligence & Predictive Analytics', skill_name: 'Dashboards and reports created', description: '3-5 key Google Analytics and Salesforce dashboards/reports per quarter with clear marketing insights', scope: 'Timelines (Deliverables)' },
  { id: 'st-mw-14', template_name: 'MarTech & Web Engineering Template', team_id: 't5', category: 'Data Intelligence & Predictive Analytics', skill_name: 'Progress on predictive analytics', description: 'Initial lead-scoring or trend-based segmentation model delivered within the year', scope: 'Domain Knowledge' },

  { id: 'st-mw-15', template_name: 'MarTech & Web Engineering Template', team_id: 't5', category: 'Core Behavioral Competencies', skill_name: 'Communication & Collaboration', description: 'Assessed via manager/peer review each cycle — Focus: Coordination with design/content teams on web and automation dependencies', scope: 'Communication & Collaboration' },
  { id: 'st-mw-16', template_name: 'MarTech & Web Engineering Template', team_id: 't5', category: 'Core Behavioral Competencies', skill_name: 'Initiatives', description: 'Assessed via manager/peer review each cycle — Focus: Proactive security/performance fixes and improvements not explicitly assigned', scope: 'Initiatives' },
  { id: 'st-mw-17', template_name: 'MarTech & Web Engineering Template', team_id: 't5', category: 'Core Behavioral Competencies', skill_name: 'Domain Knowledge', description: 'Assessed via manager/peer review each cycle — Focus: Expertise in email deliverability, web security, and the martech stack', scope: 'Domain Knowledge' },
  { id: 'st-mw-18', template_name: 'MarTech & Web Engineering Template', team_id: 't5', category: 'Core Behavioral Competencies', skill_name: 'Leadership', description: 'Assessed via manager/peer review each cycle — Focus: Owning technical decisions; being the go-to resource for web/martech issues', scope: 'Leadership' },

  // ═══════════════════════════════════════════════════════════════════════
  // MASTER TEMPLATE 8: MARKETING & DEMAND GENERATION TEMPLATE (Team t5 / DemandGen)
  // ═══════════════════════════════════════════════════════════════════════
  { id: 'st-dg-1', template_name: 'Marketing & Demand Generation Template', team_id: 't5', category: 'Lead Generation from Events & Campaigns', skill_name: 'Qualified enquiries generated', description: '15-20 enquiries per quarter from events, campaigns', scope: 'Timelines' },
  { id: 'st-dg-2', template_name: 'Marketing & Demand Generation Template', team_id: 't5', category: 'Lead Generation from Events & Campaigns', skill_name: 'Enquiry to qualified lead conversion rate', description: '>=55-60% of enquiries qualify as MQL/SQL', scope: 'Quality of Work' },
  { id: 'st-dg-3', template_name: 'Marketing & Demand Generation Template', team_id: 't5', category: 'Lead Generation from Events & Campaigns', skill_name: 'Gated-asset / use case downloads', description: '12 - 15 downloads per quarter', scope: 'Timelines' },

  { id: 'st-dg-4', template_name: 'Marketing & Demand Generation Template', team_id: 't5', category: 'Database & Contact Intelligence', skill_name: 'New speaker/decision-maker contacts added', description: '200 - 250 quality contacts added to Salesforce per quarter', scope: 'Timelines (Deliverables)' },
  { id: 'st-dg-5', template_name: 'Marketing & Demand Generation Template', team_id: 't5', category: 'Database & Contact Intelligence', skill_name: 'Data completeness for new contacts', description: '>=95% completion of key fields (role, org, geo, segment, vertical)', scope: 'Quality of Work' },
  { id: 'st-dg-6', template_name: 'Marketing & Demand Generation Template', team_id: 't5', category: 'Database & Contact Intelligence', skill_name: 'List hygiene and validity', description: 'Monthly cleansing; no bounce-heavy or invalid contacts', scope: 'Quality of Work' },

  { id: 'st-dg-7', template_name: 'Marketing & Demand Generation Template', team_id: 't5', category: 'Campaign Performance & Marketing ROI', skill_name: 'Marketing ROI improvement', description: '35-45% increase vs baseline over agreed timeframe', scope: 'Quality of Work' },
  { id: 'st-dg-8', template_name: 'Marketing & Demand Generation Template', team_id: 't5', category: 'Campaign Performance & Marketing ROI', skill_name: 'Core email performance metrics', description: 'Continuous improvement in open rate, CTR, and unsubscribe rate vs baseline/benchmarks', scope: 'Quality of Work' },
  { id: 'st-dg-9', template_name: 'Marketing & Demand Generation Template', team_id: 't5', category: 'Campaign Performance & Marketing ROI', skill_name: 'Optimization tests executed', description: '3-5 optimization experiments (A/B tests, segmentation changes, timing tests) per quarter', scope: 'Initiatives' },

  { id: 'st-dg-10', template_name: 'Marketing & Demand Generation Template', team_id: 't5', category: 'Content & Thought Leadership Support', skill_name: 'Volume of content pieces created', description: '12 number of LinkedIn posts per month, 4 Niralight Newsletters per month, and 1-2 Whitepapers/Case Studies', scope: 'Timelines (Deliverables)' },
  { id: 'st-dg-11', template_name: 'Marketing & Demand Generation Template', team_id: 't5', category: 'Content & Thought Leadership Support', skill_name: 'LinkedIn engagement and traffic', description: 'Growth in impressions, reactions, comments, shares, and CTR to landing pages (e.g., >=10% QoQ growth)', scope: 'Quality of Work' },
  { id: 'st-dg-12', template_name: 'Marketing & Demand Generation Template', team_id: 't5', category: 'Content & Thought Leadership Support', skill_name: 'Thematic content initiatives', description: '3-4 industry-aligned content themes per quarter based on 5G and telecom research', scope: 'Initiatives' },

  { id: 'st-dg-13', template_name: 'Marketing & Demand Generation Template', team_id: 't5', category: 'Analytics & Actionable Insights', skill_name: 'Regular performance reporting', description: 'Weekly/bi-weekly Google Analytics + Salesforce reports with insights and action points', scope: 'Timelines (Deliverables)' },
  { id: 'st-dg-14', template_name: 'Marketing & Demand Generation Template', team_id: 't5', category: 'Analytics & Actionable Insights', skill_name: 'Advancement in analytics assets', description: '1-2 new dashboards/views/segments created per quarter', scope: 'Initiatives' },

  { id: 'st-dg-15', template_name: 'Marketing & Demand Generation Template', team_id: 't5', category: 'Market Intelligence & Research', skill_name: 'Insight notes shared', description: '3-4 structured insight notes per quarter on industry, competition, and audience trends', scope: 'Domain Knowledge' },
  { id: 'st-dg-16', template_name: 'Marketing & Demand Generation Template', team_id: 't5', category: 'Market Intelligence & Research', skill_name: 'Alignment with key industry events', description: 'Campaigns/content aligned with 3-4 major global/India telecom events or updates per year', scope: 'Domain Knowledge' },
  { id: 'st-dg-17', template_name: 'Marketing & Demand Generation Template', team_id: 't5', category: 'Market Intelligence & Research', skill_name: 'Usefulness of insights for strategy', description: 'Feedback rating >=4/5 from marketing leadership', scope: 'Domain Knowledge' },

  { id: 'st-dg-18', template_name: 'Marketing & Demand Generation Template', team_id: 't5', category: 'Campaign & Content Timeliness (New)', skill_name: 'Campaign/content calendar adherence', description: '>=90% of planned campaigns/content launched on scheduled dates', scope: 'Timelines (Deliverables)' },

  { id: 'st-dg-19', template_name: 'Marketing & Demand Generation Template', team_id: 't5', category: 'Core Behavioral Competencies', skill_name: 'Communication & Collaboration', description: 'Assessed via manager/peer review each cycle against defined behavioral indicators for this role', scope: 'Communication & Collaboration' },
  { id: 'st-dg-20', template_name: 'Marketing & Demand Generation Template', team_id: 't5', category: 'Core Behavioral Competencies', skill_name: 'Initiatives', description: 'Proactive test ideas and new channel exploration beyond planned experiments', scope: 'Initiatives' },
  { id: 'st-dg-21', template_name: 'Marketing & Demand Generation Template', team_id: 't5', category: 'Core Behavioral Competencies', skill_name: 'Domain Knowledge', description: 'Understanding in 5G/telecom industry trends and martech tools', scope: 'Domain Knowledge' },
  { id: 'st-dg-22', template_name: 'Marketing & Demand Generation Template', team_id: 't5', category: 'Core Behavioral Competencies', skill_name: 'Leadership', description: 'Driving campaigns independently; influencing content and demand-gen strategy', scope: 'Leadership' },

  // ═══════════════════════════════════════════════════════════════════════
  // MASTER TEMPLATE 9: GRAPHIC DESIGN & MOTION GRAPHICS TEMPLATE (Team t3 / Design)
  // ═══════════════════════════════════════════════════════════════════════
  { id: 'st-gd-1', template_name: 'Graphic Design & Motion Graphics Template', team_id: 't3', category: 'Marketing Creative Production', skill_name: 'Volume of social and event creatives', description: '20 social/event posts per month across events, festivals, and special days', scope: 'Timelines (Deliverables)' },
  { id: 'st-gd-2', template_name: 'Graphic Design & Motion Graphics Template', team_id: 't3', category: 'Marketing Creative Production', skill_name: 'On-time delivery of design tasks', description: '>=95% of assigned tasks delivered before campaign deadlines', scope: 'Timelines (Deliverables)' },
  { id: 'st-gd-3', template_name: 'Graphic Design & Motion Graphics Template', team_id: 't3', category: 'Marketing Creative Production', skill_name: 'Print-ready assets delivered', description: '8-10 print assets (banners, standees, brochures, etc.) per quarter', scope: 'Timelines (Deliverables)' },

  { id: 'st-gd-4', template_name: 'Graphic Design & Motion Graphics Template', team_id: 't3', category: 'Brand Consistency and Quality', skill_name: 'Creatives approved without major brand rework', description: '>=90% of creatives approved with no major brand corrections', scope: 'Quality of Work' },
  { id: 'st-gd-5', template_name: 'Graphic Design & Motion Graphics Template', team_id: 't3', category: 'Brand Consistency and Quality', skill_name: 'Adherence to brand guidelines', description: 'Monthly review score for use of color palette, typography, layout (target: high)', scope: 'Quality of Work' },
  { id: 'st-gd-6', template_name: 'Graphic Design & Motion Graphics Template', team_id: 't3', category: 'Brand Consistency and Quality', skill_name: 'Stakeholder satisfaction on design quality', description: 'Average rating >=4.2/5 from internal stakeholders', scope: 'Communication & Collaboration' },

  { id: 'st-gd-7', template_name: 'Graphic Design & Motion Graphics Template', team_id: 't3', category: 'Design Workflow Efficiency', skill_name: 'Turnaround time from brief to first draft', description: '<=24-48 hours for standard posts; <=3-4 working days for print/video draft', scope: 'Timelines (Deliverables)' },
  { id: 'st-gd-8', template_name: 'Graphic Design & Motion Graphics Template', team_id: 't3', category: 'Design Workflow Efficiency', skill_name: 'Timely completion vs plan', description: '>=90% of tasks delivered within planned timelines', scope: 'Timelines (Deliverables)' },
  { id: 'st-gd-9', template_name: 'Graphic Design & Motion Graphics Template', team_id: 't3', category: 'Design Workflow Efficiency', skill_name: 'Parallel request handling', description: 'Defined number of design requests handled in parallel without slippage per month', scope: 'Timelines (Deliverables)' },

  { id: 'st-gd-10', template_name: 'Graphic Design & Motion Graphics Template', team_id: 't3', category: 'Video Editing & Motion Graphics', skill_name: 'Number of marketing videos edited', description: '4-6 videos (events, product, special days) per quarter', scope: 'Timelines (Deliverables)' },
  { id: 'st-gd-11', template_name: 'Graphic Design & Motion Graphics Template', team_id: 't3', category: 'Video Editing & Motion Graphics', skill_name: 'New motion graphics/animation templates', description: '>=2 new templates introduced per quarter', scope: 'Initiatives' },
  { id: 'st-gd-12', template_name: 'Graphic Design & Motion Graphics Template', team_id: 't3', category: 'Video Editing & Motion Graphics', skill_name: 'Video quality rating', description: 'Average rating >=4/5 from marketing lead', scope: 'Quality of Work' },

  { id: 'st-gd-13', template_name: 'Graphic Design & Motion Graphics Template', team_id: 't3', category: 'Capability Building & File Management', skill_name: 'Motion graphics / UI-UX skill development', description: '>=1 structured learning track completed every half year', scope: 'Domain Knowledge' },
  { id: 'st-gd-14', template_name: 'Graphic Design & Motion Graphics Template', team_id: 't3', category: 'Capability Building & File Management', skill_name: 'File organization and documentation', description: '100% new assets stored in standardized folder and naming convention', scope: 'Quality of Work' },
  { id: 'st-gd-15', template_name: 'Graphic Design & Motion Graphics Template', team_id: 't3', category: 'Capability Building & File Management', skill_name: 'Speed of asset retrieval', description: 'Any past asset retrievable within 5-10 minutes', scope: 'Quality of Work' },

  { id: 'st-gd-16', template_name: 'Graphic Design & Motion Graphics Template', team_id: 't3', category: 'Core Behavioral Competencies', skill_name: 'Communication & Collaboration', description: 'Responsiveness to brief feedback; smooth handoffs and coordination with marketing/content team', scope: 'Communication & Collaboration' },
  { id: 'st-gd-17', template_name: 'Graphic Design & Motion Graphics Template', team_id: 't3', category: 'Core Behavioral Competencies', skill_name: 'Initiatives', description: 'Proactive process/tool improvement suggestions beyond assigned templates', scope: 'Initiatives' },
  { id: 'st-gd-18', template_name: 'Graphic Design & Motion Graphics Template', team_id: 't3', category: 'Core Behavioral Competencies', skill_name: 'Domain Knowledge', description: 'Awareness and application of current UI-UX and motion design trends', scope: 'Domain Knowledge' },
  { id: 'st-gd-19', template_name: 'Graphic Design & Motion Graphics Template', team_id: 't3', category: 'Core Behavioral Competencies', skill_name: 'Leadership', description: 'Ownership of design decisions with minimal hand-holding; mentoring support to junior designers where applicable', scope: 'Leadership' }
];

let memRoadmaps = [
  {
    id: 'rm-1',
    team_id: 't2', // Backend Platform Team
    title: 'Enterprise Cloud Microservices & API Gateway Modernization',
    description: 'Implement high-throughput API routing, distributed caching, resilience patterns, and automated failover.',
    quarter: 'Q3 2026',
    year: 2026,
    status: 'in_progress',
    created_by: 'u2', // Sarah Chen (Manager)
    target_date: '2026-09-30',
    created_at: new Date(Date.now() - 15 * 86400000).toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'rm-2',
    team_id: 't1', // Frontend Engineering
    title: 'Design System & Unified SPA Portal Modernization',
    description: 'Revamp UI components with glassmorphic modern design, role-based workflows, and instant client caching.',
    quarter: 'Q3 2026',
    year: 2026,
    status: 'in_progress',
    created_by: 'u2', // Sarah Chen (Manager)
    target_date: '2026-09-15',
    created_at: new Date(Date.now() - 20 * 86400000).toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'rm-3',
    team_id: 't4', // HR Operations
    title: 'Continuous 360 Review & Performance Appraisal Automation',
    description: 'Deploy quarterly skill matrix assessments, peer reviews, and automated confidential feedback routing.',
    quarter: 'Q3 2026',
    year: 2026,
    status: 'in_progress',
    created_by: 'u3', // Elena Rostova (HR)
    target_date: '2026-09-30',
    created_at: new Date(Date.now() - 10 * 86400000).toISOString(),
    updated_at: new Date().toISOString()
  }
];

let memRoadmapTasks = [
  {
    id: 'task-1',
    roadmap_id: 'rm-1',
    title: 'Design Threading & Redis Cache Architecture',
    description: 'Optimize concurrent memory lookups for active API gateway endpoints.',
    assigned_to: 'u4', // Marcus Vance (Employee)
    assigned_by: 'u2', // Sarah Chen (Manager)
    priority: 'urgent',
    status: 'in_progress',
    progress: 65,
    due_date: '2026-09-12',
    assigned_at: new Date(Date.now() - 10 * 86400000).toISOString(),
    created_at: new Date(Date.now() - 10 * 86400000).toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'task-2',
    roadmap_id: 'rm-1',
    title: 'Implement Telemetry Tracing & Audit Logging',
    description: 'Set up real-time telemetry tracing and automated alerting for system security events.',
    assigned_to: 'u4',
    assigned_by: 'u2',
    priority: 'high',
    status: 'todo',
    progress: 0,
    due_date: '2026-09-25',
    assigned_at: new Date(Date.now() - 5 * 86400000).toISOString(),
    created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'task-3',
    roadmap_id: 'rm-2',
    title: 'Responsive Dashboard Theme & Real-Time Analytics Widgets',
    description: 'Build modern visual cards and dynamic donut charts for performance tracking.',
    assigned_to: 'u4',
    assigned_by: 'u2',
    priority: 'medium',
    status: 'done',
    progress: 100,
    due_date: '2026-08-30',
    assigned_at: new Date(Date.now() - 18 * 86400000).toISOString(),
    created_at: new Date(Date.now() - 18 * 86400000).toISOString(),
    updated_at: new Date().toISOString()
  }
];

let memBugs = [
  {
    id: 'bug-101',
    bug_number: 'BUG-101',
    title: 'High Latency in Keycloak Token Validation under Concurrency',
    description: 'During peak load tests, Keycloak token validation requests experience 450ms delay due to un-cached JWT signature lookups.',
    team_id: 't2',
    module_name: 'Auth & API Gateway',
    reporter_id: 'u2',
    assigned_to: 'u4',
    severity: 'critical',
    priority: 'P0',
    status: 'in_progress',
    steps_to_reproduce: '1. Send 500 concurrent requests to /api/skill-templates\n2. Observe response header X-Auth-Latency\n3. Latency spikes above 400ms',
    resolution_notes: 'Implementing local in-memory public key cache with 15-minute TTL.',
    created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'bug-102',
    bug_number: 'BUG-102',
    title: '5G Core PCAP Packet Parser Drops Fragmented GTP-U Packets',
    description: 'Wireshark analysis tool fails to parse GTP-U packet headers when payload is split across two TCP fragments.',
    team_id: 't-qa',
    module_name: 'Packet Analysis & PCAP',
    reporter_id: 'u2',
    assigned_to: 'u4',
    severity: 'blocker',
    priority: 'P0',
    status: 'open',
    steps_to_reproduce: '1. Load test PCAP trace "gtp_fragmented_04.pcap"\n2. Click "Parse Packet Stream"\n3. Parser throws MalformedPacketException',
    resolution_notes: '',
    created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'bug-103',
    bug_number: 'BUG-103',
    title: 'Mobile View Layout Overlap on Skill Matrix Category Dropdown',
    description: 'On screens smaller than 380px width, category selection dropdown overflows the horizontal container.',
    team_id: 't1',
    module_name: 'Skill Matrix UI',
    reporter_id: 'u4',
    assigned_to: 'u4',
    severity: 'minor',
    priority: 'P2',
    status: 'resolved',
    steps_to_reproduce: '1. Resize browser window to 360px\n2. Open Quarterly Review Step 3\n3. Category dropdown overlaps rating pills',
    resolution_notes: 'Applied flex-wrap:wrap and max-width:100% to toolbar filter row.',
    created_at: new Date(Date.now() - 8 * 86400000).toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'bug-104',
    bug_number: 'BUG-104',
    title: 'GA4 Event Tracking Missing Parameters on Webinar Form Submit',
    description: 'Submission events sent to Google Analytics 4 lack the "campaign_source" parameter on landing page B.',
    team_id: 't5',
    module_name: 'Marketing Analytics',
    reporter_id: 'u2',
    assigned_to: 'u4',
    severity: 'major',
    priority: 'P1',
    status: 'under_review',
    steps_to_reproduce: '1. Open Webinar Registration form from LinkedIn ad\n2. Submit registration\n3. Check GA4 DebugView - campaign_source is undefined',
    resolution_notes: 'Added URLSearchParams parser on form mount.',
    created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'bug-105',
    bug_number: 'BUG-105',
    title: 'Figma Design System Asset Tokens Mismatch with Theme CSS',
    description: 'Primary button active state color `#4f46e5` differs from Figma design tokens specification `#4338ca`.',
    team_id: 't3',
    module_name: 'Design System',
    reporter_id: 'u2',
    assigned_to: 'u4',
    severity: 'low',
    priority: 'P3',
    status: 'closed',
    steps_to_reproduce: '1. Inspect primary button active state\n2. Compare CSS color variable with Figma token spec',
    resolution_notes: 'Updated CSS variable --a1-active to #4338ca in main.css.',
    created_at: new Date(Date.now() - 14 * 86400000).toISOString(),
    updated_at: new Date().toISOString()
  }
];

let memEnabledBugTeams = [];




// Initialize default users with bcrypt hashes
async function initSeedUsers() {
  const hashDemo = await bcrypt.hash('demo123', 10);
  const hashSuper = await bcrypt.hash(HARDCODED_SUPERADMIN_PASS, 10);

  memProfiles = [
    { id: 'u-superadmin-default', full_name: HARDCODED_SUPERADMIN_NAME, email: HARDCODED_SUPERADMIN_EMAIL, password_hash: hashSuper, role: 'super_admin', department: 'Executive', team_id: 't1', secondary_team_ids: [], avatar_initials: 'SA', created_at: new Date().toISOString() },
    { id: 'u-qa', full_name: 'Priya Sharma (QA Lead)', email: 'qa@company.com', password_hash: hashDemo, role: 'employee', department: 'Engineering', team_id: 't-qa', secondary_team_ids: [], avatar_initials: 'PS', created_at: new Date().toISOString() },
    { id: 'u2', full_name: 'Sarah Chen', email: 'manager@company.com', password_hash: hashDemo, role: 'manager', department: 'Engineering', team_id: 't1', secondary_team_ids: ['t3'], avatar_initials: 'SC', created_at: new Date().toISOString() },
    { id: 'u3', full_name: 'Elena Rostova', email: 'hr@company.com', password_hash: hashDemo, role: 'admin', department: 'Human Resources', team_id: 't4', secondary_team_ids: [], avatar_initials: 'ER', created_at: new Date().toISOString() },
    { id: 'u4', full_name: 'Marcus Vance', email: 'employee@company.com', password_hash: hashDemo, role: 'employee', department: 'Engineering', team_id: 't1', secondary_team_ids: ['t2'], avatar_initials: 'MV', created_at: new Date().toISOString() }
  ];

  memFeedback = [
    { id: 'f1', giver_id: 'u2', receiver_id: 'u4', feedback_type: 'downward', review_cycle: 'c1', content: 'Marcus consistently delivers high quality code on time and leads sprint architecture discussions efficiently.', rating: 5, is_anonymous: false, is_locked: true, created_at: new Date().toISOString() },
    { id: 'f2', giver_id: 'u4', receiver_id: 'u2', feedback_type: 'upward', review_cycle: 'c1', content: 'Sarah provides clear guidance and fosters a supportive environment for team growth.', rating: 5, is_anonymous: true, is_locked: true, created_at: new Date().toISOString() }
  ];
}

async function ensureSuperAdminAccount() {
  const hash = await bcrypt.hash(HARDCODED_SUPERADMIN_PASS, 10);
  const emailClean = HARDCODED_SUPERADMIN_EMAIL.toLowerCase();

  if (usePg) {
    try {
      await pool.query(
        `INSERT INTO profiles (id, full_name, email, password_hash, role, department, avatar_initials, created_at)
         VALUES ($1, $2, $3, $4, 'super_admin', 'Executive', 'SA', NOW())
         ON CONFLICT (id) DO UPDATE SET 
           email = EXCLUDED.email, 
           full_name = EXCLUDED.full_name, 
           password_hash = EXCLUDED.password_hash, 
           avatar_initials = EXCLUDED.avatar_initials`,
        ['u-superadmin-default', HARDCODED_SUPERADMIN_NAME, emailClean, hash]
      );
      console.log(`✅ Default SuperAdmin account (${HARDCODED_SUPERADMIN_EMAIL}) verified & updated in PostgreSQL database.`);
    } catch (err) {
      console.error('Error verifying SuperAdmin account in PostgreSQL:', err.message);
    }
  } else {
    const exists = memProfiles.some(p => p.email.toLowerCase() === emailClean);
    if (!exists) {
      memProfiles.unshift({
        id: 'u-superadmin-default',
        full_name: HARDCODED_SUPERADMIN_NAME,
        email: emailClean,
        password_hash: hash,
        role: 'super_admin',
        department: 'Executive',
        avatar_initials: 'SA',
        created_at: new Date().toISOString()
      });
      console.log(`✅ Default SuperAdmin account (${HARDCODED_SUPERADMIN_EMAIL}) created in memory store.`);
    } else {
      console.log(`ℹ️ SuperAdmin account (${HARDCODED_SUPERADMIN_EMAIL}) already exists in memory store. One-time creation skipped.`);
    }
  }
}

async function initDbConnection() {
  await initSeedUsers();
  try {
    pool = new Pool(pgConfig);
    pool.on('error', (err) => {
      console.warn('⚠️ PostgreSQL pool connection drop:', err.message);
      usePg = false;
    });
    const client = await pool.connect();
    console.log('✅ Connected to PostgreSQL database successfully!');
    usePg = true;
    client.release();
    
    // Auto-create tables if they don't exist
    await createPgTables();
  } catch (err) {
    console.log('⚠️ PostgreSQL connection failed or database not configured:', err.message);
    console.log('ℹ️ Operating using high-performance internal PostgreSQL-compatible database server mode.');
    usePg = false;
  }
  await ensureSuperAdminAccount();
}

async function createPgTables() {
  if (!usePg || !pool) return;
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS departments (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(100) UNIQUE NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS teams (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        department VARCHAR(100),
        manager_id VARCHAR(50),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS profiles (
        id VARCHAR(50) PRIMARY KEY,
        full_name VARCHAR(150) NOT NULL,
        email VARCHAR(150) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(30) NOT NULL DEFAULT 'employee',
        department VARCHAR(100),
        team_id VARCHAR(50),
        secondary_team_ids TEXT[] DEFAULT '{}',
        avatar_initials VARCHAR(10),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS review_cycles (
        id VARCHAR(50) PRIMARY KEY,
        title VARCHAR(150) NOT NULL,
        start_date DATE,
        end_date DATE,
        status VARCHAR(20) DEFAULT 'active',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS feedback (
        id VARCHAR(50) PRIMARY KEY,
        giver_id VARCHAR(50) REFERENCES profiles(id) ON DELETE CASCADE,
        receiver_id VARCHAR(50) REFERENCES profiles(id) ON DELETE CASCADE,
        feedback_type VARCHAR(30) NOT NULL,
        review_cycle VARCHAR(50),
        content TEXT NOT NULL,
        rating INTEGER,
        is_anonymous BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS quarterly_reviews (
        id VARCHAR(50) PRIMARY KEY,
        employee_id VARCHAR(50) REFERENCES profiles(id) ON DELETE CASCADE,
        manager_id VARCHAR(50),
        team_id VARCHAR(50),
        quarter VARCHAR(50) NOT NULL,
        year INTEGER NOT NULL,
        status VARCHAR(30) DEFAULT 'submitted',
        self_review_data JSONB NOT NULL,
        kpi_data JSONB NOT NULL,
        skill_matrix_data JSONB NOT NULL,
        overall_score DECIMAL(3,2),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(employee_id, quarter, year)
      );

      CREATE TABLE IF NOT EXISTS skill_templates (
        id VARCHAR(50) PRIMARY KEY,
        team_id VARCHAR(50),
        category VARCHAR(255) NOT NULL,
        skill_name VARCHAR(255) NOT NULL,
        scope VARCHAR(255) DEFAULT 'General',
        template_name VARCHAR(255),
        is_backend BOOLEAN DEFAULT TRUE,
        is_frontend BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS roadmaps (
        id VARCHAR(50) PRIMARY KEY,
        team_id VARCHAR(50),
        title VARCHAR(200) NOT NULL,
        description TEXT,
        quarter VARCHAR(50) NOT NULL,
        year INTEGER NOT NULL,
        status VARCHAR(30) DEFAULT 'in_progress',
        created_by VARCHAR(50),
        target_date DATE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS roadmap_tasks (
        id VARCHAR(50) PRIMARY KEY,
        roadmap_id VARCHAR(50),
        title VARCHAR(200) NOT NULL,
        description TEXT,
        assigned_to VARCHAR(50),
        assigned_by VARCHAR(50),
        priority VARCHAR(20) DEFAULT 'medium',
        status VARCHAR(30) DEFAULT 'todo',
        progress INTEGER DEFAULT 0,
        due_date DATE,
        assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Add columns if not present in existing PG table & ensure proper column width
    try {
      await pool.query('ALTER TABLE skill_templates ALTER COLUMN category TYPE VARCHAR(255)');
      await pool.query('ALTER TABLE skill_templates ALTER COLUMN skill_name TYPE VARCHAR(255)');
      await pool.query('ALTER TABLE skill_templates ADD COLUMN IF NOT EXISTS scope VARCHAR(255) DEFAULT \'General\'');
      await pool.query('ALTER TABLE skill_templates ALTER COLUMN scope TYPE VARCHAR(255)');
      await pool.query('ALTER TABLE skill_templates ADD COLUMN IF NOT EXISTS template_name VARCHAR(255)');
      await pool.query('ALTER TABLE skill_templates ALTER COLUMN template_name TYPE VARCHAR(255)');
      await pool.query('ALTER TABLE profiles ADD COLUMN IF NOT EXISTS secondary_team_ids TEXT[] DEFAULT \'{}\'');
      await pool.query('ALTER TABLE quarterly_reviews ADD COLUMN IF NOT EXISTS is_unlocked BOOLEAN DEFAULT FALSE');
      await pool.query(`INSERT INTO teams (id, name, department, manager_id) VALUES ('t-qa', 'Quality Assurance & Testing', 'Engineering', 'u2') ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, department = EXCLUDED.department`);
    } catch(e) {
      console.warn('Column alteration notice:', e.message);
    }

    // Seed roadmaps & tasks if empty in PG
    try {
      const rmCount = await pool.query('SELECT count(*) FROM roadmaps');
      if (parseInt(rmCount.rows[0].count, 10) === 0) {
        for (const rm of memRoadmaps) {
          await pool.query(
            `INSERT INTO roadmaps (id, team_id, title, description, quarter, year, status, created_by, target_date, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) ON CONFLICT DO NOTHING`,
            [rm.id, rm.team_id, rm.title, rm.description, rm.quarter, rm.year, rm.status, rm.created_by, rm.target_date, rm.created_at, rm.updated_at]
          );
        }
        for (const tk of memRoadmapTasks) {
          await pool.query(
            `INSERT INTO roadmap_tasks (id, roadmap_id, title, description, assigned_to, assigned_by, priority, status, progress, due_date, assigned_at, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) ON CONFLICT DO NOTHING`,
            [tk.id, tk.roadmap_id, tk.title, tk.description, tk.assigned_to, tk.assigned_by, tk.priority, tk.status, tk.progress, tk.due_date, tk.assigned_at, tk.created_at, tk.updated_at]
          );
        }
        console.log('✅ PostgreSQL database populated with default Roadmaps and Tasks.');
      }
    } catch (e) {
      console.warn('Roadmap seeding notice:', e.message);
    }

    // Seed/sync master skill templates in PG
    try {
      for (const st of memSkillTemplates) {
        await pool.query(
          'INSERT INTO skill_templates (id, team_id, category, skill_name, scope, is_backend, is_frontend, template_name) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) ON CONFLICT (id) DO UPDATE SET template_name = EXCLUDED.template_name, category = EXCLUDED.category, skill_name = EXCLUDED.skill_name, scope = EXCLUDED.scope',
          [st.id, st.team_id, st.category, st.skill_name, st.scope || 'General', st.is_backend || false, st.is_frontend || false, st.template_name || 'Default Team Template']
        );
      }
      console.log('✅ PostgreSQL database populated with master Skill Matrix templates including QA Skill Matrix.');
    } catch(e) {
      console.warn('Skill template PG seed notice:', e.message);
    }

    // Seed quarterly reviews if empty in PG
    const qrCount = await pool.query('SELECT count(*) FROM quarterly_reviews');
    if (parseInt(qrCount.rows[0].count, 10) === 0) {
      for (const qr of memQuarterlyReviews) {
        await pool.query(
          `INSERT INTO quarterly_reviews (id, employee_id, manager_id, team_id, quarter, year, status, is_unlocked, self_review_data, kpi_data, skill_matrix_data, overall_score, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) ON CONFLICT DO NOTHING`,
          [qr.id, qr.employee_id, qr.manager_id, qr.team_id, qr.quarter, qr.year, qr.status, qr.is_unlocked || false,
           JSON.stringify(qr.self_review_data), JSON.stringify(qr.kpi_data), JSON.stringify(qr.skill_matrix_data), qr.overall_score, qr.created_at, qr.updated_at]
        );
      }
      console.log('✅ PostgreSQL database populated with sample Quarterly Reviews.');
    }

    // Sync default departments, teams, and profiles into PG
    for (const d of memDepartments) {
      await pool.query('INSERT INTO departments (id, name) VALUES ($1, $2) ON CONFLICT (id) DO NOTHING', [d.id, d.name]);
    }
    for (const t of memTeams) {
      await pool.query('INSERT INTO teams (id, name, department, manager_id) VALUES ($1, $2, $3, $4) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, department = EXCLUDED.department', [t.id, t.name, t.department, t.manager_id]);
    }
    for (const p of memProfiles) {
      await pool.query(
        `INSERT INTO profiles (id, full_name, email, password_hash, role, department, team_id, avatar_initials)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (id) DO UPDATE SET team_id = EXCLUDED.team_id, role = EXCLUDED.role, full_name = EXCLUDED.full_name, password_hash = EXCLUDED.password_hash`,
        [p.id, p.full_name, p.email.toLowerCase(), p.password_hash, p.role, p.department, p.team_id, p.avatar_initials]
      );
    }
    console.log('✅ PostgreSQL database synced with default teams & profiles (including QA).');
  } catch (err) {
    console.error('Error creating PG tables:', err.message);
  }
}

// ═══════════════════════════════════════════════════════════════════════
// AUTHENTICATION & AUTHORIZATION MIDDLEWARE (JWT + RBAC)
// ═══════════════════════════════════════════════════════════════════════
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Access token required. Please sign in.' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid or expired session token.' });
    req.user = user;
    next();
  });
}

function requireRoles(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Access restricted: Insufficient permissions for this action.' });
    }
    next();
  };
}

function avatarInitials(name) {
  if (!name) return '??';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.substring(0, 2).toUpperCase();
}

// ═══════════════════════════════════════════════════════════════════════
// REST API ROUTES
// ═══════════════════════════════════════════════════════════════════════

// 0. HEALTH CHECK
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', mode: usePg ? 'postgresql' : 'in-memory', timestamp: new Date().toISOString() });
});

// 1. AUTH LOGIN
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password are required.' });

  let user = null;
  if (usePg) {
    try {
      const q = await pool.query('SELECT * FROM profiles WHERE LOWER(email) = LOWER($1)', [email.trim()]);
      if (q.rows.length > 0) user = q.rows[0];
    } catch (err) {
      console.error('PG query error:', err);
    }
  } else {
    user = memProfiles.find(p => p.email.toLowerCase() === email.trim().toLowerCase());
  }

  if (!user) return res.status(401).json({ error: 'Invalid email or password.' });

  const validPassword = await bcrypt.compare(password, user.password_hash);
  if (!validPassword) return res.status(401).json({ error: 'Invalid email or password.' });

  // Generate JWT token
  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role, full_name: user.full_name },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  const { password_hash, ...profileSafe } = user;
  res.json({ token, user: profileSafe });
});

// 2. GET CURRENT USER PROFILE
app.get('/api/auth/me', authenticateToken, async (req, res) => {
  let user = null;
  if (usePg) {
    const q = await pool.query('SELECT id, full_name, email, role, department, team_id, secondary_team_ids, avatar_initials, created_at FROM profiles WHERE id = $1', [req.user.id]);
    if (q.rows.length > 0) user = q.rows[0];
  } else {
    const p = memProfiles.find(x => x.id === req.user.id);
    if (p) {
      const { password_hash, ...rest } = p;
      user = { ...rest, secondary_team_ids: rest.secondary_team_ids || [] };
    }
  }
  if (!user) return res.status(404).json({ error: 'User profile not found.' });
  res.json(user);
});

// 2.5 CHANGE PASSWORD
app.post('/api/auth/change-password', authenticateToken, async (req, res) => {
  const { current_password, new_password } = req.body;

  if (!current_password || !new_password) {
    return res.status(400).json({ error: 'Current password and new password are required.' });
  }

  if (new_password.length < 6) {
    return res.status(400).json({ error: 'New password must be at least 6 characters long.' });
  }

  try {
    let user = null;
    if (usePg) {
      const q = await pool.query('SELECT * FROM profiles WHERE id = $1', [req.user.id]);
      if (q.rows.length > 0) user = q.rows[0];
    } else {
      user = memProfiles.find(x => x.id === req.user.id);
    }

    if (!user) {
      return res.status(404).json({ error: 'User profile not found.' });
    }

    const validPassword = await bcrypt.compare(current_password, user.password_hash);
    if (!validPassword) {
      return res.status(400).json({ error: 'Incorrect current password.' });
    }

    const hashedNewPassword = await bcrypt.hash(new_password, 10);

    if (usePg) {
      await pool.query('UPDATE profiles SET password_hash = $1, updated_at = NOW() WHERE id = $2', [hashedNewPassword, req.user.id]);
    }

    user.password_hash = hashedNewPassword;

    res.json({ message: 'Password updated successfully.' });
  } catch (err) {
    console.error('Password change error:', err);
    res.status(500).json({ error: 'Failed to update password. Please try again.' });
  }
});

// 3. SUPER ADMIN / ADMIN USER PROVISIONING (Create User Account)
// Self registration is REMOVED. Accounts must be created by SuperAdmin or Admin.
app.post('/api/users', authenticateToken, requireRoles('super_admin', 'admin'), async (req, res) => {
  const { full_name, email, password, role, department, team_id, secondary_team_ids } = req.body;

  if (!full_name || !email || !password) {
    return res.status(400).json({ error: 'Full name, email, and initial password are required.' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Initial password must be at least 6 characters long.' });
  }

  // Non-superadmin cannot create super_admin role
  let assignedRole = role || 'employee';
  if (assignedRole === 'super_admin' && req.user.role !== 'super_admin') {
    return res.status(403).json({ error: 'Only a Super Admin can create another Super Admin account.' });
  }

  const emailClean = email.trim().toLowerCase();

  // Check email uniqueness
  if (usePg) {
    const check = await pool.query('SELECT id FROM profiles WHERE LOWER(email) = $1', [emailClean]);
    if (check.rows.length > 0) {
      return res.status(400).json({ error: 'An account with this email address already exists.' });
    }
  } else {
    if (memProfiles.some(p => p.email.toLowerCase() === emailClean)) {
      return res.status(400).json({ error: 'An account with this email address already exists.' });
    }
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const newId = 'u-' + Date.now() + Math.random().toString(36).substr(2, 4);
  const initials = avatarInitials(full_name);
  const secTeams = Array.isArray(secondary_team_ids) ? secondary_team_ids : [];
  // Auto-derive department from selected team if department not explicitly provided
  let derivedDept = department || null;
  if (team_id && !derivedDept) {
    if (usePg) {
      const tRes = await pool.query('SELECT department FROM teams WHERE id = $1', [team_id]);
      if (tRes.rows.length) derivedDept = tRes.rows[0].department;
    } else {
      const t = memTeams.find(x => x.id === team_id);
      if (t) derivedDept = t.department;
    }
  }

  const newUser = {
    id: newId,
    full_name: full_name.trim(),
    email: emailClean,
    password_hash: hashedPassword,
    role: assignedRole,
    department: derivedDept,
    team_id: team_id || null,
    secondary_team_ids: secTeams,
    avatar_initials: initials,
    created_at: new Date().toISOString()
  };

  if (usePg) {
    await pool.query(
      `INSERT INTO profiles (id, full_name, email, password_hash, role, department, team_id, secondary_team_ids, avatar_initials, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())`,
      [newUser.id, newUser.full_name, newUser.email, newUser.password_hash, newUser.role, newUser.department, newUser.team_id, newUser.secondary_team_ids, newUser.avatar_initials]
    );
  } else {
    memProfiles.push(newUser);
  }

  const { password_hash, ...safeUser } = newUser;
  res.status(201).json({
    message: 'User account successfully created.',
    user: safeUser,
    credentials: { email: safeUser.email, password }
  });
});

// 4. GET ALL USERS PROFILES
app.get('/api/users', authenticateToken, async (req, res) => {
  if (usePg) {
    const q = await pool.query('SELECT id, full_name, email, role, department, team_id, secondary_team_ids, avatar_initials, created_at FROM profiles ORDER BY full_name ASC');
    res.json(q.rows.map(r => ({ ...r, secondary_team_ids: r.secondary_team_ids || [] })));
  } else {
    const list = memProfiles.map(({ password_hash, ...rest }) => ({
      ...rest,
      secondary_team_ids: rest.secondary_team_ids || []
    }));
    res.json(list);
  }
});

// 5. UPDATE USER ROLE / TEAM / PROFILE
app.put('/api/users/:id', authenticateToken, async (req, res) => {
  const targetId = req.params.id;
  const { role, team_id, secondary_team_ids, department, full_name, password } = req.body;

  // Only Admin or SuperAdmin or Self can edit
  const isSelf = req.user.id === targetId;
  const isAdmin = ['admin', 'super_admin'].includes(req.user.role);

  if (!isSelf && !isAdmin) {
    return res.status(403).json({ error: 'Permission denied.' });
  }

  // Non-superadmin cannot promote anyone to super_admin
  if (role === 'super_admin' && req.user.role !== 'super_admin' && !isSelf) {
    return res.status(403).json({ error: 'Only Super Admin can assign Super Admin role.' });
  }

  let newHashedPass = null;
  if (password) {
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    }
    newHashedPass = await bcrypt.hash(password, 10);
  }

  if (usePg) {
    const fields = [];
    const values = [];
    let idx = 1;

    if (role && isAdmin) { fields.push(`role = $${idx++}`); values.push(role); }
    if (team_id !== undefined && isAdmin) { fields.push(`team_id = $${idx++}`); values.push(team_id || null); }
    if (secondary_team_ids !== undefined && isAdmin) {
      fields.push(`secondary_team_ids = $${idx++}`);
      values.push(Array.isArray(secondary_team_ids) ? secondary_team_ids : []);
    }
    if (department !== undefined) { fields.push(`department = $${idx++}`); values.push(department || null); }
    if (full_name) { fields.push(`full_name = $${idx++}`); values.push(full_name); }
    if (newHashedPass) { fields.push(`password_hash = $${idx++}`); values.push(newHashedPass); }
    fields.push(`updated_at = NOW()`);

    if (fields.length > 1) {
      values.push(targetId);
      await pool.query(`UPDATE profiles SET ${fields.join(', ')} WHERE id = $${idx}`, values);
    }
  } else {
    const target = memProfiles.find(p => p.id === targetId);
    if (target) {
      if (role && isAdmin) target.role = role;
      if (team_id !== undefined && isAdmin) target.team_id = team_id || null;
      if (secondary_team_ids !== undefined && isAdmin) {
        target.secondary_team_ids = Array.isArray(secondary_team_ids) ? secondary_team_ids : [];
      }
      if (department !== undefined) target.department = department || null;
      if (full_name) {
        target.full_name = full_name;
        target.avatar_initials = avatarInitials(full_name);
      }
      if (newHashedPass) {
        target.password_hash = newHashedPass;
      }
    }
  }

  res.json({ message: 'User profile updated successfully.' });
});

// 6. DELETE USER ACCOUNT (ADMIN / SUPER ADMIN)
app.delete('/api/users/:id', authenticateToken, requireRoles('super_admin', 'admin'), async (req, res) => {
  const targetId = req.params.id;
  if (targetId === req.user.id) {
    return res.status(400).json({ error: 'You cannot delete your own account.' });
  }

  // Check target user role to prevent non-superadmins from deleting super_admin accounts
  let targetRole = null;
  if (usePg) {
    const check = await pool.query('SELECT role FROM profiles WHERE id = $1', [targetId]);
    if (check.rows.length > 0) targetRole = check.rows[0].role;
  } else {
    const p = memProfiles.find(x => x.id === targetId);
    if (p) targetRole = p.role;
  }

  if (targetRole === 'super_admin' && req.user.role !== 'super_admin') {
    return res.status(403).json({ error: 'Only a Super Admin can delete a Super Admin account.' });
  }

  if (usePg) {
    await pool.query('DELETE FROM profiles WHERE id = $1', [targetId]);
  } else {
    memProfiles = memProfiles.filter(p => p.id !== targetId);
  }

  res.json({ message: 'User account removed.' });
});

// 7. DEPARTMENTS
app.get('/api/departments', authenticateToken, async (req, res) => {
  if (usePg) {
    const q = await pool.query('SELECT * FROM departments ORDER BY name ASC');
    res.json(q.rows);
  } else {
    res.json(memDepartments);
  }
});

app.post('/api/departments', authenticateToken, requireRoles('super_admin', 'admin'), async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'Department name is required.' });

  const id = 'd-' + Date.now();
  if (usePg) {
    await pool.query('INSERT INTO departments (id, name) VALUES ($1, $2)', [id, name]);
  } else {
    memDepartments.push({ id, name, created_at: new Date().toISOString() });
  }

  res.status(201).json({ id, name });
});

app.put('/api/departments/:id', authenticateToken, requireRoles('super_admin', 'admin'), async (req, res) => {
  const { id } = req.params;
  const { name, description } = req.body;
  try {
    if (usePg) {
      await pool.query('UPDATE departments SET name = COALESCE($1, name) WHERE id = $2', [name, id]);
    } else {
      const d = memDepartments.find(x => x.id === id);
      if (d) {
        if (name !== undefined) d.name = name;
        if (description !== undefined) d.description = description;
      }
    }
    res.json({ message: 'Department updated successfully' });
  } catch (err) {
    console.error('Error updating department:', err);
    res.status(500).json({ error: 'Failed to update department: ' + err.message });
  }
});

app.delete('/api/departments/:id', authenticateToken, requireRoles('super_admin', 'admin'), async (req, res) => {
  const { id } = req.params;
  try {
    if (usePg) {
      const dRes = await pool.query('SELECT name FROM departments WHERE id = $1', [id]);
      const deptName = dRes.rows[0]?.name;
      if (deptName) {
        await pool.query('UPDATE teams SET department = NULL WHERE department = $1', [deptName]);
        await pool.query('UPDATE profiles SET department = NULL WHERE department = $1', [deptName]);
      }
      await pool.query('DELETE FROM departments WHERE id = $1', [id]);
    } else {
      const d = memDepartments.find(x => x.id === id);
      const deptName = d?.name;
      const idx = memDepartments.findIndex(x => x.id === id);
      if (idx !== -1) memDepartments.splice(idx, 1);
      if (deptName) {
        memTeams.forEach(t => { if (t.department === deptName) t.department = null; });
        memProfiles.forEach(p => { if (p.department === deptName) p.department = null; });
      }
    }
    res.json({ message: 'Department deleted successfully' });
  } catch (err) {
    console.error('Error deleting department:', err);
    res.status(500).json({ error: 'Failed to delete department: ' + err.message });
  }
});

// 8. TEAMS
app.get('/api/teams', authenticateToken, async (req, res) => {
  if (usePg) {
    const q = await pool.query('SELECT * FROM teams ORDER BY name ASC');
    res.json(q.rows);
  } else {
    res.json(memTeams);
  }
});

app.post('/api/teams', authenticateToken, requireRoles('super_admin', 'admin'), async (req, res) => {
  const { name, department, manager_id } = req.body;
  if (!name) return res.status(400).json({ error: 'Team name is required.' });

  const id = 't-' + Date.now();
  if (usePg) {
    await pool.query('INSERT INTO teams (id, name, department, manager_id) VALUES ($1, $2, $3, $4)', [id, name, department || null, manager_id || null]);
  } else {
    memTeams.push({ id, name, department: department || null, manager_id: manager_id || null, created_at: new Date().toISOString() });
  }

  res.status(201).json({ id, name, department, manager_id });
});

app.put('/api/teams/:id', authenticateToken, requireRoles('super_admin', 'admin'), async (req, res) => {
  const { id } = req.params;
  const { name, department, manager_id } = req.body;
  try {
    if (usePg) {
      await pool.query(
        'UPDATE teams SET name = COALESCE($1, name), department = COALESCE($2, department), manager_id = $3 WHERE id = $4',
        [name || null, department || null, manager_id || null, id]
      );
    } else {
      const t = memTeams.find(x => x.id === id);
      if (t) {
        if (name !== undefined) t.name = name;
        if (department !== undefined) t.department = department;
        if (manager_id !== undefined) t.manager_id = manager_id;
      }
    }
    res.json({ message: 'Team updated successfully' });
  } catch (err) {
    console.error('Error updating team:', err);
    res.status(500).json({ error: 'Failed to update team: ' + err.message });
  }
});

app.delete('/api/teams/:id', authenticateToken, requireRoles('super_admin', 'admin'), async (req, res) => {
  const { id } = req.params;
  try {
    if (usePg) {
      await pool.query('UPDATE profiles SET team_id = NULL WHERE team_id = $1', [id]);
      await pool.query('DELETE FROM teams WHERE id = $1', [id]);
    } else {
      const idx = memTeams.findIndex(t => t.id === id);
      if (idx !== -1) memTeams.splice(idx, 1);
      memProfiles.forEach(u => {
        if (u.team_id === id) u.team_id = null;
        if (u.secondary_team_ids && Array.isArray(u.secondary_team_ids)) {
          u.secondary_team_ids = u.secondary_team_ids.filter(stId => stId !== id);
        }
      });
    }
    res.json({ message: 'Team deleted successfully' });
  } catch (err) {
    console.error('Error deleting team:', err);
    res.status(500).json({ error: 'Failed to delete team: ' + err.message });
  }
});

// 9. REVIEW CYCLES
app.get('/api/cycles', authenticateToken, async (req, res) => {
  if (usePg) {
    const q = await pool.query('SELECT * FROM review_cycles ORDER BY created_at DESC');
    res.json(q.rows);
  } else {
    res.json(memCycles);
  }
});

app.post('/api/cycles', authenticateToken, requireRoles('super_admin', 'admin'), async (req, res) => {
  const { title, start_date, end_date } = req.body;
  if (!title) return res.status(400).json({ error: 'Cycle title is required.' });

  const id = 'c-' + Date.now();
  const newCycle = { id, title, start_date: start_date || null, end_date: end_date || null, status: 'active', created_at: new Date().toISOString() };

  if (usePg) {
    await pool.query('INSERT INTO review_cycles (id, title, start_date, end_date, status) VALUES ($1, $2, $3, $4, $5)', [id, title, start_date || null, end_date || null, 'active']);
  } else {
    memCycles.push(newCycle);
  }

  res.status(201).json(newCycle);
});

// 10. FEEDBACK
app.get('/api/feedback', authenticateToken, async (req, res) => {
  const user = req.user;

  if (usePg) {
    if (user.role === 'super_admin') {
      // Superadmin sees each and every feedback EXCEPT the ones where receiver is Superadmin
      // Note: Feedback for HR (admin) IS directed and viewable to Superadmin only
      const q = await pool.query(
        `SELECT f.* FROM feedback f
         LEFT JOIN profiles p ON f.receiver_id = p.id
         WHERE (p.role != 'super_admin' AND f.receiver_id != $1) OR (p.id IS NULL AND f.receiver_id != $1)
         ORDER BY f.created_at DESC`,
        [user.id]
      );
      return res.json(q.rows);
    }

    if (user.role === 'admin') {
      // HR/Admin sees each and every feedback EXCEPT the ones where receiver is HR/Admin
      // Note: Feedback for Superadmin IS directed and viewable to HR only
      const q = await pool.query(
        `SELECT f.* FROM feedback f
         LEFT JOIN profiles p ON f.receiver_id = p.id
         WHERE (p.role != 'admin' AND f.receiver_id != $1) OR (p.id IS NULL AND f.receiver_id != $1)
         ORDER BY f.created_at DESC`,
        [user.id]
      );
      return res.json(q.rows);
    }

    // Managers / Team Leads / Employees: can rate for themselves & peers, but ratings for all/others are not viewable to them.
    // They can only view their own submitted feedback.
    const q = await pool.query(
      `SELECT * FROM feedback WHERE giver_id = $1 ORDER BY created_at DESC`,
      [user.id]
    );
    return res.json(q.rows);
  } else {
    // In-memory fallback
    const getProfileRole = (profileId) => {
      const p = memProfiles.find(x => x.id === profileId);
      return p ? p.role : null;
    };

    if (user.role === 'super_admin') {
      // Superadmin sees all feedback EXCEPT feedback for Superadmin
      const filtered = memFeedback.filter(f => {
        const receiverRole = getProfileRole(f.receiver_id);
        return f.receiver_id !== user.id && receiverRole !== 'super_admin';
      });
      return res.json(filtered);
    }

    if (user.role === 'admin') {
      // HR sees all feedback EXCEPT feedback for HR (directed to Superadmin only); sees feedback for Superadmin
      const filtered = memFeedback.filter(f => {
        const receiverRole = getProfileRole(f.receiver_id);
        return f.receiver_id !== user.id && receiverRole !== 'admin';
      });
      return res.json(filtered);
    }

    // Managers / Employees: only their own submitted feedback
    const ownFeedback = memFeedback.filter(f => f.giver_id === user.id);
    return res.json(ownFeedback);
  }
});

app.post('/api/feedback', authenticateToken, async (req, res) => {
  const { receiver_id, feedback_type, review_cycle, content, rating, is_anonymous } = req.body;
  const giver_id = req.user.id;
  const cycleKey = review_cycle || 'c1';
  const typeKey = feedback_type || 'peer';

  if (!receiver_id || !content || !rating) {
    return res.status(400).json({ error: 'Receiver, content, and rating are required.' });
  }

  // Duplicate Submission Check: Check for existing submission for same giver and receiver in this review cycle (disallow multiple submissions per person)
  let existingItem = null;
  if (usePg) {
    try {
      const qCheck = await pool.query(
        'SELECT * FROM feedback WHERE giver_id = $1 AND receiver_id = $2 AND (review_cycle = $3 OR review_cycle IS NULL)',
        [giver_id, receiver_id, cycleKey]
      );
      if (qCheck.rows.length > 0) existingItem = qCheck.rows[0];
    } catch(e) {}
  } else {
    existingItem = memFeedback.find(f =>
      f.giver_id === giver_id &&
      f.receiver_id === receiver_id
    );
  }

  if (existingItem) {
    if (existingItem.is_locked !== false) {
      return res.status(403).json({
        error: 'Feedback for this colleague has already been submitted and locked for this review cycle. Contact HR or Super Admin to request an unlock.'
      });
    }
    // If unlocked by HR/Admin (is_locked === false), allow updating/resubmitting and re-lock
    existingItem.content = content;
    existingItem.rating = parseInt(rating, 10);
    existingItem.is_anonymous = Boolean(is_anonymous);
    existingItem.is_locked = true;
    existingItem.updated_at = new Date().toISOString();

    if (usePg) {
      try {
        await pool.query(
          'UPDATE feedback SET content = $1, rating = $2, is_anonymous = $3, is_locked = true, updated_at = NOW() WHERE id = $4',
          [content, parseInt(rating, 10), Boolean(is_anonymous), existingItem.id]
        );
      } catch(e) {}
    }

    return res.json({ ...existingItem, message: 'Feedback resubmitted and locked.' });
  }

  const id = 'f-' + Date.now();
  const newItem = {
    id,
    giver_id,
    receiver_id,
    feedback_type: typeKey,
    review_cycle: cycleKey,
    content,
    rating: parseInt(rating, 10),
    is_anonymous: Boolean(is_anonymous),
    is_locked: true,
    created_at: new Date().toISOString()
  };

  if (usePg) {
    try {
      await pool.query(
        `INSERT INTO feedback (id, giver_id, receiver_id, feedback_type, review_cycle, content, rating, is_anonymous, is_locked)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [newItem.id, newItem.giver_id, newItem.receiver_id, newItem.feedback_type, newItem.review_cycle, newItem.content, newItem.rating, newItem.is_anonymous, true]
      );
    } catch(e) {}
  } else {
    memFeedback.unshift(newItem);
  }

  res.status(201).json(newItem);
});

// POST /api/feedback/:id/unlock (HR & Super Admin unlock feedback entry for employee resubmission)
app.post('/api/feedback/:id/unlock', authenticateToken, requireRoles('super_admin', 'admin'), async (req, res) => {
  const id = req.params.id;

  let item = memFeedback.find(f => f.id === id);
  if (usePg) {
    try {
      const check = await pool.query('SELECT * FROM feedback WHERE id = $1', [id]);
      if (check.rows.length) item = check.rows[0];
      await pool.query('UPDATE feedback SET is_locked = false WHERE id = $1', [id]);
    } catch(e) {}
  }

  if (item) item.is_locked = false;
  res.json({ message: 'Feedback unlocked successfully for employee resubmission.', is_locked: false });
});

// POST /api/feedback/:id/lock (HR & Super Admin lock feedback entry)
app.post('/api/feedback/:id/lock', authenticateToken, requireRoles('super_admin', 'admin'), async (req, res) => {
  const id = req.params.id;

  let item = memFeedback.find(f => f.id === id);
  if (usePg) {
    try {
      const check = await pool.query('SELECT * FROM feedback WHERE id = $1', [id]);
      if (check.rows.length) item = check.rows[0];
      await pool.query('UPDATE feedback SET is_locked = true WHERE id = $1', [id]);
    } catch(e) {}
  }

  if (item) item.is_locked = true;
  res.json({ message: 'Feedback locked successfully.', is_locked: true });
});


app.delete('/api/feedback/:id', authenticateToken, requireRoles('super_admin'), async (req, res) => {
  const id = req.params.id;

  if (usePg) {
    const check = await pool.query('SELECT id FROM feedback WHERE id = $1', [id]);
    if (check.rows.length === 0) return res.status(404).json({ error: 'Feedback entry not found.' });
    await pool.query('DELETE FROM feedback WHERE id = $1', [id]);
  } else {
    const item = memFeedback.find(f => f.id === id);
    if (!item) return res.status(404).json({ error: 'Feedback entry not found.' });
    memFeedback = memFeedback.filter(f => f.id !== id);
  }

  res.json({ message: 'Feedback entry successfully deleted for resubmission.' });
});

// 11. SKILL TEMPLATES & MASTER TEMPLATE MANAGEMENT
app.get('/api/skill-templates/master-templates', authenticateToken, async (req, res) => {
  let allItems = [...memSkillTemplates];
  if (usePg) {
    try {
      const q = await pool.query('SELECT * FROM skill_templates');
      if (q.rows.length > 0) {
        const map = new Map();
        memSkillTemplates.forEach(i => map.set(i.id, i));
        q.rows.forEach(i => map.set(i.id, i));
        allItems = Array.from(map.values());
      }
    } catch(e) {}
  }
  const masterMap = {};
  allItems.forEach(st => {
    const tName = st.template_name || 'Default Team Template';
    if (!masterMap[tName]) {
      masterMap[tName] = { template_name: tName, item_count: 0, categories: new Set() };
    }
    masterMap[tName].item_count++;
    if (st.category) masterMap[tName].categories.add(st.category);
  });

  const result = Object.values(masterMap).map(m => ({
    template_name: m.template_name,
    item_count: m.item_count,
    category_count: m.categories.size
  }));

  res.json(result);
});

app.post('/api/skill-templates/apply-template', authenticateToken, async (req, res) => {
  const { template_name, team_id } = req.body;
  if (!template_name || !team_id) {
    return res.status(400).json({ error: 'Template name and target team ID are required.' });
  }

  // Find source template items
  const sourceItems = memSkillTemplates.filter(st => (st.template_name || '') === template_name || st.team_id === template_name);
  if (!sourceItems.length) {
    return res.status(404).json({ error: `No skill items found for template '${template_name}'.` });
  }

  // Clear existing items for target team in mem
  memSkillTemplates = memSkillTemplates.filter(st => st.team_id !== team_id);

  // Clone source items with new target team_id
  const now = Date.now();
  const newItems = sourceItems.map((st, i) => ({
    ...st,
    id: `st-apply-${now}-${i}`,
    team_id,
    template_name
  }));

  memSkillTemplates.push(...newItems);

  if (usePg) {
    try {
      await pool.query('DELETE FROM skill_templates WHERE team_id = $1', [team_id]);
      for (const item of newItems) {
        await pool.query(
          'INSERT INTO skill_templates (id, team_id, category, skill_name, scope, is_backend, is_frontend, template_name) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
          [item.id, item.team_id, item.category, item.skill_name, item.scope || 'General', item.is_backend || false, item.is_frontend || false, item.template_name]
        );
      }
    } catch(err) {
      console.warn('PG apply template error:', err.message);
    }
  }

  res.json({ message: `Template '${template_name}' successfully applied to team!`, applied_items: newItems.length });
});

app.post('/api/skill-templates/clone-template', authenticateToken, requireRoles('super_admin', 'admin'), async (req, res) => {
  const { source_template_name, new_template_name } = req.body;
  if (!source_template_name || !new_template_name) {
    return res.status(400).json({ error: 'Source template name and new template name are required.' });
  }

  const sourceItems = memSkillTemplates.filter(st => (st.template_name || '') === source_template_name);
  if (!sourceItems.length) {
    return res.status(404).json({ error: 'Source template not found.' });
  }

  const now = Date.now();
  const cloned = sourceItems.map((st, i) => ({
    ...st,
    id: `st-clone-${now}-${i}`,
    template_name: new_template_name.trim()
  }));

  memSkillTemplates.push(...cloned);
  res.status(201).json({ message: `Template cloned successfully as '${new_template_name}'!`, items_cloned: cloned.length });
});

app.get('/api/skill-templates', authenticateToken, async (req, res) => {
  const teamId = req.query.team_id;
  const templateName = req.query.template_name;

  if (usePg) {
    if (templateName) {
      const q = await pool.query('SELECT * FROM skill_templates WHERE template_name = $1 ORDER BY category ASC, skill_name ASC', [templateName]);
      if (q.rows.length > 0) return res.json(q.rows);
    }
    if (!teamId || teamId === 'ALL') {
      const q = await pool.query('SELECT * FROM skill_templates ORDER BY team_id ASC, category ASC, skill_name ASC');
      return res.json(q.rows);
    }
    const q = await pool.query('SELECT * FROM skill_templates WHERE team_id = $1 ORDER BY category ASC, skill_name ASC', [teamId]);
    return res.json(q.rows);
  } else {
    if (templateName) {
      const items = memSkillTemplates.filter(st => (st.template_name || '') === templateName);
      if (items.length > 0) return res.json(items);
    }
    if (!teamId || teamId === 'ALL') {
      return res.json(memSkillTemplates);
    }
    const items = memSkillTemplates.filter(st => st.team_id === teamId);
    return res.json(items);
  }
});

// CREATE-CUSTOM: Any authenticated user can create a custom template skill entry
app.post('/api/skill-templates/create-custom', authenticateToken, async (req, res) => {
  const { template_name, team_id, category, skill_name, scope } = req.body;
  if (!category || !skill_name) {
    return res.status(400).json({ error: 'Category and skill name are required.' });
  }
  if (!template_name) {
    return res.status(400).json({ error: 'Template name is required.' });
  }

  const id = 'st-custom-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4);
  const calculatedScope = scope || 'General';
  const newItem = {
    id,
    template_name: template_name.trim(),
    team_id: team_id || 't-custom',
    category: category.trim(),
    skill_name: skill_name.trim(),
    scope: calculatedScope,
    is_backend: calculatedScope.toLowerCase().includes('backend'),
    is_frontend: calculatedScope.toLowerCase().includes('frontend'),
    created_at: new Date().toISOString()
  };

  if (usePg) {
    try {
      await pool.query(
        'INSERT INTO skill_templates (id, team_id, category, skill_name, scope, is_backend, is_frontend, template_name) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
        [newItem.id, newItem.team_id, newItem.category, newItem.skill_name, newItem.scope, newItem.is_backend, newItem.is_frontend, newItem.template_name]
      );
    } catch(pgErr) {
      console.warn('PG create-custom template error, falling back to mem:', pgErr.message);
      memSkillTemplates.push(newItem);
    }
  } else {
    memSkillTemplates.push(newItem);
  }

  res.status(201).json(newItem);
});

app.post('/api/skill-templates', authenticateToken, requireRoles('super_admin', 'admin', 'manager'), async (req, res) => {
  const { team_id, category, skill_name, scope, is_backend, is_frontend, template_name } = req.body;
  if (!category || !skill_name) {
    return res.status(400).json({ error: 'Category and skill name are required.' });
  }

  const id = 'st-' + Date.now();
  const calculatedScope = scope || (is_backend && is_frontend ? 'Backend, Frontend' : is_backend ? 'Backend' : is_frontend ? 'Frontend' : 'General');

  const newItem = {
    id,
    template_name: template_name || null,
    team_id: team_id || 't2',
    category,
    skill_name,
    scope: calculatedScope,
    is_backend: is_backend !== undefined ? Boolean(is_backend) : calculatedScope.toLowerCase().includes('backend'),
    is_frontend: is_frontend !== undefined ? Boolean(is_frontend) : calculatedScope.toLowerCase().includes('frontend'),
    created_at: new Date().toISOString()
  };

  if (usePg) {
    try {
      await pool.query(
        'INSERT INTO skill_templates (id, team_id, category, skill_name, scope, is_backend, is_frontend, template_name) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
        [newItem.id, newItem.team_id, newItem.category, newItem.skill_name, newItem.scope, newItem.is_backend, newItem.is_frontend, newItem.template_name]
      );
    } catch(pgErr) {
      // Fallback if template_name column doesn't exist in older schema
      await pool.query(
        'INSERT INTO skill_templates (id, team_id, category, skill_name, scope, is_backend, is_frontend) VALUES ($1, $2, $3, $4, $5, $6, $7)',
        [newItem.id, newItem.team_id, newItem.category, newItem.skill_name, newItem.scope, newItem.is_backend, newItem.is_frontend]
      );
    }
  } else {
    memSkillTemplates.push(newItem);
  }

  res.status(201).json(newItem);
});

app.put('/api/skill-templates/:id', authenticateToken, requireRoles('super_admin', 'admin', 'manager'), async (req, res) => {
  const id = req.params.id;
  const { category, skill_name, scope, is_backend, is_frontend, team_id } = req.body;

  if (usePg) {
    const check = await pool.query('SELECT id FROM skill_templates WHERE id = $1', [id]);
    if (check.rows.length === 0) return res.status(404).json({ error: 'Skill template item not found.' });
    
    await pool.query(
      'UPDATE skill_templates SET category = COALESCE($1, category), skill_name = COALESCE($2, skill_name), scope = COALESCE($3, scope), is_backend = COALESCE($4, is_backend), is_frontend = COALESCE($5, is_frontend), team_id = COALESCE($6, team_id) WHERE id = $7',
      [category, skill_name, scope, is_backend, is_frontend, team_id, id]
    );
  } else {
    const item = memSkillTemplates.find(st => st.id === id);
    if (!item) return res.status(404).json({ error: 'Skill template item not found.' });
    if (category) item.category = category;
    if (skill_name) item.skill_name = skill_name;
    if (scope !== undefined) item.scope = scope;
    if (is_backend !== undefined) item.is_backend = Boolean(is_backend);
    if (is_frontend !== undefined) item.is_frontend = Boolean(is_frontend);
    if (team_id) item.team_id = team_id;
  }

  res.json({ message: 'Skill template item successfully updated.' });
});

app.delete('/api/skill-templates/:id', authenticateToken, requireRoles('super_admin', 'admin', 'manager'), async (req, res) => {
  const id = req.params.id;

  if (usePg) {
    await pool.query('DELETE FROM skill_templates WHERE id = $1', [id]);
  } else {
    memSkillTemplates = memSkillTemplates.filter(st => st.id !== id);
  }

  res.json({ message: 'Skill template item removed.' });
});

// 12. QUARTERLY REVIEWS
app.get('/api/quarterly-reviews', authenticateToken, async (req, res) => {
  const { employee_id, quarter, year, team_id } = req.query;
  const user = req.user;

  let list = [];
  if (usePg) {
    const q = await pool.query('SELECT * FROM quarterly_reviews ORDER BY year DESC, created_at DESC');
    list = q.rows;
  } else {
    list = memQuarterlyReviews;
  }

  // Filter based on query parameters & permissions
  let filtered = list;

  if (['employee'].includes(user.role)) {
    filtered = filtered.filter(r => r.employee_id === user.id);
  } else if (user.role === 'manager') {
    // Managers see reviews of their team or submitted to them
    filtered = filtered.filter(r => r.employee_id === user.id || r.manager_id === user.id || (team_id && r.team_id === team_id) || r.status === 'submitted');
  }

  if (employee_id) filtered = filtered.filter(r => r.employee_id === employee_id);
  if (quarter) filtered = filtered.filter(r => r.quarter === quarter);
  if (year) filtered = filtered.filter(r => parseInt(r.year, 10) === parseInt(year, 10));

  res.json(filtered);
});

app.get('/api/quarterly-reviews/:id', authenticateToken, async (req, res) => {
  const id = req.params.id;
  let review = null;

  if (usePg) {
    const q = await pool.query('SELECT * FROM quarterly_reviews WHERE id = $1', [id]);
    if (q.rows.length > 0) review = q.rows[0];
  } else {
    review = memQuarterlyReviews.find(r => r.id === id);
  }

  if (!review) return res.status(404).json({ error: 'Quarterly review not found.' });
  res.json(review);
});

app.post('/api/quarterly-reviews', authenticateToken, async (req, res) => {
  const { quarter, year, team_id, manager_id, self_review_data, kpi_data, skill_matrix_data, overall_score, status } = req.body;

  if (!quarter || !year || !self_review_data || !kpi_data || !skill_matrix_data) {
    return res.status(400).json({ error: 'Quarter, year, self review, KPI, and skill matrix data are required.' });
  }

  const employee_id = req.user.id;
  const existingIdx = memQuarterlyReviews.findIndex(r => r.employee_id === employee_id && r.quarter === quarter && parseInt(r.year, 10) === parseInt(year, 10));

  let existing = null;
  if (usePg) {
    const q = await pool.query('SELECT * FROM quarterly_reviews WHERE employee_id = $1 AND quarter = $2 AND year = $3', [employee_id, quarter, parseInt(year, 10)]);
    if (q.rows.length > 0) existing = q.rows[0];
  } else if (existingIdx >= 0) {
    existing = memQuarterlyReviews[existingIdx];
  }

  // Enforce 1 submission per quarter locking unless explicitly unlocked
  if (existing && ['submitted', 'reviewed', 'locked'].includes(existing.status) && !existing.is_unlocked && status !== 'draft') {
    return res.status(403).json({ error: `You have already submitted your review for ${quarter} ${year}. Submissions are locked once submitted.` });
  }

  const reviewId = existing ? existing.id : 'qr-' + Date.now();
  const reviewObj = {
    id: reviewId,
    employee_id,
    manager_id: manager_id || null,
    team_id: team_id || null,
    quarter,
    year: parseInt(year, 10),
    status: status || 'submitted',
    is_unlocked: false,
    self_review_data,
    kpi_data,
    skill_matrix_data,
    overall_score: overall_score || 4.5,
    created_at: existing ? (existing.created_at || new Date().toISOString()) : new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  if (usePg) {
    await pool.query(
      `INSERT INTO quarterly_reviews (id, employee_id, manager_id, team_id, quarter, year, status, is_unlocked, self_review_data, kpi_data, skill_matrix_data, overall_score, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW())
       ON CONFLICT (employee_id, quarter, year) DO UPDATE SET
         manager_id = EXCLUDED.manager_id,
         team_id = EXCLUDED.team_id,
         status = EXCLUDED.status,
         is_unlocked = EXCLUDED.is_unlocked,
         self_review_data = EXCLUDED.self_review_data,
         kpi_data = EXCLUDED.kpi_data,
         skill_matrix_data = EXCLUDED.skill_matrix_data,
         overall_score = EXCLUDED.overall_score,
         updated_at = NOW()`,
      [reviewObj.id, reviewObj.employee_id, reviewObj.manager_id, reviewObj.team_id, reviewObj.quarter, reviewObj.year, reviewObj.status, reviewObj.is_unlocked,
       JSON.stringify(reviewObj.self_review_data), JSON.stringify(reviewObj.kpi_data), JSON.stringify(reviewObj.skill_matrix_data), reviewObj.overall_score]
    );
  } else {
    if (existingIdx >= 0) {
      memQuarterlyReviews[existingIdx] = reviewObj;
    } else {
      memQuarterlyReviews.push(reviewObj);
    }
  }

  res.status(201).json(reviewObj);
});

app.put('/api/quarterly-reviews/:id/manager-review', authenticateToken, requireRoles('super_admin', 'admin', 'manager'), async (req, res) => {
  const id = req.params.id;
  const { kpi_data, skill_matrix_data, manager_feedback, overall_score } = req.body;

  if (usePg) {
    const q = await pool.query('SELECT * FROM quarterly_reviews WHERE id = $1', [id]);
    if (q.rows.length === 0) return res.status(404).json({ error: 'Quarterly review not found.' });
    const current = q.rows[0];
    
    let selfReview = current.self_review_data;
    if (typeof selfReview === 'string') selfReview = JSON.parse(selfReview);
    if (manager_feedback) selfReview.managerFeedback = manager_feedback;

    await pool.query(
      `UPDATE quarterly_reviews SET
         manager_id = $1,
         status = 'reviewed',
         kpi_data = $2,
         skill_matrix_data = $3,
         self_review_data = $4,
         overall_score = $5,
         updated_at = NOW()
       WHERE id = $6`,
      [req.user.id, JSON.stringify(kpi_data || current.kpi_data), JSON.stringify(skill_matrix_data || current.skill_matrix_data), JSON.stringify(selfReview), overall_score || current.overall_score, id]
    );
  } else {
    const review = memQuarterlyReviews.find(r => r.id === id);
    if (!review) return res.status(404).json({ error: 'Quarterly review not found.' });

    review.manager_id = req.user.id;
    review.status = 'reviewed';
    if (kpi_data) review.kpi_data = kpi_data;
    if (skill_matrix_data) review.skill_matrix_data = skill_matrix_data;
    if (manager_feedback) review.self_review_data.managerFeedback = manager_feedback;
    if (overall_score) review.overall_score = overall_score;
    review.updated_at = new Date().toISOString();
  }

  res.json({ message: 'Manager feedback and ratings saved successfully.' });
});

// UNLOCK / RE-ENABLE QUARTERLY REVIEW SUBMISSION (SUPER ADMIN & HR ADMIN ONLY)
app.post('/api/quarterly-reviews/:id/unlock', authenticateToken, requireRoles('super_admin', 'admin'), async (req, res) => {
  const id = req.params.id;

  if (usePg) {
    const q = await pool.query('SELECT * FROM quarterly_reviews WHERE id = $1', [id]);
    if (q.rows.length === 0) return res.status(404).json({ error: 'Quarterly review not found.' });

    await pool.query('UPDATE quarterly_reviews SET status = $1, is_unlocked = $2, updated_at = NOW() WHERE id = $3', ['unlocked', true, id]);
  } else {
    const review = memQuarterlyReviews.find(r => r.id === id);
    if (!review) return res.status(404).json({ error: 'Quarterly review not found.' });

    review.status = 'unlocked';
    review.is_unlocked = true;
    review.updated_at = new Date().toISOString();
  }

  res.json({ message: 'Quarterly review submission unlocked for editing.' });
});

// ═══════════════════════════════════════════════════════════════════════
// 13. TEAM ROADMAPS & ASSIGNED TASKS (MANAGERS CREATE/ASSIGN, SUPERADMIN FULL CONTROL, HR READ-ONLY)
// ═══════════════════════════════════════════════════════════════════════

// GET /api/roadmaps (Super Admin & HR see all teams; Manager sees their managed teams; Employee sees their team)
app.get('/api/roadmaps', authenticateToken, async (req, res) => {
  const { team_id, quarter, year } = req.query;
  const user = req.user;

  let roadmaps = [];
  let tasks = [];

  if (usePg) {
    const qR = await pool.query('SELECT * FROM roadmaps ORDER BY year DESC, created_at DESC');
    const qT = await pool.query(`
      SELECT t.*, p1.full_name as assigned_to_name, p1.email as assigned_to_email, p1.avatar_initials as assigned_to_avatar,
                  p2.full_name as assigned_by_name
      FROM roadmap_tasks t
      LEFT JOIN profiles p1 ON t.assigned_to = p1.id
      LEFT JOIN profiles p2 ON t.assigned_by = p2.id
      ORDER BY t.created_at DESC
    `);
    roadmaps = qR.rows;
    tasks = qT.rows;
  } else {
    roadmaps = [...memRoadmaps];
    tasks = memRoadmapTasks.map(t => {
      const p1 = memProfiles.find(p => p.id === t.assigned_to);
      const p2 = memProfiles.find(p => p.id === t.assigned_by);
      return {
        ...t,
        assigned_to_name: p1 ? p1.full_name : 'Team Member',
        assigned_to_email: p1 ? p1.email : '',
        assigned_to_avatar: p1 ? p1.avatar_initials : 'TM',
        assigned_by_name: p2 ? p2.full_name : 'Manager'
      };
    });
  }

  // Filter based on user role & permissions
  if (['super_admin', 'admin'].includes(user.role)) {
    // Super Admin & HR can see all teams' roadmaps
  } else if (user.role === 'manager') {
    let managedTeamIds = [];
    if (usePg) {
      const qTeams = await pool.query('SELECT id FROM teams WHERE manager_id = $1', [user.id]);
      managedTeamIds = qTeams.rows.map(t => t.id);
      const qUserTeam = await pool.query('SELECT team_id FROM profiles WHERE id = $1', [user.id]);
      if (qUserTeam.rows.length && qUserTeam.rows[0].team_id) {
        managedTeamIds.push(qUserTeam.rows[0].team_id);
      }
    } else {
      managedTeamIds = memTeams.filter(t => t.manager_id === user.id).map(t => t.id);
      const p = memProfiles.find(x => x.id === user.id);
      if (p?.team_id && !managedTeamIds.includes(p.team_id)) managedTeamIds.push(p.team_id);
    }
    if (managedTeamIds.length) {
      roadmaps = roadmaps.filter(r => managedTeamIds.includes(r.team_id));
    }
  } else {
    // Employee: can only see roadmaps for their own team
    let empTeamId = null;
    if (usePg) {
      const qEmp = await pool.query('SELECT team_id FROM profiles WHERE id = $1', [user.id]);
      if (qEmp.rows.length) empTeamId = qEmp.rows[0].team_id;
    } else {
      const p = memProfiles.find(x => x.id === user.id);
      empTeamId = p?.team_id;
    }
    roadmaps = roadmaps.filter(r => r.team_id === empTeamId);
  }

  if (team_id) roadmaps = roadmaps.filter(r => r.team_id === team_id);
  if (quarter) roadmaps = roadmaps.filter(r => r.quarter === quarter);
  if (year) roadmaps = roadmaps.filter(r => parseInt(r.year, 10) === parseInt(year, 10));

  // Attach tasks to each roadmap with calculated progress
  const result = roadmaps.map(rm => {
    const rmTasks = tasks.filter(t => t.roadmap_id === rm.id);
    const completedCount = rmTasks.filter(t => t.status === 'done').length;
    const progressCalc = rmTasks.length ? Math.round((completedCount / rmTasks.length) * 100) : 0;
    return {
      ...rm,
      tasks: rmTasks,
      task_count: rmTasks.length,
      completed_task_count: completedCount,
      calculated_progress: progressCalc
    };
  });

  res.json(result);
});

// POST /api/roadmaps (Manager creates for their team, Superadmin for any team; HR blocked with 403)
app.post('/api/roadmaps', authenticateToken, async (req, res) => {
  const user = req.user;
  if (user.role === 'admin') {
    return res.status(403).json({ error: 'HR has read-only oversight on roadmaps and cannot create or modify roadmaps.' });
  }
  if (!['super_admin', 'manager'].includes(user.role)) {
    return res.status(403).json({ error: 'Only Managers and Super Admins can create roadmaps.' });
  }

  const { team_id, title, description, quarter, year, status, target_date } = req.body;
  if (!team_id || !title || !quarter || !year) {
    return res.status(400).json({ error: 'Team ID, title, quarter, and year are required.' });
  }

  const id = 'rm-' + Date.now();
  const newRm = {
    id,
    team_id,
    title,
    description: description || '',
    quarter,
    year: parseInt(year, 10),
    status: status || 'in_progress',
    created_by: user.id,
    target_date: target_date || null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  if (usePg) {
    await pool.query(
      `INSERT INTO roadmaps (id, team_id, title, description, quarter, year, status, created_by, target_date, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())`,
      [newRm.id, newRm.team_id, newRm.title, newRm.description, newRm.quarter, newRm.year, newRm.status, newRm.created_by, newRm.target_date]
    );
  } else {
    memRoadmaps.unshift(newRm);
  }

  res.status(201).json({ ...newRm, tasks: [] });
});

// PUT /api/roadmaps/:id (Manager / Super Admin edit; HR blocked)
app.put('/api/roadmaps/:id', authenticateToken, async (req, res) => {
  const user = req.user;
  if (user.role === 'admin') {
    return res.status(403).json({ error: 'HR has read-only oversight on roadmaps and cannot modify them.' });
  }
  if (!['super_admin', 'manager'].includes(user.role)) {
    return res.status(403).json({ error: 'Permission denied.' });
  }

  const id = req.params.id;
  const { title, description, quarter, year, status, target_date, team_id } = req.body;

  if (usePg) {
    const check = await pool.query('SELECT * FROM roadmaps WHERE id = $1', [id]);
    if (check.rows.length === 0) return res.status(404).json({ error: 'Roadmap not found.' });

    await pool.query(
      `UPDATE roadmaps SET
         title = COALESCE($1, title),
         description = COALESCE($2, description),
         quarter = COALESCE($3, quarter),
         year = COALESCE($4, year),
         status = COALESCE($5, status),
         target_date = COALESCE($6, target_date),
         team_id = COALESCE($7, team_id),
         updated_at = NOW()
       WHERE id = $8`,
      [title, description, quarter, year ? parseInt(year, 10) : null, status, target_date, team_id, id]
    );
  } else {
    const rm = memRoadmaps.find(r => r.id === id);
    if (!rm) return res.status(404).json({ error: 'Roadmap not found.' });
    if (title) rm.title = title;
    if (description !== undefined) rm.description = description;
    if (quarter) rm.quarter = quarter;
    if (year) rm.year = parseInt(year, 10);
    if (status) rm.status = status;
    if (target_date !== undefined) rm.target_date = target_date;
    if (team_id) rm.team_id = team_id;
    rm.updated_at = new Date().toISOString();
  }

  res.json({ message: 'Roadmap updated successfully.' });
});

// DELETE /api/roadmaps/:id (Manager / Super Admin; HR blocked)
app.delete('/api/roadmaps/:id', authenticateToken, async (req, res) => {
  const user = req.user;
  if (user.role === 'admin') {
    return res.status(403).json({ error: 'HR has read-only oversight and cannot delete roadmaps.' });
  }
  if (!['super_admin', 'manager'].includes(user.role)) {
    return res.status(403).json({ error: 'Permission denied.' });
  }

  const id = req.params.id;

  if (usePg) {
    await pool.query('DELETE FROM roadmap_tasks WHERE roadmap_id = $1', [id]);
    await pool.query('DELETE FROM roadmaps WHERE id = $1', [id]);
  } else {
    memRoadmapTasks = memRoadmapTasks.filter(t => t.roadmap_id !== id);
    memRoadmaps = memRoadmaps.filter(r => r.id !== id);
  }

  res.json({ message: 'Roadmap and associated tasks deleted successfully.' });
});

// POST /api/roadmaps/:id/tasks (Manager / Super Admin assign task to team member; HR blocked)
app.post('/api/roadmaps/:id/tasks', authenticateToken, async (req, res) => {
  const user = req.user;
  if (user.role === 'admin') {
    return res.status(403).json({ error: 'HR has read-only oversight and cannot create or assign tasks.' });
  }
  if (!['super_admin', 'manager'].includes(user.role)) {
    return res.status(403).json({ error: 'Only Managers and Super Admins can assign tasks.' });
  }

  const roadmap_id = req.params.id;
  const { title, description, assigned_to, priority, status, due_date } = req.body;

  if (!title || !assigned_to) {
    return res.status(400).json({ error: 'Task title and assigned team member are required.' });
  }

  const id = 'task-' + Date.now();
  const newTask = {
    id,
    roadmap_id,
    title,
    description: description || '',
    assigned_to,
    assigned_by: user.id,
    priority: priority || 'medium',
    status: status || 'todo',
    progress: status === 'done' ? 100 : 0,
    due_date: due_date || null,
    assigned_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  if (usePg) {
    await pool.query(
      `INSERT INTO roadmap_tasks (id, roadmap_id, title, description, assigned_to, assigned_by, priority, status, progress, due_date, assigned_at, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW(), NOW())`,
      [newTask.id, newTask.roadmap_id, newTask.title, newTask.description, newTask.assigned_to, newTask.assigned_by, newTask.priority, newTask.status, newTask.progress, newTask.due_date]
    );
  } else {
    memRoadmapTasks.unshift(newTask);
  }

  res.status(201).json(newTask);
});

// PUT /api/roadmap-tasks/:taskId (Manager / Super Admin modify task; Employee can update status/progress for their assigned task; HR blocked)
app.put('/api/roadmap-tasks/:taskId', authenticateToken, async (req, res) => {
  const user = req.user;
  if (user.role === 'admin') {
    return res.status(403).json({ error: 'HR has read-only oversight and cannot modify tasks.' });
  }

  const taskId = req.params.taskId;
  const { title, description, assigned_to, priority, status, progress, due_date } = req.body;

  if (usePg) {
    const check = await pool.query('SELECT * FROM roadmap_tasks WHERE id = $1', [taskId]);
    if (check.rows.length === 0) return res.status(404).json({ error: 'Task not found.' });
    const current = check.rows[0];

    // If regular employee, only allow updating own task status/progress
    if (user.role === 'employee' && current.assigned_to !== user.id) {
      return res.status(403).json({ error: 'You can only update tasks assigned to you.' });
    }

    const calculatedProgress = progress !== undefined ? parseInt(progress, 10) : (status === 'done' ? 100 : current.progress);

    if (user.role === 'employee') {
      await pool.query(
        `UPDATE roadmap_tasks SET
           status = COALESCE($1, status),
           progress = $2,
           updated_at = NOW()
         WHERE id = $3`,
        [status, calculatedProgress, taskId]
      );
    } else {
      await pool.query(
        `UPDATE roadmap_tasks SET
           title = COALESCE($1, title),
           description = COALESCE($2, description),
           assigned_to = COALESCE($3, assigned_to),
           priority = COALESCE($4, priority),
           status = COALESCE($5, status),
           progress = $6,
           due_date = COALESCE($7, due_date),
           updated_at = NOW()
         WHERE id = $8`,
        [title, description, assigned_to, priority, status, calculatedProgress, due_date, taskId]
      );
    }
  } else {
    const task = memRoadmapTasks.find(t => t.id === taskId);
    if (!task) return res.status(404).json({ error: 'Task not found.' });

    if (user.role === 'employee' && task.assigned_to !== user.id) {
      return res.status(403).json({ error: 'You can only update tasks assigned to you.' });
    }

    if (status) task.status = status;
    if (progress !== undefined) task.progress = parseInt(progress, 10);
    else if (status === 'done') task.progress = 100;

    if (user.role !== 'employee') {
      if (title) task.title = title;
      if (description !== undefined) task.description = description;
      if (assigned_to) {
        task.assigned_to = assigned_to;
        task.assigned_at = new Date().toISOString();
      }
      if (priority) task.priority = priority;
      if (due_date !== undefined) task.due_date = due_date;
    }
    task.updated_at = new Date().toISOString();
  }

  res.json({ message: 'Task updated successfully.' });
});

// DELETE /api/roadmap-tasks/:taskId (Manager / Super Admin; HR blocked)
app.delete('/api/roadmap-tasks/:taskId', authenticateToken, async (req, res) => {
  const user = req.user;
  if (user.role === 'admin') {
    return res.status(403).json({ error: 'HR has read-only oversight and cannot delete tasks.' });
  }
  if (!['super_admin', 'manager'].includes(user.role)) {
    return res.status(403).json({ error: 'Permission denied.' });
  }

  const taskId = req.params.taskId;

  if (usePg) {
    await pool.query('DELETE FROM roadmap_tasks WHERE id = $1', [taskId]);
  } else {
    memRoadmapTasks = memRoadmapTasks.filter(t => t.id !== taskId);
  }

  res.json({ message: 'Task deleted successfully.' });
});

// ═══════════════════════════════════════════════════════════════════════
// 14. ENTERPRISE BUG TRACKER API ENDPOINTS
// ═══════════════════════════════════════════════════════════════════════

// GET /api/bugs (Filtered by user role & query parameters)
app.get('/api/bugs', authenticateToken, async (req, res) => {
  const user = req.user;
  const { team_id, assigned_to, status, severity, priority, search } = req.query;

  let bugs = [...memBugs];

  if (usePg) {
    try {
      const q = await pool.query('SELECT * FROM bugs ORDER BY created_at DESC');
      if (q.rows.length > 0) bugs = q.rows;
    } catch(e) {}
  }

  // Populate profiles and team names
  const profilesMap = new Map();
  const teamsMap = new Map();

  if (usePg) {
    try {
      const qP = await pool.query('SELECT id, full_name, email, avatar_initials, role FROM profiles');
      qP.rows.forEach(p => profilesMap.set(p.id, p));
      const qT = await pool.query('SELECT id, name FROM teams');
      qT.rows.forEach(t => teamsMap.set(t.id, t));
    } catch(e) {}
  } else {
    memProfiles.forEach(p => profilesMap.set(p.id, p));
    memTeams.forEach(t => teamsMap.set(t.id, t));
  }

  bugs = bugs.map(b => {
    const reporter = profilesMap.get(b.reporter_id);
    const assignee = profilesMap.get(b.assigned_to);
    const team = teamsMap.get(b.team_id);
    return {
      ...b,
      team_name: team ? team.name : 'General',
      reporter_name: reporter ? reporter.full_name : 'System Reporter',
      reporter_avatar: reporter ? reporter.avatar_initials : 'SR',
      assigned_to_name: assignee ? assignee.full_name : 'Unassigned',
      assigned_to_avatar: assignee ? assignee.avatar_initials : 'UN'
    };
  });

  // Role-based visibility scoping
  if (['super_admin', 'admin'].includes(user.role)) {
    // Super Admin & HR view company-wide bugs
  } else if (user.role === 'manager') {
    let managedTeamIds = [];
    if (usePg) {
      const qTeams = await pool.query('SELECT id FROM teams WHERE manager_id = $1', [user.id]);
      managedTeamIds = qTeams.rows.map(t => t.id);
      const qUserTeam = await pool.query('SELECT team_id FROM profiles WHERE id = $1', [user.id]);
      if (qUserTeam.rows.length && qUserTeam.rows[0].team_id) managedTeamIds.push(qUserTeam.rows[0].team_id);
    } else {
      managedTeamIds = memTeams.filter(t => t.manager_id === user.id).map(t => t.id);
      const p = memProfiles.find(x => x.id === user.id);
      if (p?.team_id && !managedTeamIds.includes(p.team_id)) managedTeamIds.push(p.team_id);
    }
    if (managedTeamIds.length) {
      bugs = bugs.filter(b => managedTeamIds.includes(b.team_id));
    }
  } else {
    // Employee: view bugs for their assigned team or bugs assigned/reported by them
    let empTeamId = null;
    if (usePg) {
      const qEmp = await pool.query('SELECT team_id FROM profiles WHERE id = $1', [user.id]);
      if (qEmp.rows.length) empTeamId = qEmp.rows[0].team_id;
    } else {
      const p = memProfiles.find(x => x.id === user.id);
      empTeamId = p?.team_id;
    }
    bugs = bugs.filter(b => b.team_id === empTeamId || b.assigned_to === user.id || b.reporter_id === user.id);
  }

  if (team_id && team_id !== 'ALL') bugs = bugs.filter(b => b.team_id === team_id);
  if (assigned_to && assigned_to !== 'ALL') bugs = bugs.filter(b => b.assigned_to === assigned_to);
  if (status && status !== 'ALL') bugs = bugs.filter(b => b.status === status);
  if (severity && severity !== 'ALL') bugs = bugs.filter(b => b.severity === severity);
  if (priority && priority !== 'ALL') bugs = bugs.filter(b => b.priority === priority);

  if (search && search.trim()) {
    const qStr = search.trim().toLowerCase();
    bugs = bugs.filter(b =>
      b.title.toLowerCase().includes(qStr) ||
      (b.bug_number && b.bug_number.toLowerCase().includes(qStr)) ||
      (b.module_name && b.module_name.toLowerCase().includes(qStr)) ||
      (b.description && b.description.toLowerCase().includes(qStr))
    );
  }

  res.json(bugs);
});

// GET /api/bugs/settings/enabled-teams (Returns team IDs allowed to report bugs)
app.get('/api/bugs/settings/enabled-teams', authenticateToken, async (req, res) => {
  res.json({ enabled_team_ids: memEnabledBugTeams });
});

// POST /api/bugs/settings/enabled-teams (HR & Super Admin configure team reporting permissions)
app.post('/api/bugs/settings/enabled-teams', authenticateToken, async (req, res) => {
  const user = req.user;
  if (!['super_admin', 'admin'].includes(user.role)) {
    return res.status(403).json({ error: 'Permission Denied: Only HR and Super Admin can configure team bug reporting permissions.' });
  }

  const { enabled_team_ids } = req.body;
  if (!Array.isArray(enabled_team_ids)) {
    return res.status(400).json({ error: 'enabled_team_ids must be an array of team IDs.' });
  }

  memEnabledBugTeams = enabled_team_ids;
  res.json({ message: 'Team bug reporting permissions updated successfully.', enabled_team_ids: memEnabledBugTeams });
});

// POST /api/bugs (Report new bug)
app.post('/api/bugs', authenticateToken, async (req, res) => {
  const user = req.user;
  const { title, description, team_id, assigned_to, severity, priority, module_name, steps_to_reproduce } = req.body;

  if (!title || !team_id) {
    return res.status(400).json({ error: 'Bug title and team assignment are required.' });
  }

  // Check if team bug reporting is enabled by HR/Admin for non-admin users
  if (!['super_admin', 'admin'].includes(user.role)) {
    if (!memEnabledBugTeams.includes(team_id)) {
      return res.status(403).json({ error: 'Bug reporting is currently disabled for your team by HR / Super Admin.' });
    }
  }


  const count = memBugs.length + 101;
  const id = 'bug-' + Date.now();
  const bug_number = `BUG-${count}`;

  const newBug = {
    id,
    bug_number,
    title,
    description: description || '',
    team_id,
    module_name: module_name || 'General Component',
    reporter_id: user.id,
    assigned_to: assigned_to || user.id,
    severity: severity || 'major',
    priority: priority || 'P1',
    status: 'open',
    steps_to_reproduce: steps_to_reproduce || '',
    resolution_notes: '',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  if (usePg) {
    try {
      await pool.query(
        `INSERT INTO bugs (id, bug_number, title, description, team_id, module_name, reporter_id, assigned_to, severity, priority, status, steps_to_reproduce, resolution_notes, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW(), NOW())`,
        [newBug.id, newBug.bug_number, newBug.title, newBug.description, newBug.team_id, newBug.module_name, newBug.reporter_id, newBug.assigned_to, newBug.severity, newBug.priority, newBug.status, newBug.steps_to_reproduce, newBug.resolution_notes]
      );
    } catch(e) {}
  } else {
    memBugs.unshift(newBug);
  }

  res.status(201).json(newBug);
});

// PUT /api/bugs/:id (Update bug details, status, assignee, resolution notes)
app.put('/api/bugs/:id', authenticateToken, async (req, res) => {
  const user = req.user;
  const bugId = req.params.id;
  const { title, description, assigned_to, severity, priority, status, module_name, steps_to_reproduce, resolution_notes } = req.body;

  let bug = memBugs.find(b => b.id === bugId);
  if (!bug && !usePg) return res.status(404).json({ error: 'Bug record not found.' });

  if (bug) {
    if (title !== undefined) bug.title = title;
    if (description !== undefined) bug.description = description;
    if (assigned_to !== undefined) bug.assigned_to = assigned_to;
    if (severity !== undefined) bug.severity = severity;
    if (priority !== undefined) bug.priority = priority;
    if (status !== undefined) bug.status = status;
    if (module_name !== undefined) bug.module_name = module_name;
    if (steps_to_reproduce !== undefined) bug.steps_to_reproduce = steps_to_reproduce;
    if (resolution_notes !== undefined) bug.resolution_notes = resolution_notes;
    bug.updated_at = new Date().toISOString();
  }

  if (usePg) {
    try {
      await pool.query(
        `UPDATE bugs SET
           title = COALESCE($1, title),
           description = COALESCE($2, description),
           assigned_to = COALESCE($3, assigned_to),
           severity = COALESCE($4, severity),
           priority = COALESCE($5, priority),
           status = COALESCE($6, status),
           module_name = COALESCE($7, module_name),
           steps_to_reproduce = COALESCE($8, steps_to_reproduce),
           resolution_notes = COALESCE($9, resolution_notes),
           updated_at = NOW()
         WHERE id = $10`,
        [title, description, assigned_to, severity, priority, status, module_name, steps_to_reproduce, resolution_notes, bugId]
      );
    } catch(e) {}
  }

  res.json({ message: 'Bug updated successfully.' });

});

// DELETE /api/bugs/:id (Super Admin & HR can delete any; Managers can delete only from their managed teams; Employees blocked)
app.delete('/api/bugs/:id', authenticateToken, async (req, res) => {
  const user = req.user;
  if (!['super_admin', 'admin', 'manager'].includes(user.role)) {
    return res.status(403).json({ error: 'Permission Denied: Employees cannot delete bugs. Only Team Managers, HR, and Super Admins can delete defects.' });
  }

  const bugId = req.params.id;

  let targetBug = memBugs.find(b => b.id === bugId);
  if (usePg) {
    try {
      const q = await pool.query('SELECT * FROM bugs WHERE id = $1', [bugId]);
      if (q.rows.length) targetBug = q.rows[0];
    } catch(e) {}
  }

  if (!targetBug) return res.status(404).json({ error: 'Bug record not found.' });

  // Team-level check for Managers
  if (user.role === 'manager') {
    let managedTeamIds = [];
    if (usePg) {
      const qTeams = await pool.query('SELECT id FROM teams WHERE manager_id = $1', [user.id]);
      managedTeamIds = qTeams.rows.map(t => t.id);
      const qUserTeam = await pool.query('SELECT team_id FROM profiles WHERE id = $1', [user.id]);
      if (qUserTeam.rows.length && qUserTeam.rows[0].team_id) managedTeamIds.push(qUserTeam.rows[0].team_id);
    } else {
      managedTeamIds = memTeams.filter(t => t.manager_id === user.id).map(t => t.id);
      const p = memProfiles.find(x => x.id === user.id);
      if (p?.team_id && !managedTeamIds.includes(p.team_id)) managedTeamIds.push(p.team_id);
    }
    if (!managedTeamIds.includes(targetBug.team_id)) {
      return res.status(403).json({ error: 'Permission Denied: Managers can only delete bugs belonging to their specific managed team.' });
    }
  }

  if (usePg) {
    try {
      await pool.query('DELETE FROM bugs WHERE id = $1', [bugId]);
    } catch(e) {}
  } else {
    memBugs = memBugs.filter(b => b.id !== bugId);
  }

  res.json({ message: 'Bug deleted successfully.' });
});



// Express Global Error Handler
app.use((err, req, res, next) => {
  console.error('⚠️ Express Error Handler:', err?.message || err);
  if (res.headersSent) return next(err);
  res.status(500).json({ error: err?.message || 'Internal Server Error' });
});

// Fallback to index.html for SPA routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Start Server
initDbConnection().then(() => {
  const server = app.listen(PORT, HOST, () => {
    console.log(`🚀 Vectyra Server running on http://${HOST === '0.0.0.0' ? '0.0.0.0' : HOST}:${PORT}`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.warn(`⚠️ Port ${PORT} is already in use by an active Vectyra server process. Operating on running server instance or run 'npx kill-port 3000' / Stop-Process to restart.`);
    } else {
      console.error('Server error:', err);
    }
  });
});
