const express = require('express');
const { body, param, validationResult } = require('express-validator');
const Wishlist = require('../models/wishlist');
const authMiddleware = require('../middleware/auth');
const router = express.Router();

const validate = validations => async (req, res, next) => {
  await Promise.all(validations.map(v => v.run(req)));
  const errors = validationResult(req);
  if (errors.isEmpty()) return next();
  res.status(400).json({ errors: errors.array() });
};

// Create Wishlist
router.post('/', authMiddleware, async (req, res, next) => {
  try {
    const wishlist = new Wishlist(req.body);
    await wishlist.save();
    res.status(201).json(wishlist);
  } catch (err) {
    next(err);
  }
});

// Get Wishlist by User ID
router.get('/user/:userId', authMiddleware, validate([param('userId').isMongoId()]), async (req, res, next) => {
  try {
    const wishlist = await Wishlist.findOne({ userId: req.params.userId }).populate('products');
    if (!wishlist) return res.status(404).json({ error: 'Wishlist not found' });
    res.json(wishlist);
  } catch (err) {
    next(err);
  }
});

// Update Wishlist by ID
router.put('/:id', authMiddleware, validate([param('id').isMongoId()]), async (req, res, next) => {
  try {
    const wishlist = await Wishlist.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!wishlist) return res.status(404).json({ error: 'Wishlist not found' });
    res.json(wishlist);
  } catch (err) {
    next(err);
  }
});

// Delete Wishlist by ID
router.delete('/:id', authMiddleware, validate([param('id').isMongoId()]), async (req, res, next) => {
  try {
    const wishlist = await Wishlist.findByIdAndDelete(req.params.id);
    if (!wishlist) return res.status(404).json({ error: 'Wishlist not found' });
    res.json({ message: 'Wishlist deleted' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
