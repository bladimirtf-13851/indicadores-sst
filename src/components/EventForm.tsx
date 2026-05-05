import React, { useState, useEffect } from 'react';
import { AccidentType, EventType, EventRecord, OriginType, FORM_OPTIONS } from '../types';
import { Plus, X, AlertCircle, ShieldAlert, Clock, User, Briefcase, MapPin, Activity, Save, Calendar as CalendarIcon } from 'lucide-react';
import { differenceInDays, parseISO } from 'date-fns';

interface Props {
  onAdd: (record: Omit<EventRecord, 'id'>) => void;
  onUpdate?: (id: string, record: Partial<EventRecord>) => void;
  onClose: () => void;
  editRecord?: EventRecord | null;
}

const MultiSelect = ({ 
  label, 
  options, 
  selected, 
  onChange, 
  showOther, 
  otherValue, 
  onOtherChange 
}: { 
  label: string; 
  options: string[]; 
  selected: string[]; 
  onChange: (val: string[]) => void;
  showOther?: boolean;
  otherValue?: string;
  onOtherChange?: (val: string) => void;
}) => {
  const toggle = (opt: string) => {
    if (selected.includes(opt)) {
      onChange(selected.filter(s => s !== opt));
    } else {
      onChange([...selected, opt]);
    }
  };

  return (
    <div className="space-y-2">
      <label className="text-xs font-bold uppercase tracking-wider text-gray-400">{label}</label>
      <div className="flex flex-wrap gap-2">
        {options.map(opt => (
          <button
            key={opt}
            type="button"
            onClick={() => toggle(opt)}
            className={`px-3 py-1.5 rounded-full text-[10px] font-bold border transition-all ${
              selected.includes(opt) 
                ? 'bg-emerald-600 border-emerald-600 text-white shadow-md' 
                : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
      {showOther && selected.includes('Otro') && (
        <input
          type="text"
          placeholder="Especifique otro..."
          className="w-full mt-2 p-2 text-xs border border-gray-200 rounded-lg focus:ring-1 focus:ring-emerald-500 outline-none"
          value={otherValue || ''}
          onChange={e => onOtherChange?.(e.target.value)}
        />
      )}
    </div>
  );
};

export default function EventForm({ onAdd, onUpdate, onClose, editRecord }: Props) {
  const [formData, setFormData] = useState<Omit<EventRecord, 'id'>>({
    date: new Date().toISOString().split('T')[0],
    time: '',
    description: '',
    eventType: EventType.ACCIDENTE,
    accidentType: AccidentType.INCAPACITANTE,
    origin: OriginType.COMUN,
    lostDays: 0,
    chargedDays: 0,
    employeeName: '',
    idNumber: '',
    position: '',
    seniority: '',
    employmentType: '',
    workdayType: '',
    location: '',
    locationOther: '',
    accidentAgent: [],
    accidentAgentOther: '',
    injuryType: [],
    injuryTypeOther: '',
    bodyPart: [],
    mechanism: [],
    mechanismOther: '',
    department: '',
    isNewCase: true,
    incapacityStartDate: '',
    incapacityEndDate: '',
    potentialCauses: '',
    correctiveActions: ''
  });

  // Calculate lost days automatically
  useEffect(() => {
    if (formData.incapacityStartDate && formData.incapacityEndDate) {
      try {
        const start = parseISO(formData.incapacityStartDate);
        const end = parseISO(formData.incapacityEndDate);
        
        // Difference in days + 1 to include both start and end dates
        const diff = differenceInDays(end, start) + 1;
        
        if (diff >= 0) {
          setFormData(prev => ({ ...prev, lostDays: diff }));
        }
      } catch (err) {
        console.error("Error calculating lost days:", err);
      }
    }
  }, [formData.incapacityStartDate, formData.incapacityEndDate]);

  useEffect(() => {
    if (editRecord) {
      const { id, ...data } = editRecord;
      setFormData(data);
    }
  }, [editRecord]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editRecord && onUpdate) {
      onUpdate(editRecord.id, formData);
    } else {
      onAdd(formData);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl text-white ${editRecord ? 'bg-blue-600' : 'bg-emerald-600 shadow-lg shadow-emerald-200'}`}>
              {editRecord ? <Save size={20} /> : <Plus size={20} />}
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{editRecord ? 'Editar Registro' : 'Nuevo Registro'}</h2>
              <p className="text-[10px] text-gray-500 font-medium uppercase tracking-tight">Sistema de Gestión SST - Indicadores</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400">
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-8 overflow-y-auto scrollbar-hide">
          {/* Section: Type Selection */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Activity size={14} className="text-gray-400" />
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Tipo de Evento</span>
            </div>
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
                  className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${
                    formData.eventType === type.id 
                      ? type.id === EventType.ACCIDENTE ? 'border-emerald-600 bg-emerald-50 text-emerald-700' :
                        type.id === EventType.INCIDENTE ? 'border-blue-600 bg-blue-50 text-blue-700' :
                        'border-amber-600 bg-amber-50 text-amber-700'
                      : 'border-gray-100 hover:border-gray-200 text-gray-400 opacity-60'
                  }`}
                >
                  <type.icon size={22} strokeWidth={formData.eventType === type.id ? 2.5 : 1.5} />
                  <span className="text-xs font-bold leading-none">{type.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Section: Personal & Employment Info */}
          <div className="space-y-4 pt-4 border-t border-gray-50">
            <div className="flex items-center gap-2 mb-2">
              <User size={14} className="text-gray-400" />
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Información del Trabajador</span>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Nombre Completo</label>
                <input
                  type="text" required placeholder="Ej: Juan Pérez"
                  className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm"
                  value={formData.employeeName}
                  onChange={e => setFormData({ ...formData, employeeName: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Identificación</label>
                <input
                  type="text" placeholder="C.C. / Pasaporte"
                  className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm"
                  value={formData.idNumber || ''}
                  onChange={e => setFormData({ ...formData, idNumber: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Cargo / Ocupación</label>
                <input
                  type="text" placeholder="Ej: Operario"
                  className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm"
                  value={formData.position || ''}
                  onChange={e => setFormData({ ...formData, position: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Área / Departamento</label>
                <input
                  type="text" required placeholder="Ej: Producción"
                  className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm"
                  value={formData.department}
                  onChange={e => setFormData({ ...formData, department: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Antigüedad</label>
                <input
                  type="text" placeholder="Tiempo en puesto"
                  className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm"
                  value={formData.seniority || ''}
                  onChange={e => setFormData({ ...formData, seniority: e.target.value })}
                />
              </div>
              <div className="col-span-2 space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Vinculación</label>
                <select
                  className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm bg-white"
                  value={formData.employmentType || ''}
                  onChange={e => setFormData({ ...formData, employmentType: e.target.value })}
                >
                  <option value="">Seleccione...</option>
                  {FORM_OPTIONS.employmentTypes.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Section: Event Specifics */}
          <div className="space-y-4 pt-4 border-t border-gray-50">
            <div className="flex items-center gap-2 mb-2">
              <Briefcase size={14} className="text-gray-400" />
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Detalles del Suceso</span>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Fecha</label>
                <input
                  type="date" required
                  className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm"
                  value={formData.date}
                  onChange={e => setFormData({ ...formData, date: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Hora</label>
                <input
                  type="time"
                  className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm"
                  value={formData.time || ''}
                  onChange={e => setFormData({ ...formData, time: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Jornada</label>
                <select
                  className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm bg-white"
                  value={formData.workdayType || ''}
                  onChange={e => setFormData({ ...formData, workdayType: e.target.value })}
                >
                  <option value="">Seleccione...</option>
                  {FORM_OPTIONS.workdayTypes.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Lugar Específico</label>
              <select
                className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm bg-white"
                value={formData.location || ''}
                onChange={e => setFormData({ ...formData, location: e.target.value })}
              >
                <option value="">Seleccione lugar...</option>
                {FORM_OPTIONS.locations.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              {formData.location === 'Otro' && (
                <input
                  type="text" placeholder="Especifique lugar..."
                  className="w-full mt-2 p-3 border border-gray-200 rounded-xl outline-none text-sm"
                  value={formData.locationOther || ''}
                  onChange={e => setFormData({ ...formData, locationOther: e.target.value })}
                />
              )}
            </div>

            {formData.eventType === EventType.ACCIDENTE && (
              <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-2xl">
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Gravedad</label>
                  <select
                    className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm bg-white"
                    value={formData.accidentType}
                    onChange={e => setFormData({ ...formData, accidentType: e.target.value as AccidentType })}
                  >
                    {Object.values(AccidentType).map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Días Cargados</label>
                  <input
                    type="number" min="0"
                    className="w-full p-3 border border-gray-200 rounded-xl outline-none text-sm"
                    value={formData.chargedDays}
                    onChange={e => setFormData({ ...formData, chargedDays: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>
            )}

            {(formData.eventType === EventType.ACCIDENTE || formData.eventType === EventType.AUSENTISMO) && (
              <div className="space-y-4 bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
                <div className="flex items-center gap-2 mb-2">
                  <CalendarIcon size={12} className="text-gray-400" />
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Periodo de Incapacidad</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Fecha Inicio</label>
                    <input
                      type="date"
                      className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm bg-white"
                      value={formData.incapacityStartDate || ''}
                      onChange={e => setFormData({ ...formData, incapacityStartDate: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Fecha Fin</label>
                    <input
                      type="date"
                      className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm bg-white"
                      value={formData.incapacityEndDate || ''}
                      onChange={e => setFormData({ ...formData, incapacityEndDate: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Días Perdidos (Autocalculado)</label>
                  <input
                    type="number" min="0" required
                    className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm bg-gray-100 font-bold text-emerald-700"
                    placeholder="0"
                    value={formData.lostDays}
                    onChange={e => setFormData({ ...formData, lostDays: parseInt(e.target.value) || 0 })}
                  />
                  <p className="text-[9px] text-gray-400 italic">Los días se calculan automáticamente restando las fechas de incapacidad.</p>
                </div>
              </div>
            )}
          </div>

          {/* Section: Forensic Forensics (Detailed Analysis) */}
          {formData.eventType === EventType.ACCIDENTE && (
            <div className="space-y-6 pt-4 border-t border-gray-50 bg-emerald-50/20 p-4 rounded-3xl">
              <div className="flex items-center gap-2 mb-2">
                <MapPin size={14} className="text-emerald-600" />
                <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">Análisis Médico y Técnico</span>
              </div>

              <MultiSelect
                label="Agente del Accidente"
                options={FORM_OPTIONS.accidentAgents}
                selected={formData.accidentAgent || []}
                onChange={val => setFormData({ ...formData, accidentAgent: val })}
              />

              <MultiSelect
                label="Tipo de Lesión"
                options={FORM_OPTIONS.injuryTypes}
                selected={formData.injuryType || []}
                onChange={val => setFormData({ ...formData, injuryType: val })}
                showOther otherValue={formData.injuryTypeOther}
                onOtherChange={val => setFormData({ ...formData, injuryTypeOther: val })}
              />

              <MultiSelect
                label="Parte del Cuerpo Afectada"
                options={FORM_OPTIONS.bodyParts}
                selected={formData.bodyPart || []}
                onChange={val => setFormData({ ...formData, bodyPart: val })}
              />

              <MultiSelect
                label="Mecanismo o Forma"
                options={FORM_OPTIONS.mechanisms}
                selected={formData.mechanism || []}
                onChange={val => setFormData({ ...formData, mechanism: val })}
                showOther otherValue={formData.mechanismOther}
                onOtherChange={val => setFormData({ ...formData, mechanismOther: val })}
              />
            </div>
          )}

          <div className="space-y-1 pt-4 border-t border-gray-50">
            <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Descripción Detallada</label>
            <textarea
              required rows={4}
              placeholder="Describa el hecho de forma clara y objetiva..."
              className="w-full p-4 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none resize-none text-sm leading-relaxed"
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          {(formData.eventType === EventType.INCIDENTE || formData.eventType === EventType.ACCIDENTE) && (
            <div className="grid grid-cols-1 gap-6 bg-blue-50/30 p-6 rounded-3xl border border-blue-50">
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-blue-900/60">Causas Potenciales / Análisis</label>
                <textarea
                  rows={2}
                  className="w-full p-3 border border-blue-100 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-white"
                  value={formData.potentialCauses}
                  onChange={e => setFormData({ ...formData, potentialCauses: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-emerald-900/60">Acciones Correctivas / Preventivas</label>
                <textarea
                  rows={2}
                  className="w-full p-3 border border-emerald-100 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm bg-white"
                  value={formData.correctiveActions}
                  onChange={e => setFormData({ ...formData, correctiveActions: e.target.value })}
                />
              </div>
            </div>
          )}

          <div className="pt-6 sticky bottom-0 bg-white pb-2">
            <button
              type="submit"
              className={`w-full text-white font-black py-4 rounded-2xl transition-all flex items-center justify-center gap-3 shadow-xl active:scale-[0.98] ${
                editRecord ? 'bg-blue-600 shadow-blue-200' : 'bg-emerald-600 shadow-emerald-200'
              }`}
            >
              {editRecord ? <Save size={20} /> : <Plus size={20} />}
              {editRecord ? 'Actualizar Registro' : 'Confirmar y Guardar Registro'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
