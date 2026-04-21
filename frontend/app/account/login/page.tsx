'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api';
import { storeSession } from '@/lib/auth';
import PublicNavigation from '@/components/PublicNavigation';
import toast from 'react-hot-toast';

export default function CustomerLoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    identity: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [redirectTo, setRedirectTo] = useState('/account');

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const redirect = new URLSearchParams(window.location.search).get('redirect');
    setRedirectTo(redirect || '/account');
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await authApi.login(formData);
      storeSession(response.data);

      if (response.data.user.Role === 'ADMIN') {
        toast.success('Sesión iniciada como administrador');
        router.push('/admin');
        return;
      }

      toast.success('Sesión iniciada correctamente');
      router.push(redirectTo);
    } catch (error: any) {
      const message = error?.response?.data?.error || 'No se pudo iniciar sesión';
      toast.error(message);
      setLoading(false);
    }
  };

  return (
    <>
      <PublicNavigation />
      <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black py-16 px-4">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-8">
            <div className="inline-block p-5 rounded-full bg-gradient-to-br from-red-600 to-yellow-500 shadow-2xl shadow-red-500/40 mb-5 text-5xl">
              🎟
            </div>
            <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-yellow-400 to-red-500 mb-3">
              ACCESO CLIENTE
            </h1>
            <p className="text-gray-400">Inicia sesión para comprar entradas y valorar películas que ya viste.</p>
          </div>

          <div className="bg-gradient-to-br from-gray-900 to-black border-4 border-red-600 rounded-2xl p-8 shadow-2xl">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-yellow-400 font-black text-sm tracking-wider mb-2">
                  CORREO O USUARIO
                </label>
                <input
                  type="text"
                  required
                  value={formData.identity}
                  onChange={(e) => setFormData({ ...formData, identity: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-800 border-2 border-gray-700 rounded-lg text-white focus:outline-none focus:border-red-500 transition-colors"
                  placeholder="tu.correo@ejemplo.com"
                />
              </div>

              <div>
                <label className="block text-yellow-400 font-black text-sm tracking-wider mb-2">
                  CONTRASEÑA
                </label>
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-800 border-2 border-gray-700 rounded-lg text-white focus:outline-none focus:border-red-500 transition-colors"
                  placeholder="Ingresa tu contraseña"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 disabled:from-gray-700 disabled:to-gray-800 text-white font-black py-4 rounded-xl transition-all"
              >
                {loading ? 'INGRESANDO...' : 'INGRESAR'}
              </button>
            </form>

            <div className="mt-6 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
              <p className="text-sm text-yellow-300 font-semibold mb-2">Cuenta demo de cliente:</p>
              <p className="text-sm text-gray-300">Correo: <code>ahmet@email.com</code></p>
              <p className="text-sm text-gray-300">Contraseña: <code>demo123</code></p>
            </div>

            <p className="mt-6 text-sm text-gray-400 text-center">
              ¿Todavía no tienes cuenta?{' '}
              <Link href={`/account/register?redirect=${encodeURIComponent(redirectTo)}`} className="text-red-400 font-bold hover:text-red-300">
                Regístrate aquí
              </Link>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
