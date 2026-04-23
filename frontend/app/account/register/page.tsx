"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authApi } from "@/lib/api";
import { storeSession } from "@/lib/auth";
import PublicNavigation from "@/components/PublicNavigation";
import toast from "react-hot-toast";

export default function CustomerRegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    Name: "",
    Surname: "",
    CI: "",
    Email: "",
    PhoneNumber: "",
    Password: "",
    confirmPassword: "",
  });
  const [redirectTo, setRedirectTo] = useState("/account");

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const redirect = new URLSearchParams(window.location.search).get(
      "redirect",
    );
    setRedirectTo(redirect || "/account");
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.Password !== formData.confirmPassword) {
      toast.error("Las contraseñas no coinciden");
      return;
    }

    setLoading(true);

    try {
      const response = await authApi.registerCustomer({
        Name: formData.Name,
        Surname: formData.Surname,
        CI: formData.CI,
        Email: formData.Email,
        PhoneNumber: formData.PhoneNumber,
        Password: formData.Password,
      });

      storeSession(response.data);
      toast.success("Cuenta creada correctamente");
      router.push(redirectTo);
    } catch (error: any) {
      const message =
        error?.response?.data?.error || "No se pudo registrar la cuenta";
      toast.error(message);
      setLoading(false);
    }
  };

  return (
    <>
      <PublicNavigation />
      <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black py-16 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <div className="inline-block p-5 rounded-full bg-gradient-to-br from-emerald-500 to-yellow-500 shadow-2xl shadow-emerald-500/30 mb-5 text-5xl">
              🎬
            </div>
            <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-yellow-300 to-red-400 mb-3">
              CREA TU CUENTA
            </h1>
            <p className="text-gray-400">
              Regístrate para comprar entradas, ver tu historial y valorar las
              películas que viste.
            </p>
          </div>

          <div className="bg-gradient-to-br from-gray-900 to-black border-4 border-emerald-500 rounded-2xl p-8 shadow-2xl">
            <form
              onSubmit={handleSubmit}
              className="grid grid-cols-1 md:grid-cols-2 gap-5"
            >
              <div>
                <label className="block text-yellow-400 font-black text-sm tracking-wider mb-2">
                  NOMBRE
                </label>
                <input
                  type="text"
                  required
                  value={formData.Name}
                  onChange={(e) =>
                    setFormData({ ...formData, Name: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-gray-800 border-2 border-gray-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-yellow-400 font-black text-sm tracking-wider mb-2">
                  APELLIDO
                </label>
                <input
                  type="text"
                  required
                  value={formData.Surname}
                  onChange={(e) =>
                    setFormData({ ...formData, Surname: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-gray-800 border-2 border-gray-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-yellow-400 font-black text-sm tracking-wider mb-2">
                  CORREO
                </label>
                <input
                  type="email"
                  required
                  value={formData.Email}
                  onChange={(e) =>
                    setFormData({ ...formData, Email: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-gray-800 border-2 border-gray-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-yellow-400 font-black text-sm tracking-wider mb-2">
                  CI
                </label>
                <input
                  type="text"
                  required
                  value={formData.CI}
                  onChange={(e) =>
                    setFormData({ ...formData, CI: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-gray-800 border-2 border-gray-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-yellow-400 font-black text-sm tracking-wider mb-2">
                  TELÉFONO
                </label>
                <input
                  type="tel"
                  required
                  value={formData.PhoneNumber}
                  onChange={(e) =>
                    setFormData({ ...formData, PhoneNumber: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-gray-800 border-2 border-gray-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-yellow-400 font-black text-sm tracking-wider mb-2">
                  CONTRASEÑA
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={formData.Password}
                  onChange={(e) =>
                    setFormData({ ...formData, Password: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-gray-800 border-2 border-gray-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-yellow-400 font-black text-sm tracking-wider mb-2">
                  CONFIRMAR CONTRASEÑA
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={formData.confirmPassword}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      confirmPassword: e.target.value,
                    })
                  }
                  className="w-full px-4 py-3 bg-gray-800 border-2 border-gray-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="md:col-span-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 disabled:from-gray-700 disabled:to-gray-800 text-black font-black py-4 rounded-xl transition-all"
                >
                  {loading ? "CREANDO CUENTA..." : "CREAR CUENTA"}
                </button>
              </div>
            </form>

            <p className="mt-6 text-sm text-gray-400 text-center">
              ¿Ya tienes cuenta?{" "}
              <Link
                href={`/account/login?redirect=${encodeURIComponent(redirectTo)}`}
                className="text-emerald-400 font-bold hover:text-emerald-300"
              >
                Inicia sesión
              </Link>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
