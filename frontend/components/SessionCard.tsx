'use client';

import Link from 'next/link';
import { MovieSession } from '@/lib/types';

interface SessionCardProps {
  session: MovieSession;
}

export default function SessionCard({ session }: SessionCardProps) {
  const formatDateTime = (dateTime: string) => {
    const date = new Date(dateTime);
    return {
      date: date.toLocaleDateString('es-ES', { weekday: 'short', month: 'short', day: 'numeric' }),
      time: date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
    };
  };

  const { date, time } = formatDateTime(session.SessionDateTime);
  const hallName = typeof session.HallID === 'object' ? session.HallID.HallName : 'Sala';

  return (
    <div className="group relative bg-gradient-to-b from-gray-900 to-black rounded-2xl border border-gray-800 hover:border-red-500/70 p-6 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-xl hover:shadow-red-500/20 overflow-hidden">
      <div className="flex items-center justify-between mb-5 mt-2">
        <div className="flex flex-col gap-1">
          <div className="bg-red-600 text-white px-4 py-2 rounded-lg text-lg font-black shadow-lg shadow-red-500/30">
            {time}
          </div>
          <div className="text-xs text-yellow-400 font-bold tracking-wider uppercase">{date}</div>
        </div>
        <div className="bg-yellow-500 text-black px-5 py-2.5 rounded-xl font-black text-xl shadow-md shadow-yellow-500/25">
          ${session.Price}
        </div>
      </div>

      <div className="space-y-3 mb-5">
        <div className="flex items-center gap-2 text-gray-300 bg-gray-800/40 rounded-lg px-4 py-2 border border-gray-700">
          <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          <span className="font-bold text-white">{hallName}</span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="flex items-center gap-2 text-gray-400 bg-gray-800/20 rounded-lg px-3 py-2 text-sm">
            <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
            </svg>
            <span className="font-semibold">{session.Language}</span>
          </div>

          {session.SubtitleInfo && session.SubtitleInfo !== 'None' && (
            <div className="flex items-center gap-2 text-gray-400 bg-gray-800/20 rounded-lg px-3 py-2 text-sm">
              <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
              </svg>
              <span className="font-semibold text-xs">{session.SubtitleInfo}</span>
            </div>
          )}
        </div>
      </div>

      <Link href={`/booking/${session._id}`}>
        <button className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-black py-3.5 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 shadow-lg shadow-red-500/25">
          <svg className="w-6 h-6 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
          </svg>
          <span className="relative z-10 text-base tracking-wider">RESERVAR</span>
        </button>
      </Link>
    </div>
  );
}
