import { jsPDF } from 'jspdf';

export interface CircularPDFData {
  title: string;
  circularNumber?: string;
  author: string;
  date: string;
  target: string;
  content: string;
}

/**
 * Generates and downloads an authentic, official institutional Circular PDF for I.E. Vallejuelos.
 */
export function downloadCircularPDF(data: CircularPDFData): void {
  const {
    title,
    circularNumber = 'Circular Oficial',
    author = 'Coordinación de Convivencia',
    date = new Date().toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' }),
    target = 'Toda la Comunidad Educativa',
    content
  } = data;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // 1. Header Banner
  doc.setFillColor(0, 40, 142); // Primary Blue
  doc.rect(0, 0, pageWidth, 28, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('INSTITUCIÓN EDUCATIVA VALLEJUELOS', pageWidth / 2, 11, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('Secretaría de Educación de Medellín • DANE: 105001025841 • NIT: 900.124.582-1', pageWidth / 2, 17, { align: 'center' });
  doc.setFont('helvetica', 'bold');
  doc.text('SISTEMA INTEGRADO DE GESTIÓN INSTITUCIONAL — EDULINK SCHOOL', pageWidth / 2, 23, { align: 'center' });

  // 2. Circular Metadata Banner
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(14, 34, pageWidth - 28, 26, 2, 2, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(14, 34, pageWidth - 28, 26, 2, 2, 'S');

  doc.setTextColor(11, 28, 48);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(circularNumber.toUpperCase(), 18, 41);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`Dependencia emisora: ${author}`, 18, 48);
  doc.text(`Destinatarios: ${target}`, 18, 54);

  doc.setFont('helvetica', 'bold');
  doc.text(`Fecha: ${date}`, pageWidth - 18, 48, { align: 'right' });
  doc.text('Vigencia: Año Lectivo 2026', pageWidth - 18, 54, { align: 'right' });

  // 3. Circular Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(0, 40, 142);
  const titleLines = doc.splitTextToSize(title, pageWidth - 28);
  doc.text(titleLines, 14, 70);

  // Divider line
  const titleEndY = 70 + (titleLines.length * 6);
  doc.setDrawColor(217, 119, 6); // Amber accent
  doc.setLineWidth(0.8);
  doc.line(14, titleEndY, pageWidth - 14, titleEndY);

  // 4. Content Body
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(30, 41, 59);

  const cleanContent = content.trim() || 'Por medio de la presente comunicación se informa a la comunidad educativa sobre las disposiciones vigentes para la jornada escolar y el debido cumplimiento de los acuerdos institucionales.';
  const contentLines = doc.splitTextToSize(cleanContent, pageWidth - 28);
  doc.text(contentLines, 14, titleEndY + 8, { lineHeightFactor: 1.4 });

  // 5. Sign-off & Seal Block
  const signY = Math.min(titleEndY + 8 + (contentLines.length * 5.5) + 20, pageHeight - 45);

  doc.setDrawColor(148, 163, 184);
  doc.setLineWidth(0.5);
  doc.line(14, signY, 80, signY);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(11, 28, 48);
  doc.text(author, 14, signY + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text('Comité de Convivencia & Dirección Escolar', 14, signY + 10);
  doc.text('Institución Educativa Vallejuelos • Medellín', 14, signY + 14);

  // Institutional Verification Stamp
  doc.setFillColor(238, 244, 255);
  doc.roundedRect(pageWidth - 75, signY - 8, 61, 24, 2, 2, 'F');
  doc.setDrawColor(0, 40, 142);
  doc.roundedRect(pageWidth - 75, signY - 8, 61, 24, 2, 2, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(0, 40, 142);
  doc.text('REGISTRO OFICIAL DIGITAL', pageWidth - 44.5, signY - 2, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(51, 65, 85);
  doc.text('I.E. VALLEJUELOS', pageWidth - 44.5, signY + 3, { align: 'center' });
  doc.text('Edulink School Platform', pageWidth - 44.5, signY + 8, { align: 'center' });
  doc.text('Medellín, Antioquia', pageWidth - 44.5, signY + 13, { align: 'center' });

  // 6. Footer
  doc.setDrawColor(226, 232, 240);
  doc.line(14, pageHeight - 12, pageWidth - 14, pageHeight - 12);
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text(
    'Carrera 108 # 63-12, Vallejuelos, Medellín • Jornada Mañana: 6:15 AM - 12:15 PM • https://vallejuelos.edu.co',
    pageWidth / 2,
    pageHeight - 7,
    { align: 'center' }
  );

  // File download
  const safeTitle = title.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 30);
  doc.save(`Circular_${safeTitle || 'Institucional'}_2026.pdf`);
}

/**
 * Generates and downloads the official Manual de Convivencia PDF for I.E. Vallejuelos.
 */
export function downloadManualDeConvivenciaPDF(): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Header
  doc.setFillColor(0, 40, 142);
  doc.rect(0, 0, pageWidth, 28, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('INSTITUCIÓN EDUCATIVA VALLEJUELOS', pageWidth / 2, 11, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('Secretaría de Educación de Medellín • DANE: 105001025841 • NIT: 900.124.582-1', pageWidth / 2, 17, { align: 'center' });
  doc.setFont('helvetica', 'bold');
  doc.text('MANUAL DE CONVIVENCIA ESCOLAR — MARCO DE LA LEY 1620 DE 2013', pageWidth / 2, 23, { align: 'center' });

  let y = 38;

  // Title Box
  doc.setFillColor(241, 245, 249);
  doc.rect(14, y, pageWidth - 28, 18, 'F');
  doc.setTextColor(0, 40, 142);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('PACTO DE CONVIVENCIA Y CORRESPONSABILIDAD ESCOLAR', pageWidth / 2, y + 8, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text('Aprobado por el Consejo Directivo y el Comité Escolar de Convivencia • Vigencia 2026', pageWidth / 2, y + 14, { align: 'center' });

  y += 26;

  // Section 1: Derechos
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(0, 40, 142);
  doc.text('1. DERECHOS FUNDAMENTALES DE LOS ESTUDIANTES', 14, y);
  y += 6;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(30, 41, 59);
  const derechos = [
    '• Recibir una educación integral con calidad, inclusión y respeto por los derechos humanos.',
    '• Ser tratado con dignidad y protegido contra cualquier forma de acoso escolar, discriminación o maltrato.',
    '• Conocer oportunamente los criterios, fechas y resultados de sus evaluaciones académicas y convivenciales.',
    '• Disfrutar del debido proceso y la presunción de inocencia en todas las situaciones de seguimiento escolar.',
    '• Participar activamente en los órganos de gobierno escolar (Personero, Representante, Comité de Convivencia).'
  ];
  derechos.forEach(d => {
    doc.text(d, 16, y);
    y += 5;
  });

  y += 3;

  // Section 2: Deberes
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(0, 40, 142);
  doc.text('2. DEBERES Y COMPROMISOS INSTITUCIONALES', 14, y);
  y += 6;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(30, 41, 59);
  const deberes = [
    '• Cumplir puntualmente con la jornada escolar oficial de 6:15 AM a 12:15 PM de lunes a viernes.',
    '• Portar con decoro el uniforme institucional y cuidar las instalaciones, aulas y laboratorios de la institución.',
    '• Tratar con respeto y consideración a directivos, docentes, compañeros, personal administrativo y de servicios.',
    '• Mantener un rendimiento académico responsable y participar en las actividades curriculares programadas.',
    '• Resolver las diferencias mediante el diálogo, la mediación y los mecanismos de concertación pacífica.'
  ];
  deberes.forEach(deb => {
    doc.text(deb, 16, y);
    y += 5;
  });

  y += 3;

  // Section 3: Tipificación de situaciones
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(0, 40, 142);
  doc.text('3. CLASIFICACIÓN DE SITUACIONES (LEY 1620 DE 2013)', 14, y);
  y += 6;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(11, 28, 48);
  doc.text('• Situaciones Tipo I (Leves):', 16, y);
  doc.setFont('helvetica', 'normal');
  doc.text('Conflictos manejados inadecuadamente o faltas leves que no generan daño al cuerpo o la salud. Protocolo: Diálogo formativo y compromiso restaurativo.', 56, y, { maxWidth: pageWidth - 72 });
  y += 9;

  doc.setFont('helvetica', 'bold');
  doc.text('• Situaciones Tipo II (Graves):', 16, y);
  doc.setFont('helvetica', 'normal');
  doc.text('Acoso escolar (bullying), ciberacoso o agresiones repetidas sin constituir delito. Protocolo: Remisión al Comité de Convivencia, medidas de protección y restablecimiento.', 58, y, { maxWidth: pageWidth - 74 });
  y += 9;

  doc.setFont('helvetica', 'bold');
  doc.text('• Situaciones Tipo III (Gravísimas):', 16, y);
  doc.setFont('helvetica', 'normal');
  doc.text('Hechos que configuran presuntos delitos contra la libertad, integridad o formación sexual. Protocolo: Activación inmediata de la Ruta Externa (ICBF, Policía de Infancia y Fiscalía).', 62, y, { maxWidth: pageWidth - 78 });
  y += 12;

  // Section 4: Comité de Convivencia
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(0, 40, 142);
  doc.text('4. COMITÉ ESCOLAR DE CONVIVENCIA', 14, y);
  y += 6;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(30, 41, 59);
  const comiteText = doc.splitTextToSize(
    'Órgano consultor y mediador encargado de liderar las acciones de promoción, prevención, atención y seguimiento a la convivencia escolar. Está integrado por el Rector, el Coordinador de Convivencia, docentes de primaria y secundaria, el personero estudiantil, el representante de los estudiantes, la psicóloga institucional y un representante de los acudientes.',
    pageWidth - 28
  );
  doc.text(comiteText, 14, y);

  // Footer
  doc.setDrawColor(226, 232, 240);
  doc.line(14, pageHeight - 12, pageWidth - 14, pageHeight - 12);
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text(
    'Institución Educativa Vallejuelos • Medellín • Documento Oficial • Descargado de Edulink School Platform',
    pageWidth / 2,
    pageHeight - 7,
    { align: 'center' }
  );

  doc.save('Manual_de_Convivencia_IE_Vallejuelos.pdf');
}
