const mongoose = require('mongoose');

const companyProfileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true, 
  },
  companyName: { type: String, default: '' },
  industry: {
    type: String,
    enum: ['technology', 'finance', 'healthcare', 'consulting', 'logistics', 'education', 'marketing', 'manufacturing', 'other'],
    default: 'other',
  },
  size: {
    type: String,
    enum: ['startup', 'small', 'medium', 'large'],
    default: 'startup',
  },
  about: { type: String, default: '' },
  website: { type: String, default: '' },
  address: { type: String, default: '' },
  foundedYear: { type: Number },
  benefits: [{ type: String }],
  contactName: { type: String, default: '' },
  phone: { type: String, default: '' },
  taxId: { type: String, default: '' },
  province: { type: String, default: '' },
  country: { type: String, default: 'Việt Nam' },
}, { timestamps: true });

module.exports = mongoose.model('CompanyProfile', companyProfileSchema);
