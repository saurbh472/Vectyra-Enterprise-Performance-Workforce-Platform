const express = require('express');
const cors = require('cors');
const path = require('path');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

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
  ssl: process.env.PGSSL === 'true' ? { rejectUnauthorized: false } : false
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

let memQuarterlyReviews = [];
let memSkillTemplates = [
  // Topics (SDN Controller Team / Team t2 / SG CORE SDN TEAM)
  { id: 'st-1', team_id: 't2', category: 'Topics', skill_name: 'Design Pattern', scope: 'Backend, Frontend', is_backend: true, is_frontend: true },
  { id: 'st-2', team_id: 't2', category: 'Topics', skill_name: 'Schema Designing', scope: 'Backend', is_backend: true, is_frontend: false },
  { id: 'st-3', team_id: 't2', category: 'Topics', skill_name: 'Threading', scope: 'Backend', is_backend: true, is_frontend: false },
  { id: 'st-4', team_id: 't2', category: 'Topics', skill_name: 'OOPs', scope: 'Backend', is_backend: true, is_frontend: false },
  { id: 'st-5', team_id: 't2', category: 'Topics', skill_name: 'Caching', scope: 'Backend', is_backend: true, is_frontend: false },
  { id: 'st-6', team_id: 't2', category: 'Topics', skill_name: 'Browser Cookies and Storage', scope: 'Frontend', is_backend: false, is_frontend: true },
  { id: 'st-7', team_id: 't2', category: 'Topics', skill_name: 'Linux OS', scope: 'Backend, DevOps', is_backend: true, is_frontend: true },
  { id: 'st-8', team_id: 't2', category: 'Topics', skill_name: '5G NF Overall', scope: 'Core Network', is_backend: true, is_frontend: true },
  { id: 'st-9', team_id: 't2', category: 'Topics', skill_name: '4G NF Overall', scope: 'Core Network', is_backend: true, is_frontend: true },
  { id: 'st-10', team_id: 't2', category: 'Topics', skill_name: 'Virtualization', scope: 'DevOps, Cloud', is_backend: true, is_frontend: false },
  { id: 'st-11', team_id: 't2', category: 'Topics', skill_name: 'Microservices', scope: 'Backend, Architecture', is_backend: true, is_frontend: false },
  { id: 'st-12', team_id: 't2', category: 'Topics', skill_name: 'SDN Controller', scope: 'SDN & Frontend', is_backend: false, is_frontend: true },
  { id: 'st-13', team_id: 't2', category: 'Topics', skill_name: 'UI/UX', scope: 'Frontend, Design', is_backend: false, is_frontend: true },
  { id: 'st-14', team_id: 't2', category: 'Topics', skill_name: 'Browser WebKit', scope: 'Frontend Engine', is_backend: false, is_frontend: true },
  { id: 'st-15', team_id: 't2', category: 'Topics', skill_name: 'UI Responsiveness', scope: 'Frontend UI', is_backend: false, is_frontend: true },
  { id: 'st-16', team_id: 't2', category: 'Topics', skill_name: 'Role Based Access Control', scope: 'Backend, Security', is_backend: true, is_frontend: true },

  // Framework
  { id: 'st-17', team_id: 't2', category: 'Framework', skill_name: 'Spring Boot', scope: 'Backend', is_backend: true, is_frontend: false },
  { id: 'st-18', team_id: 't2', category: 'Framework', skill_name: 'Thymeleaf', scope: 'Full Stack', is_backend: true, is_frontend: false },
  { id: 'st-19', team_id: 't2', category: 'Framework', skill_name: 'ReactJS', scope: 'Frontend', is_backend: false, is_frontend: true },
  { id: 'st-20', team_id: 't2', category: 'Framework', skill_name: 'Redux', scope: 'Frontend State', is_backend: false, is_frontend: true },

  // Language
  { id: 'st-21', team_id: 't2', category: 'Language', skill_name: 'Java', scope: 'Backend', is_backend: true, is_frontend: false },
  { id: 'st-22', team_id: 't2', category: 'Language', skill_name: 'JavaScript', scope: 'Full Stack', is_backend: true, is_frontend: true },
  { id: 'st-23', team_id: 't2', category: 'Language', skill_name: 'TypeScript', scope: 'Frontend', is_backend: false, is_frontend: true },
  { id: 'st-24', team_id: 't2', category: 'Language', skill_name: 'Shell Scripting', scope: 'DevOps, Linux', is_backend: true, is_frontend: true },

  // Tools
  { id: 'st-25', team_id: 't2', category: 'Tools', skill_name: 'JUnit', scope: 'Testing, QA', is_backend: true, is_frontend: false },
  { id: 'st-26', team_id: 't2', category: 'Tools', skill_name: 'KeyCloak', scope: 'Security, Auth', is_backend: true, is_frontend: false },
  { id: 'st-27', team_id: 't2', category: 'Tools', skill_name: 'Caffeine Cache', scope: 'Backend Caching', is_backend: true, is_frontend: false },
  { id: 'st-28', team_id: 't2', category: 'Tools', skill_name: 'Wireshark', scope: 'Packet Analysis', is_backend: true, is_frontend: false },
  { id: 'st-29', team_id: 't2', category: 'Tools', skill_name: 'Browser DevTools', scope: 'Frontend Debugging', is_backend: true, is_frontend: true },
  { id: 'st-30', team_id: 't2', category: 'Tools', skill_name: 'Swagger UI', scope: 'API Docs', is_backend: true, is_frontend: true },
  { id: 'st-31', team_id: 't2', category: 'Tools', skill_name: 'API Testing Tools', scope: 'QA, Integration', is_backend: true, is_frontend: true },
  { id: 'st-32', team_id: 't2', category: 'Tools', skill_name: 'Jest', scope: 'Frontend Testing', is_backend: false, is_frontend: true },
  { id: 'st-33', team_id: 't2', category: 'Tools', skill_name: 'Figma', scope: 'UI/UX Design', is_backend: false, is_frontend: true },

  // Database
  { id: 'st-34', team_id: 't2', category: 'Database', skill_name: 'SQL', scope: 'Database', is_backend: true, is_frontend: true },
  { id: 'st-35', team_id: 't2', category: 'Database', skill_name: 'TimescaleDB', scope: 'Time-Series DB', is_backend: true, is_frontend: true },
  { id: 'st-36', team_id: 't2', category: 'Database', skill_name: 'MongoDB', scope: 'NoSQL DB', is_backend: true, is_frontend: true },

  // Networking
  { id: 'st-37', team_id: 't2', category: 'Networking', skill_name: 'IP Addressing', scope: 'Networking', is_backend: true, is_frontend: true },
  { id: 'st-38', team_id: 't2', category: 'Networking', skill_name: 'Routing', scope: 'Networking', is_backend: true, is_frontend: true },
  { id: 'st-39', team_id: 't2', category: 'Networking', skill_name: 'Ports', scope: 'Networking', is_backend: true, is_frontend: true },
  { id: 'st-40', team_id: 't2', category: 'Networking', skill_name: 'Protocols', scope: 'Networking', is_backend: true, is_frontend: true },
  { id: 'st-41', team_id: 't2', category: 'Networking', skill_name: 'Subnetting', scope: 'Networking', is_backend: true, is_frontend: true },
  { id: 'st-42', team_id: 't2', category: 'Networking', skill_name: 'OSI Layer', scope: 'Networking', is_backend: true, is_frontend: true },

  // Container
  { id: 'st-43', team_id: 't2', category: 'Container', skill_name: 'Docker', scope: 'DevOps, Containerization', is_backend: true, is_frontend: true },
  { id: 'st-44', team_id: 't2', category: 'Container', skill_name: 'Kubernetes', scope: 'DevOps, Orchestration', is_backend: true, is_frontend: true },

  // AI Tools
  { id: 'st-45', team_id: 't2', category: 'AI Tools', skill_name: 'Agentic AI', scope: 'AI & Automation', is_backend: true, is_frontend: false },
  { id: 'st-46', team_id: 't2', category: 'AI Tools', skill_name: 'Agentic AI IDE & CLI', scope: 'Developer Tooling', is_backend: false, is_frontend: true },
  { id: 'st-47', team_id: 't2', category: 'AI Tools', skill_name: 'Prompt Engineering', scope: 'AI & LLM', is_backend: true, is_frontend: true },

  // Growth Marketing Team (t5)
  { id: 'st-m1', team_id: 't5', category: 'Channels', skill_name: 'Search Engine Optimization (SEO)', scope: 'SEO, Growth' },
  { id: 'st-m2', team_id: 't5', category: 'Channels', skill_name: 'Google Ads & PPC Campaigns', scope: 'Paid Media' },
  { id: 'st-m3', team_id: 't5', category: 'Content', skill_name: 'Technical Blog & Case Study Writing', scope: 'Content Writing' },
  { id: 'st-m4', team_id: 't5', category: 'Analytics', skill_name: 'Google Analytics 4 & Funnel Tracking', scope: 'Growth Analytics' },
  { id: 'st-m5', team_id: 't5', category: 'Channels', skill_name: 'Social Media & LinkedIn B2B Outreach', scope: 'Social Media, Brand' },

  // HR Operations Team (t4)
  { id: 'st-h1', team_id: 't4', category: 'Talent', skill_name: 'Technical Talent Acquisition & Sourcing', scope: 'Recruitment' },
  { id: 'st-h2', team_id: 't4', category: 'Operations', skill_name: 'Payroll Processing & Statutory Compliance', scope: 'Payroll, Compliance' },
  { id: 'st-h3', team_id: 't4', category: 'Culture', skill_name: 'Employee Engagement & Performance Cycles', scope: 'HR Operations, Culture' },
  { id: 'st-h4', team_id: 't4', category: 'Policy', skill_name: 'HR Policy Drafting & Conflict Resolution', scope: 'Employee Relations' },

  // Product & Design Team (t3)
  { id: 'st-p1', team_id: 't3', category: 'Design', skill_name: 'Figma UI/UX & Design Systems', scope: 'UI Design' },
  { id: 'st-p2', team_id: 't3', category: 'Research', skill_name: 'User Interviews & Usability Testing', scope: 'UX Research' },
  { id: 'st-p3', team_id: 't3', category: 'Product', skill_name: 'PRD Drafting & Roadmap Prioritization', scope: 'Product Strategy' },
  { id: 'st-p4', team_id: 't3', category: 'Analytics', skill_name: 'Product Analytics & User Flow Optimization', scope: 'Product Analytics' }
];

let memRoadmaps = [
  {
    id: 'rm-1',
    team_id: 't2', // Backend Platform / SDN Team
    title: '5G Core Network & SDN Controller Integration',
    description: 'Implement high-throughput packet routing, distributed caching, and automated failover controllers.',
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
    title: 'Design Threading & Caffeine Cache Architecture',
    description: 'Optimize concurrent memory lookups for active 5G network flow tables.',
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
    title: 'Implement SDN Controller Packet Analysis with Wireshark',
    description: 'Set up real-time packet inspection and automated alerting for dropped frames.',
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

// Initialize default users with bcrypt hashes
async function initSeedUsers() {
  const hashDemo = await bcrypt.hash('demo123', 10);
  const hashSuper = await bcrypt.hash(HARDCODED_SUPERADMIN_PASS, 10);

  memProfiles = [
    { id: 'u-superadmin-default', full_name: HARDCODED_SUPERADMIN_NAME, email: HARDCODED_SUPERADMIN_EMAIL, password_hash: hashSuper, role: 'super_admin', department: 'Executive', team_id: 't1', avatar_initials: 'SA', created_at: new Date().toISOString() },
    { id: 'u2', full_name: 'Sarah Chen', email: 'manager@company.com', password_hash: hashDemo, role: 'manager', department: 'Engineering', team_id: 't1', avatar_initials: 'SC', created_at: new Date().toISOString() },
    { id: 'u3', full_name: 'Elena Rostova', email: 'hr@company.com', password_hash: hashDemo, role: 'admin', department: 'Human Resources', team_id: 't4', avatar_initials: 'ER', created_at: new Date().toISOString() },
    { id: 'u4', full_name: 'Marcus Vance', email: 'employee@company.com', password_hash: hashDemo, role: 'employee', department: 'Engineering', team_id: 't1', avatar_initials: 'MV', created_at: new Date().toISOString() }
  ];

  memFeedback = [
    { id: 'f1', giver_id: 'u2', receiver_id: 'u4', feedback_type: 'downward', review_cycle: 'c1', content: 'Marcus consistently delivers high quality code on time and leads sprint architecture discussions efficiently.', rating: 5, is_anonymous: false, created_at: new Date().toISOString() },
    { id: 'f2', giver_id: 'u4', receiver_id: 'u2', feedback_type: 'upward', review_cycle: 'c1', content: 'Sarah provides clear guidance and fosters a supportive environment for team growth.', rating: 5, is_anonymous: true, created_at: new Date().toISOString() }
  ];
}

async function ensureSuperAdminAccount() {
  const hash = await bcrypt.hash(HARDCODED_SUPERADMIN_PASS, 10);
  const emailClean = HARDCODED_SUPERADMIN_EMAIL.toLowerCase();

  if (usePg) {
    try {
      const check = await pool.query('SELECT id FROM profiles WHERE LOWER(email) = $1', [emailClean]);
      if (check.rows.length === 0) {
        await pool.query(
          `INSERT INTO profiles (id, full_name, email, password_hash, role, department, avatar_initials, created_at)
           VALUES ($1, $2, $3, $4, 'super_admin', 'Executive', 'SA', NOW())`,
          ['u-superadmin-default', HARDCODED_SUPERADMIN_NAME, emailClean, hash]
        );
        console.log(`✅ Default SuperAdmin account (${HARDCODED_SUPERADMIN_EMAIL}) created in PostgreSQL database.`);
      } else {
        console.log(`ℹ️ SuperAdmin account (${HARDCODED_SUPERADMIN_EMAIL}) already exists in PostgreSQL database. One-time creation skipped.`);
      }
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
        category VARCHAR(50) NOT NULL,
        skill_name VARCHAR(100) NOT NULL,
        scope VARCHAR(150) DEFAULT 'General',
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

    // Add scope column if not present in existing PG table
    try {
      await pool.query('ALTER TABLE skill_templates ADD COLUMN IF NOT EXISTS scope VARCHAR(150) DEFAULT \'General\'');
    } catch(e) {}

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

    // Seed skill templates if empty in PG
    const stCount = await pool.query('SELECT count(*) FROM skill_templates');
    if (parseInt(stCount.rows[0].count, 10) === 0) {
      for (const st of memSkillTemplates) {
        await pool.query(
          'INSERT INTO skill_templates (id, team_id, category, skill_name, scope, is_backend, is_frontend) VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT DO NOTHING',
          [st.id, st.team_id, st.category, st.skill_name, st.scope || 'General', st.is_backend || false, st.is_frontend || false]
        );
      }
      console.log('✅ PostgreSQL database populated with default Skill Matrix templates for SDN Controller team.');
    }

    // Check if superadmin exists in PG, seed if empty
    const res = await pool.query('SELECT count(*) FROM profiles');
    if (parseInt(res.rows[0].count, 10) === 0) {
      for (const d of memDepartments) {
        await pool.query('INSERT INTO departments (id, name) VALUES ($1, $2) ON CONFLICT DO NOTHING', [d.id, d.name]);
      }
      for (const t of memTeams) {
        await pool.query('INSERT INTO teams (id, name, department, manager_id) VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING', [t.id, t.name, t.department, t.manager_id]);
      }
      for (const p of memProfiles) {
        await pool.query('INSERT INTO profiles (id, full_name, email, password_hash, role, department, team_id, avatar_initials) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) ON CONFLICT DO NOTHING',
          [p.id, p.full_name, p.email, p.password_hash, p.role, p.department, p.team_id, p.avatar_initials]);
      }
      for (const c of memCycles) {
        await pool.query('INSERT INTO review_cycles (id, title, start_date, end_date, status) VALUES ($1, $2, $3, $4, $5) ON CONFLICT DO NOTHING', [c.id, c.title, c.start_date, c.end_date, c.status]);
      }
      for (const f of memFeedback) {
        await pool.query('INSERT INTO feedback (id, giver_id, receiver_id, feedback_type, review_cycle, content, rating, is_anonymous) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) ON CONFLICT DO NOTHING',
          [f.id, f.giver_id, f.receiver_id, f.feedback_type, f.review_cycle, f.content, f.rating, f.is_anonymous]);
      }
      console.log('✅ PostgreSQL database populated with seed profiles & departments.');
    }
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
    const q = await pool.query('SELECT id, full_name, email, role, department, team_id, avatar_initials, created_at FROM profiles WHERE id = $1', [req.user.id]);
    if (q.rows.length > 0) user = q.rows[0];
  } else {
    const p = memProfiles.find(x => x.id === req.user.id);
    if (p) {
      const { password_hash, ...rest } = p;
      user = rest;
    }
  }
  if (!user) return res.status(404).json({ error: 'User profile not found.' });
  res.json(user);
});

// 3. SUPER ADMIN / ADMIN USER PROVISIONING (Create User Account)
// Self registration is REMOVED. Accounts must be created by SuperAdmin or Admin.
app.post('/api/users', authenticateToken, requireRoles('super_admin', 'admin'), async (req, res) => {
  const { full_name, email, password, role, department, team_id } = req.body;

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

  const newUser = {
    id: newId,
    full_name: full_name.trim(),
    email: emailClean,
    password_hash: hashedPassword,
    role: assignedRole,
    department: department || null,
    team_id: team_id || null,
    avatar_initials: initials,
    created_at: new Date().toISOString()
  };

  if (usePg) {
    await pool.query(
      `INSERT INTO profiles (id, full_name, email, password_hash, role, department, team_id, avatar_initials, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())`,
      [newUser.id, newUser.full_name, newUser.email, newUser.password_hash, newUser.role, newUser.department, newUser.team_id, newUser.avatar_initials]
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
    const q = await pool.query('SELECT id, full_name, email, role, department, team_id, avatar_initials, created_at FROM profiles ORDER BY full_name ASC');
    res.json(q.rows);
  } else {
    const list = memProfiles.map(({ password_hash, ...rest }) => rest);
    res.json(list);
  }
});

// 5. UPDATE USER ROLE / TEAM / PROFILE
app.put('/api/users/:id', authenticateToken, async (req, res) => {
  const targetId = req.params.id;
  const { role, team_id, department, full_name } = req.body;

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

  if (usePg) {
    const fields = [];
    const values = [];
    let idx = 1;

    if (role && isAdmin) { fields.push(`role = $${idx++}`); values.push(role); }
    if (team_id !== undefined && isAdmin) { fields.push(`team_id = $${idx++}`); values.push(team_id || null); }
    if (department !== undefined) { fields.push(`department = $${idx++}`); values.push(department || null); }
    if (full_name) { fields.push(`full_name = $${idx++}`); values.push(full_name); }
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
      if (department !== undefined) target.department = department || null;
      if (full_name) {
        target.full_name = full_name;
        target.avatar_initials = avatarInitials(full_name);
      }
    }
  }

  res.json({ message: 'User profile updated successfully.' });
});

// 6. DELETE USER ACCOUNT (SUPER ADMIN ONLY)
app.delete('/api/users/:id', authenticateToken, requireRoles('super_admin'), async (req, res) => {
  const targetId = req.params.id;
  if (targetId === req.user.id) {
    return res.status(400).json({ error: 'You cannot delete your own Super Admin account.' });
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

  if (!receiver_id || !content || !rating) {
    return res.status(400).json({ error: 'Receiver, content, and rating are required.' });
  }

  const id = 'f-' + Date.now();
  const newItem = {
    id,
    giver_id: req.user.id,
    receiver_id,
    feedback_type: feedback_type || 'peer',
    review_cycle: review_cycle || null,
    content,
    rating: parseInt(rating, 10),
    is_anonymous: Boolean(is_anonymous),
    created_at: new Date().toISOString()
  };

  if (usePg) {
    await pool.query(
      `INSERT INTO feedback (id, giver_id, receiver_id, feedback_type, review_cycle, content, rating, is_anonymous)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [newItem.id, newItem.giver_id, newItem.receiver_id, newItem.feedback_type, newItem.review_cycle, newItem.content, newItem.rating, newItem.is_anonymous]
    );
  } else {
    memFeedback.push(newItem);
  }

  res.status(201).json(newItem);
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

// 11. SKILL TEMPLATES (TEAM SPECIFIC)
app.get('/api/skill-templates', authenticateToken, async (req, res) => {
  const teamId = req.query.team_id || 't2'; // default to t2 (Backend Platform / SDN Controller Team)

  if (usePg) {
    const q = await pool.query('SELECT * FROM skill_templates WHERE team_id = $1 ORDER BY category ASC, skill_name ASC', [teamId]);
    if (q.rows.length > 0) return res.json(q.rows);
    // If no custom template for team in PG, return default set
    const fallbackQ = await pool.query('SELECT * FROM skill_templates WHERE team_id = $1 ORDER BY category ASC, skill_name ASC', ['t2']);
    return res.json(fallbackQ.rows);
  } else {
    const items = memSkillTemplates.filter(st => st.team_id === teamId);
    if (items.length > 0) return res.json(items);
    // Fallback to t2 if no custom items defined for requested team
    return res.json(memSkillTemplates.filter(st => st.team_id === 't2'));
  }
});

app.post('/api/skill-templates', authenticateToken, requireRoles('super_admin'), async (req, res) => {
  const { team_id, category, skill_name, scope, is_backend, is_frontend } = req.body;
  if (!category || !skill_name) {
    return res.status(400).json({ error: 'Category and skill name are required.' });
  }

  const id = 'st-' + Date.now();
  const calculatedScope = scope || (is_backend && is_frontend ? 'Backend, Frontend' : is_backend ? 'Backend' : is_frontend ? 'Frontend' : 'General');

  const newItem = {
    id,
    team_id: team_id || 't2',
    category,
    skill_name,
    scope: calculatedScope,
    is_backend: is_backend !== undefined ? Boolean(is_backend) : calculatedScope.toLowerCase().includes('backend'),
    is_frontend: is_frontend !== undefined ? Boolean(is_frontend) : calculatedScope.toLowerCase().includes('frontend'),
    created_at: new Date().toISOString()
  };

  if (usePg) {
    await pool.query(
      'INSERT INTO skill_templates (id, team_id, category, skill_name, scope, is_backend, is_frontend) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [newItem.id, newItem.team_id, newItem.category, newItem.skill_name, newItem.scope, newItem.is_backend, newItem.is_frontend]
    );
  } else {
    memSkillTemplates.push(newItem);
  }

  res.status(201).json(newItem);
});

app.put('/api/skill-templates/:id', authenticateToken, requireRoles('super_admin'), async (req, res) => {
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

app.delete('/api/skill-templates/:id', authenticateToken, requireRoles('super_admin'), async (req, res) => {
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

  const reviewId = existingIdx >= 0 ? memQuarterlyReviews[existingIdx].id : 'qr-' + Date.now();
  const reviewObj = {
    id: reviewId,
    employee_id,
    manager_id: manager_id || null,
    team_id: team_id || null,
    quarter,
    year: parseInt(year, 10),
    status: status || 'submitted',
    self_review_data,
    kpi_data,
    skill_matrix_data,
    overall_score: overall_score || 4.5,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  if (usePg) {
    await pool.query(
      `INSERT INTO quarterly_reviews (id, employee_id, manager_id, team_id, quarter, year, status, self_review_data, kpi_data, skill_matrix_data, overall_score, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())
       ON CONFLICT (employee_id, quarter, year) DO UPDATE SET
         manager_id = EXCLUDED.manager_id,
         team_id = EXCLUDED.team_id,
         status = EXCLUDED.status,
         self_review_data = EXCLUDED.self_review_data,
         kpi_data = EXCLUDED.kpi_data,
         skill_matrix_data = EXCLUDED.skill_matrix_data,
         overall_score = EXCLUDED.overall_score,
         updated_at = NOW()`,
      [reviewObj.id, reviewObj.employee_id, reviewObj.manager_id, reviewObj.team_id, reviewObj.quarter, reviewObj.year, reviewObj.status,
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

// Fallback to index.html for SPA routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Start Server
initDbConnection().then(() => {
  app.listen(PORT, HOST, () => {
    console.log(`🚀 Vectyra Server running on http://${HOST === '0.0.0.0' ? '0.0.0.0' : HOST}:${PORT}`);
  });
});
