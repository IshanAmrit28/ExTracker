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
  }
}, { 
  timestamps: true,
  toJSON: { getters: true },
  toObject: { getters: true }
});

module.exports = mongoose.model('Transaction', transactionSchema);
