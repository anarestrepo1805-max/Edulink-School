import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc
} from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface OfficialCircularItem {
  id: string;
  circularNumber: string;
  title: string;
  titleEn?: string;
  target: string;
  targetEn?: string;
  date: string;
  dateEn?: string;
  author: string;
  authorEn?: string;
  content: string;
  hasAttachment?: boolean;
  status: 'published' | 'draft';
  createdAt?: string;
}

export const INITIAL_OFFICIAL_CIRCULARS: OfficialCircularItem[] = [
  {
    id: 'c1',
    circularNumber: 'Circular No. 08',
    title: 'Circular Oficial No. 08: Cronograma de Evaluaciones del Primer Período',
    titleEn: 'Official Notice No. 08: First Term Evaluation Schedule',
    target: 'Toda la Comunidad Educativa',
    targetEn: 'Entire Educational Community',
    date: '14 de Septiembre, 2026',
    dateEn: 'September 14, 2026',
    author: 'Coordinación Académica & Convivencia',
    authorEn: 'Academic & Coexistence Coordination',
    content: 'Se informa a estudiantes, acudientes y docentes que las evaluaciones formativas y sumativas correspondientes al Primer Período Académico 2026 se realizarán de acuerdo con el calendario institucional establecido. Solicitamos a los acudientes acompañar el proceso de estudio en casa y verificar el cumplimiento de tareas y talleres en Edulink School.',
    hasAttachment: true,
    status: 'published'
  },
  {
    id: 'c2',
    circularNumber: 'Circular No. 07',
    title: 'Disposición Institucional: Cumplimiento de la Jornada Escolar (6:15 AM - 12:15 PM)',
    titleEn: 'Institutional Directive: School Schedule Compliance (6:15 AM - 12:15 PM)',
    target: 'Estudiantes y Acudientes',
    targetEn: 'Students and Guardians',
    date: '10 de Septiembre, 2026',
    dateEn: 'September 10, 2026',
    author: 'Rectoría & Coordinación de Convivencia',
    authorEn: 'Principal Office & Coexistence Coordination',
    content: 'Recordamos a toda la comunidad educativa de la Institución Educativa Vallejuelos la obligatoriedad y puntualidad en el cumplimiento de la jornada escolar única matinal, la cual inicia puntualmente a las 6:15 a. m. y finaliza a las 12:15 p. m. Las puertas de la institución se abrirán a las 6:00 a. m. Reiteramos la importancia del uniforme institucional y los canales oficiales de justificación de inasistencias.',
    hasAttachment: true,
    status: 'published'
  }
];

/**
 * Loads official circulars from Firestore `institutional_circulars`.
 * If empty, seeds the initial baseline circulars (without the old Consejo Directivo notice).
 */
export async function fetchOfficialCirculars(): Promise<OfficialCircularItem[]> {
  try {
    const colRef = collection(db, 'institutional_circulars');
    const snap = await getDocs(colRef);

    if (snap.empty) {
      // Seed default baseline
      for (const c of INITIAL_OFFICIAL_CIRCULARS) {
        await setDoc(doc(colRef, c.id), c);
      }
      return INITIAL_OFFICIAL_CIRCULARS;
    }

    const items: OfficialCircularItem[] = [];
    snap.forEach((d) => {
      const data = d.data() as OfficialCircularItem;
      // Filter out any obsolete 'Consejo Directivo' notice
      if (!data.title.includes('Consejo Directivo')) {
        items.push({
          ...data,
          id: d.id
        });
      }
    });

    // If all circulars were filtered out or empty, fallback to baseline
    if (items.length === 0) {
      return INITIAL_OFFICIAL_CIRCULARS;
    }

    return items;
  } catch (error) {
    console.warn('Error reading circulars from Firestore, using baseline:', error);
    return INITIAL_OFFICIAL_CIRCULARS;
  }
}

/**
 * Saves or publishes a new circular in Firestore `institutional_circulars`.
 */
export async function saveOfficialCircular(circular: Omit<OfficialCircularItem, 'id'> & { id?: string }): Promise<OfficialCircularItem> {
  const colRef = collection(db, 'institutional_circulars');
  const docId = circular.id || `circ_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const docRef = doc(colRef, docId);

  const payload: OfficialCircularItem = {
    id: docId,
    circularNumber: circular.circularNumber?.trim() || 'Circular Oficial',
    title: circular.title.trim(),
    titleEn: circular.titleEn || circular.title.trim(),
    target: circular.target || 'Toda la Comunidad Educativa',
    targetEn: circular.targetEn || circular.target,
    date: circular.date || new Date().toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' }),
    dateEn: circular.dateEn || new Date().toLocaleDateString('en-US', { month: 'long', day: '2-digit', year: 'numeric' }),
    author: circular.author || 'Coordinación de Convivencia',
    authorEn: circular.authorEn || 'Coexistence Coordination',
    content: circular.content.trim(),
    hasAttachment: Boolean(circular.hasAttachment),
    status: circular.status || 'published',
    createdAt: circular.createdAt || new Date().toISOString()
  };

  await setDoc(docRef, payload, { merge: true });
  return payload;
}

/**
 * Deletes a circular from Firestore.
 */
export async function deleteOfficialCircular(circularId: string): Promise<void> {
  if (!circularId) return;
  const docRef = doc(db, 'institutional_circulars', circularId);
  await deleteDoc(docRef);
}
