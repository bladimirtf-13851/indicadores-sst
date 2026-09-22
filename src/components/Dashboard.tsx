import { 
  MonthlyIndicator, 
  YearlyIndicator, 
  Company, 
  EventRecord, 
  AccidentInvestigation, 
  EventType, 
  AccidentType 
} from '../types';
import { useState, useEffect, useRef, useMemo } from 'react';
import { format, parseISO, differenceInCalendarDays } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
  AreaChart,
  Area
} from 'recharts';
import { 
  TrendingUp, 
  Activity, 
  AlertTriangle, 
  HeartPulse, 
  Stethoscope, 
  Clock, 
  Calendar, 
  ChevronDown, 
  Check, 
  Filter, 
  Users, 
  AlertCircle, 
  Edit3, 
  HelpCircle,
  FileDown,
  Loader2,
  GitFork,
  ShieldAlert,
  ArrowRight,
  Flame,
  ChevronRight,
  CheckCircle2
} from 'lucide-react';
import { generateMonthlyIndicatorsFuratPdf } from '../services/pdfReportService';
import { 
  isInvestigationCompleted, 
  isInvestigationInProgress, 
  findInvestigationForRecord 
} from '../utils/investigationUtils';

interface Props {
  data: MonthlyIndicator[];
  yearlyData: YearlyIndicator[];
  selectedMonth?: string;
  onMonthChange?: (month: string) => void;
  onUpdateEmployeeCount?: (month: string, count: number) => void;
  company?: Company | null;
  records?: EventRecord[];
  investigations?: AccidentInvestigation[];
  programmedDays?: number;
  onNavigateToInvestigation?: (record?: EventRecord) => void;
}

export default function Dashboard({ 
  data, 
  yearlyData, 
  selectedMonth: externalSelectedMonth,
  onMonthChange,
  onUpdateEmployeeCount,
  company,
  records = [],
  investigations = [],
  programmedDays = 0,
  onNavigateToInvestigation
}: Props) {
  const [selectedYears, setSelectedYears] = useState<string[]>([]);
  const [selectedIndicator, setSelectedIndicator] = useState<keyof YearlyIndicator>('frecuencia');
  const [showYearDropdown, setShowYearDropdown] = useState(false);
  const [editingEmployees, setEditingEmployees] = useState(false);
  const [tempEmployeeCount, setTempEmployeeCount] = useState<number>(0);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const yearDropdownRef = useRef<HTMLDivElement>(null);

  // Identify accidents with pending investigations and calculate calendar days passed
  const { overdueAccidents, nonOverduePendingAccidents, allAccidentsCount, completedInvestigationsCount } = useMemo(() => {
    const now = new Date();
    const overdueList: Array<{
      record: EventRecord;
      daysElapsed: number;
      isDraft: boolean;
      isInProgress: boolean;
      investigationId?: string;
      statusText: string;
    }> = [];

    const nonOverdueList: Array<{
      record: EventRecord;
      daysElapsed: number;
      isDraft: boolean;
      isInProgress: boolean;
      investigationId?: string;
      statusText: string;
    }> = [];

    const accidentRecords = records.filter(r => r.eventType === EventType.ACCIDENTE);
    let completedCount = 0;

    accidentRecords.forEach(rec => {
      const inv = findInvestigationForRecord(rec, investigations);
      const isCompleted = inv ? isInvestigationCompleted(inv.status) : false;

      if (isCompleted) {
        completedCount++;
        return; // Completed investigations are neither pending nor overdue
      }

      let daysElapsed = 0;
      try {
        const accidentDate = parseISO(rec.date);
        daysElapsed = differenceInCalendarDays(now, accidentDate);
      } catch (e) {
        daysElapsed = 0;
      }

      const isDraft = inv ? (inv.status === 'Borrador') : false;
      const isInProgress = inv ? isInvestigationInProgress(inv.status) : false;

      let statusText = 'Sin investigación iniciada';
      if (inv) {
        if (inv.status === 'En Revisión') {
          statusText = 'Investigación en revisión por equipo';
        } else if (inv.status === 'Borrador') {
          statusText = 'Investigación en borrador (incompleta)';
        } else {
          statusText = `Investigación: ${inv.status}`;
        }
      }

      const item = {
        record: rec,
        daysElapsed: Math.max(0, daysElapsed),
        isDraft,
        isInProgress,
        investigationId: inv?.id,
        statusText
      };

      if (daysElapsed > 15) {
        overdueList.push(item);
      } else {
        nonOverdueList.push(item);
      }
    });

    // Sort overdue by longest time elapsed descending
    overdueList.sort((a, b) => b.daysElapsed - a.daysElapsed);
    nonOverdueList.sort((a, b) => b.daysElapsed - a.daysElapsed);

    return {
      overdueAccidents: overdueList,
      nonOverduePendingAccidents: nonOverdueList,
      allAccidentsCount: accidentRecords.length,
      completedInvestigationsCount: completedCount
    };
  }, [records, investigations]);

  useEffect(() => {
    // Default to show all years if none selected
    if (selectedYears.length === 0 && yearlyData.length > 0) {
      setSelectedYears(yearlyData.map(y => y.year));
    }
  }, [yearlyData]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (yearDropdownRef.current && !yearDropdownRef.current.contains(event.target as Node)) {
        setShowYearDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleYear = (year: string) => {
    setSelectedYears(prev => 
      prev.includes(year) 
        ? prev.filter(y => y !== year) 
        : [...prev, year]
    );
  };

  const filteredYearlyData = yearlyData
    .filter(y => selectedYears.includes(y.year))
    .sort((a, b) => a.year.localeCompare(b.year));

  const indicators = [
    { key: 'frecuencia' as const, label: 'Frecuencia AT', color: '#10b981', icon: Activity },
    { key: 'severidad' as const, label: 'Severidad AT', color: '#f59e0b', icon: TrendingUp },
    { key: 'mortalidad' as const, label: 'Mortalidad AT', color: '#ef4444', icon: AlertTriangle },
    { key: 'incidenciaEL' as const, label: 'Incidencia EL', color: '#6366f1', icon: Stethoscope },
    { key: 'prevalenciaEL' as const, label: 'Prevalencia EL', color: '#f43f5e', icon: HeartPulse },
    { key: 'ausentismoMedica' as const, label: 'Ausentismo Médico', color: '#3b82f6', icon: Clock },
  ];

  const activeIndicator = indicators.find(i => i.key === selectedIndicator) || indicators[0];

  const getDefaultMonth = () => {
    const current = format(new Date(), 'yyyy-MM');
    const currentData = data.find(d => d.month === current);
    
    if (currentData && (currentData.frecuencia > 0 || currentData.severidad > 0 || currentData.accidentCount > 0)) {
      return current;
    }
    
    const nonZeroMonths = data.filter(d => d.frecuencia > 0 || d.severidad > 0 || d.accidentCount > 0);
    if (nonZeroMonths.length > 0) {
      const sorted = [...nonZeroMonths].sort((a, b) => b.month.localeCompare(a.month));
      return sorted[0].month;
    }
    
    return current;
  };

  const [internalSelectedMonth, setInternalSelectedMonth] = useState<string>(getDefaultMonth);
  const activeMonth = externalSelectedMonth || internalSelectedMonth;

  const handleSelectMonth = (m: string) => {
    setInternalSelectedMonth(m);
    if (onMonthChange) {
      onMonthChange(m);
    }
  };

  const latest = data.find(d => d.month === activeMonth) || data.find(d => d.month === format(new Date(), 'yyyy-MM')) || data[data.length - 1] || { 
    month: activeMonth,
    frecuencia: 0, 
    severidad: 0, 
    mortalidad: 0, 
    prevalenciaEL: 0, 
    incidenciaEL: 0, 
    ausentismoMedica: 0,
    ausentismoComun: 0,
    accidentCount: 0,
    incidentCount: 0,
    absenteeismCount: 0,
    lostDaysTotal: 0,
    employeeCount: 0 
  };

  useEffect(() => {
    setTempEmployeeCount(latest.employeeCount || 0);
  }, [latest.employeeCount]);

  const handleSaveEmployees = () => {
    if (onUpdateEmployeeCount && tempEmployeeCount >= 0) {
      onUpdateEmployeeCount(activeMonth, tempEmployeeCount);
    }
    setEditingEmployees(false);
  };

  const formatMonth = (monthStr: string) => {
    try {
      return format(parseISO(`${monthStr}-01`), 'MMM', { locale: es });
    } catch (e) {
      return monthStr;
    }
  };

  const formatMonthFull = (monthStr: string) => {
    try {
      const formatted = format(parseISO(`${monthStr}-01`), 'MMMM yyyy', { locale: es });
      return formatted.charAt(0).toUpperCase() + formatted.slice(1);
    } catch (e) {
      return monthStr;
    }
  };

  // Explanation strings according to official formula
  const frequencyFormula = latest.employeeCount > 0
    ? `(${latest.accidentCount} AT × 100) / ${latest.employeeCount} trabajadores = ${latest.frecuencia.toFixed(2)}`
    : `Requiere configurar trabajadores del mes (Fórmula: Nº AT * 100 / Nº Trabajadores)`;

  // Recover month-specific lost days from formula
  const lostDaysCalc = latest.employeeCount > 0 
    ? Math.round((latest.severidad * latest.employeeCount) / 100)
    : 0;

  const severityFormula = latest.employeeCount > 0
    ? `(${lostDaysCalc} días en mes × 100) / ${latest.employeeCount} trab. = ${latest.severidad.toFixed(2)}`
    : `Requiere configurar trabajadores del mes`;

  const handleExportPdf = () => {
    try {
      setIsExportingPdf(true);
      generateMonthlyIndicatorsFuratPdf({
        month: activeMonth,
        indicator: latest,
        records: records,
        company: company,
        programmedDays: programmedDays
      });
    } catch (err) {
      console.error('Error al generar PDF de indicadores:', err);
      alert('Ocurrió un error al generar el PDF de indicadores: ' + (err instanceof Error ? err.message : 'Error'));
    } finally {
      setIsExportingPdf(false);
    }
  };

  return (
    <div className="space-y-12">
      {/* Alerta Destacada: Investigaciones Pendientes Vencidas (+15 días según Res. 1401/2007) */}
      {overdueAccidents.length > 0 && (
        <div 
          id="alerta-investigaciones-vencidas"
          className="relative overflow-hidden bg-linear-to-r from-red-600 via-rose-600 to-amber-600 p-0.5 rounded-3xl shadow-xl shadow-red-500/15"
        >
          <div className="bg-linear-to-br from-red-950/95 via-rose-950/90 to-neutral-900 text-white p-6 sm:p-7 rounded-[22px] space-y-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-red-500/20 pb-4">
              <div className="flex items-start sm:items-center gap-3.5">
                <div className="p-3 bg-red-500/20 text-red-400 rounded-2xl border border-red-400/30 shrink-0 relative">
                  <Flame size={24} className="animate-bounce" />
                  <span className="absolute -top-1 -right-1 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                  </span>
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base sm:text-lg font-black tracking-tight text-white flex items-center gap-2">
                      Alerta Legal: {overdueAccidents.length} {overdueAccidents.length === 1 ? 'Accidente con Investigación Vencida' : 'Accidentes con Investigaciones Vencidas'}
                    </h3>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-red-500 text-white border border-red-400 animate-pulse">
                      +15 Días Calendario
                    </span>
                  </div>
                  <p className="text-xs text-rose-200/90 mt-1 font-medium leading-relaxed max-w-3xl">
                    Conforme al <strong>Artículo 4 de la Resolución 1401 de 2007</strong>, la empresa debe remitir y culminar la investigación de todo accidente de trabajo dentro de los <strong>15 días calendario</strong> siguientes a su ocurrencia. El incumplimiento acarrea sanciones legales y requerimientos de la ARL o del Ministerio del Trabajo.
                  </p>
                </div>
              </div>

              {onNavigateToInvestigation && (
                <button
                  type="button"
                  onClick={() => onNavigateToInvestigation()}
                  className="px-4 py-2.5 bg-white hover:bg-rose-50 text-red-900 font-extrabold rounded-2xl text-xs transition-all flex items-center justify-center gap-2 shadow-lg shrink-0 self-start md:self-auto cursor-pointer"
                >
                  <GitFork size={15} className="text-red-600" />
                  <span>Ir a Investigaciones</span>
                  <ChevronRight size={15} />
                </button>
              )}
            </div>

            {/* List of overdue cases */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {overdueAccidents.map(({ record, daysElapsed, isDraft, isInProgress, statusText }) => (
                <div 
                  key={record.id} 
                  className="bg-black/30 backdrop-blur-md border border-red-500/30 hover:border-red-400/60 p-4 rounded-2xl flex flex-col justify-between space-y-3 transition-all group"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-red-500/20 text-red-300 border border-red-500/40">
                        {record.accidentType || 'Accidente'}
                      </span>
                      <span className="inline-flex items-center gap-1 text-[11px] font-black text-rose-300 bg-red-900/60 px-2 py-0.5 rounded-full border border-red-700/50">
                        <Clock size={12} className="text-red-400" />
                        {daysElapsed} días transcurridos
                      </span>
                    </div>

                    <div>
                      <h4 className="text-sm font-black text-white group-hover:text-rose-200 transition-colors">
                        {record.employeeName}
                      </h4>
                      <p className="text-[11px] text-zinc-300 font-medium mt-0.5">
                        {record.position} {record.department ? `• ${record.department}` : ''}
                      </p>
                    </div>

                    <div className="flex items-center gap-3 text-[11px] text-zinc-400">
                      <span className="flex items-center gap-1 font-semibold">
                        <Calendar size={12} className="text-zinc-400" />
                        Fecha AT: {record.date}
                      </span>
                      <span>•</span>
                      <span className="font-semibold text-rose-300">
                        {record.lostDays} días inc.
                      </span>
                    </div>

                    {record.description && (
                      <p className="text-[11px] text-zinc-400 italic line-clamp-2 bg-black/20 p-2 rounded-xl border border-white/5">
                        "{record.description}"
                      </p>
                    )}

                    <div className="text-[10px] font-bold">
                      {isDraft ? (
                        <span className="text-amber-300 flex items-center gap-1">
                          <AlertCircle size={12} /> {statusText}
                        </span>
                      ) : isInProgress ? (
                        <span className="text-blue-300 flex items-center gap-1">
                          <Activity size={12} /> {statusText}
                        </span>
                      ) : (
                        <span className="text-red-400 flex items-center gap-1">
                          <ShieldAlert size={12} /> {statusText}
                        </span>
                      )}
                    </div>
                  </div>

                  {onNavigateToInvestigation && (
                    <button
                      type="button"
                      onClick={() => onNavigateToInvestigation(record)}
                      className="w-full py-2 bg-red-600 hover:bg-red-500 active:scale-[0.98] text-white rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 shadow-md shadow-red-900/50 cursor-pointer"
                    >
                      <GitFork size={13} />
                      {isDraft || isInProgress ? 'Continuar y Finalizar Investigación' : 'Iniciar Investigación Inmediata'}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Reassurance Banner: When accidents exist and all have completed investigations */}
      {allAccidentsCount > 0 && overdueAccidents.length === 0 && (
        <div className="bg-gradient-to-r from-emerald-950 via-teal-950 to-neutral-900 border border-emerald-500/30 p-5 rounded-3xl shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-white">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-2xl border border-emerald-500/30 shrink-0">
              <CheckCircle2 size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm sm:text-base font-extrabold text-white">
                  Investigaciones al Día (Resolución 1401 de 2007)
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  100% Culminadas
                </span>
              </div>
              <p className="text-xs text-emerald-200/80 mt-0.5 font-medium">
                Los {allAccidentsCount} accidentes reportados cuentan con su investigación realizada y culminada satisfactoriamente.
              </p>
            </div>
          </div>

          {onNavigateToInvestigation && (
            <button
              type="button"
              onClick={() => onNavigateToInvestigation()}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-emerald-200 border border-emerald-500/30 font-bold rounded-xl text-xs transition-all flex items-center gap-1.5 shrink-0 self-start sm:self-auto cursor-pointer"
            >
              <GitFork size={14} />
              <span>Ver Expedientes</span>
              <ChevronRight size={14} />
            </button>
          )}
        </div>
      )}

      {/* Primary Indicators Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Accidentalidad Section */}
        <div className="lg:col-span-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <div>
              <h4 className="text-xs font-black text-gray-800 uppercase tracking-[0.2em] flex items-center gap-2">
                Indicadores de Accidentalidad Laboral
                <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold lowercase">
                  res. 0312/2019
                </span>
              </h4>
              <p className="text-[11px] text-gray-500 mt-0.5">
                Cálculo legal reglamentario sobre la población trabajadora y días perdidos cronológicos.
              </p>
            </div>
            
            {/* Month Filter Selector, Worker Config & PDF Export */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 bg-white px-3 py-1.5 border border-gray-200 rounded-xl shadow-xs">
                <span className="text-xs font-black text-gray-500 uppercase tracking-wider">Período:</span>
                <select
                  value={activeMonth}
                  onChange={(e) => handleSelectMonth(e.target.value)}
                  className="bg-transparent text-xs font-bold text-gray-900 outline-none cursor-pointer"
                >
                  {data.map(d => (
                    <option key={d.month} value={d.month}>
                      {formatMonthFull(d.month)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Workers in this specific month badge / editor */}
              <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl text-emerald-950">
                <Users size={14} className="text-emerald-700" />
                <span className="text-xs font-bold text-emerald-800">Trabajadores mes:</span>
                {editingEmployees ? (
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min="0"
                      className="w-14 px-1.5 py-0.5 bg-white border border-emerald-500 rounded text-xs font-black outline-none"
                      value={tempEmployeeCount}
                      onChange={e => setTempEmployeeCount(parseInt(e.target.value) || 0)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') handleSaveEmployees();
                        if (e.key === 'Escape') setEditingEmployees(false);
                      }}
                      autoFocus
                    />
                    <button
                      onClick={handleSaveEmployees}
                      className="px-2 py-0.5 bg-emerald-600 text-white rounded text-[10px] font-bold"
                    >
                      OK
                    </button>
                  </div>
                ) : (
                  <div 
                    onClick={() => {
                      if (onUpdateEmployeeCount) setEditingEmployees(true);
                    }}
                    className="flex items-center gap-1.5 cursor-pointer group"
                    title="Haga clic para modificar el número de trabajadores en este mes"
                  >
                    <span className="text-xs font-black text-emerald-900">
                      {latest.employeeCount > 0 ? latest.employeeCount : (
                        <span className="text-amber-700 font-bold underline">Sin asignar (0)</span>
                      )}
                    </span>
                    {onUpdateEmployeeCount && (
                      <Edit3 size={12} className="text-emerald-600 opacity-60 group-hover:opacity-100" />
                    )}
                  </div>
                )}
              </div>

              {/* PDF Export Button */}
              <button
                type="button"
                onClick={handleExportPdf}
                disabled={isExportingPdf}
                title="Descargar informe mensual de indicadores y resumen FURAT conforme a la Res. 0312 de 2019"
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white px-3.5 py-2 rounded-xl text-xs font-black shadow-md shadow-emerald-200 transition-all cursor-pointer disabled:opacity-50"
              >
                {isExportingPdf ? (
                  <Loader2 size={15} className="animate-spin" />
                ) : (
                  <FileDown size={15} />
                )}
                <span>Exportar Informe PDF</span>
              </button>
            </div>
          </div>

          {/* Alert if workers is 0 */}
          {latest.employeeCount === 0 && (
            <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-between gap-3 text-amber-900">
              <div className="flex items-center gap-2.5 text-xs font-bold">
                <AlertCircle size={18} className="text-amber-600 shrink-0" />
                <span>
                  Para calcular con exactitud los Índices de Frecuencia y Severidad de <strong>{formatMonthFull(activeMonth)}</strong>, ingresa el número de trabajadores de la empresa en este mes (Fórmula: Nº AT * 100 / Trabajadores).
                </span>
              </div>
              {onUpdateEmployeeCount && (
                <button
                  onClick={() => setEditingEmployees(true)}
                  className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-black text-xs rounded-xl shrink-0 transition-colors"
                >
                  Asignar Trabajadores
                </button>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <IndicatorCard 
              title="Frecuencia AT" 
              value={latest.frecuencia} 
              unit="" 
              icon={Activity} 
              color="emerald" 
              desc="Accidentes por cada 100 trabajadores en el mes"
              formula={frequencyFormula}
              hasWorkers={latest.employeeCount > 0}
            />
            <IndicatorCard 
              title="Severidad AT" 
              value={latest.severidad} 
              unit="" 
              icon={TrendingUp} 
              color="amber" 
              desc="Días perdidos asignados cronológicamente por cada 100 trabajadores"
              formula={severityFormula}
              hasWorkers={latest.employeeCount > 0}
            />
            <IndicatorCard 
              title="Mortalidad AT" 
              value={latest.mortalidad} 
              unit="" 
              icon={AlertTriangle} 
              color="red" 
              desc="Accidentes mortales por cada 100.000 trabajadores"
              hasWorkers={latest.employeeCount > 0}
            />
            
            {/* Tarjeta Indicador Visual de Alerta: Investigaciones Vencidas (+15 días) */}
            <div 
              id="kpi-investigaciones-vencidas"
              className={`p-6 rounded-3xl border transition-all flex flex-col justify-between ${
                overdueAccidents.length > 0 
                  ? 'bg-red-50/70 border-red-200 shadow-sm hover:shadow-md ring-1 ring-red-300' 
                  : 'bg-white border-gray-100 shadow-sm'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-2xl ${
                      overdueAccidents.length > 0 ? 'bg-red-500 text-white shadow-md shadow-red-500/20' : 'bg-emerald-50 text-emerald-600'
                    }`}>
                      {overdueAccidents.length > 0 ? <ShieldAlert size={22} /> : <Check size={22} />}
                    </div>
                    <div>
                      <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block">
                        Investigaciones AT
                      </span>
                      <span className="text-[10px] font-bold text-gray-400">
                        Plazo legal: 15 días
                      </span>
                    </div>
                  </div>
                  {overdueAccidents.length > 0 && (
                    <span className="px-2 py-0.5 bg-red-600 text-white rounded-full text-[9px] font-black uppercase tracking-wider animate-pulse">
                      ¡Alerta!
                    </span>
                  )}
                </div>

                <div className="flex items-baseline gap-2">
                  <div className={`text-3xl font-black ${
                    overdueAccidents.length > 0 ? 'text-red-600' : 'text-emerald-700'
                  }`}>
                    {overdueAccidents.length}
                  </div>
                  <span className={`text-xs font-bold ${
                    overdueAccidents.length > 0 ? 'text-red-700' : 'text-emerald-600'
                  }`}>
                    {overdueAccidents.length === 1 ? 'vencida (>15d)' : 'vencidas (>15d)'}
                  </span>
                </div>

                <p className="text-[11px] text-gray-500 mt-2 font-medium leading-relaxed">
                  {overdueAccidents.length > 0 
                    ? 'Accidentes ocurridos hace más de 15 días calendario sin informe finalizado (Res. 1401/2007).'
                    : 'Todas las investigaciones de accidentes se encuentran al día dentro del plazo legal.'}
                </p>
              </div>

              {overdueAccidents.length > 0 && onNavigateToInvestigation ? (
                <button
                  type="button"
                  onClick={() => onNavigateToInvestigation()}
                  className="mt-4 pt-3 border-t border-red-200/60 text-[11px] font-extrabold text-red-700 hover:text-red-800 flex items-center justify-between group cursor-pointer"
                >
                  <span>Gestionar {overdueAccidents.length} casos vencidos</span>
                  <ArrowRight size={13} className="transition-transform group-hover:translate-x-1" />
                </button>
              ) : (
                <div className="mt-4 pt-3 border-t border-gray-100 text-[10px] text-emerald-700 font-bold flex items-center gap-1.5">
                  <Check size={12} />
                  <span>Cumplimiento normativo al 100%</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Enfermedad & Ausentismo Section */}
        <div className="lg:col-span-3">
          <h4 className="text-xs font-black text-gray-800 uppercase tracking-[0.2em] mb-4">
            Enfermedad Laboral y Ausentismo (Res. 0312/2019)
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <IndicatorCard 
              title="Prevalencia EL" 
              value={latest.prevalenciaEL} 
              unit="" 
              icon={HeartPulse} 
              color="rose" 
              desc="Casos antiguos y nuevos por cada 100.000 trabajadores"
              hasWorkers={latest.employeeCount > 0}
            />
            <IndicatorCard 
              title="Incidencia EL" 
              value={latest.incidenciaEL} 
              unit="" 
              icon={Stethoscope} 
              color="indigo" 
              desc="Casos nuevos en el período por cada 100.000 trabajadores"
              hasWorkers={latest.employeeCount > 0}
            />
            <IndicatorCard 
              title="Ausentismo Médico" 
              value={latest.ausentismoMedica} 
              unit="%" 
              icon={Clock} 
              color="blue" 
              desc="Días de ausencia médica vs días de trabajo programados"
              hasWorkers={latest.employeeCount > 0}
            />
            <IndicatorCard 
              title="Origen Común" 
              value={latest.ausentismoComun || 0} 
              unit="%" 
              icon={Activity} 
              color="gray" 
              desc="Porcentaje de ausentismo por causas médicas de origen común"
              hasWorkers={latest.employeeCount > 0}
            />
          </div>
        </div>
      </div>

      {/* Monthly Trends Section */}
      <div className="space-y-6">
        <h4 className="text-xs font-black text-gray-800 uppercase tracking-[0.2em]">Tendencias Mensuales de Accidentalidad</h4>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Frecuencia Chart */}
          <ChartContainer title="Frecuencia Mensual de Accidentes" icon={Activity} color="emerald">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="colorFreq" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 11 }} dy={10} tickFormatter={formatMonth} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 11 }} />
              <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }} />
              <Area type="monotone" dataKey="frecuencia" name="Frecuencia" stroke="#10b981" fillOpacity={1} fill="url(#colorFreq)" strokeWidth={3} />
            </AreaChart>
          </ChartContainer>

          {/* Severidad Chart */}
          <ChartContainer title="Severidad Mensual (Días cronológicos)" icon={TrendingUp} color="amber">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="colorSev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 11 }} dy={10} tickFormatter={formatMonth} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 11 }} />
              <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }} />
              <Area type="monotone" dataKey="severidad" name="Severidad" stroke="#f59e0b" fillOpacity={1} fill="url(#colorSev)" strokeWidth={3} />
            </AreaChart>
          </ChartContainer>
        </div>
      </div>

      {/* Multiannual Comparative Section */}
      <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h4 className="text-xs font-black text-gray-800 uppercase tracking-[0.2em]">
              Análisis Comparativo Multianual
            </h4>
            <p className="text-xs text-gray-400 mt-1">Evolución anual de indicadores según los estándares mínimos</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Indicator Selector */}
            <div className="flex items-center gap-1 bg-gray-50 p-1.5 rounded-2xl border border-gray-100">
              {indicators.map(ind => (
                <button
                  key={ind.key}
                  onClick={() => setSelectedIndicator(ind.key)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    selectedIndicator === ind.key 
                      ? 'bg-white text-gray-900 shadow-xs' 
                      : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  {ind.label}
                </button>
              ))}
            </div>

            {/* Year Multi-Select Dropdown */}
            <div className="relative" ref={yearDropdownRef}>
              <button
                type="button"
                onClick={() => setShowYearDropdown(!showYearDropdown)}
                className="px-4 py-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 flex items-center gap-2 transition-all"
              >
                <Calendar size={14} className="text-gray-500" />
                <span>Años ({selectedYears.length})</span>
                <ChevronDown size={14} className={`text-gray-400 transition-transform ${showYearDropdown ? 'rotate-180' : ''}`} />
              </button>

              {showYearDropdown && (
                <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-100 rounded-2xl shadow-xl z-20 p-2 space-y-1">
                  <div className="p-2 border-b border-gray-50 flex items-center justify-between">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Seleccionar</span>
                    <button
                      onClick={() => setSelectedYears(yearlyData.map(y => y.year))}
                      className="text-[10px] text-emerald-600 font-bold hover:underline"
                    >
                      Todos
                    </button>
                  </div>
                  <div className="max-h-48 overflow-y-auto space-y-1">
                    {yearlyData.map(item => (
                      <button
                        key={item.year}
                        onClick={() => toggleYear(item.year)}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                          selectedYears.includes(item.year)
                            ? 'bg-emerald-50 text-emerald-700 font-bold'
                            : 'text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        <span>{item.year}</span>
                        {selectedYears.includes(item.year) && <Check size={14} className="text-emerald-600" />}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Comparative Chart */}
        <div className="h-80 w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={filteredYearlyData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12, fontWeight: 600 }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 11 }} />
              <Tooltip 
                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                formatter={(val: any) => [Number(val).toFixed(2), activeIndicator.label]}
              />
              <Bar 
                dataKey={selectedIndicator} 
                name={activeIndicator.label}
                fill={activeIndicator.color} 
                radius={[12, 12, 0, 0]} 
                maxBarSize={60}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function IndicatorCard({ 
  title, 
  value, 
  unit, 
  icon: Icon, 
  color, 
  desc, 
  formula,
  hasWorkers = true
}: any) {
  const colorClasses: any = {
    emerald: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
    red: 'bg-red-50 text-red-600',
    rose: 'bg-rose-50 text-rose-600',
    indigo: 'bg-indigo-50 text-indigo-600',
    blue: 'bg-blue-50 text-blue-600',
    gray: 'bg-gray-50 text-gray-600',
  };

  return (
    <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow flex flex-col justify-between">
      <div>
        <div className="flex items-center gap-4 mb-4">
          <div className={`p-3 rounded-2xl ${colorClasses[color]}`}>
            <Icon size={22} />
          </div>
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{title}</span>
        </div>
        <div className="flex items-baseline gap-1">
          <div className="text-3xl font-black text-gray-900">
            {hasWorkers ? Number(value || 0).toFixed(value > 100 ? 0 : 2) : '0.00'}
          </div>
          <span className="text-sm font-bold text-gray-400">{unit}</span>
        </div>
        <p className="text-[11px] text-gray-400 mt-2 font-medium leading-relaxed">{desc}</p>
      </div>

      {formula && (
        <div className="mt-4 pt-3 border-t border-gray-50 text-[10px] text-gray-500 font-mono bg-gray-50/60 p-2 rounded-xl">
          <span className="font-bold text-gray-700 block text-[9px] uppercase tracking-wider">Detalle del cálculo:</span>
          <span className="text-emerald-700 font-bold">{formula}</span>
        </div>
      )}
    </div>
  );
}

function ChartContainer({ title, icon: Icon, color, children }: any) {
  const colorClasses: any = {
    emerald: 'text-emerald-600',
    amber: 'text-amber-600',
  };

  return (
    <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
      <div className="flex items-center gap-2">
        <Icon size={18} className={colorClasses[color]} />
        <h5 className="text-xs font-bold text-gray-900 uppercase tracking-wider">{title}</h5>
      </div>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          {children}
        </ResponsiveContainer>
      </div>
    </div>
  );
}
