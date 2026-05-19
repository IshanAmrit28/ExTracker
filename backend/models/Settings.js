const mongoose = require('mongoose');
const { encrypt, decrypt } = require('../utils/encryption');

const categorySchema = new mongoose.Schema({
  name: String,
  type: { type: String, enum: ['Need', 'Want', 'Saving'] },
  paymentMode: String
});

const bankSchema = new mongoose.Schema({
  name: { type: String, required: true },
  services: { type: [String], default: ['UPI', 'Debit Card', 'Credit Card', 'Bank Transfer'] }
});

const settingsSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  salary: { 
    type: String, 
    default: () => encrypt(50000),
    get: (val) => Number(decrypt(val)),
    set: encrypt
  },
  weeklyLimit: { 
    type: String, 
    default: () => encrypt(10000),
    get: (val) => Number(decrypt(val)),
    set: encrypt
  },
  needsPercentage: { 
    type: String, 
    default: () => encrypt(50),
    get: (val) => Number(decrypt(val)),
    set: encrypt
  },
  wantsPercentage: { 
    type: String, 
    default: () => encrypt(30),
    get: (val) => Number(decrypt(val)),
    set: encrypt
  },
  savingsPercentage: { 
    type: String, 
    default: () => encrypt(20),
    get: (val) => Number(decrypt(val)),
    set: encrypt
  },
  categories: {
    type: [categorySchema],
    default: [
      { name: 'Life Infrastructure', type: 'Need', paymentMode: 'Credit Card' },
      { name: 'Future Me', type: 'Saving', paymentMode: 'Debit Card' },
      { name: 'Performance & Growth', type: 'Need', paymentMode: 'UPI' },
      { name: 'Relationships & Generosity', type: 'Want', paymentMode: 'Cash' },
      { name: 'Lifestyle Enjoyment', type: 'Want', paymentMode: 'Bank Transfer' }
    ]
  },
  paymentModes: {
    type: [String],
    default: ['Credit Card', 'Debit Card', 'UPI', 'Cash', 'Bank Transfer']
  },
  banks: {
    type: [bankSchema],
    default: [
      { name: 'Cash / Wallet', services: ['Cash'] },
      { name: 'HDFC Bank', services: ['UPI', 'Debit Card', 'Credit Card', 'Bank Transfer'] },
      { name: 'SBI Bank', services: ['UPI', 'Debit Card', 'Bank Transfer'] }
    ]
  }
}, { 
  timestamps: true,
  toJSON: { getters: true },
  toObject: { getters: true }
});

module.exports = mongoose.model('Settings', settingsSchema);
