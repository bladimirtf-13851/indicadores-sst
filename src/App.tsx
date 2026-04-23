import React, { useState, useEffect } from 'react';
import { EventRecord, AppState, EventType, Company, CompanyData } from './types';
import { calculateIndicators, calculateYearlyIndicators } from './services/indicatorService';
import Dashboard from './components/Dashboard';
import EventForm from './components/EventForm';
import EventList from './components/EventList';
import CompanyList from './components/CompanyList';
import CompanyForm from './components/CompanyForm';
import Logo from './components/Logo';
import { Plus, LayoutDashboard, List, Users, CalendarRange, Building2, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';

export default function App() {
  const [state, setState] = useState<AppState>(() => {
    const saved = localStorage.getItem('accident_app_state');
    const defaultMonth = format(new Date(), 'yyyy-MM');
    const defaultState: AppState = {
      companies: [],
      companyData: {},
      selectedCompanyId: null
    };

    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Migration from old state structure
        if (parsed.records) {
          const defaultCompanyId = crypto.randomUUID();
          return {
            companies: [{ id: defaultCompanyId, name: 'Empresa Principal', nit: '000000000', email: 'contacto@empresa.com' }],
            companyData: {
              [defaultCompanyId]: {
                records: parsed.records || [],
                monthlyEmployeeCount: parsed.monthlyEmployeeCount || { [defaultMonth]: 50 },
                monthlyProgrammedDays: parsed.monthlyProgrammedDays || { [defaultMonth]: 1500 }
              }
            },
            selectedCompanyId: null
          };
        }
        return {
          ...defaultState,
          ...parsed
        };
      } catch (e) {
        return defaultState;
      }
    }
    return defaultState;
  });

  const [activeTab, setActiveTab] = useState<'dashboard' | 'list'>('dashboard');
  const [showEventForm, setShowEventForm] = useState(false);
  const [showCompanyForm, setShowCompanyForm] = useState(false);
  const [editingEmployees, setEditingEmployees] = useState(false);
  const [editingDays, setEditingDays] = useState(false);

  useEffect(() => {
    localStorage.setItem('accident_app_state', JSON.stringify(state));
  }, [state]);

  const addCompany = (companyData: Omit<Company, 'id'>) => {
    const newCompany: Company = {
      ...companyData,
      id: crypto.randomUUID()
    };
    const defaultMonth = format(new Date(), 'yyyy-MM');
    
    setState(prev => ({
      ...prev,
      companies: [...prev.companies, newCompany],
      companyData: {
        ...prev.companyData,
        [newCompany.id]: {
          records: [],
          monthlyEmployeeCount: { [defaultMonth]: 50 },
          monthlyProgrammedDays: { [defaultMonth]: 1500 }
        }
      }
    }));
  };

  const selectCompany = (id: string | null) => {
    setState(prev => ({ ...prev, selectedCompanyId: id }));
    setActiveTab('dashboard');
  };

  const addRecord = (record: Omit<EventRecord, 'id'>) => {
    if (!state.selectedCompanyId) return;
    
    const newRecord: EventRecord = {
      ...record,
      id: crypto.randomUUID()
    };
    
    setState(prev => {
      const companyId = prev.selectedCompanyId!;
      const currentData = prev.companyData[companyId];
      
      return {
        ...prev,
        companyData: {
          ...prev.companyData,
          [companyId]: {
            ...currentData,
            records: [newRecord, ...currentData.records]
          }
        }
      };
    });
  };

  const deleteRecord = (id: string) => {
    if (!state.selectedCompanyId) return;
    
    setState(prev => {
      const companyId = prev.selectedCompanyId!;
      const currentData = prev.companyData[companyId];
      
      return {
        ...prev,
        companyData: {
          ...prev.companyData,
          [companyId]: {
            ...currentData,
            records: currentData.records.filter(r => r.id !== id)
          }
        }
      };
    });
  };

  const updateMonthlyConfig = (key: 'monthlyEmployeeCount' | 'monthlyProgrammedDays', month: string, value: number) => {
    if (!state.selectedCompanyId) return;
    
    setState(prev => {
      const companyId = prev.selectedCompanyId!;
      const currentData = prev.companyData[companyId];
      
      return {
        ...prev,
        companyData: {
          ...prev.companyData,
          [companyId]: {
            ...currentData,
            [key]: {
              ...(currentData[key] || {}),
              [month]: value
            }
          }
        }
      };
    });
  };

  const currentCompany = state.selectedCompanyId 
    ? state.companies.find(c => c.id === state.selectedCompanyId) 
    : null;
    
  const currentData = state.selectedCompanyId 
    ? state.companyData[state.selectedCompanyId] 
    : null;

  const indicators = currentData ? calculateIndicators(
    currentData.records || [], 
    currentData.monthlyEmployeeCount || {}, 
    currentData.monthlyProgrammedDays || {}
  ) : [];

  const yearlyIndicators = currentData ? calculateYearlyIndicators(
    currentData.records || [],
    currentData.monthlyEmployeeCount || {},
    currentData.monthlyProgrammedDays || {}
  ) : [];

  const currentMonth = format(new Date(), 'yyyy-MM');

  return (
    <div className="min-h-screen bg-[#F8F9FB] text-gray-900 font-sans">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md border-b border-gray-100 z-40 px-6 h-20 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {state.selectedCompanyId && (
            <button 
              onClick={() => selectCompany(null)}
              className="p-2 hover:bg-gray-100 rounded-xl transition-colors mr-2 text-gray-500"
            >
              <ArrowLeft size={20} />
            </button>
          )}
          <div className="flex flex-col">
            <Logo />
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1 ml-1">
              {currentCompany ? currentCompany.name : 'Gestión Multi-Empresa'}
            </p>
          </div>
        </div>

        {state.selectedCompanyId ? (
          <>
            <div className="flex items-center gap-1 bg-gray-100/50 p-1.5 rounded-2xl border border-gray-100">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
                  activeTab === 'dashboard' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <LayoutDashboard size={18} />
                Dashboard
              </button>
              <button
                onClick={() => setActiveTab('list')}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
                  activeTab === 'list' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <List size={18} />
                Registros
              </button>
            </div>

            <button
              onClick={() => setShowEventForm(true)}
              className="bg-gray-900 hover:bg-black text-white px-6 py-3 rounded-2xl text-sm font-bold transition-all flex items-center gap-2 shadow-xl shadow-gray-900/10 active:scale-95"
            >
              <Plus size={18} />
              Nuevo Evento
            </button>
          </>
        ) : (
          <button
            onClick={() => setShowCompanyForm(true)}
            className="bg-gray-900 hover:bg-black text-white px-6 py-3 rounded-2xl text-sm font-bold transition-all flex items-center gap-2 shadow-xl shadow-gray-900/10 active:scale-95"
          >
            <Plus size={18} />
            Nueva Empresa
          </button>
        )}
      </nav>

      {/* Main Content */}
      <main className="pt-32 pb-12 px-6 max-w-7xl mx-auto">
        {!state.selectedCompanyId ? (
          <>
            <div className="mb-10">
              <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">
                Empresas Clientes
              </h2>
              <p className="text-gray-400 font-medium mt-1">Selecciona una empresa para gestionar sus indicadores de SST.</p>
            </div>
            <CompanyList 
              companies={state.companies} 
              onSelect={selectCompany} 
              onAddClick={() => setShowCompanyForm(true)} 
            />
          </>
        ) : (
          <>
            {/* Config Section */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-10">
              <div>
                <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">
                  {activeTab === 'dashboard' ? 'Panel de Control' : 'Historial de Eventos'}
                </h2>
                <p className="text-gray-400 font-medium mt-1">Monitoreo en tiempo real de indicadores de seguridad y salud.</p>
              </div>

              <div className="flex flex-wrap items-center gap-4">
                {/* Employee Count Config */}
                <div className="bg-white px-5 py-3 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4">
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                    <Users size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Trabajadores</p>
                    {editingEmployees ? (
                      <input
                        type="number"
                        autoFocus
                        className="text-sm font-extrabold w-16 outline-none border-b-2 border-emerald-500"
                        value={currentData?.monthlyEmployeeCount[currentMonth] || 0}
                        onChange={(e) => updateMonthlyConfig('monthlyEmployeeCount', currentMonth, parseInt(e.target.value) || 0)}
                        onBlur={() => setEditingEmployees(false)}
                      />
                    ) : (
                      <p 
                        className="text-sm font-extrabold text-gray-900 cursor-pointer hover:text-emerald-600 transition-colors"
                        onClick={() => setEditingEmployees(true)}
                      >
                        {currentData?.monthlyEmployeeCount[currentMonth] || 0}
                      </p>
                    )}
                  </div>
                </div>

                {/* Programmed Days Config */}
                <div className="bg-white px-5 py-3 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4">
                  <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                    <CalendarRange size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Días Programados</p>
                    {editingDays ? (
                      <input
                        type="number"
                        autoFocus
                        className="text-sm font-extrabold w-20 outline-none border-b-2 border-emerald-500"
                        value={currentData?.monthlyProgrammedDays[currentMonth] || 0}
                        onChange={(e) => updateMonthlyConfig('monthlyProgrammedDays', currentMonth, parseInt(e.target.value) || 0)}
                        onBlur={() => setEditingDays(false)}
                      />
                    ) : (
                      <p 
                        className="text-sm font-extrabold text-gray-900 cursor-pointer hover:text-emerald-600 transition-colors"
                        onClick={() => setEditingDays(true)}
                      >
                        {currentData?.monthlyProgrammedDays[currentMonth] || 0}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Content Area */}
            {activeTab === 'dashboard' ? (
              <Dashboard data={indicators} yearlyData={yearlyIndicators} />
            ) : (
              <EventList records={currentData?.records || []} onDelete={deleteRecord} />
            )}
          </>
        )}
      </main>

      {/* Modals */}
      {showEventForm && (
        <EventForm 
          onAdd={addRecord} 
          onClose={() => setShowEventForm(false)} 
        />
      )}
      
      {showCompanyForm && (
        <CompanyForm 
          onAdd={addCompany} 
          onClose={() => setShowCompanyForm(false)} 
        />
      )}
    </div>
  );
}
