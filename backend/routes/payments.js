const express = require('express');
const router = express.Router();
const Payment = require('../models/Payment');
const { requireAuth, requireAdmin, isOwnerOrAdmin } = require('../middleware/auth');

// GET all payments
router.get('/', requireAuth, requireAdmin, async (req, res) => {
  try {
    const payments = await Payment.find()
      .populate({
        path: 'ReservationID',
        populate: [
          { path: 'CustomerID', select: 'Name Surname' },
          { path: 'SessionID' }
        ]
      })
      .sort({ ProcessingTime: -1 });
    res.json(payments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET single payment
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate({
        path: 'ReservationID',
        populate: [
          { path: 'CustomerID' },
          { path: 'SessionID' }
        ]
      });
    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }
    if (!payment.ReservationID || !payment.ReservationID.CustomerID || !isOwnerOrAdmin(payment.ReservationID.CustomerID._id, req)) {
      return res.status(403).json({ error: 'You do not have permission to view this payment' });
    }
    res.json(payment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST create new payment
router.post('/', requireAuth, requireAdmin, async (req, res) => {
  try {
    const payment = new Payment(req.body);
    await payment.save();
    const populatedPayment = await Payment.findById(payment._id)
      .populate({
        path: 'ReservationID',
        populate: [
          { path: 'CustomerID', select: 'Name Surname' },
          { path: 'SessionID' }
        ]
      });
    res.status(201).json(populatedPayment);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// PUT update payment
router.put('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const payment = await Payment.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('ReservationID');
    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }
    res.json(payment);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// DELETE payment
router.delete('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const payment = await Payment.findByIdAndDelete(req.params.id);
    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }
    res.json({ message: 'Payment deleted successfully', payment });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
