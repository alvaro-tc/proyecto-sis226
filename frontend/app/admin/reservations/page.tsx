'use client';

import { useState, useEffect } from 'react';
import { reservationsApi, customersApi, sessionsApi, seatsApi, ticketsApi } from '@/lib/api';
import { Reservation, Customer, MovieSession, Seat } from '@/lib/types';
import Modal from '@/components/Modal';
import ConfirmDialog from '@/components/ConfirmDialog';
import LoadingSpinner from '@/components/LoadingSpinner';
import SeatGrid from '@/components/SeatGrid';
import SeatPreview from '@/components/SeatPreview';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function ReservationsPage() {
  const router = useRouter();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [sessions, setSessions] = useState<MovieSession[]>([]);
  const [seats, setSeats] = useState<Seat[]>([]);
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [reservedSeats, setReservedSeats] = useState<string[]>([]);
  const [hoveredSeat, setHoveredSeat] = useState<Seat | null>(null);
  const [selectedSession, setSelectedSession] = useState<MovieSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSeatSelectionModalOpen, setIsSeatSelectionModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [reservationToDelete, setReservationToDelete] = useState<Reservation | null>(null);

  const [formData, setFormData] = useState({
    CustomerID: '',
    SessionID: '',
    Status: 'CREATED' as 'CREATED' | 'PAID' | 'CANCELLED',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [reservationsRes, customersRes, sessionsRes] = await Promise.all([
        reservationsApi.getAll(),
        customersApi.getAll(),
        sessionsApi.getAll(),
      ]);
      setReservations(reservationsRes.data);
      setCustomers(customersRes.data);
      setSessions(sessionsRes.data);
    } catch (error) {
      toast.error('No se pudieron cargar los datos');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (reservation?: Reservation) => {
    if (reservation) {
      setSelectedReservation(reservation);
      setFormData({
        CustomerID: typeof reservation.CustomerID === 'object' ? reservation.CustomerID._id : reservation.CustomerID,
        SessionID: typeof reservation.SessionID === 'object' ? reservation.SessionID._id : reservation.SessionID,
        Status: reservation.Status,
      });
    } else {
      setSelectedReservation(null);
      setFormData({
        CustomerID: '',
        SessionID: '',
        Status: 'CREATED',
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedReservation(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (selectedReservation) {
        await reservationsApi.update(selectedReservation._id, formData);
        toast.success('Reserva actualizada correctamente');
        handleCloseModal();
        fetchData();
      } else {
        // Para nuevas reservas, continuar con la selección de asientos
        if (!formData.SessionID) {
          toast.error('Por favor selecciona una función');
          return;
        }

        // Obtener asientos de la sala de la función seleccionada
        const session = sessions.find(s => s._id === formData.SessionID);
        if (!session) {
          toast.error('Función no encontrada');
          return;
        }
        
        setSelectedSession(session);
        const hallId = typeof session.HallID === 'object' ? session.HallID._id : session.HallID;
        const seatsRes = await seatsApi.getAll(hallId);
        setSeats(seatsRes.data);
        
        // Fetch already reserved seats for this session
        const allTickets = await ticketsApi.getAll();
        const sessionReservedSeats = allTickets.data
          .filter((ticket: any) => {
            const ticketSession = ticket.ReservationID?.SessionID;
            const sessionId = typeof ticketSession === 'object' ? ticketSession._id : ticketSession;
            return sessionId === formData.SessionID;
          })
          .map((ticket: any) => typeof ticket.SeatID === 'object' ? ticket.SeatID._id : ticket.SeatID);
        
        setReservedSeats(sessionReservedSeats);
        setSelectedSeats([]);
        setIsModalOpen(false);
        setIsSeatSelectionModalOpen(true);
      }
    } catch (error) {
      toast.error('La operación falló');
      console.error(error);
    }
  };

  const handleSeatClick = (seatId: string) => {
    setSelectedSeats(prev => 
      prev.includes(seatId) 
        ? prev.filter(id => id !== seatId)
        : [...prev, seatId]
    );
  };

  const handleConfirmReservation = async () => {
    if (selectedSeats.length === 0) {
      toast.error('Por favor selecciona al menos un asiento');
      return;
    }

    try {
      // Crear reserva con los asientos seleccionados guardados
      const reservationData = {
        ...formData,
        SeatIDs: selectedSeats,
      };

      const reservationRes = await reservationsApi.create(reservationData);
      const newReservation = reservationRes.data;

      // Guardar asientos seleccionados temporalmente en localStorage (para generar tickets tras el pago)
      localStorage.setItem(`reservation_${newReservation._id}_seats`, JSON.stringify(selectedSeats));

      toast.success(`¡Reserva creada! Procesa el pago para generar los tickets.`);
      setIsSeatSelectionModalOpen(false);
      fetchData();
    } catch (error) {
      toast.error('No se pudo completar la reserva');
      console.error(error);
    }
  };

  const handleDeleteClick = (reservation: Reservation) => {
    setReservationToDelete(reservation);
    setIsConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!reservationToDelete) return;

    try {
      await reservationsApi.delete(reservationToDelete._id);
      toast.success('Reserva eliminada correctamente');
      fetchData();
    } catch (error) {
      toast.error('No se pudo eliminar la reserva');
      console.error(error);
    } finally {
      setIsConfirmOpen(false);
      setReservationToDelete(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      CREATED: 'bg-yellow-100 text-yellow-800',
      PAID: 'bg-green-100 text-green-800',
      CANCELLED: 'bg-red-100 text-red-800',
    };

    const labels: Record<string, string> = {
      CREATED: 'CREADA',
      PAID: 'PAGADA',
      CANCELLED: 'CANCELADA',
    };

    return (
      <span
        className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
          styles[status as keyof typeof styles]
        }`}
      >
        {labels[status] || status}
      </span>
    );
  };

  const formatDateTime = (dateTime: string) => {
    const date = new Date(dateTime);
    return date.toLocaleString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getCustomerName = (customer: Customer | string) => {
    if (typeof customer === 'object') {
      return `${customer.Name} ${customer.Surname}`;
    }
    return 'Desconocido';
  };

  const getMovieName = (session: MovieSession | string) => {
    if (typeof session === 'object' && typeof session.MovieID === 'object') {
      return session.MovieID.MovieName;
    }
    return 'Desconocido';
  };

  const getSessionDateTime = (session: MovieSession | string) => {
    if (typeof session === 'object') {
      return formatDateTime(session.SessionDateTime);
    }
    return 'Desconocido';
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Reservas</h1>
        <button
          onClick={() => handleOpenModal()}
          className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          + Agregar Reserva
        </button>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cliente
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Película
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Horario de Función
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Creada
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {reservations.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                      No se encontraron reservas. ¡Agrega tu primera reserva!
                    </td>
                  </tr>
                ) : (
                  reservations.map((reservation) => (
                    <tr key={reservation._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {getCustomerName(reservation.CustomerID)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {getMovieName(reservation.SessionID)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {getSessionDateTime(reservation.SessionID)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {formatDateTime(reservation.CreationTime)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {getStatusBadge(reservation.Status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Link
                          href={`/admin/reservations/${reservation._id}`}
                          className="text-purple-600 hover:text-purple-900 mr-4"
                        >
                          Ver Detalles
                        </Link>
                        <button
                          onClick={() => handleOpenModal(reservation)}
                          className="text-blue-600 hover:text-blue-900 mr-4"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleDeleteClick(reservation)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={selectedReservation ? 'Editar Reserva' : 'Agregar Nueva Reserva'}
      >
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cliente
              </label>
              <select
                required
                value={formData.CustomerID}
                onChange={(e) => setFormData({ ...formData, CustomerID: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                disabled={!!selectedReservation}
              >
                <option value="">Selecciona un cliente</option>
                {customers.map((customer) => (
                  <option key={customer._id} value={customer._id}>
                    {customer.Name} {customer.Surname} ({customer.Email})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Función
              </label>
              <select
                required
                value={formData.SessionID}
                onChange={(e) => setFormData({ ...formData, SessionID: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                disabled={!!selectedReservation}
              >
                <option value="">Selecciona una función</option>
                {sessions.map((session) => (
                  <option key={session._id} value={session._id}>
                    {typeof session.MovieID === 'object' ? session.MovieID.MovieName : 'Película'} -{' '}
                    {formatDateTime(session.SessionDateTime)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Estado
              </label>
              <select
                required
                value={formData.Status}
                onChange={(e) => setFormData({ ...formData, Status: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="CREATED">CREADA</option>
                <option value="PAID">PAGADA</option>
                <option value="CANCELLED">CANCELADA</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={handleCloseModal}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md"
            >
              {selectedReservation ? 'Actualizar' : 'Crear'} Reserva
            </button>
          </div>
        </form>
      </Modal>

      {/* Seat Selection Modal */}
      <Modal
        isOpen={isSeatSelectionModalOpen}
        onClose={() => {
          setIsSeatSelectionModalOpen(false);
          setHoveredSeat(null);
        }}
        title={`Seleccionar Asientos - ${selectedSession && typeof selectedSession.MovieID === 'object' ? selectedSession.MovieID.MovieName : 'Película'}`}
        size="full"
      >
        <div className="mb-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-4 border border-purple-200">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-gray-700 mb-1">
                <strong className="text-purple-700">Asientos Seleccionados:</strong> {selectedSeats.length}
              </p>
              <p className="text-sm text-gray-600">
                Haz clic en los asientos disponibles para seleccionarlos. Pasa el cursor sobre un asiento para ver la vista y el perfil acústico.
              </p>
            </div>
            {selectedSession && typeof selectedSession.HallID === 'object' && (
              <div className="text-right">
                <p className="text-sm font-medium text-gray-700">{selectedSession.HallID.HallName}</p>
                <p className="text-xs text-gray-500">Capacidad: {selectedSession.HallID.Capacity}</p>
              </div>
            )}
          </div>
        </div>

        {/* Two Column Layout: Seat Grid + Preview - FIXED HEIGHT */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" style={{ minHeight: '700px', maxHeight: '70vh' }}>
          {/* Seat Grid Column */}
          <div className="order-2 lg:order-1 h-full">
            <div className="bg-gray-50 rounded-lg p-4 overflow-y-auto h-full">
              <h3 className="text-lg font-semibold mb-3 text-gray-900">Selecciona tus Asientos</h3>
              <SeatGrid
                seats={seats}
                selectedSeats={selectedSeats}
                onSeatClick={handleSeatClick}
                onSeatHover={setHoveredSeat}
                reservedSeats={reservedSeats}
              />
            </div>
          </div>

          {/* Preview Column - FIXED HEIGHT */}
          <div className="order-1 lg:order-2 h-full">
            <div className="bg-white rounded-lg border-2 border-purple-300 p-4 shadow-lg overflow-y-auto h-full">
              {hoveredSeat ? (
                <>
                  <div className="mb-4 pb-3 border-b border-gray-200">
                    <h4 className="text-xl font-bold text-gray-900">
                      Fila {hoveredSeat.RowNumber}, Asiento {hoveredSeat.SeatNumber}
                    </h4>
                    <p className="text-sm text-gray-600 mt-1">
                      Pasa el cursor sobre los asientos para comparar la calidad
                    </p>
                  </div>
                  <div>
                    <SeatPreview
                      viewQuality={hoveredSeat.ScreenViewInfo}
                      acousticQuality={hoveredSeat.AcousticProfile}
                      hallCapacity={selectedSession && typeof selectedSession.HallID === 'object' ? selectedSession.HallID.Capacity : 100}
                      seatRow={hoveredSeat.RowNumber}
                      seatNumber={hoveredSeat.SeatNumber}
                      totalSeatsInRow={seats.filter(s => s.RowNumber === hoveredSeat.RowNumber).length}
                    />
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                  <svg className="w-24 h-24 mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  <p className="text-xl font-medium text-gray-700">Vista Previa del Asiento</p>
                  <p className="text-sm mt-2 text-center px-4">
                    Pasa el cursor sobre cualquier asiento a la izquierda para ver información detallada de la vista y calidad acústica
                  </p>
                  <div className="mt-6 space-y-2 text-left">
                    <div className="flex items-center gap-2 text-sm">
                      <div className="w-4 h-4 bg-blue-500 rounded"></div>
                      <span>Asientos disponibles</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <div className="w-4 h-4 bg-green-500 rounded"></div>
                      <span>Tu selección</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <div className="w-4 h-4 bg-red-500 rounded opacity-50"></div>
                      <span>Ya reservados</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Actions Bar */}
        <div className="flex justify-between items-center border-t pt-6 mt-6 bg-white sticky bottom-0">
          <div className="text-sm text-gray-600">
            {hoveredSeat ? (
              <span className="text-purple-600 font-medium">
                👆 Pasa el cursor sobre los asientos para ver la vista y el perfil acústico
              </span>
            ) : (
              <span>💡 Pasa el cursor sobre un asiento para previsualizar su calidad</span>
            )}
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => {
                setIsSeatSelectionModalOpen(false);
                setHoveredSeat(null);
              }}
              className="px-5 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirmReservation}
              disabled={selectedSeats.length === 0}
              className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium shadow-lg shadow-purple-200 transition-all"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Confirmar Reserva ({selectedSeats.length} asientos)
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Eliminar Reserva"
        message="¿Estás seguro de que deseas eliminar esta reserva? Esta acción no se puede deshacer."
        confirmText="Eliminar"
        cancelText="Cancelar"
        type="danger"
      />
    </div>
  );
}
