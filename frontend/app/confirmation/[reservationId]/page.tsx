'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { meApi, reservationsApi } from '@/lib/api';
import { Reservation, Ticket } from '@/lib/types';
import TicketDisplay from '@/components/TicketDisplay';
import PublicNavigation from '@/components/PublicNavigation';
import Link from 'next/link';

export default function ConfirmationPage() {
  const params = useParams();
  const reservationId = params.reservationId as string;

  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (reservationId) {
      fetchConfirmationData();
    }
  }, [reservationId]);

  const fetchConfirmationData = async () => {
    try {
      setLoading(true);
      const [reservationRes, ticketsRes] = await Promise.all([
        reservationsApi.getById(reservationId),
        meApi.getReservationTickets(reservationId),
      ]);

      setReservation(reservationRes.data);
      setTickets(ticketsRes.data);
    } catch (error) {
      console.error('Failed to fetch confirmation data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <>
        <PublicNavigation />
        <div className="min-h-screen bg-black flex items-center justify-center">
          <div className="relative">
            <div className="w-24 h-24 border-8 border-green-600 border-t-transparent rounded-full animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-4xl animate-pulse">🎟️</div>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (!reservation) {
    return (
      <>
        <PublicNavigation />
        <div className="min-h-screen bg-black flex items-center justify-center">
          <div className="text-center">
            <div className="text-8xl mb-6">🎬</div>
            <h2 className="text-3xl font-black text-white mb-4">RESERVA NO ENCONTRADA</h2>
          </div>
        </div>
      </>
    );
  }

  const movieName = typeof reservation.SessionID === 'object' && typeof reservation.SessionID.MovieID === 'object'
    ? reservation.SessionID.MovieID.MovieName
    : 'Película';

  const moviePoster = typeof reservation.SessionID === 'object' && typeof reservation.SessionID.MovieID === 'object'
    ? reservation.SessionID.MovieID.PosterURL
    : '';

  return (
    <>
      <PublicNavigation />
      <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black py-8 md:py-12">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-8 md:mb-12">
            <div className="mb-8 relative inline-block">
              <div className="absolute inset-0 bg-gradient-to-r from-green-600 to-emerald-600 blur-3xl opacity-50 animate-pulse"></div>
              <div className="relative w-24 h-24 md:w-32 md:h-32 mx-auto bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center shadow-2xl shadow-green-500/50">
                <svg className="w-14 h-14 md:w-20 md:h-20 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
            </div>

            <h1 className="text-3xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-500 via-yellow-400 to-green-500 tracking-wide md:tracking-wider mb-4">
              ¡RESERVA CONFIRMADA!
            </h1>
            <p className="text-lg md:text-2xl text-gray-300 font-bold mb-2">Tus entradas ya están listas.</p>
            <p className="text-gray-400 text-sm md:text-lg">Muéstralas en el cine o descárgalas desde tu cuenta cuando quieras.</p>
          </div>

          {moviePoster && (
            <div className="relative bg-gradient-to-br from-gray-900 to-black rounded-2xl border-4 border-yellow-500 p-4 md:p-8 mb-8 md:mb-12 overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-3 bg-yellow-500 flex gap-1 px-1">
                {[...Array(30)].map((_, i) => (
                  <div key={i} className="flex-1 bg-black rounded-sm"></div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 md:gap-8 mt-3">
                <img
                  src={moviePoster}
                  alt={movieName}
                  className="w-32 h-48 md:w-40 md:h-60 object-cover rounded-xl border-4 border-yellow-500 shadow-2xl"
                />
                <div className="flex-1">
                  <h2 className="text-2xl md:text-4xl font-black text-white mb-4 text-center sm:text-left">{movieName}</h2>
                  <div className="inline-flex items-center gap-2 bg-green-500 text-white px-5 py-2.5 md:px-6 md:py-3 rounded-full font-black text-sm md:text-lg">
                    CONFIRMADA
                  </div>
                  <div className="text-gray-400 text-sm md:text-lg mt-3">
                    <span className="font-semibold">{tickets.length}</span> {tickets.length === 1 ? 'Entrada' : 'Entradas'}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="mb-12">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-yellow-400 mb-2 tracking-wider">
                TUS ENTRADAS
              </h2>
              <p className="text-gray-400">También puedes encontrarlas después en tu cuenta</p>
            </div>

            {tickets.length === 0 ? (
              <div className="bg-gradient-to-br from-gray-900 to-black rounded-2xl border-4 border-red-600 p-12 text-center">
                <p className="text-gray-400 text-lg">Aún no se han generado entradas</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {tickets.map((ticket) => (
                  <TicketDisplay key={ticket._id} ticket={ticket} />
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-3 md:gap-6">
            <Link href="/account">
              <button className="w-full px-8 py-3 md:px-10 md:py-4 bg-gradient-to-r from-gray-800 to-black hover:from-gray-700 hover:to-gray-900 text-white font-black text-sm md:text-lg rounded-xl border-4 border-gray-700 hover:border-yellow-500 transition-all duration-300">
                IR A MI CUENTA
              </button>
            </Link>
            <Link href="/movies">
              <button className="w-full px-8 py-3 md:px-10 md:py-4 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-black text-sm md:text-lg rounded-xl transition-all duration-300 shadow-2xl shadow-red-500/50">
                RESERVAR MÁS ENTRADAS
              </button>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
