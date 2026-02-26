import { EventRecord, EventType, AccidentType } from '../types';
import { Calendar, User, MapPin, Clock, Trash2, ShieldAlert, AlertCircle, Activity } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

interface Props {
  records: EventRecord[];
  onDelete: (id: string) => void;
}

export default function EventList({ records, onDelete }: Props) {
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
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                      record.accidentType === AccidentType.MORTAL ? 'bg-red-100 text-red-700' :
                      record.accidentType === AccidentType.INCAPACITANTE ? 'bg-amber-100 text-amber-700' :
                      'bg-emerald-100 text-emerald-700'
                    }`}>
                      {record.accidentType}
                    </span>
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
                  <button
                    onClick={() => onDelete(record.id)}
                    className="p-2 text-gray-300 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
