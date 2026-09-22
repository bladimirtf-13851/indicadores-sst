import React from 'react';
import { EventRecord, EventType, AccidentType, AccidentInvestigation } from '../types';
import { Calendar, User, MapPin, Clock, Trash2, ShieldAlert, AlertCircle, Activity, Edit2, GitFork, Flame } from 'lucide-react';
import { format, parseISO, differenceInCalendarDays } from 'date-fns';
import { es } from 'date-fns/locale';

interface Props {
  records: EventRecord[];
  investigations?: AccidentInvestigation[];
  onDelete: (id: string) => void;
  onEdit: (record: EventRecord) => void;
  onInvestigate?: (record: EventRecord) => void;
}

export default function EventList({ records, investigations = [], onDelete, onEdit, onInvestigate }: Props) {
  const finalizedRecordIds = new Set(
    investigations.filter(i => i.status === 'Finalizada').map(i => i.recordId)
  );
  const draftRecordIds = new Set(
    investigations.filter(i => i.status === 'Borrador').map(i => i.recordId)
  );
  if (records.length === 0) {
    return (
      <div className="bg-white rounded-3xl p-16 text-center border border-dashed border-gray-200">
        <div className="bg-gray-50 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 text-gray-300">
          <Activity size={32} />
        </div>
        <p className="text-gray-500 font-medium">No hay registros todavía.</p>
        <p className="text-gray-400 text-sm mt-1">Comienza agregando un accidente (FURAT), incidente o ausentismo.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-gray-50/50 border-b border-gray-100">
              <th className="px-6 py-5 text-[10px] font-bold uppercase tracking-widest text-gray-400">Evento</th>
              <th className="px-6 py-5 text-[10px] font-bold uppercase tracking-widest text-gray-400">Fecha</th>
              <th className="px-6 py-5 text-[10px] font-bold uppercase tracking-widest text-gray-400">Trabajador</th>
              <th className="px-6 py-5 text-[10px] font-bold uppercase tracking-widest text-gray-400">Detalle / Lesión</th>
              <th className="px-6 py-5 text-[10px] font-bold uppercase tracking-widest text-gray-400">Días</th>
              <th className="px-6 py-5 text-[10px] font-bold uppercase tracking-widest text-gray-400">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {records.map((record) => {
              const isAccident = record.eventType === EventType.ACCIDENTE;
              let daysElapsed = 0;
              if (isAccident) {
                try {
                  daysElapsed = differenceInCalendarDays(new Date(), parseISO(record.date));
                } catch {
                  daysElapsed = 0;
                }
              }
              const isInvestigated = finalizedRecordIds.has(record.id);
              const isOverdue = isAccident && !isInvestigated && daysElapsed > 15;
              const isDraft = isAccident && draftRecordIds.has(record.id);

              return (
              <tr 
                key={record.id} 
                className={`transition-colors group ${
                  isOverdue 
                    ? 'bg-red-50/40 hover:bg-red-50/70 border-l-4 border-l-red-500' 
                    : 'hover:bg-gray-50/50'
                }`}
              >
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${
                      isOverdue ? 'bg-red-100 text-red-700' :
                      record.eventType === EventType.ACCIDENTE ? 'bg-emerald-50 text-emerald-600' :
                      record.eventType === EventType.INCIDENTE ? 'bg-blue-50 text-blue-600' :
                      'bg-amber-50 text-amber-600'
                    }`}>
                      {record.eventType === EventType.ACCIDENTE ? <ShieldAlert size={16} /> :
                       record.eventType === EventType.INCIDENTE ? <AlertCircle size={16} /> :
                       <Clock size={16} />}
                    </div>
                    <div>
                      <span className="text-sm font-bold text-gray-900 block">{record.eventType}</span>
                      {record.eventType === EventType.ACCIDENTE && (
                        <div className="flex items-center gap-1 mt-0.5">
                          <span className="text-[9px] font-black uppercase text-emerald-700">FURAT</span>
                          {isOverdue && (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 bg-red-600 text-white rounded text-[8px] font-black uppercase animate-pulse">
                              <Flame size={9} /> +15d Vencida
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-700 font-medium">
                    {format(parseISO(record.date), 'dd MMM yyyy', { locale: es })}
                  </div>
                  {record.time && (
                    <span className="text-[10px] text-gray-400 font-mono">{record.time}</span>
                  )}
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm font-bold text-gray-900">{record.employeeName}</div>
                  <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                    {record.position} • {record.department}
                  </div>
                </td>
                <td className="px-6 py-4">
                  {record.eventType === EventType.ACCIDENTE ? (
                    <div className="flex flex-col gap-1 max-w-xs">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider w-fit ${
                        record.accidentType === AccidentType.MORTAL ? 'bg-red-100 text-red-700' :
                        record.accidentType === AccidentType.INCAPACITANTE ? 'bg-amber-100 text-amber-700' :
                        'bg-emerald-100 text-emerald-700'
                      }`}>
                        {record.accidentType}
                      </span>
                      {record.injuryType && record.injuryType.length > 0 && (
                        <p className="text-[10px] text-gray-500 truncate" title={record.injuryType.join(', ')}>
                          <span className="font-bold text-gray-700">Lesión:</span> {record.injuryType.join(', ')}
                        </p>
                      )}
                      {record.location && (
                        <p className="text-[10px] text-gray-400 truncate">
                          <span className="font-bold">Sitio:</span> {record.location}
                        </p>
                      )}
                    </div>
                  ) : record.eventType === EventType.AUSENTISMO ? (
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                        {record.isNewCase ? 'Caso Nuevo' : 'Caso Antiguo'}
                      </span>
                      <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider w-fit ${
                        record.origin === 'Laboral' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {record.origin}
                      </span>
                    </div>
                  ) : record.eventType === EventType.INCIDENTE ? (
                    <div className="flex flex-col gap-1 max-w-xs">
                      <p className="text-[11px] text-gray-600 line-clamp-2 italic">
                        "{record.description}"
                      </p>
                    </div>
                  ) : (
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">-</span>
                  )}
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm font-bold text-gray-900">
                    {record.lostDays + (record.chargedDays || 0)} <span className="text-gray-400 font-medium">días</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-1.5">
                    {record.eventType === EventType.ACCIDENTE && onInvestigate && (
                      <button
                        onClick={() => onInvestigate(record)}
                        className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
                          isOverdue 
                            ? 'bg-red-600 hover:bg-red-700 text-white font-black shadow-xs' 
                            : isDraft
                            ? 'bg-amber-100 hover:bg-amber-200 text-amber-900'
                            : isInvestigated
                            ? 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                            : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                        }`}
                        title={isOverdue ? 'Investigación vencida: han transcurrido más de 15 días calendario (Res. 1401/2007)' : 'Investigar según Res. 1401/2007'}
                      >
                        <GitFork size={13} />
                        <span className="hidden sm:inline">
                          {isOverdue ? 'Investigar Ya (+15d)' : isDraft ? 'Completar' : isInvestigated ? 'Ver Inv.' : 'Investigar'}
                        </span>
                      </button>
                    )}
                    <button
                      onClick={() => onEdit(record)}
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                      title="Editar registro"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => onDelete(record.id)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                      title="Eliminar registro"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
