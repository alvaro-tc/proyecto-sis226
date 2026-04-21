'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { reservationsApi, ticketsApi, seatsApi } from '@/lib/api';
import { Reservation, Ticket, Seat } from '@/lib/types';
import LoadingSpinner from '@/components/LoadingSpinner';
import toast from 'react-hot-toast';

export default function ReservationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const reservationId = params.id as string;

  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [seats, setSeats] = useState<Seat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [reservationId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch reservation
      const reservationRes = await reservationsApi.getById(reservationId);
      setReservation(reservationRes.data);

      // Fetch tickets for this reservation
      const ticketsRes = await ticketsApi.getAll();
      const reservationTickets = ticketsRes.data.filter((ticket: Ticket) => 
        (typeof ticket.ReservationID === 'object' ? ticket.ReservationID._id : ticket.ReservationID) === reservationId
      );
      setTickets(reservationTickets);

      // Fetch seats from localStorage or API
      const storedSeats = localStorage.getItem(`reservation_${reservationId}_seats`);
      if (storedSeats) {
        const seatIds = JSON.parse(storedSeats);
        const allSeatsRes = await seatsApi.getAll();
        const reservationSeats = allSeatsRes.data.filter((seat: Seat) => 
          seatIds.includes(seat._id)
        );
        setSeats(reservationSeats);
      } else if (reservationRes.data.SeatIDs?.length) {
        const seatIds = reservationRes.data.SeatIDs.map((seat: Seat | string) =>
          typeof seat === 'object' ? seat._id : seat
        );
        const allSeatsRes = await seatsApi.getAll();
        const reservationSeats = allSeatsRes.data.filter((seat: Seat) => 
          seatIds.includes(seat._id)
        );
        setSeats(reservationSeats);
      } else {
        // If not in localStorage, get seats from tickets
        const seatIds = reservationTickets.map((ticket: Ticket) => 
          typeof ticket.SeatID === 'object' ? ticket.SeatID._id : ticket.SeatID
        );
        const allSeatsRes = await seatsApi.getAll();
        const reservationSeats = allSeatsRes.data.filter((seat: Seat) => 
          seatIds.includes(seat._id)
        );
        setSeats(reservationSeats);
      }
    } catch (error) {
      toast.error('No se pudieron cargar los detalles de la reserva');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (dateTime: string) => {
    return new Date(dateTime).toLocaleString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status: string) => {
    const statusStyles = {
      CREATED: 'bg-blue-100 text-blue-800',
      PAID: 'bg-green-100 text-green-800',
      CANCELLED: 'bg-red-100 text-red-800',
    };
    const labels: Record<string, string> = {
      CREATED: 'CREADA',
      PAID: 'PAGADA',
      CANCELLED: 'CANCELADA',
    };
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusStyles[status as keyof typeof statusStyles] || 'bg-gray-100 text-gray-800'}`}>
        {labels[status] || status}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!reservation) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Reserva No Encontrada</h1>
          <button
            onClick={() => router.push('/admin/reservations')}
            className="text-blue-600 hover:text-blue-800"
          >
            ← Volver a Reservas
          </button>
        </div>
      </div>
    );
  }

  const customer = typeof reservation.CustomerID === 'object' ? reservation.CustomerID : null;
  const session = typeof reservation.SessionID === 'object' ? reservation.SessionID : null;
  const movie = session && typeof session.MovieID === 'object' ? session.MovieID : null;
  const hall = session && typeof session.HallID === 'object' ? session.HallID : null;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => router.push('/admin/reservations')}
          className="text-blue-600 hover:text-blue-800 mb-2 flex items-center gap-1"
        >
          ← Volver a Reservas
        </button>
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Detalles de la Reserva</h1>
          {getStatusBadge(reservation.Status)}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Information */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Información del Cliente
            </h2>
            {customer ? (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Nombre</p>
                  <p className="text-base font-medium text-gray-900">{customer.Name} {customer.Surname}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Correo Electrónico</p>
                  <p className="text-base font-medium text-gray-900">{customer.Email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Teléfono</p>
                  <p className="text-base font-medium text-gray-900">{customer.PhoneNumber}</p>
                </div>
              </div>
            ) : (
              <p className="text-gray-500">Información del cliente no disponible</p>
            )}
          </div>

          {/* Movie & Session Information */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
              </svg>
              Película y Función
            </h2>
            {movie && session && hall ? (
              <div className="space-y-4">
                <div className="flex gap-4">
                  {movie.PosterURL && (
                    <img
                      src={movie.PosterURL}
                      alt={movie.MovieName}
                      className="w-24 h-36 object-cover rounded-lg shadow"
                      onError={(e) => e.currentTarget.style.display = 'none'}
                    />
                  )}
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900">{movie.MovieName}</h3>
                    <p className="text-sm text-gray-600 mb-2">{movie.Genre} • {movie.Duration} min</p>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-gray-600">Sala:</span>
                        <span className="ml-2 font-medium">{hall.HallName}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Idioma:</span>
                        <span className="ml-2 font-medium">{session.Language}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Fecha y Hora:</span>
                        <span className="ml-2 font-medium">{formatDateTime(session.SessionDateTime)}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Precio por asiento:</span>
                        <span className="ml-2 font-medium text-green-600">${session.Price}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-gray-500">Información de la función no disponible</p>
            )}
          </div>

          {/* Seats Information */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
              </svg>
              Asientos Seleccionados ({seats.length})
            </h2>
            {seats.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {seats.map((seat) => (
                  <div
                    key={seat._id}
                    className="bg-gradient-to-br from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-3"
                  >
                    <div className="text-center">
                      <div className="text-lg font-bold text-gray-900">
                        {seat.RowNumber}{seat.SeatNumber}
                      </div>
                      <div className="text-xs text-gray-600 mt-1">{seat.ScreenViewInfo}</div>
                      <div className="text-xs text-gray-500">{seat.AcousticProfile}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">Sin asientos seleccionados</p>
            )}
          </div>

          {/* Tickets */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
              </svg>
              Tickets ({tickets.length})
            </h2>
            {tickets.length > 0 ? (
              <div className="space-y-4">
                {tickets.map((ticket) => {
                  const ticketSeat = typeof ticket.SeatID === 'object' ? ticket.SeatID : 
                    seats.find(s => s._id === ticket.SeatID);
                  
                  return (
                    <div
                      key={ticket._id}
                      className="border border-gray-200 rounded-lg p-4 flex items-center gap-4 hover:bg-gray-50 transition-colors"
                    >
                      {/* Código QR */}
                      <div className="flex-shrink-0">
                        {ticket.QRCode && (
                          <img
                            src={ticket.QRCode}
                            alt={`Código QR para ${ticket.TicketCode}`}
                            className="w-24 h-24 border border-gray-300 rounded"
                          />
                        )}
                      </div>

                      {/* Información del Ticket */}
                      <div className="flex-1">
                        <div className="text-sm font-mono font-semibold text-gray-900 mb-1">
                          {ticket.TicketCode}
                        </div>
                        {ticketSeat && (
                          <div className="text-sm text-gray-600">
                            Asiento: <span className="font-medium">{ticketSeat.RowNumber}{ticketSeat.SeatNumber}</span>
                          </div>
                        )}
                        <div className="text-xs text-gray-500 mt-1">
                          Estado: {ticket.CheckInStatus ?
                            <span className="text-green-600 font-semibold">✓ Registrado</span> :
                            <span className="text-yellow-600 font-semibold">○ No Registrado</span>
                          }
                        </div>
                      </div>

                      {/* Botón Ver */}
                      <button
                        onClick={() => window.open(`/my-ticket/${ticket._id}`, '_blank')}
                        className="flex-shrink-0 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
                      >
                        Ver Ticket
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-2">Aún no se han generado tickets</p>
                <p className="text-xs text-gray-400">
                  Los tickets se generarán automáticamente cuando el pago se marque como "Completado"
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Summary */}
        <div className="space-y-6">
          {/* Reservation Summary */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Resumen</h2>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">ID de Reserva</span>
                <span className="font-mono text-xs text-gray-900">{reservation._id.slice(-8)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Creada</span>
                <span className="font-medium text-gray-900">{formatDateTime(reservation.CreationTime)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Estado</span>
                <span>{getStatusBadge(reservation.Status)}</span>
              </div>
              <hr className="my-3" />
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Cantidad de Asientos</span>
                <span className="font-semibold text-gray-900">{seats.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Precio por Asiento</span>
                <span className="font-semibold text-gray-900">
                  ${session ? session.Price : 0}
                </span>
              </div>
              <hr className="my-3" />
              <div className="flex justify-between text-base">
                <span className="font-bold text-gray-900">Monto Total</span>
                <span className="font-bold text-green-600">
                  ${session ? (session.Price * seats.length).toFixed(2) : '0.00'}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Acciones Rápidas</h2>
            <div className="space-y-2">
              <button
                onClick={() => router.push('/admin/payments')}
                className="w-full px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Gestionar Pagos
              </button>
              <button
                onClick={() => router.push('/admin/reservations')}
                className="w-full px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg text-sm font-medium transition-colors"
              >
                Volver al Listado
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
