"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { meApi, reservationsApi } from "@/lib/api";
import { Reservation } from "@/lib/types";
import PaymentForm from "@/components/PaymentForm";
import PublicNavigation from "@/components/PublicNavigation";
import toast from "react-hot-toast";

export default function PaymentPage() {
  const params = useParams();
  const router = useRouter();
  const reservationId = params.reservationId as string;

  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [totalAmount, setTotalAmount] = useState(0);

  useEffect(() => {
    if (reservationId) {
      fetchReservationData();
    }
  }, [reservationId]);

  const fetchReservationData = async () => {
    try {
      setLoading(true);
      const reservationRes = await reservationsApi.getById(reservationId);
      const reservationData = reservationRes.data;
      setReservation(reservationData);

      const seatCount = reservationData.SeatIDs?.length || 1;
      const sessionPrice =
        typeof reservationData.SessionID === "object"
          ? reservationData.SessionID.Price
          : 0;
      const total = seatCount * sessionPrice;
      setTotalAmount(total);
    } catch (error) {
      console.error("Failed to fetch reservation data:", error);
      toast.error("No se pudo cargar la información de la reserva");
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSubmit = async (paymentData: {
    cardNumber: string;
    cardholderName: string;
    expiryDate: string;
    cvv: string;
  }) => {
    setSubmitting(true);

    try {
      await meApi.payReservation(reservationId, {
        PaymentMethod: "Credit Card",
        cardNumber: paymentData.cardNumber,
        cardholderName: paymentData.cardholderName,
        expiryDate: paymentData.expiryDate,
        cvv: paymentData.cvv,
      });

      toast.success("Pago exitoso. Tus entradas fueron generadas.");
      router.push(`/confirmation/${reservationId}`);
    } catch (error: any) {
      const details = error?.response?.data?.details;
      const message =
        error?.response?.data?.error ||
        "El pago falló. Por favor, inténtalo de nuevo.";
      const detailsMessage = details ? Object.values(details).join(" | ") : "";
      const fullMessage = detailsMessage
        ? `${message}: ${detailsMessage}`
        : message;
      console.error("Payment error response:", error?.response?.data);
      toast.error(fullMessage);
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
              <div className="text-4xl animate-pulse">💳</div>
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
            <h2 className="text-3xl font-black text-white mb-4">
              RESERVA NO ENCONTRADA
            </h2>
          </div>
        </div>
      </>
    );
  }

  const movieName =
    typeof reservation.SessionID === "object" &&
    typeof reservation.SessionID.MovieID === "object"
      ? reservation.SessionID.MovieID.MovieName
      : "Película";

  const moviePoster =
    typeof reservation.SessionID === "object" &&
    typeof reservation.SessionID.MovieID === "object"
      ? reservation.SessionID.MovieID.PosterURL
      : "";

  const sessionDateTime =
    typeof reservation.SessionID === "object"
      ? reservation.SessionID.SessionDateTime
      : new Date().toISOString();

  const seatCount = reservation.SeatIDs?.length || 0;

  return (
    <>
      <PublicNavigation />
      <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black py-8 md:py-12">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-8 md:mb-12">
            <div className="inline-block relative mb-6">
              <div className="absolute -inset-4 bg-gradient-to-r from-red-600 via-yellow-500 to-red-600 blur-2xl opacity-50 animate-pulse"></div>
              <h1 className="relative text-4xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-yellow-400 to-red-500 tracking-wider">
                PAGO
              </h1>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-gradient-to-br from-gray-900 to-black rounded-2xl border-4 border-yellow-500 p-4 md:p-8 relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-3 bg-yellow-500 flex gap-1 px-1">
                {[...Array(20)].map((_, i) => (
                  <div key={i} className="flex-1 bg-black rounded-sm"></div>
                ))}
              </div>

              <h2 className="text-2xl md:text-3xl font-black text-yellow-400 mb-6 mt-3 tracking-wider">
                RESUMEN DEL PEDIDO
              </h2>

              <div className="flex flex-col sm:flex-row gap-4 md:gap-6 mb-8">
                {moviePoster && (
                  <div className="flex-shrink-0">
                    <img
                      src={moviePoster}
                      alt={movieName}
                      className="w-28 h-40 md:w-32 md:h-48 object-cover rounded-xl border-4 border-yellow-500 shadow-2xl"
                    />
                  </div>
                )}
                <div className="flex-1">
                  <h3 className="text-xl md:text-2xl font-black text-white mb-3">
                    {movieName}
                  </h3>
                  <div className="space-y-2 text-gray-300">
                    <p>
                      {new Date(sessionDateTime).toLocaleDateString("es-ES", {
                        weekday: "long",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                    <p>
                      {new Date(sessionDateTime).toLocaleTimeString("es-ES", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-800/50 rounded-xl p-4 md:p-6 border-2 border-gray-700 space-y-4">
                <div className="flex justify-between items-center pb-3 border-b border-gray-700">
                  <span className="text-gray-400 font-semibold">
                    Asientos Seleccionados
                  </span>
                  <span className="text-white font-black text-lg md:text-xl">
                    {seatCount}
                  </span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b border-gray-700">
                  <span className="text-gray-400 font-semibold">
                    Precio por Asiento
                  </span>
                  <span className="text-white font-black text-lg md:text-xl">
                    $
                    {seatCount > 0
                      ? (totalAmount / seatCount).toFixed(2)
                      : "0.00"}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-3 bg-gradient-to-r from-yellow-500/20 to-red-500/20 rounded-lg px-4 py-3 border-2 border-yellow-500/30">
                  <span className="text-yellow-400 font-black text-xl md:text-2xl tracking-wider">
                    TOTAL
                  </span>
                  <span className="text-yellow-400 font-black text-3xl md:text-4xl">
                    ${totalAmount.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-gray-900 to-black rounded-2xl border-4 border-red-600 p-4 md:p-8">
              <h2 className="text-2xl md:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-yellow-400 mb-6 tracking-wider">
                DATOS DEL PAGO
              </h2>

              <PaymentForm
                onSubmit={handlePaymentSubmit}
                totalAmount={totalAmount}
                isSubmitting={submitting}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
