const express = require('express');
const router = express.Router();
const Reservation = require('../models/Reservation');
const { requireAuth, requireAdmin, requireAdminOrCajero, isOwnerOrAdmin } = require('../middleware/auth');

// GET all reservations with populated data
router.get('/', requireAuth, requireAdminOrCajero, async (req, res) => {
  try {
    const reservations = await Reservation.find()
      .populate('CustomerID', 'Name Surname Email')
      .populate({
        path: 'SessionID',
        populate: [
          { path: 'MovieID', select: 'MovieName Genre' },
          { path: 'HallID', select: 'HallName' }
        ]
      })
      .populate('SeatIDs')
      .sort({ CreationTime: -1 });
    res.json(reservations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET single reservation
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const reservation = await Reservation.findById(req.params.id)
      .populate('CustomerID')
      .populate({
        path: 'SessionID',
        populate: [
          { path: 'MovieID' },
          { path: 'HallID' }
        ]
      })
      .populate('SeatIDs');
    if (!reservation) {
      return res.status(404).json({ error: 'Reservation not found' });
    }
    if (!isOwnerOrAdmin(reservation.CustomerID?._id, req)) {
      return res.status(403).json({ error: 'You do not have permission to view this reservation' });
    }
    res.json(reservation);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST create new reservation
router.post('/', requireAuth, requireAdminOrCajero, async (req, res) => {
  try {
    const reservation = new Reservation(req.body);
    await reservation.save();
    const populatedReservation = await Reservation.findById(reservation._id)
      .populate('CustomerID', 'Name Surname Email')
      .populate({
        path: 'SessionID',
        populate: [
          { path: 'MovieID', select: 'MovieName Genre' },
          { path: 'HallID', select: 'HallName' }
        ]
      })
      .populate('SeatIDs');
    res.status(201).json(populatedReservation);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// PUT update reservation (mainly for status updates)
router.put('/:id', requireAuth, requireAdminOrCajero, async (req, res) => {
  try {
    const reservation = await Reservation.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )
      .populate('CustomerID')
      .populate({
        path: 'SessionID',
        populate: [
          { path: 'MovieID' },
          { path: 'HallID' }
        ]
      })
      .populate('SeatIDs');
    if (!reservation) {
      return res.status(404).json({ error: 'Reservation not found' });
    }
    res.json(reservation);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// DELETE reservation
router.delete('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const reservation = await Reservation.findByIdAndDelete(req.params.id);
    if (!reservation) {
      return res.status(404).json({ error: 'Reservation not found' });
    }
    res.json({ message: 'Reservation deleted successfully', reservation });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
