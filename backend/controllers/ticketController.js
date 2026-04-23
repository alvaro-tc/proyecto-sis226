const QRCode = require('qrcode'); // Asegúrate de correr 'npm install qrcode'
const Ticket = require('../models/Ticket');

exports.createTicket = async (reservationId, seatId) => {
  try {
    // 1. Generar código único TKT-{timestamp}-{random}
    const ticketCode = `TKT-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

    // 2. Generar imagen QR en formato Base64
    const qrImage = await QRCode.toDataURL(ticketCode);

    // 3. Crear el ticket en la base de datos
    const newTicket = new Ticket({
      ReservationID: reservationId,
      SeatID: seatId,
      TicketCode: ticketCode,
      QRCode: qrImage,
      CheckInStatus: false
    });

    return await newTicket.save();
  } catch (error) {
    console.error("Error al generar el ticket:", error);
    throw error;
  }
};