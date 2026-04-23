'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { moviesApi } from '@/lib/api';
import { getStoredSession } from '@/lib/auth';
import { Movie } from '@/lib/types';
import PublicNavigation from '@/components/PublicNavigation';
import Link from 'next/link';

export default function Home() {
  const router = useRouter();
  const [featuredMovies, setFeaturedMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const session = getStoredSession();
    if (session?.user.Role === 'ADMIN') {
      router.push('/admin');
      return;
    }
    fetchFeaturedMovies();
  }, [router]);

  const fetchFeaturedMovies = async () => {
    try {
      setLoading(true);
      const response = await moviesApi.getAll();
      setFeaturedMovies(response.data.slice(0, 6));
    } catch (error) {
      console.error('Failed to fetch movies:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <PublicNavigation />

      {/* ── Hero ── */}
      <section className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 flex flex-col md:flex-row items-center gap-12">
          {/* Copy */}
          <div className="flex-1 text-center md:text-left">
            <span className="inline-block mb-4 px-3 py-1 rounded-full bg-red-50 text-red-600 text-xs font-bold tracking-widest uppercase border border-red-100">
              Reserva online · Sin colas
            </span>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-gray-900 leading-tight mb-6">
              Tu próxima película<br />
              <span className="text-red-600">te está esperando</span>
            </h1>
            <p className="text-gray-500 text-lg mb-8 max-w-lg mx-auto md:mx-0">
              Elige tu sala, selecciona tu asiento y compra tu entrada en segundos. Cine sin complicaciones.
            </p>
            <div className="flex flex-wrap gap-3 justify-center md:justify-start">
              <Link
                href="/movies"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-red-600 text-white text-sm font-bold hover:bg-red-700 transition-colors shadow-lg shadow-red-100"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.069A1 1 0 0121 8.87v6.26a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
                </svg>
                Ver cartelera
              </Link>
              <Link
                href="/account/register"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-gray-800 text-sm font-bold border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors"
              >
                Crear cuenta gratis
              </Link>
            </div>
          </div>

          {/* Stats pill row */}
          <div className="flex-shrink-0 flex flex-col gap-4 md:gap-5 w-full md:w-auto">
            {[
              { label: 'Películas en cartelera', value: '20+', icon: '🎬' },
              { label: 'Salas disponibles', value: '6', icon: '🏟️' },
              { label: 'Reservas realizadas', value: '1,200+', icon: '🎟️' },
            ].map((stat) => (
              <div
                key={stat.label}
                className="flex items-center gap-4 bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 min-w-[220px]"
              >
                <span className="text-2xl">{stat.icon}</span>
                <div>
                  <p className="text-xl font-extrabold text-gray-900">{stat.value}</p>
                  <p className="text-xs text-gray-400 font-medium">{stat.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features strip ── */}
      <section className="bg-red-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-white text-center sm:text-left">
            {[
              { icon: '🪑', title: 'Elige tu asiento', desc: 'Previsualiza la sala antes de reservar.' },
              { icon: '⚡', title: 'Reserva en segundos', desc: 'Proceso rápido, seguro y sin filas.' },
              { icon: '🎟️', title: 'Entradas digitales', desc: 'Recibe tu ticket al instante.' },
            ].map((f) => (
              <div key={f.title} className="flex items-start gap-3">
                <span className="text-2xl mt-0.5">{f.icon}</span>
                <div>
                  <p className="font-bold text-sm">{f.title}</p>
                  <p className="text-red-100 text-xs mt-0.5">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Now Showing ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900">En cartelera</h2>
            <p className="text-gray-400 text-sm mt-1">Las mejores películas disponibles ahora</p>
          </div>
          <Link
            href="/movies"
            className="hidden sm:inline-flex items-center gap-1.5 text-sm font-semibold text-red-600 hover:text-red-700 transition-colors"
          >
            Ver todas
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 md:gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="rounded-2xl overflow-hidden bg-gray-200 animate-pulse">
                <div className="aspect-[2/3]" />
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-gray-300 rounded w-3/4" />
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : featuredMovies.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <svg className="w-12 h-12 mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
            </svg>
            <p className="text-sm font-medium">No hay películas disponibles en este momento</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 md:gap-6">
            {featuredMovies.map((movie) => (
              <MovieCard key={movie._id} movie={movie} />
            ))}
          </div>
        )}

        {featuredMovies.length > 0 && (
          <div className="mt-10 sm:hidden text-center">
            <Link
              href="/movies"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-red-200 text-red-600 text-sm font-semibold hover:bg-red-50 transition-colors"
            >
              Ver todas las películas
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        )}
      </section>

      {/* ── Footer ── */}
      <footer className="bg-white border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-red-600 flex items-center justify-center">
              <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
              </svg>
            </div>
            <span className="text-gray-800 font-bold text-sm">Cine<span className="text-red-600">book</span></span>
          </div>
          <p className="text-gray-400 text-xs">Proyecto SIS 226 2026</p>
        </div>
      </footer>
    </div>
  );
}

function MovieCard({ movie }: { movie: Movie }) {
  const hasUserRating = Boolean(movie.UserRatingCount && movie.UserRatingCount > 0);
  const ratingValue = hasUserRating
    ? movie.UserRatingAverage?.toFixed(1)
    : (movie.Rating / 2).toFixed(1);

  return (
    <Link href={`/movies/${movie._id}`} className="group block">
      <div className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
        {/* Poster */}
        <div className="relative aspect-[2/3] overflow-hidden bg-gray-100">
          <img
            src={movie.PosterURL}
            alt={movie.MovieName}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            onError={(e) => {
              e.currentTarget.src = 'https://via.placeholder.com/300x450/f3f4f6/d1d5db?text=Sin+poster';
            }}
          />
          {/* Gradient overlay */}
          <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/60 to-transparent" />
          {/* Age badge */}
          <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md bg-gray-900/80 text-white text-xs font-bold backdrop-blur-sm">
            {movie.AgeLimit}+
          </div>
          {/* Rating badge */}
          <div className="absolute top-2.5 right-2.5 flex items-center gap-1 px-2 py-0.5 rounded-md bg-yellow-400 text-yellow-900">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            <span className="text-xs font-bold">{ratingValue}</span>
          </div>
          {/* Hover CTA */}
          <div className="absolute inset-x-0 bottom-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
            <span className="block w-full py-2 rounded-lg bg-red-600 text-white text-xs font-bold text-center">
              Reservar entrada
            </span>
          </div>
        </div>

        {/* Info */}
        <div className="p-3.5">
          <h3 className="text-gray-900 text-sm font-bold mb-1.5 line-clamp-1 group-hover:text-red-600 transition-colors">
            {movie.MovieName}
          </h3>
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-medium">{movie.Genre}</span>
            <span>·</span>
            <span>{movie.Duration} min</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
