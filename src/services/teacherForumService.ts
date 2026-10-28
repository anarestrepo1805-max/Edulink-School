import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  deleteDoc,
  updateDoc,
  query,
  where,
  orderBy
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import {
  InstitutionalPublicationDoc,
  PublicationSurveyOption,
  PublicationSurveyResponse
} from '../types';

export interface SurveyResultsData {
  totalVotes: number;
  options: {
    id: string;
    text: string;
    votes: number;
    percentage: number;
  }[];
  responses: PublicationSurveyResponse[];
}

/**
 * Fetches publications created by teachers or institutional staff.
 */
export async function fetchTeacherPublications(
  authorName?: string,
  authorEmail?: string
): Promise<InstitutionalPublicationDoc[]> {
  try {
    const colRef = collection(db, 'institutional_publications');
    const snapshot = await getDocs(colRef);

    if (snapshot.empty) {
      return [];
    }

    const items: InstitutionalPublicationDoc[] = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data() as InstitutionalPublicationDoc;
      items.push({
        ...data,
        id: docSnap.id
      });
    });

    // Sort by createdAt descending
    items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return items;
  } catch (err) {
    console.warn('Error fetching teacher publications:', err);
    return [];
  }
}

/**
 * Saves or updates a forum post or survey in Firestore.
 */
export async function saveTeacherPublication(
  publication: Omit<InstitutionalPublicationDoc, 'id'> & { id?: string }
): Promise<InstitutionalPublicationDoc> {
  const colRef = collection(db, 'institutional_publications');
  const docId = publication.id || `pub_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const docRef = doc(colRef, docId);

  const cleanOptions: PublicationSurveyOption[] = (publication.surveyOptions || []).map((opt, idx) => ({
    id: opt.id || `opt_${idx + 1}`,
    text: opt.text.trim(),
    votesCount: opt.votesCount || 0
  }));

  const payload: InstitutionalPublicationDoc = {
    id: docId,
    title: publication.title.trim(),
    content: publication.content.trim(),
    category: publication.category || 'general',
    authorName: publication.authorName || 'Docente Institucional',
    authorRole: publication.authorRole || 'docente',
    authorEmail: publication.authorEmail || '',
    targetGrades: publication.targetGrades && publication.targetGrades.length > 0 ? publication.targetGrades : ['all'],
    createdAt: publication.createdAt || new Date().toISOString(),
    hasSurvey: Boolean(publication.hasSurvey),
    surveyQuestion: publication.surveyQuestion?.trim() || '',
    surveyOptions: cleanOptions,
    status: publication.status || 'published'
  };

  await setDoc(docRef, payload, { merge: true });
  return payload;
}

/**
 * Deletes a publication from Firestore.
 */
export async function deleteTeacherPublication(publicationId: string): Promise<void> {
  if (!publicationId) return;
  const docRef = doc(db, 'institutional_publications', publicationId);
  await deleteDoc(docRef);
}

/**
 * Toggles status between 'published' and 'draft' (e.g. closing or reopening a poll).
 */
export async function togglePublicationStatus(
  publicationId: string,
  currentStatus: 'published' | 'draft'
): Promise<'published' | 'draft'> {
  const newStatus = currentStatus === 'published' ? 'draft' : 'published';
  const docRef = doc(db, 'institutional_publications', publicationId);
  await updateDoc(docRef, { status: newStatus });
  return newStatus;
}

/**
 * Fetches live survey responses and computes percentage distribution.
 */
export async function fetchSurveyResults(publication: InstitutionalPublicationDoc): Promise<SurveyResultsData> {
  const responsesCol = collection(db, 'institutional_publications', publication.id, 'responses');
  const snap = await getDocs(responsesCol);

  const responses: PublicationSurveyResponse[] = [];
  snap.forEach((d) => {
    responses.push(d.data() as PublicationSurveyResponse);
  });

  const totalVotes = responses.length;
  const countsMap = new Map<string, number>();

  responses.forEach((r) => {
    countsMap.set(r.optionId, (countsMap.get(r.optionId) || 0) + 1);
  });

  const options = (publication.surveyOptions || []).map((opt) => {
    const votes = countsMap.get(opt.id) || 0;
    const percentage = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;
    return {
      id: opt.id,
      text: opt.text,
      votes,
      percentage
    };
  });

  return {
    totalVotes,
    options,
    responses
  };
}
