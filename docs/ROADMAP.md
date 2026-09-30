# Roadmap

## Completed
- **Phase 1**: Auth, core data models, full customer booking flow (search, book, track, review)
- **Phase 2**: Vendor Panel (KYC-lite registration, services, bookings) + Admin Panel (vendor approval workflow)
- **UI/UX redesign**: Reference-image-driven visual identity — dark near-black theme, lime-yellow accent, pill navigation, shared design system
- **Dark theme + KYC + notifications + availability pass**:
  - Full dark theme applied app-wide (not just the hero)
  - Real hero photo integrated
  - Full vendor KYC fields (owner details, business registration number, geo-coordinates, typed/verification-tracked documents)
  - Vendor resubmission flow (rejected → edit → back to pending, admin re-notified)
  - Reusable backend notification system (model + API), wired into: vendor registration, resubmission, admin approve/reject/suspend/restore, booking creation, every booking status change, booking cancellation
  - Notification bell UI with unread badge and dropdown, in the global navbar
  - Real, backend-computed slot availability (working days/hours, existing bookings, **minimum 2-hour lead time**) replacing the previous hardcoded slot list — booking wizard now calls it live
  - Distance-based "nearby vendors" sorting using browser geolocation + haversine distance (no map library, see note below)
- **Business-model correction (this pass)** — removed a doorstep/delivery
  model that had drifted in, replaced with the correct shop-visit model:
  - Removed `Booking.address` entirely — service location is always the vendor's shop
  - New `Vehicle` model ("My Vehicles") replacing inline per-booking vehicle typing
  - Booking status simplified: Pending → Confirmed → In Progress → Completed (+ Rejected/Cancelled), replacing the old 5-state doorstep-shaped machine
  - Removed all "doorstep"/"delivery"/"vendor arrives"/"Cash on Delivery" copy, replaced with shop-visit language throughout
  - New financial model: configurable platform commission %, per-booking commission snapshot at completion, vendor settlement/collection ledger with an audited append-only history
  - New admin pages: Daily Operations summary, Vendor Performance, Collections, Settings
  - Admin category/service/customer-management controllers (previously staged, unrouted) are now mounted to routes — still no frontend page for them
  - Vendor open/closed-now indicator on service cards

## Explicitly deferred / staged, not built
- **Interactive map UI** — the approved tech stack has no mapping library. What's built: lat/lng storage on Vendor, browser geolocation, haversine distance sorting, and a plain "open in Google Maps" link. A real embedded map would need a stack exception + API key.
- **Admin frontend for categories/services/customers** — `adminCategoryController.js`, `adminServiceController.js`, `adminUserController.js` are now mounted to routes (were unrouted before this pass), so the API works, but there is still no admin UI page for any of them.
- **`minLeadTimeHours` in `PlatformSettings` is not actually read** — the 2-hour lead time is a hardcoded constant in `slotGenerator.js`. The settings field exists and is editable via `PUT /admin/settings`, but changing it currently has no effect. Wiring the slot generator to read this value is a small, contained follow-up.
- **CSV export** for the booking ledger / vendor performance / collections — not built.
- **Real-time notification delivery (websockets/push)** — poll-based (30s), not a live socket connection.
- **Booking reschedule flow** — cancel + rebook works; an in-place reschedule does not exist.
- **Vendor-initiated cancellation after confirmation** — a vendor can reject a `Pending` booking but cannot cancel one they've already confirmed; only the customer can cancel (and only while `Pending`/`Confirmed`).
- **Payment gateway** — pay-at-shop only, by design; no online payment integration.
- **Banner/content management** — not built.

## Suggested next steps (not yet requested)
1. Build the admin frontend for categories/services/customers (API already exists)
2. Wire `slotGenerator.js` to read `PlatformSettings.minLeadTimeHours` instead of a hardcoded constant
3. CSV export for the ledger/performance/collections views
4. Move notification delivery from polling to a websocket or SSE channel
5. Add an actual map integration once a library exception + API key are available
6. Booking reschedule flow
