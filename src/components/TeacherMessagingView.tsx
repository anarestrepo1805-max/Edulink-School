import React, { useState, useEffect, useMemo, useRef } from 'react';
import { ActiveScreen, UserProfile } from '../types';
import { useThemeLanguage } from '../context/ThemeLanguageContext';
import { TeacherSidebar } from './TeacherSidebar';
import { TeacherScheduleModal } from './TeacherScheduleModal';
import {
  subscribeUserConversations,
  subscribeConversationMessages,
  sendChatMessage,
  markConversationAsRead,
  deleteConversationForUser,
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

  const teacherName = currentUser?.fullName || 'Patricia Quintero';

  // Strict retrieval of assignments from census
  const teacherAssignments = useMemo(() => {
    return getTeacherAcademicAssignments(
      currentUser?.fullName || currentUser?.documentId || currentUser?.email,
      currentUser?.subjectArea,
      currentUser?.assignedGrades
    );
  }, [currentUser?.fullName, currentUser?.documentId, currentUser?.email, currentUser?.subjectArea, currentUser?.assignedGrades]);

  const teacherArea = teacherAssignments[0]?.subjectName || currentUser?.subjectArea || 'Filosofía de vida';
  const effectiveUserId = currentUser?.documentId || currentUser?.id || '30880317';

  // Navigation & Modals
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [showCitationModal, setShowCitationModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeletingConv, setIsDeletingConv] = useState(false);
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

  // 1. Suscripción en tiempo real a las conversaciones del usuario en Firestore
  useEffect(() => {
    const unsubscribe = subscribeUserConversations(effectiveUserId, (convs) => {
      setConversations(convs);
      if (convs.length > 0 && !selectedConvId) {
        setSelectedConvId(convs[0].id);
        markConversationAsRead(convs[0].id, effectiveUserId);
      }
    });

    return () => unsubscribe();
  }, [effectiveUserId]);

  // Mark as read when selectedConvId changes
  useEffect(() => {
    if (selectedConvId && effectiveUserId) {
      markConversationAsRead(selectedConvId, effectiveUserId);
    }
  }, [selectedConvId, effectiveUserId]);

  // 2. Cargar contactos autorizados reales (docentes, acudientes y administrativos)
  useEffect(() => {
    getAuthorizedContactsForUser(currentUser).then((contacts) => {
      setAuthorizedContacts(contacts);
    });
  }, [currentUser]);

  // 3. Suscripción en tiempo real a los mensajes de la conversación activa
  useEffect(() => {
    if (!selectedConvId) {
      setMessages([]);
      return;
    }

    setIsLoadingMessages(true);
    const unsubscribe = subscribeConversationMessages(selectedConvId, (msgs) => {
      setMessages(msgs);
      setIsLoadingMessages(false);
    });

    return () => unsubscribe();
  }, [selectedConvId]);

  // Auto-scroll al recibir o enviar nuevos mensajes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Conversación activa
  const activeConversation = useMemo(() => {
    return conversations.find((c) => c.id === selectedConvId) || null;
  }, [conversations, selectedConvId]);

  // Participante destinatario
  const otherParticipant = useMemo<ConversationParticipant | null>(() => {
    if (!activeConversation) return null;
    const participantsList = Object.values(activeConversation.participants || {}) as ConversationParticipant[];
    return participantsList.find((p) => p.id !== effectiveUserId && p.id !== currentUser?.id) || null;
  }, [activeConversation, effectiveUserId, currentUser?.id]);

  // Estudiantes asignados al docente para citaciones
  const assignedStudents = useMemo(() => {
    const assignedGroupKeys = new Set(teacherAssignments.map((a) => a.groupKey));
    const filtered = CENSUS_STUDENTS.filter((s) => {
      const normGroup = s.group.replace(/°/g, '-').replace(/_/g, '-').trim();
      return assignedGroupKeys.has(normGroup);
    });
    return filtered.length > 0 ? filtered : CENSUS_STUDENTS.slice(0, 30);
  }, [teacherAssignments]);

  // Al cambiar el estudiante seleccionado en el modal de citación, vincular su acudiente oficial del censo
  useEffect(() => {
    if (assignedStudents.length > 0 && !citationStudentDoc) {
      const first = assignedStudents[0];
      setCitationStudentDoc(first.documentId);
    }
  }, [assignedStudents, citationStudentDoc]);

  useEffect(() => {
    if (citationStudentDoc) {
      const guardian = CENSUS_GUARDIANS.find((g) => g.studentDocumentId === citationStudentDoc);
      if (guardian) {
        setCitationGuardianName(guardian.fullName);
        setCitationGuardianId(guardian.cedula);
      } else {
        setCitationGuardianName('Elena Gómez Jiménez');
        setCitationGuardianId('43521980');
      }
    }
  }, [citationStudentDoc]);

  // Filtrado de contactos autorizados en el buscador
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

  // Enviar mensaje en el chat
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!replyText.trim() || isSending) return;

    const recipient = otherParticipant || selectedRecipient;
    if (!recipient) {
      showToast(isEn ? 'Please select a recipient first.' : 'Selecciona un destinatario primero.');
      return;
    }

    const senderProfile: UserProfile = currentUser || {
      id: effectiveUserId,
      fullName: teacherName,
      role: 'teacher',
      documentId: effectiveUserId,
      email: currentUser?.email || 'patricia.quintero@edulink.edu.co',
      avatarUrl: currentUser?.avatarUrl
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
          detail: recipient.detail,
          avatarUrl: recipient.avatarUrl
        },
        text: replyText.trim()
      });

      setReplyText('');
      showToast(isEn ? 'Message sent and notified.' : 'Mensaje enviado y notificado al destinatario.');
    } catch (err) {
      console.error('Error sending message:', err);
      showToast(isEn ? 'Failed to send message.' : 'Error al enviar el mensaje.');
    } finally {
      setIsSending(false);
    }
  };

  // Iniciar diálogo con contacto seleccionado
  const handleStartChatWithContact = (contact: AuthorizedContact) => {
    setShowNewChatModal(false);
    setSelectedRecipient(contact);

    const existing = conversations.find((c) => c.participantIds.includes(contact.id));
    if (existing) {
      setSelectedConvId(existing.id);
      markConversationAsRead(existing.id, effectiveUserId);
    } else {
      setSelectedConvId(null);
    }
  };

  // Crear Citación Oficial Institucional
  const handleCreateCitation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!citationStudentDoc || isSending) return;

    const studentFound = CENSUS_STUDENTS.find((s) => s.documentId === citationStudentDoc);
    const studentLabel = studentFound ? `${studentFound.fullName} (${studentFound.group})` : 'Estudiante Oficial';

    const senderProfile: UserProfile = currentUser || {
      id: effectiveUserId,
      fullName: teacherName,
      role: 'teacher',
      documentId: effectiveUserId,
      email: 'patricia.quintero@edulink.edu.co',
      avatarUrl: currentUser?.avatarUrl
    };

    const citationText = `CITACIÓN INSTITUCIONAL OFICIAL\nEstimado(a) ${citationGuardianName}:\nSe le convoca a reunión presencial de seguimiento académico en la sede institucional.\n• Estudiante: ${studentLabel}\n• Motivo: ${citationReason}\n• Fecha y Hora: ${citationDate} a las ${citationTime}\n• Indicaciones: ${citationNotes}`;

    setIsSending(true);
    try {
      const msg = await sendChatMessage({
        sender: senderProfile,
        recipient: {
          id: citationGuardianId,
          fullName: citationGuardianName,
          role: 'family',
          email: `acudiente_${citationGuardianId}@edulink.edu.co`,
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

  // Eliminar conversación de la vista del usuario
  const handleDeleteConversation = async () => {
    if (!selectedConvId) return;
    setIsDeletingConv(true);
    try {
      await deleteConversationForUser(selectedConvId, effectiveUserId);
      setShowDeleteModal(false);
      setSelectedConvId(null);
      showToast(isEn ? 'Conversation removed from your inbox.' : 'Conversación eliminada de tu bandeja.');
    } catch (err) {
      console.error('Error deleting conversation:', err);
      showToast(isEn ? 'Could not delete conversation.' : 'No se pudo eliminar la conversación.');
    } finally {
      setIsDeletingConv(false);
    }
  };

  return (
    <div className={`min-h-screen flex flex-col selection:bg-cyan-500 selection:text-white ${
      isDark ? 'bg-slate-950 text-slate-100' : 'bg-[#f4f7fb] text-[#0b1c30]'
    }`}>
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-16 right-4 z-50 bg-slate-900 border border-cyan-500/40 text-cyan-300 px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 text-xs font-bold animate-in fade-in duration-200">
          <span className="material-symbols-outlined text-[18px]">check_circle</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Menú lateral docente exclusivo */}
      <TeacherSidebar
        activeTab="messaging"
        onNavigate={onNavigate}
        onOpenSchedule={() => setShowScheduleModal(true)}
        currentUser={currentUser}
      />

      {/* Modal Horario Propio */}
      {showScheduleModal && (
        <TeacherScheduleModal
          isOpen={showScheduleModal}
          onClose={() => setShowScheduleModal(false)}
          teacherName={teacherName}
          teacherDoc={currentUser?.documentId}
        />
      )}

      {/* MAIN CONTAINER */}
      <div className="flex-1 lg:pl-72 flex flex-col min-w-0">
        {/* HEADER BAR FIJO */}
        <header className={`sticky top-12 h-20 backdrop-blur-xl shadow-xs z-30 px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4 border-b transition-colors ${
          isDark ? 'bg-slate-900/95 border-slate-800' : 'bg-white/95 border-[#e5eeff]'
        }`}>
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <span className={`material-symbols-outlined text-2xl ${isDark ? 'text-cyan-400' : 'text-[#0051d5]'}`}>
              forum
            </span>
            <div className="min-w-0">
              <h1 className={`text-sm sm:text-base font-extrabold truncate ${isDark ? 'text-white' : 'text-[#0b1c30]'}`}>
                {isEn ? 'Messaging & Citations' : 'Mensajería y Citaciones Oficiales'}
              </h1>
              <p className={`text-[11px] truncate ${isDark ? 'text-slate-400' : 'text-[#757684]'}`}>
                {teacherArea} • {teacherName} • I.E. Vallejuelos
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setShowNewChatModal(true)}
              className="h-11 px-3.5 sm:px-4 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs uppercase tracking-wider shadow-md cursor-pointer transition-transform active:scale-95 flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-base">chat</span>
              <span className="hidden sm:inline">{isEn ? 'New Chat' : 'Nuevo Mensaje'}</span>
            </button>

            <button
              onClick={() => setShowCitationModal(true)}
              className="h-11 px-3.5 sm:px-4 rounded-xl bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-600 hover:to-indigo-600 text-white font-bold text-xs uppercase tracking-wider shadow-md cursor-pointer transition-transform active:scale-95 flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-base">event_note</span>
              <span className="hidden sm:inline">{isEn ? 'Cite Guardian' : 'Citar Acudiente'}</span>
            </button>
          </div>
        </header>

        {/* CONTENIDO PRINCIPAL */}
        <main className="p-4 sm:p-6 lg:p-8 flex-1 flex flex-col min-w-0">
          <div className={`flex-1 rounded-3xl border shadow-xs overflow-hidden flex flex-col lg:flex-row min-h-[640px] ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-[#e5eeff]'
          }`}>
            {/* PANEL IZQUIERDO: Bandeja de entrada */}
            <aside className={`w-full lg:w-80 xl:w-96 flex flex-col border-b lg:border-b-0 lg:border-r shrink-0 ${
              isDark ? 'border-slate-800 bg-slate-950/50' : 'border-[#e5eeff] bg-[#f8faff]'
            }`}>
              <div className={`p-4 border-b flex items-center justify-between shrink-0 ${
                isDark ? 'border-slate-800' : 'border-[#e5eeff]'
              }`}>
                <div className="flex items-center gap-2">
                  <span className={`material-symbols-outlined text-lg ${isDark ? 'text-cyan-400' : 'text-[#0051d5]'}`}>
                    inbox
                  </span>
                  <h2 className={`font-extrabold text-xs uppercase tracking-wider ${isDark ? 'text-white' : 'text-[#0b1c30]'}`}>
                    {isEn ? 'Institutional Inbox' : 'Bandeja Institucional'}
                  </h2>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[11px] font-extrabold ${
                  isDark ? 'bg-cyan-950 text-cyan-300 border border-cyan-800/40' : 'bg-[#dce9ff] text-[#00288e]'
                }`}>
                  {conversations.length}
                </span>
              </div>

              {/* Lista de Conversaciones */}
              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {conversations.length === 0 ? (
                  <div className="py-16 px-4 text-center">
                    <div className={`w-14 h-14 mx-auto mb-3 rounded-2xl flex items-center justify-center ${
                      isDark ? 'bg-slate-800/60 text-slate-400 border border-slate-700/60' : 'bg-white text-slate-400 border border-slate-200 shadow-xs'
                    }`}>
                      <span className="material-symbols-outlined text-3xl">chat_bubble_outline</span>
                    </div>
                    <h3 className={`font-bold text-sm mb-1 ${isDark ? 'text-slate-200' : 'text-[#0b1c30]'}`}>
                      {isEn ? 'No conversations yet' : 'Todavía no tienes conversaciones'}
                    </h3>
                    <p className={`text-xs mb-4 max-w-xs mx-auto ${isDark ? 'text-slate-400' : 'text-[#757684]'}`}>
                      {isEn
                        ? 'Select an authorized contact to start an official institutional conversation.'
                        : 'Selecciona un acudiente o directivo autorizado para iniciar una conversación oficial en tiempo real.'}
                    </p>
                    <button
                      onClick={() => setShowNewChatModal(true)}
                      className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs transition-colors cursor-pointer inline-flex items-center gap-1.5 shadow-sm"
                    >
                      <span className="material-symbols-outlined text-base">person_search</span>
                      <span>{isEn ? 'Search Contacts' : 'Buscar Contactos'}</span>
                    </button>
                  </div>
                ) : (
                  conversations.map((ch) => {
                    const isSelected = selectedConvId === ch.id;
                    const participantsList = Object.values(ch.participants || {}) as ConversationParticipant[];
                    const other = participantsList.find((p) => p.id !== effectiveUserId && p.id !== currentUser?.id);
                    const name = other?.fullName || 'Usuario institucional';
                    const role = other?.role || 'Acudiente';
                    const unread = ch.unreadCount?.[effectiveUserId] || 0;
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
                          markConversationAsRead(ch.id, effectiveUserId);
                        }}
                        className={`p-3.5 rounded-2xl border text-left cursor-pointer transition-all flex items-start gap-3 ${
                          isSelected
                            ? isDark
                              ? 'bg-cyan-950/40 border-cyan-500/60 shadow-xs'
                              : 'bg-white border-[#0051d5] shadow-xs'
                            : isDark
                            ? 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                            : 'bg-white border-[#e5eeff] hover:border-slate-300'
                        }`}
                      >
                        {/* Real Avatar */}
                        <div className="w-9 h-9 rounded-full overflow-hidden shrink-0 bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-xs text-cyan-300">
                          {other?.avatarUrl ? (
                            <img src={other.avatarUrl} alt="" className="w-full h-full object-cover" />
                          ) : (
                            name.charAt(0)
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className={`font-extrabold truncate max-w-[150px] ${isDark ? 'text-slate-100' : 'text-[#0b1c30]'}`}>
                              {name}
                            </span>
                            <span className="text-[10px] text-slate-400 font-medium">{timeFormatted}</span>
                          </div>
                          <p className={`text-xs line-clamp-1 mb-1.5 ${isDark ? 'text-slate-400' : 'text-[#444653]'}`}>
                            {ch.lastMessage}
                          </p>
                          <div className="flex items-center justify-between">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                              isDark ? 'bg-slate-800 text-cyan-300' : 'bg-[#eff4ff] text-[#0051d5]'
                            }`}>
                              {role}
                            </span>
                            {unread > 0 ? (
                              <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white font-extrabold text-[10px] animate-pulse">
                                {unread} nuevo{unread > 1 ? 's' : ''}
                              </span>
                            ) : (
                              <span className="text-[10px] text-slate-400 flex items-center gap-1 font-medium">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                {isEn ? 'Active' : 'Oficial'}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <div className={`p-3 border-t flex items-center justify-between text-[11px] shrink-0 ${
                isDark ? 'border-slate-800 text-slate-400 bg-slate-950/80' : 'border-[#e5eeff] text-[#757684] bg-white'
              }`}>
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-xs text-cyan-400">lock</span>
                  <span>{isEn ? 'Encrypted messaging' : 'Mensajería institucional cifrada'}</span>
                </span>
                <span>I.E. Vallejuelos</span>
              </div>
            </aside>

            {/* PANEL DERECHO: Ventana de conversación activa */}
            <section className="flex-1 flex flex-col min-w-0">
              {/* Header del Chat */}
              <div className={`p-4 border-b flex items-center justify-between shrink-0 ${
                isDark ? 'border-slate-800 bg-slate-950/60' : 'border-[#e5eeff] bg-slate-50'
              }`}>
                {otherParticipant || selectedRecipient ? (
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-cyan-600/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center font-bold text-sm shrink-0">
                      {(otherParticipant?.avatarUrl || selectedRecipient?.avatarUrl) ? (
                        <img
                          src={otherParticipant?.avatarUrl || selectedRecipient?.avatarUrl}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        (otherParticipant?.fullName || selectedRecipient?.fullName || 'U').charAt(0)
                      )}
                    </div>
                    <div className="min-w-0">
                      <h3 className={`font-black text-sm truncate ${isDark ? 'text-white' : 'text-[#0b1c30]'}`}>
                        {otherParticipant?.fullName || selectedRecipient?.fullName}
                      </h3>
                      <p className={`text-xs font-semibold truncate ${isDark ? 'text-cyan-400' : 'text-[#0051d5]'}`}>
                        {otherParticipant?.role || selectedRecipient?.roleLabel}
                        {(otherParticipant?.detail || selectedRecipient?.detail) && (
                          <span className="text-slate-400 font-normal"> • {otherParticipant?.detail || selectedRecipient?.detail}</span>
                        )}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-slate-400">chat</span>
                    <span className={`text-xs font-bold ${isDark ? 'text-slate-400' : 'text-[#444653]'}`}>
                      {isEn ? 'Select or start a conversation' : 'Selecciona o inicia una conversación'}
                    </span>
                  </div>
                )}

                <div className="flex items-center gap-2 shrink-0">
                  {selectedConvId && (
                    <button
                      type="button"
                      onClick={() => setShowDeleteModal(true)}
                      className="px-2.5 py-1.5 rounded-xl text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer border border-rose-900/40"
                      title={isEn ? 'Delete conversation' : 'Eliminar conversación'}
                    >
                      <span className="material-symbols-outlined text-[17px]">delete</span>
                      <span className="hidden sm:inline">{isEn ? 'Delete' : 'Eliminar'}</span>
                    </button>
                  )}
                  <button
                    onClick={() => setShowCitationModal(true)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer flex items-center gap-1 ${
                      isDark
                        ? 'border-indigo-500/30 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300'
                        : 'border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-900'
                    }`}
                  >
                    <span className="material-symbols-outlined text-sm">event_note</span>
                    <span className="hidden sm:inline">{isEn ? 'Cite' : 'Citación'}</span>
                  </button>
                </div>
              </div>

              {/* Mensajes del Chat */}
              <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4">
                {isLoadingMessages ? (
                  <div className="py-16 text-center">
                    <div className="w-8 h-8 border-3 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    <p className="text-xs text-slate-400">{isEn ? 'Loading messages...' : 'Cargando mensajes cifrados...'}</p>
                  </div>
                ) : !selectedConvId && !selectedRecipient ? (
                  <div className="py-24 text-center max-w-sm mx-auto">
                    <div className={`w-16 h-16 rounded-2xl mx-auto flex items-center justify-center mb-3 ${
                      isDark ? 'bg-slate-800 text-cyan-400' : 'bg-[#eff4ff] text-[#0051d5]'
                    }`}>
                      <span className="material-symbols-outlined text-3xl">mark_email_unread</span>
                    </div>
                    <h3 className={`font-black text-sm mb-1 ${isDark ? 'text-white' : 'text-[#0b1c30]'}`}>
                      {isEn ? 'No conversation selected' : 'Ninguna conversación seleccionada'}
                    </h3>
                    <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-[#757684]'}`}>
                      {isEn
                        ? 'Select an existing conversation from the inbox on the left or create a new message.'
                        : 'Elige una conversación de la bandeja de entrada o haz clic en "Nuevo Mensaje" para comunicarte.'}
                    </p>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="py-20 text-center max-w-sm mx-auto">
                    <span className="material-symbols-outlined text-4xl text-cyan-400 mb-2">waving_hand</span>
                    <h3 className={`font-black text-sm mb-1 ${isDark ? 'text-white' : 'text-[#0b1c30]'}`}>
                      {isEn ? 'Start of this conversation' : 'Inicio de esta conversación'}
                    </h3>
                    <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-[#757684]'}`}>
                      {isEn
                        ? 'Send the first message to connect officially with this contact.'
                        : 'Envía el primer mensaje para establecer comunicación oficial con este usuario.'}
                    </p>
                  </div>
                ) : (
                  messages.map((m) => {
                    const isMine = m.senderId === effectiveUserId;
                    const timeFormatted = new Date(m.createdAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit'
                    });

                    return (
                      <div
                        key={m.id}
                        className={`flex flex-col ${isMine ? 'items-end' : 'items-start'} animate-in fade-in`}
                      >
                        <div className="flex items-center gap-1.5 mb-1 px-1">
                          <div className="w-4 h-4 rounded-full overflow-hidden bg-slate-700 flex items-center justify-center text-[9px] text-white">
                            {m.senderAvatar ? (
                              <img src={m.senderAvatar} alt="" className="w-full h-full object-cover" />
                            ) : (
                              m.senderName.charAt(0)
                            )}
                          </div>
                          <span className={`text-[11px] font-extrabold ${isDark ? 'text-slate-300' : 'text-[#0b1c30]'}`}>
                            {isMine ? (isEn ? 'You (Teacher)' : 'Tú (Docente)') : m.senderName}
                          </span>
                          <span className="text-[10px] text-slate-400">{timeFormatted}</span>
                        </div>
                        <div
                          className={`max-w-xl rounded-2xl p-4 text-xs leading-relaxed whitespace-pre-wrap shadow-xs ${
                            isMine
                              ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-br-xs'
                              : isDark
                              ? 'bg-slate-800 text-slate-100 rounded-bl-xs border border-slate-700/80'
                              : 'bg-[#eff4ff] text-[#0b1c30] rounded-bl-xs border border-[#dce9ff]'
                          }`}
                        >
                          {m.text}
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Formulario de Envío de Mensajes */}
              {(selectedConvId || selectedRecipient) && (
                <form
                  onSubmit={handleSendMessage}
                  className={`p-4 border-t flex items-center gap-3 shrink-0 ${
                    isDark ? 'border-slate-800 bg-slate-950/80' : 'border-[#e5eeff] bg-white'
                  }`}
                >
                  <input
                    type="text"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder={
                      isEn
                        ? 'Type an official message or response...'
                        : 'Escribe un mensaje o respuesta institucional...'
                    }
                    className={`flex-1 px-4 py-3 rounded-xl text-xs focus:outline-none border transition-all ${
                      isDark
                        ? 'bg-slate-900 border-slate-700 text-white placeholder:text-slate-500 focus:border-cyan-500'
                        : 'bg-[#eff4ff] border-[#dce9ff] text-[#0b1c30] placeholder:text-[#757684] focus:border-[#0051d5]'
                    }`}
                  />
                  <button
                    type="submit"
                    disabled={isSending || !replyText.trim()}
                    className="h-11 px-5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider shadow-md cursor-pointer transition-transform active:scale-95 flex items-center gap-2"
                  >
                    <span>{isEn ? 'Send' : 'Enviar'}</span>
                    <span className="material-symbols-outlined text-base">send</span>
                  </button>
                </form>
              )}
            </section>
          </div>
        </main>
      </div>

      {/* MODAL: CONFIRMACIÓN ELIMINAR CONVERSACIÓN */}
      {showDeleteModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-150"
        >
          <div className={`w-full max-w-md rounded-3xl border shadow-2xl overflow-hidden p-6 ${
            isDark ? 'bg-slate-900 border-rose-900/50 text-white' : 'bg-white border-rose-200 text-slate-900'
          }`}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center">
                <span className="material-symbols-outlined text-2xl">delete_forever</span>
              </div>
              <div>
                <h3 className="font-bold text-base leading-tight">
                  {isEn ? 'Delete conversation?' : '¿Eliminar conversación?'}
                </h3>
                <p className="text-xs text-rose-400 font-semibold">
                  {isEn ? 'Action only affects your inbox' : 'Esta acción solo afectará tu bandeja'}
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed mb-6">
              {isEn
                ? 'This conversation will be hidden from your inbox. The other participant will keep their full chat history.'
                : 'Esta conversación se ocultará de tu bandeja de comunicaciones. El acudiente o usuario destinatario conservará el historial completo de mensajes.'}
            </p>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                disabled={isDeletingConv}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                {isEn ? 'Cancel' : 'Cancelar'}
              </button>
              <button
                type="button"
                onClick={handleDeleteConversation}
                disabled={isDeletingConv}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md transition-all cursor-pointer flex items-center gap-1.5"
              >
                <span>{isDeletingConv ? (isEn ? 'Deleting...' : 'Eliminando...') : (isEn ? 'Yes, delete' : 'Sí, eliminar conversación')}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: SELECCIONAR CONTACTO AUTORIZADO (NUEVO MENSAJE) */}
      {showNewChatModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
          <div className={`w-full max-w-lg rounded-3xl border shadow-2xl p-6 overflow-hidden flex flex-col max-h-[85vh] ${
            isDark ? 'bg-slate-900 border-slate-700 text-slate-100 shadow-black/80' : 'bg-white border-[#e5eeff] text-[#0b1c30]'
          }`}>
            <div className={`flex items-center justify-between pb-3 border-b shrink-0 ${
              isDark ? 'border-slate-800' : 'border-[#eff4ff]'
            }`}>
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-cyan-400 text-2xl">person_search</span>
                <h3 className="font-extrabold text-base">{isEn ? 'New Official Conversation' : 'Nuevo Diálogo Institucional'}</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowNewChatModal(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-white cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="mt-3 mb-2 shrink-0">
              <input
                type="text"
                value={contactSearch}
                onChange={(e) => setContactSearch(e.target.value)}
                placeholder={isEn ? 'Search by name, role or student...' : 'Buscar acudiente, estudiante o directivo...'}
                className={`w-full px-3.5 py-2 rounded-xl text-xs border focus:outline-none ${
                  isDark ? 'bg-slate-950 border-slate-700 text-white' : 'bg-[#eff4ff] border-[#dce9ff] text-[#0b1c30]'
                }`}
              />
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1 mt-2">
              {filteredContacts.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-400">
                  {isEn ? 'No matching authorized contacts found.' : 'No se encontraron contactos autorizados para esa búsqueda.'}
                </div>
              ) : (
                filteredContacts.map((contact) => (
                  <div
                    key={contact.id}
                    onClick={() => handleStartChatWithContact(contact)}
                    className={`p-3 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${
                      isDark
                        ? 'bg-slate-950/60 border-slate-800 hover:border-cyan-500/60 hover:bg-slate-950'
                        : 'bg-[#f8faff] border-[#e5eeff] hover:border-[#0051d5] hover:bg-white shadow-xs'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-full overflow-hidden bg-cyan-600/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center font-bold text-sm shrink-0">
                        {contact.avatarUrl ? (
                          <img src={contact.avatarUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                          contact.fullName.charAt(0)
                        )}
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-extrabold text-xs truncate">{contact.fullName}</h4>
                        <p className="text-[11px] text-cyan-400 font-semibold">{contact.roleLabel}</p>
                        {contact.detail && <p className="text-[10px] text-slate-400 truncate">{contact.detail}</p>}
                      </div>
                    </div>
                    <span className="material-symbols-outlined text-cyan-400 text-lg">chat</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CITACIÓN OFICIAL A ACUDIENTE */}
      {showCitationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
          <div className={`w-full max-w-lg rounded-3xl border shadow-2xl p-6 overflow-hidden flex flex-col max-h-[90vh] ${
            isDark ? 'bg-slate-900 border-slate-700 text-slate-100 shadow-black/80' : 'bg-white border-[#e5eeff] text-[#0b1c30]'
          }`}>
            <div className={`flex items-center justify-between pb-3 border-b shrink-0 ${
              isDark ? 'border-slate-800' : 'border-[#eff4ff]'
            }`}>
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-amber-500 text-2xl">event_note</span>
                <div>
                  <h3 className="font-extrabold text-base">{isEn ? 'Official Guardian Citation' : 'Citación Oficial a Acudiente'}</h3>
                  <p className="text-xs text-amber-400 font-medium">I.E. Vallejuelos • Medellín</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCitationModal(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-white cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleCreateCitation} className="space-y-3.5 mt-4 text-xs overflow-y-auto pr-1 flex-1">
              <div>
                <label className="block font-bold text-slate-400 mb-1">
                  {isEn ? 'Assigned Student' : 'Estudiante del Grupo Asignado'} *
                </label>
                <select
                  value={citationStudentDoc}
                  onChange={(e) => setCitationStudentDoc(e.target.value)}
                  className={`w-full p-2.5 rounded-xl text-xs font-semibold border outline-none cursor-pointer ${
                    isDark ? 'bg-slate-950 border-slate-700 text-white' : 'bg-[#eff4ff] border-[#dce9ff] text-[#0b1c30]'
                  }`}
                >
                  {assignedStudents.map((s) => (
                    <option key={s.documentId} value={s.documentId} className={isDark ? 'bg-slate-900 text-white' : 'bg-white'}>
                      {s.fullName} — Grado {s.group} (Doc: {s.documentId})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-400 mb-1">
                  {isEn ? 'Official Guardian (Linked):' : 'Acudiente Oficial Vinculado:'}
                </label>
                <div className={`w-full p-2.5 rounded-xl text-xs font-bold border flex items-center justify-between ${
                  isDark ? 'bg-slate-950/80 border-slate-800 text-cyan-300' : 'bg-slate-100 border-slate-300 text-blue-900'
                }`}>
                  <span>{citationGuardianName}</span>
                  <span className="material-symbols-outlined text-sm opacity-60">verified</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-400 mb-1">
                    {isEn ? 'Date' : 'Fecha'} *
                  </label>
                  <input
                    type="date"
                    value={citationDate}
                    onChange={(e) => setCitationDate(e.target.value)}
                    className={`w-full p-2.5 rounded-xl text-xs font-semibold border outline-none cursor-pointer ${
                      isDark ? 'bg-slate-950 border-slate-700 text-white' : 'bg-[#eff4ff] border-[#dce9ff] text-[#0b1c30]'
                    }`}
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-400 mb-1">
                    {isEn ? 'Time' : 'Hora'} *
                  </label>
                  <input
                    type="time"
                    value={citationTime}
                    onChange={(e) => setCitationTime(e.target.value)}
                    className={`w-full p-2.5 rounded-xl text-xs font-semibold border outline-none cursor-pointer ${
                      isDark ? 'bg-slate-950 border-slate-700 text-white' : 'bg-[#eff4ff] border-[#dce9ff] text-[#0b1c30]'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-400 mb-1">
                  {isEn ? 'Reason for Citation' : 'Motivo de la Citación'} *
                </label>
                <input
                  type="text"
                  value={citationReason}
                  onChange={(e) => setCitationReason(e.target.value)}
                  className={`w-full p-2.5 rounded-xl text-xs border outline-none ${
                    isDark ? 'bg-slate-950 border-slate-700 text-white' : 'bg-[#eff4ff] border-[#dce9ff] text-[#0b1c30]'
                  }`}
                />
              </div>

              <div>
                <label className="block font-bold text-slate-400 mb-1">
                  {isEn ? 'Academic Notes & Guidance' : 'Indicaciones y Observaciones'}
                </label>
                <textarea
                  rows={3}
                  value={citationNotes}
                  onChange={(e) => setCitationNotes(e.target.value)}
                  className={`w-full p-2.5 rounded-xl text-xs border outline-none resize-none ${
                    isDark ? 'bg-slate-950 border-slate-700 text-white' : 'bg-[#eff4ff] border-[#dce9ff] text-[#0b1c30]'
                  }`}
                />
              </div>

              <div className={`pt-3 border-t flex justify-end gap-2.5 ${
                isDark ? 'border-slate-800' : 'border-[#eff4ff]'
              }`}>
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
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold text-xs shadow-md cursor-pointer transition-all active:scale-95 flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-sm">send</span>
                  <span>{isSending ? (isEn ? 'Generating...' : 'Generando...') : isEn ? 'Emit Citation' : 'Emitir Citación'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
