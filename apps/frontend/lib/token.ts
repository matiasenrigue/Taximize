import { getCookie, setCookie, deleteCookie } from 'cookies-next';

/**
 * Get the access token from cookies
 * @returns the access token from cookies
 */
export const getToken = () => {
  return getCookie('accessToken');
};

/**
 * Set the access token in cookies
 * @param token - the access token to set in cookies
 */
export const setToken = (token: string) => {
  setCookie('accessToken', token, {
    httpOnly: false, // Access token needs to be accessible by JavaScript for axios
    secure: false,
    sameSite: 'strict',
    path: '/',
    maxAge: 15 * 60 // 15 minutes in seconds
  });
};

/**
 * Delete the access token from cookies
 */
export const deleteToken = () => {
  deleteCookie('accessToken');
};

/**
 * Get the refresh token from cookies (should be HTTP-only, set by backend)
 * Note: This is read-only as refresh tokens are managed by the backend
 */
export const getRefreshToken = () => {
  return getCookie('refreshToken');
};

/**
 * Delete the refresh token from cookies
 */
export const deleteRefreshToken = () => {
  deleteCookie('refreshToken');
};

/**
 * Clear all authentication tokens
 */
export const clearAllTokens = () => {
  deleteToken();
  deleteRefreshToken();
};

