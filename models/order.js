const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    orderId: { type: String, unique: true },

    status: {
      type: String,
      enum: [
        "Pending",
        "Confirmed",
        "Processing",
        "Packed",
        "Shipped",
        "In Transit",
        "Out for Delivery",
        "Delivered",
        "Cancelled",
        "Returned",
        "Refund Completed"
      ],
      default: "Pending"
    },

    user: {
      firstName: String,
      lastName: String,
      email: String,
      phone: String
    },

    shippingAddress: {
      address: String,
      city: String,
      state: String,
      zipCode: String,
      country: String
    },

    items: [
      {
        productId: String,
        title: String,
        category: String,
        subCategory: String,
        price: Number,
        originalPrice: Number,
        discountPercentage: Number,
        size: String,
        sizes: [String],
        colors: [String],
        material: String,
        images: [String],
        quantity: Number
      }
    ],

    totalAmount: Number,

    payment: {
      method: String,
      status: String,
      paymentId: String 
    }

  },
  { timestamps: true }
);

module.exports = mongoose.model("Orders", orderSchema);
