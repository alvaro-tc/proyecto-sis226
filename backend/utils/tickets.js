const QRCode = require('qrcode');

function generateTicketCode() {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 10).toUpperCase();
  return `TKT-${timestamp}-${random}`;
}

async function buildTicketPayload({ reservationId, seatId, metadata = {} }) {
  const ticketCode = generateTicketCode();
  const qrData = JSON.stringify({
    ticketCode,
    reservationId: reservationId.toString(),
    seatId: seatId.toString(),
    issueDate: new Date().toISOString(),
    ...metadata
  });

  const qrCodeImage = await QRCode.toDataURL(qrData, {
    errorCorrectionLevel: 'H',
    type: 'image/png',
    width: 300,
    margin: 1
  });

  return {
    ReservationID: reservationId,
    SeatID: seatId,
    TicketCode: ticketCode,
    QRCode: qrCodeImage,
    CheckInStatus: false
  };
}

module.exports = {
  buildTicketPayload,
  generateTicketCode
};
