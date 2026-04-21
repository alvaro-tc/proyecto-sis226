'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { clearSession, getStoredSession, getUserDisplayName, subscribeToAuthChanges } from '@/lib/auth';
import toast from 'react-hot-toast';

export default function PublicNavigation() {
  const pathname = usePathname();
  const [session, setSession] = useState(getStoredSession());

  const navItems = [
    { name: 'INICIO', path: '/', icon: '🏠' },
    { name: 'PELÍCULAS', path: '/movies', icon: '🎬' },
  ];

  useEffect(() => {
    const syncSession = () => {
      setSession(getStoredSession());
    };

    syncSession();
    return subscribeToAuthChanges(syncSession);
  }, []);

  const handleLogout = () => {
    clearSession();
    toast.success('Sesión cerrada correctamente');
  };

  const isAdmin = session?.user.Role === 'ADMIN';
  const isCustomer = session?.user.Role === 'CUSTOMER';

  return (
    <nav className="bg-gradient-to-r from-gray-900 via-black to-gray-900 shadow-2xl sticky top-0 z-50 border-b-4 border-red-600">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative">
              <div className="text-4xl transform group-hover:scale-110 group-hover:rotate-12 transition-all duration-300">
                🎬
              </div>
              <div className="absolute -inset-1 bg-red-600 rounded-full blur opacity-0 group-hover:opacity-20 transition-opacity"></div>
            </div>
            <div className="flex flex-col">
              <span className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-yellow-400 to-red-500 tracking-wider">
                CINEBOOK
              </span>
              <span className="text-xs text-yellow-400 tracking-widest font-semibold">EXPERIENCIA DE CINE PREMIUM</span>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            {navItems.map((item) => (
              <Link
                key={item.path}
                href={item.path}
                className={`relative flex items-center gap-2 px-5 py-3 rounded-lg text-sm font-black tracking-wider transition-all duration-300 transform hover:scale-105 ${
                  pathname === item.path
                    ? 'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg shadow-red-500/50'
                    : 'text-gray-300 hover:text-white hover:bg-red-600/20'
                }`}
              >
                <span className="text-xl">{item.icon}</span>
                <span>{item.name}</span>
              </Link>
            ))}

            {isCustomer && (
              <span className="hidden xl:block text-sm text-gray-400 font-semibold">
                Hola, <strong className="text-white">{getUserDisplayName(session.user)}</strong>
              </span>
            )}

            {isAdmin ? (
              <Link
                href="/admin"
                className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-400 hover:to-yellow-500 text-black rounded-lg text-sm font-black tracking-wider transition-all duration-300 shadow-lg shadow-yellow-500/50 transform hover:scale-105"
              >
                <span>PANEL</span>
              </Link>
            ) : isCustomer ? (
              <Link
                href="/account"
                className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white rounded-lg text-sm font-black tracking-wider transition-all duration-300 shadow-lg shadow-red-500/50 transform hover:scale-105"
              >
                <span>MI CUENTA</span>
              </Link>
            ) : (
              <>
                <Link
                  href="/account/login"
                  className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white rounded-lg text-sm font-black tracking-wider transition-all duration-300 shadow-lg shadow-red-500/50 transform hover:scale-105"
                >
                  <span>INGRESAR</span>
                </Link>
                <Link
                  href="/account/register"
                  className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-black rounded-lg text-sm font-black tracking-wider transition-all duration-300 shadow-lg shadow-emerald-500/40 transform hover:scale-105"
                >
                  <span>REGISTRARSE</span>
                </Link>
                <Link
                  href="/admin/login"
                  className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-400 hover:to-yellow-500 text-black rounded-lg text-sm font-black tracking-wider transition-all duration-300 shadow-lg shadow-yellow-500/50 transform hover:scale-105"
                >
                  <span>ADMIN</span>
                </Link>
              </>
            )}

            {session && (
              <button
                onClick={handleLogout}
                className="px-5 py-3 bg-white/5 hover:bg-white/10 text-white rounded-lg text-sm font-black tracking-wider transition-all duration-300 border border-white/10"
              >
                CERRAR
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="h-1 bg-gradient-to-r from-transparent via-red-500 to-transparent"></div>
    </nav>
  );
}
