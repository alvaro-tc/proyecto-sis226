const mongoose = require('mongoose');

const reservationSchema = new mongoose.Schema({
  CustomerID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: false,
    default: null
  },
  SessionID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MovieSession',
    required: true
  },
  SeatIDs: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Seat'
  }],
  CreationTime: {
    type: Date,
    default: Date.now
  },
  Status: {
    type: String,
    enum: ['CREATED', 'PAID', 'CANCELLED'],
    default: 'CREATED'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Reservation', reservationSchema);
