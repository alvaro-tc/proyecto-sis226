'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { moviesApi, reviewsApi, sessionsApi } from '@/lib/api';
import { getStoredSession } from '@/lib/auth';
import { Movie, MovieSession, Review } from '@/lib/types';
import SessionCard from '@/components/SessionCard';
import PublicNavigation from '@/components/PublicNavigation';
import Link from 'next/link';
import toast from 'react-hot-toast';

interface ReviewSummary {
  averageScore: number;
  reviewCount: number;
}

export default function MovieDetailPage() {
  const params = useParams();
  const movieId = params.id as string;

  // ESTADO PARA EVITAR ERROR DE HYDRATION
  const [isMounted, setIsMounted] = useState(false);
  
  const [movie, setMovie] = useState<Movie | null>(null);
  const [sessions, setSessions] = useState<MovieSession[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewSummary, setReviewSummary] = useState<ReviewSummary>({ averageScore: 0, reviewCount: 0 });
  const [myReview, setMyReview] = useState<Review | null>(null);
  const [canReview, setCanReview] = useState(false);
  const [reviewReason, setReviewReason] = useState<string | null>(null);
  const [reviewForm, setReviewForm] = useState({ Score: 5, Comment: '' });
  const [loading, setLoading] = useState(true);
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    if (movieId) {
      fetchMovieDetails();
    }
  }, [movieId]);

  const fetchMovieDetails = async () => {
    try {
      setLoading(true);
      const [movieRes, sessionsRes, reviewsRes] = await Promise.all([
        moviesApi.getById(movieId),
        sessionsApi.getAll(),
        reviewsApi.getMovieReviews(movieId),
      ]);

      const movieSessions = sessionsRes.data.filter((session: MovieSession) => {
        const sessionMovieId = typeof session.MovieID === 'object' ? session.MovieID._id : session.MovieID;
        return sessionMovieId === movieId;
      });

      setMovie(movieRes.data);
      setSessions(movieSessions);
      setReviews(reviewsRes.data.reviews);
      setReviewSummary(reviewsRes.data.summary);

      const session = getStoredSession();
      if (session?.user.Role === 'CUSTOMER') {
        try {
          const myStatusRes = await reviewsApi.getMyMovieStatus(movieId);
          const review = myStatusRes.data.review;
          setCanReview(Boolean(myStatusRes.data.canReview));
          setReviewReason(myStatusRes.data.reason);
          setMyReview(review);

          if (review) {
            setReviewForm({
              Score: review.Score,
              Comment: review.Comment || '',
            });
          }
        } catch {
          setCanReview(false);
          setReviewReason('Inicia sesión como cliente para valorar esta película.');
        }
      } else {
        setCanReview(false);
        setMyReview(null);
        setReviewReason('Inicia sesión como cliente para valorar esta película.');
      }
    } catch (error) {
      console.error('Failed to fetch movie details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingReview(true);

    try {
      const response = await reviewsApi.saveMovieReview(movieId, reviewForm);
      setMyReview(response.data.review);
      setReviewSummary(response.data.summary);
      toast.success(myReview ? 'Valoración actualizada correctamente' : 'Valoración enviada correctamente');

      const latestReviews = await reviewsApi.getMovieReviews(movieId);
      setReviews(latestReviews.data.reviews);
      setMovie((current) =>
        current
          ? {
              ...current,
              UserRatingAverage: response.data.summary.averageScore,
              UserRatingCount: response.data.summary.reviewCount,
            }
          : current
      );
    } catch (error: any) {
      const message = error?.response?.data?.error || 'No se pudo guardar tu valoración';
      toast.error(message);
    } finally {
      setSubmittingReview(false);
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

  if (!movie) {
    return (
      <>
        <PublicNavigation />
        <div className="min-h-screen bg-black flex items-center justify-center">
          <div className="text-center">
            <div className="text-8xl mb-6">🎬</div>
            <h2 className="text-3xl font-black text-white mb-4">PELÍCULA NO ENCONTRADA</h2>
            <Link href="/movies" className="text-yellow-400 hover:text-yellow-300 font-bold text-lg">
              ← VOLVER A PELÍCULAS
            </Link>
          </div>
        </div>
      </>
    );
  }

  const hasUserRating = Boolean(movie.UserRatingCount && movie.UserRatingCount > 0);
  const displayRating = hasUserRating ? `${movie.UserRatingAverage?.toFixed(1)}/5` : `${movie.Rating}/10`;

  return (
    <>
      <PublicNavigation />
      <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black">
        <div className="relative bg-gradient-to-br from-black via-red-950 to-black text-white border-b-8 border-red-600">
          <div className="absolute top-0 left-0 right-0 h-3 bg-yellow-500 flex gap-2 px-1 z-20">
            {[...Array(40)].map((_, i) => (
              <div key={i} className="flex-1 bg-black rounded-sm"></div>
            ))}
          </div>

          <div className="absolute inset-0 opacity-20 overflow-hidden">
            <img
              src={movie.PosterURL}
              alt=""
              className="w-full h-full object-cover blur-md scale-110"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent"></div>
          </div>

          <div className="relative container mx-auto px-4 py-6 md:py-8 md:pt-12">
            <Link href="/movies" className="inline-flex items-center gap-2 text-yellow-400 hover:text-yellow-300 mb-6 md:mb-8 font-bold text-sm md:text-base transition-colors group">
              <svg className="w-6 h-6 transform group-hover:-translate-x-2 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" />
              </svg>
              VOLVER A PELÍCULAS
            </Link>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-12">
              <div className="md:col-span-1">
                <div className="relative bg-gradient-to-br from-gray-900 to-black p-3 md:p-4 rounded-2xl border-2 md:border-4 border-yellow-500">
                  <img
                    src={movie.PosterURL}
                    alt={movie.MovieName}
                    className="w-full rounded-xl shadow-2xl"
                    onError={(e) => {
                      e.currentTarget.src = 'https://via.placeholder.com/300x450?text=No+Poster';
                    }}
                  />
                </div>
              </div>

              <div className="md:col-span-2 space-y-6">
                <div>
                  <h1 className="text-3xl sm:text-4xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-yellow-400 to-red-500 mb-2 tracking-wide md:tracking-wider leading-tight">
                    {movie.MovieName}
                  </h1>
                  <div className="h-1 w-32 bg-gradient-to-r from-red-500 to-transparent mb-6"></div>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-2 bg-gradient-to-r from-yellow-500 to-yellow-600 text-black px-4 py-2.5 md:px-6 md:py-3 rounded-lg font-black shadow-lg shadow-yellow-500/50">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <span className="text-lg md:text-2xl">{displayRating}</span>
                  </div>

                  <div className="bg-gray-800 text-yellow-400 px-4 py-2.5 md:px-6 md:py-3 rounded-lg font-bold text-sm md:text-lg border-2 border-gray-700">
                    {reviewSummary.reviewCount} valoraciones
                  </div>

                  <div className="bg-gradient-to-r from-red-600 to-red-700 px-4 py-2.5 md:px-6 md:py-3 rounded-lg font-black text-lg md:text-2xl shadow-lg shadow-red-500/50 border-2 border-red-400">
                    {movie.AgeLimit}+
                  </div>

                  <div className="bg-red-600/20 text-red-400 px-4 py-2.5 md:px-6 md:py-3 rounded-lg font-bold text-sm md:text-lg border-2 border-red-600/50 uppercase tracking-wider">
                    {movie.Genre}
                  </div>
                </div>

                <div className="space-y-5 md:space-y-6 bg-gradient-to-br from-gray-900/80 to-black/80 backdrop-blur-sm p-5 md:p-8 rounded-2xl border-2 border-gray-800">
                  <div>
                    <h3 className="text-sm font-black text-yellow-400 mb-2 tracking-widest">DIRECTOR</h3>
                    <p className="text-xl md:text-2xl font-bold text-white">{movie.Director}</p>
                  </div>

                  <div>
                    <h3 className="text-sm font-black text-yellow-400 mb-2 tracking-widest">REPARTO</h3>
                    <p className="text-base md:text-xl text-gray-300 leading-relaxed">{movie.Cast.join(', ')}</p>
                  </div>

                  <div>
                    <h3 className="text-sm font-black text-yellow-400 mb-2 tracking-widest">SINOPSIS</h3>
                    <p className="text-base md:text-lg text-gray-300 leading-relaxed">{movie.Description}</p>
                  </div>
                </div>

                {movie.TrailerURL && (
                  <a
                    href={movie.TrailerURL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white px-6 py-3 md:px-8 md:py-4 rounded-xl font-black text-base md:text-lg transition-all shadow-2xl shadow-red-500/50"
                  >
                    VER TRÁILER
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-12 md:py-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-yellow-400 to-red-500 tracking-wider">
              FUNCIONES
            </h2>
          </div>

          {sessions.length === 0 ? (
            <div className="bg-gradient-to-br from-gray-900 to-black rounded-3xl shadow-2xl p-8 md:p-16 text-center border-4 border-red-600">
              <h3 className="text-2xl md:text-4xl font-black text-white mb-4">NO HAY FUNCIONES DISPONIBLES</h3>
              <p className="text-gray-400 text-base md:text-xl">Vuelve más tarde para ver próximas funciones</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sessions.map((session) => (
                <SessionCard key={session._id} session={session} />
              ))}
            </div>
          )}
        </div>

        <div className="container mx-auto px-4 pb-12 md:pb-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-gradient-to-br from-gray-900 to-black border-4 border-yellow-500 rounded-2xl p-5 md:p-8">
              <h2 className="text-2xl md:text-3xl font-black text-yellow-400 mb-6">VALORACIONES DE CLIENTES</h2>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-black/40 border border-yellow-500/20 rounded-xl p-4">
                  <p className="text-gray-400 text-sm">Promedio</p>
                  <p className="text-2xl md:text-4xl font-black text-white">{reviewSummary.averageScore.toFixed(1)}/5</p>
                </div>
                <div className="bg-black/40 border border-yellow-500/20 rounded-xl p-4">
                  <p className="text-gray-400 text-sm">Opiniones</p>
                  <p className="text-2xl md:text-4xl font-black text-white">{reviewSummary.reviewCount}</p>
                </div>
              </div>

              <div className="space-y-4 max-h-[420px] overflow-y-auto pr-2">
                {reviews.length === 0 ? (
                  <p className="text-gray-400">Todavía no hay valoraciones de clientes para esta película.</p>
                ) : (
                  reviews.map((review) => {
                    const customer = typeof review.CustomerID === 'object' ? review.CustomerID : null;

                    return (
                      <div key={review._id} className="bg-black/40 border border-white/10 rounded-xl p-4">
                        <div className="flex items-center justify-between gap-4 mb-3">
                          <p className="text-white font-bold">
                            {customer ? `${customer.Name} ${customer.Surname}` : 'Cliente'}
                          </p>
                          <span className="text-yellow-400 font-black">{review.Score}/5</span>
                        </div>
                        <p className="text-gray-300">{review.Comment || 'Sin comentario adicional.'}</p>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className="bg-gradient-to-br from-gray-900 to-black border-4 border-emerald-500 rounded-2xl p-5 md:p-8">
              <h2 className="text-2xl md:text-3xl font-black text-yellow-400 mb-6">TU VALORACIÓN</h2>

              {canReview ? (
                <form onSubmit={handleSubmitReview} className="space-y-5">
                  <div>
                    <p className="text-sm text-gray-400 mb-3">Puntúa esta película</p>
                    <div className="flex flex-wrap gap-2">
                      {[1, 2, 3, 4, 5].map((score) => (
                        <button
                          key={score}
                          type="button"
                          onClick={() => setReviewForm({ ...reviewForm, Score: score })}
                          className={`px-4 py-3 rounded-lg font-black transition-all ${
                            reviewForm.Score === score
                              ? 'bg-yellow-500 text-black'
                              : 'bg-gray-800 text-white border border-gray-700'
                          }`}
                        >
                          {score} ★
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Comentario</label>
                    <textarea
                      value={reviewForm.Comment}
                      onChange={(e) => setReviewForm({ ...reviewForm, Comment: e.target.value })}
                      rows={6}
                      className="w-full px-4 py-3 bg-gray-800 border-2 border-gray-700 rounded-lg text-white resize-none focus:outline-none focus:border-emerald-500"
                      placeholder="Cuéntales a otros clientes cómo fue tu experiencia..."
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submittingReview}
                    className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 disabled:from-gray-700 disabled:to-gray-800 text-black font-black py-4 rounded-xl"
                  >
                    {submittingReview ? 'GUARDANDO...' : myReview ? 'ACTUALIZAR VALORACIÓN' : 'ENVIAR VALORACIÓN'}
                  </button>
                </form>
              ) : (
                <div className="space-y-4">
                  <p className="text-gray-300">{reviewReason || 'Necesitas haber visto la película para valorarla.'}</p>
                  {!getStoredSession() && (
                    <Link
                      href={`/account/login?redirect=${encodeURIComponent(`/movies/${movieId}`)}`}
                      className="inline-block px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl font-black"
                    >
                      INICIAR SESIÓN
                    </Link>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
