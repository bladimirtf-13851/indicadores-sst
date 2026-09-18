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
        `Fecha y Hora del Accidente: ${investigation.accidentDate || '-'} ${investigation.accidentTime || ''}\n` +
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
