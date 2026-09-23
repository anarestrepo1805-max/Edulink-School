import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as fbSignOut
} from 'firebase/auth';
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

export const AUTHORIZED_ROLE_CODES: Record<string, AuthorizedRoleRecord> = {
  // --- DOCENTES OFICIALES (Teacher linking codes issued by academic direction) ---
  'DOC-VALLE-2026': {
    code: 'DOC-VALLE-2026',
    role: 'teacher',
    description: 'Código General Vinculación Docente I.E. Vallejuelos',
    department: 'Cuerpo Docente General',
    active: true
  },
  'DOC-TEC-8421': {
    code: 'DOC-TEC-8421',
    role: 'teacher',
    description: 'Licencia Docente Área Tecnología e Informática',
    department: 'Tecnología y Sistemas',
    active: true
  },
  'DOC-MAT-7139': {
    code: 'DOC-MAT-7139',
    role: 'teacher',
    description: 'Licencia Docente Área Matemáticas y Geometría',
    department: 'Matemáticas',
    active: true
  },
  'DOC-CIEN-9312': {
    code: 'DOC-CIEN-9312',
    role: 'teacher',
    description: 'Licencia Docente Ciencias Naturales y Química',
    department: 'Ciencias',
    active: true
  },
  'DOC-IDIOMAS-5120': {
    code: 'DOC-IDIOMAS-5120',
    role: 'teacher',
    description: 'Licencia Docente Lengua Castellana e Inglés',
    department: 'Humanidades e Idiomas',
    active: true
  },

  // --- ADMINISTRATIVOS Y DIRECTIVOS (Administrative secret keys issued by Principal) ---
  'ADM-DIR-2026-VALLE': {
    code: 'ADM-DIR-2026-VALLE',
    role: 'admin',
    description: 'Llave Maestra Rectoría y Dirección Institucional',
    department: 'Rectoría General',
    active: true
  },
  'ADM-COORD-2026': {
    code: 'ADM-COORD-2026',
    role: 'admin',
    description: 'Token Oficial Coordinación Académica y Convivencia',
    department: 'Coordinación Académica',
    active: true
  },
  'ADM-SEC-9876': {
    code: 'ADM-SEC-9876',
    role: 'admin',
    description: 'Token Oficial Secretaría General & Matrículas',
    department: 'Secretaría Académica',
    active: true
  }
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
 * Validates whether the user is authorized for the requested institutional role.
 * - Teacher: Requires valid institutional teacher linking code (validated in Firestore / authorized records).
 * - Admin: Requires valid directive security token (validated in Firestore / authorized records).
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

  if (role === 'teacher') {
    const code = verificationCode?.trim().toUpperCase();
    if (!code) {
      return {
        valid: false,
        message: isEn
          ? 'Institutional Teacher Linking Code is required to register as faculty.'
          : 'Se requiere el Código de Vinculación Docente emitido por Coordinación para registrarse como docente.'
      };
    }

    // 1. Check local static authorized table
    if (AUTHORIZED_ROLE_CODES[code] && AUTHORIZED_ROLE_CODES[code].role === 'teacher') {
      return { valid: true };
    }

    // 2. Check Firestore authorized_roles collection
    try {
      const normCode = normalizeKey(code);
      const codeDoc = await getDoc(doc(db, 'authorized_roles', normCode));
      if (codeDoc.exists()) {
        const data = codeDoc.data();
        if (data.role === 'teacher' && data.active !== false) {
          return { valid: true };
        }
      }
    } catch (e) {
      console.warn('Firestore role verification lookup:', e);
    }

    // 3. Fallback: Check if document matches a pre-authorized teacher in DEMO_ACCOUNTS
    if (documentId && (DEMO_ACCOUNTS[documentId.trim()]?.role === 'teacher' || documentId.trim() === '71394821')) {
      return { valid: true };
    }

    return {
      valid: false,
      message: isEn
        ? `Invalid or unauthorized teacher code "${code}". Only staff authorized by Academic Direction can create teacher accounts.`
        : `El código de vinculación docente "${code}" es inválido o no está autorizado en la base de datos institucional.`
    };
  }

  if (role === 'admin') {
    const code = verificationCode?.trim().toUpperCase();
    if (!code) {
      return {
        valid: false,
        message: isEn
          ? 'Administrative Security Key / Token is required to register as administrative staff.'
          : 'Se requiere la Llave de Autorización Directiva / Token de Seguridad para registrarse como administrativo.'
      };
    }

    // 1. Check local static authorized table
    if (AUTHORIZED_ROLE_CODES[code] && AUTHORIZED_ROLE_CODES[code].role === 'admin') {
      return { valid: true };
    }

    // 2. Check Firestore authorized_roles collection
    try {
      const normCode = normalizeKey(code);
      const codeDoc = await getDoc(doc(db, 'authorized_roles', normCode));
      if (codeDoc.exists()) {
        const data = codeDoc.data();
        if (data.role === 'admin' && data.active !== false) {
          return { valid: true };
        }
      }
    } catch (e) {
      console.warn('Firestore role verification lookup:', e);
    }

    // 3. Fallback: Check if document matches a pre-authorized admin in DEMO_ACCOUNTS
    if (documentId && (DEMO_ACCOUNTS[documentId.trim()]?.role === 'admin' || documentId.trim() === '98765432')) {
      return { valid: true };
    }

    return {
      valid: false,
      message: isEn
        ? `Administrative key "${code}" is invalid or unauthorized. Only leadership authorized by Principal can register administrative accounts.`
        : `La llave de autorización "${code}" no es válida ni está autorizada por Rectoría en la base de datos.`
    };
  }

  if (role === 'family') {
    const studentIdentifier = representedStudentCode?.trim();
    if (!studentIdentifier) {
      return {
        valid: false,
        message: isEn
          ? 'Enrolled student identification or enrollment code is required to register as a guardian.'
          : 'Se requiere el documento de identidad o matrícula del estudiante matriculado para registrarse como acudiente.'
      };
    }

    // Verify student exists in the institution database
    const studentStatus = await isUserRegisteredInDatabase(studentIdentifier);
    if (studentStatus.registered && studentStatus.profile?.role === 'student') {
      return { valid: true };
    }

    // Check predefined student records (like Miguel Ángel Jiménez 1092837465 / EST-2026-042)
    if (
      studentIdentifier === '1092837465' ||
      studentIdentifier === 'EST-2026-042' ||
      DEMO_ACCOUNTS[studentIdentifier]?.role === 'student'
    ) {
      return { valid: true };
    }

    // Also check Firestore users collection for role === 'student'
    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('documentId', '==', studentIdentifier));
      const snap = await getDocs(q);
      if (!snap.empty) {
        const u = snap.docs[0].data();
        if (u.role === 'student') return { valid: true };
      }
      const q2 = query(usersRef, where('studentCode', '==', studentIdentifier));
      const snap2 = await getDocs(q2);
      if (!snap2.empty) {
        return { valid: true };
      }
    } catch (e) {
      console.warn('Student verification lookup error:', e);
    }

    return {
      valid: false,
      message: isEn
        ? `Student with ID "${studentIdentifier}" was not found in the institutional enrollment census. Please verify the student's ID.`
        : `El estudiante con documento "${studentIdentifier}" no se encuentra matriculado en la base de datos institucional de la I.E. Vallejuelos.`
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

  // Create initial profile
  const newProfile: UserProfile = {
    id: uid,
    email: cleanEmail,
    fullName: params.fullName.trim(),
    role: normalizedRole,
    documentId: cleanDoc,
    createdAt: new Date().toISOString(),
    hasConfigured: false, // starts unconfigured/empty
    institution: params.institution || 'Institución Educativa Vallejuelos',
    gradeLevel: params.gradeLevel?.trim() || '',
    studentCode: params.studentCode?.trim() || cleanDoc,
    shift: params.shift?.trim() || '',
    subjectArea: params.subjectArea?.trim() || '',
    employeeId: params.employeeId?.trim() || cleanDoc,
    assignedGrades: params.assignedGrades?.trim() || '',
    relationship: params.relationship?.trim() || '',
    representedStudentName: params.representedStudentName?.trim() || '',
    representedStudentCode: params.representedStudentCode?.trim() || '',
    emergencyPhone: params.emergencyPhone?.trim() || '',
    adminPosition: params.adminPosition?.trim() || (normalizedRole === 'admin' ? 'Coordinación' : ''),
    department: params.department?.trim() || '',
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

  return newProfile;
}

/**
 * Logs in a user.
 * Accepts either email or identity document number.
 * STRICT ENFORCEMENT: If the user is NOT registered in the database,
 * throws an explicit error: "El usuario no está registrado en la plataforma."
 */
export async function loginUser(identifier: string, password?: string): Promise<UserProfile> {
  const cleanId = identifier.trim();
  
  if (!cleanId) {
    throw new Error('Por favor ingrese su correo electrónico o número de documento de identidad.');
  }

  // 1. Verify if user is registered in the database (by email or document number)
  const status = await isUserRegisteredInDatabase(cleanId);
  if (!status.registered || !status.profile) {
    // STRICT REQUIREMENT: If not registered, display that they are not registered!
    throw new Error('El usuario no está registrado en la plataforma. Por favor regístrese para continuar.');
  }

  // 2. Try Firebase Auth sign in with email or mapped profile email
  const authEmail = cleanId.includes('@') ? cleanId.toLowerCase() : status.profile.email;
  if (authEmail && password) {
    try {
      await signInWithEmailAndPassword(auth, authEmail, password);
    } catch (authErr: any) {
      if (authErr.code === 'auth/wrong-password') {
        throw new Error('Contraseña incorrecta. Por favor verifique sus datos.');
      }
      console.debug('Firebase Auth note during sign-in:', authErr.message);
    }
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
