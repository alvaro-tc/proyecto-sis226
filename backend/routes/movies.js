const express = require('express');
const router = express.Router();
const Movie = require('../models/Movie');
const MovieSession = require('../models/MovieSession');
const Reservation = require('../models/Reservation');
const Payment = require('../models/Payment');
const Ticket = require('../models/Ticket');
const Review = require('../models/Review');
const { requireAdmin } = require('../middleware/auth');

// GET all movies
router.get('/', async (req, res) => {
  try {
    const movies = await Movie.find().sort({ createdAt: -1 });
    res.json(movies);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET single movie
router.get('/:id', async (req, res) => {
  try {
    const movie = await Movie.findById(req.params.id);
    if (!movie) {
      return res.status(404).json({ error: 'Movie not found' });
    }
    res.json(movie);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST create new movie
router.post('/', requireAdmin, async (req, res) => {
  try {
    const movie = new Movie(req.body);
    await movie.save();
    res.status(201).json(movie);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// PUT update movie
router.put('/:id', requireAdmin, async (req, res) => {
  try {
    const movie = await Movie.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!movie) {
      return res.status(404).json({ error: 'Movie not found' });
    }
    res.json(movie);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// DELETE movie
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const movie = await Movie.findById(req.params.id);
    if (!movie) {
      return res.status(404).json({ error: 'Movie not found' });
    }

    // Find all sessions for this movie
    const sessions = await MovieSession.find({ MovieID: req.params.id });
    const sessionIds = sessions.map(session => session._id);

    // For each session, find all reservations
    const reservations = await Reservation.find({ SessionID: { $in: sessionIds } });
    const reservationIds = reservations.map(reservation => reservation._id);

    // Delete all payments for these reservations
    const paymentResult = await Payment.deleteMany({ ReservationID: { $in: reservationIds } });

    // Delete all tickets for these reservations
    const ticketResult = await Ticket.deleteMany({ ReservationID: { $in: reservationIds } });

    // Delete all reservations
    const reservationResult = await Reservation.deleteMany({ SessionID: { $in: sessionIds } });

    // Delete all sessions
    const sessionResult = await MovieSession.deleteMany({ MovieID: req.params.id });

    // Delete movie reviews
    const reviewResult = await Review.deleteMany({ MovieID: req.params.id });

    // Finally, delete the movie
    await Movie.findByIdAndDelete(req.params.id);

    res.json({ 
      message: 'Movie and all related data deleted successfully', 
      movie,
      deletedCounts: {
        sessions: sessionResult.deletedCount,
        reservations: reservationResult.deletedCount,
        payments: paymentResult.deletedCount,
        tickets: ticketResult.deletedCount,
        reviews: reviewResult.deletedCount
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
