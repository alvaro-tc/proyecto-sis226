'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AuthUser } from '@/lib/auth';

export default function AdminNavigation({ user }: { user: AuthUser | null }) {
  const pathname = usePathname();

  if (!user) return null;

  const navItems = [
    { name: 'Dashboard', path: '/admin', icon: '📊', roles: ['ADMIN'] },
    { name: 'Caja POS', path: '/admin/pos', icon: '🖥️', roles: ['CAJERO'] },
    { name: 'Clientes', path: '/admin/customers', icon: '👥', roles: ['ADMIN', 'CAJERO'] },
    { name: 'Películas', path: '/admin/movies', icon: '🎬', roles: ['ADMIN'] },
    { name: 'Salas', path: '/admin/halls', icon: '🏛️', roles: ['ADMIN'] },
    { name: 'Funciones', path: '/admin/sessions', icon: '🎭', roles: ['ADMIN'] },
    { name: 'Reservas', path: '/admin/reservations', icon: '📋', roles: ['ADMIN', 'CAJERO'] },
    { name: 'Pagos', path: '/admin/payments', icon: '💳', roles: ['ADMIN', 'CAJERO'] },
    { name: 'Snacks', path: '/admin/snacks', icon: '🍿', roles: ['ADMIN', 'CAJERO'] },
    { name: 'Vender Snacks', path: '/admin/snacks/sell', icon: '🛒', roles: ['ADMIN'] },
  ];

  const filteredItems = navItems.filter(item => item.roles.includes(user.Role));

  const isActive = (path: string) => {
    if (path === '/admin') return pathname === '/admin';
    return pathname.startsWith(path);
  };

  return (
    <div className="bg-white border-b border-gray-200 shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex overflow-x-auto space-x-1">
          {filteredItems.map((item) => (
            <Link
              key={item.path}
              href={item.path}
              className={`flex items-center gap-2 px-5 py-4 whitespace-nowrap text-sm font-black transition-all border-b-4 ${
                isActive(item.path)
                  ? 'border-orange-600 text-orange-600 bg-orange-50/50'
                  : 'border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <span>{item.icon}</span>
              <span className="tracking-tighter uppercase">{item.name}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
