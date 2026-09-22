import React, { useState, useEffect } from 'react';
import { useAuth } from './contexts/AuthContext';
import { Company, EventRecord, MonthlyIndicator, YearlyIndicator, AccidentInvestigation, EventType } from './types';
import { firebaseService } from './services/firebaseService';
import Dashboard from './components/Dashboard';
import EventForm from './components/EventForm';
import EventList from './components/EventList';
import CompanyList from './components/CompanyList';
import CompanyForm from './components/CompanyForm';
import CompanyUserModal from './components/CompanyUserModal';
import AccidentInvestigationList from './components/AccidentInvestigationList';
import AccidentInvestigationModal from './components/AccidentInvestigationModal';
import Login from './components/Login';
import Logo from './components/Logo';
import { 
  Plus, 
  Building2, 
  LayoutDashboard, 
  List, 
  LogOut, 
  ArrowLeft, 
  UserCheck, 
  Users, 
  ShieldAlert, 
  RefreshCw, 
  CalendarRange, 
  GitFork,
  FileCheck2,
  CheckCircle
} from 'lucide-react';
import { format, parseISO, differenceInCalendarDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { calculateIndicators, calculateYearlyIndicators } from './services/indicatorService';
import { auth } from './lib/firebase';
import { signOut } from 'firebase/auth';

export default function App() {
  const { user, profile, loading, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'list' | 'investigations'>('dashboard');
  const [showEventForm, setShowEventForm] = useState(false);
  const [editingRecord, setEditingRecord] = useState<EventRecord | null>(null);
  const [showCompanyForm, setShowCompanyForm] = useState(false);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(() => {
    return localStorage.getItem('sst_selected_company');
  });
  const [showUserModal, setShowUserModal] = useState<Company | null>(null);

  // Investigation states
  const [investigations, setInvestigations] = useState<AccidentInvestigation[]>([]);
  const [showInvestigationModal, setShowInvestigationModal] = useState(false);
  const [selectedInvestigation, setSelectedInvestigation] = useState<AccidentInvestigation | null>(null);
  const [investigationTargetRecord, setInvestigationTargetRecord] = useState<EventRecord | null>(null);

  // Persist local UI state
  useEffect(() => {
    if (selectedCompanyId) {
      localStorage.setItem('sst_selected_company', selectedCompanyId);
    } else {
      localStorage.removeItem('sst_selected_company');
    }
  }, [selectedCompanyId]);

  const [companies, setCompanies] = useState<Company[]>([]);
  const [records, setRecords] = useState<EventRecord[]>([]);
  const [monthlyConfig, setMonthlyConfig] = useState<{
    monthlyEmployeeCount: Record<string, number>,
    monthlyProgrammedDays: Record<string, number>
  }>({ monthlyEmployeeCount: {}, monthlyProgrammedDays: {} });

  const [editingEmployees, setEditingEmployees] = useState(false);
  const [editingDays, setEditingDays] = useState(false);
  const [configMonth, setConfigMonth] = useState<string>(() => format(new Date(), 'yyyy-MM'));

  // Firestore Listeners
  useEffect(() => {
    if (user && profile) {
      if (isAdmin) {
        return firebaseService.listenCompanies(setCompanies);
      } else if (profile.companyId) {
        firebaseService.getCompanies().then(list => {
          const mine = list.find(c => c.id === profile.companyId);
          if (mine) setCompanies([mine]);
        });
      }
    }
  }, [user, profile, isAdmin]);

  // Record, Config & Investigation listeners based on company selection
  useEffect(() => {
    const companyIdToTrack = isAdmin ? selectedCompanyId : profile?.companyId;
    
    if (companyIdToTrack) {
      const unsubRecords = firebaseService.listenRecords(companyIdToTrack, setRecords);
      const unsubConfigs = firebaseService.listenConfigs(companyIdToTrack, setMonthlyConfig);
      const unsubInvestigations = firebaseService.listenInvestigations(companyIdToTrack, setInvestigations);
      return () => {
        unsubRecords();
        unsubConfigs();
        unsubInvestigations();
      };
    } else {
      setRecords([]);
      setMonthlyConfig({ monthlyEmployeeCount: {}, monthlyProgrammedDays: {} });
      setInvestigations([]);
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

  // Security barrier: if user exists but no profile, check pending status
  if (!profile) {
    return (
      <div className="min-h-screen bg-[#F8F9FB] flex items-center justify-center p-6">
        <div className="bg-white p-10 rounded-[40px] shadow-2xl max-w-md w-full text-center space-y-6">
          <ShieldAlert size={60} className="text-amber-500 mx-auto" />
          <h2 className="text-2xl font-bold text-gray-900">Configuración Pendiente</h2>
          <p className="text-gray-500 text-sm">Tu cuenta no tiene un perfil asignado o está pendiente de aprobación por el administrador.</p>
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-white text-gray-900 border border-gray-200 font-bold py-3 rounded-2xl flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors"
          >
            <RefreshCw size={18} />
            Reintentar Carga
          </button>
          
          <button 
            onClick={() => signOut(auth)}
            className="w-full text-gray-400 font-bold py-2 text-xs hover:text-red-500 transition-colors"
          >
            Cerrar Sesión
          </button>
          
          {(user?.email?.toLowerCase() === 'bladimirtf@gmail.com' || user?.email?.toLowerCase() === 'bladimir.torres@edu-flex.com') && (
            <div className="pt-6 border-t border-gray-100 mt-4">
              <p className="text-[10px] text-emerald-600 font-black uppercase mb-3 tracking-widest">Acceso de Administrador Maestro</p>
              <button
                onClick={async () => {
                  try {
                    await firebaseService.createUserProfile(user.uid, user.email!, 'admin');
                    alert("¡Perfil de Administrador Global Activado!");
                    window.location.reload();
                  } catch (err) {
                    alert("Error al crear perfil: " + (err instanceof Error ? err.message : "Error desconocido"));
                  }
                }}
                className="w-full bg-emerald-600 text-white font-black py-4 rounded-3xl transition-all shadow-xl shadow-emerald-200 hover:bg-emerald-700 active:scale-[0.98]"
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
    try {
      await firebaseService.addCompany(companyData);
      setShowCompanyForm(false);
    } catch (err) {
      alert("Error al guardar la empresa: " + (err instanceof Error ? err.message : "Error"));
    }
  };

  const addRecord = async (record: Omit<EventRecord, 'id'>) => {
    const cid = isAdmin ? selectedCompanyId : profile?.companyId;
    if (!cid) {
      const msg = "No se ha seleccionado ninguna empresa para asociar este registro. Por favor seleccione una empresa primero.";
      alert(msg);
      throw new Error(msg);
    }
    try {
      await firebaseService.addRecord({ ...record, companyId: cid });
      setShowEventForm(false);
      setEditingRecord(null);
    } catch (err) {
      console.error("Error al guardar registro:", err);
      const msg = err instanceof Error ? err.message : "Error de permisos o conexión";
      alert("Error al guardar el registro: " + msg);
      throw err;
    }
  };

  const updateRecord = async (id: string, record: Partial<EventRecord>) => {
    try {
      await firebaseService.updateRecord(id, record);
      setShowEventForm(false);
      setEditingRecord(null);
    } catch (err) {
      console.error("Error al actualizar registro:", err);
      const msg = err instanceof Error ? err.message : "Error de permisos o conexión";
      alert("Error al actualizar el registro: " + msg);
      throw err;
    }
  };

  const handleEditRecord = (record: EventRecord) => {
    setEditingRecord(record);
    setShowEventForm(true);
  };

  const deleteRecord = async (id: string) => {
    if (!confirm("¿Está seguro de eliminar este registro permanentemente?")) return;
    try {
      await firebaseService.deleteRecord(id);
    } catch (err) {
      alert("No se pudo eliminar el registro: Error de permisos.");
    }
  };

  const updateMonthlyValue = async (key: 'employeeCount' | 'programmedDays', month: string, value: number) => {
    const cid = isAdmin ? selectedCompanyId : profile.companyId;
    if (!cid) return;

    try {
      const currentConfigsForMonth = {
        employeeCount: monthlyConfig.monthlyEmployeeCount[month] || 0,
        programmedDays: monthlyConfig.monthlyProgrammedDays[month] || 0
      };

      const updatedValue = { ...currentConfigsForMonth, [key]: value };
      await firebaseService.updateConfig(cid, month, updatedValue.employeeCount, updatedValue.programmedDays);
    } catch (err) {
      console.error("Error updating config:", err);
    }
  };

  // KPI Calculations
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

  const currentCompany = isAdmin 
    ? (selectedCompanyId ? companies.find(c => c.id === selectedCompanyId) : null)
    : companies[0];

  // Count pending investigations and overdue (>15 calendar days) for accident records
  const finalizedRecordIds = new Set(
    investigations.filter(inv => inv.status === 'Finalizada').map(inv => inv.recordId)
  );
  const investigatedRecordIds = new Set(investigations.map(inv => inv.recordId));
  
  const pendingAccidentsCount = records.filter(
    r => r.eventType === EventType.ACCIDENTE && !investigatedRecordIds.has(r.id)
  ).length;

  const overdueAccidentsCount = records.filter(r => {
    if (r.eventType !== EventType.ACCIDENTE || finalizedRecordIds.has(r.id)) return false;
    try {
      return differenceInCalendarDays(new Date(), parseISO(r.date)) > 15;
    } catch {
      return false;
    }
  }).length;

  return (
    <div className="min-h-screen bg-[#F8F9FB] text-gray-900 font-sans">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md border-b border-gray-100 z-40 px-6 h-20 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {isAdmin && selectedCompanyId && (
            <button 
              onClick={() => setSelectedCompanyId(null)}
              className="p-2 hover:bg-gray-100 rounded-xl transition-colors mr-2 text-gray-500"
              title="Volver a lista de empresas"
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
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'dashboard' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <LayoutDashboard size={16} />
                Indicadores KPI
              </button>
              <button
                onClick={() => setActiveTab('list')}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'list' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <List size={16} />
                Reporte Eventos (FURAT)
              </button>
              <button
                onClick={() => setActiveTab('investigations')}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all relative ${
                  activeTab === 'investigations' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <GitFork size={16} />
                Investigaciones (Res. 1401)
                {overdueAccidentsCount > 0 ? (
                  <span 
                    title={`${overdueAccidentsCount} investigaciones vencidas (+15 días)`}
                    className="ml-1 px-1.5 py-0.5 bg-red-600 text-white rounded-full text-[9px] font-black animate-pulse flex items-center gap-0.5 shadow-xs"
                  >
                    <span>{overdueAccidentsCount}</span>
                    <span className="text-[7px]">!</span>
                  </span>
                ) : pendingAccidentsCount > 0 ? (
                  <span className="ml-1 px-1.5 py-0.5 bg-amber-500 text-white rounded-full text-[9px] font-black animate-pulse">
                    {pendingAccidentsCount}
                  </span>
                ) : null}
              </button>
            </div>

            <div className="flex items-center gap-3">
              {isAdmin && currentCompany && (
                <button
                  onClick={() => setShowUserModal(currentCompany)}
                  className="bg-white hover:bg-gray-50 text-emerald-600 border border-gray-200 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all active:scale-95 flex items-center gap-2 shadow-xs"
                  title="Gestionar Accesos y Usuarios de esta Empresa"
                >
                  <Users size={16} />
                  <span className="hidden sm:inline">Usuarios</span>
                </button>
              )}
              
              <button
                onClick={() => setShowEventForm(true)}
                className="bg-gray-900 hover:bg-black text-white px-5 py-2.5 rounded-2xl text-xs font-bold transition-all shadow-lg shadow-gray-900/10 active:scale-95 flex items-center gap-2"
              >
                <Plus size={16} />
                <span className="hidden sm:inline">Nuevo Evento</span>
              </button>

              <button 
                onClick={handleSignOut}
                className="p-2.5 text-gray-400 hover:text-red-600 transition-colors bg-white rounded-2xl border border-gray-100 shadow-xs"
                title="Cerrar Sesión"
              >
                <LogOut size={18} />
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
                <p className="text-gray-400 font-medium mt-1">Gestión centralizada de cuentas corporativas y accesos.</p>
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
                    <Users size={16} />
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
            {/* Top Bar / Configuration */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-10">
              <div>
                <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">
                  {activeTab === 'dashboard' ? 'Panel de Indicadores KPI' : activeTab === 'list' ? 'Registro de Eventos (FURAT)' : 'Investigaciones de Accidentes'}
                </h2>
                <p className="text-gray-400 font-medium mt-1">
                  {currentCompany?.name} • Cumplimiento Resolución 0312/2019 & Resolución 1401/2007.
                </p>
              </div>

              {/* Monthly Config Quick Bar */}
              <div className="flex flex-wrap items-center gap-3">
                {/* Period Selector */}
                <div className="bg-white px-4 py-2 rounded-2xl border border-gray-100 shadow-xs flex items-center gap-2.5">
                  <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-xl">
                    <CalendarRange size={16} />
                  </div>
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-gray-400">Mes a Configurar</p>
                    <select
                      value={configMonth}
                      onChange={(e) => setConfigMonth(e.target.value)}
                      className="text-xs font-extrabold text-gray-800 bg-transparent outline-none cursor-pointer pr-1"
                    >
                      {Array.from({ length: 12 }, (_, i) => {
                        const mStr = `${new Date().getFullYear()}-${(i + 1).toString().padStart(2, '0')}`;
                        let label = mStr;
                        try {
                          const formatted = format(parseISO(`${mStr}-01`), 'MMMM yyyy', { locale: es });
                          label = formatted.charAt(0).toUpperCase() + formatted.slice(1);
                        } catch (e) {}
                        return (
                          <option key={mStr} value={mStr}>
                            {label}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                </div>

                {/* Workers Count */}
                <div className="bg-white px-4 py-2 rounded-2xl border border-gray-100 shadow-xs flex items-center gap-2.5">
                  <div className="p-1.5 bg-blue-50 text-blue-600 rounded-xl">
                    <Users size={16} />
                  </div>
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-gray-400">Trabajadores</p>
                    {editingEmployees ? (
                      <input
                        type="number"
                        autoFocus
                        min="0"
                        className="text-xs font-extrabold w-16 outline-none border-b-2 border-emerald-500"
                        value={monthlyConfig.monthlyEmployeeCount[configMonth] || 0}
                        onChange={(e) => updateMonthlyValue('employeeCount', configMonth, parseInt(e.target.value) || 0)}
                        onBlur={() => setEditingEmployees(false)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') setEditingEmployees(false);
                        }}
                      />
                    ) : (
                      <p 
                        className="text-xs font-extrabold text-gray-900 cursor-pointer hover:text-emerald-600 transition-colors flex items-center gap-1"
                        onClick={() => setEditingEmployees(true)}
                        title="Clic para editar trabajadores del mes"
                      >
                        {monthlyConfig.monthlyEmployeeCount[configMonth] || 0}
                        <span className="text-[10px] text-gray-400 font-normal">pers.</span>
                      </p>
                    )}
                  </div>
                </div>

                {/* Programmed Days */}
                <div className="bg-white px-4 py-2 rounded-2xl border border-gray-100 shadow-xs flex items-center gap-2.5">
                  <div className="p-1.5 bg-amber-50 text-amber-600 rounded-xl">
                    <CalendarRange size={16} />
                  </div>
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-gray-400">Días Programados</p>
                    {editingDays ? (
                      <input
                        type="number"
                        autoFocus
                        min="0"
                        className="text-xs font-extrabold w-20 outline-none border-b-2 border-emerald-500"
                        value={monthlyConfig.monthlyProgrammedDays[configMonth] || 0}
                        onChange={(e) => updateMonthlyValue('programmedDays', configMonth, parseInt(e.target.value) || 0)}
                        onBlur={() => setEditingDays(false)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') setEditingDays(false);
                        }}
                      />
                    ) : (
                      <p 
                        className="text-xs font-extrabold text-gray-900 cursor-pointer hover:text-emerald-600 transition-colors flex items-center gap-1"
                        onClick={() => setEditingDays(true)}
                        title="Clic para editar días programados"
                      >
                        {monthlyConfig.monthlyProgrammedDays[configMonth] || 0}
                        <span className="text-[10px] text-gray-400 font-normal">días</span>
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Content Area according to active tab */}
            {activeTab === 'dashboard' && (
              <Dashboard 
                data={indicators} 
                yearlyData={yearlyIndicators}
                selectedMonth={configMonth}
                onMonthChange={(m) => setConfigMonth(m)}
                onUpdateEmployeeCount={(month, count) => {
                  updateMonthlyValue('employeeCount', month, count);
                }}
                company={currentCompany}
                records={records}
                investigations={investigations}
                programmedDays={monthlyConfig.monthlyProgrammedDays[configMonth] || 0}
                onNavigateToInvestigation={(record) => {
                  if (record) {
                    const existingInv = investigations.find(i => i.recordId === record.id);
                    if (existingInv) {
                      setSelectedInvestigation(existingInv);
                    } else {
                      setSelectedInvestigation(null);
                    }
                    setInvestigationTargetRecord(record);
                    setShowInvestigationModal(true);
                  } else {
                    setActiveTab('investigations');
                  }
                }}
              />
            )}

            {activeTab === 'list' && (
              <EventList 
                records={records} 
                investigations={investigations}
                onDelete={deleteRecord} 
                onEdit={handleEditRecord}
                onInvestigate={(record) => {
                  const existingInv = investigations.find(i => i.recordId === record.id);
                  if (existingInv) {
                    setSelectedInvestigation(existingInv);
                  } else {
                    setSelectedInvestigation(null);
                  }
                  setInvestigationTargetRecord(record);
                  setShowInvestigationModal(true);
                }}
              />
            )}

            {activeTab === 'investigations' && (
              <AccidentInvestigationList
                company={currentCompany || null}
                records={records}
                investigations={investigations}
                onNewInvestigation={(record) => {
                  setInvestigationTargetRecord(record || null);
                  setSelectedInvestigation(null);
                  setShowInvestigationModal(true);
                }}
                onEditInvestigation={(inv) => {
                  setSelectedInvestigation(inv);
                  const matchingRecord = records.find(r => r.id === inv.recordId) || null;
                  setInvestigationTargetRecord(matchingRecord);
                  setShowInvestigationModal(true);
                }}
                onDeleteInvestigation={async (id) => {
                  if (confirm("¿Está seguro de eliminar esta investigación de forma permanente?")) {
                    await firebaseService.deleteInvestigation(id);
                  }
                }}
              />
            )}
          </>
        )}
      </main>

      {/* Modals */}
      {showEventForm && (
        <EventForm 
          onAdd={addRecord} 
          onUpdate={updateRecord}
          onClose={() => {
            setShowEventForm(false);
            setEditingRecord(null);
          }} 
          editRecord={editingRecord}
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

      {showInvestigationModal && (
        <AccidentInvestigationModal
          company={currentCompany || null}
          records={records}
          initialRecord={investigationTargetRecord}
          existingInvestigation={selectedInvestigation}
          onSave={async (invData, existingId) => {
            const cid = isAdmin ? selectedCompanyId : profile?.companyId;
            if (!cid) return;
            try {
              if (existingId) {
                await firebaseService.updateInvestigation(existingId, invData);
              } else {
                await firebaseService.addInvestigation({ ...invData, companyId: cid });
              }
              setShowInvestigationModal(false);
              setSelectedInvestigation(null);
              setInvestigationTargetRecord(null);
            } catch (err: any) {
              alert("Error al guardar la investigación: " + (err?.message || "Error desconocido"));
            }
          }}
          onClose={() => {
            setShowInvestigationModal(false);
            setSelectedInvestigation(null);
            setInvestigationTargetRecord(null);
          }}
        />
      )}
    </div>
  );
}
