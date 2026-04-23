'use client';

import { useState, useEffect } from 'react';
import { snackCategoriesApi, snackProductsApi, snackSalesApi } from '@/lib/api';
import toast from 'react-hot-toast';

type Category = { _id: string; Name: string; IsActive: boolean };
type Product = { _id: string; Name: string; Description: string; Category: Category; Price: number; Stock: number; IsActive: boolean };
type CartItem = { product: Product; quantity: number };

const PAYMENT_METHODS = ['Cash', 'Card', 'Online'] as const;
type PaymentMethod = typeof PAYMENT_METHODS[number];

const paymentLabels: Record<PaymentMethod, string> = { Cash: 'Efectivo', Card: 'Tarjeta', Online: 'Online' };

export default function SnackSellPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Cash');
  const [notes, setNotes] = useState('');
  const [processing, setProcessing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [lastSale, setLastSale] = useState<any>(null);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [catRes, prodRes] = await Promise.all([
        snackCategoriesApi.getAll(),
        snackProductsApi.getAll({ active: true }),
      ]);
      setCategories(catRes.data.filter((c: Category) => c.IsActive));
      setProducts(prodRes.data);
    } catch {
      toast.error('Error al cargar productos');
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = selectedCategory === 'all'
    ? products
    : products.filter(p => p.Category?._id === selectedCategory);

  const addToCart = (product: Product) => {
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
    if (qty <= 0) { removeFromCart(productId); return; }
    setCart(prev => prev.map(i => {
      if (i.product._id !== productId) return i;
      const maxQty = Math.min(qty, i.product.Stock);
      return { ...i, quantity: maxQty };
    }));
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(i => i.product._id !== productId));
  };

  const total = cart.reduce((sum, i) => sum + i.product.Price * i.quantity, 0);

  const handleCheckout = async () => {
    if (cart.length === 0) { toast.error('El carrito está vacío'); return; }
    setProcessing(true);
    try {
      const response = await snackSalesApi.create({
        Items: cart.map(i => ({ ProductID: i.product._id, Quantity: i.quantity })),
        PaymentMethod: paymentMethod,
        Notes: notes,
      });
      setLastSale(response.data);
      setCart([]);
      setNotes('');
      toast.success(`Venta completada. Total: $${total.toFixed(2)}`);
      loadData();
    } catch (e: any) {
      toast.error(e?.response?.data?.error || 'Error al procesar la venta');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="h-[calc(100vh-130px)] flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🛒</span>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Punto de Venta — Snacks</h1>
            <p className="text-xs text-gray-500">Selecciona productos y procesa la venta</p>
          </div>
        </div>
        <a href="/admin/snacks" className="text-sm text-indigo-600 hover:underline">Ver inventario</a>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left: Product grid */}
        <div className="flex-1 flex flex-col overflow-hidden bg-gray-50">
          {/* Category filter */}
          <div className="px-4 py-3 bg-white border-b border-gray-100 flex gap-2 overflow-x-auto">
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
            {loading ? (
              <div className="text-center py-20 text-gray-400">Cargando productos...</div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                {filteredProducts.map(p => {
                  const cartItem = cart.find(i => i.product._id === p._id);
                  const inCart = cartItem?.quantity || 0;
                  const outOfStock = p.Stock <= 0;
                  return (
                    <button
                      key={p._id}
                      onClick={() => addToCart(p)}
                      disabled={outOfStock}
                      className={`relative bg-white rounded-xl p-4 text-left shadow-sm hover:shadow-md transition-all border-2 ${
                        inCart > 0 ? 'border-orange-400' : 'border-transparent'
                      } ${outOfStock ? 'opacity-50 cursor-not-allowed' : 'hover:border-orange-300 active:scale-95'}`}
                    >
                      {inCart > 0 && (
                        <span className="absolute top-2 right-2 bg-orange-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                          {inCart}
                        </span>
                      )}
                      <div className="text-3xl mb-2 text-center">
                        {p.Category?.Name === 'Bebidas' ? '🥤' :
                         p.Category?.Name === 'Palomitas' ? '🍿' :
                         p.Category?.Name === 'Dulces' ? '🍬' :
                         p.Category?.Name === 'Nachos y Snacks' ? '🌮' :
                         p.Category?.Name === 'Combos' ? '🎁' : '🍫'}
                      </div>
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

        {/* Right: Cart */}
        <div className="w-80 xl:w-96 bg-white border-l border-gray-200 flex flex-col">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-bold text-gray-900">Carrito</h2>
            {cart.length > 0 && (
              <button onClick={() => setCart([])} className="text-xs text-red-500 hover:text-red-700">Vaciar</button>
            )}
          </div>

          {/* Cart items */}
          <div className="flex-1 overflow-y-auto">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400 py-12">
                <span className="text-4xl mb-3">🛒</span>
                <p className="text-sm">Agrega productos al carrito</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {cart.map(item => (
                  <div key={item.product._id} className="px-5 py-3 flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 truncate">{item.product.Name}</div>
                      <div className="text-xs text-gray-400">${item.product.Price.toFixed(2)} c/u</div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => updateQty(item.product._id, item.quantity - 1)}
                        className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-sm font-bold"
                      >−</button>
                      <span className="w-8 text-center text-sm font-semibold">{item.quantity}</span>
                      <button
                        onClick={() => updateQty(item.product._id, item.quantity + 1)}
                        className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-sm font-bold"
                      >+</button>
                    </div>
                    <div className="text-sm font-bold text-gray-900 w-14 text-right">
                      ${(item.product.Price * item.quantity).toFixed(2)}
                    </div>
                    <button onClick={() => removeFromCart(item.product._id)} className="text-gray-300 hover:text-red-500 ml-1">✕</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Checkout */}
          <div className="border-t border-gray-200 p-5 space-y-4">
            {/* Payment method */}
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">Método de pago</label>
              <div className="flex gap-2">
                {PAYMENT_METHODS.map(m => (
                  <button
                    key={m}
                    onClick={() => setPaymentMethod(m)}
                    className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-colors ${
                      paymentMethod === m ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {m === 'Cash' ? '💵' : m === 'Card' ? '💳' : '📱'} {paymentLabels[m]}
                  </button>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 block">Notas (opcional)</label>
              <input
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Observaciones de la venta..."
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            {/* Total */}
            <div className="flex items-center justify-between pt-2 border-t border-gray-100">
              <span className="text-sm font-medium text-gray-600">Total ({cart.reduce((s, i) => s + i.quantity, 0)} productos)</span>
              <span className="text-2xl font-bold text-gray-900">${total.toFixed(2)}</span>
            </div>

            <button
              onClick={handleCheckout}
              disabled={cart.length === 0 || processing}
              className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-gray-200 disabled:text-gray-400 text-white font-bold py-4 rounded-xl transition-colors text-lg"
            >
              {processing ? 'Procesando...' : `Cobrar $${total.toFixed(2)}`}
            </button>
          </div>
        </div>
      </div>

      {/* Last sale notification */}
      {lastSale && (
        <div className="fixed bottom-6 right-6 bg-green-600 text-white rounded-xl shadow-xl p-4 max-w-xs z-50">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-bold text-sm">✅ Venta completada</p>
              <p className="text-xs text-green-100 mt-0.5">Total: ${lastSale.TotalAmount?.toFixed(2)}</p>
              <p className="text-xs text-green-100">Pago: {paymentLabels[lastSale.PaymentMethod as PaymentMethod] || lastSale.PaymentMethod}</p>
            </div>
            <button onClick={() => setLastSale(null)} className="text-green-200 hover:text-white text-lg leading-none">✕</button>
          </div>
        </div>
      )}
    </div>
  );
}
