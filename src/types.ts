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
  time?: string;
  description: string;
  eventType: EventType;
  accidentType?: AccidentType;
  origin?: OriginType;
  lostDays: number;
  chargedDays: number;
  employeeName: string;
  idNumber?: string;
  position?: string;
  seniority?: string;
  employmentType?: string;
  workdayType?: string;
  location?: string;
  locationOther?: string;
  accidentAgent?: string[];
  accidentAgentOther?: string;
  injuryType?: string[];
  injuryTypeOther?: string;
  bodyPart?: string[];
  mechanism?: string[];
  mechanismOther?: string;
  department: string;
  isNewCase?: boolean;
  incapacityStartDate?: string;
  incapacityEndDate?: string;
  potentialCauses?: string;
  correctiveActions?: string;
}

export const FORM_OPTIONS = {
  employmentTypes: ['Planta / Contrato Directo', 'Misión / Temporal', 'Subcontratista', 'Independiente / Prestación', 'Estudiante / Pasante', 'Otro'],
  workdayTypes: ['Jornada Ordinaria', 'Tiempo Extra', 'Turno de Descanso', 'Otras'],
  locations: [
    'Almacenes o depósitos', 'Áreas de producción', 'Áreas recreativas o deportivas', 
    'Áreas fuera de la empresa', 'Corredores o pasillos', 'Escaleras', 
    'Parqueaderos o áreas de circulación vehicular', 'Oficinas', 'Otras áreas comunes', 'Otro'
  ],
  accidentAgents: [
    'Máquinas y/o equipos', 'Medios de transporte', 'Aparatos', 
    'Herramientas, implementos o utensilios', 'Materiales o sustancias', 
    'Ambiente de trabajo', 'Animales'
  ],
  injuryTypes: [
    'Fractura', 'Luxación', 'Torcidura', 'Esguince', 'Desgarro muscular', 
    'Hernia o laceración de músculo o tendón', 'Sin herida', 'Conmoción o trauma interno', 
    'Amputación o enucleación', 'Herida', 'Trauma superficial', 'Golpe o contusión', 
    'Quemadura', 'Envenenamiento o intoxicación', 'Efecto del clima / ambiente', 
    'Asfixia', 'Efecto de la electricidad', 'Efecto de radiación', 'Lesiones múltiples', 'Otro'
  ],
  bodyParts: [
    'Cabeza', 'Ojo', 'Cuello', 'Tronco (incluye espalda/columna)', 
    'Tórax', 'Abdomen', 'Miembros superiores', 'Manos', 
    'Miembros inferiores', 'Pies', 'Ubicaciones múltiples', 'Lesiones generales'
  ],
  mechanisms: [
    'Caída de personas', 'Caída de objetos', 'Pisadas, choques o golpes', 
    'Atrapamientos', 'Sobreesfuerzo / falso movimiento', 'Temperatura extrema', 
    'Contacto con electricidad', 'Sustancias nocivas / radiaciones', 'Otro'
  ]
};

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
