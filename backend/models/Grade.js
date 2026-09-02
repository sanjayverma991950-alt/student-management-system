const mongoose = require('mongoose');

const gradeSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
    },
    title: {
      type: String,
      required: [true, 'Please add a grade/assessment title'],
    },
    marksObtained: {
      type: Number,
      required: [true, 'Please add marks obtained'],
    },
    maxMarks: {
      type: Number,
      required: [true, 'Please add maximum marks'],
    },
    remarks: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Grade', gradeSchema);
