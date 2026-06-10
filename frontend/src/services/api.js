const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const api = {
  // Teams
  getTeams: () => fetch(`${API_URL}/api/teams-service/teams`).then(r => r.json()),
  createTeam: (data) => fetch(`${API_URL}/api/teams-service/teams`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }).then(r => r.json()),
  updateTeam: (id, data) => fetch(`${API_URL}/api/teams-service/teams/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }).then(r => r.json()),
  deleteTeam: (id) => fetch(`${API_URL}/api/teams-service/teams/${id}`, { method: 'DELETE' }),

  // Individuals
  getIndividuals: () => fetch(`${API_URL}/api/individuals-service/individuals`).then(r => r.json()),
  createIndividual: (data) => fetch(`${API_URL}/api/individuals-service/individuals`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }).then(r => r.json()),
  updateIndividual: (id, data) => fetch(`${API_URL}/api/individuals-service/individuals/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }).then(r => r.json()),
  deleteIndividual: (id) => fetch(`${API_URL}/api/individuals-service/individuals/${id}`, { method: 'DELETE' }),

  // Achievements
  getAchievements: () => fetch(`${API_URL}/api/achievements-service/achievements`).then(r => r.json()),
  createAchievement: (data) => fetch(`${API_URL}/api/achievements-service/achievements`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }).then(r => r.json()),
  updateAchievement: (id, data) => fetch(`${API_URL}/api/achievements-service/achievements/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }).then(r => r.json()),
  deleteAchievement: (id) => fetch(`${API_URL}/api/achievements-service/achievements/${id}`, { method: 'DELETE' }),

  // Auth
  login: (data) => fetch(`${API_URL}/api/auth-service/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }).then(r => r.json()),
  getUsers: () => fetch(`${API_URL}/api/auth-service/users`).then(r => r.json()),

  // Projects
  getProjects: () => fetch(`${API_URL}/api/projects-service/projects`).then(r => r.json()),
  getProject: (id) => fetch(`${API_URL}/api/projects-service/projects/${id}`).then(r => r.json()),
  createProject: (data) => fetch(`${API_URL}/api/projects-service/projects`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }).then(r => r.json()),
  updateProject: (id, data) => fetch(`${API_URL}/api/projects-service/projects/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }).then(r => r.json()),
  deleteProject: (id) => fetch(`${API_URL}/api/projects-service/projects/${id}`, { method: 'DELETE' }),

  // Deliverables
  getDeliverables: (projectId) => fetch(`${API_URL}/api/projects-service/projects/${projectId}/deliverables`).then(r => r.json()),
  createDeliverable: (projectId, data) => fetch(`${API_URL}/api/projects-service/projects/${projectId}/deliverables`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }).then(r => r.json()),
  updateDeliverable: (id, data) => fetch(`${API_URL}/api/projects-service/deliverables/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }).then(r => r.json()),
  deleteDeliverable: (id) => fetch(`${API_URL}/api/projects-service/deliverables/${id}`, { method: 'DELETE' }),
};

export default api;