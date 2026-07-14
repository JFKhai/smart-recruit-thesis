const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },

  type: {
    type: String,
    enum: ['new_application', 'application_status_update', 'job_match'],
    required: true,
  },

  title: { type: String, required: true },
  body: { type: String, default: '' },

  matchingScore: { type: Number, default: null },

  jobId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    default: null,
  },
  applicationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Application',
    default: null,
  },
  
  candidateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  cvProfileId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CvProfile',
    default: null,
  },

  isRead: { type: Boolean, default: false },
  isDeleted: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);
