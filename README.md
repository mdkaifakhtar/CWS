# SplashPoint — Multi-Vendor Car Wash Shop Booking Platform (MERN)

**Business model: customers book a time slot at a physical car wash shop and
visit it in person. There is no doorstep/home service — the vendor never
travels to the customer.** This was corrected from an earlier iteration that
had drifted toward a delivery-style model; see "The business-model
correction" below for exactly what changed and why.

Customers pick a vehicle, find nearby shops, book a service and a time slot,
then visit the shop and pay there. Vendors run their shop through a KYC-gated
panel. Admins get a full operations console: daily bookings, vendor
performance, platform commission, and a vendor settlement/collection ledger.

Stack: React 18 + Vite + Redux Toolkit + React Router DOM + Axios + Tailwind
CSS + Framer Motion + React Hook Form (frontend), Node.js + Express +
MongoDB/Mongoose + JWT + Cloudinary (backend). JavaScript/JSX only — no
TypeScript, no TanStack, no Supabase.

**Documentation:**
- `docs/API_REFERENCE.md` — every endpoint, the booking state machine, the commission formula, notification triggers
- `docs/DATABASE.md` — every model and field
- `docs/ROADMAP.md` — what's done, what's deferred, and why
- `docs/VERIFICATION_REPORT.md` — exactly what was tested, how, and what couldn't be (no browser in this build environment)

---

## 1. The business-model correction

An earlier pass introduced booking fields (a delivery `address`, inline
`vehicleDetails`) that read as a doorstep/home-service model. That's been
removed and replaced:

| Before | After |
|---|---|
| Booking required a delivery `address` | **Removed entirely.** The service location is always the vendor's shop (`Vendor.businessAddress`) |
| Vehicle info typed inline per booking | **`Vehicle` is now a first-class model** — "My Vehicles" in the customer dashboard, selected (not re-typed) at booking time |
| Statuses: Booking Requested → Vendor Accepted → Service Scheduled → Service Started → Service Completed | **Simplified to: Pending → Confirmed → In Progress → Completed** (+ Rejected/Cancelled) — the separate "scheduling" step doesn't apply once there's no delivery leg |
| "Doorstep car washing," "vendor arrives," "Cash on Delivery" copy | **"Visit the shop," "pay at the shop"** throughout |
| No financial model | **Configurable commission %, per-booking commission snapshot, and a vendor collection/settlement ledger** (see below) |

A booking is never auto-confirmed — it's created as `Pending`, and only
becomes `Confirmed` when the vendor explicitly accepts it.

## 2. What's in this build

### Customer
Home, Login/Register, Service Listing (filters + distance sort via
geolocation), Service Detail, Vendor/Shop Detail, a 3-step booking wizard
(**Vehicle → Schedule → Confirm**, no address step) with real backend-computed
time slots (working hours, existing bookings, **2-hour minimum lead time**),
a "My Vehicles" page, and a dashboard (bookings, vehicles, reviews, profile).
A notification bell keeps customers updated on booking status changes.

### Vendor
KYC-gated registration (owner + business details, registration number,
geo-coordinates, typed documents) — starts at `Pending`, not operational
until admin-approved. Editing a rejected profile or uploading a document
automatically resubmits (back to `Pending`, admin re-notified). Once
approved: business profile, documents, service CRUD, and booking management
(**Confirm → Start service → Mark completed**, all state-machine-enforced
both client- and server-side).

### Admin — operations console
- **Dashboard**: platform totals, pending approvals, recent vendors
- **Daily operations** (`/admin/daily`): pick any date, see booking counts by
  status, gross booking value, platform commission, vendor payable, and a
  per-vendor breakdown for that day
- **Vendor approval queue**: full KYC review, documents with type/
  verification status, approve/reject (reason required)/suspend (reason
  required)/restore
- **Vendor performance** (`/admin/performance`): bookings today/this week/
  this month, completed/cancelled, gross revenue, payable, pending
  collection — sortable
- **Collections** (`/admin/collections`): vendor-wise settlement ledger
  (gross / commission / payable / collected / pending), with an audited
  "record a collection" action and full history per vendor
- **Settings** (`/admin/settings`): the platform commission % is
  configurable, not hardcoded — changing it only affects bookings completed
  *after* the change; already-completed bookings keep their original
  snapshot

## 3. The financial model

For every booking marked `Completed`, the platform snapshots a commission
breakdown using the *current* commission rate at that moment:

```
commissionAmount   = round(bookingAmount × commissionRate / 100)
vendorPayableAmount = bookingAmount − commissionAmount
```

Example at the default 10%: a ₹500 booking → ₹50 commission, ₹450 payable to
the vendor. This is snapshotted onto the `Booking` document and never
recalculated later — editing the commission % in Settings has no retroactive
effect.

**Collection is tracked as a running vendor-level ledger, not per-booking.**
Admin records a lump-sum "collection" against a vendor (e.g. a weekly
settlement), and the ledger shows `pendingCollection = totalVendorPayable −
totalCollected`. Every recorded collection is an append-only, audited entry
(`CollectionEntry`) — nothing is ever silently overwritten.

**There is no payment gateway.** All amounts are "pay at the shop" — the
platform never claims a payment succeeded online. The collections ledger
tracks the financial *obligation* between the platform and each vendor, not
an actual online transaction.

## 4. Staged but not wired up

`adminCategoryController.js` and `adminServiceController.js` (category CRUD
and platform-wide service moderation) are mounted to routes as of this pass
but have **no frontend yet** — usable via the API, no admin UI page exists
for them. Customer management (`adminUserController.js`) is likewise routed
but has no frontend page. See `docs/ROADMAP.md`.

## 5. Running this locally

### Prerequisites
- Node.js 18+, npm, a MongoDB connection string, optionally Cloudinary credentials

### Backend
```bash
cd server
cp .env.example .env   # set MONGO_URI, JWT_SECRET, optionally Cloudinary creds
npm install
npm run seed            # demo data, including two vehicles for the demo customer
npm run dev              # http://localhost:5000
```

Demo accounts (all password `password123`):
| Role | Login |
|---|---|
| Customer (has 2 saved vehicles) | `demo.user@example.com` |
| Vendor (approved) | `demo.vendor@example.com` |


### Frontend
```bash
cd client
cp .env.example .env
npm install
npm run dev   # http://localhost:5173
```

## 6. Environment variables

**`server/.env`**: `PORT`, `NODE_ENV`, `MONGO_URI`, `JWT_SECRET`,
`JWT_EXPIRES_IN`, `CLIENT_URL`, `CLOUDINARY_CLOUD_NAME`/`CLOUDINARY_API_KEY`/
`CLOUDINARY_API_SECRET`.

**`client/.env`**: `VITE_API_URL`, `VITE_GOOGLE_MAPS_API_KEY` (reserved,
unused — no mapping library in the approved stack; see
`docs/API_REFERENCE.md`).

## 7. Verification performed

No browser, screenshot tool, or live preview URL in this sandbox — that has
been true throughout. What was actually done:

- Backend: every file passes `node --check`; the Express app boots live and
  every route group's auth boundary was hit directly
- **Business logic unit-tested against the real controller code** (mocked
  models, not just described): the new 4-state booking machine (7 tests),
  the commission-snapshot formula matching the spec's own ₹500-at-10%
  example exactly, the daily-summary aggregation math, the collections
  ledger's pending-balance calculation, vehicle-based booking creation with
  no address field, and a rejection test confirming a vehicle that doesn't
  belong to the requester is refused
- Frontend: `npm run build` succeeds with zero errors after every major
  change in this pass
- **Not verified**: actual browser rendering, real MongoDB Atlas behavior,
  real Cloudinary uploads — unreachable from this sandbox

See `docs/VERIFICATION_REPORT.md` for the full, itemized test list.

## 8. Project structure

```
carwash-platform/
├── docs/
├── server/src/
│   ├── models/          User, Vendor, ServiceCategory, VehicleType, Service,
│   │                    Vehicle, Booking, BookingStatusLog, Review,
│   │                    Notification, PlatformSettings, CollectionEntry
│   ├── controllers/     auth, user, catalog, availability, booking, vehicle,
│   │                    review, vendorAuth, vendor, vendorService,
│   │                    vendorBooking, admin, adminCategory, adminService,
│   │                    adminUser, adminSettings, adminFinance,
│   │                    adminCollections, upload, notification
│   ├── routes/, middleware/, utils/ (incl. commission.js, geo.js, slotGenerator.js)
│   └── seed/seed.js
└── client/src/
    ├── features/         auth, booking/{catalog,booking,user,vehicle}Slice,
    │                    vendor/vendorSlice, admin/adminSlice, notifications
    ├── components/ui/    Button, FormField, Card, Badge, Modal, Loading, DashboardShell
    └── pages/
        ├── dashboard/    customer dashboard (incl. Vehicles.jsx)
        ├── vendor/       vendor panel
        ├── admin/        admin panel (incl. AdminDailySummary, AdminCollections,
        │                AdminVendorPerformance, AdminSettings)
        └── ...           Home, Login, Register, ServiceListing, BookService, etc.
```
