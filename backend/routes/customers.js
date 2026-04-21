const express = require('express');
const router = express.Router();
const Customer = require('../models/Customer');
const { requireAuth, requireAdmin, isOwnerOrAdmin } = require('../middleware/auth');

// GET all customers
router.get('/', requireAuth, requireAdmin, async (req, res) => {
  try {
    const customers = await Customer.find().sort({ createdAt: -1 });
    res.json(customers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET single customer
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    if (!isOwnerOrAdmin(customer._id, req)) {
      return res.status(403).json({ error: 'You do not have permission to view this customer' });
    }
    res.json(customer);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST create new customer
router.post('/', requireAuth, requireAdmin, async (req, res) => {
  try {
    const customer = new Customer(req.body);
    await customer.save();
    res.status(201).json(customer);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// PUT update customer
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const existingCustomer = await Customer.findById(req.params.id);
    if (!existingCustomer) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    if (!isOwnerOrAdmin(existingCustomer._id, req)) {
      return res.status(403).json({ error: 'You do not have permission to update this customer' });
    }
    const customer = await Customer.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    res.json(customer);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// DELETE customer
router.delete('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const customer = await Customer.findByIdAndDelete(req.params.id);
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    res.json({ message: 'Customer deleted successfully', customer });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
