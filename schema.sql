-- ═══════════════════════════════════════════════════════════════════════
-- VECTYRA — POSTGRESQL SCHEMA & INITIAL DATA SEED
-- ═══════════════════════════════════════════════════════════════════════

-- Enable UUID extension if available
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables if re-initializing
DROP TABLE IF EXISTS quarterly_reviews CASCADE;
DROP TABLE IF EXISTS skill_templates CASCADE;
DROP TABLE IF EXISTS feedback CASCADE;
DROP TABLE IF EXISTS review_cycles CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS teams CASCADE;
DROP TABLE IF EXISTS departments CASCADE;

-- 1. DEPARTMENTS
CREATE TABLE departments (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. TEAMS
CREATE TABLE teams (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    department VARCHAR(100) REFERENCES departments(name) ON DELETE SET NULL,
    manager_id VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. PROFILES / USERS
CREATE TABLE profiles (
    id VARCHAR(50) PRIMARY KEY,
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(30) NOT NULL DEFAULT 'employee' CHECK (role IN ('employee', 'manager', 'admin', 'super_admin')),
    department VARCHAR(100),
    team_id VARCHAR(50) REFERENCES teams(id) ON DELETE SET NULL,
    avatar_initials VARCHAR(10),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add foreign key constraint for manager_id after profiles table creation
ALTER TABLE teams ADD CONSTRAINT fk_teams_manager FOREIGN KEY (manager_id) REFERENCES profiles(id) ON DELETE SET NULL;

-- 4. REVIEW CYCLES
CREATE TABLE review_cycles (
    id VARCHAR(50) PRIMARY KEY,
    title VARCHAR(150) NOT NULL,
    start_date DATE,
    end_date DATE,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'upcoming')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. FEEDBACK
CREATE TABLE feedback (
    id VARCHAR(50) PRIMARY KEY,
    giver_id VARCHAR(50) REFERENCES profiles(id) ON DELETE CASCADE,
    receiver_id VARCHAR(50) REFERENCES profiles(id) ON DELETE CASCADE,
    feedback_type VARCHAR(30) NOT NULL CHECK (feedback_type IN ('peer', 'upward', 'downward', 'self')),
    review_cycle VARCHAR(50) REFERENCES review_cycles(id) ON DELETE SET NULL,
    content TEXT NOT NULL,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    is_anonymous BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. QUARTERLY REVIEWS (UNIFIED SELF REVIEW, KPI & SKILL MATRIX)
CREATE TABLE quarterly_reviews (
    id VARCHAR(50) PRIMARY KEY,
    employee_id VARCHAR(50) REFERENCES profiles(id) ON DELETE CASCADE,
    manager_id VARCHAR(50) REFERENCES profiles(id) ON DELETE SET NULL,
    team_id VARCHAR(50) REFERENCES teams(id) ON DELETE SET NULL,
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

-- 7. SKILL TEMPLATES (TEAM SPECIFIC SKILL MATRIX DEFINITIONS)
CREATE TABLE skill_templates (
    id VARCHAR(50) PRIMARY KEY,
    team_id VARCHAR(50) REFERENCES teams(id) ON DELETE CASCADE,
    category VARCHAR(50) NOT NULL,
    skill_name VARCHAR(100) NOT NULL,
    scope VARCHAR(150) DEFAULT 'General',
    is_backend BOOLEAN DEFAULT TRUE,
    is_frontend BOOLEAN DEFAULT TRUE,
-- 8. ROADMAPS (TEAM GOALS & STRATEGIC MILESTONES)
CREATE TABLE roadmaps (
    id VARCHAR(50) PRIMARY KEY,
    team_id VARCHAR(50) REFERENCES teams(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    quarter VARCHAR(50) NOT NULL,
    year INTEGER NOT NULL,
    status VARCHAR(30) DEFAULT 'in_progress' CHECK (status IN ('planned', 'in_progress', 'completed', 'delayed')),
    created_by VARCHAR(50) REFERENCES profiles(id) ON DELETE SET NULL,
    target_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 9. ROADMAP TASKS (INDIVIDUAL TASKS ASSIGNED TO TEAM MEMBERS)
CREATE TABLE roadmap_tasks (
    id VARCHAR(50) PRIMARY KEY,
    roadmap_id VARCHAR(50) REFERENCES roadmaps(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    assigned_to VARCHAR(50) REFERENCES profiles(id) ON DELETE SET NULL,
    assigned_by VARCHAR(50) REFERENCES profiles(id) ON DELETE SET NULL,
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    status VARCHAR(30) DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'in_review', 'done')),
    progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    due_date DATE,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ═══════════════════════════════════════════════════════════════════════
-- INITIAL SEED DATA
-- Default superadmin password: demo123 (bcrypt hashed below: $2a$10$wW4/z2o4P8u... or generated on server init)
-- ═══════════════════════════════════════════════════════════════════════

INSERT INTO departments (id, name) VALUES
('d1', 'Engineering'),
('d2', 'Product & Design'),
('d3', 'Human Resources'),
('d4', 'Marketing & Sales'),
('d5', 'Customer Support');

INSERT INTO teams (id, name, department) VALUES
('t1', 'Frontend Engineering', 'Engineering'),
('t2', 'Backend Platform', 'Engineering'),
('t3', 'Product Experience', 'Product & Design'),
('t4', 'HR Operations', 'Human Resources'),
('t5', 'Growth Marketing', 'Marketing & Sales');

-- Note: The Express server automatically ensures default accounts exist with bcrypt-hashed passwords.
