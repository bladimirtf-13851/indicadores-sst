import React, { useState } from 'react';
import { AccidentType, EventType, EventRecord, OriginType } from '../types';
import { Plus, X, AlertCircle, ShieldAlert, Clock } from 'lucide-react';

interface Props {
  onAdd: (record: Omit<EventRecord, 'id'>) => void;
  onClose: () => void;
}

export default function EventForm({ onAdd, onClose }: Props) {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    description: '',
    eventType: EventType.ACCIDENTE,
    accidentType: AccidentType.INCAPACITANTE,
    origin: OriginType.COMUN,
    lostDays: 0,
    chargedDays: 0,
    employeeName: '',
    department: '',
    isNewCase: true
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg">
              <Plus size={20} />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Nuevo Registro</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Event Type Selector */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { id: EventType.ACCIDENTE, label: 'Accidente', icon: ShieldAlert, color: 'emerald' },
              { id: EventType.INCIDENTE, label: 'Incidente', icon: AlertCircle, color: 'blue' },
              { id: EventType.AUSENTISMO, label: 'Ausentismo', icon: Clock, color: 'amber' },
            ].map((type) => (
              <button
                key={type.id}
                type="button"
                onClick={() => setFormData({ ...formData, eventType: type.id })}
                className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${
                  formData.eventType === type.id 
                    ? `border-${type.color}-600 bg-${type.color}-50 text-${type.color}-700` 
                    : 'border-gray-100 hover:border-gray-200 text-gray-500'
                }`}
              >
                <type.icon size={20} />
                <span className="text-xs font-bold">{type.label}</span>
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Fecha del Evento</label>
              <input
                type="date"
                required
                className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                value={formData.date}
                onChange={e => setFormData({ ...formData, date: e.target.value })}
              />
            </div>
            
            {formData.eventType === EventType.ACCIDENTE && (
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Tipo de Accidente</label>
                <select
                  className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none appearance-none bg-white"
                  value={formData.accidentType}
                  onChange={e => setFormData({ ...formData, accidentType: e.target.value as AccidentType })}
                >
                  {Object.values(AccidentType).map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
            )}

            {formData.eventType === EventType.AUSENTISMO && (
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Origen del Ausentismo</label>
                <select
                  className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none appearance-none bg-white"
                  value={formData.origin}
                  onChange={e => setFormData({ ...formData, origin: e.target.value as OriginType })}
                >
                  {Object.values(OriginType).map(o => (
                    <option key={o} value={o}>{o}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {formData.eventType === EventType.AUSENTISMO && (
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-400">¿Caso Nuevo?</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, isNewCase: true })}
                  className={`flex-1 p-2 rounded-lg text-xs font-bold border ${formData.isNewCase ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-gray-500 border-gray-200'}`}
                >
                  Sí
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, isNewCase: false })}
                  className={`flex-1 p-2 rounded-lg text-xs font-bold border ${!formData.isNewCase ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-gray-500 border-gray-200'}`}
                >
                  No
                </button>
              </div>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Nombre del Trabajador</label>
            <input
              type="text"
              required
              placeholder="Ej: Juan Pérez"
              className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
              value={formData.employeeName}
              onChange={e => setFormData({ ...formData, employeeName: e.target.value })}
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Departamento / Área</label>
            <input
              type="text"
              required
              placeholder="Ej: Producción"
              className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
              value={formData.department}
              onChange={e => setFormData({ ...formData, department: e.target.value })}
            />
          </div>

          {(formData.eventType === EventType.ACCIDENTE || formData.eventType === EventType.AUSENTISMO) && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Días Perdidos</label>
                <input
                  type="number"
                  min="0"
                  className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                  value={formData.lostDays}
                  onChange={e => setFormData({ ...formData, lostDays: parseInt(e.target.value) || 0 })}
                />
              </div>
              {formData.eventType === EventType.ACCIDENTE && (
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Días Cargados</label>
                  <input
                    type="number"
                    min="0"
                    className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                    value={formData.chargedDays}
                    onChange={e => setFormData({ ...formData, chargedDays: parseInt(e.target.value) || 0 })}
                  />
                </div>
              )}
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Descripción del Evento</label>
            <textarea
              required
              rows={3}
              className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none resize-none"
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <button
            type="submit"
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 active:scale-[0.98]"
          >
            <Plus size={20} />
            Guardar Registro
          </button>
        </form>
      </div>
    </div>
  );
}
