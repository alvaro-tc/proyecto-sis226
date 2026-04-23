'use client';

import { Seat } from '@/lib/types';

interface SeatGridProps {
  seats: Seat[];
  selectedSeats?: string[];
  onSeatClick?: (seatId: string) => void;
  onSeatHover?: (seat: Seat | null) => void;
  reservedSeats?: string[];
  readOnly?: boolean;
}

export default function SeatGrid({ 
  seats, 
  selectedSeats = [], 
  onSeatClick,
  onSeatHover,
  reservedSeats = [],
  readOnly = false 
}: SeatGridProps) {
  
  // Group seats by row
  const seatsByRow = seats.reduce((acc, seat) => {
    const row = seat.RowNumber;
    if (!acc[row]) acc[row] = [];
    acc[row].push(seat);
    return acc;
  }, {} as Record<string, Seat[]>);

  // Sort rows alphabetically
  const sortedRows = Object.keys(seatsByRow).sort();

  const getSeatColor = (seat: Seat) => {
    const seatId = seat._id;
    
    if (reservedSeats.includes(seatId)) {
      return 'bg-red-500/70 border-red-400/60 text-red-100 cursor-not-allowed';
    }
    
    if (selectedSeats.includes(seatId)) {
      return 'bg-emerald-500 border-emerald-300 text-white hover:bg-emerald-400 cursor-pointer';
    }
    
    // Color by view quality
    switch (seat.ScreenViewInfo) {
      case 'Excellent':
        return 'bg-sky-500/90 border-sky-300/80 text-white hover:bg-sky-400 cursor-pointer';
      case 'Good':
        return 'bg-sky-400/90 border-sky-200/70 text-white hover:bg-sky-300 cursor-pointer';
      case 'Average':
        return 'bg-indigo-400/80 border-indigo-200/70 text-white hover:bg-indigo-300 cursor-pointer';
      case 'Poor':
        return 'bg-gray-500/80 border-gray-300/50 text-white hover:bg-gray-400 cursor-pointer';
      default:
        return 'bg-gray-400/80 border-gray-200/50 text-white hover:bg-gray-300 cursor-pointer';
    }
  };

  const handleSeatClick = (seat: Seat) => {
    if (readOnly || reservedSeats.includes(seat._id)) return;
    if (onSeatClick) onSeatClick(seat._id);
  };

  return (
    <div className="w-full">
      <div className="mb-8">
        <div className="bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800 text-white text-center py-3 rounded-t-3xl mx-auto max-w-2xl border border-gray-600 shadow-lg">
          PANTALLA
        </div>
        <div className="h-8 mx-auto max-w-2xl bg-gradient-to-b from-white/10 to-transparent rounded-b-[2rem] blur-[1px]"></div>
      </div>

      <div className="space-y-2 bg-black/20 border border-gray-800 rounded-2xl p-4 md:p-6">
        {sortedRows.map((row) => {
          const rowSeats = seatsByRow[row].sort((a, b) => a.SeatNumber - b.SeatNumber);
          return (
            <div key={row} className="flex items-center justify-center gap-2">
              <div className="w-8 text-center font-bold text-gray-400">{row}</div>
              
              <div className="flex gap-1">
                {rowSeats.map((seat) => {
                  const isReserved = reservedSeats.includes(seat._id);
                  const isSelected = selectedSeats.includes(seat._id);
                  
                  return (
                    <button
                      key={seat._id}
                      onClick={() => handleSeatClick(seat)}
                      onMouseEnter={() => onSeatHover && onSeatHover(seat)}
                      onMouseLeave={() => onSeatHover && onSeatHover(null)}
                      disabled={readOnly || isReserved}
                      className={`
                        w-9 h-9 md:w-10 md:h-10 rounded-lg border text-xs font-semibold
                        transition-all duration-200 transform hover:scale-105
                        ${getSeatColor(seat)}
                        ${isReserved ? 'opacity-50' : ''}
                      `}
                      title={`Fila ${seat.RowNumber}, Asiento ${seat.SeatNumber}\nVista: ${seat.ScreenViewInfo}\nAcústica: ${seat.AcousticProfile}`}
                    >
                      {seat.SeatNumber}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-8 grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 bg-sky-500 rounded border border-sky-300/80"></div>
          <span>Vista Excelente</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 bg-sky-400 rounded border border-sky-200/70"></div>
          <span>Vista Buena</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 bg-indigo-400 rounded border border-indigo-200/70"></div>
          <span>Vista Regular</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 bg-gray-500 rounded border border-gray-300/50"></div>
          <span>Vista Deficiente</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 bg-emerald-500 rounded border border-emerald-300"></div>
          <span>Seleccionado</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 bg-red-500/70 rounded border border-red-400/60 opacity-70"></div>
          <span>Reservado</span>
        </div>
      </div>
    </div>
  );
}

