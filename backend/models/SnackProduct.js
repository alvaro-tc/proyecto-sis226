const mongoose = require('mongoose');

const snackProductSchema = new mongoose.Schema({
  Name: { type: String, required: true, trim: true },
  Description: { type: String, trim: true, default: '' },
  Category: { type: mongoose.Schema.Types.ObjectId, ref: 'SnackCategory', required: true },
  Price: { type: Number, required: true, min: 0 },
  Stock: { type: Number, default: 0, min: 0 },
  ImageURL: { type: String, trim: true, default: '' },
  IsActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('SnackProduct', snackProductSchema);
