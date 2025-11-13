const express = require('express');
const { body, param, validationResult } = require('express-validator');
const Inventory = require('../models/inventory');
const authMiddleware = require('../middleware/auth');
const router = express.Router();

const validate = validations => async (req, res, next) => {
  await Promise.all(validations.map(v => v.run(req)));
  const errors = validationResult(req);
  if (errors.isEmpty()) return next();
  res.status(400).json({ errors: errors.array() });
};

// Create Inventory
router.post('/', authMiddleware, async (req, res, next) => {
  try {
    const inventory = new Inventory(req.body);
    await inventory.save();
    res.status(201).json(inventory);
  } catch (err) {
    next(err);
  }
});

// Get Inventory by ID
router.get('/:id', authMiddleware, validate([param('id').isMongoId()]), async (req, res, next) => {
  try {
    const inventory = await Inventory.findById(req.params.id).populate('productId');
    if (!inventory) return res.status(404).json({ error: 'Inventory not found' });
    res.json(inventory);
  } catch (err) {
    next(err);
  }
});

// Update Inventory
router.put('/:id', authMiddleware, validate([param('id').isMongoId()]), async (req, res, next) => {
  try {
    const inventory = await Inventory.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!inventory) return res.status(404).json({ error: 'Inventory not found' });
    res.json(inventory);
  } catch (err) {
    next(err);
  }
});

// Delete Inventory
router.delete('/:id', authMiddleware, validate([param('id').isMongoId()]), async (req, res, next) => {
  try {
    const inventory = await Inventory.findByIdAndDelete(req.params.id);
    if (!inventory) return res.status(404).json({ error: 'Inventory not found' });
    res.json({ message: 'Inventory deleted' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
