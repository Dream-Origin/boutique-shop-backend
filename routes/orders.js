const express = require("express");
const mongoose = require('mongoose');

const { body, param, validationResult } = require("express-validator");
const Order = require("../models/order");
const Product = require("../models/product");

const router = express.Router();

/* =====================================================
   VALIDATION HELPER
===================================================== */
const validate = (validations) => async (req, res, next) => {
  await Promise.all(validations.map((v) => v.run(req)));
  const errors = validationResult(req);
  if (errors.isEmpty()) return next();
  res.status(400).json({ errors: errors.array() });
};

/* =====================================================
   GENERATE ORDER ID
===================================================== */
function generateOrderId() {
  return "ORD-" + Date.now() + "-" + Math.floor(Math.random() * 9999);
}

/* =====================================================
   CREATE ORDER
===================================================== */
router.post(
  "/",
  validate([
    body("user").notEmpty(),
    body("items").isArray({ min: 1 }),
    body("totalAmount").isNumeric(),
  ]),
  async (req, res, next) => {
    try {
      const order = new Order({
        ...req.body,
        orderId: generateOrderId(),
      });

      await order.save();

      res.status(201).json({
        message: "Order created successfully",
        order,
      });
    } catch (err) {
      next(err);
    }
  }
);

/* =====================================================
   GET ALL ORDERS (admin)
===================================================== */
router.get("/", async (req, res, next) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    next(err);
  }
});

/* =====================================================
   GET ORDER BY MONGO ID
===================================================== */
router.get(
  "/:id",
  validate([param("id").isMongoId()]),
  async (req, res, next) => {
    try {
      const order = await Order.findById(req.params.id);

      if (!order) return res.status(404).json({ error: "Order not found" });

      res.json(order);
    } catch (err) {
      next(err);
    }
  }
);

/* =====================================================
   SEARCH ORDERS BY EMAIL OR MOBILE
===================================================== */
router.get("/user/search", async (req, res, next) => {
  try {
    const { email, mobile } = req.query;

    if (!email && !mobile) {
      return res.status(400).json({ error: "Provide email or mobile" });
    }

    const orders = await Order.find({
      $or: [
        { "user.email": email || null },
        { "user.phone": mobile || null },
      ],
    }).sort({ createdAt: -1 });

    res.json(orders);
  } catch (err) {
    next(err);
  }
});

/* =====================================================
   FILTER ORDERS BY STATUS
===================================================== */
router.get("/filter/status/:status", async (req, res, next) => {
  try {
    const status = req.params.status;

    const orders = await Order.find({ status }).sort({ createdAt: -1 });

    res.json(orders);
  } catch (err) {
    next(err);
  }
});
/* =====================================================
   UPDATE ORDER STATUS & OPTIONAL PAYMENT INFO
===================================================== */
router.put("/:id/status", async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { status, paymentId } = req.body;

    // 1️⃣ Fetch order
    const order = await Order.findById(req.params.id).session(session);

    if (!order) {
      await session.abortTransaction();
      return res.status(404).json({ error: "Order not found" });
    }

    // 2️⃣ CASE A: paymentId NOT present → only status update
    if (!paymentId) {
      order.status = status;
      await order.save({ session });

      await session.commitTransaction();
      session.endSession();

      return res.json({ success: true, order });
    }

    // 3️⃣ CASE B: paymentId present → payment success flow

    // Prevent double stock reduction
    if (order.payment?.paymentId) {
      await session.abortTransaction();
      return res.status(400).json({
        error: "Payment already processed"
      });
    }

    // Update order + payment
    order.status = status || "Confirmed";
    order.payment = {
      method: "Razorpay",
      status: "Paid",
      paymentId
    };

    await order.save({ session });

    // Reduce stock for each item
    for (const item of order.items) {
      const updatedProduct = await Product.findOneAndUpdate(
        {
          productId: item.productId,
          stock: { $gte: item.quantity }
        },
        {
          $inc: { stock: -item.quantity }
        },
        { session }
      );

      if (!updatedProduct) {
        throw new Error(`Insufficient stock for ${item.productId}`);
      }
    }

    await session.commitTransaction();
    session.endSession();

    res.json({ success: true, order });

  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    next(err);
  }
});




/* =====================================================
   UPDATE FULL ORDER (optional)
===================================================== */
router.put(
  "/:id",
  validate([param("id").isMongoId()]),
  async (req, res, next) => {
    try {
      const updatedOrder = await Order.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true }
      );

      if (!updatedOrder)
        return res.status(404).json({ error: "Order not found" });

      res.json(updatedOrder);
    } catch (err) {
      next(err);
    }
  }
);

/* =====================================================
   DELETE ORDER
===================================================== */
router.delete(
  "/:id",
  validate([param("id").isMongoId()]),
  async (req, res, next) => {
    try {
      const deleted = await Order.findByIdAndDelete(req.params.id);

      if (!deleted)
        return res.status(404).json({ error: "Order not found" });

      res.json({ message: "Order deleted successfully" });
    } catch (err) {
      next(err);
    }
  }
);

/* =====================================================
   ADMIN DASHBOARD COUNTS
===================================================== */
router.get("/dashboard/counts", async (req, res, next) => {
  try {
    const statuses = [
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
      "Refund Completed",
    ];

    const counts = {};

    for (const s of statuses) {
      counts[s] = await Order.countDocuments({ status: s });
    }

    const total = await Order.countDocuments();

    res.json({
      totalOrders: total,
      statusCounts: counts,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
