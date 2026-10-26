# CampusMart Phase 2 — Express/MongoDB backend

This backend is a **development foundation**, not a production-ready payment service. It includes registration, login, JWT auth, product CRUD, seller ownership checks, and public product search. It does **not** yet implement email verification, orders, payments, refresh tokens, admin moderation, or image uploads. Do not use it for real-money transactions.

## Setup

1. Install Node.js 20+ and start MongoDB locally, or create a MongoDB Atlas database.
2. `cd server`
3. `npm install`
4. Copy `.env.example` to `.env`, then set `MONGODB_URI`, `JWT_SECRET` (32+ random characters), and `CLIENT_URL`.
5. `npm run dev`
6. Check `http://localhost:5000/api/health` — it should return `{"ok":true}`.

## API requests

Register:
```bash
curl -X POST http://localhost:5000/api/auth/register -H 'Content-Type: application/json' -d '{"name":"Alice","email":"alice@example.edu","password":"example-password-123","college":"IGDTUW"}'
```
Login:
```bash
curl -X POST http://localhost:5000/api/auth/login -H 'Content-Type: application/json' -d '{"email":"alice@example.edu","password":"example-password-123"}'
```
Copy the `token` from the login response. Create a listing:
```bash
curl -X POST http://localhost:5000/api/products -H 'Content-Type: application/json' -H 'Authorization: Bearer YOUR_TOKEN' -d '{"title":"Engineering drawing drafter","description":"Gently used, works perfectly","category":"Stationery","condition":"Good","price":350,"original":700}'
```
Browse: `GET /api/products`, search: `GET /api/products?q=drafter`, detail: `GET /api/products/:id`, update: `PATCH /api/products/:id` (own listing only), hide: `DELETE /api/products/:id` (own listing only), current user: `GET /api/auth/me`.

## Connecting the React frontend

Your existing frontend is **still demo-only** until its Zustand actions and pages are updated to call these APIs. Add `VITE_API_URL=http://localhost:5000/api` to the frontend `.env`, then implement an API client with `fetch` or Axios. Map MongoDB `_id` to UI `id`, `pricePaise / 100` to `price`, and `sellerId.name` to `seller`. Replace demo login with real login and token handling. Do not store long-lived secrets in localStorage in production.

## Next milestones

Email verification and safer auth sessions → frontend API integration → inventory reservations and orders → Razorpay test checkout with signed webhooks → refunds, moderation and deployment.
