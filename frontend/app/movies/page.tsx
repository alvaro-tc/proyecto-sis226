'use client';

import { useState, useEffect } from 'react';
import { moviesApi } from '@/lib/api';
import { Movie } from '@/lib/types';
import PublicNavigation from '@/components/PublicNavigation';
import Link from 'next/link';

export default function MoviesPage() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGenre, setSelectedGenre] = useState<string>('Todos');

  useEffect(() => {
    fetchMovies();
  }, []);

  const fetchMovies = async () => {
    try {
      setLoading(true);
      const response = await moviesApi.getAll();
      setMovies(response.data);
    } catch (error) {
      console.error('Failed to fetch movies:', error);
    } finally {
      setLoading(false);
    }
  };

  const genres = ['Todos', ...Array.from(new Set(movies.map(m => m.Genre.split(',')[0].trim())))];

  const filteredMovies = selectedGenre === 'Todos'
    ? movies
    : movies.filter(m => m.Genre.includes(selectedGenre));

  return (
    <div className="min-h-screen bg-gray-50">
      <PublicNavigation />

      {/* Page header */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <p className="text-red-600 text-xs font-bold tracking-widest uppercase mb-1">Cartelera</p>
              <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900">
                Todas las películas
              </h1>
              {!loading && (
                <p className="text-gray-400 text-sm mt-1">
                  {filteredMovies.length} {filteredMovies.length === 1 ? 'película disponible' : 'películas disponibles'}
                </p>
              )}
            </div>
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors self-start sm:self-auto"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Inicio
            </Link>
          </div>

          {/* Genre filter */}
          {!loading && genres.length > 1 && (
            <div className="flex flex-wrap gap-2 mt-6">
              {genres.map((genre) => (
                <button
                  key={genre}
                  onClick={() => setSelectedGenre(genre)}
                  className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${
                    selectedGenre === genre
                      ? 'bg-red-600 text-white shadow-sm'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {genre}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="rounded-2xl overflow-hidden bg-white border border-gray-100 shadow-sm animate-pulse">
                <div className="aspect-[2/3] bg-gray-200" />
                <div className="p-3.5 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-3 bg-gray-100 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredMovies.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-gray-400">
            <svg className="w-12 h-12 mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
            </svg>
            <p className="text-sm font-medium text-gray-500">No se encontraron películas para este género</p>
            <button
              onClick={() => setSelectedGenre('Todos')}
              className="mt-4 text-sm text-red-600 font-semibold hover:underline"
            >
              Ver todas
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {filteredMovies.map((movie) => (
              <MovieCard key={movie._id} movie={movie} />
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-100 mt-8">
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
          <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/60 to-transparent" />
          {/* Age badge */}
          <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md bg-gray-900/80 text-white text-xs font-bold backdrop-blur-sm">
            {movie.AgeLimit}+
          </div>
          {/* Rating */}
          <div className="absolute top-2.5 right-2.5 flex items-center gap-1 px-2 py-0.5 rounded-md bg-yellow-400 text-yellow-900">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            <span className="text-xs font-bold">{ratingValue}</span>
          </div>
          {/* CTA on hover */}
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
