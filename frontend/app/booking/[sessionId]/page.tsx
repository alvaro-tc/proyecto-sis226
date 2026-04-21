'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { meApi, sessionsApi, seatsApi } from '@/lib/api';
import { getStoredSession } from '@/lib/auth';
import { MovieSession, Seat } from '@/lib/types';
import SeatGrid from '@/components/SeatGrid';
import SeatPreview from '@/components/SeatPreview';
import PublicNavigation from '@/components/PublicNavigation';
import toast from 'react-hot-toast';

export default function BookingPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.sessionId as string;

  const [session, setSession] = useState<MovieSession | null>(null);
  const [seats, setSeats] = useState<Seat[]>([]);
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [hoveredSeat, setHoveredSeat] = useState<Seat | null>(null);
  const [reservedSeats, setReservedSeats] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [customerInfo, setCustomerInfo] = useState<{ Name: string; Surname: string; Email: string; PhoneNumber: string } | null>(null);
  const [accountChecked, setAccountChecked] = useState(false);

  const pendingSelectionKey = `pending_booking_${sessionId}`;

  useEffect(() => {
    if (sessionId) {
      fetchSessionData();
      restorePendingSeatSelection();
      fetchCustomerProfile();
    }
  }, [sessionId]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    if (selectedSeats.length > 0) {
      window.localStorage.setItem(pendingSelectionKey, JSON.stringify(selectedSeats));
    } else {
      window.localStorage.removeItem(pendingSelectionKey);
    }
  }, [pendingSelectionKey, selectedSeats]);

  const restorePendingSeatSelection = () => {
    if (typeof window === 'undefined') {
      return;
    }

    const stored = window.localStorage.getItem(pendingSelectionKey);
    if (!stored) {
      return;
    }

    try {
      setSelectedSeats(JSON.parse(stored));
    } catch {
      window.localStorage.removeItem(pendingSelectionKey);
    }
  };

  const fetchCustomerProfile = async () => {
    const session = getStoredSession();

    if (!session || session.user.Role !== 'CUSTOMER') {
      setCustomerInfo(null);
      setAccountChecked(true);
      return;
    }

    try {
      const response = await meApi.getProfile();
      setCustomerInfo(response.data);
    } catch {
      setCustomerInfo(null);
    } finally {
      setAccountChecked(true);
    }
  };

  const fetchSessionData = async () => {
    try {
      setLoading(true);
      const sessionRes = await sessionsApi.getById(sessionId);
      const sessionData = sessionRes.data;
      setSession(sessionData);

      const hallId = typeof sessionData.HallID === 'object' ? sessionData.HallID._id : sessionData.HallID;

      const [seatsRes, availabilityRes] = await Promise.all([
        seatsApi.getAll(hallId),
        sessionsApi.getAvailability(sessionId),
      ]);

      setSeats(seatsRes.data);
      setReservedSeats(availabilityRes.data.soldSeatIds);
    } catch (error) {
      console.error('Failed to fetch session data:', error);
      toast.error('No se pudo cargar la información de la función');
    } finally {
      setLoading(false);
    }
  };

  const handleSeatClick = (seatId: string) => {
    setSelectedSeats((prev) =>
      prev.includes(seatId)
        ? prev.filter((id) => id !== seatId)
        : [...prev, seatId]
    );
  };

  const redirectToLogin = () => {
    if (selectedSeats.length > 0 && typeof window !== 'undefined') {
      window.localStorage.setItem(pendingSelectionKey, JSON.stringify(selectedSeats));
    }

    router.push(`/account/login?redirect=${encodeURIComponent(`/booking/${sessionId}`)}`);
  };

  const handleContinue = async () => {
    if (selectedSeats.length === 0) {
      toast.error('Por favor selecciona al menos un asiento');
      return;
    }

    if (!customerInfo) {
      toast('Necesitas iniciar sesión como cliente para continuar con la compra.');
      redirectToLogin();
      return;
    }

    setSubmitting(true);

    try {
      const response = await meApi.createReservation({
        SessionID: sessionId,
        SeatIDs: selectedSeats,
      });

      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(pendingSelectionKey);
      }

      toast.success('Reserva creada. Ahora completa el pago.');
      router.push(`/payment/${response.data._id}`);
    } catch (error: any) {
      const message = error?.response?.data?.error || 'No se pudo crear la reserva';
      toast.error(message);
      if (error?.response?.data?.soldSeatIds) {
        setReservedSeats((prev) => Array.from(new Set([...prev, ...error.response.data.soldSeatIds])));
        setSelectedSeats((prev) => prev.filter((seatId) => !error.response.data.soldSeatIds.includes(seatId)));
      }
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <>
        <PublicNavigation />
        <div className="min-h-screen bg-black flex items-center justify-center">
          <div className="relative">
            <div className="w-24 h-24 border-8 border-red-600 border-t-transparent rounded-full animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-4xl animate-pulse">🎬</div>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (!session) {
    return (
      <>
        <PublicNavigation />
        <div className="min-h-screen bg-black flex items-center justify-center">
          <div className="text-center">
            <div className="text-8xl mb-6">🎬</div>
            <h2 className="text-3xl font-black text-white mb-4">FUNCIÓN NO ENCONTRADA</h2>
          </div>
        </div>
      </>
    );
  }

  const movieName = typeof session.MovieID === 'object' ? session.MovieID.MovieName : 'Película';
  const hallName = typeof session.HallID === 'object' ? session.HallID.HallName : 'Sala';
  const hallCapacity = typeof session.HallID === 'object' ? session.HallID.Capacity : 100;
  const totalPrice = selectedSeats.length * session.Price;

  return (
    <>
      <PublicNavigation />
      <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black py-8">
        <div className="container mx-auto px-4">
          <div className="relative bg-gradient-to-br from-gray-900 to-black rounded-2xl border-4 border-red-600 p-8 mb-8 overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-3 bg-yellow-500 flex gap-1 px-1">
              {[...Array(30)].map((_, i) => (
                <div key={i} className="flex-1 bg-black rounded-sm"></div>
              ))}
            </div>

            <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-yellow-400 to-red-500 mb-6 mt-3 tracking-wider">
              {movieName}
            </h1>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gray-800/50 rounded-lg px-4 py-3 border border-gray-700">
                <span className="text-gray-400 text-sm block mb-1">SALA</span>
                <span className="text-white font-black text-lg">{hallName}</span>
              </div>
              <div className="bg-gray-800/50 rounded-lg px-4 py-3 border border-gray-700">
                <span className="text-gray-400 text-sm block mb-1">FECHA</span>
                <span className="text-yellow-400 font-black text-lg">{new Date(session.SessionDateTime).toLocaleDateString('es-ES')}</span>
              </div>
              <div className="bg-gray-800/50 rounded-lg px-4 py-3 border border-gray-700">
                <span className="text-gray-400 text-sm block mb-1">HORA</span>
                <span className="text-yellow-400 font-black text-lg">{new Date(session.SessionDateTime).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              <div className="bg-gray-800/50 rounded-lg px-4 py-3 border border-gray-700">
                <span className="text-gray-400 text-sm block mb-1">PRECIO/ASIENTO</span>
                <span className="text-green-400 font-black text-lg">${session.Price}</span>
              </div>
            </div>

            <div className="absolute bottom-0 left-0 right-0 h-3 bg-yellow-500 flex gap-1 px-1">
              {[...Array(30)].map((_, i) => (
                <div key={i} className="flex-1 bg-black rounded-sm"></div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <div className="lg:col-span-2 bg-gradient-to-br from-gray-900 to-black rounded-2xl border-4 border-gray-800 p-6">
              <div className="mb-6">
                <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-yellow-400 mb-3 tracking-wider">
                  SELECCIONA TUS ASIENTOS
                </h2>
                <div className="bg-yellow-500/10 border-2 border-yellow-500/30 rounded-lg p-4">
                  <p className="text-yellow-400 font-semibold">
                    Pasa el cursor sobre los asientos para previsualizar la vista de pantalla y la calidad acústica.
                  </p>
                </div>
              </div>
              <SeatGrid
                seats={seats}
                selectedSeats={selectedSeats}
                onSeatClick={handleSeatClick}
                onSeatHover={setHoveredSeat}
                reservedSeats={reservedSeats}
              />
            </div>

            <div className="space-y-6">
              <div className="bg-gradient-to-br from-gray-900 to-black rounded-2xl border-4 border-purple-600 p-6">
                <h3 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 mb-4">
                  VISTA PREVIA
                </h3>
                {hoveredSeat ? (
                  <div>
                    <p className="text-gray-400 font-bold mb-4 text-center bg-gray-800 rounded-lg py-2">
                      Fila {hoveredSeat.RowNumber} • Asiento {hoveredSeat.SeatNumber}
                    </p>
                    <SeatPreview
                      viewQuality={hoveredSeat.ScreenViewInfo}
                      acousticQuality={hoveredSeat.AcousticProfile}
                      hallCapacity={hallCapacity}
                      seatRow={hoveredSeat.RowNumber}
                      seatNumber={hoveredSeat.SeatNumber}
                      totalSeatsInRow={seats.filter((seat) => seat.RowNumber === hoveredSeat.RowNumber).length}
                    />
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <p className="text-sm font-semibold">Pasa el cursor sobre un asiento</p>
                  </div>
                )}
              </div>

              <div className="bg-gradient-to-br from-gray-900 to-black rounded-2xl border-4 border-yellow-500 p-6">
                <h3 className="text-2xl font-black text-yellow-400 mb-4">RESUMEN DEL PEDIDO</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b border-gray-800">
                    <span className="text-gray-400 font-semibold">Asientos Seleccionados</span>
                    <span className="text-white font-black text-lg">{selectedSeats.length}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-800">
                    <span className="text-gray-400 font-semibold">Precio por Asiento</span>
                    <span className="text-white font-black text-lg">${session.Price}</span>
                  </div>
                  <div className="flex justify-between items-center py-3 bg-gradient-to-r from-yellow-500/20 to-red-500/20 rounded-lg px-4 border-2 border-yellow-500/30">
                    <span className="text-yellow-400 font-black text-lg">TOTAL</span>
                    <span className="text-yellow-400 font-black text-3xl">${totalPrice.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-gray-900 to-black rounded-2xl border-4 border-red-600 p-8">
            <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-yellow-400 mb-6 tracking-wider">
              {customerInfo ? 'CONFIRMA TU COMPRA' : 'ACCESO REQUERIDO'}
            </h2>

            {!accountChecked ? (
              <p className="text-gray-400">Comprobando tu cuenta...</p>
            ) : customerInfo ? (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
                    <p className="text-yellow-400 text-xs font-black tracking-widest mb-1">CLIENTE</p>
                    <p className="text-white font-bold">{customerInfo.Name} {customerInfo.Surname}</p>
                  </div>
                  <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
                    <p className="text-yellow-400 text-xs font-black tracking-widest mb-1">CORREO</p>
                    <p className="text-white font-bold">{customerInfo.Email}</p>
                  </div>
                  <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
                    <p className="text-yellow-400 text-xs font-black tracking-widest mb-1">TELÉFONO</p>
                    <p className="text-white font-bold">{customerInfo.PhoneNumber}</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleContinue}
                  disabled={submitting || selectedSeats.length === 0}
                  className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 disabled:from-gray-700 disabled:to-gray-800 text-white font-black text-xl py-5 rounded-xl transition-all duration-300 shadow-2xl shadow-red-500/50 disabled:shadow-none"
                >
                  {submitting ? 'PROCESANDO...' : 'CONTINUAR AL PAGO'}
                </button>
              </div>
            ) : (
              <div className="space-y-5">
                <p className="text-gray-300 text-lg">
                  Para comprar entradas ahora necesitas iniciar sesión como cliente. Así podremos guardar tu historial de compras y habilitar tus valoraciones cuando hayas visto la película.
                </p>

                <div className="flex flex-wrap gap-4">
                  <button
                    type="button"
                    onClick={redirectToLogin}
                    className="px-8 py-4 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl font-black"
                  >
                    INICIAR SESIÓN
                  </button>
                  <Link
                    href={`/account/register?redirect=${encodeURIComponent(`/booking/${sessionId}`)}`}
                    className="px-8 py-4 bg-gradient-to-r from-emerald-500 to-emerald-600 text-black rounded-xl font-black"
                  >
                    CREAR CUENTA
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
