import React, { useState, useEffect } from 'react';
import { AccidentType, EventType, EventRecord, OriginType, FORM_OPTIONS } from '../types';
import { Plus, X, AlertCircle, ShieldAlert, Clock, User, Briefcase, MapPin, Activity, Save, Calendar as CalendarIcon, Phone, Mail, Building, Users, FileText, CheckCircle2, ChevronDown, ChevronUp, AlertTriangle, Loader2 } from 'lucide-react';
import { differenceInDays, parseISO, format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Props {
  onAdd: (record: Omit<EventRecord, 'id'>) => Promise<void> | void;
  onUpdate?: (id: string, record: Partial<EventRecord>) => Promise<void> | void;
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
      <label className="text-[11px] font-black uppercase tracking-wider text-gray-500">{label}</label>
      <div className="flex flex-wrap gap-1.5">
        {options.map(opt => {
          const isSel = selected.includes(opt);
          return (
            <button
              key={opt}
              type="button"
              onClick={() => toggle(opt)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                isSel 
                  ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm' 
                  : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              {opt}
            </button>
          );
        })}
      </div>
      {showOther && selected.includes('Otro') && (
        <input
          type="text"
          placeholder="Especifique otro..."
          className="w-full mt-2 p-2.5 text-xs border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
          value={otherValue || ''}
          onChange={e => onOtherChange?.(e.target.value)}
        />
      )}
    </div>
  );
};

export default function EventForm({ onAdd, onUpdate, onClose, editRecord }: Props) {
  const [activeSection, setActiveSection] = useState<'general' | 'worker' | 'accident' | 'witnesses' | 'responsible'>('general');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [validationSummary, setValidationSummary] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState<Omit<EventRecord, 'id'>>({
    date: new Date().toISOString().split('T')[0],
    time: '08:00',
    description: '',
    eventType: EventType.ACCIDENTE,
    accidentType: AccidentType.INCAPACITANTE,
    origin: OriginType.LABORAL,
    lostDays: 0,
    chargedDays: 0,
    employeeName: '',
    idNumber: '',
    position: '',
    seniority: '',
    employmentType: 'Planta / Contrato Directo',
    workdayType: 'Jornada Ordinaria',
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

    // FURAT Fields
    eps: '',
    epsCode: '',
    arl: '',
    arlCode: '',
    afp: '',
    afpCode: '',
    sameWorkCenter: true,
    workCenterName: '',
    workCenterActivity: '',
    workCenterAddress: '',
    workCenterDepartment: '',
    workCenterMunicipality: '',
    workCenterZone: 'U',

    firstSurname: '',
    secondSurname: '',
    firstName: '',
    secondName: '',
    idType: 'CC',
    birthDate: '',
    gender: 'M',
    employeeAddress: '',
    employeePhone: '',
    employeeDepartment: '',
    employeeMunicipality: '',
    employeeZone: 'U',
    habitualOccupation: '',
    occupationCode: '',
    hireDate: '',
    monthlySalary: '',
    workdaySchedule: 'Diurna',

    weekDay: 'Lunes',
    doingHabitualWork: true,
    nonHabitualWorkDetail: '',
    workedTimeBeforeAccident: '',
    accidentCircumstance: 'Propios del trabajo',
    causedDeath: false,
    accidentLocationType: 'Dentro de la empresa',
    accidentDepartment: '',
    accidentMunicipality: '',
    accidentZone: 'U',

    hasWitnesses: false,
    witnesses: [],

    reportResponsibleName: '',
    reportResponsiblePosition: '',
    reportResponsibleIdType: 'CC',
    reportResponsibleIdNumber: '',
    reportDate: new Date().toISOString().split('T')[0]
  });

  // Calculate lost days automatically
  useEffect(() => {
    if (formData.incapacityStartDate && formData.incapacityEndDate) {
      try {
        const start = parseISO(formData.incapacityStartDate);
        const end = parseISO(formData.incapacityEndDate);
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

  // Automatically compute day of week when date changes
  useEffect(() => {
    if (formData.date) {
      try {
        const d = parseISO(formData.date);
        const dayStr = format(d, 'EEEE', { locale: es });
        const capitalized = (dayStr.charAt(0).toUpperCase() + dayStr.slice(1)) as any;
        const validDays = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
        if (validDays.includes(capitalized)) {
          setFormData(prev => ({ ...prev, weekDay: capitalized }));
        }
      } catch (e) {}
    }
  }, [formData.date]);

  // Sync combined employeeName from individual surname and name if provided
  useEffect(() => {
    if (formData.firstName || formData.firstSurname) {
      const parts = [
        formData.firstSurname,
        formData.secondSurname,
        formData.firstName,
        formData.secondName
      ].filter(Boolean);
      if (parts.length > 0) {
        const fullName = parts.join(' ');
        setFormData(prev => ({ ...prev, employeeName: fullName }));
      }
    }
  }, [formData.firstName, formData.secondName, formData.firstSurname, formData.secondSurname]);

  useEffect(() => {
    if (editRecord) {
      const { id, ...data } = editRecord;
      setFormData(prev => ({
        ...prev,
        ...data,
        witnesses: data.witnesses || []
      }));
    }
  }, [editRecord]);

  const handleAddWitness = () => {
    const cur = formData.witnesses || [];
    setFormData(prev => ({
      ...prev,
      witnesses: [
        ...cur,
        { name: '', idType: 'CC', idNumber: '', position: '' }
      ]
    }));
  };

  const handleUpdateWitness = (index: number, field: string, val: string) => {
    const cur = [...(formData.witnesses || [])];
    if (cur[index]) {
      cur[index] = { ...cur[index], [field]: val };
      setFormData(prev => ({ ...prev, witnesses: cur }));
    }
  };

  const handleRemoveWitness = (index: number) => {
    const cur = (formData.witnesses || []).filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, witnesses: cur }));
  };

  const clearError = (field: string) => {
    if (formErrors[field]) {
      setFormErrors(prev => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const getTabHasError = (tabId: string) => {
    if (tabId === 'worker') {
      return !!(formErrors.firstSurname || formErrors.firstName || formErrors.idNumber || formErrors.position || formErrors.department);
    }
    if (tabId === 'accident') {
      return !!(formErrors.date || formErrors.time);
    }
    if (tabId === 'witnesses') {
      return !!formErrors.description;
    }
    if (tabId === 'responsible') {
      return !!(formErrors.reportResponsibleName || formErrors.reportResponsiblePosition || formErrors.reportResponsibleIdNumber);
    }
    return false;
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    let targetTab: 'general' | 'worker' | 'accident' | 'witnesses' | 'responsible' | null = null;

    if (formData.eventType === EventType.ACCIDENTE) {
      // 2. Trabajador
      if (!formData.firstSurname?.trim()) {
        errors.firstSurname = 'El primer apellido es obligatorio.';
        if (!targetTab) targetTab = 'worker';
      }
      if (!formData.firstName?.trim()) {
        errors.firstName = 'El primer nombre es obligatorio.';
        if (!targetTab) targetTab = 'worker';
      }
      if (!formData.idNumber?.trim()) {
        errors.idNumber = 'El número de documento es obligatorio.';
        if (!targetTab) targetTab = 'worker';
      }
      if (!formData.position?.trim() && !formData.habitualOccupation?.trim()) {
        errors.position = 'El cargo u ocupación es obligatorio.';
        if (!targetTab) targetTab = 'worker';
      }
      if (!formData.department?.trim()) {
        errors.department = 'El área o departamento es obligatorio.';
        if (!targetTab) targetTab = 'worker';
      }

      // 3. Accidente
      if (!formData.date?.trim()) {
        errors.date = 'La fecha del accidente es obligatoria.';
        if (!targetTab) targetTab = 'accident';
      }
      if (!formData.time?.trim()) {
        errors.time = 'La hora del accidente es obligatoria.';
        if (!targetTab) targetTab = 'accident';
      }

      // 4. Relato
      if (!formData.description?.trim()) {
        errors.description = 'La descripción detallada del hecho es obligatoria.';
        if (!targetTab) targetTab = 'witnesses';
      }

      // 5. Responsable
      if (!formData.reportResponsibleName?.trim()) {
        errors.reportResponsibleName = 'El nombre del responsable es obligatorio.';
        if (!targetTab) targetTab = 'responsible';
      }
      if (!formData.reportResponsiblePosition?.trim()) {
        errors.reportResponsiblePosition = 'El cargo del responsable es obligatorio.';
        if (!targetTab) targetTab = 'responsible';
      }
      if (!formData.reportResponsibleIdNumber?.trim()) {
        errors.reportResponsibleIdNumber = 'El documento del responsable es obligatorio.';
        if (!targetTab) targetTab = 'responsible';
      }
    } else if (formData.eventType === EventType.INCIDENTE) {
      if (!formData.date?.trim()) errors.date = 'La fecha del incidente es obligatoria.';
      if (!formData.department?.trim()) errors.department = 'El área o departamento es obligatorio.';
      if (!formData.employeeName?.trim()) errors.employeeName = 'El nombre del trabajador es obligatorio.';
      if (!formData.description?.trim()) errors.description = 'La descripción del incidente es obligatoria.';
    } else if (formData.eventType === EventType.AUSENTISMO) {
      if (!formData.department?.trim()) errors.department = 'El área o departamento es obligatorio.';
      if (!formData.employeeName?.trim()) errors.employeeName = 'El nombre del trabajador es obligatorio.';
      if (!formData.incapacityStartDate?.trim()) errors.incapacityStartDate = 'La fecha de inicio es obligatoria.';
      if (!formData.incapacityEndDate?.trim()) errors.incapacityEndDate = 'La fecha de fin es obligatoria.';
    }

    setFormErrors(errors);

    if (Object.keys(errors).length > 0) {
      if (targetTab) {
        setActiveSection(targetTab);
      }
      const sectionLabels: Record<string, string> = {
        worker: '2. Trabajador',
        accident: '3. Datos del Accidente',
        witnesses: '4. Relato y Testigos',
        responsible: '5. Responsable Informe',
        general: '1. Afiliación y Sede'
      };
      const sectionName = targetTab ? sectionLabels[targetTab] : '';
      setValidationSummary(
        `Faltan campos obligatorios por diligenciar${sectionName ? ` (Revisa: ${sectionName})` : ''}. Por favor verifique los campos marcados.`
      );
      return false;
    }

    setValidationSummary(null);
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setValidationSummary(null);

    // Consolidated employee name
    const computedName = (
      formData.employeeName?.trim() ||
      [formData.firstSurname, formData.secondSurname, formData.firstName, formData.secondName].filter(Boolean).join(' ')
    ).trim() || 'Trabajador';

    const payload: Omit<EventRecord, 'id'> = {
      ...formData,
      employeeName: computedName,
      time: formData.time || '08:00',
      position: formData.position || formData.habitualOccupation || 'Operario',
      department: formData.department || 'General',
      lostDays: Number(formData.lostDays) || 0,
      chargedDays: Number(formData.chargedDays) || 0,
      reportDate: formData.reportDate || new Date().toISOString().split('T')[0]
    };

    try {
      if (editRecord && onUpdate) {
        await onUpdate(editRecord.id, payload);
      } else {
        await onAdd(payload);
      }
      onClose();
    } catch (err: any) {
      console.error("Error al guardar registro:", err);
      const msg = err instanceof Error ? err.message : (err?.message || "Error al conectar con la base de datos");
      setValidationSummary("Error al guardar el registro: " + msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-3 sm:p-6 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-4xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh] border border-gray-100">
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-gray-100 flex justify-between items-center bg-gradient-to-r from-gray-50 via-white to-gray-50">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-2xl text-white shadow-md ${
              formData.eventType === EventType.ACCIDENTE ? 'bg-emerald-600 shadow-emerald-200' :
              formData.eventType === EventType.INCIDENTE ? 'bg-blue-600 shadow-blue-200' :
              'bg-amber-600 shadow-amber-200'
            }`}>
              {formData.eventType === EventType.ACCIDENTE ? <ShieldAlert size={22} /> :
               formData.eventType === EventType.INCIDENTE ? <AlertCircle size={22} /> :
               <Clock size={22} />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-extrabold text-gray-900">
                  {editRecord ? 'Editar Reporte de Evento' : 'Nuevo Reporte de Evento'}
                </h2>
                {formData.eventType === EventType.ACCIDENTE && (
                  <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                    Formato FURAT
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 font-medium">
                {formData.eventType === EventType.ACCIDENTE 
                  ? 'Formato Único de Reporte de Accidente de Trabajo (MinProtección / ARL)' 
                  : 'Sistema de Gestión de Seguridad y Salud en el Trabajo (SG-SST)'}
              </p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose} 
            className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-600"
          >
            <X size={20} />
          </button>
        </div>

        {/* Section Navigation Tabs (for Accidente) */}
        {formData.eventType === EventType.ACCIDENTE && (
          <div className="px-6 pt-3 pb-0 bg-gray-50/60 border-b border-gray-100 flex items-center gap-2 overflow-x-auto scrollbar-hide">
            {[
              { id: 'general', label: '1. Afiliación y Sede' },
              { id: 'worker', label: '2. Trabajador' },
              { id: 'accident', label: '3. Datos del Accidente' },
              { id: 'witnesses', label: '4. Relato y Testigos' },
              { id: 'responsible', label: '5. Responsable Informe' },
            ].map(tab => {
              const hasErr = getTabHasError(tab.id);
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveSection(tab.id as any)}
                  className={`px-4 py-2.5 rounded-t-xl text-xs font-bold whitespace-nowrap transition-all border-b-2 flex items-center gap-1.5 ${
                    activeSection === tab.id
                      ? 'border-emerald-600 text-emerald-700 bg-white shadow-sm'
                      : 'border-transparent text-gray-500 hover:text-gray-800 hover:bg-white/50'
                  }`}
                >
                  <span>{tab.label}</span>
                  {hasErr && (
                    <span className="w-2 h-2 rounded-full bg-red-500 ring-2 ring-white animate-pulse" title="Campos obligatorios pendientes en esta sección" />
                  )}
                </button>
              );
            })}
          </div>
        )}
        
        {/* Form Body */}
        <form noValidate onSubmit={handleSubmit} className="p-6 space-y-8 overflow-y-auto scrollbar-hide flex-1">
          
          {/* Validation Alert Banner */}
          {validationSummary && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3 text-red-800 animate-fadeIn">
              <AlertTriangle size={18} className="text-red-500 shrink-0 mt-0.5" />
              <div className="text-xs font-bold leading-relaxed">
                {validationSummary}
              </div>
            </div>
          )}
          
          {/* Section: Type Selection */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Activity size={14} className="text-gray-400" />
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Tipo de Evento SG-SST</span>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[
                { id: EventType.ACCIDENTE, label: 'Accidente de Trabajo', sub: 'Reporte FURAT oficial', icon: ShieldAlert, color: 'emerald' },
                { id: EventType.INCIDENTE, label: 'Incidente de Trabajo', sub: 'Casi accidente / Sin lesión', icon: AlertCircle, color: 'blue' },
                { id: EventType.AUSENTISMO, label: 'Ausentismo Laboral', sub: 'Incapacidad médica', icon: Clock, color: 'amber' },
              ].map((type) => (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => setFormData({ ...formData, eventType: type.id })}
                  className={`flex flex-col items-center text-center p-3.5 rounded-2xl border-2 transition-all ${
                    formData.eventType === type.id 
                      ? type.id === EventType.ACCIDENTE ? 'border-emerald-600 bg-emerald-50 text-emerald-800 shadow-sm' :
                        type.id === EventType.INCIDENTE ? 'border-blue-600 bg-blue-50 text-blue-800 shadow-sm' :
                        'border-amber-600 bg-amber-50 text-amber-800 shadow-sm'
                      : 'border-gray-100 hover:border-gray-200 text-gray-500 bg-gray-50/40'
                  }`}
                >
                  <type.icon size={22} className="mb-1.5" strokeWidth={formData.eventType === type.id ? 2.5 : 1.75} />
                  <span className="text-xs font-bold leading-tight">{type.label}</span>
                  <span className="text-[9px] text-gray-400 mt-0.5 font-medium">{type.sub}</span>
                </button>
              ))}
            </div>
          </div>

          {/* ========================================================================= */}
          {/* ACCIDENT - FURAT FORM SECTIONS */}
          {/* ========================================================================= */}
          {formData.eventType === EventType.ACCIDENTE && (
            <div className="space-y-8">

              {/* SECCIÓN 1: AFILIACIÓN Y CENTRO DE TRABAJO */}
              {(activeSection === 'general' || true) && (
                <div className={`space-y-6 ${activeSection !== 'general' ? 'hidden' : ''}`}>
                  <div className="bg-emerald-50/30 p-5 rounded-2xl border border-emerald-100 space-y-4">
                    <div className="flex items-center gap-2 border-b border-emerald-100 pb-3">
                      <Building size={18} className="text-emerald-650" />
                      <div>
                        <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider">
                          1. Entidades de Afiliación en Seguridad Social
                        </h3>
                        <p className="text-[10px] text-gray-500 font-medium">Información de cobertura médica, ARL y fondos de pensiones del accidentado.</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500">EPS a la que está afiliado</label>
                        <input
                          type="text"
                          placeholder="Ej: EPS Sanitas, Sura, Nueva EPS"
                          className="w-full p-2.5 text-xs border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                          value={formData.eps || ''}
                          onChange={e => setFormData({ ...formData, eps: e.target.value })}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Código EPS</label>
                        <input
                          type="text"
                          placeholder="Ej: EPS005"
                          className="w-full p-2.5 text-xs border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-mono"
                          value={formData.epsCode || ''}
                          onChange={e => setFormData({ ...formData, epsCode: e.target.value })}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500">ARL</label>
                        <input
                          type="text"
                          placeholder="Ej: Positiva, Sura, Seguros Bolívar"
                          className="w-full p-2.5 text-xs border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                          value={formData.arl || ''}
                          onChange={e => setFormData({ ...formData, arl: e.target.value })}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Código ARL</label>
                        <input
                          type="text"
                          placeholder="Ej: 14-23"
                          className="w-full p-2.5 text-xs border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-mono"
                          value={formData.arlCode || ''}
                          onChange={e => setFormData({ ...formData, arlCode: e.target.value })}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500">AFP (Fondo de Pensiones)</label>
                        <input
                          type="text"
                          placeholder="Ej: Porvenir, Protección, Colfondos"
                          className="w-full p-2.5 text-xs border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                          value={formData.afp || ''}
                          onChange={e => setFormData({ ...formData, afp: e.target.value })}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Código AFP</label>
                        <input
                          type="text"
                          placeholder="Ej: 230201"
                          className="w-full p-2.5 text-xs border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-mono"
                          value={formData.afpCode || ''}
                          onChange={e => setFormData({ ...formData, afpCode: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Centro de trabajo */}
                  <div className="bg-gray-50/50 p-5 rounded-2xl border border-gray-200 space-y-4">
                    <div className="flex items-center justify-between border-b border-gray-200 pb-3">
                      <div>
                        <h4 className="text-xs font-black text-gray-800 uppercase tracking-wider">Centro de Trabajo donde labora</h4>
                        <p className="text-[10px] text-gray-500">¿El accidente ocurrió en la sede principal o en un centro de trabajo distinto?</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <label className="flex items-center gap-1.5 text-xs font-bold text-gray-700 cursor-pointer">
                          <input
                            type="radio"
                            name="sameWorkCenter"
                            checked={formData.sameWorkCenter === true}
                            onChange={() => setFormData({ ...formData, sameWorkCenter: true })}
                            className="text-emerald-600 focus:ring-emerald-500"
                          />
                          Sede Principal
                        </label>
                        <label className="flex items-center gap-1.5 text-xs font-bold text-gray-700 cursor-pointer">
                          <input
                            type="radio"
                            name="sameWorkCenter"
                            checked={formData.sameWorkCenter === false}
                            onChange={() => setFormData({ ...formData, sameWorkCenter: false })}
                            className="text-emerald-600 focus:ring-emerald-500"
                          />
                          Otro Centro de Trabajo
                        </label>
                      </div>
                    </div>

                    {!formData.sameWorkCenter && (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Nombre Centro de Trabajo</label>
                          <input
                            type="text"
                            placeholder="Ej: Planta de Producción Norte"
                            className="w-full p-2.5 text-xs border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                            value={formData.workCenterName || ''}
                            onChange={e => setFormData({ ...formData, workCenterName: e.target.value })}
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Actividad Económica</label>
                          <input
                            type="text"
                            placeholder="Ej: Procesamiento de alimentos"
                            className="w-full p-2.5 text-xs border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                            value={formData.workCenterActivity || ''}
                            onChange={e => setFormData({ ...formData, workCenterActivity: e.target.value })}
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Dirección</label>
                          <input
                            type="text"
                            placeholder="Ej: Carrera 45 # 12-34"
                            className="w-full p-2.5 text-xs border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                            value={formData.workCenterAddress || ''}
                            onChange={e => setFormData({ ...formData, workCenterAddress: e.target.value })}
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Departamento</label>
                          <input
                            type="text"
                            placeholder="Ej: Cundinamarca"
                            className="w-full p-2.5 text-xs border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                            value={formData.workCenterDepartment || ''}
                            onChange={e => setFormData({ ...formData, workCenterDepartment: e.target.value })}
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Municipio</label>
                          <input
                            type="text"
                            placeholder="Ej: Bogotá D.C."
                            className="w-full p-2.5 text-xs border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                            value={formData.workCenterMunicipality || ''}
                            onChange={e => setFormData({ ...formData, workCenterMunicipality: e.target.value })}
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Zona</label>
                          <select
                            className="w-full p-2.5 text-xs border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none bg-white font-bold"
                            value={formData.workCenterZone || 'U'}
                            onChange={e => setFormData({ ...formData, workCenterZone: e.target.value as 'U' | 'R' })}
                          >
                            <option value="U">Urbana (U)</option>
                            <option value="R">Rural (R)</option>
                          </select>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => setActiveSection('worker')}
                      className="px-5 py-2.5 bg-emerald-600 text-white text-xs font-bold rounded-xl hover:bg-emerald-700 shadow-md shadow-emerald-200"
                    >
                      Siguiente: Datos del Trabajador →
                    </button>
                  </div>
                </div>
              )}

              {/* SECCIÓN 2: INFORMACIÓN DEL TRABAJADOR */}
              {(activeSection === 'worker' || true) && (
                <div className={`space-y-6 ${activeSection !== 'worker' ? 'hidden' : ''}`}>
                  <div className="bg-white p-5 rounded-2xl border border-gray-200 space-y-4">
                    <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
                      <User size={18} className="text-emerald-600" />
                      <div>
                        <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider">
                          2. Información de la Persona que se Accidentó
                        </h3>
                        <p className="text-[10px] text-gray-500 font-medium">Datos sociodemográficos y contractuales según el anexo FURAT.</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Primer Apellido *</label>
                        <input
                          type="text"
                          placeholder="Ej: Gómez"
                          className={`w-full p-2.5 text-xs border rounded-xl outline-none ${
                            formErrors.firstSurname ? 'border-red-400 bg-red-50/20 focus:ring-2 focus:ring-red-400' : 'border-gray-200 focus:ring-2 focus:ring-emerald-500'
                          }`}
                          value={formData.firstSurname || ''}
                          onChange={e => {
                            clearError('firstSurname');
                            setFormData({ ...formData, firstSurname: e.target.value });
                          }}
                        />
                        {formErrors.firstSurname && (
                          <p className="text-[10px] text-red-600 font-bold">{formErrors.firstSurname}</p>
                        )}
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Segundo Apellido</label>
                        <input
                          type="text"
                          placeholder="Ej: Rodríguez"
                          className="w-full p-2.5 text-xs border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                          value={formData.secondSurname || ''}
                          onChange={e => setFormData({ ...formData, secondSurname: e.target.value })}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Primer Nombre *</label>
                        <input
                          type="text"
                          placeholder="Ej: Carlos"
                          className={`w-full p-2.5 text-xs border rounded-xl outline-none ${
                            formErrors.firstName ? 'border-red-400 bg-red-50/20 focus:ring-2 focus:ring-red-400' : 'border-gray-200 focus:ring-2 focus:ring-emerald-500'
                          }`}
                          value={formData.firstName || ''}
                          onChange={e => {
                            clearError('firstName');
                            setFormData({ ...formData, firstName: e.target.value });
                          }}
                        />
                        {formErrors.firstName && (
                          <p className="text-[10px] text-red-600 font-bold">{formErrors.firstName}</p>
                        )}
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Segundo Nombre</label>
                        <input
                          type="text"
                          placeholder="Ej: Alberto"
                          className="w-full p-2.5 text-xs border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                          value={formData.secondName || ''}
                          onChange={e => setFormData({ ...formData, secondName: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Tipo de Documento *</label>
                        <select
                          className="w-full p-2.5 text-xs border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none bg-white font-bold"
                          value={formData.idType || 'CC'}
                          onChange={e => setFormData({ ...formData, idType: e.target.value as any })}
                        >
                          <option value="CC">Cédula de Ciudadanía (CC)</option>
                          <option value="CE">Cédula de Extranjería (CE)</option>
                          <option value="TI">Tarjeta de Identidad (TI)</option>
                          <option value="PA">Pasaporte (PA)</option>
                          <option value="PEP">Permiso Especial Permanencia (PEP)</option>
                          <option value="PPT">Permiso Protección Temporal (PPT)</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Número de Documento *</label>
                        <input
                          type="text"
                          placeholder="Ej: 1020304050"
                          className={`w-full p-2.5 text-xs border rounded-xl outline-none font-mono ${
                            formErrors.idNumber ? 'border-red-400 bg-red-50/20 focus:ring-2 focus:ring-red-400' : 'border-gray-200 focus:ring-2 focus:ring-emerald-500'
                          }`}
                          value={formData.idNumber || ''}
                          onChange={e => {
                            clearError('idNumber');
                            setFormData({ ...formData, idNumber: e.target.value });
                          }}
                        />
                        {formErrors.idNumber && (
                          <p className="text-[10px] text-red-600 font-bold">{formErrors.idNumber}</p>
                        )}
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Fecha de Nacimiento</label>
                        <input
                          type="date"
                          className="w-full p-2.5 text-xs border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                          value={formData.birthDate || ''}
                          onChange={e => setFormData({ ...formData, birthDate: e.target.value })}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Género</label>
                        <select
                          className="w-full p-2.5 text-xs border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none bg-white font-bold"
                          value={formData.gender || 'M'}
                          onChange={e => setFormData({ ...formData, gender: e.target.value as 'M' | 'F' })}
                        >
                          <option value="M">Masculino (M)</option>
                          <option value="F">Femenino (F)</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Dirección Residencia</label>
                        <input
                          type="text"
                          placeholder="Ej: Calle 10 # 20-30"
                          className="w-full p-2.5 text-xs border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                          value={formData.employeeAddress || ''}
                          onChange={e => setFormData({ ...formData, employeeAddress: e.target.value })}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Teléfono</label>
                        <input
                          type="text"
                          placeholder="Ej: 3001234567"
                          className="w-full p-2.5 text-xs border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                          value={formData.employeePhone || ''}
                          onChange={e => setFormData({ ...formData, employeePhone: e.target.value })}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Departamento Residencia</label>
                        <input
                          type="text"
                          placeholder="Ej: Cundinamarca"
                          className="w-full p-2.5 text-xs border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                          value={formData.employeeDepartment || ''}
                          onChange={e => setFormData({ ...formData, employeeDepartment: e.target.value })}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Municipio Residencia</label>
                        <input
                          type="text"
                          placeholder="Ej: Soacha"
                          className="w-full p-2.5 text-xs border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                          value={formData.employeeMunicipality || ''}
                          onChange={e => setFormData({ ...formData, employeeMunicipality: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-2 border-t border-gray-100">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Cargo / Ocupación Habitual *</label>
                        <input
                          type="text"
                          placeholder="Ej: Operario de Máquina"
                          className={`w-full p-2.5 text-xs border rounded-xl outline-none ${
                            formErrors.position ? 'border-red-400 bg-red-50/20 focus:ring-2 focus:ring-red-400' : 'border-gray-200 focus:ring-2 focus:ring-emerald-500'
                          }`}
                          value={formData.position || formData.habitualOccupation || ''}
                          onChange={e => {
                            clearError('position');
                            setFormData({ ...formData, position: e.target.value, habitualOccupation: e.target.value });
                          }}
                        />
                        {formErrors.position && (
                          <p className="text-[10px] text-red-600 font-bold">{formErrors.position}</p>
                        )}
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Código Ocupación (CNO)</label>
                        <input
                          type="text"
                          placeholder="Ej: 8322"
                          className="w-full p-2.5 text-xs border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-mono"
                          value={formData.occupationCode || ''}
                          onChange={e => setFormData({ ...formData, occupationCode: e.target.value })}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Área / Departamento *</label>
                        <input
                          type="text"
                          placeholder="Ej: Producción, Logística"
                          className={`w-full p-2.5 text-xs border rounded-xl outline-none ${
                            formErrors.department ? 'border-red-400 bg-red-50/20 focus:ring-2 focus:ring-red-400' : 'border-gray-200 focus:ring-2 focus:ring-emerald-500'
                          }`}
                          value={formData.department || ''}
                          onChange={e => {
                            clearError('department');
                            setFormData({ ...formData, department: e.target.value });
                          }}
                        />
                        {formErrors.department && (
                          <p className="text-[10px] text-red-600 font-bold">{formErrors.department}</p>
                        )}
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Fecha Ingreso a Empresa</label>
                        <input
                          type="date"
                          className="w-full p-2.5 text-xs border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                          value={formData.hireDate || ''}
                          onChange={e => setFormData({ ...formData, hireDate: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Tipo de Vinculación</label>
                        <select
                          className="w-full p-2.5 text-xs border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none bg-white font-bold"
                          value={formData.employmentType || 'Planta'}
                          onChange={e => setFormData({ ...formData, employmentType: e.target.value })}
                        >
                          <option value="Planta">Planta / Contrato Directo</option>
                          <option value="Misión">Misión / Temporal</option>
                          <option value="Cooperado">Cooperado</option>
                          <option value="Estudiante">Estudiante o Aprendiz</option>
                          <option value="Independiente">Independiente / Prestación de Servicios</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Salario Mensual (COP)</label>
                        <input
                          type="text"
                          placeholder="Ej: 1423500"
                          className="w-full p-2.5 text-xs border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                          value={formData.monthlySalary || ''}
                          onChange={e => setFormData({ ...formData, monthlySalary: e.target.value })}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Jornada Habitual</label>
                        <select
                          className="w-full p-2.5 text-xs border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none bg-white font-bold"
                          value={formData.workdaySchedule || 'Diurna'}
                          onChange={e => setFormData({ ...formData, workdaySchedule: e.target.value as any })}
                        >
                          <option value="Diurna">Diurna</option>
                          <option value="Nocturna">Nocturna</option>
                          <option value="Mixta">Mixta</option>
                          <option value="Por turnos">Por turnos</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between">
                    <button
                      type="button"
                      onClick={() => setActiveSection('general')}
                      className="px-4 py-2 text-xs font-bold text-gray-500 hover:text-gray-800"
                    >
                      ← Anterior: Afiliación
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveSection('accident')}
                      className="px-5 py-2.5 bg-emerald-600 text-white text-xs font-bold rounded-xl hover:bg-emerald-700 shadow-md shadow-emerald-200"
                    >
                      Siguiente: Datos del Accidente →
                    </button>
                  </div>
                </div>
              )}

              {/* SECCIÓN 3: INFORMACIÓN DEL ACCIDENTE */}
              {(activeSection === 'accident' || true) && (
                <div className={`space-y-6 ${activeSection !== 'accident' ? 'hidden' : ''}`}>
                  <div className="bg-white p-5 rounded-2xl border border-gray-200 space-y-5">
                    <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
                      <CalendarIcon size={18} className="text-emerald-600" />
                      <div>
                        <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider">
                          3. Información Específica del Accidente
                        </h3>
                        <p className="text-[10px] text-gray-500 font-medium">Circunstancias de tiempo, modo, lugar y factores técnicos (anexo FURAT).</p>
                      </div>
                    </div>

                    {/* Fecha, hora, día semana y jornada */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Fecha del Accidente *</label>
                        <input
                          type="date"
                          className={`w-full p-2.5 text-xs border rounded-xl outline-none font-bold text-gray-700 ${
                            formErrors.date ? 'border-red-400 bg-red-50/20 focus:ring-2 focus:ring-red-400' : 'border-gray-200 focus:ring-2 focus:ring-emerald-500'
                          }`}
                          value={formData.date}
                          onChange={e => {
                            clearError('date');
                            setFormData({ ...formData, date: e.target.value });
                          }}
                        />
                        {formErrors.date && (
                          <p className="text-[10px] text-red-600 font-bold">{formErrors.date}</p>
                        )}
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Hora del Accidente (HH:MM) *</label>
                        <input
                          type="time"
                          className={`w-full p-2.5 text-xs border rounded-xl outline-none font-bold text-gray-700 ${
                            formErrors.time ? 'border-red-400 bg-red-50/20 focus:ring-2 focus:ring-red-400' : 'border-gray-200 focus:ring-2 focus:ring-emerald-500'
                          }`}
                          value={formData.time || ''}
                          onChange={e => {
                            clearError('time');
                            setFormData({ ...formData, time: e.target.value });
                          }}
                        />
                        {formErrors.time && (
                          <p className="text-[10px] text-red-600 font-bold">{formErrors.time}</p>
                        )}
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Día de la Semana</label>
                        <select
                          className="w-full p-2.5 text-xs border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none bg-white font-bold"
                          value={formData.weekDay || 'Lunes'}
                          onChange={e => setFormData({ ...formData, weekDay: e.target.value as any })}
                        >
                          {['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'].map(d => (
                            <option key={d} value={d}>{d}</option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Jornada en que Sucede</label>
                        <select
                          className="w-full p-2.5 text-xs border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none bg-white font-bold"
                          value={formData.workdayType || 'Normal'}
                          onChange={e => setFormData({ ...formData, workdayType: e.target.value })}
                        >
                          <option value="Normal">Normal</option>
                          <option value="Extra">Extra</option>
                        </select>
                      </div>
                    </div>

                    {/* Labor habitual y tiempo laborado previo */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-gray-50/60 rounded-xl border border-gray-150">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500">¿Realizaba su labor habitual?</label>
                        <div className="flex items-center gap-4 pt-1">
                          <label className="flex items-center gap-1.5 text-xs font-bold text-gray-700 cursor-pointer">
                            <input
                              type="radio"
                              name="doingHabitualWork"
                              checked={formData.doingHabitualWork === true}
                              onChange={() => setFormData({ ...formData, doingHabitualWork: true, nonHabitualWorkDetail: '' })}
                              className="text-emerald-600 focus:ring-emerald-500"
                            />
                            Sí
                          </label>
                          <label className="flex items-center gap-1.5 text-xs font-bold text-gray-700 cursor-pointer">
                            <input
                              type="radio"
                              name="doingHabitualWork"
                              checked={formData.doingHabitualWork === false}
                              onChange={() => setFormData({ ...formData, doingHabitualWork: false })}
                              className="text-emerald-600 focus:ring-emerald-500"
                            />
                            No
                          </label>
                        </div>
                      </div>

                      {!formData.doingHabitualWork && (
                        <div className="space-y-1 sm:col-span-2">
                          <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500">¿Cuál labor realizaba?</label>
                          <input
                            type="text"
                            placeholder="Describa la labor no habitual que ejecutaba..."
                            className="w-full p-2 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                            value={formData.nonHabitualWorkDetail || ''}
                            onChange={e => setFormData({ ...formData, nonHabitualWorkDetail: e.target.value })}
                          />
                        </div>
                      )}

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Tiempo laborado previo al accidente</label>
                        <input
                          type="text"
                          placeholder="Ej: 04 horas 30 min"
                          className="w-full p-2 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                          value={formData.workedTimeBeforeAccident || ''}
                          onChange={e => setFormData({ ...formData, workedTimeBeforeAccident: e.target.value })}
                        />
                      </div>
                    </div>

                    {/* Clasificación de Accidente, Severidad e Incapacidad */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Tipo de Evento Accidental</label>
                        <select
                          className="w-full p-2.5 text-xs border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none bg-white font-bold"
                          value={formData.accidentCircumstance || 'Propios del trabajo'}
                          onChange={e => setFormData({ ...formData, accidentCircumstance: e.target.value as any })}
                        >
                          <option value="Propios del trabajo">Propios del trabajo</option>
                          <option value="Violencia">Violencia</option>
                          <option value="Tránsito">Tránsito</option>
                          <option value="Deportivo">Deportivo</option>
                          <option value="Recreativo o cultural">Recreativo o cultural</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Severidad Inicial</label>
                        <select
                          className={`w-full p-2.5 text-xs border rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none bg-white font-black ${
                            formData.accidentType === AccidentType.MORTAL ? 'text-red-700 border-red-200 bg-red-50/50' :
                            formData.accidentType === AccidentType.INCAPACITANTE ? 'text-amber-700 border-amber-200 bg-amber-50/50' :
                            'text-emerald-700 border-emerald-200 bg-emerald-50/50'
                          }`}
                          value={formData.accidentType || AccidentType.INCAPACITANTE}
                          onChange={e => setFormData({ ...formData, accidentType: e.target.value as AccidentType })}
                        >
                          <option value={AccidentType.INCAPACITANTE}>⚠️ Incapacitante (Genera días perdidos)</option>
                          <option value={AccidentType.NO_INCAPACITANTE}>🟢 No Incapacitante (Atención sin reposo)</option>
                          <option value={AccidentType.MORTAL}>🔴 Mortal (Accidente con fatalidad)</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500">¿Causó la muerte del trabajador?</label>
                        <select
                          className="w-full p-2.5 text-xs border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none bg-white font-bold"
                          value={formData.causedDeath ? 'SI' : 'NO'}
                          onChange={e => {
                            const isDeath = e.target.value === 'SI';
                            setFormData({ 
                              ...formData, 
                              causedDeath: isDeath, 
                              accidentType: isDeath ? AccidentType.MORTAL : formData.accidentType 
                            });
                          }}
                        >
                          <option value="NO">No</option>
                          <option value="SI">Sí (Fatalidad)</option>
                        </select>
                      </div>
                    </div>

                    {/* Días de incapacidad si es incapacitante */}
                    {formData.accidentType === AccidentType.INCAPACITANTE && (
                      <div className="p-4 bg-amber-50/40 rounded-2xl border border-amber-200/80 space-y-3">
                        <div className="flex items-center gap-2">
                          <Clock size={16} className="text-amber-600" />
                          <span className="text-xs font-black text-amber-800 uppercase tracking-wider">
                            Período de Incapacidad Médica Inicial
                          </span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Fecha Inicio Incapacidad</label>
                            <input
                              type="date"
                              className="w-full p-2.5 text-xs border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none font-bold"
                              value={formData.incapacityStartDate || ''}
                              onChange={e => setFormData({ ...formData, incapacityStartDate: e.target.value })}
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Fecha Fin Incapacidad</label>
                            <input
                              type="date"
                              className="w-full p-2.5 text-xs border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none font-bold"
                              value={formData.incapacityEndDate || ''}
                              onChange={e => setFormData({ ...formData, incapacityEndDate: e.target.value })}
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Días Totales Calculados</label>
                            <div className="w-full p-2.5 text-sm font-black bg-white border border-amber-200 text-amber-800 rounded-xl text-center">
                              {formData.lostDays} días
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Lugar y Sitio del accidente */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Lugar donde ocurrió</label>
                        <select
                          className="w-full p-2.5 text-xs border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none bg-white font-bold"
                          value={formData.accidentLocationType || 'Dentro de la empresa'}
                          onChange={e => setFormData({ ...formData, accidentLocationType: e.target.value as any })}
                        >
                          <option value="Dentro de la empresa">Dentro de la empresa</option>
                          <option value="Fuera de la empresa">Fuera de la empresa</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Sitio Exacto del Accidente</label>
                        <select
                          className="w-full p-2.5 text-xs border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none bg-white font-bold"
                          value={formData.location || ''}
                          onChange={e => setFormData({ ...formData, location: e.target.value })}
                        >
                          <option value="">Seleccione el sitio...</option>
                          {FORM_OPTIONS.locations.map(loc => (
                            <option key={loc} value={loc}>{loc}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Agente del accidente */}
                    <div className="pt-2">
                      <MultiSelect 
                        label="Agente del Accidente (¿Con qué elemento, máquina o sustancia se lesionó?)"
                        options={FORM_OPTIONS.accidentAgents}
                        selected={formData.accidentAgent || []}
                        onChange={val => setFormData({ ...formData, accidentAgent: val })}
                      />
                    </div>

                    {/* Mecanismo o forma */}
                    <div className="pt-2">
                      <MultiSelect 
                        label="Mecanismo o Forma del Accidente"
                        options={FORM_OPTIONS.mechanisms}
                        selected={formData.mechanism || []}
                        onChange={val => setFormData({ ...formData, mechanism: val })}
                        showOther
                        otherValue={formData.mechanismOther}
                        onOtherChange={val => setFormData({ ...formData, mechanismOther: val })}
                      />
                    </div>

                    {/* Tipo de Lesión */}
                    <div className="pt-2">
                      <MultiSelect 
                        label="Tipo de Lesión Sufrida (Resolución 1401 / FURAT)"
                        options={FORM_OPTIONS.injuryTypes}
                        selected={formData.injuryType || []}
                        onChange={val => setFormData({ ...formData, injuryType: val })}
                        showOther
                        otherValue={formData.injuryTypeOther}
                        onOtherChange={val => setFormData({ ...formData, injuryTypeOther: val })}
                      />
                    </div>

                    {/* Parte del cuerpo afectada */}
                    <div className="pt-2">
                      <MultiSelect 
                        label="Parte del Cuerpo Afectada"
                        options={FORM_OPTIONS.bodyParts}
                        selected={formData.bodyPart || []}
                        onChange={val => setFormData({ ...formData, bodyPart: val })}
                      />
                    </div>
                  </div>

                  <div className="flex justify-between">
                    <button
                      type="button"
                      onClick={() => setActiveSection('worker')}
                      className="px-4 py-2 text-xs font-bold text-gray-500 hover:text-gray-800"
                    >
                      ← Anterior: Trabajador
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveSection('witnesses')}
                      className="px-5 py-2.5 bg-emerald-600 text-white text-xs font-bold rounded-xl hover:bg-emerald-700 shadow-md shadow-emerald-200"
                    >
                      Siguiente: Relato y Testigos →
                    </button>
                  </div>
                </div>
              )}

              {/* SECCIÓN 4: RELATO Y TESTIGOS */}
              {(activeSection === 'witnesses' || true) && (
                <div className={`space-y-6 ${activeSection !== 'witnesses' ? 'hidden' : ''}`}>
                  <div className="bg-white p-5 rounded-2xl border border-gray-200 space-y-4">
                    <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
                      <FileText size={18} className="text-emerald-600" />
                      <div>
                        <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider">
                          4. Descripción del Accidente y Testigos Presenciales
                        </h3>
                        <p className="text-[10px] text-gray-500 font-medium">Relato fáctico de los hechos y personas que observaron el evento.</p>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                        Descripción Detallada del Hecho (Qué lo originó o causó y aspectos fácticos) *
                      </label>
                      <textarea
                        rows={4}
                        placeholder="Describa detalladamente el accidente: lugar exacto, actividad que ejecutaba, cómo se produjo, herramientas involucradas y consecuencias inmediatas..."
                        className={`w-full p-3.5 border rounded-xl outline-none text-xs leading-relaxed ${
                          formErrors.description ? 'border-red-400 bg-red-50/20 focus:ring-2 focus:ring-red-400' : 'border-gray-200 focus:ring-2 focus:ring-emerald-500'
                        }`}
                        value={formData.description}
                        onChange={e => {
                          clearError('description');
                          setFormData({ ...formData, description: e.target.value });
                        }}
                      />
                      {formErrors.description && (
                        <p className="text-[10px] text-red-600 font-bold">{formErrors.description}</p>
                      )}
                    </div>

                    {/* Testigos */}
                    <div className="p-4 bg-gray-50/70 rounded-2xl border border-gray-200/80 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-xs font-black text-gray-800 uppercase tracking-wider">Personas que presenciaron el accidente</h4>
                          <p className="text-[10px] text-gray-400">¿Hubo personas que presenciaron el accidente?</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <label className="flex items-center gap-1.5 text-xs font-bold text-gray-700 cursor-pointer">
                            <input
                              type="radio"
                              name="hasWitnesses"
                              checked={formData.hasWitnesses === true}
                              onChange={() => {
                                setFormData(prev => ({ 
                                  ...prev, 
                                  hasWitnesses: true,
                                  witnesses: prev.witnesses && prev.witnesses.length > 0 ? prev.witnesses : [{ name: '', idType: 'CC', idNumber: '', position: '' }]
                                }));
                              }}
                              className="text-emerald-600 focus:ring-emerald-500"
                            />
                            Sí hubo testigos
                          </label>
                          <label className="flex items-center gap-1.5 text-xs font-bold text-gray-700 cursor-pointer">
                            <input
                              type="radio"
                              name="hasWitnesses"
                              checked={formData.hasWitnesses === false}
                              onChange={() => setFormData({ ...formData, hasWitnesses: false, witnesses: [] })}
                              className="text-emerald-600 focus:ring-emerald-500"
                            />
                            No hubo testigos
                          </label>
                        </div>
                      </div>

                      {formData.hasWitnesses && (
                        <div className="space-y-3 pt-2">
                          {(formData.witnesses || []).map((witness, idx) => (
                            <div key={idx} className="p-3 bg-white border border-gray-200 rounded-xl space-y-2 relative">
                              <div className="flex items-center justify-between border-b border-gray-100 pb-1.5">
                                <span className="text-[10px] font-black text-emerald-600 uppercase">Testigo #{idx + 1}</span>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveWitness(idx)}
                                  className="text-gray-400 hover:text-red-600 text-xs font-bold"
                                >
                                  Eliminar
                                </button>
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                                <input
                                  type="text"
                                  placeholder="Nombre y apellidos completos *"
                                  className="p-2 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                                  value={witness.name}
                                  onChange={e => handleUpdateWitness(idx, 'name', e.target.value)}
                                />
                                <select
                                  className="p-2 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none bg-white font-bold"
                                  value={witness.idType}
                                  onChange={e => handleUpdateWitness(idx, 'idType', e.target.value)}
                                >
                                  <option value="CC">CC</option>
                                  <option value="CE">CE</option>
                                  <option value="TI">TI</option>
                                  <option value="PA">PA</option>
                                </select>
                                <input
                                  type="text"
                                  placeholder="No. Identificación *"
                                  className="p-2 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none font-mono"
                                  value={witness.idNumber}
                                  onChange={e => handleUpdateWitness(idx, 'idNumber', e.target.value)}
                                />
                                <input
                                  type="text"
                                  placeholder="Cargo que desempeña *"
                                  className="p-2 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                                  value={witness.position}
                                  onChange={e => handleUpdateWitness(idx, 'position', e.target.value)}
                                />
                              </div>
                            </div>
                          ))}

                          <button
                            type="button"
                            onClick={handleAddWitness}
                            className="px-3 py-1.5 text-xs font-bold text-emerald-600 bg-white border border-emerald-200 hover:bg-emerald-50 rounded-xl transition-colors flex items-center gap-1.5"
                          >
                            <Plus size={14} /> Añadir otro testigo
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-between">
                    <button
                      type="button"
                      onClick={() => setActiveSection('accident')}
                      className="px-4 py-2 text-xs font-bold text-gray-500 hover:text-gray-800"
                    >
                      ← Anterior: Datos del Accidente
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveSection('responsible')}
                      className="px-5 py-2.5 bg-emerald-600 text-white text-xs font-bold rounded-xl hover:bg-emerald-700 shadow-md shadow-emerald-200"
                    >
                      Siguiente: Responsable del Informe →
                    </button>
                  </div>
                </div>
              )}

              {/* SECCIÓN 5: RESPONSABLE DEL INFORME */}
              {(activeSection === 'responsible' || true) && (
                <div className={`space-y-6 ${activeSection !== 'responsible' ? 'hidden' : ''}`}>
                  <div className="bg-white p-5 rounded-2xl border border-gray-200 space-y-4">
                    <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
                      <User size={18} className="text-emerald-600" />
                      <div>
                        <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider">
                          5. Persona Responsable del Informe de Accidente
                        </h3>
                        <p className="text-[10px] text-gray-500 font-medium">Quien diligencia y suscribe el reporte inicial de trabajo.</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Nombre Completo *</label>
                        <input
                          type="text"
                          placeholder="Ej: Laura Martínez"
                          className={`w-full p-2.5 text-xs border rounded-xl outline-none ${
                            formErrors.reportResponsibleName ? 'border-red-400 bg-red-50/20 focus:ring-2 focus:ring-red-400' : 'border-gray-200 focus:ring-2 focus:ring-emerald-500'
                          }`}
                          value={formData.reportResponsibleName || ''}
                          onChange={e => {
                            clearError('reportResponsibleName');
                            setFormData({ ...formData, reportResponsibleName: e.target.value });
                          }}
                        />
                        {formErrors.reportResponsibleName && (
                          <p className="text-[10px] text-red-600 font-bold">{formErrors.reportResponsibleName}</p>
                        )}
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Cargo *</label>
                        <input
                          type="text"
                          placeholder="Ej: Coordinadora SST"
                          className={`w-full p-2.5 text-xs border rounded-xl outline-none ${
                            formErrors.reportResponsiblePosition ? 'border-red-400 bg-red-50/20 focus:ring-2 focus:ring-red-400' : 'border-gray-200 focus:ring-2 focus:ring-emerald-500'
                          }`}
                          value={formData.reportResponsiblePosition || ''}
                          onChange={e => {
                            clearError('reportResponsiblePosition');
                            setFormData({ ...formData, reportResponsiblePosition: e.target.value });
                          }}
                        />
                        {formErrors.reportResponsiblePosition && (
                          <p className="text-[10px] text-red-600 font-bold">{formErrors.reportResponsiblePosition}</p>
                        )}
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500">No. Documento *</label>
                        <input
                          type="text"
                          placeholder="Ej: 52145896"
                          className={`w-full p-2.5 text-xs border rounded-xl outline-none font-mono ${
                            formErrors.reportResponsibleIdNumber ? 'border-red-400 bg-red-50/20 focus:ring-2 focus:ring-red-400' : 'border-gray-200 focus:ring-2 focus:ring-emerald-500'
                          }`}
                          value={formData.reportResponsibleIdNumber || ''}
                          onChange={e => {
                            clearError('reportResponsibleIdNumber');
                            setFormData({ ...formData, reportResponsibleIdNumber: e.target.value });
                          }}
                        />
                        {formErrors.reportResponsibleIdNumber && (
                          <p className="text-[10px] text-red-600 font-bold">{formErrors.reportResponsibleIdNumber}</p>
                        )}
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Fecha del Reporte</label>
                        <input
                          type="date"
                          className="w-full p-2.5 text-xs border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-bold"
                          value={formData.reportDate || ''}
                          onChange={e => setFormData({ ...formData, reportDate: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100 flex items-start gap-3">
                    <AlertCircle size={20} className="text-blue-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-black text-blue-900 uppercase">Aviso de Separación de Fases (Res. 1401/2007)</h4>
                      <p className="text-[11px] text-blue-700 mt-0.5 leading-relaxed">
                        Este formulario corresponde exclusivamente a la etapa de <strong>Reporte de Evento (FURAT)</strong>. El <strong>Árbol de Causas</strong>, las causas inmediatas, causas básicas, plan de acción y las firmas del equipo investigador se gestionarán en el nuevo <strong>Módulo de Investigación de Accidentes</strong>.
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-between">
                    <button
                      type="button"
                      onClick={() => setActiveSection('witnesses')}
                      className="px-4 py-2 text-xs font-bold text-gray-500 hover:text-gray-800"
                    >
                      ← Anterior: Relato y Testigos
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* INCIDENTE FORM */}
          {/* ========================================================================= */}
          {formData.eventType === EventType.INCIDENTE && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Fecha del Incidente *</label>
                  <input
                    type="date"
                    className={`w-full p-2.5 text-xs border rounded-xl outline-none font-bold ${
                      formErrors.date ? 'border-red-400 bg-red-50/20 focus:ring-2 focus:ring-red-400' : 'border-gray-200 focus:ring-2 focus:ring-blue-500'
                    }`}
                    value={formData.date}
                    onChange={e => {
                      clearError('date');
                      setFormData({ ...formData, date: e.target.value });
                    }}
                  />
                  {formErrors.date && (
                    <p className="text-[10px] text-red-600 font-bold">{formErrors.date}</p>
                  )}
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Hora</label>
                  <input
                    type="time"
                    className="w-full p-2.5 text-xs border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                    value={formData.time || ''}
                    onChange={e => setFormData({ ...formData, time: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Área / Departamento *</label>
                  <input
                    type="text"
                    placeholder="Ej: Mantenimiento, Bodega"
                    className={`w-full p-2.5 text-xs border rounded-xl outline-none ${
                      formErrors.department ? 'border-red-400 bg-red-50/20 focus:ring-2 focus:ring-red-400' : 'border-gray-200 focus:ring-2 focus:ring-blue-500'
                    }`}
                    value={formData.department}
                    onChange={e => {
                      clearError('department');
                      setFormData({ ...formData, department: e.target.value });
                    }}
                  />
                  {formErrors.department && (
                    <p className="text-[10px] text-red-600 font-bold">{formErrors.department}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Trabajador Involucrado o Reportante *</label>
                  <input
                    type="text"
                    placeholder="Nombre completo"
                    className={`w-full p-2.5 text-xs border rounded-xl outline-none ${
                      formErrors.employeeName ? 'border-red-400 bg-red-50/20 focus:ring-2 focus:ring-red-400' : 'border-gray-200 focus:ring-2 focus:ring-blue-500'
                    }`}
                    value={formData.employeeName}
                    onChange={e => {
                      clearError('employeeName');
                      setFormData({ ...formData, employeeName: e.target.value });
                    }}
                  />
                  {formErrors.employeeName && (
                    <p className="text-[10px] text-red-600 font-bold">{formErrors.employeeName}</p>
                  )}
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Cargo</label>
                  <input
                    type="text"
                    placeholder="Ej: Operario"
                    className="w-full p-2.5 text-xs border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                    value={formData.position || ''}
                    onChange={e => setFormData({ ...formData, position: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Descripción del Incidente (Casi Accidente) *</label>
                <textarea
                  rows={4}
                  placeholder="Describa el incidente, condición insegura o situación de riesgo ocurrida sin generar lesión corporal..."
                  className={`w-full p-3.5 border rounded-xl outline-none text-xs leading-relaxed ${
                    formErrors.description ? 'border-red-400 bg-red-50/20 focus:ring-2 focus:ring-red-400' : 'border-gray-200 focus:ring-2 focus:ring-blue-500'
                  }`}
                  value={formData.description}
                  onChange={e => {
                    clearError('description');
                    setFormData({ ...formData, description: e.target.value });
                  }}
                />
                {formErrors.description && (
                  <p className="text-[10px] text-red-600 font-bold">{formErrors.description}</p>
                )}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* AUSENTISMO FORM */}
          {/* ========================================================================= */}
          {formData.eventType === EventType.AUSENTISMO && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Origen de la Incapacidad</label>
                  <select
                    className="w-full p-2.5 text-xs border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none bg-white font-bold"
                    value={formData.origin || OriginType.COMUN}
                    onChange={e => setFormData({ ...formData, origin: e.target.value as OriginType })}
                  >
                    <option value={OriginType.COMUN}>Enfermedad Común</option>
                    <option value={OriginType.LABORAL}>Enfermedad Laboral</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Tipo de Caso</label>
                  <select
                    className="w-full p-2.5 text-xs border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none bg-white font-bold"
                    value={formData.isNewCase ? 'new' : 'prorogued'}
                    onChange={e => setFormData({ ...formData, isNewCase: e.target.value === 'new' })}
                  >
                    <option value="new">Caso Nuevo</option>
                    <option value="prorogued">Prórroga / Caso Antiguo</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Área / Departamento *</label>
                  <input
                    type="text"
                    placeholder="Ej: Administrativa, Ventas"
                    className={`w-full p-2.5 text-xs border rounded-xl outline-none ${
                      formErrors.department ? 'border-red-400 bg-red-50/20 focus:ring-2 focus:ring-red-400' : 'border-gray-200 focus:ring-2 focus:ring-amber-500'
                    }`}
                    value={formData.department}
                    onChange={e => {
                      clearError('department');
                      setFormData({ ...formData, department: e.target.value });
                    }}
                  />
                  {formErrors.department && (
                    <p className="text-[10px] text-red-600 font-bold">{formErrors.department}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Nombre del Trabajador *</label>
                  <input
                    type="text"
                    placeholder="Nombre completo"
                    className={`w-full p-2.5 text-xs border rounded-xl outline-none ${
                      formErrors.employeeName ? 'border-red-400 bg-red-50/20 focus:ring-2 focus:ring-red-400' : 'border-gray-200 focus:ring-2 focus:ring-amber-500'
                    }`}
                    value={formData.employeeName}
                    onChange={e => {
                      clearError('employeeName');
                      setFormData({ ...formData, employeeName: e.target.value });
                    }}
                  />
                  {formErrors.employeeName && (
                    <p className="text-[10px] text-red-600 font-bold">{formErrors.employeeName}</p>
                  )}
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Diagnóstico / Motivo de Ausentismo</label>
                  <input
                    type="text"
                    placeholder="Ej: Infección respiratoria, Cie-10 J00"
                    className="w-full p-2.5 text-xs border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none"
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
              </div>

              {/* Período de incapacidad */}
              <div className="p-4 bg-amber-50/50 rounded-2xl border border-amber-200/80 space-y-3">
                <div className="flex items-center gap-2">
                  <Clock size={16} className="text-amber-600" />
                  <span className="text-xs font-black text-amber-800 uppercase tracking-wider">
                    Fechas de la Incapacidad Médica
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Fecha Inicio *</label>
                    <input
                      type="date"
                      className={`w-full p-2.5 text-xs border rounded-xl outline-none font-bold ${
                        formErrors.incapacityStartDate ? 'border-red-400 bg-red-50/20 focus:ring-2 focus:ring-red-400' : 'border-gray-200 focus:ring-2 focus:ring-amber-500'
                      }`}
                      value={formData.incapacityStartDate || ''}
                      onChange={e => {
                        clearError('incapacityStartDate');
                        setFormData({ ...formData, incapacityStartDate: e.target.value });
                      }}
                    />
                    {formErrors.incapacityStartDate && (
                      <p className="text-[10px] text-red-600 font-bold">{formErrors.incapacityStartDate}</p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Fecha Fin *</label>
                    <input
                      type="date"
                      className={`w-full p-2.5 text-xs border rounded-xl outline-none font-bold ${
                        formErrors.incapacityEndDate ? 'border-red-400 bg-red-50/20 focus:ring-2 focus:ring-red-400' : 'border-gray-200 focus:ring-2 focus:ring-amber-500'
                      }`}
                      value={formData.incapacityEndDate || ''}
                      onChange={e => {
                        clearError('incapacityEndDate');
                        setFormData({ ...formData, incapacityEndDate: e.target.value });
                      }}
                    />
                    {formErrors.incapacityEndDate && (
                      <p className="text-[10px] text-red-600 font-bold">{formErrors.incapacityEndDate}</p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Días Perdidos</label>
                    <div className="w-full p-2.5 text-sm font-black bg-white border border-amber-200 text-amber-800 rounded-xl text-center">
                      {formData.lostDays} días
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="pt-4 sticky bottom-0 bg-white pb-2 border-t border-gray-100 flex items-center justify-between gap-4">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={onClose}
              className="px-5 py-3 rounded-2xl text-xs font-bold text-gray-500 hover:bg-gray-100 transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`flex-1 text-white font-black py-3.5 rounded-2xl transition-all flex items-center justify-center gap-2 shadow-xl active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed ${
                editRecord ? 'bg-blue-600 shadow-blue-200 hover:bg-blue-700' : 'bg-emerald-600 shadow-emerald-200 hover:bg-emerald-700'
              }`}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>Guardando registro...</span>
                </>
              ) : (
                <>
                  {editRecord ? <Save size={18} /> : <Plus size={18} />}
                  <span>{editRecord ? 'Guardar Cambios del Reporte' : 'Guardar y Registrar Evento'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
