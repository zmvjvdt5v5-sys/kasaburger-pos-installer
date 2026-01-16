const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API_BASE = `${BACKEND_URL}/api`;

// Simple fetch wrapper without axios to avoid postMessage cloning issues
const fetchAPI = async (endpoint, options = {}) => {
  const token = localStorage.getItem('kasaburger_token');
  
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, config);
    
    // Handle 401 unauthorized
    if (response.status === 401) {
      localStorage.removeItem('kasaburger_token');
      localStorage.removeItem('kasaburger_user');
      window.location.href = '/login';
      return null;
    }

    // Try to parse JSON response
    let data;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      try {
        data = await response.json();
      } catch (e) {
        data = null;
      }
    } else {
      data = await response.text();
    }

    if (!response.ok) {
      const error = new Error(data?.detail || 'Request failed');
      error.response = { status: response.status, data };
      throw error;
    }

    return { data, status: response.status };
  } catch (error) {
    if (error.response) {
      throw error;
    }
    throw new Error('Network error');
  }
};

// Auth API
export const authAPI = {
  login: (data) => fetchAPI('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  register: (data) => fetchAPI('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  getMe: () => fetchAPI('/auth/me'),
};

// Products API
export const productsAPI = {
  getAll: () => fetchAPI('/products'),
  getOne: (id) => fetchAPI(`/products/${id}`),
  create: (data) => fetchAPI('/products', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => fetchAPI(`/products/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) => fetchAPI(`/products/${id}`, { method: 'DELETE' }),
};

// Materials API
export const materialsAPI = {
  getAll: () => fetchAPI('/materials'),
  create: (data) => fetchAPI('/materials', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => fetchAPI(`/materials/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) => fetchAPI(`/materials/${id}`, { method: 'DELETE' }),
};

// Recipes API
export const recipesAPI = {
  getAll: () => fetchAPI('/recipes'),
  create: (data) => fetchAPI('/recipes', { method: 'POST', body: JSON.stringify(data) }),
  delete: (id) => fetchAPI(`/recipes/${id}`, { method: 'DELETE' }),
};

// Production API
export const productionAPI = {
  getAll: () => fetchAPI('/production'),
  create: (data) => fetchAPI('/production', { method: 'POST', body: JSON.stringify(data) }),
  updateStatus: (id, status) => fetchAPI(`/production/${id}/status?status=${status}`, { method: 'PUT' }),
  delete: (id) => fetchAPI(`/production/${id}`, { method: 'DELETE' }),
};

// Dealers API
export const dealersAPI = {
  getAll: () => fetchAPI('/dealers'),
  getOne: (id) => fetchAPI(`/dealers/${id}`),
  create: (data) => fetchAPI('/dealers', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => fetchAPI(`/dealers/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) => fetchAPI(`/dealers/${id}`, { method: 'DELETE' }),
};

// Orders API
export const ordersAPI = {
  getAll: () => fetchAPI('/orders'),
  create: (data) => fetchAPI('/orders', { method: 'POST', body: JSON.stringify(data) }),
  updateStatus: (id, status) => fetchAPI(`/orders/${id}/status?status=${status}`, { method: 'PUT' }),
  delete: (id) => fetchAPI(`/orders/${id}`, { method: 'DELETE' }),
};

// Invoices API
export const invoicesAPI = {
  getAll: () => fetchAPI('/invoices'),
  create: (data) => fetchAPI('/invoices', { method: 'POST', body: JSON.stringify(data) }),
  pay: (id) => fetchAPI(`/invoices/${id}/pay`, { method: 'PUT' }),
};

// Transactions API
export const transactionsAPI = {
  getAll: () => fetchAPI('/transactions'),
  create: (data) => fetchAPI('/transactions', { method: 'POST', body: JSON.stringify(data) }),
  delete: (id) => fetchAPI(`/transactions/${id}`, { method: 'DELETE' }),
};

// Stock Movements API
export const stockMovementsAPI = {
  getAll: () => fetchAPI('/stock-movements'),
  create: (data) => fetchAPI('/stock-movements', { method: 'POST', body: JSON.stringify(data) }),
};

// Dashboard API
export const dashboardAPI = {
  getStats: () => fetchAPI('/dashboard/stats'),
};

export default fetchAPI;
