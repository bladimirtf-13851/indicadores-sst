import React, { useState, useEffect } from 'react';
import { initializeApp, deleteApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { collection, query, where, getDocs, doc, setDoc, updateDoc } from 'firebase/firestore';
import { Company } from '../types';
import { firebaseService } from '../services/firebaseService';
import { db } from '../lib/firebase';
import firebaseConfig from '../../firebase-applet-config.json';
import { X, Mail, Lock, UserPlus, Copy, Check, Send, Trash2, Edit2, User, Power, RefreshCw, Plus, AlertCircle, Link } from 'lucide-react';

interface Props {
  company: Company;
  onClose: () => void;
}

interface CompanyUser {
  id: string;
  email: string;
  name?: string;
  active?: boolean;
  createdAt?: string;
}

export default function CompanyUserModal({ company, onClose }: Props) {
  const [users, setUsers] = useState<CompanyUser[]>([]);
  const [fetching, setFetching] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [editingUser, setEditingUser] = useState<CompanyUser | null>(null);

  // Form Fields for Creation
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [tempCredentials, setTempCredentials] = useState<{ email: string; pass: string } | null>(null);
  const [copied, setCopied] = useState(false);

  // Form Fields for Editing
  const [editName, setEditName] = useState('');

  const fetchUsers = async () => {
    setFetching(true);
    try {
      const data = await firebaseService.getCompanyUsers(company.id);
      setUsers(data as CompanyUser[]);
    } catch (err) {
      console.error("Error fetching company users:", err);
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [company.id]);

  const mapFirebaseAuthError = (err: any): string => {
    const code = err?.code || '';
    const msg = err?.message || '';

    if (code === 'auth/email-already-in-use' || msg.includes('email-already-in-use')) {
      return 'El correo electrónico ya se encuentra registrado. Se ha intentado asociar automáticamente a esta empresa.';
    }
    if (code === 'auth/weak-password' || msg.includes('weak-password')) {
      return 'La contraseña es muy débil. Debe tener un mínimo de 6 caracteres.';
    }
    if (code === 'auth/invalid-email' || msg.includes('invalid-email')) {
      return 'El formato de correo electrónico no es válido. Por favor verifique el texto ingresado.';
    }
    if (code === 'auth/network-request-failed' || msg.includes('network-request-failed')) {
      return 'Error de red al conectar con el servidor de autenticación. Intente nuevamente.';
    }
    return msg || 'Error al procesar la creación del usuario.';
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    if (cleanPassword.length < 6) {
      setError('La contraseña debe tener mínimo 6 caracteres.');
      setLoading(false);
      return;
    }

    // Generate unique app name to strictly prevent [app/duplicate-app] error
    const uniqueAppName = `secondary-auth-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    let secondaryApp: any = null;

    try {
      secondaryApp = initializeApp(firebaseConfig, uniqueAppName);
      const secondaryAuth = getAuth(secondaryApp);

      const { user } = await createUserWithEmailAndPassword(secondaryAuth, cleanEmail, cleanPassword);
      
      // Create profile in Firestore
      await firebaseService.createUserProfile(user.uid, cleanEmail, 'company', company.id, name.trim(), true);
      
      // Cleanup secondary auth
      await signOut(secondaryAuth);
      
      // Save for credential copy
      setTempCredentials({ email: cleanEmail, pass: cleanPassword });
      
      // Refresh user view
      await fetchUsers();
      
      // Reset form
      setName('');
      setEmail('');
      setPassword('');
    } catch (err: any) {
      console.warn("Attempting recovery or fallback for user creation:", err);
      const isAlreadyInUse = err?.code === 'auth/email-already-in-use' || err?.message?.includes('email-already-in-use');

      if (isAlreadyInUse) {
        try {
          // If the user was already created in Auth, link their profile in Firestore to this company!
          const q = query(collection(db, 'users'), where('email', '==', cleanEmail));
          const snapshot = await getDocs(q);

          if (!snapshot.empty) {
            const userDoc = snapshot.docs[0];
            await updateDoc(doc(db, 'users', userDoc.id), {
              companyId: company.id,
              role: 'company',
              active: true,
              ...(name.trim() ? { name: name.trim() } : {})
            });
            setTempCredentials({ email: cleanEmail, pass: '(Contraseña ya existente)' });
            await fetchUsers();
            setName('');
            setEmail('');
            setPassword('');
            return;
          } else {
            // Document does not exist in 'users' collection yet
            setError('El correo ya existe en la base de usuarios de autenticación. Por favor asigne otro correo o utilice las credenciales originales.');
          }
        } catch (profileErr: any) {
          setError(mapFirebaseAuthError(err));
        }
      } else {
        setError(mapFirebaseAuthError(err));
      }
    } finally {
      setLoading(false);
      if (secondaryApp) {
        try {
          await deleteApp(secondaryApp);
        } catch (delErr) {
          console.warn("Error cleaning secondary app instance:", delErr);
        }
      }
    }
  };

  const handleToggleStatus = async (user: CompanyUser) => {
    const nextActive = user.active === false ? true : false;
    try {
      await firebaseService.updateUserProfile(user.id, { active: nextActive });
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, active: nextActive } : u));
    } catch (err) {
      alert("Error al modificar el estado del usuario.");
    }
  };

  const handleStartEdit = (user: CompanyUser) => {
    setEditingUser(user);
    setEditName(user.name || '');
  };

  const handleSaveEdit = async () => {
    if (!editingUser) return;
    try {
      await firebaseService.updateUserProfile(editingUser.id, { name: editName });
      setUsers(prev => prev.map(u => u.id === editingUser.id ? { ...u, name: editName } : u));
      setEditingUser(null);
    } catch (err) {
      alert("Error al guardar los cambios del usuario.");
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("¿Está seguro de eliminar permanentemente el acceso de este usuario? Perderá el acceso de forma inmediata.")) return;
    try {
      await firebaseService.deleteUserProfile(userId);
      setUsers(prev => prev.filter(u => u.id !== userId));
    } catch (err) {
      alert("No se pudo eliminar el usuario de la base de datos.");
    }
  };

  const copyToClipboard = () => {
    if (!tempCredentials) return;
    const text = `Hola,\n\nSe ha creado tu usuario para el sistema SST Expert.\n\nEmpresa: ${company.name}\nUsuario: ${tempCredentials.email}\nContraseña: ${tempCredentials.pass}\n\nEnlace de ingreso: ${window.location.origin}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-[40px] w-full max-w-2xl overflow-hidden shadow-2xl border border-gray-100 flex flex-col h-[650px]">
        {/* Header */}
        <div className="p-6 border-b border-gray-150 flex justify-between items-center bg-gray-50/50 shrink-0">
          <div>
            <h2 className="text-xl font-extrabold text-gray-900">Accesos y Usuarios de Empresa</h2>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Empresa: {company.name}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Credentials Show Room */}
        {tempCredentials ? (
          <div className="p-8 text-center space-y-6 overflow-y-auto flex-1">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-[24px] flex items-center justify-center mx-auto animate-bounce">
              <Check size={32} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Usuario Asignado con Éxito</h3>
              <p className="text-gray-400 text-xs mt-1">Copia estos datos y envíalos de forma segura al responsable de la empresa.</p>
            </div>
            
            <div className="bg-gray-50 p-5 rounded-2xl text-left space-y-2.5 font-mono text-xs border border-gray-150">
              <p><span className="text-gray-400 font-semibold font-sans">Empresa:</span> {company.name}</p>
              <p><span className="text-gray-400 font-semibold font-sans">Usuario:</span> {tempCredentials.email}</p>
              <p><span className="text-gray-400 font-semibold font-sans">Contraseña:</span> {tempCredentials.pass}</p>
              <p className="border-t border-gray-200 pt-2.5 mt-2.5 text-gray-400 truncate">
                <span className="font-semibold font-sans">Enlace:</span> {window.location.origin}
              </p>
            </div>

            <div className="flex gap-4">
              <button
                onClick={copyToClipboard}
                className="flex-1 bg-gray-900 hover:bg-black text-white hover:shadow-lg transition-all font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 text-sm"
              >
                {copied ? <Check size={16} /> : <Copy size={16} />}
                {copied ? '¡Copiado!' : 'Copiar Credenciales'}
              </button>
              <button
                onClick={() => setTempCredentials(null)}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white hover:shadow-lg transition-all font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 text-sm"
              >
                <Send size={16} />
                Regresar a la Lista
              </button>
            </div>
          </div>
        ) : isCreating ? (
          /* Create Form */
          <form onSubmit={handleCreateUser} className="p-8 space-y-5 overflow-y-auto flex-1">
            <h3 className="text-sm font-black text-emerald-600 uppercase tracking-wider mb-2">Crear Nuevo Acceso Corporativo</h3>
            
            {error && (
              <div className="bg-red-50 text-red-700 border border-red-200 p-4 rounded-xl text-xs font-bold flex items-start gap-2">
                <AlertCircle size={16} className="shrink-0 text-red-600 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 ml-1">Nombre Completo del Responsable</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="text"
                  required
                  placeholder="Ej: Administrador Carnes Danny"
                  className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all text-xs font-semibold text-gray-700"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 ml-1">Correo Electrónico de Ingreso</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="email"
                  required
                  placeholder="usuario@carnesdanny.com"
                  className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all text-xs font-semibold text-gray-700"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 ml-1">Contraseña de Acceso (mínimo 6 caracteres)</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="password"
                  required
                  minLength={6}
                  placeholder="Ej: Carnes2026*"
                  className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all text-xs font-semibold text-gray-700"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold py-3 rounded-xl text-xs uppercase"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl text-xs uppercase shadow-lg shadow-emerald-600/10 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? <RefreshCw className="animate-spin" size={14} /> : 'Registrar y Generar'}
              </button>
            </div>
          </form>
        ) : (
          /* Users list */
          <div className="p-6 flex-1 flex flex-col overflow-hidden">
            <div className="flex justify-between items-center mb-4 shrink-0">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">
                Usuarios Registrados ({users.length})
              </span>
              <button
                onClick={() => {
                  setError('');
                  setIsCreating(true);
                }}
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-emerald-100"
              >
                <Plus size={14} strokeWidth={2.5} />
                Nuevo Acceso
              </button>
            </div>

            {fetching ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-2">
                <RefreshCw className="animate-spin text-emerald-600" size={32} />
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Cargando cuentas corporativas...</p>
              </div>
            ) : users.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8 border border-dashed border-gray-200 rounded-3xl bg-gray-50/50">
                <User size={40} className="text-gray-300 mb-2" />
                <p className="text-xs font-bold text-gray-400 text-center">No hay usuarios asignados a esta empresa aún.</p>
                <button
                  type="button"
                  onClick={() => setIsCreating(true)}
                  className="mt-3 text-xs text-emerald-600 font-extrabold underline hover:text-emerald-700"
                >
                  Registrar primer usuario
                </button>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                {users.map((userItem) => (
                  <div 
                    key={userItem.id}
                    className="p-4 bg-white border border-gray-200 rounded-2xl shadow-sm hover:border-emerald-250 transition-all flex items-center justify-between gap-4"
                  >
                    <div className="min-w-0 flex-1">
                      {editingUser?.id === userItem.id ? (
                        <div className="flex items-center gap-2 max-w-md">
                          <input
                            type="text"
                            className="p-1 px-2.5 border border-emerald-500 rounded-lg outline-none text-xs font-semibold text-gray-700 w-full"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveEdit();
                              if (e.key === 'Escape') setEditingUser(null);
                            }}
                            autoFocus
                          />
                          <button
                            onClick={handleSaveEdit}
                            className="px-2 py-1 bg-emerald-600 text-white rounded text-[10px] font-bold uppercase"
                          >
                            Ok
                          </button>
                          <button
                            onClick={() => setEditingUser(null)}
                            className="px-2 py-1 bg-gray-200 text-gray-600 rounded text-[10px] font-bold uppercase"
                          >
                            X
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-extrabold text-gray-800 truncate">
                            {userItem.name || 'Sin nombre asignado'}
                          </p>
                          <button
                            onClick={() => handleStartEdit(userItem)}
                            className="p-1 hover:text-emerald-600 text-gray-400 transition-colors"
                            title="Editar nombre"
                          >
                            <Edit2 size={11} />
                          </button>
                        </div>
                      )}
                      
                      <div className="flex items-center gap-2 mt-0.5 min-w-0">
                        <span className="text-[10px] font-mono font-semibold text-gray-400 truncate">{userItem.email}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {/* Active Status Toggle */}
                      <button
                        onClick={() => handleToggleStatus(userItem)}
                        className={`px-2.5 py-1 rounded-lg text-[9px] font-extrabold uppercase transition-all tracking-wider flex items-center gap-1 ${
                          userItem.active !== false
                            ? 'bg-green-50 text-green-700 hover:bg-green-150 border border-green-200'
                            : 'bg-amber-50 text-amber-700 hover:bg-amber-150 border border-amber-200'
                        }`}
                        title={userItem.active !== false ? 'Haga clic para bloquear el acceso' : 'Haga clic para activar el acceso'}
                      >
                        <Power size={10} strokeWidth={2.5} />
                        {userItem.active !== false ? 'Activo' : 'Bloqueado'}
                      </button>

                      {/* Delete Button */}
                      <button
                        onClick={() => handleDeleteUser(userItem.id)}
                        className="p-2 bg-red-50 hover:bg-red-100 text-red-650 hover:text-red-800 rounded-lg transition-all"
                        title="Eliminar usuario permanentemente"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        
        {/* Footer */}
        <div className="p-4 border-t border-gray-100 bg-gray-50/50 text-center shrink-0">
          <p className="text-[9px] text-gray-400 uppercase tracking-widest font-mono font-black">
            Acceso exclusivo para el Administrador SST Expert
          </p>
        </div>
      </div>
    </div>
  );
}
