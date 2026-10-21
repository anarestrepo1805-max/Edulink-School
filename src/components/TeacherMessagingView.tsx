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
  Conversation,
  ChatMessage,
  AuthorizedContact,
  ConversationParticipant
} from '../services/messagingService';
import { CENSUS_STUDENTS, CENSUS_GUARDIANS, getTeacherAcademicAssignments } from '../data/institutionalCensus';

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

  const teacherName = currentUser?.fullName || 'Prof. Daniela Álvarez';
  const teacherArea = currentUser?.subjectArea || 'Tecnología e Informática';
  const effectiveUserId = currentUser?.id || 'demo-teacher-1';

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
      }
    });

    return () => unsubscribe();
  }, [effectiveUserId]);

  // 2. Fetch authorized contacts
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

    setIsLoadingMessages(true);
    const unsubscribe = subscribeConversationMessages(selectedConvId, (msgs) => {
      setMessages(msgs);
      setIsLoadingMessages(false);
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    });

    return () => unsubscribe();
  }, [selectedConvId]);

  // Selected conversation object
  const activeConversation = useMemo(() => {
    return conversations.find((c) => c.id === selectedConvId) || null;
  }, [conversations, selectedConvId]);

  // Contact details for active conversation
  const otherParticipant = useMemo(() => {
    if (!activeConversation) return null;
    const otherId = activeConversation.participantIds.find((id) => id !== effectiveUserId);
    if (!otherId) return null;
    return activeConversation.participants[otherId] || null;
  }, [activeConversation, effectiveUserId]);

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
      const norm = s.group.replace(/°/g, '-').replace(/_/g, '-');
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
        setCitationGuardianId(`guardian_${guardian.cedula}`);
      } else {
        setCitationGuardianName('Acudiente Institucional');
        setCitationGuardianId(`guardian_${citationStudentDoc}`);
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
      documentId: '71394821',
      email: 'daniela.alvarez@edulink.edu.co'
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
      documentId: '71394821',
      email: 'daniela.alvarez@edulink.edu.co'
    };

    const citationText = `CITACIÓN INSTITUCIONAL OFICIAL\nEstimado(a) ${citationGuardianName}:\nSe le convoca a reunión presencial de seguimiento académico.\n• Estudiante: ${studentLabel}\n• Motivo: ${citationReason}\n• Fecha y Hora: ${citationDate} a las ${citationTime}\n• Indicaciones: ${citationNotes}`;

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
        text: citationText,
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

  return (
    <div className={`min-h-screen ${isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-800'}`}>
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-5 py-3 rounded-2xl bg-cyan-600 text-white font-medium shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <span className="material-symbols-outlined text-xl">info</span>
          <span className="text-sm font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Main Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Reusable Official Teacher Sidebar */}
        <div className="lg:col-span-3">
          <TeacherSidebar
            currentUser={currentUser}
            activeScreen="teacher_messaging"
            onNavigate={onNavigate}
            onOpenSchedule={() => setShowScheduleModal(true)}
          />

          <div className="mt-4 space-y-2">
            <button
              onClick={() => setShowNewChatModal(true)}
              className="w-full py-3 rounded-2xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-cyan-600/20 cursor-pointer transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-lg">add_comment</span>
              <span>{isEn ? 'New Message' : 'Nuevo Mensaje'}</span>
            </button>

            <button
              onClick={() => setShowCitationModal(true)}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-600 hover:to-indigo-600 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-blue-700/20 cursor-pointer transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-lg">event_note</span>
              <span>{isEn ? 'Official Citation' : 'Citación a Acudiente'}</span>
            </button>
          </div>
        </div>

        {/* Messaging Container */}
        <main className="lg:col-span-9 grid grid-cols-1 md:grid-cols-12 gap-4 min-h-[620px]">
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
                      : 'Selecciona un acudiente autorizado, directivo o colega docente para iniciar un diálogo institucional seguro.'}
                  </p>
                  <button
                    onClick={() => setShowNewChatModal(true)}
                    className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs transition-colors cursor-pointer inline-flex items-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-base">person_search</span>
                    <span>{isEn ? 'Search authorized contacts' : 'Buscar contactos autorizados'}</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                  {conversations.map((ch) => {
                    const isSelected = selectedConvId === ch.id;
                    const participantsList = Object.values(ch.participants || {}) as ConversationParticipant[];
                    const other = participantsList.find((p) => p.id !== effectiveUserId);
                    const name = other?.fullName || 'Usuario institucional';
                    const role = other?.role || 'Acudiente';
                    const timeFormatted = new Date(ch.lastMessageTime || ch.updatedAt || Date.now()).toLocaleTimeString(
                      [],
                      { hour: '2-digit', minute: '2-digit' }
                    );

                    return (
                      <div
                        key={ch.id}
                        onClick={() => {
                          setSelectedConvId(ch.id);
                          setSelectedRecipient(null);
                        }}
                        className={`p-3.5 rounded-2xl border text-left cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-cyan-500/10 border-cyan-500/60 shadow-md shadow-cyan-950/20'
                            : isDark
                            ? 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
                            : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between text-xs mb-1.5">
                          <span className="font-bold truncate max-w-[170px] text-slate-100">{name}</span>
                          <span className="text-[10px] text-slate-400 font-medium">{timeFormatted}</span>
                        </div>
                        <p className="text-xs text-slate-400 line-clamp-1 mb-1.5">{ch.lastMessage}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-semibold text-cyan-400 px-2 py-0.5 rounded-md bg-cyan-950/40 border border-cyan-800/40">
                            {role}
                          </span>
                          <span className="text-[10px] text-slate-400 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                            {isEn ? 'Authorized' : 'Oficial'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-800/40 flex items-center justify-between text-[11px] text-slate-400">
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-xs text-cyan-400">lock</span>
                {isEn ? 'Encrypted institutional chat' : 'Mensajería institucional cifrada'}
              </span>
              <span>I.E. Vallejuelos</span>
            </div>
          </div>

          {/* Chat Window */}
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
                        <span className="text-slate-400 font-normal"> • {otherParticipant?.detail || selectedRecipient?.detail}</span>
                      )}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-slate-400 text-xs font-medium">
                  <span className="material-symbols-outlined text-lg text-slate-500">forum</span>
                  <span>{isEn ? 'Select or start a conversation' : 'Selecciona o inicia una conversación'}</span>
                </div>
              )}

              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span>{isEn ? 'Channel Active' : 'Canal Activo'}</span>
                </span>
              </div>
            </div>

            {/* Messages Body */}
            <div className="p-4 space-y-3 flex-1 overflow-y-auto max-h-[480px]">
              {isLoadingMessages && (
                <div className="py-8 text-center text-xs text-slate-400">
                  <span className="inline-block animate-spin mr-2">⟳</span>
                  {isEn ? 'Loading messages...' : 'Cargando mensajes oficiales...'}
                </div>
              )}

              {!isLoadingMessages && messages.length === 0 && (
                <div className="py-16 text-center text-slate-400">
                  <span className="material-symbols-outlined text-4xl mb-2 text-slate-400">chat</span>
                  <p className="text-xs font-medium">
                    {otherParticipant || selectedRecipient
                      ? isEn
                        ? 'No messages in this conversation yet. Send the first message below.'
                        : 'No hay mensajes en esta conversación. Escribe el primer mensaje a continuación.'
                      : isEn
                      ? 'Todavía no tienes conversaciones activas seleccionadas.'
                      : 'Todavía no tienes conversaciones activas seleccionadas.'}
                  </p>
                </div>
              )}

              {messages.map((msg) => {
                const isSelf = msg.senderId === effectiveUserId;
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
                          ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-br-xs shadow-cyan-950/30'
                          : isDark
                          ? 'bg-slate-800 text-slate-100 rounded-bl-xs border border-slate-700/60 shadow-slate-950/40'
                          : 'bg-slate-100 text-slate-900 rounded-bl-xs border border-slate-200'
                      }`}
                    >
                      {msg.citationDate && (
                        <div className="mb-2.5 p-3 rounded-2xl bg-black/25 text-[11px] font-semibold border border-white/20">
                          <div className="flex items-center gap-1.5 text-amber-300 font-bold mb-1">
                            <span className="material-symbols-outlined text-sm">event</span>
                            <span>CITACIÓN ACADÉMICA INSTITUCIONAL</span>
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

            {/* Reply Input Form */}
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
                      ? 'Type official institutional message...'
                      : 'Escribir mensaje institucional...'
                    : isEn
                    ? 'Select a contact to enable messaging...'
                    : 'Selecciona un contacto para escribir...'
                }
                disabled={(!otherParticipant && !selectedRecipient) || isSending}
                className={`flex-1 px-4 py-3 rounded-2xl text-xs border transition-colors outline-none ${
                  isDark
                    ? 'bg-slate-900 border-slate-700 text-white placeholder-slate-500 focus:border-cyan-500'
                    : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-blue-500'
                } disabled:opacity-50`}
              />
              <button
                type="submit"
                disabled={(!otherParticipant && !selectedRecipient) || !replyText.trim() || isSending}
                className="px-5 py-3 rounded-2xl bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer disabled:cursor-not-allowed shadow-md shadow-cyan-900/20 active:scale-95"
              >
                <span>{isSending ? (isEn ? 'Sending...' : 'Enviando...') : isEn ? 'Send' : 'Enviar'}</span>
                <span className="material-symbols-outlined text-base">send</span>
              </button>
            </form>
          </div>
        </main>
      </div>

      {/* Modal: New Chat / Contact Picker */}
      {showNewChatModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200"
        >
          <div
            className={`w-full max-w-lg rounded-3xl border shadow-2xl overflow-hidden ${
              isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            <div className={`p-5 border-b flex items-center justify-between ${isDark ? 'border-slate-800 bg-slate-950/40' : 'border-slate-200 bg-slate-50'}`}>
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-cyan-600/20 text-cyan-400 flex items-center justify-center font-bold">
                  <span className="material-symbols-outlined text-xl">contact_page</span>
                </div>
                <div>
                  <h3 className="font-bold text-base">{isEn ? 'Authorized Contacts' : 'Contactos Autorizados'}</h3>
                  <p className="text-xs text-slate-400">{isEn ? 'Acudientes, Directivos y Docentes' : 'Acudientes, directivos y docentes oficiales'}</p>
                </div>
              </div>
              <button
                onClick={() => setShowNewChatModal(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            <div className="p-4 border-b border-slate-800">
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-2.5 text-slate-400 text-lg">search</span>
                <input
                  type="text"
                  value={contactSearch}
                  onChange={(e) => setContactSearch(e.target.value)}
                  placeholder={isEn ? 'Search by name or role...' : 'Buscar por nombre, rol o acudiente...'}
                  className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-xs border outline-none ${
                    isDark ? 'bg-slate-950 border-slate-700 text-white focus:border-cyan-500' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>
            </div>

            <div className="p-4 max-h-[360px] overflow-y-auto space-y-2">
              {filteredContacts.length === 0 ? (
                <p className="text-center text-xs text-slate-400 py-8">
                  {isEn ? 'No authorized contacts found.' : 'No se encontraron contactos autorizados con esa búsqueda.'}
                </p>
              ) : (
                filteredContacts.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => handleStartChatWithContact(c)}
                    className={`p-3 rounded-2xl border text-left cursor-pointer transition-all flex items-center justify-between ${
                      isDark
                        ? 'bg-slate-950/60 border-slate-800 hover:border-cyan-500/60 hover:bg-cyan-500/10'
                        : 'bg-slate-50 border-slate-200 hover:border-blue-400 hover:bg-blue-50'
                    }`}
                  >
                    <div>
                      <h5 className="font-bold text-xs text-slate-100">{c.fullName}</h5>
                      <p className="text-[11px] text-cyan-400 font-medium">{c.roleLabel}</p>
                      {c.detail && <p className="text-[10px] text-slate-400">{c.detail}</p>}
                    </div>
                    <span className="material-symbols-outlined text-sm text-cyan-400">chat</span>
                  </div>
                ))
              )}
            </div>

            <div className={`p-4 border-t flex justify-end ${isDark ? 'border-slate-800 bg-slate-950/40' : 'border-slate-200 bg-slate-50'}`}>
              <button
                onClick={() => setShowNewChatModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                {isEn ? 'Cancel' : 'Cancelar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Official Citation to Guardian */}
      {showCitationModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200"
        >
          <div
            className={`w-full max-w-lg rounded-3xl border shadow-2xl overflow-hidden ${
              isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            <div className={`p-5 border-b flex items-center justify-between ${isDark ? 'border-slate-800 bg-slate-950/40' : 'border-slate-200 bg-slate-50'}`}>
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                  <span className="material-symbols-outlined text-xl">event_available</span>
                </div>
                <div>
                  <h3 className="font-bold text-base">{isEn ? 'New Family Citation' : 'Nueva Citación a Acudiente'}</h3>
                  <p className="text-xs text-slate-400">{isEn ? 'Official institutional appointment' : 'Citación formal registrada en la base de datos'}</p>
                </div>
              </div>
              <button
                onClick={() => setShowCitationModal(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            <form onSubmit={handleCreateCitation} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  {isEn ? 'Student in Charge:' : 'Estudiante:'}
                </label>
                <select
                  value={citationStudentDoc}
                  onChange={(e) => setCitationStudentDoc(e.target.value)}
                  className={`w-full p-2.5 rounded-xl text-xs border outline-none cursor-pointer ${
                    isDark ? 'bg-slate-950 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                >
                  {assignedStudents.map((s) => (
                    <option key={s.documentId} value={s.documentId}>
                      {s.fullName} — Grado {s.group} (Doc: {s.documentId})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  {isEn ? 'Target Guardian (Automatic):' : 'Acudiente Oficial Destinatario:'}
                </label>
                <input
                  type="text"
                  readOnly
                  value={citationGuardianName}
                  className={`w-full p-2.5 rounded-xl text-xs border opacity-80 cursor-not-allowed ${
                    isDark ? 'bg-slate-950/80 border-slate-800 text-cyan-300' : 'bg-slate-100 border-slate-300 text-blue-900'
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    {isEn ? 'Date:' : 'Fecha de la Citación:'}
                  </label>
                  <input
                    type="date"
                    required
                    value={citationDate}
                    onChange={(e) => setCitationDate(e.target.value)}
                    className={`w-full p-2.5 rounded-xl text-xs border outline-none ${
                      isDark ? 'bg-slate-950 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    {isEn ? 'Time:' : 'Hora de Atención:'}
                  </label>
                  <input
                    type="time"
                    required
                    value={citationTime}
                    onChange={(e) => setCitationTime(e.target.value)}
                    className={`w-full p-2.5 rounded-xl text-xs border outline-none ${
                      isDark ? 'bg-slate-950 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  {isEn ? 'Reason:' : 'Motivo de la Citación:'}
                </label>
                <input
                  type="text"
                  required
                  value={citationReason}
                  onChange={(e) => setCitationReason(e.target.value)}
                  placeholder="Informe de notas, convivencia o seguimiento"
                  className={`w-full p-2.5 rounded-xl text-xs border outline-none ${
                    isDark ? 'bg-slate-950 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  {isEn ? 'Instructions / Notes:' : 'Instrucciones para el Acudiente:'}
                </label>
                <textarea
                  rows={3}
                  value={citationNotes}
                  onChange={(e) => setCitationNotes(e.target.value)}
                  className={`w-full p-2.5 rounded-xl text-xs border outline-none ${
                    isDark ? 'bg-slate-950 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCitationModal(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  {isEn ? 'Cancel' : 'Cancelar'}
                </button>
                <button
                  type="submit"
                  disabled={isSending}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold text-xs shadow-lg shadow-amber-600/20 cursor-pointer transition-all active:scale-95"
                >
                  {isSending ? (isEn ? 'Generating...' : 'Generando...') : isEn ? 'Emit Citation' : 'Emitir Citación'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Teacher Schedule Modal */}
      <TeacherScheduleModal
        isOpen={showScheduleModal}
        onClose={() => setShowScheduleModal(false)}
        currentUser={currentUser}
      />
    </div>
  );
};
