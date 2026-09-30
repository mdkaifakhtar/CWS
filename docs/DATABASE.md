# Database Documentation

MongoDB via Mongoose. All models live in `server/src/models/`.

## User
| Field | Type | Notes |
|---|---|---|
| name, email, phone | String | email/phone unique, login identifiers |
| password | String | bcrypt-hashed, `select: false` |
| role | enum | `user` \| `vendor` \| `admin` |
| addresses | [subdoc] | label, address lines, city, state, pincode, landmark, isDefault |
| isActive | Boolean | login blocked when false (enforced in `authController.loginUser`) |
| vendorProfile | ObjectId → Vendor | set when role is `vendor` |

## Vendor (expanded in this pass for full KYC)
| Field | Type | Notes |
|---|---|---|
| owner | ObjectId → User | required |
| **Business** | | |
| businessName, businessRegistrationNumber | String | registration number optional |
| phone, email | String | business contact (also used as login credentials) |
| businessAddress, city, state, pincode | String | city required, rest optional |
| location.latitude, location.longitude | Number | optional, powers distance sort + map link |
| serviceAreas | [String] | localities covered |
| **Owner** | | |
| ownerName | String | required |
| ownerPhone, ownerEmail, ownerAddress | String | all optional, separate from business contact |
| **Documents** | [subdoc] | `type` (enum: business_license / owner_id_proof / address_proof / shop_proof / other), `name`, `url`, `verificationStatus` (pending/verified/rejected), `uploadedAt` (auto timestamp) |
| **Approval workflow** | | |
| approvalStatus | enum | pending → approved / rejected / suspended |
| rejectionReason, suspensionReason | String | required by the API when rejecting/suspending |
| approvedAt, suspendedAt | Date | |
| resubmissionCount | Number | incremented each time a rejected vendor edits their profile or uploads documents — resets status to `pending` and re-notifies admins |
| isActive | Boolean | false while rejected/suspended |
| **Operations** | | |
| workingDays | [String] | e.g. `['Mon','Tue',...]`; empty = every day (default, backward compatible) |
| workingHours.start/end | String | `HH:MM`, defaults 09:00–19:00 |
| unavailableDates | [Date] | vendor-marked days off |
| ratingAverage, ratingCount | Number | rolled up from Review documents |

## ServiceCategory
name, slug, iconUrl, sortOrder, isActive — admin-manageable (staged, see README).

## VehicleType
name, sortOrder.

## Service
| Field | Type | Notes |
|---|---|---|
| vendor, category | ObjectId | required |
| name, description, images | | |
| basePrice, vehiclePricing[] | Number / [subdoc] | per-vehicle-type price override |
| durationMinutes, includedItems[], discountPercent | | |
| isActive | Boolean | vendor or admin can toggle |
| approvalStatus | enum | auto-`approved` when an already-approved vendor creates it (see README for rationale) |
| moderationReason | String | admin rejection note (staged, not yet wired to UI) |
| isFeatured | Boolean | admin flag (staged, not yet wired to UI) |
| ratingAverage, ratingCount, bookingCount | Number | |

## Vehicle (new — first-class "My Vehicles")
| Field | Type | Notes |
|---|---|---|
| owner | ObjectId → User | required |
| vehicleType | ObjectId → VehicleType | required |
| nickname, make, model, registrationNumber | String | all optional except used for display/identification |
| isDefault | Boolean | first vehicle added is auto-default |

Replaces the earlier inline `vehicleDetails` object on Booking — vehicles are
now saved once and selected (not re-typed) at booking time.

## Booking (business-model corrected in this pass)
bookingCode (unique), user, vendor, service, **vehicle** (ObjectId → Vehicle,
replaces inline `vehicleDetails`), vehicleType (duplicated from the vehicle
at booking time so pricing/records stay stable if the vehicle is later
edited/deleted), scheduledDate, scheduledTimeSlot, specialInstructions,
priceQuoted, status (state machine below), paymentMethod (`Pay at shop`),
cancelledBy, cancellationReason.

**No `address` field.** The service location is always the vendor's
`businessAddress` — there is no delivery/doorstep concept anywhere in this
model.

**Financial fields** (all snapshotted, never recalculated retroactively):
`commissionRate`, `commissionAmount`, `vendorPayableAmount`,
`collectedAmount` (unused — see PlatformSettings/CollectionEntry note
below), `collectionStatus` (`Not Applicable` until completed, then
`Pending`).

### Booking status state machine
```
Pending ──► Confirmed ──► In Progress ──► Completed
   │
   └──► Rejected
(Pending or Confirmed) ──► Cancelled   [customer-initiated]
```
Enforced server-side via an explicit `ALLOWED_TRANSITIONS` map in
`vendorBookingController.js`. `Completed`, `Rejected`, `Cancelled` are
terminal. A booking is never auto-confirmed — it starts `Pending` and stays
there until the vendor explicitly moves it to `Confirmed`. Marking a
booking `Completed` snapshots the commission breakdown using
`PlatformSettings.commissionPercent` at that moment.

## PlatformSettings (new — singleton)
A single document (`key: 'default'`) holding `commissionPercent` (default
10) and `minLeadTimeHours` (default 2, though the lead time is currently
hardcoded as a constant in `slotGenerator.js` rather than reading this
field — see Roadmap). Fetched/created lazily via `PlatformSettings.getSettings()`.

## CollectionEntry (new — audited settlement ledger)
| Field | Type | Notes |
|---|---|---|
| vendor | ObjectId → Vendor | |
| amount | Number | required, > 0 |
| notes | String | optional |
| collectedBy | ObjectId → User (admin) | who recorded it |
| collectedAt | Date | auto timestamp |

Append-only. A vendor's "amount collected" is always `SUM` of these rows,
never a single mutable field — this gives a full audit trail of every
settlement recorded against a vendor, matching a real collections process
(lump-sum payments covering many bookings) rather than trying to mark
individual bookings "paid."

## BookingStatusLog
booking, status, changedBy, note — an audit trail, one row per transition.

## Review
booking (unique — one review per booking), user, vendor, service, rating, comment, isHidden (admin moderation).

## Notification
| Field | Type | Notes |
|---|---|---|
| recipient | ObjectId → User | set for a notification addressed to one specific user |
| recipientRole | enum | set for a notification broadcast to every user of a role (e.g. all admins) — exactly one of `recipient`/`recipientRole` is set per notification |
| type | enum | vendor_application_submitted, vendor_resubmitted, vendor_approved, vendor_rejected, vendor_suspended, vendor_restored, booking_created, booking_accepted, booking_rejected, booking_scheduled, booking_started, booking_completed, booking_cancelled |
| title, message, link | String | `link` is a frontend route the notification deep-links to |
| isRead | Boolean | |

`GET /api/notifications` resolves both `recipient` and `recipientRole` matches for the requesting user in one query (see `notificationController.scopeFilter`).

## Relationships at a glance
```
User ──(1:1, vendor role)── Vendor ──(1:many)── Service
User ──(1:many)── Vehicle
User ──(1:many)── Booking ──(many:1)── Vendor
Booking ──(many:1)── Vehicle
Booking ──(1:1)── Review
Booking ──(1:many)── BookingStatusLog
Vendor ──(1:many)── CollectionEntry
User/Vendor(role) ──(1:many, addressed or broadcast)── Notification
PlatformSettings — singleton, referenced (not linked) at booking-completion time
```
