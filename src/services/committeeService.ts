import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc
} from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface CommitteeMember {
  id: string;
  roleTitle: string; // Statutory representation title
  name: string; // If empty or unassigned, displayed as "Cargo pendiente de asignación"
  email?: string;
  phone?: string;
  isCustomGuest?: boolean; // For additional invited guests
  notes?: string;
  updatedAt?: string;
}

// 8 Baseline Statutory Positions defined by Law 1620 of 2013 and Institutional guidelines
export const STATUTORY_COMMITTEE_ROLES: { id: string; roleTitle: string; defaultName?: string }[] = [
  { id: 'com_docente_primaria', roleTitle: 'Docente representante de primaria', defaultName: '' },
  { id: 'com_docente_secundaria', roleTitle: 'Docente representante de secundaria', defaultName: '' },
  { id: 'com_rep_estudiantes', roleTitle: 'Representante de los estudiantes', defaultName: '' },
  { id: 'com_coord_convivencia', roleTitle: 'Coordinador o coordinadora de convivencia', defaultName: 'Lic. Viviana Giraldo' },
  { id: 'com_rector', roleTitle: 'Rector', defaultName: 'Lic. Alejandra Moreno' },
  { id: 'com_psicologa', roleTitle: 'Psicóloga de la institución', defaultName: '' },
  { id: 'com_personero', roleTitle: 'Personero estudiantil', defaultName: '' },
  { id: 'com_acudiente', roleTitle: 'Acudiente o padre de familia de un estudiante de cualquier grupo', defaultName: '' },
];

/**
 * Loads committee members from Firestore `coexistence_committee`.
 * Guarantees all 8 statutory roles are present. If a role has not been assigned a real name,
 * it leaves the name blank so the UI displays "Cargo pendiente de asignación".
 */
export async function fetchCommitteeMembers(): Promise<CommitteeMember[]> {
  try {
    const colRef = collection(db, 'coexistence_committee');
    const snap = await getDocs(colRef);

    const membersMap = new Map<string, CommitteeMember>();

    // Load any existing records in Firestore
    snap.forEach((d) => {
      const data = d.data() as CommitteeMember;
      membersMap.set(d.id, {
        ...data,
        id: d.id
      });
    });

    // Ensure all 8 statutory roles exist
    const result: CommitteeMember[] = [];
    for (const statutory of STATUTORY_COMMITTEE_ROLES) {
      if (membersMap.has(statutory.id)) {
        result.push(membersMap.get(statutory.id)!);
      } else {
        const defaultItem: CommitteeMember = {
          id: statutory.id,
          roleTitle: statutory.roleTitle,
          name: statutory.defaultName || '',
          email: '',
          phone: '',
          isCustomGuest: false
        };
        result.push(defaultItem);
      }
    }

    // Append any additional guests
    membersMap.forEach((member, id) => {
      if (!STATUTORY_COMMITTEE_ROLES.some((s) => s.id === id)) {
        result.push(member);
      }
    });

    return result;
  } catch (error) {
    console.warn('Error reading committee from Firestore, falling back to statutory base:', error);
    return STATUTORY_COMMITTEE_ROLES.map((s) => ({
      id: s.id,
      roleTitle: s.roleTitle,
      name: s.defaultName || '',
      email: '',
      phone: '',
      isCustomGuest: false
    }));
  }
}

/**
 * Saves or updates a committee member in Firestore `coexistence_committee`.
 */
export async function saveCommitteeMember(member: CommitteeMember): Promise<void> {
  const memberId = member.id || `guest_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const docRef = doc(db, 'coexistence_committee', memberId);

  const payload: CommitteeMember = {
    ...member,
    id: memberId,
    roleTitle: member.roleTitle.trim(),
    name: member.name.trim(),
    email: member.email?.trim() || '',
    phone: member.phone?.trim() || '',
    isCustomGuest: Boolean(member.isCustomGuest),
    updatedAt: new Date().toISOString()
  };

  await setDoc(docRef, payload, { merge: true });
}

/**
 * Removes a guest or unassigns a statutory position in Firestore.
 */
export async function deleteCommitteeMember(memberId: string): Promise<void> {
  if (!memberId) return;

  const isStatutory = STATUTORY_COMMITTEE_ROLES.some((s) => s.id === memberId);
  const docRef = doc(db, 'coexistence_committee', memberId);

  if (isStatutory) {
    // For statutory, reset name to blank (Pending assignment)
    const statDef = STATUTORY_COMMITTEE_ROLES.find((s) => s.id === memberId);
    await setDoc(docRef, {
      id: memberId,
      roleTitle: statDef?.roleTitle || 'Representante',
      name: '',
      email: '',
      phone: '',
      isCustomGuest: false,
      updatedAt: new Date().toISOString()
    });
  } else {
    // Delete custom guest
    await deleteDoc(docRef);
  }
}
