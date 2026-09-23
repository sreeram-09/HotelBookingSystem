/**
 * Pure reusable utility helper functions
 */

/**
 * Format a number as USD currency
 * @param {number} amount
 * @returns {string}
 */
export function formatCurrency(amount) {
  if (typeof amount !== 'number' || isNaN(amount)) {
    return '$0.00';
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
}

/**
 * Format ISO date string (YYYY-MM-DD) to friendly readable format
 * @param {string} dateStr
 * @returns {string}
 */
export function formatDate(dateStr) {
  if (!dateStr) return 'N/A';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    const date = new Date(year, month, day);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }
  return dateStr;
}

/**
 * Get today's date formatted as YYYY-MM-DD
 * @returns {string}
 */
export function getTodayDateString() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Calculate difference in days (nights) between two YYYY-MM-DD dates
 * @param {string} checkIn
 * @param {string} checkOut
 * @returns {number}
 */
export function calculateNights(checkIn, checkOut) {
  if (!checkIn || !checkOut) return 0;
  const inDate = new Date(checkIn);
  const outDate = new Date(checkOut);
  const diffTime = outDate.getTime() - inDate.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays : 0;
}

/**
 * Calculate detailed pricing breakdown including tax
 * @param {number} pricePerNight
 * @param {number} nights
 * @param {number} taxRate (default 12% = 0.12)
 * @returns {{ nights: number, subtotal: number, taxRate: number, taxes: number, total: number }}
 */
export function calculatePricingBreakdown(pricePerNight, nights, taxRate = 0.12) {
  const validNights = Math.max(0, parseInt(nights, 10) || 0);
  const validPrice = Math.max(0, parseFloat(pricePerNight) || 0);
  const subtotal = Math.round(validPrice * validNights * 100) / 100;
  const taxes = Math.round(subtotal * taxRate * 100) / 100;
  const total = Math.round((subtotal + taxes) * 100) / 100;

  return {
    nights: validNights,
    subtotal,
    taxRate,
    taxes,
    total
  };
}

/**
 * Read query parameter from current URL
 * @param {string} paramName
 * @returns {string | null}
 */
export function getUrlParam(paramName) {
  const params = new URLSearchParams(window.location.search);
  return params.get(paramName);
}

/**
 * Debounce a callback function
 * @param {Function} func
 * @param {number} wait
 * @returns {Function}
 */
export function debounce(func, wait = 300) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Sanitize string to prevent raw HTML injection
 * @param {string} str
 * @returns {string}
 */
export function sanitize(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

/**
 * Generate star rating markup
 * @param {number} rating
 * @returns {string}
 */
export function renderRatingStars(rating) {
  const numericRating = Math.max(0, Math.min(5, parseFloat(rating) || 0));
  return `★ ${numericRating.toFixed(1)}`;
}

/**
 * Display a modern toast notification
 * @param {string} message
 * @param {'success' | 'error' | 'warning' | 'info'} type
 * @param {number} duration
 */
export function showToast(message, type = 'info', duration = 4000) {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast-item toast-${type}`;

  const iconMap = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ℹ'
  };

  toast.innerHTML = `
    <span class="toast-icon">${iconMap[type] || 'ℹ'}</span>
    <span class="toast-message">${sanitize(message)}</span>
    <button class="toast-close" aria-label="Close notification">&times;</button>
  `;

  const closeBtn = toast.querySelector('.toast-close');
  closeBtn.addEventListener('click', () => {
    toast.classList.add('toast-fadeout');
    setTimeout(() => toast.remove(), 250);
  });

  container.appendChild(toast);

  // Trigger animation
  requestAnimationFrame(() => {
    toast.classList.add('toast-visible');
  });

  if (duration > 0) {
    setTimeout(() => {
      if (toast.parentElement) {
        toast.classList.remove('toast-visible');
        toast.classList.add('toast-fadeout');
        setTimeout(() => toast.remove(), 250);
      }
    }, duration);
  }
}
