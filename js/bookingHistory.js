import bookingService from './service/bookingService.js';
import hotelService from './service/hotelService.js';
import roomService from './service/roomService.js';
import userService from './service/userService.js';
import { formatCurrency, formatDate, calculateNights, showToast, sanitize } from './utils.js';

// DOM Elements - Profile & Header
const userNameEl = document.getElementById('user-name');
const userAvatarEl = document.getElementById('user-avatar');
const bookingsListEl = document.getElementById('bookings-list');

// Stats Elements
const statTotalEl = document.getElementById('stat-total');
const statConfirmedEl = document.getElementById('stat-confirmed');
const statCancelledEl = document.getElementById('stat-cancelled');

// Modal Elements
const cancelModalEl = document.getElementById('cancel-modal');
const btnModalKeepEl = document.getElementById('btn-modal-keep');
const btnModalConfirmEl = document.getElementById('btn-modal-confirm');

// In-memory state
let currentUser = null;
let currentBookings = [];
let hotelsMap = new Map();
let roomsMap = new Map();
let pendingCancelBookingId = null;

/**
 * Initialize booking history page
 */
async function init() {
  await loadUserProfile();
  setupModalListeners();
  await loadHistoryData();
}

/**
 * Load user profile
 */
async function loadUserProfile() {
  try {
    currentUser = await userService.getCurrentUser();
    if (currentUser) {
      if (userNameEl) userNameEl.textContent = currentUser.name;
      if (userAvatarEl) {
        const initials = currentUser.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
        userAvatarEl.textContent = initials || 'G';
      }
    }
  } catch {
    // Non-critical
  }
}

/**
 * Fetch bookings and hydrate with hotels and rooms
 */
async function loadHistoryData() {
  renderLoadingState();

  try {
    const userId = currentUser?.id || 'user-1';

    // Fetch user bookings, all hotels, and all rooms concurrently
    const [bookings, hotels, rooms] = await Promise.all([
      bookingService.getBookingsByUserId(userId),
      hotelService.getHotels(),
      roomService.getRooms()
    ]);

    currentBookings = Array.isArray(bookings) ? bookings : [];

    // Map for fast lookups
    hotelsMap.clear();
    (hotels || []).forEach(h => hotelsMap.set(String(h.id), h));

    roomsMap.clear();
    (rooms || []).forEach(r => roomsMap.set(String(r.id), r));

    updateStats(currentBookings);
    renderBookingsList(currentBookings);
  } catch (error) {
    renderErrorState(error.message || 'Failed to load booking history.');
    showToast(error.message || 'Error loading records', 'error');
  }
}

/**
 * Update stats banner
 * @param {Array} bookings
 */
function updateStats(bookings) {
  const total = bookings.length;
  const confirmed = bookings.filter(b => b.status === 'confirmed').length;
  const cancelled = bookings.filter(b => b.status === 'cancelled').length;

  if (statTotalEl) statTotalEl.textContent = total;
  if (statConfirmedEl) statConfirmedEl.textContent = confirmed;
  if (statCancelledEl) statCancelledEl.textContent = cancelled;
}

/**
 * Render bookings list
 * @param {Array} bookings
 */
function renderBookingsList(bookings) {
  if (!bookingsListEl) return;

  if (bookings.length === 0) {
    renderEmptyState();
    return;
  }

  // Sort by newest booking first (or reverse array)
  const sorted = [...bookings].reverse();

  bookingsListEl.innerHTML = sorted.map(booking => {
    const hotel = hotelsMap.get(String(booking.hotelId)) || {
      name: 'Boutique Hotel',
      location: 'Destination',
      image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=600&q=80'
    };

    const room = roomsMap.get(String(booking.roomId)) || {
      roomNumber: '---',
      roomType: 'Standard Suite'
    };

    const nights = calculateNights(booking.checkIn, booking.checkOut);
    const isConfirmed = booking.status === 'confirmed';

    const statusBadge = isConfirmed
      ? `<span class="room-status-badge status-confirmed">✓ Confirmed</span>`
      : `<span class="room-status-badge status-cancelled">✕ Cancelled</span>`;

    const actionButton = isConfirmed
      ? `<button type="button" class="btn btn-danger-outline btn-cancel-booking" data-booking-id="${booking.id}">
           Cancel Reservation
         </button>`
      : `<span style="font-size: 0.85rem; color: var(--color-danger); font-weight: 600;">Booking Cancelled</span>`;

    return `
      <article class="booking-history-card" id="booking-card-${booking.id}">
        <img src="${sanitize(hotel.image)}" alt="${sanitize(hotel.name)}" class="booking-thumb">

        <div class="booking-info-block">
          <div class="booking-meta-header">
            <span class="booking-ref">#${sanitize(booking.id.toUpperCase())}</span>
            ${statusBadge}
          </div>

          <h3 class="booking-hotel-title">${sanitize(hotel.name)}</h3>
          <div style="font-size: 0.85rem; color: var(--color-accent); font-weight: 600;">
            📍 ${sanitize(hotel.location)} &bull; Room ${sanitize(room.roomNumber)} (${sanitize(room.roomType)})
          </div>

          <div class="booking-details-row">
            <div class="booking-detail-item">
              <span>📅</span>
              <span><strong>Dates:</strong> ${formatDate(booking.checkIn)} &ndash; ${formatDate(booking.checkOut)} (${nights} ${nights === 1 ? 'night' : 'nights'})</span>
            </div>

            <div class="booking-detail-item">
              <span>👥</span>
              <span><strong>Guests:</strong> ${booking.guests}</span>
            </div>
          </div>
        </div>

        <div class="booking-action-block">
          <div>
            <div style="font-size: 0.75rem; color: var(--color-text-muted); text-transform: uppercase; font-weight: 600;">
              Total Paid
            </div>
            <div class="booking-total-paid">${formatCurrency(booking.totalAmount)}</div>
          </div>
          ${actionButton}
        </div>
      </article>
    `;
  }).join('');

  // Attach cancel click handlers
  document.querySelectorAll('.btn-cancel-booking').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const bId = e.currentTarget.getAttribute('data-booking-id');
      openCancelModal(bId);
    });
  });
}

/**
 * Open cancellation confirmation modal
 * @param {string} bookingId
 */
function openCancelModal(bookingId) {
  pendingCancelBookingId = bookingId;
  if (cancelModalEl) {
    cancelModalEl.classList.add('is-open');
  }
}

/**
 * Close cancellation confirmation modal
 */
function closeCancelModal() {
  pendingCancelBookingId = null;
  if (cancelModalEl) {
    cancelModalEl.classList.remove('is-open');
  }
}

/**
 * Confirm and execute cancellation
 */
async function handleConfirmCancel() {
  if (!pendingCancelBookingId) return;

  const bookingToCancel = currentBookings.find(b => String(b.id) === String(pendingCancelBookingId));
  if (!bookingToCancel) {
    closeCancelModal();
    return;
  }

  btnModalConfirmEl.disabled = true;
  btnModalConfirmEl.textContent = 'Cancelling...';

  try {
    // 1. Update booking status to 'cancelled'
    await bookingService.updateBookingStatus(bookingToCancel.id, 'cancelled');

    // 2. Restore room status to 'available'
    await roomService.updateRoomStatus(bookingToCancel.roomId, 'available');

    closeCancelModal();
    showToast('Reservation successfully cancelled. Room has been restored to inventory.', 'success');

    // Reload list to update badges and counts
    await loadHistoryData();
  } catch (error) {
    showToast(error.message || 'Failed to cancel reservation.', 'error');
  } finally {
    btnModalConfirmEl.disabled = false;
    btnModalConfirmEl.textContent = 'Confirm Cancellation';
  }
}

/**
 * Setup modal listeners
 */
function setupModalListeners() {
  btnModalKeepEl?.addEventListener('click', closeCancelModal);
  btnModalConfirmEl?.addEventListener('click', handleConfirmCancel);

  // Close modal when clicking on overlay backdrop
  cancelModalEl?.addEventListener('click', (e) => {
    if (e.target === cancelModalEl) {
      closeCancelModal();
    }
  });

  // Close on Escape key
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && cancelModalEl?.classList.contains('is-open')) {
      closeCancelModal();
    }
  });
}

/**
 * Render loading state
 */
function renderLoadingState() {
  if (!bookingsListEl) return;
  bookingsListEl.innerHTML = `
    <div class="state-container">
      <div class="loading-spinner"></div>
      <p class="state-title">Retrieving Reservations</p>
      <p class="state-description">Fetching your booking confirmation records...</p>
    </div>
  `;
}

/**
 * Render empty state
 */
function renderEmptyState() {
  if (!bookingsListEl) return;
  bookingsListEl.innerHTML = `
    <div class="state-container">
      <div class="empty-icon">🧳</div>
      <h3 class="state-title">No Reservations Yet</h3>
      <p class="state-description">You haven't made any hotel reservations yet. Explore our premier destinations to book your first getaway.</p>
      <a href="index.html" class="btn btn-accent">Explore Luxury Stays &rarr;</a>
    </div>
  `;
}

/**
 * Render error state
 * @param {string} message
 */
function renderErrorState(message) {
  if (!bookingsListEl) return;
  bookingsListEl.innerHTML = `
    <div class="state-container">
      <div class="empty-icon" style="color: var(--color-danger);">⚠</div>
      <h3 class="state-title">Unable to Load Reservations</h3>
      <p class="state-description">${sanitize(message)}</p>
      <button type="button" id="btn-history-retry" class="btn btn-primary">Try Again</button>
    </div>
  `;
  document.getElementById('btn-history-retry')?.addEventListener('click', loadHistoryData);
}

// Kickoff
document.addEventListener('DOMContentLoaded', init);
