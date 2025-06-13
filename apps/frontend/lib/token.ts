import { getCookie, setCookie, deleteCookie } from 'cookies-next';
/**
 * Get the token from cookies
 * @returns the token from cookies
 */
export const getToken = () => {
  return getCookie('token');
};

/**
 * Set the token in cookies
 * @param token - the token to set in cookies
 */
export const setToken = (token: string) => {
  setCookie('token', token, {
    httpOnly: true,
    // secure: process.env.NODE_ENV === 'production', only if we are using https
    sameSite: 'strict',
    path: '/'
  });
};

/**
 * Delete the token from cookies
 */
export const deleteToken = () => {
  deleteCookie('token');
};

