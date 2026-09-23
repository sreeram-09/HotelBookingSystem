import apiClient from './apiConfig.js';
import { ApiException } from '../../exception/apiException.js';

/**
 * Service for Booking API endpoints
 */
export const bookingService = {
  /**
   * Fetch all bookings
   * @param {Object} [queryParams={}]
   * @returns {Promise<Array>}
   */
  async getBookings(queryParams = {}) {
    try {
      if (!apiClient) {
        throw new Error('Axios client is not available');
      }
      const response = await apiClient.get('/bookings', { params: queryParams });
      return response.data;
    } catch (error) {
      throw ApiException.fromAxiosError(error, 'Failed to fetch bookings.');
    }
  },

  /**
   * Fetch bookings for a specific user
   * @param {string} userId
   * @returns {Promise<Array>}
   */
  async getBookingsByUserId(userId) {
    if (!userId) {
      throw new ApiException('User ID is required to fetch bookings.', 400);
    }
    try {
      if (!apiClient) {
        throw new Error('Axios client is not available');
      }
      const response = await apiClient.get('/bookings', {
        params: { userId }
      });
      return response.data;
    } catch (error) {
      throw ApiException.fromAxiosError(error, `Failed to load bookings for user #${userId}.`);
    }
  },

  /**
   * Fetch single booking by ID
   * @param {string} id
   * @returns {Promise<Object>}
   */
  async getBookingById(id) {
    if (!id) {
      throw new ApiException('Booking ID is required.', 400);
    }
    try {
      if (!apiClient) {
        throw new Error('Axios client is not available');
      }
      const response = await apiClient.get(`/bookings/${id}`);
      return response.data;
    } catch (error) {
      throw ApiException.fromAxiosError(error, `Failed to fetch booking #${id}.`);
    }
  },

  /**
   * Create a new booking
   * @param {Object} bookingData
   * @returns {Promise<Object>}
   */
  async createBooking(bookingData) {
    if (!bookingData) {
      throw new ApiException('Booking payload is missing.', 400);
    }
    try {
      if (!apiClient) {
        throw new Error('Axios client is not available');
      }
      const response = await apiClient.post('/bookings', bookingData);
      return response.data;
    } catch (error) {
      throw ApiException.fromAxiosError(error, 'Failed to create booking.');
    }
  },

  /**
   * Update status of a booking (e.g. 'confirmed', 'cancelled')
   * @param {string} id
   * @param {'confirmed' | 'cancelled'} status
   * @returns {Promise<Object>}
   */
  async updateBookingStatus(id, status) {
    if (!id) {
      throw new ApiException('Booking ID is required to update status.', 400);
    }
    try {
      if (!apiClient) {
        throw new Error('Axios client is not available');
      }
      const response = await apiClient.patch(`/bookings/${id}`, { status });
      return response.data;
    } catch (error) {
      throw ApiException.fromAxiosError(error, `Failed to update status for booking #${id}.`);
    }
  },

  /**
   * Delete a booking by ID
   * @param {string} id
   * @returns {Promise<Object>}
   */
  async deleteBooking(id) {
    if (!id) {
      throw new ApiException('Booking ID is required to delete.', 400);
    }
    try {
      if (!apiClient) {
        throw new Error('Axios client is not available');
      }
      const response = await apiClient.delete(`/bookings/${id}`);
      return response.data;
    } catch (error) {
      throw ApiException.fromAxiosError(error, `Failed to delete booking #${id}.`);
    }
  }
};

export default bookingService;
