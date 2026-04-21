const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  Username: {
    type: String,
    trim: true,
    lowercase: true,
    unique: true,
    sparse: true
  },
  Email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    unique: true
  },
  PasswordHash: {
    type: String,
    required: true
  },
  Role: {
    type: String,
    enum: ['ADMIN', 'CUSTOMER'],
    default: 'CUSTOMER'
  },
  CustomerID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    unique: true,
    sparse: true
  },
  IsActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('User', userSchema);
