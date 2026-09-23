/**
 * API Configuration and Axios Instance initialization
 */

// Dynamically determine baseURL
const defaultBaseUrl = 'http://localhost:3000';
const isBrowser = typeof window !== 'undefined';
const resolvedBaseUrl = isBrowser && window.location.port === '3000'
  ? `${window.location.protocol}//${window.location.hostname}:3000`
  : defaultBaseUrl;

const axiosLib = isBrowser ? (window.axios || globalThis.axios) : null;

if (!axiosLib) {
  console.warn('Axios library was not detected in global scope. Ensure axios is loaded before service execution.');
}

export const BASE_URL = resolvedBaseUrl;

export const apiClient = axiosLib
  ? axiosLib.create({
      baseURL: BASE_URL,
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 10000
    })
  : null;

export default apiClient;
