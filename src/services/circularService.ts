import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  query,
  orderBy
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import jsPDF from 'jspdf';

export interface OfficialCircular {
  id: string;
  title: string;
  content: string;
  target: string;
  date: string;
  author: string;
  authorRole: string;
  createdAt: string;
  urgency?: 'normal' | 'alta' | 'urgente';
}

export interface CommitteeMember {
  id: string;
  seatNumber: number;
  roleTitle: string;
  name: string;
  documentId: string;
  email: string;
  phone: string;
  isMandatory: boolean;
  notes?: string;
}

export interface ManualSection {
  chapter: string;
  title: string;
  articles: { code: string; title: string; text: string }[];
}

export const OFFICIAL_DEFAULT_CIRCULARS: OfficialCircular[] = [
  {
    id: 'circ_008',
    title: 'Circular Oficial No. 08: Cronograma de Evaluaciones del Primer Período',
    content:
      'Se informa a toda la comunidad educativa que a partir del lunes 22 de septiembre se dará inicio a la semana de evaluaciones integrales del primer período académico. Los docentes han socializado las matrices de valoración en cada grado. Solicitamos a los acudientes acompañar el repaso en casa y garantizar la puntualidad al inicio de la jornada escolar (6:15 AM).',
    target: 'Toda la Comunidad Educativa',
    date: '14 de Septiembre, 2026',
    author: 'Ana Restrepo',
    authorRole: 'Coordinadora de Convivencia',
    createdAt: new Date('2026-09-14T08:00:00Z').toISOString(),
    urgency: 'normal'
  },
  {
    id: 'circ_009',
    title: 'Disposición Institucional: Cumplimiento de la Jornada Escolar (6:15 AM - 12:15 PM)',
    content:
      'Recordamos que el horario oficial institucional de la Institución Educativa Vallejuelos rige de 6:15 AM a 12:15 PM para todos los grados de secundaria (6°1 a 11°2). Las puertas institucionales se abren a las 6:00 AM y se cierran puntualmente a las 6:15 AM. Todo retardo injustificado será registrado en el observador escolar conforme a los acuerdos del Manual de Convivencia.',
    target: 'Estudiantes y Acudientes',
    date: '10 de Septiembre, 2026',
    author: 'Coordinación de Convivencia & Rectoría',
    authorRole: 'Coordinación de Convivencia',
    createdAt: new Date('2026-09-10T08:00:00Z').toISOString(),
    urgency: 'alta'
  },
  {
    id: 'circ_010',
    title: 'Directiva de Convivencia: Ruta de Atención Integral y Prevención del Acoso Escolar',
    content:
      'En cumplimiento estricto de la Ley 1620 de 2013 y el Decreto 1965, la Coordinación de Convivencia convoca a los directores de grupo y familias a reforzar las pautas de respeto mutuo, uso responsable de dispositivos tecnológicos y prevención de conductas contrarias a la armonía escolar. Las situaciones Tipo I, II y III cuentan con atención inmediata y acompañamiento del Comité Escolar de Convivencia.',
    target: 'Docentes, Padres y Estudiantes',
    date: '05 de Septiembre, 2026',
    author: 'Ana Restrepo',
    authorRole: 'Coordinadora de Convivencia',
    createdAt: new Date('2026-09-05T08:00:00Z').toISOString(),
    urgency: 'alta'
  }
];

export const OFFICIAL_COMMITTEE_SEATS: CommitteeMember[] = [
  {
    id: 'seat_1',
    seatNumber: 1,
    roleTitle: 'Docente representante de primaria',
    name: 'Martha Gómez',
    documentId: '43928104',
    email: 'martha.gomez@edulink.edu.co',
    phone: '312 458 9012',
    isMandatory: true,
    notes: 'Elegida en asamblea docente para el ciclo básica primaria.'
  },
  {
    id: 'seat_2',
    seatNumber: 2,
    roleTitle: 'Docente representante de secundaria',
    name: 'Andrés Henao',
    documentId: '71829304',
    email: 'andres.henao@edulink.edu.co',
    phone: '315 789 2341',
    isMandatory: true,
    notes: 'Representante docente para los grados 6° a 11°.'
  },
  {
    id: 'seat_3',
    seatNumber: 3,
    roleTitle: 'Representante de los estudiantes',
    name: 'Miguel Ángel Jiménez',
    documentId: '1092837465',
    email: 'miguel.jimenez@edulink.edu.co',
    phone: '318 901 2345',
    isMandatory: true,
    notes: 'Presidente del Consejo de Estudiantes (Grado 11°2).'
  },
  {
    id: 'seat_4',
    seatNumber: 4,
    roleTitle: 'Coordinador(a) de convivencia',
    name: 'Ana Restrepo',
    documentId: '43589120',
    email: 'anarestrepo1805@gmail.com',
    phone: '314 678 9012',
    isMandatory: true,
    notes: 'Lidera la Secretaría Técnica y la Ruta de Atención Integral.'
  },
  {
    id: 'seat_5',
    seatNumber: 5,
    roleTitle: 'Rector(a) de la institución',
    name: 'Dr. Gustavo Adolfo Valencia',
    documentId: '70192834',
    email: 'rectoria@edulink.edu.co',
    phone: '310 345 6789',
    isMandatory: true,
    notes: 'Presidente oficial del Comité Escolar de Convivencia.'
  },
  {
    id: 'seat_6',
    seatNumber: 6,
    roleTitle: 'Psicóloga de la institución',
    name: 'Dra. Claudia Marcela Ríos',
    documentId: '52839102',
    email: 'psicologia@edulink.edu.co',
    phone: '316 234 5678',
    isMandatory: true,
    notes: 'Orientación Escolar y apoyo psicosocial a casos tipificados.'
  },
  {
    id: 'seat_7',
    seatNumber: 7,
    roleTitle: 'Personero estudiantil',
    name: 'Mateo Cárdenas Ospina',
    documentId: '1019283746',
    email: 'mateo.cardenas@edulink.edu.co',
    phone: '317 890 1234',
    isMandatory: true,
    notes: 'Promotor de los deberes y derechos de la comunidad estudiantil.'
  },
  {
    id: 'seat_8',
    seatNumber: 8,
    roleTitle: 'Acudiente o padre de familia',
    name: 'Elena Gómez Jiménez',
    documentId: '43890123',
    email: 'elena.gomez@gmail.com',
    phone: '311 234 5678',
    isMandatory: true,
    notes: 'Delegada del Consejo de Padres de Familia.'
  }
];

export const MANUAL_DE_CONVIVENCIA_DATA: ManualSection[] = [
  {
    chapter: 'Capítulo I',
    title: 'Marco Legal, Filosofía y Principios Orientadores',
    articles: [
      {
        code: 'Art. 1',
        title: 'Fundamento Constitucional y Legal',
        text: 'El presente Manual de Convivencia se fundamenta en la Constitución Política de Colombia, la Ley 115 de 1994 (Ley General de Educación), la Ley 1098 de 2006 (Código de la Infancia y la Adolescencia), la Ley 1620 de 2013 y el Decreto 1965 de 2013 que reglamenta el Sistema Nacional de Convivencia Escolar.'
      },
      {
        code: 'Art. 2',
        title: 'Principios de Convivencia y Dignidad',
        text: 'La I.E. Vallejuelos propicia un ambiente de equidad, no discriminación, resolución pacífica de conflictos, preservación del debido proceso y corresponsabilidad entre familia, escuela y Estado.'
      }
    ]
  },
  {
    chapter: 'Capítulo II',
    title: 'Derechos y Deberes de los Estudiantes',
    articles: [
      {
        code: 'Art. 3',
        title: 'Derechos Fundamentales del Estudiante',
        text: 'Recibir una educación integral de calidad, ser escuchado en sus descargos, disfrutar de un trato respetuoso y digno, participar democráticamente y contar con las garantías de evaluación continua.'
      },
      {
        code: 'Art. 4',
        title: 'Deberes Escolares y Ciudadanos',
        text: 'Cumplir puntualmente la jornada escolar oficial (6:15 AM - 12:15 PM), portar adecuadamente el uniforme institucional, cuidar los bienes del colegio y tratar con consideración a todos los miembros de la comunidad.'
      }
    ]
  },
  {
    chapter: 'Capítulo III',
    title: 'Derechos y Compromisos de las Familias y Acudientes',
    articles: [
      {
        code: 'Art. 5',
        title: 'Corresponsabilidad Familiar',
        text: 'Los acudientes son los primeros educadores y deben responder activamente a las citaciones institucionales, acompañar los procesos pedagógicos y promover el respeto a los directivos y docentes.'
      },
      {
        code: 'Art. 6',
        title: 'Canales de Comunicación Oficial',
        text: 'Las familias tienen derecho a ser informadas oportunamente de las novedades disciplinarias y académicas a través de la plataforma institucional EduLink y entrevistas concertadas.'
      }
    ]
  },
  {
    chapter: 'Capítulo IV',
    title: 'Clasificación de Situaciones y Faltas (Ley 1620 de 2013)',
    articles: [
      {
        code: 'Art. 7',
        title: 'Situaciones Tipo I (Leves o Esporádicas)',
        text: 'Conflictos manejados inadecuadamente o situaciones esporádicas que inciden negativamente en el clima escolar, sin generar daño al cuerpo ni a la salud (ej. retardos, desatención a normas de clase, uso indebido de celular).'
      },
      {
        code: 'Art. 8',
        title: 'Situaciones Tipo II (Graves)',
        text: 'Situaciones de agresión escolar, acoso escolar (bullying) o ciberacoso que no revistan las características de un delito y que causen daño al cuerpo o a la salud mental y física sin secuelas incapacitantes.'
      },
      {
        code: 'Art. 9',
        title: 'Situaciones Tipo III (Gravísimas / Delitos)',
        text: 'Situaciones que sean constitutivas de presuntos delitos contra la libertad, integridad y formación sexual, porte de armas, agresiones severas o tráfico de sustancias psicoactivas, que ameritan remisión inmediata a autoridades competentes.'
      }
    ]
  },
  {
    chapter: 'Capítulo V',
    title: 'Debido Proceso y Ruta de Atención Integral',
    articles: [
      {
        code: 'Art. 10',
        title: 'Garantías Procesales',
        text: 'Todo estudiante investigado tiene derecho a la presunción de inocencia, a conocer los hechos imputados, a presentar descargos y pruebas en compañía de su acudiente y a la doble instancia ante Rectoría.'
      },
      {
        code: 'Art. 11',
        title: 'Protocolo de Conciliación Pedagógica',
        text: 'La Coordinación de Convivencia prioriza acciones reparadoras y acuerdos pedagógicos que restauren la armonía institucional y fortalezcan las competencias ciudadanas.'
      }
    ]
  }
];

export const INSTITUTIONAL_IDENTITY = {
  institution: 'Institución Educativa Vallejuelos',
  location: 'Medellín, Antioquia — Comuna 7 Robledo',
  dane: '105001026040',
  nit: '900.123.456-7',
  resolution: 'Resolución Departamental No. 16142',
  motto: '«Ciencia, Virtud y Convivencia para la Transformación Social»',
  mission:
    'La Institución Educativa Vallejuelos es una institución oficial de Medellín comprometida con la formación integral de niños, niñas y jóvenes desde un enfoque pedagógico humano, crítico y reflexivo. Desarrollamos competencias académicas, ciudadanas y tecnológicas que permiten a nuestros egresados liderar proyectos de vida éticos, incluyentes y orientados al bienestar de su entorno comunitario.',
  vision:
    'Para el año 2030, la Institución Educativa Vallejuelos será reconocida a nivel local y nacional como una comunidad educativa de excelencia, líder en innovación pedagógica, cultura de paz, resolución pacífica de conflictos y articulación con la educación superior y el sector productivo.',
  values: [
    {
      name: 'Respeto',
      desc: 'Reconocimiento y valoración de la dignidad inalienable de cada persona y de la diversidad cultural y social.'
    },
    {
      name: 'Responsabilidad',
      desc: 'Cumplimiento consciente y comprometido de los deberes académicos, cívicos y ambientales.'
    },
    {
      name: 'Honestidad',
      desc: 'Transparencia, verdad y coherencia ética en todas las actuaciones individuales y colectivas.'
    },
    {
      name: 'Solidaridad',
      desc: 'Disposición activa y empática hacia el apoyo mutuo y la equidad social en nuestra comunidad.'
    },
    {
      name: 'Sentido de Pertenencia',
      desc: 'Amor, cuidado y orgullo hacia nuestra institución, sus símbolos y su entorno físico y social.'
    },
    {
      name: 'Tolerancia y Paz',
      desc: 'Convivencia armónica en la diferencia, diálogo constructivo y rechazo absoluto a toda forma de violencia.'
    }
  ]
};

// ==========================================
// FIRESTORE OPERATIONS: CIRCULARS
// ==========================================

export async function fetchCirculars(): Promise<OfficialCircular[]> {
  try {
    const colRef = collection(db, 'circulars');
    const snapshot = await getDocs(colRef);

    if (snapshot.empty) {
      // Seed initial default circulars to Firestore for persistence
      for (const circ of OFFICIAL_DEFAULT_CIRCULARS) {
        await setDoc(doc(db, 'circulars', circ.id), circ);
      }
      return OFFICIAL_DEFAULT_CIRCULARS;
    }

    const list: OfficialCircular[] = [];
    snapshot.forEach((snap) => {
      const data = snap.data() as OfficialCircular;
      list.push({ ...data, id: snap.id });
    });

    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return list;
  } catch (err) {
    console.warn('Error fetching circulars from Firestore:', err);
    return OFFICIAL_DEFAULT_CIRCULARS;
  }
}

export async function saveCircular(
  data: Omit<OfficialCircular, 'id' | 'date' | 'createdAt'> & { id?: string; date?: string; createdAt?: string }
): Promise<OfficialCircular> {
  if (!data.title?.trim()) {
    throw new Error('El título de la circular es obligatorio.');
  }
  if (!data.content?.trim()) {
    throw new Error('El contenido de la circular no puede estar vacío.');
  }
  if (!data.target?.trim()) {
    throw new Error('Debe especificar los destinatarios de la circular.');
  }

  const id = data.id || `circ_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const payload: OfficialCircular = {
    id,
    title: data.title.trim(),
    content: data.content.trim(),
    target: data.target.trim(),
    date: data.date || new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' }),
    author: data.author?.trim() || 'Coordinación de Convivencia',
    authorRole: data.authorRole?.trim() || 'Coordinador(a) de Convivencia',
    createdAt: data.createdAt || new Date().toISOString(),
    urgency: data.urgency || 'normal'
  };

  const docRef = doc(db, 'circulars', id);
  await setDoc(docRef, payload, { merge: true });
  return payload;
}

export async function deleteCircular(circularId: string): Promise<void> {
  if (!circularId) return;
  const docRef = doc(db, 'circulars', circularId);
  await deleteDoc(docRef);
}

// ==========================================
// FIRESTORE OPERATIONS: COEXISTENCE COMMITTEE
// ==========================================

export async function fetchCommitteeMembers(): Promise<CommitteeMember[]> {
  try {
    const colRef = collection(db, 'coexistence_committee');
    const snapshot = await getDocs(colRef);

    if (snapshot.empty) {
      // Seed default 8 official seats
      for (const seat of OFFICIAL_COMMITTEE_SEATS) {
        await setDoc(doc(db, 'coexistence_committee', seat.id), seat);
      }
      return OFFICIAL_COMMITTEE_SEATS;
    }

    const list: CommitteeMember[] = [];
    snapshot.forEach((snap) => {
      const data = snap.data() as CommitteeMember;
      list.push({ ...data, id: snap.id });
    });

    list.sort((a, b) => a.seatNumber - b.seatNumber);
    return list;
  } catch (err) {
    console.warn('Error fetching committee members:', err);
    return OFFICIAL_COMMITTEE_SEATS;
  }
}

export async function saveCommitteeMember(member: CommitteeMember): Promise<void> {
  if (!member.name?.trim()) {
    throw new Error('El nombre del integrante es obligatorio.');
  }
  if (!member.roleTitle?.trim()) {
    throw new Error('El cargo o representación en el comité es obligatorio.');
  }

  const id = member.id || `seat_${Date.now()}`;
  const payload: CommitteeMember = {
    ...member,
    id,
    name: member.name.trim(),
    roleTitle: member.roleTitle.trim(),
    documentId: (member.documentId || '').trim(),
    email: (member.email || '').trim(),
    phone: (member.phone || '').trim()
  };

  await setDoc(doc(db, 'coexistence_committee', id), payload, { merge: true });
}

export async function deleteCommitteeMember(memberId: string): Promise<void> {
  if (!memberId) return;
  await deleteDoc(doc(db, 'coexistence_committee', memberId));
}

// ==========================================
// PDF GENERATION: CIRCULAR OFICIAL
// ==========================================

export function generateCircularPdf(circular: OfficialCircular): void {
  const doc = new jsPDF({
    unit: 'mm',
    format: 'a4',
    orientation: 'portrait'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;

  // Header background banner
  doc.setFillColor(0, 40, 142); // Institutional Blue #00288e
  doc.rect(0, 0, pageWidth, 28, 'F');

  // Institution title in header
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('INSTITUCIÓN EDUCATIVA VALLEJUELOS', pageWidth / 2, 12, { align: 'center' });

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(
    'Alcaldía de Medellín • Secretaría de Educación • DANE: 105001026040 • NIT: 900.123.456-7',
    pageWidth / 2,
    18,
    { align: 'center' }
  );
  doc.text(
    'Resolución Departamental No. 16142 • Jornada Mañana: 6:15 AM - 12:15 PM',
    pageWidth / 2,
    23,
    { align: 'center' }
  );

  // Subheader badge
  doc.setFillColor(240, 244, 255);
  doc.setDrawColor(0, 40, 142);
  doc.roundedRect(margin, 35, contentWidth, 14, 2, 2, 'FD');

  doc.setTextColor(0, 40, 142);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('COMUNICADO INSTITUCIONAL OFICIAL', margin + 6, 44);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`ID Radicado: ${circular.id.toUpperCase()}`, pageWidth - margin - 6, 44, { align: 'right' });

  // Circular Title
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  const titleLines = doc.splitTextToSize(circular.title, contentWidth);
  doc.text(titleLines, margin, 58);

  const titleHeight = titleLines.length * 6;
  let currentY = 58 + titleHeight + 4;

  // Metadata block
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.rect(margin, currentY, contentWidth, 22, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);

  doc.text('Fecha de emisión:', margin + 4, currentY + 6);
  doc.text('Destinatarios:', margin + 4, currentY + 12);
  doc.text('Emitido por:', margin + 4, currentY + 18);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text(circular.date, margin + 35, currentY + 6);
  doc.text(circular.target, margin + 35, currentY + 12);
  doc.text(`${circular.author} (${circular.authorRole})`, margin + 35, currentY + 18);

  currentY += 30;

  // Body content
  doc.setTextColor(30, 41, 59);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  const textLines = doc.splitTextToSize(circular.content, contentWidth);
  doc.text(textLines, margin, currentY, { lineHeightFactor: 1.4 });

  // Signature block
  const sigY = pageHeight - 55;
  doc.setDrawColor(148, 163, 184);
  doc.line(margin + 20, sigY, margin + 80, sigY);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text(circular.author, margin + 50, sigY + 5, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text(circular.authorRole, margin + 50, sigY + 9, { align: 'center' });
  doc.text('Institución Educativa Vallejuelos', margin + 50, sigY + 13, { align: 'center' });

  // Institutional seal stamp
  doc.setDrawColor(0, 40, 142);
  doc.setFillColor(240, 244, 255);
  doc.roundedRect(pageWidth - margin - 60, sigY - 10, 55, 25, 2, 2, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(0, 40, 142);
  doc.text('SECRETARÍA Y CONVIVENCIA', pageWidth - margin - 32.5, sigY - 3, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.text('DOCUMENTO OFICIAL VALIDADOR', pageWidth - margin - 32.5, sigY + 2, { align: 'center' });
  doc.text('I.E. VALLEJUELOS • MEDELLÍN', pageWidth - margin - 32.5, sigY + 7, { align: 'center' });
  doc.text('VERIFICACIÓN ELECTRÓNICA VIGENTE', pageWidth - margin - 32.5, sigY + 11, { align: 'center' });

  // Footer bar
  doc.setFillColor(241, 245, 249);
  doc.rect(0, pageHeight - 12, pageWidth, 12, 'F');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text(
    'Institución Educativa Vallejuelos • Medellín, Colombia • Sistema EduLink Convivencia Escolar',
    pageWidth / 2,
    pageHeight - 5,
    { align: 'center' }
  );

  doc.save(`Circular_Oficial_${circular.id}.pdf`);
}

// ==========================================
// PDF GENERATION: MANUAL DE CONVIVENCIA
// ==========================================

export function generateManualConvivenciaPdf(): void {
  const doc = new jsPDF({
    unit: 'mm',
    format: 'a4',
    orientation: 'portrait'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;

  // Cover Page
  doc.setFillColor(0, 40, 142);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.text('INSTITUCIÓN EDUCATIVA', pageWidth / 2, 70, { align: 'center' });
  doc.setFontSize(26);
  doc.text('VALLEJUELOS', pageWidth / 2, 82, { align: 'center' });

  doc.setDrawColor(255, 255, 255);
  doc.setLineWidth(1);
  doc.line(margin + 20, 92, pageWidth - margin - 20, 92);

  doc.setFontSize(16);
  doc.text('MANUAL DE CONVIVENCIA ESCOLAR', pageWidth / 2, 106, { align: 'center' });

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text('Pacto de Convivencia, Derechos, Deberes y Ruta de Atención Integral', pageWidth / 2, 114, { align: 'center' });
  doc.text('Ley 1620 de 2013 • Decreto 1965 de 2013 • Ley 1098 de 2006', pageWidth / 2, 120, { align: 'center' });

  doc.setFontSize(9);
  doc.text('Medellín, Antioquia — Colombia', pageWidth / 2, pageHeight - 35, { align: 'center' });
  doc.text('Aprobado por el Consejo Directivo y Comité de Convivencia • Vigencia 2026', pageWidth / 2, pageHeight - 28, { align: 'center' });

  // Content Pages
  doc.addPage();
  doc.setFillColor(0, 40, 142);
  doc.rect(0, 0, pageWidth, 20, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('MANUAL DE CONVIVENCIA — I.E. VALLEJUELOS', pageWidth / 2, 13, { align: 'center' });

  let y = 30;

  MANUAL_DE_CONVIVENCIA_DATA.forEach((section) => {
    if (y > pageHeight - 40) {
      doc.addPage();
      doc.setFillColor(0, 40, 142);
      doc.rect(0, 0, pageWidth, 20, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text('MANUAL DE CONVIVENCIA — I.E. VALLEJUELOS', pageWidth / 2, 13, { align: 'center' });
      y = 30;
    }

    doc.setFillColor(241, 245, 249);
    doc.rect(margin, y, contentWidth, 8, 'F');
    doc.setTextColor(0, 40, 142);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text(`${section.chapter}: ${section.title}`, margin + 3, y + 6);
    y += 12;

    section.articles.forEach((art) => {
      if (y > pageHeight - 35) {
        doc.addPage();
        doc.setFillColor(0, 40, 142);
        doc.rect(0, 0, pageWidth, 20, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.text('MANUAL DE CONVIVENCIA — I.E. VALLEJUELOS', pageWidth / 2, 13, { align: 'center' });
        y = 30;
      }

      doc.setTextColor(15, 23, 42);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.text(`${art.code}. ${art.title}`, margin, y);
      y += 5;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(51, 65, 85);
      const lines = doc.splitTextToSize(art.text, contentWidth);
      doc.text(lines, margin, y, { lineHeightFactor: 1.3 });
      y += lines.length * 4.5 + 4;
    });

    y += 4;
  });

  doc.save('Manual_de_Convivencia_IE_Vallejuelos.pdf');
}

// ==========================================
// PDF GENERATION: IDENTIDAD INSTITUCIONAL
// ==========================================

export function generateIdentidadInstitucionalPdf(): void {
  const doc = new jsPDF({
    unit: 'mm',
    format: 'a4',
    orientation: 'portrait'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;

  // Header banner
  doc.setFillColor(0, 40, 142);
  doc.rect(0, 0, pageWidth, 32, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text('INSTITUCIÓN EDUCATIVA VALLEJUELOS', pageWidth / 2, 14, { align: 'center' });

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('PROYECTO EDUCATIVO INSTITUCIONAL (PEI) • HORIZONTE Y PRINCIPIOS ÉTICOS', pageWidth / 2, 21, { align: 'center' });
  doc.text('Medellín, Antioquia • DANE: 105001026040 • NIT: 900.123.456-7', pageWidth / 2, 27, { align: 'center' });

  let y = 44;

  // Motto Box
  doc.setFillColor(240, 244, 255);
  doc.setDrawColor(0, 40, 142);
  doc.roundedRect(margin, y, contentWidth, 14, 2, 2, 'FD');
  doc.setFont('helvetica', 'bolditalic');
  doc.setFontSize(10.5);
  doc.setTextColor(0, 40, 142);
  doc.text(INSTITUTIONAL_IDENTITY.motto, pageWidth / 2, y + 9, { align: 'center' });
  y += 22;

  // Misión
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(0, 40, 142);
  doc.text('1. NUESTRA MISIÓN', margin, y);
  y += 6;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(30, 41, 59);
  const mLines = doc.splitTextToSize(INSTITUTIONAL_IDENTITY.mission, contentWidth);
  doc.text(mLines, margin, y, { lineHeightFactor: 1.4 });
  y += mLines.length * 5 + 8;

  // Visión
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(0, 40, 142);
  doc.text('2. NUESTRA VISIÓN (2030)', margin, y);
  y += 6;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(30, 41, 59);
  const vLines = doc.splitTextToSize(INSTITUTIONAL_IDENTITY.vision, contentWidth);
  doc.text(vLines, margin, y, { lineHeightFactor: 1.4 });
  y += vLines.length * 5 + 10;

  // Valores Institucionales
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(0, 40, 142);
  doc.text('3. VALORES INSTITUCIONALES FUNDAMENTALES', margin, y);
  y += 7;

  INSTITUTIONAL_IDENTITY.values.forEach((val) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(15, 23, 42);
    doc.text(`• ${val.name}:`, margin + 2, y);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(51, 65, 85);
    const valLines = doc.splitTextToSize(val.desc, contentWidth - 40);
    doc.text(valLines, margin + 35, y, { lineHeightFactor: 1.3 });
    y += valLines.length * 4.5 + 4;
  });

  // Footer bar
  doc.setFillColor(241, 245, 249);
  doc.rect(0, pageHeight - 14, pageWidth, 14, 'F');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text(
    'Institución Educativa Vallejuelos • Horizonte Institucional Oficial • EduLink School 2026',
    pageWidth / 2,
    pageHeight - 6,
    { align: 'center' }
  );

  doc.save('Identidad_Institucional_IE_Vallejuelos.pdf');
}
