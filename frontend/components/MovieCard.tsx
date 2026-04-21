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
      <div className="group relative bg-gradient-to-br from-gray-900 to-black rounded-2xl shadow-2xl hover:shadow-red-500/50 transition-all duration-500 overflow-hidden cursor-pointer transform hover:-translate-y-3 hover:scale-105 border-4 border-gray-800 hover:border-red-600">
        {/* Film strip perforation effect at top */}
        <div className="absolute top-0 left-0 right-0 h-3 bg-gray-800 flex gap-2 px-1 z-10">
          {[...Array(12)].map((_, i) => (
            <div key={i} className="flex-1 bg-black rounded-sm"></div>
          ))}
        </div>

        {/* Poster Image */}
        <div className="relative h-96 bg-black overflow-hidden mt-3">
          <img
            src={movie.PosterURL}
            alt={movie.MovieName}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 group-hover:brightness-110"
            onError={(e) => {
              e.currentTarget.src = 'https://via.placeholder.com/300x450?text=Sin+Poster';
            }}
          />
          
          {/* Film grain overlay */}
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIj48ZmVUdXJidWxlbmNlIGJhc2VGcmVxdWVuY3k9Ii43NSIgc3RpdGNoVGlsZXM9InN0aXRjaCIgdHlwZT0iZnJhY3RhbE5vaXNlIi8+PGZlQ29sb3JNYXRyaXggdHlwZT0ic2F0dXJhdGUiIHZhbHVlcz0iMCIvPjwvZmlsdGVyPjxwYXRoIGQ9Ik0wIDBoMzAwdjMwMEgweiIgZmlsdGVyPSJ1cmwoI2EpIiBvcGFjaXR5PSIuMDUiLz48L3N2Zz4=')] opacity-20 group-hover:opacity-30 transition-opacity"></div>
          
          {/* Rating Badge - Cinema Ticket Style */}
          <div className="absolute top-3 right-3 bg-gradient-to-r from-yellow-500 to-yellow-600 text-black font-black px-4 py-2 rounded-lg shadow-lg shadow-yellow-500/50 flex items-center gap-2 transform rotate-3 group-hover:rotate-0 transition-transform">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            <span className="text-lg">{ratingValue}</span>
          </div>

          {/* Age Limit Badge - Cinema Style */}
          <div className="absolute top-3 left-3 bg-gradient-to-r from-red-600 to-red-700 text-white font-black px-4 py-2 rounded-lg shadow-lg shadow-red-500/50 border-2 border-red-400 transform -rotate-3 group-hover:rotate-0 transition-transform">
            {movie.AgeLimit}+
          </div>

          {/* Hover Overlay with "NOW SHOWING" */}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex flex-col items-center justify-end p-6">
            <div className="text-yellow-400 font-black text-sm tracking-widest mb-3 animate-pulse">
              ★ EN CARTELERA ★
            </div>
            <button className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-black py-4 rounded-lg transition-all duration-300 shadow-lg shadow-red-500/50 text-lg tracking-wider transform hover:scale-105">
              VER DETALLES Y RESERVAR
            </button>
          </div>
        </div>

        {/* Movie Info - Cinema Style */}
        <div className="p-5 bg-gradient-to-b from-gray-900 to-black">
          <h3 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400 mb-2 line-clamp-1 group-hover:from-red-500 group-hover:to-yellow-400 transition-all duration-300 tracking-wide">
            {movie.MovieName}
          </h3>
          
          <div className="flex items-center gap-3 mb-3">
            <span className="px-3 py-1 bg-red-600/20 text-red-400 text-xs font-bold rounded-full border border-red-600/50 uppercase tracking-wider">
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

        {/* Film strip perforation effect at bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-3 bg-gray-800 flex gap-2 px-1">
          {[...Array(12)].map((_, i) => (
            <div key={i} className="flex-1 bg-black rounded-sm"></div>
          ))}
        </div>

        {/* Spotlight effect on hover */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-tr from-red-600/10 via-transparent to-yellow-500/10"></div>
        </div>
      </div>
    </Link>
  );
}
