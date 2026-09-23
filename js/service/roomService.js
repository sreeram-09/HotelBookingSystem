import apiClient from './apiConfig.js';
import { ApiException } from '../../exception/apiException.js';

/**
 * Service for Room API endpoints
 */
export const roomService = {
  /**
   * Fetch all rooms
   * @param {Object} [queryParams={}]
   * @returns {Promise<Array>}
   */
  async getRooms(queryParams = {}) {
    try {
      if (!apiClient) {
        throw new Error('Axios client is not available');
      }
      const response = await apiClient.get('/rooms', { params: queryParams });
      return response.data;
    } catch (error) {
      throw ApiException.fromAxiosError(error, 'Failed to fetch rooms.');
    }
  },

  /**
   * Fetch rooms for a specific hotel
   * @param {string} hotelId
   * @returns {Promise<Array>}
   */
  async getRoomsByHotelId(hotelId) {
    if (!hotelId) {
      throw new ApiException('Hotel ID is required to fetch rooms.', 400);
    }
    try {
      if (!apiClient) {
        throw new Error('Axios client is not available');
      }
      const response = await apiClient.get('/rooms', {
        params: { hotelId }
      });
      return response.data;
    } catch (error) {
      throw ApiException.fromAxiosError(error, `Failed to load rooms for hotel #${hotelId}.`);
    }
  },

  /**
   * Fetch single room by ID
   * @param {string} id
   * @returns {Promise<Object>}
   */
  async getRoomById(id) {
    if (!id) {
      throw new ApiException('Room ID is required.', 400);
    }
    try {
      if (!apiClient) {
        throw new Error('Axios client is not available');
      }
      const response = await apiClient.get(`/rooms/${id}`);
      return response.data;
    } catch (error) {
      throw ApiException.fromAxiosError(error, `Failed to load room #${id}.`);
    }
  },

  /**
   * Update room status (e.g. 'available' or 'booked')
   * @param {string} id
   * @param {'available' | 'booked'} status
   * @returns {Promise<Object>}
   */
  async updateRoomStatus(id, status) {
    if (!id) {
      throw new ApiException('Room ID is required to update status.', 400);
    }
    if (!status || !['available', 'booked'].includes(status)) {
      throw new ApiException(`Invalid room status '${status}'. Must be 'available' or 'booked'.`, 400);
    }

    try {
      if (!apiClient) {
        throw new Error('Axios client is not available');
      }
      const response = await apiClient.patch(`/rooms/${id}`, { status });
      return response.data;
    } catch (error) {
      throw ApiException.fromAxiosError(error, `Failed to update status for room #${id}.`);
    }
  }
};

export default roomService;
