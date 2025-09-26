const mongoose = require('mongoose');

const requestSchema = new mongoose.Schema({
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  subject: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  category: {
    type: String,
    required: true,
    enum: ['attendance', 'leave', 'general', 'technical', 'hr', 'other'],
    default: 'general'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'resolved', 'rejected'],
    default: 'pending'
  },
  adminResponse: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  resolvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  resolvedAt: {
    type: Date
  },
  attachments: [{
    filename: String,
    originalName: String,
    path: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Index for better query performance
requestSchema.index({ employee: 1, createdAt: -1 });
requestSchema.index({ status: 1, createdAt: -1 });
requestSchema.index({ category: 1, status: 1 });

// Virtual for formatted creation date
requestSchema.virtual('formattedDate').get(function() {
  return this.createdAt.toLocaleDateString();
});

// Method to update status
requestSchema.methods.updateStatus = function(newStatus, adminResponse, resolvedBy) {
  this.status = newStatus;
  if (adminResponse) {
    this.adminResponse = adminResponse;
  }
  if (resolvedBy) {
    this.resolvedBy = resolvedBy;
  }
  if (newStatus === 'resolved' || newStatus === 'rejected') {
    this.resolvedAt = new Date();
  }
  return this.save();
};

module.exports = mongoose.model('Request', requestSchema);
