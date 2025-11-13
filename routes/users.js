const express = require('express');
const { body, param, validationResult } = require('express-validator');
const User = require('../models/user');
const authMiddleware = require('../middleware/auth');
const adminMiddleware = require('../middleware/admin');
const router = express.Router();

const validate = validations => async (req, res, next) => {
  await Promise.all(validations.map(v => v.run(req)));
  const errors = validationResult(req);
  if (errors.isEmpty()) return next();
  res.status(400).json({ errors: errors.array() });
};

// Create User (Admin only)
router.post('/',
  authMiddleware, adminMiddleware,
  validate([
    body('email').isEmail(),
    body('passwordHash').notEmpty(),
    body('firstName').notEmpty(),
    body('lastName').notEmpty(),
  ]),
  async (req, res, next) => {
    try {
      const existing = await User.findOne({ email: req.body.email });
      if (existing) return res.status(400).json({ error: 'Email already exists' });

      const user = new User(req.body);
      await user.save();
      res.status(201).json(user);
    } catch (err) {
      next(err);
    }
  }
);

// Get All Users (Admin only)
router.get('/', authMiddleware, adminMiddleware, async (req, res, next) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (err) {
    next(err);
  }
});

// Get User by ID
router.get('/:id', authMiddleware, validate([param('id').isMongoId()]), async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    next(err);
  }
});

// Update User (Admin only)
router.put('/:id', authMiddleware, adminMiddleware, validate([param('id').isMongoId()]), async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    next(err);
  }
});

// Delete User (Admin only)
router.delete('/:id', authMiddleware, adminMiddleware, validate([param('id').isMongoId()]), async (req, res, next) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ message: 'User deleted' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
