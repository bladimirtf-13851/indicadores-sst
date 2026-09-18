import React, { useState } from 'react';
import { GitFork, Plus, Trash2, ArrowRight, Lightbulb, AlertTriangle, ShieldX, UserX, Wrench } from 'lucide-react';

interface Props {
  lossDescription: string;
  onLossChange: (val: string) => void;
  immediateActs: string[];
  onActsChange: (acts: string[]) => void;
  immediateConditions: string[];
  onConditionsChange: (conds: string[]) => void;
  basicPersonalFactors: string[];
  onPersonalChange: (factors: string[]) => void;
  basicWorkFactors: string[];
  onWorkChange: (factors: string[]) => void;
}

const COMMON_ACTS = [
  'No uso de Elementos de Protección Personal (EPP)',
  'Operar maquinaria o herramientas sin autorización',
  'Anular o retirar dispositivos o guardas de seguridad',
  'Adoptar postura corporal incorrecta para levantar cargas',
  'Distracción, prisa o exceso de confianza al trabajar',
  'Uso de herramientas inadecuadas o defectuosas',
  'Limpieza o ajuste de equipo en movimiento'
];

const COMMON_CONDITIONS = [
  'Falta o deficiencia de guardas o protecciones en máquinas',
  'Piso resbaladizo, con desniveles o con sustancias derramadas',
  'Falta de orden, aseo y almacenamiento seguro',
  'Iluminación deficiente o encandilamiento en la zona',
  'Herramientas o equipos en mal estado o desgastados',
  'Falta de señalización o demarcación del área de peligro',
  'Ruido excesivo que impide comunicación o advertencia'
];

const COMMON_PERSONAL = [
  'Falta de conocimiento o capacitación en la tarea',
  'Falta de habilidad o entrenamiento práctico suficiente',
  'Capacidad física o fisiológica inadecuada (fatiga, fuerza)',
  'Tensión o estrés físico o mental acumulado',
  'Motivación deficiente o actitud permisiva ante el riesgo'
];

const COMMON_WORK = [
  'Liderazgo o supervisión deficiente / permisiva',
  'Ingeniería o diseño inadecuado del puesto de trabajo',
  'Mantenimiento preventivo o correctivo inadecuado',
  'Estándares o procedimientos de trabajo deficientes o inexistentes',
  'Adquisiciones o compras de equipos sin especificaciones SST',
  'Uso y desgaste excesivo por falta de reposición oportuna'
];

export default function CauseTreeBuilder({
  lossDescription,
  onLossChange,
  immediateActs,
  onActsChange,
  immediateConditions,
  onConditionsChange,
  basicPersonalFactors,
  onPersonalChange,
  basicWorkFactors,
  onWorkChange
}: Props) {
  const [newAct, setNewAct] = useState('');
  const [newCond, setNewCond] = useState('');
  const [newPersonal, setNewPersonal] = useState('');
  const [newWork, setNewWork] = useState('');

  const addAct = (val: string) => {
    if (!val.trim()) return;
    if (!immediateActs.includes(val)) {
      onActsChange([...immediateActs, val.trim()]);
    }
    setNewAct('');
  };

  const addCond = (val: string) => {
    if (!val.trim()) return;
    if (!immediateConditions.includes(val)) {
      onConditionsChange([...immediateConditions, val.trim()]);
    }
    setNewCond('');
  };

  const addPersonal = (val: string) => {
    if (!val.trim()) return;
    if (!basicPersonalFactors.includes(val)) {
      onPersonalChange([...basicPersonalFactors, val.trim()]);
    }
    setNewPersonal('');
  };

  const addWork = (val: string) => {
    if (!val.trim()) return;
    if (!basicWorkFactors.includes(val)) {
      onWorkChange([...basicWorkFactors, val.trim()]);
    }
    setNewWork('');
  };

  return (
    <div className="space-y-6">
      {/* Intro Header */}
      <div className="p-4 bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 rounded-2xl border border-emerald-200/80 flex items-start gap-3">
        <GitFork size={22} className="text-emerald-700 shrink-0 mt-0.5" />
        <div>
          <h4 className="text-xs font-black text-emerald-950 uppercase tracking-wider">
            Metodología de Análisis: Árbol de Causas (Resolución 1401/2007)
          </h4>
          <p className="text-[11px] text-emerald-800 mt-0.5 leading-relaxed">
            Permite reconstruir la cadena causal del evento relacionando las <strong>Causas Básicas</strong> (Factores Personales y del Trabajo) que originan las <strong>Causas Inmediatas</strong> (Actos y Condiciones Inseguras), hasta desencadenar el <strong>Accidente / Pérdida</strong>.
          </p>
        </div>
      </div>

      {/* Visual Flow Representation (Diagram) */}
      <div className="p-5 bg-gray-900 text-white rounded-3xl shadow-xl space-y-4 overflow-x-auto">
        <div className="flex items-center justify-between border-b border-gray-800 pb-3">
          <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 flex items-center gap-1.5">
            <GitFork size={14} /> Esquema Gráfico del Árbol Causal
          </span>
          <span className="text-[9px] font-mono text-gray-400">FLUJO: CAUSAS BÁSICAS → CAUSAS INMEDIATAS → PÉRDIDA</span>
        </div>

        <div className="flex flex-col lg:flex-row items-stretch gap-3 min-w-[700px] text-xs">
          {/* Level 1: Causas Básicas */}
          <div className="flex-1 bg-gray-800/80 rounded-2xl p-3.5 border border-teal-500/30 space-y-2 flex flex-col">
            <div className="flex items-center gap-1.5 text-teal-400 font-black text-[11px] uppercase tracking-wider border-b border-gray-700 pb-1.5">
              <UserX size={14} /> 1. Causas Básicas ({basicPersonalFactors.length + basicWorkFactors.length})
            </div>
            <div className="flex-1 space-y-2 text-[10px]">
              <div>
                <span className="font-bold text-teal-300 block mb-0.5">Factores Personales:</span>
                {basicPersonalFactors.length === 0 ? (
                  <span className="text-gray-500 italic block">Sin factores asignados</span>
                ) : (
                  <ul className="space-y-1">
                    {basicPersonalFactors.map((f, i) => (
                      <li key={i} className="bg-teal-950/60 p-1.5 rounded-lg border border-teal-800/40 text-teal-200">
                        • {f}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div>
                <span className="font-bold text-teal-300 block mb-0.5">Factores de Trabajo:</span>
                {basicWorkFactors.length === 0 ? (
                  <span className="text-gray-500 italic block">Sin factores asignados</span>
                ) : (
                  <ul className="space-y-1">
                    {basicWorkFactors.map((f, i) => (
                      <li key={i} className="bg-teal-950/60 p-1.5 rounded-lg border border-teal-800/40 text-teal-200">
                        • {f}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>

          <div className="hidden lg:flex items-center justify-center text-gray-500">
            <ArrowRight size={20} />
          </div>

          {/* Level 2: Causas Inmediatas */}
          <div className="flex-1 bg-gray-800/80 rounded-2xl p-3.5 border border-amber-500/30 space-y-2 flex flex-col">
            <div className="flex items-center gap-1.5 text-amber-400 font-black text-[11px] uppercase tracking-wider border-b border-gray-700 pb-1.5">
              <AlertTriangle size={14} /> 2. Causas Inmediatas ({immediateActs.length + immediateConditions.length})
            </div>
            <div className="flex-1 space-y-2 text-[10px]">
              <div>
                <span className="font-bold text-amber-300 block mb-0.5">Actos Inseguros / Subestándar:</span>
                {immediateActs.length === 0 ? (
                  <span className="text-gray-500 italic block">Sin actos registrados</span>
                ) : (
                  <ul className="space-y-1">
                    {immediateActs.map((a, i) => (
                      <li key={i} className="bg-amber-950/60 p-1.5 rounded-lg border border-amber-800/40 text-amber-200">
                        • {a}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div>
                <span className="font-bold text-amber-300 block mb-0.5">Condiciones Inseguras / Subestándar:</span>
                {immediateConditions.length === 0 ? (
                  <span className="text-gray-500 italic block">Sin condiciones registradas</span>
                ) : (
                  <ul className="space-y-1">
                    {immediateConditions.map((c, i) => (
                      <li key={i} className="bg-amber-950/60 p-1.5 rounded-lg border border-amber-800/40 text-amber-200">
                        • {c}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>

          <div className="hidden lg:flex items-center justify-center text-gray-500">
            <ArrowRight size={20} />
          </div>

          {/* Level 3: Pérdida / Accidente */}
          <div className="flex-1 bg-red-950/40 rounded-2xl p-3.5 border border-red-500/40 space-y-2 flex flex-col">
            <div className="flex items-center gap-1.5 text-red-400 font-black text-[11px] uppercase tracking-wider border-b border-gray-800 pb-1.5">
              <ShieldX size={14} /> 3. Pérdida / Accidente
            </div>
            <div className="flex-1 p-2 bg-red-900/30 rounded-xl border border-red-800/40 text-red-150 text-xs font-semibold leading-relaxed">
              {lossDescription || 'Defina la pérdida o suceso del accidente en el campo inferior...'}
            </div>
          </div>
        </div>
      </div>

      {/* Editing Section: Pérdida / Suceso final */}
      <div className="p-5 bg-white rounded-2xl border border-gray-200 space-y-2">
        <label className="text-[11px] font-black text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
          <ShieldX size={14} className="text-red-600" />
          Pérdida / Suceso Final del Accidente (Cabeza del Árbol) *
        </label>
        <p className="text-[10px] text-gray-400">Describa puntualmente el daño o lesión ocurrida al trabajador o a los procesos.</p>
        <input
          type="text"
          placeholder="Ej: Fractura de tibia y peroné miembro inferior derecho por caída a distinto nivel desde andamio..."
          className="w-full p-3 text-xs border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-bold text-gray-800"
          value={lossDescription}
          onChange={e => onLossChange(e.target.value)}
        />
      </div>

      {/* Two Column Layout: Causas Inmediatas vs Causas Básicas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* COLUMNA 1: CAUSAS INMEDIATAS */}
        <div className="space-y-5 bg-amber-50/30 p-5 rounded-3xl border border-amber-200/60">
          <div className="flex items-center gap-2 border-b border-amber-200/60 pb-3">
            <AlertTriangle size={18} className="text-amber-600" />
            <div>
              <h5 className="text-xs font-black text-gray-900 uppercase tracking-wider">Causas Inmediatas (Directas)</h5>
              <p className="text-[10px] text-gray-500 font-medium">Actos y condiciones presentes inmediatamente antes del accidente.</p>
            </div>
          </div>

          {/* Actos Subestándar */}
          <div className="space-y-3">
            <label className="text-[10px] font-black uppercase tracking-wider text-amber-800 flex items-center justify-between">
              <span>Actos Subestándar / Inseguros ({immediateActs.length})</span>
            </label>

            {/* Suggestions Chips */}
            <div className="space-y-1">
              <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                <Lightbulb size={11} className="text-amber-500" /> Sugerencias frecuentes:
              </span>
              <div className="flex flex-wrap gap-1">
                {COMMON_ACTS.map((act, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => addAct(act)}
                    disabled={immediateActs.includes(act)}
                    className={`text-[9px] px-2 py-0.5 rounded-md text-left transition-all ${
                      immediateActs.includes(act)
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        : 'bg-white border border-amber-200 text-amber-900 hover:bg-amber-100/70'
                    }`}
                  >
                    + {act}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Act Input */}
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Escriba otro acto inseguro..."
                className="flex-1 p-2 text-xs border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none bg-white"
                value={newAct}
                onChange={e => setNewAct(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addAct(newAct))}
              />
              <button
                type="button"
                onClick={() => addAct(newAct)}
                className="px-3 py-2 bg-amber-600 text-white rounded-xl text-xs font-bold hover:bg-amber-700"
              >
                <Plus size={14} />
              </button>
            </div>

            {/* List of defined acts */}
            <div className="space-y-1.5">
              {immediateActs.map((act, idx) => (
                <div key={idx} className="flex items-start justify-between gap-2 p-2 bg-white rounded-xl border border-amber-100 shadow-xs text-xs">
                  <span className="text-gray-800 font-medium leading-tight">• {act}</span>
                  <button
                    type="button"
                    onClick={() => onActsChange(immediateActs.filter((_, i) => i !== idx))}
                    className="text-gray-400 hover:text-red-600 shrink-0 p-0.5"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Condiciones Subestándar */}
          <div className="space-y-3 pt-3 border-t border-amber-200/50">
            <label className="text-[10px] font-black uppercase tracking-wider text-amber-800 flex items-center justify-between">
              <span>Condiciones Subestándar / Inseguras ({immediateConditions.length})</span>
            </label>

            {/* Suggestions Chips */}
            <div className="space-y-1">
              <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                <Lightbulb size={11} className="text-amber-500" /> Sugerencias frecuentes:
              </span>
              <div className="flex flex-wrap gap-1">
                {COMMON_CONDITIONS.map((cond, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => addCond(cond)}
                    disabled={immediateConditions.includes(cond)}
                    className={`text-[9px] px-2 py-0.5 rounded-md text-left transition-all ${
                      immediateConditions.includes(cond)
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        : 'bg-white border border-amber-200 text-amber-900 hover:bg-amber-100/70'
                    }`}
                  >
                    + {cond}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Cond Input */}
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Escriba otra condición insegura..."
                className="flex-1 p-2 text-xs border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none bg-white"
                value={newCond}
                onChange={e => setNewCond(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addCond(newCond))}
              />
              <button
                type="button"
                onClick={() => addCond(newCond)}
                className="px-3 py-2 bg-amber-600 text-white rounded-xl text-xs font-bold hover:bg-amber-700"
              >
                <Plus size={14} />
              </button>
            </div>

            {/* List of defined conditions */}
            <div className="space-y-1.5">
              {immediateConditions.map((cond, idx) => (
                <div key={idx} className="flex items-start justify-between gap-2 p-2 bg-white rounded-xl border border-amber-100 shadow-xs text-xs">
                  <span className="text-gray-800 font-medium leading-tight">• {cond}</span>
                  <button
                    type="button"
                    onClick={() => onConditionsChange(immediateConditions.filter((_, i) => i !== idx))}
                    className="text-gray-400 hover:text-red-600 shrink-0 p-0.5"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* COLUMNA 2: CAUSAS BÁSICAS */}
        <div className="space-y-5 bg-teal-50/30 p-5 rounded-3xl border border-teal-200/60">
          <div className="flex items-center gap-2 border-b border-teal-200/60 pb-3">
            <Wrench size={18} className="text-teal-700" />
            <div>
              <h5 className="text-xs font-black text-gray-900 uppercase tracking-wider">Causas Básicas (Raíz)</h5>
              <p className="text-[10px] text-gray-500 font-medium">Factores personales y del trabajo que explican por qué ocurrieron los actos y condiciones.</p>
            </div>
          </div>

          {/* Factores Personales */}
          <div className="space-y-3">
            <label className="text-[10px] font-black uppercase tracking-wider text-teal-900 flex items-center justify-between">
              <span>Factores Personales ({basicPersonalFactors.length})</span>
            </label>

            {/* Suggestions Chips */}
            <div className="space-y-1">
              <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                <Lightbulb size={11} className="text-teal-600" /> Sugerencias frecuentes:
              </span>
              <div className="flex flex-wrap gap-1">
                {COMMON_PERSONAL.map((fact, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => addPersonal(fact)}
                    disabled={basicPersonalFactors.includes(fact)}
                    className={`text-[9px] px-2 py-0.5 rounded-md text-left transition-all ${
                      basicPersonalFactors.includes(fact)
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        : 'bg-white border border-teal-200 text-teal-900 hover:bg-teal-100/70'
                    }`}
                  >
                    + {fact}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Personal Input */}
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Escriba otro factor personal..."
                className="flex-1 p-2 text-xs border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none bg-white"
                value={newPersonal}
                onChange={e => setNewPersonal(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addPersonal(newPersonal))}
              />
              <button
                type="button"
                onClick={() => addPersonal(newPersonal)}
                className="px-3 py-2 bg-teal-700 text-white rounded-xl text-xs font-bold hover:bg-teal-800"
              >
                <Plus size={14} />
              </button>
            </div>

            {/* List of defined personal factors */}
            <div className="space-y-1.5">
              {basicPersonalFactors.map((fact, idx) => (
                <div key={idx} className="flex items-start justify-between gap-2 p-2 bg-white rounded-xl border border-teal-100 shadow-xs text-xs">
                  <span className="text-gray-800 font-medium leading-tight">• {fact}</span>
                  <button
                    type="button"
                    onClick={() => onPersonalChange(basicPersonalFactors.filter((_, i) => i !== idx))}
                    className="text-gray-400 hover:text-red-600 shrink-0 p-0.5"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Factores de Trabajo */}
          <div className="space-y-3 pt-3 border-t border-teal-200/50">
            <label className="text-[10px] font-black uppercase tracking-wider text-teal-900 flex items-center justify-between">
              <span>Factores de Trabajo / Organización ({basicWorkFactors.length})</span>
            </label>

            {/* Suggestions Chips */}
            <div className="space-y-1">
              <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                <Lightbulb size={11} className="text-teal-600" /> Sugerencias frecuentes:
              </span>
              <div className="flex flex-wrap gap-1">
                {COMMON_WORK.map((fact, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => addWork(fact)}
                    disabled={basicWorkFactors.includes(fact)}
                    className={`text-[9px] px-2 py-0.5 rounded-md text-left transition-all ${
                      basicWorkFactors.includes(fact)
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        : 'bg-white border border-teal-200 text-teal-900 hover:bg-teal-100/70'
                    }`}
                  >
                    + {fact}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Work Input */}
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Escriba otro factor del trabajo..."
                className="flex-1 p-2 text-xs border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none bg-white"
                value={newWork}
                onChange={e => setNewWork(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addWork(newWork))}
              />
              <button
                type="button"
                onClick={() => addWork(newWork)}
                className="px-3 py-2 bg-teal-700 text-white rounded-xl text-xs font-bold hover:bg-teal-800"
              >
                <Plus size={14} />
              </button>
            </div>

            {/* List of defined work factors */}
            <div className="space-y-1.5">
              {basicWorkFactors.map((fact, idx) => (
                <div key={idx} className="flex items-start justify-between gap-2 p-2 bg-white rounded-xl border border-teal-100 shadow-xs text-xs">
                  <span className="text-gray-800 font-medium leading-tight">• {fact}</span>
                  <button
                    type="button"
                    onClick={() => onWorkChange(basicWorkFactors.filter((_, i) => i !== idx))}
                    className="text-gray-400 hover:text-red-600 shrink-0 p-0.5"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
