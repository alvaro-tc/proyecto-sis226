'use client';

import { useState, useEffect } from 'react';
import { paymentsApi, reservationsApi, ticketsApi } from '@/lib/api';
import { Payment, Reservation } from '@/lib/types';
import Modal from '@/components/Modal';
import ConfirmDialog from '@/components/ConfirmDialog';
import LoadingSpinner from '@/components/LoadingSpinner';
import toast from 'react-hot-toast';

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [paymentToDelete, setPaymentToDelete] = useState<Payment | null>(null);

  const [formData, setFormData] = useState({
    ReservationID: '',
    PaymentMethod: 'Credit Card' as 'Credit Card' | 'Debit Card' | 'Cash' | 'Online',
    Amount: '',
    PaymentStatus: 'Pending' as 'Pending' | 'Completed' | 'Failed' | 'Refunded',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [paymentsRes, reservationsRes] = await Promise.all([
        paymentsApi.getAll(),
        reservationsApi.getAll(),
      ]);
      setPayments(paymentsRes.data);
      setReservations(reservationsRes.data);
    } catch (error) {
      toast.error('No se pudieron cargar los datos');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const calculateTotalPrice = (reservationId: string) => {
    const reservation = reservations.find(r => r._id === reservationId);
    if (!reservation) return 0;

    const storedSeats = localStorage.getItem(`reservation_${reservationId}_seats`);
    const seatCount = storedSeats ? JSON.parse(storedSeats).length : reservation.SeatIDs?.length || 1;
    const sessionPrice = typeof reservation.SessionID === 'object' ? reservation.SessionID.Price : 0;
    
    return seatCount * sessionPrice;
  };

  const handleOpenModal = (payment?: Payment) => {
    if (payment) {
      setSelectedPayment(payment);
      setFormData({
        ReservationID: typeof payment.ReservationID === 'object' ? payment.ReservationID._id : payment.ReservationID,
        PaymentMethod: payment.PaymentMethod,
        Amount: payment.Amount ? payment.Amount.toString() : '0',
        PaymentStatus: payment.PaymentStatus,
      });
    } else {
      setSelectedPayment(null);
      setFormData({
        ReservationID: '',
        PaymentMethod: 'Credit Card',
        Amount: '',
        PaymentStatus: 'Pending',
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedPayment(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const data = {
        ReservationID: formData.ReservationID,
        PaymentMethod: formData.PaymentMethod,
        Amount: parseFloat(formData.Amount),
        PaymentStatus: formData.PaymentStatus,
        ProcessingTime: new Date().toISOString(),
      };

      const previousStatus = selectedPayment?.PaymentStatus;

      if (selectedPayment) {
        await paymentsApi.update(selectedPayment._id, data);
        toast.success('Pago actualizado correctamente');
      } else {
        await paymentsApi.create(data);
        toast.success('Pago creado correctamente');
      }

      // If status changed to Completed, update reservation and generate tickets
      if (data.PaymentStatus === 'Completed' && previousStatus !== 'Completed') {
        await reservationsApi.update(data.ReservationID, { Status: 'PAID' });
        
        // Generate tickets
        const storedSeats = localStorage.getItem(`reservation_${data.ReservationID}_seats`);
        const reservation = reservations.find((item) => item._id === data.ReservationID);
        const seatIds = storedSeats
          ? JSON.parse(storedSeats)
          : (reservation?.SeatIDs || []).map((seat) => typeof seat === 'object' ? seat._id : seat);

        if (seatIds.length > 0) {
          const QRCode = (await import('qrcode')).default;

          for (const seatId of seatIds) {
            const ticketCode = `TKT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`.toUpperCase();
            const qrCodeData = await QRCode.toDataURL(ticketCode);

            await ticketsApi.create({
              ReservationID: data.ReservationID,
              SeatID: seatId,
              TicketCode: ticketCode,
              QRCode: qrCodeData,
              CheckInStatus: false,
            });
          }
          toast.success('¡Tickets generados correctamente!');
        }
      }

      handleCloseModal();
      fetchData();
    } catch (error) {
      toast.error('La operación falló');
      console.error(error);
    }
  };

  const handleDeleteClick = (payment: Payment) => {
    setPaymentToDelete(payment);
    setIsConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!paymentToDelete) return;

    try {
      await paymentsApi.delete(paymentToDelete._id);
      toast.success('Pago eliminado correctamente');
      fetchData();
    } catch (error) {
      toast.error('No se pudo eliminar el pago');
      console.error(error);
    } finally {
      setIsConfirmOpen(false);
      setPaymentToDelete(null);
    }
  };

  const formatDateTime = (dateTime: string) => {
    return new Date(dateTime).toLocaleString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status: string) => {
    const statusStyles = {
      Completed: 'bg-green-100 text-green-800',
      Pending: 'bg-yellow-100 text-yellow-800',
      Failed: 'bg-red-100 text-red-800',
      Refunded: 'bg-gray-100 text-gray-800',
    };
    const labels: Record<string, string> = {
      Completed: 'Completado',
      Pending: 'Pendiente',
      Failed: 'Fallido',
      Refunded: 'Reembolsado',
    };
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusStyles[status as keyof typeof statusStyles] || 'bg-gray-100 text-gray-800'}`}>
        {labels[status] || status}
      </span>
    );
  };

  const getPaymentMethodLabel = (method: string) => {
    const labels: Record<string, string> = {
      'Credit Card': 'Tarjeta de Crédito',
      'Debit Card': 'Tarjeta de Débito',
      'Cash': 'Efectivo',
      'Online': 'En Línea',
    };
    return labels[method] || method;
  };

  const getCustomerName = (payment: Payment) => {
    if (typeof payment.ReservationID === 'object' && typeof payment.ReservationID.CustomerID === 'object') {
      const customer = payment.ReservationID.CustomerID;
      return `${customer.Name} ${customer.Surname}`;
    }
    return 'Desconocido';
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Pagos</h1>
        <button
          onClick={() => handleOpenModal()}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          + Procesar Pago
        </button>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <div className="text-sm text-blue-800">
            <p className="font-semibold mb-1">Flujo: Pago → Generación de Tickets</p>
            <p>Cuando el estado del pago cambia a "Completado", el sistema automáticamente:</p>
            <ul className="list-disc ml-5 mt-1">
              <li>Actualiza el estado de la reserva a "PAGADA"</li>
              <li>Genera tickets con códigos QR para cada asiento seleccionado</li>
            </ul>
          </div>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cliente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Método
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Monto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {payments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    No se encontraron pagos. ¡Procesa tu primer pago!
                  </td>
                </tr>
              ) : (
                payments.map((payment) => (
                  <tr key={payment._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {getCustomerName(payment)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {getPaymentMethodLabel(payment.PaymentMethod)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-emerald-600">
                      ${payment.Amount.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {getStatusBadge(payment.PaymentStatus)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {formatDateTime(payment.ProcessingTime)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleOpenModal(payment)}
                        className="text-blue-600 hover:text-blue-900 mr-4"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDeleteClick(payment)}
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
      )}

      {/* Payment Modal */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => {
          setIsModalOpen(false);
          setSelectedPayment(null);
        }} 
        title={selectedPayment ? 'Editar Pago' : 'Procesar Pago'}
      >
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reserva
              </label>
              <select
                required
                value={formData.ReservationID}
                onChange={(e) => {
                  const reservationId = e.target.value;
                  setFormData({ ...formData, ReservationID: reservationId });
                  
                  // Auto-calculate price when reservation is selected
                  if (reservationId && !selectedPayment) {
                    const totalPrice = calculateTotalPrice(reservationId);
                    setFormData(prev => ({ ...prev, Amount: totalPrice.toString() }));
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                disabled={!!selectedPayment}
              >
                <option value="">Selecciona una reserva</option>
                {reservations
                  .filter((r) => r.Status === 'CREATED' || r.Status === 'PAID')
                  .map((reservation) => {
                    const storedSeats = localStorage.getItem(`reservation_${reservation._id}_seats`);
                    const seatCount = storedSeats ? JSON.parse(storedSeats).length : reservation.SeatIDs?.length || 1;
                    const sessionPrice = typeof reservation.SessionID === 'object' ? reservation.SessionID.Price : 0;

                    return (
                      <option key={reservation._id} value={reservation._id}>
                        {typeof reservation.CustomerID === 'object'
                          ? `${reservation.CustomerID.Name} ${reservation.CustomerID.Surname}`
                          : 'Cliente'}{' '}
                        - {typeof reservation.SessionID === 'object' && typeof reservation.SessionID.MovieID === 'object'
                          ? reservation.SessionID.MovieID.MovieName
                          : 'Película'}{' '}
                        ({seatCount} {seatCount === 1 ? 'asiento' : 'asientos'} × ${sessionPrice})
                        {reservation.Status === 'PAID' ? ' ✓' : ''}
                      </option>
                    );
                  })}
                {reservations.filter((r) => r.Status === 'CREATED' || r.Status === 'PAID').length === 0 && (
                  <option disabled>No hay reservas disponibles - Crea una reserva primero</option>
                )}
              </select>
              {formData.ReservationID && (
                <p className="text-xs text-gray-500 mt-1">
                  Calculado automáticamente según el precio de la función y la cantidad de asientos. Puedes modificar este monto.
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Método de Pago
              </label>
              <select
                value={formData.PaymentMethod}
                onChange={(e) => setFormData({ ...formData, PaymentMethod: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="Credit Card">Tarjeta de Crédito</option>
                <option value="Debit Card">Tarjeta de Débito</option>
                <option value="Cash">Efectivo</option>
                <option value="Online">En Línea</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Monto ($)
              </label>
              <input
                type="number"
                required
                min="0"
                step="0.01"
                value={formData.Amount}
                onChange={(e) => setFormData({ ...formData, Amount: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="0.00"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Estado del Pago
              </label>
              <select
                value={formData.PaymentStatus}
                onChange={(e) => setFormData({ ...formData, PaymentStatus: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="Pending">Pendiente</option>
                <option value="Completed">Completado</option>
                <option value="Failed">Fallido</option>
                <option value="Refunded">Reembolsado</option>
              </select>
              {formData.PaymentStatus === 'Completed' && (
                <p className="text-xs text-green-600 mt-1">
                  ✓ Se generarán los tickets y la reserva pasará a PAGADA
                </p>
              )}
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
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md"
            >
              {selectedPayment ? 'Actualizar' : 'Crear'} Pago
            </button>
          </div>
        </form>
      </Modal>

      {/* Confirmación de eliminación */}
      <ConfirmDialog
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Eliminar Pago"
        message="¿Estás seguro de que deseas eliminar este pago? Esta acción no se puede deshacer."
        confirmText="Eliminar"
        cancelText="Cancelar"
        type="danger"
      />
    </div>
  );
}
