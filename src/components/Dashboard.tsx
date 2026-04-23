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
import { TrendingUp, Activity, AlertTriangle, HeartPulse, Stethoscope, Clock, Calendar, ChevronDown, Check, Filter } from 'lucide-react';

interface Props {
  data: MonthlyIndicator[];
  yearlyData: YearlyIndicator[];
}

export default function Dashboard({ data, yearlyData }: Props) {
  const [selectedYears, setSelectedYears] = useState<string[]>([]);
  const [selectedIndicator, setSelectedIndicator] = useState<keyof YearlyIndicator>('frecuencia');
  const [showYearDropdown, setShowYearDropdown] = useState(false);
  const yearDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Default to show all years if none selected
    if (selectedYears.length === 0 && yearlyData.length > 0) {
      setSelectedYears(yearlyData.map(y => y.year));
    }
  }, [yearlyData]); // Update when data changes

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

  const currentMonth = format(new Date(), 'yyyy-MM');
  const currentMonthData = data.find(d => d.month === currentMonth);
  const latest = currentMonthData || data[data.length - 1] || { 
    frecuencia: 0, 
    severidad: 0, 
    mortalidad: 0, 
    prevalenciaEL: 0, 
    incidenciaEL: 0, 
    ausentismoMedica: 0,
    ausentismoComun: 0,
    employeeCount: 0 
  };

  const formatMonth = (monthStr: string) => {
    try {
      return format(parseISO(`${monthStr}-01`), 'MMM', { locale: es });
    } catch (e) {
      return monthStr;
    }
  };

  return (
    <div className="space-y-12">
      {/* Primary Indicators Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Accidentalidad Section */}
        <div className="lg:col-span-3">
          <h4 className="text-xs font-bold text-gray-400 uppercase tracking-[0.2em] mb-4">Indicadores de Accidentalidad</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <IndicatorCard 
              title="Frecuencia AT" 
              value={latest.frecuencia} 
              unit="%" 
              icon={Activity} 
              color="emerald" 
              desc="Accidentes por cada 100 trabajadores"
            />
            <IndicatorCard 
              title="Severidad AT" 
              value={latest.severidad} 
              unit="%" 
              icon={TrendingUp} 
              color="amber" 
              desc="Días perdidos por cada 100 trabajadores"
            />
            <IndicatorCard 
              title="Mortalidad AT" 
              value={latest.mortalidad} 
              unit="%" 
              icon={AlertTriangle} 
              color="red" 
              desc="Proporción de accidentes mortales"
            />
          </div>
        </div>

        {/* Enfermedad & Ausentismo Section */}
        <div className="lg:col-span-3">
          <h4 className="text-xs font-bold text-gray-400 uppercase tracking-[0.2em] mb-4">Enfermedad Laboral y Ausentismo</h4>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <IndicatorCard 
              title="Prevalencia EL" 
              value={latest.prevalenciaEL} 
              unit="" 
              icon={HeartPulse} 
              color="rose" 
              desc="Casos por cada 100.000 trabajadores"
            />
            <IndicatorCard 
              title="Incidencia EL" 
              value={latest.incidenciaEL} 
              unit="" 
              icon={Stethoscope} 
              color="indigo" 
              desc="Casos nuevos por cada 100.000"
            />
            <IndicatorCard 
              title="Ausentismo Médico" 
              value={latest.ausentismoMedica} 
              unit="%" 
              icon={Clock} 
              color="blue" 
              desc="Días ausencia vs programados"
            />
            <IndicatorCard 
              title="Origen Común" 
              value={latest.ausentismoComun || 0} 
              unit="%" 
              icon={Activity} 
              color="gray" 
              desc="Ausentismo de origen común"
            />
          </div>
        </div>
      </div>

      {/* Monthly Trends Section */}
      <div className="space-y-6">
        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-[0.2em]">Tendencias Mensuales</h4>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Frecuencia Chart */}
          <ChartContainer title="Frecuencia Mensual" icon={Activity} color="emerald">
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
              <Area type="monotone" dataKey="frecuencia" name="Frecuencia (%)" stroke="#10b981" fillOpacity={1} fill="url(#colorFreq)" strokeWidth={3} />
            </AreaChart>
          </ChartContainer>

          {/* Severidad Chart */}
          <ChartContainer title="Severidad Mensual" icon={TrendingUp} color="amber">
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
              <Area type="monotone" dataKey="severidad" name="Severidad (%)" stroke="#f59e0b" fillOpacity={1} fill="url(#colorSev)" strokeWidth={3} />
            </AreaChart>
          </ChartContainer>

          {/* Incidencia EL */}
          <ChartContainer title="Incidencia EL" icon={Stethoscope} color="indigo">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 11 }} dy={10} tickFormatter={formatMonth} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 11 }} />
              <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }} />
              <Bar dataKey="incidenciaEL" name="Incidencia" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ChartContainer>

          {/* Prevalencia EL */}
          <ChartContainer title="Prevalencia EL" icon={HeartPulse} color="rose">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 11 }} dy={10} tickFormatter={formatMonth} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 11 }} />
              <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }} />
              <Bar dataKey="prevalenciaEL" name="Prevalencia" fill="#f43f5e" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ChartContainer>

          {/* Medical Absenteeism Total */}
          <ChartContainer title="Ausentismo Médico Total" icon={Clock} color="blue">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 11 }} dy={10} tickFormatter={formatMonth} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 11 }} />
              <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }} />
              <Bar dataKey="ausentismoMedica" name="Total (%)" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ChartContainer>

          {/* Medical Absenteeism Common */}
          <ChartContainer title="Ausentismo Origen Común" icon={Activity} color="gray">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 11 }} dy={10} tickFormatter={formatMonth} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 11 }} />
              <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }} />
              <Bar dataKey="ausentismoComun" name="Origen Común (%)" fill="#94a3b8" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ChartContainer>
        </div>
      </div>

      {/* Yearly Statistics Section */}
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h4 className="text-xs font-bold text-gray-400 uppercase tracking-[0.2em]">Estadísticas Anuales</h4>
          
          <div className="flex flex-wrap items-center gap-3">
            {/* Year Multi-select Dropdown */}
            <div className="relative" ref={yearDropdownRef}>
              <button
                onClick={() => setShowYearDropdown(!showYearDropdown)}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:border-emerald-500 transition-all shadow-sm"
              >
                <Calendar size={16} className="text-emerald-600" />
                <span>{selectedYears.length === 0 ? "Seleccionar Años" : `${selectedYears.length} Años`}</span>
                <ChevronDown size={16} className="text-gray-400" />
              </button>

              {showYearDropdown && (
                <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-100 rounded-2xl shadow-xl z-50 py-2">
                  <div className="max-h-60 overflow-y-auto px-1">
                    {yearlyData.map(year => (
                      <button
                        key={year.year}
                        onClick={() => toggleYear(year.year)}
                        className="flex items-center justify-between w-full px-4 py-2.5 hover:bg-gray-50 rounded-xl transition-colors text-sm font-medium text-gray-700"
                      >
                        <span>Año {year.year}</span>
                        {selectedYears.includes(year.year) && <Check size={16} className="text-emerald-600" />}
                      </button>
                    ))}
                  </div>
                  {yearlyData.length === 0 && (
                    <p className="px-4 py-2 text-xs text-gray-400 italic text-center">No hay datos</p>
                  )}
                </div>
              )}
            </div>

            {/* Indicator Dropdown */}
            <div className="relative">
              <select
                value={selectedIndicator}
                onChange={(e) => setSelectedIndicator(e.target.value as keyof YearlyIndicator)}
                className="appearance-none flex items-center pl-10 pr-10 py-2 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:border-emerald-500 transition-all shadow-sm outline-none min-w-[180px]"
                style={{ 
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%239ca3af' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`, 
                  backgroundRepeat: 'no-repeat', 
                  backgroundPosition: 'right 12px center' 
                }}
              >
                {indicators.map(ind => (
                  <option key={ind.key} value={ind.key}>{ind.label}</option>
                ))}
              </select>
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <activeIndicator.icon size={16} className={
                  selectedIndicator === 'frecuencia' ? 'text-emerald-600' : 
                  selectedIndicator === 'severidad' ? 'text-amber-600' : 
                  selectedIndicator === 'mortalidad' ? 'text-red-600' :
                  selectedIndicator === 'incidenciaEL' ? 'text-indigo-600' :
                  selectedIndicator === 'prevalenciaEL' ? 'text-rose-600' :
                  'text-blue-600'
                } />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 space-y-4">
            {filteredYearlyData.length > 0 ? (
              filteredYearlyData.map(year => (
                <div key={year.year} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:border-emerald-100 transition-colors">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-lg font-extrabold text-gray-900">Año {year.year}</span>
                    <Calendar className="text-emerald-600" size={20} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className={selectedIndicator === 'frecuencia' ? 'ring-2 ring-emerald-50 ring-offset-2 rounded-xl p-1' : ''}>
                      <p className="text-[10px] font-bold text-gray-400 uppercase">Frecuencia</p>
                      <p className="text-lg font-bold text-emerald-600">{year.frecuencia.toFixed(2)}%</p>
                    </div>
                    <div className={selectedIndicator === 'severidad' ? 'ring-2 ring-amber-50 ring-offset-2 rounded-xl p-1' : ''}>
                      <p className="text-[10px] font-bold text-gray-400 uppercase">Severidad</p>
                      <p className="text-lg font-bold text-amber-600">{year.severidad.toFixed(2)}%</p>
                    </div>
                    {selectedIndicator === 'mortalidad' && (
                      <div className="col-span-2 mt-2 ring-2 ring-red-50 ring-offset-2 rounded-xl p-1">
                        <p className="text-[10px] font-bold text-gray-400 uppercase">Mortalidad</p>
                        <p className="text-lg font-bold text-red-600">{year.mortalidad.toFixed(2)}%</p>
                      </div>
                    )}
                    {selectedIndicator === 'incidenciaEL' && (
                      <div className="col-span-2 mt-2 ring-2 ring-indigo-50 ring-offset-2 rounded-xl p-1">
                        <p className="text-[10px] font-bold text-gray-400 uppercase">Incidencia EL</p>
                        <p className="text-lg font-bold text-indigo-600">{year.incidenciaEL.toFixed(2)}</p>
                      </div>
                    )}
                    {selectedIndicator === 'prevalenciaEL' && (
                      <div className="col-span-2 mt-2 ring-2 ring-rose-50 ring-offset-2 rounded-xl p-1">
                        <p className="text-[10px] font-bold text-gray-400 uppercase">Prevalencia EL</p>
                        <p className="text-lg font-bold text-rose-600">{year.prevalenciaEL.toFixed(2)}</p>
                      </div>
                    )}
                    {selectedIndicator === 'ausentismoMedica' && (
                      <div className="col-span-2 mt-2 ring-2 ring-blue-50 ring-offset-2 rounded-xl p-1">
                        <p className="text-[10px] font-bold text-gray-400 uppercase">Ausentismo Médico</p>
                        <p className="text-lg font-bold text-blue-600">{year.ausentismoMedica.toFixed(2)}%</p>
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-white p-12 rounded-3xl border border-dashed border-gray-200 text-center flex flex-col items-center gap-3">
                <Filter className="text-gray-300" size={40} />
                <p className="text-gray-500 font-medium text-sm">Selecciona uno o más años para ver el desglose</p>
              </div>
            )}
          </div>
          
          <div className="lg:col-span-2">
            <ChartContainer 
              title={`Tendencia Anual: ${activeIndicator.label}`} 
              icon={activeIndicator.icon} 
              color={
                selectedIndicator === 'frecuencia' ? 'emerald' : 
                selectedIndicator === 'severidad' ? 'amber' : 
                selectedIndicator === 'mortalidad' ? 'red' :
                selectedIndicator === 'incidenciaEL' ? 'indigo' :
                selectedIndicator === 'prevalenciaEL' ? 'rose' :
                'blue'
              }
            >
              {filteredYearlyData.length > 0 ? (
                <LineChart data={filteredYearlyData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 11 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 11 }} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                    formatter={(value: number) => [`${value.toFixed(2)}%`, activeIndicator.label]}
                  />
                  <Legend verticalAlign="top" height={36} />
                  <Line 
                    type="monotone" 
                    dataKey={selectedIndicator} 
                    name={activeIndicator.label} 
                    stroke={activeIndicator.color} 
                    strokeWidth={4} 
                    dot={{ r: 6, stroke: activeIndicator.color, strokeWidth: 2, fill: '#fff' }} 
                    activeDot={{ r: 8 }}
                  />
                </LineChart>
              ) : (
                <div className="h-full w-full flex items-center justify-center text-gray-400 text-sm italic">
                  No hay datos para mostrar con los filtros seleccionados
                </div>
              )}
            </ChartContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

function ChartContainer({ title, icon: Icon, color, children }: any) {
  const colorClasses: any = {
    emerald: 'text-emerald-600',
    amber: 'text-amber-600',
    rose: 'text-rose-600',
    blue: 'text-blue-600',
    indigo: 'text-indigo-600',
  };

  return (
    <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
      <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
        <Icon size={20} className={colorClasses[color]} />
        {title}
      </h3>
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          {children}
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function IndicatorCard({ title, value, unit, icon: Icon, color, desc }: any) {
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
    <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
      <div className="flex items-center gap-4 mb-4">
        <div className={`p-3 rounded-2xl ${colorClasses[color]}`}>
          <Icon size={22} />
        </div>
        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{title}</span>
      </div>
      <div className="flex items-baseline gap-1">
        <div className="text-3xl font-extrabold text-gray-900">{value.toFixed(value > 100 ? 0 : 2)}</div>
        <span className="text-sm font-bold text-gray-400">{unit}</span>
      </div>
      <p className="text-[11px] text-gray-400 mt-2 font-medium">{desc}</p>
    </div>
  );
}
