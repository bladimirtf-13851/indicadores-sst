import { EventRecord, EventType, AccidentType } from '../types';
import { Calendar, User, MapPin, Clock, Trash2, ShieldAlert, AlertCircle, Activity, Edit2, Check, Mail, Paperclip } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

interface Props {
  records: EventRecord[];
  onDelete: (id: string) => void;
  onEdit: (record: EventRecord) => void;
}

export default function EventList({ records, onDelete, onEdit }: Props) {
  if (records.length === 0) {
    return (
      <div className="bg-white rounded-3xl p-16 text-center border border-dashed border-gray-200">
        <div className="bg-gray-50 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 text-gray-300">
          <Activity size={32} />
        </div>
        <p className="text-gray-500 font-medium">No hay registros todavía.</p>
        <p className="text-gray-400 text-sm mt-1">Comienza agregando un accidente, incidente o ausentismo.</p>
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
              <th className="px-6 py-5 text-[10px] font-bold uppercase tracking-widest text-gray-400">Detalle</th>
              <th className="px-6 py-5 text-[10px] font-bold uppercase tracking-widest text-gray-400">Días</th>
              <th className="px-6 py-5 text-[10px] font-bold uppercase tracking-widest text-gray-400">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {records.map((record) => (
              <tr key={record.id} className="hover:bg-gray-50/50 transition-colors group">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${
                      record.eventType === EventType.ACCIDENTE ? 'bg-emerald-50 text-emerald-600' :
                      record.eventType === EventType.INCIDENTE ? 'bg-blue-50 text-blue-600' :
                      'bg-amber-50 text-amber-600'
                    }`}>
                      {record.eventType === EventType.ACCIDENTE ? <ShieldAlert size={16} /> :
                       record.eventType === EventType.INCIDENTE ? <AlertCircle size={16} /> :
                       <Clock size={16} />}
                    </div>
                    <span className="text-sm font-bold text-gray-900">{record.eventType}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-500 font-medium">
                    {format(parseISO(record.date), 'dd MMM yyyy', { locale: es })}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm font-bold text-gray-900">{record.employeeName}</div>
                  <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{record.department}</div>
                </td>
                <td className="px-6 py-4">
                  {record.eventType === EventType.ACCIDENTE ? (
                    <div className="flex flex-col gap-2 max-w-xs">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider w-fit ${
                        record.accidentType === AccidentType.MORTAL ? 'bg-red-100 text-red-700' :
                        record.accidentType === AccidentType.INCAPACITANTE ? 'bg-amber-100 text-amber-700' :
                        'bg-emerald-100 text-emerald-700'
                      }`}>
                        {record.accidentType}
                      </span>
                      {record.correctiveActionsList && record.correctiveActionsList.length > 0 ? (
                        <div className="space-y-1.5 mt-1.5 border-t border-gray-100 pt-1.5">
                          <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Plan de Acción ({record.correctiveActionsList.length}):</p>
                          {record.correctiveActionsList.map((action, idx) => (
                            <div key={action.id || idx} className="text-[10px] bg-emerald-50/20 border border-emerald-100/50 p-2 rounded-xl space-y-1">
                              <div className="flex items-start justify-between gap-2">
                                <span className="font-bold text-gray-700 leading-tight block">{action.description}</span>
                                <span className={`shrink-0 px-1 py-0.5 rounded text-[8px] font-black uppercase ${
                                  action.status === 'Cerrado' ? 'bg-green-150 text-green-700' : 'bg-amber-150 text-amber-700'
                                }`}>
                                  {action.status}
                                </span>
                              </div>
                              <div className="text-[9px] text-gray-500 font-semibold font-mono">
                                Resp: {action.responsibleName} ({action.responsiblePosition})
                              </div>
                              <div className="text-[9px] text-gray-400 flex items-center gap-1">
                                <span>Ejecución: {action.executionDate}</span>
                                {action.notificationSent && (
                                  <span className="text-[8px] font-bold text-emerald-650 uppercase tracking-tighter" title={action.responsibleEmail}>
                                    (Email OK)
                                  </span>
                                )}
                              </div>
                              {action.status === 'Cerrado' && action.evidenceFileName && (
                                <div className="flex items-center gap-1.5 mt-1 pt-1 border-t border-emerald-100/50">
                                  <Paperclip size={10} className="text-emerald-600" />
                                  <a
                                    href={action.evidenceFileData}
                                    download={action.evidenceFileName}
                                    className="text-[9px] text-blue-600 font-bold underline hover:text-blue-800 truncate"
                                    title="Descargar evidencia PDF"
                                  >
                                    {action.evidenceFileName}
                                  </a>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : record.correctiveActions ? (
                        <p className="text-[10px] text-gray-550 italic leading-tight">
                          <span className="font-extrabold text-emerald-600 not-italic uppercase pr-1 text-[8px]">Acción:</span> 
                          {record.correctiveActions}
                        </p>
                      ) : null}
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
                    <div className="flex flex-col gap-2 max-w-xs">
                      {record.potentialCauses && (
                        <p className="text-[10px] text-gray-500 leading-tight">
                          <span className="font-extrabold text-blue-600 uppercase pr-1 text-[8px]">Causa:</span> 
                          {record.potentialCauses}
                        </p>
                      )}
                      {record.correctiveActionsList && record.correctiveActionsList.length > 0 ? (
                        <div className="space-y-1.5 mt-1.5 border-t border-gray-100 pt-1.5">
                          <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Plan de Acción ({record.correctiveActionsList.length}):</p>
                          {record.correctiveActionsList.map((action, idx) => (
                            <div key={action.id || idx} className="text-[10px] bg-blue-50/20 border border-blue-100/50 p-2 rounded-xl space-y-1">
                              <div className="flex items-start justify-between gap-2">
                                <span className="font-bold text-gray-700 leading-tight block">{action.description}</span>
                                <span className={`shrink-0 px-1 py-0.5 rounded text-[8px] font-black uppercase ${
                                  action.status === 'Cerrado' ? 'bg-green-150 text-green-700' : 'bg-amber-150 text-amber-700'
                                }`}>
                                  {action.status}
                                </span>
                              </div>
                              <div className="text-[9px] text-gray-500 font-semibold font-mono">
                                Resp: {action.responsibleName} ({action.responsiblePosition})
                              </div>
                              <div className="text-[9px] text-gray-400 flex items-center gap-1">
                                <span>Ejecución: {action.executionDate}</span>
                                {action.notificationSent && (
                                  <span className="text-[8px] font-bold text-emerald-650 uppercase tracking-tighter" title={action.responsibleEmail}>
                                    (Email OK)
                                  </span>
                                )}
                              </div>
                              {action.status === 'Cerrado' && action.evidenceFileName && (
                                <div className="flex items-center gap-1.5 mt-1 pt-1 border-t border-blue-100/50">
                                  <Paperclip size={10} className="text-blue-600" />
                                  <a
                                    href={action.evidenceFileData}
                                    download={action.evidenceFileName}
                                    className="text-[9px] text-blue-600 font-bold underline hover:text-blue-800 truncate"
                                    title="Descargar evidencia PDF"
                                  >
                                    {action.evidenceFileName}
                                  </a>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : record.correctiveActions ? (
                        <p className="text-[10px] text-gray-550 italic leading-tight">
                          <span className="font-extrabold text-emerald-600 not-italic uppercase pr-1 text-[8px]">Acción:</span> 
                          {record.correctiveActions}
                        </p>
                      ) : null}
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
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onEdit(record)}
                      className="p-2 text-gray-300 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                      title="Editar registro"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button
                      onClick={() => onDelete(record.id)}
                      className="p-2 text-gray-300 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                      title="Eliminar registro"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
