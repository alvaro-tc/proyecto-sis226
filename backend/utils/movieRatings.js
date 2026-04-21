const mongoose = require('mongoose');
const Movie = require('../models/Movie');
const Review = require('../models/Review');

async function refreshMovieReviewStats(movieId) {
  const summary = await Review.aggregate([
    { $match: { MovieID: new mongoose.Types.ObjectId(movieId) } },
    {
      $group: {
        _id: '$MovieID',
        averageScore: { $avg: '$Score' },
        reviewCount: { $sum: 1 }
      }
    }
  ]);

  if (summary.length === 0) {
    await Movie.findByIdAndUpdate(movieId, {
      UserRatingAverage: 0,
      UserRatingCount: 0
    });
    return { averageScore: 0, reviewCount: 0 };
  }

  const { averageScore, reviewCount } = summary[0];

  await Movie.findByIdAndUpdate(movieId, {
    UserRatingAverage: Number(averageScore.toFixed(1)),
    UserRatingCount: reviewCount
  });

  return {
    averageScore: Number(averageScore.toFixed(1)),
    reviewCount
  };
}

module.exports = {
  refreshMovieReviewStats
};
