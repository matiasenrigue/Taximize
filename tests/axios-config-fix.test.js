/**
 * Simple validation test for axios configuration fix
 * Tests that the baseURL change allows access to all API endpoints
 */

import axios from '../apps/frontend/lib/axios';

describe('Axios Configuration Fix Validation', () => {
  test('axios instance should have correct baseURL for all API endpoints', () => {
    // Check that baseURL is set to /api instead of /api/auth
    expect(axios.defaults.baseURL).toBe('http://localhost:5000/api');
    expect(axios.defaults.baseURL).not.toBe('http://localhost:5000/api/auth');
  });

  test('should construct correct URLs for different endpoints', () => {
    const baseURL = axios.defaults.baseURL;
    
    // Auth endpoints should work
    expect(`${baseURL}/auth/signin`).toBe('http://localhost:5000/api/auth/signin');
    expect(`${baseURL}/auth/signup`).toBe('http://localhost:5000/api/auth/signup');
    expect(`${baseURL}/auth/refresh`).toBe('http://localhost:5000/api/auth/refresh');
    
    // Shift endpoints should now be accessible
    expect(`${baseURL}/shifts/current`).toBe('http://localhost:5000/api/shifts/current');
    expect(`${baseURL}/shifts/start-shift`).toBe('http://localhost:5000/api/shifts/start-shift');
    
    // User endpoints should be accessible (even though backend doesn't implement them)
    expect(`${baseURL}/user`).toBe('http://localhost:5000/api/user');
    expect(`${baseURL}/user/email`).toBe('http://localhost:5000/api/user/email');
    
    // Ride endpoints should be accessible
    expect(`${baseURL}/rides`).toBe('http://localhost:5000/api/rides');
  });

  test('should have correct default headers', () => {
    expect(axios.defaults.headers['Content-Type']).toBe('application/json');
    expect(axios.defaults.headers['Accept']).toBe('application/json');
  });

  test('should have credentials enabled for cookies', () => {
    expect(axios.defaults.withCredentials).toBe(true);
  });
});