import { MonthlyIndicator, YearlyIndicator } from '../types';
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
import { TrendingUp, Activity, AlertTriangle, HeartPulse, Stethoscope, Clock, Calendar } from 'lucide-react';

interface Props {
  data: MonthlyIndicator[];
  yearlyData: YearlyIndicator[];
}

export default function Dashboard({ data, yearlyData }: Props) {
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
        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-[0.2em]">Estadísticas Anuales</h4>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 space-y-4">
            {yearlyData.map(year => (
              <div key={year.year} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-lg font-extrabold text-gray-900">Año {year.year}</span>
                  <Calendar className="text-emerald-600" size={20} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase">Frecuencia</p>
                    <p className="text-lg font-bold text-emerald-600">{year.frecuencia.toFixed(2)}%</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase">Severidad</p>
                    <p className="text-lg font-bold text-amber-600">{year.severidad.toFixed(2)}%</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="lg:col-span-2">
            <ChartContainer title="Tendencia Anual de Accidentalidad" icon={TrendingUp} color="emerald">
              <LineChart data={yearlyData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 11 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 11 }} />
                <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }} />
                <Legend verticalAlign="top" height={36} />
                <Line type="monotone" dataKey="frecuencia" name="Frecuencia Anual" stroke="#10b981" strokeWidth={4} dot={{ r: 6 }} />
                <Line type="monotone" dataKey="severidad" name="Severidad Anual" stroke="#f59e0b" strokeWidth={4} dot={{ r: 6 }} />
              </LineChart>
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
