'use client';

import { useState, useEffect } from 'react';
import { snackCategoriesApi, snackProductsApi, snackSalesApi } from '@/lib/api';
import { getStoredSession } from '@/lib/auth';
import toast from 'react-hot-toast';

type Category = { _id: string; Name: string; Description: string; IsActive: boolean };
type Product = { _id: string; Name: string; Description: string; Category: Category; Price: number; Stock: number; IsActive: boolean };
type Sale = { _id: string; Items: { ProductName: string; Quantity: number; UnitPrice: number }[]; TotalAmount: number; PaymentMethod: string; createdAt: string; SoldBy?: { Username: string } };

type Tab = 'products' | 'categories' | 'sales';

export default function SnacksPage() {
  const [tab, setTab] = useState<Tab>('products');
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const userRole = getStoredSession()?.user?.Role;
  const isAdmin = userRole === 'ADMIN';

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [catRes, prodRes, salesRes] = await Promise.all([
        snackCategoriesApi.getAll(),
        snackProductsApi.getAll(),
        snackSalesApi.getAll(),
      ]);
      setCategories(catRes.data);
      setProducts(prodRes.data);
      setSales(salesRes.data);
    } catch {
      toast.error('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: 'products', label: 'Productos', icon: '🍿' },
    { id: 'categories', label: 'Categorías', icon: '🏷️' },
    { id: 'sales', label: 'Ventas', icon: '📊' },
  ];

  const totalSalesAmount = sales.reduce((sum, s) => sum + s.TotalAmount, 0);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Snacks</h1>
          <p className="text-gray-500 mt-1">Productos, categorías, inventario y ventas</p>
        </div>
        <a href="/admin/snacks/sell" className="bg-orange-600 hover:bg-orange-700 text-white px-5 py-2.5 rounded-lg font-semibold transition-colors">
          🛒 Ir a Caja
        </a>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl p-5 shadow-sm border-l-4 border-yellow-500">
          <div className="text-2xl font-bold text-yellow-600">{products.filter(p => p.IsActive).length}</div>
          <div className="text-sm text-gray-500">Productos activos</div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border-l-4 border-red-500">
          <div className="text-2xl font-bold text-red-600">{products.filter(p => p.Stock <= 5 && p.IsActive).length}</div>
          <div className="text-sm text-gray-500">Stock bajo (≤5)</div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border-l-4 border-green-500">
          <div className="text-2xl font-bold text-green-600">{sales.length}</div>
          <div className="text-sm text-gray-500">Ventas totales</div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border-l-4 border-blue-500">
          <div className="text-2xl font-bold text-blue-600">${totalSalesAmount.toFixed(2)}</div>
          <div className="text-sm text-gray-500">Ingresos snacks</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm">
        <div className="border-b border-gray-200">
          <div className="flex">
            {tabs.map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-2 px-6 py-4 text-sm font-semibold border-b-2 transition-colors ${
                  tab === t.id ? 'border-orange-500 text-orange-600' : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {t.icon} {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="text-center py-12 text-gray-400">Cargando...</div>
          ) : tab === 'products' ? (
            <ProductsTab products={products} categories={categories} isAdmin={isAdmin} onRefresh={loadAll} />
          ) : tab === 'categories' ? (
            <CategoriesTab categories={categories} isAdmin={isAdmin} onRefresh={loadAll} />
          ) : (
            <SalesTab sales={sales} />
          )}
        </div>
      </div>
    </div>
  );
}

// ─── PRODUCTS TAB ────────────────────────────────────────────────────────────

function ProductsTab({ products, categories, isAdmin, onRefresh }: {
  products: Product[]; categories: Category[]; isAdmin: boolean; onRefresh: () => void;
}) {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState({ Name: '', Description: '', Category: '', Price: '', Stock: '', IsActive: true });
  const [saving, setSaving] = useState(false);

  const openNew = () => { setEditing(null); setForm({ Name: '', Description: '', Category: '', Price: '', Stock: '', IsActive: true }); setShowForm(true); };
  const openEdit = (p: Product) => { setEditing(p); setForm({ Name: p.Name, Description: p.Description, Category: p.Category._id, Price: String(p.Price), Stock: String(p.Stock), IsActive: p.IsActive }); setShowForm(true); };

  const handleSave = async () => {
    if (!form.Name || !form.Category || !form.Price) return toast.error('Nombre, categoría y precio son requeridos');
    setSaving(true);
    try {
      const data = { Name: form.Name, Description: form.Description, Category: form.Category, Price: parseFloat(form.Price), Stock: parseInt(form.Stock) || 0, IsActive: form.IsActive };
      if (editing) {
        await snackProductsApi.update(editing._id, data);
        toast.success('Producto actualizado');
      } else {
        await snackProductsApi.create(data);
        toast.success('Producto creado');
      }
      setShowForm(false);
      onRefresh();
    } catch (e: any) {
      toast.error(e?.response?.data?.error || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este producto?')) return;
    try {
      await snackProductsApi.delete(id);
      toast.success('Producto eliminado');
      onRefresh();
    } catch (e: any) {
      toast.error(e?.response?.data?.error || 'Error al eliminar');
    }
  };

  const stockBadge = (stock: number) => {
    if (stock === 0) return <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs font-bold">Sin stock</span>;
    if (stock <= 5) return <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full text-xs font-bold">Stock bajo: {stock}</span>;
    return <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-bold">{stock}</span>;
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-800">Productos ({products.length})</h2>
        {isAdmin && (
          <button onClick={openNew} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
            + Nuevo Producto
          </button>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold mb-4">{editing ? 'Editar Producto' : 'Nuevo Producto'}</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
                <input value={form.Name} onChange={e => setForm({ ...form, Name: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                <input value={form.Description} onChange={e => setForm({ ...form, Description: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Categoría *</label>
                <select value={form.Category} onChange={e => setForm({ ...form, Category: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none">
                  <option value="">Seleccionar categoría</option>
                  {categories.filter(c => c.IsActive).map(c => <option key={c._id} value={c._id}>{c.Name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Precio ($) *</label>
                  <input type="number" min="0" step="0.01" value={form.Price} onChange={e => setForm({ ...form, Price: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Stock</label>
                  <input type="number" min="0" value={form.Stock} onChange={e => setForm({ ...form, Stock: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.IsActive} onChange={e => setForm({ ...form, IsActive: e.target.checked })} className="rounded" />
                Producto activo
              </label>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowForm(false)} className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm hover:bg-gray-50">Cancelar</button>
              <button onClick={handleSave} disabled={saving} className="flex-1 bg-indigo-600 text-white py-2 rounded-lg text-sm hover:bg-indigo-700 disabled:opacity-50">
                {saving ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-left">
              <th className="px-4 py-3 font-semibold text-gray-600">Nombre</th>
              <th className="px-4 py-3 font-semibold text-gray-600">Categoría</th>
              <th className="px-4 py-3 font-semibold text-gray-600">Precio</th>
              <th className="px-4 py-3 font-semibold text-gray-600">Stock</th>
              <th className="px-4 py-3 font-semibold text-gray-600">Estado</th>
              {isAdmin && <th className="px-4 py-3 font-semibold text-gray-600">Acciones</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {products.map(p => (
              <tr key={p._id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{p.Name}<div className="text-xs text-gray-400">{p.Description}</div></td>
                <td className="px-4 py-3 text-gray-500">{p.Category?.Name}</td>
                <td className="px-4 py-3 font-semibold text-green-700">${p.Price.toFixed(2)}</td>
                <td className="px-4 py-3">{stockBadge(p.Stock)}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${p.IsActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {p.IsActive ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                {isAdmin && (
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(p)} className="text-indigo-600 hover:text-indigo-800 text-xs font-medium">Editar</button>
                      <button onClick={() => handleDelete(p._id)} className="text-red-500 hover:text-red-700 text-xs font-medium">Eliminar</button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
            {products.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">No hay productos registrados</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── CATEGORIES TAB ──────────────────────────────────────────────────────────

function CategoriesTab({ categories, isAdmin, onRefresh }: {
  categories: Category[]; isAdmin: boolean; onRefresh: () => void;
}) {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [form, setForm] = useState({ Name: '', Description: '', IsActive: true });
  const [saving, setSaving] = useState(false);

  const openNew = () => { setEditing(null); setForm({ Name: '', Description: '', IsActive: true }); setShowForm(true); };
  const openEdit = (c: Category) => { setEditing(c); setForm({ Name: c.Name, Description: c.Description, IsActive: c.IsActive }); setShowForm(true); };

  const handleSave = async () => {
    if (!form.Name) return toast.error('El nombre es requerido');
    setSaving(true);
    try {
      if (editing) {
        await snackCategoriesApi.update(editing._id, form);
        toast.success('Categoría actualizada');
      } else {
        await snackCategoriesApi.create(form);
        toast.success('Categoría creada');
      }
      setShowForm(false);
      onRefresh();
    } catch (e: any) {
      toast.error(e?.response?.data?.error || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar esta categoría?')) return;
    try {
      await snackCategoriesApi.delete(id);
      toast.success('Categoría eliminada');
      onRefresh();
    } catch (e: any) {
      toast.error(e?.response?.data?.error || 'Error al eliminar');
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-800">Categorías ({categories.length})</h2>
        {isAdmin && (
          <button onClick={openNew} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
            + Nueva Categoría
          </button>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <h3 className="text-lg font-bold mb-4">{editing ? 'Editar Categoría' : 'Nueva Categoría'}</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
                <input value={form.Name} onChange={e => setForm({ ...form, Name: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                <input value={form.Description} onChange={e => setForm({ ...form, Description: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.IsActive} onChange={e => setForm({ ...form, IsActive: e.target.checked })} />
                Categoría activa
              </label>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowForm(false)} className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm hover:bg-gray-50">Cancelar</button>
              <button onClick={handleSave} disabled={saving} className="flex-1 bg-indigo-600 text-white py-2 rounded-lg text-sm hover:bg-indigo-700 disabled:opacity-50">
                {saving ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map(c => (
          <div key={c._id} className="border border-gray-200 rounded-xl p-4 hover:shadow-sm transition-shadow">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-gray-900">🏷️ {c.Name}</h3>
                <p className="text-sm text-gray-500 mt-0.5">{c.Description || '—'}</p>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${c.IsActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                {c.IsActive ? 'Activa' : 'Inactiva'}
              </span>
            </div>
            {isAdmin && (
              <div className="flex gap-3 mt-3 pt-3 border-t border-gray-100">
                <button onClick={() => openEdit(c)} className="text-indigo-600 hover:text-indigo-800 text-xs font-medium">Editar</button>
                <button onClick={() => handleDelete(c._id)} className="text-red-500 hover:text-red-700 text-xs font-medium">Eliminar</button>
              </div>
            )}
          </div>
        ))}
        {categories.length === 0 && (
          <div className="col-span-3 text-center py-8 text-gray-400">No hay categorías registradas</div>
        )}
      </div>
    </div>
  );
}

// ─── SALES TAB ───────────────────────────────────────────────────────────────

function SalesTab({ sales }: { sales: Sale[] }) {
  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-800 mb-4">Historial de Ventas ({sales.length})</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-left">
              <th className="px-4 py-3 font-semibold text-gray-600">Fecha</th>
              <th className="px-4 py-3 font-semibold text-gray-600">Productos</th>
              <th className="px-4 py-3 font-semibold text-gray-600">Total</th>
              <th className="px-4 py-3 font-semibold text-gray-600">Pago</th>
              <th className="px-4 py-3 font-semibold text-gray-600">Cajero</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {sales.map(s => (
              <tr key={s._id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-500">{new Date(s.createdAt).toLocaleString('es-MX')}</td>
                <td className="px-4 py-3">
                  {s.Items.map((item, i) => (
                    <div key={i} className="text-xs">{item.ProductName} × {item.Quantity}</div>
                  ))}
                </td>
                <td className="px-4 py-3 font-semibold text-green-700">${s.TotalAmount.toFixed(2)}</td>
                <td className="px-4 py-3">
                  <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs">{s.PaymentMethod}</span>
                </td>
                <td className="px-4 py-3 text-gray-500">{s.SoldBy?.Username || '—'}</td>
              </tr>
            ))}
            {sales.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">No hay ventas registradas</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
