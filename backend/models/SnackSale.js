const mongoose = require('mongoose');

const saleItemSchema = new mongoose.Schema({
  ProductID: { type: mongoose.Schema.Types.ObjectId, ref: 'SnackProduct', required: true },
  ProductName: { type: String, required: true },
  Quantity: { type: Number, required: true, min: 1 },
  UnitPrice: { type: Number, required: true }
}, { _id: false });

const snackSaleSchema = new mongoose.Schema({
  Items: { type: [saleItemSchema], required: true },
  TotalAmount: { type: Number, required: true },
  PaymentMethod: { type: String, enum: ['Cash', 'Card', 'Online'], default: 'Cash' },
  Status: { type: String, enum: ['COMPLETED', 'CANCELLED'], default: 'COMPLETED' },
  SoldBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  CustomerID: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
  Notes: { type: String, trim: true, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('SnackSale', snackSaleSchema);
