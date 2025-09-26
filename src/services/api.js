import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    console.log('API Request:', config.url, 'Token present:', !!token);
    
    // Don't add token to login and register requests
    if (token && !config.url.includes('/auth/login') && !config.url.includes('/auth/register')) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('Added token to request');
    } else if (config.url.includes('/auth/login')) {
      console.log('Login request - not adding token');
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => {
    console.log('API Response:', response.config.url, 'Status:', response.status);
    return response;
  },
  (error) => {
    console.log('API Error:', error.config?.url, 'Status:', error.response?.status);
    
    if (error.response?.status === 401) {
      // Don't redirect if we're already on login page or if it's a login request
      const isLoginRequest = error.config?.url?.includes('/auth/login');
      const isOnLoginPage = window.location.pathname === '/login';
      
      console.log('401 Error - isLoginRequest:', isLoginRequest, 'isOnLoginPage:', isOnLoginPage);
      
      if (!isLoginRequest && !isOnLoginPage) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('loginTime');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me'),
  verifyToken: () => api.get('/auth/verify'),
};

// Users API
export const usersAPI = {
  getAll: (params) => api.get('/users', { params }),
  getById: (id) => api.get(`/users/${id}`),
  create: (userData) => api.post('/users', userData),
  update: (id, userData) => api.put(`/users/${id}`, userData),
  delete: (id) => api.delete(`/users/${id}`),
  getProfile: () => api.get('/users/profile/me'),
};

// Attendance API
export const attendanceAPI = {
  getMyAttendance: (params) => api.get('/attendance/my-attendance', { params }),
  getAll: (params) => api.get('/attendance', { params }),
  getById: (id) => api.get(`/attendance/${id}`),
  update: (id, data) => api.put(`/attendance/${id}`, data),
  createManual: (data) => api.post('/attendance/manual', data),
  getTodayOverview: () => api.get('/attendance/today-overview'),
  getStats: (params) => api.get('/attendance/stats/overview', { params }),
  getActiveSessions: () => api.get('/attendance/active-sessions'),
};

// Requests API
export const requestsAPI = {
  getAll: (params) => api.get('/requests', { params }),
  getMyRequests: (params) => api.get('/requests/my-requests', { params }),
  getById: (id) => api.get(`/requests/${id}`),
  create: (data) => api.post('/requests', data),
  updateStatus: (id, data) => api.put(`/requests/${id}/status`, data),
  getStats: () => api.get('/requests/stats/overview'),
};

export default api;
