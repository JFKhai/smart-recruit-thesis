const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
    jobId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Job',
        required: true
    },
    candidateId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    cvProfileId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'CvProfile',
        required: true
    },

    matchingScore: {
        type: Number,
        default: 0
    },

    status: {
        type: String,
        enum: ['pending', 'reviewed', 'interview', 'accepted', 'rejected'],
        default: 'pending'
    },

    appliedAt: {
        type: Date,
        default: Date.now
    }
}, { timestamps: false }); 

module.exports = mongoose.model('Application', applicationSchema);