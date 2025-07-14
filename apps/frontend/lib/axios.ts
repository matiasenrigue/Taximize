import axios from 'axios';
import { getToken, setToken, deleteToken, clearAllTokens } from './token';

/**
 * Create an Axios instance with default settings
 */
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  withCredentials: true, // Important: needed for cookies to be sent with requests
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
 * Add a response interceptor to handle errors globally and refresh tokens
 */
api.interceptors.response.use(
  (response) => {     
    return response;
  },
  async (error) => { 
    const originalRequest = error.config;

    if (error.response) {
      // Handle specific error responses
      if (error.response.status === 401 && !originalRequest._retry) {
        // Handle unauthorized access - try to refresh token
        originalRequest._retry = true;
        
        try {
          // Attempt to refresh the access token
          const refreshResponse = await axios.post(
            `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/auth'}/refresh`,
            {},
            { withCredentials: true }
          );
          
          if (refreshResponse.data.success) {
            // Store the new access token
            setToken(refreshResponse.data.data.token);
            
            // Retry the original request with new token
            originalRequest.headers['Authorization'] = `Bearer ${refreshResponse.data.data.token}`;
            return api(originalRequest);
          }
        } catch (refreshError) {
          // Refresh failed
          console.error('Token refresh failed');
          clearAllTokens();
          return Promise.reject(refreshError);
        }
      } else if (error.response.status === 403) {
        // Handle forbidden access
        console.error('Forbidden access');
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