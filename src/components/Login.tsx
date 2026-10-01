import React, { useState } from 'react';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../lib/firebase';
import Logo from './Logo';
import { Mail, Lock, LogIn, RefreshCw, AlertCircle } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    try {
      await signInWithEmailAndPassword(auth, cleanEmail, cleanPassword);
    } catch (err: any) {
      console.error("Auth error:", err);
      const code = err.code || '';
      if (code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found') {
        setError('Correo o contraseña incorrectos. Verifica tus credenciales.');
      } else if (code === 'auth/invalid-email') {
        setError('El formato del correo electrónico no es válido.');
      } else if (code === 'auth/user-disabled') {
        setError('Esta cuenta ha sido deshabilitada por el administrador.');
      } else if (code === 'auth/too-many-requests') {
        setError('Demasiados intentos fallidos. Intenta nuevamente en unos minutos o recupera tu contraseña.');
      } else if (code === 'auth/network-request-failed') {
        setError('Error de Red: No se pudo conectar con el servidor. Revisa tu conexión a internet.');
      } else {
        setError('Error al iniciar sesión: ' + (err.message || 'Verifica tus credenciales e intenta de nuevo.'));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      setError('Por favor ingresa tu correo electrónico para recibir el enlace de recuperación.');
      return;
    }
    try {
      await sendPasswordResetEmail(auth, cleanEmail);
      setResetSent(true);
      setError('');
    } catch (err: any) {
      console.error(err);
      setError('No se pudo enviar el correo de recuperación. Verifica que el correo esté registrado.');
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FB] flex items-center justify-center p-6">
      <div className="bg-white rounded-[40px] shadow-2xl p-8 sm:p-10 w-full max-w-md border border-gray-100 flex flex-col items-center">
        <Logo className="h-12 mb-6" />
        
        <h2 className="text-2xl font-extrabold text-gray-900 mb-2">
          Bienvenido
        </h2>
        <p className="text-gray-500 mb-6 text-center text-xs font-medium">
          Ingresa tus credenciales para acceder al sistema de gestión SST.
        </p>

        {error && (
          <div className="w-full bg-red-50 text-red-600 p-4 rounded-2xl flex items-center gap-3 mb-6">
            <AlertCircle size={20} className="shrink-0" />
            <span className="text-xs font-bold leading-tight">{error}</span>
          </div>
        )}

        {resetSent && (
          <div className="w-full bg-emerald-50 text-emerald-600 p-4 rounded-2xl flex items-center gap-3 mb-6">
            <div className="p-2 bg-emerald-100 rounded-full shrink-0">
              <Mail size={16} />
            </div>
            <span className="text-xs font-bold leading-tight">Enlace de recuperación enviado. Revisa tu bandeja de entrada o spam.</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="w-full space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 ml-1">Correo Electrónico</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="email"
                required
                className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all text-sm font-semibold"
                placeholder="ejemplo@correo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 ml-1">Contraseña</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="password"
                required
                className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all text-sm font-semibold"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="button"
              onClick={handleForgotPassword}
              className="text-xs font-bold text-emerald-600 hover:text-emerald-700 transition-colors"
            >
              ¿Olvidaste tu contraseña?
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gray-900 hover:bg-black text-white font-bold py-4 rounded-2xl transition-all shadow-xl shadow-gray-900/10 active:scale-95 flex items-center justify-center gap-2 group disabled:opacity-50 mt-2 cursor-pointer"
          >
            {loading ? (
              <RefreshCw className="animate-spin" size={20} />
            ) : (
              <>
                <span>Acceder</span>
                <LogIn className="group-hover:translate-x-1 transition-transform" size={18} />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
