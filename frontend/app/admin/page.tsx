'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { customersApi, moviesApi, hallsApi, sessionsApi, reservationsApi, paymentsApi, snackSalesApi, snackProductsApi } from '@/lib/api';
import { getStoredSession, subscribeToAuthChanges, AuthUser } from '@/lib/auth';
import Link from 'next/link';

export default function AdminDashboard() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [stats, setStats] = useState({
    customers: 0, movies: 0, halls: 0, sessions: 0,
    reservations: 0, payments: 0, snackSales: 0, lowStock: 0,
  });
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const sync = () => setUser(getStoredSession()?.user || null);
    sync();
    return subscribeToAuthChanges(sync);
  }, []);

  useEffect(() => {
    if (user?.Role === 'CAJERO') {
      router.replace('/admin/pos');
      return;
    }
    if (user) fetchStats();
  }, [user]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      if (user?.Role === 'CAJERO') {
        const [reservationsRes, paymentsRes, salesRes, productsRes] = await Promise.all([
          reservationsApi.getAll(),
          paymentsApi.getAll(),
          snackSalesApi.getAll(),
          snackProductsApi.getAll({ active: true }),
        ]);
        setStats(s => ({
          ...s,
          reservations: reservationsRes.data.length,
          payments: paymentsRes.data.length,
          snackSales: salesRes.data.length,
          lowStock: productsRes.data.filter((p: any) => p.Stock <= 5).length,
        }));
      } else {
        const [customersRes, moviesRes, hallsRes, sessionsRes, reservationsRes, paymentsRes, salesRes, productsRes] = await Promise.all([
          customersApi.getAll(),
          moviesApi.getAll(),
          hallsApi.getAll(),
          sessionsApi.getAll(),
          reservationsApi.getAll(),
          paymentsApi.getAll(),
          snackSalesApi.getAll(),
          snackProductsApi.getAll({ active: true }),
        ]);
        setStats({
          customers: customersRes.data.length,
          movies: moviesRes.data.length,
          halls: hallsRes.data.length,
          sessions: sessionsRes.data.length,
          reservations: reservationsRes.data.length,
          payments: paymentsRes.data.length,
          snackSales: salesRes.data.length,
          lowStock: productsRes.data.filter((p: any) => p.Stock <= 5).length,
        });
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (user?.Role === 'CAJERO') {
    return <CajeroDashboard stats={stats} loading={loading} />;
  }

  return <AdminFullDashboard stats={stats} loading={loading} />;
}

function StatCard({ icon, label, value, color, href, loading }: {
  icon: string; label: string; value: number; color: string; href: string; loading: boolean;
}) {
  return (
    <Link
      href={href}
      className={`bg-white rounded-xl shadow-md hover:shadow-lg transition-all p-6 border-l-4 border-${color}-500`}
    >
      <div className="text-3xl mb-2">{icon}</div>
      <div className={`text-3xl font-bold text-${color}-600 mb-1`}>
        {loading ? '...' : value}
      </div>
      <div className="text-sm text-gray-600 font-medium">{label}</div>
    </Link>
  );
}

function AdminFullDashboard({ stats, loading }: { stats: any; loading: boolean }) {
  const statCards = [
    { icon: '👥', label: 'Clientes', href: '/admin/customers', color: 'orange', value: stats.customers },
    { icon: '🎬', label: 'Películas', href: '/admin/movies', color: 'blue', value: stats.movies },
    { icon: '🏛️', label: 'Salas', href: '/admin/halls', color: 'indigo', value: stats.halls },
    { icon: '🎭', label: 'Funciones', href: '/admin/sessions', color: 'green', value: stats.sessions },
    { icon: '📋', label: 'Reservas', href: '/admin/reservations', color: 'purple', value: stats.reservations },
    { icon: '💳', label: 'Pagos', href: '/admin/payments', color: 'emerald', value: stats.payments },
    { icon: '🍿', label: 'Ventas Snacks', href: '/admin/snacks', color: 'yellow', value: stats.snackSales },
    { icon: '⚠️', label: 'Stock Bajo', href: '/admin/snacks', color: 'red', value: stats.lowStock },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Panel de Administración</h1>
        <p className="text-gray-600">Bienvenido al Sistema de Gestión de Cine</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {statCards.map(card => (
          <StatCard key={card.href + card.label} {...card} loading={loading} />
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[
          { color: 'orange', icon: '👥', title: 'Gestión de Clientes', desc: 'Administra cuentas, contacto e historial de reservas.', href: '/admin/customers', label: 'Gestionar Clientes' },
          { color: 'blue', icon: '🎬', title: 'Catálogo de Películas', desc: 'Agrega, edita y gestiona el catálogo de películas.', href: '/admin/movies', label: 'Gestionar Películas' },
          { color: 'indigo', icon: '🏛️', title: 'Salas y Asientos', desc: 'Configura salas con matriz de asientos y calidad.', href: '/admin/halls', label: 'Gestionar Salas' },
          { color: 'green', icon: '🎭', title: 'Programación de Funciones', desc: 'Programa funciones en diferentes salas y horarios.', href: '/admin/sessions', label: 'Gestionar Funciones' },
          { color: 'purple', icon: '📋', title: 'Reservas', desc: 'Crea reservas con selección de asientos y entradas QR.', href: '/admin/reservations', label: 'Gestionar Reservas' },
          { color: 'emerald', icon: '💳', title: 'Pagos', desc: 'Procesa y rastrea pagos de reservas.', href: '/admin/payments', label: 'Gestionar Pagos' },
          { color: 'yellow', icon: '🍿', title: 'Gestión de Snacks', desc: 'Administra productos, categorías e inventario de snacks.', href: '/admin/snacks', label: 'Gestionar Snacks' },
          { color: 'amber', icon: '🛒', title: 'Venta de Snacks', desc: 'Punto de venta rápido para snacks y bebidas.', href: '/admin/snacks/sell', label: 'Abrir Caja' },
        ].map(card => (
          <div key={card.href} className={`bg-gradient-to-br from-${card.color}-50 to-${card.color}-100 rounded-xl p-6 shadow-md`}>
            <h3 className={`text-lg font-bold text-${card.color}-900 mb-2`}>{card.icon} {card.title}</h3>
            <p className={`text-${card.color}-700 text-sm mb-4`}>{card.desc}</p>
            <Link href={card.href} className={`inline-block bg-${card.color}-600 hover:bg-${card.color}-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors`}>
              {card.label} →
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}

function CajeroDashboard({ stats, loading }: { stats: any; loading: boolean }) {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Panel del Cajero</h1>
        <p className="text-gray-600">Venta de boletos y snacks</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard icon="📋" label="Reservas" href="/admin/reservations" color="purple" value={stats.reservations} loading={loading} />
        <StatCard icon="💳" label="Pagos" href="/admin/payments" color="emerald" value={stats.payments} loading={loading} />
        <StatCard icon="🍿" label="Ventas Snacks" href="/admin/snacks" color="yellow" value={stats.snackSales} loading={loading} />
        <StatCard icon="⚠️" label="Stock Bajo" href="/admin/snacks" color="red" value={stats.lowStock} loading={loading} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Link href="/admin/snacks/sell" className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-8 shadow-lg hover:shadow-xl transition-all text-white group">
          <div className="text-5xl mb-4">🛒</div>
          <h3 className="text-2xl font-bold mb-2">Vender Snacks</h3>
          <p className="text-orange-100 text-sm">Abre la caja para vender snacks y bebidas rápidamente.</p>
          <div className="mt-4 text-sm font-semibold group-hover:underline">Abrir caja →</div>
        </Link>

        <Link href="/admin/reservations" className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-8 shadow-lg hover:shadow-xl transition-all text-white group">
          <div className="text-5xl mb-4">📋</div>
          <h3 className="text-2xl font-bold mb-2">Reservas</h3>
          <p className="text-purple-100 text-sm">Gestiona y crea reservas de boletos para funciones.</p>
          <div className="mt-4 text-sm font-semibold group-hover:underline">Ver reservas →</div>
        </Link>

        <Link href="/admin/payments" className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl p-8 shadow-lg hover:shadow-xl transition-all text-white group">
          <div className="text-5xl mb-4">💳</div>
          <h3 className="text-2xl font-bold mb-2">Pagos</h3>
          <p className="text-emerald-100 text-sm">Procesa y registra los pagos de reservas.</p>
          <div className="mt-4 text-sm font-semibold group-hover:underline">Ver pagos →</div>
        </Link>

        <Link href="/admin/snacks" className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl p-8 shadow-lg hover:shadow-xl transition-all text-white group">
          <div className="text-5xl mb-4">🍿</div>
          <h3 className="text-2xl font-bold mb-2">Inventario Snacks</h3>
          <p className="text-yellow-100 text-sm">Consulta el inventario y las ventas de snacks.</p>
          <div className="mt-4 text-sm font-semibold group-hover:underline">Ver inventario →</div>
        </Link>

        <Link href="/admin/customers" className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-8 shadow-lg hover:shadow-xl transition-all text-white group">
          <div className="text-5xl mb-4">👥</div>
          <h3 className="text-2xl font-bold mb-2">Clientes</h3>
          <p className="text-blue-100 text-sm">Consulta información de clientes registrados.</p>
          <div className="mt-4 text-sm font-semibold group-hover:underline">Ver clientes →</div>
        </Link>
      </div>
    </div>
  );
}
