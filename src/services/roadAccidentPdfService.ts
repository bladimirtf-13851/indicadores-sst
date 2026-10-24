import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Company, RoadAccidentReport } from '../types';

export const generateRoadAccidentPdf = (
  report: RoadAccidentReport,
  company?: Company | null
) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 12;

  const primaryColor: [number, number, number] = [15, 23, 42]; // Slate 900
  const accentColor: [number, number, number] = [5, 150, 105]; // Emerald 600
  const lightBg: [number, number, number] = [248, 250, 252];
  const borderGray: [number, number, number] = [203, 213, 225];

  let currentY = margin;

  const checkPageBreak = (neededHeight: number) => {
    if (currentY + neededHeight > pageHeight - 16) {
      doc.addPage();
      currentY = margin;
    }
  };

  // --- HEADER ---
  doc.setFillColor(...lightBg);
  doc.setDrawColor(...borderGray);
  doc.roundedRect(margin, currentY, pageWidth - margin * 2, 24, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(...accentColor);
  doc.text((company?.name || 'SISTEMA DE GESTIÓN SST & SEGURIDAD VIAL').toUpperCase(), margin + 4, currentY + 7);

  doc.setFontSize(9.5);
  doc.setTextColor(...primaryColor);
  doc.text('INFORME TÉCNICO DE REPORTE DE SINIESTRO VIAL (PESV / IPAT)', margin + 4, currentY + 13);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text(`NIT: ${company?.nit || '-'}  |  Estado: ${report.status}  |  Gravedad: ${report.severity}`, margin + 4, currentY + 19);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...primaryColor);
  doc.text(`Código: ${report.code || report.id.slice(0, 8).toUpperCase()}`, pageWidth - margin - 4, currentY + 8, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text(`Fecha Hecho: ${report.accidentDate || '-'} ${report.accidentTime || ''}`, pageWidth - margin - 4, currentY + 14, { align: 'right' });
  doc.text(`Tipo Colisión: ${report.collisionType || '-'}`, pageWidth - margin - 4, currentY + 19, { align: 'right' });

  currentY += 28;

  // --- 1. DATOS BÁSICOS DEL HECHO (FECHA, UBICACIÓN Y ESTADO DE LA VÍA) ---
  autoTable(doc, {
    startY: currentY,
    theme: 'grid',
    margin: { left: margin, right: margin },
    styles: { fontSize: 7.5, cellPadding: 2, textColor: [30, 41, 59] },
    headStyles: { fillColor: primaryColor, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
    head: [['1. DATOS BÁSICOS DEL HECHO (FECHA, UBICACIÓN Y ESTADO DE LA VÍA)', '']],
    body: [
      [
        `Fecha y Hora Exacta: ${report.accidentDate || '-'} a las ${report.accidentTime || '-'}\n` +
        `Dirección Exacta: ${report.address || '-'}\n` +
        `Municipio / Dpto: ${report.municipality || '-'} / ${report.department || '-'}\n` +
        `Zona: ${report.zone || '-'}  |  Coordenadas GPS: ${report.gpsCoordinates || 'No registradas'}`,
        `Intersecciones: ${report.intersections || 'N/A'}\n` +
        `Sentido de la Vía: ${report.roadDirection || '-'}\n` +
        `Geometría Vial: ${report.roadGeometry || '-'}\n` +
        `Puntos de Referencia: ${report.referencePoints || '-'}`
      ],
      [
        `Condición Climática: ${report.weatherCondition || '-'}\n` +
        `Condición de Iluminación: ${report.lightingCondition || '-'}\n` +
        `Estado de la Superficie Vial: ${report.roadSurfaceCondition || '-'}`,
        `Señalización Presente: ${(report.trafficSignalsPresent || []).join(', ') || 'Ninguna reportada'}\n` +
        `Observaciones del Entorno: ${report.environmentNotes || 'Sin observaciones adicionales'}`
      ]
    ]
  });

  currentY = (doc as any).lastAutoTable.finalY + 5;

  // --- 2. IDENTIFICACIÓN DE LAS PERSONAS INVOLUCRADAS ---
  // 2A. Conductores
  const driverRows = (report.drivers || []).map((d, idx) => [
    `Conductor #${idx + 1}: ${d.fullName || '-'}\nDoc: ${d.idType} ${d.idNumber || '-'}`,
    `Licencia N°: ${d.licenseNumber || '-'}\nCategoría: ${d.licenseCategory || '-'} | Vigencia: ${d.licenseExpiry || '-'}`,
    `Tel: ${d.phone || '-'}\nDir: ${d.address || '-'}`,
    `Vehículo Placa: ${d.vehiclePlate || '-'}\nAlcoholemia: ${d.alcoholTestResult || 'No realizado'}`
  ]);

  autoTable(doc, {
    startY: currentY,
    theme: 'grid',
    margin: { left: margin, right: margin },
    styles: { fontSize: 7.5, cellPadding: 2, textColor: [30, 41, 59] },
    headStyles: { fillColor: primaryColor, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
    head: [['2. IDENTIFICACIÓN DE CONDUCTORES INVOLUCRADOS', 'Licencia de Conducción', 'Contacto y Dirección', 'Vehículo / Estado']],
    body: driverRows.length > 0 ? driverRows : [['Sin conductores registrados', '-', '-', '-']]
  });

  currentY = (doc as any).lastAutoTable.finalY + 3;

  // 2B. Pasajeros, Peatones, Testigos y Autoridades
  const peopleText = (report.passengersAndPedestrians || []).length > 0
    ? report.passengersAndPedestrians
        .map(p => `• [${p.role}] ${p.fullName} (${p.idType} ${p.idNumber}) - Tel: ${p.phone || '-'} - Dir: ${p.address || '-'} ${p.vehiclePlate ? `[Veh: ${p.vehiclePlate}]` : ''}`)
        .join('\n')
    : 'No se registraron pasajeros ni peatones adicionales.';

  const witnessesText = (report.witnesses || []).length > 0
    ? report.witnesses
        .map(w => `• ${w.fullName} (ID: ${w.idNumber || '-'}, Tel: ${w.phone || '-'}): "${w.statement || '-'}"`)
        .join('\n')
    : 'Sin testigos presenciales registrados.';

  const authInfo = report.authority?.attendedByAuthority
    ? `Entidad: ${report.authority.entity || '-'}  |  Agente: ${report.authority.officerName || '-'}  |  Placa N°: ${report.authority.badgeNumber || '-'}\n` +
      `Unidad/Cuadrante: ${report.authority.unitOrStation || '-'}  |  N° Informe IPAT: ${report.authority.ipatReportNumber || '-'}\n` +
      `Observaciones Autoridad: ${report.authority.observations || '-'}`
    : 'El evento no contó con intervención presencial de autoridad de tránsito en el sitio.';

  autoTable(doc, {
    startY: currentY,
    theme: 'grid',
    margin: { left: margin, right: margin },
    styles: { fontSize: 7.5, cellPadding: 2, textColor: [30, 41, 59] },
    body: [
      [`PASAJEROS Y PEATONES IMPLICADOS:\n${peopleText}`],
      [`TESTIGOS PRESENCIALES Y DECLARACIONES:\n${witnessesText}`],
      [`AUTORIDAD DE TRÁNSITO / POLICÍA QUE ATIENDE LA ESCENA:\n${authInfo}`]
    ]
  });

  currentY = (doc as any).lastAutoTable.finalY + 5;

  // --- 3 & 4. VEHÍCULOS INVOLUCRADOS, DOCUMENTACIÓN LEGAL, DAÑOS Y PUNTOS DE IMPACTO ---
  const vehicleRows = (report.vehicles || []).map((v, idx) => [
    `Vehículo #${idx + 1} - Placa: ${v.plate || '-'}\nTipo: ${v.vehicleType}\nMarca/Línea: ${v.brand} ${v.modelLine}\nColor: ${v.color || '-'} | Año: ${v.year || '-'}\nServicio: ${v.serviceType}`,
    `SOAT N°: ${v.soatNumber || '-'} (Vence: ${v.soatExpiry || '-'})\nPóliza Todo Riesgo: ${v.allRiskPolicyNumber || '-'} (${v.insuranceCompany || '-'})\nRTM N°: ${v.rtmNumber || '-'} (Vence: ${v.rtmExpiry || '-'})`,
    `Vínculo: ${v.ownershipType}\nPropietario: ${v.ownerName || 'Mismo conductor'}\nID/NIT: ${v.ownerIdNumber || '-'}\nTel: ${v.ownerPhone || '-'}`,
    `Severidad Daño: ${v.damageSeverity} ${v.immobilized ? '(INMOVILIZADO)' : ''}\nPuntos Impacto: ${(v.impactZones || []).join(', ') || '-'}\n1er Contacto: ${v.firstContactPoint || '-'}\nDaños Visibles: ${v.visibleDamages || '-'}\nPiezas Desprendidas: ${v.detachedParts || 'Ninguna'}`
  ]);

  autoTable(doc, {
    startY: currentY,
    theme: 'grid',
    margin: { left: margin, right: margin },
    styles: { fontSize: 7, cellPadding: 2, textColor: [30, 41, 59] },
    headStyles: { fillColor: primaryColor, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7.5 },
    head: [['3. Datos Técnicos del Vehículo', 'Documentación Legal (SOAT/RTM)', 'Propietario del Vehículo', '4. Daños Materiales y Puntos de Impacto']],
    body: vehicleRows.length > 0 ? vehicleRows : [['Sin vehículos registrados', '-', '-', '-']]
  });

  currentY = (doc as any).lastAutoTable.finalY + 4;

  // --- 4B. LESIONES PERSONALES Y CENTROS MÉDICOS ---
  const injuryRows = (report.injuries || []).map(inj => [
    `${inj.personName || '-'} (${inj.role})\nID: ${inj.idNumber || '-'}`,
    inj.severity,
    `Partes afectadas: ${inj.bodyPartsAffected || '-'}\nDescripción: ${inj.injuryDescription || '-'}`,
    inj.transferredToMedicalCenter
      ? `SÍ - Centro Médico: ${inj.medicalCenterName || '-'}\nMedio/Ambulancia: ${inj.ambulanceOrTransport || '-'}`
      : 'No requirió traslado hospitalario'
  ]);

  autoTable(doc, {
    startY: currentY,
    theme: 'grid',
    margin: { left: margin, right: margin },
    styles: { fontSize: 7.5, cellPadding: 2, textColor: [30, 41, 59] },
    headStyles: { fillColor: [185, 28, 28], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
    head: [['4B. REGISTRO DE LESIONES PERSONALES', 'Gravedad Aparente', 'Detalle de Lesiones', 'Traslado y Centro Médico']],
    body: injuryRows.length > 0
      ? injuryRows
      : [['No se reportaron personas heridas ni fallecidas en el evento.', '-', '-', '-']]
  });

  currentY = (doc as any).lastAutoTable.finalY + 5;

  // --- 5. NARRACIÓN DE LOS HECHOS Y CROQUIS TOPOGRÁFICO ---
  autoTable(doc, {
    startY: currentY,
    theme: 'grid',
    margin: { left: margin, right: margin },
    styles: { fontSize: 7.5, cellPadding: 2, textColor: [30, 41, 59] },
    headStyles: { fillColor: primaryColor, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
    head: [['5. NARRACIÓN CRONOLÓGICA Y ANÁLISIS DEL HECHO VIAL']],
    body: [
      [
        `Relato Objetivo y Cronológico de los Hechos:\n${report.chronologicalNarrative || '-'}\n\n` +
        `Velocidad Estimada: ${report.estimatedSpeedKmH || 'No determinada'}  |  Maniobras Previas: ${report.priorManeuvers || '-'}\n` +
        `Hipótesis / Causas Preliminares: ${report.preliminaryCauses || '-'}\n` +
        `Otros Daños a Infraestructura o Terceros: ${report.otherPropertyDamages || 'Ninguno'}`
      ]
    ]
  });

  currentY = (doc as any).lastAutoTable.finalY + 5;

  // Render Croquis Topográfico Image
  if (report.sketchDataUrl && report.sketchDataUrl.startsWith('data:image')) {
    checkPageBreak(85);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(...primaryColor);
    doc.text('BOSQUEJO O CROQUIS TOPOGRÁFICO DEL ACCIDENTE:', margin, currentY + 4);
    currentY += 6;

    try {
      doc.setDrawColor(...borderGray);
      doc.rect(margin, currentY, pageWidth - margin * 2, 72);
      doc.addImage(report.sketchDataUrl, 'PNG', margin + 1, currentY + 1, pageWidth - margin * 2 - 2, 70);
      currentY += 74;
      if (report.sketchNotes) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.text(`Notas del Croquis: ${report.sketchNotes}`, margin, currentY + 3);
        currentY += 7;
      }
    } catch (e) {
      console.warn('Could not embed sketch image in PDF:', e);
    }
  }

  // Render Photographic Evidence (up to 6 images in a 2-column grid)
  const imageEvidences = (report.mediaEvidences || []).filter(m => m.mediaType === 'image' && m.dataUrl?.startsWith('data:image'));
  if (imageEvidences.length > 0) {
    checkPageBreak(65);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(...primaryColor);
    doc.text('REGISTRO FOTOGRÁFICO DE LA ESCENA Y EVIDENCIAS:', margin, currentY + 4);
    currentY += 7;

    const colWidth = (pageWidth - margin * 2 - 6) / 2;
    const boxHeight = 52;

    for (let i = 0; i < imageEvidences.length; i += 2) {
      checkPageBreak(boxHeight + 8);
      const leftItem = imageEvidences[i];
      const rightItem = imageEvidences[i + 1];

      [leftItem, rightItem].forEach((item, colIdx) => {
        if (!item) return;
        const x = margin + colIdx * (colWidth + 6);
        doc.setDrawColor(...borderGray);
        doc.roundedRect(x, currentY, colWidth, boxHeight, 1.5, 1.5, 'S');
        try {
          doc.addImage(item.dataUrl, 'JPEG', x + 2, currentY + 2, colWidth - 4, 36);
        } catch {
          try {
            doc.addImage(item.dataUrl, 'PNG', x + 2, currentY + 2, colWidth - 4, 36);
          } catch {}
        }
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7);
        doc.setTextColor(...primaryColor);
        doc.text(`[${item.category}] ${item.title || ''}`.slice(0, 52), x + 2, currentY + 42);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(6.5);
        doc.setTextColor(100, 116, 139);
        doc.text((item.description || '').slice(0, 62), x + 2, currentY + 47);
      });

      currentY += boxHeight + 5;
    }
  }

  // --- 6. FIRMAS Y VALIDACIONES ---
  checkPageBreak(55);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...primaryColor);
  doc.text('6. FIRMAS DE CONFORMIDAD Y VALIDACIÓN DEL INFORME', margin, currentY + 5);
  currentY += 8;

  const sigBoxWidth = (pageWidth - margin * 2 - 8) / 3;
  const sigBoxHeight = 36;

  const allSigners: Array<{
    title: string;
    name: string;
    subtitle: string;
    signatureDataUrl?: string;
    note?: string;
  }> = [
    ...(report.driverSignatures || []).map((ds, i) => ({
      title: `CONDUCTOR #${i + 1} (${ds.vehiclePlate || 'S/P'})`,
      name: ds.driverName || '-',
      subtitle: `ID: ${ds.idNumber || '-'}`,
      signatureDataUrl: ds.ableToSign ? ds.signatureDataUrl : undefined,
      note: !ds.ableToSign ? `No firma: ${ds.unableReason || 'Impedido médicamente'}` : undefined,
    })),
    {
      title: 'AGENTE DE TRÁNSITO / AUTORIDAD',
      name: report.authoritySignature?.officerName || report.authority?.officerName || '-',
      subtitle: `Placa: ${report.authoritySignature?.badgeNumber || report.authority?.badgeNumber || '-'}`,
      signatureDataUrl: report.authoritySignature?.signatureDataUrl,
      note: report.authoritySignature?.validationNotes,
    },
  ];

  if (report.sstVerifierSignature?.name) {
    allSigners.push({
      title: 'VERIFICADOR PESV / SST',
      name: report.sstVerifierSignature.name,
      subtitle: `${report.sstVerifierSignature.position || 'SST'} - ID: ${report.sstVerifierSignature.idNumber || '-'}`,
      signatureDataUrl: report.sstVerifierSignature.signatureDataUrl,
    });
  }

  for (let i = 0; i < allSigners.length; i += 3) {
    checkPageBreak(sigBoxHeight + 6);
    const rowSigners = allSigners.slice(i, i + 3);
    rowSigners.forEach((sig, idx) => {
      const x = margin + idx * (sigBoxWidth + 4);
      doc.setDrawColor(...borderGray);
      doc.roundedRect(x, currentY, sigBoxWidth, sigBoxHeight, 1.5, 1.5, 'S');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.5);
      doc.setTextColor(...accentColor);
      doc.text(sig.title.slice(0, 34), x + 2, currentY + 5);

      if (sig.signatureDataUrl && sig.signatureDataUrl.startsWith('data:image')) {
        try {
          doc.addImage(sig.signatureDataUrl, 'PNG', x + 6, currentY + 7, sigBoxWidth - 12, 15);
        } catch {}
      } else if (sig.note) {
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(6.5);
        doc.setTextColor(185, 28, 28);
        doc.text(sig.note.slice(0, 38), x + 2, currentY + 15);
      }

      doc.setDrawColor(148, 163, 184);
      doc.line(x + 3, currentY + 25, x + sigBoxWidth - 3, currentY + 25);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(...primaryColor);
      doc.text(sig.name.slice(0, 34), x + 2, currentY + 29);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(100, 116, 139);
      doc.text(sig.subtitle.slice(0, 36), x + 2, currentY + 33);
    });
    currentY += sigBoxHeight + 5;
  }

  const cleanDate = (report.accidentDate || 'fecha').replace(/[^a-zA-Z0-9_-]/g, '');
  doc.save(`Reporte_Siniestro_Vial_${report.code || cleanDate}.pdf`);
};
