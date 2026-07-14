const mongoose = require('mongoose');

const jobAlertSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    keyword: { type: String, required: true, trim: true },

    email: { type: String, trim: true, lowercase: true },

    // '' = all provinces (hard filter when set)
    location: { type: String, default: '' },

    // triệu VND; 0 = any
    minSalary: { type: Number, default: 0 },

    // '' = any (soft score)
    experience: { type: String, default: '' },

    // '' = any (soft score)
    jobType: { type: String, default: '' },

    frequency: {
      type: String,
      enum: ['daily', 'weekly'],
      default: 'daily',
    },

    // AI + soft bonus threshold
    minMatchScore: { type: Number, default: 50 },

    isActive: { type: Boolean, default: true },

    lastNotifiedAt: { type: Date, default: null },

    agreedToTerms: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('JobAlert', jobAlertSchema);
