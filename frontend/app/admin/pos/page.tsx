'use client';

import { useState, useEffect } from 'react';
import { sessionsApi, seatsApi, posApi, snackCategoriesApi, snackProductsApi, snackSalesApi, customersApi } from '@/lib/api';
import { Seat } from '@/lib/types';
import Modal from '@/components/Modal';
import SeatGrid from '@/components/SeatGrid';
import SeatPreview from '@/components/SeatPreview';
import toast from 'react-hot-toast';

// ─── Types ─────────────────────────────────────────────────────────────────

type Session = {
  _id: string;
  MovieID: { _id: string; MovieName: string; Duration: number; Genre: string };
  HallID: { _id: string; HallName: string; Capacity: number };
  SessionDateTime: string;
  Price: number;
  Language: string;
};

type SnackCategory = { _id: string; Name: string; IsActive: boolean };
type SnackProduct = { _id: string; Name: string; Category: SnackCategory; Price: number; Stock: number; IsActive: boolean };
type CartItem = { product: SnackProduct; quantity: number };
type Customer = {
  _id: string;
  Name: string;
  Surname: string;
  CI: string;
  Email: string;
  PhoneNumber: string;
};

type SaleResult = {
  tickets: {
    movie: string;
    hall: string;
    sessionDateTime: string;
    seats: string[];
    totalAmount: number;
    paymentMethod: string;
    ticketCodes: string[];
  } | null;
  snacks: {
    items: { name: string; qty: number; price: number }[];
    totalAmount: number;
  } | null;
};

const PAYMENT_METHODS = [
  { value: 'Cash', label: '💵 Efectivo', snackValue: 'Cash' },
  { value: 'Credit Card', label: '💳 Tarjeta', snackValue: 'Card' },
  { value: 'Online', label: '📱 Online', snackValue: 'Online' },
] as const;

// ─── Main Page ─────────────────────────────────────────────────────────────

export default function PosPage() {
  const [step, setStep] = useState<'sessions' | 'pos'>('sessions');

  // Session / seat state
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [seats, setSeats] = useState<Seat[]>([]);
  const [soldSeatIds, setSoldSeatIds] = useState<string[]>([]);
  const [selectedSeatIds, setSelectedSeatIds] = useState<string[]>([]);
  const [hoveredSeat, setHoveredSeat] = useState<Seat | null>(null);
  const [isSeatModalOpen, setIsSeatModalOpen] = useState(false);
  const [loadingSeats, setLoadingSeats] = useState(false);

  // Snack state
  const [categories, setCategories] = useState<SnackCategory[]>([]);
  const [products, setProducts] = useState<SnackProduct[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loadingSnacks, setLoadingSnacks] = useState(false);

  // Checkout state
  const [paymentMethod, setPaymentMethod] = useState<string>('Cash');
  const [notes, setNotes] = useState('');
  const [processing, setProcessing] = useState(false);
  const [saleResult, setSaleResult] = useState<SaleResult | null>(null);

  // Customer state
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerSearch, setCustomerSearch] = useState('');
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [loadingCustomers, setLoadingCustomers] = useState(false);

  useEffect(() => { 
    loadSessions(); 
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    setLoadingCustomers(true);
    try {
      const res = await customersApi.getAll();
      setCustomers(res.data);
    } catch {
      toast.error('Error al cargar clientes');
    } finally {
      setLoadingCustomers(false);
    }
  };

  const loadSessions = async () => {
    setLoadingSessions(true);
    try {
      const res = await sessionsApi.getAll();
      const now = new Date();
      const upcoming = (res.data as Session[]).filter(
        s => new Date(s.SessionDateTime) > now
      );
      setSessions(upcoming);
    } catch {
      toast.error('Error al cargar funciones');
    } finally {
      setLoadingSessions(false);
    }
  };

  const loadSnacks = async () => {
    setLoadingSnacks(true);
    try {
      const [catRes, prodRes] = await Promise.all([
        snackCategoriesApi.getAll(),
        snackProductsApi.getAll({ active: true }),
      ]);
      setCategories((catRes.data as SnackCategory[]).filter(c => c.IsActive));
      setProducts(prodRes.data);
    } catch {
      toast.error('Error al cargar productos');
    } finally {
      setLoadingSnacks(false);
    }
  };

  const handleSelectSession = async (session: Session) => {
    setSelectedSession(session);
    setSelectedSeatIds([]);
    setHoveredSeat(null);
    setLoadingSeats(true);
    setIsSeatModalOpen(true);
    try {
      const [seatsRes, availRes] = await Promise.all([
        seatsApi.getAll(session.HallID._id),
        sessionsApi.getAvailability(session._id),
      ]);
      setSeats(seatsRes.data as Seat[]);
      setSoldSeatIds(availRes.data.soldSeatIds);
    } catch {
      toast.error('Error al cargar asientos');
      setIsSeatModalOpen(false);
    } finally {
      setLoadingSeats(false);
    }
  };

  const handleConfirmSeats = () => {
    if (selectedSeatIds.length === 0) {
      toast.error('Por favor selecciona al menos un asiento');
      return;
    }
    setIsSeatModalOpen(false);
    setHoveredSeat(null);
    if (step === 'sessions') {
      loadSnacks();
      setStep('pos');
    }
  };

  const handleChangeSession = () => {
    setStep('sessions');
    setSelectedSession(null);
    setSelectedSeatIds([]);
    setCart([]);
    loadSessions();
  };

  const handleOpenSeatModal = async () => {
    if (!selectedSession) return;
    setHoveredSeat(null);
    setLoadingSeats(true);
    setIsSeatModalOpen(true);
    try {
      const [seatsRes, availRes] = await Promise.all([
        seatsApi.getAll(selectedSession.HallID._id),
        sessionsApi.getAvailability(selectedSession._id),
      ]);
      setSeats(seatsRes.data as Seat[]);
      setSoldSeatIds(availRes.data.soldSeatIds);
    } catch {
      toast.error('Error al cargar asientos');
      setIsSeatModalOpen(false);
    } finally {
      setLoadingSeats(false);
    }
  };

  // ── Snack cart ─────────────────────────────────────────────────────────

  const filteredProducts = selectedCategory === 'all'
    ? products
    : products.filter(p => p.Category?._id === selectedCategory);

  const addToCart = (product: SnackProduct) => {
    if (product.Stock <= 0) { toast.error('Sin stock disponible'); return; }
    setCart(prev => {
      const existing = prev.find(i => i.product._id === product._id);
      if (existing) {
        if (existing.quantity >= product.Stock) { toast.error('Stock insuficiente'); return prev; }
        return prev.map(i => i.product._id === product._id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const updateQty = (productId: string, qty: number) => {
    if (qty <= 0) { setCart(prev => prev.filter(i => i.product._id !== productId)); return; }
    setCart(prev => prev.map(i =>
      i.product._id === productId ? { ...i, quantity: Math.min(qty, i.product.Stock) } : i
    ));
  };

  // ── Totals ─────────────────────────────────────────────────────────────

  const ticketSubtotal = selectedSeatIds.length * (selectedSession?.Price || 0);
  const snackSubtotal = cart.reduce((sum, i) => sum + i.product.Price * i.quantity, 0);
  const grandTotal = ticketSubtotal + snackSubtotal;

  // ── Checkout ───────────────────────────────────────────────────────────

  const handleCheckout = async () => {
    if (!selectedSession || selectedSeatIds.length === 0) {
      toast.error('Selecciona una función y asientos para continuar');
      return;
    }
    setProcessing(true);
    const pm = PAYMENT_METHODS.find(m => m.value === paymentMethod);
    try {
      const ticketRes = await posApi.sellTickets({
        SessionID: selectedSession._id,
        SeatIDs: selectedSeatIds,
        PaymentMethod: paymentMethod,
        CustomerID: selectedCustomer?._id,
      });

      let snackResult = null;
      if (cart.length > 0) {
        const snackRes = await snackSalesApi.create({
          Items: cart.map(i => ({ ProductID: i.product._id, Quantity: i.quantity })),
          PaymentMethod: (pm?.snackValue || 'Cash') as 'Cash' | 'Card' | 'Online',
          Notes: notes,
          CustomerID: selectedCustomer?._id,
        });
        snackResult = {
          items: cart.map(i => ({ name: i.product.Name, qty: i.quantity, price: i.product.Price })),
          totalAmount: snackRes.data.TotalAmount ?? snackSubtotal,
        };
      }

      setSaleResult({
        tickets: ticketRes.data.summary,
        snacks: snackResult,
      });
      toast.success('¡Venta completada!');
    } catch (e: any) {
      toast.error(e?.response?.data?.error || 'Error al procesar la venta');
    } finally {
      setProcessing(false);
    }
  };

  const handleNewSale = () => {
    setSaleResult(null);
    setSelectedSession(null);
    setSelectedSeatIds([]);
    setCart([]);
    setNotes('');
    setSelectedCustomer(null);
    setCustomerSearch('');
    setStep('sessions');
    loadSessions();
  };

  // ── Success screen ─────────────────────────────────────────────────────

  if (saleResult) {
    return <SaleSuccess result={saleResult} onNew={handleNewSale} />;
  }

  // ── Selected seat objects (for display) ────────────────────────────────

  const selectedSeatObjects = seats.filter(s => selectedSeatIds.includes(s._id));

  const categoryEmoji = (name?: string) => {
    if (!name) return '🍫';
    const n = name.toLowerCase();
    if (n.includes('bebida')) return '🥤';
    if (n.includes('palomita')) return '🍿';
    if (n.includes('dulce')) return '🍬';
    if (n.includes('nacho') || n.includes('snack')) return '🌮';
    if (n.includes('combo')) return '🎁';
    return '🍫';
  };

  // ── Render ─────────────────────────────────────────────────────────────

  return (
    <div className="h-[calc(100vh-130px)] flex overflow-hidden">

      {/* ── Left area ───────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto bg-gray-50">
        {step === 'sessions' ? (
          // Session selection
          <div className="p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4">Selecciona una función</h2>
            {loadingSessions ? (
              <div className="text-center py-20 text-gray-400">Cargando funciones...</div>
            ) : sessions.length === 0 ? (
              <div className="text-center py-20 text-gray-400">No hay funciones próximas disponibles</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {sessions.map(session => {
                  const dt = new Date(session.SessionDateTime);
                  const isToday = dt.toDateString() === new Date().toDateString();
                  return (
                    <button
                      key={session._id}
                      onClick={() => handleSelectSession(session)}
                      className="bg-white rounded-xl p-5 text-left shadow-sm hover:shadow-md border-2 border-transparent hover:border-orange-400 transition-all active:scale-95"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-orange-100 text-orange-700">
                          {isToday ? 'HOY' : dt.toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short' })}
                        </span>
                        <span className="text-lg font-bold text-green-600">${session.Price.toFixed(2)}</span>
                      </div>
                      <h3 className="font-bold text-gray-900 text-lg leading-tight mb-1">
                        {session.MovieID.MovieName}
                      </h3>
                      <p className="text-xs text-gray-500 mb-3">
                        {session.MovieID.Genre} · {session.Language}
                      </p>
                      <div className="flex items-center justify-between text-sm text-gray-600">
                        <span>🏛️ {session.HallID.HallName}</span>
                        <span className="font-semibold text-gray-900">
                          {dt.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div className="mt-2 text-xs text-gray-400">
                        Capacidad: {session.HallID.Capacity} asientos
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          // Snack product catalog (after seats confirmed)
          <div className="flex flex-col h-full overflow-hidden">
            {/* Session summary bar */}
            <div className="bg-white border-b border-gray-200 px-4 py-2 flex items-center gap-3 shrink-0">
              <span className="text-sm font-bold text-gray-900">🎬 {selectedSession?.MovieID.MovieName}</span>
              <span className="text-gray-400">·</span>
              <span className="text-sm text-gray-600">{selectedSession?.HallID.HallName}</span>
              <span className="text-gray-400">·</span>
              <span className="text-sm text-gray-600">
                {selectedSession && new Date(selectedSession.SessionDateTime).toLocaleString('es-MX', {
                  weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                })}
              </span>
              <button
                onClick={handleOpenSeatModal}
                className="ml-auto text-xs text-purple-600 hover:text-purple-800 font-medium border border-purple-200 px-2 py-1 rounded-lg hover:bg-purple-50 transition-colors"
              >
                Cambiar asientos ({selectedSeatIds.length})
              </button>
              <button
                onClick={handleChangeSession}
                className="text-xs text-gray-500 hover:text-gray-700 font-medium border border-gray-200 px-2 py-1 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cambiar función
              </button>
            </div>

            {/* Category filter */}
            <div className="px-4 py-3 bg-white border-b border-gray-100 flex gap-2 overflow-x-auto shrink-0">
              <span className="text-xs font-semibold text-gray-400 self-center pr-1">🍿 Snacks:</span>
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${selectedCategory === 'all' ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
                Todos
              </button>
              {categories.map(c => (
                <button
                  key={c._id}
                  onClick={() => setSelectedCategory(c._id)}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${selectedCategory === c._id ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                >
                  {c.Name}
                </button>
              ))}
            </div>

            {/* Products grid */}
            <div className="flex-1 overflow-y-auto p-4">
              {loadingSnacks ? (
                <div className="text-center py-20 text-gray-400">Cargando productos...</div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                  {filteredProducts.map(p => {
                    const inCart = cart.find(i => i.product._id === p._id)?.quantity || 0;
                    const outOfStock = p.Stock <= 0;
                    return (
                      <button
                        key={p._id}
                        onClick={() => addToCart(p)}
                        disabled={outOfStock}
                        className={`relative bg-white rounded-xl p-4 text-left shadow-sm hover:shadow-md transition-all border-2 ${inCart > 0 ? 'border-orange-400' : 'border-transparent'} ${outOfStock ? 'opacity-50 cursor-not-allowed' : 'hover:border-orange-300 active:scale-95'}`}
                      >
                        {inCart > 0 && (
                          <span className="absolute top-2 right-2 bg-orange-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                            {inCart}
                          </span>
                        )}
                        <div className="text-3xl mb-2 text-center">{categoryEmoji(p.Category?.Name)}</div>
                        <div className="text-sm font-semibold text-gray-900 leading-tight mb-1">{p.Name}</div>
                        <div className="text-base font-bold text-green-600">${p.Price.toFixed(2)}</div>
                        <div className={`text-xs mt-1 ${p.Stock <= 5 ? 'text-orange-500' : 'text-gray-400'}`}>
                          {outOfStock ? 'Sin stock' : `Stock: ${p.Stock}`}
                        </div>
                      </button>
                    );
                  })}
                  {filteredProducts.length === 0 && (
                    <div className="col-span-5 text-center py-12 text-gray-400">No hay productos en esta categoría</div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Right: Unified sale summary ──────────────────────────────── */}
      <div className="w-80 xl:w-96 bg-white border-l border-gray-200 flex flex-col shrink-0">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-bold text-gray-900">Resumen de venta</h2>
        </div>

        <div className="flex-1 overflow-y-auto">
          {!selectedSession ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 py-12 text-center px-4">
              <span className="text-5xl mb-3">🎬</span>
              <p className="text-sm">Selecciona una función para comenzar</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {/* ── Tickets section ── */}
              <div className="p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">🎟 Boletos</p>
                  {step === 'pos' && (
                    <button
                      onClick={handleOpenSeatModal}
                      className="text-xs text-purple-600 hover:text-purple-800 font-medium"
                    >
                      Editar asientos
                    </button>
                  )}
                </div>

                <div className="bg-orange-50 rounded-xl p-3 border border-orange-100">
                  <p className="font-bold text-orange-900 text-sm">{selectedSession.MovieID.MovieName}</p>
                  <p className="text-orange-700 text-xs mt-0.5">{selectedSession.HallID.HallName}</p>
                  <p className="text-orange-600 text-xs">
                    {new Date(selectedSession.SessionDateTime).toLocaleString('es-MX', {
                      weekday: 'long', day: 'numeric', month: 'long',
                      hour: '2-digit', minute: '2-digit'
                    })}
                  </p>
                  <p className="text-orange-800 text-xs font-semibold mt-1">
                    ${selectedSession.Price.toFixed(2)} / asiento
                  </p>
                </div>

                {selectedSeatIds.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-2">Sin asientos seleccionados</p>
                ) : (
                  <>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedSeatObjects
                        .sort((a, b) => a.RowNumber.localeCompare(b.RowNumber) || a.SeatNumber - b.SeatNumber)
                        .map(seat => (
                          <span
                            key={seat._id}
                            className="px-2.5 py-1 bg-orange-100 text-orange-800 rounded-lg text-sm font-semibold"
                          >
                            {seat.RowNumber}{seat.SeatNumber}
                          </span>
                        ))}
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">{selectedSeatIds.length} boleto{selectedSeatIds.length !== 1 ? 's' : ''} × ${selectedSession.Price.toFixed(2)}</span>
                      <span className="font-bold text-gray-900">${ticketSubtotal.toFixed(2)}</span>
                    </div>
                  </>
                )}
              </div>

              {/* ── Snacks section (only when in pos step) ── */}
              {step === 'pos' && (
                <div className="p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">🍿 Snacks</p>
                    {cart.length > 0 && (
                      <button onClick={() => setCart([])} className="text-xs text-red-500 hover:text-red-700">Vaciar</button>
                    )}
                  </div>

                  {cart.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-2">Sin snacks agregados</p>
                  ) : (
                    <>
                      <div className="space-y-2">
                        {cart.map(item => (
                          <div key={item.product._id} className="flex items-center gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium text-gray-900 truncate">{item.product.Name}</div>
                              <div className="text-xs text-gray-400">${item.product.Price.toFixed(2)} c/u</div>
                            </div>
                            <div className="flex items-center gap-1">
                              <button onClick={() => updateQty(item.product._id, item.quantity - 1)} className="w-6 h-6 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-xs font-bold">−</button>
                              <span className="w-6 text-center text-sm font-semibold">{item.quantity}</span>
                              <button onClick={() => updateQty(item.product._id, item.quantity + 1)} className="w-6 h-6 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-xs font-bold">+</button>
                            </div>
                            <div className="text-sm font-bold text-gray-900 w-12 text-right">
                              ${(item.product.Price * item.quantity).toFixed(2)}
                            </div>
                            <button onClick={() => setCart(prev => prev.filter(i => i.product._id !== item.product._id))} className="text-gray-300 hover:text-red-500">✕</button>
                          </div>
                        ))}
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">{cart.reduce((s, i) => s + i.quantity, 0)} producto{cart.reduce((s, i) => s + i.quantity, 0) !== 1 ? 's' : ''}</span>
                        <span className="font-bold text-gray-900">${snackSubtotal.toFixed(2)}</span>
                      </div>
                    </>
                  )}

                  {/* Notes */}
                  {cart.length > 0 && (
                    <input
                      value={notes}
                      onChange={e => setNotes(e.target.value)}
                      placeholder="Notas del pedido (opcional)..."
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  )}
                </div>
              )}
              {/* ── Customer section ── */}
              <div className="p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">👤 Cliente (Opcional)</p>
                  <button
                    onClick={() => setIsCustomerModalOpen(true)}
                    className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                  >
                    + Nuevo
                  </button>
                </div>

                {!selectedCustomer ? (
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Buscar por CI o nombre..."
                      value={customerSearch}
                      onChange={e => setCustomerSearch(e.target.value)}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                    {customerSearch.length >= 2 && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                        {customers
                          .filter(c => 
                            c.CI.toLowerCase().includes(customerSearch.toLowerCase()) ||
                            `${c.Name} ${c.Surname}`.toLowerCase().includes(customerSearch.toLowerCase())
                          )
                          .slice(0, 5)
                          .map(c => (
                            <button
                              key={c._id}
                              onClick={() => {
                                setSelectedCustomer(c);
                                setCustomerSearch('');
                              }}
                              className="w-full px-3 py-2 text-left text-sm hover:bg-indigo-50 transition-colors border-b last:border-0"
                            >
                              <div className="font-bold text-gray-900">{c.Name} {c.Surname}</div>
                              <div className="text-xs text-gray-500">CI: {c.CI}</div>
                            </button>
                          ))}
                        {customers.filter(c => 
                          c.CI.toLowerCase().includes(customerSearch.toLowerCase()) ||
                          `${c.Name} ${c.Surname}`.toLowerCase().includes(customerSearch.toLowerCase())
                        ).length === 0 && (
                          <div className="px-3 py-2 text-sm text-gray-400">No se encontraron clientes</div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-indigo-50 rounded-xl p-3 border border-indigo-100 flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-bold text-indigo-900 text-sm">{selectedCustomer.Name} {selectedCustomer.Surname}</p>
                      <p className="text-indigo-700 text-xs mt-0.5">CI: {selectedCustomer.CI}</p>
                    </div>
                    <button
                      onClick={() => setSelectedCustomer(null)}
                      className="text-indigo-300 hover:text-red-500 transition-colors ml-2"
                    >
                      ✕
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ── Payment + total + checkout ── */}
        <div className="border-t border-gray-200 p-5 space-y-4">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Método de pago</p>
            <div className="grid grid-cols-3 gap-1.5">
              {PAYMENT_METHODS.map(m => (
                <button
                  key={m.value}
                  onClick={() => setPaymentMethod(m.value)}
                  className={`py-2 rounded-lg text-xs font-semibold transition-colors ${
                    paymentMethod === m.value
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Grand total breakdown */}
          <div className="space-y-1 pt-2 border-t border-gray-100">
            {selectedSeatIds.length > 0 && (
              <div className="flex justify-between text-xs text-gray-500">
                <span>Boletos ({selectedSeatIds.length})</span>
                <span>${ticketSubtotal.toFixed(2)}</span>
              </div>
            )}
            {cart.length > 0 && (
              <div className="flex justify-between text-xs text-gray-500">
                <span>Snacks ({cart.reduce((s, i) => s + i.quantity, 0)})</span>
                <span>${snackSubtotal.toFixed(2)}</span>
              </div>
            )}
            <div className="flex items-center justify-between pt-1">
              <span className="text-sm font-bold text-gray-900">Total</span>
              <span className="text-2xl font-bold text-gray-900">${grandTotal.toFixed(2)}</span>
            </div>
          </div>

          <button
            onClick={handleCheckout}
            disabled={!selectedSession || selectedSeatIds.length === 0 || processing}
            className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-gray-200 disabled:text-gray-400 text-white font-bold py-4 rounded-xl transition-colors text-lg"
          >
            {processing ? 'Procesando...' : `Cobrar $${grandTotal.toFixed(2)}`}
          </button>
        </div>
      </div>

      {/* ── Seat Selection Modal (same as reservations) ─────────────── */}
      <Modal
        isOpen={isSeatModalOpen}
        onClose={() => { setIsSeatModalOpen(false); setHoveredSeat(null); }}
        title={`Seleccionar Asientos — ${selectedSession?.MovieID.MovieName ?? ''}`}
        size="full"
      >
        <div className="mb-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-4 border border-purple-200">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-gray-700 mb-1">
                <strong className="text-purple-700">Asientos Seleccionados:</strong> {selectedSeatIds.length}
              </p>
              <p className="text-sm text-gray-600">
                Haz clic en los asientos disponibles para seleccionarlos. Pasa el cursor sobre un asiento para ver la vista y el perfil acústico.
              </p>
            </div>
            {selectedSession && (
              <div className="text-right">
                <p className="text-sm font-medium text-gray-700">{selectedSession.HallID.HallName}</p>
                <p className="text-xs text-gray-500">Capacidad: {selectedSession.HallID.Capacity}</p>
              </div>
            )}
          </div>
        </div>

        {loadingSeats ? (
          <div className="text-center py-20 text-gray-400">Cargando asientos...</div>
        ) : (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" style={{ minHeight: '700px', maxHeight: '70vh' }}>
              {/* Seat Grid */}
              <div className="order-2 lg:order-1 h-full">
                <div className="bg-gray-50 rounded-lg p-4 overflow-y-auto h-full">
                  <h3 className="text-lg font-semibold mb-3 text-gray-900">Selecciona tus Asientos</h3>
                  <SeatGrid
                    seats={seats}
                    selectedSeats={selectedSeatIds}
                    onSeatClick={id => setSelectedSeatIds(prev =>
                      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
                    )}
                    onSeatHover={setHoveredSeat}
                    reservedSeats={soldSeatIds}
                  />
                </div>
              </div>

              {/* Preview */}
              <div className="order-1 lg:order-2 h-full">
                <div className="bg-white rounded-lg border-2 border-purple-300 p-4 shadow-lg overflow-y-auto h-full">
                  {hoveredSeat ? (
                    <>
                      <div className="mb-4 pb-3 border-b border-gray-200">
                        <h4 className="text-xl font-bold text-gray-900">
                          Fila {hoveredSeat.RowNumber}, Asiento {hoveredSeat.SeatNumber}
                        </h4>
                        <p className="text-sm text-gray-600 mt-1">
                          Pasa el cursor sobre los asientos para comparar la calidad
                        </p>
                      </div>
                      <SeatPreview
                        viewQuality={hoveredSeat.ScreenViewInfo}
                        acousticQuality={hoveredSeat.AcousticProfile}
                        hallCapacity={selectedSession?.HallID.Capacity ?? 100}
                        seatRow={hoveredSeat.RowNumber}
                        seatNumber={hoveredSeat.SeatNumber}
                        totalSeatsInRow={seats.filter(s => s.RowNumber === hoveredSeat.RowNumber).length}
                      />
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400">
                      <svg className="w-24 h-24 mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      <p className="text-xl font-medium text-gray-700">Vista Previa del Asiento</p>
                      <p className="text-sm mt-2 text-center px-4">
                        Pasa el cursor sobre cualquier asiento para ver información detallada de la vista y calidad acústica
                      </p>
                      <div className="mt-6 space-y-2 text-left">
                        <div className="flex items-center gap-2 text-sm">
                          <div className="w-4 h-4 bg-blue-500 rounded"></div>
                          <span>Asientos disponibles</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <div className="w-4 h-4 bg-green-500 rounded"></div>
                          <span>Tu selección</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <div className="w-4 h-4 bg-red-500 rounded opacity-50"></div>
                          <span>Ya reservados</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Modal footer */}
            <div className="flex justify-between items-center border-t pt-6 mt-6 bg-white sticky bottom-0">
              <div className="text-sm text-gray-600">
                {hoveredSeat ? (
                  <span className="text-purple-600 font-medium">
                    👆 Pasa el cursor sobre los asientos para ver la vista y el perfil acústico
                  </span>
                ) : (
                  <span>💡 Pasa el cursor sobre un asiento para previsualizar su calidad</span>
                )}
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => { setIsSeatModalOpen(false); setHoveredSeat(null); }}
                  className="px-5 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirmSeats}
                  disabled={selectedSeatIds.length === 0}
                  className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium shadow-lg shadow-purple-200 transition-all"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Confirmar ({selectedSeatIds.length} asiento{selectedSeatIds.length !== 1 ? 's' : ''})
                </button>
              </div>
            </div>
          </>
        )}
      </Modal>
      
      {/* ── Create Customer Modal ───────────────────────────────────── */}
      <CreateCustomerModal
        isOpen={isCustomerModalOpen}
        onClose={() => setIsCustomerModalOpen(false)}
        onCreated={(newCustomer) => {
          setCustomers(prev => [newCustomer, ...prev]);
          setSelectedCustomer(newCustomer);
          setIsCustomerModalOpen(false);
          toast.success('Cliente creado y seleccionado');
        }}
      />
    </div>
  );
}

// ─── Sale Success Screen ────────────────────────────────────────────────────

function SaleSuccess({ result, onNew }: { result: SaleResult; onNew: () => void }) {
  const { tickets, snacks } = result;
  const ticketTotal = tickets?.totalAmount ?? 0;
  const snackTotal = snacks?.items.reduce((s, i) => s + i.price * i.qty, 0) ?? 0;
  const grandTotal = ticketTotal + snackTotal;

  return (
    <div className="flex items-center justify-center h-[calc(100vh-130px)] bg-gray-50 p-8 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-lg w-full text-center">
        <div className="text-6xl mb-4">✅</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-1">¡Venta completada!</h2>
        <p className="text-gray-500 text-sm mb-6">Los boletos y productos han sido registrados</p>

        <div className="bg-gray-50 rounded-xl p-5 text-left mb-6 space-y-4">
          {/* Tickets */}
          {tickets && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">🎟 Boletos</p>
              <div className="space-y-1.5">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Película</span>
                  <span className="font-semibold text-gray-900">{tickets.movie}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Sala</span>
                  <span className="font-semibold text-gray-900">{tickets.hall}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Horario</span>
                  <span className="font-semibold text-gray-900">
                    {new Date(tickets.sessionDateTime).toLocaleString('es-MX', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Asientos</span>
                  <span className="font-semibold text-gray-900">{tickets.seats.join(', ')}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Subtotal boletos</span>
                  <span className="font-bold text-gray-900">${ticketTotal.toFixed(2)}</span>
                </div>
              </div>

              {/* Ticket codes */}
              <div className="mt-3 space-y-1">
                {tickets.ticketCodes.map((code, i) => (
                  <div key={code} className="flex items-center justify-between bg-indigo-50 rounded-lg px-3 py-2">
                    <span className="text-xs text-indigo-600">Boleto {i + 1} — {tickets.seats[i]}</span>
                    <span className="text-xs font-mono font-bold text-indigo-800">{code}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Snacks */}
          {snacks && snacks.items.length > 0 && (
            <div className="pt-4 border-t border-gray-200">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">🍿 Snacks</p>
              <div className="space-y-1.5">
                {snacks.items.map((item, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span className="text-gray-600">{item.name} × {item.qty}</span>
                    <span className="font-semibold text-gray-900">${(item.price * item.qty).toFixed(2)}</span>
                  </div>
                ))}
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Subtotal snacks</span>
                  <span className="font-bold text-gray-900">${snackTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Grand total */}
          <div className="flex justify-between text-sm pt-3 border-t border-gray-200">
            <span className="font-bold text-gray-900 text-base">Total cobrado</span>
            <span className="font-bold text-green-600 text-xl">${grandTotal.toFixed(2)}</span>
          </div>
        </div>

        <button
          onClick={onNew}
          className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 rounded-xl transition-colors text-lg"
        >
          Nueva venta →
        </button>
      </div>
    </div>
  );
}

// ─── Create Customer Modal ──────────────────────────────────────────────────

function CreateCustomerModal({ isOpen, onClose, onCreated }: { 
  isOpen: boolean; 
  onClose: () => void; 
  onCreated: (c: Customer) => void 
}) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    Name: '',
    Surname: '',
    CI: '',
    Email: '',
    PhoneNumber: '',
    Gender: 'Other' as 'Male' | 'Female' | 'Other',
    Age: 18,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await customersApi.create(formData);
      onCreated(res.data);
      setFormData({
        Name: '',
        Surname: '',
        CI: '',
        Email: '',
        PhoneNumber: '',
        Gender: 'Other',
        Age: 18,
      });
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Error al crear cliente');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Crear Nuevo Cliente" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-sm font-semibold text-gray-700">Nombre *</label>
            <input
              required
              value={formData.Name}
              onChange={e => setFormData({ ...formData, Name: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-semibold text-gray-700">Apellido *</label>
            <input
              required
              value={formData.Surname}
              onChange={e => setFormData({ ...formData, Surname: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-semibold text-gray-700">CI / Identificación *</label>
          <input
            required
            value={formData.CI}
            onChange={e => setFormData({ ...formData, CI: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-semibold text-gray-700">Email *</label>
          <input
            required
            type="email"
            value={formData.Email}
            onChange={e => setFormData({ ...formData, Email: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-semibold text-gray-700">Teléfono *</label>
          <input
            required
            value={formData.PhoneNumber}
            onChange={e => setFormData({ ...formData, PhoneNumber: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-sm font-semibold text-gray-700">Género</label>
            <select
              value={formData.Gender}
              onChange={e => setFormData({ ...formData, Gender: e.target.value as any })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              <option value="Male">Masculino</option>
              <option value="Female">Femenino</option>
              <option value="Other">Otro</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-semibold text-gray-700">Edad</label>
            <input
              type="number"
              min="0"
              value={formData.Age}
              onChange={e => setFormData({ ...formData, Age: parseInt(e.target.value) || 0 })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? 'Guardando...' : 'Crear Cliente'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
