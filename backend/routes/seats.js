const express = require('express');
const router = express.Router();
const Seat = require('../models/Seat');
const { requireAdmin } = require('../middleware/auth');

// GET all seats (optionally filter by hall)
router.get('/', async (req, res) => {
  try {
    const { hallId } = req.query;
    const query = hallId ? { HallID: hallId } : {};
    const seats = await Seat.find(query)
      .populate('HallID', 'HallName')
      .sort({ RowNumber: 1, SeatNumber: 1 });
    res.json(seats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET single seat
router.get('/:id', async (req, res) => {
  try {
    const seat = await Seat.findById(req.params.id).populate('HallID');
    if (!seat) {
      return res.status(404).json({ error: 'Seat not found' });
    }
    res.json(seat);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST create new seat
router.post('/', requireAdmin, async (req, res) => {
  try {
    const seat = new Seat(req.body);
    await seat.save();
    const populatedSeat = await Seat.findById(seat._id).populate('HallID', 'HallName');
    res.status(201).json(populatedSeat);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// PUT update seat
router.put('/:id', requireAdmin, async (req, res) => {
  try {
    const seat = await Seat.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('HallID');
    if (!seat) {
      return res.status(404).json({ error: 'Seat not found' });
    }
    res.json(seat);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// DELETE seat
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const seat = await Seat.findByIdAndDelete(req.params.id);
    if (!seat) {
      return res.status(404).json({ error: 'Seat not found' });
    }
    res.json({ message: 'Seat deleted successfully', seat });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
