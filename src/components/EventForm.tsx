import React, { useState, useEffect } from 'react';
import { AccidentType, EventType, EventRecord, OriginType, FORM_OPTIONS, CorrectiveActionItem } from '../types';
import { Plus, X, AlertCircle, ShieldAlert, Clock, User, Briefcase, MapPin, Activity, Save, Calendar as CalendarIcon, Mail, Trash2, Paperclip, Upload } from 'lucide-react';
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
    correctiveActions: '',
    correctiveActionsList: []
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

  // Synchronize record primary date for absenteeism events automatically based on incapacity start date
  useEffect(() => {
    if (formData.eventType === EventType.AUSENTISMO && formData.incapacityStartDate) {
      setFormData(prev => {
        if (prev.date !== prev.incapacityStartDate) {
          return { ...prev, date: prev.incapacityStartDate };
        }
        return prev;
      });
    }
  }, [formData.eventType, formData.incapacityStartDate]);

  useEffect(() => {
    if (editRecord) {
      const { id, ...data } = editRecord;
      setFormData({
        ...data,
        correctiveActionsList: data.correctiveActionsList || []
      });
    }
  }, [editRecord]);

  const handleAddAction = () => {
    const currentList = formData.correctiveActionsList || [];
    if (currentList.length >= 5) return;
    const newAction: CorrectiveActionItem = {
      id: Math.random().toString(36).substring(2, 9),
      description: '',
      responsibleName: '',
      responsiblePosition: '',
      responsibleEmail: '',
      executionDate: '',
      notificationSent: false,
      status: 'Abierto'
    };
    setFormData(prev => ({
      ...prev,
      correctiveActionsList: [...currentList, newAction]
    }));
  };

  const handleUpdateAction = (index: number, updatedFields: Partial<CorrectiveActionItem>) => {
    const currentList = [...(formData.correctiveActionsList || [])];
    if (currentList[index]) {
      currentList[index] = { ...currentList[index], ...updatedFields };
      setFormData(prev => ({ ...prev, correctiveActionsList: currentList }));
    }
  };

  const handleRemoveAction = (index: number) => {
    const currentList = (formData.correctiveActionsList || []).filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, correctiveActionsList: currentList }));
  };

  const handleFileUpload = (index: number, file: File) => {
    if (file.type !== 'application/pdf') {
      alert('Por favor, cargue únicamente archivos en formato PDF.');
      return;
    }
    
    const reader = new FileReader();
    reader.onload = () => {
      const base64Data = reader.result as string;
      const formattedSize = `${(file.size / (1024 * 1024)).toFixed(2)} MB`;
      handleUpdateAction(index, {
        evidenceFileName: file.name,
        evidenceFileData: base64Data,
        evidenceFileSize: formattedSize
      });
    };
    reader.readAsDataURL(file);
  };

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
            {formData.eventType !== EventType.AUSENTISMO && (
              <>
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
              </>
            )}

            {formData.eventType === EventType.AUSENTISMO && (
              <>
                <div className="flex items-center gap-2 mb-2">
                  <Briefcase size={14} className="text-gray-400" />
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Especificaciones del Ausentismo</span>
                </div>
                
                <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-2xl">
                  <div className="space-y-1">
                    <label className="text-xs font-bold uppercase tracking-wider text-gray-400 font-bold">Origen de la Incapacidad</label>
                    <select
                      className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm bg-white font-semibold text-gray-700"
                      value={formData.origin || OriginType.COMUN}
                      onChange={e => setFormData({ ...formData, origin: e.target.value as OriginType })}
                    >
                      <option value={OriginType.COMUN}>Común</option>
                      <option value={OriginType.LABORAL}>Laboral</option>
                    </select>
                  </div>
                  
                  <div className="space-y-1">
                    <label className="text-xs font-bold uppercase tracking-wider text-gray-400 font-bold">¿Es Caso Nuevo de EL?</label>
                    <select
                      className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm bg-white font-semibold text-gray-700"
                      value={formData.isNewCase ? 'true' : 'false'}
                      onChange={e => setFormData({ ...formData, isNewCase: e.target.value === 'true' })}
                    >
                      <option value="true">Sí (Caso Nuevo)</option>
                      <option value="false">No (Caso Antiguo)</option>
                    </select>
                  </div>
                </div>
              </>
            )}

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
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-6 bg-blue-50/30 p-6 rounded-3xl border border-blue-50">
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-blue-900/60">Causas Potenciales / Análisis de Causa Raíz</label>
                  <textarea
                    rows={2}
                    placeholder="Escriba las causas potenciales encontradas (Ej: Falta de protección, piso húmedo, etc.)..."
                    className="w-full p-3 border border-blue-100 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-white"
                    value={formData.potentialCauses}
                    onChange={e => setFormData({ ...formData, potentialCauses: e.target.value })}
                  />
                </div>
              </div>

              {/* Dynamic Corrective Actions Block (Max 5) */}
              <div className="space-y-4 bg-emerald-50/10 p-6 rounded-3xl border border-emerald-100/60">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-150 pb-4">
                  <div className="flex items-center gap-2">
                    <Activity size={16} className="text-emerald-600" />
                    <div>
                      <h4 className="text-sm font-black text-gray-800 uppercase tracking-wider">Plan de Acciones Correctivas y Preventivas</h4>
                      <p className="text-[10px] text-gray-400 font-medium font-mono">HASTA 5 ACCIONES CON RESPONSABLES Y CIERRES</p>
                    </div>
                  </div>
                  
                  {(formData.correctiveActionsList || []).length < 5 && (
                    <button
                      type="button"
                      onClick={handleAddAction}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-extrabold uppercase tracking-widest rounded-xl transition-all flex items-center gap-1.5 shadow-md shadow-emerald-200"
                    >
                      <Plus size={12} strokeWidth={2.5} />
                      Añadir Acción
                    </button>
                  )}
                </div>

                <div className="space-y-5">
                  {(formData.correctiveActionsList || []).map((action, index) => (
                    <div 
                      key={action.id || index} 
                      className="p-4 bg-white border border-gray-200 rounded-2xl shadow-sm hover:border-emerald-300 transition-all space-y-4 relative"
                    >
                      <div className="flex items-center justify-between border-b border-gray-50 pb-2">
                        <span className="text-[11px] font-black text-emerald-600 uppercase tracking-widest">
                          Acción #{index + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveAction(index)}
                          className="p-1 hover:bg-red-50 text-gray-400 hover:text-red-600 rounded-lg transition-all"
                          title="Eliminar esta acción"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Descripción de la Medida / Acción</label>
                        <textarea
                          rows={2}
                          required
                          placeholder="Describa puntualmente la acción correctiva o preventiva..."
                          className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-xs resize-none"
                          value={action.description || ''}
                          onChange={e => handleUpdateAction(index, { description: e.target.value })}
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Responsable (Nombre)</label>
                          <div className="relative">
                            <User size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                              type="text" required
                              placeholder="Ej: Sofía Gómez"
                              className="w-full pl-8 pr-3 p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-xs"
                              value={action.responsibleName || ''}
                              onChange={e => handleUpdateAction(index, { responsibleName: e.target.value })}
                            />
                          </div>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Cargo</label>
                          <div className="relative">
                            <Briefcase size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                              type="text" required
                              placeholder="Ej: Inspectora SST"
                              className="w-full pl-8 pr-3 p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-xs"
                              value={action.responsiblePosition || ''}
                              onChange={e => handleUpdateAction(index, { responsiblePosition: e.target.value })}
                            />
                          </div>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Correo Electrónico</label>
                          <div className="relative">
                            <Mail size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                              type="email" required
                              placeholder="ejemplo@correo.com"
                              className="w-full pl-8 pr-3 p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-xs"
                              value={action.responsibleEmail || ''}
                              onChange={e => handleUpdateAction(index, { responsibleEmail: e.target.value })}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Fecha de Ejecución</label>
                          <div className="relative">
                            <CalendarIcon size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                              type="date" required
                              className="w-full pl-8 pr-3 p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-xs text-gray-600 bg-white"
                              value={action.executionDate || ''}
                              onChange={e => handleUpdateAction(index, { executionDate: e.target.value })}
                            />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Notificación Electrónica</label>
                          <div className="h-[46px] flex items-center pl-1">
                            <label className="flex items-center gap-2.5 cursor-pointer select-none">
                              <input
                                type="checkbox"
                                className="w-4 h-4 rounded text-emerald-600 border-gray-300 focus:ring-emerald-500 cursor-pointer"
                                checked={action.notificationSent || false}
                                onChange={e => handleUpdateAction(index, { notificationSent: e.target.checked })}
                              />
                              <span className="text-xs font-semibold text-gray-650">Enviar correo sst</span>
                            </label>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Estado de Cierre</label>
                          <select
                            className={`w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-xs bg-white font-bold ${
                              action.status === 'Cerrado' ? 'text-green-600' : 'text-amber-500'
                            }`}
                            value={action.status || 'Abierto'}
                            onChange={e => handleUpdateAction(index, { status: e.target.value as 'Abierto' | 'Cerrado' })}
                          >
                            <option value="Abierto">🟠 Abierto (Pendiente)</option>
                            <option value="Cerrado">🟢 Cerrado (Ejecutado)</option>
                          </select>
                        </div>
                      </div>

                      {/* PDF Upload Area if Closed */}
                      {action.status === 'Cerrado' && (
                        <div className="bg-emerald-50/30 p-4 rounded-xl border border-dashed border-emerald-200/80 space-y-2 mt-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[9px] font-black text-emerald-800 uppercase tracking-wider">Carga de Soporte / Evidencia Firmada (PDF)</span>
                            {action.evidenceFileName && (
                              <button
                                type="button"
                                onClick={() => handleUpdateAction(index, { evidenceFileName: undefined, evidenceFileData: undefined, evidenceFileSize: undefined })}
                                className="text-[9px] font-extrabold text-red-650 hover:text-red-800 uppercase underline"
                              >
                                Eliminar Archivo
                              </button>
                            )}
                          </div>
                          
                          {!action.evidenceFileName ? (
                            <div className="flex items-center justify-center w-full">
                              <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-gray-200 border-dashed rounded-xl cursor-pointer bg-white hover:bg-emerald-50/10 hover:border-emerald-450 transition-all">
                                <div className="flex flex-col items-center justify-center pt-3 pb-3">
                                  <Upload size={18} className="text-emerald-500 mb-1.5 animate-pulse" />
                                  <p className="text-[11px] font-bold text-gray-650">Subir evidencia en PDF o arrastrar aquí</p>
                                  <p className="text-[8px] text-gray-400 uppercase mt-0.5 font-mono">Únicamente formato .pdf</p>
                                </div>
                                <input
                                  type="file"
                                  accept="application/pdf"
                                  className="hidden"
                                  onChange={e => {
                                    const file = e.target.files?.[0];
                                    if (file) handleFileUpload(index, file);
                                  }}
                                />
                              </label>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 bg-white p-3 border border-emerald-200/50 rounded-xl">
                              <Paperclip size={16} className="text-emerald-600 shrink-0 animate-bounce" />
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-bold text-gray-800 truncate">{action.evidenceFileName}</p>
                                <p className="text-[10px] text-gray-400 font-semibold">{action.evidenceFileSize}</p>
                              </div>
                              <div>
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-[8px] font-black uppercase bg-green-100 text-green-800 tracking-wider">
                                  Evidencia ok ✓
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}

                  {(formData.correctiveActionsList || []).length === 0 && (
                    <div className="p-8 text-center border border-dashed border-gray-200 rounded-2xl bg-gray-50/50">
                      <p className="text-xs font-bold text-gray-400 tracking-normal">No se han registrado acciones correctivas o preventivas individuales en este reporte.</p>
                      <button
                        type="button"
                        onClick={handleAddAction}
                        className="mt-2.5 px-3 py-1.5 bg-white text-xs font-extrabold text-emerald-600 border border-gray-200 hover:border-emerald-350 shadow-sm hover:shadow-emerald-50 rounded-lg"
                      >
                        Definir primera acción (Máx. 5)
                      </button>
                    </div>
                  )}
                </div>
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
