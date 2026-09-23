/**
 * Custom Validation Exception for centralized form/input validation
 */
export class ValidationException extends Error {
  /**
   * @param {string} message - Primary summary error message
   * @param {Record<string, string>} fieldErrors - Dictionary of field-specific error messages
   */
  constructor(message = 'Validation failed', fieldErrors = {}) {
    super(message);
    this.name = 'ValidationException';
    this.fieldErrors = fieldErrors;
    this.timestamp = new Date().toISOString();
  }

  /**
   * Returns true if there are specific field errors
   * @returns {boolean}
   */
  hasFieldErrors() {
    return Object.keys(this.fieldErrors).length > 0;
  }

  /**
   * Get error message for a specific field
   * @param {string} field
   * @returns {string | undefined}
   */
  getFieldError(field) {
    return this.fieldErrors[field];
  }

  /**
   * Return the first encountered field error message
   * @returns {string}
   */
  getFirstErrorMessage() {
    const keys = Object.keys(this.fieldErrors);
    if (keys.length > 0) {
      return this.fieldErrors[keys[0]];
    }
    return this.message;
  }
}

export default ValidationException;
