const mongoose = require('mongoose');

// A single collection-recording event against a vendor. Admin ledger is
// built by summing these against the vendor's completed-booking totals —
// never by silently overwriting a running total, so there's always an
// audit trail of who recorded what and when.
const collectionEntrySchema = new mongoose.Schema(
  {
    vendor: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', required: true, index: true },
    amount: { type: Number, required: true, min: 0.01 },
    notes: { type: String, default: '' },
    collectedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: { createdAt: 'collectedAt', updatedAt: false } }
);

module.exports = mongoose.model('CollectionEntry', collectionEntrySchema);
