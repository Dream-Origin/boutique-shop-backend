const express = require('express');
const { body, param, validationResult } = require('express-validator');
const Cart = require('../models/cart');
const authMiddleware = require('../middleware/auth');
const router = express.Router();

const validate = validations => async (req, res, next) => {
  await Promise.all(validations.map(v => v.run(req)));
  const errors = validationResult(req);
  if (errors.isEmpty()) return next();
  res.status(400).json({ errors: errors.array() });
};

// Create Cart
router.post('/', authMiddleware, async (req, res, next) => {
  try {
    const cart = new Cart(req.body);
    await cart.save();
    res.status(201).json(cart);
  } catch (err) {
    next(err);
  }
});

// Get Cart by User ID
router.get('/user/:userId', authMiddleware, validate([param('userId').isMongoId()]), async (req, res, next) => {
  try {
    const cart = await Cart.findOne({ userId: req.params.userId }).populate('items.productId');
    if (!cart) return res.status(404).json({ error: 'Cart not found' });
    res.json(cart);
  } catch (err) {
    next(err);
  }
});

// Update Cart by ID
router.put('/:id', authMiddleware, validate([param('id').isMongoId()]), async (req, res, next) => {
  try {
    const cart = await Cart.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!cart) return res.status(404).json({ error: 'Cart not found' });
    res.json(cart);
  } catch (err) {
    next(err);
  }
});

// Delete Cart by ID
router.delete('/:id', authMiddleware, validate([param('id').isMongoId()]), async (req, res, next) => {
  try {
    const cart = await Cart.findByIdAndDelete(req.params.id);
    if (!cart) return res.status(404).json({ error: 'Cart not found' });
    res.json({ message: 'Cart deleted' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
