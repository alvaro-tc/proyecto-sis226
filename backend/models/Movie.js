const mongoose = require('mongoose');

const movieSchema = new mongoose.Schema({
  MovieName: {
    type: String,
    required: true,
    trim: true
  },
  Genre: {
    type: String,
    required: true,
    trim: true
  },
  Duration: {
    type: Number,
    required: true,
    min: 1
  },
  AgeLimit: {
    type: Number,
    required: true,
    min: 0
  },
  Description: {
    type: String,
    required: true,
    trim: true
  },
  PosterURL: {
    type: String,
    required: true,
    trim: true
  },
  Director: {
    type: String,
    required: true,
    trim: true
  },
  Cast: {
    type: [String],
    required: true
  },
  Rating: {
    type: Number,
    required: true,
    min: 0,
    max: 10
  },
  UserRatingAverage: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  UserRatingCount: {
    type: Number,
    default: 0,
    min: 0
  },
  TrailerURL: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Movie', movieSchema);
