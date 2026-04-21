const express = require('express');
const router = express.Router();
const MovieSession = require('../models/MovieSession');
const Reservation = require('../models/Reservation');
const Ticket = require('../models/Ticket');
const { requireAdmin } = require('../middleware/auth');

// Solo el ADMIN puede crear salas
router.post('/', checkRole(['admin']), hallController.create);

// El ADMIN y el CAJERO pueden ver las salas
router.get('/', checkRole(['admin', 'cajero']), hallController.getAll);

// GET all sessions with populated movie and hall data
router.get('/', async (req, res) => {
  try {
    const sessions = await MovieSession.find()
      .populate('MovieID', 'MovieName Genre Duration')
      .populate('HallID', 'HallName Capacity')
      .sort({ SessionDateTime: 1 });
    res.json(sessions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET single session
router.get('/:id', async (req, res) => {
  try {
    const session = await MovieSession.findById(req.params.id)
      .populate('MovieID')
      .populate('HallID');
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    res.json(session);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET session seat availability
router.get('/:id/availability', async (req, res) => {
  try {
    const session = await MovieSession.findById(req.params.id);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const reservations = await Reservation.find({ SessionID: req.params.id }).select('_id');
    const reservationIds = reservations.map((reservation) => reservation._id);
    const tickets = await Ticket.find({ ReservationID: { $in: reservationIds } }).select('SeatID');
    const soldSeatIds = tickets.map((ticket) => ticket.SeatID.toString());

    res.json({ soldSeatIds });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST create new session
router.post('/', requireAdmin, async (req, res) => {
  try {
    const session = new MovieSession(req.body);
    await session.save();
    const populatedSession = await MovieSession.findById(session._id)
      .populate('MovieID', 'MovieName Genre Duration')
      .populate('HallID', 'HallName Capacity');
    res.status(201).json(populatedSession);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// PUT update session
router.put('/:id', requireAdmin, async (req, res) => {
  try {
    const session = await MovieSession.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('MovieID').populate('HallID');
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    res.json(session);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// DELETE session
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const session = await MovieSession.findByIdAndDelete(req.params.id);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    res.json({ message: 'Session deleted successfully', session });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
