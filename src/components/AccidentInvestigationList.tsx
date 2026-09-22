import React, { useState } from 'react';
import { 
  AccidentInvestigation, 
  EventRecord, 
  Company, 
  EventType, 
  AccidentType 
} from '../types';
import { 
  GitFork, 
  Plus, 
  Download, 
  Edit3, 
  Trash2, 
  Clock, 
  Search, 
  Filter, 
  AlertTriangle, 
  CheckCircle2, 
  FileText, 
  ShieldAlert, 
  User, 
  Calendar,
  ExternalLink,
  Flame
} from 'lucide-react';
import { differenceInCalendarDays, parseISO } from 'date-fns';
import { generateInvestigationPdf } from '../services/pdfReportService';
import { 
  findInvestigationForRecord, 
  isInvestigationCompleted, 
  isInvestigationInProgress 
} from '../utils/investigationUtils';

interface Props {
  company: Company | null;
  records: EventRecord[];
  investigations: AccidentInvestigation[];
  onNewInvestigation: (record?: EventRecord) => void;
  onEditInvestigation: (inv: AccidentInvestigation) => void;
  onDeleteInvestigation: (id: string) => Promise<void>;
}

export default function AccidentInvestigationList({
  company,
  records,
  investigations,
  onNewInvestigation,
  onEditInvestigation,
  onDeleteInvestigation
}: Props) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Find accidents that have NOT been completed/closed yet
  const pendingAccidents = records.filter(r => {
    if (r.eventType !== EventType.ACCIDENTE) return false;
    const inv = findInvestigationForRecord(r, investigations);
    return !inv || !isInvestigationCompleted(inv.status);
  });

  // Filter investigations
  const filteredInvestigations = investigations.filter(inv => {
    const matchesSearch = 
      (inv.employeeName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (inv.idNumber || '').includes(searchTerm) ||
      (inv.position || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSeverity = filterSeverity === 'all' || inv.severity === filterSeverity;
    const matchesStatus = 
      filterStatus === 'all' || 
      inv.status === filterStatus ||
      (filterStatus === 'Finalizada' && isInvestigationCompleted(inv.status)) ||
      (filterStatus === 'Cerrada' && isInvestigationCompleted(inv.status));
    return matchesSearch && matchesSeverity && matchesStatus;
  });

  const handleDownload = (inv: AccidentInvestigation) => {
    const rec = records.find(r => r.id === inv.recordId) || records.find(r => {
      const invDoc = (inv.idNumber || '').trim();
      const rDoc = (r.idNumber || '').trim();
      return invDoc && rDoc && invDoc === rDoc;
    }) || null;
    const syncedInv: AccidentInvestigation = {
      ...inv,
      accidentDate: rec?.date || inv.accidentDate,
      employeeName: rec?.employeeName || inv.employeeName,
      idNumber: rec?.idNumber || inv.idNumber,
      position: rec?.position || inv.position,
      department: rec?.department || inv.department
    };
    generateInvestigationPdf(syncedInv, company, rec);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner / Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-emerald-900 to-teal-900 p-6 rounded-3xl text-white shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2 bg-emerald-500/20 text-emerald-300 rounded-xl border border-emerald-500/30">
              <GitFork size={20} />
            </span>
            <h2 className="text-xl font-black tracking-tight">Investigación de Accidentes de Trabajo</h2>
          </div>
          <p className="text-xs text-emerald-200/80 max-w-2xl font-medium leading-relaxed">
            Módulo oficial reglamentado según la <strong>Resolución 1401 de 2007</strong>. Análisis de causas inmediatas y básicas mediante <strong>Árbol de Causas</strong>, conformación del equipo investigador con firmas y generación de informes oficiales en PDF.
          </p>
        </div>

        <button
          type="button"
          onClick={() => onNewInvestigation()}
          className="px-5 py-3 bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-black rounded-2xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/30 active:scale-95 text-xs self-start sm:self-auto shrink-0"
        >
          <Plus size={16} strokeWidth={3} />
          Nueva Investigación
        </button>
      </div>

      {/* 100% Compliance Banner when all accidents are investigated */}
      {records.some(r => r.eventType === EventType.ACCIDENTE) && pendingAccidents.length === 0 && (
        <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-3xl flex items-center justify-between gap-4 text-emerald-900 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl">
              <CheckCircle2 size={20} />
            </div>
            <div>
              <h4 className="text-xs font-black uppercase tracking-wider text-emerald-950">
                100% de Cumplimiento Legal (Resolución 1401 de 2007)
              </h4>
              <p className="text-[11px] text-emerald-800">
                Todos los accidentes de trabajo registrados tienen su investigación realizada y culminada conforme a la ley.
              </p>
            </div>
          </div>
          <span className="px-3 py-1 bg-emerald-200/80 text-emerald-900 rounded-full text-[10px] font-black uppercase tracking-wider shrink-0 border border-emerald-300">
            Sin Alertas
          </span>
        </div>
      )}

      {/* Pending Accidents Alert (Pending Investigations) */}
      {pendingAccidents.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 p-5 rounded-3xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <AlertTriangle className="text-amber-600 shrink-0" size={20} />
              <div>
                <h3 className="text-xs font-black text-amber-900 uppercase tracking-wider">
                  Accidentes Reportados Pendientes de Investigación ({pendingAccidents.length})
                </h3>
                <p className="text-[11px] text-amber-700">
                  La Resolución 1401/2007 establece un plazo de 15 días calendario para investigar todo accidente de trabajo.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
            {pendingAccidents.map(acc => {
              const existingInv = findInvestigationForRecord(acc, investigations);
              let daysElapsed = 0;
              try {
                if (acc.date) {
                  const pDate = parseISO(acc.date);
                  if (!isNaN(pDate.getTime())) {
                    const diff = differenceInCalendarDays(new Date(), pDate);
                    daysElapsed = isNaN(diff) ? 0 : Math.max(0, diff);
                  }
                }
              } catch {
                daysElapsed = 0;
              }
              const isOverdue = daysElapsed > 15;

              return (
                <div 
                  key={acc.id} 
                  className={`p-3.5 bg-white rounded-2xl flex flex-col justify-between space-y-2 shadow-xs border transition-all ${
                    isOverdue 
                      ? 'border-red-300 ring-1 ring-red-200 bg-red-50/20' 
                      : 'border-amber-200'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between text-[10px] font-bold mb-1">
                      <span className="flex items-center gap-1 text-gray-500">
                        <Calendar size={11} /> {acc.date}
                      </span>
                      {isOverdue ? (
                        <span className="bg-red-600 text-white px-2 py-0.5 rounded-full font-black flex items-center gap-1 animate-pulse">
                          <Flame size={10} /> +{daysElapsed}d (Vencida)
                        </span>
                      ) : (
                        <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-black">
                          {daysElapsed}d / 15d plazo
                        </span>
                      )}
                    </div>
                    <h4 className="text-xs font-extrabold text-gray-900">{acc.employeeName}</h4>
                    <p className="text-[10px] text-gray-500">{acc.position} • {acc.department}</p>
                    <p className="text-[10px] text-gray-600 line-clamp-2 mt-1 italic">
                      "{acc.description}"
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      if (existingInv) {
                        onEditInvestigation(existingInv);
                      } else {
                        onNewInvestigation(acc);
                      }
                    }}
                    className={`w-full py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-xs text-white ${
                      isOverdue 
                        ? 'bg-red-600 hover:bg-red-700 font-black shadow-red-200' 
                        : 'bg-emerald-600 hover:bg-emerald-700'
                    }`}
                  >
                    <GitFork size={13} />
                    {existingInv ? 'Completar y Finalizar Investigación' : isOverdue ? 'Investigar Inmediatamente (Vencida)' : 'Iniciar Investigación'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por trabajador, cargo o cédula..."
            className="w-full pl-10 pr-4 py-2 text-xs border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="flex items-center gap-1 text-xs text-gray-500 font-bold">
            <Filter size={14} /> Severidad:
          </div>
          <select
            className="p-2 text-xs border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none bg-white font-bold text-gray-700"
            value={filterSeverity}
            onChange={e => setFilterSeverity(e.target.value)}
          >
            <option value="all">Todas</option>
            <option value="Leve">Leve</option>
            <option value="Grave">Grave</option>
            <option value="Mortal">Mortal</option>
          </select>

          <div className="flex items-center gap-1 text-xs text-gray-500 font-bold ml-2">
            Estado:
          </div>
          <select
            className="p-2 text-xs border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none bg-white font-bold text-gray-700"
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
          >
            <option value="all">Todos</option>
            <option value="Borrador">Borrador</option>
            <option value="Finalizada">Finalizada</option>
          </select>
        </div>
      </div>

      {/* Investigations Table / Cards */}
      {filteredInvestigations.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-gray-200 space-y-3">
          <GitFork size={36} className="mx-auto text-gray-300" />
          <h3 className="text-sm font-black text-gray-700 uppercase tracking-wider">
            No se encontraron investigaciones registradas
          </h3>
          <p className="text-xs text-gray-400 max-w-md mx-auto">
            Seleccione un accidente reportado para iniciar el proceso de investigación bajo la Resolución 1401 de 2007.
          </p>
          <button
            type="button"
            onClick={() => onNewInvestigation()}
            className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition-colors inline-flex items-center gap-1.5 shadow-xs"
          >
            <Plus size={14} /> Iniciar Investigación Ahora
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredInvestigations.map(inv => {
            const hasSstSignature = !!inv.sstLeader?.signatureDataUrl;
            const hasLegalApproval = !!inv.legalRepApproval?.signatureDataUrl;
            const openActions = (inv.actionPlan || []).filter(a => a.status === 'Abierto').length;
            const closedActions = (inv.actionPlan || []).filter(a => a.status === 'Implementado').length;

            const matchingRecord = records.find(r => r.id === inv.recordId) ||
              records.find(r => {
                const invDoc = (inv.idNumber || '').trim();
                const rDoc = (r.idNumber || '').trim();
                return Boolean(invDoc && rDoc && invDoc === rDoc);
              });
            const effectiveAccidentDate = matchingRecord?.date || inv.accidentDate;
            const effectiveWorkerName = matchingRecord?.employeeName || inv.employeeName;
            const effectiveIdNumber = matchingRecord?.idNumber || inv.idNumber;
            const effectivePosition = matchingRecord?.position || inv.position;

            const isCompleted = isInvestigationCompleted(inv.status);

            let daysElapsed = 0;
            let isOverdue = false;
            try {
              if (effectiveAccidentDate) {
                const accDate = parseISO(effectiveAccidentDate);
                if (!isNaN(accDate.getTime())) {
                  if (isCompleted && inv.investigationDate) {
                    const invDate = parseISO(inv.investigationDate);
                    if (!isNaN(invDate.getTime())) {
                      const diff = differenceInCalendarDays(invDate, accDate);
                      daysElapsed = isNaN(diff) ? 0 : Math.max(0, diff);
                      isOverdue = daysElapsed > 15;
                    }
                  } else if (!isCompleted) {
                    const diff = differenceInCalendarDays(new Date(), accDate);
                    daysElapsed = isNaN(diff) ? 0 : Math.max(0, diff);
                    isOverdue = daysElapsed > 15;
                  }
                }
              }
            } catch {}

            return (
              <div key={inv.id} className="bg-white rounded-3xl border border-gray-200 p-5 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between space-y-4">
                
                {/* Card Top */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                      inv.severity === 'Grave' ? 'bg-amber-100 text-amber-800' :
                      inv.severity === 'Mortal' ? 'bg-red-100 text-red-800' :
                      'bg-emerald-100 text-emerald-800'
                    }`}>
                      Severidad: {inv.severity}
                    </span>

                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      isCompleted ? 'bg-emerald-100 text-emerald-800 border-emerald-200' :
                      inv.status === 'En Revisión' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                      'bg-amber-100 text-amber-800 border-amber-200'
                    }`}>
                      {inv.status === 'Cerrada' ? 'Cerrada / Culminada' : inv.status}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-extrabold text-gray-900 leading-snug">
                      {effectiveWorkerName}
                    </h3>
                    <p className="text-xs text-gray-500 font-medium">
                      C.C. {effectiveIdNumber} • {effectivePosition}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] text-gray-600 pt-1">
                    <div className="bg-gray-50 p-2 rounded-xl border border-gray-100">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-bold text-gray-400 uppercase">F. Accidente:</span>
                        <span className="text-[8px] font-bold text-emerald-700 bg-emerald-50 px-1 rounded border border-emerald-200">FURAT</span>
                      </div>
                      <span className="font-extrabold text-gray-900 block mt-0.5">{effectiveAccidentDate || '-'}</span>
                    </div>
                    <div className="bg-gray-50 p-2 rounded-xl border border-gray-100">
                      <span className="text-[9px] font-bold text-gray-400 uppercase block">F. Investigación:</span>
                      <span className="font-extrabold text-gray-900 block mt-0.5">{inv.investigationDate || '-'}</span>
                    </div>
                  </div>

                  {/* Legal Compliance Banner (Res. 1401/2007) */}
                  {effectiveAccidentDate && (
                    <div className={`px-2.5 py-1.5 rounded-xl text-[10px] font-bold flex items-center justify-between ${
                      isCompleted
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : isOverdue 
                          ? 'bg-red-100 text-red-900 border border-red-300 font-extrabold shadow-xs' 
                          : 'bg-amber-50 text-amber-800 border border-amber-200'
                    }`}>
                      <span className="flex items-center gap-1.5">
                        {isCompleted ? (
                          <CheckCircle2 size={12} className="text-emerald-600 shrink-0" />
                        ) : isOverdue ? (
                          <Flame size={12} className="text-red-600 shrink-0 animate-pulse" />
                        ) : (
                          <Clock size={12} className="text-amber-600 shrink-0" />
                        )}
                        <span>
                          {isCompleted
                            ? isOverdue 
                              ? `Investigación culminada (${daysElapsed} días tras evento)` 
                              : `Investigación culminada en plazo de ley (Res. 1401)`
                            : isOverdue 
                              ? `¡Plazo vencido! (${daysElapsed} días > 15d)` 
                              : `En plazo de investigación (${daysElapsed} de 15 días)`}
                        </span>
                      </span>
                      <span className="text-[9px] uppercase font-black tracking-wider">
                        {isCompleted ? 'Res. 1401 OK' : isOverdue ? '¡Alerta!' : 'Trámite'}
                      </span>
                    </div>
                  )}

                  {/* Summary of Causal Tree & Plan */}
                  <div className="p-3 bg-emerald-50/40 rounded-xl border border-emerald-100 text-[10px] space-y-1 text-emerald-900">
                    <div className="flex items-center justify-between font-bold">
                      <span>Árbol de Causas:</span>
                      <span>{(inv.immediateActs || []).length + (inv.immediateConditions || []).length} Inmediatas | {(inv.basicPersonalFactors || []).length + (inv.basicWorkFactors || []).length} Básicas</span>
                    </div>
                    <div className="flex items-center justify-between font-bold">
                      <span>Medidas de Control:</span>
                      <span>{closedActions} cerradas / {(inv.actionPlan || []).length} totales</span>
                    </div>
                    <div className="flex items-center justify-between font-bold pt-1 border-t border-emerald-100">
                      <span>Firmas:</span>
                      <span className="flex items-center gap-1">
                        {hasSstSignature ? <span className="text-emerald-700">✓ SST</span> : <span className="text-amber-700">✗ SST</span>}
                        •
                        {hasLegalApproval ? <span className="text-emerald-700">✓ Legal</span> : <span className="text-amber-700">✗ Legal</span>}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="pt-2 border-t border-gray-100 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => handleDownload(inv)}
                    className="flex-1 py-2 px-3 bg-white border border-gray-200 hover:border-emerald-500 text-gray-700 hover:text-emerald-700 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-xs"
                    title="Descargar informe oficial en PDF"
                  >
                    <Download size={14} className="text-emerald-600" />
                    Informe PDF
                  </button>

                  <button
                    type="button"
                    onClick={() => onEditInvestigation({
                      ...inv,
                      accidentDate: effectiveAccidentDate,
                      employeeName: effectiveWorkerName,
                      idNumber: effectiveIdNumber,
                      position: effectivePosition
                    })}
                    className="p-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-xl transition-colors"
                    title="Editar investigación"
                  >
                    <Edit3 size={15} />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (confirm(`¿Desea eliminar la investigación del accidente de ${inv.employeeName}?`)) {
                        onDeleteInvestigation(inv.id);
                      }
                    }}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                    title="Eliminar investigación"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>

              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
