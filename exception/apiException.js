/**
 * Custom API Exception for centralized HTTP & Network error handling
 */
export class ApiException extends Error {
  constructor(message, statusCode = null, responseData = null, isNetworkError = false) {
    super(message);
    this.name = 'ApiException';
    this.statusCode = statusCode;
    this.responseData = responseData;
    this.isNetworkError = isNetworkError;
    this.timestamp = new Date().toISOString();
  }

  /**
   * Factory method to transform Axios or generic errors into ApiException
   * @param {Error} error - The caught error
   * @param {string} fallbackMessage - Custom fallback message
   * @returns {ApiException}
   */
  static fromAxiosError(error, fallbackMessage = 'An unexpected error occurred while communicating with the server.') {
    if (error instanceof ApiException) {
      return error;
    }

    // Server responded with an error HTTP status code (4xx, 5xx)
    if (error.response) {
      const status = error.response.status;
      const data = error.response.data;

      let message = fallbackMessage;
      if (typeof data === 'string' && data.trim()) {
        message = data;
      } else if (data && typeof data === 'object' && data.message) {
        message = data.message;
      } else {
        switch (status) {
          case 400:
            message = 'Invalid request. Please verify the submitted data.';
            break;
          case 404:
            message = 'The requested resource was not found.';
            break;
          case 409:
            message = 'Conflict occurred: The resource is already in use.';
            break;
          case 500:
            message = 'Internal server error. Please try again later.';
            break;
          default:
            message = `${fallbackMessage} (Status ${status})`;
        }
      }

      return new ApiException(message, status, data, false);
    }

    // Request was made but no response was received (Network error / server offline)
    if (error.request) {
      return new ApiException(
        'Unable to connect to the backend server. Please verify JSON Server is running on port 3000.',
        null,
        null,
        true
      );
    }

    // Something happened during request setup
    return new ApiException(error.message || fallbackMessage, null, null, false);
  }
}

export default ApiException;
