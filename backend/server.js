const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected successfully'))
  .catch((err) => console.error('MongoDB connection error:', err));

// Import routes
const authRouter = require('./routes/auth');
const meRouter = require('./routes/me');
const moviesRouter = require('./routes/movies');
const sessionsRouter = require('./routes/sessions');
const reservationsRouter = require('./routes/reservations');
const customersRouter = require('./routes/customers');
const hallsRouter = require('./routes/halls');
const seatsRouter = require('./routes/seats');
const paymentsRouter = require('./routes/payments');
const ticketsRouter = require('./routes/tickets');
const reviewsRouter = require('./routes/reviews');
const snacksRouter = require('./routes/snacks');
const posRouter = require('./routes/pos');

// Use routes
app.use('/api/auth', authRouter);
app.use('/api/me', meRouter);
app.use('/api/movies', moviesRouter);
app.use('/api/sessions', sessionsRouter);
app.use('/api/reservations', reservationsRouter);
app.use('/api/customers', customersRouter);
app.use('/api/halls', hallsRouter);
app.use('/api/seats', seatsRouter);
app.use('/api/payments', paymentsRouter);
app.use('/api/tickets', ticketsRouter);
app.use('/api/reviews', reviewsRouter);
app.use('/api/snacks', snacksRouter);
app.use('/api/pos', posRouter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Cinema Booking API is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!', 
    message: err.message 
  });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
