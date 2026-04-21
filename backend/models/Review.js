const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  CustomerID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },
  MovieID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Movie',
    required: true
  },
  ReservationID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Reservation',
    required: true
  },
  Score: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  Comment: {
    type: String,
    trim: true,
    maxlength: 500,
    default: ''
  }
}, {
  timestamps: true
});

reviewSchema.index({ CustomerID: 1, MovieID: 1 }, { unique: true });

module.exports = mongoose.model('Review', reviewSchema);
