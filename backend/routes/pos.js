const express = require('express');
const router = express.Router();

const MovieSession = require('../models/MovieSession');
const Reservation = require('../models/Reservation');
const Payment = require('../models/Payment');
const Seat = require('../models/Seat');
const Ticket = require('../models/Ticket');
const { requireAuth, requireAdminOrCajero } = require('../middleware/auth');
const { buildTicketPayload } = require('../utils/tickets');

// POST /api/pos/sell-tickets
// Complete ticket sale: creates reservation + payment + tickets in one transaction.
router.post('/sell-tickets', requireAuth, requireAdminOrCajero, async (req, res) => {
  try {
    const { SessionID, SeatIDs, PaymentMethod = 'Cash', CustomerID } = req.body;

    if (!SessionID || !Array.isArray(SeatIDs) || SeatIDs.length === 0) {
      return res.status(400).json({ error: 'SessionID y al menos un asiento son requeridos' });
    }

    const uniqueSeatIds = [...new Set(SeatIDs.map(String))];

    const session = await MovieSession.findById(SessionID)
      .populate('MovieID', 'MovieName')
      .populate('HallID', 'HallName');

    if (!session) return res.status(404).json({ error: 'Función no encontrada' });

    const seats = await Seat.find({ _id: { $in: uniqueSeatIds }, HallID: session.HallID._id });
    if (seats.length !== uniqueSeatIds.length) {
      return res.status(400).json({ error: 'Uno o más asientos no pertenecen a esta sala' });
    }

    // Check seat availability for this session
    const existingTickets = await Ticket.find({ SeatID: { $in: uniqueSeatIds } })
      .populate({ path: 'ReservationID', select: 'SessionID Status' });

    const takenSeatIds = existingTickets
      .filter(t =>
        t.ReservationID &&
        t.ReservationID.SessionID.toString() === SessionID &&
        t.ReservationID.Status !== 'CANCELLED'
      )
      .map(t => t.SeatID.toString());

    if (takenSeatIds.length > 0) {
      return res.status(409).json({ error: 'Uno o más asientos ya están ocupados', takenSeatIds });
    }

    const reservationData = {
      SessionID: session._id,
      SeatIDs: uniqueSeatIds,
      Status: 'PAID',
      CreationTime: new Date(),
    };
    if (CustomerID) reservationData.CustomerID = CustomerID;

    const reservation = await Reservation.create(reservationData);

    const amount = seats.length * session.Price;
    const payment = await Payment.create({
      ReservationID: reservation._id,
      PaymentMethod,
      Amount: amount,
      PaymentStatus: 'Completed',
      ProcessingTime: new Date(),
    });

    const metadata = {
      movie: session.MovieID.MovieName,
      hall: session.HallID.HallName,
      sessionDateTime: session.SessionDateTime,
    };

    const ticketPayloads = await Promise.all(
      seats.map(seat =>
        buildTicketPayload({ reservationId: reservation._id, seatId: seat._id, metadata })
      )
    );

    const tickets = await Ticket.insertMany(ticketPayloads);

    res.status(201).json({
      reservation,
      payment,
      tickets,
      summary: {
        movie: session.MovieID.MovieName,
        hall: session.HallID.HallName,
        sessionDateTime: session.SessionDateTime,
        seats: seats.map(s => `${s.RowNumber}${s.SeatNumber}`),
        totalAmount: amount,
        paymentMethod: payment.PaymentMethod,
        ticketCodes: tickets.map(t => t.TicketCode),
      },
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
