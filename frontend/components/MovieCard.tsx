'use client';

import Link from 'next/link';
import { Movie } from '@/lib/types';

interface MovieCardProps {
  movie: Movie;
}

export default function MovieCard({ movie }: MovieCardProps) {
  const hasUserRating = Boolean(movie.UserRatingCount && movie.UserRatingCount > 0);
  const ratingValue = hasUserRating
    ? `${movie.UserRatingAverage?.toFixed(1)}/5`
    : `${movie.Rating}/10`;

  return (
    <Link href={`/movies/${movie._id}`}>
      <div className="group relative bg-gradient-to-b from-gray-900 to-black rounded-2xl shadow-xl hover:shadow-red-500/30 transition-all duration-300 overflow-hidden cursor-pointer transform hover:-translate-y-2 border border-gray-800 hover:border-red-500/70">
        <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 via-transparent to-yellow-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>

        <div className="relative h-96 bg-black overflow-hidden">
          <img
            src={movie.PosterURL}
            alt={movie.MovieName}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 group-hover:brightness-110"
            onError={(e) => {
              e.currentTarget.src = 'https://via.placeholder.com/300x450?text=Sin+Poster';
            }}
          />
          
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent"></div>

          <div className="absolute top-3 right-3 bg-yellow-500 text-black font-black px-3 py-1.5 rounded-lg shadow-lg shadow-yellow-500/30 flex items-center gap-1.5">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            <span className="text-sm">{ratingValue}</span>
          </div>

          <div className="absolute top-3 left-3 bg-red-600 text-white font-black px-3 py-1.5 rounded-lg shadow-lg shadow-red-500/30">
            {movie.AgeLimit}+
          </div>

          <div className="absolute inset-x-0 bottom-0 p-4">
            <button className="w-full bg-red-600/90 backdrop-blur hover:bg-red-500 text-white font-black py-3 rounded-lg transition-all duration-300 text-sm tracking-wide">
              VER DETALLES Y RESERVAR
            </button>
          </div>
        </div>

        <div className="p-5 bg-gradient-to-b from-gray-900 to-black">
          <h3 className="text-2xl font-black text-white mb-2 line-clamp-1 group-hover:text-red-400 transition-colors tracking-wide">
            {movie.MovieName}
          </h3>
          
          <div className="flex items-center gap-3 mb-3">
            <span className="px-3 py-1 bg-red-600/15 text-red-300 text-xs font-bold rounded-full border border-red-500/30 uppercase tracking-wider">
              {movie.Genre}
            </span>
            <span className="flex items-center gap-1 text-gray-400 text-sm font-semibold">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {movie.Duration} min
            </span>
          </div>

          <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
            <svg className="w-4 h-4 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span className="text-gray-400 font-medium">
              {hasUserRating ? `${movie.UserRatingCount} valoraciones` : movie.Director}
            </span>
          </div>

          <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed">
            {movie.Description}
          </p>
        </div>
      </div>
    </Link>
  );
}
