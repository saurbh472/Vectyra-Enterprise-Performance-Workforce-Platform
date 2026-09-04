// ═══════════════════════════════════════════════
// GLOBAL STATE & MOCK DATA
// ═══════════════════════════════════════════════
let currentUser    = null;
let currentProfile = null;
let allUsers       = [];
let allTeams       = [];
let allDepartments = [];
let allGoals       = [];
let allBadges      = [];
let feedbackCache  = [];
let allRoadmaps    = [];
let isDemo         = localStorage.getItem('PC_DEMO_MODE') === 'true';

const MOCK_ROADMAPS = [
  {
    id: 'rm-1',
    team_id: 't2',
    title: '5G Core Network & SDN Controller Integration',
    description: 'Implement high-throughput packet routing, distributed caching, and automated failover controllers.',
    quarter: 'Q3 2026',
    year: 2026,
    status: 'in_progress',
    created_by: 'u2',
    target_date: '2026-09-30',
    created_at: new Date(Date.now() - 15 * 86400000).toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'rm-2',
    team_id: 't1',
    title: 'Design System & Unified SPA Portal Modernization',
    description: 'Revamp UI components with glassmorphic modern design, role-based workflows, and instant client caching.',
    quarter: 'Q3 2026',
    year: 2026,
    status: 'in_progress',
    created_by: 'u2',
    target_date: '2026-09-15',
    created_at: new Date(Date.now() - 20 * 86400000).toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'rm-3',
    team_id: 't4',
    title: 'Continuous 360 Review & Performance Appraisal Automation',
    description: 'Deploy quarterly skill matrix assessments, peer reviews, and automated confidential feedback routing.',
    quarter: 'Q3 2026',
    year: 2026,
    status: 'in_progress',
    created_by: 'u3',
    target_date: '2026-09-30',
    created_at: new Date(Date.now() - 10 * 86400000).toISOString(),
    updated_at: new Date().toISOString()
  }
];

const MOCK_ROADMAP_TASKS = [
  {
    id: 'task-1',
    roadmap_id: 'rm-1',
    title: 'Design Threading & Caffeine Cache Architecture',
    description: 'Optimize concurrent memory lookups for active 5G network flow tables.',
    assigned_to: 'u4',
    assigned_by: 'u2',
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

const MOCK_BADGES = [
  { id: 'b1', badge_type: 'team_player', icon: '🤝', title: 'Team Player', awarded_to: 'u-emp', awarded_by: 'u-mgr', comment: 'Always helps out during tight sprint deadlines!', created_at: new Date().toISOString() },
  { id: 'b2', badge_type: 'problem_solver', icon: '💡', title: 'Problem Solver', awarded_to: 'u-emp', awarded_by: 'u-super', comment: 'Found and resolved the latency bottleneck in record time.', created_at: new Date().toISOString() },
  { id: 'b3', badge_type: 'initiative_taker', icon: '🚀', title: 'Initiative Taker', awarded_to: 'u-mgr', awarded_by: 'u-admin', comment: 'Proactively led the quarterly review framework setup.', created_at: new Date().toISOString() }
];

const MOCK_GOALS = [
  { id: 'g1', title: 'Deliver Q2 System Architecture Refactor', description: 'Complete backend module separation and document API specs.', assigned_to: 'u-emp', assigned_by: 'u-mgr', target_date: '2026-06-30', progress: 75, status: 'In Progress', created_at: new Date().toISOString() },
  { id: 'g2', title: 'Achieve 95%+ Sprint Commitment Reliability', description: 'Deliver all assigned user stories within sprint boundaries.', assigned_to: 'u-emp', assigned_by: 'u-super', target_date: '2026-06-30', progress: 90, status: 'In Progress', created_at: new Date().toISOString() },
  { id: 'g3', title: 'Conduct Team Knowledge Sharing Sessions', description: 'Host 2 technical workshops for team members on best practices.', assigned_to: 'u-mgr', assigned_by: 'u-super', target_date: '2026-06-15', progress: 50, status: 'In Progress', created_at: new Date().toISOString() }
];

const MOCK_DEPARTMENTS = [
  { id:'d1', name:'Engineering',      description:'Software, infrastructure & tech systems' },
  { id:'d2', name:'Product & Design', description:'Product management & UI/UX design' },
  { id:'d3', name:'Human Resources',  description:'People, culture & talent management' },
  { id:'d4', name:'Marketing & Sales',description:'Revenue generation & brand growth' },
  { id:'d5', name:'Customer Support', description:'Client success & support operations' }
];

const MOCK_TEAMS = [
  { id:'t1', name:'Frontend Engineering', department:'Engineering', manager_id:'u2' },
  { id:'t2', name:'Backend Platform', department:'Engineering', manager_id:'u2' },
  { id:'t3', name:'Product Experience', department:'Product & Design', manager_id:'u2' },
  { id:'t4', name:'HR Operations', department:'Human Resources', manager_id:'u3' },
  { id:'t5', name:'Growth Marketing', department:'Marketing & Sales', manager_id:'u2' }
];

const MOCK_PROFILES = [
  { id:'u-superadmin-default', full_name:'Saurabh Sharma (Super Admin)', email:'saurabhsharma@niralnetworks.in', role:'super_admin', department:'Executive', team_id:'t1', avatar_initials:'SS' },
  { id:'u2', full_name:'Sarah Chen', email:'manager@company.com', role:'manager', department:'Engineering', team_id:'t1', avatar_initials:'SC' },
  { id:'u3', full_name:'Elena Rostova', email:'hr@company.com', role:'admin', department:'Human Resources', team_id:'t4', avatar_initials:'ER' },
  { id:'u4', full_name:'Marcus Vance', email:'employee@company.com', role:'employee', department:'Engineering', team_id:'t1', avatar_initials:'MV' }
];

let MOCK_FEEDBACK = [
  {
    id: 'f1', giver_id: 'u2', receiver_id: 'u4', feedback_type: 'downward', review_cycle: 'c1',
    content: 'Marcus consistently delivers high quality code on time and leads sprint architecture discussions efficiently.',
    rating: 5, is_anonymous: false, created_at: new Date(Date.now() - 1*86400000).toISOString()
  },
  {
    id: 'f2', giver_id: 'u4', receiver_id: 'u2', feedback_type: 'upward', review_cycle: 'c1',
    content: 'Sarah provides clear guidance and fosters a supportive environment for team growth.',
    rating: 5, is_anonymous: true, created_at: new Date(Date.now() - 3*86400000).toISOString()
  }
];

// Data Loaders using REST API Client
async function loadProfile() {
  if (isDemo) return;
  try {
    const user = await API.me();
    currentProfile = user;
    currentUser = user;
  } catch (err) {
    console.error('loadProfile error:', err);
    throw err;
  }
}

async function loadMeta() {
  if (isDemo) {
    allUsers = [...MOCK_PROFILES];
    allTeams = [...MOCK_TEAMS];
    const savedDepts  = localStorage.getItem('PC_DEPARTMENTS');
    const savedGoals  = localStorage.getItem('PC_GOALS');
    const savedBadges = localStorage.getItem('PC_BADGES');
    allDepartments = savedDepts  ? JSON.parse(savedDepts)  : [...MOCK_DEPARTMENTS];
    allGoals       = savedGoals  ? JSON.parse(savedGoals)  : [...MOCK_GOALS];
    allBadges      = savedBadges ? JSON.parse(savedBadges) : [...MOCK_BADGES];
    return;
  }
  
  try {
    const [users, teams, depts] = await Promise.all([
      API.getUsers().catch(() => MOCK_PROFILES),
      API.getTeams().catch(() => MOCK_TEAMS),
      API.getDepartments().catch(() => MOCK_DEPARTMENTS)
    ]);
    allUsers = users || [];
    allTeams = teams || [];
    allDepartments = depts || [];
  } catch(err) {
    console.warn('Error loading users/teams/depts:', err);
  }

  // Fetch goals & badges from local storage or defaults
  const savedGoals  = localStorage.getItem('PC_GOALS');
  const savedBadges = localStorage.getItem('PC_BADGES');
  allGoals  = savedGoals  ? JSON.parse(savedGoals)  : [...MOCK_GOALS];
  allBadges = savedBadges ? JSON.parse(savedBadges) : [...MOCK_BADGES];
}

function saveDepartments(list) {
  allDepartments = list;
  localStorage.setItem('PC_DEPARTMENTS', JSON.stringify(list));
}

function saveGoals(list) {
  allGoals = list;
  localStorage.setItem('PC_GOALS', JSON.stringify(list));
}

function saveBadges(list) {
  allBadges = list;
  localStorage.setItem('PC_BADGES', JSON.stringify(list));
}

function checkConfigVisibility() {
  // Config modal is no longer needed since backend connects directly to PostgreSQL
}
