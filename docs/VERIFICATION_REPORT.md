# Verification Report

This document covers verification across Phase 2, a UI/UX redesign pass, a
dark-theme/KYC/notifications pass, a business-model correction pass, and the
most recent **authentication desync fix** (repeated 401s on vendor/
notification endpoints). **Read "Latest pass" first** — it's the most current.

---

## Latest pass — fixed cascading 401s on vendor & notification endpoints

### Root cause (confirmed by reading the actual code, not assumed)

The app uses JWT Bearer tokens stored in `localStorage`, read fresh on every
request by an Axios request interceptor (`client/src/api/axiosClient.js`) —
this part was already correct and doesn't depend on Redux being hydrated.

The bug was in the **response** interceptor: on any 401, it removed the
token from `localStorage` but never told Redux. `ProtectedRoute`,
`VendorDashboardLayout`, and `NotificationBell` all read auth state from
**Redux**, not `localStorage` — so after the first 401, Redux still believed
the session was valid. The vendor pages and the notification bell's 30s poll
stayed mounted and kept firing authenticated requests, now with *no token at
all* in `localStorage`, producing exactly the repeated-401 burst reported
across `/api/vendor/me`, `/api/vendor/dashboard`, `/api/vendor/services`,
`/api/vendor/bookings`, `/api/vendor/documents`, and
`/api/notifications/unread-count`.

The backend was not the problem — `server/src/middleware/auth.js` correctly
returns 401 only for a missing/invalid/expired token and 403 for a
wrong-role/unapproved-vendor request (verified directly, see tests below).

### What was verified, and how

1. **Isolated the exact interceptor logic** and tested it in a standalone
   script (no browser needed): confirmed a 401 with a token present clears
   `localStorage` *and* dispatches `logout()`; confirmed a second 401 with
   no token left doesn't dispatch a redundant logout; confirmed non-401
   errors touch neither localStorage nor Redux. 5/5 pass.
2. **Hit the live backend with every realistic 401 trigger** the report
   listed: no `Authorization` header, a malformed token, a correctly-signed
   but expired token, a token signed with the wrong secret (simulating a
   `JWT_SECRET` change across server restarts), and a token missing the
   `"Bearer "` prefix — all correctly return 401. 5/5 pass.
3. **Verified the authenticated path still works**: a validly-signed,
   non-expired token with a matching secret correctly populates `req.user`
   and passes through `protect` middleware. 1/1 pass.
4. **Audited every `addEventListener`/`setInterval` in the frontend** for
   matching cleanup — all three instances (`Modal`'s Escape-key listener,
   `NotificationBell`'s outside-click listener and poll interval) already
   had correct cleanup. This confirms the `MaxListenersExceededWarning` /
   `ObjectMultiplex` / `"app-init-liveness"` / `"background-liveness"`
   console messages are **not** from this application — those exact string
   names are internal to browser extensions like MetaMask, not anything in
   this codebase. Left untouched, as instructed.
5. **`npm run build`** succeeds with zero errors after every change.
6. Confirmed CORS (`origin: CLIENT_URL, credentials: true`) does not strip
   the `Authorization` header — no CORS-side contribution to the bug.

### What was NOT verified in this pass

No browser here, so the exact reported symptom (repeated 401s appearing
live in DevTools Network tab) could not be watched happening or watched
stop happening. The fix is verified by isolating and testing its actual
logic against the real code, and by testing the backend's response to every
scenario that could realistically produce a 401 — not by re-running the
user's exact browser session, which isn't possible from this sandbox.

### Suggested manual test sequence

1. Log in as the vendor, open DevTools Network tab, refresh the vendor dashboard — confirm all vendor endpoints return 200, not 401.
2. In another tab (or via DevTools), manually delete the `cw_token` value from `localStorage`, then trigger any vendor API call (e.g. click into Services) — confirm the app redirects to `/login` instead of showing a console full of repeated 401s.
3. Confirm the notification bell's polling stops the moment you're redirected (Network tab should show no more `/notifications/unread-count` calls after logout).
4. Log back in, confirm the bell resumes polling and the badge updates normally.
5. Check the browser tab title bar / bookmarks bar — confirm the new favicon (a small dark rounded square with a lime droplet) appears instead of a broken icon, and `GET /favicon.svg` returns 200 in the Network tab.
6. Confirm the React Router future-flag warnings no longer appear in the console.

---

## Latest pass — business-model correction (shop-visit model + financial system)

### What changed and why

An earlier iteration had introduced a `Booking.address` field and inline
`vehicleDetails`, which reads as a doorstep/delivery model. That's wrong for
this business: customers visit the vendor's physical shop. This pass removed
it and added the financial layer needed for a real admin operations console.

### What was verified, and how

**1. Backend syntax & boot** — every file, including a full rewrite of
`Booking`/model status enum, `bookingController`, `vendorBookingController`,
and 8 new files (`Vehicle` model, `PlatformSettings` model, `CollectionEntry`
model, `vehicleController`/routes, `adminFinanceController`,
`adminCollectionsController`, `adminSettingsController`, `commission.js`),
passes `node --check`. Live server boot confirmed: health check 200, every
new route group's auth boundary (401 without a token) across
`/vehicles`, `/admin/collections`, `/admin/finance/*`, `/admin/settings`.

**2. Business logic unit-tested against the real controller code** (mocked models):

| Test group | Result |
|---|---|
| New 4-state booking machine (Pending→Confirmed→In Progress→Completed, Rejected only from Pending, Cancelled/Rejected/Completed terminal) | 7/7 pass |
| Commission snapshot on completion — **exact match to the spec's own ₹500-at-10%-commission example** (₹50 commission, ₹450 payable), plus proof that a different rate produces a different snapshot (not hardcoded) | 2/2 pass, plus 9/9 in the full state-machine+commission suite |
| Commission formula unit (`computeCommissionBreakdown(500, 10)` → `{commissionAmount: 50, vendorPayableAmount: 450}`) | 1/1 pass |
| Vehicle-based booking creation — creates successfully with no `address` field anywhere in the payload, correctly prices via the vehicle's `vehicleType`, and rejects if the vehicle doesn't belong to the requester (404) | 6/6 pass |
| Daily-summary aggregation math (status counts sum correctly, financial totals match the mocked aggregation, vendor breakdown included) | 4/4 pass |
| Collections ledger math — `pendingCollection = vendorPayable − collected` computed correctly (5400−4000=1400), status correctly derived as "Partially Collected"; negative collection amounts rejected with 400 | 3/3 pass |
| Authorization (`authorize`, `requireApprovedVendor`) re-verified after every change in this pass | 4/4 pass, then re-confirmed once more at the very end |

**3. Frontend build** — `npm run build` succeeds with zero errors after: the
full booking wizard rewrite (vehicle-first, no address step), removing the
Addresses page and adding a Vehicles page, renaming every status
badge/filter/label across 6+ files, and adding 4 new admin pages (Daily
Summary, Vendor Performance, Collections, Settings). Caught and fixed two
real bugs during this build pass: an unsupported `icon` prop on the shared
`TextInput` component that would have leaked onto the DOM `<input>` element
(React warning), and a `Table` component misuse where a row-key function was
passed instead of a field name (would have produced duplicate/undefined
React keys) — both fixed before the final build.

**4. Grep-verified removal of doorstep language and stale field references**
— zero remaining occurrences of `doorstep`, `vehicleDetails`,
`draft.address`/`booking.address`, or old status names (`Booking Requested`,
`Vendor Accepted`, `Service Scheduled`, `Service Started`, `Service
Completed`, `Vendor Rejected`) anywhere in `server/src/controllers`,
`server/src/models`, `server/src/seed`, or `client/src` — confirmed via
targeted `grep -rn` passes after each file was edited, not just spot-checked.

### What was NOT verified in this pass

Same standing limitation: no browser, no screenshot tool, no live preview
URL. Additionally, not built/verified in this pass:
- Admin frontend pages for category/service/customer management (API-only, see Roadmap)
- The `minLeadTimeHours` settings field doesn't actually affect the slot generator yet (documented in Roadmap as a known gap, not hidden)
- CSV export for any ledger/report view

### Suggested manual test sequence for this pass

1. As a customer, go to "My vehicles" and add a vehicle — confirm it appears and can be set as default
2. Book a service — confirm the wizard asks for a **vehicle** first (not an address), then schedule, then a summary showing the **shop's address**, not yours
3. Confirm the booking lands as **Pending**, not Confirmed, and the confirmation page says "waiting for the shop to confirm"
4. As the vendor, confirm the booking — as the customer, confirm the status flips to **Confirmed** with a "bring your vehicle in" message
5. As the vendor, move it through **In Progress → Completed** — confirm the vendor's booking detail now shows a commission/payable breakdown
6. As admin, open **Daily operations**, pick today's date, confirm the completed booking shows up in the totals and vendor breakdown
7. As admin, open **Collections**, find that vendor, record a partial collection, confirm the pending amount decreases and the entry appears in history
8. As admin, open **Settings**, change the commission %, then complete a *new* booking and confirm it uses the new rate while the earlier completed booking's numbers are unchanged

---

## Earlier passes

## Dark theme, KYC, notifications, availability, distance sort pass

### What was verified, and how

**1. Backend syntax & boot** — every file (including 6 new files this pass:
`Notification` model, `notificationController`/`routes`, `notify.js`,
`validators.js`, `geo.js`, plus rewrites of `slotGenerator.js`,
`bookingController.js`, `vendorBookingController.js`, `vendorController.js`,
`vendorAuthController.js`, `adminController.js`, `catalogController.js`,
`Vendor` model) passes `node --check`. The live server was booted and hit
directly: health check 200, every new/changed route's auth boundary (401 for
missing token, 400 for bad registration input), unknown routes 404 — 10/10
checks passed.

**2. Business logic unit-tested against the real controller code** (mocked
models via `proxyquire`, not just described):

| Test group | Result |
|---|---|
| Booking state machine (valid/invalid transitions, terminal states, auto-paid) | 7/7 pass |
| **2-hour minimum lead time** — the exact spec scenario (now=10:15 AM → 10-11AM and 11AM-12PM slots excluded, 2-3PM available), plus boundary and future-date cases | 6/6 pass |
| Double-booking prevention (409 on an already-taken slot) | 1/1 pass |
| Admin approve/reject/suspend/restore (incl. reason-required validation) | 6/6 pass |
| Vendor registration KYC validation (bad email/phone rejected with 400) | included above |
| Vendor resubmission (rejected → profile edit → pending, admin re-notified) | 2/2 pass |
| Notification triggers: admin actions → vendor notified | 4/4 pass |
| Notification triggers: registration → admin notified | 1/1 pass |
| Notification triggers: booking created → vendor notified, accept/reject → customer notified with reason | 4/4 pass |
| Authorization (`authorize`, `requireApprovedVendor`) re-verified after all changes | 5/5 pass |
| Haversine distance + vendor open/closed-now logic | 5/5 pass |

**One test-harness bug worth noting for transparency**: an early version of
the notification test used `proxyquire` without `.noCallThru()`, which caused
proxyquire to silently delegate constructor calls to the *real* Mongoose
`User` model instead of the mock, throwing a confusing error inside a mongoose
internal (`compile.js`). This was a test-harness configuration issue, not an
application bug — confirmed by testing the mock constructor in isolation
(worked fine) before finding the fix (`.noCallThru()`). Documented here rather
than silently fixed, per the standing principle of surfacing this kind of
thing rather than hiding it.

**3. Frontend build & static checks** — `npm run build` succeeds with zero
errors, re-run after every major change in this pass (dark theme batch
migration, hero photo integration, BookService rewrite, VendorRegister
rewrite, AdminVendorDetail rewrite, notification bell). A static-analysis
script scanned every `.jsx` file for lucide-react icons used without a
matching import — zero real issues (all flagged items were confirmed false
positives: default-imported page components the script doesn't track, or
locally-defined components).

**4. A real bug found and fixed during this pass**: the dark-theme migration
initially missed that raw HTML `<input>`/`<select>`/`<textarea>` elements
keep their own default (white) background regardless of the page's dark
theme — Tailwind's `@tailwind base` preflight resets buttons to transparent
but does not do the same for form controls. This was caught by grepping for
every raw form element across the app and manually checking which ones set
an explicit background; 9 instances across `ServiceListing.jsx`,
`BookService.jsx`, `Contact.jsx`, `Profile.jsx`, `Addresses.jsx`, and
`BookingDetail.jsx` were fixed with explicit `bg-ink` styling or by switching
to the shared dark-themed `TextInput`/`Select` components.

### What was NOT verified in this pass

Same standing limitation: no browser, no screenshot tool, no live preview
URL in this sandbox. Additionally not verified because they require live
external services unreachable from here:
- Real Cloudinary document/service-image uploads
- Real MongoDB Atlas behavior (all DB-touching logic was unit-tested with
  mocked models instead)
- The Google Maps links on the admin vendor screen actually resolving (they're
  plain `<a href>` tags to a public URL format — nothing to configure, but
  untestable without a browser)
- Geolocation ("Use my current location") actually prompting a real browser
  permission dialog and returning real coordinates

### Suggested manual test sequence for this pass specifically

1. Open the app and confirm no page shows an unexpected white background or white-box form field
2. Register a new vendor — check every KYC field saves, and that the admin gets a notification (log in as `admin@splashpoint.com` and check the bell icon)
3. As `rejected.vendor@example.com`, edit the business profile — confirm status flips back to `pending` and a new admin notification appears
4. As admin, approve/reject/suspend/restore a vendor and confirm the vendor's notification bell shows the corresponding message with the reason (for reject/suspend)
5. As a customer, open the booking wizard for a service, pick "today" as the date, and confirm slots within the next 2 hours are greyed out / hidden, with a message explaining why
6. Try booking the same vendor+slot twice from two different sessions (or by editing localStorage to switch users) and confirm the second attempt gets a clear "no longer available" error
7. On Service Listing, click "Use my current location" and confirm results reorder with a distance shown, and confirm the "Nearest to me" sort option appears

---

## Earlier passes (Phase 2 + first UI/UX redesign)


could not be verified given the sandboxed build environment — no browser, no
screenshot capability, no live preview URL, and no network access to MongoDB
Atlas or Cloudinary's API. That environment limitation has been true since
Phase 1 and hasn't changed; this report is the honest substitute for a visual
walkthrough.

## What was verified, and how

### 1. Backend syntax & boot
- Every backend `.js` file passes `node --check` (all Phase 1 + Phase 2 files).
- The Express app was booted live (without a database) and confirmed:
  - `GET /api/health` → 200
  - Unknown routes → 404
  - Every new vendor/admin/upload route → 401 without a token

### 2. Authorization logic (unit-tested directly, not just through routing)
Using the actual `authorize()` and `requireApprovedVendor()` middleware functions
with mocked `req`/`res` objects:
- A vendor calling an admin-only route is blocked
- A customer calling a vendor-only route is blocked
- An admin is correctly let through an admin-only route
- A `pending` vendor is blocked from write actions (create service, respond to booking)
- A `suspended` vendor is blocked from write actions
- An `approved` + active vendor is correctly let through

### 3. Booking status state machine (unit-tested with mocked models)
Using `proxyquire` to inject fake `Booking`/`BookingStatusLog` models into the
real `vendorBookingController.updateBookingStatus` function:
- Valid transitions succeed (Requested→Accepted→Scheduled→Started→Completed)
- Invalid transitions are rejected (e.g. skipping straight to Completed)
- Terminal states (`Service Completed`) cannot be moved further
- Completing a booking automatically sets `paymentStatus` to `Paid`
- Rejecting a booking correctly sets `cancelledBy: 'vendor'` and stores the reason

### 4. Admin vendor workflow (unit-tested with mocked models)
Using the same mocking approach against the real `adminController` functions:
- `approveVendor` sets `approvalStatus: 'approved'`, `isActive: true`
- `rejectVendor` requires a reason (400 if missing) and correctly sets `rejected` + reason + `isActive: false`
- `suspendVendor` requires a reason and sets `suspended` + `isActive: false`
- `restoreVendor` is blocked unless the vendor is currently `suspended`
- `restoreVendor` correctly resets to `approved` + `isActive: true`

All of the above ran as actual Node processes against the actual controller
code in this repository — not hypothetical descriptions.

### 5. Frontend build & static checks
- `npm run build` completes with zero errors on the full app (Phase 1 + Phase 2
  pages + new design system components)
- The production build was served with `vite preview` and returned HTTP 200
  with the expected `<div id="root">` shell
- A custom static-analysis script scanned every `.jsx` file for lucide-react
  icons used in JSX without a corresponding import — **zero issues found**
- Attempted to execute the built bundle in `jsdom` to catch runtime errors
  beyond what a build catches; this did not yield additional signal because
  jsdom does not execute `<script type="module">` tags — a jsdom tooling gap,
  not something specific to this app. This is disclosed rather than glossed
  over.

## What was NOT verified (and why)

| Item | Why not | What would confirm it |
|---|---|---|
| Actual rendering/visual appearance in a browser | No browser or screenshot tool available in this environment | Run `npm run dev` on both client and server locally and open `http://localhost:5173` |
| End-to-end flow against a real MongoDB Atlas database | Sandbox has no network route to Atlas | Point `MONGO_URI` at your cluster, run `npm run seed`, exercise the flows |
| Cloudinary document/image upload actually succeeding | Sandbox has no network route to Cloudinary's API | Set real `CLOUDINARY_*` env vars and upload a document from the Vendor Documents page |
| Console warnings/errors during real interaction (e.g. React key warnings, act() warnings) | Requires a real browser | Open browser dev tools while testing locally |

## Suggested manual test sequence once running locally

1. Register a customer, browse services, complete a booking (Phase 1 flow — should be unaffected)
2. Register a new vendor via "Become a vendor" → confirm it lands in `pending` status
3. Log in as `admin@splashpoint.com` / `password123` → Admin → Vendors → approve/reject/suspend/restore the seeded demo vendors and confirm the reason fields, banners, and status badges update correctly
4. Log in as `demo.vendor@example.com` (pre-approved) → add a service with images → confirm it's visible in customer-facing search
5. As the customer, book that service → log back in as the vendor → accept it → move it through Scheduled → Started → Completed → confirm payment status flips to Paid and the customer can now leave a review
6. Try rejecting a booking and confirm the reason is stored and visible
7. Log in as `pending.vendor@example.com` and confirm you cannot create a service (should see a 403-derived error toast)

---

## UI/UX redesign pass (post–Phase 2)

A reference image was supplied and the UI was redesigned to match its design
language (near-black surfaces, lime-yellow accent, pill navigation/buttons).
Full detail of what was redesigned is in the README's "UI/UX redesign" section.

### What was verified for this pass

1. **Build**: `npm run build` succeeds with zero errors after all token,
   component, and page changes.
2. **Static import scan**: re-ran the icon/component-usage static analysis
   script across every `.jsx` file (52 files) — zero missing-import issues.
3. **Backend syntax**: every backend file still passes `node --check` after
   the Service model additions (`isFeatured`, `moderationReason`) and the
   new `computeAvailableSlots` utility.
4. **Regression-tested the hardened booking flow** (the one functional change
   made incidentally while reviewing the codebase, not part of the visual
   redesign itself) against realistic seeded-vendor conditions using mocked
   models:
   - A normal weekday, in-hours booking for an approved vendor still succeeds
     exactly as before (no regression)
   - A slot outside a vendor's configured working hours is now correctly
     rejected (previously would have silently succeeded)
   - A booking on a vendor's non-working day is now correctly rejected
   - A slot already taken by another active booking for the same vendor is
     now correctly rejected with a 409 (double-booking prevention — this
     didn't exist before)
5. **Live server smoke test**: health check, login route, vendor/admin auth
   boundaries, the new availability endpoint's validation, and the 404
   fallback all still behave correctly after every change in this pass.

### What was explicitly NOT done in this pass (by instruction)

- No Phase 3 features (admin category/service/customer management) were
  wired up or given a UI — the controller files exist but are inert
- The booking wizard was not switched over to the new real-availability
  endpoint (`GET /api/catalog/services/:id/availability`); it still shows
  the same static 8 time slots as before, now with server-side validation
  behind it

### What still cannot be verified in this environment

Same limitations as before: no browser, no screenshot tool, no live preview
URL. The claims above are backed by build output, static analysis, and unit
tests against real controller code — not a visual walkthrough. Please run
`npm run dev` locally (both client and server) and visually compare the Home
page, Navbar, Login/Register, and all three dashboards against the reference
image, and let me know what still needs adjustment.
