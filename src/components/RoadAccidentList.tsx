import React, { useState } from 'react';
import { Company, RoadAccidentReport } from '../types';
import { generateRoadAccidentPdf } from '../services/roadAccidentPdfService';
import {
  Car,
  Plus,
  Search,
  MapPin,
  Calendar,
  Users,
  AlertTriangle,
  FileDown,
  Edit3,
  Trash2,
  CheckCircle2,
  Clock,
  ShieldAlert,
} from 'lucide-react';

interface Props {
  company: Company | null;
  reports: RoadAccidentReport[];
  onNewReport: () => void;
  onEditReport: (report: RoadAccidentReport) => void;
  onDeleteReport: (id: string) => void;
}

export default function RoadAccidentList({
  company,
  reports,
  onNewReport,
  onEditReport,
  onDeleteReport,
}: Props) {
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');

  const filteredReports = reports
    .filter(r => {
      if (severityFilter !== 'ALL' && r.severity !== severityFilter) return false;
      if (!searchTerm.trim()) return true;
      const q = searchTerm.toLowerCase();
      const plates = (r.vehicles || []).map(v => v.plate?.toLowerCase()).join(' ');
      const drivers = (r.drivers || []).map(d => d.fullName?.toLowerCase()).join(' ');
      return (
        r.address?.toLowerCase().includes(q) ||
        r.municipality?.toLowerCase().includes(q) ||
        r.code?.toLowerCase().includes(q) ||
        plates.includes(q) ||
        drivers.includes(q)
      );
    })
    .sort((a, b) => (b.accidentDate || '').localeCompare(a.accidentDate || ''));

  const totalVehicles = reports.reduce((acc, r) => acc + (r.vehicles?.length || 0), 0);
  const totalInjured = reports.reduce((acc, r) => acc + (r.injuries?.length || 0), 0);
  const signedCount = reports.filter(r => r.status === 'Firmado y Validado' || r.status === 'Cerrado').length;

  return (
    <div className="space-y-6">
      {/* Summary KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-gray-400">Total Siniestros Viales</p>
            <p className="text-2xl font-extrabold text-gray-900 mt-1 tabular-nums">{reports.length}</p>
            <p className="text-[11px] text-gray-500 mt-1">Eventos registrados en PESV</p>
          </div>
          <div className="p-3.5 bg-slate-100 text-slate-800 rounded-2xl">
            <Car size={22} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-gray-400">Vehículos Involucrados</p>
            <p className="text-2xl font-extrabold text-blue-600 mt-1 tabular-nums">{totalVehicles}</p>
            <p className="text-[11px] text-gray-500 mt-1">Con control de SOAT y RTM</p>
          </div>
          <div className="p-3.5 bg-blue-50 text-blue-600 rounded-2xl">
            <Users size={22} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-gray-400">Personas Lesionadas</p>
            <p className="text-2xl font-extrabold text-red-600 mt-1 tabular-nums">{totalInjured}</p>
            <p className="text-[11px] text-gray-500 mt-1">Conductores, pasajeros o peatones</p>
          </div>
          <div className="p-3.5 bg-red-50 text-red-600 rounded-2xl">
            <AlertTriangle size={22} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-gray-400">Informes Validados</p>
            <p className="text-2xl font-extrabold text-emerald-600 mt-1 tabular-nums">{signedCount}</p>
            <p className="text-[11px] text-gray-500 mt-1">Con croquis y firmas de conformidad</p>
          </div>
          <div className="p-3.5 bg-emerald-50 text-emerald-600 rounded-2xl">
            <CheckCircle2 size={22} />
          </div>
        </div>
      </div>

      {/* Action & Filter Bar */}
      <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="flex flex-1 items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por placa, conductor, dirección, código..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-semibold outline-none focus:bg-white focus:border-emerald-500"
            />
          </div>

          <div className="hidden sm:flex items-center gap-1 bg-gray-100 p-1 rounded-xl">
            {[
              { id: 'ALL', label: 'Todos' },
              { id: 'Solo Daños Materiales', label: 'Solo Daños' },
              { id: 'Con Lesionados', label: 'Con Lesionados' },
              { id: 'Con Fallecidos', label: 'Con Fallecidos' },
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSeverityFilter(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap shrink-0 ${
                  severityFilter === tab.id
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={onNewReport}
          className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-extrabold flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition-all whitespace-nowrap shrink-0"
        >
          <Plus size={16} />
          Nuevo Reporte de Siniestro Vial
        </button>
      </div>

      {/* Reports List */}
      {filteredReports.length === 0 ? (
        <div className="bg-white rounded-3xl border border-gray-100 p-12 text-center space-y-4">
          <div className="w-16 h-16 bg-slate-100 text-slate-500 rounded-3xl flex items-center justify-center mx-auto">
            <Car size={32} />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h3 className="text-base font-extrabold text-gray-900">
              No hay siniestros viales registrados
            </h3>
            <p className="text-xs text-gray-500">
              Registre accidentes de tránsito incluyendo coordenadas GPS, estado de la vía, conductores, SOAT/RTM, daños materiales, croquis topográfico y firmas de conformidad.
            </p>
          </div>
          <button
            type="button"
            onClick={onNewReport}
            className="px-5 py-2.5 bg-slate-900 hover:bg-black text-white rounded-2xl text-xs font-bold inline-flex items-center gap-2 transition-colors"
          >
            <Plus size={15} />
            Crear Primer Reporte Vial
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredReports.map(report => {
            const plates = (report.vehicles || []).map(v => v.plate || 'S/P').join(' · ');
            const driverNames = (report.drivers || []).map(d => d.fullName || 'Sin nombre').join(', ');

            return (
              <div
                key={report.id}
                className="bg-white rounded-3xl border border-gray-200/80 p-5 hover:border-gray-300 transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-5"
              >
                <div className="space-y-2 flex-1">
                  {/* Clean unboxed metadata row */}
                  <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500 font-semibold">
                    <span className="font-mono font-bold text-slate-900">
                      {report.code || report.id.slice(0, 8).toUpperCase()}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="tabular-nums">
                      {report.accidentDate} {report.accidentTime}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>{report.collisionType}</span>
                    <span aria-hidden="true">·</span>
                    <span
                      className={
                        report.severity === 'Con Fallecidos'
                          ? 'text-red-700 font-bold'
                          : report.severity === 'Con Lesionados'
                          ? 'text-amber-700 font-bold'
                          : 'text-emerald-700 font-bold'
                      }
                    >
                      {report.severity}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="text-slate-700 font-bold">{report.status}</span>
                  </div>

                  <h4 className="text-base font-extrabold text-gray-900 flex items-center gap-2">
                    <MapPin size={16} className="text-emerald-600 shrink-0" />
                    <span>
                      {report.address}
                      {report.municipality ? `, ${report.municipality}` : ''}
                    </span>
                  </h4>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-600">
                    <span>
                      <strong className="text-gray-800">Vehículos ({report.vehicles?.length || 0}):</strong>{' '}
                      <span className="font-mono">{plates || 'N/A'}</span>
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>
                      <strong className="text-gray-800">Conductores:</strong> {driverNames || 'N/A'}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>
                      <strong className="text-gray-800">Vía / Clima:</strong> {report.roadSurfaceCondition} / {report.weatherCondition}
                    </span>
                    {report.authority?.officerName && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span>
                          <strong className="text-gray-800">Agente:</strong> {report.authority.officerName} (Placa {report.authority.badgeNumber || '-'})
                        </span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => generateRoadAccidentPdf(report, company)}
                    className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
                    title="Descargar Informe PDF con Croquis y Firmas"
                  >
                    <FileDown size={15} />
                    Informe PDF
                  </button>
                  <button
                    type="button"
                    onClick={() => onEditReport(report)}
                    className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
                  >
                    <Edit3 size={15} />
                    Ver / Editar
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteReport(report.id)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                    title="Eliminar Reporte"
                  >
                    <Trash2 size={16} />
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
