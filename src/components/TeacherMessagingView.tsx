import React, { useState, useEffect, useMemo, useRef } from 'react';
import { ActiveScreen, UserProfile } from '../types';
import { useThemeLanguage } from '../context/ThemeLanguageContext';
import { TeacherSidebar } from './TeacherSidebar';
import { TeacherScheduleModal } from './TeacherScheduleModal';
import {
  subscribeUserConversations,
  subscribeConversationMessages,
  sendChatMessage,
  getAuthorizedContactsForUser,
  deleteConversationForUser,
  markConversationAsRead,
  Conversation,
  ChatMessage,
  AuthorizedContact,
  ConversationParticipant
} from '../services/messagingService';
import {
  CENSUS_STUDENTS,
  CENSUS_GUARDIANS,
  getTeacherAcademicAssignments,
  normalizeGroupKey
} from '../data/institutionalCensus';

interface TeacherMessagingViewProps {
  currentUser?: UserProfile | null;
  onNavigate: (screen: ActiveScreen) => void;
  onLogout: () => void;
  onUpdateUser?: (updated: UserProfile) => void;
}

export const TeacherMessagingView: React.FC<TeacherMessagingViewProps> = ({
  currentUser,
  onNavigate,
  onLogout
}) => {
  const { theme, language } = useThemeLanguage();
  const isDark = theme === 'dark';
  const isEn = language === 'en';

  const teacherName = currentUser?.fullName || 'Prof. Carlos Ramírez';
  const teacherArea = currentUser?.subjectArea || 'Filosofía de Vida';
  const effectiveUserId = currentUser?.documentId || currentUser?.id || 'demo-teacher-1';

  // Navigation & Modals
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [showCitationModal, setShowCitationModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Firestore Live State
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);

  // Authorized Contacts
  const [authorizedContacts, setAuthorizedContacts] = useState<AuthorizedContact[]>([]);
  const [contactSearch, setContactSearch] = useState('');
  const [selectedRecipient, setSelectedRecipient] = useState<AuthorizedContact | null>(null);

  // Message Form State
  const [replyText, setReplyText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Citation Form State
  const [citationStudentDoc, setCitationStudentDoc] = useState('');
  const [citationGuardianName, setCitationGuardianName] = useState('');
  const [citationGuardianId, setCitationGuardianId] = useState('');
  const [citationDate, setCitationDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    return d.toISOString().split('T')[0];
  });
  const [citationTime, setCitationTime] = useState('07:30');
  const [citationReason, setCitationReason] = useState('Informe Académico y Seguimiento Disciplinario');
  const [citationNotes, setCitationNotes] = useState('Se solicita presencia para revisar desempeño académico institucional.');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // 1. Subscribe to user conversations
  useEffect(() => {
    const unsubscribe = subscribeUserConversations(effectiveUserId, (convs) => {
      setConversations(convs);
      if (convs.length > 0 && !selectedConvId) {
        setSelectedConvId(convs[0].id);
        markConversationAsRead(convs[0].id, effectiveUserId);
      }
    });

    return () => unsubscribe();
  }, [effectiveUserId, selectedConvId]);

  // 2. Fetch authorized contacts strictly for this teacher
  useEffect(() => {
    getAuthorizedContactsForUser(currentUser).then((contacts) => {
      setAuthorizedContacts(contacts);
    });
  }, [currentUser]);

  // 3. Subscribe to active conversation messages
  useEffect(() => {
    if (!selectedConvId) {
      setMessages([]);
      return;
    }

    markConversationAsRead(selectedConvId, effectiveUserId);
    setIsLoadingMessages(true);
    const unsubscribe = subscribeConversationMessages(selectedConvId, (msgs) => {
      setMessages(msgs);
      setIsLoadingMessages(false);
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    });

    return () => unsubscribe();
  }, [selectedConvId, effectiveUserId]);

  // Selected conversation object
  const activeConversation = useMemo(() => {
    return conversations.find((c) => c.id === selectedConvId) || null;
  }, [conversations, selectedConvId]);

  // Contact details for active conversation
  const otherParticipant = useMemo(() => {
    if (!activeConversation) return null;
    const otherId = activeConversation.participantIds.find((id) => id !== effectiveUserId && id !== currentUser?.id && id !== currentUser?.email);
    if (!otherId) return null;
    return activeConversation.participants[otherId] || null;
  }, [activeConversation, effectiveUserId, currentUser]);

  // Filtered contacts in "Nuevo mensaje" modal
  const filteredContacts = useMemo(() => {
    const query = contactSearch.toLowerCase().trim();
    if (!query) return authorizedContacts;
    return authorizedContacts.filter(
      (c) =>
        c.fullName.toLowerCase().includes(query) ||
        c.roleLabel.toLowerCase().includes(query) ||
        (c.detail && c.detail.toLowerCase().includes(query))
    );
  }, [authorizedContacts, contactSearch]);

  // Teacher assignments for student & guardian dropdowns in citation modal
  const teacherAssignments = useMemo(() => {
    return getTeacherAcademicAssignments(teacherName);
  }, [teacherName]);

  const assignedStudents = useMemo(() => {
    const groupKeys = new Set(teacherAssignments.map((a) => a.groupKey));
    return CENSUS_STUDENTS.filter((s) => {
      const norm = normalizeGroupKey(s.group);
      return groupKeys.has(norm);
    });
  }, [teacherAssignments]);

  // Auto-fill guardian when student selected in citation modal
  useEffect(() => {
    if (!citationStudentDoc && assignedStudents.length > 0) {
      setCitationStudentDoc(assignedStudents[0].documentId);
    }
  }, [assignedStudents, citationStudentDoc]);

  useEffect(() => {
    if (citationStudentDoc) {
      const guardian = CENSUS_GUARDIANS.find((g) => g.studentDocumentId === citationStudentDoc);
      if (guardian) {
        setCitationGuardianName(`${guardian.fullName} (${guardian.relationship})`);
        setCitationGuardianId(guardian.cedula);
      } else {
        setCitationGuardianName('Acudiente Institucional');
        setCitationGuardianId(citationStudentDoc);
      }
    }
  }, [citationStudentDoc]);

  // Send a regular text message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || isSending) return;

    if (!otherParticipant && !selectedRecipient) {
      showToast(isEn ? 'Please select a recipient first.' : 'Por favor selecciona un destinatario primero.');
      return;
    }

    const recipient = otherParticipant || selectedRecipient;
    if (!recipient) return;

    const senderProfile: UserProfile = currentUser || {
      id: effectiveUserId,
      fullName: teacherName,
      role: 'teacher',
      subjectArea: teacherArea,
      documentId: currentUser?.documentId || '71839201',
      email: currentUser?.email || 'carlos.ramirez@vallejuelos.edu.co'
    };

    setIsSending(true);
    try {
      await sendChatMessage({
        sender: senderProfile,
        recipient: {
          id: recipient.id,
          fullName: recipient.fullName,
          role: recipient.role,
          email: recipient.email,
          detail: recipient.detail
        },
        text: replyText.trim()
      });

      setReplyText('');
      showToast(isEn ? 'Message delivered.' : 'Mensaje enviado correctamente.');
    } catch (err) {
      console.error('Error sending message:', err);
      showToast(isEn ? 'Failed to send message.' : 'Error al enviar el mensaje.');
    } finally {
      setIsSending(false);
    }
  };

  // Start chat with selected contact
  const handleStartChatWithContact = async (contact: AuthorizedContact) => {
    setShowNewChatModal(false);
    setSelectedRecipient(contact);

    // Look for existing conversation
    const existing = conversations.find((c) => c.participantIds.includes(contact.id));
    if (existing) {
      setSelectedConvId(existing.id);
      markConversationAsRead(existing.id, effectiveUserId);
    } else {
      setSelectedConvId(null);
    }
  };

  // Create an official citation and dispatch message
  const handleCreateCitation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!citationGuardianId || isSending) return;

    const student = CENSUS_STUDENTS.find((s) => s.documentId === citationStudentDoc);
    const studentLabel = student ? `${student.fullName} (${student.group})` : 'Estudiante institucional';

    const senderProfile: UserProfile = currentUser || {
      id: effectiveUserId,
      fullName: teacherName,
      role: 'teacher',
      subjectArea: teacherArea,
      documentId: currentUser?.documentId || '71839201',
      email: currentUser?.email || 'carlos.ramirez@vallejuelos.edu.co'
    };

    setIsSending(true);
    try {
      const msg = await sendChatMessage({
        sender: senderProfile,
        recipient: {
          id: citationGuardianId,
          fullName: citationGuardianName,
          role: 'family',
          detail: `Acudiente de ${studentLabel}`
        },
        text: `CITACIÓN INSTITUCIONAL OFICIAL:\nEstimado(a) ${citationGuardianName}, se le convoca de manera obligatoria a una reunión el día ${citationDate} a las ${citationTime} para tratar el siguiente asunto: ${citationReason}.\n\nObservaciones adicionales: ${citationNotes}`,
        citation: {
          date: citationDate,
          time: citationTime,
          reason: citationReason,
          studentName: studentLabel,
          notes: citationNotes
        }
      });

      setShowCitationModal(false);
      setSelectedConvId(msg.conversationId);
      showToast(isEn ? 'Official citation generated and notified.' : 'Citación oficial generada y notificada al acudiente.');
    } catch (err) {
      console.error('Error sending citation:', err);
      showToast(isEn ? 'Failed to send citation.' : 'Error al registrar la citación.');
    } finally {
      setIsSending(false);
    }
  };

  // Logical deletion of conversation
  const handleDeleteConversation = async () => {
    if (!activeConversation) return;
    const confirmDelete = window.confirm(
      isEn
        ? 'Are you sure you want to delete this conversation from your inbox?'
        : '¿Estás seguro de que deseas eliminar esta conversación de tu bandeja?'
    );
    if (!confirmDelete) return;

    try {
      await deleteConversationForUser(activeConversation.id, effectiveUserId);
      setSelectedConvId(null);
      showToast(isEn ? 'Conversation removed from inbox.' : 'Conversación eliminada de tu bandeja.');
    } catch (err) {
      console.error('Error deleting conversation:', err);
      showToast(isEn ? 'Could not delete conversation.' : 'No se pudo eliminar la conversación.');
    }
  };

  return (
    <div className={`min-h-screen flex transition-colors duration-200 ${
      isDark ? 'bg-slate-950 text-slate-100' : 'bg-[#f8f9ff] text-[#0b1c30]'
    }`}>
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-5 py-3 rounded-2xl bg-cyan-600 text-white font-medium shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <span className="material-symbols-outlined text-xl">info</span>
          <span className="text-sm font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* FIXED TEACHER SIDEBAR */}
      <TeacherSidebar
        activeTab="messaging"
        currentUser={currentUser}
        onNavigate={onNavigate}
        onOpenSchedule={() => setShowScheduleModal(true)}
      />

      {/* MAIN CONTAINER (Matching TeacherGradesView architecture) */}
      <div className="flex-1 lg:pl-72 flex flex-col min-w-0">
        {/* Header Bar */}
        <header className={`sticky top-12 h-20 backdrop-blur-xl shadow-xs z-30 px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4 border-b transition-colors ${
          isDark ? 'bg-slate-900/95 border-slate-800' : 'bg-white/95 border-[#e5eeff]'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
              isDark ? 'bg-cyan-950 border-cyan-800 text-cyan-300' : 'bg-[#eff4ff] border-[#dce9ff] text-[#00288e]'
            }`}>
              <span className="material-symbols-outlined text-2xl">mail</span>
            </div>
            <div>
              <h2 className={`text-base font-extrabold ${isDark ? 'text-white' : 'text-[#0b1c30]'}`}>
                {isEn ? 'Institutional Messaging & Citations' : 'Mensajería y Citaciones a Acudientes'}
              </h2>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-[#444653]'}`}>
                {teacherName} • {teacherArea} • I.E. Vallejuelos
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowNewChatModal(true)}
              className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs uppercase tracking-wider shadow-sm cursor-pointer transition-all flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-base">add_comment</span>
              <span className="hidden sm:inline">{isEn ? 'New Message' : 'Nuevo Mensaje'}</span>
            </button>

            <button
              onClick={() => setShowCitationModal(true)}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-600 hover:to-indigo-600 text-white font-bold text-xs uppercase tracking-wider shadow-sm cursor-pointer transition-all flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-base">event_note</span>
              <span className="hidden sm:inline">{isEn ? 'Official Citation' : 'Citar Acudiente'}</span>
            </button>
          </div>
        </header>

        {/* Messaging Main Grid */}
        <main className="p-4 sm:p-6 lg:p-8 flex-1 max-w-[1440px] w-full mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 min-h-[620px]">
            {/* Conversation List / Inbox */}
            <div
              className={`md:col-span-5 rounded-3xl border p-4 flex flex-col justify-between ${
                isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'
              } shadow-sm`}
            >
              <div>
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800/40">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-cyan-400">mark_chat_unread</span>
                    <h3 className="font-bold text-sm">{isEn ? 'Institutional Inbox' : 'Bandeja Institucional'}</h3>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 text-xs font-bold border border-cyan-500/20">
                    {conversations.length}
                  </span>
                </div>

                {conversations.length === 0 ? (
                  <div className="py-12 px-4 text-center">
                    <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-center text-slate-400">
                      <span className="material-symbols-outlined text-3xl">chat_bubble_outline</span>
                    </div>
                    <h4 className="font-bold text-sm text-slate-200 mb-1">
                      {isEn ? 'No conversations yet' : 'Todavía no tienes conversaciones'}
                    </h4>
                    <p className="text-xs text-slate-400 mb-4 max-w-xs mx-auto">
                      {isEn
                        ? 'Select an authorized guardian, directivo, or colleague to start an official institutional conversation.'
                        : 'Selecciona un acudiente autorizado de tus grupos, directivo o colega docente para iniciar un diálogo institucional seguro.'}
                    </p>
                    <button
                      onClick={() => setShowNewChatModal(true)}
                      className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs transition-colors cursor-pointer inline-flex items-center gap-1.5"
                    >
                      <span className="material-symbols-outlined text-base">person_search</span>
                      <span>{isEn ? 'Search authorized contacts' : 'Buscar acudientes y contactos'}</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                    {conversations.map((conv) => {
                      const isSelected = selectedConvId === conv.id;
                      const participantsList = Object.values(conv.participants || {}) as ConversationParticipant[];
                      const other = participantsList.find(
                        (p) => p.id !== effectiveUserId && p.id !== currentUser?.id
                      );
                      const name = other?.fullName || 'Usuario Institucional';
                      const role = other?.role || 'Acudiente';
                      const avatar = other?.avatar;
                      const timeFormatted = new Date(conv.lastMessageTime || conv.updatedAt || Date.now()).toLocaleTimeString(
                        [],
                        { hour: '2-digit', minute: '2-digit' }
                      );
                      const unread = (conv.unreadCount?.[effectiveUserId] || 0) > 0 || (conv.unreadBy || []).includes(effectiveUserId);

                      return (
                        <div
                          key={conv.id}
                          onClick={() => {
                            setSelectedConvId(conv.id);
                            setSelectedRecipient(null);
                            markConversationAsRead(conv.id, effectiveUserId);
                          }}
                          className={`p-3.5 rounded-2xl border text-left cursor-pointer transition-all flex items-start gap-3 ${
                            isSelected
                              ? 'bg-cyan-500/10 border-cyan-500/60 shadow-md shadow-cyan-950/20'
                              : isDark
                              ? 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
                              : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          {avatar ? (
                            <img src={avatar} alt={name} className="w-10 h-10 rounded-full object-cover shrink-0 ring-2 ring-cyan-500/30" />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-cyan-700 text-white font-bold flex items-center justify-center text-sm shrink-0">
                              {name.charAt(0)}
                            </div>
                          )}

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between text-xs mb-1">
                              <span className="font-bold truncate text-slate-100">{name}</span>
                              <span className="text-[10px] text-slate-400 font-medium shrink-0 ml-2">{timeFormatted}</span>
                            </div>
                            <p className="text-xs text-slate-400 line-clamp-1 mb-1.5">{conv.lastMessage}</p>
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-semibold text-cyan-400 px-2 py-0.5 rounded-md bg-cyan-950/40 border border-cyan-800/40">
                                {role}
                              </span>
                              {unread && (
                                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-800/40 text-[11px] text-slate-400 flex items-center justify-between">
                <span>I.E. Vallejuelos • Canal Oficial</span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  Conexión segura
                </span>
              </div>
            </div>

            {/* Chat Box */}
            <div
              className={`md:col-span-7 rounded-3xl border flex flex-col justify-between overflow-hidden ${
                isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'
              } shadow-sm`}
            >
              {/* Header */}
              <div
                className={`p-4 border-b flex items-center justify-between shrink-0 ${
                  isDark ? 'border-slate-800 bg-slate-950/70' : 'border-slate-200 bg-slate-50'
                }`}
              >
                {otherParticipant || selectedRecipient ? (
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-cyan-600/20 text-cyan-300 border border-cyan-500/30 flex items-center justify-center font-bold text-sm">
                      {(otherParticipant?.fullName || selectedRecipient?.fullName || 'U').charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-slate-100">
                        {otherParticipant?.fullName || selectedRecipient?.fullName}
                      </h4>
                      <p className="text-xs text-cyan-400 font-medium">
                        {otherParticipant?.role || selectedRecipient?.roleLabel}
                        {(otherParticipant?.detail || selectedRecipient?.detail) && (
                          <span className="text-slate-400 font-normal">
                            {' '}
                            • {otherParticipant?.detail || selectedRecipient?.detail}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-slate-400 text-xs font-medium">
                    <span className="material-symbols-outlined text-lg text-slate-500">forum</span>
                    <span>{isEn ? 'Select a conversation' : 'Selecciona una conversación de la bandeja'}</span>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  {activeConversation && (
                    <button
                      type="button"
                      onClick={handleDeleteConversation}
                      className="p-1.5 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                      title={isEn ? 'Delete conversation' : 'Eliminar conversación de la bandeja'}
                    >
                      <span className="material-symbols-outlined text-[20px]">delete_outline</span>
                    </button>
                  )}
                  <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                    <span>Canal Seguro</span>
                  </span>
                </div>
              </div>

              {/* Messages Area */}
              <div className="p-4 space-y-3 flex-1 overflow-y-auto max-h-[460px]">
                {isLoadingMessages && (
                  <div className="py-8 text-center text-xs text-slate-400">
                    <span className="inline-block animate-spin mr-2">⟳</span>
                    {isEn ? 'Loading messages...' : 'Cargando mensajes en tiempo real...'}
                  </div>
                )}

                {!isLoadingMessages && messages.length === 0 && (
                  <div className="py-16 text-center text-slate-400">
                    <span className="material-symbols-outlined text-4xl mb-2 text-slate-400">chat</span>
                    <p className="text-xs font-medium">
                      {otherParticipant || selectedRecipient
                        ? isEn
                          ? 'Send an official notification or citation to begin.'
                          : 'Escribe un mensaje o genera una citación para iniciar la comunicación.'
                        : isEn
                        ? 'Select a conversation from the left.'
                        : 'Selecciona una conversación de la lista.'}
                    </p>
                  </div>
                )}

                {messages.map((msg) => {
                  const isSelf = msg.senderId === effectiveUserId || msg.senderId === currentUser?.id || msg.senderRole.includes('Docente');
                  const timeString = new Date(msg.createdAt).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit'
                  });

                  return (
                    <div key={msg.id} className={`flex flex-col ${isSelf ? 'items-end' : 'items-start'}`}>
                      <div className="text-[10px] font-semibold text-slate-400 mb-1 px-1">
                        {isSelf ? `Tú (${teacherName})` : `${msg.senderName} • ${msg.senderRole}`}
                      </div>

                      <div
                        className={`max-w-[85%] p-4 rounded-3xl text-xs shadow-md ${
                          isSelf
                            ? 'bg-cyan-600 text-white rounded-br-xs shadow-cyan-950/30'
                            : isDark
                            ? 'bg-slate-800 text-slate-100 rounded-bl-xs border border-slate-700/60 shadow-slate-950/40'
                            : 'bg-slate-100 text-slate-900 rounded-bl-xs border border-slate-200'
                        }`}
                      >
                        {msg.citationDate && (
                          <div className="mb-2.5 p-3 rounded-2xl bg-black/25 text-[11px] font-semibold border border-white/20">
                            <div className="flex items-center gap-1.5 text-amber-300 font-bold mb-1">
                              <span className="material-symbols-outlined text-sm">event</span>
                              <span>CITACIÓN ACADÉMICA OFICIAL</span>
                            </div>
                            {msg.citationStudentName && (
                              <p className="text-white/90">
                                <span className="text-white/70">Estudiante:</span> {msg.citationStudentName}
                              </p>
                            )}
                            <p className="text-white/90">
                              <span className="text-white/70">Fecha:</span> {msg.citationDate} a las {msg.citationTime}
                            </p>
                            {msg.citationReason && (
                              <p className="text-white/90">
                                <span className="text-white/70">Motivo:</span> {msg.citationReason}
                              </p>
                            )}
                          </div>
                        )}

                        <p className="whitespace-pre-line leading-relaxed">{msg.text}</p>
                        <span className="text-[10px] opacity-75 block text-right mt-1.5 font-medium">{timeString}</span>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Reply Form */}
              <form
                onSubmit={handleSendMessage}
                className={`p-3.5 border-t flex gap-2 shrink-0 ${
                  isDark ? 'border-slate-800 bg-slate-950/60' : 'border-slate-200 bg-slate-50'
                }`}
              >
                <input
                  type="text"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder={
                    otherParticipant || selectedRecipient
                      ? isEn
                        ? `Message ${otherParticipant?.fullName || selectedRecipient?.fullName}...`
                        : `Escribir a ${otherParticipant?.fullName || selectedRecipient?.fullName}...`
                      : isEn
                      ? 'Select an authorized recipient first...'
                      : 'Selecciona una conversación...'
                  }
                  disabled={!otherParticipant && !selectedRecipient}
                  className={`flex-1 px-4 py-2.5 rounded-2xl text-xs border focus:outline-none transition-all ${
                    isDark
                      ? 'bg-slate-900 border-slate-800 text-slate-100 placeholder-slate-500 focus:border-cyan-500'
                      : 'bg-white border-slate-200 text-slate-800 placeholder-slate-400 focus:border-cyan-600'
                  }`}
                />
                <button
                  type="submit"
                  disabled={isSending || (!otherParticipant && !selectedRecipient) || !replyText.trim()}
                  className="px-5 py-2.5 rounded-2xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-cyan-600/20 cursor-pointer transition-all active:scale-95 flex items-center gap-1.5 shrink-0"
                >
                  <span className="material-symbols-outlined text-base">send</span>
                  <span className="hidden sm:inline">{isEn ? 'Send' : 'Enviar'}</span>
                </button>
              </form>
            </div>
          </div>
        </main>
      </div>

      {/* MODAL 1: NUEVO MENSAJE */}
      {showNewChatModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div
            className={`w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden border ${
              isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-800'
            }`}
          >
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-cyan-400">person_add</span>
                <h3 className="font-bold text-sm">{isEn ? 'Start Conversation' : 'Iniciar Nueva Conversación'}</h3>
              </div>
              <button
                onClick={() => setShowNewChatModal(false)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            <div className="p-4">
              <div className="mb-3">
                <input
                  type="text"
                  value={contactSearch}
                  onChange={(e) => setContactSearch(e.target.value)}
                  placeholder={isEn ? 'Search authorized contacts...' : 'Buscar acudiente o directivo autorizado...'}
                  className={`w-full px-4 py-2.5 rounded-2xl text-xs border focus:outline-none transition-all ${
                    isDark
                      ? 'bg-slate-950 border-slate-800 text-slate-100 placeholder-slate-500 focus:border-cyan-500'
                      : 'bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400 focus:border-cyan-600'
                  }`}
                />
              </div>

              <div className="space-y-1.5 max-h-[360px] overflow-y-auto pr-1">
                {filteredContacts.length === 0 ? (
                  <p className="text-center py-8 text-xs text-slate-400">
                    {isEn ? 'No authorized contacts found.' : 'No se encontraron contactos autorizados para tus grupos.'}
                  </p>
                ) : (
                  filteredContacts.map((contact) => (
                    <div
                      key={contact.id}
                      onClick={() => handleStartChatWithContact(contact)}
                      className={`p-3 rounded-2xl border text-left cursor-pointer transition-all flex items-center justify-between group ${
                        isDark
                          ? 'bg-slate-950/60 border-slate-800/80 hover:border-cyan-500/50 hover:bg-cyan-950/20'
                          : 'bg-slate-50 border-slate-200 hover:border-cyan-500 hover:bg-cyan-50/50'
                      }`}
                    >
                      <div>
                        <span className="font-bold text-xs block text-slate-100 group-hover:text-cyan-400 transition-colors">
                          {contact.fullName}
                        </span>
                        <span className="text-[11px] text-slate-400 block">{contact.detail || contact.email}</span>
                      </div>
                      <span className="text-[10px] font-bold text-cyan-400 px-2 py-0.5 rounded-md bg-cyan-950/40 border border-cyan-800/40 shrink-0">
                        {contact.roleLabel}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: CITACIÓN OFICIAL A ACUDIENTE */}
      {showCitationModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div
            className={`w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden border ${
              isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-800'
            }`}
          >
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-blue-950/40">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-blue-400">event_note</span>
                <h3 className="font-bold text-sm">{isEn ? 'Official Citation to Guardian' : 'Generar Citación Oficial a Acudiente'}</h3>
              </div>
              <button
                onClick={() => setShowCitationModal(false)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            <form onSubmit={handleCreateCitation} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  {isEn ? 'Student (Assigned Groups) *' : 'Estudiante (Grupos Asignados) *'}
                </label>
                <select
                  value={citationStudentDoc}
                  onChange={(e) => setCitationStudentDoc(e.target.value)}
                  className={`w-full h-11 px-3.5 rounded-xl text-xs border focus:outline-none transition-all ${
                    isDark
                      ? 'bg-slate-950 border-slate-700 text-white focus:border-cyan-500'
                      : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-blue-600'
                  }`}
                >
                  {assignedStudents.map((s) => (
                    <option key={s.documentId} value={s.documentId}>
                      {s.fullName} ({s.group}) • Doc: {s.documentId}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  {isEn ? 'Identified Guardian' : 'Acudiente Identificado'}
                </label>
                <input
                  type="text"
                  readOnly
                  value={citationGuardianName}
                  className={`w-full h-11 px-3.5 rounded-xl text-xs border opacity-80 cursor-not-allowed ${
                    isDark ? 'bg-slate-950 border-slate-800 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-700'
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">{isEn ? 'Date *' : 'Fecha *'}</label>
                  <input
                    type="date"
                    required
                    value={citationDate}
                    onChange={(e) => setCitationDate(e.target.value)}
                    className={`w-full h-11 px-3 rounded-xl text-xs border focus:outline-none ${
                      isDark ? 'bg-slate-950 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">{isEn ? 'Time *' : 'Hora *'}</label>
                  <input
                    type="time"
                    required
                    value={citationTime}
                    onChange={(e) => setCitationTime(e.target.value)}
                    className={`w-full h-11 px-3 rounded-xl text-xs border focus:outline-none ${
                      isDark ? 'bg-slate-950 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">{isEn ? 'Reason *' : 'Motivo *'}</label>
                <select
                  value={citationReason}
                  onChange={(e) => setCitationReason(e.target.value)}
                  className={`w-full h-11 px-3.5 rounded-xl text-xs border focus:outline-none ${
                    isDark ? 'bg-slate-950 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                >
                  <option value="Informe Académico y Rendimiento Bajo">Informe Académico y Rendimiento Bajo</option>
                  <option value="Seguimiento Disciplinario / Convivencia">Seguimiento Disciplinario / Convivencia</option>
                  <option value="Citación General Entrega de Informes">Citación General Entrega de Informes</option>
                  <option value="Compromiso Pedagógico Especial">Compromiso Pedagógico Especial</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  {isEn ? 'Observations' : 'Observaciones y Recomendaciones'}
                </label>
                <textarea
                  rows={2}
                  value={citationNotes}
                  onChange={(e) => setCitationNotes(e.target.value)}
                  className={`w-full p-3 rounded-xl text-xs border focus:outline-none resize-none ${
                    isDark ? 'bg-slate-950 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCitationModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white cursor-pointer"
                >
                  {isEn ? 'Cancel' : 'Cancelar'}
                </button>
                <button
                  type="submit"
                  disabled={isSending}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase tracking-wider cursor-pointer shadow-md"
                >
                  {isSending ? (isEn ? 'Dispatching...' : 'Emitiendo...') : (isEn ? 'Dispatch Citation' : 'Emitir Citación')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SCHEDULE MODAL */}
      <TeacherScheduleModal
        isOpen={showScheduleModal}
        onClose={() => setShowScheduleModal(false)}
        currentUser={currentUser}
      />
    </div>
  );
};
