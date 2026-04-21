'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { authApi, meApi } from '@/lib/api';
import { getStoredSession, storeSession } from '@/lib/auth';
import { Customer, Reservation, Ticket } from '@/lib/types';
import CustomerProtectedRoute from '@/components/CustomerProtectedRoute';
import PublicNavigation from '@/components/PublicNavigation';
import toast from 'react-hot-toast';

export default function AccountPage() {
  const [profile, setProfile] = useState<Customer | null>(null);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    Name: '',
    Surname: '',
    Email: '',
    PhoneNumber: '',
  });

  useEffect(() => {
    fetchAccountData();
  }, []);

  const fetchAccountData = async () => {
    try {
      setLoading(true);
      const [profileRes, reservationsRes, ticketsRes] = await Promise.all([
        meApi.getProfile(),
        meApi.getReservations(),
        meApi.getTickets(),
      ]);

      setProfile(profileRes.data);
      setReservations(reservationsRes.data);
      setTickets(ticketsRes.data);
      setFormData({
        Name: profileRes.data.Name,
        Surname: profileRes.data.Surname,
        Email: profileRes.data.Email,
        PhoneNumber: profileRes.data.PhoneNumber,
      });
    } catch (error) {
      toast.error('No se pudo cargar tu cuenta');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const response = await authApi.updateProfile(formData);
      const session = getStoredSession();

      if (session) {
        storeSession({
          token: session.token,
          user: response.data.user,
        });
      }

      toast.success('Perfil actualizado correctamente');
      await fetchAccountData();
    } catch (error: any) {
      const message = error?.response?.data?.error || 'No se pudo actualizar el perfil';
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const paidReservations = reservations.filter((reservation) => reservation.Status === 'PAID');

  return (
    <CustomerProtectedRoute>
      <PublicNavigation />
      <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black py-12">
        <div className="container mx-auto px-4 space-y-8">
          <div className="text-center">
            <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-yellow-400 to-red-500 mb-3">
              MI CUENTA
            </h1>
            <p className="text-gray-400">Gestiona tu perfil, tus compras y las películas que ya puedes valorar.</p>
          </div>

          {loading ? (
            <div className="text-center text-gray-400 py-20">Cargando tu cuenta...</div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-gray-900 to-black border-4 border-red-600 rounded-2xl p-6">
                  <p className="text-yellow-400 font-black tracking-widest text-sm mb-2">RESERVAS</p>
                  <p className="text-5xl font-black text-white">{reservations.length}</p>
                </div>
                <div className="bg-gradient-to-br from-gray-900 to-black border-4 border-yellow-500 rounded-2xl p-6">
                  <p className="text-yellow-400 font-black tracking-widest text-sm mb-2">PAGADAS</p>
                  <p className="text-5xl font-black text-white">{paidReservations.length}</p>
                </div>
                <div className="bg-gradient-to-br from-gray-900 to-black border-4 border-emerald-500 rounded-2xl p-6">
                  <p className="text-yellow-400 font-black tracking-widest text-sm mb-2">TICKETS</p>
                  <p className="text-5xl font-black text-white">{tickets.length}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-gradient-to-br from-gray-900 to-black border-4 border-red-600 rounded-2xl p-8">
                  <h2 className="text-2xl font-black text-yellow-400 mb-6">PERFIL</h2>
                  <form onSubmit={handleSaveProfile} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <input
                        type="text"
                        value={formData.Name}
                        onChange={(e) => setFormData({ ...formData, Name: e.target.value })}
                        className="px-4 py-3 bg-gray-800 border-2 border-gray-700 rounded-lg text-white"
                        placeholder="Nombre"
                      />
                      <input
                        type="text"
                        value={formData.Surname}
                        onChange={(e) => setFormData({ ...formData, Surname: e.target.value })}
                        className="px-4 py-3 bg-gray-800 border-2 border-gray-700 rounded-lg text-white"
                        placeholder="Apellido"
                      />
                    </div>
                    <input
                      type="email"
                      value={formData.Email}
                      onChange={(e) => setFormData({ ...formData, Email: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-800 border-2 border-gray-700 rounded-lg text-white"
                      placeholder="Correo"
                    />
                    <input
                      type="tel"
                      value={formData.PhoneNumber}
                      onChange={(e) => setFormData({ ...formData, PhoneNumber: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-800 border-2 border-gray-700 rounded-lg text-white"
                      placeholder="Teléfono"
                    />
                    <button
                      type="submit"
                      disabled={saving}
                      className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 disabled:from-gray-700 disabled:to-gray-800 text-white font-black py-3 rounded-xl"
                    >
                      {saving ? 'GUARDANDO...' : 'GUARDAR CAMBIOS'}
                    </button>
                  </form>
                </div>

                <div className="bg-gradient-to-br from-gray-900 to-black border-4 border-yellow-500 rounded-2xl p-8">
                  <h2 className="text-2xl font-black text-yellow-400 mb-6">ÚLTIMAS ENTRADAS</h2>
                  <div className="space-y-4">
                    {tickets.length === 0 ? (
                      <p className="text-gray-400">Aún no tienes entradas pagadas.</p>
                    ) : (
                      tickets.slice(0, 4).map((ticket) => {
                        const reservation = typeof ticket.ReservationID === 'object' ? ticket.ReservationID : null;
                        const session = reservation && typeof reservation.SessionID === 'object' ? reservation.SessionID : null;
                        const movie = session && typeof session.MovieID === 'object' ? session.MovieID : null;
                        const seat = typeof ticket.SeatID === 'object' ? ticket.SeatID : null;

                        return (
                          <div key={ticket._id} className="bg-black/40 border border-yellow-500/20 rounded-xl p-4 flex items-center justify-between gap-4">
                            <div>
                              <p className="text-white font-bold">{movie?.MovieName || 'Película'}</p>
                              <p className="text-gray-400 text-sm">
                                Asiento {seat?.RowNumber}{seat?.SeatNumber} · {ticket.TicketCode.slice(-8)}
                              </p>
                            </div>
                            <Link href={`/my-ticket/${ticket._id}`} className="text-yellow-400 font-bold hover:text-yellow-300">
                              Ver ticket
                            </Link>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-gray-900 to-black border-4 border-emerald-500 rounded-2xl p-8">
                <h2 className="text-2xl font-black text-yellow-400 mb-6">MIS RESERVAS</h2>
                <div className="space-y-4">
                  {reservations.length === 0 ? (
                    <p className="text-gray-400">Todavía no realizaste ninguna reserva.</p>
                  ) : (
                    reservations.map((reservation) => {
                      const session = typeof reservation.SessionID === 'object' ? reservation.SessionID : null;
                      const movie = session && typeof session.MovieID === 'object' ? session.MovieID : null;
                      const seatCount = reservation.SeatIDs?.length || 0;

                      return (
                        <div key={reservation._id} className="bg-black/40 border border-white/10 rounded-xl p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                          <div>
                            <p className="text-white font-bold text-lg">{movie?.MovieName || 'Película'}</p>
                            <p className="text-gray-400 text-sm">
                              {session ? new Date(session.SessionDateTime).toLocaleString('es-ES') : 'Sin función'}
                            </p>
                            <p className="text-gray-500 text-sm">{seatCount} asiento(s) · Estado {reservation.Status}</p>
                          </div>
                          <div className="flex flex-wrap gap-3">
                            {reservation.Status === 'PAID' && (
                              <Link href={`/confirmation/${reservation._id}`} className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-bold">
                                Ver compra
                              </Link>
                            )}
                            {movie && (
                              <Link href={`/movies/${movie._id}`} className="px-4 py-2 bg-yellow-500 text-black rounded-lg font-bold">
                                Ver película
                              </Link>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </CustomerProtectedRoute>
  );
}
