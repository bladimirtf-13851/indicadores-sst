import React, { useState } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail, sendEmailVerification } from 'firebase/auth';
import { auth } from '../lib/firebase';
import Logo from './Logo';
import { Mail, Lock, LogIn, RefreshCw, AlertCircle, UserPlus, ArrowRight } from 'lucide-react';

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        const { user } = await createUserWithEmailAndPassword(auth, email, password);
        await sendEmailVerification(user);
      }
    } catch (err: any) {
      if (err.code === 'auth/email-already-in-use') {
        setError('Este correo ya está registrado. Intente iniciar sesión.');
      } else if (err.code === 'auth/weak-password') {
        setError('La contraseña es muy débil (mínimo 6 caracteres).');
      } else if (err.code === 'auth/operation-not-allowed') {
        setError('El método de registro con correo no está habilitado en la consola de Firebase. Por favor actívalo en Authentication > Sign-in method.');
      } else if (err.code === 'auth/invalid-email') {
        setError('El formato del correo electrónico no es válido.');
      } else {
        setError('Error: ' + (err.message || 'Error de conexión. Verifica que el método de correo/contraseña esté habilitado en Firebase.'));
      }
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
        
        <h2 className="text-2xl font-extrabold text-gray-900 mb-2">
          {isLogin ? 'Bienvenido' : 'Crear Cuenta'}
        </h2>
        <p className="text-gray-500 mb-8 text-center text-sm font-medium">
          {isLogin 
            ? 'Ingresa tus credenciales para acceder al sistema de gestión SST.' 
            : 'Regístrate para comenzar a gestionar los indicadores de SST.'}
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
            <span className="text-xs font-bold leading-tight">Enlace de recuperación enviado a tu correo.</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="w-full space-y-5">
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

          {isLogin && (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleForgotPassword}
                className="text-xs font-bold text-emerald-600 hover:text-emerald-700 transition-colors"
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gray-900 hover:bg-black text-white font-bold py-4 rounded-2xl transition-all shadow-xl shadow-gray-900/10 active:scale-95 flex items-center justify-center gap-2 group disabled:opacity-50"
          >
            {loading ? (
              <RefreshCw className="animate-spin" size={20} />
            ) : (
              <>
                {isLogin ? 'Acceder' : 'Registrarse'}
                {isLogin ? <LogIn className="group-hover:translate-x-1 transition-transform" size={20} /> : <UserPlus size={20} />}
              </>
            )}
          </button>
        </form>

        <div className="mt-8 pt-8 border-t border-gray-100 w-full text-center">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">
            {isLogin ? '¿No tienes una cuenta?' : '¿Ya tienes una cuenta?'}
          </p>
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="flex items-center justify-center gap-2 mx-auto text-emerald-600 font-bold text-sm hover:text-emerald-700 transition-colors"
          >
            {isLogin ? 'Crea una cuenta de administrador' : 'Inicia sesión con tu cuenta'}
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
