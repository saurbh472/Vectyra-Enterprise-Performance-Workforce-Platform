// ═══════════════════════════════════════════════════════════════════════
// VECTYRA REST API CLIENT MODULE (POSTGRES / EXPRESS BACKEND)
// ═══════════════════════════════════════════════════════════════════════

const API = {
  getToken() {
    return localStorage.getItem('VECTYRA_AUTH_TOKEN') || localStorage.getItem('PC_AUTH_TOKEN') || '';
  },
  
  setToken(token) {
    if (token) {
      localStorage.setItem('VECTYRA_AUTH_TOKEN', token);
    } else {
      localStorage.removeItem('VECTYRA_AUTH_TOKEN');
      localStorage.removeItem('PC_AUTH_TOKEN');
    }
  },

  getBaseUrl() {
    // When served over HTTP/HTTPS from the unified container / Express server, use relative path ('')
    // This allows the app to work on ANY VM IP, domain, or port without hardcoded addresses
    if (window.location.port === '5500' || window.location.port === '5173') {
      return `${window.location.protocol}//${window.location.hostname}:3000`;
    }
    if (window.location.protocol === 'file:') {
      return 'http://localhost:3000';
    }
    return '';
  },

  async request(endpoint, options = {}) {
    const token = this.getToken();
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const fullUrl = endpoint.startsWith('http') ? endpoint : `${this.getBaseUrl()}${endpoint}`;

    try {
      const response = await fetch(fullUrl, {
        ...options,
        headers
      });

      const contentType = response.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        throw new Error(`Non-JSON response received from ${endpoint}. Ensure backend Express server is running and restarted.`);
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP error ${response.status}`);
      }

      return data;
    } catch (err) {
      console.error(`API Error [${endpoint}]:`, err);
      throw err;
    }
  },

  // Auth Methods
  async login(email, password) {
    const res = await this.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    if (res.token) {
      this.setToken(res.token);
    }
    return res;
  },

  async me() {
    return await this.request('/api/auth/me');
  },

  logout() {
    this.setToken(null);
  },

  // User Management Methods (SuperAdmin / Admin)
  async createUser(userData) {
    return await this.request('/api/users', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
  },

  async getUsers() {
    return await this.request('/api/users');
  },

  async updateUser(userId, data) {
    return await this.request(`/api/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },

  async deleteUser(userId) {
    return await this.request(`/api/users/${userId}`, {
      method: 'DELETE'
    });
  },

  // Meta & Entities
  async getDepartments() {
    return await this.request('/api/departments');
  },

  async createDepartment(name) {
    return await this.request('/api/departments', {
      method: 'POST',
      body: JSON.stringify({ name })
    });
  },

  async getTeams() {
    return await this.request('/api/teams');
  },

  async createTeam(data) {
    return await this.request('/api/teams', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async getCycles() {
    return await this.request('/api/cycles');
  },

  async createCycle(data) {
    return await this.request('/api/cycles', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  // Feedback Methods
  async getFeedback() {
    return await this.request('/api/feedback');
  },

  async createFeedback(data) {
    return await this.request('/api/feedback', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async deleteFeedback(id) {
    return await this.request(`/api/feedback/${id}`, {
      method: 'DELETE'
    });
  },

  // Skill Templates & Quarterly Reviews
  async getSkillTemplates(teamId = 't2') {
    return await this.request(`/api/skill-templates?team_id=${encodeURIComponent(teamId)}`);
  },

  async addSkillTemplate(data) {
    return await this.request('/api/skill-templates', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async updateSkillTemplate(id, data) {
    return await this.request(`/api/skill-templates/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },

  async deleteSkillTemplate(id) {
    return await this.request(`/api/skill-templates/${id}`, {
      method: 'DELETE'
    });
  },

  async getQuarterlyReviews(params = {}) {
    const query = new URLSearchParams(params).toString();
    return await this.request(`/api/quarterly-reviews${query ? '?' + query : ''}`);
  },

  async getQuarterlyReviewById(id) {
    return await this.request(`/api/quarterly-reviews/${id}`);
  },

  async saveQuarterlyReview(data) {
    return await this.request('/api/quarterly-reviews', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async submitManagerReview(id, data) {
    return await this.request(`/api/quarterly-reviews/${id}/manager-review`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },

  // Roadmaps & Assigned Tasks
  async getRoadmaps(params = {}) {
    const query = new URLSearchParams(params).toString();
    return await this.request(`/api/roadmaps${query ? '?' + query : ''}`);
  },

  async createRoadmap(data) {
    return await this.request('/api/roadmaps', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async updateRoadmap(id, data) {
    return await this.request(`/api/roadmaps/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },

  async deleteRoadmap(id) {
    return await this.request(`/api/roadmaps/${id}`, {
      method: 'DELETE'
    });
  },

  async createRoadmapTask(roadmapId, data) {
    return await this.request(`/api/roadmaps/${roadmapId}/tasks`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async updateRoadmapTask(taskId, data) {
    return await this.request(`/api/roadmap-tasks/${taskId}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },

  async deleteRoadmapTask(taskId) {
    return await this.request(`/api/roadmap-tasks/${taskId}`, {
      method: 'DELETE'
    });
  }
};
