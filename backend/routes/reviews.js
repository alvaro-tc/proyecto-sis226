const express = require('express');
const router = express.Router();

const Movie = require('../models/Movie');
const Reservation = require('../models/Reservation');
const Review = require('../models/Review');
const Ticket = require('../models/Ticket');
const { optionalAuth, requireAuth, requireCustomer } = require('../middleware/auth');
const { refreshMovieReviewStats } = require('../utils/movieRatings');

async function getEligibleReservation(customerId, movieId) {
  const reservations = await Reservation.find({
    CustomerID: customerId,
    Status: 'PAID'
  }).populate({
    path: 'SessionID',
    populate: { path: 'MovieID', select: '_id MovieName' }
  });

  const now = new Date();

  for (const reservation of reservations) {
    if (!reservation.SessionID || !reservation.SessionID.MovieID) {
      continue;
    }

    const belongsToMovie = reservation.SessionID.MovieID._id.toString() === movieId.toString();
    if (!belongsToMovie) {
      continue;
    }

    const sessionAlreadyHappened = new Date(reservation.SessionID.SessionDateTime) <= now;
    if (sessionAlreadyHappened) {
      return reservation;
    }

    const checkedInTicket = await Ticket.findOne({
      ReservationID: reservation._id,
      CheckInStatus: true
    });

    if (checkedInTicket) {
      return reservation;
    }
  }

  return null;
}

router.get('/movie/:movieId', optionalAuth, async (req, res) => {
  try {
    const movie = await Movie.findById(req.params.movieId).select('UserRatingAverage UserRatingCount');
    if (!movie) {
      return res.status(404).json({ error: 'Movie not found' });
    }

    const reviews = await Review.find({ MovieID: req.params.movieId })
      .populate('CustomerID', 'Name Surname')
      .sort({ updatedAt: -1 });

    res.json({
      summary: {
        averageScore: movie.UserRatingAverage || 0,
        reviewCount: movie.UserRatingCount || 0
      },
      reviews
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/me/movie/:movieId', requireAuth, requireCustomer, async (req, res) => {
  try {
    if (!req.user.CustomerID) {
      return res.status(400).json({ error: 'Your account is not linked to a customer profile' });
    }

    const review = await Review.findOne({
      CustomerID: req.user.CustomerID._id,
      MovieID: req.params.movieId
    }).populate('CustomerID', 'Name Surname');

    const eligibleReservation = await getEligibleReservation(req.user.CustomerID._id, req.params.movieId);

    res.json({
      canReview: Boolean(eligibleReservation),
      review,
      reason: eligibleReservation ? null : 'Debes haber comprado y visto esta película antes de valorarla.'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/movie/:movieId', requireAuth, requireCustomer, async (req, res) => {
  try {
    if (!req.user.CustomerID) {
      return res.status(400).json({ error: 'Your account is not linked to a customer profile' });
    }

    const { Score, Comment = '' } = req.body;
    const numericScore = Number(Score);

    if (!numericScore || numericScore < 1 || numericScore > 5) {
      return res.status(400).json({ error: 'Score must be between 1 and 5' });
    }

    const movie = await Movie.findById(req.params.movieId);
    if (!movie) {
      return res.status(404).json({ error: 'Movie not found' });
    }

    const eligibleReservation = await getEligibleReservation(req.user.CustomerID._id, req.params.movieId);
    if (!eligibleReservation) {
      return res.status(403).json({ error: 'You can only review movies that you have already watched' });
    }

    const review = await Review.findOneAndUpdate(
      {
        CustomerID: req.user.CustomerID._id,
        MovieID: req.params.movieId
      },
      {
        CustomerID: req.user.CustomerID._id,
        MovieID: req.params.movieId,
        ReservationID: eligibleReservation._id,
        Score: numericScore,
        Comment: Comment.trim()
      },
      {
        upsert: true,
        new: true,
        runValidators: true,
        setDefaultsOnInsert: true
      }
    ).populate('CustomerID', 'Name Surname');

    const summary = await refreshMovieReviewStats(req.params.movieId);

    res.json({
      review,
      summary
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
