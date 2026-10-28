import { jsPDF } from 'jspdf';

export interface ReportCardData {
  studentName?: string;
  documentId?: string;
  grade?: string;
  term?: string;
  groupDirector?: string;
}

export function generateStudentReportCardPdf(data?: ReportCardData): void {
  const studentName = data?.studentName || 'Valentina Gómez Suárez';
  const documentId = data?.documentId || '1007855552';
  const grade = data?.grade || '8°1';
  const term = data?.term || '1° Período 2026';
  const director = data?.groupDirector || 'Lic. Gabriel Mendoza / Claudia Morales';

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;

  // 1. Institutional Header Banner
  doc.setFillColor(0, 40, 142); // #00288e
  doc.rect(margin, 12, pageWidth - margin * 2, 22, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('INSTITUCIÓN EDUCATIVA VALLEJUELOS', pageWidth / 2, 18, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text('Reconocimiento Oficial de Estudios Resolución 01842 - DANE: 105001018921 • NIT: 811.023.941-8', pageWidth / 2, 24, { align: 'center' });
  doc.text('Medellín, Antioquia — Sistema de Evaluación Institucional (SIEE)', pageWidth / 2, 29, { align: 'center' });

  // Subtitle
  doc.setTextColor(0, 40, 142);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('BOLETÍN OFICIAL DE VALORACIÓN ACADÉMICA Y CONVIVENCIAL', pageWidth / 2, 40, { align: 'center' });

  // 2. Student Info Box
  doc.setFillColor(243, 246, 255); // light institutional blue
  doc.setDrawColor(210, 225, 255);
  doc.roundedRect(margin, 44, pageWidth - margin * 2, 24, 2, 2, 'FD');

  doc.setTextColor(30, 41, 59);
  doc.setFontSize(8.5);

  // Column 1
  doc.setFont('helvetica', 'bold');
  doc.text('Estudiante:', margin + 4, 50);
  doc.setFont('helvetica', 'normal');
  doc.text(studentName, margin + 24, 50);

  doc.setFont('helvetica', 'bold');
  doc.text('Doc. Identidad:', margin + 4, 56);
  doc.setFont('helvetica', 'normal');
  doc.text(`T.I. ${documentId}`, margin + 28, 56);

  doc.setFont('helvetica', 'bold');
  doc.text('Grado / Grupo:', margin + 4, 62);
  doc.setFont('helvetica', 'normal');
  doc.text(grade, margin + 28, 62);

  // Column 2
  const col2X = margin + 95;
  doc.setFont('helvetica', 'bold');
  doc.text('Período Académico:', col2X, 50);
  doc.setFont('helvetica', 'normal');
  doc.text(term, col2X + 33, 50);

  doc.setFont('helvetica', 'bold');
  doc.text('Director de Grupo:', col2X, 56);
  doc.setFont('helvetica', 'normal');
  doc.text(director, col2X + 31, 56);

  doc.setFont('helvetica', 'bold');
  doc.text('Fecha Expedición:', col2X, 62);
  doc.setFont('helvetica', 'normal');
  doc.text('28 de Octubre de 2026', col2X + 31, 62);

  // 3. Academic Results Table
  const tableTop = 73;
  const colWidths = {
    asignatura: 55,
    docente: 45,
    ih: 12,
    nota: 16,
    desempeno: 24,
    fallas: 14,
    observacion: 16
  };

  // Header row
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(margin, tableTop, pageWidth - margin * 2, 8, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);

  let curX = margin;
  doc.text('ASIGNATURA', curX + 2, tableTop + 5.5);
  curX += colWidths.asignatura;
  doc.text('DOCENTE RESPONSABLE', curX + 2, tableTop + 5.5);
  curX += colWidths.docente;
  doc.text('I.H.', curX + 2, tableTop + 5.5);
  curX += colWidths.ih;
  doc.text('NOTA', curX + 2, tableTop + 5.5);
  curX += colWidths.nota;
  doc.text('DESEMPEÑO', curX + 2, tableTop + 5.5);
  curX += colWidths.desempeno;
  doc.text('FALLAS', curX + 2, tableTop + 5.5);

  // Rows data (strictly institutional assignments and grades for 8°1)
  const rows = [
    { subject: 'Matemáticas', teacher: 'Lic. Gabriel Mendoza', ih: '5h', grade: '4.5', scale: 'SUPERIOR', faults: '0' },
    { subject: 'Lengua Castellana', teacher: 'Lic. Gabriel Mendoza', ih: '5h', grade: '4.8', scale: 'SUPERIOR', faults: '0' },
    { subject: 'Ciencias Naturales y Ed. Ambiental', teacher: 'Lic. Claudia Morales', ih: '4h', grade: '4.7', scale: 'SUPERIOR', faults: '1' },
    { subject: 'Ciencias Sociales e Historia', teacher: 'Lic. Ricardo Agudelo', ih: '4h', grade: '4.4', scale: 'ALTO', faults: '0' },
    { subject: 'Filosofía de Vida / Ética y Valores', teacher: 'Lic. Carlos Ramírez', ih: '2h', grade: '4.8', scale: 'SUPERIOR', faults: '0' },
    { subject: 'Inglés (Idioma Extranjero)', teacher: 'Lic. Laura Jaramillo', ih: '3h', grade: '4.3', scale: 'ALTO', faults: '0' },
    { subject: 'Educación Física y Deportes', teacher: 'Lic. Felipe Osorio', ih: '2h', grade: '4.6', scale: 'SUPERIOR', faults: '0' },
    { subject: 'Educación Artística y Cultural', teacher: 'Lic. Sofía Londoño', ih: '2h', grade: '4.9', scale: 'SUPERIOR', faults: '0' },
    { subject: 'Tecnología e Informática', teacher: 'Lic. Andrés Torres', ih: '2h', grade: '4.7', scale: 'SUPERIOR', faults: '0' },
    { subject: 'Cátedra de Paz y Convivencia', teacher: 'Lic. Ricardo Agudelo', ih: '1h', grade: '4.8', scale: 'SUPERIOR', faults: '0' }
  ];

  let currentY = tableTop + 8;
  rows.forEach((row, idx) => {
    const isEven = idx % 2 === 0;
    doc.setFillColor(isEven ? 255 : 248, isEven ? 255 : 250, isEven ? 255 : 252);
    doc.rect(margin, currentY, pageWidth - margin * 2, 7.5, 'F');

    doc.setDrawColor(226, 232, 240);
    doc.line(margin, currentY + 7.5, pageWidth - margin, currentY + 7.5);

    doc.setTextColor(30, 41, 59);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);

    let rowX = margin;
    doc.text(row.subject, rowX + 2, currentY + 5);
    rowX += colWidths.asignatura;

    doc.setFont('helvetica', 'normal');
    doc.text(row.teacher, rowX + 2, currentY + 5);
    rowX += colWidths.docente;

    doc.text(row.ih, rowX + 3, currentY + 5);
    rowX += colWidths.ih;

    // Grade badge
    doc.setFont('helvetica', 'bold');
    const num = parseFloat(row.grade);
    if (num >= 4.5) {
      doc.setTextColor(16, 120, 60);
    } else if (num >= 4.0) {
      doc.setTextColor(0, 40, 142);
    } else {
      doc.setTextColor(217, 119, 6);
    }
    doc.text(row.grade, rowX + 4, currentY + 5);
    rowX += colWidths.nota;

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(51, 65, 85);
    doc.text(row.scale, rowX + 2, currentY + 5);
    rowX += colWidths.desempeno;

    doc.text(row.faults, rowX + 5, currentY + 5);

    currentY += 7.5;
  });

  // 4. Performance Summary
  currentY += 4;
  doc.setFillColor(238, 244, 255);
  doc.setDrawColor(190, 215, 255);
  doc.roundedRect(margin, currentY, pageWidth - margin * 2, 20, 2, 2, 'FD');

  doc.setTextColor(0, 40, 142);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('CONSOLIDADO GENERAL DEL ESTUDIANTE', margin + 4, currentY + 6);

  doc.setTextColor(30, 41, 59);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text('Promedio General del Período: 4.6 / 5.0 (Nivel Superior)', margin + 4, currentY + 12);
  doc.text('Puesto en el Grupo: 2° de 34 estudiantes matriculados', margin + 4, currentY + 17);

  doc.text('Asistencia Global: 98% (48 de 49 horas de clase)', col2X, currentY + 12);
  doc.text('Observador Convivencial: Conducta Ejemplar Tipo A (Sin faltas)', col2X, currentY + 17);

  // 5. Institutional Scale Legend
  currentY += 24;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('ESCALA INSTITUCIONAL DE VALORACIÓN (Decreto 1290 / MEN):', margin, currentY);
  doc.setFont('helvetica', 'normal');
  doc.text('Bajo (1.0 - 2.9) | Básico (3.0 - 3.9) | Alto (4.0 - 4.5) | Superior (4.6 - 5.0)', margin + 82, currentY);

  // 6. Signatures
  const signY = pageHeight - 34;
  const colSignWidth = 55;

  doc.setDrawColor(148, 163, 184);
  doc.line(margin + 10, signY, margin + 10 + colSignWidth, signY);
  doc.line(pageWidth - margin - 10 - colSignWidth, signY, pageWidth - margin - 10, signY);

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('MAG. ÁLVARO RESTREPO VÉLEZ', margin + 10 + colSignWidth / 2, signY + 4, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text('Rector Institucional', margin + 10 + colSignWidth / 2, signY + 8, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('LIC. GABRIEL MENDOZA C.', pageWidth - margin - 10 - colSignWidth / 2, signY + 4, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text('Director de Grupo 8°1', pageWidth - margin - 10 - colSignWidth / 2, signY + 8, { align: 'center' });

  // Security code footer
  doc.setTextColor(148, 163, 184);
  doc.setFontSize(6.5);
  const cleanDoc = documentId.replace(/\D/g, '');
  doc.text(`Documento generado digitalmente por Edulink School • Código de verificación: VAL-2026-81-${cleanDoc}-OFIC`, pageWidth / 2, pageHeight - 8, { align: 'center' });

  // Trigger download
  const cleanName = studentName.replace(/\s+/g, '');
  const fileName = `Boletin_${cleanName}_Periodo1.pdf`;
  doc.save(fileName);
}
