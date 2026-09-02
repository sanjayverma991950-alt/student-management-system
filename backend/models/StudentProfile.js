const mongoose = require('mongoose');

const studentProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true, // One profile per student user
    },
    rollNumber: {
      type: String,
      required: [true, 'Please add a roll number'],
      unique: true,
    },
    dateOfBirth: {
      type: Date,
    },
    phone: {
      type: String,
    },
    address: {
      type: String,
    },
    guardianName: {
      type: String,
    },
    guardianPhone: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('StudentProfile', studentProfileSchema);
