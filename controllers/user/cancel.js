const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');

const app = express();
const PORT = 3000;

// Connect to MongoDB (make sure you have your MongoDB connection string)
mongoose.connect('mongodb://localhost/your-database-name', { useNewUrlParser: true, useUnifiedTopology: true });
const db = mongoose.connection;

// Define the Order schema (assuming you have a Product schema as well)
const orderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  products: [
    {
      product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true,
      },
      quantity: {
        type: Number,
        required: true,
      },
    },
  ],
  totalAmount: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: ['Pending', 'Shipped', 'Cancelled'], // Add more statuses as needed
    default: 'Pending',
  },
});

const Order = mongoose.model('Order', orderSchema);

// Middleware to parse JSON requests
app.use(bodyParser.json());

// Route to cancel a product in an order
app.post('/cancel-product/:orderId/:productId', async (req, res) => {
  try {
    const { orderId, productId } = req.params;

    // Find the order
    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Check if the order is cancellable (e.g., it's not already shipped)
    if (order.status === 'Shipped') {
      return res.status(400).json({ error: 'Order is already shipped and cannot be canceled' });
    }

    // Find the product within the order
    const productInOrder = order.products.find((product) => product.product.toString() === productId);

    if (!productInOrder) {
      return res.status(404).json({ error: 'Product not found in the order' });
    }

    // Calculate the refund amount, update the order, and remove the product
    const refundAmount = productInOrder.quantity * productInOrder.product.price;
    order.totalAmount -= refundAmount;
    order.products = order.products.filter((product) => product.product.toString() !== productId);

    // Save the updated order
    await order.save();

    // You may implement the refund process here (e.g., interacting with a payment gateway)

    // Send a response
    res.status(200).json({ message: 'Product canceled successfully', refundAmount });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
