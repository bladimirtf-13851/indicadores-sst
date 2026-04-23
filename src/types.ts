export enum EventType {
  ACCIDENTE = "Accidente",
  INCIDENTE = "Incidente",
  AUSENTISMO = "Ausentismo"
}

export enum AccidentType {
  INCAPACITANTE = "Incapacitante",
  NO_INCAPACITANTE = "No Incapacitante",
  MORTAL = "Mortal"
}

export enum OriginType {
  LABORAL = "Laboral",
  COMUN = "Común"
}

export interface EventRecord {
  id: string;
  companyId?: string;
  date: string;
  description: string;
  eventType: EventType;
  accidentType?: AccidentType; // Only for ACCIDENTE
  origin?: OriginType; // For AUSENTISMO
  lostDays: number;
  chargedDays: number; // For severity calculation
  employeeName: string;
  department: string;
  isNewCase?: boolean; // For absenteeism incidence
}

export interface MonthlyIndicator {
  month: string;
  frecuencia: number;
  severidad: number;
  mortalidad: number;
  prevalenciaEL: number;
  incidenciaEL: number;
  ausentismoMedica: number;
  ausentismoComun: number; // New field
  accidentCount: number;
  incidentCount: number;
  absenteeismCount: number;
  lostDaysTotal: number;
  employeeCount: number;
}

export interface YearlyIndicator {
  year: string;
  frecuencia: number;
  severidad: number;
  mortalidad: number;
  incidenciaEL: number;
  prevalenciaEL: number;
  ausentismoMedica: number;
  accidentCount: number;
}

export interface Company {
  id: string;
  name: string;
  nit: string;
  email: string;
}

export interface CompanyData {
  records: EventRecord[];
  monthlyEmployeeCount: Record<string, number>;
  monthlyProgrammedDays: Record<string, number>;
}

export interface AppState {
  companies: Company[];
  companyData: Record<string, CompanyData>;
  selectedCompanyId: string | null;
}
