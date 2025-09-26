const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  clockIn: {
    type: Date,
    required: true
  },
  clockOut: {
    type: Date,
    default: null
  },
  totalHours: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['present', 'absent', 'late', 'half-day'],
    default: 'present'
  },
  notes: {
    type: String,
    default: ''
  },
  isManualEntry: {
    type: Boolean,
    default: false
  },
  editedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  }
}, {
  timestamps: true
});

// Index for efficient queries
attendanceSchema.index({ employee: 1, date: 1 }, { unique: true });

// Calculate total hours before saving
attendanceSchema.pre('save', function(next) {
  if (this.clockOut && this.clockIn) {
    const diffInMs = this.clockOut - this.clockIn;
    this.totalHours = Math.round((diffInMs / (1000 * 60 * 60)) * 100) / 100; // Round to 2 decimal places
  }
  next();
});

// Virtual for checking if employee is currently logged in
attendanceSchema.virtual('isLoggedIn').get(function() {
  return this.clockIn && !this.clockOut;
});

module.exports = mongoose.model('Attendance', attendanceSchema);
