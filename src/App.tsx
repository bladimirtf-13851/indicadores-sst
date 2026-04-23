import React, { useState, useEffect } from 'react';
import { EventRecord, AppState, EventType, Company, CompanyData, MonthlyIndicator, YearlyIndicator } from './types';
import { calculateIndicators, calculateYearlyIndicators } from './services/indicatorService';
import { firebaseService } from './services/firebaseService';
import { useAuth } from './contexts/AuthContext';
import { auth } from './lib/firebase';
import { signOut } from 'firebase/auth';
import Dashboard from './components/Dashboard';
import EventForm from './components/EventForm';
import EventList from './components/EventList';
import CompanyList from './components/CompanyList';
import CompanyForm from './components/CompanyForm';
import CompanyUserModal from './components/CompanyUserModal';
import Login from './components/Login';
import Logo from './components/Logo';
import { Plus, LayoutDashboard, List, Users, CalendarRange, Building2, ArrowLeft, LogOut, UserCheck, ShieldAlert, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';

export default function App() {
  const { user, profile, loading, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'list'>('dashboard');
  const [showEventForm, setShowEventForm] = useState(false);
  const [showCompanyForm, setShowCompanyForm] = useState(false);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const [showUserModal, setShowUserModal] = useState<Company | null>(null);

  const [companies, setCompanies] = useState<Company[]>([]);
  const [records, setRecords] = useState<EventRecord[]>([]);
  const [monthlyConfig, setMonthlyConfig] = useState<{
    monthlyEmployeeCount: Record<string, number>,
    monthlyProgrammedDays: Record<string, number>
  }>({ monthlyEmployeeCount: {}, monthlyProgrammedDays: {} });

  const [editingEmployees, setEditingEmployees] = useState(false);
  const [editingDays, setEditingDays] = useState(false);

  // Firestore Listeners
  useEffect(() => {
    if (user && profile) {
      if (isAdmin) {
        return firebaseService.listenCompanies(setCompanies);
      } else if (profile.companyId) {
        // Find own company for display
        firebaseService.getCompanies().then(list => {
          const mine = list.find(c => c.id === profile.companyId);
          if (mine) setCompanies([mine]);
        });
      }
    }
  }, [user, profile, isAdmin]);

  // Record & Config listeners based on selection
  useEffect(() => {
    const companyIdToTrack = isAdmin ? selectedCompanyId : profile?.companyId;
    
    if (companyIdToTrack) {
      const unsubRecords = firebaseService.listenRecords(companyIdToTrack, setRecords);
      const unsubConfigs = firebaseService.listenConfigs(companyIdToTrack, setMonthlyConfig);
      return () => {
        unsubRecords();
        unsubConfigs();
      };
    } else {
      setRecords([]);
      setMonthlyConfig({ monthlyEmployeeCount: {}, monthlyProgrammedDays: {} });
    }
  }, [selectedCompanyId, profile, isAdmin]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F9FB] flex flex-col items-center justify-center gap-4">
        <RefreshCw className="animate-spin text-emerald-600" size={40} />
        <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Cargando Sistema...</p>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  // Security barrier: if user exists but no profile, they are pending or invalid
  if (!profile) {
    // Check if we should allow first admin creation
    return (
      <div className="min-h-screen bg-[#F8F9FB] flex items-center justify-center p-6">
        <div className="bg-white p-10 rounded-[40px] shadow-2xl max-w-md w-full text-center space-y-6">
          <ShieldAlert size={60} className="text-amber-500 mx-auto" />
          <h2 className="text-2xl font-bold text-gray-900">Configuración Pendiente</h2>
          <p className="text-gray-500 text-sm">Tu cuenta no tiene un perfil asignado o está pendiente de aprobación por el administrador.</p>
          <button 
            onClick={() => signOut(auth)}
            className="w-full bg-gray-900 text-white font-bold py-4 rounded-2xl"
          >
            Cerrar Sesión
          </button>
          
          {/* Temporary Bootstrap Link for first user */}
          {(user?.email === 'BladimirTF@gmail.com' || user?.email === 'bladimirtf@gmail.com') && (
            <div className="pt-4 border-t border-gray-100">
              <p className="text-[10px] text-gray-400 font-bold uppercase mb-2">Acceso de Administrador Maestro</p>
              <button
                onClick={async () => {
                  try {
                    await firebaseService.createUserProfile(user.uid, user.email!, 'admin');
                    window.location.reload();
                  } catch (err) {
                    alert("Error al crear perfil: " + (err instanceof Error ? err.message : "Error desconocido"));
                  }
                }}
                className="w-full bg-emerald-50 text-emerald-600 hover:bg-emerald-100 font-bold py-3 rounded-2xl transition-colors border border-emerald-100"
              >
                Activar Perfil Administrador Global
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  const handleSignOut = () => signOut(auth);

  const addCompany = async (companyData: Omit<Company, 'id'>) => {
    await firebaseService.addCompany(companyData);
    setShowCompanyForm(false);
  };

  const addRecord = async (record: Omit<EventRecord, 'id'>) => {
    const cid = isAdmin ? selectedCompanyId : profile.companyId;
    if (!cid) return;
    await firebaseService.addRecord({ ...record, companyId: cid });
    setShowEventForm(false);
  };

  const deleteRecord = async (id: string) => {
    await firebaseService.deleteRecord(id);
  };

  const updateMonthlyValue = async (key: 'employeeCount' | 'programmedDays', month: string, value: number) => {
    const cid = isAdmin ? selectedCompanyId : profile.companyId;
    if (!cid) return;

    const currentConfigsForMonth = {
      employeeCount: monthlyConfig.monthlyEmployeeCount[month] || 0,
      programmedDays: monthlyConfig.monthlyProgrammedDays[month] || 0
    };

    const updatedValue = { ...currentConfigsForMonth, [key]: value };
    await firebaseService.updateConfig(cid, month, updatedValue.employeeCount, updatedValue.programmedDays);
  };

  // Calculations
  const indicators = calculateIndicators(
    records,
    monthlyConfig.monthlyEmployeeCount,
    monthlyConfig.monthlyProgrammedDays
  );

  const yearlyIndicators = calculateYearlyIndicators(
    records,
    monthlyConfig.monthlyEmployeeCount,
    monthlyConfig.monthlyProgrammedDays
  );

  const currentMonth = format(new Date(), 'yyyy-MM');
  const currentCompany = isAdmin 
    ? (selectedCompanyId ? companies.find(c => c.id === selectedCompanyId) : null)
    : companies[0];

  return (
    <div className="min-h-screen bg-[#F8F9FB] text-gray-900 font-sans">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md border-b border-gray-100 z-40 px-6 h-20 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {isAdmin && selectedCompanyId && (
            <button 
              onClick={() => setSelectedCompanyId(null)}
              className="p-2 hover:bg-gray-100 rounded-xl transition-colors mr-2 text-gray-500"
            >
              <ArrowLeft size={20} />
            </button>
          )}
          <div className="flex flex-col">
            <Logo />
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1 ml-1">
              {isAdmin ? (selectedCompanyId ? `Empresa: ${currentCompany?.name}` : 'Panel Administración') : `Sede: ${currentCompany?.name}`}
            </p>
          </div>
        </div>

        {(selectedCompanyId || !isAdmin) ? (
          <>
            <div className="hidden md:flex items-center gap-1 bg-gray-100/50 p-1.5 rounded-2xl border border-gray-100">
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

            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowEventForm(true)}
                className="bg-gray-900 hover:bg-black text-white px-6 py-3 rounded-2xl text-sm font-bold transition-all shadow-xl shadow-gray-900/10 active:scale-95 flex items-center gap-2"
              >
                <Plus size={18} />
                <span className="hidden sm:inline">Nuevo Evento</span>
              </button>
              <button 
                onClick={handleSignOut}
                className="p-3 text-gray-400 hover:text-red-600 transition-colors bg-white rounded-2xl border border-gray-100 shadow-sm"
                title="Cerrar Sesión"
              >
                <LogOut size={20} />
              </button>
            </div>
          </>
        ) : (
          <div className="flex items-center gap-4">
             <button
              onClick={() => setShowCompanyForm(true)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-2xl text-sm font-bold transition-all flex items-center gap-2 shadow-xl shadow-emerald-600/10 active:scale-95"
            >
              <Plus size={18} />
              Nueva Empresa
            </button>
            <button 
              onClick={handleSignOut}
              className="p-3 text-gray-400 hover:text-red-600 transition-colors bg-white rounded-2xl border border-gray-100 shadow-sm"
              title="Cerrar Sesión"
            >
              <LogOut size={20} />
            </button>
          </div>
        )}
      </nav>

      {/* Main Content */}
      <main className="pt-32 pb-12 px-6 max-w-7xl mx-auto">
        {isAdmin && !selectedCompanyId ? (
          <>
            <div className="mb-10 flex justify-between items-end">
              <div>
                <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">
                  Empresas Clientes
                </h2>
                <p className="text-gray-400 font-medium mt-1">Gestión centralizada de cuentas corporativas y usuarios.</p>
              </div>
              <div className="flex items-center gap-3 bg-emerald-50 px-4 py-2 rounded-2xl text-emerald-700">
                <UserCheck size={20} />
                <span className="text-xs font-extrabold uppercase">Admin Sistema</span>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {companies.map((company) => (
                <div key={company.id} className="relative group">
                  <div 
                    onClick={() => setSelectedCompanyId(company.id)}
                    className="cursor-pointer"
                  >
                    <CompanyList companies={[company]} onSelect={setSelectedCompanyId} onAddClick={() => {}} />
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowUserModal(company);
                    }}
                    className="absolute bottom-6 right-6 p-2.5 bg-emerald-600 text-white rounded-xl shadow-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-emerald-700 flex items-center gap-2 text-xs font-bold"
                  >
                    <UserPlus size={16} />
                    Gestionar Usuario
                  </button>
                </div>
              ))}
              
              {companies.length === 0 && (
                <div className="col-span-full py-20 text-center space-y-4">
                  <Building2 size={60} className="text-gray-200 mx-auto" />
                  <p className="text-gray-400 font-medium">No hay empresas registradas aún.</p>
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            {/* Config Section */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-10">
              <div>
                <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">
                  {activeTab === 'dashboard' ? 'Panel de Control' : 'Historial de Eventos'}
                </h2>
                <p className="text-gray-400 font-medium mt-1">
                  {currentCompany?.name} • Monitoreo de indicadores de seguridad.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-4">
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
                        value={monthlyConfig.monthlyEmployeeCount[currentMonth] || 0}
                        onChange={(e) => updateMonthlyValue('employeeCount', currentMonth, parseInt(e.target.value) || 0)}
                        onBlur={() => setEditingEmployees(false)}
                      />
                    ) : (
                      <p 
                        className="text-sm font-extrabold text-gray-900 cursor-pointer hover:text-emerald-600 transition-colors"
                        onClick={() => setEditingEmployees(true)}
                      >
                        {monthlyConfig.monthlyEmployeeCount[currentMonth] || 0}
                      </p>
                    )}
                  </div>
                </div>

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
                        value={monthlyConfig.monthlyProgrammedDays[currentMonth] || 0}
                        onChange={(e) => updateMonthlyValue('programmedDays', currentMonth, parseInt(e.target.value) || 0)}
                        onBlur={() => setEditingDays(false)}
                      />
                    ) : (
                      <p 
                        className="text-sm font-extrabold text-gray-900 cursor-pointer hover:text-emerald-600 transition-colors"
                        onClick={() => setEditingDays(true)}
                      >
                        {monthlyConfig.monthlyProgrammedDays[currentMonth] || 0}
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
              <EventList records={records} onDelete={deleteRecord} />
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

      {showUserModal && (
        <CompanyUserModal
          company={showUserModal}
          onClose={() => setShowUserModal(null)}
        />
      )}
    </div>
  );
}

function UserPlus({ size, className }: { size: number, className?: string }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="17" y1="11" x2="23" y2="11"/></svg>;
}
