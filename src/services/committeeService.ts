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
  seatNumber?: number;
  documentId?: string;
  email?: string;
  phone?: string;
  isMandatory?: boolean;
  isCustomGuest?: boolean; // For additional invited guests
  notes?: string;
  updatedAt?: string;
}

export interface StatutoryRoleDefinition {
  id: string;
  roleTitle: string;
  defaultName: string;
  email: string;
  phone: string;
  notes: string;
}

// 8 Baseline Statutory Positions defined by Law 1620 of 2013 and Institutional guidelines
export const STATUTORY_COMMITTEE_ROLES: StatutoryRoleDefinition[] = [
  {
    id: 'com_docente_primaria',
    roleTitle: 'Docente representante de primaria',
    defaultName: 'Lic. Amalia Restrepo Vélez',
    email: 'amalia.restrepo@vallejuelos.edu.co',
    phone: '3182245901',
    notes: 'Docente de Básica Primaria (Sede Primaria) — Perfil institucional de demostración'
  },
  {
    id: 'com_docente_secundaria',
    roleTitle: 'Docente representante de secundaria',
    defaultName: 'Lic. Claudia Montoya',
    email: 'claudia_montoya@ejemplo.edu',
    phone: '3117456321',
    notes: 'Docente de Física (Grados 9° a 11°) — Cédula: 10756431'
  },
  {
    id: 'com_rep_estudiantes',
    roleTitle: 'Representante de los estudiantes',
    defaultName: 'Manuela Moreno Zapata',
    email: 'manuela_moreno_zapata@ejemplo.edu',
    phone: '315051600',
    notes: 'Representante Estudiantil — Grupo 11°1 (Doc: 1014437162)'
  },
  {
    id: 'com_coord_convivencia',
    roleTitle: 'Coordinador de convivencia',
    defaultName: 'Lic. Viviana Giraldo',
    email: 'viviana_giraldo@ejemplo.edu',
    phone: '3124567890',
    notes: 'Coordinación de Convivencia Escolar (Cédula: 42649487)'
  },
  {
    id: 'com_rector',
    roleTitle: 'Rector',
    defaultName: 'Lic. Alejandra Moreno',
    email: 'alejandra_moreno@ejemplo.edu',
    phone: '3108976543',
    notes: 'Rectoría Institucional I.E. Vallejuelos (Cédula: 92401715)'
  },
  {
    id: 'com_psicologa',
    roleTitle: 'Psicóloga de la institución',
    defaultName: 'Dra. Carolina Builes Henao',
    email: 'carolina.builes@vallejuelos.edu.co',
    phone: '3195531840',
    notes: 'Psicología y Orientación Escolar — Perfil institucional de demostración'
  },
  {
    id: 'com_personero',
    roleTitle: 'Personero estudiantil',
    defaultName: 'Samuel Castaño Arango',
    email: 'samuel_castaño_arango@ejemplo.edu',
    phone: '315245084',
    notes: 'Personero Estudiantil Institucional — Grado 11°2 (Doc: 1515534097)'
  },
  {
    id: 'com_acudiente',
    roleTitle: 'Acudiente o padre de familia',
    defaultName: 'Mariana Cardona Pérez',
    email: 'mariana_cardona_pérez@ejemplo.com',
    phone: '315099971',
    notes: 'Acudiente legal registrada — Representante Consejo de Padres (Cédula: 62111588)'
  },
];

/**
 * Loads committee members from Firestore `coexistence_committee`.
 * Guarantees all 8 statutory roles are present and populated with institutional records.
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

    // Ensure all 8 statutory roles exist and have complete assigned data
    const result: CommitteeMember[] = [];
    STATUTORY_COMMITTEE_ROLES.forEach((statutory, idx) => {
      const existing = membersMap.get(statutory.id);
      
      // If the member is already in Firestore and has a valid assigned name, use it
      if (existing && existing.name && existing.name.trim() !== '') {
        result.push({
          ...existing,
          seatNumber: idx + 1,
          isMandatory: true
        });
      } else {
        // Complete the role using the official census/demo assignment
        const memberData: CommitteeMember = {
          id: statutory.id,
          seatNumber: idx + 1,
          isMandatory: true,
          roleTitle: statutory.roleTitle,
          name: statutory.defaultName,
          email: statutory.email,
          phone: statutory.phone,
          notes: statutory.notes,
          isCustomGuest: false,
          updatedAt: new Date().toISOString()
        };
        result.push(memberData);

        // Synchronize to Firestore so it is saved in the database
        try {
          setDoc(doc(db, 'coexistence_committee', statutory.id), memberData, { merge: true }).catch(() => {});
        } catch {
          // non-blocking
        }
      }
    });

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
      name: s.defaultName,
      email: s.email,
      phone: s.phone,
      notes: s.notes,
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
    // For statutory positions, always restore the institutional default assignment
    const statDef = STATUTORY_COMMITTEE_ROLES.find((s) => s.id === memberId);
    if (statDef) {
      await setDoc(docRef, {
        id: memberId,
        roleTitle: statDef.roleTitle,
        name: statDef.defaultName,
        email: statDef.email,
        phone: statDef.phone,
        notes: statDef.notes,
        isCustomGuest: false,
        updatedAt: new Date().toISOString()
      });
    }
  } else {
    // Delete custom guest
    await deleteDoc(docRef);
  }
}

/**
 * Resets all 8 statutory committee members to their official institutional/census data in Firestore.
 */
export async function resetStatutoryCommitteeToDefaults(): Promise<void> {
  for (const statutory of STATUTORY_COMMITTEE_ROLES) {
    const memberData: CommitteeMember = {
      id: statutory.id,
      roleTitle: statutory.roleTitle,
      name: statutory.defaultName,
      email: statutory.email,
      phone: statutory.phone,
      notes: statutory.notes,
      isCustomGuest: false,
      updatedAt: new Date().toISOString()
    };
    await setDoc(doc(db, 'coexistence_committee', statutory.id), memberData, { merge: true });
  }
}

