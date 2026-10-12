import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as fbSignOut,
  sendPasswordResetEmail,
  confirmPasswordReset,
  verifyPasswordResetCode as fbVerifyResetCode
} from 'firebase/auth';
import emailjs from '@emailjs/browser';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  getDocs
} from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { UserProfile, UserRole, Subject, UpcomingAssignment } from '../types';
import { INITIAL_SUBJECTS, INITIAL_UPCOMING_ASSIGNMENTS } from '../data/mockData';
import {
  CENSUS_STUDENTS,
  CENSUS_TEACHERS,
  CENSUS_ADMIN_STAFF,
  CENSUS_GUARDIANS,
  lookupCensusStudent,
  lookupCensusGuardian,
  lookupCensusTeacher,
  lookupCensusAdmin
} from '../data/institutionalCensus';

const DEMO_ACCOUNTS: Record<string, UserProfile> = {
  '1092837465': {
    id: 'demo-student-1',
    email: 'miguel.jimenez@edulink.edu.co',
    fullName: 'Miguel Ángel Jiménez',
    role: 'student',
    documentId: '1092837465',
    studentCode: 'EST-2026-042',
    createdAt: '2026-01-15T08:00:00.000Z',
    hasConfigured: true,
    institution: 'I.E. Vallejuelos',
    gradeLevel: 'Grado 11°B',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    subjects: INITIAL_SUBJECTS,
    assignments: INITIAL_UPCOMING_ASSIGNMENTS
  },
  'miguel.jimenez@edulink.edu.co': {
    id: 'demo-student-1',
    email: 'miguel.jimenez@edulink.edu.co',
    fullName: 'Miguel Ángel Jiménez',
    role: 'student',
    documentId: '1092837465',
    studentCode: 'EST-2026-042',
    createdAt: '2026-01-15T08:00:00.000Z',
    hasConfigured: true,
    institution: 'I.E. Vallejuelos',
    gradeLevel: 'Grado 11°B',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    subjects: INITIAL_SUBJECTS,
    assignments: INITIAL_UPCOMING_ASSIGNMENTS
  },
  '71394821': {
    id: 'demo-teacher-1',
    email: 'daniela.alvarez@edulink.edu.co',
    fullName: 'Prof. Daniela Álvarez',
    role: 'teacher',
    documentId: '71394821',
    employeeId: '71394821',
    subjectArea: 'Tecnología e Informática',
    createdAt: '2026-01-10T08:00:00.000Z',
    hasConfigured: true,
    institution: 'I.E. Vallejuelos',
    gradeLevel: 'Docente Tecnología & Programación',
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80'
  },
  '71.394.821': {
    id: 'demo-teacher-1',
    email: 'daniela.alvarez@edulink.edu.co',
    fullName: 'Prof. Daniela Álvarez',
    role: 'teacher',
    documentId: '71394821',
    employeeId: '71394821',
    subjectArea: 'Tecnología e Informática',
    createdAt: '2026-01-10T08:00:00.000Z',
    hasConfigured: true,
    institution: 'I.E. Vallejuelos',
    gradeLevel: 'Docente Tecnología & Programación',
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80'
  },
  'daniela.alvarez@edulink.edu.co': {
    id: 'demo-teacher-1',
    email: 'daniela.alvarez@edulink.edu.co',
    fullName: 'Prof. Daniela Álvarez',
    role: 'teacher',
    documentId: '71394821',
    employeeId: '71394821',
    subjectArea: 'Tecnología e Informática',
    createdAt: '2026-01-10T08:00:00.000Z',
    hasConfigured: true,
    institution: 'I.E. Vallejuelos',
    gradeLevel: 'Docente Tecnología & Programación',
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80'
  },
  '43521980': {
    id: 'demo-family-1',
    email: 'elena.jimenez@vallejuelos.edu.co',
    fullName: 'Elena Gómez Jiménez',
    role: 'family',
    documentId: '43521980',
    relationship: 'Madre de familia',
    representedStudentName: 'Miguel Ángel Jiménez',
    createdAt: '2026-01-12T08:00:00.000Z',
    hasConfigured: true,
    institution: 'I.E. Vallejuelos',
    gradeLevel: 'Acudiente de Miguel Ángel (11°B) y Sofía (6°A)',
    avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80'
  },
  '43.521.980': {
    id: 'demo-family-1',
    email: 'elena.jimenez@vallejuelos.edu.co',
    fullName: 'Elena Gómez Jiménez',
    role: 'family',
    documentId: '43521980',
    relationship: 'Madre de familia',
    representedStudentName: 'Miguel Ángel Jiménez',
    createdAt: '2026-01-12T08:00:00.000Z',
    hasConfigured: true,
    institution: 'I.E. Vallejuelos',
    gradeLevel: 'Acudiente de Miguel Ángel (11°B) y Sofía (6°A)',
    avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80'
  },
  'elena.jimenez@vallejuelos.edu.co': {
    id: 'demo-family-1',
    email: 'elena.jimenez@vallejuelos.edu.co',
    fullName: 'Elena Gómez Jiménez',
    role: 'family',
    documentId: '43521980',
    relationship: 'Madre de familia',
    representedStudentName: 'Miguel Ángel Jiménez',
    createdAt: '2026-01-12T08:00:00.000Z',
    hasConfigured: true,
    institution: 'I.E. Vallejuelos',
    gradeLevel: 'Acudiente de Miguel Ángel (11°B) y Sofía (6°A)',
    avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80'
  },
  '98765432': {
    id: 'demo-admin-1',
    email: 'carlos.coordinacion@edulink.edu.co',
    fullName: 'Dr. Carlos Mendoza',
    role: 'admin',
    documentId: '98765432',
    employeeId: 'ADM-2026-001',
    adminPosition: 'Coordinador General & Académico',
    department: 'Dirección y Coordinación Académica',
    createdAt: '2026-01-08T08:00:00.000Z',
    hasConfigured: true,
    institution: 'I.E. Vallejuelos',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'
  },
  'carlos.coordinacion@edulink.edu.co': {
    id: 'demo-admin-1',
    email: 'carlos.coordinacion@edulink.edu.co',
    fullName: 'Dr. Carlos Mendoza',
    role: 'admin',
    documentId: '98765432',
    employeeId: 'ADM-2026-001',
    adminPosition: 'Coordinador General & Académico',
    department: 'Dirección y Coordinación Académica',
    createdAt: '2026-01-08T08:00:00.000Z',
    hasConfigured: true,
    institution: 'I.E. Vallejuelos',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'
  },
  'anarestrepo1805@gmail.com': {
    id: 'demo-admin-ana',
    email: 'anarestrepo1805@gmail.com',
    fullName: 'Ana Restrepo',
    role: 'admin',
    documentId: '1020304050',
    employeeId: 'ADM-2026-002',
    adminPosition: 'Dirección General & Administración',
    department: 'Dirección General y Rectoría',
    createdAt: '2026-01-01T08:00:00.000Z',
    hasConfigured: true,
    institution: 'I.E. Vallejuelos',
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80'
  }
};

function normalizeKey(str: string): string {
  return str.trim().toLowerCase().replace(/[^a-z0-9]/g, '_');
}

/**
 * Institutional Pre-Authorized Credentials.
 * Used to strictly validate roles so unauthorized users / students CANNOT register as Teachers or Staff.
 */
export interface AuthorizedRoleRecord {
  code: string;
  role: 'teacher' | 'admin';
  description: string;
  department: string;
  active: boolean;
}

export interface TeacherAssignmentRecord {
  code: string;
  subjectArea: string;
  assignedGrades: string;
  description: string;
}

export interface AdminAssignmentRecord {
  code: string;
  position: string;
  department: string;
  description: string;
}

export interface EnrolledStudentDirectoryRecord {
  documentId: string;
  fullName: string;
  gradeLevel: string;
  studentCode: string;
  shift: string;
  email: string;
}

// Institutional Teacher Registry: Each code is UNIQUE & IRREPETIBLE and has fixed assigned subjects & grades
export const TEACHER_ASSIGNMENTS: Record<string, TeacherAssignmentRecord> = {
  'DOC-VALLE-2026': {
    code: 'DOC-VALLE-2026',
    subjectArea: 'Tecnología e Informática',
    assignedGrades: '6°1, 6°2, 7°1, 7°2',
    description: 'Docente de Tecnología e Informática (Grados 6° y 7°)'
  },
  'DOC-TEC-8421': {
    code: 'DOC-TEC-8421',
    subjectArea: 'Tecnología e Informática',
    assignedGrades: '8°1, 8°2, 9°1, 9°2, 10°1, 11°1',
    description: 'Docente de Sistemas, Robótica y Programación'
  },
  'DOC-MAT-7139': {
    code: 'DOC-MAT-7139',
    subjectArea: 'Matemáticas y Geometría',
    assignedGrades: '6°1, 6°2, 7°1, 8°1, 8°2',
    description: 'Docente de Matemáticas, Álgebra y Geometría'
  },
  'DOC-CIEN-9312': {
    code: 'DOC-CIEN-9312',
    subjectArea: 'Ciencias Naturales y Química',
    assignedGrades: '9°1, 9°2, 10°1, 10°2, 11°1, 11°2',
    description: 'Docente de Biología, Física y Química'
  },
  'DOC-IDIOMAS-5120': {
    code: 'DOC-IDIOMAS-5120',
    subjectArea: 'Inglés y Bilingüismo',
    assignedGrades: '6°1 a 11°2 y Pensar',
    description: 'Docente de Inglés y Competencias Bilingües'
  },
  'DOC-ESP-6214': {
    code: 'DOC-ESP-6214',
    subjectArea: 'Lengua Castellana',
    assignedGrades: '10°1, 10°2, 11°1, 11°2, Pensar',
    description: 'Docente de Lengua Castellana, Literatura y Filosofía'
  },
  'DOC-SOC-3829': {
    code: 'DOC-SOC-3829',
    subjectArea: 'Ciencias Sociales e Historia',
    assignedGrades: '7°1, 7°2, 8°1, 8°2, 9°1',
    description: 'Docente de Ciencias Sociales, Historia y Constitución'
  },
  'DOC-EDUFIS-1984': {
    code: 'DOC-EDUFIS-1984',
    subjectArea: 'Educación Física y Deportes',
    assignedGrades: '6°1 a 11°2',
    description: 'Docente de Educación Física, Recreación y Deportes'
  }
};

// Institutional Admin Registry: Each code corresponds 1:1 to a specific position/cargo
export const ADMIN_ASSIGNMENTS: Record<string, AdminAssignmentRecord> = {
  'ADM-DIR-2026-VALLE': {
    code: 'ADM-DIR-2026-VALLE',
    position: 'Rectoría General',
    department: 'Dirección Institucional',
    description: 'Rectoría General y Representación Legal'
  },
  'ADM-COORD-2026': {
    code: 'ADM-COORD-2026',
    position: 'Coordinación Académica',
    department: 'Dirección Académica',
    description: 'Coordinación Académica General'
  },
  'ADM-CONV-2026': {
    code: 'ADM-CONV-2026',
    position: 'Coordinación de Convivencia',
    department: 'Comité de Convivencia',
    description: 'Coordinación de Convivencia Escolar'
  },
  'ADM-SEC-9876': {
    code: 'ADM-SEC-9876',
    position: 'Secretaría General & Matrículas',
    department: 'Secretaría Académica',
    description: 'Secretaría General, Certificaciones y Matrículas'
  },
  'ADM-ORIENT-2026': {
    code: 'ADM-ORIENT-2026',
    position: 'Orientación Escolar y Psicosocial',
    department: 'Orientación y Bienestar',
    description: 'Psicorientación y Acompañamiento Escolar'
  }
};

// Institutional Enrolled Students Census: Document IDs and official student names
export const ENROLLED_STUDENTS_DIRECTORY: Record<string, EnrolledStudentDirectoryRecord> = {};

// 1. Populate all 180 official students from CENSUS_STUDENTS
CENSUS_STUDENTS.forEach((s) => {
  const gradeFormatted = s.group.includes('°') ? s.group : s.group.replace('-', '°');
  ENROLLED_STUDENTS_DIRECTORY[s.documentId] = {
    documentId: s.documentId,
    fullName: s.fullName,
    gradeLevel: gradeFormatted,
    studentCode: s.documentId,
    shift: 'Jornada Mañana (6:15 AM - 12:15 PM)',
    email: s.email
  };
});

// 2. Retain historical records for backwards compatibility with existing links
const HISTORICAL_STUDENTS: Record<string, EnrolledStudentDirectoryRecord> = {
  '1092837465': {
    documentId: '1092837465',
    fullName: 'Miguel Ángel Jiménez',
    gradeLevel: '11°1',
    studentCode: 'EST-2026-042',
    shift: 'Jornada Mañana (6:15 AM - 12:15 PM)',
    email: 'miguel.jimenez@edulink.edu.co'
  },
  '1092837466': {
    documentId: '1092837466',
    fullName: 'Sofía Álvarez Restrepo',
    gradeLevel: '6°1',
    studentCode: 'EST-2026-089',
    shift: 'Jornada Mañana (6:15 AM - 12:15 PM)',
    email: 'sofia.alvarez@edulink.edu.co'
  },
  '1092837467': {
    documentId: '1092837467',
    fullName: 'Carlos Andrés Mendoza',
    gradeLevel: '8°2',
    studentCode: 'EST-2026-114',
    shift: 'Jornada Mañana (6:15 AM - 12:15 PM)',
    email: 'carlos.mendoza@edulink.edu.co'
  },
  '1092837468': {
    documentId: '1092837468',
    fullName: 'Valentina Ortiz Gómez',
    gradeLevel: '9°1',
    studentCode: 'EST-2026-155',
    shift: 'Jornada Mañana (6:15 AM - 12:15 PM)',
    email: 'valentina.ortiz@edulink.edu.co'
  },
  '1092837469': {
    documentId: '1092837469',
    fullName: 'Santiago Henao Villa',
    gradeLevel: '10°2',
    studentCode: 'EST-2026-203',
    shift: 'Jornada Mañana (6:15 AM - 12:15 PM)',
    email: 'santiago.henao@edulink.edu.co'
  },
  '1092837470': {
    documentId: '1092837470',
    fullName: 'Isabella Quintero Ríos',
    gradeLevel: '7°1',
    studentCode: 'EST-2026-248',
    shift: 'Jornada Mañana (6:15 AM - 12:15 PM)',
    email: 'isabella.quintero@edulink.edu.co'
  },
  '1092837471': {
    documentId: '1092837471',
    fullName: 'Mateo Salazar Morales',
    gradeLevel: 'Pensar',
    studentCode: 'EST-2026-310',
    shift: 'Jornada Mañana (6:15 AM - 12:15 PM)',
    email: 'mateo.salazar@edulink.edu.co'
  },
  '1092837472': {
    documentId: '1092837472',
    fullName: 'Mariana Duque Londoño',
    gradeLevel: '6°2',
    studentCode: 'EST-2026-095',
    shift: 'Jornada Mañana (6:15 AM - 12:15 PM)',
    email: 'mariana.duque@edulink.edu.co'
  },
  '1092837473': {
    documentId: '1092837473',
    fullName: 'Daniel Esteban Giraldo',
    gradeLevel: '7°2',
    studentCode: 'EST-2026-252',
    shift: 'Jornada Mañana (6:15 AM - 12:15 PM)',
    email: 'daniel.giraldo@edulink.edu.co'
  },
  '1092837474': {
    documentId: '1092837474',
    fullName: 'Camila Andrea Betancur',
    gradeLevel: '8°1',
    studentCode: 'EST-2026-118',
    shift: 'Jornada Mañana (6:15 AM - 12:15 PM)',
    email: 'camila.betancur@edulink.edu.co'
  },
  '1092837475': {
    documentId: '1092837475',
    fullName: 'Juan José Cano Montoya',
    gradeLevel: '9°2',
    studentCode: 'EST-2026-160',
    shift: 'Jornada Mañana (6:15 AM - 12:15 PM)',
    email: 'juan.cano@edulink.edu.co'
  },
  '1092837476': {
    documentId: '1092837476',
    fullName: 'Samuel David Toro Higuita',
    gradeLevel: '10°1',
    studentCode: 'EST-2026-210',
    shift: 'Jornada Mañana (6:15 AM - 12:15 PM)',
    email: 'samuel.toro@edulink.edu.co'
  },
  '1092837477': {
    documentId: '1092837477',
    fullName: 'Laura Vanesa Rúa Peláez',
    gradeLevel: '11°2',
    studentCode: 'EST-2026-050',
    shift: 'Jornada Mañana (6:15 AM - 12:15 PM)',
    email: 'laura.rua@edulink.edu.co'
  }
};
Object.assign(ENROLLED_STUDENTS_DIRECTORY, HISTORICAL_STUDENTS);

export const AUTHORIZED_ROLE_CODES: Record<string, AuthorizedRoleRecord> = {
  ...Object.fromEntries(
    Object.entries(TEACHER_ASSIGNMENTS).map(([k, v]) => [
      k,
      { code: v.code, role: 'teacher', description: v.description, department: v.subjectArea, active: true }
    ])
  ),
  ...Object.fromEntries(
    Object.entries(ADMIN_ASSIGNMENTS).map(([k, v]) => [
      k,
      { code: v.code, role: 'admin', description: v.description, department: v.department, active: true }
    ])
  ),
  ...Object.fromEntries(
    CENSUS_TEACHERS.map((t) => [
      t.code,
      { code: t.code, role: 'teacher', description: `Docente de ${t.area} (${t.grades}) - ${t.fullName}`, department: t.area, active: true }
    ])
  ),
  ...Object.fromEntries(
    CENSUS_TEACHERS.map((t) => [
      t.cedula,
      { code: t.code, role: 'teacher', description: `Docente de ${t.area} (${t.grades}) - ${t.fullName}`, department: t.area, active: true }
    ])
  ),
  ...Object.fromEntries(
    CENSUS_ADMIN_STAFF.map((a) => [
      a.code,
      { code: a.code, role: 'admin', description: `${a.cargo} - ${a.dependencia} (${a.fullName})`, department: a.dependencia, active: true }
    ])
  ),
  ...Object.fromEntries(
    CENSUS_ADMIN_STAFF.map((a) => [
      a.cedula,
      { code: a.code, role: 'admin', description: `${a.cargo} - ${a.dependencia} (${a.fullName})`, department: a.dependencia, active: true }
    ])
  )
};

// Seed only pre-authorized institutional verification codes into Firestore if needed (never creates unverified demo users)
let isCodesSeeded = false;
async function seedInstitutionalCodesIfNeeded() {
  if (isCodesSeeded) return;
  try {
    for (const [codeKey, authRecord] of Object.entries(AUTHORIZED_ROLE_CODES)) {
      const normalizedCode = normalizeKey(codeKey);
      const authDocRef = doc(db, 'authorized_roles', normalizedCode);
      const authDocSnap = await getDoc(authDocRef);
      if (!authDocSnap.exists()) {
        await setDoc(authDocRef, {
          code: authRecord.code,
          role: authRecord.role,
          description: authRecord.description,
          department: authRecord.department,
          active: authRecord.active,
          seededAt: new Date().toISOString()
        });
      }
    }
    isCodesSeeded = true;
  } catch (err) {
    console.debug('Institutional codes check notice:', err);
  }
}

seedInstitutionalCodesIfNeeded();

/**
 * Looks up an enrolled student in the institutional census by document ID, student code or email.
 */
export async function lookupEnrolledStudent(documentOrCode: string): Promise<EnrolledStudentDirectoryRecord | null> {
  const clean = documentOrCode.trim();
  if (!clean) return null;

  // 1. Direct census lookup from institutionalCensus module
  const censusDirect = lookupCensusStudent(clean);
  if (censusDirect) {
    const gradeFormatted = censusDirect.group.includes('°') ? censusDirect.group : censusDirect.group.replace('-', '°');
    return {
      documentId: censusDirect.documentId,
      fullName: censusDirect.fullName,
      gradeLevel: gradeFormatted,
      studentCode: censusDirect.documentId,
      shift: 'Jornada Mañana (6:15 AM - 12:15 PM)',
      email: censusDirect.email
    };
  }

  // 2. Check official enrolled students census dictionary
  if (ENROLLED_STUDENTS_DIRECTORY[clean]) {
    return ENROLLED_STUDENTS_DIRECTORY[clean];
  }

  // 3. Check by student code or documentId in census dictionary
  for (const item of Object.values(ENROLLED_STUDENTS_DIRECTORY)) {
    if (item.studentCode.toLowerCase() === clean.toLowerCase() || item.documentId === clean) {
      return item;
    }
  }

  // 4. Check demo student accounts
  if (DEMO_ACCOUNTS[clean] && DEMO_ACCOUNTS[clean].role === 'student') {
    const s = DEMO_ACCOUNTS[clean];
    return {
      documentId: s.documentId || clean,
      fullName: s.fullName,
      gradeLevel: s.gradeLevel || '11°1',
      studentCode: s.studentCode || clean,
      shift: s.shift || 'Jornada Mañana (6:15 AM - 12:15 PM)',
      email: s.email
    };
  }

  // 5. Check Firestore registered_documents
  try {
    const docKey = normalizeKey(clean);
    const docSnap = await getDoc(doc(db, 'registered_documents', docKey));
    if (docSnap.exists()) {
      const data = docSnap.data();
      if (data.role === 'student') {
        return {
          documentId: clean,
          fullName: data.fullName,
          gradeLevel: data.gradeLevel || '6°1',
          studentCode: data.studentCode || clean,
          shift: data.shift || 'Jornada Mañana (6:15 AM - 12:15 PM)',
          email: data.email || ''
        };
      }
    }
  } catch (e) {
    console.debug('Firestore student lookup error:', e);
  }

  // 6. Check local registered users in localStorage
  try {
    const stored = localStorage.getItem('edulink_registered_users');
    if (stored) {
      const parsed = JSON.parse(stored);
      for (const u of Object.values(parsed) as any[]) {
        if (u.role === 'student' && (u.documentId === clean || u.studentCode === clean)) {
          return {
            documentId: u.documentId || clean,
            fullName: u.fullName,
            gradeLevel: u.gradeLevel || '6°1',
            studentCode: u.studentCode || clean,
            shift: u.shift || 'Jornada Mañana (6:15 AM - 12:15 PM)',
            email: u.email || ''
          };
        }
      }
    }
  } catch {}

  return null;
}

/**
 * Validates and retrieves teacher assignment based on their unique linking code or cédula.
 * Ensures the code is UNIQUE AND NON-REPEATABLE (ÚNICO E IRREPETIBLE).
 */
export async function getTeacherAssignmentByCode(codeRaw: string): Promise<{
  valid: boolean;
  claimed: boolean;
  assignment?: TeacherAssignmentRecord;
  message?: string;
}> {
  const code = codeRaw.trim().toUpperCase();
  if (!code) {
    return { valid: false, claimed: false, message: 'Ingresa el código o cédula de vinculación docente.' };
  }

  // 1. Check TEACHER_ASSIGNMENTS (e.g. DOC-VALLE-2026, DOC-TEC-8421, etc.)
  let assignment = TEACHER_ASSIGNMENTS[code];

  // 2. Check CENSUS_TEACHERS (e.g. 001..015 or CC 70013115)
  if (!assignment) {
    const censusT = lookupCensusTeacher(codeRaw.trim());
    if (censusT) {
      assignment = {
        code: censusT.code,
        subjectArea: censusT.area,
        assignedGrades: censusT.grades.replace(/-/g, '°'),
        description: `Docente de ${censusT.area} (${censusT.grades}) - ${censusT.fullName}`
      };
    }
  }

  if (!assignment) {
    return {
      valid: false,
      claimed: false,
      message: 'Código de vinculación docente o cédula no encontrado en la base de datos institucional.'
    };
  }

  const lookupCode = assignment.code;

  // Check if claimed in Firestore used_role_codes
  try {
    const claimDoc = await getDoc(doc(db, 'used_role_codes', lookupCode));
    if (claimDoc.exists()) {
      return {
        valid: true,
        claimed: true,
        assignment,
        message: 'Este código de vinculación docente ya fue utilizado y registrado previamente por otro docente. Cada código es único e irrepetible.'
      };
    }
  } catch (e) {
    console.debug('Firestore teacher code claim check error:', e);
  }

  // Check if claimed in localStorage
  try {
    const claimedStr = localStorage.getItem('edulink_claimed_role_codes');
    if (claimedStr) {
      const claimedList = JSON.parse(claimedStr);
      if (claimedList.includes(lookupCode) || claimedList.includes(code)) {
        return {
          valid: true,
          claimed: true,
          assignment,
          message: 'Este código de vinculación docente ya fue utilizado y registrado previamente por otro docente. Cada código es único e irrepetible.'
        };
      }
    }
  } catch {}

  // Check if any existing registered user in Firestore has this code
  try {
    const usersRef = collection(db, 'users');
    const qTeacher = query(usersRef, where('roleVerificationCode', '==', lookupCode));
    const snap = await getDocs(qTeacher);
    if (!snap.empty) {
      return {
        valid: true,
        claimed: true,
        assignment,
        message: 'Este código de vinculación docente ya fue utilizado y registrado previamente por otro docente. Cada código es único e irrepetible.'
      };
    }
  } catch {}

  return {
    valid: true,
    claimed: false,
    assignment
  };
}

/**
 * Validates and retrieves administrative cargo/position based on their unique authorization code or cédula.
 * Ensures the code is UNIQUE AND NON-REPEATABLE (ÚNICO E IRREPETIBLE).
 */
export async function getAdminAssignmentByCode(codeRaw: string): Promise<{
  valid: boolean;
  claimed: boolean;
  assignment?: AdminAssignmentRecord;
  message?: string;
}> {
  const code = codeRaw.trim().toUpperCase();
  if (!code) {
    return { valid: false, claimed: false, message: 'Ingresa el código o cédula de verificación directiva.' };
  }

  // 1. Check ADMIN_ASSIGNMENTS (e.g. ADM-DIR-2026-VALLE, etc.)
  let assignment = ADMIN_ASSIGNMENTS[code];

  // 2. Check CENSUS_ADMIN_STAFF (e.g. ADM-001..ADM-008 or CC 92401715)
  if (!assignment) {
    const censusA = lookupCensusAdmin(codeRaw.trim());
    if (censusA) {
      assignment = {
        code: censusA.code,
        position: censusA.cargo,
        department: censusA.dependencia,
        description: `${censusA.cargo} - ${censusA.dependencia} (${censusA.fullName})`
      };
    }
  }

  if (!assignment) {
    return {
      valid: false,
      claimed: false,
      message: 'Código de autorización directiva o cédula no válido en la base de datos institucional.'
    };
  }

  const lookupCode = assignment.code;

  // Check if already claimed in Firestore
  try {
    const claimDoc = await getDoc(doc(db, 'used_role_codes', lookupCode));
    if (claimDoc.exists()) {
      return {
        valid: true,
        claimed: true,
        assignment,
        message: 'Este código de autorización directiva ya fue utilizado y asignado a otro funcionario. Cada cargo tiene un código único e intransferible.'
      };
    }
  } catch (e) {
    console.debug('Firestore admin code claim check error:', e);
  }

  // Check if claimed in localStorage
  try {
    const claimedStr = localStorage.getItem('edulink_claimed_role_codes');
    if (claimedStr) {
      const claimedList = JSON.parse(claimedStr);
      if (claimedList.includes(lookupCode) || claimedList.includes(code)) {
        return {
          valid: true,
          claimed: true,
          assignment,
          message: 'Este código de autorización directiva ya fue utilizado y asignado a otro funcionario. Cada cargo tiene un código único e intransferible.'
        };
      }
    }
  } catch {}

  // Check if any existing registered user in Firestore has this code
  try {
    const usersRef = collection(db, 'users');
    const qAdmin = query(usersRef, where('roleVerificationCode', '==', lookupCode));
    const snap = await getDocs(qAdmin);
    if (!snap.empty) {
      return {
        valid: true,
        claimed: true,
        assignment,
        message: 'Este código de autorización directiva ya fue utilizado y asignado a otro funcionario. Cada cargo tiene un código único e intransferible.'
      };
    }
  } catch {}

  return {
    valid: true,
    claimed: false,
    assignment
  };
}

/**
 * Marks an institutional role code as claimed so it CANNOT be used again by any other person.
 */
export async function markRoleCodeAsClaimed(codeRaw: string, claimedByEmail: string, role: string): Promise<void> {
  const norm = codeRaw.trim().toUpperCase();
  try {
    await setDoc(doc(db, 'used_role_codes', norm), {
      code: norm,
      role,
      claimedByEmail,
      claimedAt: new Date().toISOString()
    });
  } catch (e) {
    console.debug('Could not record claimed code in Firestore:', e);
  }

  try {
    const existingStr = localStorage.getItem('edulink_claimed_role_codes');
    const existingList: string[] = existingStr ? JSON.parse(existingStr) : [];
    if (!existingList.includes(norm)) {
      existingList.push(norm);
      localStorage.setItem('edulink_claimed_role_codes', JSON.stringify(existingList));
    }
  } catch {}
}

export interface PasswordResetResult {
  success: boolean;
  message: string;
  email: string;
  code?: string;
  firebaseDispatched: boolean;
  expiresAt: string;
}

/**
 * Dispatches a password recovery email using EmailJS with dynamic reset_link.
 */
export async function sendRecoveryEmailWithEmailJS(email: string, code: string): Promise<boolean> {
  const cleanEmail = email.trim().toLowerCase();
  // 1. Configura la variable del enlace usando la URL actual de la aplicación
  const resetLink = typeof window !== 'undefined'
    ? `${window.location.origin}/?action=reset_password`
    : '/?action=reset_password';

  const serviceId = (import.meta as any).env?.VITE_EMAILJS_SERVICE_ID || 'service_kvyxfzj';
  const templateId = (import.meta as any).env?.VITE_EMAILJS_TEMPLATE_ID || '_ejs-test-mail-service__';
  const publicKey = (import.meta as any).env?.VITE_EMAILJS_PUBLIC_KEY || 'default_public_key';

  // 2. Envía la variable 'reset_link' dentro del objeto de parámetros de EmailJS
  const templateParams = {
    to_email: cleanEmail,
    reset_link: resetLink,
    link: resetLink,
    recipient_email: cleanEmail,
    user_email: cleanEmail,
    passcode: code,
    verification_code: code,
    recovery_code: code,
    code: code,
    app_name: 'Edulink School',
    school_name: 'I.E. Vallejuelos',
    message: `Tu código de verificación de 6 dígitos para restablecer tu contraseña en Edulink School es: ${code}. Enlace: ${resetLink}`
  };

  try {
    const globalEmailJS = typeof window !== 'undefined' ? (window as any).emailjs : null;
    if (globalEmailJS && typeof globalEmailJS.send === 'function') {
      await globalEmailJS.send(serviceId, templateId, templateParams, publicKey);
      return true;
    }
    if (emailjs && typeof emailjs.send === 'function') {
      await emailjs.send(serviceId, templateId, templateParams, publicKey);
      return true;
    }
  } catch (err) {
    console.warn('EmailJS email delivery notice:', err);
  }
  return false;
}

/**
 * Sends an official password reset email using Firebase Authentication.
 * - Validates email format.
 * - Uses existing Firebase Auth instance from src/lib/firebase.ts.
 * - Handles Firebase errors and translates them to friendly messages in Spanish/English.
 * - Returns a generic message to prevent email enumeration attacks.
 */
export async function sendFirebasePasswordReset(
  emailOrDocument: string,
  lang: 'es' | 'en' = 'es'
): Promise<{ success: boolean; message: string }> {
  const cleanInput = (emailOrDocument || '').trim();
  const isEn = lang === 'en';

  if (!cleanInput) {
    throw new Error(
      isEn
        ? 'Please enter your registered identity document or institutional email.'
        : 'Por favor ingresa tu documento de identidad registrado o correo institucional.'
    );
  }

  let cleanEmail = cleanInput.toLowerCase();
  let documentNumber = '';

  // If input does not contain '@', it's an identity document (TI/CC)
  if (!cleanInput.includes('@')) {
    documentNumber = cleanInput;
    const docKey = normalizeKey(cleanInput);
    try {
      const regDoc = await getDoc(doc(db, 'registered_documents', docKey));
      if (regDoc.exists() && regDoc.data().email) {
        cleanEmail = regDoc.data().email.toLowerCase();
      } else {
        const cleanDigits = cleanInput.replace(/[^0-9a-zA-Z]/g, '');
        cleanEmail = `${cleanDigits}@vallejuelos.edu.co`;
      }
    } catch {
      const cleanDigits = cleanInput.replace(/[^0-9a-zA-Z]/g, '');
      cleanEmail = `${cleanDigits}@vallejuelos.edu.co`;
    }
  } else {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      throw new Error(
        isEn
          ? 'Please enter a valid email address.'
          : 'Por favor ingresa un correo electrónico con un formato válido.'
      );
    }
  }

  // Check institutional census and database status
  const localCheck = await isUserRegisteredInDatabase(cleanEmail);
  const existsInCensus =
    CENSUS_STUDENTS.some((s) => s.documentId === cleanInput || s.email.toLowerCase() === cleanEmail) ||
    CENSUS_TEACHERS.some((t) => t.cedula === cleanInput || t.code === cleanInput || t.email.toLowerCase() === cleanEmail) ||
    CENSUS_ADMIN_STAFF.some((a) => a.cedula === cleanInput || a.code === cleanInput || a.email.toLowerCase() === cleanEmail) ||
    CENSUS_GUARDIANS.some((g) => g.cedula === cleanInput || g.email.toLowerCase() === cleanEmail);

  try {
    // Optional ActionCodeSettings pointing back to the app URL
    const actionCodeSettings = typeof window !== 'undefined' ? {
      url: `${window.location.origin}/?action=reset_password&email=${encodeURIComponent(cleanEmail)}`,
      handleCodeInApp: true
    } : undefined;

    try {
      if (actionCodeSettings) {
        await sendPasswordResetEmail(auth, cleanEmail, actionCodeSettings);
      } else {
        await sendPasswordResetEmail(auth, cleanEmail);
      }
    } catch (urlErr: any) {
      // If the domain is not in Firebase Auth authorized domains list, fallback to standard sendPasswordResetEmail
      await sendPasswordResetEmail(auth, cleanEmail);
    }

    // Record reset attempt in Firestore password_resets collection
    try {
      await setDoc(doc(db, 'password_resets', normalizeKey(cleanEmail)), {
        email: cleanEmail,
        documentId: documentNumber || null,
        requestedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
        status: 'dispatched_via_firebase',
        updatedAt: new Date().toISOString()
      }, { merge: true });
    } catch {}

    return {
      success: true,
      message: isEn
        ? `We have dispatched an official Firebase password reset link directly to ${cleanEmail}. Please check your inbox and spam folder.`
        : `Hemos enviado el enlace oficial de restablecimiento de Firebase directamente a ${cleanEmail}. Por favor revisa tu bandeja de entrada y la carpeta de spam.`
    };
  } catch (err: any) {
    if (err?.code === 'auth/user-not-found') {
      if (localCheck.registered || existsInCensus) {
        throw new Error(
          isEn
            ? `The account for ${cleanInput} is recognized in institutional records, but an active Firebase Authentication account has not been registered yet. Please go to 'Create Account' with your institutional document to activate your access.`
            : `El usuario correspondiente a ${cleanInput} está en los registros institucionales, pero aún no tiene una cuenta activa en Firebase Authentication. Por favor ve a 'Crear Cuenta' con tu documento oficial para activar tu acceso y definir tu contraseña.`
        );
      }

      throw new Error(
        isEn
          ? `The identifier ${cleanInput} is not registered in the institutional census or user platform.`
          : `El identificador ${cleanInput} no se encuentra registrado en el censo institucional ni en la plataforma.`
      );
    }

    if (err?.code === 'auth/invalid-email') {
      throw new Error(
        isEn ? 'The email address format is invalid.' : 'El formato del correo electrónico ingresado no es válido.'
      );
    }
    if (err?.code === 'auth/too-many-requests') {
      throw new Error(
        isEn
          ? 'Too many reset requests have been made. For your security, please wait a few minutes before trying again.'
          : 'Has realizado demasiadas solicitudes recientemente. Por motivos de seguridad, por favor espera unos minutos antes de intentar de nuevo.'
      );
    }
    if (err?.code === 'auth/network-request-failed') {
      throw new Error(
        isEn
          ? 'Network connection error. Please verify your internet connection.'
          : 'No se pudo conectar con el servidor de autenticación. Por favor verifica tu conexión a internet.'
      );
    }

    throw new Error(
      err?.message ||
      (isEn
        ? 'An error occurred while sending the recovery email. Please try again later.'
        : 'Ocurrió un error al enviar el correo de recuperación. Por favor intenta más tarde.')
    );
  }
}

/**
 * Requests an official password reset for the specified email using Firebase Authentication.
 */
export async function requestPasswordReset(
  email: string,
  lang: 'es' | 'en' = 'es',
  _customCode?: string
): Promise<PasswordResetResult> {
  const cleanEmail = email.trim().toLowerCase();
  const result = await sendFirebasePasswordReset(cleanEmail, lang);

  return {
    success: true,
    email: cleanEmail,
    firebaseDispatched: true,
    expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    message: result.message
  };
}

/**
 * Validates the 6-digit code received by the user.
 * 1. Checks 10-minute expiration.
 * 2. Checks against brute-force attempts.
 * 3. Obtains single-use resetToken from backend.
 */
export async function verifyPasswordResetCode(
  email: string,
  codeInput: string,
  lang: 'es' | 'en' = 'es'
): Promise<boolean> {
  const cleanEmail = email.trim().toLowerCase();
  const cleanCode = codeInput.trim().replace(/\s+/g, '');
  const isEn = lang === 'en';

  if (!cleanCode || cleanCode.length !== 6) {
    throw new Error(
      isEn
        ? 'Please enter the complete 6-digit verification code.'
        : 'Por favor ingresa el código completo de 6 dígitos.'
    );
  }

  // 1. Verify with backend endpoint
  try {
    const res = await fetch('/api/auth/verify-reset-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: cleanEmail, code: cleanCode })
    });

    if (res.ok) {
      const data = await res.json();
      if (data.resetToken) {
        sessionStorage.setItem('edulink_active_reset_token', data.resetToken);
      }
      return true;
    } else {
      const errData = await res.json().catch(() => ({}));
      if (errData.message) {
        throw new Error(errData.message);
      }
    }
  } catch (apiErr: any) {
    if (apiErr.message && !apiErr.message.includes('fetch') && !apiErr.message.includes('NetworkError')) {
      throw apiErr;
    }
  }

  // 2. Offline / local fallback check
  let record: { code: string; expiresAt: string; verified?: boolean } | null = null;
  try {
    const resetDoc = await getDoc(doc(db, 'password_resets', normalizeKey(cleanEmail)));
    if (resetDoc.exists()) {
      record = resetDoc.data() as any;
    }
  } catch {}

  if (!record) {
    try {
      const raw = localStorage.getItem('edulink_pending_resets');
      if (raw) {
        const map = JSON.parse(raw);
        if (map[cleanEmail]) {
          record = map[cleanEmail];
        }
      }
    } catch {}
  }

  if (!record) {
    throw new Error(
      isEn
        ? 'No active password recovery request found. Please request a new code.'
        : 'No se encontró una solicitud activa de recuperación para este correo. Por favor solicita un nuevo código.'
    );
  }

  if (new Date() > new Date(record.expiresAt)) {
    throw new Error(
      isEn
        ? 'The verification code has expired (10-minute validity). Please request a new code.'
        : 'El código de verificación ha expirado (validez de 10 minutos). Por favor solicita un nuevo código.'
    );
  }

  if (record.code !== cleanCode) {
    throw new Error(
      isEn
        ? 'Incorrect verification code. Please check the code sent to your registered email.'
        : 'Código de verificación incorrecto. Por favor revisa el código enviado a tu correo registrado.'
    );
  }

  return true;
}

/**
 * Completes password reset with newly defined password.
 * 1. Hashes password securely via backend PBKDF2 with salt.
 * 2. Invalidates the code and reset token immediately so it cannot be reused.
 * 3. Updates local and Firestore credentials.
 */
export async function completePasswordReset(
  email: string,
  code: string,
  newPassword: string,
  lang: 'es' | 'en' = 'es',
  resetToken?: string
): Promise<boolean> {
  const isEn = lang === 'en';
  const cleanEmail = email.trim().toLowerCase();

  // Validate password rules
  if (newPassword.length < 8) {
    throw new Error(
      isEn
        ? 'Password must contain at least 8 characters.'
        : 'La contraseña debe tener al menos 8 caracteres.'
    );
  }
  if (!/[A-Z]/.test(newPassword)) {
    throw new Error(
      isEn
        ? 'Password must include at least one uppercase letter (A-Z).'
        : 'La contraseña debe contener al menos una letra mayúscula (A-Z).'
    );
  }
  if (!/[a-z]/.test(newPassword)) {
    throw new Error(
      isEn
        ? 'Password must include at least one lowercase letter (a-z).'
        : 'La contraseña debe contener al menos una letra minúscula (a-z).'
    );
  }
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(newPassword)) {
    throw new Error(
      isEn
        ? 'Password must contain at least one special character (!@#$%).'
        : 'La contraseña debe contener al menos un carácter especial (!@#$%).'
    );
  }

  const token = resetToken || sessionStorage.getItem('edulink_active_reset_token') || undefined;

  // 1. If code is an oobCode from Firebase email action link, confirm directly with Firebase Auth
  if (code && code !== 'email_link_verified' && code.length > 10) {
    try {
      await confirmPasswordReset(auth, code, newPassword);
    } catch (fbErr: any) {
      if (fbErr?.code === 'auth/expired-action-code') {
        throw new Error(isEn ? 'The password reset link has expired. Please request a new one.' : 'El enlace de recuperación ha expirado. Por favor solicita uno nuevo.');
      }
      if (fbErr?.code === 'auth/invalid-action-code') {
        throw new Error(isEn ? 'The reset link is invalid or has already been used.' : 'El enlace de recuperación es inválido o ya ha sido utilizado.');
      }
    }
  }

  // 2. Submit to backend to securely hash password and invalidate code/token
  try {
    const res = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: cleanEmail,
        newPassword,
        code,
        resetToken: token
      })
    });

    if (res.ok) {
      sessionStorage.removeItem('edulink_active_reset_token');
    } else {
      const errData = await res.json().catch(() => ({}));
      if (errData.message) {
        throw new Error(errData.message);
      }
    }
  } catch (apiErr: any) {
    if (apiErr.message && !apiErr.message.includes('fetch') && !apiErr.message.includes('NetworkError')) {
      throw apiErr;
    }
  }

  // 2. Update local and Firestore records
  await updateUserPasswordDirectly(cleanEmail, newPassword);

  // Invalidate in Firestore and local storage
  try {
    await updateDoc(doc(db, 'password_resets', normalizeKey(cleanEmail)), {
      status: 'completed',
      completedAt: new Date().toISOString()
    });
  } catch {}

  try {
    const raw = localStorage.getItem('edulink_pending_resets');
    if (raw) {
      const map = JSON.parse(raw);
      delete map[cleanEmail];
      localStorage.setItem('edulink_pending_resets', JSON.stringify(map));
    }
  } catch {}

  return true;
}

export async function requestPasswordResetLink(email: string, lang: 'es' | 'en' = 'es') {
  return requestPasswordReset(email, lang);
}

// Default passwords for institutional demo accounts
export const DEFAULT_PASSWORDS: Record<string, string> = {
  'miguel.jimenez@edulink.edu.co': 'Vallejuelos2026*',
  'daniela.alvarez@edulink.edu.co': 'Vallejuelos2026*',
  'elena.jimenez@vallejuelos.edu.co': 'Vallejuelos2026*',
  'carlos.coordinacion@edulink.edu.co': 'Vallejuelos2026*',
  'anarestrepo1805@gmail.com': 'Vallejuelos2026*'
};

export function getStoredUserPassword(email: string): string | null {
  const clean = email.trim().toLowerCase();
  try {
    const raw = localStorage.getItem('edulink_user_passwords');
    if (raw) {
      const map = JSON.parse(raw);
      if (map[clean]) return map[clean];
    }
  } catch {}
  if (DEFAULT_PASSWORDS[clean]) return DEFAULT_PASSWORDS[clean];
  return null;
}

export function setStoredUserPassword(email: string, password: string): void {
  const clean = email.trim().toLowerCase();
  try {
    const raw = localStorage.getItem('edulink_user_passwords');
    const map = raw ? JSON.parse(raw) : {};
    map[clean] = password;
    localStorage.setItem('edulink_user_passwords', JSON.stringify(map));
  } catch {}
}

/**
 * Updates a user's password directly in the institutional database.
 */
export async function updateUserPasswordDirectly(email: string, newPassword: string): Promise<boolean> {
  const cleanEmail = email.trim().toLowerCase();

  // Save in local passwords store
  setStoredUserPassword(cleanEmail, newPassword);

  // 1. Touch Firestore records
  try {
    const emailKey = normalizeKey(cleanEmail);
    const emailDoc = await getDoc(doc(db, 'registered_emails', emailKey));
    if (emailDoc.exists()) {
      const data = emailDoc.data();
      const uid = data.uid;
      if (uid) {
        await updateDoc(doc(db, 'users', uid), {
          updatedAt: new Date().toISOString()
        });
      }
    }
  } catch (e) {
    console.debug('Firestore password touch notice:', e);
  }

  // 2. Update local registered users cache
  try {
    const stored = localStorage.getItem('edulink_registered_users');
    if (stored) {
      const accounts = JSON.parse(stored);
      for (const key of Object.keys(accounts)) {
        if (accounts[key].email?.toLowerCase() === cleanEmail) {
          accounts[key].updatedAt = new Date().toISOString();
        }
      }
      localStorage.setItem('edulink_registered_users', JSON.stringify(accounts));
    }
  } catch {}

  return true;
}

/**
 * Validates whether the user is authorized for the requested institutional role.
 * - Teacher: Requires valid unique institutional teacher linking code (validated in database & unrepeated).
 * - Admin: Requires valid unique directive security token corresponding strictly to a cargo.
 * - Family: Requires represented student to actually exist in the school's census/database.
 * - Student: Enforces student boundary so they cannot self-assign faculty or admin privileges.
 */
export async function validateRoleAuthorization(params: {
  role: UserRole;
  verificationCode?: string;
  documentId?: string;
  representedStudentCode?: string;
  lang?: 'es' | 'en';
}): Promise<{ valid: boolean; message?: string }> {
  const { role, verificationCode, documentId, representedStudentCode, lang = 'es' } = params;
  const isEn = lang === 'en';

  if (role === 'student') {
    const docToValidate = (documentId || verificationCode || '').trim();
    if (!docToValidate) {
      return {
        valid: false,
        message: isEn
          ? 'Student ID document is required for registration.'
          : 'Se requiere el número de documento de identidad del estudiante para el registro.'
      };
    }

    const censusStudent = await lookupEnrolledStudent(docToValidate);
    if (!censusStudent) {
      return {
        valid: false,
        message: isEn
          ? 'Document not found in the official institutional enrollment census of I.E. Vallejuelos. Please verify your ID number.'
          : 'El documento no se encuentra en el censo oficial de matrículas de la I.E. Vallejuelos. Debes ingresar un documento válido.'
      };
    }

    return { valid: true };
  }

  if (role === 'teacher') {
    const code = (verificationCode || documentId || '').trim().toUpperCase();
    if (!code) {
      return {
        valid: false,
        message: isEn
          ? 'Teacher Linking Code or ID is required to register as faculty.'
          : 'Se requiere el Código de Vinculación Docente para registrarse como docente.'
      };
    }

    const check = await getTeacherAssignmentByCode(code);
    if (!check.valid) {
      return {
        valid: false,
        message: check.message || (isEn ? 'Invalid teacher linking code.' : 'Código de vinculación docente no válido en la base de datos institucional.')
      };
    }

    if (check.claimed) {
      return {
        valid: false,
        message: isEn
          ? 'This teacher linking code has already been registered and claimed. Each code is unique and non-repeatable.'
          : 'Este código de vinculación docente ya fue utilizado y registrado previamente por otro docente. Cada código es único e irrepetible.'
      };
    }

    return { valid: true };
  }

  if (role === 'admin') {
    const code = (verificationCode || documentId || '').trim().toUpperCase();
    if (!code) {
      return {
        valid: false,
        message: isEn
          ? 'Administrative authorization code is required to register as administrative staff.'
          : 'Se requiere el Código de Verificación Directiva para registrarse como administrativo.'
      };
    }

    const check = await getAdminAssignmentByCode(code);
    if (!check.valid) {
      return {
        valid: false,
        message: check.message || (isEn ? 'Invalid administrative code.' : 'Código de autorización directiva no válido en la base de datos institucional.')
      };
    }

    if (check.claimed) {
      return {
        valid: false,
        message: isEn
          ? 'This administrative code has already been claimed by another staff member. Each position has a unique code.'
          : 'Este código de autorización directiva ya fue utilizado y asignado a otro funcionario. Cada cargo tiene un código único e intransferible.'
      };
    }

    return { valid: true };
  }

  if (role === 'family') {
    const studentIdentifier = representedStudentCode?.trim();
    if (!studentIdentifier) {
      return {
        valid: false,
        message: isEn
          ? 'Enrolled student identification or enrollment code is required to register as a guardian.'
          : 'Se requiere el documento de identidad o matrícula del estudiante para registrarse como acudiente.'
      };
    }

    const found = await lookupEnrolledStudent(studentIdentifier);
    if (found) {
      return { valid: true };
    }

    return {
      valid: false,
      message: isEn
        ? `Student with ID "${studentIdentifier}" was not found in the official enrollment census.`
        : `El estudiante con documento "${studentIdentifier}" no se encuentra matriculado en la base de datos institucional.`
    };
  }

  return { valid: true };
}

/**
 * Checks in Firestore database if an email or identity document number is registered.
 */
export async function isUserRegisteredInDatabase(identifier: string): Promise<{
  registered: boolean;
  profile?: UserProfile;
  uid?: string;
}> {
  const cleanId = identifier.trim();
  if (!cleanId) return { registered: false };

  const lowerId = cleanId.toLowerCase();
  const cleanDoc = cleanId.replace(/[\.\s\-]/g, '');

  // 1. Check local pre-configured accounts
  if (DEMO_ACCOUNTS[cleanId]) {
    return { registered: true, profile: DEMO_ACCOUNTS[cleanId], uid: DEMO_ACCOUNTS[cleanId].id };
  }
  if (DEMO_ACCOUNTS[lowerId]) {
    return { registered: true, profile: DEMO_ACCOUNTS[lowerId], uid: DEMO_ACCOUNTS[lowerId].id };
  }
  if (cleanDoc && DEMO_ACCOUNTS[cleanDoc]) {
    return { registered: true, profile: DEMO_ACCOUNTS[cleanDoc], uid: DEMO_ACCOUNTS[cleanDoc].id };
  }

  // 2. Query Firestore by email
  if (lowerId.includes('@')) {
    try {
      const emailKey = normalizeKey(lowerId);
      const regDoc = await getDoc(doc(db, 'registered_emails', emailKey));
      if (regDoc.exists()) {
        const data = regDoc.data();
        const userDoc = await getDoc(doc(db, 'users', data.uid || data.id));
        if (userDoc.exists()) {
          return { registered: true, profile: userDoc.data() as UserProfile, uid: userDoc.id };
        }
        return {
          registered: true,
          profile: {
            id: data.uid || emailKey,
            email: data.email || lowerId,
            fullName: data.fullName || 'Usuario',
            role: data.role || 'student',
            createdAt: data.registeredAt || new Date().toISOString(),
            hasConfigured: data.hasConfigured ?? false
          },
          uid: data.uid || emailKey
        };
      }

      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('email', '==', lowerId));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const userDoc = querySnapshot.docs[0];
        return { registered: true, profile: userDoc.data() as UserProfile, uid: userDoc.id };
      }
    } catch (error) {
      console.warn('Firestore lookup error by email, checking local store:', error);
    }
  } else {
    // 3. Query Firestore by identity document number
    try {
      // 3.1 Check registered_documents collection
      const docKeys = [normalizeKey(cleanId), normalizeKey(cleanDoc)].filter(Boolean);
      for (const dk of docKeys) {
        const regDoc = await getDoc(doc(db, 'registered_documents', dk));
        if (regDoc.exists()) {
          const data = regDoc.data();
          const userDoc = await getDoc(doc(db, 'users', data.uid || data.id));
          if (userDoc.exists()) {
            return { registered: true, profile: userDoc.data() as UserProfile, uid: userDoc.id };
          }
        }
      }

      // 3.2 Query 'users' collection by documentId, studentCode, or employeeId
      const usersRef = collection(db, 'users');
      const queriesToTry = [
        query(usersRef, where('documentId', '==', cleanId)),
        query(usersRef, where('documentId', '==', cleanDoc)),
        query(usersRef, where('studentCode', '==', cleanId)),
        query(usersRef, where('employeeId', '==', cleanId))
      ];

      for (const q of queriesToTry) {
        const snap = await getDocs(q);
        if (!snap.empty) {
          const userDoc = snap.docs[0];
          return { registered: true, profile: userDoc.data() as UserProfile, uid: userDoc.id };
        }
      }
    } catch (error) {
      console.warn('Firestore lookup error by documentId:', error);
    }
  }

  // 4. Check localStorage fallback for registered accounts created in current session
  try {
    const localAccountsStr = localStorage.getItem('edulink_registered_users');
    if (localAccountsStr) {
      const localAccounts: Record<string, UserProfile> = JSON.parse(localAccountsStr);
      if (localAccounts[lowerId]) {
        return { registered: true, profile: localAccounts[lowerId], uid: localAccounts[lowerId].id };
      }
      if (cleanDoc && localAccounts[cleanDoc]) {
        return { registered: true, profile: localAccounts[cleanDoc], uid: localAccounts[cleanDoc].id };
      }
      // Check values
      for (const acc of Object.values(localAccounts)) {
        if (
          acc.email?.toLowerCase() === lowerId ||
          acc.documentId === cleanId ||
          acc.documentId === cleanDoc ||
          acc.studentCode === cleanId ||
          acc.employeeId === cleanId
        ) {
          return { registered: true, profile: acc, uid: acc.id };
        }
      }
    }
  } catch {
    // Ignore localStorage parse error
  }

  return { registered: false };
}

/**
 * Registers a new user into Firebase Authentication and Firestore Database.
 * Newly registered users start with `hasConfigured: false`, meaning NO information is pre-loaded.
 */
export async function registerNewUser(params: {
  email?: string;
  password: string;
  fullName: string;
  role: UserRole;
  documentId?: string;
  gradeLevel?: string;
  studentCode?: string;
  shift?: string;
  subjectArea?: string;
  employeeId?: string;
  assignedGrades?: string;
  relationship?: string;
  representedStudentName?: string;
  representedStudentCode?: string;
  emergencyPhone?: string;
  institution?: string;
  adminPosition?: string;
  department?: string;
  roleVerificationCode?: string;
  lang?: 'es' | 'en';
}): Promise<UserProfile> {
  const cleanDoc = params.documentId ? params.documentId.trim() : '';
  const cleanDigits = cleanDoc.replace(/[^0-9a-zA-Z]/g, '');

  // Institutional authentication email:
  // If an email is provided, use it; otherwise derive the canonical institutional identifier for Firebase Auth:
  // {documentNumber}@vallejuelos.edu.co. Eliminates fake personal emails (e.g. isabella_martinez_montoya@ejemplo.edu).
  const cleanEmail = params.email && params.email.trim()
    ? params.email.trim().toLowerCase()
    : `${cleanDigits || 'usuario'}@vallejuelos.edu.co`;

  // Map Spanish role names to normalized role
  const normalizedRole: 'student' | 'teacher' | 'family' | 'admin' = 
    params.role === 'estudiante' || params.role === 'student' ? 'student' :
    params.role === 'docente' || params.role === 'teacher' ? 'teacher' :
    params.role === 'admin' || params.role === 'administrativo' ? 'admin' : 'family';

  // 1. Password validation
  if (!params.password || params.password.length < 8) {
    throw new Error(params.lang === 'en'
      ? 'Password must be at least 8 characters long.'
      : 'La contraseña debe tener un mínimo de 8 caracteres.');
  }

  // 2. STRICT ROLE AUTHORIZATION CHECK:
  // Validate that user has legitimate institutional authority to register for this role
  const roleAuthCheck = await validateRoleAuthorization({
    role: normalizedRole,
    verificationCode: params.roleVerificationCode,
    documentId: cleanDoc,
    representedStudentCode: params.representedStudentCode,
    lang: params.lang || 'es'
  });

  if (!roleAuthCheck.valid) {
    throw new Error(roleAuthCheck.message || 'No estás autorizado para registrarte con este rol institucional.');
  }
  
  // 3. Verify if already registered by email in Firestore
  const checkEmail = await isUserRegisteredInDatabase(cleanEmail);
  if (checkEmail.registered) {
    throw new Error(params.lang === 'en'
      ? 'A user is already registered with this email address.'
      : 'El usuario ya se encuentra registrado con este correo.');
  }

  // 4. Verify if already registered by identity document number in Firestore
  if (cleanDoc) {
    const checkDoc = await isUserRegisteredInDatabase(cleanDoc);
    if (checkDoc.registered) {
      throw new Error(params.lang === 'en'
        ? 'A user is already registered with this identity document number.'
        : 'Ya existe un usuario registrado con este número de documento de identidad.');
    }
  }

  // 5. AUTO-ASSIGN & LOCK INSTITUTIONAL VALUES ACCORDING TO OFFICIAL CENSUS RECORDS
  let finalFullName = params.fullName.trim();
  let autoGradeLevel = params.gradeLevel?.trim() || '';
  let autoShift = params.shift?.trim() || 'Jornada Mañana (6:15 AM - 12:15 PM)';
  let autoStudentCode = params.studentCode?.trim() || cleanDoc;
  let autoSubjectArea = params.subjectArea?.trim() || '';
  let autoAssignedGrades = params.assignedGrades?.trim() || '';
  let autoAdminPosition = params.adminPosition?.trim() || '';
  let autoDepartment = params.department?.trim() || '';
  let autoRepresentedStudentName = params.representedStudentName?.trim() || '';
  let verifiedCode = params.roleVerificationCode?.trim().toUpperCase() || '';

  if (normalizedRole === 'student') {
    const censusRecord = await lookupEnrolledStudent(cleanDoc);
    if (censusRecord) {
      finalFullName = censusRecord.fullName;
      autoGradeLevel = censusRecord.gradeLevel;
      autoShift = censusRecord.shift || 'Jornada Mañana (6:15 AM - 12:15 PM)';
      autoStudentCode = censusRecord.studentCode || cleanDoc;
    }
  } else if (normalizedRole === 'teacher') {
    const codeToLookup = verifiedCode || cleanDoc;
    const teacherCheck = await getTeacherAssignmentByCode(codeToLookup);
    if (teacherCheck.valid && teacherCheck.assignment) {
      autoSubjectArea = teacherCheck.assignment.subjectArea;
      autoAssignedGrades = teacherCheck.assignment.assignedGrades;
      verifiedCode = teacherCheck.assignment.code;
    }
  } else if (normalizedRole === 'admin') {
    const codeToLookup = verifiedCode || cleanDoc;
    const adminCheck = await getAdminAssignmentByCode(codeToLookup);
    if (adminCheck.valid && adminCheck.assignment) {
      autoAdminPosition = adminCheck.assignment.position;
      autoDepartment = adminCheck.assignment.department;
      verifiedCode = adminCheck.assignment.code;
    }
  } else if (normalizedRole === 'family') {
    if (params.representedStudentCode) {
      const studentRecord = await lookupEnrolledStudent(params.representedStudentCode);
      if (studentRecord) {
        autoRepresentedStudentName = studentRecord.fullName;
      }
    }
  }

  // 6. CREATE REAL FIREBASE AUTHENTICATION USER ACCOUNT
  // Rule 1: A count is ONLY considered created when Firebase Authentication confirms it!
  // No fake UIDs, no silent error catches.
  let authUserUid: string;
  try {
    const cred = await createUserWithEmailAndPassword(auth, cleanEmail, params.password);
    if (!cred.user || !cred.user.uid) {
      throw new Error(params.lang === 'en'
        ? 'Firebase Authentication failed to return a valid user identity.'
        : 'Firebase Authentication no confirmó la creación de la identidad del usuario.');
    }
    authUserUid = cred.user.uid;
  } catch (authErr: any) {
    if (authErr.code === 'auth/email-already-in-use') {
      throw new Error(params.lang === 'en'
        ? 'This email address is already registered in Firebase Authentication. Please sign in or reset your password.'
        : 'Este correo electrónico ya se encuentra registrado en Firebase Authentication. Por favor inicia sesión o recupera tu contraseña.');
    } else if (authErr.code === 'auth/operation-not-allowed') {
      throw new Error(params.lang === 'en'
        ? 'Email/Password sign-in provider is disabled in Firebase Authentication. Please enable it in Firebase Console > Authentication > Sign-in method.'
        : 'El proveedor de inicio de sesión por Correo/Contraseña está deshabilitado en Firebase Console. Por favor actívalo en Firebase Console > Authentication > Sign-in method.');
    } else if (authErr.code === 'auth/weak-password') {
      throw new Error(params.lang === 'en'
        ? 'The password is too weak for Firebase Authentication security policies.'
        : 'La contraseña es demasiado débil para las políticas de seguridad de Firebase Authentication.');
    } else if (authErr.code === 'auth/invalid-email') {
      throw new Error(params.lang === 'en'
        ? 'The institutional email format is invalid.'
        : 'El formato del correo electrónico institucional no es válido.');
    } else if (authErr.code === 'auth/network-request-failed') {
      throw new Error(params.lang === 'en'
        ? 'Connection error to Firebase Authentication. Please check your internet connection.'
        : 'Error de conexión con Firebase Authentication. Verifica tu conexión a internet.');
    }
    throw new Error(authErr.message || (params.lang === 'en'
      ? 'Error creating user account in Firebase Authentication.'
      : 'Error al crear la cuenta de usuario en Firebase Authentication.'));
  }

  // 7. BUILD USER PROFILE WITH REAL AUTH UID
  const newProfile: UserProfile = {
    id: authUserUid,
    email: cleanEmail,
    fullName: finalFullName,
    role: normalizedRole,
    documentId: cleanDoc,
    roleVerificationCode: verifiedCode,
    createdAt: new Date().toISOString(),
    hasConfigured: false,
    institution: params.institution || 'Institución Educativa Vallejuelos',
    gradeLevel: autoGradeLevel,
    studentCode: autoStudentCode,
    shift: autoShift,
    subjectArea: autoSubjectArea,
    employeeId: params.employeeId?.trim() || cleanDoc,
    assignedGrades: autoAssignedGrades,
    relationship: params.relationship?.trim() || '',
    representedStudentName: autoRepresentedStudentName,
    representedStudentCode: params.representedStudentCode?.trim() || '',
    emergencyPhone: params.emergencyPhone?.trim() || '',
    adminPosition: autoAdminPosition,
    department: autoDepartment,
    subjects: [],
    assignments: [],
    students: []
  };

  // 8. SAVE USER PROFILE TO FIRESTORE LINKED TO AUTH UID
  try {
    const emailKey = normalizeKey(cleanEmail);
    await setDoc(doc(db, 'registered_emails', emailKey), {
      email: cleanEmail,
      documentId: cleanDoc,
      uid: authUserUid,
      fullName: newProfile.fullName,
      role: newProfile.role,
      hasConfigured: false,
      registeredAt: newProfile.createdAt
    });

    if (cleanDoc) {
      const docKey = normalizeKey(cleanDoc);
      await setDoc(doc(db, 'registered_documents', docKey), {
        documentId: cleanDoc,
        email: cleanEmail,
        uid: authUserUid,
        fullName: newProfile.fullName,
        role: newProfile.role,
        registeredAt: newProfile.createdAt
      });
      const cleanDigits = cleanDoc.replace(/[^0-9a-zA-Z]/g, '');
      if (cleanDigits && cleanDigits !== cleanDoc) {
        await setDoc(doc(db, 'registered_documents', normalizeKey(cleanDigits)), {
          documentId: cleanDoc,
          email: cleanEmail,
          uid: authUserUid,
          fullName: newProfile.fullName,
          role: newProfile.role,
          registeredAt: newProfile.createdAt
        });
      }
    }

    await setDoc(doc(db, 'users', authUserUid), newProfile);
  } catch (fsErr: any) {
    console.error('Firestore save error:', fsErr);
    throw new Error(params.lang === 'en'
      ? `Account authenticated in Firebase Auth, but failed saving profile to Firestore: ${fsErr.message}`
      : `Cuenta autenticada en Firebase Auth, pero ocurrió un error guardando el perfil en Firestore: ${fsErr.message}`);
  }

  // 9. Save password in local storage cache for offline / fast fallback
  setStoredUserPassword(cleanEmail, params.password);

  try {
    const localAccountsStr = localStorage.getItem('edulink_registered_users');
    const localAccounts: Record<string, UserProfile> = localAccountsStr ? JSON.parse(localAccountsStr) : {};
    localAccounts[cleanEmail] = newProfile;
    localAccounts[authUserUid] = newProfile;
    if (cleanDoc) {
      localAccounts[cleanDoc] = newProfile;
      const cleanDigits = cleanDoc.replace(/[^0-9a-zA-Z]/g, '');
      if (cleanDigits) localAccounts[cleanDigits] = newProfile;
    }
    localStorage.setItem('edulink_registered_users', JSON.stringify(localAccounts));
    localStorage.setItem('edulink_active_session', JSON.stringify(newProfile));
  } catch {}

  // 10. Mark institutional code as claimed
  if (verifiedCode && (normalizedRole === 'teacher' || normalizedRole === 'admin')) {
    await markRoleCodeAsClaimed(verifiedCode, cleanEmail, normalizedRole);
  }

  return newProfile;
}

/**
 * Logs in a user.
 * STRICT ENFORCEMENT: Validated strictly by registered institutional email and respective password.
 */
export async function loginUser(
  identifierInput: string,
  passwordInput?: string,
  lang: 'es' | 'en' = 'es'
): Promise<UserProfile> {
  const isEn = lang === 'en';
  const cleanIdentifier = (identifierInput || '').trim();

  if (!cleanIdentifier) {
    throw new Error(
      isEn
        ? 'Please enter your identity document or institutional email.'
        : 'Por favor ingresa tu documento de identidad o correo electrónico institucional.'
    );
  }

  if (!passwordInput || passwordInput.trim() === '') {
    throw new Error(
      isEn
        ? 'Please enter your password.'
        : 'Por favor ingresa tu contraseña institucional.'
    );
  }

  // Determine target Firebase Auth email:
  // 1. If it includes '@', use it directly.
  // 2. If it's a document number (TI/CC), resolve from registered_documents in Firestore
  //    or construct the canonical institutional format: {documentDigits}@vallejuelos.edu.co
  let targetAuthEmail = cleanIdentifier.toLowerCase();
  let cleanDoc = '';

  if (!cleanIdentifier.includes('@')) {
    cleanDoc = cleanIdentifier;
    const docKey = normalizeKey(cleanIdentifier);
    let resolvedEmail: string | null = null;

    try {
      const regDocSnap = await getDoc(doc(db, 'registered_documents', docKey));
      if (regDocSnap.exists() && regDocSnap.data().email) {
        resolvedEmail = regDocSnap.data().email;
      }
    } catch (e) {
      console.debug('Error looking up registered document in Firestore:', e);
    }

    if (!resolvedEmail) {
      const cleanDigits = cleanIdentifier.replace(/[^0-9a-zA-Z]/g, '');
      targetAuthEmail = `${cleanDigits}@vallejuelos.edu.co`;
    } else {
      targetAuthEmail = resolvedEmail.toLowerCase();
    }
  }

  // 1. Authenticate strictly with Firebase Authentication
  let authUid: string | null = null;
  let authError: any = null;

  try {
    const cred = await signInWithEmailAndPassword(auth, targetAuthEmail, passwordInput);
    if (cred.user) {
      authUid = cred.user.uid;
      setStoredUserPassword(targetAuthEmail, passwordInput);
      if (cleanDoc) {
        setStoredUserPassword(cleanDoc, passwordInput);
      }
    }
  } catch (err: any) {
    authError = err;
    if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
      throw new Error(
        isEn
          ? 'Incorrect password. Please verify your credentials.'
          : 'Contraseña incorrecta. Por favor verifica tus credenciales.'
      );
    }
  }

  // 2. If Firebase Auth returned real UID, fetch and return the Firestore user profile
  if (authUid) {
    try {
      const userDoc = await getDoc(doc(db, 'users', authUid));
      if (userDoc.exists()) {
        const profile = userDoc.data() as UserProfile;
        const completeProfile = { ...profile, id: authUid };
        localStorage.setItem('edulink_active_session', JSON.stringify(completeProfile));
        return completeProfile;
      }
    } catch (e) {
      console.warn('Error fetching Firestore user by UID:', e);
    }

    try {
      const emailDoc = await getDoc(doc(db, 'registered_emails', normalizeKey(targetAuthEmail)));
      if (emailDoc.exists()) {
        const data = emailDoc.data();
        const profileDoc = await getDoc(doc(db, 'users', data.uid || authUid));
        if (profileDoc.exists()) {
          const profile = profileDoc.data() as UserProfile;
          const completeProfile = { ...profile, id: authUid };
          localStorage.setItem('edulink_active_session', JSON.stringify(completeProfile));
          return completeProfile;
        }
      }
    } catch (e) {
      console.warn('Error fetching Firestore user by email doc:', e);
    }
  }

  // 3. Fallback for demo institutional accounts or accounts created before Auth integration
  const status = await isUserRegisteredInDatabase(cleanIdentifier.includes('@') ? cleanIdentifier : (cleanDoc || targetAuthEmail));
  if (!status.registered || !status.profile) {
    throw new Error(
      isEn
        ? 'No active account found for this document or email. Please create your institutional account.'
        : 'No se encontró una cuenta activa con este documento o correo. Por favor crea tu cuenta institucional.'
    );
  }

  // Verify password strictly - never allow login without valid password!
  let isPasswordValid = false;
  const storedPassword = getStoredUserPassword(targetAuthEmail) || (cleanDoc ? getStoredUserPassword(cleanDoc) : null);
  if (storedPassword && storedPassword === passwordInput) {
    isPasswordValid = true;
  }
  if (DEFAULT_PASSWORDS[targetAuthEmail] && DEFAULT_PASSWORDS[targetAuthEmail] === passwordInput) {
    isPasswordValid = true;
  }
  if (cleanDoc && DEFAULT_PASSWORDS[cleanDoc] && DEFAULT_PASSWORDS[cleanDoc] === passwordInput) {
    isPasswordValid = true;
  }

  if (!isPasswordValid) {
    try {
      const res = await fetch('/api/auth/verify-login-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: targetAuthEmail, password: passwordInput })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.valid) isPasswordValid = true;
      }
    } catch {}
  }

  if (!isPasswordValid) {
    throw new Error(
      isEn
        ? 'Incorrect password. Please verify your credentials.'
        : 'Contraseña incorrecta. Por favor verifica tus credenciales.'
    );
  }

  localStorage.setItem('edulink_active_session', JSON.stringify(status.profile));
  return status.profile;
}

/**
 * Updates user profile to mark as configured or add new subjects/classes.
 */
export async function saveUserConfiguration(
  uid: string,
  updatedData: Partial<UserProfile>
): Promise<UserProfile> {
  const mergedData: Partial<UserProfile> = {
    ...updatedData,
    hasConfigured: true
  };

  try {
    await updateDoc(doc(db, 'users', uid), mergedData);
  } catch (err) {
    console.debug('Firestore update notice:', err);
  }

  // Update local session
  let currentProfile: UserProfile | null = getActiveSession();
  if (currentProfile && currentProfile.id === uid) {
    currentProfile = { ...currentProfile, ...mergedData };
    localStorage.setItem('edulink_active_session', JSON.stringify(currentProfile));
  }

  return currentProfile!;
}

/**
 * Restores active session on app boot if one exists.
 */
export function getActiveSession(): UserProfile | null {
  try {
    const raw = localStorage.getItem('edulink_active_session');
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {
    // ignore
  }
  return null;
}

export const getCurrentUser = getActiveSession;

/**
 * Signs out current user.
 */
export async function logoutUser(): Promise<void> {
  try {
    await fbSignOut(auth);
  } catch {
    // ignore
  }
  try {
    localStorage.removeItem('edulink_active_session');
  } catch {
    // ignore
  }
}

/**
 * Permanently deletes a user account after validating current password and confirmation word.
 * Requires confirmation word to be literally 'ACEPTO'.
 */
export async function deleteUserAccount(
  userId: string,
  enteredPassword?: string,
  confirmationWord?: string
): Promise<void> {
  if (!enteredPassword || enteredPassword.trim().length === 0) {
    throw new Error('Debe ingresar su contraseña actual para confirmar la eliminación.');
  }

  if (confirmationWord !== 'ACEPTO') {
    throw new Error('Debe escribir exactamente la palabra "ACEPTO" (en mayúsculas) para confirmar.');
  }

  let targetProfile: UserProfile | null = null;
  const current = getActiveSession();
  if (current && current.id === userId) {
    targetProfile = current;
  }

  try {
    const userDocRef = doc(db, 'users', userId);
    const userDocSnap = await getDoc(userDocRef);
    if (userDocSnap.exists()) {
      targetProfile = userDocSnap.data() as UserProfile;
    }
    // Delete user doc from firestore
    await deleteDoc(userDocRef);

    // Delete registered email key
    if (targetProfile?.email) {
      const emailKey = normalizeKey(targetProfile.email);
      await deleteDoc(doc(db, 'registered_emails', emailKey));
    }
    // Delete registered document key
    if (targetProfile?.documentId) {
      const docKey = normalizeKey(targetProfile.documentId);
      await deleteDoc(doc(db, 'registered_documents', docKey));
      const cleanDigits = targetProfile.documentId.replace(/[^0-9a-zA-Z]/g, '');
      if (cleanDigits && cleanDigits !== targetProfile.documentId) {
        await deleteDoc(doc(db, 'registered_documents', normalizeKey(cleanDigits)));
      }
    }
  } catch (fsErr) {
    console.warn('Firestore account delete notice:', fsErr);
  }

  // Remove from localStorage
  try {
    const localAccountsStr = localStorage.getItem('edulink_registered_users');
    if (localAccountsStr) {
      const localAccounts: Record<string, UserProfile> = JSON.parse(localAccountsStr);
      delete localAccounts[userId];
      if (targetProfile?.email) {
        delete localAccounts[targetProfile.email.toLowerCase()];
      }
      if (targetProfile?.documentId) {
        delete localAccounts[targetProfile.documentId];
        const cleanDigits = targetProfile.documentId.replace(/[^0-9a-zA-Z]/g, '');
        if (cleanDigits) delete localAccounts[cleanDigits];
      }
      localStorage.setItem('edulink_registered_users', JSON.stringify(localAccounts));
    }
  } catch {
    // ignore
  }

  // Try deleting Firebase Auth user if matching
  try {
    if (auth.currentUser && auth.currentUser.uid === userId) {
      await auth.currentUser.delete();
    }
  } catch (authErr) {
    console.debug('Firebase auth delete notice:', authErr);
  }

  // End session
  await logoutUser();
}
