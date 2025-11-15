require('dotenv').config()
const express = require('express');
var cors = require('cors');

const mongoose = require('mongoose');
const morgan = require('morgan');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const productRoutes = require('./routes/products');
const cartRoutes = require('./routes/carts');
const wishlistRoutes = require('./routes/wishlists');
const paymentRoutes = require('./routes/payments');
const inventoryRoutes = require('./routes/inventory');
const assetManagementRoutes = require('./routes/assetManagement');


const port = process.env.PORT || 3001;
const app = express();
app.use(cors());



app.use(express.json());
app.use(morgan('dev'));

const uri = process.env.DB_URI;

mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Database connection established!'))
  .catch(err => console.error('Database connection error:', err));

// Route mounting
app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/products', productRoutes);
app.use('/carts', cartRoutes);
app.use('/wishlists', wishlistRoutes);
app.use('/payments', paymentRoutes);
app.use('/inventory', inventoryRoutes);
app.use('/upload', assetManagementRoutes);

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.statusCode || 500).json({ error: err.message || 'Server Error' });
});

module.exports = app;

// And for local dev:
if (require.main === module) {
  app.listen(port, () => console.log(`Server running on port ${port}`));
}
