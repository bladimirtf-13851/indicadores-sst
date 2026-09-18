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

export interface CorrectiveActionItem {
  id: string;
  description: string;
  responsibleName: string;
  responsiblePosition: string;
  responsibleEmail: string;
  executionDate: string;
  notificationSent: boolean;
  status: 'Abierto' | 'Cerrado';
  evidenceFileName?: string;
  evidenceFileData?: string; // base64 string
  evidenceFileSize?: string;
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
  
  // FURAT - Datos Entidades y Seguridad Social
  eps?: string;
  epsCode?: string;
  arl?: string;
  arlCode?: string;
  afp?: string;
  afpCode?: string;
  
  // FURAT - Centro de trabajo y Sede
  sameWorkCenter?: boolean;
  workCenterName?: string;
  workCenterActivity?: string;
  workCenterAddress?: string;
  workCenterDepartment?: string;
  workCenterMunicipality?: string;
  workCenterZone?: 'U' | 'R';

  // FURAT - Datos detallados del trabajador
  firstSurname?: string;
  secondSurname?: string;
  firstName?: string;
  secondName?: string;
  idType?: 'CC' | 'CE' | 'TI' | 'PA' | 'PEP' | 'PPT';
  birthDate?: string;
  gender?: 'M' | 'F';
  employeeAddress?: string;
  employeePhone?: string;
  employeeDepartment?: string;
  employeeMunicipality?: string;
  employeeZone?: 'U' | 'R';
  habitualOccupation?: string;
  occupationCode?: string;
  hireDate?: string;
  monthlySalary?: number | string;
  workdaySchedule?: 'Diurna' | 'Nocturna' | 'Mixta' | 'Por turnos';

  // FURAT - Datos detallados del accidente
  weekDay?: 'Lunes' | 'Martes' | 'Miércoles' | 'Jueves' | 'Viernes' | 'Sábado' | 'Domingo';
  doingHabitualWork?: boolean;
  nonHabitualWorkDetail?: string;
  workedTimeBeforeAccident?: string;
  accidentCircumstance?: 'Propios del trabajo' | 'Violencia' | 'Tránsito' | 'Deportivo' | 'Recreativo o cultural';
  causedDeath?: boolean;
  accidentLocationType?: 'Dentro de la empresa' | 'Fuera de la empresa';
  accidentDepartment?: string;
  accidentMunicipality?: string;
  accidentZone?: 'U' | 'R';

  // FURAT - Testigos en el reporte
  hasWitnesses?: boolean;
  witnesses?: Array<{
    name: string;
    idType: string;
    idNumber: string;
    position: string;
  }>;

  // FURAT - Responsable del informe
  reportResponsibleName?: string;
  reportResponsiblePosition?: string;
  reportResponsibleIdType?: string;
  reportResponsibleIdNumber?: string;
  reportDate?: string;

  // Campos heredados (ahora gestionados en el módulo de investigación)
  potentialCauses?: string;
  correctiveActions?: string;
  correctiveActionsList?: CorrectiveActionItem[];
}

// -------------------------------------------------------------
// Tipos para el Módulo de Investigación de Accidentes (Res. 1401/2007)
// -------------------------------------------------------------

export interface InvestigationWitness {
  id: string;
  name: string;
  idType: string;
  idNumber: string;
  position: string;
  testimony: string;
}

export interface InvestigationActionItem {
  id: string;
  description: string;
  hierarchy: 'Fuente' | 'Medio' | 'Individuo';
  responsibleName: string;
  responsiblePosition: string;
  executionDate: string;
  followUpDate: string;
  status: 'Abierto' | 'En Proceso' | 'Implementado';
  verificationNotes?: string;
}

export interface InvestigationEvidence {
  id: string;
  title: string;
  description: string;
  dataUrl: string; // base64
  date?: string;
}

export interface CommitteeSignature {
  name: string;
  idNumber: string;
  position: string;
  licenseNumber?: string; // Para responsable SST
  signatureDataUrl?: string; // Firma dibujada / cargada
  signedDate?: string;
}

export interface AccidentInvestigation {
  id: string;
  companyId: string;
  recordId: string; // ID del accidente reportado
  investigationDate: string;
  investigationPlace: string;
  severity: 'Leve' | 'Grave' | 'Mortal';
  daysLostActual: number;

  // Resumen del accidentado (traído del reporte)
  employeeName: string;
  idType: string;
  idNumber: string;
  position: string;
  department: string;
  seniority?: string;
  habitualOccupation?: string;
  accidentDate: string;
  accidentTime?: string;
  injuryDescription?: string;
  bodyPart?: string;

  // 1. Cronología y descripción detallada (Res. 1401)
  workProcess: string; // Tarea o proceso que se ejecutaba
  priorEvents: string; // Hechos previos al accidente
  eventDescription: string; // Descripción detallada de cómo ocurrió
  afterEvents: string; // Hechos posteriores y atención inmediata

  // 2. Testigos presenciales
  hasWitnesses: boolean;
  witnesses: InvestigationWitness[];

  // 3. Árbol de Causas
  lossDescription: string; // Consecuencia / Suceso de pérdida (raíz)
  immediateActs: string[]; // Actos inseguros / subestándar
  immediateConditions: string[]; // Condiciones inseguras / subestándar
  basicPersonalFactors: string[]; // Factores personales
  basicWorkFactors: string[]; // Factores de trabajo

  // 4. Plan de Acción (Medidas de Intervención)
  actionPlan: InvestigationActionItem[];

  // 5. Registro Fotográfico / Evidencias
  evidences: InvestigationEvidence[];

  // 6. Comentarios y Conclusiones del Área de SST
  sstComments: string;

  // 7. Firmas de Responsables (Res. 1401/2007)
  sstLeader: CommitteeSignature; // Responsable SG-SST (con licencia SST)
  copasstRep: CommitteeSignature; // Representante Copasst o Vigía
  immediateBoss: CommitteeSignature; // Jefe Inmediato
  technicalSupport: CommitteeSignature; // Apoyo Técnico / Especialista
  legalRepApproval: CommitteeSignature; // Aprobación Representante Legal

  status: 'Borrador' | 'Finalizada';
  createdAt: string;
  updatedAt: string;
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
