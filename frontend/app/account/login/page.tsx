'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api';
import { storeSession } from '@/lib/auth';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [redirectTo, setRedirectTo] = useState('/account');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const redirect = new URLSearchParams(window.location.search).get('redirect');
    setRedirectTo(redirect || '/account');
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await authApi.login({
        identity: formData.username,
        password: formData.password,
      });

      storeSession(response.data);
      const role = response.data.user.Role;

      if (role === 'ADMIN' || role === 'CAJERO') {
        toast.success('Inicio de sesión exitoso. Bienvenido al panel.');
        router.push('/admin');
      } else {
        toast.success('Inicio de sesión exitoso.');
        router.push(redirectTo);
      }
    } catch (error: any) {
      const message = error?.response?.data?.error || 'Credenciales inválidas';
      toast.error(message);
      setLoading(false);
    }
  };

  const fillDemo = (identity: string, password: string) => {
    setFormData({ username: identity, password });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="inline-block p-4 bg-white rounded-full shadow-lg mb-4">
            <svg className="w-12 h-12 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Sistema de Cine</h1>
          <p className="text-gray-600">Inicia sesión con tu cuenta</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Usuario o correo
              </label>
              <input
                type="text"
                required
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                placeholder="Ingresa el usuario"
                autoComplete="username"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contraseña
              </label>
              <input
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                placeholder="Ingresa la contraseña"
                autoComplete="current-password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
            </button>
          </form>

          <div className="mt-6 space-y-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Credenciales de demostración</p>

            <button
              type="button"
              onClick={() => fillDemo('demo', 'demo')}
              className="w-full text-left p-3 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 transition-colors"
            >
              <p className="text-xs font-bold text-purple-700 mb-1">Administrador</p>
              <p className="text-xs text-purple-600">
                Usuario: <code className="bg-purple-100 px-1 rounded">demo</code>{' '}
                Contraseña: <code className="bg-purple-100 px-1 rounded">demo</code>
              </p>
            </button>

            <button
              type="button"
              onClick={() => fillDemo('cajero', 'cajero')}
              className="w-full text-left p-3 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <p className="text-xs font-bold text-blue-700 mb-1">Cajero</p>
              <p className="text-xs text-blue-600">
                Usuario: <code className="bg-blue-100 px-1 rounded">cajero</code>{' '}
                Contraseña: <code className="bg-blue-100 px-1 rounded">cajero</code>
              </p>
            </button>

            <button
              type="button"
              onClick={() => fillDemo('ahmet@email.com', 'demo123')}
              className="w-full text-left p-3 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors"
            >
              <p className="text-xs font-bold text-green-700 mb-1">Cliente</p>
              <p className="text-xs text-green-600">
                Usuario: <code className="bg-green-100 px-1 rounded">ahmet@email.com</code>{' '}
                Contraseña: <code className="bg-green-100 px-1 rounded">demo123</code>
              </p>
            </button>
          </div>
        </div>

        <p className="text-center text-gray-500 text-sm mt-6">
          Proyecto SIS 226 2026
        </p>
      </div>
    </div>
  );
}
