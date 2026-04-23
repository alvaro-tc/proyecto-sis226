const mongoose = require('mongoose');

const snackCategorySchema = new mongoose.Schema({
  Name: { type: String, required: true, trim: true },
  Description: { type: String, trim: true, default: '' },
  IsActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('SnackCategory', snackCategorySchema);
