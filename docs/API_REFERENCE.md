# API Reference

Base URL: `http://localhost:5000/api`. All protected routes require
`Authorization: Bearer <token>`.

**Business model**: customers visit a vendor's physical shop. There is no
delivery address anywhere in this API — the service location is always
`Vendor.businessAddress`.

## Auth
| Method | Route | Access | Notes |
|---|---|---|---|
| POST | `/auth/register` | Public | Customer signup |
| POST | `/auth/login` | Public | `{ identifier, password }` — email or phone, any role |
| GET / PUT | `/auth/me` | Any logged-in user | |

## Vehicles (customer's "My Vehicles")
| Method | Route | Access | Notes |
|---|---|---|---|
| GET | `/vehicles` | Customer | List own vehicles |
| POST | `/vehicles` | Customer | `{ vehicleType, nickname, make, model, registrationNumber, isDefault }` — first vehicle is auto-default |
| PUT | `/vehicles/:id` | Customer (owner) | |
| DELETE | `/vehicles/:id` | Customer (owner) | |

## Catalog (public)
| Method | Route | Notes |
|---|---|---|
| GET | `/catalog/home` | Featured vendors, popular services, categories |
| GET | `/catalog/categories`, `/catalog/vehicle-types` | |
| GET | `/catalog/services` | `city`, `category`, `minPrice`, `maxPrice`, `minRating`, `q`, `sort` (incl. `distance`), `lat`, `lng`, `page`, `limit`. Each result includes `vendor.isOpenNow`; distance sort adds `distanceKm`. |
| GET | `/catalog/services/:id` | Detail + reviews |
| GET | `/catalog/services/:id/availability?date=YYYY-MM-DD` | Real bookable slots — see "Availability & lead time" below |
| GET | `/catalog/vendors/:id` | Shop public profile + active services + reviews |

## Bookings (customer)
| Method | Route | Access | Notes |
|---|---|---|---|
| POST | `/bookings` | Customer | `{ serviceId, vehicleId, scheduledDate, scheduledTimeSlot, specialInstructions }` — **no address field**. Creates status `Pending`. |
| GET | `/bookings/my` | Customer | `?status=` filter |
| GET | `/bookings/:id` | Customer (owner) | + status history |
| PUT | `/bookings/:id/cancel` | Customer (owner) | Only while `Pending`/`Confirmed` |

## Vendor
| Method | Route | Access | Notes |
|---|---|---|---|
| POST | `/vendor/register` | Public | Full KYC intake (owner + business details, registration number, lat/lng, service areas). Starts `Pending`, notifies all admins. |
| GET / PUT | `/vendor/me` | Vendor | Editing after a `rejected` status auto-resubmits (→ `Pending`, admins re-notified) |
| GET | `/vendor/dashboard`, `/vendor/reviews` | Vendor | |
| POST | `/vendor/documents` | Vendor | Multipart `files[]`, `type` (business_license\|owner_id_proof\|address_proof\|shop_proof\|other), `label`. Also triggers resubmission if rejected. |
| DELETE | `/vendor/documents/:docId` | Vendor | |
| GET/POST/PUT/DELETE | `/vendor/services...` | Vendor (**approved only** for writes) | |
| GET | `/vendor/bookings`, `/vendor/bookings/:id` | Vendor (owner) | |
| PUT | `/vendor/bookings/:id/status` | Vendor (**approved only**, owner) | `{ status, reason }` — see state machine below |

## Admin — vendor approval
| Method | Route | Notes |
|---|---|---|
| GET | `/admin/dashboard` | Platform totals |
| GET | `/admin/vendors` | `?status=&q=&page=&limit=` |
| GET | `/admin/vendors/:id` | Full KYC + documents + stats |
| PUT | `/admin/vendors/:id/approve` \| `/reject` \| `/suspend` \| `/restore` | Reject/suspend require `{ reason }`. Each notifies the vendor. |

## Admin — daily operations & vendor performance
| Method | Route | Notes |
|---|---|---|
| GET | `/admin/finance/daily-summary?date=YYYY-MM-DD` | Booking counts by status (by `scheduledDate`) + gross/commission/payable totals for `Completed` bookings that day + per-vendor breakdown |
| GET | `/admin/finance/ledger` | Full booking ledger. Filters: `dateFrom`, `dateTo`, `vendor`, `status`, `q` (booking code), `page`, `limit` |
| GET | `/admin/finance/vendor-performance?sortBy=bookings\|revenue\|pendingCollection` | Per-vendor totals: today/week/month bookings, completed/cancelled, gross/commission/payable, collected, pending collection |

## Admin — collections / settlement ledger
| Method | Route | Notes |
|---|---|---|
| GET | `/admin/collections` | Vendor-wise ledger: gross, commission, vendor payable, collected (sum of all `CollectionEntry` rows), pending. Only vendors with ≥1 completed booking are shown. |
| GET | `/admin/collections/:vendorId` | One vendor's full collection history (every entry, who recorded it, when) |
| POST | `/admin/collections/:vendorId` | `{ amount, notes }` — records a new collection entry. **Append-only**: never overwrites a running total, always adds a new audited row. |

## Admin — settings, categories, services, customers
| Method | Route | Notes |
|---|---|---|
| GET / PUT | `/admin/settings` | `{ commissionPercent, minLeadTimeHours }`. Changing `commissionPercent` has **no retroactive effect** — already-`Completed` bookings keep their original snapshot. |
| GET/POST/PUT/DELETE | `/admin/categories...` | Category CRUD. Routed; **no admin frontend page yet**. |
| GET/PUT | `/admin/services...` | Platform-wide service moderation (approve/reject/feature/toggle-active). Routed; **no admin frontend page yet**. |
| GET/PUT | `/admin/users...` | Customer list/detail (incl. total spend, vehicles)/activate-deactivate. Routed; **no admin frontend page yet**. |

## Notifications
| Method | Route | Notes |
|---|---|---|
| GET | `/notifications` | Own + role-broadcast notifications. Includes `unreadCount`. |
| GET | `/notifications/unread-count` | Polled every 30s by the frontend bell |
| PUT | `/notifications/:id/read`, `/notifications/read-all` | |

Triggers: vendor registration/resubmission → admins; admin approve/reject/
suspend/restore → that vendor; booking created/cancelled → the vendor;
booking confirmed/rejected/started/completed → the customer.

## Uploads
`POST /uploads/images` (vendor or admin, multipart `images[]`, max 5) →
Cloudinary URLs, used by the service form. Configure via
`CLOUDINARY_CLOUD_NAME`/`CLOUDINARY_API_KEY`/`CLOUDINARY_API_SECRET`.

---

## Booking status state machine

```
Pending ──► Confirmed ──► In Progress ──► Completed
   │
   └──► Rejected
(Pending or Confirmed) ──► Cancelled   [customer-initiated only]
```

Enforced server-side (`vendorBookingController.ALLOWED_TRANSITIONS`) — any
other transition is HTTP 400. `Completed`, `Rejected`, `Cancelled` are
terminal. A booking is **never** auto-confirmed by the customer submitting
it — it starts `Pending` and only the vendor's explicit `Confirmed`
transition changes that.

Marking a booking `Completed` snapshots the commission breakdown (see
Financial model below) and sets `collectionStatus` to `Pending`.

## Availability & minimum lead time

`GET /catalog/services/:id/availability` and `POST /bookings` both call the
same `computeAvailableSlots` function (`server/src/utils/slotGenerator.js`),
so the frontend can never show a slot the backend would then reject. A slot
is excluded if: it's outside the shop's `workingHours`; the date isn't a
`workingDay` or is in `unavailableDates`; another active booking already
holds it; or **it starts less than 2 hours from now** — e.g. at 10:15 AM,
the 10–11 AM and 11 AM–12 PM slots are hidden; the next slot is whichever
fixed window starts at or after 12:15 PM.

## Financial model

```
commissionAmount    = round(bookingAmount × commissionRate / 100)
vendorPayableAmount = bookingAmount − commissionAmount
```

`commissionRate` is read from `PlatformSettings` **at the moment a booking is
marked `Completed`** and stored on the booking — it is a snapshot, not a
live calculation, so later commission changes never alter historical
records. Example at the default 10%: ₹500 → ₹50 commission, ₹450 payable.

Collection is tracked at the **vendor level**, not per-booking:
`pendingCollection = SUM(vendorPayableAmount over Completed bookings) −
SUM(CollectionEntry.amount for that vendor)`. This models a real settlement
process (lump-sum payouts covering many bookings) rather than pretending
each individual booking is separately "paid."

**No payment gateway exists.** Every booking is "pay at the shop." The
collections ledger tracks the *financial obligation* between platform and
vendor, not an online transaction — nothing in this API ever claims an
online payment succeeded.

## Vendor approval state machine

```
pending ──► approved ──► suspended ──► approved (restore)
   │                                        ▲
   └──► rejected ──► pending (automatic resubmission on any profile/doc edit)
```

## Location & nearby-shop discovery

No mapping library is in the approved stack. What exists: `Vendor.location.
{latitude,longitude}` (optional), `GET /catalog/services?lat=&lng=&sort=distance`
(haversine distance, returns `distanceKm`), the frontend's "Use my current
location" button (plain browser geolocation, no API key), and the admin
vendor screen's plain link to `https://www.google.com/maps?q={lat},{lng}`.
Distance is for **shop discovery only** — it never implies a vendor travels
to the customer.
