const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  productId: { type: String, unique: true, required: true }, // corresponds to id in object
  title: { type: String, required: true },
  category: { type: String, required: true },
  subCategory: { type: String, required: true },
  budget: { type: Boolean, default: false },
  premium: { type: Boolean, default: false },
  exclusive: { type: Boolean, default: false },
  handpicked: { type: Boolean, default: false },
  bestSeller: { type: Boolean, default: false },
  unique: { type: Boolean, default: false },
  newArrival: { type: Boolean, default: false },
  price: { type: Number, required: true },
  originalPrice: { type: Number, required: true },
  discountPercentage: { type: Number, default: 0 },
  rating: { type: Number, default: 0 },
  stock: { type: Number, default: 0 },
  sizes: [String],
  colors: [String],
  material: String,
  returnPolicy: String,
  shippingDetails: {
    weight: String,
    deliveryTime: String
  },
  images: [String],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  description: String,
  fabric: String,
  tags: [String],
  details: String,
});

module.exports = mongoose.model('Products', productSchema);