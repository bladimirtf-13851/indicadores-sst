import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { AccidentInvestigation, Company, EventRecord } from '../types';

export const generateInvestigationPdf = (
  investigation: AccidentInvestigation,
  company?: Company | null,
  record?: EventRecord | null
) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;

  // Colors
  const primaryColor: [number, number, number] = [16, 120, 80]; // Emerald Dark
  const secondaryColor: [number, number, number] = [30, 41, 59]; // Slate Dark
  const lightBg: [number, number, number] = [248, 250, 252];
  const borderGray: [number, number, number] = [226, 232, 240];

  let currentY = margin;

  // --- HEADER ---
  doc.setFillColor(...lightBg);
  doc.setDrawColor(...borderGray);
  doc.roundedRect(margin, currentY, pageWidth - margin * 2, 24, 2, 2, 'FD');

  // Company Name & Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...primaryColor);
  doc.text((company?.name || 'SISTEMA DE GESTIÓN SST').toUpperCase(), margin + 5, currentY + 7);

  doc.setFontSize(9);
  doc.setTextColor(...secondaryColor);
  doc.text('INFORME DE INVESTIGACIÓN DE ACCIDENTE DE TRABAJO', margin + 5, currentY + 13);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('Conforme a la Resolución 1401 de 2007 (Ministerio de la Protección Social)', margin + 5, currentY + 18);

  // Box on the right for Status & Severity
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(investigation.severity === 'Grave' ? 220 : investigation.severity === 'Mortal' ? 180 : 16, 38, 38);
  const severityText = `SEVERIDAD: ${investigation.severity.toUpperCase()}`;
  doc.text(severityText, pageWidth - margin - 5, currentY + 8, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text(`Fecha Inv: ${investigation.investigationDate || '-'}`, pageWidth - margin - 5, currentY + 14, { align: 'right' });
  doc.text(`NIT: ${company?.nit || '-'}`, pageWidth - margin - 5, currentY + 19, { align: 'right' });

  currentY += 28;

  // --- 1. DATOS GENERALES Y DEL ACCIDENTADO ---
  autoTable(doc, {
    startY: currentY,
    theme: 'plain',
    margin: { left: margin, right: margin },
    styles: { fontSize: 7.5, cellPadding: 1.5, textColor: [30, 41, 59] },
    headStyles: { 
      fillColor: primaryColor, 
      textColor: [255, 255, 255], 
      fontStyle: 'bold', 
      fontSize: 8 
    },
    head: [['I. DATOS DEL TRABAJADOR Y DEL ACCIDENTE']],
    body: [
      [
        `Trabajador: ${investigation.employeeName || '-'}\n` +
        `Identificación: ${investigation.idType || 'CC'} ${investigation.idNumber || '-'}\n` +
        `Cargo / Ocupación: ${investigation.position || '-'}\n` +
        `Área / Departamento: ${investigation.department || '-'}`
      ],
      [
        `Fecha y Hora del Accidente: ${record?.date || investigation.accidentDate || '-'} ${record?.time || investigation.accidentTime || ''}\n` +
        `Lugar / Sitio del Accidente: ${record?.location || investigation.investigationPlace || '-'}\n` +
        `Tipo de Lesión: ${(record?.injuryType || []).join(', ') || investigation.injuryDescription || '-'}\n` +
        `Parte del Cuerpo Afectada: ${(record?.bodyPart || []).join(', ') || investigation.bodyPart || '-'}\n` +
        `Días de Incapacidad: ${investigation.daysLostActual || record?.lostDays || 0} días`
      ]
    ]
  });

  currentY = (doc as any).lastAutoTable.finalY + 4;

  // --- 2. DESCRIPCIÓN DE LOS HECHOS ---
  autoTable(doc, {
    startY: currentY,
    theme: 'plain',
    margin: { left: margin, right: margin },
    styles: { fontSize: 7.5, cellPadding: 1.5, textColor: [30, 41, 59] },
    headStyles: { 
      fillColor: primaryColor, 
      textColor: [255, 255, 255], 
      fontStyle: 'bold', 
      fontSize: 8 
    },
    head: [['II. CRONOLOGÍA Y DESCRIPCIÓN DETALLADA DE LOS HECHOS (Art. 7 Res. 1401/2007)']],
    body: [
      [`Tarea o Proceso que ejecutaba:\n${investigation.workProcess || 'No especificado'}`],
      [`Hechos previos al accidente:\n${investigation.priorEvents || 'No especificado'}`],
      [`Descripción secuencial del accidente:\n${investigation.eventDescription || record?.description || 'No especificado'}`],
      [`Hechos posteriores y atención médica inicial:\n${investigation.afterEvents || 'No especificado'}`]
    ]
  });

  currentY = (doc as any).lastAutoTable.finalY + 4;

  // --- 3. TESTIGOS PRESENCIALES ---
  const witnessesRows = (investigation.witnesses || []).map((w, idx) => [
    `#${idx + 1}`,
    w.name || '-',
    `${w.idType} ${w.idNumber}`,
    w.position || '-',
    w.testimony || 'Sin testimonio registrado'
  ]);

  if (witnessesRows.length > 0) {
    autoTable(doc, {
      startY: currentY,
      theme: 'grid',
      margin: { left: margin, right: margin },
      styles: { fontSize: 7, cellPadding: 1.5 },
      headStyles: { fillColor: [51, 65, 85], textColor: [255, 255, 255], fontStyle: 'bold' },
      head: [['III. TESTIGOS PRESENCIALES', 'Nombre', 'Documento', 'Cargo', 'Declaración / Versión del Testigo']],
      body: witnessesRows
    });
    currentY = (doc as any).lastAutoTable.finalY + 4;
  } else {
    autoTable(doc, {
      startY: currentY,
      theme: 'plain',
      margin: { left: margin, right: margin },
      styles: { fontSize: 7.5, cellPadding: 1.5 },
      headStyles: { fillColor: [51, 65, 85], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
      head: [['III. TESTIGOS PRESENCIALES']],
      body: [['Se deja constancia de que no hubo testigos presenciales del accidente.']]
    });
    currentY = (doc as any).lastAutoTable.finalY + 4;
  }

  // Check if we need a new page for Causal Tree & Action Plan
  if (currentY > pageHeight - 65) {
    doc.addPage();
    currentY = margin;
  }

  // --- 4. ANÁLISIS DE CAUSAS - MÉTODO ÁRBOL DE CAUSAS ---
  const treeBody: any[] = [
    [
      { content: 'PÉRDIDA / SUCESO FINAL', styles: { fontStyle: 'bold', fillColor: [241, 245, 249] } },
      investigation.lossDescription || record?.description || 'Accidente de trabajo con lesión'
    ],
    [
      { content: 'CAUSAS INMEDIATAS\n• Actos Subestándar / Inseguros', styles: { fontStyle: 'bold', textColor: [180, 83, 9] } },
      (investigation.immediateActs || []).length > 0 
        ? investigation.immediateActs.map(a => `• ${a}`).join('\n') 
        : 'Ninguno identificado'
    ],
    [
      { content: 'CAUSAS INMEDIATAS\n• Condiciones Subestándar', styles: { fontStyle: 'bold', textColor: [180, 83, 9] } },
      (investigation.immediateConditions || []).length > 0 
        ? investigation.immediateConditions.map(c => `• ${c}`).join('\n') 
        : 'Ninguno identificado'
    ],
    [
      { content: 'CAUSAS BÁSICAS\n• Factores Personales', styles: { fontStyle: 'bold', textColor: [15, 118, 110] } },
      (investigation.basicPersonalFactors || []).length > 0 
        ? investigation.basicPersonalFactors.map(f => `• ${f}`).join('\n') 
        : 'Ninguno identificado'
    ],
    [
      { content: 'CAUSAS BÁSICAS\n• Factores de Trabajo', styles: { fontStyle: 'bold', textColor: [15, 118, 110] } },
      (investigation.basicWorkFactors || []).length > 0 
        ? investigation.basicWorkFactors.map(f => `• ${f}`).join('\n') 
        : 'Ninguno identificado'
    ]
  ];

  autoTable(doc, {
    startY: currentY,
    theme: 'grid',
    margin: { left: margin, right: margin },
    styles: { fontSize: 7, cellPadding: 2, overflow: 'linebreak' },
    columnStyles: { 0: { cellWidth: 55 } },
    headStyles: { fillColor: primaryColor, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
    head: [['IV. ANÁLISIS DE CAUSAS (METODOLOGÍA: ÁRBOL DE CAUSAS)', 'HALLAZGOS Y DETERMINACIÓN']],
    body: treeBody
  });

  currentY = (doc as any).lastAutoTable.finalY + 4;

  // Check page height for Plan of Action
  if (currentY > pageHeight - 60) {
    doc.addPage();
    currentY = margin;
  }

  // --- 5. PLAN DE ACCIÓN / MEDIDAS DE INTERVENCIÓN ---
  const actionRows = (investigation.actionPlan || []).map((action, idx) => [
    `#${idx + 1}`,
    action.description || '-',
    action.hierarchy || 'Fuente',
    `${action.responsibleName || '-'}\n(${action.responsiblePosition || '-'})`,
    `Ejec: ${action.executionDate || '-'}\nSeg: ${action.followUpDate || '-'}`,
    action.status || 'Abierto'
  ]);

  autoTable(doc, {
    startY: currentY,
    theme: 'grid',
    margin: { left: margin, right: margin },
    styles: { fontSize: 6.8, cellPadding: 1.5 },
    headStyles: { fillColor: [51, 65, 85], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7 },
    columnStyles: {
      0: { cellWidth: 8 },
      1: { cellWidth: 70 },
      2: { cellWidth: 20 },
      3: { cellWidth: 35 },
      4: { cellWidth: 28 },
      5: { cellWidth: 21 }
    },
    head: [['V. MEDIDAS DE INTERVENCIÓN Y PLAN DE ACCIÓN', 'Medida de Control', 'Jerarquía', 'Responsable', 'Fechas', 'Estado']],
    body: actionRows.length > 0 ? actionRows : [['-', 'No se registraron medidas aún', '-', '-', '-', '-']]
  });

  currentY = (doc as any).lastAutoTable.finalY + 4;

  // --- 6. COMENTARIOS DEL ÁREA DE SST ---
  if (investigation.sstComments) {
    if (currentY > pageHeight - 45) {
      doc.addPage();
      currentY = margin;
    }
    autoTable(doc, {
      startY: currentY,
      theme: 'plain',
      margin: { left: margin, right: margin },
      styles: { fontSize: 7.5, cellPadding: 1.5 },
      headStyles: { fillColor: primaryColor, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
      head: [['VI. CONCLUSIONES Y RECOMENDACIONES TÉCNICAS DEL ÁREA DE SST']],
      body: [[investigation.sstComments]]
    });
    currentY = (doc as any).lastAutoTable.finalY + 4;
  }

  // --- 7. EVIDENCIAS FOTOGRÁFICAS ---
  if ((investigation.evidences || []).length > 0) {
    if (currentY > pageHeight - 65) {
      doc.addPage();
      currentY = margin;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...primaryColor);
    doc.text('VII. REGISTRO FOTOGRÁFICO Y EVIDENCIAS', margin, currentY);
    currentY += 4;

    const availableWidth = pageWidth - margin * 2;
    const photoWidth = 55;
    const photoHeight = 40;

    let posX = margin;
    for (let i = 0; i < investigation.evidences.length; i++) {
      const ev = investigation.evidences[i];
      if (currentY + photoHeight + 15 > pageHeight - margin) {
        doc.addPage();
        currentY = margin;
        posX = margin;
      }

      try {
        if (ev.dataUrl) {
          doc.addImage(ev.dataUrl, 'JPEG', posX, currentY, photoWidth, photoHeight);
          doc.rect(posX, currentY, photoWidth, photoHeight);
        }
      } catch (err) {
        doc.rect(posX, currentY, photoWidth, photoHeight);
        doc.setFontSize(6.5);
        doc.text('[Imagen no disponible]', posX + 5, currentY + 20);
      }

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.5);
      doc.setTextColor(30, 41, 59);
      doc.text(ev.title || `Evidencia #${i + 1}`, posX, currentY + photoHeight + 3);
      doc.setFont('helvetica', 'normal');
      doc.text((ev.description || '').substring(0, 45), posX, currentY + photoHeight + 6);

      posX += photoWidth + 8;
      if (posX + photoWidth > pageWidth - margin) {
        posX = margin;
        currentY += photoHeight + 12;
      }
    }

    if (posX !== margin) {
      currentY += photoHeight + 12;
    }
  }

  // Always put the signatures block neatly, creating a new page if remaining height is tight
  if (currentY > pageHeight - 60) {
    doc.addPage();
    currentY = margin;
  }

  // --- 8. FIRMAS DEL EQUIPO INVESTIGADOR (Res. 1401/2007) ---
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...primaryColor);
  doc.text('VIII. EQUIPO INVESTIGADOR Y FIRMAS DE RESPONSABILIDAD (Art. 7 Res. 1401/2007)', margin, currentY);
  currentY += 4;

  const colWidth = (pageWidth - margin * 2 - 6) / 3;
  const sigBoxHeight = 32;

  const signatures = [
    {
      role: 'Responsable SG-SST (Licencia)',
      data: investigation.sstLeader,
      extra: `Licencia SST No: ${investigation.sstLeader?.licenseNumber || '-'}`
    },
    {
      role: 'Representante COPASST / Vigía',
      data: investigation.copasstRep,
      extra: `Cargo: ${investigation.copasstRep?.position || '-'}`
    },
    {
      role: 'Jefe Inmediato o Supervisor',
      data: investigation.immediateBoss,
      extra: `Cargo: ${investigation.immediateBoss?.position || '-'}`
    },
    {
      role: 'Apoyo Técnico / Especialista',
      data: investigation.technicalSupport,
      extra: `Cargo: ${investigation.technicalSupport?.position || '-'}`
    },
    {
      role: 'Aprobación Representante Legal',
      data: investigation.legalRepApproval,
      extra: `Fecha Aprob: ${investigation.legalRepApproval?.signedDate || '-'}`
    }
  ];

  let xPos = margin;
  let yPos = currentY;

  for (let i = 0; i < signatures.length; i++) {
    const s = signatures[i];
    if (xPos + colWidth > pageWidth - margin) {
      xPos = margin;
      yPos += sigBoxHeight + 4;
      if (yPos + sigBoxHeight > pageHeight - margin) {
        doc.addPage();
        yPos = margin;
      }
    }

    doc.setFillColor(250, 250, 250);
    doc.setDrawColor(...borderGray);
    doc.roundedRect(xPos, yPos, colWidth, sigBoxHeight, 1.5, 1.5, 'FD');

    // Draw signature image if exists
    if (s.data?.signatureDataUrl) {
      try {
        doc.addImage(s.data.signatureDataUrl, 'PNG', xPos + 2, yPos + 2, colWidth - 4, 14);
      } catch (err) {}
    }

    // Line for signature
    doc.setDrawColor(180, 180, 180);
    doc.line(xPos + 3, yPos + 18, xPos + colWidth - 3, yPos + 18);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.8);
    doc.setTextColor(30, 41, 59);
    doc.text(s.data?.name || '__________________________', xPos + colWidth / 2, yPos + 21, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6);
    doc.setTextColor(100, 116, 139);
    doc.text(`C.C. ${s.data?.idNumber || '-'}`, xPos + colWidth / 2, yPos + 24.5, { align: 'center' });
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(16, 120, 80);
    doc.text(s.role, xPos + colWidth / 2, yPos + 28, { align: 'center' });
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(5.5);
    doc.setTextColor(120, 120, 120);
    doc.text(s.extra, xPos + colWidth / 2, yPos + 30.5, { align: 'center' });

    xPos += colWidth + 3;
  }

  // Save the PDF
  const safeName = (investigation.employeeName || 'Accidente').replace(/\s+/g, '_');
  const fileName = `Investigacion_Accidente_${safeName}_Res1401.pdf`;
  doc.save(fileName);
};

// -------------------------------------------------------------
// INFORME MENSUAL DE INDICADORES SST Y RESUMEN FURAT (Res. 0312/2019)
// -------------------------------------------------------------

export interface GenerateMonthlyReportOptions {
  month: string; // YYYY-MM
  indicator: {
    month: string;
    frecuencia: number;
    severidad: number;
    mortalidad: number;
    prevalenciaEL: number;
    incidenciaEL: number;
    ausentismoMedica: number;
    ausentismoComun: number;
    accidentCount: number;
    incidentCount: number;
    absenteeismCount: number;
    lostDaysTotal: number;
    employeeCount: number;
  };
  records: EventRecord[];
  company?: Company | null;
  programmedDays?: number;
}

export const generateMonthlyIndicatorsFuratPdf = ({
  month,
  indicator,
  records,
  company,
  programmedDays = 0,
}: GenerateMonthlyReportOptions) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;

  // Visual Palette
  const primaryColor: [number, number, number] = [16, 120, 80]; // Emerald Dark
  const secondaryColor: [number, number, number] = [30, 41, 59]; // Slate 800
  const lightBg: [number, number, number] = [248, 250, 252];
  const borderGray: [number, number, number] = [226, 232, 240];

  let currentY = margin;

  // Parse Month Title in Spanish
  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  const [yearStr, mStr] = month.split('-');
  const monthIndex = parseInt(mStr, 10) - 1;
  const monthLabel = `${monthNames[monthIndex] || month} ${yearStr}`;

  // Filter records for this month
  const monthRecords = records.filter(r => r.date && r.date.startsWith(month));
  const accidents = monthRecords.filter(r => r.eventType === 'Accidente');
  const incidents = monthRecords.filter(r => r.eventType === 'Incidente');
  const absentEvents = monthRecords.filter(r => r.eventType === 'Ausentismo');

  // Recover calculated values
  const lostDaysFromAccidents = accidents.reduce((acc, curr) => acc + (Number(curr.lostDays) || 0), 0);
  const chargedDays = accidents.reduce((acc, curr) => acc + (Number(curr.chargedDays) || 0), 0);
  const totalIncapacityDays = lostDaysFromAccidents + chargedDays;

  // --- HEADER / ENCABEZADO INSTITUCIONAL ---
  doc.setFillColor(...lightBg);
  doc.setDrawColor(...borderGray);
  doc.roundedRect(margin, currentY, pageWidth - margin * 2, 26, 2, 2, 'FD');

  // Company and SG-SST Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...primaryColor);
  doc.text((company?.name || 'SISTEMA DE GESTIÓN DE SEGURIDAD Y SALUD EN EL TRABAJO').toUpperCase(), margin + 6, currentY + 7);

  doc.setFontSize(9);
  doc.setTextColor(...secondaryColor);
  doc.text('INFORME MENSUAL DE INDICADORES SST Y RESUMEN FURAT', margin + 6, currentY + 13.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('Estándares Mínimos del SG-SST (Resolución 0312 de 2019 - Art. 30) y FURAT', margin + 6, currentY + 19);
  doc.text(`Generado: ${new Date().toLocaleDateString('es-CO')} | Software SST Cloud`, margin + 6, currentY + 23);

  // Metadata block on right
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...primaryColor);
  doc.text(`PERÍODO: ${monthLabel.toUpperCase()}`, pageWidth - margin - 6, currentY + 7.5, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text(`NIT: ${company?.nit || 'No registrado'}`, pageWidth - margin - 6, currentY + 13.5, { align: 'right' });
  doc.text(`Trabajadores mes: ${indicator.employeeCount || 0}`, pageWidth - margin - 6, currentY + 18.5, { align: 'right' });
  doc.text(`Días programados: ${programmedDays || 0}`, pageWidth - margin - 6, currentY + 23, { align: 'right' });

  currentY += 30;

  // --- 1. DATOS GENERALES DE LA EMPRESA Y POBLACIÓN ---
  autoTable(doc, {
    startY: currentY,
    theme: 'plain',
    margin: { left: margin, right: margin },
    styles: { fontSize: 7.5, cellPadding: 2, textColor: [30, 41, 59] },
    headStyles: {
      fillColor: primaryColor,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
    },
    head: [['I. INFORMACIÓN GENERAL DE LA EMPRESA Y COBERTURA']],
    body: [
      [
        `Razón Social: ${company?.name || '-'}\n` +
        `NIT: ${company?.nit || '-'}\n` +
        `Correo Electrónico: ${company?.email || '-'}`
      ],
      [
        `Período Evaluado: ${monthLabel} (${month})\n` +
        `Población Trabajadora Promedio en el Mes: ${indicator.employeeCount || 0} trabajadores\n` +
        `Días Laborales Programados en el Mes: ${programmedDays || 0} días\n` +
        `Total de Eventos Registrados en el Período: ${monthRecords.length} (${accidents.length} AT, ${incidents.length} Incidentes, ${absentEvents.length} Ausentismos)`
      ]
    ]
  });

  currentY = (doc as any).lastAutoTable.finalY + 4;

  // --- 2. TABLA DE INDICADORES MÍNIMOS SG-SST (RES. 0312/2019) ---
  const kpiRows = [
    [
      'Frecuencia de Accidentalidad (I.F.)',
      'Frecuencia',
      '(Nº de AT en el mes / Nº trabajadores en el mes) * 100',
      indicator.frecuencia.toFixed(2),
      indicator.employeeCount > 0
        ? `${indicator.frecuencia.toFixed(2)}% (${indicator.accidentCount} AT / ${indicator.employeeCount} trab.)`
        : '0.00 (Falta registrar trabajadores)',
      'Mensual',
      indicator.frecuencia === 0 ? 'Conforme (Meta: 0)' : 'Requiere Intervención'
    ],
    [
      'Severidad de Accidentalidad (I.S.)',
      'Severidad',
      '(Nº días de incapacidad por AT + cargados en el mes / Nº trabajadores) * 100',
      indicator.severidad.toFixed(2),
      indicator.employeeCount > 0
        ? `${indicator.severidad.toFixed(2)} (${totalIncapacityDays} días / ${indicator.employeeCount} trab.)`
        : '0.00 (Falta registrar trabajadores)',
      'Mensual',
      indicator.severidad === 0 ? 'Conforme' : `${totalIncapacityDays} días perdidos`
    ],
    [
      'Proporción de Accidentes Mortales',
      'Mortalidad',
      '(Nº de AT mortales en el año / Nº total de AT en el año) * 100',
      `${indicator.mortalidad.toFixed(2)}%`,
      accidents.some(a => a.accidentType === 'Mortal') ? '100%' : '0%',
      'Anual / Mensual',
      accidents.some(a => a.accidentType === 'Mortal') ? 'CRÍTICO: Accidente Mortal' : 'Conforme (0 mortales)'
    ],
    [
      'Prevalencia de Enfermedad Laboral',
      'Prevalencia EL',
      '(Nº casos nuevos y antiguos EL / Promedio trabajadores) * 100.000',
      indicator.prevalenciaEL.toFixed(2),
      `${indicator.prevalenciaEL.toFixed(2)} por 100k trab.`,
      'Anual',
      'Seguimiento Epidemiológico'
    ],
    [
      'Incidencia de Enfermedad Laboral',
      'Incidencia EL',
      '(Nº casos nuevos EL en el período / Promedio trabajadores) * 100.000',
      indicator.incidenciaEL.toFixed(2),
      `${indicator.incidenciaEL.toFixed(2)} por 100k trab.`,
      'Anual',
      'Vigilancia Ocupacional'
    ],
    [
      'Ausentismo por Causa Médica (I.A.)',
      'Ausentismo',
      '(Nº días de ausencia por incapacidad médica laboral y común / Días programados) * 100',
      `${indicator.ausentismoMedica.toFixed(2)}%`,
      programmedDays > 0 ? `${indicator.ausentismoMedica.toFixed(2)}% de días programados` : 'Pendiente días programados',
      'Mensual',
      indicator.ausentismoMedica <= 2 ? 'Rango Controlado' : 'Alerta de Ausentismo'
    ]
  ];

  autoTable(doc, {
    startY: currentY,
    theme: 'grid',
    margin: { left: margin, right: margin },
    styles: { fontSize: 6.8, cellPadding: 1.8, textColor: [30, 41, 59] },
    headStyles: {
      fillColor: [30, 41, 59],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7.2
    },
    head: [[
      'Indicador (Res. 0312/2019)',
      'Tipo',
      'Fórmula Reglamentaria',
      'Resultado',
      'Detalle del Cálculo',
      'Periodicidad',
      'Estado / Interpretación'
    ]],
    body: kpiRows
  });

  currentY = (doc as any).lastAutoTable.finalY + 5;

  // Check page overflow for section 3
  if (currentY > pageHeight - 65) {
    doc.addPage();
    currentY = margin;
  }

  // --- 3. RESUMEN DE REPORTES FURAT DE ACCIDENTES EN EL MES ---
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...primaryColor);
  doc.text('III. RESUMEN DE REPORTES FURAT (ACCIDENTES DE TRABAJO REGISTRADOS EN EL MES)', margin, currentY + 3);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text('Formato Único de Reporte de Accidente de Trabajo - Conforme a Resolución 156/2005 & Decreto 1072/2015', margin, currentY + 6.5);

  currentY += 9;

  if (accidents.length === 0) {
    autoTable(doc, {
      startY: currentY,
      theme: 'plain',
      margin: { left: margin, right: margin },
      styles: { fontSize: 7.5, cellPadding: 2, textColor: [71, 85, 105] },
      headStyles: { fillColor: [241, 245, 249], textColor: [15, 118, 110], fontStyle: 'bold', fontSize: 7.5 },
      head: [['ESTADO DE ACCIDENTALIDAD EN EL PERÍODO']],
      body: [[
        `No se presentaron accidentes de trabajo durante el mes de ${monthLabel}.\n` +
        `Total de Días de Incapacidad Generados: 0 días. Indicador de Frecuencia: 0.00%.\n` +
        `Felicitaciones: Cero accidentes de trabajo en el período evaluado.`
      ]]
    });
    currentY = (doc as any).lastAutoTable.finalY + 5;
  } else {
    // Accident items table
    const furatSummaryRows = accidents.map((acc, index) => {
      const docTypeAndNum = acc.idType ? `${acc.idType} ${acc.idNumber || '-'}` : (acc.idNumber || '-');
      const lesionInfo = (acc.injuryType || []).join(', ') || 'Lesión física';
      const bodyPartInfo = (acc.bodyPart || []).join(', ') || 'No especificada';
      const sitPlace = acc.location || (acc.accidentLocationType || 'Dentro de empresa');

      return [
        `#${index + 1}\n${acc.date}\n${acc.time || '08:00'}`,
        `${acc.employeeName}\nDoc: ${docTypeAndNum}\nCargo: ${acc.position || acc.habitualOccupation || '-'}\nÁrea: ${acc.department}`,
        `Tipo: ${acc.accidentType || 'Incapacitante'}\nSitio: ${sitPlace}\nLabor habitual: ${acc.doingHabitualWork !== false ? 'Sí' : 'No'}`,
        `Lesión: ${lesionInfo}\nParte: ${bodyPartInfo}\nAgente: ${(acc.accidentAgent || []).join(', ') || '-'}`,
        `Días Incap: ${acc.lostDays || 0}\nDías Cargados: ${acc.chargedDays || 0}\nTotal: ${(Number(acc.lostDays) || 0) + (Number(acc.chargedDays) || 0)}`,
        `EPS: ${acc.eps || '-'}\nARL: ${acc.arl || '-'}\nResp: ${acc.reportResponsibleName || '-'}`
      ];
    });

    autoTable(doc, {
      startY: currentY,
      theme: 'grid',
      margin: { left: margin, right: margin },
      styles: { fontSize: 6.7, cellPadding: 1.6, textColor: [30, 41, 59] },
      headStyles: {
        fillColor: primaryColor,
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 7.2
      },
      head: [[
        'Nº / Fecha',
        'Trabajador Afectado',
        'Circunstancias / Lugar',
        'Naturaleza de la Lesión',
        'Días Perdidos',
        'Entidades / FURAT'
      ]],
      body: furatSummaryRows
    });

    currentY = (doc as any).lastAutoTable.finalY + 5;

    // Detailed description for each accident
    for (let i = 0; i < accidents.length; i++) {
      const acc = accidents[i];
      if (currentY > pageHeight - 50) {
        doc.addPage();
        currentY = margin;
      }

      autoTable(doc, {
        startY: currentY,
        theme: 'plain',
        margin: { left: margin, right: margin },
        styles: { fontSize: 7, cellPadding: 1.5, textColor: [30, 41, 59] },
        headStyles: { fillColor: [241, 245, 249], textColor: [15, 23, 42], fontStyle: 'bold', fontSize: 7.2 },
        head: [[`Relato de Hechos FURAT - Accidente #${i + 1}: ${acc.employeeName} (${acc.date})`]],
        body: [
          [`Descripción del hecho: ${acc.description || 'Sin descripción detallada registrada.'}`],
          [
            `Mecanismo: ${(acc.mechanism || []).join(', ') || '-'} | ` +
            `Jornada: ${acc.workdaySchedule || 'Ordinaria'} | ` +
            `Hora: ${acc.time || '-'} | ` +
            `Testigos: ${acc.hasWitnesses && acc.witnesses?.length ? acc.witnesses.map(w => `${w.name} (${w.position})`).join('; ') : 'Sin testigos presenciales'}`
          ]
        ]
      });

      currentY = (doc as any).lastAutoTable.finalY + 4;
    }
  }

  // --- 4. RESUMEN DE CASOS DE INCIDENTES Y AUSENTISMOS ---
  if (incidents.length > 0 || absentEvents.length > 0) {
    if (currentY > pageHeight - 45) {
      doc.addPage();
      currentY = margin;
    }

    const otherEventsRows = [
      ...incidents.map((inc, idx) => [
        `Incidente #${idx + 1}`,
        inc.date,
        inc.employeeName || '-',
        inc.department || '-',
        inc.description || '-',
        '0'
      ]),
      ...absentEvents.map((ab, idx) => [
        `Ausentismo #${idx + 1}`,
        ab.date || ab.incapacityStartDate || '-',
        ab.employeeName || '-',
        ab.department || '-',
        `Incapacidad médica: ${ab.description || ab.origin || 'Común'} (${ab.incapacityStartDate || ''} a ${ab.incapacityEndDate || ''})`,
        `${ab.lostDays || 0}`
      ])
    ];

    autoTable(doc, {
      startY: currentY,
      theme: 'grid',
      margin: { left: margin, right: margin },
      styles: { fontSize: 6.6, cellPadding: 1.5, textColor: [30, 41, 59] },
      headStyles: { fillColor: [71, 85, 105], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7 },
      head: [['Tipo de Evento', 'Fecha', 'Trabajador', 'Área', 'Detalle del Evento / Diagnóstico', 'Días Ausencia']],
      body: otherEventsRows
    });

    currentY = (doc as any).lastAutoTable.finalY + 5;
  }

  // Check page overflow for signatures
  if (currentY > pageHeight - 40) {
    doc.addPage();
    currentY = margin;
  }

  // --- 5. CONSTANCIA Y FIRMAS DE RESPONSABILIDAD LEGAL ---
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...secondaryColor);
  doc.text('IV. CONTROL, REVISIÓN Y APROBACIÓN DEL INFORME MENSUAL', margin, currentY + 3);

  currentY += 6;

  const colWidth = (pageWidth - margin * 2 - 8) / 3;
  const sigBoxHeight = 26;

  const signatures = [
    {
      title: 'Elaboró / Responsable SG-SST',
      sub: 'Líder de Seguridad y Salud en el Trabajo',
      extra: 'Licencia SST Vigente'
    },
    {
      title: 'Revisó / Delegado COPASST',
      sub: 'Comité Paritario o Vigía SST',
      extra: 'Representante de los Trabajadores'
    },
    {
      title: 'Aprobó / Representante Legal',
      sub: company?.name || 'Gerencia General',
      extra: `NIT: ${company?.nit || '-'}`
    }
  ];

  let xPos = margin;
  for (let i = 0; i < signatures.length; i++) {
    const s = signatures[i];
    doc.setFillColor(250, 250, 250);
    doc.setDrawColor(...borderGray);
    doc.roundedRect(xPos, currentY, colWidth, sigBoxHeight, 1.5, 1.5, 'FD');

    // Signature line
    doc.setDrawColor(180, 180, 180);
    doc.line(xPos + 4, currentY + 15, xPos + colWidth - 4, currentY + 15);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.8);
    doc.setTextColor(30, 41, 59);
    doc.text(s.title, xPos + colWidth / 2, currentY + 18.5, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(5.8);
    doc.setTextColor(100, 116, 139);
    doc.text(s.sub, xPos + colWidth / 2, currentY + 21.5, { align: 'center' });
    doc.setFont('helvetica', 'italic');
    doc.text(s.extra, xPos + colWidth / 2, currentY + 24.5, { align: 'center' });

    xPos += colWidth + 4;
  }

  // Save the document
  const safeMonth = month.replace('-', '_');
  const safeCompany = (company?.name || 'Empresa').replace(/\s+/g, '_');
  const filename = `Indicadores_SST_FURAT_${safeCompany}_${safeMonth}.pdf`;
  doc.save(filename);
};

