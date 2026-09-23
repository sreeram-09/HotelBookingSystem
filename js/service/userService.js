import apiClient from './apiConfig.js';
import { ApiException } from '../../exception/apiException.js';

const STORAGE_KEY = 'hotel_app_active_user';

/**
 * Service for User API endpoints and local active user session
 */
export const userService = {
  /**
   * Fetch all users
   * @returns {Promise<Array>}
   */
  async getUsers() {
    try {
      if (!apiClient) {
        throw new Error('Axios client is not available');
      }
      const response = await apiClient.get('/users');
      return response.data;
    } catch (error) {
      throw ApiException.fromAxiosError(error, 'Failed to fetch users.');
    }
  },

  /**
   * Fetch single user by ID
   * @param {string} id
   * @returns {Promise<Object>}
   */
  async getUserById(id) {
    if (!id) {
      throw new ApiException('User ID is required.', 400);
    }
    try {
      if (!apiClient) {
        throw new Error('Axios client is not available');
      }
      const response = await apiClient.get(`/users/${id}`);
      return response.data;
    } catch (error) {
      throw ApiException.fromAxiosError(error, `Failed to load user #${id}.`);
    }
  },

  /**
   * Get active user for this session, with fallback to default user
   * @returns {Promise<Object>}
   */
  async getCurrentUser() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // LocalStorage unavailable, continue
    }

    // Default to first user from server
    try {
      const users = await this.getUsers();
      if (users && users.length > 0) {
        this.setCurrentUser(users[0]);
        return users[0];
      }
    } catch {
      // Fallback object if offline
    }

    return {
      id: 'user-1',
      name: 'Sarah Jenkins',
      email: 'sarah.jenkins@example.com'
    };
  },

  /**
   * Set active user
   * @param {Object} user
   */
  setCurrentUser(user) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    } catch {
      // Ignore storage errors
    }
  }
};

export default userService;
