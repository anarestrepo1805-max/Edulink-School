import React, { useState } from 'react';
import { ActiveScreen, MessageThread } from '../types';
import { ASSETS, INITIAL_MESSAGE_THREADS } from '../data/mockData';

interface FamilyMessagingViewProps {
  onNavigate: (screen: ActiveScreen) => void;
  onLogout: () => void;
}

export const FamilyMessagingView: React.FC<FamilyMessagingViewProps> = ({
  onNavigate
}) => {
  const [threads, setThreads] = useState<MessageThread[]>(INITIAL_MESSAGE_THREADS);
  const [selectedThreadId, setSelectedThreadId] = useState<string>('msg-1');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'teachers' | 'meetings' | 'official'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [replyText, setReplyText] = useState('');

  const activeThread = threads.find((t) => t.id === selectedThreadId) || threads[0];

  const filteredThreads = threads.filter((t) => {
    const matchesSearch =
      t.senderName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.subject.toLowerCase().includes(searchTerm.toLowerCase());
    if (!matchesSearch) return false;
    if (categoryFilter === 'all') return true;
    if (categoryFilter === 'teachers') return t.category === 'profesores';
    if (categoryFilter === 'meetings') return t.category === 'citaciones';
    if (categoryFilter === 'official') return t.category === 'circulares';
    return true;
  });

  const handleSendMessage = (textToSend?: string) => {
    const content = textToSend || replyText;
    if (!content.trim()) return;

    const newMsg = {
      id: `reply-${Date.now()}`,
      sender: 'Elena Jiménez (Acudiente)',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isSelf: true,
      text: content
    };

    setThreads((prev) =>
      prev.map((t) => {
        if (t.id === selectedThreadId) {
          return {
            ...t,
            messages: [...t.messages, newMsg],
            unread: false
          };
        }
        return t;
      })
    );

    setReplyText('');
  };

  const handleQuickTemplate = (template: string) => {
    handleSendMessage(template);
  };

  return (
    <div className="min-h-screen bg-[#f8f9ff] flex text-[#0b1c30]">
      {/* FIXED SIDEBAR (Portal Familiar) */}
      <aside className="hidden lg:flex fixed left-0 top-12 bottom-0 w-72 bg-white shadow-[0_1px_8px_rgba(0,0,0,0.04)] z-40 flex-col justify-between border-r border-[#e5eeff]">
        <div className="flex flex-col">
          <div className="h-20 px-6 flex items-center gap-3 border-b border-[#eff4ff]">
            <div className="w-10 h-10 rounded-xl bg-[#eff4ff] flex items-center justify-center text-[#00288e] shrink-0 border border-[#dce9ff]">
              <span className="material-symbols-outlined text-2xl">school</span>
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-extrabold text-[#00288e] leading-tight">
                Edulink School
              </span>
              <span className="text-[11px] font-bold text-[#444653] uppercase tracking-wider">
                Portal Familiar
              </span>
            </div>
          </div>

          <nav className="flex flex-col gap-1 px-4 py-4">
            <button
              onClick={() => onNavigate('family_dashboard')}
              className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-[#444653] hover:bg-[#eff4ff] hover:text-[#0b1c30] transition-all text-left"
            >
              <span className="material-symbols-outlined text-xl">dashboard</span>
              <span className="text-xs font-semibold">Inicio / Dashboard</span>
            </button>
            <button
              onClick={() => alert('Boletines oficiales de calificaciones firmados por Rectoría.')}
              className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-[#444653] hover:bg-[#eff4ff] hover:text-[#0b1c30] transition-all text-left"
            >
              <span className="material-symbols-outlined text-xl">assignment</span>
              <span className="text-xs font-semibold">Calificaciones y Boletines</span>
            </button>
            <button
              onClick={() => alert('Módulo de asistencia y asignaturas.')}
              className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-[#444653] hover:bg-[#eff4ff] hover:text-[#0b1c30] transition-all text-left"
            >
              <span className="material-symbols-outlined text-xl">calendar_today</span>
              <span className="text-xs font-semibold">Asistencia y Asignaturas</span>
            </button>
            <button
              onClick={() => alert('Observador convivencial del estudiante.')}
              className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-[#444653] hover:bg-[#eff4ff] hover:text-[#0b1c30] transition-all text-left"
            >
              <span className="material-symbols-outlined text-xl">verified_user</span>
              <span className="text-xs font-semibold">Observador Convivencial</span>
            </button>
            <button
              onClick={() => onNavigate('family_messaging')}
              className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-[#1e40af] text-white font-bold text-xs shadow-sm transition-all text-left"
            >
              <span className="material-symbols-outlined text-xl">mail</span>
              <span>Comunicados y Citaciones</span>
            </button>
            <button
              onClick={() => onNavigate('student_assignment')}
              className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-[#444653] hover:bg-[#eff4ff] hover:text-[#0b1c30] transition-all text-left"
            >
              <span className="material-symbols-outlined text-xl">contact_phone</span>
              <span className="text-xs font-semibold">Tareas y contacto profesores</span>
            </button>
            <button
              onClick={() => alert('Configuración general.')}
              className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-[#444653] hover:bg-[#eff4ff] hover:text-[#0b1c30] transition-all text-left"
            >
              <span className="material-symbols-outlined text-xl">settings</span>
              <span className="text-xs font-semibold">Configuración</span>
            </button>
          </nav>
        </div>

        <div className="p-4 border-t border-[#eff4ff]">
          <div className="p-3.5 rounded-xl bg-[#eff4ff] flex flex-col gap-1 border border-[#dce9ff]">
            <div className="flex items-center gap-1.5 text-[#444653]">
              <span className="material-symbols-outlined text-sm text-[#0051d5]">account_balance</span>
              <span className="text-[11px] font-bold">I.E. Vallejuelos</span>
            </div>
            <span className="text-xs text-[#0b1c30] font-bold">Año lectivo 2026</span>
          </div>
        </div>
      </aside>

      {/* MAIN CONTAINER */}
      <div className="flex-1 lg:pl-72 flex flex-col min-w-0">
        {/* TOP BAR */}
        <header className="sticky top-12 h-20 bg-white/95 backdrop-blur-xl shadow-xs z-30 flex items-center justify-between px-4 sm:px-6 lg:px-8 border-b border-[#e5eeff]">
          <div className="flex items-center">
            <button
              onClick={() => onNavigate('family_dashboard')}
              className="flex items-center gap-3 px-3.5 py-1.5 rounded-xl bg-[#eff4ff] hover:bg-[#e5eeff] transition-colors border border-[#dce9ff]"
            >
              <div className="w-9 h-9 rounded-full bg-[#1e40af] text-white flex items-center justify-center font-bold text-sm shrink-0">
                M
              </div>
              <div className="flex flex-col text-left">
                <span className="text-[10px] text-[#444653] font-medium leading-none">
                  Viendo información de:
                </span>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-[#0b1c30] font-bold">Miguel Ángel Jiménez</span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-[#dce9ff] text-[#00288e] text-[10px] font-bold">
                    Grado 11°B
                  </span>
                </div>
              </div>
            </button>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="flex flex-col text-right hidden sm:flex">
                <span className="text-xs text-[#0b1c30] font-bold">Elena Jiménez</span>
                <span className="text-[11px] text-[#444653]">Acudiente Principal</span>
              </div>
              <img
                alt="Profile"
                className="w-9 h-9 rounded-full object-cover ring-2 ring-[#00288e]/20 shadow-xs"
                src={ASSETS.parentAvatar}
              />
            </div>
          </div>
        </header>

        {/* WORKSPACE CONTENT: 2-PANE MESSAGING CLIENT */}
        <main className="p-4 sm:p-6 lg:p-8 flex flex-col gap-4 max-w-[1500px] w-full mx-auto">
          {/* Top Breadcrumb strip */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-xs">
              <button
                onClick={() => onNavigate('family_dashboard')}
                className="text-[#444653] hover:text-[#00288e] font-semibold flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-base">arrow_back</span>
                <span>Volver al Dashboard</span>
              </button>
              <span className="text-[#c4c5d5]">/</span>
              <span className="text-[#00288e] font-bold">Bandeja de Comunicados Oficiales y Docentes</span>
            </div>
            <span className="text-xs text-[#444653] font-medium hidden sm:inline">
              Canal oficial certificado con acudientes
            </span>
          </div>

          {/* 2-Pane Box */}
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden flex flex-col lg:flex-row min-h-[640px] border border-[#e5eeff]">
            {/* LEFT PANE: Threads List (w-full lg:w-96) */}
            <div className="w-full lg:w-96 flex flex-col bg-white border-r border-[#eff4ff]">
              {/* Inbox Header */}
              <div className="p-4 flex flex-col gap-3 border-b border-[#eff4ff]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#0051d5] text-xl">inbox</span>
                    <h2 className="text-base font-extrabold text-[#0b1c30]">Bandeja de Entrada</h2>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-[#dbe1ff] text-[#00174b] text-[11px] font-bold">
                    3 sin leer
                  </span>
                </div>

                {/* Search */}
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-2.5 text-[#757684] text-base">
                    search
                  </span>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Buscar mensaje o docente..."
                    className="w-full h-9 pl-9 pr-3 rounded-xl bg-[#eff4ff] text-xs text-[#0b1c30] placeholder:text-[#757684] focus:outline-none focus:ring-2 focus:ring-[#0051d5]/30 border border-transparent focus:border-[#0051d5]"
                  />
                </div>

                {/* Filter Pills */}
                <div className="flex items-center gap-1 overflow-x-auto pb-1 text-[11px] font-bold">
                  <button
                    onClick={() => setCategoryFilter('all')}
                    className={`px-2.5 py-1 rounded-lg shrink-0 transition-colors ${
                      categoryFilter === 'all'
                        ? 'bg-[#1e40af] text-white'
                        : 'bg-[#eff4ff] text-[#444653] hover:text-[#0b1c30]'
                    }`}
                  >
                    Todos
                  </button>
                  <button
                    onClick={() => setCategoryFilter('teachers')}
                    className={`px-2.5 py-1 rounded-lg shrink-0 transition-colors ${
                      categoryFilter === 'teachers'
                        ? 'bg-[#1e40af] text-white'
                        : 'bg-[#eff4ff] text-[#444653] hover:text-[#0b1c30]'
                    }`}
                  >
                    Profesores
                  </button>
                  <button
                    onClick={() => setCategoryFilter('meetings')}
                    className={`px-2.5 py-1 rounded-lg shrink-0 transition-colors ${
                      categoryFilter === 'meetings'
                        ? 'bg-[#1e40af] text-white'
                        : 'bg-[#eff4ff] text-[#444653] hover:text-[#0b1c30]'
                    }`}
                  >
                    Citaciones
                  </button>
                  <button
                    onClick={() => setCategoryFilter('official')}
                    className={`px-2.5 py-1 rounded-lg shrink-0 transition-colors ${
                      categoryFilter === 'official'
                        ? 'bg-[#1e40af] text-white'
                        : 'bg-[#eff4ff] text-[#444653] hover:text-[#0b1c30]'
                    }`}
                  >
                    Circulares
                  </button>
                </div>
              </div>

              {/* Thread list */}
              <div className="flex-1 overflow-y-auto divide-y divide-[#eff4ff]">
                {filteredThreads.map((thread) => {
                  const isSelected = thread.id === activeThread.id;
                  const lastMsg = thread.messages[thread.messages.length - 1];

                  return (
                    <div
                      key={thread.id}
                      onClick={() => setSelectedThreadId(thread.id)}
                      className={`p-4 flex gap-3 cursor-pointer transition-colors relative ${
                        isSelected
                          ? 'bg-[#eff4ff] border-l-4 border-[#00288e]'
                          : 'hover:bg-slate-50'
                      }`}
                    >
                      <div className="relative shrink-0">
                        {thread.senderAvatar ? (
                          <img
                            alt={thread.senderName}
                            className="w-11 h-11 rounded-full object-cover shadow-xs"
                            src={thread.senderAvatar}
                          />
                        ) : (
                          <div className="w-11 h-11 rounded-full bg-[#eff4ff] text-[#00288e] flex items-center justify-center font-bold text-xs border border-[#dce9ff]">
                            IE
                          </div>
                        )}
                        {thread.unread && (
                          <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-[#ba1a1a] rounded-full ring-2 ring-white" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0 flex flex-col">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-[#0b1c30] truncate">
                            {thread.senderName}
                          </span>
                          <span className="text-[10px] text-[#444653] font-medium shrink-0 ml-1">
                            {thread.time}
                          </span>
                        </div>

                        <span className="text-[11px] font-bold text-[#00288e] truncate mt-0.5">
                          {thread.subject}
                        </span>

                        <p className="text-xs text-[#444653] truncate mt-0.5">
                          {lastMsg ? lastMsg.text : thread.preview}
                        </p>

                        <div className="mt-2 flex items-center gap-1.5">
                          <span className="text-[10px] uppercase font-bold text-[#757684] bg-[#eff4ff] px-2 py-0.5 rounded-md">
                            {thread.senderRole}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* RIGHT PANE: Chat View (flex-1) */}
            <div className="flex-1 flex flex-col bg-[#f8f9ff]">
              {/* Thread Header */}
              <div className="p-4 sm:p-5 bg-white border-b border-[#eff4ff] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  {activeThread.senderAvatar ? (
                    <img
                      alt={activeThread.senderName}
                      className="w-12 h-12 rounded-full object-cover ring-2 ring-[#00288e]/20 shadow-xs"
                      src={activeThread.senderAvatar}
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-[#dde1ff] text-[#00288e] flex items-center justify-center font-bold text-sm">
                      IE
                    </div>
                  )}

                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm sm:text-base font-extrabold text-[#0b1c30]">
                        {activeThread.senderName}
                      </h3>
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#059669] bg-[#d1fae5] px-2 py-0.5 rounded-full">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#059669]" />
                        En línea
                      </span>
                    </div>
                    <span className="text-xs text-[#444653]">{activeThread.senderRole}</span>
                    <span className="text-[11px] text-[#757684]">
                      Asunto: <strong className="text-[#0b1c30]">{activeThread.subject}</strong>
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <button
                    onClick={() => alert('Imprimiendo citación oficial.')}
                    className="p-2 rounded-xl text-[#444653] hover:bg-[#eff4ff] transition-colors"
                    title="Imprimir mensaje"
                  >
                    <span className="material-symbols-outlined text-lg">print</span>
                  </button>
                  <button
                    onClick={() => alert('Mensaje marcado con estrella.')}
                    className="p-2 rounded-xl text-[#444653] hover:bg-[#eff4ff] transition-colors"
                    title="Destacar"
                  >
                    <span className="material-symbols-outlined text-lg">star</span>
                  </button>
                  <button
                    onClick={() => alert('Historial de comunicación con este docente.')}
                    className="p-2 rounded-xl text-[#444653] hover:bg-[#eff4ff] transition-colors"
                    title="Más opciones"
                  >
                    <span className="material-symbols-outlined text-lg">more_vert</span>
                  </button>
                </div>
              </div>

              {/* Messages Flow Area */}
              <div className="flex-1 p-4 sm:p-6 overflow-y-auto flex flex-col gap-4">
                {/* Notice header */}
                <div className="flex justify-center">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#eff4ff] text-[#444653] text-[11px] font-semibold border border-[#dce9ff]">
                    <span className="material-symbols-outlined text-xs text-[#0051d5]">lock</span>
                    Canal cifrado y vinculado al expediente académico del alumno
                  </div>
                </div>

                {activeThread.messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${
                      msg.isSelf ? 'items-end' : 'items-start'
                    } max-w-xl ${msg.isSelf ? 'self-end' : 'self-start'}`}
                  >
                    <div className="flex items-center gap-2 mb-1 px-1 text-[11px] text-[#444653]">
                      <span className="font-bold">{msg.sender}</span>
                      <span>•</span>
                      <span>{msg.time}</span>
                    </div>

                    <div
                      className={`p-4 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-xs ${
                        msg.isSelf
                          ? 'bg-[#00288e] text-white rounded-tr-xs'
                          : 'bg-white text-[#0b1c30] rounded-tl-xs border border-[#e5eeff]'
                      }`}
                    >
                      <p>{msg.text}</p>

                      {msg.attachment && (
                        <div
                          onClick={() => alert(`Descargando ${msg.attachment?.name}`)}
                          className={`mt-3 p-3 rounded-xl flex items-center justify-between gap-3 cursor-pointer transition-colors ${
                            msg.isSelf
                              ? 'bg-white/10 hover:bg-white/20'
                              : 'bg-[#eff4ff] hover:bg-[#dbe1ff]'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="material-symbols-outlined text-xl text-[#ba1a1a]">
                              picture_as_pdf
                            </span>
                            <div className="flex flex-col min-w-0">
                              <span className="text-xs font-bold truncate">
                                {msg.attachment.name}
                              </span>
                              <span className="text-[10px] opacity-80">{msg.attachment.size}</span>
                            </div>
                          </div>
                          <span className="material-symbols-outlined text-lg">download</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Quick Template Replies */}
              <div className="px-4 py-2 bg-white/70 border-t border-[#eff4ff] flex items-center gap-2 overflow-x-auto text-xs">
                <span className="text-[11px] text-[#757684] font-bold shrink-0">Plantillas:</span>
                <button
                  onClick={() =>
                    handleQuickTemplate(
                      'Buenos días profesor Roberto. Confirmo mi asistencia puntual para la reunión de entrega de boletines.'
                    )
                  }
                  className="px-3 py-1 rounded-full bg-[#eff4ff] hover:bg-[#dbe1ff] text-[#00288e] text-xs font-semibold shrink-0 transition-colors border border-[#dce9ff]"
                >
                  Confirmar Asistencia
                </button>
                <button
                  onClick={() =>
                    handleQuickTemplate(
                      'Profesor, por motivos laborales se me dificulta el horario. ¿Sería posible coordinar un espacio virtual o el jueves a las 11:00 AM?'
                    )
                  }
                  className="px-3 py-1 rounded-full bg-[#eff4ff] hover:bg-[#dbe1ff] text-[#00288e] text-xs font-semibold shrink-0 transition-colors border border-[#dce9ff]"
                >
                  Solicitar Reprogramación
                </button>
                <button
                  onClick={() =>
                    handleQuickTemplate(
                      'Muchas gracias por el informe y por el constante acompañamiento pedagógico hacia Miguel Ángel.'
                    )
                  }
                  className="px-3 py-1 rounded-full bg-[#eff4ff] hover:bg-[#dbe1ff] text-[#00288e] text-xs font-semibold shrink-0 transition-colors border border-[#dce9ff]"
                >
                  Agradecer Información
                </button>
              </div>

              {/* Reply Input Box */}
              <div className="p-4 bg-white border-t border-[#eff4ff] flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => alert('Adjuntar constancia médica, permiso o documento PDF.')}
                    className="p-2.5 rounded-xl text-[#444653] hover:bg-[#eff4ff] transition-colors"
                    title="Adjuntar archivo"
                  >
                    <span className="material-symbols-outlined text-xl">attach_file</span>
                  </button>

                  <input
                    type="text"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSendMessage();
                    }}
                    placeholder={`Escribe un mensaje para ${activeThread.senderName}...`}
                    className="flex-1 h-11 px-4 rounded-xl bg-[#eff4ff] text-xs text-[#0b1c30] placeholder:text-[#757684] focus:outline-none focus:ring-2 focus:ring-[#0051d5]/30 border border-transparent focus:border-[#0051d5]"
                  />

                  <button
                    onClick={() => handleSendMessage()}
                    className="h-11 px-5 rounded-xl bg-[#00288e] hover:bg-[#1e40af] text-white text-xs font-bold shadow-xs hover:shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>Enviar</span>
                    <span className="material-symbols-outlined text-base">send</span>
                  </button>
                </div>
                <div className="flex items-center justify-between text-[11px] text-[#757684] px-1">
                  <span>Horario hábil de respuesta docente: 07:00 AM - 03:00 PM</span>
                  <span>Presiona Enter para enviar</span>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};
