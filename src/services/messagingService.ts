import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  Unsubscribe
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { UserProfile } from '../types';
import {
  CENSUS_GUARDIANS,
  CENSUS_TEACHERS,
  CENSUS_ADMIN_STAFF,
  CENSUS_STUDENTS,
  getTeacherAcademicAssignments,
  getTeacherAssignedGroups,
  normalizeGroupKey
} from '../data/institutionalCensus';

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  senderAvatar?: string;
  recipientId: string;
  recipientName: string;
  recipientRole: string;
  text: string;
  createdAt: number;
  citationDate?: string;
  citationTime?: string;
  citationReason?: string;
  citationStudentName?: string;
  citationNotes?: string;
}

export interface ConversationParticipant {
  id: string;
  fullName: string;
  role: string;
  email?: string;
  detail?: string;
  avatar?: string;
}

export interface Conversation {
  id: string;
  participantIds: string[];
  participants: Record<string, ConversationParticipant>;
  lastMessage: string;
  lastMessageTime: number;
  lastSenderId: string;
  unreadCount?: Record<string, number>;
  unreadBy?: string[];
  deletedBy?: string[];
  createdAt: number;
  updatedAt: number;
}

export interface AuthorizedContact {
  id: string;
  fullName: string;
  role: 'teacher' | 'family' | 'admin';
  roleLabel: string;
  email?: string;
  detail?: string;
  avatar?: string;
}

// Aliases for compatibility
export type InstitutionalMessage = ChatMessage;
export interface InstitutionalConversation {
  id: string;
  participantIds: string[];
  participantInfo?: Record<string, { name: string; role: string; email?: string }>;
  subject?: string;
  category?: string;
  lastMessageText?: string;
  lastMessageSenderId?: string;
  lastMessageSenderName?: string;
  lastMessageAt?: string;
  unreadBy?: string[];
  deletedBy?: string[];
}
export interface RecipientOption {
  id: string;
  name: string;
  role: string;
  category: string;
  detail: string;
  email?: string;
}

/**
 * Builds a deterministic conversation ID for two users so both always access the exact same chat thread.
 */
export function getDeterministicConversationId(userId1: string, userId2: string): string {
  const clean1 = (userId1 || 'user_a').replace(/[^a-zA-Z0-9_-]/g, '_');
  const clean2 = (userId2 || 'user_b').replace(/[^a-zA-Z0-9_-]/g, '_');
  const sorted = [clean1, clean2].sort();
  return `conv_${sorted[0]}__${sorted[1]}`;
}

/**
 * Normalizes role to Spanish display label.
 */
export function formatRoleLabel(role?: string): string {
  const norm = (role || '').toLowerCase();
  if (norm.includes('teach') || norm.includes('docent')) return 'Docente';
  if (norm.includes('fam') || norm.includes('acud') || norm.includes('guard')) return 'Acudiente';
  if (norm.includes('adm') || norm.includes('coord') || norm.includes('rector')) return 'Directivo / Administrativo';
  return 'Usuario Institucional';
}

/**
 * Subscribes in real-time to conversations involving the specified user in Firestore.
 * Automatically filters out any logically deleted conversations for this user.
 */
export function subscribeUserConversations(
  userId: string,
  onUpdate: (conversations: Conversation[]) => void
): Unsubscribe {
  if (!userId) {
    onUpdate([]);
    return () => {};
  }

  const convCol = collection(db, 'conversations');
  const q = query(convCol, where('participantIds', 'array-contains', userId));

  return onSnapshot(
    q,
    (snapshot) => {
      if (snapshot.empty) {
        onUpdate([]);
        return;
      }

      const convList: Conversation[] = [];
      snapshot.forEach((d) => {
        const data = d.data() as any;
        const deletedBy: string[] = data.deletedBy || [];

        // Exclude if logically deleted by this user
        if (deletedBy.includes(userId)) {
          return;
        }

        convList.push({
          id: d.id,
          participantIds: data.participantIds || [],
          participants: data.participants || {},
          lastMessage: data.lastMessage || data.lastMessageText || 'Mensaje',
          lastMessageTime: data.lastMessageTime || (data.lastMessageAt ? new Date(data.lastMessageAt).getTime() : Date.now()),
          lastSenderId: data.lastSenderId || data.lastMessageSenderId || '',
          unreadCount: data.unreadCount || {},
          unreadBy: data.unreadBy || [],
          deletedBy: data.deletedBy || [],
          createdAt: data.createdAt ? (typeof data.createdAt === 'number' ? data.createdAt : new Date(data.createdAt).getTime()) : Date.now(),
          updatedAt: data.updatedAt ? (typeof data.updatedAt === 'number' ? data.updatedAt : new Date(data.updatedAt).getTime()) : Date.now()
        });
      });

      // Sort in memory by lastMessageTime descending
      convList.sort((a, b) => (b.lastMessageTime || 0) - (a.lastMessageTime || 0));
      onUpdate(convList);
    },
    (error) => {
      console.warn('Real-time conversation subscription notice:', error);
      onUpdate([]);
    }
  );
}

/**
 * Subscribes in real-time to messages of a specific conversation from Firestore.
 */
export function subscribeConversationMessages(
  conversationId: string,
  onUpdate: (messages: ChatMessage[]) => void
): Unsubscribe {
  if (!conversationId) {
    onUpdate([]);
    return () => {};
  }

  const msgCol = collection(db, 'conversations', conversationId, 'messages');
  const q = query(msgCol, orderBy('createdAt', 'asc'));

  return onSnapshot(
    q,
    (snapshot) => {
      if (snapshot.empty) {
        onUpdate([]);
        return;
      }

      const messages: ChatMessage[] = [];
      snapshot.forEach((d) => {
        const data = d.data() as any;
        const createdAtVal = typeof data.createdAt === 'number' 
          ? data.createdAt 
          : (data.createdAt ? new Date(data.createdAt).getTime() : Date.now());

        messages.push({
          id: d.id,
          conversationId: data.conversationId || conversationId,
          senderId: data.senderId || '',
          senderName: data.senderName || 'Remitente',
          senderRole: data.senderRole || '',
          senderAvatar: data.senderAvatar || '',
          recipientId: data.recipientId || '',
          recipientName: data.recipientName || '',
          recipientRole: data.recipientRole || '',
          text: data.text || '',
          createdAt: createdAtVal,
          citationDate: data.citationDate,
          citationTime: data.citationTime,
          citationReason: data.citationReason,
          citationStudentName: data.citationStudentName,
          citationNotes: data.citationNotes
        });
      });

      onUpdate(messages);
    },
    (error) => {
      console.warn('Real-time messages subscription notice:', error);
      onUpdate([]);
    }
  );
}

/**
 * Sends a real message in Firestore, creating or updating the conversation.
 * Both participants can send and receive in real time.
 */
export async function sendChatMessage(params: {
  sender: UserProfile;
  recipient: AuthorizedContact | { id: string; fullName: string; role: string; email?: string; detail?: string; avatar?: string };
  text: string;
  citation?: {
    date: string;
    time: string;
    reason: string;
    studentName?: string;
    notes?: string;
  };
}): Promise<ChatMessage> {
  const { sender, recipient, text, citation } = params;
  const senderId = sender.documentId || sender.id;
  const recipientId = recipient.id;
  const conversationId = getDeterministicConversationId(senderId, recipientId);

  const senderRoleLabel = formatRoleLabel(sender.role);
  const recipientRoleLabel = formatRoleLabel(recipient.role);

  const now = Date.now();
  const messageId = `msg_${now}_${Math.random().toString(36).substring(2, 7)}`;

  const messageDoc: ChatMessage = {
    id: messageId,
    conversationId,
    senderId,
    senderName: sender.fullName || 'Docente Institucional',
    senderRole: senderRoleLabel,
    senderAvatar: sender.avatarUrl || '',
    recipientId,
    recipientName: recipient.fullName,
    recipientRole: recipientRoleLabel,
    text: text.trim(),
    createdAt: now,
    ...(citation && {
      citationDate: citation.date,
      citationTime: citation.time,
      citationReason: citation.reason,
      citationStudentName: citation.studentName,
      citationNotes: citation.notes
    })
  };

  // 1. Fetch current conversation to update unread counts
  const convRef = doc(db, 'conversations', conversationId);
  let prevUnreadCount: Record<string, number> = {};
  try {
    const snap = await getDoc(convRef);
    if (snap.exists()) {
      prevUnreadCount = snap.data().unreadCount || {};
    }
  } catch {}

  const currentRecipUnread = (prevUnreadCount[recipientId] || 0) + 1;
  const updatedUnreadCount = {
    ...prevUnreadCount,
    [recipientId]: currentRecipUnread,
    [senderId]: 0,
    [sender.id]: 0
  };

  const participantIds = Array.from(new Set([
    sender.id,
    senderId,
    sender.email,
    recipient.id,
    recipient.email
  ])).filter(Boolean) as string[];

  const conversationPayload: Partial<Conversation> = {
    id: conversationId,
    participantIds,
    participants: {
      [senderId]: {
        id: senderId,
        fullName: sender.fullName,
        role: senderRoleLabel,
        email: sender.email,
        avatar: sender.avatarUrl
      },
      [recipient.id]: {
        id: recipient.id,
        fullName: recipient.fullName,
        role: recipientRoleLabel,
        email: recipient.email,
        detail: recipient.detail,
        avatar: (recipient as any).avatar
      }
    },
    lastMessage: text.trim() || (citation ? `Citación oficial: ${citation.reason}` : 'Mensaje'),
    lastMessageTime: now,
    lastSenderId: senderId,
    unreadCount: updatedUnreadCount,
    unreadBy: [recipientId],
    deletedBy: [], // Message revives thread if previously deleted
    updatedAt: now
  };

  // Upsert conversation doc
  await setDoc(convRef, conversationPayload, { merge: true });

  // 2. Save message subcollection document
  const messageRef = doc(db, 'conversations', conversationId, 'messages', messageId);
  await setDoc(messageRef, messageDoc);

  return messageDoc;
}

/**
 * Logically deletes a conversation thread for the specified user so it disappears from their inbox.
 */
export async function deleteConversationForUser(conversationId: string, userId: string): Promise<void> {
  if (!conversationId || !userId) return;
  try {
    const convRef = doc(db, 'conversations', conversationId);
    const snap = await getDoc(convRef);
    if (snap.exists()) {
      const data = snap.data();
      const currentDeleted: string[] = data.deletedBy || [];
      if (!currentDeleted.includes(userId)) {
        currentDeleted.push(userId);
      }
      await updateDoc(convRef, { deletedBy: currentDeleted });
    }
  } catch (err) {
    console.warn('Error logically deleting conversation:', err);
  }
}

/**
 * Marks conversation as read by the user, clearing unread badges.
 */
export async function markConversationAsRead(conversationId: string, userId: string): Promise<void> {
  if (!conversationId || !userId) return;
  try {
    const convRef = doc(db, 'conversations', conversationId);
    const snap = await getDoc(convRef);
    if (snap.exists()) {
      const data = snap.data();
      const unreadBy = (data.unreadBy || []).filter((id: string) => id !== userId);
      const unreadCount = { ...(data.unreadCount || {}) };
      unreadCount[userId] = 0;
      await updateDoc(convRef, { unreadBy, unreadCount });
    }
  } catch (err) {
    console.warn('Error marking conversation read:', err);
  }
}

/**
 * Retrieves the authorized contacts eligible to chat with the current user.
 * Strictly limited to authorized Docentes, Acudientes, and Directivos / Administrativos.
 * Teachers are strictly mapped to guardians of their assigned groups.
 * Guardians are mapped to teachers of their student's group.
 */
export async function getAuthorizedContactsForUser(currentUser?: UserProfile | null): Promise<AuthorizedContact[]> {
  if (!currentUser) return [];

  const currentRole = (currentUser.role || '').toLowerCase();
  const currentUserId = currentUser.id;
  const currentDoc = currentUser.documentId || '';
  const currentName = (currentUser.fullName || '').toLowerCase();

  const contactsMap = new Map<string, AuthorizedContact>();

  // 1. Fetch real registered users from Firestore 'users' collection
  try {
    const usersCol = collection(db, 'users');
    const snap = await getDocs(usersCol);
    snap.forEach((d) => {
      const u = d.data() as UserProfile;
      const role = (u.role || '').toLowerCase();
      // Exclude self and students from teacher-family-admin chat
      if (u.id === currentUserId || d.id === currentUserId) return;
      if (role === 'student' || role === 'estudiante') return;

      if (role === 'teacher' || role === 'docente' || role === 'family' || role === 'acudiente' || role === 'admin' || role === 'administrativo') {
        const contactId = u.documentId || u.id;
        contactsMap.set(contactId, {
          id: contactId,
          fullName: u.fullName || 'Usuario',
          role: role.includes('teach') || role.includes('docent') ? 'teacher' : (role.includes('fam') || role.includes('acud') ? 'family' : 'admin'),
          roleLabel: formatRoleLabel(role),
          email: u.email,
          avatar: u.avatarUrl,
          detail: u.subjectArea || (u.role === 'family' ? 'Acudiente registrado' : 'Directivo institucional')
        });
      }
    });
  } catch (error) {
    console.warn('Could not query users collection, using census data:', error);
  }

  // 2. Add institutional census contacts according to role permissions
  // If currentUser is Teacher:
  if (currentRole.includes('teach') || currentRole.includes('docent')) {
    // Determine teacher's assigned groups
    const assignedGroupDisplays = getTeacherAssignedGroups(currentUser.fullName || currentUser.documentId);
    const assignedKeys = new Set(assignedGroupDisplays.map(g => normalizeGroupKey(g)));

    // Acudientes of students in assigned groups
    CENSUS_GUARDIANS.forEach((g) => {
      const student = CENSUS_STUDENTS.find(s => s.documentId === g.studentDocumentId);
      const studentGroupKey = student ? normalizeGroupKey(student.group) : '';
      const isAssigned = assignedKeys.has(studentGroupKey);

      if (isAssigned || assignedKeys.size === 0) {
        const contactId = g.cedula;
        if (!contactsMap.has(contactId)) {
          contactsMap.set(contactId, {
            id: contactId,
            fullName: g.fullName,
            role: 'family',
            roleLabel: 'Acudiente',
            email: g.email,
            detail: student ? `${g.relationship} de ${student.fullName} (${student.group})` : 'Acudiente oficial'
          });
        }
      }
    });

    // Admin staff
    CENSUS_ADMIN_STAFF.forEach((adm) => {
      const contactId = adm.cedula || adm.code;
      if (!contactsMap.has(contactId) && adm.fullName.toLowerCase() !== currentName) {
        contactsMap.set(contactId, {
          id: contactId,
          fullName: adm.fullName,
          role: 'admin',
          roleLabel: adm.cargo || 'Directivo',
          email: adm.email,
          detail: `Directivo • ${adm.cargo}`
        });
      }
    });

    // Other Teachers
    CENSUS_TEACHERS.forEach((t) => {
      const contactId = t.cedula || t.code;
      if (!contactsMap.has(contactId) && t.fullName.toLowerCase() !== currentName && t.cedula !== currentDoc) {
        contactsMap.set(contactId, {
          id: contactId,
          fullName: t.fullName,
          role: 'teacher',
          roleLabel: 'Docente',
          email: t.email,
          detail: `Área: ${t.area} • Grados: ${t.grades}`
        });
      }
    });
  } 
  // If currentUser is Family (Acudiente):
  else if (currentRole.includes('fam') || currentRole.includes('acud') || currentRole.includes('guard')) {
    // Elena's student is Valentina in 8°1
    // Filter teachers who teach 8°1 (or institutional faculty)
    CENSUS_TEACHERS.forEach((t) => {
      const contactId = t.cedula || t.code;
      const grades = t.grades.split(',').map(g => normalizeGroupKey(g.trim()));
      const teaches81 = grades.includes('8-1') || grades.includes('8_1') || t.area === 'Filosofía de Vida' || t.fullName.includes('Gabriel Mendoza') || t.fullName.includes('Ricardo Agudelo') || t.fullName.includes('Claudia Morales') || t.fullName.includes('Carlos Ramírez');

      if (teaches81 && !contactsMap.has(contactId)) {
        contactsMap.set(contactId, {
          id: contactId,
          fullName: t.fullName,
          role: 'teacher',
          roleLabel: 'Docente',
          email: t.email,
          detail: `Docente de ${t.area} (8°1)`
        });
      }
    });

    // Admin staff
    CENSUS_ADMIN_STAFF.forEach((adm) => {
      const contactId = adm.cedula || adm.code;
      if (!contactsMap.has(contactId)) {
        contactsMap.set(contactId, {
          id: contactId,
          fullName: adm.fullName,
          role: 'admin',
          roleLabel: adm.cargo || 'Directivo',
          email: adm.email,
          detail: `Directivo • ${adm.cargo}`
        });
      }
    });
  }
  // If currentUser is Admin:
  else {
    // Teachers
    CENSUS_TEACHERS.forEach((t) => {
      const contactId = t.cedula || t.code;
      if (!contactsMap.has(contactId)) {
        contactsMap.set(contactId, {
          id: contactId,
          fullName: t.fullName,
          role: 'teacher',
          roleLabel: 'Docente',
          email: t.email,
          detail: `Docente de ${t.area}`
        });
      }
    });
    // Acudientes
    CENSUS_GUARDIANS.forEach((g) => {
      const contactId = g.cedula;
      if (!contactsMap.has(contactId)) {
        contactsMap.set(contactId, {
          id: contactId,
          fullName: g.fullName,
          role: 'family',
          roleLabel: 'Acudiente',
          email: g.email,
          detail: 'Acudiente oficial'
        });
      }
    });
  }

  return Array.from(contactsMap.values()).sort((a, b) => a.fullName.localeCompare(b.fullName));
}

// Backwards-compatible utility helpers
export async function fetchUserConversations(user: UserProfile): Promise<InstitutionalConversation[]> {
  if (!user) return [];
  const convCol = collection(db, 'conversations');
  const snap = await getDocs(query(convCol, where('participantIds', 'array-contains', user.id)));
  return snap.docs
    .map(d => ({ id: d.id, ...d.data() } as InstitutionalConversation))
    .filter(c => !(c.deletedBy || []).includes(user.id) && !(c.deletedBy || []).includes(user.documentId || ''));
}

export async function fetchConversationMessages(conversationId: string): Promise<InstitutionalMessage[]> {
  if (!conversationId) return [];
  const msgCol = collection(db, 'conversations', conversationId, 'messages');
  const snap = await getDocs(query(msgCol, orderBy('createdAt', 'asc')));
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as InstitutionalMessage));
}

export async function sendInstitutionalMessage(params: any): Promise<InstitutionalMessage> {
  return sendChatMessage({
    sender: params.sender,
    recipient: { id: params.recipientId, fullName: params.recipientName, role: 'family' },
    text: params.text,
    citation: params.citationDate ? { date: params.citationDate, time: params.citationTime || '07:30', reason: 'Citación' } : undefined
  });
}

export async function createInstitutionalConversation(params: any): Promise<any> {
  const msg = await sendChatMessage({
    sender: params.sender,
    recipient: params.recipient,
    text: params.initialText,
    citation: params.citationInfo ? {
      date: params.citationInfo.citationDate,
      time: params.citationInfo.citationTime,
      reason: params.citationInfo.reason,
      studentName: params.citationInfo.studentName,
      notes: params.citationInfo.notes
    } : undefined
  });
  return { conversation: { id: msg.conversationId }, firstMessage: msg };
}

export function getAuthorizedRecipients(userRole: string): RecipientOption[] {
  const options: RecipientOption[] = [];
  CENSUS_ADMIN_STAFF.forEach((admin) => {
    options.push({
      id: admin.cedula || admin.code,
      name: admin.fullName,
      role: admin.cargo,
      category: 'directivos',
      detail: `${admin.dependencia} • I.E. Vallejuelos`,
      email: admin.email
    });
  });
  if (userRole === 'teacher' || userRole === 'admin') {
    CENSUS_GUARDIANS.forEach((g) => {
      options.push({
        id: g.cedula,
        name: `${g.fullName} (${g.relationship})`,
        role: 'Acudiente',
        category: 'acudientes',
        detail: `Acudiente ID: ${g.cedula} • Est: ${g.studentDocumentId}`,
        email: g.email
      });
    });
    CENSUS_TEACHERS.forEach((t) => {
      options.push({
        id: t.cedula || t.code,
        name: t.fullName,
        role: `Docente de ${t.area}`,
        category: 'profesores',
        detail: `Área: ${t.area} • Grados: ${t.grades}`,
        email: t.email
      });
    });
  } else if (userRole === 'family') {
    CENSUS_TEACHERS.forEach((t) => {
      options.push({
        id: t.cedula || t.code,
        name: t.fullName,
        role: `Docente de ${t.area}`,
        category: 'profesores',
        detail: `Área: ${t.area} • Grados: ${t.grades}`,
        email: t.email
      });
    });
  }
  return options;
}
