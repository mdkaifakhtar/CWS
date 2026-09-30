# TEST_REPORT.md

## Environment limitation (unchanged — read first)

Still no outbound network access in this sandbox (`npm install` → 403) and
no running MongoDB/browser. Nothing below is marked PASS unless it was
actually executed. Every change was made by reading the real component
code and tracing the actual rendering/layout mechanics (not by guessing or
adding blanket media queries), and syntax-checked with `node --check` where
applicable (backend only — JSX can't be checked that way without a build).
**You must verify the mobile fixes visually yourself** — I cannot render a
browser here to compare against your screenshots.

| # | Item | Result |
|---|------|--------|
| 1 | Mobile nav / header | NOT TESTED visually. Root cause found and fixed — see below. |
| 2 | Hero section | NOT TESTED visually. Fixed — see below. |
| 3 | Top-rated vendors cards | NOT TESTED visually. Root cause found and fixed — see below (this was a real, specific bug, not a cosmetic tweak). |
| 4 | All cards audited | Done by inspection: grepped every `overflow-x-auto` horizontal-scroll row and every multi-column grid in the codebase (listed below). Only the vendor cards had the bug; everything else was already correctly built mobile-first. |
| 5–9 | Breakpoint sweep, overflow check, touch targets, desktop re-check | NOT TESTED — no browser/devtools available here. |
| 10–14 | Account security feature (user + admin password change, admin email change) | Implemented full-stack (backend + frontend), **not run** (no DB/server here). Syntax-checked backend files. See details below. |

## Root cause #1 — Navbar "giant circle" + huge empty space + menu pushing hero down

All three symptoms in your screenshot had **one shared cause**: the header
pill (`rounded-full`) and the mobile menu being rendered **inline**
(pushing page content down) instead of as a floating panel.

`rounded-full` (`border-radius: 9999px`) looks like a normal pill on the
**collapsed** 72px-tall bar. But the open mobile menu was rendered *inside*
that same element, stacking Home/Services/Become a vendor + your account
row underneath the logo row — which makes the header hundreds of pixels
tall. Applying `border-radius: 9999px` to something that tall makes the
browser clamp each corner's radius to roughly half the header's **width**
(not height), which is far bigger than a normal rounded corner — visually,
that's the huge circular arc eating the top of your screenshot. The "empty
space" underneath it wasn't empty at all — it was the header's own
now-enormous rounded-corner curve, whose fill blends into the same near-black
page background, so only its border outline was visible.

**Fix:**
- The header only ever uses `rounded-full` while **collapsed**; while the
  mobile menu is open, it switches to a normal `rounded-[28px]`, which stays
  sane at any height.
- More importantly, the mobile menu is no longer rendered inline inside the
  header (which pushed the hero down). It's now an **absolutely-positioned
  floating panel** that drops down below the compact 72px bar and overlays
  the page — the header itself never grows, and the hero underneath never
  moves. A transparent full-screen button behind the panel closes it on
  outside tap.
- Reorganized the panel's own content to be more compact: Dashboard link
  and the notification bell + logout button now share **one row** instead
  of three stacked full-width rows.

## Root cause #2 — "Top-rated vendors" cards were squeezed to almost nothing

This was a genuine, specific CSS bug, not a general "make it responsive"
issue. `VendorCard` was:

```jsx
className="group flex flex-col w-full sm:w-64 ..."
```

sitting inside a horizontally-scrolling **flex row**
(`flex gap-5 overflow-x-auto`). Setting `width: 100%` on a flex child (via
`w-full`) makes its *flex-basis* equal to the parent's full width too. With
six cards each demanding "100% of the row," and the default `flex-shrink: 1`
still in effect, flexbox does exactly what it's designed to do when there
isn't room: it **shrinks every item proportionally** until they all fit
inside the visible row — instead of letting the row overflow and scroll,
which is what `overflow-x-auto` was there for. That's exactly the "extremely
narrow, text cut off" cards in your screenshot.

**Fix:** `VendorCard` now uses `flex-shrink-0` (so flexbox is no longer
allowed to shrink it) with a sensible, **intentional** mobile width —
`w-[72vw] max-w-[280px]` (roughly 230–280px depending on screen size,
comfortably wide enough for the image, shop name, rating, and distance) —
instead of `w-full`. The row also gained scroll-snap (`snap-x
snap-mandatory`) so it now behaves like a proper swipeable carousel (Option
A from your instructions) instead of accidentally trying to fit every card
on screen at once.

I checked every other `overflow-x-auto` horizontal-scroll row in the app
(category pills, the booking-status tracker, the booking stepper, admin/
vendor filter-chip rows, the dashboard sidebar nav) — all of them already
correctly use `flex-shrink-0` on fixed-content buttons, so none of them had
this bug. I also grepped every multi-column `grid-cols-*` usage in the
codebase — every one already had a mobile-first base with proper `sm:`/
`lg:` overrides (e.g. `grid-cols-2 lg:grid-cols-4`); none were forcing a
desktop column count onto mobile. So the vendor-card row was the one real
structural bug, not a symptom of a wider systemic problem.

## Hero section fixes

- Heading now uses `text-[clamp(1.9rem,8vw,2.4rem)]` instead of a fixed
  `2.4rem`, so it scales down smoothly between 320–430px instead of forcing
  the same size everywhere and wrapping onto an awkward third line.
- Reduced top padding and the grid gap on mobile only (`pt-10` → `pt-6`,
  `gap-10` → `gap-6` below `lg:`) — desktop values are untouched.
- The hero photo panel's mobile aspect ratio changed from `aspect-[4/5]`
  (tall portrait — the "oversized decorative shape" dominating the mobile
  screen) to `aspect-[16/10]` (short/wide) on mobile only; `sm:`/`lg:`
  aspect ratios (used on tablet/desktop) are unchanged.
- Combined with the nav fix above, the hero no longer gets pushed
  arbitrarily far down the page when the menu opens.

## Account security feature (Section 13)

Implemented full-stack, reusing the existing bcrypt/JWT architecture with
**no new auth provider and no change to login/register/logout**.

**Backend:**
- `PUT /api/auth/change-password` (any authenticated role — user, vendor,
  or admin, since Admin is just a `User` with `role: 'admin'` in this
  schema, so one endpoint correctly serves both 13A and 13B). Verifies the
  current password with the existing `comparePassword`/bcrypt method,
  requires the new password and confirmation to match and be ≥6 characters,
  rejects a new password identical to the current one, then hashes and
  saves it via the existing pre-save hook. Never reads a user id from the
  request body — it only ever acts on `req.user`, which comes from the JWT
  via the existing `protect` middleware.
- `PUT /api/auth/change-email` (admin only, via the existing `authorize('admin')`
  middleware, per the spec's scope). Verifies the current password,
  validates and lowercases the new email, checks it isn't already used by
  another account, and updates it.
- **Session invalidation on password change:** added a `passwordChangedAt`
  field to the `User` model. The `protect` middleware now rejects any JWT
  whose `iat` (issued-at) predates that timestamp — so changing a password
  immediately invalidates every existing token for that account, without
  needing a server-side session store, reusing the existing stateless-JWT
  design. The frontend logs the user out right after a successful password
  change and shows a message to log back in, matching this.
- Email change does **not** force a re-login, since this app's JWT payload
  only carries the user's id (not their email) — the current session stays
  valid, and the UI tells the admin to use the new email **next time** they
  log in.
- Neither endpoint ever returns a password hash; `toSafeObject()` (already
  used everywhere else) is reused for the response.

**Frontend:**
- New shared `ChangePasswordForm` component (Current/New/Confirm password,
  client-side validation mirrors the backend, disables the submit button
  while the request is in flight) — added to both the user's **Profile**
  page and the **Admin Settings** page.
- New `ChangeEmailForm` component (admin only) — added to Admin Settings.
- Both are built from the app's existing `Card`/`Field`/`TextInput`/`Button`
  components (the same ones already used elsewhere), so they match the
  existing design system rather than introducing new styling. Both stack
  full-width on mobile and sit side-by-side (admin page) from `sm:` up.

**Not done:** vendor accounts were not given this section — the request
explicitly scoped this to "User and Admin accounts" only. Since vendors are
also `User` documents, the same `ChangePasswordForm` component would work
unmodified on `VendorProfile.jsx` if you'd like it added there too.

## Build / production check

**NOT RUN** — `npm install` is still blocked in this sandbox (403, no
network egress). Please run `npm install` and go through the requested
breakpoints, and the account-security test list from the brief, yourself.
