import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  query,
  where
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { UpcomingAssignment } from '../types';

export interface StudentSubmission {
  id: string;
  assignmentId: string;
  studentId: string;
  studentName: string;
  studentDocumentId: string;
  studentCode: string;
  gradeLevel: string;
  files: { name: string; size: string }[];
  notes?: string;
  submittedAt: string;
  status: 'submitted' | 'graded';
  score?: number;
}

export interface InstitutionalAssignmentDoc {
  id: string;
  title: string;
  subject: string;
  subjectColor?: string;
  gradeLevel: string; // e.g. '11-1', '11-2', '10-1', '6-1', '11'
  group?: string;     // e.g. '11-1', '11-2'
  shift?: string;
  teacherName: string;
  teacherId?: string;
  dueDate: string;
  dueText: string;
  urgency: 'urgente' | 'regular';
  isPublished: boolean;
  type?: string;
  typeIcon?: string;
  points?: string;
  instructions?: string;
  borderAccent?: string;
  createdAt: string;
}

/**
 * Checks whether an assignment matches a student's grade, group, and shift.
 * Adheres strictly to institutional assignments:
 * - Grade 11 assignments are only for Grade 11 students.
 * - Group-specific assignments (e.g. 11-1 vs 11-2) are filtered strictly.
 * - Unpublished assignments are never matched.
 */
export function doesAssignmentMatchStudent(
  data: InstitutionalAssignmentDoc,
  studentGradeLevel?: string,
  studentGroup?: string,
  studentShift?: string
): boolean {
  if (!data.isPublished) return false;

  const targetGrade = (data.gradeLevel || '').trim().toLowerCase();
  if (targetGrade === 'all' || targetGrade === 'todos') {
    return true;
  }

  const studentFull = `${studentGradeLevel || ''} ${studentGroup || ''}`.toLowerCase();

  // Extract main grade numbers: 6, 7, 8, 9, 10, 11
  const studentGradeMatch = studentFull.match(/\b(1[0-1]|[6-9])\b/);
  const studentMainGrade = studentGradeMatch ? studentGradeMatch[1] : '';

  const targetGradeMatch = targetGrade.match(/\b(1[0-1]|[6-9])\b/);
  const targetMainGrade = targetGradeMatch ? targetGradeMatch[1] : '';

  // If both have explicit main grade numbers and they differ, no match
  if (targetMainGrade && studentMainGrade && targetMainGrade !== studentMainGrade) {
    return false;
  }

  // Check section/group match if target specifies a group e.g. "11-1" vs "11-2"
  const cleanTarget = targetGrade.replace(/grado/g, '').replace(/[°º\s]/g, '').trim();
  const cleanStudent = studentFull.replace(/grado/g, '').replace(/[°º\s]/g, '').trim();

  const targetSectionMatch = cleanTarget.match(/(1[0-1]|[6-9])[-_]?([1-9]|[a-d])/);
  if (targetSectionMatch) {
    const targetSec = `${targetSectionMatch[1]}-${targetSectionMatch[2]}`;
    const studentSectionMatch = cleanStudent.match(/(1[0-1]|[6-9])[-_]?([1-9]|[a-d])/);
    if (studentSectionMatch) {
      const studentSec = `${studentSectionMatch[1]}-${studentSectionMatch[2]}`;
      if (targetSec !== studentSec) {
        return false;
      }
    }
  }

  // Check shift if specified
  if (data.shift && studentShift) {
    const aShift = data.shift.toLowerCase();
    const sShift = studentShift.toLowerCase();
    if ((aShift.includes('mañana') || aShift.includes('morning')) && (sShift.includes('tarde') || sShift.includes('afternoon'))) {
      return false;
    }
    if ((aShift.includes('tarde') || aShift.includes('afternoon')) && (sShift.includes('mañana') || sShift.includes('morning'))) {
      return false;
    }
  }

  return true;
}

/**
 * Fetches only real assignments published by authorized teachers in Firestore.
 * Does NOT generate mock, demo, or fallback items.
 * If Firestore has no published assignments for this student's grade/group, returns [].
 */
export async function fetchPublishedAssignmentsForStudent(
  studentGradeLevel?: string,
  studentGroup?: string,
  studentShift?: string
): Promise<UpcomingAssignment[]> {
  try {
    const assignmentsRef = collection(db, 'assignments');
    const q = query(assignmentsRef, where('isPublished', '==', true));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return [];
    }

    const items: UpcomingAssignment[] = [];
    querySnapshot.forEach((docSnap) => {
      const data = { id: docSnap.id, ...docSnap.data() } as InstitutionalAssignmentDoc;
      if (!data.isPublished) return;

      if (doesAssignmentMatchStudent(data, studentGradeLevel, studentGroup, studentShift)) {
        items.push({
          id: docSnap.id,
          title: data.title,
          subject: data.subject,
          subjectColor: data.subjectColor || 'text-cyan-600',
          dueDate: data.dueDate || '',
          dueText: data.dueText || data.dueDate || '',
          type: data.type || 'Archivo PDF',
          typeIcon: data.typeIcon || 'assignment',
          points: data.points || '100 pts',
          urgency: data.urgency || 'regular',
          borderAccent: data.borderAccent || 'border-l-4 border-cyan-500'
        });
      }
    });

    return items;
  } catch (err) {
    console.warn('Error fetching published assignments from Firestore:', err);
    throw err; // Propagate error so calling component can distinguish error from empty!
  }
}

/**
 * Fetches full assignment details for an authenticated student's published assignments.
 */
export async function fetchDetailedPublishedAssignmentsForStudent(
  studentGradeLevel?: string,
  studentGroup?: string,
  studentShift?: string
): Promise<InstitutionalAssignmentDoc[]> {
  try {
    const assignmentsRef = collection(db, 'assignments');
    const q = query(assignmentsRef, where('isPublished', '==', true));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return [];
    }

    const items: InstitutionalAssignmentDoc[] = [];
    querySnapshot.forEach((docSnap) => {
      const data = { id: docSnap.id, ...docSnap.data() } as InstitutionalAssignmentDoc;
      if (!data.isPublished) return;

      if (doesAssignmentMatchStudent(data, studentGradeLevel, studentGroup, studentShift)) {
        items.push(data);
      }
    });

    return items;
  } catch (err) {
    console.warn('Error fetching detailed assignments from Firestore:', err);
    throw err;
  }
}

/**
 * Fetches a single published assignment by its Firestore ID.
 */
export async function fetchAssignmentById(assignmentId: string): Promise<InstitutionalAssignmentDoc | null> {
  if (!assignmentId) return null;
  try {
    const docRef = doc(db, 'assignments', assignmentId);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return { id: snap.id, ...snap.data() } as InstitutionalAssignmentDoc;
    }
  } catch (err) {
    console.warn('Error fetching assignment by id:', err);
  }
  return null;
}

/**
 * Fetches the real submission made by a specific student for a specific assignment.
 * Returns null if no submission exists in Firestore (never generates fake submissions).
 */
export async function fetchStudentSubmission(
  assignmentId: string,
  studentId: string
): Promise<StudentSubmission | null> {
  if (!assignmentId || !studentId) return null;

  try {
    const submissionDocRef = doc(db, 'submissions', `${assignmentId}_${studentId}`);
    const snap = await getDoc(submissionDocRef);

    if (snap.exists()) {
      return {
        id: snap.id,
        ...(snap.data() as Omit<StudentSubmission, 'id'>)
      };
    }
  } catch (err) {
    console.warn('Error fetching student submission from Firestore:', err);
    throw err;
  }

  return null;
}

/**
 * Saves a real submission by the authenticated student to Firestore.
 */
export async function saveStudentSubmission(params: {
  assignmentId: string;
  studentId: string;
  studentName: string;
  studentDocumentId: string;
  studentCode: string;
  gradeLevel: string;
  files: { name: string; size: string }[];
  notes?: string;
}): Promise<StudentSubmission> {
  const submissionId = `${params.assignmentId}_${params.studentId}`;
  const submissionData: Omit<StudentSubmission, 'id'> = {
    assignmentId: params.assignmentId,
    studentId: params.studentId,
    studentName: params.studentName,
    studentDocumentId: params.studentDocumentId || '',
    studentCode: params.studentCode || '',
    gradeLevel: params.gradeLevel || '',
    files: params.files,
    notes: params.notes || '',
    submittedAt: new Date().toISOString(),
    status: 'submitted'
  };

  await setDoc(doc(db, 'submissions', submissionId), submissionData);

  return {
    id: submissionId,
    ...submissionData
  };
}

/**
 * Counts real submissions made by a specific student.
 */
export async function countStudentSubmissions(studentId: string): Promise<number> {
  if (!studentId) return 0;
  try {
    const q = query(collection(db, 'submissions'), where('studentId', '==', studentId));
    const snap = await getDocs(q);
    return snap.size;
  } catch {
    return 0;
  }
}

/**
 * Publishes an institutional assignment to Firestore (by an authorized teacher or administrator).
 */
export async function publishInstitutionalAssignment(assignment: {
  id?: string;
  title: string;
  subject: string;
  subjectColor?: string;
  gradeLevel: string;
  shift?: string;
  teacherName: string;
  teacherId?: string;
  dueDate: string;
  dueText?: string;
  urgency?: 'urgente' | 'regular';
  isPublished?: boolean;
  type?: string;
  typeIcon?: string;
  points?: string;
  instructions?: string;
  borderAccent?: string;
}): Promise<InstitutionalAssignmentDoc> {
  const assignmentId = assignment.id || `assign_${Date.now()}`;
  const docData: InstitutionalAssignmentDoc = {
    id: assignmentId,
    title: assignment.title,
    subject: assignment.subject,
    subjectColor: assignment.subjectColor || 'text-cyan-600',
    gradeLevel: assignment.gradeLevel,
    shift: assignment.shift || 'Jornada Mañana',
    teacherName: assignment.teacherName,
    teacherId: assignment.teacherId || '',
    dueDate: assignment.dueDate,
    dueText: assignment.dueText || assignment.dueDate,
    urgency: assignment.urgency || 'regular',
    isPublished: assignment.isPublished !== undefined ? assignment.isPublished : true,
    type: assignment.type || 'Archivo PDF',
    typeIcon: assignment.typeIcon || 'assignment',
    points: assignment.points || '100 pts',
    instructions: assignment.instructions || '',
    borderAccent: assignment.borderAccent || 'border-l-4 border-cyan-500',
    createdAt: new Date().toISOString()
  };

  await setDoc(doc(db, 'assignments', assignmentId), docData);
  return docData;
}
