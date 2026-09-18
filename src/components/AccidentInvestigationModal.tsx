import React, { useState, useEffect } from 'react';
import { 
  AccidentInvestigation, 
  EventRecord, 
  Company, 
  InvestigationActionItem, 
  InvestigationWitness, 
  InvestigationEvidence,
  EventType,
  AccidentType
} from '../types';
import { 
  X, 
  Save, 
  Download, 
  GitFork, 
  Users, 
  FileText, 
  ShieldAlert, 
  Camera, 
  PenTool, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Plus, 
  Trash2, 
  Calendar, 
  User, 
  Building,
  Upload,
  Eye
} from 'lucide-react';
import CauseTreeBuilder from './CauseTreeBuilder';
import SignaturePad from './SignaturePad';
import { generateInvestigationPdf } from '../services/pdfReportService';

interface Props {
  company: Company | null;
  records: EventRecord[];
  initialRecord?: EventRecord | null;
  existingInvestigation?: AccidentInvestigation | null;
  onSave: (inv: Omit<AccidentInvestigation, 'id'>, id?: string) => Promise<void>;
  onClose: () => void;
}

export default function AccidentInvestigationModal({
  company,
  records,
  initialRecord,
  existingInvestigation,
  onSave,
  onClose
}: Props) {
  // Available accidents for investigation
  const accidentsList = records.filter(r => r.eventType === EventType.ACCIDENTE);

  const [activeTab, setActiveTab] = useState<'info' | 'chronology' | 'tree' | 'plan' | 'photos' | 'signatures'>('info');
  const [selectedRecordId, setSelectedRecordId] = useState<string>(
    existingInvestigation?.recordId || initialRecord?.id || (accidentsList[0]?.id || '')
  );

  const [saving, setSaving] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  // Investigation form state
  const [formData, setFormData] = useState<Omit<AccidentInvestigation, 'id'>>({
    companyId: company?.id || '',
    recordId: selectedRecordId,
    investigationDate: new Date().toISOString().split('T')[0],
    investigationPlace: '',
    severity: 'Leve',
    daysLostActual: 0,

    employeeName: '',
    idType: 'CC',
    idNumber: '',
    position: '',
    department: '',
    accidentDate: '',
    accidentTime: '',
    injuryDescription: '',
    bodyPart: '',

    workProcess: '',
    priorEvents: '',
    eventDescription: '',
    afterEvents: '',

    witnesses: [],

    lossDescription: '',
    immediateActs: [],
    immediateConditions: [],
    basicPersonalFactors: [],
    basicWorkFactors: [],

    actionPlan: [],
    evidences: [],
    sstComments: '',

    sstLeader: { name: '', idNumber: '', licenseNumber: '', signatureDataUrl: '' },
    copasstRep: { name: '', idNumber: '', position: '', signatureDataUrl: '' },
    immediateBoss: { name: '', idNumber: '', position: '', signatureDataUrl: '' },
    technicalSupport: { name: '', idNumber: '', position: '', signatureDataUrl: '' },
    legalRepApproval: { name: '', idNumber: '', signedDate: new Date().toISOString().split('T')[0], signatureDataUrl: '' },

    status: 'Borrador'
  });

  // When selected record changes, sync with record fields
  useEffect(() => {
    const rec = records.find(r => r.id === selectedRecordId);
    if (rec && !existingInvestigation) {
      setFormData(prev => ({
        ...prev,
        recordId: rec.id,
        employeeName: rec.employeeName,
        idType: rec.idType || 'CC',
        idNumber: rec.idNumber,
        position: rec.position,
        department: rec.department,
        accidentDate: rec.date,
        accidentTime: rec.time || '',
        daysLostActual: rec.lostDays || 0,
        injuryDescription: (rec.injuryType || []).join(', ') || rec.injuryTypeOther || '',
        bodyPart: (rec.bodyPart || []).join(', '),
        lossDescription: rec.description || '',
        eventDescription: rec.description || '',
        severity: rec.accidentType === AccidentType.MORTAL ? 'Mortal' : rec.lostDays > 30 ? 'Grave' : 'Leve',
        investigationPlace: rec.location || '',
        witnesses: (rec.witnesses || []).map(w => ({
          name: w.name,
          idType: w.idType,
          idNumber: w.idNumber,
          position: w.position,
          testimony: ''
        }))
      }));
    }
  }, [selectedRecordId, records, existingInvestigation]);

  // Load existing investigation if provided
  useEffect(() => {
    if (existingInvestigation) {
      const { id, ...rest } = existingInvestigation;
      setFormData(rest);
      setSelectedRecordId(existingInvestigation.recordId);
    }
  }, [existingInvestigation]);

  // Handle witnesses
  const handleAddWitness = () => {
    setFormData(prev => ({
      ...prev,
      witnesses: [
        ...prev.witnesses,
        { name: '', idType: 'CC', idNumber: '', position: '', testimony: '' }
      ]
    }));
  };

  const handleUpdateWitness = (idx: number, field: keyof InvestigationWitness, val: string) => {
    const list = [...formData.witnesses];
    list[idx] = { ...list[idx], [field]: val };
    setFormData(prev => ({ ...prev, witnesses: list }));
  };

  const handleRemoveWitness = (idx: number) => {
    setFormData(prev => ({
      ...prev,
      witnesses: prev.witnesses.filter((_, i) => i !== idx)
    }));
  };

  // Handle Action Plan items
  const handleAddAction = () => {
    setFormData(prev => ({
      ...prev,
      actionPlan: [
        ...prev.actionPlan,
        {
          id: Math.random().toString(36).substring(2, 9),
          hierarchy: 'Fuente',
          description: '',
          responsibleName: '',
          responsiblePosition: '',
          executionDate: '',
          followUpDate: '',
          status: 'Abierto'
        }
      ]
    }));
  };

  const handleUpdateAction = (idx: number, field: keyof InvestigationActionItem, val: any) => {
    const list = [...formData.actionPlan];
    list[idx] = { ...list[idx], [field]: val };
    setFormData(prev => ({ ...prev, actionPlan: list }));
  };

  const handleRemoveAction = (idx: number) => {
    setFormData(prev => ({
      ...prev,
      actionPlan: prev.actionPlan.filter((_, i) => i !== idx)
    }));
  };

  // Handle Photographic Evidences
  const handleAddEvidencePhoto = (file: File) => {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setFormData(prev => ({
        ...prev,
        evidences: [
          ...prev.evidences,
          {
            id: Math.random().toString(36).substring(2, 9),
            title: file.name.replace(/\.[^/.]+$/, ''),
            description: '',
            dataUrl
          }
        ]
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleUpdateEvidence = (idx: number, field: keyof InvestigationEvidence, val: string) => {
    const list = [...formData.evidences];
    list[idx] = { ...list[idx], [field]: val };
    setFormData(prev => ({ ...prev, evidences: list }));
  };

  const handleRemoveEvidence = (idx: number) => {
    setFormData(prev => ({
      ...prev,
      evidences: prev.evidences.filter((_, i) => i !== idx)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave(formData, existingInvestigation?.id);
      onClose();
    } catch (err) {
      console.error('Error saving investigation:', err);
      alert('Ocurrió un error al guardar la investigación.');
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadPdf = () => {
    setDownloadingPdf(true);
    try {
      const currentRecord = records.find(r => r.id === selectedRecordId) || initialRecord || null;
      generateInvestigationPdf(
        { ...formData, id: existingInvestigation?.id || 'temp-id' },
        company,
        currentRecord
      );
    } catch (err) {
      console.error('Error generating PDF:', err);
      alert('No se pudo generar el informe PDF. Verifique los datos e intente nuevamente.');
    } finally {
      setDownloadingPdf(false);
    }
  };

  const selectedRecord = records.find(r => r.id === selectedRecordId);

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-3 sm:p-6 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-5xl overflow-hidden shadow-2xl flex flex-col max-h-[94vh] border border-gray-100">
        
        {/* Modal Top Header */}
        <div className="p-5 sm:p-6 border-b border-gray-100 flex justify-between items-center bg-gradient-to-r from-emerald-50/70 via-white to-gray-50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-600 text-white rounded-2xl shadow-md shadow-emerald-200">
              <GitFork size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-extrabold text-gray-900">
                  {existingInvestigation ? 'Editar Investigación de Accidente' : 'Nueva Investigación de Accidente'}
                </h2>
                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  Resolución 1401 / 2007
                </span>
              </div>
              <p className="text-xs text-gray-500 font-medium">
                Metodología Oficial de Árbol de Causas y Plan de Acción (SG-SST)
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={downloadingPdf}
              className="px-4 py-2 bg-white border border-gray-200 text-gray-700 hover:text-emerald-700 hover:border-emerald-300 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
              title="Generar y descargar informe completo en PDF"
            >
              <Download size={14} className="text-emerald-600" />
              <span>{downloadingPdf ? 'Generando...' : 'Descargar PDF'}</span>
            </button>

            <button 
              type="button"
              onClick={onClose} 
              className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-600"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 pt-3 pb-0 bg-gray-50/70 border-b border-gray-100 flex items-center gap-2 overflow-x-auto scrollbar-hide">
          {[
            { id: 'info', label: '1. Accidente y Trabajador', icon: User },
            { id: 'chronology', label: '2. Relato y Testigos', icon: FileText },
            { id: 'tree', label: '3. Árbol de Causas', icon: GitFork },
            { id: 'plan', label: '4. Medidas y Plan de Acción', icon: CheckCircle2 },
            { id: 'photos', label: '5. Evidencias y Conclusiones', icon: Camera },
            { id: 'signatures', label: '6. Firmas Equipo Investigador', icon: PenTool }
          ].map(tab => {
            const Icon = tab.icon;
            const isSel = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-2.5 rounded-t-xl text-xs font-bold whitespace-nowrap transition-all border-b-2 flex items-center gap-1.5 ${
                  isSel
                    ? 'border-emerald-600 text-emerald-700 bg-white shadow-sm'
                    : 'border-transparent text-gray-500 hover:text-gray-800 hover:bg-white/40'
                }`}
              >
                <Icon size={14} className={isSel ? 'text-emerald-600' : 'text-gray-400'} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Modal Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto scrollbar-hide flex-1">
          
          {/* TAB 1: ACCIDENTE Y TRABAJADOR */}
          {activeTab === 'info' && (
            <div className="space-y-6">
              
              {/* Accident Selector */}
              <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 space-y-2">
                <label className="text-[11px] font-black text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldAlert size={14} className="text-emerald-600" />
                  Seleccionar Accidente Reportado (FURAT) a Investigar *
                </label>
                <select
                  className="w-full p-2.5 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none bg-white font-bold text-gray-800"
                  value={selectedRecordId}
                  onChange={e => setSelectedRecordId(e.target.value)}
                >
                  {accidentsList.length === 0 ? (
                    <option value="">No hay accidentes reportados</option>
                  ) : (
                    accidentsList.map(acc => (
                      <option key={acc.id} value={acc.id}>
                        {acc.date} | {acc.employeeName} (C.C. {acc.idNumber}) - {acc.position} ({acc.lostDays} días de incapacidad)
                      </option>
                    ))
                  )}
                </select>
                <p className="text-[10px] text-gray-400">
                  La investigación tomará automáticamente los datos registrados en el FURAT del accidente seleccionado.
                </p>
              </div>

              {/* Selected Accident Summary Card */}
              {selectedRecord && (
                <div className="p-4 bg-emerald-50/40 rounded-2xl border border-emerald-100 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <span className="text-[9px] font-bold text-gray-400 uppercase block">Trabajador:</span>
                    <span className="font-extrabold text-gray-900">{selectedRecord.employeeName}</span>
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-gray-400 uppercase block">Documento:</span>
                    <span className="font-mono text-gray-800">{selectedRecord.idType || 'CC'} {selectedRecord.idNumber}</span>
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-gray-400 uppercase block">Cargo y Área:</span>
                    <span className="text-gray-800">{selectedRecord.position} ({selectedRecord.department})</span>
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-gray-400 uppercase block">Fecha y Hora:</span>
                    <span className="font-bold text-gray-800">{selectedRecord.date} {selectedRecord.time}</span>
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-gray-400 uppercase block">Sitio del Accidente:</span>
                    <span className="text-gray-800">{selectedRecord.location || '-'}</span>
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-gray-400 uppercase block">Tipo de Lesión:</span>
                    <span className="text-gray-800">{(selectedRecord.injuryType || []).join(', ') || '-'}</span>
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-gray-400 uppercase block">Parte del Cuerpo:</span>
                    <span className="text-gray-800">{(selectedRecord.bodyPart || []).join(', ') || '-'}</span>
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-gray-400 uppercase block">Días Perdidos FURAT:</span>
                    <span className="font-bold text-emerald-800">{selectedRecord.lostDays} días</span>
                  </div>
                </div>
              )}

              {/* Investigation Classification */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                    Clasificación de Severidad (Art. 3 Res. 1401/2007) *
                  </label>
                  <select
                    className={`w-full p-2.5 text-xs border rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none bg-white font-black ${
                      formData.severity === 'Grave' ? 'text-amber-800 border-amber-300 bg-amber-50/50' :
                      formData.severity === 'Mortal' ? 'text-red-800 border-red-300 bg-red-50/50' :
                      'text-emerald-800 border-emerald-300 bg-emerald-50/50'
                    }`}
                    value={formData.severity}
                    onChange={e => setFormData({ ...formData, severity: e.target.value as any })}
                  >
                    <option value="Leve">🟢 Leve (Accidente habitual sin amputación ni trauma mayor)</option>
                    <option value="Grave">⚠️ Grave (Amputación, fractura de huesos largos, quemadura II/III, trauma cráneo)</option>
                    <option value="Mortal">🔴 Mortal (Conlleva fallecimiento del trabajador)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                    Fecha de Realización de la Investigación *
                  </label>
                  <input
                    type="date"
                    required
                    className="w-full p-2.5 text-xs border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-bold text-gray-800"
                    value={formData.investigationDate}
                    onChange={e => setFormData({ ...formData, investigationDate: e.target.value })}
                  />
                  <p className="text-[9px] text-gray-400">Plazo legal: dentro de los 15 días calendario siguientes a la ocurrencia.</p>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                    Lugar o Sede donde se sesionó la Investigación
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: Sala de Juntas Planta Principal"
                    className="w-full p-2.5 text-xs border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                    value={formData.investigationPlace || ''}
                    onChange={e => setFormData({ ...formData, investigationPlace: e.target.value })}
                  />
                </div>
              </div>

              {/* Status and Actual Days */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                    Días de Incapacidad Reales / Consolidados
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    className="w-full p-2.5 text-xs border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-bold"
                    value={formData.daysLostActual || ''}
                    onChange={e => setFormData({ ...formData, daysLostActual: parseInt(e.target.value) || 0 })}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                    Estado del Proceso de Investigación
                  </label>
                  <select
                    className="w-full p-2.5 text-xs border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none bg-white font-bold"
                    value={formData.status}
                    onChange={e => setFormData({ ...formData, status: e.target.value as any })}
                  >
                    <option value="Borrador">📝 Borrador (En recolección de datos)</option>
                    <option value="En Revisión">🔍 En Revisión por Equipo Investigador</option>
                    <option value="Cerrada">✅ Cerrada y Aprobada por Representante Legal</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <button
                  type="button"
                  onClick={() => setActiveTab('chronology')}
                  className="px-5 py-2.5 bg-emerald-600 text-white text-xs font-bold rounded-xl hover:bg-emerald-700 shadow-md shadow-emerald-200"
                >
                  Siguiente: Relato y Testigos →
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: RELATO Y TESTIGOS */}
          {activeTab === 'chronology' && (
            <div className="space-y-6">
              <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 space-y-4">
                <h4 className="text-xs font-black text-gray-900 uppercase tracking-wider flex items-center gap-2">
                  <Clock size={16} className="text-emerald-600" />
                  Cronología Pormenorizada de los Hechos (Art. 7 Res. 1401)
                </h4>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                    1. Tarea o proceso que ejecutaba el trabajador al momento del accidente
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Especifique la actividad concreta: corte de material, cargue, traslado, mantenimiento..."
                    className="w-full p-2.5 text-xs border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none leading-relaxed"
                    value={formData.workProcess || ''}
                    onChange={e => setFormData({ ...formData, workProcess: e.target.value })}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                    2. Hechos previos al accidente (Condiciones antes del suceso)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Qué ocurría momentos antes, instrucciones dadas, estado de los equipos, condiciones de la superficie..."
                    className="w-full p-2.5 text-xs border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none leading-relaxed"
                    value={formData.priorEvents || ''}
                    onChange={e => setFormData({ ...formData, priorEvents: e.target.value })}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                    3. Descripción secuencial y exacta del accidente (Cómo ocurrió el contacto o lesión) *
                  </label>
                  <textarea
                    required
                    rows={3}
                    placeholder="Relato detallado de la mecánica del accidente, movimientos, interacción con equipos..."
                    className="w-full p-2.5 text-xs border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none leading-relaxed"
                    value={formData.eventDescription || ''}
                    onChange={e => setFormData({ ...formData, eventDescription: e.target.value })}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                    4. Hechos posteriores y atención médica inicial
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Primeros auxilios suministrados, traslado a centro asistencial, reporte oportuno..."
                    className="w-full p-2.5 text-xs border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none leading-relaxed"
                    value={formData.afterEvents || ''}
                    onChange={e => setFormData({ ...formData, afterEvents: e.target.value })}
                  />
                </div>
              </div>

              {/* Witnesses & Declarations */}
              <div className="p-4 bg-white rounded-2xl border border-gray-200 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-black text-gray-900 uppercase tracking-wider flex items-center gap-2">
                      <Users size={16} className="text-emerald-600" />
                      Testigos Presenciales y Versiones / Testimonios
                    </h4>
                    <p className="text-[10px] text-gray-400">Declaración juramentada de quienes presenciaron el suceso.</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddWitness}
                    className="px-3 py-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 rounded-xl transition-colors flex items-center gap-1"
                  >
                    <Plus size={14} /> Añadir Testigo
                  </button>
                </div>

                {formData.witnesses.length === 0 ? (
                  <div className="p-4 text-center text-xs text-gray-400 italic bg-gray-50 rounded-xl">
                    No se han agregado testigos presenciales. Si hubo personas presentes, agréguelas con su testimonio.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {formData.witnesses.map((witness, idx) => (
                      <div key={idx} className="p-3.5 bg-gray-50/70 border border-gray-200 rounded-xl space-y-2">
                        <div className="flex items-center justify-between border-b border-gray-200 pb-1.5">
                          <span className="text-[10px] font-black text-emerald-800 uppercase">Testigo #{idx + 1}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveWitness(idx)}
                            className="text-gray-400 hover:text-red-600 text-xs font-bold flex items-center gap-1"
                          >
                            <Trash2 size={12} /> Eliminar
                          </button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                          <input
                            type="text"
                            placeholder="Nombres y apellidos *"
                            className="p-2 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
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
                            className="p-2 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none font-mono bg-white"
                            value={witness.idNumber}
                            onChange={e => handleUpdateWitness(idx, 'idNumber', e.target.value)}
                          />
                          <input
                            type="text"
                            placeholder="Cargo *"
                            className="p-2 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
                            value={witness.position}
                            onChange={e => handleUpdateWitness(idx, 'position', e.target.value)}
                          />
                        </div>
                        <div className="space-y-1 pt-1">
                          <label className="text-[9px] font-bold text-gray-500 uppercase">Declaración / Versión de los hechos del testigo</label>
                          <textarea
                            rows={2}
                            placeholder="Qué observó el testigo: 'Me encontraba a 2 metros cuando vi que el compañero...'"
                            className="w-full p-2 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none bg-white leading-relaxed"
                            value={witness.testimony || ''}
                            onChange={e => handleUpdateWitness(idx, 'testimony', e.target.value)}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-between pt-4">
                <button
                  type="button"
                  onClick={() => setActiveTab('info')}
                  className="px-4 py-2 text-xs font-bold text-gray-500 hover:text-gray-800"
                >
                  ← Anterior: Accidente y Trabajador
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('tree')}
                  className="px-5 py-2.5 bg-emerald-600 text-white text-xs font-bold rounded-xl hover:bg-emerald-700 shadow-md shadow-emerald-200"
                >
                  Siguiente: Árbol de Causas →
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: ÁRBOL DE CAUSAS */}
          {activeTab === 'tree' && (
            <div className="space-y-6">
              <CauseTreeBuilder
                lossDescription={formData.lossDescription}
                onLossChange={val => setFormData({ ...formData, lossDescription: val })}
                immediateActs={formData.immediateActs}
                onActsChange={acts => setFormData({ ...formData, immediateActs: acts })}
                immediateConditions={formData.immediateConditions}
                onConditionsChange={conds => setFormData({ ...formData, immediateConditions: conds })}
                basicPersonalFactors={formData.basicPersonalFactors}
                onPersonalChange={pers => setFormData({ ...formData, basicPersonalFactors: pers })}
                basicWorkFactors={formData.basicWorkFactors}
                onWorkChange={work => setFormData({ ...formData, basicWorkFactors: work })}
              />

              <div className="flex justify-between pt-4">
                <button
                  type="button"
                  onClick={() => setActiveTab('chronology')}
                  className="px-4 py-2 text-xs font-bold text-gray-500 hover:text-gray-800"
                >
                  ← Anterior: Relato y Testigos
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('plan')}
                  className="px-5 py-2.5 bg-emerald-600 text-white text-xs font-bold rounded-xl hover:bg-emerald-700 shadow-md shadow-emerald-200"
                >
                  Siguiente: Plan de Acción →
                </button>
              </div>
            </div>
          )}

          {/* TAB 4: PLAN DE ACCIÓN Y MEDIDAS */}
          {activeTab === 'plan' && (
            <div className="space-y-6">
              <div className="p-4 bg-emerald-50/40 rounded-2xl border border-emerald-100 flex items-start gap-3">
                <CheckCircle2 size={20} className="text-emerald-700 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-black text-emerald-950 uppercase tracking-wider">
                    Plan de Acción y Medidas de Intervención (Art. 7 Num. 6 Res. 1401/2007)
                  </h4>
                  <p className="text-[11px] text-emerald-800 mt-0.5 leading-relaxed">
                    Toda medida correctiva o preventiva debe contener el control sugerido según la jerarquía (Fuente, Medio o Individuo/EPP), un responsable asignado con nombre y cargo, fecha límite de ejecución y fecha de verificación.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase text-gray-800 tracking-wider">
                    Medidas de Control Registradas ({formData.actionPlan.length})
                  </span>
                  <button
                    type="button"
                    onClick={handleAddAction}
                    className="px-3.5 py-1.5 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 flex items-center gap-1.5 shadow-xs"
                  >
                    <Plus size={14} /> Añadir Medida de Control
                  </button>
                </div>

                {formData.actionPlan.length === 0 ? (
                  <div className="p-8 text-center text-xs text-gray-400 italic bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                    No se han registrado medidas de control aún. Haga clic en "Añadir Medida de Control" para definir las acciones correctivas y preventivas del árbol causal.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {formData.actionPlan.map((action, idx) => (
                      <div key={action.id || idx} className="p-4 bg-white rounded-2xl border border-gray-200 space-y-3 shadow-xs">
                        <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black flex items-center justify-center">
                              {idx + 1}
                            </span>
                            <span className="text-xs font-bold text-gray-800">Medida de Intervención</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveAction(idx)}
                            className="text-gray-400 hover:text-red-600 text-xs font-bold flex items-center gap-1"
                          >
                            <Trash2 size={13} /> Eliminar
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Jerarquía del Control</label>
                            <select
                              className="w-full p-2 text-xs border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none bg-white font-bold text-gray-700"
                              value={action.hierarchy || 'Fuente'}
                              onChange={e => handleUpdateAction(idx, 'hierarchy', e.target.value)}
                            >
                              <option value="Fuente">Fuente (Eliminación / Sustitución / Ingeniería)</option>
                              <option value="Medio">Medio (Aislamiento / Señalización / Procedimientos)</option>
                              <option value="Individuo">Individuo (EPP / Capacitación / Entrenamiento)</option>
                            </select>
                          </div>

                          <div className="space-y-1 sm:col-span-3">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Descripción Concreta de la Medida *</label>
                            <input
                              type="text"
                              required
                              placeholder="Ej: Instalar guarda fija de acrílico en el rodillo de alimentación..."
                              className="w-full p-2 text-xs border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                              value={action.description}
                              onChange={e => handleUpdateAction(idx, 'description', e.target.value)}
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Responsable de Ejecución *</label>
                            <input
                              type="text"
                              required
                              placeholder="Nombre del responsable"
                              className="w-full p-2 text-xs border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                              value={action.responsibleName}
                              onChange={e => handleUpdateAction(idx, 'responsibleName', e.target.value)}
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Cargo del Responsable *</label>
                            <input
                              type="text"
                              placeholder="Ej: Jefe de Mantenimiento"
                              className="w-full p-2 text-xs border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                              value={action.responsiblePosition}
                              onChange={e => handleUpdateAction(idx, 'responsiblePosition', e.target.value)}
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Fecha de Ejecución *</label>
                            <input
                              type="date"
                              required
                              className="w-full p-2 text-xs border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-bold"
                              value={action.executionDate}
                              onChange={e => handleUpdateAction(idx, 'executionDate', e.target.value)}
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Fecha de Seguimiento *</label>
                            <input
                              type="date"
                              required
                              className="w-full p-2 text-xs border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-bold"
                              value={action.followUpDate}
                              onChange={e => handleUpdateAction(idx, 'followUpDate', e.target.value)}
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 border-t border-gray-100">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Estado de la Acción</label>
                            <select
                              className="w-full p-2 text-xs border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none bg-white font-bold"
                              value={action.status}
                              onChange={e => handleUpdateAction(idx, 'status', e.target.value)}
                            >
                              <option value="Abierto">🔴 Abierto</option>
                              <option value="En Proceso">🟡 En Proceso</option>
                              <option value="Implementado">🟢 Implementado / Verificado</option>
                            </select>
                          </div>

                          <div className="space-y-1 sm:col-span-2">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Observaciones / Notas de Seguimiento</label>
                            <input
                              type="text"
                              placeholder="Detalles sobre avance, cotizaciones o verificación de eficacia..."
                              className="w-full p-2 text-xs border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                              value={action.verificationNotes || ''}
                              onChange={e => handleUpdateAction(idx, 'verificationNotes', e.target.value)}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-between pt-4">
                <button
                  type="button"
                  onClick={() => setActiveTab('tree')}
                  className="px-4 py-2 text-xs font-bold text-gray-500 hover:text-gray-800"
                >
                  ← Anterior: Árbol de Causas
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('photos')}
                  className="px-5 py-2.5 bg-emerald-600 text-white text-xs font-bold rounded-xl hover:bg-emerald-700 shadow-md shadow-emerald-200"
                >
                  Siguiente: Evidencias y Conclusiones →
                </button>
              </div>
            </div>
          )}

          {/* TAB 5: FOTOGRAFÍAS Y CONCLUSIONES */}
          {activeTab === 'photos' && (
            <div className="space-y-6">
              
              {/* Photo Evidences */}
              <div className="p-5 bg-white rounded-2xl border border-gray-200 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-black text-gray-900 uppercase tracking-wider flex items-center gap-2">
                      <Camera size={16} className="text-emerald-600" />
                      Espacio de Registro Fotográfico y Evidencias
                    </h4>
                    <p className="text-[10px] text-gray-400">
                      Fotografías del lugar de los hechos, equipos, herramientas o condiciones inseguras.
                    </p>
                  </div>
                  <label className="px-3.5 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 cursor-pointer flex items-center gap-1.5 shadow-xs">
                    <Upload size={14} /> Subir Fotografía
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={e => {
                        const file = e.target.files?.[0];
                        if (file) handleAddEvidencePhoto(file);
                      }}
                    />
                  </label>
                </div>

                {formData.evidences.length === 0 ? (
                  <div className="p-8 text-center text-xs text-gray-400 italic bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                    No se han adjuntado fotografías del evento todavía. Puede cargar imágenes desde su equipo para adjuntarlas al informe oficial.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {formData.evidences.map((ev, idx) => (
                      <div key={ev.id || idx} className="p-3 bg-gray-50 border border-gray-200 rounded-2xl space-y-2 relative">
                        <div className="w-full h-36 bg-gray-200 rounded-xl overflow-hidden flex items-center justify-center">
                          {ev.dataUrl ? (
                            <img src={ev.dataUrl} alt={ev.title} className="w-full h-full object-cover" />
                          ) : (
                            <Camera size={24} className="text-gray-400" />
                          )}
                        </div>
                        <div className="space-y-1">
                          <input
                            type="text"
                            placeholder="Título de la fotografía"
                            className="w-full p-1.5 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none font-bold bg-white"
                            value={ev.title}
                            onChange={e => handleUpdateEvidence(idx, 'title', e.target.value)}
                          />
                          <textarea
                            rows={2}
                            placeholder="Descripción del hallazgo fotográfico..."
                            className="w-full p-1.5 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
                            value={ev.description || ''}
                            onChange={e => handleUpdateEvidence(idx, 'description', e.target.value)}
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveEvidence(idx)}
                          className="w-full py-1 text-center text-xs font-bold text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center justify-center gap-1"
                        >
                          <Trash2 size={12} /> Eliminar Foto
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* SST Technical Conclusions */}
              <div className="p-5 bg-white rounded-2xl border border-gray-200 space-y-2">
                <label className="text-[11px] font-black text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
                  <FileText size={14} className="text-emerald-600" />
                  Conclusiones Técnicas y Recomendaciones del Área de SST
                </label>
                <p className="text-[10px] text-gray-400">
                  Concepto técnico profesional del responsable de SST sobre el accidente ocurrido.
                </p>
                <textarea
                  rows={4}
                  placeholder="Conclusiones del análisis técnico, lecciones aprendidas para la organización y recomendaciones de mejora continua..."
                  className="w-full p-3 text-xs border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none leading-relaxed"
                  value={formData.sstComments || ''}
                  onChange={e => setFormData({ ...formData, sstComments: e.target.value })}
                />
              </div>

              <div className="flex justify-between pt-4">
                <button
                  type="button"
                  onClick={() => setActiveTab('plan')}
                  className="px-4 py-2 text-xs font-bold text-gray-500 hover:text-gray-800"
                >
                  ← Anterior: Plan de Acción
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('signatures')}
                  className="px-5 py-2.5 bg-emerald-600 text-white text-xs font-bold rounded-xl hover:bg-emerald-700 shadow-md shadow-emerald-200"
                >
                  Siguiente: Firmas del Equipo →
                </button>
              </div>
            </div>
          )}

          {/* TAB 6: FIRMAS DEL EQUIPO INVESTIGADOR */}
          {activeTab === 'signatures' && (
            <div className="space-y-6">
              <div className="p-4 bg-emerald-50/40 rounded-2xl border border-emerald-100 flex items-start gap-3">
                <PenTool size={20} className="text-emerald-700 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-black text-emerald-950 uppercase tracking-wider">
                    Firmas del Equipo Investigador (Resolución 1401/2007 Art. 7)
                  </h4>
                  <p className="text-[11px] text-emerald-800 mt-0.5 leading-relaxed">
                    La investigación debe ser firmada por el <strong>Responsable de SST</strong> (indicando número de Licencia SST), el <strong>Representante del COPASST / Vigía</strong>, el <strong>Jefe Inmediato</strong>, el <strong>Apoyo Técnico</strong> y contar con la aprobación del <strong>Representante Legal</strong>.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                
                {/* 1. Responsable SST */}
                <div className="p-4 bg-gray-50/70 rounded-2xl border border-gray-200 space-y-3">
                  <span className="text-xs font-black text-emerald-800 uppercase block border-b border-gray-200 pb-1.5">
                    1. Responsable del SG-SST (Con Licencia en SST) *
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <input
                      type="text"
                      placeholder="Nombre y Apellidos *"
                      className="p-2 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
                      value={formData.sstLeader?.name || ''}
                      onChange={e => setFormData({
                        ...formData,
                        sstLeader: { ...(formData.sstLeader || { name: '', idNumber: '', licenseNumber: '' }), name: e.target.value }
                      })}
                    />
                    <input
                      type="text"
                      placeholder="No. Cédula *"
                      className="p-2 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none bg-white font-mono"
                      value={formData.sstLeader?.idNumber || ''}
                      onChange={e => setFormData({
                        ...formData,
                        sstLeader: { ...(formData.sstLeader || { name: '', idNumber: '', licenseNumber: '' }), idNumber: e.target.value }
                      })}
                    />
                    <input
                      type="text"
                      required
                      placeholder="No. Licencia SST *"
                      className="p-2 text-xs border border-emerald-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none bg-emerald-50/50 font-bold"
                      value={formData.sstLeader?.licenseNumber || ''}
                      onChange={e => setFormData({
                        ...formData,
                        sstLeader: { ...(formData.sstLeader || { name: '', idNumber: '', licenseNumber: '' }), licenseNumber: e.target.value }
                      })}
                    />
                  </div>
                  <SignaturePad
                    title="Firma del Responsable SG-SST"
                    initialDataUrl={formData.sstLeader?.signatureDataUrl}
                    onSave={url => setFormData({
                      ...formData,
                      sstLeader: { ...(formData.sstLeader || { name: '', idNumber: '', licenseNumber: '' }), signatureDataUrl: url }
                    })}
                  />
                </div>

                {/* 2. COPASST / Vigía */}
                <div className="p-4 bg-gray-50/70 rounded-2xl border border-gray-200 space-y-3">
                  <span className="text-xs font-black text-emerald-800 uppercase block border-b border-gray-200 pb-1.5">
                    2. Representante del COPASST o Vigía SST *
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <input
                      type="text"
                      placeholder="Nombre y Apellidos *"
                      className="p-2 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
                      value={formData.copasstRep?.name || ''}
                      onChange={e => setFormData({
                        ...formData,
                        copasstRep: { ...(formData.copasstRep || { name: '', idNumber: '', position: '' }), name: e.target.value }
                      })}
                    />
                    <input
                      type="text"
                      placeholder="No. Cédula *"
                      className="p-2 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none bg-white font-mono"
                      value={formData.copasstRep?.idNumber || ''}
                      onChange={e => setFormData({
                        ...formData,
                        copasstRep: { ...(formData.copasstRep || { name: '', idNumber: '', position: '' }), idNumber: e.target.value }
                      })}
                    />
                    <input
                      type="text"
                      placeholder="Cargo en empresa *"
                      className="p-2 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
                      value={formData.copasstRep?.position || ''}
                      onChange={e => setFormData({
                        ...formData,
                        copasstRep: { ...(formData.copasstRep || { name: '', idNumber: '', position: '' }), position: e.target.value }
                      })}
                    />
                  </div>
                  <SignaturePad
                    title="Firma del Representante COPASST"
                    initialDataUrl={formData.copasstRep?.signatureDataUrl}
                    onSave={url => setFormData({
                      ...formData,
                      copasstRep: { ...(formData.copasstRep || { name: '', idNumber: '', position: '' }), signatureDataUrl: url }
                    })}
                  />
                </div>

                {/* 3. Jefe Inmediato */}
                <div className="p-4 bg-gray-50/70 rounded-2xl border border-gray-200 space-y-3">
                  <span className="text-xs font-black text-emerald-800 uppercase block border-b border-gray-200 pb-1.5">
                    3. Jefe Inmediato o Supervisor del Área *
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <input
                      type="text"
                      placeholder="Nombre y Apellidos *"
                      className="p-2 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
                      value={formData.immediateBoss?.name || ''}
                      onChange={e => setFormData({
                        ...formData,
                        immediateBoss: { ...(formData.immediateBoss || { name: '', idNumber: '', position: '' }), name: e.target.value }
                      })}
                    />
                    <input
                      type="text"
                      placeholder="No. Cédula *"
                      className="p-2 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none bg-white font-mono"
                      value={formData.immediateBoss?.idNumber || ''}
                      onChange={e => setFormData({
                        ...formData,
                        immediateBoss: { ...(formData.immediateBoss || { name: '', idNumber: '', position: '' }), idNumber: e.target.value }
                      })}
                    />
                    <input
                      type="text"
                      placeholder="Cargo *"
                      className="p-2 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
                      value={formData.immediateBoss?.position || ''}
                      onChange={e => setFormData({
                        ...formData,
                        immediateBoss: { ...(formData.immediateBoss || { name: '', idNumber: '', position: '' }), position: e.target.value }
                      })}
                    />
                  </div>
                  <SignaturePad
                    title="Firma del Jefe Inmediato"
                    initialDataUrl={formData.immediateBoss?.signatureDataUrl}
                    onSave={url => setFormData({
                      ...formData,
                      immediateBoss: { ...(formData.immediateBoss || { name: '', idNumber: '', position: '' }), signatureDataUrl: url }
                    })}
                  />
                </div>

                {/* 4. Apoyo Técnico o Especialista */}
                <div className="p-4 bg-gray-50/70 rounded-2xl border border-gray-200 space-y-3">
                  <span className="text-xs font-black text-emerald-800 uppercase block border-b border-gray-200 pb-1.5">
                    4. Apoyo Técnico / Especialista o Profesional
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <input
                      type="text"
                      placeholder="Nombre y Apellidos"
                      className="p-2 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
                      value={formData.technicalSupport?.name || ''}
                      onChange={e => setFormData({
                        ...formData,
                        technicalSupport: { ...(formData.technicalSupport || { name: '', idNumber: '', position: '' }), name: e.target.value }
                      })}
                    />
                    <input
                      type="text"
                      placeholder="No. Cédula"
                      className="p-2 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none bg-white font-mono"
                      value={formData.technicalSupport?.idNumber || ''}
                      onChange={e => setFormData({
                        ...formData,
                        technicalSupport: { ...(formData.technicalSupport || { name: '', idNumber: '', position: '' }), idNumber: e.target.value }
                      })}
                    />
                    <input
                      type="text"
                      placeholder="Cargo o Especialidad"
                      className="p-2 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
                      value={formData.technicalSupport?.position || ''}
                      onChange={e => setFormData({
                        ...formData,
                        technicalSupport: { ...(formData.technicalSupport || { name: '', idNumber: '', position: '' }), position: e.target.value }
                      })}
                    />
                  </div>
                  <SignaturePad
                    title="Firma del Apoyo Técnico"
                    initialDataUrl={formData.technicalSupport?.signatureDataUrl}
                    onSave={url => setFormData({
                      ...formData,
                      technicalSupport: { ...(formData.technicalSupport || { name: '', idNumber: '', position: '' }), signatureDataUrl: url }
                    })}
                  />
                </div>

                {/* 5. Aprobación Representante Legal */}
                <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-200 md:col-span-2 space-y-3">
                  <span className="text-xs font-black text-emerald-950 uppercase block border-b border-emerald-200 pb-1.5">
                    5. Aprobación Final del Representante Legal *
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <input
                      type="text"
                      placeholder="Nombre Representante Legal *"
                      className="p-2 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
                      value={formData.legalRepApproval?.name || ''}
                      onChange={e => setFormData({
                        ...formData,
                        legalRepApproval: { ...(formData.legalRepApproval || { name: '', idNumber: '', signedDate: '' }), name: e.target.value }
                      })}
                    />
                    <input
                      type="text"
                      placeholder="No. Documento *"
                      className="p-2 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none bg-white font-mono"
                      value={formData.legalRepApproval?.idNumber || ''}
                      onChange={e => setFormData({
                        ...formData,
                        legalRepApproval: { ...(formData.legalRepApproval || { name: '', idNumber: '', signedDate: '' }), idNumber: e.target.value }
                      })}
                    />
                    <input
                      type="date"
                      className="p-2 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none bg-white font-bold"
                      value={formData.legalRepApproval?.signedDate || ''}
                      onChange={e => setFormData({
                        ...formData,
                        legalRepApproval: { ...(formData.legalRepApproval || { name: '', idNumber: '', signedDate: '' }), signedDate: e.target.value }
                      })}
                    />
                  </div>
                  <SignaturePad
                    title="Firma del Representante Legal"
                    initialDataUrl={formData.legalRepApproval?.signatureDataUrl}
                    onSave={url => setFormData({
                      ...formData,
                      legalRepApproval: { ...(formData.legalRepApproval || { name: '', idNumber: '', signedDate: '' }), signatureDataUrl: url }
                    })}
                  />
                </div>
              </div>

              <div className="flex justify-between pt-4">
                <button
                  type="button"
                  onClick={() => setActiveTab('photos')}
                  className="px-4 py-2 text-xs font-bold text-gray-500 hover:text-gray-800"
                >
                  ← Anterior: Evidencias
                </button>
              </div>
            </div>
          )}

          {/* Sticky Bottom Actions Bar */}
          <div className="pt-4 sticky bottom-0 bg-white pb-2 border-t border-gray-100 flex items-center justify-between gap-4">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-3 rounded-2xl text-xs font-bold text-gray-500 hover:bg-gray-100 transition-colors"
            >
              Cancelar
            </button>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleDownloadPdf}
                disabled={downloadingPdf}
                className="px-5 py-3 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-2xl text-xs font-bold transition-all flex items-center gap-1.5"
              >
                <Download size={16} className="text-emerald-600" />
                {downloadingPdf ? 'Generando PDF...' : 'Descargar Informe PDF'}
              </button>

              <button
                type="submit"
                disabled={saving}
                className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-black shadow-lg shadow-emerald-200 transition-all flex items-center gap-2 active:scale-95"
              >
                <Save size={16} />
                {saving ? 'Guardando...' : existingInvestigation ? 'Guardar Cambios Investigación' : 'Guardar y Finalizar Investigación'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
