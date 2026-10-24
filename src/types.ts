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

  status: 'Borrador' | 'En Revisión' | 'Finalizada' | 'Cerrada';
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

// -------------------------------------------------------------
// Tipos para el Módulo de Reporte de Siniestros Viales (PESV / IPAT)
// -------------------------------------------------------------

export interface RoadAccidentDriver {
  id: string;
  fullName: string;
  idType: 'CC' | 'CE' | 'PA' | 'TI' | 'PEP' | 'PPT';
  idNumber: string;
  licenseNumber: string;
  licenseCategory: 'A1' | 'A2' | 'B1' | 'B2' | 'B3' | 'C1' | 'C2' | 'C3';
  licenseExpiry: string;
  phone: string;
  address: string;
  email?: string;
  vehiclePlate?: string; // Placa del vehículo que conducía
  alcoholTestResult?: 'Negativo' | 'Positivo' | 'No realizado' | 'Pendiente';
}

export interface RoadAccidentPerson {
  id: string;
  role: 'Pasajero' | 'Peatón' | 'Ciclista' | 'Acompañante';
  fullName: string;
  idType: string;
  idNumber: string;
  phone: string;
  address: string;
  vehiclePlate?: string;
}

export interface RoadAccidentWitness {
  id: string;
  fullName: string;
  idNumber: string;
  phone: string;
  address?: string;
  statement: string;
}

export interface RoadAccidentAuthority {
  attendedByAuthority: boolean;
  entity: 'Policía de Tránsito' | 'Agente de Tránsito Municipal' | 'Policía de Carreteras (DITRA)' | 'Inspector Vial' | 'Otro';
  officerName: string;
  badgeNumber: string;
  unitOrStation?: string;
  ipatReportNumber?: string;
  observations?: string;
}

export type ImpactZone =
  | 'Frontal'
  | 'Frontal Izquierdo'
  | 'Frontal Derecho'
  | 'Lateral Izquierdo'
  | 'Lateral Derecho'
  | 'Posterior'
  | 'Posterior Izquierdo'
  | 'Posterior Derecho'
  | 'Techo / Volcamiento'
  | 'Parte Inferior';

export interface RoadAccidentVehicle {
  id: string;
  plate: string;
  vehicleType: 'Automóvil' | 'Camioneta' | 'Camión' | 'Tractocamión' | 'Motocicleta' | 'Bus / Microbús' | 'Bicicleta' | 'Maquinaria' | 'Otro';
  brand: string;
  modelLine: string;
  color: string;
  year: string;
  serviceType: 'Particular' | 'Público' | 'Oficial' | 'Carga / Empresa' | 'Especial';
  // Documentación legal
  soatNumber: string;
  soatExpiry: string;
  insuranceCompany: string;
  allRiskPolicyNumber: string;
  rtmNumber: string;
  rtmExpiry: string;
  // Propietario
  ownerSameAsDriver: boolean;
  ownershipType: 'Conductor es el dueño' | 'Tercero Particular' | 'Empresa / Flota Propia' | 'Arrendamiento / Leasing';
  ownerName: string;
  ownerIdNumber: string;
  ownerPhone: string;
  // Daños y Puntos de impacto (Sección 4 vinculada por vehículo)
  visibleDamages: string;
  detachedParts: string;
  damageSeverity: 'Sin Daños' | 'Leve' | 'Moderado' | 'Grave' | 'Pérdida Total';
  immobilized: boolean;
  impactZones: ImpactZone[];
  firstContactPoint: string;
}

export interface RoadAccidentInjury {
  id: string;
  personName: string;
  idNumber: string;
  role: 'Conductor' | 'Pasajero' | 'Peatón' | 'Ciclista';
  severity: 'Leve' | 'Moderada' | 'Grave' | 'Fallecido';
  injuryDescription: string;
  bodyPartsAffected: string;
  transferredToMedicalCenter: boolean;
  medicalCenterName: string;
  ambulanceOrTransport?: string;
}

export interface RoadAccidentMedia {
  id: string;
  category:
    | 'Panorámica de la escena'
    | 'Daños de cerca'
    | 'Estado de las llantas'
    | 'Señales de tránsito'
    | 'Posición final de vehículos'
    | 'Video / Evidencia adicional';
  title: string;
  description: string;
  mediaType: 'image' | 'video';
  dataUrl: string; // base64 image or video URL
  capturedAt?: string;
}

export interface RoadAccidentDriverSignature {
  driverId: string;
  driverName: string;
  idNumber: string;
  vehiclePlate: string;
  ableToSign: boolean;
  unableReason?: string;
  signatureDataUrl?: string;
  signedAt?: string;
}

export interface RoadAccidentReport {
  id: string;
  companyId: string;
  code?: string; // Consecutivo ej. SV-2026-001
  linkedRecordId?: string; // Opcional: vínculo con FURAT

  // 1. Datos Básicos del Hecho (Fecha y Ubicación)
  accidentDate: string;
  accidentTime: string;
  address: string;
  municipality: string;
  department: string;
  zone: 'Urbana' | 'Rural' | 'Tramo Vial Nacional' | 'Instalaciones Internas';
  gpsCoordinates: string; // Lat, Lng
  intersections: string;
  roadDirection: 'Unidireccional' | 'Bidireccional' | 'Doble Calzada' | 'Glorieta / Intersección';
  referencePoints: string;
  // Estado de la vía y del entorno
  weatherCondition: 'Despejado / Seco' | 'Lluvia leve' | 'Lluvia fuerte / Tormenta' | 'Niebla / Neblina' | 'Granizo' | 'Vientos fuertes';
  lightingCondition: 'Luz día natural' | 'Nocturna con buena iluminación' | 'Nocturna con iluminación deficiente' | 'Nocturna sin iluminación' | 'Amanecer / Atardecer';
  roadSurfaceCondition: 'Seco y en buen estado' | 'Pavimento mojado / Húmedo' | 'Con huecos o baches' | 'Material suelto / Gravilla' | 'Derrame de aceite / Sustancias' | 'Vía en obras / Construcción' | 'Destapada / Trocha';
  trafficSignalsPresent: string[]; // ['Señales verticales', 'Demarcación horizontal', 'Semáforo operativo', 'Semáforo fuera de servicio', 'Reductores de velocidad', 'Sin señalización visible']
  roadGeometry: 'Recta plana' | 'Recta con pendiente' | 'Curva plana' | 'Curva con pendiente' | 'Intersección' | 'Puente / Viaducto';
  environmentNotes: string;

  // 2. Identificación de las Personas Involucradas
  drivers: RoadAccidentDriver[];
  passengersAndPedestrians: RoadAccidentPerson[];
  witnesses: RoadAccidentWitness[];
  authority: RoadAccidentAuthority;

  // 3. Información de los Vehículos Involucrados (incluye daños y puntos de impacto por vehículo)
  vehicles: RoadAccidentVehicle[];

  // 4. Descripción de Daños y Lesiones (Resumen general + Lesiones personales)
  collisionType: 'Choque con otro vehículo' | 'Atropello a peatón' | 'Volcamiento' | 'Choque con objeto fijo' | 'Caída de ocupante' | 'Incendio / Otro';
  otherPropertyDamages: string; // Daños a infraestructura, postes, señales, terceros
  hasInjuriesOrFatalities: boolean;
  injuries: RoadAccidentInjury[];

  // 5. Narración, Croquis y Evidencia Fotográfica
  chronologicalNarrative: string;
  estimatedSpeedKmH: string;
  priorManeuvers: string;
  preliminaryCauses: string;
  sketchDataUrl: string; // Croquis topográfico (canvas PNG base64)
  sketchNotes: string;
  mediaEvidences: RoadAccidentMedia[];

  // 6. Firmas y Validaciones
  driverSignatures: RoadAccidentDriverSignature[];
  authoritySignature: {
    officerName: string;
    badgeNumber: string;
    entity: string;
    signatureDataUrl?: string;
    signedAt?: string;
    validationNotes?: string;
  };
  sstVerifierSignature?: {
    name: string;
    idNumber: string;
    position: string;
    signatureDataUrl?: string;
    signedAt?: string;
  };

  status: 'Borrador' | 'En Proceso' | 'Firmado y Validado' | 'Cerrado';
  severity: 'Solo Daños Materiales' | 'Con Lesionados' | 'Con Fallecidos';
  createdAt: string;
  updatedAt: string;
}

