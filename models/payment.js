const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  paymentId: { type: String, unique: true },
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  amount: Number,
  paymentMethod: String,
  paymentStatus: String,
  transactionDate: { type: Date, default: Date.now },
  providerResponse: String
});

module.exports = mongoose.model('Payment', paymentSchema);
