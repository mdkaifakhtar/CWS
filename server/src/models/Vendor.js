const mongoose = require('mongoose');

const DOCUMENT_TYPES = [
  'business_license',
  'owner_id_proof',
  'address_proof',
  'shop_proof',
  'other',
];

const documentSchema = new mongoose.Schema(
  {
    type: { type: String, enum: DOCUMENT_TYPES, default: 'other' },
    name: { type: String, required: true },
    url: { type: String, required: true },
    verificationStatus: {
      type: String,
      enum: ['pending', 'verified', 'rejected'],
      default: 'pending',
    },
  },
  { timestamps: { createdAt: 'uploadedAt', updatedAt: false } }
);

const IMAGE_CATEGORIES = [
  'Cover Image',
  'Shop Front',
  'Waiting Area',
  'Washing Area',
  'Interior',
  'Equipment',
  'Services',
  'Other',
];

const shopPhotoSchema = new mongoose.Schema(
  {
    imageUrl: { type: String, required: true },
    category: {
      type: String,
      enum: IMAGE_CATEGORIES,
      default: 'Cover Image',
    },
    customCategoryName: { type: String, default: '' },
  },
  { timestamps: { createdAt: 'uploadedAt', updatedAt: false } }
);

const vendorSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    // --- Business details ---
    businessName: { type: String, required: true, trim: true },
    businessRegistrationNumber: { type: String, default: '', trim: true },
    phone: { type: String, required: true }, // business contact number
    email: { type: String, required: true, lowercase: true }, // business contact email
    businessAddress: { type: String, required: true },
    city: { type: String, required: true, index: true },
    state: { type: String, default: '' },
    pincode: { type: String, default: '' },
    location: {
      latitude: { type: Number },
      longitude: { type: Number },
    },
    serviceAreas: [{ type: String }], // cities / localities covered

    // --- Owner details ---
    ownerName: { type: String, required: true },
    ownerPhone: { type: String, default: '' },
    ownerEmail: { type: String, default: '', lowercase: true },
    ownerAddress: { type: String, default: '' },

    documents: [documentSchema],
    coverImageUrl: { type: String, default: '' },
    galleryImages: [{ type: String }],
    shopPhotos: [shopPhotoSchema],
    description: { type: String, default: '' },
    approvalStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'suspended'],
      default: 'pending',
      index: true,
    },
    rejectionReason: { type: String, default: '' },
    suspensionReason: { type: String, default: '' },
    approvedAt: { type: Date },
    suspendedAt: { type: Date },
    // Incremented each time a rejected vendor resubmits — lets admin and the
    // vendor both see this isn't the vendor's first attempt.
    resubmissionCount: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    ratingAverage: { type: Number, default: 0 },
    ratingCount: { type: Number, default: 0 },
    workingDays: [{ type: String }], // e.g. ['Mon','Tue',...]
    workingHours: {
      start: { type: String, default: '09:00' },
      end: { type: String, default: '19:00' },
    },
    unavailableDates: [{ type: Date }],
  },
  { timestamps: true }
);

vendorSchema.index({ businessName: 'text', description: 'text' });

vendorSchema.statics.DOCUMENT_TYPES = DOCUMENT_TYPES;
vendorSchema.statics.IMAGE_CATEGORIES = IMAGE_CATEGORIES;

module.exports = mongoose.model('Vendor', vendorSchema);
