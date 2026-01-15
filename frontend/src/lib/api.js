import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API_BASE = `${BACKEND_URL}/api`;

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('kasaburger_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('kasaburger_token');
      localStorage.removeItem('kasaburger_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth
export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  getMe: () => api.get('/auth/me'),
};

// Products
export const productsAPI = {
  getAll: () => api.get('/products'),
  getOne: (id) => api.get(`/products/${id}`),
  create: (data) => api.post('/products', data),
  update: (id, data) => api.put(`/products/${id}`, data),
  delete: (id) => api.delete(`/products/${id}`),
};

// Materials
export const materialsAPI = {
  getAll: () => api.get('/materials'),
  create: (data) => api.post('/materials', data),
  update: (id, data) => api.put(`/materials/${id}`, data),
  delete: (id) => api.delete(`/materials/${id}`),
};

// Recipes
export const recipesAPI = {
  getAll: () => api.get('/recipes'),
  create: (data) => api.post('/recipes', data),
  delete: (id) => api.delete(`/recipes/${id}`),
};

// Production
export const productionAPI = {
  getAll: () => api.get('/production'),
  create: (data) => api.post('/production', data),
  updateStatus: (id, status) => api.put(`/production/${id}/status?status=${status}`),
  delete: (id) => api.delete(`/production/${id}`),
};

// Dealers
export const dealersAPI = {
  getAll: () => api.get('/dealers'),
  getOne: (id) => api.get(`/dealers/${id}`),
  create: (data) => api.post('/dealers', data),
  update: (id, data) => api.put(`/dealers/${id}`, data),
  delete: (id) => api.delete(`/dealers/${id}`),
};

// Orders
export const ordersAPI = {
  getAll: () => api.get('/orders'),
  create: (data) => api.post('/orders', data),
  updateStatus: (id, status) => api.put(`/orders/${id}/status?status=${status}`),
  delete: (id) => api.delete(`/orders/${id}`),
};

// Invoices
export const invoicesAPI = {
  getAll: () => api.get('/invoices'),
  create: (data) => api.post('/invoices', data),
  pay: (id) => api.put(`/invoices/${id}/pay`),
};

// Transactions
export const transactionsAPI = {
  getAll: () => api.get('/transactions'),
  create: (data) => api.post('/transactions', data),
  delete: (id) => api.delete(`/transactions/${id}`),
};

// Stock Movements
export const stockMovementsAPI = {
  getAll: () => api.get('/stock-movements'),
  create: (data) => api.post('/stock-movements', data),
};

// Dashboard
export const dashboardAPI = {
  getStats: () => api.get('/dashboard/stats'),
};

export default api;
