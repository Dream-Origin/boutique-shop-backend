const express = require('express');
const { body, param, validationResult } = require('express-validator');
const Payment = require('../models/payment');
const authMiddleware = require('../middleware/auth');
const router = express.Router();

const validate = validations => async (req, res, next) => {
  await Promise.all(validations.map(v => v.run(req)));
  const errors = validationResult(req);
  if (errors.isEmpty()) return next();
  res.status(400).json({ errors: errors.array() });
};

// Create Payment
router.post('/', authMiddleware, async (req, res, next) => {
  try {
    const payment = new Payment(req.body);
    await payment.save();
    res.status(201).json(payment);
  } catch (err) {
    next(err);
  }
});

// Get Payment by ID
router.get('/:id', authMiddleware, validate([param('id').isMongoId()]), async (req, res, next) => {
  try {
    const payment = await Payment.findById(req.params.id).populate('orderId').populate('userId');
    if (!payment) return res.status(404).json({ error: 'Payment not found' });
    res.json(payment);
  } catch (err) {
    next(err);
  }
});

// Update Payment
router.put('/:id', authMiddleware, validate([param('id').isMongoId()]), async (req, res, next) => {
  try {
    const payment = await Payment.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!payment) return res.status(404).json({ error: 'Payment not found' });
    res.json(payment);
  } catch (err) {
    next(err);
  }
});

// Delete Payment
router.delete('/:id', authMiddleware, validate([param('id').isMongoId()]), async (req, res, next) => {
  try {
    const payment = await Payment.findByIdAndDelete(req.params.id);
    if (!payment) return res.status(404).json({ error: 'Payment not found' });
    res.json({ message: 'Payment deleted' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
