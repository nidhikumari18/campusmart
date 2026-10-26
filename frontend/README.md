# CampusMart — Frontend Demo

A responsive React + Vite + Tailwind v4 campus marketplace demo with dark mode, search, filters, wishlist, cart, demo checkout, seller listing form, and demo profile.

## Requirements
Node.js 20.19+ (or compatible newer LTS) and npm.

## Setup
```bash
npm install
npm run dev
```
Open the URL printed by Vite (usually http://localhost:5173).

## Production build
```bash
npm run build
npm run preview
```

## Important limitations
- No backend, real authentication, verified campus identities, seller ownership checks, real inventory locking, real chat, or Razorpay payments yet.
- All data persists in localStorage only. Anyone can modify it; do not treat it as trusted.
- Demo checkout creates an explicitly **unpaid** order record. It never charges money.
- Emoji placeholders are used instead of uploaded product photos.
- The seller form is a demo and does not require sign-in. A production API must enforce authenticated seller access.

## Next phase
Build Express/Mongoose API with JWT sessions, product ownership, atomic reservations, order creation, and Razorpay test-mode payment verification/webhooks. Replace Zustand demo mutations with authenticated API calls.
