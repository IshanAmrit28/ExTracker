const mongoose = require('mongoose');
const { encrypt, decrypt } = require('../utils/encryption');

const transactionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: String,
    required: true,
    default: () => new Date().toISOString(),
    get: decrypt,
    set: (val) => encrypt(val instanceof Date ? val.toISOString() : String(val))
  },
  description: {
    type: String,
    required: true,
    get: decrypt,
    set: encrypt
  },
  category: {
    type: String,
    required: true,
    get: decrypt,
    set: encrypt
  },
  type: {
    type: String,
    required: true,
    get: decrypt,
    set: encrypt
  },
  paymentMode: {
    type: String,
    default: 'UPI',
    get: decrypt,
    set: encrypt
  },
  bank: {
    type: String,
    default: 'Cash / Wallet',
    get: decrypt,
    set: encrypt
  },
  amount: {
    type: String,
    required: true,
    get: (val) => Number(decrypt(val)),
    set: encrypt
  },
  notes: {
    type: String,
    get: decrypt,
    set: encrypt
  },
  isSplit: {
    type: Boolean,
    default: false
  },
  splitMethod: {
    type: String,
    enum: ['equal', 'percentage', 'exact'],
    default: 'equal'
  },
  splitWith: {
    type: String,
    get: decrypt,
    set: encrypt
  },
  myShare: {
    type: String,
    get: (val) => (val != null && val !== '' ? Number(decrypt(val)) : null),
    set: (val) => (val != null ? encrypt(val) : val)
  },
  recoverableAmount: {
    type: String,
    get: (val) => (val ? Number(decrypt(val)) : 0),
    set: (val) => (val != null ? encrypt(val) : val)
  },
  splitMembers: [{
    name: String,
    amount: Number,
    reimbursedAmount: { type: Number, default: 0 },
    isFullyReimbursed: { type: Boolean, default: false }
  }],
  reimbursements: [{
    personName: String,
    amount: Number,
    date: String,
    notes: String,
    createdAt: { type: Date, default: Date.now }
  }],
  reimbursedAmount: {
    type: Number,
    default: 0
  },
  reimbursementStatus: {
    type: String,
    enum: ['Pending', 'Partial', 'Completed'],
    default: 'Pending'
  }
}, { 
  timestamps: true,
  toJSON: { getters: true },
  toObject: { getters: true }
});

module.exports = mongoose.model('Transaction', transactionSchema);
