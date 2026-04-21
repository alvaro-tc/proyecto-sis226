'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { moviesApi } from '@/lib/api';
import { getStoredSession } from '@/lib/auth';
import { Movie } from '@/lib/types';
import MovieCard from '@/components/MovieCard';
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
      // Show top 6 movies
      setFeaturedMovies(response.data.slice(0, 6));
    } catch (error) {
      console.error('Failed to fetch movies:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <PublicNavigation />
      <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black">
        {/* Hero Section - Cinema Marquee Style */}
        <div className="relative overflow-hidden bg-gradient-to-br from-black via-red-950 to-black text-white border-b-8 border-red-600">
          {/* Animated spotlight effect */}
          <div className="absolute inset-0 opacity-30">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(220,38,38,0.3),transparent_50%)] animate-pulse"></div>
          </div>
          
          {/* Film strip pattern */}
          <div className="absolute top-0 left-0 right-0 h-4 bg-yellow-500 flex gap-2 px-2">
            {[...Array(30)].map((_, i) => (
              <div key={i} className="flex-1 bg-black rounded-sm"></div>
            ))}
          </div>
          
          <div className="relative container mx-auto px-4 py-24 text-center">
            <div className="mb-8">
              <div className="inline-block p-6 bg-gradient-to-br from-red-600 to-yellow-600 rounded-full mb-6 shadow-2xl shadow-red-500/50 animate-bounce">
                <div className="text-7xl">🎬</div>
              </div>
            </div>
            
            {/* Main Title - Cinema Marquee Style */}
            <div className="mb-8">
              <div className="inline-block bg-gradient-to-r from-yellow-500 via-red-500 to-yellow-500 p-1 rounded-2xl shadow-2xl shadow-yellow-500/50">
                <div className="bg-black px-12 py-6 rounded-xl">
                  <h1 className="text-6xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-red-500 to-yellow-400 tracking-wider animate-pulse">
                    CINEBOOK
                  </h1>
                  <div className="text-yellow-400 text-xl md:text-2xl font-bold tracking-widest mt-2">
                    EXPERIENCIA DE CINE PREMIUM
                  </div>
                </div>
              </div>
            </div>

            <p className="text-2xl md:text-3xl text-gray-300 mb-12 max-w-4xl mx-auto font-semibold leading-relaxed">
              Vive el cine como nunca antes con nuestra
              <span className="text-red-500 font-black"> revolucionaria tecnología </span>
              de previsualización de asientos
            </p>
            
            <div className="flex flex-wrap justify-center gap-6">
              <Link
                href="/movies"
                className="group relative px-10 py-5 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-black text-xl rounded-xl shadow-2xl shadow-red-500/50 transition-all transform hover:scale-110 flex items-center gap-3 overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                <svg className="w-7 h-7 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                </svg>
                <span className="relative z-10">RESERVAR ENTRADAS YA</span>
              </Link>
              <Link
                href="#features"
                className="px-10 py-5 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-400 hover:to-yellow-500 text-black font-black text-xl rounded-xl border-4 border-yellow-400 transition-all shadow-2xl shadow-yellow-500/50 transform hover:scale-110"
              >
                EXPLORAR CARACTERÍSTICAS
              </Link>
            </div>
          </div>

          {/* Bottom film strip */}
          <div className="absolute bottom-0 left-0 right-0 h-4 bg-yellow-500 flex gap-2 px-2">
            {[...Array(30)].map((_, i) => (
              <div key={i} className="flex-1 bg-black rounded-sm"></div>
            ))}
          </div>
        </div>

        {/* Now Showing Section - Cinema Hall Style */}
        <div className="container mx-auto px-4 py-20">
          {/* Section Header with Cinema Lights */}
          <div className="text-center mb-16 relative">
            <div className="inline-block relative">
              <div className="absolute -inset-4 bg-gradient-to-r from-red-600 via-yellow-500 to-red-600 blur-xl opacity-50 animate-pulse"></div>
              <h2 className="relative text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-yellow-400 to-red-500 mb-4 tracking-wider">
                EN CARTELERA
              </h2>
            </div>
            <div className="flex items-center justify-center gap-4 mt-6">
              <div className="h-1 w-20 bg-gradient-to-r from-transparent to-red-500"></div>
              <p className="text-gray-400 text-xl font-bold tracking-widest">
                ★ PELÍCULAS DESTACADAS ★
              </p>
              <div className="h-1 w-20 bg-gradient-to-l from-transparent to-red-500"></div>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-20">
              <div className="relative">
                <div className="w-20 h-20 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-3xl">🎬</div>
                </div>
              </div>
            </div>
          ) : featuredMovies.length === 0 ? (
            <div className="text-center py-20 bg-gradient-to-br from-gray-900 to-black rounded-2xl border-4 border-gray-800">
              <div className="text-6xl mb-4">🎬</div>
              <p className="text-gray-400 text-xl font-semibold">No hay películas disponibles en este momento</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredMovies.map((movie) => (
                <MovieCard key={movie._id} movie={movie} />
              ))}
            </div>
          )}

          {/* View All Button */}
          {featuredMovies.length > 0 && (
            <div className="text-center mt-12">
              <Link
                href="/movies"
                className="inline-flex items-center gap-3 px-12 py-4 bg-gradient-to-r from-gray-800 to-black hover:from-red-600 hover:to-red-700 text-white font-black text-lg rounded-xl border-4 border-red-600 transition-all duration-300 shadow-2xl shadow-red-500/30 transform hover:scale-110"
              >
                <span>VER TODAS LAS PELÍCULAS</span>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
            </div>
          )}
        </div>

        {/* Features Section - Cinema Style */}
        <div id="features" className="container mx-auto px-4 py-20 border-t-4 border-red-600">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-red-500 mb-4">
              ¿POR QUÉ ELEGIRNOS?
            </h2>
            <p className="text-gray-400 text-xl">La mejor experiencia de reserva de cine</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: '👀',
                title: 'PREVISUALIZACIÓN DE PANTALLA',
                description: 'Ve exactamente cómo se ve la pantalla desde tu asiento antes de reservar'
              },
              {
                icon: '🔊',
                title: 'PREVISUALIZACIÓN ACÚSTICA',
                description: 'Experimenta la calidad de sonido para cada posición de asiento'
              },
              {
                icon: '💺',
                title: 'SELECCIÓN INTELIGENTE',
                description: 'Recomendaciones de asientos impulsadas por IA según tus preferencias'
              }
            ].map((feature, index) => (
              <div
                key={index}
                className="group bg-gradient-to-br from-gray-900 to-black p-8 rounded-2xl border-4 border-gray-800 hover:border-red-600 transition-all duration-300 transform hover:-translate-y-3 hover:shadow-2xl hover:shadow-red-500/50"
              >
                <div className="text-6xl mb-6 transform group-hover:scale-125 transition-transform duration-300">
                  {feature.icon}
                </div>
                <h3 className="text-2xl font-black text-white mb-4 group-hover:text-red-500 transition-colors">
                  {feature.title}
                </h3>
                <p className="text-gray-400 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Footer - Cinema Credits Style */}
        <footer className="bg-black border-t-4 border-red-600 py-12">
          <div className="container mx-auto px-4 text-center">
            <div className="text-6xl mb-4">🎬</div>
            <p className="text-gray-500 text-sm tracking-widest">
              © 2025 CINEBOOK - TODOS LOS DERECHOS RESERVADOS
            </p>
            <p className="text-gray-600 text-xs mt-2">
              Vive el Cine. Vive la Vida.
            </p>
          </div>
        </footer>
      </div>
    </>
  );
}
