const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const Customer = require('./models/Customer');
const Movie = require('./models/Movie');
const Hall = require('./models/Hall');
const Seat = require('./models/Seat');
const MovieSession = require('./models/MovieSession');
const Reservation = require('./models/Reservation');
const Payment = require('./models/Payment');
const Ticket = require('./models/Ticket');
const User = require('./models/User');
const Review = require('./models/Review');
const { refreshMovieReviewStats } = require('./utils/movieRatings');
const { generateTicketCode } = require('./utils/tickets');

const seedDatabase = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected');

    // Clear existing data
    await Customer.deleteMany({});
    await Movie.deleteMany({});
    await Hall.deleteMany({});
    await Seat.deleteMany({});
    await MovieSession.deleteMany({});
    await Reservation.deleteMany({});
    await Payment.deleteMany({});
    await Ticket.deleteMany({});
    await Review.deleteMany({});
    await User.deleteMany({});
    console.log('Cleared existing data');

    // INSERT CUSTOMERS (3 records)
    const customers = await Customer.insertMany([
      {
        Name: 'Ahmet',
        Surname: 'Yilmaz',
        Email: 'ahmet@email.com',
        PhoneNumber: '5551234567'
      },
      {
        Name: 'Ayse',
        Surname: 'Kaya',
        Email: 'ayse@email.com',
        PhoneNumber: '5559876543'
      },
      {
        Name: 'Mehmet',
        Surname: 'Demir',
        Email: 'mehmet@email.com',
        PhoneNumber: '5555555555'
      }
    ]);
    console.log('Seeded customers:', customers.length);

    const customerPasswordHash = await bcrypt.hash('demo123', 10);

    await User.insertMany([
      {
        Username: 'ahmet',
        Email: customers[0].Email,
        PasswordHash: customerPasswordHash,
        Role: 'CUSTOMER',
        CustomerID: customers[0]._id
      },
      {
        Username: 'ayse',
        Email: customers[1].Email,
        PasswordHash: customerPasswordHash,
        Role: 'CUSTOMER',
        CustomerID: customers[1]._id
      },
      {
        Username: 'mehmet',
        Email: customers[2].Email,
        PasswordHash: customerPasswordHash,
        Role: 'CUSTOMER',
        CustomerID: customers[2]._id
      },
      {
        Username: 'demo',
        Email: 'admin@cinebook.local',
        PasswordHash: await bcrypt.hash('demo', 10),
        Role: 'ADMIN'
      }
    ]);
    console.log('Seeded users: 4');

    // INSERT MOVIES (3 records with poster URLs and details)
    const movies = await Movie.insertMany([
      {
        MovieName: 'Inception',
        Genre: 'Sci-Fi',
        Duration: 148,
        AgeLimit: 13,
        Description: 'A thief who steals secrets through dreams',
        PosterURL: 'https://image.tmdb.org/t/p/w500/9gk7adHYeDvHkCSEqAvQNLV5Uge.jpg',
        Director: 'Christopher Nolan',
        Cast: ['Leonardo DiCaprio', 'Joseph Gordon-Levitt', 'Ellen Page', 'Tom Hardy'],
        Rating: 8.8,
        TrailerURL: 'https://www.youtube.com/watch?v=YoHD9XEInc0'
      },
      {
        MovieName: 'The Dark Knight',
        Genre: 'Action',
        Duration: 152,
        AgeLimit: 13,
        Description: 'Batman faces the Joker',
        PosterURL: 'https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg',
        Director: 'Christopher Nolan',
        Cast: ['Christian Bale', 'Heath Ledger', 'Aaron Eckhart', 'Michael Caine'],
        Rating: 9.0,
        TrailerURL: 'https://www.youtube.com/watch?v=EXeTwQWrcwY'
      },
      {
        MovieName: 'Interstellar',
        Genre: 'Sci-Fi',
        Duration: 169,
        AgeLimit: 13,
        Description: 'Space exploration through wormhole',
        PosterURL: 'https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg',
        Director: 'Christopher Nolan',
        Cast: ['Matthew McConaughey', 'Anne Hathaway', 'Jessica Chastain', 'Michael Caine'],
        Rating: 8.6,
        TrailerURL: 'https://www.youtube.com/watch?v=zSWdZVtXT7E'
      }
    ]);
    console.log('Seeded movies:', movies.length);

    // INSERT HALLS (3 records)
    const halls = await Hall.insertMany([
      {
        HallName: 'Hall A',
        Capacity: 150
      },
      {
        HallName: 'Hall B',
        Capacity: 200
      },
      {
        HallName: 'Hall C',
        Capacity: 100
      }
    ]);
    console.log('Seeded halls:', halls.length);

    // INSERT SEATS - Auto-generate based on hall capacity
    const seatsToInsert = [];
    
    // Function to generate seats for a hall
    const generateSeatsForHall = (hallId, capacity) => {
      const seatsPerRow = 15; // 15 seats per row
      const totalRows = Math.ceil(capacity / seatsPerRow);
      const rowLetters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      
      for (let rowIndex = 0; rowIndex < totalRows; rowIndex++) {
        const rowLetter = rowLetters[rowIndex] || `${rowLetters[Math.floor(rowIndex / 26)]}${rowLetters[rowIndex % 26]}`;
        const seatsInThisRow = Math.min(seatsPerRow, capacity - (rowIndex * seatsPerRow));
        
        for (let seatNum = 1; seatNum <= seatsInThisRow; seatNum++) {
          // Determine quality based on position
          let viewQuality, acousticQuality;
          
          // Front rows (first 20%)
          if (rowIndex < totalRows * 0.2) {
            viewQuality = seatNum >= 5 && seatNum <= 11 ? 'Good' : 'Average';
            acousticQuality = 'Average';
          }
          // Middle rows (20-70%)
          else if (rowIndex < totalRows * 0.7) {
            if (seatNum >= 4 && seatNum <= 12) {
              viewQuality = 'Excellent';
              acousticQuality = 'Excellent';
            } else if (seatNum >= 3 && seatNum <= 13) {
              viewQuality = 'Good';
              acousticQuality = 'Good';
            } else {
              viewQuality = 'Average';
              acousticQuality = 'Average';
            }
          }
          // Back rows (70-100%)
          else {
            viewQuality = seatNum >= 5 && seatNum <= 11 ? 'Good' : 'Average';
            acousticQuality = seatNum >= 4 && seatNum <= 12 ? 'Good' : 'Average';
          }
          
          seatsToInsert.push({
            HallID: hallId,
            RowNumber: rowLetter,
            SeatNumber: seatNum,
            ScreenViewInfo: viewQuality,
            AcousticProfile: acousticQuality
          });
        }
      }
    };
    
    // Generate seats for each hall
    generateSeatsForHall(halls[0]._id, halls[0].Capacity); // Hall A - 150 seats
    generateSeatsForHall(halls[1]._id, halls[1].Capacity); // Hall B - 200 seats
    generateSeatsForHall(halls[2]._id, halls[2].Capacity); // Hall C - 100 seats
    
    const seats = await Seat.insertMany(seatsToInsert);
    console.log('Seeded seats:', seats.length);

    const getSeatByPosition = (hallId, rowNumber, seatNumber) =>
      seats.find((seat) =>
        seat.HallID.toString() === hallId.toString() &&
        seat.RowNumber === rowNumber &&
        seat.SeatNumber === seatNumber
      );

    // INSERT SESSIONS (4 records)
    const sessions = await MovieSession.insertMany([
      {
        MovieID: movies[0]._id, // Inception
        HallID: halls[0]._id, // Hall A
        SessionDateTime: new Date('2025-12-20T14:00:00'),
        Price: 50,
        Language: 'English',
        SubtitleInfo: 'Turkish'
      },
      {
        MovieID: movies[1]._id, // The Dark Knight
        HallID: halls[1]._id, // Hall B
        SessionDateTime: new Date('2025-12-20T17:00:00'),
        Price: 60,
        Language: 'English',
        SubtitleInfo: 'Turkish'
      },
      {
        MovieID: movies[2]._id, // Interstellar
        HallID: halls[0]._id, // Hall A
        SessionDateTime: new Date('2025-12-20T20:00:00'),
        Price: 55,
        Language: 'English',
        SubtitleInfo: 'None'
      },
      {
        MovieID: movies[0]._id, // Inception
        HallID: halls[2]._id, // Hall C
        SessionDateTime: new Date('2025-12-21T15:00:00'),
        Price: 45,
        Language: 'Turkish',
        SubtitleInfo: 'None'
      }
    ]);
    console.log('Seeded sessions:', sessions.length);

    // INSERT RESERVATIONS (4 records)
    const reservations = await Reservation.insertMany([
      {
        CustomerID: customers[0]._id, // Ahmet
        SessionID: sessions[0]._id, // Inception - Hall A
        SeatIDs: [getSeatByPosition(halls[0]._id, 'A', 1)._id],
        CreationTime: new Date('2025-12-15T10:30:00'),
        Status: 'PAID'
      },
      {
        CustomerID: customers[1]._id, // Ayse
        SessionID: sessions[1]._id, // The Dark Knight - Hall B
        SeatIDs: [
          getSeatByPosition(halls[1]._id, 'A', 1)._id,
          getSeatByPosition(halls[1]._id, 'A', 2)._id
        ],
        CreationTime: new Date('2025-12-16T14:20:00'),
        Status: 'PAID'
      },
      {
        CustomerID: customers[2]._id, // Mehmet
        SessionID: sessions[2]._id, // Interstellar - Hall A
        SeatIDs: [getSeatByPosition(halls[0]._id, 'B', 5)._id],
        CreationTime: new Date('2025-12-17T09:00:00'),
        Status: 'CREATED'
      },
      {
        CustomerID: customers[0]._id, // Ahmet
        SessionID: sessions[3]._id, // Inception - Hall C
        SeatIDs: [getSeatByPosition(halls[2]._id, 'A', 1)._id],
        CreationTime: new Date('2025-12-18T11:00:00'),
        Status: 'PAID'
      }
    ]);
    console.log('Seeded reservations:', reservations.length);

    // INSERT PAYMENTS (3 records - only for PAID reservations)
    const payments = await Payment.insertMany([
      {
        ReservationID: reservations[0]._id,
        PaymentMethod: 'Credit Card',
        Amount: 50,
        PaymentStatus: 'Completed',
        ProcessingTime: new Date('2025-12-15T10:31:00')
      },
      {
        ReservationID: reservations[1]._id,
        PaymentMethod: 'Debit Card',
        Amount: 120, // 2 seats × 60
        PaymentStatus: 'Completed',
        ProcessingTime: new Date('2025-12-16T14:21:00')
      },
      {
        ReservationID: reservations[3]._id,
        PaymentMethod: 'Credit Card',
        Amount: 45,
        PaymentStatus: 'Completed',
        ProcessingTime: new Date('2025-12-18T11:01:00')
      }
    ]);
    console.log('Seeded payments:', payments.length);

    // INSERT TICKETS (4 records) with realistic QR codes
    const QRCode = require('qrcode');

    // Create tickets with detailed QR code data
    const ticketData = [
      {
        ReservationID: reservations[0]._id,
        SeatID: getSeatByPosition(halls[0]._id, 'A', 1)._id,
        CustomerName: customers[0].Name + ' ' + customers[0].Surname,
        MovieName: movies[0].MovieName,
        HallName: halls[0].HallName,
        SeatInfo: 'A1'
      },
      {
        ReservationID: reservations[1]._id,
        SeatID: getSeatByPosition(halls[1]._id, 'A', 1)._id,
        CustomerName: customers[1].Name + ' ' + customers[1].Surname,
        MovieName: movies[1].MovieName,
        HallName: halls[1].HallName,
        SeatInfo: 'A1'
      },
      {
        ReservationID: reservations[1]._id,
        SeatID: getSeatByPosition(halls[1]._id, 'A', 2)._id,
        CustomerName: customers[1].Name + ' ' + customers[1].Surname,
        MovieName: movies[1].MovieName,
        HallName: halls[1].HallName,
        SeatInfo: 'A2'
      },
      {
        ReservationID: reservations[3]._id,
        SeatID: getSeatByPosition(halls[2]._id, 'A', 1)._id,
        CustomerName: customers[0].Name + ' ' + customers[0].Surname,
        MovieName: movies[0].MovieName,
        HallName: halls[2].HallName,
        SeatInfo: 'A1'
      }
    ];

    const ticketsToInsert = [];
    
    for (let i = 0; i < ticketData.length; i++) {
      const data = ticketData[i];
      const ticketCode = generateTicketCode();
      
      // Create comprehensive QR code data
      const qrData = JSON.stringify({
        ticketCode: ticketCode,
        reservationId: data.ReservationID.toString(),
        customer: data.CustomerName,
        movie: data.MovieName,
        hall: data.HallName,
        seat: data.SeatInfo,
        issueDate: new Date().toISOString()
      });
      
      // Generate QR code as base64 image
      const qrCodeImage = await QRCode.toDataURL(qrData, {
        errorCorrectionLevel: 'H',
        type: 'image/png',
        width: 300,
        margin: 1
      });
      
      ticketsToInsert.push({
        ReservationID: data.ReservationID,
        SeatID: data.SeatID,
        TicketCode: ticketCode,
        QRCode: qrCodeImage,
        CheckInStatus: i === 1 || i === 2 ? true : false
      });
      
      console.log(`Generated ticket: ${ticketCode} for ${data.CustomerName}`);
    }

    const tickets = await Ticket.insertMany(ticketsToInsert);
    console.log('Seeded tickets:', tickets.length);

    const reviews = await Review.insertMany([
      {
        CustomerID: customers[0]._id,
        MovieID: movies[0]._id,
        ReservationID: reservations[0]._id,
        Score: 5,
        Comment: 'Una experiencia increíble. La volvería a ver sin dudarlo.'
      },
      {
        CustomerID: customers[1]._id,
        MovieID: movies[1]._id,
        ReservationID: reservations[1]._id,
        Score: 4,
        Comment: 'Muy buena película y el sonido estuvo excelente.'
      }
    ]);
    console.log('Seeded reviews:', reviews.length);

    await refreshMovieReviewStats(movies[0]._id);
    await refreshMovieReviewStats(movies[1]._id);

    console.log('\n✅ Database seeded successfully!');
    console.log('-----------------------------------');
    console.log(`Customers: ${customers.length}`);
    console.log(`Movies: ${movies.length}`);
    console.log(`Halls: ${halls.length}`);
    console.log(`Seats: ${seats.length}`);
    console.log(`Sessions: ${sessions.length}`);
    console.log(`Reservations: ${reservations.length}`);
    console.log(`Payments: ${payments.length}`);
    console.log(`Tickets: ${tickets.length}`);
    console.log(`Reviews: ${reviews.length}`);
    console.log('Admin login: demo / demo');
    console.log('Customer login example: ahmet@email.com / demo123');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();
