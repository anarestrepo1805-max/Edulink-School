import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { UserProfile } from '../types';
import {
  CENSUS_TEACHERS,
  CENSUS_ADMIN_STAFF,
  CENSUS_GUARDIANS
} from '../data/institutionalCensus';

export interface InstitutionalMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  recipientId: string;
  recipientName: string;
  text: string;
  createdAt: string;
  citationDate?: string;
  citationTime?: string;
}

export interface InstitutionalConversation {
  id: string;
  participantIds: string[];
  participantInfo: Record<
    string,
    {
      name: string;
      role: string;
      email?: string;
      photo?: string;
      group?: string;
    }
  >;
  subject: string;
  category: 'acudientes' | 'directivos' | 'profesores' | 'citaciones' | 'orientacion';
  lastMessageText: string;
  lastMessageSenderId: string;
  lastMessageSenderName: string;
  lastMessageAt: string;
  unreadBy: string[];
  citationInfo?: {
    studentName?: string;
    guardianName?: string;
    citationDate?: string;
    citationTime?: string;
    reason?: string;
    notes?: string;
  };
}

export interface RecipientOption {
  id: string;
  name: string;
  role: string;
  category: 'acudientes' | 'directivos' | 'profesores' | 'orientacion';
  detail: string;
  email?: string;
}

/**
 * Fetches real conversations for an authenticated user from Firestore.
 * If no conversations exist in the database, returns an empty array [].
 * Does NOT generate mock, demo, or fake conversations.
 */
export async function fetchUserConversations(
  user: UserProfile
): Promise<InstitutionalConversation[]> {
  if (!user) return [];

  const userKeys = [
    user.id,
    user.documentId,
    user.email?.toLowerCase().trim()
  ].filter(Boolean);

  try {
    const convRef = collection(db, 'conversations');
    const snapshot = await getDocs(convRef);

    if (snapshot.empty) {
      return [];
    }

    const conversations: InstitutionalConversation[] = [];

    snapshot.forEach((docSnap) => {
      const data = { id: docSnap.id, ...docSnap.data() } as InstitutionalConversation;
      const participants = data.participantIds || [];

      // Check if current user is one of the participants
      const isParticipant = participants.some((pId) =>
        userKeys.includes(pId) || userKeys.includes(pId.toLowerCase())
      );

      if (isParticipant) {
        conversations.push(data);
      }
    });

    // Sort descending by lastMessageAt
    conversations.sort((a, b) => {
      const timeA = new Date(a.lastMessageAt || 0).getTime();
      const timeB = new Date(b.lastMessageAt || 0).getTime();
      return timeB - timeA;
    });

    return conversations;
  } catch (err) {
    console.warn('Error fetching user conversations from Firestore:', err);
    return [];
  }
}

/**
 * Fetches messages belonging to a specific conversation from Firestore.
 * If no messages exist, returns [].
 */
export async function fetchConversationMessages(
  conversationId: string
): Promise<InstitutionalMessage[]> {
  if (!conversationId) return [];

  try {
    const messagesRef = collection(db, 'conversations', conversationId, 'messages');
    const snapshot = await getDocs(messagesRef);

    if (snapshot.empty) {
      return [];
    }

    const messages: InstitutionalMessage[] = [];
    snapshot.forEach((docSnap) => {
      messages.push({ id: docSnap.id, ...docSnap.data() } as InstitutionalMessage);
    });

    messages.sort((a, b) => {
      const timeA = new Date(a.createdAt || 0).getTime();
      const timeB = new Date(b.createdAt || 0).getTime();
      return timeA - timeB;
    });

    return messages;
  } catch (err) {
    console.warn('Error fetching conversation messages from Firestore:', err);
    return [];
  }
}

/**
 * Sends a new message inside an existing conversation.
 * Persists to Firestore and updates the conversation's lastMessage metadata.
 */
export async function sendInstitutionalMessage(params: {
  conversationId: string;
  sender: UserProfile;
  recipientId: string;
  recipientName: string;
  text: string;
  citationDate?: string;
  citationTime?: string;
}): Promise<InstitutionalMessage> {
  const {
    conversationId,
    sender,
    recipientId,
    recipientName,
    text,
    citationDate,
    citationTime
  } = params;

  const nowIso = new Date().toISOString();
  const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;

  const messageDoc: InstitutionalMessage = {
    id: messageId,
    conversationId,
    senderId: sender.documentId || sender.id,
    senderName: sender.fullName,
    senderRole: sender.role,
    recipientId,
    recipientName,
    text: text.trim(),
    createdAt: nowIso,
    ...(citationDate ? { citationDate } : {}),
    ...(citationTime ? { citationTime } : {})
  };

  try {
    // 1. Write message doc
    const msgRef = doc(db, 'conversations', conversationId, 'messages', messageId);
    await setDoc(msgRef, messageDoc);

    // 2. Update conversation metadata
    const convRef = doc(db, 'conversations', conversationId);
    await updateDoc(convRef, {
      lastMessageText: text.trim(),
      lastMessageSenderId: sender.documentId || sender.id,
      lastMessageSenderName: sender.fullName,
      lastMessageAt: nowIso,
      unreadBy: [recipientId]
    });

    return messageDoc;
  } catch (err) {
    console.error('Error sending institutional message to Firestore:', err);
    throw err;
  }
}

/**
 * Creates a brand new conversation channel and posts the initial message.
 */
export async function createInstitutionalConversation(params: {
  sender: UserProfile;
  recipient: {
    id: string;
    name: string;
    role: string;
    email?: string;
    group?: string;
  };
  subject: string;
  category: 'acudientes' | 'directivos' | 'profesores' | 'citaciones' | 'orientacion';
  initialText: string;
  citationInfo?: {
    studentName?: string;
    guardianName?: string;
    citationDate?: string;
    citationTime?: string;
    reason?: string;
    notes?: string;
  };
}): Promise<{ conversation: InstitutionalConversation; firstMessage: InstitutionalMessage }> {
  const { sender, recipient, subject, category, initialText, citationInfo } = params;

  const senderId = sender.documentId || sender.id;
  const conversationId = `conv_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  const nowIso = new Date().toISOString();

  const conversationDoc: InstitutionalConversation = {
    id: conversationId,
    participantIds: [senderId, recipient.id],
    participantInfo: {
      [senderId]: {
        name: sender.fullName,
        role: sender.role,
        email: sender.email,
        photo: sender.avatarUrl
      },
      [recipient.id]: {
        name: recipient.name,
        role: recipient.role,
        email: recipient.email,
        group: recipient.group
      }
    },
    subject: subject.trim(),
    category,
    lastMessageText: initialText.trim(),
    lastMessageSenderId: senderId,
    lastMessageSenderName: sender.fullName,
    lastMessageAt: nowIso,
    unreadBy: [recipient.id],
    ...(citationInfo ? { citationInfo } : {})
  };

  const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  const messageDoc: InstitutionalMessage = {
    id: messageId,
    conversationId,
    senderId,
    senderName: sender.fullName,
    senderRole: sender.role,
    recipientId: recipient.id,
    recipientName: recipient.name,
    text: initialText.trim(),
    createdAt: nowIso,
    ...(citationInfo?.citationDate ? { citationDate: citationInfo.citationDate } : {}),
    ...(citationInfo?.citationTime ? { citationTime: citationInfo.citationTime } : {})
  };

  try {
    // 1. Write conversation doc
    const convRef = doc(db, 'conversations', conversationId);
    await setDoc(convRef, conversationDoc);

    // 2. Write first message
    const msgRef = doc(db, 'conversations', conversationId, 'messages', messageId);
    await setDoc(msgRef, messageDoc);

    return { conversation: conversationDoc, firstMessage: messageDoc };
  } catch (err) {
    console.error('Error creating institutional conversation in Firestore:', err);
    throw err;
  }
}

/**
 * Marks conversation as read by the current user.
 */
export async function markConversationAsRead(
  conversationId: string,
  userId: string
): Promise<void> {
  if (!conversationId || !userId) return;
  try {
    const convRef = doc(db, 'conversations', conversationId);
    const snap = await getDoc(convRef);
    if (snap.exists()) {
      const data = snap.data() as InstitutionalConversation;
      const unread = (data.unreadBy || []).filter((id) => id !== userId);
      await updateDoc(convRef, { unreadBy: unread });
    }
  } catch (err) {
    console.warn('Error marking conversation as read:', err);
  }
}

/**
 * Returns the list of real, authorized institutional contacts that the user can message,
 * based on their role and institutional census records.
 */
export function getAuthorizedRecipients(userRole: string): RecipientOption[] {
  const options: RecipientOption[] = [];

  // Administrators and leadership are accessible to teachers and families
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
    // Teachers and Admins can contact guardians (acudientes)
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

    // Teachers can also message other teachers
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
    // Families can message teachers
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
