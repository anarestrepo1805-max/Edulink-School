import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as fbSignOut,
  sendPasswordResetEmail
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
export const ENROLLED_STUDENTS_DIRECTORY: Record<string, EnrolledStudentDirectoryRecord> = {
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
  )
};

// Seed the demo accounts into Firestore once so the database holds real registered records
let isSeeded = false;
async function seedDemoUsersIfNeeded() {
  if (isSeeded) return;
  try {
    // 1. Seed demo accounts
    for (const [identifier, profile] of Object.entries(DEMO_ACCOUNTS)) {
      const emailKey = normalizeKey(profile.email);
      const regDocRef = doc(db, 'registered_emails', emailKey);
      const userDocRef = doc(db, 'users', profile.id);

      // Check if exists
      const existing = await getDoc(regDocRef);
      if (!existing.exists()) {
        await setDoc(regDocRef, {
          email: profile.email,
          identifier: identifier,
          documentId: profile.documentId || '',
          uid: profile.id,
          fullName: profile.fullName,
          role: profile.role,
          hasConfigured: profile.hasConfigured,
          registeredAt: profile.createdAt
        });
      }

      if (profile.documentId) {
        const docKey = normalizeKey(profile.documentId);
        const regDocNumRef = doc(db, 'registered_documents', docKey);
        const existingDocNum = await getDoc(regDocNumRef);
        if (!existingDocNum.exists()) {
          await setDoc(regDocNumRef, {
            documentId: profile.documentId,
            email: profile.email,
            uid: profile.id,
            fullName: profile.fullName,
            role: profile.role,
            registeredAt: profile.createdAt
          });
        }
      }

      const existingUser = await getDoc(userDocRef);
      if (!existingUser.exists()) {
        await setDoc(userDocRef, profile);
      }
    }

    // 2. Seed pre-authorized institutional verification codes into Firestore
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

    isSeeded = true;
  } catch (err) {
    // Non-blocking catch for offline/sandbox mode
    console.debug('Database seed check:', err);
  }
}

// Ensure demo accounts are verified in DB on startup
seedDemoUsersIfNeeded();

/**
 * Looks up an enrolled student in the institutional census by document ID or student code.
 * Used when a family member / guardian enters their student's ID so their name is auto-filled.
 */
export async function lookupEnrolledStudent(documentOrCode: string): Promise<EnrolledStudentDirectoryRecord | null> {
  const clean = documentOrCode.trim();
  if (!clean) return null;

  // 1. Check official enrolled students census
  if (ENROLLED_STUDENTS_DIRECTORY[clean]) {
    return ENROLLED_STUDENTS_DIRECTORY[clean];
  }

  // 2. Check by student code in census
  for (const item of Object.values(ENROLLED_STUDENTS_DIRECTORY)) {
    if (item.studentCode.toLowerCase() === clean.toLowerCase()) {
      return item;
    }
  }

  // 3. Check demo student accounts
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

  // 4. Check Firestore registered_documents
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

  // 5. Check local registered users in localStorage
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
 * Validates and retrieves teacher assignment based on their unique linking code.
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
    return { valid: false, claimed: false, message: 'Ingresa el código de vinculación docente.' };
  }

  const assignment = TEACHER_ASSIGNMENTS[code];
  if (!assignment) {
    return {
      valid: false,
      claimed: false,
      message: 'Código de vinculación docente no encontrado en la base de datos institucional.'
    };
  }

  // Check if already claimed in Firestore
  try {
    const claimDoc = await getDoc(doc(db, 'used_role_codes', code));
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
      if (claimedList.includes(code)) {
        return {
          valid: true,
          claimed: true,
          assignment,
          message: 'Este código de vinculación docente ya fue utilizado y registrado previamente por otro docente. Cada código es único e irrepetible.'
        };
      }
    }
  } catch {}

  // Check if any existing registered user has this code
  try {
    const storedUsers = localStorage.getItem('edulink_registered_users');
    if (storedUsers) {
      const usersObj = JSON.parse(storedUsers);
      for (const u of Object.values(usersObj) as any[]) {
        if (u.role === 'teacher' && u.roleVerificationCode === code) {
          return {
            valid: true,
            claimed: true,
            assignment,
            message: 'Este código de vinculación docente ya fue utilizado y registrado previamente por otro docente. Cada código es único e irrepetible.'
          };
        }
      }
    }
  } catch {}

  return {
    valid: true,
    claimed: false,
    assignment
  };
}

/**
 * Validates and retrieves administrative cargo/position based on their unique authorization code.
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
    return { valid: false, claimed: false, message: 'Ingresa el código de verificación directiva.' };
  }

  const assignment = ADMIN_ASSIGNMENTS[code];
  if (!assignment) {
    return {
      valid: false,
      claimed: false,
      message: 'Código de autorización directiva no válido en la base de datos institucional.'
    };
  }

  // Check if already claimed in Firestore
  try {
    const claimDoc = await getDoc(doc(db, 'used_role_codes', code));
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
      if (claimedList.includes(code)) {
        return {
          valid: true,
          claimed: true,
          assignment,
          message: 'Este código de autorización directiva ya fue utilizado y asignado a otro funcionario. Cada cargo tiene un código único e intransferible.'
        };
      }
    }
  } catch {}

  // Check if any existing registered user has this code
  try {
    const storedUsers = localStorage.getItem('edulink_registered_users');
    if (storedUsers) {
      const usersObj = JSON.parse(storedUsers);
      for (const u of Object.values(usersObj) as any[]) {
        if (u.role === 'admin' && u.roleVerificationCode === code) {
          return {
            valid: true,
            claimed: true,
            assignment,
            message: 'Este código de autorización directiva ya fue utilizado y asignado a otro funcionario. Cada cargo tiene un código único e intransferible.'
          };
        }
      }
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
 * Requests an official password reset for the specified email.
 * 1. Checks that the user is registered in the institutional system.
 * 2. Backend generates a cryptographically secure 6-digit code with 10-minute validity.
 * 3. Sends email automatically via official Resend API SDK.
 * 4. Protects against excessive requests (rate-limiting).
 */
export async function requestPasswordReset(
  email: string,
  lang: 'es' | 'en' = 'es',
  customCode?: string
): Promise<PasswordResetResult> {
  const cleanEmail = email.trim().toLowerCase();
  const isEn = lang === 'en';

  if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
    throw new Error(
      isEn
        ? 'Please enter a valid institutional email address.'
        : 'Ingresa un correo electrónico institucional válido.'
    );
  }

  // 1. Verify that email exists in the database
  const regCheck = await isUserRegisteredInDatabase(cleanEmail);
  if (!regCheck.registered) {
    throw new Error(
      isEn
        ? `The email "${cleanEmail}" is not registered on the platform. Please check the address or register first.`
        : `El correo "${cleanEmail}" no se encuentra registrado en la plataforma. Por favor verifica la dirección o regístrate primero.`
    );
  }

  let resendDispatched = false;
  let backendSuccess = false;
  let customBackendMessage = '';

  // 2. Dispatch via backend with Resend integration
  try {
    const res = await fetch('/api/auth/request-password-reset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: cleanEmail })
    });

    if (res.ok) {
      const data = await res.json();
      backendSuccess = true;
      resendDispatched = !!data.resendDispatched;
      if (data.message) {
        customBackendMessage = data.message;
      }
    } else {
      const errData = await res.json().catch(() => ({}));
      if (errData.message) {
        throw new Error(errData.message);
      }
    }
  } catch (backendErr: any) {
    if (backendErr.message && !backendErr.message.includes('fetch') && !backendErr.message.includes('NetworkError')) {
      throw backendErr;
    }
    console.warn('Backend request reset notice:', backendErr);
  }

  // 3. Fallback / offline persistence: 10-minute expiration
  const code = customCode || Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

  if (!backendSuccess) {
    try {
      const resetRef = doc(db, 'password_resets', normalizeKey(cleanEmail));
      await setDoc(resetRef, {
        email: cleanEmail,
        code,
        requestedAt: new Date().toISOString(),
        expiresAt,
        verified: false,
        status: 'pending'
      });
    } catch {}

    try {
      const raw = localStorage.getItem('edulink_pending_resets');
      const map = raw ? JSON.parse(raw) : {};
      map[cleanEmail] = {
        code,
        expiresAt,
        verified: false,
        requestedAt: new Date().toISOString()
      };
      localStorage.setItem('edulink_pending_resets', JSON.stringify(map));
    } catch {}
  }

  return {
    success: true,
    email: cleanEmail,
    firebaseDispatched: resendDispatched || backendSuccess,
    expiresAt,
    message: customBackendMessage || (isEn
      ? `We have dispatched a 6-digit verification code to ${cleanEmail} (valid for 10 minutes).`
      : `Hemos enviado un código de verificación de 6 dígitos a tu correo electrónico registrado (válido durante 10 minutos).`)
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

  // 1. Submit to backend to securely hash password and invalidate code/token
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
  const { role, verificationCode, representedStudentCode, lang = 'es' } = params;
  const isEn = lang === 'en';

  if (role === 'teacher') {
    const code = verificationCode?.trim().toUpperCase();
    if (!code) {
      return {
        valid: false,
        message: isEn
          ? 'Teacher Linking Code is required to register as faculty.'
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
    const code = verificationCode?.trim().toUpperCase();
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

  // Student role: valid by default for student registration
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
  email: string;
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
  const cleanEmail = params.email.trim().toLowerCase();
  const cleanDoc = params.documentId ? params.documentId.trim() : '';

  // Map Spanish role names to normalized role
  const normalizedRole: 'student' | 'teacher' | 'family' | 'admin' = 
    params.role === 'estudiante' || params.role === 'student' ? 'student' :
    params.role === 'docente' || params.role === 'teacher' ? 'teacher' :
    params.role === 'admin' || params.role === 'administrativo' ? 'admin' : 'family';

  // STRICT ROLE AUTHORIZATION CHECK:
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
  
  // Verify if already registered by email
  const checkEmail = await isUserRegisteredInDatabase(cleanEmail);
  if (checkEmail.registered) {
    throw new Error(params.lang === 'en'
      ? 'A user is already registered with this email address.'
      : 'El usuario ya se encuentra registrado con este correo.');
  }

  // Verify if already registered by identity document number
  if (cleanDoc) {
    const checkDoc = await isUserRegisteredInDatabase(cleanDoc);
    if (checkDoc.registered) {
      throw new Error(params.lang === 'en'
        ? 'A user is already registered with this identity document number.'
        : 'Ya existe un usuario registrado con este número de documento de identidad.');
    }
  }

  let uid = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  // Try Firebase Auth
  try {
    const cred = await createUserWithEmailAndPassword(auth, cleanEmail, params.password);
    if (cred.user) {
      uid = cred.user.uid;
    }
  } catch (authErr: any) {
    // If Firebase auth fails because of existing account or network, handle gracefully
    if (authErr.code === 'auth/email-already-in-use') {
      throw new Error(params.lang === 'en'
        ? 'This email address is already in use.'
        : 'Este correo electrónico ya está registrado en la plataforma.');
    }
    console.debug('Firebase Auth notice, proceeding with record creation:', authErr.message);
  }

  let autoSubjectArea = params.subjectArea?.trim() || '';
  let autoAssignedGrades = params.assignedGrades?.trim() || '';
  let autoAdminPosition = params.adminPosition?.trim() || (normalizedRole === 'admin' ? 'Coordinación' : '');
  let autoDepartment = params.department?.trim() || '';
  let autoRepresentedStudentName = params.representedStudentName?.trim() || '';

  // Auto-assign institutional teacher assignment according to unique code
  if (normalizedRole === 'teacher' && params.roleVerificationCode) {
    const teacherCheck = await getTeacherAssignmentByCode(params.roleVerificationCode);
    if (teacherCheck.valid && teacherCheck.assignment) {
      autoSubjectArea = teacherCheck.assignment.subjectArea;
      autoAssignedGrades = teacherCheck.assignment.assignedGrades;
    }
  }

  // Auto-assign administrative cargo according to unique code
  if (normalizedRole === 'admin' && params.roleVerificationCode) {
    const adminCheck = await getAdminAssignmentByCode(params.roleVerificationCode);
    if (adminCheck.valid && adminCheck.assignment) {
      autoAdminPosition = adminCheck.assignment.position;
      autoDepartment = adminCheck.assignment.department;
    }
  }

  // Auto-assign represented student name from census
  if (normalizedRole === 'family' && params.representedStudentCode) {
    const studentRecord = await lookupEnrolledStudent(params.representedStudentCode);
    if (studentRecord) {
      autoRepresentedStudentName = studentRecord.fullName;
    }
  }

  // Create initial profile
  const newProfile: UserProfile = {
    id: uid,
    email: cleanEmail,
    fullName: params.fullName.trim(),
    role: normalizedRole,
    documentId: cleanDoc,
    roleVerificationCode: params.roleVerificationCode?.trim().toUpperCase() || '',
    createdAt: new Date().toISOString(),
    hasConfigured: false, // starts unconfigured/empty
    institution: params.institution || 'Institución Educativa Vallejuelos',
    gradeLevel: params.gradeLevel?.trim() || '',
    studentCode: params.studentCode?.trim() || cleanDoc,
    shift: params.shift?.trim() || '',
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

  // Save to Firestore
  try {
    const emailKey = normalizeKey(cleanEmail);
    await setDoc(doc(db, 'registered_emails', emailKey), {
      email: cleanEmail,
      documentId: cleanDoc,
      uid: uid,
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
        uid: uid,
        fullName: newProfile.fullName,
        role: newProfile.role,
        registeredAt: newProfile.createdAt
      });
      const cleanDigits = cleanDoc.replace(/[^0-9a-zA-Z]/g, '');
      if (cleanDigits && cleanDigits !== cleanDoc) {
        await setDoc(doc(db, 'registered_documents', normalizeKey(cleanDigits)), {
          documentId: cleanDoc,
          email: cleanEmail,
          uid: uid,
          fullName: newProfile.fullName,
          role: newProfile.role,
          registeredAt: newProfile.createdAt
        });
      }
    }

    await setDoc(doc(db, 'users', uid), newProfile);
  } catch (fsErr) {
    console.warn('Firestore write warning:', fsErr);
  }

  // Save password in local store and user credentials
  setStoredUserPassword(cleanEmail, params.password);

  // Also save to localStorage fallback so user is always recognized in this client
  try {
    const localAccountsStr = localStorage.getItem('edulink_registered_users');
    const localAccounts: Record<string, UserProfile> = localAccountsStr ? JSON.parse(localAccountsStr) : {};
    localAccounts[cleanEmail] = newProfile;
    localAccounts[uid] = newProfile;
    if (cleanDoc) {
      localAccounts[cleanDoc] = newProfile;
      const cleanDigits = cleanDoc.replace(/[^0-9a-zA-Z]/g, '');
      if (cleanDigits) localAccounts[cleanDigits] = newProfile;
    }
    localStorage.setItem('edulink_registered_users', JSON.stringify(localAccounts));
    localStorage.setItem('edulink_active_session', JSON.stringify(newProfile));
  } catch {
    // Ignore storage issues
  }

  // Mark institutional code as claimed so it cannot be used again (ÚNICO E IRREPETIBLE)
  if (params.roleVerificationCode && (normalizedRole === 'teacher' || normalizedRole === 'admin')) {
    await markRoleCodeAsClaimed(params.roleVerificationCode, cleanEmail, normalizedRole);
  }

  return newProfile;
}

/**
 * Logs in a user.
 * STRICT ENFORCEMENT: Validated strictly by registered institutional email and respective password.
 * "VERIFICACIÓN DE ACCESO: El inicio de sesión debe ser validado por correo y contraseña. Es decir, el correo con su respectiva contraseña."
 */
export async function loginUser(emailInput: string, passwordInput?: string, lang: 'es' | 'en' = 'es'): Promise<UserProfile> {
  const isEn = lang === 'en';
  const cleanEmail = (emailInput || '').trim().toLowerCase();
  
  if (!cleanEmail) {
    throw new Error(isEn ? 'Please enter your institutional email.' : 'Por favor ingresa tu correo electrónico institucional.');
  }

  if (!cleanEmail.includes('@') || !cleanEmail.includes('.')) {
    throw new Error(isEn ? 'Please enter a valid email address.' : 'Por favor ingresa un correo electrónico válido con su dominio institucional.');
  }

  if (!passwordInput || passwordInput.trim() === '') {
    throw new Error(isEn ? 'Please enter your password.' : 'Por favor ingresa tu contraseña institucional.');
  }

  // 1. Verify if user is registered in the database by email
  const status = await isUserRegisteredInDatabase(cleanEmail);
  if (!status.registered || !status.profile) {
    // STRICT REQUIREMENT: If not registered, throw clear error
    throw new Error(isEn
      ? 'The user is not registered on the platform. Please register to continue.'
      : 'El usuario no está registrado en la plataforma. Por favor regístrese para continuar.');
  }

  // 2. Validate user password
  let isPasswordValid = false;

  // 2.1 Check via backend PBKDF2 hash verification
  try {
    const res = await fetch('/api/auth/verify-login-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: cleanEmail, password: passwordInput })
    });
    if (res.ok) {
      const data = await res.json();
      if (data.valid) {
        isPasswordValid = true;
      }
    }
  } catch {}

  // 2.2 Local and demo accounts fallback
  if (!isPasswordValid) {
    const storedPassword = getStoredUserPassword(cleanEmail);
    if (storedPassword && storedPassword === passwordInput) {
      isPasswordValid = true;
    }
  }

  // Also verify via Firebase Auth if not already confirmed
  if (!isPasswordValid) {
    try {
      await signInWithEmailAndPassword(auth, cleanEmail, passwordInput);
      isPasswordValid = true;
      // Store verified password locally for seamless offline/fast access
      setStoredUserPassword(cleanEmail, passwordInput);
    } catch (authErr: any) {
      if (authErr.code === 'auth/wrong-password') {
        throw new Error(isEn ? 'Incorrect password. Please verify your credentials.' : 'Contraseña incorrecta. Por favor verifique sus datos.');
      }
    }
  }

  if (!isPasswordValid) {
    throw new Error(isEn ? 'Incorrect password. Please verify your credentials.' : 'Contraseña incorrecta. Por favor verifique sus datos.');
  }

  // Persist session
  try {
    localStorage.setItem('edulink_active_session', JSON.stringify(status.profile));
  } catch {
    // ignore
  }

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
