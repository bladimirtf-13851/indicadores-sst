import React, { useState } from 'react';
import {
  Company,
  RoadAccidentReport,
  RoadAccidentDriver,
  RoadAccidentPerson,
  RoadAccidentWitness,
  RoadAccidentVehicle,
  RoadAccidentInjury,
  RoadAccidentMedia,
  RoadAccidentDriverSignature,
  ImpactZone,
} from '../types';
import SignaturePad from './SignaturePad';
import RoadSketchCanvas from './RoadSketchCanvas';
import { generateRoadAccidentPdf } from '../services/roadAccidentPdfService';
import {
  X,
  MapPin,
  Users,
  Car,
  AlertTriangle,
  Camera,
  FileSignature,
  Plus,
  Trash2,
  Navigation,
  FileDown,
  Save,
  ShieldAlert,
  CheckCircle2,
  Video,
  Image as ImageIcon,
} from 'lucide-react';

interface Props {
  company: Company | null;
  existingReport?: RoadAccidentReport | null;
  onSave: (reportData: Omit<RoadAccidentReport, 'id'>, existingId?: string) => Promise<void>;
  onClose: () => void;
}

const IMPACT_ZONES: ImpactZone[] = [
  'Frontal',
  'Frontal Izquierdo',
  'Frontal Derecho',
  'Lateral Izquierdo',
  'Lateral Derecho',
  'Posterior',
  'Posterior Izquierdo',
  'Posterior Derecho',
  'Techo / Volcamiento',
  'Parte Inferior',
];

const TRAFFIC_SIGNAL_OPTIONS = [
  'Señales verticales reglamentarias (PARE / Ceda el paso)',
  'Señales preventivas / informativas',
  'Demarcación horizontal (Líneas de carril / Paso peatonal)',
  'Semáforo operativo',
  'Semáforo intermitente o fuera de servicio',
  'Reductores de velocidad / Resaltos',
  'Señalización temporal de obra',
  'Sin señalización visible',
];

// Helper to compress uploaded images so Firestore document stays well below 1MB
const compressImageFile = (file: File, maxWidth = 900, quality = 0.72): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let w = img.width;
        let h = img.height;
        if (w > maxWidth) {
          h = Math.round((h * maxWidth) / w);
          w = maxWidth;
        }
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve(e.target?.result as string);
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export default function RoadAccidentModal({ company, existingReport, onSave, onClose }: Props) {
  const [activeStep, setActiveStep] = useState<1 | 2 | 3 | 4 | 5 | 6>(1);
  const [saving, setSaving] = useState(false);
  const [locatingGps, setLocatingGps] = useState(false);

  const todayStr = new Date().toISOString().split('T')[0];
  const nowTimeStr = new Date().toTimeString().slice(0, 5);

  const [formData, setFormData] = useState<Omit<RoadAccidentReport, 'id'>>(() => {
    if (existingReport) {
      const { id, ...rest } = existingReport;
      return rest;
    }
    const defaultDriverId = crypto.randomUUID();
    return {
      companyId: company?.id || '',
      code: `SV-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      accidentDate: todayStr,
      accidentTime: nowTimeStr,
      address: '',
      municipality: '',
      department: '',
      zone: 'Urbana',
      gpsCoordinates: '',
      intersections: '',
      roadDirection: 'Bidireccional',
      referencePoints: '',
      weatherCondition: 'Despejado / Seco',
      lightingCondition: 'Luz día natural',
      roadSurfaceCondition: 'Seco y en buen estado',
      trafficSignalsPresent: ['Demarcación horizontal (Líneas de carril / Paso peatonal)'],
      roadGeometry: 'Recta plana',
      environmentNotes: '',
      drivers: [
        {
          id: defaultDriverId,
          fullName: '',
          idType: 'CC',
          idNumber: '',
          licenseNumber: '',
          licenseCategory: 'B1',
          licenseExpiry: '',
          phone: '',
          address: '',
          email: '',
          vehiclePlate: '',
          alcoholTestResult: 'Negativo',
        },
      ],
      passengersAndPedestrians: [],
      witnesses: [],
      authority: {
        attendedByAuthority: true,
        entity: 'Agente de Tránsito Municipal',
        officerName: '',
        badgeNumber: '',
        unitOrStation: '',
        ipatReportNumber: '',
        observations: '',
      },
      vehicles: [
        {
          id: crypto.randomUUID(),
          plate: '',
          vehicleType: 'Automóvil',
          brand: '',
          modelLine: '',
          color: '',
          year: '',
          serviceType: 'Empresa' as any,
          soatNumber: '',
          soatExpiry: '',
          insuranceCompany: '',
          allRiskPolicyNumber: '',
          rtmNumber: '',
          rtmExpiry: '',
          ownerSameAsDriver: false,
          ownershipType: 'Empresa / Flota Propia',
          ownerName: company?.name || '',
          ownerIdNumber: company?.nit || '',
          ownerPhone: '',
          visibleDamages: '',
          detachedParts: '',
          damageSeverity: 'Leve',
          immobilized: false,
          impactZones: ['Frontal'],
          firstContactPoint: '',
        },
      ],
      collisionType: 'Choque con otro vehículo',
      otherPropertyDamages: '',
      hasInjuriesOrFatalities: false,
      injuries: [],
      chronologicalNarrative: '',
      estimatedSpeedKmH: '',
      priorManeuvers: '',
      preliminaryCauses: '',
      sketchDataUrl: '',
      sketchNotes: '',
      mediaEvidences: [],
      driverSignatures: [
        {
          driverId: defaultDriverId,
          driverName: '',
          idNumber: '',
          vehiclePlate: '',
          ableToSign: true,
          signatureDataUrl: '',
          signedAt: todayStr,
        },
      ],
      authoritySignature: {
        officerName: '',
        badgeNumber: '',
        entity: 'Agente de Tránsito Municipal',
        signatureDataUrl: '',
        signedAt: todayStr,
        validationNotes: '',
      },
      sstVerifierSignature: {
        name: '',
        idNumber: '',
        position: 'Coordinador PESV / SST',
        signatureDataUrl: '',
        signedAt: todayStr,
      },
      status: 'En Proceso',
      severity: 'Solo Daños Materiales',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  });

  // Synchronize driverSignatures whenever drivers list changes
  const syncDriverSignatures = (driversList: RoadAccidentDriver[]) => {
    setFormData(prev => {
      const updatedSigs: RoadAccidentDriverSignature[] = driversList.map(d => {
        const existingSig = prev.driverSignatures.find(s => s.driverId === d.id);
        return {
          driverId: d.id,
          driverName: d.fullName,
          idNumber: d.idNumber,
          vehiclePlate: d.vehiclePlate || '',
          ableToSign: existingSig ? existingSig.ableToSign : true,
          unableReason: existingSig?.unableReason || '',
          signatureDataUrl: existingSig?.signatureDataUrl || '',
          signedAt: existingSig?.signedAt || todayStr,
        };
      });
      return { ...prev, drivers: driversList, driverSignatures: updatedSigs };
    });
  };

  const handleCaptureGps = () => {
    if (!navigator.geolocation) {
      alert('Su navegador no soporta geolocalización GPS.');
      return;
    }
    setLocatingGps(true);
    navigator.geolocation.getCurrentPosition(
      pos => {
        const coords = `${pos.coords.latitude.toFixed(6)}, ${pos.coords.longitude.toFixed(6)}`;
        setFormData(prev => ({ ...prev, gpsCoordinates: coords }));
        setLocatingGps(false);
      },
      () => {
        setLocatingGps(false);
        alert('No se pudo obtener la ubicación GPS automáticamente. Puede escribir las coordenadas manualmente.');
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const toggleSignal = (sig: string) => {
    setFormData(prev => {
      const exists = prev.trafficSignalsPresent.includes(sig);
      return {
        ...prev,
        trafficSignalsPresent: exists
          ? prev.trafficSignalsPresent.filter(s => s !== sig)
          : [...prev.trafficSignalsPresent, sig],
      };
    });
  };

  const toggleVehicleImpactZone = (vehicleIdx: number, zone: ImpactZone) => {
    setFormData(prev => {
      const updated = [...prev.vehicles];
      const v = { ...updated[vehicleIdx] };
      const exists = v.impactZones.includes(zone);
      v.impactZones = exists ? v.impactZones.filter(z => z !== zone) : [...v.impactZones, zone];
      updated[vehicleIdx] = v;
      return { ...prev, vehicles: updated };
    });
  };

  const handleAddMediaFile = async (
    file: File,
    category: RoadAccidentMedia['category'],
    title: string,
    description: string
  ) => {
    try {
      const isVideo = file.type.startsWith('video/');
      if (isVideo && file.size > 700 * 1024) {
        alert('Para videos, por favor suba un clip corto (< 700 KB) o registre fotogramas clave para no exceder el límite de almacenamiento.');
        return;
      }
      const dataUrl = isVideo
        ? await new Promise<string>((res, rej) => {
            const r = new FileReader();
            r.onload = () => res(r.result as string);
            r.onerror = rej;
            r.readAsDataURL(file);
          })
        : await compressImageFile(file);

      const newMedia: RoadAccidentMedia = {
        id: crypto.randomUUID(),
        category,
        title: title || file.name,
        description,
        mediaType: isVideo ? 'video' : 'image',
        dataUrl,
        capturedAt: new Date().toISOString(),
      };

      setFormData(prev => ({
        ...prev,
        mediaEvidences: [...prev.mediaEvidences, newMedia],
      }));
    } catch (e) {
      console.error('Error loading media:', e);
    }
  };

  // Media Upload Draft States
  const [newMediaCategory, setNewMediaCategory] = useState<RoadAccidentMedia['category']>('Panorámica de la escena');
  const [newMediaTitle, setNewMediaTitle] = useState('');
  const [newMediaDesc, setNewMediaDesc] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.address.trim()) {
      alert('Por favor ingrese la dirección o ubicación del siniestro vial en la Sección 1.');
      setActiveStep(1);
      return;
    }

    setSaving(true);
    try {
      const hasFatal = formData.injuries.some(i => i.severity === 'Fallecido');
      const hasInjured = formData.injuries.length > 0;
      const computedSeverity: RoadAccidentReport['severity'] = hasFatal
        ? 'Con Fallecidos'
        : hasInjured
        ? 'Con Lesionados'
        : 'Solo Daños Materiales';

      await onSave(
        {
          ...formData,
          hasInjuriesOrFatalities: hasInjured,
          severity: computedSeverity,
          updatedAt: new Date().toISOString(),
        },
        existingReport?.id
      );
    } finally {
      setSaving(false);
    }
  };

  const steps = [
    { num: 1, title: '1. Hecho y Vía', icon: MapPin },
    { num: 2, title: '2. Personas y Autoridad', icon: Users },
    { num: 3, title: '3. Vehículos y SOAT', icon: Car },
    { num: 4, title: '4. Daños y Lesiones', icon: AlertTriangle },
    { num: 5, title: '5. Relato, Croquis y Fotos', icon: Camera },
    { num: 6, title: '6. Firmas y Validación', icon: FileSignature },
  ] as const;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-[32px] shadow-2xl border border-gray-100 w-full max-w-6xl max-h-[94vh] flex flex-col overflow-hidden">
        {/* Top Modal Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-2xl">
              <Car size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-lg font-extrabold tracking-tight">
                  {existingReport ? 'Editar Reporte de Siniestro Vial' : 'Nuevo Reporte de Siniestro Vial (PESV / IPAT)'}
                </h2>
                <span className="text-xs font-mono text-emerald-400">{formData.code}</span>
              </div>
              <p className="text-xs text-slate-400">
                {company?.name || 'Empresa'} · Registro integral de accidentes de tránsito, croquis topográfico y actas de conformidad
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() =>
                generateRoadAccidentPdf(
                  { id: existingReport?.id || 'BORRADOR', ...formData },
                  company
                )
              }
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-emerald-400 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
              title="Descargar Informe Técnico en PDF"
            >
              <FileDown size={15} />
              <span className="hidden sm:inline">Descargar PDF</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Step Navigation Bar */}
        <div className="px-6 py-3 bg-slate-50 border-b border-gray-200 flex items-center gap-2 overflow-x-auto shrink-0">
          {steps.map(st => {
            const Icon = st.icon;
            const active = activeStep === st.num;
            return (
              <button
                key={st.num}
                type="button"
                onClick={() => setActiveStep(st.num)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all whitespace-nowrap shrink-0 ${
                  active
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200/80'
                }`}
              >
                <Icon size={14} />
                {st.title}
              </button>
            );
          })}
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#F8F9FB]">
          {/* =========================================================
              SECCIÓN 1: DATOS BÁSICOS DEL HECHO (FECHA Y UBICACIÓN)
             ========================================================= */}
          {activeStep === 1 && (
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-3xl border border-gray-200/80 space-y-5">
                <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                  <div>
                    <h3 className="text-base font-extrabold text-gray-900">
                      1. Datos Básicos del Hecho (Fecha y Ubicación Precisa)
                    </h3>
                    <p className="text-xs text-gray-500">
                      Registre el momento exacto, coordenadas GPS, intersecciones, sentido vial y puntos de referencia.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-bold text-gray-500">Estado del Informe:</label>
                    <select
                      value={formData.status}
                      onChange={e => setFormData({ ...formData, status: e.target.value as any })}
                      className="px-3 py-1.5 bg-slate-100 border border-gray-200 rounded-xl text-xs font-bold text-slate-800 outline-none"
                    >
                      <option value="Borrador">Borrador</option>
                      <option value="En Proceso">En Proceso</option>
                      <option value="Firmado y Validado">Firmado y Validado</option>
                      <option value="Cerrado">Cerrado</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-600 mb-1">
                      Fecha Exacta del Accidente *
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.accidentDate}
                      onChange={e => setFormData({ ...formData, accidentDate: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold outline-none focus:bg-white focus:border-emerald-500 tabular-nums"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-600 mb-1">
                      Hora Exacta (24h) *
                    </label>
                    <input
                      type="time"
                      required
                      value={formData.accidentTime}
                      onChange={e => setFormData({ ...formData, accidentTime: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold outline-none focus:bg-white focus:border-emerald-500 tabular-nums"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-600 mb-1">
                      Departamento / Región
                    </label>
                    <input
                      type="text"
                      placeholder="Ej. Antioquia, Cundinamarca..."
                      value={formData.department}
                      onChange={e => setFormData({ ...formData, department: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold outline-none focus:bg-white focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-600 mb-1">
                      Municipio / Ciudad
                    </label>
                    <input
                      type="text"
                      placeholder="Ej. Bogotá, Medellín, Cali..."
                      value={formData.municipality}
                      onChange={e => setFormData({ ...formData, municipality: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold outline-none focus:bg-white focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <div className="lg:col-span-2">
                    <label className="block text-[11px] font-bold text-gray-600 mb-1">
                      Dirección o Ubicación Precisa (Vía, Kilómetro, Tramo) *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ej. Av. El Dorado Calle 26 # 68-35 Calzada Oriental / Ruta 45 Km 18+400"
                      value={formData.address}
                      onChange={e => setFormData({ ...formData, address: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold outline-none focus:bg-white focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-600 mb-1">
                      Coordenadas GPS (Latitud, Longitud)
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Ej. 4.658210, -74.103912"
                        value={formData.gpsCoordinates}
                        onChange={e => setFormData({ ...formData, gpsCoordinates: e.target.value })}
                        className="flex-1 px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-mono outline-none focus:bg-white focus:border-emerald-500"
                      />
                      <button
                        type="button"
                        onClick={handleCaptureGps}
                        disabled={locatingGps}
                        className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold flex items-center gap-1 transition-colors whitespace-nowrap shrink-0"
                        title="Capturar coordenadas GPS del dispositivo actual"
                      >
                        <Navigation size={14} />
                        {locatingGps ? '...' : 'GPS'}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-600 mb-1">
                      Intersecciones Cercanas
                    </label>
                    <input
                      type="text"
                      placeholder="Ej. Cruce con Carrera 50"
                      value={formData.intersections}
                      onChange={e => setFormData({ ...formData, intersections: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold outline-none focus:bg-white focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-600 mb-1">
                      Sentido de la Vía
                    </label>
                    <select
                      value={formData.roadDirection}
                      onChange={e => setFormData({ ...formData, roadDirection: e.target.value as any })}
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold outline-none focus:bg-white focus:border-emerald-500"
                    >
                      <option value="Unidireccional">Unidireccional (Un solo sentido)</option>
                      <option value="Bidireccional">Bidireccional (Doble sentido)</option>
                      <option value="Doble Calzada">Doble Calzada con Separador</option>
                      <option value="Glorieta / Intersección">Glorieta / Intersección</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-600 mb-1">
                      Zona Vial
                    </label>
                    <select
                      value={formData.zone}
                      onChange={e => setFormData({ ...formData, zone: e.target.value as any })}
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold outline-none focus:bg-white focus:border-emerald-500"
                    >
                      <option value="Urbana">Urbana</option>
                      <option value="Rural">Rural</option>
                      <option value="Tramo Vial Nacional">Tramo Vial Nacional / Carretera</option>
                      <option value="Instalaciones Internas">Patio / Instalaciones Internas</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-600 mb-1">
                      Puntos de Referencia
                    </label>
                    <input
                      type="text"
                      placeholder="Ej. Frente a Estación de Servicio Terpel"
                      value={formData.referencePoints}
                      onChange={e => setFormData({ ...formData, referencePoints: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold outline-none focus:bg-white focus:border-emerald-500"
                    />
                  </div>
                </div>
              </div>

              {/* Estado de la vía y del entorno */}
              <div className="bg-white p-6 rounded-3xl border border-gray-200/80 space-y-5">
                <div>
                  <h3 className="text-base font-extrabold text-gray-900">
                    Estado de la Vía y Condiciones del Entorno
                  </h3>
                  <p className="text-xs text-gray-500">
                    Condiciones climáticas, iluminación, estado de la calzada (huecos, pavimento mojado) y señalización.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-600 mb-1">
                      Condiciones Climáticas
                    </label>
                    <select
                      value={formData.weatherCondition}
                      onChange={e => setFormData({ ...formData, weatherCondition: e.target.value as any })}
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold outline-none focus:bg-white focus:border-emerald-500"
                    >
                      <option value="Despejado / Seco">Despejado / Seco</option>
                      <option value="Lluvia leve">Lluvia leve / Llovizna</option>
                      <option value="Lluvia fuerte / Tormenta">Lluvia fuerte / Tormenta</option>
                      <option value="Niebla / Neblina">Niebla / Neblina densa</option>
                      <option value="Granizo">Granizo</option>
                      <option value="Vientos fuertes">Vientos fuertes / Humo</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-600 mb-1">
                      Condiciones de Iluminación
                    </label>
                    <select
                      value={formData.lightingCondition}
                      onChange={e => setFormData({ ...formData, lightingCondition: e.target.value as any })}
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold outline-none focus:bg-white focus:border-emerald-500"
                    >
                      <option value="Luz día natural">Luz día natural</option>
                      <option value="Amanecer / Atardecer">Amanecer / Atardecer (Penumbra)</option>
                      <option value="Nocturna con buena iluminación">Nocturna con buena iluminación artificial</option>
                      <option value="Nocturna con iluminación deficiente">Nocturna con iluminación deficiente</option>
                      <option value="Nocturna sin iluminación">Nocturna sin iluminación (Oscuridad)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-600 mb-1">
                      Estado de la Calzada / Superficie
                    </label>
                    <select
                      value={formData.roadSurfaceCondition}
                      onChange={e => setFormData({ ...formData, roadSurfaceCondition: e.target.value as any })}
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold outline-none focus:bg-white focus:border-emerald-500"
                    >
                      <option value="Seco y en buen estado">Seco y en buen estado</option>
                      <option value="Pavimento mojado / Húmedo">Pavimento mojado / Resbaladizo</option>
                      <option value="Con huecos o baches">Con huecos, baches o hundimientos</option>
                      <option value="Material suelto / Gravilla">Material suelto / Arena / Gravilla</option>
                      <option value="Derrame de aceite / Sustancias">Derrame de aceite o hidrocarburos</option>
                      <option value="Vía en obras / Construcción">Vía en obras / Mantenimiento</option>
                      <option value="Destapada / Trocha">Vía sin pavimentar / Destapada</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-600 mb-1">
                      Geometría y Diseño de la Vía
                    </label>
                    <select
                      value={formData.roadGeometry}
                      onChange={e => setFormData({ ...formData, roadGeometry: e.target.value as any })}
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold outline-none focus:bg-white focus:border-emerald-500"
                    >
                      <option value="Recta plana">Tramo recto plano</option>
                      <option value="Recta con pendiente">Tramo recto con pendiente / Inclinación</option>
                      <option value="Curva plana">Curva plana</option>
                      <option value="Curva con pendiente">Curva pronunciada con pendiente</option>
                      <option value="Intersección">Intersección / Cruce vial</option>
                      <option value="Puente / Viaducto">Puente / Viaducto / Túnel</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-600 mb-2">
                    Presencia de Señales de Tránsito y Controles Viales (Seleccione todas las que apliquen)
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                    {TRAFFIC_SIGNAL_OPTIONS.map(sig => {
                      const selected = formData.trafficSignalsPresent.includes(sig);
                      return (
                        <button
                          key={sig}
                          type="button"
                          onClick={() => toggleSignal(sig)}
                          className={`p-2.5 rounded-xl border text-left text-xs font-semibold transition-all flex items-center gap-2 ${
                            selected
                              ? 'bg-emerald-50 border-emerald-400 text-emerald-900'
                              : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                          }`}
                        >
                          <div
                            className={`w-4 h-4 rounded flex items-center justify-center shrink-0 ${
                              selected ? 'bg-emerald-600 text-white' : 'border border-gray-300 bg-white'
                            }`}
                          >
                            {selected && <CheckCircle2 size={12} />}
                          </div>
                          <span className="leading-tight">{sig}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-600 mb-1">
                    Observaciones Adicionales del Estado de la Vía y Entorno
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Detalle visibilidad, obstáculos visuales, estado de demarcación, reductores, vegetación o iluminación..."
                    value={formData.environmentNotes}
                    onChange={e => setFormData({ ...formData, environmentNotes: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold outline-none focus:bg-white focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* =========================================================
              SECCIÓN 2: IDENTIFICACIÓN DE LAS PERSONAS INVOLUCRADAS
             ========================================================= */}
          {activeStep === 2 && (
            <div className="space-y-6">
              {/* 2A. Conductores */}
              <div className="bg-white p-6 rounded-3xl border border-gray-200/80 space-y-4">
                <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                  <div>
                    <h3 className="text-base font-extrabold text-gray-900">
                      2A. Conductores Involucrados
                    </h3>
                    <p className="text-xs text-gray-500">
                      Nombres completos, identificación, licencia de conducción (número, categoría, vigencia), teléfono y dirección.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const newD: RoadAccidentDriver = {
                        id: crypto.randomUUID(),
                        fullName: '',
                        idType: 'CC',
                        idNumber: '',
                        licenseNumber: '',
                        licenseCategory: 'B1',
                        licenseExpiry: '',
                        phone: '',
                        address: '',
                        email: '',
                        vehiclePlate: '',
                        alcoholTestResult: 'Negativo',
                      };
                      syncDriverSignatures([...formData.drivers, newD]);
                    }}
                    className="px-3.5 py-2 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
                  >
                    <Plus size={14} />
                    Agregar Conductor
                  </button>
                </div>

                {formData.drivers.map((driver, idx) => (
                  <div key={driver.id} className="p-4 rounded-2xl bg-gray-50/80 border border-gray-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold text-slate-800">
                        Conductor #{idx + 1}
                      </span>
                      {formData.drivers.length > 1 && (
                        <button
                          type="button"
                          onClick={() =>
                            syncDriverSignatures(formData.drivers.filter(d => d.id !== driver.id))
                          }
                          className="text-red-500 hover:text-red-700 text-xs font-bold flex items-center gap-1"
                        >
                          <Trash2 size={13} /> Eliminar
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                      <div className="lg:col-span-2">
                        <label className="block text-[10px] font-bold text-gray-500 mb-1">
                          Nombre Completo del Conductor
                        </label>
                        <input
                          type="text"
                          placeholder="Nombres y apellidos completos"
                          value={driver.fullName}
                          onChange={e => {
                            const list = [...formData.drivers];
                            list[idx] = { ...driver, fullName: e.target.value };
                            syncDriverSignatures(list);
                          }}
                          className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold outline-none focus:border-emerald-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-500 mb-1">
                          Tipo y N° Identificación (Cédula / DNI)
                        </label>
                        <div className="flex gap-1.5">
                          <select
                            value={driver.idType}
                            onChange={e => {
                              const list = [...formData.drivers];
                              list[idx] = { ...driver, idType: e.target.value as any };
                              syncDriverSignatures(list);
                            }}
                            className="px-2 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold outline-none"
                          >
                            <option value="CC">CC</option>
                            <option value="CE">CE</option>
                            <option value="PA">PA</option>
                            <option value="PEP">PEP</option>
                            <option value="PPT">PPT</option>
                          </select>
                          <input
                            type="text"
                            placeholder="Número documento"
                            value={driver.idNumber}
                            onChange={e => {
                              const list = [...formData.drivers];
                              list[idx] = { ...driver, idNumber: e.target.value };
                              syncDriverSignatures(list);
                            }}
                            className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-mono outline-none focus:border-emerald-500"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-500 mb-1">
                          Placa Vehículo Conducido
                        </label>
                        <input
                          type="text"
                          placeholder="Ej. ABC-123"
                          value={driver.vehiclePlate || ''}
                          onChange={e => {
                            const list = [...formData.drivers];
                            list[idx] = { ...driver, vehiclePlate: e.target.value.toUpperCase() };
                            syncDriverSignatures(list);
                          }}
                          className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-mono font-bold uppercase outline-none focus:border-emerald-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-gray-500 mb-1">
                          N° Licencia Conducción
                        </label>
                        <input
                          type="text"
                          placeholder="Número licencia"
                          value={driver.licenseNumber}
                          onChange={e => {
                            const list = [...formData.drivers];
                            list[idx] = { ...driver, licenseNumber: e.target.value };
                            syncDriverSignatures(list);
                          }}
                          className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-mono outline-none focus:border-emerald-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-500 mb-1">
                          Categoría Licencia
                        </label>
                        <select
                          value={driver.licenseCategory}
                          onChange={e => {
                            const list = [...formData.drivers];
                            list[idx] = { ...driver, licenseCategory: e.target.value as any };
                            syncDriverSignatures(list);
                          }}
                          className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold outline-none"
                        >
                          {['A1', 'A2', 'B1', 'B2', 'B3', 'C1', 'C2', 'C3'].map(cat => (
                            <option key={cat} value={cat}>
                              Categoría {cat}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-500 mb-1">
                          Vigencia Licencia
                        </label>
                        <input
                          type="date"
                          value={driver.licenseExpiry}
                          onChange={e => {
                            const list = [...formData.drivers];
                            list[idx] = { ...driver, licenseExpiry: e.target.value };
                            syncDriverSignatures(list);
                          }}
                          className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold outline-none tabular-nums"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-500 mb-1">
                          Teléfono de Contacto
                        </label>
                        <input
                          type="text"
                          placeholder="Ej. 300 123 4567"
                          value={driver.phone}
                          onChange={e => {
                            const list = [...formData.drivers];
                            list[idx] = { ...driver, phone: e.target.value };
                            syncDriverSignatures(list);
                          }}
                          className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-mono outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-500 mb-1">
                          Dirección de Residencia
                        </label>
                        <input
                          type="text"
                          placeholder="Dirección y ciudad"
                          value={driver.address}
                          onChange={e => {
                            const list = [...formData.drivers];
                            list[idx] = { ...driver, address: e.target.value };
                            syncDriverSignatures(list);
                          }}
                          className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-500 mb-1">
                          Prueba de Alcoholemia
                        </label>
                        <select
                          value={driver.alcoholTestResult || 'Negativo'}
                          onChange={e => {
                            const list = [...formData.drivers];
                            list[idx] = { ...driver, alcoholTestResult: e.target.value as any };
                            syncDriverSignatures(list);
                          }}
                          className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold outline-none"
                        >
                          <option value="Negativo">Negativo</option>
                          <option value="Positivo">Positivo</option>
                          <option value="No realizado">No realizado</option>
                          <option value="Pendiente">Pendiente dictamen</option>
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* 2B. Pasajeros y Peatones */}
              <div className="bg-white p-6 rounded-3xl border border-gray-200/80 space-y-4">
                <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                  <div>
                    <h3 className="text-base font-extrabold text-gray-900">
                      2B. Pasajeros, Peatones o Acompañantes Implicados
                    </h3>
                    <p className="text-xs text-gray-500">
                      Datos de identidad y de contacto de cualquier otra persona implicada en el hecho.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const newP: RoadAccidentPerson = {
                        id: crypto.randomUUID(),
                        role: 'Pasajero',
                        fullName: '',
                        idType: 'CC',
                        idNumber: '',
                        phone: '',
                        address: '',
                        vehiclePlate: '',
                      };
                      setFormData(prev => ({
                        ...prev,
                        passengersAndPedestrians: [...prev.passengersAndPedestrians, newP],
                      }));
                    }}
                    className="px-3.5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
                  >
                    <Plus size={14} />
                    Agregar Pasajero / Peatón
                  </button>
                </div>

                {formData.passengersAndPedestrians.length === 0 ? (
                  <p className="text-xs text-gray-400 italic">
                    No se han agregado pasajeros ni peatones implicados. Haga clic en "Agregar Pasajero / Peatón" si aplica.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {formData.passengersAndPedestrians.map((p, idx) => (
                      <div key={p.id} className="p-3.5 rounded-2xl bg-gray-50 border border-gray-200 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 items-end">
                        <div>
                          <label className="block text-[10px] font-bold text-gray-500 mb-1">Rol</label>
                          <select
                            value={p.role}
                            onChange={e => {
                              const list = [...formData.passengersAndPedestrians];
                              list[idx] = { ...p, role: e.target.value as any };
                              setFormData({ ...formData, passengersAndPedestrians: list });
                            }}
                            className="w-full px-2.5 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold"
                          >
                            <option value="Pasajero">Pasajero</option>
                            <option value="Peatón">Peatón</option>
                            <option value="Ciclista">Ciclista</option>
                            <option value="Acompañante">Acompañante</option>
                          </select>
                        </div>
                        <div className="lg:col-span-2">
                          <label className="block text-[10px] font-bold text-gray-500 mb-1">Nombre Completo</label>
                          <input
                            type="text"
                            placeholder="Nombre y apellidos"
                            value={p.fullName}
                            onChange={e => {
                              const list = [...formData.passengersAndPedestrians];
                              list[idx] = { ...p, fullName: e.target.value };
                              setFormData({ ...formData, passengersAndPedestrians: list });
                            }}
                            className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-gray-500 mb-1">Documento ID</label>
                          <input
                            type="text"
                            placeholder="Cédula / DNI"
                            value={p.idNumber}
                            onChange={e => {
                              const list = [...formData.passengersAndPedestrians];
                              list[idx] = { ...p, idNumber: e.target.value };
                              setFormData({ ...formData, passengersAndPedestrians: list });
                            }}
                            className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-gray-500 mb-1">Teléfono</label>
                          <input
                            type="text"
                            placeholder="Teléfono"
                            value={p.phone}
                            onChange={e => {
                              const list = [...formData.passengersAndPedestrians];
                              list[idx] = { ...p, phone: e.target.value };
                              setFormData({ ...formData, passengersAndPedestrians: list });
                            }}
                            className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-mono"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex-1">
                            <label className="block text-[10px] font-bold text-gray-500 mb-1">Dirección</label>
                            <input
                              type="text"
                              placeholder="Dirección"
                              value={p.address}
                              onChange={e => {
                                const list = [...formData.passengersAndPedestrians];
                                list[idx] = { ...p, address: e.target.value };
                                setFormData({ ...formData, passengersAndPedestrians: list });
                              }}
                              className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              setFormData(prev => ({
                                ...prev,
                                passengersAndPedestrians: prev.passengersAndPedestrians.filter(item => item.id !== p.id),
                              }))
                            }
                            className="p-2 text-red-500 hover:bg-red-50 rounded-xl"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 2C. Testigos */}
              <div className="bg-white p-6 rounded-3xl border border-gray-200/80 space-y-4">
                <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                  <div>
                    <h3 className="text-base font-extrabold text-gray-900">
                      2C. Testigos Presenciales
                    </h3>
                    <p className="text-xs text-gray-500">
                      Nombres, teléfonos y declaraciones breves de personas que presenciaron el hecho (clave en caso de disputas).
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const newW: RoadAccidentWitness = {
                        id: crypto.randomUUID(),
                        fullName: '',
                        idNumber: '',
                        phone: '',
                        address: '',
                        statement: '',
                      };
                      setFormData(prev => ({ ...prev, witnesses: [...prev.witnesses, newW] }));
                    }}
                    className="px-3.5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
                  >
                    <Plus size={14} />
                    Agregar Testigo
                  </button>
                </div>

                {formData.witnesses.length === 0 ? (
                  <p className="text-xs text-gray-400 italic">
                    No se han registrado testigos presenciales.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {formData.witnesses.map((w, idx) => (
                      <div key={w.id} className="p-4 rounded-2xl bg-gray-50 border border-gray-200 space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div>
                            <label className="block text-[10px] font-bold text-gray-500 mb-1">Nombre del Testigo</label>
                            <input
                              type="text"
                              placeholder="Nombre completo"
                              value={w.fullName}
                              onChange={e => {
                                const list = [...formData.witnesses];
                                list[idx] = { ...w, fullName: e.target.value };
                                setFormData({ ...formData, witnesses: list });
                              }}
                              className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-gray-500 mb-1">Cédula / DNI</label>
                            <input
                              type="text"
                              placeholder="Identificación"
                              value={w.idNumber}
                              onChange={e => {
                                const list = [...formData.witnesses];
                                list[idx] = { ...w, idNumber: e.target.value };
                                setFormData({ ...formData, witnesses: list });
                              }}
                              className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-mono"
                            />
                          </div>
                          <div className="flex items-end gap-2">
                            <div className="flex-1">
                              <label className="block text-[10px] font-bold text-gray-500 mb-1">Teléfono de Contacto</label>
                              <input
                                type="text"
                                placeholder="Teléfono"
                                value={w.phone}
                                onChange={e => {
                                  const list = [...formData.witnesses];
                                  list[idx] = { ...w, phone: e.target.value };
                                  setFormData({ ...formData, witnesses: list });
                                }}
                                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-mono"
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() =>
                                setFormData(prev => ({
                                  ...prev,
                                  witnesses: prev.witnesses.filter(item => item.id !== w.id),
                                }))
                              }
                              className="p-2 text-red-500 hover:bg-red-50 rounded-xl"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-gray-500 mb-1">
                            Declaración Breve / Versión del Testigo
                          </label>
                          <textarea
                            rows={2}
                            placeholder="Describa brevemente lo que el testigo manifiesta haber observado..."
                            value={w.statement}
                            onChange={e => {
                              const list = [...formData.witnesses];
                              list[idx] = { ...w, statement: e.target.value };
                              setFormData({ ...formData, witnesses: list });
                            }}
                            className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 2D. Autoridades de Tránsito */}
              <div className="bg-white p-6 rounded-3xl border border-gray-200/80 space-y-4">
                <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                  <div>
                    <h3 className="text-base font-extrabold text-gray-900">
                      2D. Autoridades que Atienden la Escena
                    </h3>
                    <p className="text-xs text-gray-500">
                      Nombre y número de placa del agente de tránsito o policía que atiende el evento.
                    </p>
                  </div>
                  <label className="flex items-center gap-2 text-xs font-bold text-gray-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.authority.attendedByAuthority}
                      onChange={e =>
                        setFormData(prev => ({
                          ...prev,
                          authority: { ...prev.authority, attendedByAuthority: e.target.checked },
                        }))
                      }
                      className="rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    Asistió Autoridad de Tránsito / Policía
                  </label>
                </div>

                {formData.authority.attendedByAuthority && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 mb-1">Entidad / Cuerpo</label>
                      <select
                        value={formData.authority.entity}
                        onChange={e =>
                          setFormData(prev => ({
                            ...prev,
                            authority: { ...prev.authority, entity: e.target.value as any },
                          }))
                        }
                        className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold"
                      >
                        <option value="Agente de Tránsito Municipal">Agente de Tránsito Municipal</option>
                        <option value="Policía de Tránsito">Policía de Tránsito Urbano</option>
                        <option value="Policía de Carreteras (DITRA)">Policía de Carreteras (DITRA)</option>
                        <option value="Inspector Vial">Inspector Vial / Concesión</option>
                        <option value="Otro">Otro</option>
                      </select>
                    </div>
                    <div className="lg:col-span-2">
                      <label className="block text-[10px] font-bold text-gray-500 mb-1">
                        Nombre Completo del Agente / Policía
                      </label>
                      <input
                        type="text"
                        placeholder="Grado y nombre del agente"
                        value={formData.authority.officerName}
                        onChange={e =>
                          setFormData(prev => ({
                            ...prev,
                            authority: { ...prev.authority, officerName: e.target.value },
                            authoritySignature: { ...prev.authoritySignature, officerName: e.target.value },
                          }))
                        }
                        className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 mb-1">
                        N° de Placa / Chaleco
                      </label>
                      <input
                        type="text"
                        placeholder="Ej. Placa 04589"
                        value={formData.authority.badgeNumber}
                        onChange={e =>
                          setFormData(prev => ({
                            ...prev,
                            authority: { ...prev.authority, badgeNumber: e.target.value },
                            authoritySignature: { ...prev.authoritySignature, badgeNumber: e.target.value },
                          }))
                        }
                        className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-mono font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 mb-1">
                        N° Informe IPAT / Comparendo
                      </label>
                      <input
                        type="text"
                        placeholder="Consecutivo IPAT"
                        value={formData.authority.ipatReportNumber || ''}
                        onChange={e =>
                          setFormData(prev => ({
                            ...prev,
                            authority: { ...prev.authority, ipatReportNumber: e.target.value },
                          }))
                        }
                        className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-mono"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* =========================================================
              SECCIÓN 3: INFORMACIÓN DE LOS VEHÍCULOS INVOLUCRADOS
             ========================================================= */}
          {activeStep === 3 && (
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-3xl border border-gray-200/80 space-y-5">
                <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                  <div>
                    <h3 className="text-base font-extrabold text-gray-900">
                      3. Información de los Vehículos Involucrados
                    </h3>
                    <p className="text-xs text-gray-500">
                      Datos técnicos (placa, marca, modelo, color, año), documentación legal (SOAT, póliza todo riesgo, RTM) y propietario.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const newV: RoadAccidentVehicle = {
                        id: crypto.randomUUID(),
                        plate: '',
                        vehicleType: 'Automóvil',
                        brand: '',
                        modelLine: '',
                        color: '',
                        year: '',
                        serviceType: 'Particular',
                        soatNumber: '',
                        soatExpiry: '',
                        insuranceCompany: '',
                        allRiskPolicyNumber: '',
                        rtmNumber: '',
                        rtmExpiry: '',
                        ownerSameAsDriver: true,
                        ownershipType: 'Conductor es el dueño',
                        ownerName: '',
                        ownerIdNumber: '',
                        ownerPhone: '',
                        visibleDamages: '',
                        detachedParts: '',
                        damageSeverity: 'Leve',
                        immobilized: false,
                        impactZones: ['Frontal'],
                        firstContactPoint: '',
                      };
                      setFormData(prev => ({ ...prev, vehicles: [...prev.vehicles, newV] }));
                    }}
                    className="px-3.5 py-2 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
                  >
                    <Plus size={14} />
                    Agregar Vehículo
                  </button>
                </div>

                {formData.vehicles.map((v, idx) => (
                  <div key={v.id} className="p-5 rounded-2xl bg-gray-50 border border-gray-200 space-y-4">
                    <div className="flex items-center justify-between border-b border-gray-200 pb-2.5">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 bg-slate-900 text-white rounded-lg text-xs font-extrabold">
                          Vehículo #{idx + 1}
                        </span>
                        <span className="text-xs font-mono font-bold text-emerald-700">
                          {v.plate ? `PLACA: ${v.plate}` : 'Sin placa asignada'}
                        </span>
                      </div>
                      {formData.vehicles.length > 1 && (
                        <button
                          type="button"
                          onClick={() =>
                            setFormData(prev => ({
                              ...prev,
                              vehicles: prev.vehicles.filter(item => item.id !== v.id),
                            }))
                          }
                          className="text-red-500 hover:text-red-700 text-xs font-bold flex items-center gap-1"
                        >
                          <Trash2 size={13} /> Eliminar Vehículo
                        </button>
                      )}
                    </div>

                    {/* Datos Técnicos */}
                    <div>
                      <p className="text-[11px] font-extrabold text-slate-700 mb-2">
                        A. Datos Técnicos del Vehículo
                      </p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                        <div>
                          <label className="block text-[10px] font-bold text-gray-500 mb-1">
                            Placa (Patente) *
                          </label>
                          <input
                            type="text"
                            placeholder="ABC-123"
                            value={v.plate}
                            onChange={e => {
                              const list = [...formData.vehicles];
                              list[idx] = { ...v, plate: e.target.value.toUpperCase() };
                              setFormData({ ...formData, vehicles: list });
                            }}
                            className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-mono font-extrabold uppercase"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-gray-500 mb-1">
                            Clase de Vehículo
                          </label>
                          <select
                            value={v.vehicleType}
                            onChange={e => {
                              const list = [...formData.vehicles];
                              list[idx] = { ...v, vehicleType: e.target.value as any };
                              setFormData({ ...formData, vehicles: list });
                            }}
                            className="w-full px-2.5 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold"
                          >
                            <option value="Automóvil">Automóvil</option>
                            <option value="Camioneta">Camioneta / SUV</option>
                            <option value="Camión">Camión</option>
                            <option value="Tractocamión">Tractocamión</option>
                            <option value="Motocicleta">Motocicleta</option>
                            <option value="Bus / Microbús">Bus / Microbús</option>
                            <option value="Bicicleta">Bicicleta / Patinete</option>
                            <option value="Maquinaria">Maquinaria Amarilla</option>
                            <option value="Otro">Otro</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-gray-500 mb-1">
                            Marca
                          </label>
                          <input
                            type="text"
                            placeholder="Ej. Chevrolet, Toyota"
                            value={v.brand}
                            onChange={e => {
                              const list = [...formData.vehicles];
                              list[idx] = { ...v, brand: e.target.value };
                              setFormData({ ...formData, vehicles: list });
                            }}
                            className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-gray-500 mb-1">
                            Línea / Modelo
                          </label>
                          <input
                            type="text"
                            placeholder="Ej. Hilux, NHR, Aveo"
                            value={v.modelLine}
                            onChange={e => {
                              const list = [...formData.vehicles];
                              list[idx] = { ...v, modelLine: e.target.value };
                              setFormData({ ...formData, vehicles: list });
                            }}
                            className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-gray-500 mb-1">
                            Color
                          </label>
                          <input
                            type="text"
                            placeholder="Ej. Blanco, Plata"
                            value={v.color}
                            onChange={e => {
                              const list = [...formData.vehicles];
                              list[idx] = { ...v, color: e.target.value };
                              setFormData({ ...formData, vehicles: list });
                            }}
                            className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-gray-500 mb-1">
                            Año (Modelo)
                          </label>
                          <input
                            type="text"
                            placeholder="Ej. 2023"
                            value={v.year}
                            onChange={e => {
                              const list = [...formData.vehicles];
                              list[idx] = { ...v, year: e.target.value };
                              setFormData({ ...formData, vehicles: list });
                            }}
                            className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-mono"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Documentación Legal */}
                    <div>
                      <p className="text-[11px] font-extrabold text-slate-700 mb-2">
                        B. Documentación Legal (SOAT, Póliza Todo Riesgo y Revisión Técnico-Mecánica)
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
                        <div>
                          <label className="block text-[10px] font-bold text-gray-500 mb-1">
                            N° Seguro Obligatorio (SOAT)
                          </label>
                          <input
                            type="text"
                            placeholder="Número póliza SOAT"
                            value={v.soatNumber}
                            onChange={e => {
                              const list = [...formData.vehicles];
                              list[idx] = { ...v, soatNumber: e.target.value };
                              setFormData({ ...formData, vehicles: list });
                            }}
                            className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-gray-500 mb-1">
                            Vigencia SOAT
                          </label>
                          <input
                            type="date"
                            value={v.soatExpiry}
                            onChange={e => {
                              const list = [...formData.vehicles];
                              list[idx] = { ...v, soatExpiry: e.target.value };
                              setFormData({ ...formData, vehicles: list });
                            }}
                            className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold tabular-nums"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-gray-500 mb-1">
                            Aseguradora Todo Riesgo
                          </label>
                          <input
                            type="text"
                            placeholder="Ej. Sura, Bolívar, Mapfre"
                            value={v.insuranceCompany}
                            onChange={e => {
                              const list = [...formData.vehicles];
                              list[idx] = { ...v, insuranceCompany: e.target.value };
                              setFormData({ ...formData, vehicles: list });
                            }}
                            className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-gray-500 mb-1">
                            N° Póliza Todo Riesgo / RC
                          </label>
                          <input
                            type="text"
                            placeholder="Número de póliza"
                            value={v.allRiskPolicyNumber}
                            onChange={e => {
                              const list = [...formData.vehicles];
                              list[idx] = { ...v, allRiskPolicyNumber: e.target.value };
                              setFormData({ ...formData, vehicles: list });
                            }}
                            className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-gray-500 mb-1">
                            N° Certificado RTM
                          </label>
                          <input
                            type="text"
                            placeholder="Revisión Técnico-Mecánica"
                            value={v.rtmNumber}
                            onChange={e => {
                              const list = [...formData.vehicles];
                              list[idx] = { ...v, rtmNumber: e.target.value };
                              setFormData({ ...formData, vehicles: list });
                            }}
                            className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-gray-500 mb-1">
                            Vigencia Técnico-Mecánica
                          </label>
                          <input
                            type="date"
                            value={v.rtmExpiry}
                            onChange={e => {
                              const list = [...formData.vehicles];
                              list[idx] = { ...v, rtmExpiry: e.target.value };
                              setFormData({ ...formData, vehicles: list });
                            }}
                            className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold tabular-nums"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Propietario del Vehículo */}
                    <div>
                      <p className="text-[11px] font-extrabold text-slate-700 mb-2">
                        C. Propietario del Vehículo
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                        <div>
                          <label className="block text-[10px] font-bold text-gray-500 mb-1">
                            Relación de Propiedad
                          </label>
                          <select
                            value={v.ownershipType}
                            onChange={e => {
                              const val = e.target.value as RoadAccidentVehicle['ownershipType'];
                              const list = [...formData.vehicles];
                              list[idx] = {
                                ...v,
                                ownershipType: val,
                                ownerSameAsDriver: val === 'Conductor es el dueño',
                              };
                              setFormData({ ...formData, vehicles: list });
                            }}
                            className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold"
                          >
                            <option value="Conductor es el dueño">El conductor es el mismo dueño</option>
                            <option value="Empresa / Flota Propia">Pertenece a la Empresa / Flota</option>
                            <option value="Tercero Particular">Pertenece a un Tercero Particular</option>
                            <option value="Arrendamiento / Leasing">Arrendamiento / Leasing / Renting</option>
                          </select>
                        </div>
                        {v.ownershipType !== 'Conductor es el dueño' && (
                          <>
                            <div>
                              <label className="block text-[10px] font-bold text-gray-500 mb-1">
                                Nombre o Razón Social del Propietario
                              </label>
                              <input
                                type="text"
                                placeholder="Nombre propietario o empresa"
                                value={v.ownerName}
                                onChange={e => {
                                  const list = [...formData.vehicles];
                                  list[idx] = { ...v, ownerName: e.target.value };
                                  setFormData({ ...formData, vehicles: list });
                                }}
                                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-gray-500 mb-1">
                                NIT o Cédula del Propietario
                              </label>
                              <input
                                type="text"
                                placeholder="NIT / Documento"
                                value={v.ownerIdNumber}
                                onChange={e => {
                                  const list = [...formData.vehicles];
                                  list[idx] = { ...v, ownerIdNumber: e.target.value };
                                  setFormData({ ...formData, vehicles: list });
                                }}
                                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-mono"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-gray-500 mb-1">
                                Teléfono del Propietario
                              </label>
                              <input
                                type="text"
                                placeholder="Teléfono contacto"
                                value={v.ownerPhone}
                                onChange={e => {
                                  const list = [...formData.vehicles];
                                  list[idx] = { ...v, ownerPhone: e.target.value };
                                  setFormData({ ...formData, vehicles: list });
                                }}
                                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-mono"
                              />
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* =========================================================
              SECCIÓN 4: DESCRIPCIÓN DE DAÑOS Y LESIONES
             ========================================================= */}
          {activeStep === 4 && (
            <div className="space-y-6">
              {/* 4A. Daños Materiales y Puntos de Impacto por Vehículo */}
              <div className="bg-white p-6 rounded-3xl border border-gray-200/80 space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
                  <div>
                    <h3 className="text-base font-extrabold text-gray-900">
                      4A. Daños Materiales y Puntos de Impacto por Vehículo
                    </h3>
                    <p className="text-xs text-gray-500">
                      Señale el lugar exacto del primer contacto, zonas afectadas e inventario detallado de daños visibles.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-bold text-gray-600">Clase de Siniestro:</label>
                    <select
                      value={formData.collisionType}
                      onChange={e => setFormData({ ...formData, collisionType: e.target.value as any })}
                      className="px-3 py-2 bg-slate-100 border border-gray-200 rounded-xl text-xs font-bold text-slate-800"
                    >
                      <option value="Choque con otro vehículo">Choque con otro vehículo</option>
                      <option value="Atropello a peatón">Atropello a peatón</option>
                      <option value="Volcamiento">Volcamiento</option>
                      <option value="Choque con objeto fijo">Choque con objeto fijo</option>
                      <option value="Caída de ocupante">Caída de ocupante</option>
                      <option value="Incendio / Otro">Incendio / Otro</option>
                    </select>
                  </div>
                </div>

                {formData.vehicles.map((v, idx) => (
                  <div key={v.id} className="p-5 rounded-2xl bg-gray-50 border border-gray-200 space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-xs font-extrabold text-slate-900">
                        Vehículo #{idx + 1}: {v.brand} {v.modelLine} ({v.plate || 'Sin Placa'})
                      </span>
                      <div className="flex items-center gap-3">
                        <label className="flex items-center gap-1.5 text-xs font-bold text-red-600 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={v.immobilized}
                            onChange={e => {
                              const list = [...formData.vehicles];
                              list[idx] = { ...v, immobilized: e.target.checked };
                              setFormData({ ...formData, vehicles: list });
                            }}
                          />
                          Vehículo Inmovilizado / Requirió Grúa
                        </label>
                        <select
                          value={v.damageSeverity}
                          onChange={e => {
                            const list = [...formData.vehicles];
                            list[idx] = { ...v, damageSeverity: e.target.value as any };
                            setFormData({ ...formData, vehicles: list });
                          }}
                          className="px-3 py-1.5 bg-white border border-gray-200 rounded-xl text-xs font-bold"
                        >
                          <option value="Sin Daños">Sin Daños</option>
                          <option value="Leve">Daño Leve</option>
                          <option value="Moderado">Daño Moderado</option>
                          <option value="Grave">Daño Grave</option>
                          <option value="Pérdida Total">Pérdida Total</option>
                        </select>
                      </div>
                    </div>

                    {/* Selector de Puntos de Impacto */}
                    <div>
                      <label className="block text-[11px] font-bold text-gray-600 mb-2">
                        Puntos de Impacto en el Vehículo (Haga clic para marcar las zonas afectadas):
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {IMPACT_ZONES.map(zone => {
                          const active = v.impactZones.includes(zone);
                          return (
                            <button
                              key={zone}
                              type="button"
                              onClick={() => toggleVehicleImpactZone(idx, zone)}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all whitespace-nowrap shrink-0 ${
                                active
                                  ? 'bg-red-600 text-white border-red-600 shadow-xs'
                                  : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-100'
                              }`}
                            >
                              {zone}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-gray-500 mb-1">
                          Punto Exacto del Primer Contacto
                        </label>
                        <input
                          type="text"
                          placeholder="Ej. Ángulo delantero derecho sobre farola"
                          value={v.firstContactPoint}
                          onChange={e => {
                            const list = [...formData.vehicles];
                            list[idx] = { ...v, firstContactPoint: e.target.value };
                            setFormData({ ...formData, vehicles: list });
                          }}
                          className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-500 mb-1">
                          Inventario Detallado de Daños Visibles (Parachoques, puertas, vidrios...)
                        </label>
                        <input
                          type="text"
                          placeholder="Ej. Hundimiento puerta delantera derecha, rotura de panorámico..."
                          value={v.visibleDamages}
                          onChange={e => {
                            const list = [...formData.vehicles];
                            list[idx] = { ...v, visibleDamages: e.target.value };
                            setFormData({ ...formData, vehicles: list });
                          }}
                          className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-500 mb-1">
                          Desprendimiento de Piezas o Fluidos
                        </label>
                        <input
                          type="text"
                          placeholder="Ej. Desprendimiento de bómper y espejo retrovisor, fuga radiador"
                          value={v.detachedParts}
                          onChange={e => {
                            const list = [...formData.vehicles];
                            list[idx] = { ...v, detachedParts: e.target.value };
                            setFormData({ ...formData, vehicles: list });
                          }}
                          className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold"
                        />
                      </div>
                    </div>
                  </div>
                ))}

                <div>
                  <label className="block text-[11px] font-bold text-gray-600 mb-1">
                    Daños Materiales Adicionales (Infraestructura vial, postes, señales, predios o terceros)
                  </label>
                  <input
                    type="text"
                    placeholder="Describa si hubo daños a separadores, postes de alumbrado, señales verticales o propiedad privada..."
                    value={formData.otherPropertyDamages}
                    onChange={e => setFormData({ ...formData, otherPropertyDamages: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold"
                  />
                </div>
              </div>

              {/* 4B. Lesiones Personales */}
              <div className="bg-white p-6 rounded-3xl border border-gray-200/80 space-y-4">
                <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                  <div>
                    <h3 className="text-base font-extrabold text-gray-900">
                      4B. Registro de Lesiones Personales y Centros Médicos de Traslado
                    </h3>
                    <p className="text-xs text-gray-500">
                      Personas heridas o fallecidas, gravedad aparente de las lesiones y centros médicos a los que fueron trasladadas.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const newInj: RoadAccidentInjury = {
                        id: crypto.randomUUID(),
                        personName: '',
                        idNumber: '',
                        role: 'Conductor',
                        severity: 'Leve',
                        injuryDescription: '',
                        bodyPartsAffected: '',
                        transferredToMedicalCenter: true,
                        medicalCenterName: '',
                        ambulanceOrTransport: '',
                      };
                      setFormData(prev => ({
                        ...prev,
                        hasInjuriesOrFatalities: true,
                        injuries: [...prev.injuries, newInj],
                      }));
                    }}
                    className="px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
                  >
                    <Plus size={14} />
                    Registrar Persona Lesionada / Fallecida
                  </button>
                </div>

                {formData.injuries.length === 0 ? (
                  <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200 text-xs text-emerald-800 font-semibold flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                    Sin lesionados registrados hasta el momento (Siniestro de solo daños materiales).
                  </div>
                ) : (
                  <div className="space-y-3">
                    {formData.injuries.map((inj, idx) => (
                      <div key={inj.id} className="p-4 rounded-2xl bg-red-50/40 border border-red-200/80 space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                          <div className="lg:col-span-2">
                            <label className="block text-[10px] font-bold text-gray-600 mb-1">
                              Nombre de la Persona Afectada
                            </label>
                            <input
                              type="text"
                              placeholder="Nombre completo"
                              value={inj.personName}
                              onChange={e => {
                                const list = [...formData.injuries];
                                list[idx] = { ...inj, personName: e.target.value };
                                setFormData({ ...formData, injuries: list });
                              }}
                              className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-gray-600 mb-1">
                              Documento ID
                            </label>
                            <input
                              type="text"
                              placeholder="Cédula / DNI"
                              value={inj.idNumber}
                              onChange={e => {
                                const list = [...formData.injuries];
                                list[idx] = { ...inj, idNumber: e.target.value };
                                setFormData({ ...formData, injuries: list });
                              }}
                              className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-mono"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-gray-600 mb-1">
                              Rol en el Accidente
                            </label>
                            <select
                              value={inj.role}
                              onChange={e => {
                                const list = [...formData.injuries];
                                list[idx] = { ...inj, role: e.target.value as any };
                                setFormData({ ...formData, injuries: list });
                              }}
                              className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold"
                            >
                              <option value="Conductor">Conductor</option>
                              <option value="Pasajero">Pasajero</option>
                              <option value="Peatón">Peatón</option>
                              <option value="Ciclista">Ciclista</option>
                            </select>
                          </div>
                          <div className="flex items-end gap-2">
                            <div className="flex-1">
                              <label className="block text-[10px] font-bold text-gray-600 mb-1">
                                Gravedad Aparente
                              </label>
                              <select
                                value={inj.severity}
                                onChange={e => {
                                  const list = [...formData.injuries];
                                  list[idx] = { ...inj, severity: e.target.value as any };
                                  setFormData({ ...formData, injuries: list });
                                }}
                                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-extrabold text-red-700"
                              >
                                <option value="Leve">Leve</option>
                                <option value="Moderada">Moderada</option>
                                <option value="Grave">Grave</option>
                                <option value="Fallecido">Fallecido (Mortal)</option>
                              </select>
                            </div>
                            <button
                              type="button"
                              onClick={() =>
                                setFormData(prev => ({
                                  ...prev,
                                  injuries: prev.injuries.filter(item => item.id !== inj.id),
                                }))
                              }
                              className="p-2 text-red-600 hover:bg-red-100 rounded-xl"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                          <div>
                            <label className="block text-[10px] font-bold text-gray-600 mb-1">
                              Partes del Cuerpo Afectadas
                            </label>
                            <input
                              type="text"
                              placeholder="Ej. Miembro inferior derecho, cervical"
                              value={inj.bodyPartsAffected}
                              onChange={e => {
                                const list = [...formData.injuries];
                                list[idx] = { ...inj, bodyPartsAffected: e.target.value };
                                setFormData({ ...formData, injuries: list });
                              }}
                              className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-gray-600 mb-1">
                              Descripción de las Lesiones
                            </label>
                            <input
                              type="text"
                              placeholder="Ej. Posible fractura de tibia, contusiones"
                              value={inj.injuryDescription}
                              onChange={e => {
                                const list = [...formData.injuries];
                                list[idx] = { ...inj, injuryDescription: e.target.value };
                                setFormData({ ...formData, injuries: list });
                              }}
                              className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-gray-600 mb-1">
                              Centro Médico / Clínica de Traslado
                            </label>
                            <input
                              type="text"
                              placeholder="Ej. Clínica del Country / Hospital Central"
                              value={inj.medicalCenterName}
                              onChange={e => {
                                const list = [...formData.injuries];
                                list[idx] = { ...inj, medicalCenterName: e.target.value };
                                setFormData({ ...formData, injuries: list });
                              }}
                              className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-gray-600 mb-1">
                              Móvil / Ambulancia de Traslado
                            </label>
                            <input
                              type="text"
                              placeholder="Ej. Ambulancia Secretaría Salud Móvil 14"
                              value={inj.ambulanceOrTransport || ''}
                              onChange={e => {
                                const list = [...formData.injuries];
                                list[idx] = { ...inj, ambulanceOrTransport: e.target.value };
                                setFormData({ ...formData, injuries: list });
                              }}
                              className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* =========================================================
              SECCIÓN 5: NARRACIÓN, CROQUIS Y EVIDENCIA FOTOGRÁFICA
             ========================================================= */}
          {activeStep === 5 && (
            <div className="space-y-6">
              {/* 5A. Relato de los hechos */}
              <div className="bg-white p-6 rounded-3xl border border-gray-200/80 space-y-4">
                <div>
                  <h3 className="text-base font-extrabold text-gray-900">
                    5A. Relato Objetivo y Cronológico de los Hechos
                  </h3>
                  <p className="text-xs text-gray-500">
                    Descripción cronológica, objetiva y sin juicios de valor sobre cómo ocurrió el accidente (velocidad estimada, maniobras, etc.).
                  </p>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-600 mb-1">
                    Narración Detallada de los Hechos *
                  </label>
                  <textarea
                    rows={4}
                    placeholder="Describa cronológicamente el desplazamiento de los vehículos, sentido de circulación, maniobras realizadas y dinámica del impacto..."
                    value={formData.chronologicalNarrative}
                    onChange={e => setFormData({ ...formData, chronologicalNarrative: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold outline-none focus:bg-white focus:border-emerald-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-600 mb-1">
                      Velocidad Estimada de los Vehículos
                    </label>
                    <input
                      type="text"
                      placeholder="Ej. V1: ~45 km/h | V2: ~60 km/h"
                      value={formData.estimatedSpeedKmH}
                      onChange={e => setFormData({ ...formData, estimatedSpeedKmH: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-600 mb-1">
                      Maniobras Previas al Impacto
                    </label>
                    <input
                      type="text"
                      placeholder="Ej. Giro a la izquierda, frenado de emergencia, cambio de carril"
                      value={formData.priorManeuvers}
                      onChange={e => setFormData({ ...formData, priorManeuvers: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-600 mb-1">
                      Hipótesis / Factores Concurrentes Preliminares
                    </label>
                    <input
                      type="text"
                      placeholder="Ej. No mantener distancia de seguridad / Calzada húmeda"
                      value={formData.preliminaryCauses}
                      onChange={e => setFormData({ ...formData, preliminaryCauses: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold"
                    />
                  </div>
                </div>
              </div>

              {/* 5B. Croquis Topográfico Interactivo */}
              <div className="bg-white p-6 rounded-3xl border border-gray-200/80 space-y-4">
                <div>
                  <h3 className="text-base font-extrabold text-gray-900">
                    5B. Bosquejo o Croquis Topográfico a Escala
                  </h3>
                  <p className="text-xs text-gray-500">
                    Dibujo técnico que ilustra la posición final de los vehículos, huellas de frenado, señales de tránsito y trayectoria previa al impacto.
                  </p>
                </div>

                <RoadSketchCanvas
                  initialDataUrl={formData.sketchDataUrl}
                  onSave={dataUrl => setFormData(prev => ({ ...prev, sketchDataUrl: dataUrl }))}
                />

                <div>
                  <label className="block text-[11px] font-bold text-gray-600 mb-1">
                    Notas Técnicas / Cotas y Medidas del Croquis
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. Huella de frenado V1: 11.4 metros en carril derecho; distancia punto de impacto a esquina norte: 6.2 metros."
                    value={formData.sketchNotes}
                    onChange={e => setFormData({ ...formData, sketchNotes: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold"
                  />
                </div>
              </div>

              {/* 5C. Registro Fotográfico y de Video */}
              <div className="bg-white p-6 rounded-3xl border border-gray-200/80 space-y-4">
                <div>
                  <h3 className="text-base font-extrabold text-gray-900">
                    5C. Registro Fotográfico y de Video de la Escena
                  </h3>
                  <p className="text-xs text-gray-500">
                    Imágenes panorámicas de la escena, fotos de los daños de cerca, estado de las llantas, señales de tránsito y posición antes de mover los vehículos.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-600 mb-1">
                      Categoría de la Evidencia
                    </label>
                    <select
                      value={newMediaCategory}
                      onChange={e => setNewMediaCategory(e.target.value as any)}
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold"
                    >
                      <option value="Panorámica de la escena">Panorámica de la escena</option>
                      <option value="Daños de cerca">Fotos de daños de cerca</option>
                      <option value="Estado de las llantas">Estado de las llantas</option>
                      <option value="Señales de tránsito">Señales de tránsito circundantes</option>
                      <option value="Posición final de vehículos">Posición antes de ser movidos</option>
                      <option value="Video / Evidencia adicional">Video / Evidencia adicional</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-600 mb-1">
                      Título de la Foto / Video
                    </label>
                    <input
                      type="text"
                      placeholder="Ej. Vista frontal impacto V1"
                      value={newMediaTitle}
                      onChange={e => setNewMediaTitle(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-600 mb-1">
                      Descripción Breve
                    </label>
                    <input
                      type="text"
                      placeholder="Detalle del ángulo o evidencia..."
                      value={newMediaDesc}
                      onChange={e => setNewMediaDesc(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold"
                    />
                  </div>
                  <div>
                    <label className="w-full px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold cursor-pointer flex items-center justify-center gap-2 transition-colors">
                      <Camera size={15} />
                      Adjuntar Foto / Video
                      <input
                        type="file"
                        accept="image/*,video/*"
                        className="hidden"
                        onChange={async e => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          await handleAddMediaFile(file, newMediaCategory, newMediaTitle, newMediaDesc);
                          setNewMediaTitle('');
                          setNewMediaDesc('');
                          e.target.value = '';
                        }}
                      />
                    </label>
                  </div>
                </div>

                {formData.mediaEvidences.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
                    {formData.mediaEvidences.map(item => (
                      <div key={item.id} className="rounded-2xl border border-gray-200 overflow-hidden bg-gray-50 flex flex-col">
                        <div className="h-40 bg-slate-900 relative flex items-center justify-center overflow-hidden">
                          {item.mediaType === 'video' ? (
                            <video src={item.dataUrl} controls className="w-full h-full object-cover" />
                          ) : (
                            <img
                              src={item.dataUrl}
                              alt={item.title}
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover"
                            />
                          )}
                          <button
                            type="button"
                            onClick={() =>
                              setFormData(prev => ({
                                ...prev,
                                mediaEvidences: prev.mediaEvidences.filter(m => m.id !== item.id),
                              }))
                            }
                            className="absolute top-2 right-2 p-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                        <div className="p-3 space-y-1">
                          <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-700">
                            {item.mediaType === 'video' ? <Video size={12} /> : <ImageIcon size={12} />}
                            <span>{item.category}</span>
                          </div>
                          <p className="text-xs font-extrabold text-gray-900 truncate">{item.title}</p>
                          {item.description && (
                            <p className="text-[11px] text-gray-500 line-clamp-2">{item.description}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* =========================================================
              SECCIÓN 6: FIRMAS Y VALIDACIONES
             ========================================================= */}
          {activeStep === 6 && (
            <div className="space-y-6">
              {/* 6A. Firmas de los conductores implicados */}
              <div className="bg-white p-6 rounded-3xl border border-gray-200/80 space-y-4">
                <div>
                  <h3 className="text-base font-extrabold text-gray-900">
                    6A. Firmas de Conformidad de los Conductores Implicados
                  </h3>
                  <p className="text-xs text-gray-500">
                    Firma de los conductores implicados (si están en condiciones de hacerlo).
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {formData.driverSignatures.map((sig, idx) => (
                    <div key={sig.driverId} className="p-4 rounded-2xl bg-gray-50 border border-gray-200 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs font-extrabold text-gray-900">
                            Conductor #{idx + 1}: {sig.driverName || 'Sin nombre'}
                          </p>
                          <p className="text-[11px] text-gray-500 font-mono">
                            ID: {sig.idNumber || '-'} · Placa: {sig.vehiclePlate || '-'}
                          </p>
                        </div>
                        <label className="flex items-center gap-1.5 text-xs font-bold text-gray-700 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={sig.ableToSign}
                            onChange={e => {
                              const list = [...formData.driverSignatures];
                              list[idx] = { ...sig, ableToSign: e.target.checked };
                              setFormData({ ...formData, driverSignatures: list });
                            }}
                          />
                          En condiciones de firmar
                        </label>
                      </div>

                      {sig.ableToSign ? (
                        <SignaturePad
                          title={`Firma Conductor #${idx + 1}`}
                          initialDataUrl={sig.signatureDataUrl}
                          onSave={dataUrl => {
                            const list = [...formData.driverSignatures];
                            list[idx] = { ...sig, signatureDataUrl: dataUrl };
                            setFormData({ ...formData, driverSignatures: list });
                          }}
                        />
                      ) : (
                        <div>
                          <label className="block text-[10px] font-bold text-red-600 mb-1">
                            Motivo por el cual no firma (Traslado en ambulancia, lesión, negativa, etc.)
                          </label>
                          <input
                            type="text"
                            placeholder="Ej. Trasladado de urgencia en ambulancia a centro asistencial"
                            value={sig.unableReason || ''}
                            onChange={e => {
                              const list = [...formData.driverSignatures];
                              list[idx] = { ...sig, unableReason: e.target.value };
                              setFormData({ ...formData, driverSignatures: list });
                            }}
                            className="w-full px-3 py-2 bg-white border border-red-200 rounded-xl text-xs font-semibold"
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* 6B. Firma del Agente de Tránsito y Verificador SST */}
              <div className="bg-white p-6 rounded-3xl border border-gray-200/80 space-y-4">
                <div>
                  <h3 className="text-base font-extrabold text-gray-900">
                    6B. Firma del Agente de Tránsito / Autoridad y Validación SST
                  </h3>
                  <p className="text-xs text-gray-500">
                    Firma del agente de tránsito que redacta el informe y del líder PESV / SST de la organización.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Agente de Tránsito */}
                  <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 space-y-3">
                    <p className="text-xs font-extrabold text-slate-900">
                      Agente de Tránsito / Autoridad que Redacta el Informe
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="Nombre del Agente"
                        value={formData.authoritySignature.officerName}
                        onChange={e =>
                          setFormData(prev => ({
                            ...prev,
                            authoritySignature: { ...prev.authoritySignature, officerName: e.target.value },
                          }))
                        }
                        className="px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold"
                      />
                      <input
                        type="text"
                        placeholder="Placa / Identificación"
                        value={formData.authoritySignature.badgeNumber}
                        onChange={e =>
                          setFormData(prev => ({
                            ...prev,
                            authoritySignature: { ...prev.authoritySignature, badgeNumber: e.target.value },
                          }))
                        }
                        className="px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-mono"
                      />
                    </div>
                    <SignaturePad
                      title="Firma del Agente de Tránsito / Autoridad"
                      initialDataUrl={formData.authoritySignature.signatureDataUrl}
                      onSave={dataUrl =>
                        setFormData(prev => ({
                          ...prev,
                          authoritySignature: { ...prev.authoritySignature, signatureDataUrl: dataUrl },
                        }))
                      }
                    />
                  </div>

                  {/* Responsable PESV / SST */}
                  <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 space-y-3">
                    <p className="text-xs font-extrabold text-slate-900">
                      Responsable Comité de Seguridad Vial (PESV / SST)
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="Nombre del Responsable SST"
                        value={formData.sstVerifierSignature?.name || ''}
                        onChange={e =>
                          setFormData(prev => ({
                            ...prev,
                            sstVerifierSignature: {
                              ...(prev.sstVerifierSignature || { idNumber: '', position: 'Líder PESV / SST' }),
                              name: e.target.value,
                            },
                          }))
                        }
                        className="px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold"
                      />
                      <input
                        type="text"
                        placeholder="Cédula / Licencia SST"
                        value={formData.sstVerifierSignature?.idNumber || ''}
                        onChange={e =>
                          setFormData(prev => ({
                            ...prev,
                            sstVerifierSignature: {
                              ...(prev.sstVerifierSignature || { name: '', position: 'Líder PESV / SST' }),
                              idNumber: e.target.value,
                            },
                          }))
                        }
                        className="px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-mono"
                      />
                    </div>
                    <SignaturePad
                      title="Firma Verificador PESV / SST"
                      initialDataUrl={formData.sstVerifierSignature?.signatureDataUrl}
                      onSave={dataUrl =>
                        setFormData(prev => ({
                          ...prev,
                          sstVerifierSignature: {
                            ...(prev.sstVerifierSignature || { name: '', idNumber: '', position: 'Líder PESV / SST' }),
                            signatureDataUrl: dataUrl,
                          },
                        }))
                      }
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Footer Navigation & Save */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-gray-200">
            <div className="flex items-center gap-2">
              {activeStep > 1 && (
                <button
                  type="button"
                  onClick={() => setActiveStep((activeStep - 1) as any)}
                  className="px-4 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl text-xs font-bold transition-colors"
                >
                  ← Sección Anterior
                </button>
              )}
              {activeStep < 6 && (
                <button
                  type="button"
                  onClick={() => setActiveStep((activeStep + 1) as any)}
                  className="px-4 py-2.5 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-bold transition-colors"
                >
                  Siguiente Sección →
                </button>
              )}
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 text-gray-500 hover:text-gray-800 text-xs font-bold"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-extrabold flex items-center gap-2 shadow-lg shadow-emerald-600/20 transition-all"
              >
                <Save size={15} />
                {saving ? 'Guardando Reporte...' : 'Guardar Reporte de Siniestro Vial'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
