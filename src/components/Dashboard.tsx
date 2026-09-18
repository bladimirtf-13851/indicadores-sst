import { MonthlyIndicator, YearlyIndicator } from '../types';
import { useState, useEffect, useRef } from 'react';
import { format, parseISO } from 'date-fns';
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
import { TrendingUp, Activity, AlertTriangle, HeartPulse, Stethoscope, Clock, Calendar, ChevronDown, Check, Filter, Users, AlertCircle, Edit3, HelpCircle } from 'lucide-react';

interface Props {
  data: MonthlyIndicator[];
  yearlyData: YearlyIndicator[];
  selectedMonth?: string;
  onMonthChange?: (month: string) => void;
  onUpdateEmployeeCount?: (month: string, count: number) => void;
}

export default function Dashboard({ 
  data, 
  yearlyData, 
  selectedMonth: externalSelectedMonth,
  onMonthChange,
  onUpdateEmployeeCount 
}: Props) {
  const [selectedYears, setSelectedYears] = useState<string[]>([]);
  const [selectedIndicator, setSelectedIndicator] = useState<keyof YearlyIndicator>('frecuencia');
  const [showYearDropdown, setShowYearDropdown] = useState(false);
  const [editingEmployees, setEditingEmployees] = useState(false);
  const [tempEmployeeCount, setTempEmployeeCount] = useState<number>(0);
  const yearDropdownRef = useRef<HTMLDivElement>(null);

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

  return (
    <div className="space-y-12">
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
            
            {/* Month Filter Selector & Worker Config in Month */}
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
