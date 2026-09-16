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
    createdAt: '2026-01-15T08:00:00.000Z',
    hasConfigured: true,
    institution: 'I.E. Vallejuelos',
    gradeLevel: 'Grado 11°B',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    subjects: INITIAL_SUBJECTS,
    assignments: INITIAL_UPCOMING_ASSIGNMENTS
  },
  'daniela.alvarez@edulink.edu.co': {
    id: 'demo-teacher-1',
    email: 'daniela.alvarez@edulink.edu.co',
    fullName: 'Prof. Daniela Álvarez',
    role: 'teacher',
    createdAt: '2026-01-10T08:00:00.000Z',
    hasConfigured: true,
    institution: 'I.E. Vallejuelos',
    gradeLevel: 'Docente Tecnología & Programación',
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80'
  },
  'elena.jimenez@vallejuelos.edu.co': {
    id: 'demo-family-1',
    email: 'elena.jimenez@vallejuelos.edu.co',
    fullName: 'Elena Gómez Jiménez',
    role: 'family',
    createdAt: '2026-01-12T08:00:00.000Z',
    hasConfigured: true,
    institution: 'I.E. Vallejuelos',
    gradeLevel: 'Acudiente de Miguel Ángel (11°B) y Sofía (6°A)',
    avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80'
  }
};

function normalizeKey(str: string): string {
  return str.trim().toLowerCase().replace(/[^a-z0-9]/g, '_');
}

// Seed the demo accounts into Firestore once so the database holds real registered records
let isSeeded = false;
async function seedDemoUsersIfNeeded() {
  if (isSeeded) return;
  try {
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
          uid: profile.id,
          fullName: profile.fullName,
          role: profile.role,
          hasConfigured: profile.hasConfigured,
          registeredAt: profile.createdAt
        });
      }

      const existingUser = await getDoc(userDocRef);
      if (!existingUser.exists()) {
        await setDoc(userDocRef, profile);
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
 * Checks in Firestore database if an email or identifier is registered.
 */
export async function isUserRegisteredInDatabase(identifier: string): Promise<{
  registered: boolean;
  profile?: UserProfile;
  uid?: string;
}> {
  const cleanId = identifier.trim().toLowerCase();
  if (!cleanId) return { registered: false };

  // 1. Check local pre-configured accounts
  if (DEMO_ACCOUNTS[cleanId]) {
    return { registered: true, profile: DEMO_ACCOUNTS[cleanId], uid: DEMO_ACCOUNTS[cleanId].id };
  }

  // 2. Query Firestore 'registered_emails' collection
  try {
    const emailKey = normalizeKey(cleanId);
    const regDoc = await getDoc(doc(db, 'registered_emails', emailKey));
    if (regDoc.exists()) {
      const data = regDoc.data();
      // Fetch full user profile
      const userDoc = await getDoc(doc(db, 'users', data.uid || data.id));
      if (userDoc.exists()) {
        return { registered: true, profile: userDoc.data() as UserProfile, uid: userDoc.id };
      }
      return {
        registered: true,
        profile: {
          id: data.uid || emailKey,
          email: data.email || cleanId,
          fullName: data.fullName || 'Usuario',
          role: data.role || 'student',
          createdAt: data.registeredAt || new Date().toISOString(),
          hasConfigured: data.hasConfigured ?? false
        },
        uid: data.uid || emailKey
      };
    }

    // 3. Query Firestore 'users' collection by email
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('email', '==', cleanId));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      const userDoc = querySnapshot.docs[0];
      return { registered: true, profile: userDoc.data() as UserProfile, uid: userDoc.id };
    }
  } catch (error) {
    console.warn('Firestore lookup error, checking local store:', error);
  }

  // 4. Check localStorage fallback for registered accounts created in current session
  try {
    const localAccountsStr = localStorage.getItem('edulink_registered_users');
    if (localAccountsStr) {
      const localAccounts: Record<string, UserProfile> = JSON.parse(localAccountsStr);
      if (localAccounts[cleanId]) {
        return { registered: true, profile: localAccounts[cleanId], uid: localAccounts[cleanId].id };
      }
      // Check by email in values
      for (const acc of Object.values(localAccounts)) {
        if (acc.email.toLowerCase() === cleanId) {
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
}): Promise<UserProfile> {
  const cleanEmail = params.email.trim().toLowerCase();
  
  // Verify if already registered
  const check = await isUserRegisteredInDatabase(cleanEmail);
  if (check.registered) {
    throw new Error('El usuario ya se encuentra registrado con este correo institucional o personal.');
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
      throw new Error('Este correo electrónico ya está registrado en la plataforma.');
    }
    console.debug('Firebase Auth notice, proceeding with Firestore record:', authErr.message);
  }

  // Map Spanish role names to normalized role
  const normalizedRole: 'student' | 'teacher' | 'family' = 
    params.role === 'estudiante' || params.role === 'student' ? 'student' :
    params.role === 'docente' || params.role === 'teacher' ? 'teacher' : 'family';

  // Create initial profile in accordance with user requirement:
  // "Al registrarse el usuario e ingresar no debe aparecer nada si no ha configurado nada o puesto información"
  const newProfile: UserProfile = {
    id: uid,
    email: cleanEmail,
    fullName: params.fullName.trim(),
    role: normalizedRole,
    createdAt: new Date().toISOString(),
    hasConfigured: false, // starts unconfigured/empty
    institution: params.institution || 'Institución Educativa Vallejuelos',
    gradeLevel: params.gradeLevel?.trim() || '',
    studentCode: params.studentCode?.trim() || '',
    shift: params.shift?.trim() || '',
    subjectArea: params.subjectArea?.trim() || '',
    employeeId: params.employeeId?.trim() || '',
    assignedGrades: params.assignedGrades?.trim() || '',
    relationship: params.relationship?.trim() || '',
    representedStudentName: params.representedStudentName?.trim() || '',
    representedStudentCode: params.representedStudentCode?.trim() || '',
    emergencyPhone: params.emergencyPhone?.trim() || '',
    subjects: [],
    assignments: [],
    students: []
  };

  // Save to Firestore
  try {
    const emailKey = normalizeKey(cleanEmail);
    await setDoc(doc(db, 'registered_emails', emailKey), {
      email: cleanEmail,
      uid: uid,
      fullName: newProfile.fullName,
      role: newProfile.role,
      hasConfigured: false,
      registeredAt: newProfile.createdAt
    });

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
    localStorage.setItem('edulink_registered_users', JSON.stringify(localAccounts));
    localStorage.setItem('edulink_active_session', JSON.stringify(newProfile));
  } catch {
    // Ignore storage issues
  }

  return newProfile;
}

/**
 * Logs in a user.
 * STRICT ENFORCEMENT: If the user is NOT registered in the database,
 * throws an explicit error: "El usuario no está registrado en la plataforma."
 */
export async function loginUser(identifier: string, password?: string): Promise<UserProfile> {
  const cleanId = identifier.trim().toLowerCase();
  
  if (!cleanId) {
    throw new Error('Por favor ingrese su documento de identidad o correo.');
  }

  // 1. Verify if user is registered in the database
  const status = await isUserRegisteredInDatabase(cleanId);
  if (!status.registered || !status.profile) {
    // STRICT REQUIREMENT: If not registered, display that they are not registered!
    throw new Error('El usuario no está registrado en la plataforma. Por favor regístrese para continuar.');
  }

  // 2. Try Firebase Auth sign in if email is provided
  if (cleanId.includes('@') && password) {
    try {
      await signInWithEmailAndPassword(auth, cleanId, password);
    } catch (authErr: any) {
      if (authErr.code === 'auth/user-not-found') {
        throw new Error('El usuario no está registrado en la plataforma.');
      }
      // If wrong password
      if (authErr.code === 'auth/wrong-password') {
        throw new Error('Contraseña incorrecta. Por favor verifique sus datos.');
      }
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
