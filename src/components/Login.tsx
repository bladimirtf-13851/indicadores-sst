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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err: any) {
      setError('Credenciales inválidas o correo no verificado.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setError('Por favor ingresa tu correo para recuperar la contraseña.');
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email);
      setResetSent(true);
      setError('');
    } catch (err) {
      setError('Error al enviar el correo de recuperación.');
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FB] flex items-center justify-center p-6">
      <div className="bg-white rounded-[40px] shadow-2xl p-10 w-full max-w-md border border-gray-100 flex flex-col items-center">
        <Logo className="h-12 mb-8" />
        
        <h2 className="text-2xl font-extrabold text-gray-900 mb-2">Bienvenido</h2>
        <p className="text-gray-500 mb-8 text-center text-sm font-medium">Ingresa tus credenciales para acceder al sistema de gestión SST.</p>

        {error && (
          <div className="w-full bg-red-50 text-red-600 p-4 rounded-2xl flex items-center gap-3 mb-6 animate-pulse">
            <AlertCircle size={20} />
            <span className="text-xs font-bold leading-tight">{error}</span>
          </div>
        )}

        {resetSent && (
          <div className="w-full bg-emerald-50 text-emerald-600 p-4 rounded-2xl flex items-center gap-3 mb-6">
            <div className="p-2 bg-emerald-100 rounded-full">
              <Mail size={16} />
            </div>
            <span className="text-xs font-bold leading-tight">Enlace de recuperación enviado a tu correo.</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="w-full space-y-5">
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 ml-1">Correo Electrónico</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="email"
                required
                className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all text-sm font-semibold"
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
                className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all text-sm font-semibold"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-end">
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
            className="w-full bg-gray-900 hover:bg-black text-white font-bold py-4 rounded-2xl transition-all shadow-xl shadow-gray-900/10 active:scale-95 flex items-center justify-center gap-2 group disabled:opacity-50"
          >
            {loading ? (
              <RefreshCw className="animate-spin" size={20} />
            ) : (
              <>
                Acceder
                <LogIn className="group-hover:translate-x-1 transition-transform" size={20} />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
