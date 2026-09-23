# 🏨 Hotel Booking System (Aura Stay)

A clean, optimized, beginner-friendly full CRUD web application for a luxury Hotel Booking System built strictly with **HTML5, CSS3, Vanilla JavaScript (ES modules), Axios, and JSON Server**.

![Tech Stack](https://img.shields.io/badge/Stack-HTML5%20%7C%20CSS3%20%7C%20Vanilla%20JS%20%7C%20Axios-blue)
![API](https://img.shields.io/badge/Backend-JSON%20Server-green)
![License](https://img.shields.io/badge/License-MIT-amber)

---

## 🌟 Features

1. **Destinations Catalog (`views/index.html`)**:
   - Real-time search by hotel name or location.
   - Filter by destination from dynamic dropdown.
   - Max price per night slider with live value display.
   - Interactive hotel cards with ratings, starting price, and amenities pills.

2. **Hotel Details & Accommodations (`views/hotel-details.html`)**:
   - Comprehensive resort details, ratings, and amenity icons.
   - Live room & suite availability.
   - Status indicators (`Available` vs `Booked`).
   - "Book This Room" action with automatic room preselection.

3. **Room Reservation & Pricing Engine (`views/booking.html`)**:
   - Dynamic length of stay computation (nights).
   - Real-time price breakdown (nightly rate &times; nights, 12% hotel occupancy tax, total amount).
   - Strict input validations (dates in future, checkout after checkin, guest count limits).
   - Atomic booking creation (`POST /bookings`) and room status transition (`PATCH /rooms/:id` &rarr; `booked`).
   - Double-booking prevention with live server availability verification.

4. **Booking History & Cancellation Management (`views/booking-history.html`)**:
   - Summary statistics banner (Total reservations, active/confirmed, cancelled).
   - Hydrated booking cards with hotel photo, dates, guest counts, and total paid.
   - Cancellation confirmation modal dialog.
   - Automatic room release on cancellation (`PATCH /bookings/:id` &rarr; `cancelled` & `PATCH /rooms/:id` &rarr; `available`).

---

## 📁 Mandatory Folder Structure

```
project-root/
├── views/
│   ├── index.html              # Home & hotel discovery
│   ├── hotel-details.html      # Hotel details & room listings
│   ├── booking.html            # Reservation form & live pricing engine
│   └── booking-history.html    # Booking records & cancellation management
├── css/
│   ├── style.css               # Core design tokens, layout & luxury UI components
│   └── responsive.css          # Mobile, tablet, and desktop media queries
├── js/
│   ├── service/
│   │   ├── apiConfig.js        # Axios instance, baseURL, and default headers
│   │   ├── hotelService.js     # Hotel API calls (GET /hotels, GET /hotels/:id)
│   │   ├── roomService.js      # Room API calls (GET /rooms, PATCH /rooms/:id)
│   │   ├── bookingService.js   # Booking API calls (GET /bookings, POST, PATCH, DELETE)
│   │   └── userService.js      # User API calls (GET /users, session profile)
│   ├── main.js                 # Home page DOM controller & filters
│   ├── hotelDetails.js         # Hotel details & room availability controller
│   ├── booking.js              # Reservation controller, date/guest validation & price math
│   ├── bookingHistory.js       # Reservations controller & cancellation flow
│   └── utils.js                # Pure helpers (currency, dates, nights calculation, toasts)
├── exception/
│   ├── apiException.js         # Centralized HTTP and network error handling
│   └── validationException.js  # Centralized form and input validation rules
├── assets/
│   └── README.md
├── package.json                # Dependencies & npm scripts
└── db.json                     # Seed database with hotels, rooms, users, and bookings
```

---

## ⚙️ Architecture & Design Principles

- **Zero Axios Leaks**: Axios calls exist **only** inside `js/service/`. DOM controllers and HTML files never invoke Axios directly.
- **Centralized Exception Handling**: All API communication passes through `ApiException.fromAxiosError`, and all input validations pass through `ValidationException`.
- **Pure Reusable Calculations**: All monetary and date math resides in `js/utils.js`.
- **Vanilla Aesthetics**: 100% custom CSS with Google Fonts (*Outfit* and *Plus Jakarta Sans*), zero heavy frameworks (no React, Bootstrap, or Tailwind).

---

## 🚀 Getting Started

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (v16+)
- npm

### 2. Installation
```bash
git clone https://github.com/sreeram-09/HotelBookingSystem.git
cd HotelBookingSystem
npm install
```

### 3. Start the Application
Run the JSON Server & static file server:
```bash
npm start
# OR:
npm run server
```

The application will be running at:
- **Web App**: [http://localhost:3000/views/index.html](http://localhost:3000/views/index.html)
- **REST API**: [http://localhost:3000/](http://localhost:3000/) (`/hotels`, `/rooms`, `/users`, `/bookings`)

---

## 📄 License
This project is open-source under the MIT License.
