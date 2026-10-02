# B2B Order Management Platform

Arrowstack Internship — Project 1 (Foundation / Core Industry Task)

A multi-role ordering system for a simulated distributor: buyers browse a
product catalog, add items to a cart, and check out into orders and
invoices; admins manage the catalog, stock, and order lifecycle.

## 1. Stakeholder & Problem

- **Primary stakeholder:** the distributor's operations/sales team, who
  today take B2B orders manually (phone/email) with no shared view of
  stock or order status.
- **Decision enabled:** whether a buyer's order can be fulfilled from
  current stock, and what stage each order is at.
- **Measurable benefit:** fewer overselling errors (stock is checked and
  decremented atomically at checkout) and full traceability of who
  changed what, when (audit log).

## 2. Architecture

```
┌─────────────┐      REST/JSON       ┌──────────────┐      SQL       ┌────────────┐
│  React SPA  │ ───────────────────► │  Express API │ ─────────────► │ PostgreSQL │
│  (Vite)     │ ◄─────────────────── │  (JWT auth)  │ ◄───────────── │            │
└─────────────┘                      └──────────────┘                └────────────┘
```

- **Frontend:** React 18 + Vite + React Router. `AuthContext` stores the
  JWT and current user; an Axios interceptor attaches the token to every
  request and redirects to `/login` on a 401.
- **Backend:** Node.js + Express. Routes are grouped by resource
  (`auth`, `products`, `cart`, `orders`, `invoices`). `requireAuth` and
  `requireRole` middleware enforce role-based access on every protected
  route.
- **Database:** PostgreSQL, accessed with raw SQL via `pg` (no ORM) so
  the schema and queries stay fully visible for review. Schema changes
  live as numbered files in `backend/migrations/`, applied in order by
  `backend/src/db/migrate.js`, which tracks progress in a
  `schema_migrations` table (safe to re-run).

## 3. Data Model

| Table | Purpose |
|---|---|
| `users` | Admins and buyers. Role is enforced at signup — self-registration always creates a `buyer`. |
| `products` | Catalog: SKU, price, stock quantity. Deletes are soft (`is_active = false`) to preserve order history. |
| `cart_items` | One row per (buyer, product) in an active cart. |
| `orders` / `order_items` | Created at checkout; line items snapshot the product name/price at time of purchase so later price changes don't rewrite history. |
| `invoices` | One per order, generated automatically at checkout. |
| `audit_logs` | Append-only record of who did what (login, product create/update/delete, checkout, status change). |

## 4. Core Workflow: Checkout

`POST /api/cart/checkout` runs inside a single database transaction:

1. Lock the buyer's cart rows and their products (`FOR UPDATE`).
2. Re-check stock for every line — reject the whole checkout if anything
   is short, listing exactly which items and by how much.
3. Create the order + order items, decrement stock, generate an
   invoice, and clear the cart.
4. Commit. If any step fails, the whole transaction rolls back — no
   partial orders, no incorrect stock decrements.

This is the main edge case the project is built to handle: two buyers
racing to order the last units of the same product.

## 5. Getting Started

### Option A — Docker (recommended, one command)

```bash
docker compose up --build
```

This starts Postgres, runs migrations, seeds demo data, and starts the
API on `http://localhost:4000` and the frontend on
`http://localhost:5173`.

### Option B — Run locally without Docker

Requires Node.js 20+ and a running PostgreSQL instance.

```bash
# Backend
cd backend
cp .env.example .env        # edit DATABASE_URL / JWT_SECRET as needed
npm install
npm run migrate
npm run seed
npm run dev                 # http://localhost:4000

# Frontend (separate terminal)
cd frontend
cp .env.example .env
npm install
npm run dev                 # http://localhost:5173
```

### Demo accounts (created by `npm run seed`)

| Role | Email | Password |
|---|---|---|
| Admin | admin@arrowstack.test | Admin@123 |
| Buyer | buyer@arrowstack.test | Buyer@123 |

## 6. API Reference

| Method | Endpoint | Role | Description |
|---|---|---|---|
| POST | `/api/auth/register` | public | Create a buyer account |
| POST | `/api/auth/login` | public | Get a JWT |
| GET | `/api/products` | any | List active products |
| POST | `/api/products` | admin | Create a product |
| PUT | `/api/products/:id` | admin | Update a product |
| DELETE | `/api/products/:id` | admin | Soft-delete a product |
| GET | `/api/cart` | buyer | View own cart |
| POST | `/api/cart` | buyer | Add item to cart |
| PUT | `/api/cart/:id` | buyer | Change quantity |
| DELETE | `/api/cart/:id` | buyer | Remove item |
| POST | `/api/cart/checkout` | buyer | Convert cart → order + invoice |
| GET | `/api/orders` | buyer/admin | Own orders (buyer) or all orders (admin) |
| GET | `/api/orders/:id` | buyer/admin | Order detail with items + invoice |
| PATCH | `/api/orders/:id/status` | admin | Move order through its lifecycle |
| GET | `/api/invoices/:orderId` | buyer/admin | Fetch an invoice |

## 7. Validation & Edge Cases Handled

- Duplicate SKU or email rejected with a clear 409 error.
- Negative price/quantity rejected at the API layer, not just the UI.
- Checkout re-validates stock at the database level (not just what the
  cart page last showed), preventing overselling under concurrent load.
- Expired/invalid JWTs return 401 and the frontend redirects to login.
- Buyers cannot view or act on another buyer's cart, order, or invoice.

## 8. Known Limitations & Next Steps

- No payment gateway integration — checkout is "place order," not
  "charge a card." A Stripe-like simulated flow would fit Project 3's
  stack and could be layered on here.
- No pagination on the product/order lists — fine for a demo catalog,
  would need it before scaling past a few hundred rows.
- No automated test suite yet. Recommended next step: integration
  tests for the checkout transaction (the highest-risk code path) using
  a disposable test database.
- No email notifications on order status changes.

## 9. Manual Test Checklist (evidence of validation)

- [ ] Register a buyer, log in, log out, log back in.
- [ ] Admin creates a product with stock = 2.
- [ ] Buyer adds 3 units to cart → checkout is rejected with a shortage
      message.
- [ ] Buyer adds 2 units, checks out → order + invoice appear, product
      stock drops to 0.
- [ ] Admin moves the order from `pending` → `processing` → `shipped`.
- [ ] Buyer sees the updated status on `/orders`.
- [ ] Non-admin hitting `POST /api/products` directly (e.g. via curl)
      gets a 403.
