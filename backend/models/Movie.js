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
// Lógica para evitar datos huérfanos (HU-Catálogo)
movieSchema.pre('findOneAndDelete', async function(next) {
  const movie = await this.model.findOne(this.getQuery());
  if (movie) {
    // Elimina todas las sesiones de esta película
    await mongoose.model('MovieSession').deleteMany({ MovieID: movie._id });
    // Nota: Las reservas y tickets dependen de la sesión, 
    // podrías extender esto a los otros modelos.
  }
  next();
});

module.exports = mongoose.model('Movie', movieSchema);
