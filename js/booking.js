import hotelService from './service/hotelService.js';
import roomService from './service/roomService.js';
import bookingService from './service/bookingService.js';
import userService from './service/userService.js';
import { ValidationException } from '../exception/validationException.js';
import { ApiException } from '../exception/apiException.js';
import {
  formatCurrency,
  getTodayDateString,
  calculateNights,
  calculatePricingBreakdown,
  getUrlParam,
  showToast,
  sanitize
} from './utils.js';

// DOM Elements - Navigation & Profile
const userNameEl = document.getElementById('user-name');
const userAvatarEl = document.getElementById('user-avatar');
const backLinkEl = document.getElementById('back-link');

// DOM Elements - Form
const bookingFormEl = document.getElementById('booking-form');
const roomSelectEl = document.getElementById('room-select');
const checkInEl = document.getElementById('check-in-date');
const checkOutEl = document.getElementById('check-out-date');
const guestsEl = document.getElementById('guests-count');
const guestNameEl = document.getElementById('primary-guest-name');
const guestEmailEl = document.getElementById('primary-guest-email');
const submitBtnEl = document.getElementById('btn-submit-booking');

// DOM Elements - Summary & Calculation
const summaryHotelImgEl = document.getElementById('summary-hotel-img');
const summaryHotelNameEl = document.getElementById('summary-hotel-name');
const summaryHotelLocationEl = document.getElementById('summary-hotel-location');
const summaryRoomTypeEl = document.getElementById('summary-room-type');
const summaryRoomRateEl = document.getElementById('summary-room-rate');
const calcNightsEl = document.getElementById('calc-nights');
const calcSubtotalEl = document.getElementById('calc-subtotal');
const calcTaxesEl = document.getElementById('calc-taxes');
const calcTotalEl = document.getElementById('calc-total');

// In-memory state
let currentUser = null;
let currentHotel = null;
let hotelRooms = [];
let selectedRoom = null;
let currentPricing = { nights: 0, subtotal: 0, taxes: 0, total: 0 };

/**
 * Initialize booking page
 */
async function init() {
  await loadUserProfile();
  setupDateLimits();

  const hotelId = getUrlParam('hotelId');
  const targetRoomId = getUrlParam('roomId');

  if (!hotelId) {
    showToast('Missing hotel parameter. Redirecting to home...', 'warning');
    setTimeout(() => { window.location.href = 'index.html'; }, 1500);
    return;
  }

  // Update back link
  if (backLinkEl) {
    backLinkEl.href = `hotel-details.html?id=${encodeURIComponent(hotelId)}`;
  }

  await loadBookingContext(hotelId, targetRoomId);
  setupEventListeners();
  recalculatePricing();
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
      if (guestNameEl) guestNameEl.value = currentUser.name;
      if (guestEmailEl) guestEmailEl.value = currentUser.email;
    }
  } catch {
    // Non-critical
  }
}

/**
 * Configure minimum allowable dates (today & tomorrow)
 */
function setupDateLimits() {
  const today = getTodayDateString();
  if (checkInEl) {
    checkInEl.min = today;
    checkInEl.value = today;
  }

  // Set default check-out to tomorrow
  const tomorrowDate = new Date();
  tomorrowDate.setDate(tomorrowDate.getDate() + 2);
  const tomorrowStr = tomorrowDate.toISOString().split('T')[0];

  if (checkOutEl) {
    checkOutEl.min = today;
    checkOutEl.value = tomorrowStr;
  }
}

/**
 * Fetch hotel and rooms, then populate room dropdown
 * @param {string} hotelId
 * @param {string | null} targetRoomId
 */
async function loadBookingContext(hotelId, targetRoomId) {
  try {
    const [hotel, rooms] = await Promise.all([
      hotelService.getHotelById(hotelId),
      roomService.getRoomsByHotelId(hotelId)
    ]);

    currentHotel = hotel;
    hotelRooms = Array.isArray(rooms) ? rooms : [];

    // Update summary hotel info
    if (summaryHotelImgEl) summaryHotelImgEl.src = hotel.image;
    if (summaryHotelNameEl) summaryHotelNameEl.textContent = hotel.name;
    if (summaryHotelLocationEl) summaryHotelLocationEl.textContent = `📍 ${hotel.location}`;

    populateRoomDropdown(hotelRooms, targetRoomId);
  } catch (error) {
    showToast(error.message || 'Failed to load booking details.', 'error');
  }
}

/**
 * Populate room selector dropdown
 * @param {Array} rooms
 * @param {string | null} defaultRoomId
 */
function populateRoomDropdown(rooms, defaultRoomId) {
  if (!roomSelectEl) return;

  roomSelectEl.innerHTML = '<option value="">-- Choose a Suite or Room --</option>';

  let matchedRoom = null;

  rooms.forEach(room => {
    const isAvailable = room.status === 'available';
    const isTarget = defaultRoomId && String(room.id) === String(defaultRoomId);

    const opt = document.createElement('option');
    opt.value = room.id;
    opt.textContent = `Room ${room.roomNumber} - ${room.roomType} (${formatCurrency(room.price)}/night)${isAvailable ? '' : ' [BOOKED]'}`;

    // Disable if booked and not our target room
    if (!isAvailable) {
      opt.disabled = true;
    }

    if (isTarget && isAvailable) {
      opt.selected = true;
      matchedRoom = room;
    }

    roomSelectEl.appendChild(opt);
  });

  // If no room explicitly targeted, auto-select first available room
  if (!matchedRoom) {
    matchedRoom = rooms.find(r => r.status === 'available');
    if (matchedRoom) {
      roomSelectEl.value = matchedRoom.id;
    }
  }

  setSelectedRoom(matchedRoom);
}

/**
 * Set active room in state and update UI summary
 * @param {Object | null} room
 */
function setSelectedRoom(room) {
  selectedRoom = room || null;

  if (room) {
    if (summaryRoomTypeEl) {
      summaryRoomTypeEl.textContent = `Room ${room.roomNumber} (${room.roomType})`;
    }
    if (summaryRoomRateEl) {
      summaryRoomRateEl.textContent = formatCurrency(room.price);
    }
  } else {
    if (summaryRoomTypeEl) summaryRoomTypeEl.textContent = 'None selected';
    if (summaryRoomRateEl) summaryRoomRateEl.textContent = '$0.00';
  }

  recalculatePricing();
}

/**
 * Live price breakdown calculation
 */
function recalculatePricing() {
  const checkIn = checkInEl?.value;
  const checkOut = checkOutEl?.value;
  const pricePerNight = selectedRoom?.price || 0;

  const nights = calculateNights(checkIn, checkOut);
  currentPricing = calculatePricingBreakdown(pricePerNight, nights, 0.12);

  if (calcNightsEl) {
    calcNightsEl.textContent = `${currentPricing.nights} ${currentPricing.nights === 1 ? 'night' : 'nights'}`;
  }
  if (calcSubtotalEl) {
    calcSubtotalEl.textContent = formatCurrency(currentPricing.subtotal);
  }
  if (calcTaxesEl) {
    calcTaxesEl.textContent = formatCurrency(currentPricing.taxes);
  }
  if (calcTotalEl) {
    calcTotalEl.textContent = formatCurrency(currentPricing.total);
  }
}

/**
 * Validate inputs against business rules
 * @throws {ValidationException}
 */
function validateBookingInputs() {
  const errors = {};
  const todayStr = getTodayDateString();

  // Clear previous errors
  clearFieldErrors();

  // 1. Room check
  if (!selectedRoom) {
    errors.room = 'Please select a room for your stay.';
  } else if (selectedRoom.status !== 'available') {
    errors.room = 'The selected room is currently unavailable. Please pick an available room.';
  }

  // 2. Dates check
  const checkIn = checkInEl?.value;
  const checkOut = checkOutEl?.value;

  if (!checkIn) {
    errors.checkIn = 'Please provide a valid check-in date.';
  } else if (checkIn < todayStr) {
    errors.checkIn = 'Check-in date cannot be in the past.';
  }

  if (!checkOut) {
    errors.checkOut = 'Please provide a valid check-out date.';
  } else if (checkIn && checkOut <= checkIn) {
    errors.checkOut = 'Check-out date must be at least one day after check-in.';
  }

  // 3. Guests check
  const guests = parseInt(guestsEl?.value, 10);
  if (isNaN(guests) || guests < 1) {
    errors.guests = 'At least 1 guest is required.';
  } else if (guests > 6) {
    errors.guests = 'Maximum capacity is 6 guests per suite.';
  }

  if (Object.keys(errors).length > 0) {
    displayFieldErrors(errors);
    throw new ValidationException('Please correct the highlighted fields before submitting.', errors);
  }
}

/**
 * Display field-level validation errors
 * @param {Record<string, string>} errors
 */
function displayFieldErrors(errors) {
  for (const [field, message] of Object.entries(errors)) {
    const errorEl = document.getElementById(`error-${field}`);
    if (errorEl) {
      errorEl.textContent = message;
      errorEl.classList.add('visible');
    }
    const inputEl = document.getElementById(getFieldInputId(field));
    if (inputEl) {
      inputEl.classList.add('is-invalid');
    }
  }
}

/**
 * Map field name to input ID
 * @param {string} field
 * @returns {string}
 */
function getFieldInputId(field) {
  const map = {
    room: 'room-select',
    checkIn: 'check-in-date',
    checkOut: 'check-out-date',
    guests: 'guests-count'
  };
  return map[field] || field;
}

/**
 * Clear all field errors
 */
function clearFieldErrors() {
  document.querySelectorAll('.field-error').forEach(el => {
    el.textContent = '';
    el.classList.remove('visible');
  });
  document.querySelectorAll('.is-invalid').forEach(el => {
    el.classList.remove('is-invalid');
  });
}

/**
 * Handle form submission
 * @param {Event} e
 */
async function handleSubmit(e) {
  e.preventDefault();

  try {
    validateBookingInputs();

    // Verify room availability live from server before committing
    submitBtnEl.disabled = true;
    submitBtnEl.textContent = 'Verifying Room Availability...';

    const freshRoom = await roomService.getRoomById(selectedRoom.id);
    if (!freshRoom || freshRoom.status !== 'available') {
      throw new ValidationException('Room is no longer available', {
        room: 'This room was just booked by another guest. Please select another room.'
      });
    }

    submitBtnEl.textContent = 'Confirming Reservation...';

    // 1. Create booking payload
    const bookingPayload = {
      id: `bk-${Date.now().toString().slice(-6)}`,
      userId: currentUser?.id || 'user-1',
      hotelId: currentHotel.id,
      roomId: selectedRoom.id,
      checkIn: checkInEl.value,
      checkOut: checkOutEl.value,
      guests: parseInt(guestsEl.value, 10),
      totalAmount: currentPricing.total,
      status: 'confirmed'
    };

    // 2. Post booking
    await bookingService.createBooking(bookingPayload);

    // 3. Update room status to booked
    await roomService.updateRoomStatus(selectedRoom.id, 'booked');

    showToast('Reservation confirmed! Redirecting to booking history...', 'success');

    // Smooth redirect
    setTimeout(() => {
      window.location.href = 'booking-history.html';
    }, 1200);

  } catch (error) {
    submitBtnEl.disabled = false;
    submitBtnEl.textContent = 'Confirm & Complete Booking';

    if (error instanceof ValidationException) {
      if (error.hasFieldErrors()) {
        displayFieldErrors(error.fieldErrors);
      }
      showToast(error.getFirstErrorMessage(), 'warning');
    } else {
      showToast(error.message || 'Failed to complete booking. Please try again.', 'error');
    }
  }
}

/**
 * Attach UI event listeners
 */
function setupEventListeners() {
  // Room select change
  roomSelectEl?.addEventListener('change', (e) => {
    const roomId = e.target.value;
    const found = hotelRooms.find(r => String(r.id) === String(roomId));
    setSelectedRoom(found);
  });

  // Date changes
  checkInEl?.addEventListener('change', () => {
    if (checkOutEl && checkInEl.value) {
      // Ensure checkout min is day after checkin
      const inDate = new Date(checkInEl.value);
      inDate.setDate(inDate.getDate() + 1);
      const nextDayStr = inDate.toISOString().split('T')[0];
      checkOutEl.min = nextDayStr;
      if (checkOutEl.value <= checkInEl.value) {
        checkOutEl.value = nextDayStr;
      }
    }
    recalculatePricing();
  });

  checkOutEl?.addEventListener('change', () => {
    recalculatePricing();
  });

  guestsEl?.addEventListener('input', () => {
    recalculatePricing();
  });

  // Form submit
  bookingFormEl?.addEventListener('submit', handleSubmit);
}

// Kickoff
document.addEventListener('DOMContentLoaded', init);
