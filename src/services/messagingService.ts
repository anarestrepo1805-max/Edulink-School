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
  avatarUrl?: string;
}

export interface Conversation {
  id: string;
  participantIds: string[];
  participants: Record<string, ConversationParticipant>;
  lastMessage: string;
  lastMessageTime: number;
  lastSenderId: string;
  unreadCount?: Record<string, number>;
  hiddenFor?: Record<string, boolean>;
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
  avatarUrl?: string;
}

export interface ChatNotification {
  conversationId: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  senderAvatar?: string;
  text: string;
  time: number;
  unreadCount: number;
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
}
export interface RecipientOption {
  id: string;
  name: string;
  role: string;
  category: string;
  detail: string;
  email?: string;
  avatarUrl?: string;
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
 * Filters out conversations that the user has hidden/deleted.
 * If no conversations exist in the database, returns an empty array [].
 * Does NOT generate mock, demo, or fake conversations.
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

        // Verify if user deleted/hidden this conversation
        if (data.hiddenFor && data.hiddenFor[userId] === true) {
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
          hiddenFor: data.hiddenFor || {},
          createdAt: data.createdAt ? (typeof data.createdAt === 'number' ? data.createdAt : new Date(data.createdAt).getTime()) : Date.now(),
          updatedAt: data.updatedAt ? (typeof data.updatedAt === 'number' ? data.updatedAt : new Date(data.updatedAt).getTime()) : Date.now()
        });
      });

      // Sort in memory by lastMessageTime descending
      convList.sort((a, b) => (b.lastMessageTime || 0) - (a.lastMessageTime || 0));
      onUpdate(convList);
    },
    (error) => {
      console.warn('Real-time conversation subscription notice (fallback empty):', error);
      onUpdate([]);
    }
  );
}

/**
 * Subscribes in real-time to unread chat notifications for a specific user.
 * Generates notification badges and list of pending incoming messages.
 */
export function subscribeChatNotifications(
  userId: string,
  onUpdate: (notifications: ChatNotification[], totalUnread: number) => void
): Unsubscribe {
  if (!userId) {
    onUpdate([], 0);
    return () => {};
  }

  const convCol = collection(db, 'conversations');
  const q = query(convCol, where('participantIds', 'array-contains', userId));

  return onSnapshot(
    q,
    (snapshot) => {
      if (snapshot.empty) {
        onUpdate([], 0);
        return;
      }

      const notifs: ChatNotification[] = [];
      let totalUnread = 0;

      snapshot.forEach((d) => {
        const data = d.data() as any;
        if (data.hiddenFor && data.hiddenFor[userId] === true) return;

        const unreadForUser = data.unreadCount?.[userId] || 0;
        if (unreadForUser > 0 && data.lastSenderId !== userId) {
          totalUnread += unreadForUser;
          const senderInfo = data.participants?.[data.lastSenderId];
          notifs.push({
            conversationId: d.id,
            senderId: data.lastSenderId,
            senderName: senderInfo?.fullName || 'Remitente Institucional',
            senderRole: senderInfo?.role || 'Usuario',
            senderAvatar: senderInfo?.avatarUrl,
            text: data.lastMessage || 'Mensaje nuevo',
            time: data.lastMessageTime || Date.now(),
            unreadCount: unreadForUser
          });
        }
      });

      notifs.sort((a, b) => b.time - a.time);
      onUpdate(notifs, totalUnread);
    },
    (error) => {
      console.warn('Notification subscription error:', error);
      onUpdate([], 0);
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
          senderAvatar: data.senderAvatar,
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
 * All messages are persisted in Firestore and stay available on refresh.
 * Updates unread count for the recipient and unhides the conversation.
 */
export async function sendChatMessage(params: {
  sender: UserProfile;
  recipient: AuthorizedContact | { id: string; fullName: string; role: string; email?: string; detail?: string; avatarUrl?: string };
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
    senderAvatar: sender.avatarUrl,
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

  // 1. Fetch current conversation to update unread counts and clear hidden flags
  const convRef = doc(db, 'conversations', conversationId);
  let currentUnread: Record<string, number> = {};
  let currentHidden: Record<string, boolean> = {};

  try {
    const snap = await getDoc(convRef);
    if (snap.exists()) {
      const data = snap.data();
      currentUnread = data.unreadCount || {};
      currentHidden = data.hiddenFor || {};
    }
  } catch (err) {
    console.warn('Could not read existing conv:', err);
  }

  // Sender's unread is 0; recipient's unread increments
  currentUnread[senderId] = 0;
  if (sender.id) currentUnread[sender.id] = 0;
  currentUnread[recipientId] = (currentUnread[recipientId] || 0) + 1;

  // Unhide for both participants when new message is sent
  currentHidden[senderId] = false;
  currentHidden[recipientId] = false;
  if (sender.id) currentHidden[sender.id] = false;

  const participantIds = Array.from(new Set([
    sender.id,
    senderId,
    recipient.id
  ])).filter(Boolean);

  const conversationPayload: Partial<Conversation> = {
    id: conversationId,
    participantIds,
    participants: {
      [senderId]: {
        id: senderId,
        fullName: sender.fullName,
        role: senderRoleLabel,
        email: sender.email,
        avatarUrl: sender.avatarUrl
      },
      [recipient.id]: {
        id: recipient.id,
        fullName: recipient.fullName,
        role: recipientRoleLabel,
        email: recipient.email,
        detail: recipient.detail,
        avatarUrl: recipient.avatarUrl
      }
    },
    lastMessage: text.trim() || (citation ? `Citación oficial: ${citation.reason}` : 'Mensaje'),
    lastMessageTime: now,
    lastSenderId: senderId,
    unreadCount: currentUnread,
    hiddenFor: currentHidden,
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
 * Marks all messages in a conversation as read for the current user, resetting unreadCount to 0.
 */
export async function markConversationAsRead(conversationId: string, userId: string): Promise<void> {
  if (!conversationId || !userId) return;
  try {
    const convRef = doc(db, 'conversations', conversationId);
    const snap = await getDoc(convRef);
    if (snap.exists()) {
      const data = snap.data();
      const currentUnread = data.unreadCount || {};
      currentUnread[userId] = 0;
      await updateDoc(convRef, { unreadCount: currentUnread });
    }
  } catch (err) {
    console.warn('Error marking conversation as read:', err);
  }
}

/**
 * Hides or soft-deletes a conversation strictly for the requesting user,
 * without destroying the message history for the other participant.
 */
export async function deleteConversationForUser(conversationId: string, userId: string): Promise<void> {
  if (!conversationId || !userId) return;
  try {
    const convRef = doc(db, 'conversations', conversationId);
    const snap = await getDoc(convRef);
    if (snap.exists()) {
      const data = snap.data();
      const hiddenFor = data.hiddenFor || {};
      hiddenFor[userId] = true;
      await updateDoc(convRef, { hiddenFor });
    }
  } catch (err) {
    console.error('Error hiding conversation for user:', err);
    throw err;
  }
}

/**
 * Retrieves the authorized contacts eligible to chat with the current user.
 * Strictly limited to authorized Docentes, Acudientes, and Directivos / Administrativos.
 */
export async function getAuthorizedContactsForUser(currentUser?: UserProfile | null): Promise<AuthorizedContact[]> {
  if (!currentUser) return [];

  const currentRole = (currentUser.role || '').toLowerCase();
  const currentUserId = currentUser.id;
  const currentDoc = currentUser.documentId || '';
  const currentName = (currentUser.fullName || '').toLowerCase();

  const contactsMap = new Map<string, AuthorizedContact>();

  // Helper avatar for teachers from census
  const teacherAvatars: Record<string, string> = {
    '30880317': 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
    '70013115': 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    '90137001': 'https://images.unsplash.com/photo-1580894732444-8ecded7900cd?w=150&auto=format&fit=crop&q=80',
    '10198944': 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    '30322830': 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80'
  };

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
          detail: u.subjectArea || (u.role === 'family' ? 'Acudiente registrado' : 'Directivo institucional'),
          avatarUrl: u.avatarUrl || teacherAvatars[u.documentId || '']
        });
      }
    });
  } catch (error) {
    console.warn('Could not query users collection, using census data:', error);
  }

  // 2. Add institutional census contacts according to role permissions
  if (currentRole.includes('teach') || currentRole.includes('docent')) {
    const assignments = getTeacherAcademicAssignments(currentUser.fullName || currentUser.documentId);
    const assignedGroupKeys = new Set(assignments.map(a => a.groupKey));

    CENSUS_GUARDIANS.forEach((g) => {
      const student = CENSUS_STUDENTS.find(s => s.documentId === g.studentDocumentId);
      const studentGroupKey = student ? normalizeGroupKey(student.group) : '';
      const isAssigned = assignedGroupKeys.has(studentGroupKey);

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
    });

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

    CENSUS_TEACHERS.forEach((t) => {
      const contactId = t.cedula || t.code;
      if (!contactsMap.has(contactId) && t.fullName.toLowerCase() !== currentName && t.cedula !== currentDoc) {
        contactsMap.set(contactId, {
          id: contactId,
          fullName: t.fullName,
          role: 'teacher',
          roleLabel: 'Docente',
          email: t.email,
          detail: `Área: ${t.area} • Grados: ${t.grades}`,
          avatarUrl: teacherAvatars[t.cedula]
        });
      }
    });
  } else if (currentRole.includes('fam') || currentRole.includes('acud') || currentRole.includes('guard')) {
    CENSUS_TEACHERS.forEach((t) => {
      const contactId = t.cedula || t.code;
      if (!contactsMap.has(contactId)) {
        contactsMap.set(contactId, {
          id: contactId,
          fullName: t.fullName,
          role: 'teacher',
          roleLabel: 'Docente',
          email: t.email,
          detail: `Docente de ${t.area}`,
          avatarUrl: teacherAvatars[t.cedula]
        });
      }
    });

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
  } else {
    CENSUS_TEACHERS.forEach((t) => {
      const contactId = t.cedula || t.code;
      if (!contactsMap.has(contactId)) {
        contactsMap.set(contactId, {
          id: contactId,
          fullName: t.fullName,
          role: 'teacher',
          roleLabel: 'Docente',
          email: t.email,
          detail: `Docente de ${t.area}`,
          avatarUrl: teacherAvatars[t.cedula]
        });
      }
    });
    CENSUS_GUARDIANS.slice(0, 40).forEach((g) => {
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
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as InstitutionalConversation));
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
