const mongoose = require('mongoose');

const supplierInfoSchema = new mongoose.Schema({
  supplierId: String,
  name: String,
  contact: String
});

const inventorySchema = new mongoose.Schema({
  inventoryId: { type: String, unique: true },
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  stockQuantity: Number,
  warehouseLocation: String,
  reorderLevel: Number,
  supplierInfo: supplierInfoSchema,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Inventory', inventorySchema);
