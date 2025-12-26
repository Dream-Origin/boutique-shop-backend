require('dotenv').config();
const express = require('express');
const cors = require('cors');
const serverless = require('serverless-http');
const mongoose = require('mongoose');
const morgan = require('morgan');

// Import your routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const productRoutes = require('./routes/products');
const cartRoutes = require('./routes/carts');
const wishlistRoutes = require('./routes/wishlists');
const paymentRoutes = require('./routes/payments');
const inventoryRoutes = require('./routes/inventory');
const fileUploadRoute = require("./routes/fileUpload");
const ordersRoute = require("./routes/orders");

// -----------------------------
// MongoDB Connection (reuse for Lambda)
let isConnected = false;

const connectDB = async () => {
  if (isConnected) return; // reuse connection
  try {
    await mongoose.connect(process.env.DB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    isConnected = true;
    console.log("MongoDB connected");
  } catch (err) {
    console.error("MongoDB connection error:", err);
    throw err; // Important: propagate error to Lambda
  }
};

// -----------------------------
// Test function executed on cold start
const tst = async () => {
  try {
    await connectDB();
    console.log("TST function executed on cold start!");
  } catch (err) {
    console.error("TST function failed:", err);
  }
};

// Call test function immediately on cold start
tst();

// -----------------------------
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

app.options("*", cors()); // allow preflight for all routes


// Routes
app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/products', productRoutes);
app.use('/carts', cartRoutes);
app.use('/wishlists', wishlistRoutes);
app.use('/payments', paymentRoutes);
app.use('/inventory', inventoryRoutes);
app.use("/", fileUploadRoute);
app.use("/orders", ordersRoute);

// Test route to verify Lambda works
app.get("/test", (req, res) => {
  res.json({ message: "Lambda + API Gateway + Express is working!" });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.statusCode || 500).json({
    error: err.message || 'Internal Server Error'
  });
});

// -----------------------------
// Lambda handler


module.exports.handler = serverless(app);
// -----------------------------
// Local testing (optional)
// Uncomment for local testing:
const port = process.env.PORT || 3001;
app.listen(port, () => console.log(`Server running on port ${port}`));
