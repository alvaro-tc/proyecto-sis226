'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { clearSession, getStoredSession, getUserDisplayName, subscribeToAuthChanges } from '@/lib/auth';
import toast from 'react-hot-toast';

export default function PublicNavigation() {
  const pathname = usePathname();
  const [session, setSession] = useState(getStoredSession());
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const syncSession = () => setSession(getStoredSession());
    syncSession();
    return subscribeToAuthChanges(syncSession);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const handleLogout = () => {
    clearSession();
    toast.success('Sesión cerrada correctamente');
  };

  const isAdmin = session?.user.Role === 'ADMIN';
  const isCustomer = session?.user.Role === 'CUSTOMER';

  return (
    <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
              </svg>
            </div>
            <span className="text-gray-900 font-bold text-xl tracking-tight">
              Cine<span className="text-red-600">book</span>
            </span>
          </Link>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-3">
            {isAdmin ? (
              <>
                <span className="text-sm text-gray-400 font-medium">Administrador</span>
                <Link
                  href="/admin"
                  className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition-colors"
                >
                  Panel
                </Link>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 rounded-lg text-gray-600 text-sm font-medium hover:text-gray-900 hover:bg-gray-100 transition-colors"
                >
                  Salir
                </button>
              </>
            ) : isCustomer ? (
              <>
                <span className="text-sm text-gray-500 font-medium">
                  Hola, <span className="text-gray-900 font-semibold">{getUserDisplayName(session.user)}</span>
                </span>
                <Link
                  href="/account"
                  className="px-4 py-2 rounded-lg bg-gray-900 text-white text-sm font-semibold hover:bg-gray-700 transition-colors"
                >
                  Mi cuenta
                </Link>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 rounded-lg text-gray-600 text-sm font-medium hover:text-gray-900 hover:bg-gray-100 transition-colors"
                >
                  Salir
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/account/login"
                  className="px-4 py-2 rounded-lg text-gray-700 text-sm font-semibold hover:text-gray-900 hover:bg-gray-50 border border-gray-200 hover:border-gray-300 transition-colors"
                >
                  Iniciar sesión
                </Link>
                <Link
                  href="/account/register"
                  className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition-colors"
                >
                  Registrarse
                </Link>
              </>
            )}
          </div>

          {/* Mobile toggle */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className="md:hidden w-9 h-9 rounded-lg flex items-center justify-center text-gray-600 hover:bg-gray-100 transition-colors"
            aria-label="Abrir menú"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={mobileMenuOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'} />
            </svg>
          </button>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-3 border-t border-gray-100 space-y-2">
            {isAdmin ? (
              <>
                <Link href="/admin" className="block px-4 py-2.5 rounded-lg bg-red-600 text-white text-sm font-semibold text-center">
                  Panel Admin
                </Link>
                <button onClick={handleLogout} className="w-full px-4 py-2.5 rounded-lg text-gray-600 text-sm font-medium border border-gray-200 text-center">
                  Cerrar sesión
                </button>
              </>
            ) : isCustomer ? (
              <>
                <Link href="/account" className="block px-4 py-2.5 rounded-lg bg-gray-900 text-white text-sm font-semibold text-center">
                  Mi cuenta
                </Link>
                <button onClick={handleLogout} className="w-full px-4 py-2.5 rounded-lg text-gray-600 text-sm font-medium border border-gray-200">
                  Cerrar sesión
                </button>
              </>
            ) : (
              <>
                <Link href="/account/login" className="block px-4 py-2.5 rounded-lg border border-gray-200 text-gray-700 text-sm font-semibold text-center">
                  Iniciar sesión
                </Link>
                <Link href="/account/register" className="block px-4 py-2.5 rounded-lg bg-red-600 text-white text-sm font-semibold text-center">
                  Registrarse
                </Link>
              </>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
