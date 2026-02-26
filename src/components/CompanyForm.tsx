import React, { useState } from 'react';
import { Company } from '../types';
import { Plus, X, Building2, Mail, FileText } from 'lucide-react';

interface Props {
  onAdd: (company: Omit<Company, 'id'>) => void;
  onClose: () => void;
}

export default function CompanyForm({ onAdd, onClose }: Props) {
  const [formData, setFormData] = useState({
    name: '',
    nit: '',
    email: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg">
              <Building2 size={20} />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Nueva Empresa</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="space-y-1">
            <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Razón Social / Nombre</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Building2 size={16} className="text-gray-400" />
              </div>
              <input
                type="text"
                required
                placeholder="Ej: Industrias Acme S.A.S"
                className="w-full pl-10 p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold uppercase tracking-wider text-gray-400">NIT</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FileText size={16} className="text-gray-400" />
              </div>
              <input
                type="text"
                required
                placeholder="Ej: 900.123.456-7"
                className="w-full pl-10 p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                value={formData.nit}
                onChange={e => setFormData({ ...formData, nit: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Correo Electrónico</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail size={16} className="text-gray-400" />
              </div>
              <input
                type="email"
                required
                placeholder="Ej: contacto@acme.com"
                className="w-full pl-10 p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 active:scale-[0.98]"
          >
            <Plus size={20} />
            Crear Empresa
          </button>
        </form>
      </div>
    </div>
  );
}
