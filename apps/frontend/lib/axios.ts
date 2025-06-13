import axios from 'axios';
import { getToken, deleteToken } from './token';

/**
 * Create an Axios instance with default settings
 */
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/auth',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

/** 
 * Add a request interceptor to include the auth token in headers
 */ 
api.interceptors.request.use(
  async (config) => {
    const token = getToken();
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Add a response interceptor to handle errors globally
 */
api.interceptors.response.use(
    (response) => {     
      return response;
    }
  ,
  (error) => { 
    if (error.response) {
      // Handle specific error responses
      if (error.response.status === 401) {
        // Handle unauthorized access, redirect to login
        console.error('Unauthorized access - redirecting to login');
        // Clear token
        deleteToken();
        // Redirect to signin page
        window.location.href = '/signin';
      } else if (error.response.status === 403) {
        // Handle forbidden access
        console.error('Forbidden access');
        // redirect to home 
        window.location.href = '/';
      } else {
        console.error('An error occurred:', error.response.data);
      }
    } else {
      // Handle network errors or other issues
      console.error('Network error or no response received:', error.message);
    }
    return Promise.reject(error);
  }
);

export default api;