import React, { useState } from 'react';
import { initializeApp, deleteApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { Company } from '../types';
import { firebaseService } from '../services/firebaseService';
import firebaseConfig from '../../firebase-applet-config.json';
import { X, Mail, Lock, UserPlus, Copy, Check, Send } from 'lucide-react';

interface Props {
  company: Company;
  onClose: () => void;
}

export default function CompanyUserModal({ company, onClose }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Secondary app instance to create user without logging out the admin
    const secondaryApp = initializeApp(firebaseConfig, 'secondary');
    const secondaryAuth = getAuth(secondaryApp);

    try {
      const { user } = await createUserWithEmailAndPassword(secondaryAuth, email, password);
      
      // Create profile in Firestore
      await firebaseService.createUserProfile(user.uid, email, 'company', company.id);
      
      // Cleanup
      await signOut(secondaryAuth);
      
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Error al crear el usuario.');
    } finally {
      setLoading(false);
      // Delete special secondary app
      if (secondaryApp) deleteApp(secondaryApp);
    }
  };

  const copyToClipboard = () => {
    const text = `Hola,\n\nSe ha creado tu usuario para el sistema SST Expert.\n\nEmpresa: ${company.name}\nUsuario: ${email}\nContraseña: ${password}\n\nEnlace de ingreso: ${window.location.origin}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-[40px] w-full max-w-lg overflow-hidden shadow-2xl border border-gray-100">
        <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <div>
            <h2 className="text-xl font-extrabold text-gray-900">Crear Usuario de Empresa</h2>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">{company.name}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        {success ? (
          <div className="p-10 text-center space-y-6">
            <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-[30px] flex items-center justify-center mx-auto animate-bounce">
              <Check size={40} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">Usuario Creado con Éxito</h3>
              <p className="text-gray-500 text-sm mt-2">Copia estos datos y envíalos al usuario. No se podrán recuperar después.</p>
            </div>
            
            <div className="bg-gray-50 p-6 rounded-3xl text-left space-y-3 font-mono text-xs border border-gray-100">
              <p><span className="text-gray-400">Usuario:</span> {email}</p>
              <p><span className="text-gray-400">Contraseña:</span> {password}</p>
              <p className="border-t pt-3 mt-3 truncate"><span className="text-gray-400">Enlace:</span> {window.location.origin}</p>
            </div>

            <div className="flex gap-4">
               <button
                onClick={copyToClipboard}
                className="flex-1 bg-gray-900 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2"
              >
                {copied ? <Check size={18} /> : <Copy size={18} />}
                {copied ? 'Copiado' : 'Copiar Datos'}
              </button>
              <button
                onClick={onClose}
                className="flex-1 bg-emerald-600 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2"
              >
                <Send size={18} />
                Confirmar envío
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleCreateUser} className="p-8 space-y-6">
            {error && (
              <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-xs font-bold flex items-center gap-2">
                <AlertCircle size={16} />
                {error}
              </div>
            )}

            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 ml-1">Correo para Recuperación</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="email"
                  required
                  placeholder="usuario@empresa.com"
                  className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all text-sm font-semibold"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 ml-1">Contraseña Temporal</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="password"
                  required
                  placeholder="Mínimo 8 caracteres"
                  className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all text-sm font-semibold"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 rounded-2xl transition-all shadow-xl shadow-emerald-600/20 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <RefreshCw className="animate-spin" size={18} />
              ) : (
                <>
                  <UserPlus size={18} />
                  Crear Usuario y Generar Credenciales
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

function AlertCircle({ size }: { size: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>;
}

function RefreshCw({ className, size }: { className?: string, size: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>;
}
