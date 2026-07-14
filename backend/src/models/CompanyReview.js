const mongoose = require('mongoose');

// One review per candidate per company; eligibility enforced in controller
const companyReviewSchema = new mongoose.Schema(
  {
    companyUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    candidateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    applicationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Application',
      default: null,
    },

    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, default: '', trim: true },
    isAnonymous: { type: Boolean, default: false },

    employerReply: { type: String, default: '' },
    employerRepliedAt: { type: Date, default: null },

    isHidden: { type: Boolean, default: false },
  },
  { timestamps: true }
);

companyReviewSchema.index({ companyUserId: 1, candidateId: 1 }, { unique: true });

module.exports = mongoose.model('CompanyReview', companyReviewSchema);
