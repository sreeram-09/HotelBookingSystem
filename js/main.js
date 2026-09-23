import hotelService from './service/hotelService.js';
import userService from './service/userService.js';
import { formatCurrency, renderRatingStars, debounce, showToast, sanitize } from './utils.js';

// DOM Elements
const hotelsGridEl = document.getElementById('hotels-grid');
const hotelCountEl = document.getElementById('hotel-count');
const searchInputEl = document.getElementById('search-input');
const locationSelectEl = document.getElementById('location-select');
const priceSliderEl = document.getElementById('price-slider');
const priceSliderValEl = document.getElementById('price-slider-val');
const btnResetFiltersEl = document.getElementById('btn-reset-filters');
const userNameEl = document.getElementById('user-name');
const userAvatarEl = document.getElementById('user-avatar');

// In-memory state
let allHotels = [];
let maxAvailablePrice = 800;

/**
 * Initialize page
 */
async function init() {
  await loadUserProfile();
  setupEventListeners();
  await loadHotels();
}

/**
 * Load and display active user profile
 */
async function loadUserProfile() {
  try {
    const user = await userService.getCurrentUser();
    if (user && userNameEl && userAvatarEl) {
      userNameEl.textContent = user.name;
      const initials = user.name
        .split(' ')
        .map(n => n[0])
        .join('')
        .substring(0, 2)
        .toUpperCase();
      userAvatarEl.textContent = initials || 'G';
    }
  } catch {
    // Non-critical profile load error
  }
}

/**
 * Fetch hotels from service and render
 */
async function loadHotels() {
  renderLoadingState();

  try {
    const hotels = await hotelService.getHotels();
    allHotels = Array.isArray(hotels) ? hotels : [];

    // Determine max price for slider
    if (allHotels.length > 0) {
      const highestPrice = Math.max(...allHotels.map(h => h.price || 0));
      maxAvailablePrice = Math.ceil(highestPrice / 50) * 50;
      if (priceSliderEl && priceSliderValEl) {
        priceSliderEl.max = maxAvailablePrice;
        priceSliderEl.value = maxAvailablePrice;
        priceSliderValEl.textContent = `$${maxAvailablePrice}`;
      }
    }

    populateLocationOptions(allHotels);
    applyFilters();
  } catch (error) {
    renderErrorState(error.message || 'Failed to load hotels.');
    showToast(error.message || 'Error connecting to server', 'error');
  }
}

/**
 * Populate location dropdown with distinct values
 * @param {Array} hotels
 */
function populateLocationOptions(hotels) {
  if (!locationSelectEl) return;

  const locations = [...new Set(hotels.map(h => h.location).filter(Boolean))].sort();

  // Keep first "All Locations" option
  locationSelectEl.innerHTML = '<option value="">All Destinations</option>';

  locations.forEach(loc => {
    const opt = document.createElement('option');
    opt.value = loc;
    opt.textContent = loc;
    locationSelectEl.appendChild(opt);
  });
}

/**
 * Filter hotels based on search, destination, and price
 */
function applyFilters() {
  const searchTerm = (searchInputEl?.value || '').trim().toLowerCase();
  const selectedLocation = (locationSelectEl?.value || '').trim();
  const maxPrice = parseFloat(priceSliderEl?.value) || maxAvailablePrice;

  const filtered = allHotels.filter(hotel => {
    // Search filter
    const matchesSearch = !searchTerm ||
      (hotel.name && hotel.name.toLowerCase().includes(searchTerm)) ||
      (hotel.location && hotel.location.toLowerCase().includes(searchTerm));

    // Location filter
    const matchesLocation = !selectedLocation || hotel.location === selectedLocation;

    // Price filter
    const matchesPrice = (hotel.price || 0) <= maxPrice;

    return matchesSearch && matchesLocation && matchesPrice;
  });

  renderHotels(filtered);
}

/**
 * Render hotel cards
 * @param {Array} hotels
 */
function renderHotels(hotels) {
  if (!hotelsGridEl || !hotelCountEl) return;

  hotelCountEl.textContent = `${hotels.length} ${hotels.length === 1 ? 'hotel' : 'hotels'} available`;

  if (hotels.length === 0) {
    renderEmptyState();
    return;
  }

  hotelsGridEl.innerHTML = hotels.map(hotel => {
    const amenitiesBadges = (hotel.amenities || [])
      .slice(0, 3)
      .map(a => `<span class="amenity-chip">${sanitize(a)}</span>`)
      .join('');

    return `
      <article class="hotel-card" id="hotel-card-${hotel.id}">
        <div class="hotel-card-media">
          <img src="${sanitize(hotel.image)}" alt="${sanitize(hotel.name)}" loading="lazy">
          <div class="rating-badge" title="Rating">
            ${renderRatingStars(hotel.rating)}
          </div>
        </div>

        <div class="hotel-card-body">
          <div class="hotel-location">
            <span>📍</span>
            <span>${sanitize(hotel.location)}</span>
          </div>

          <h3 class="hotel-name">${sanitize(hotel.name)}</h3>

          <div class="amenities-preview">
            ${amenitiesBadges}
          </div>

          <div class="hotel-card-footer">
            <div class="price-container">
              <span class="price-label">Starting from</span>
              <span class="price-value">${formatCurrency(hotel.price)} <small>/ night</small></span>
            </div>

            <a href="hotel-details.html?id=${encodeURIComponent(hotel.id)}" class="btn btn-primary" id="btn-view-${hotel.id}">
              View Details &rarr;
            </a>
          </div>
        </div>
      </article>
    `;
  }).join('');
}

/**
 * Render loading spinner state
 */
function renderLoadingState() {
  if (!hotelsGridEl || !hotelCountEl) return;
  hotelCountEl.textContent = 'Loading...';
  hotelsGridEl.innerHTML = `
    <div class="state-container" style="grid-column: 1 / -1;">
      <div class="loading-spinner"></div>
      <p class="state-title">Discovering Luxury Stays</p>
      <p class="state-description">Fetching current room inventory and rates...</p>
    </div>
  `;
}

/**
 * Render empty search results
 */
function renderEmptyState() {
  hotelsGridEl.innerHTML = `
    <div class="state-container" style="grid-column: 1 / -1;">
      <div class="empty-icon">🏨</div>
      <h3 class="state-title">No Hotels Found</h3>
      <p class="state-description">We couldn't find any stays matching your current filters. Try relaxing your search criteria or resetting filters.</p>
      <button type="button" id="btn-empty-reset" class="btn btn-accent">Reset All Filters</button>
    </div>
  `;

  document.getElementById('btn-empty-reset')?.addEventListener('click', resetFilters);
}

/**
 * Render error state
 * @param {string} message
 */
function renderErrorState(message) {
  if (!hotelsGridEl) return;
  hotelsGridEl.innerHTML = `
    <div class="state-container" style="grid-column: 1 / -1;">
      <div class="empty-icon" style="color: var(--color-danger);">⚠</div>
      <h3 class="state-title">Unable to Load Hotels</h3>
      <p class="state-description">${sanitize(message)}</p>
      <button type="button" id="btn-retry" class="btn btn-primary">Try Again</button>
    </div>
  `;

  document.getElementById('btn-retry')?.addEventListener('click', loadHotels);
}

/**
 * Reset all search and filter inputs
 */
function resetFilters() {
  if (searchInputEl) searchInputEl.value = '';
  if (locationSelectEl) locationSelectEl.value = '';
  if (priceSliderEl && priceSliderValEl) {
    priceSliderEl.value = maxAvailablePrice;
    priceSliderValEl.textContent = `$${maxAvailablePrice}`;
  }
  applyFilters();
}

/**
 * Attach UI event listeners
 */
function setupEventListeners() {
  // Search input with debounce
  searchInputEl?.addEventListener('input', debounce(() => {
    applyFilters();
  }, 250));

  // Location selector change
  locationSelectEl?.addEventListener('change', () => {
    applyFilters();
  });

  // Price slider live counter and update
  priceSliderEl?.addEventListener('input', (e) => {
    if (priceSliderValEl) {
      priceSliderValEl.textContent = `$${e.target.value}`;
    }
    applyFilters();
  });

  // Reset button
  btnResetFiltersEl?.addEventListener('click', resetFilters);
}

// Kickoff
document.addEventListener('DOMContentLoaded', init);
