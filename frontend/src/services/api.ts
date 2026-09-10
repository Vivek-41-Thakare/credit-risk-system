import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';

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
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Don't redirect if we're already on the login page or if the request was to /login
      const isLoginRequest = error.config?.url?.includes('/login');
      const isLoginPage = window.location.pathname === '/login';

      if (!isLoginRequest && !isLoginPage) {
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export interface LoginData {
  username: string;
  password: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
}

export interface CreditApplication {
  checking_account_status: string;
  credit_history: string;
  savings_account: string;
  duration_months: number;
  credit_amount: number;
  purpose: string;
  age: number;
  personal_status_sex: string;
  other_debtors: string;
  employment_since: string;
  job: string;
  property: string;
  installment_rate: number;
  residence_since: number;
  existing_credits: number;
  num_dependents: number;
  other_installment_plans: string;
  housing: string;
  telephone: string;
  foreign_worker: string;
}

export interface PredictionResult {
  prediction_id: number;
  default_probability: number;
  prediction: number;
  risk_category: string;
  recommendation: string;
  confidence: number;
  expected_loss?: number;
  processing_time_ms: number;
  model_version: string;
  explanation?: any;
}

// Auth API
export const authAPI = {
  login: (data: LoginData) => api.post('/login', data),
  register: (data: RegisterData) => api.post('/register', data),
  logout: () => {
    localStorage.removeItem('token');
    window.location.href = '/login';
  },
};

// Prediction API
export const predictionAPI = {
  predict: (application: CreditApplication, includeExplanation = false) =>
    api.post<PredictionResult>('/predict', {
      application,
      include_explanation: includeExplanation,
    }),
  
  batchPredict: (applications: CreditApplication[], includeExplanation = false) =>
    api.post('/batch-predict', {
      applications,
      include_explanation: includeExplanation,
    }),
  
  getHistory: (skip = 0, limit = 100) =>
    api.get(`/predictions?skip=${skip}&limit=${limit}`),
  
  updateFeedback: (predictionId: number, actualOutcome: number) =>
    api.put(`/predictions/${predictionId}/feedback`, { actual_outcome: actualOutcome }),
};

// API Keys
export const apiKeysAPI = {
  create: (name: string) => api.post('/api-keys', { name }),
  list: () => api.get('/api-keys'),
  delete: (keyId: number) => api.delete(`/api-keys/${keyId}`),
};

// System API
export const systemAPI = {
  health: () => api.get('/health'),
  stats: () => api.get('/stats'),
  modelMetrics: () => api.get('/model/metrics'),
  featureImportance: () => api.get('/model/feature-importance'),
};

export default api;