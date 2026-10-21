import React, { useState, useEffect, useMemo, useRef } from 'react';
import { ActiveScreen, UserProfile } from '../types';
import { useThemeLanguage } from '../context/ThemeLanguageContext';
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

interface FamilyMessagingViewProps {
  currentUser?: UserProfile | null;
  onNavigate: (screen: ActiveScreen) => void;
  onLogout: () => void;
}

export const FamilyMessagingView: React.FC<FamilyMessagingViewProps> = ({
  currentUser,
  onNavigate
}) => {
  const { theme, language } = useThemeLanguage();
  const isDark = theme === 'dark';
  const isEn = language === 'en';

  const effectiveUserId = currentUser?.id || (currentUser?.documentId ? `guardian_${currentUser.documentId}` : 'demo-family-1');
  const familyName = currentUser?.fullName || 'Elena Gómez de Jiménez';
  const studentRef = currentUser?.studentName ? `${currentUser.studentName} (${currentUser.gradeLevel || 'Estudiante'})` : 'Estudiante Institucional';

  // State
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // New Chat Modal
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [authorizedContacts, setAuthorizedContacts] = useState<AuthorizedContact[]>([]);
  const [contactSearch, setContactSearch] = useState('');
  const [selectedRecipient, setSelectedRecipient] = useState<AuthorizedContact | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // 1. Subscribe to real-time conversations for this guardian
  useEffect(() => {
    // Also listen on possible aliases: user ID and guardian documentId
    const docAlias = currentUser?.documentId ? `guardian_${currentUser.documentId}` : null;
    const targetId = currentUser?.id || docAlias || 'demo-family-1';

    const unsubscribe = subscribeUserConversations(targetId, (convs) => {
      setConversations(convs);
      if (convs.length > 0 && !selectedConvId) {
        setSelectedConvId(convs[0].id);
      }
    });

    return () => unsubscribe();
  }, [currentUser, selectedConvId]);

  // 2. Fetch authorized contacts (Teachers and Admin Staff)
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

  // Active conversation object
  const activeConversation = useMemo(() => {
    return conversations.find((c) => c.id === selectedConvId) || null;
  }, [conversations, selectedConvId]);

  // The other participant in the conversation (Teacher or Directivo)
  const otherParticipant = useMemo(() => {
    if (!activeConversation) return null;
    const targetId = currentUser?.id || (currentUser?.documentId ? `guardian_${currentUser.documentId}` : 'demo-family-1');
    const otherId = activeConversation.participantIds.find((id) => id !== targetId && !id.includes(currentUser?.documentId || '___'));
    if (!otherId) return null;
    return activeConversation.participants[otherId] || null;
  }, [activeConversation, currentUser]);

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

  // Send reply message
  const handleSendMessage = async (e?: React.FormEvent, directText?: string) => {
    if (e) e.preventDefault();
    const content = directText || replyText;
    if (!content.trim() || isSending) return;

    const recipient = otherParticipant || selectedRecipient;
    if (!recipient) {
      showToast(isEn ? 'Please select a teacher first.' : 'Por favor selecciona un docente primero.');
      return;
    }

    const senderProfile: UserProfile = currentUser || {
      id: effectiveUserId,
      fullName: familyName,
      role: 'family',
      documentId: currentUser?.documentId || '43892015',
      email: currentUser?.email || 'elena.gomez@edulink.edu.co'
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
        text: content.trim()
      });

      setReplyText('');
      showToast(isEn ? 'Message sent to teacher.' : 'Mensaje enviado al docente correctamente.');
    } catch (err) {
      console.error('Error sending message:', err);
      showToast(isEn ? 'Failed to send message.' : 'Error al enviar el mensaje.');
    } finally {
      setIsSending(false);
    }
  };

  const handleStartChatWithContact = (contact: AuthorizedContact) => {
    setShowNewChatModal(false);
    setSelectedRecipient(contact);

    const existing = conversations.find((c) => c.participantIds.includes(contact.id));
    if (existing) {
      setSelectedConvId(existing.id);
    } else {
      setSelectedConvId(null);
    }
  };

  return (
    <div className={`min-h-screen flex transition-colors duration-200 ${
      isDark ? 'bg-slate-950 text-slate-100' : 'bg-[#f8f9ff] text-[#0b1c30]'
    }`}>
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-16 right-4 z-50 bg-slate-900 border border-cyan-500/40 text-cyan-300 px-4 py-2.5 rounded-2xl shadow-2xl flex items-center gap-2 text-xs font-bold animate-in fade-in duration-200">
          <span className="material-symbols-outlined text-[18px]">info</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* FIXED SIDEBAR (Portal Familiar) */}
      <aside className={`hidden lg:flex fixed left-0 top-12 bottom-0 w-72 shadow-xs z-40 flex-col justify-between border-r transition-colors ${
        isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-[#e5eeff]'
      }`}>
        <div className="flex flex-col">
          <div className={`h-20 px-6 flex items-center gap-3 border-b ${
            isDark ? 'border-slate-800' : 'border-[#eff4ff]'
          }`}>
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border ${
              isDark ? 'bg-amber-950 border-amber-800 text-amber-300' : 'bg-[#eff4ff] border-[#dce9ff] text-[#00288e]'
            }`}>
              <span className="material-symbols-outlined text-2xl">family_restroom</span>
            </div>
            <div className="flex flex-col">
              <span className={`text-base font-extrabold leading-tight ${isDark ? 'text-white' : 'text-[#00288e]'}`}>
                Edulink School
              </span>
              <span className={`text-[11px] font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-[#444653]'}`}>
                {isEn ? 'Family Portal' : 'Portal Familiar'}
              </span>
            </div>
          </div>

          <nav className="flex flex-col gap-1 px-4 py-4">
            <button
              onClick={() => onNavigate('family_dashboard')}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all text-left cursor-pointer ${
                isDark ? 'text-slate-300 hover:bg-slate-800 hover:text-white' : 'text-[#444653] hover:bg-[#eff4ff] hover:text-[#0b1c30]'
              }`}
            >
              <span className="material-symbols-outlined text-xl">dashboard</span>
              <span className="text-xs font-semibold">{isEn ? 'Home / Overview' : 'Inicio / Dashboard'}</span>
            </button>
            <button
              onClick={() => onNavigate('family_dashboard')}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all text-left cursor-pointer ${
                isDark ? 'text-slate-300 hover:bg-slate-800 hover:text-white' : 'text-[#444653] hover:bg-[#eff4ff] hover:text-[#0b1c30]'
              }`}
            >
              <span className="material-symbols-outlined text-xl">assignment</span>
              <span className="text-xs font-semibold">{isEn ? 'Grades & Reports' : 'Calificaciones y Boletines'}</span>
            </button>
            <button
              onClick={() => onNavigate('family_dashboard')}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all text-left cursor-pointer ${
                isDark ? 'text-slate-300 hover:bg-slate-800 hover:text-white' : 'text-[#444653] hover:bg-[#eff4ff] hover:text-[#0b1c30]'
              }`}
            >
              <span className="material-symbols-outlined text-xl">calendar_today</span>
              <span className="text-xs font-semibold">{isEn ? 'Attendance & Schedule' : 'Asistencia y Horario'}</span>
            </button>
            <button
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl font-bold text-xs shadow-sm transition-all text-left cursor-default ${
                isDark ? 'bg-amber-600/20 text-amber-300 border border-amber-500/30' : 'bg-[#1e40af] text-white'
              }`}
            >
              <span className="material-symbols-outlined text-xl">mail</span>
              <span>{isEn ? 'Notices & Citations' : 'Mensajería y Citaciones'}</span>
            </button>
          </nav>

          <div className="px-4 mt-2">
            <button
              onClick={() => setShowNewChatModal(true)}
              className="w-full py-3 rounded-2xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-cyan-600/20 cursor-pointer transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-lg">edit_square</span>
              <span>{isEn ? 'Contact Teacher' : 'Contactar Docente'}</span>
            </button>
          </div>
        </div>

        <div className={`p-4 border-t ${isDark ? 'border-slate-800' : 'border-[#eff4ff]'}`}>
          <div className={`p-3.5 rounded-2xl flex flex-col gap-1 border ${
            isDark ? 'bg-slate-800/60 border-slate-700' : 'bg-[#eff4ff] border-[#dce9ff]'
          }`}>
            <div className={`flex items-center gap-1.5 ${isDark ? 'text-slate-300' : 'text-[#444653]'}`}>
              <span className={`material-symbols-outlined text-sm ${isDark ? 'text-amber-400' : 'text-[#0051d5]'}`}>account_balance</span>
              <span className="text-[11px] font-bold">I.E. Vallejuelos</span>
            </div>
            <span className={`text-xs font-bold ${isDark ? 'text-white' : 'text-[#0b1c30]'}`}>
              {studentRef}
            </span>
          </div>
        </div>
      </aside>

      {/* MAIN CONTAINER */}
      <div className="flex-1 lg:pl-72 flex flex-col min-w-0">
        {/* Header Bar */}
        <header className={`sticky top-12 h-16 backdrop-blur-xl shadow-xs z-30 flex items-center justify-between px-4 sm:px-6 lg:px-8 border-b transition-colors ${
          isDark ? 'bg-slate-900/95 border-slate-800' : 'bg-white/95 border-[#e5eeff]'
        }`}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-cyan-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
              {familyName.charAt(0)}
            </div>
            <div>
              <span className="text-xs font-bold block">{familyName}</span>
              <span className="text-[10px] text-cyan-500 font-semibold">{isEn ? 'Authorized Guardian' : 'Acudiente Autorizado'}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowNewChatModal(true)}
              className="px-3.5 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-base">chat</span>
              <span className="hidden sm:inline">{isEn ? 'New Chat' : 'Nuevo Mensaje'}</span>
            </button>
          </div>
        </header>

        {/* Content Area */}
        <div className="p-4 sm:p-6 lg:p-8 flex-1">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 min-h-[580px]">
            {/* Conversations List */}
            <div className={`md:col-span-5 rounded-3xl border p-4 flex flex-col justify-between ${
              isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'
            } shadow-sm`}>
              <div>
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800/40">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-amber-400">mark_chat_unread</span>
                    <h3 className="font-bold text-sm">{isEn ? 'Conversations & Citations' : 'Citaciones y Mensajes'}</h3>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 text-xs font-bold border border-amber-500/20">
                    {conversations.length}
                  </span>
                </div>

                {conversations.length === 0 ? (
                  <div className="py-12 px-4 text-center">
                    <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-slate-800/60 border border-slate-700 flex items-center justify-center text-slate-400">
                      <span className="material-symbols-outlined text-3xl">chat_bubble_outline</span>
                    </div>
                    <h4 className="font-bold text-sm text-slate-200 mb-1">
                      {isEn ? 'No conversations yet' : 'Todavía no tienes conversaciones'}
                    </h4>
                    <p className="text-xs text-slate-400 mb-4 max-w-xs mx-auto">
                      {isEn
                        ? 'When a teacher sends you an official citation or message, it will appear here.'
                        : 'Cuando un docente te envíe una citación oficial o mensaje, aparecerá registrado aquí en tiempo real.'}
                    </p>
                    <button
                      onClick={() => setShowNewChatModal(true)}
                      className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs transition-colors cursor-pointer inline-flex items-center gap-1.5"
                    >
                      <span className="material-symbols-outlined text-base">person_search</span>
                      <span>{isEn ? 'Message a Teacher' : 'Contactar a un docente'}</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
                    {conversations.map((ch) => {
                      const isSelected = selectedConvId === ch.id;
                      const participantsList = Object.values(ch.participants || {}) as ConversationParticipant[];
                      const other = participantsList.find(
                        (p) => p.id !== effectiveUserId && !p.id.includes(currentUser?.documentId || '___')
                      );
                      const name = other?.fullName || 'Docente Institucional';
                      const role = other?.role || 'Docente';
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
                              ? 'bg-amber-500/10 border-amber-500/60 shadow-md shadow-amber-950/20'
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
                            <span className="text-[10px] font-semibold text-amber-400 px-2 py-0.5 rounded-md bg-amber-950/40 border border-amber-800/40">
                              {role}
                            </span>
                            <span className="text-[10px] text-slate-400 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                              {isEn ? 'Official' : 'Oficial'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-800/40 text-[11px] text-slate-400 flex items-center justify-between">
                <span>I.E. Vallejuelos • Medellín</span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  Conexión segura
                </span>
              </div>
            </div>

            {/* Chat Box */}
            <div className={`md:col-span-7 rounded-3xl border flex flex-col justify-between overflow-hidden ${
              isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'
            } shadow-sm`}>
              {/* Header */}
              <div className={`p-4 border-b flex items-center justify-between shrink-0 ${
                isDark ? 'border-slate-800 bg-slate-950/70' : 'border-slate-200 bg-slate-50'
              }`}>
                {otherParticipant || selectedRecipient ? (
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-amber-600/20 text-amber-300 border border-amber-500/30 flex items-center justify-center font-bold text-sm">
                      {(otherParticipant?.fullName || selectedRecipient?.fullName || 'D').charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-slate-100">
                        {otherParticipant?.fullName || selectedRecipient?.fullName}
                      </h4>
                      <p className="text-xs text-amber-400 font-medium">
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
                    <span>{isEn ? 'Select a conversation' : 'Selecciona una conversación'}</span>
                  </div>
                )}

                <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  <span>Canal Institucional</span>
                </span>
              </div>

              {/* Messages Body */}
              <div className="p-4 space-y-3 flex-1 overflow-y-auto max-h-[460px]">
                {isLoadingMessages && (
                  <div className="py-8 text-center text-xs text-slate-400">
                    <span className="inline-block animate-spin mr-2">⟳</span>
                    {isEn ? 'Loading messages...' : 'Cargando mensajes...'}
                  </div>
                )}

                {!isLoadingMessages && messages.length === 0 && (
                  <div className="py-16 text-center text-slate-400">
                    <span className="material-symbols-outlined text-4xl mb-2 text-slate-400">chat</span>
                    <p className="text-xs font-medium">
                      {otherParticipant || selectedRecipient
                        ? isEn
                          ? 'Send a message to confirm attendance or ask a question.'
                          : 'Envía un mensaje para confirmar asistencia o realizar una consulta.'
                        : isEn
                        ? 'Todavía no tienes conversaciones activas seleccionadas.'
                        : 'Todavía no tienes conversaciones activas seleccionadas.'}
                    </p>
                  </div>
                )}

                {messages.map((msg) => {
                  const isSelf = msg.senderId === effectiveUserId || msg.senderRole.includes('Acudiente');
                  const timeString = new Date(msg.createdAt).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit'
                  });

                  return (
                    <div key={msg.id} className={`flex flex-col ${isSelf ? 'items-end' : 'items-start'}`}>
                      <div className="text-[10px] font-semibold text-slate-400 mb-1 px-1">
                        {isSelf ? `Tú (${familyName})` : `${msg.senderName} • ${msg.senderRole}`}
                      </div>

                      <div
                        className={`max-w-[85%] p-4 rounded-3xl text-xs shadow-md ${
                          isSelf
                            ? 'bg-amber-600 text-white rounded-br-xs shadow-amber-950/30'
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

              {/* Quick reply templates */}
              <div className="px-4 py-2 border-t border-slate-800/40 flex items-center gap-2 overflow-x-auto no-scrollbar text-[11px]">
                <button
                  type="button"
                  onClick={() => handleSendMessage(undefined, 'Buenas tardes profesor(a), confirmo mi asistencia a la citación programada.')}
                  className={`px-3 py-1 rounded-full border whitespace-nowrap cursor-pointer transition-all ${
                    isDark ? 'bg-slate-800/80 hover:bg-slate-700 border-slate-700 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700'
                  }`}
                >
                  ✓ Confirmar asistencia
                </button>
                <button
                  type="button"
                  onClick={() => handleSendMessage(undefined, 'Cordial saludo, solicito información sobre las fechas de recuperación del periodo.')}
                  className={`px-3 py-1 rounded-full border whitespace-nowrap cursor-pointer transition-all ${
                    isDark ? 'bg-slate-800/80 hover:bg-slate-700 border-slate-700 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700'
                  }`}
                >
                  ? Consultar recuperaciones
                </button>
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
                        ? 'Type reply as guardian...'
                        : 'Escribir respuesta al docente...'
                      : isEn
                      ? 'Select a teacher to reply...'
                      : 'Selecciona un docente para escribir...'
                  }
                  disabled={(!otherParticipant && !selectedRecipient) || isSending}
                  className={`flex-1 px-4 py-3 rounded-2xl text-xs border transition-colors outline-none ${
                    isDark
                      ? 'bg-slate-900 border-slate-700 text-white placeholder-slate-500 focus:border-amber-500'
                      : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-blue-500'
                  } disabled:opacity-50`}
                />
                <button
                  type="submit"
                  disabled={(!otherParticipant && !selectedRecipient) || !replyText.trim() || isSending}
                  className="px-5 py-3 rounded-2xl bg-amber-600 hover:bg-amber-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer disabled:cursor-not-allowed shadow-md shadow-amber-900/20 active:scale-95"
                >
                  <span>{isSending ? (isEn ? 'Sending...' : 'Enviando...') : isEn ? 'Reply' : 'Responder'}</span>
                  <span className="material-symbols-outlined text-base">send</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Modal: Select Authorized Teacher */}
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
                  <span className="material-symbols-outlined text-xl">school</span>
                </div>
                <div>
                  <h3 className="font-bold text-base">{isEn ? 'Institutional Teachers' : 'Docentes Institucionales'}</h3>
                  <p className="text-xs text-slate-400">Docentes y directivos oficiales de la I.E. Vallejuelos</p>
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
                  placeholder={isEn ? 'Search by teacher name or area...' : 'Buscar por nombre o asignatura...'}
                  className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-xs border outline-none ${
                    isDark ? 'bg-slate-950 border-slate-700 text-white focus:border-cyan-500' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>
            </div>

            <div className="p-4 max-h-[360px] overflow-y-auto space-y-2">
              {filteredContacts.length === 0 ? (
                <p className="text-center text-xs text-slate-400 py-8">
                  {isEn ? 'No teachers found.' : 'No se encontraron docentes con esa búsqueda.'}
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
                    <span className="material-symbols-outlined text-sm text-cyan-400">send</span>
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
    </div>
  );
};
