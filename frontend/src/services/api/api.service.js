import axios from 'axios';

// Create axios instance with base URL
const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Projects API
export const getProjects = () => API.get('/projects');
export const getProjectById = (id) => API.get(`/projects/${id}`);
export const createProject = (projectData) => API.post('/projects', projectData);
export const updateProject = (id, projectData) => API.put(`/projects/${id}`, projectData);
export const deleteProject = (id) => API.delete(`/projects/${id}`);
export const getProjectConfigurations = (id) => API.get(`/projects/${id}/configurations`);
export const saveProjectConfiguration = (id, configData) => API.post(`/projects/${id}/configurations`, configData);
export const getProjectResults = (id) => API.get(`/projects/${id}/results`);

// GSM Calculator API
export const calculateGsmDimensioning = (params) => API.post('/calculate/gsm', params);
export const calculateCellRadius = (params) => API.post('/calculate/gsm/cell-radius', params);
export const calculateBtsCount = (params) => API.post('/calculate/gsm/bts-count', params);
export const calculateTrafficCapacity = (params) => API.post('/calculate/gsm/traffic-capacity', params);

// UMTS Calculator API
export const calculateUmtsDimensioning = (params) => API.post('/calculate/umts', params);
export const calculateUplinkCapacity = (params) => API.post('/calculate/umts/uplink-capacity', params);
export const calculateDownlinkCapacity = (params) => API.post('/calculate/umts/downlink-capacity', params);
export const calculateCellCoverage = (params) => API.post('/calculate/umts/cell-coverage', params);

// Hertzian Link Calculator API
export const calculateHertzianLinkBudget = (params) => API.post('/calculate/hertzian', params);
export const calculateFreeSpaceLoss = (params) => API.post('/calculate/hertzian/free-space-loss', params);
export const calculateLinkMargin = (params) => API.post('/calculate/hertzian/link-margin', params);
export const calculateLinkAvailability = (params) => API.post('/calculate/hertzian/link-availability', params);

// Optical Link Calculator API
export const calculateOpticalLinkBudget = (params) => API.post('/calculate/optical', params);
export const calculateOpticalBudget = (params) => API.post('/calculate/optical/optical-budget', params);
export const calculateTotalLosses = (params) => API.post('/calculate/optical/total-losses', params);
export const calculateMaxRange = (params) => API.post('/calculate/optical/max-range', params);

// Error handling interceptor
API.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response || error);
    return Promise.reject(error);
  }
);

export default API;
