const express = require("express");
const router = express.Router();

const Customer = require("../models/Customer");
const MovieSession = require("../models/MovieSession");
const Payment = require("../models/Payment");
const Reservation = require("../models/Reservation");
const Seat = require("../models/Seat");
const Ticket = require("../models/Ticket");
const { requireAuth, requireCustomer } = require("../middleware/auth");
const { buildTicketPayload } = require("../utils/tickets");

router.use(requireAuth, requireCustomer);

function ensureCustomer(req, res) {
  if (!req.user.CustomerID) {
    res
      .status(400)
      .json({ error: "Your account is not linked to a customer profile" });
    return null;
  }
  return req.user.CustomerID;
}

async function getOwnedReservationOrNull(reservationId, customerId) {
  return Reservation.findOne({
    _id: reservationId,
    CustomerID: customerId,
  })
    .populate("CustomerID")
    .populate({
      path: "SessionID",
      populate: [{ path: "MovieID" }, { path: "HallID" }],
    })
    .populate("SeatIDs");
}

async function findSoldSeatIdsForSession(
  sessionId,
  seatIds = [],
  ignoreReservationId = null,
) {
  const soldTickets = await Ticket.find({ SeatID: { $in: seatIds } }).populate(
    "ReservationID",
    "SessionID",
  );

  return soldTickets
    .filter((ticket) => ticket.ReservationID)
    .filter(
      (ticket) =>
        ticket.ReservationID._id.toString() !==
        String(ignoreReservationId || ""),
    )
    .filter(
      (ticket) =>
        ticket.ReservationID.SessionID.toString() === sessionId.toString(),
    )
    .map((ticket) => ticket.SeatID.toString());
}

function calculateReservationTotal(reservation) {
  const seatCount = reservation.SeatIDs?.length || 0;
  const sessionPrice = reservation.SessionID?.Price || 0;
  return seatCount * sessionPrice;
}

function sanitizeCardNumber(cardNumber = "") {
  return String(cardNumber).replace(/\D/g, "");
}

function isValidLuhn(cardNumber) {
  let sum = 0;
  let shouldDouble = false;

  for (let i = cardNumber.length - 1; i >= 0; i -= 1) {
    let digit = parseInt(cardNumber.charAt(i), 10);
    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    shouldDouble = !shouldDouble;
  }

  return sum % 10 === 0;
}

function isValidExpiryDate(expiryDate = "") {
  const match = String(expiryDate).match(/^(0[1-9]|1[0-2])\/(\d{2})$/);
  if (!match) return false;

  const month = parseInt(match[1], 10);
  const year = 2000 + parseInt(match[2], 10);
  const now = new Date();

  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  if (year < currentYear) return false;
  if (year === currentYear && month < currentMonth) return false;

  return true;
}

function detectCardBrand(cardNumber = "") {
  if (/^4/.test(cardNumber)) return "VISA";
  if (/^(5[1-5]|2[2-7])/.test(cardNumber)) return "MASTERCARD";
  if (/^3[47]/.test(cardNumber)) return "AMEX";
  if (/^(6011|65|64[4-9])/.test(cardNumber)) return "DISCOVER";
  return "UNKNOWN";
}

function validatePaymentPayload(payload = {}) {
  const errors = {};
  const cardholderName = String(payload.cardholderName || "").trim();
  const cardNumber = sanitizeCardNumber(payload.cardNumber);
  const expiryDate = String(payload.expiryDate || "").trim();
  const cvv = String(payload.cvv || "").trim();

  if (!cardholderName || cardholderName.length < 3) {
    errors.cardholderName = "Cardholder name must have at least 3 characters";
  }

  if (!cardNumber || cardNumber.length < 13 || cardNumber.length > 19) {
    errors.cardNumber = "Card number must contain between 13 and 19 digits";
  } else if (!isValidLuhn(cardNumber)) {
    errors.cardNumber = "Card number is invalid";
  }

  if (!isValidExpiryDate(expiryDate)) {
    errors.expiryDate = "Expiry date is invalid or already expired";
  }

  if (!/^\d{3,4}$/.test(cvv)) {
    errors.cvv = "Security code must contain 3 or 4 digits";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    sanitized: {
      cardholderName,
      cardNumber,
      expiryDate,
      cvv,
    },
  };
}

function buildSimulatedAuthorizationCode() {
  const random = Math.floor(Math.random() * 1000000)
    .toString()
    .padStart(6, "0");
  return `SIM-${random}`;
}

router.get("/profile", async (req, res) => {
  const customer = ensureCustomer(req, res);
  if (!customer) return;

  const freshCustomer = await Customer.findById(customer._id);
  res.json(freshCustomer);
});

router.get("/reservations", async (req, res) => {
  const customer = ensureCustomer(req, res);
  if (!customer) return;

  const reservations = await Reservation.find({ CustomerID: customer._id })
    .populate("CustomerID", "Name Surname Email")
    .populate({
      path: "SessionID",
      populate: [
        {
          path: "MovieID",
          select:
            "MovieName Genre PosterURL UserRatingAverage UserRatingCount Rating",
        },
        { path: "HallID", select: "HallName Capacity" },
      ],
    })
    .populate("SeatIDs")
    .sort({ CreationTime: -1 });

  res.json(reservations);
});

router.get("/reservations/:id", async (req, res) => {
  const customer = ensureCustomer(req, res);
  if (!customer) return;

  const reservation = await getOwnedReservationOrNull(
    req.params.id,
    customer._id,
  );
  if (!reservation) {
    return res.status(404).json({ error: "Reservation not found" });
  }

  res.json(reservation);
});

router.post("/reservations", async (req, res) => {
  try {
    const customer = ensureCustomer(req, res);
    if (!customer) return;

    const { SessionID, SeatIDs } = req.body;
    const uniqueSeatIds = Array.isArray(SeatIDs)
      ? [...new Set(SeatIDs.map((seatId) => seatId.toString()))]
      : [];

    if (!SessionID || uniqueSeatIds.length === 0) {
      return res
        .status(400)
        .json({ error: "SessionID and at least one seat are required" });
    }

    const session = await MovieSession.findById(SessionID)
      .populate("HallID")
      .populate("MovieID");
    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }

    const seats = await Seat.find({
      _id: { $in: uniqueSeatIds },
      HallID: session.HallID._id,
    });

    if (seats.length !== uniqueSeatIds.length) {
      return res
        .status(400)
        .json({
          error:
            "One or more selected seats do not belong to this session hall",
        });
    }

    const soldSeatIds = await findSoldSeatIdsForSession(
      session._id,
      uniqueSeatIds,
    );
    if (soldSeatIds.length > 0) {
      return res
        .status(409)
        .json({
          error: "One or more selected seats are no longer available",
          soldSeatIds,
        });
    }

    const reservation = await Reservation.create({
      CustomerID: customer._id,
      SessionID: session._id,
      SeatIDs: uniqueSeatIds,
      CreationTime: new Date(),
      Status: "CREATED",
    });

    const populatedReservation = await getOwnedReservationOrNull(
      reservation._id,
      customer._id,
    );
    res.status(201).json(populatedReservation);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.post("/reservations/:id/pay", async (req, res) => {
  try {
    const customer = ensureCustomer(req, res);
    if (!customer) return;

    const reservation = await getOwnedReservationOrNull(
      req.params.id,
      customer._id,
    );
    if (!reservation) {
      return res.status(404).json({ error: "Reservation not found" });
    }

    if (reservation.Status === "PAID") {
      return res
        .status(400)
        .json({ error: "This reservation has already been paid" });
    }

    if (!reservation.SeatIDs || reservation.SeatIDs.length === 0) {
      return res
        .status(400)
        .json({ error: "This reservation has no seats assigned" });
    }

    const seatIds = reservation.SeatIDs.map((seat) => seat._id);
    const soldSeatIds = await findSoldSeatIdsForSession(
      reservation.SessionID._id,
      seatIds,
      reservation._id,
    );
    if (soldSeatIds.length > 0) {
      return res
        .status(409)
        .json({
          error: "One or more seats are no longer available",
          soldSeatIds,
        });
    }

    const existingCompletedPayment = await Payment.findOne({
      ReservationID: reservation._id,
      PaymentStatus: "Completed",
    });

    if (existingCompletedPayment) {
      return res
        .status(400)
        .json({
          error: "A completed payment already exists for this reservation",
        });
    }

    const paymentMethod = req.body.PaymentMethod || "Credit Card";
    if (!["Credit Card", "Debit Card"].includes(paymentMethod)) {
      return res
        .status(400)
        .json({
          error: "Only credit or debit card payments are allowed in this flow",
        });
    }

    const validation = validatePaymentPayload(req.body);
    if (!validation.isValid) {
      return res.status(400).json({
        error: "Invalid payment card data",
        details: validation.errors,
      });
    }

    const shouldDecline = validation.sanitized.cardNumber.endsWith("00");
    if (shouldDecline) {
      return res.status(402).json({
        error: "Card rejected by simulated issuer",
        simulatedCode: "SIM_DECLINED_CARD",
      });
    }

    const amount = calculateReservationTotal(reservation);
    const cardBrand = detectCardBrand(validation.sanitized.cardNumber);
    const cardLast4 = validation.sanitized.cardNumber.slice(-4);
    const simulatedAuthorizationCode = buildSimulatedAuthorizationCode();

    const payment = await Payment.create({
      ReservationID: reservation._id,
      PaymentMethod: paymentMethod,
      Amount: amount,
      PaymentStatus: "Completed",
      ProcessingTime: new Date(),
      CardBrand: cardBrand,
      CardLast4: cardLast4,
      SimulatedAuthorizationCode: simulatedAuthorizationCode,
    });

    reservation.Status = "PAID";
    await reservation.save();

    const metadataBase = {
      customer: `${reservation.CustomerID.Name} ${reservation.CustomerID.Surname}`,
      movie: reservation.SessionID.MovieID.MovieName,
      hall: reservation.SessionID.HallID.HallName,
      sessionDateTime: reservation.SessionID.SessionDateTime,
    };

    const ticketsToInsert = [];
    for (const seat of reservation.SeatIDs) {
      ticketsToInsert.push(
        await buildTicketPayload({
          reservationId: reservation._id,
          seatId: seat._id,
          metadata: {
            ...metadataBase,
            seat: `${seat.RowNumber}${seat.SeatNumber}`,
          },
        }),
      );
    }

    await Ticket.insertMany(ticketsToInsert);

    const refreshedReservation = await getOwnedReservationOrNull(
      reservation._id,
      customer._id,
    );
    const tickets = await Ticket.find({ ReservationID: reservation._id })
      .populate({
        path: "ReservationID",
        populate: [
          { path: "CustomerID" },
          {
            path: "SessionID",
            populate: [{ path: "MovieID" }, { path: "HallID" }],
          },
        ],
      })
      .populate({
        path: "SeatID",
        populate: { path: "HallID" },
      })
      .sort({ createdAt: -1 });

    res.json({
      reservation: refreshedReservation,
      payment,
      tickets,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get("/reservations/:id/tickets", async (req, res) => {
  const customer = ensureCustomer(req, res);
  if (!customer) return;

  const reservation = await Reservation.findOne({
    _id: req.params.id,
    CustomerID: customer._id,
  });

  if (!reservation) {
    return res.status(404).json({ error: "Reservation not found" });
  }

  const tickets = await Ticket.find({ ReservationID: reservation._id })
    .populate({
      path: "ReservationID",
      populate: [
        { path: "CustomerID" },
        {
          path: "SessionID",
          populate: [{ path: "MovieID" }, { path: "HallID" }],
        },
      ],
    })
    .populate({
      path: "SeatID",
      populate: { path: "HallID" },
    })
    .sort({ createdAt: -1 });

  res.json(tickets);
});

router.get("/tickets", async (req, res) => {
  const customer = ensureCustomer(req, res);
  if (!customer) return;

  const reservations = await Reservation.find({
    CustomerID: customer._id,
  }).select("_id");
  const reservationIds = reservations.map((reservation) => reservation._id);

  const tickets = await Ticket.find({ ReservationID: { $in: reservationIds } })
    .populate({
      path: "ReservationID",
      populate: [
        { path: "CustomerID" },
        {
          path: "SessionID",
          populate: [{ path: "MovieID" }, { path: "HallID" }],
        },
      ],
    })
    .populate({
      path: "SeatID",
      populate: { path: "HallID" },
    })
    .sort({ createdAt: -1 });

  res.json(tickets);
});

router.get("/tickets/:id", async (req, res) => {
  const customer = ensureCustomer(req, res);
  if (!customer) return;

  const ticket = await Ticket.findById(req.params.id)
    .populate({
      path: "ReservationID",
      populate: [
        { path: "CustomerID" },
        {
          path: "SessionID",
          populate: [{ path: "MovieID" }, { path: "HallID" }],
        },
      ],
    })
    .populate({
      path: "SeatID",
      populate: { path: "HallID" },
    });

  if (
    !ticket ||
    !ticket.ReservationID ||
    ticket.ReservationID.CustomerID._id.toString() !== customer._id.toString()
  ) {
    return res.status(404).json({ error: "Ticket not found" });
  }

  res.json(ticket);
});

module.exports = router;
