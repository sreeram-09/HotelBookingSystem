import apiClient from './apiConfig.js';
import { ApiException } from '../../exception/apiException.js';

/**
 * Service for Hotel API endpoints
 */
export const hotelService = {
  /**
   * Fetch all hotels or filter hotels
   * @param {Object} [queryParams={}]
   * @returns {Promise<Array>}
   */
  async getHotels(queryParams = {}) {
    try {
      if (!apiClient) {
        throw new Error('Axios client is not available');
      }
      const response = await apiClient.get('/hotels', { params: queryParams });
      return response.data;
    } catch (error) {
      throw ApiException.fromAxiosError(error, 'Failed to fetch hotels from the server.');
    }
  },

  /**
   * Fetch single hotel by ID
   * @param {string} id
   * @returns {Promise<Object>}
   */
  async getHotelById(id) {
    if (!id) {
      throw new ApiException('Hotel ID is required.', 400);
    }
    try {
      if (!apiClient) {
        throw new Error('Axios client is not available');
      }
      const response = await apiClient.get(`/hotels/${id}`);
      return response.data;
    } catch (error) {
      throw ApiException.fromAxiosError(error, `Failed to load details for hotel #${id}.`);
    }
  }
};

export default hotelService;
