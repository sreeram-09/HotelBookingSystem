import hotelService from './service/hotelService.js';
import roomService from './service/roomService.js';
import userService from './service/userService.js';
import { formatCurrency, renderRatingStars, getUrlParam, showToast, sanitize } from './utils.js';

// DOM Elements
const hotelContainerEl = document.getElementById('hotel-details-container');
const roomsListEl = document.getElementById('rooms-list-container');
const roomsCountBadgeEl = document.getElementById('rooms-count-badge');
const userNameEl = document.getElementById('user-name');
const userAvatarEl = document.getElementById('user-avatar');

/**
 * Initialize hotel details page
 */
async function init() {
  await loadUserProfile();

  const hotelId = getUrlParam('id');
  if (!hotelId) {
    renderNotFound('No Hotel Specified', 'Please choose a hotel from our destinations catalog to view rooms and availability.');
    return;
  }

  await loadHotelAndRooms(hotelId);
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
    // Non-critical
  }
}

/**
 * Fetch hotel information and associated rooms
 * @param {string} hotelId
 */
async function loadHotelAndRooms(hotelId) {
  try {
    // Fetch hotel and rooms concurrently
    const [hotel, rooms] = await Promise.all([
      hotelService.getHotelById(hotelId),
      roomService.getRoomsByHotelId(hotelId)
    ]);

    if (!hotel) {
      renderNotFound('Hotel Not Found', `We could not locate any hotel with ID: ${hotelId}.`);
      return;
    }

    renderHotelDetails(hotel);
    renderRooms(hotel, Array.isArray(rooms) ? rooms : []);
  } catch (error) {
    renderError(error.message || 'An error occurred while loading hotel details.');
    showToast(error.message || 'Unable to connect to server', 'error');
  }
}

/**
 * Render hotel hero and amenities
 * @param {Object} hotel
 */
function renderHotelDetails(hotel) {
  if (!hotelContainerEl) return;

  const amenityIcons = {
    'Ocean View': '🌊',
    'Infinity Pool': '🏊',
    'Full-Service Spa': '💆',
    'Fine Dining': '🍷',
    'Free High-Speed Wi-Fi': '📶',
    'Valet Parking': '🚗',
    'Ski-in / Ski-out': '⛷️',
    'Heated Outdoor Pool': '♨️',
    'Fireplace Suites': '🔥',
    'Mountain View': '🏔️',
    'Spa & Sauna': '🧖',
    'Airport Shuttle': '🚐',
    'Rooftop Sky Lounge': '🍸',
    '24/7 Concierge': '🛎️',
    'State-of-the-Art Gym': '🏋️',
    'Cocktail Bar': '🍹',
    'Executive Workspace': '💼',
    'Pet Friendly': '🐾',
    'Historic Courtyard': '🏛️',
    'Michelin-Starred Dining': '⭐',
    'Wine Cellar Tours': '🍇',
    'Marble Baths': '🛁',
    'Butler Service': '🤵',
    'Terrace Garden': '🌿',
    'Private Beach Access': '🏖️',
    'Snorkeling Gear': '🤿',
    'Tropical Lagoon Pool': '🌴',
    'Sunset Catamaran Cruise': '⛵',
    'Kids Club': '🎠',
    'Outdoor Cabanas': '⛺',
    'City Skyline View': '🌆',
    'Japanese Onsen Bath': '♨️',
    'Tea Ceremony Room': '🍵',
    'High-Speed Fiber Wi-Fi': '⚡',
    'Subway Direct Access': '🚇',
    'Smart Room Automation': '📱'
  };

  const amenitiesListHtml = (hotel.amenities || []).map(amenity => {
    const icon = amenityIcons[amenity] || '✦';
    return `
      <div class="amenity-card">
        <span class="amenity-card-icon">${icon}</span>
        <span>${sanitize(amenity)}</span>
      </div>
    `;
  }).join('');

  hotelContainerEl.innerHTML = `
    <article class="hotel-hero-card" id="hotel-hero-${hotel.id}">
      <div class="hotel-hero-image-wrapper">
        <img src="${sanitize(hotel.image)}" alt="${sanitize(hotel.name)}">
        <div class="rating-badge" style="top: 1.5rem; right: 1.5rem; font-size: 1rem;">
          ${renderRatingStars(hotel.rating)}
        </div>
      </div>

      <div class="hotel-hero-content">
        <div class="hotel-hero-header">
          <div>
            <h1 class="hotel-hero-title">${sanitize(hotel.name)}</h1>
            <div class="hotel-hero-location">
              <span>📍</span>
              <span>${sanitize(hotel.location)}</span>
            </div>
          </div>
          <div class="price-container" style="text-align: right;">
            <span class="price-label">Rates starting from</span>
            <span class="price-value" style="font-size: 1.8rem;">
              ${formatCurrency(hotel.price)} <small>/ night</small>
            </span>
          </div>
        </div>

        <p style="color: var(--color-text-muted); font-size: 1.05rem; line-height: 1.6;">
          Welcome to ${sanitize(hotel.name)}, an exclusive sanctuary blending signature luxury, personalized hospitality, and bespoke architecture in ${sanitize(hotel.location)}.
        </p>

        <section class="amenities-section" aria-label="Hotel Amenities">
          <h2 class="amenities-title">Resort Amenities & Inclusions</h2>
          <div class="amenities-grid">
            ${amenitiesListHtml}
          </div>
        </section>
      </div>
    </article>
  `;
}

/**
 * Render room accommodations list
 * @param {Object} hotel
 * @param {Array} rooms
 */
function renderRooms(hotel, rooms) {
  if (!roomsListEl || !roomsCountBadgeEl) return;

  const availableCount = rooms.filter(r => r.status === 'available').length;
  roomsCountBadgeEl.textContent = `${availableCount} of ${rooms.length} rooms available`;

  if (rooms.length === 0) {
    roomsListEl.innerHTML = `
      <div class="state-container">
        <div class="empty-icon">🛏️</div>
        <h3 class="state-title">No Rooms Listed</h3>
        <p class="state-description">There are currently no rooms registered for this property.</p>
      </div>
    `;
    return;
  }

  roomsListEl.innerHTML = rooms.map(room => {
    const isAvailable = room.status === 'available';

    const statusBadge = isAvailable
      ? `<span class="room-status-badge status-available">✓ Available</span>`
      : `<span class="room-status-badge status-booked">✕ Booked</span>`;

    const actionBtn = isAvailable
      ? `<a href="booking.html?hotelId=${encodeURIComponent(hotel.id)}&roomId=${encodeURIComponent(room.id)}" class="btn btn-accent" id="btn-book-${room.id}">Book This Room &rarr;</a>`
      : `<button type="button" class="btn btn-disabled" disabled id="btn-book-${room.id}">Unavailable</button>`;

    return `
      <article class="room-card" id="room-card-${room.id}">
        <div class="room-info">
          <div class="room-header-line">
            <span class="room-number-tag">Room ${sanitize(room.roomNumber)}</span>
            <h3 class="room-title">${sanitize(room.roomType)}</h3>
            ${statusBadge}
          </div>
          <p class="room-features-hint">
            Premium luxury linens, climate control, artisan bath amenities, and complimentary breakfast.
          </p>
        </div>

        <div class="room-card-action">
          <div class="price-container" style="text-align: right;">
            <span class="price-label">Price per night</span>
            <span class="price-value">${formatCurrency(room.price)}</span>
          </div>
          ${actionBtn}
        </div>
      </article>
    `;
  }).join('');
}

/**
 * Render not found state
 * @param {string} title
 * @param {string} description
 */
function renderNotFound(title, description) {
  if (hotelContainerEl) {
    hotelContainerEl.innerHTML = `
      <div class="state-container">
        <div class="empty-icon">🏨</div>
        <h2 class="state-title">${sanitize(title)}</h2>
        <p class="state-description">${sanitize(description)}</p>
        <a href="index.html" class="btn btn-primary">&larr; Return to Destinations</a>
      </div>
    `;
  }
  const roomsSection = document.getElementById('rooms-section');
  if (roomsSection) roomsSection.style.display = 'none';
}

/**
 * Render error state
 * @param {string} message
 */
function renderError(message) {
  if (hotelContainerEl) {
    hotelContainerEl.innerHTML = `
      <div class="state-container">
        <div class="empty-icon" style="color: var(--color-danger);">⚠</div>
        <h2 class="state-title">Unable to Load Property</h2>
        <p class="state-description">${sanitize(message)}</p>
        <div style="display: flex; gap: 1rem;">
          <a href="index.html" class="btn btn-outline">&larr; Back to Catalog</a>
          <button type="button" id="btn-retry" class="btn btn-primary">Try Again</button>
        </div>
      </div>
    `;
    document.getElementById('btn-retry')?.addEventListener('click', () => {
      const hotelId = getUrlParam('id');
      if (hotelId) loadHotelAndRooms(hotelId);
    });
  }
  const roomsSection = document.getElementById('rooms-section');
  if (roomsSection) roomsSection.style.display = 'none';
}

// Kickoff
document.addEventListener('DOMContentLoaded', init);
