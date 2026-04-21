const express = require('express');
const router = express.Router();
const Ticket = require('../models/Ticket');
const { requireAuth, requireAdmin, isOwnerOrAdmin } = require('../middleware/auth');

// GET all tickets
router.get('/', requireAuth, requireAdmin, async (req, res) => {
  try {
    const tickets = await Ticket.find()
      .populate({
        path: 'ReservationID',
        populate: [
          { path: 'CustomerID', select: 'Name Surname' },
          { path: 'SessionID' }
        ]
      })
      .populate({
        path: 'SeatID',
        populate: { path: 'HallID', select: 'HallName' }
      })
      .sort({ createdAt: -1 });
    res.json(tickets);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET single ticket
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id)
      .populate({
        path: 'ReservationID',
        populate: [
          { path: 'CustomerID' },
          { path: 'SessionID' }
        ]
      })
      .populate({
        path: 'SeatID',
        populate: { path: 'HallID' }
      });
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }
    if (!ticket.ReservationID || !ticket.ReservationID.CustomerID || !isOwnerOrAdmin(ticket.ReservationID.CustomerID._id, req)) {
      return res.status(403).json({ error: 'You do not have permission to view this ticket' });
    }
    res.json(ticket);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST create new ticket
router.post('/', requireAuth, requireAdmin, async (req, res) => {
  try {
    const ticket = new Ticket(req.body);
    await ticket.save();
    const populatedTicket = await Ticket.findById(ticket._id)
      .populate({
        path: 'ReservationID',
        populate: [
          { path: 'CustomerID', select: 'Name Surname' },
          { path: 'SessionID' }
        ]
      })
      .populate({
        path: 'SeatID',
        populate: { path: 'HallID', select: 'HallName' }
      });
    res.status(201).json(populatedTicket);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// PUT update ticket (mainly for check-in status)
router.put('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const ticket = await Ticket.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )
      .populate('ReservationID')
      .populate('SeatID');
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }
    res.json(ticket);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// DELETE ticket
router.delete('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const ticket = await Ticket.findByIdAndDelete(req.params.id);
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }
    res.json({ message: 'Ticket deleted successfully', ticket });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
