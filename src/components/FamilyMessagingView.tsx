import React, { useState } from 'react';
import { ActiveScreen, MessageThread, UserProfile } from '../types';
import { ASSETS, INITIAL_MESSAGE_THREADS } from '../data/mockData';
import { useThemeLanguage } from '../context/ThemeLanguageContext';

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

  const [threads, setThreads] = useState<MessageThread[]>(INITIAL_MESSAGE_THREADS);
  const [selectedThreadId, setSelectedThreadId] = useState<string>('msg-1');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'teachers' | 'meetings' | 'official'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [replyText, setReplyText] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

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
      sender: isEn ? 'Elena Jiménez (Guardian)' : 'Elena Jiménez (Acudiente)',
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
    showToast(isEn ? 'Message sent.' : 'Mensaje enviado.');
  };

  const handleQuickTemplate = (template: string) => {
    handleSendMessage(template);
  };

  return (
    <div className={`min-h-screen flex transition-colors duration-200 ${
      isDark ? 'bg-slate-950 text-slate-100' : 'bg-[#f8f9ff] text-[#0b1c30]'
    }`}>
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-16 right-4 z-50 bg-slate-900 border border-amber-500/40 text-amber-300 px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 text-xs font-bold animate-in fade-in duration-200">
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
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
              isDark ? 'bg-amber-950 border-amber-800 text-amber-300' : 'bg-[#eff4ff] border-[#dce9ff] text-[#00288e]'
            }`}>
              <span className="material-symbols-outlined text-2xl">school</span>
            </div>
            <div className="flex flex-col">
              <span className={`text-lg font-extrabold leading-tight ${isDark ? 'text-white' : 'text-[#00288e]'}`}>
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
              <span className="text-xs font-semibold">{isEn ? 'Attendance & Subjects' : 'Asistencia y Asignaturas'}</span>
            </button>
            <button
              onClick={() => onNavigate('family_dashboard')}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all text-left cursor-pointer ${
                isDark ? 'text-slate-300 hover:bg-slate-800 hover:text-white' : 'text-[#444653] hover:bg-[#eff4ff] hover:text-[#0b1c30]'
              }`}
            >
              <span className="material-symbols-outlined text-xl">verified_user</span>
              <span className="text-xs font-semibold">{isEn ? 'Behavior Log' : 'Observador Convivencial'}</span>
            </button>
            <button
              onClick={() => onNavigate('family_messaging')}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl font-bold text-xs shadow-sm transition-all text-left cursor-pointer ${
                isDark ? 'bg-amber-600 text-white' : 'bg-[#1e40af] text-white'
              }`}
            >
              <span className="material-symbols-outlined text-xl">mail</span>
              <span>{isEn ? 'Notices & Meetings' : 'Comunicados y Citaciones'}</span>
            </button>
            <button
              onClick={() => onNavigate('student_assignment')}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all text-left cursor-pointer ${
                isDark ? 'text-slate-300 hover:bg-slate-800 hover:text-white' : 'text-[#444653] hover:bg-[#eff4ff] hover:text-[#0b1c30]'
              }`}
            >
              <span className="material-symbols-outlined text-xl">contact_phone</span>
              <span className="text-xs font-semibold">{isEn ? 'Teacher Contact' : 'Tareas y contacto profesores'}</span>
            </button>
          </nav>
        </div>

        <div className={`p-4 border-t ${isDark ? 'border-slate-800' : 'border-[#eff4ff]'}`}>
          <div className={`p-3.5 rounded-xl flex flex-col gap-1 border ${
            isDark ? 'bg-slate-800 border-slate-700' : 'bg-[#eff4ff] border-[#dce9ff]'
          }`}>
            <div className={`flex items-center gap-1.5 ${isDark ? 'text-slate-300' : 'text-[#444653]'}`}>
              <span className={`material-symbols-outlined text-sm ${isDark ? 'text-amber-400' : 'text-[#0051d5]'}`}>account_balance</span>
              <span className="text-[11px] font-bold">I.E. Vallejuelos</span>
            </div>
            <span className={`text-xs font-bold ${isDark ? 'text-white' : 'text-[#0b1c30]'}`}>
              {isEn ? 'School Year 2026' : 'Año lectivo 2026'}
            </span>
          </div>
        </div>
      </aside>

      {/* MAIN CONTAINER */}
      <div className="flex-1 lg:pl-72 flex flex-col min-w-0">
        {/* TOP BAR */}
        <header className={`sticky top-12 h-20 backdrop-blur-xl shadow-xs z-30 flex items-center justify-between px-4 sm:px-6 lg:px-8 border-b transition-colors ${
          isDark ? 'bg-slate-900/95 border-slate-800' : 'bg-white/95 border-[#e5eeff]'
        }`}>
          <div className="flex items-center">
            <button
              onClick={() => onNavigate('family_dashboard')}
              className={`flex items-center gap-3 px-3.5 py-1.5 rounded-xl transition-colors border cursor-pointer ${
                isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-[#eff4ff] border-[#dce9ff] text-[#0b1c30] hover:bg-[#e5eeff]'
              }`}
            >
              <div className="w-9 h-9 rounded-full bg-cyan-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
                M
              </div>
              <div className="flex flex-col text-left">
                <span className={`text-[10px] font-medium leading-none ${isDark ? 'text-slate-400' : 'text-[#444653]'}`}>
                  {isEn ? 'Viewing details for:' : 'Viendo información de:'}
                </span>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs font-bold">
                    {currentUser?.representedStudentName || (isEn ? 'Represented Student' : 'Estudiante Representado')}
                  </span>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    isDark ? 'bg-amber-950 text-amber-300' : 'bg-[#dce9ff] text-[#00288e]'
                  }`}>
                    {currentUser?.gradeLevel || (isEn ? 'Grade 11°B' : 'Grado 11°B')}
                  </span>
                </div>
              </div>
            </button>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="flex flex-col text-right hidden sm:flex">
                <span className={`text-xs font-bold ${isDark ? 'text-white' : 'text-[#0b1c30]'}`}>
                  {currentUser?.fullName || (isEn ? 'Primary Guardian' : 'Acudiente Principal')}
                </span>
                <span className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-[#444653]'}`}>
                  {isEn ? 'Primary Guardian' : 'Acudiente Principal'}
                </span>
              </div>
              <img
                alt="Profile"
                className={`w-9 h-9 rounded-full object-cover ring-2 shadow-xs ${
                  isDark ? 'ring-amber-500/30' : 'ring-[#00288e]/20'
                }`}
                src={ASSETS.parentAvatar}
              />
            </div>
          </div>
        </header>

        {/* WORKSPACE CONTENT: 2-PANE MESSAGING CLIENT */}
        <main className="p-4 sm:p-6 lg:p-8 flex flex-col gap-4 max-w-[1500px] w-full mx-auto">
          {/* Top Breadcrumb */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-xs">
              <button
                onClick={() => onNavigate('family_dashboard')}
                className={`font-semibold flex items-center gap-1 cursor-pointer ${
                  isDark ? 'text-slate-300 hover:text-white' : 'text-[#444653] hover:text-[#00288e]'
                }`}
              >
                <span className="material-symbols-outlined text-base">arrow_back</span>
                <span>{isEn ? 'Back to Dashboard' : 'Volver al Dashboard'}</span>
              </button>
              <span className={isDark ? 'text-slate-600' : 'text-[#c4c5d5]'}>/</span>
              <span className={`font-bold ${isDark ? 'text-amber-300' : 'text-[#00288e]'}`}>
                {isEn ? 'Official Notices & Teacher Inbox' : 'Bandeja de Comunicados Oficiales y Docentes'}
              </span>
            </div>
            <span className={`text-xs font-medium hidden sm:inline ${isDark ? 'text-slate-400' : 'text-[#444653]'}`}>
              {isEn ? 'Encrypted official channel with school staff' : 'Canal oficial certificado con acudientes'}
            </span>
          </div>

          {/* 2-Pane Box */}
          <div className={`rounded-2xl shadow-sm overflow-hidden flex flex-col lg:flex-row min-h-[640px] border ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-[#e5eeff]'
          }`}>
            {/* LEFT PANE: Threads List */}
            <div className={`w-full lg:w-96 flex flex-col border-r ${
              isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-[#eff4ff]'
            }`}>
              {/* Inbox Header */}
              <div className={`p-4 flex flex-col gap-3 border-b ${isDark ? 'border-slate-800' : 'border-[#eff4ff]'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`material-symbols-outlined text-xl ${isDark ? 'text-amber-400' : 'text-[#0051d5]'}`}>
                      inbox
                    </span>
                    <h2 className={`text-base font-extrabold ${isDark ? 'text-white' : 'text-[#0b1c30]'}`}>
                      {isEn ? 'Inbox' : 'Bandeja de Entrada'}
                    </h2>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                    isDark ? 'bg-amber-950 text-amber-300' : 'bg-[#dbe1ff] text-[#00174b]'
                  }`}>
                    {isEn ? '3 unread' : '3 sin leer'}
                  </span>
                </div>

                {/* Search */}
                <div className="relative">
                  <span className={`material-symbols-outlined absolute left-3 top-2.5 text-base ${isDark ? 'text-slate-500' : 'text-[#757684]'}`}>
                    search
                  </span>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder={isEn ? 'Search message or teacher...' : 'Buscar mensaje o docente...'}
                    className={`w-full h-9 pl-9 pr-3 rounded-xl text-xs outline-none transition-all border ${
                      isDark
                        ? 'bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus:border-amber-400'
                        : 'bg-[#eff4ff] border-transparent text-[#0b1c30] placeholder:text-[#757684] focus:border-[#0051d5]'
                    }`}
                  />
                </div>

                {/* Filter Pills */}
                <div className="flex items-center gap-1 overflow-x-auto pb-1 text-[11px] font-bold">
                  <button
                    onClick={() => setCategoryFilter('all')}
                    className={`px-2.5 py-1 rounded-lg shrink-0 transition-colors cursor-pointer ${
                      categoryFilter === 'all'
                        ? isDark ? 'bg-amber-600 text-white' : 'bg-[#1e40af] text-white'
                        : isDark ? 'bg-slate-800 text-slate-400 hover:text-white' : 'bg-[#eff4ff] text-[#444653] hover:text-[#0b1c30]'
                    }`}
                  >
                    {isEn ? 'All' : 'Todos'}
                  </button>
                  <button
                    onClick={() => setCategoryFilter('teachers')}
                    className={`px-2.5 py-1 rounded-lg shrink-0 transition-colors cursor-pointer ${
                      categoryFilter === 'teachers'
                        ? isDark ? 'bg-amber-600 text-white' : 'bg-[#1e40af] text-white'
                        : isDark ? 'bg-slate-800 text-slate-400 hover:text-white' : 'bg-[#eff4ff] text-[#444653] hover:text-[#0b1c30]'
                    }`}
                  >
                    {isEn ? 'Teachers' : 'Profesores'}
                  </button>
                  <button
                    onClick={() => setCategoryFilter('meetings')}
                    className={`px-2.5 py-1 rounded-lg shrink-0 transition-colors cursor-pointer ${
                      categoryFilter === 'meetings'
                        ? isDark ? 'bg-amber-600 text-white' : 'bg-[#1e40af] text-white'
                        : isDark ? 'bg-slate-800 text-slate-400 hover:text-white' : 'bg-[#eff4ff] text-[#444653] hover:text-[#0b1c30]'
                    }`}
                  >
                    {isEn ? 'Meetings' : 'Citaciones'}
                  </button>
                  <button
                    onClick={() => setCategoryFilter('official')}
                    className={`px-2.5 py-1 rounded-lg shrink-0 transition-colors cursor-pointer ${
                      categoryFilter === 'official'
                        ? isDark ? 'bg-amber-600 text-white' : 'bg-[#1e40af] text-white'
                        : isDark ? 'bg-slate-800 text-slate-400 hover:text-white' : 'bg-[#eff4ff] text-[#444653] hover:text-[#0b1c30]'
                    }`}
                  >
                    {isEn ? 'Circulars' : 'Circulares'}
                  </button>
                </div>
              </div>

              {/* Thread list */}
              <div className={`flex-1 overflow-y-auto divide-y ${isDark ? 'divide-slate-800' : 'divide-[#eff4ff]'}`}>
                {filteredThreads.map((thread) => {
                  const isSelected = thread.id === activeThread.id;
                  const lastMsg = thread.messages[thread.messages.length - 1];

                  return (
                    <div
                      key={thread.id}
                      onClick={() => setSelectedThreadId(thread.id)}
                      className={`p-4 flex gap-3 cursor-pointer transition-colors relative ${
                        isSelected
                          ? isDark ? 'bg-slate-800 border-l-4 border-amber-500' : 'bg-[#eff4ff] border-l-4 border-[#00288e]'
                          : isDark ? 'hover:bg-slate-800/50' : 'hover:bg-slate-50'
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
                          <div className={`w-11 h-11 rounded-full flex items-center justify-center font-bold text-xs border ${
                            isDark ? 'bg-slate-800 border-slate-700 text-amber-300' : 'bg-[#eff4ff] border-[#dce9ff] text-[#00288e]'
                          }`}>
                            IE
                          </div>
                        )}
                        {thread.unread && (
                          <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-rose-500 rounded-full ring-2 ring-white" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0 flex flex-col">
                        <div className="flex items-center justify-between">
                          <span className={`text-xs font-bold truncate ${isDark ? 'text-white' : 'text-[#0b1c30]'}`}>
                            {thread.senderName}
                          </span>
                          <span className={`text-[10px] shrink-0 ml-1 ${isDark ? 'text-slate-400' : 'text-[#444653]'}`}>
                            {thread.time}
                          </span>
                        </div>

                        <span className={`text-[11px] font-bold truncate mt-0.5 ${isDark ? 'text-amber-300' : 'text-[#00288e]'}`}>
                          {thread.subject}
                        </span>

                        <p className={`text-xs truncate mt-0.5 ${isDark ? 'text-slate-400' : 'text-[#444653]'}`}>
                          {lastMsg ? lastMsg.text : thread.preview}
                        </p>

                        <div className="mt-2 flex items-center gap-1.5">
                          <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-md ${
                            isDark ? 'bg-slate-800 text-slate-400' : 'bg-[#eff4ff] text-[#757684]'
                          }`}>
                            {thread.senderRole}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* RIGHT PANE: Chat View */}
            <div className={`flex-1 flex flex-col ${isDark ? 'bg-slate-950' : 'bg-[#f8f9ff]'}`}>
              {/* Thread Header */}
              <div className={`p-4 sm:p-5 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-[#eff4ff]'
              }`}>
                <div className="flex items-center gap-3">
                  {activeThread.senderAvatar ? (
                    <img
                      alt={activeThread.senderName}
                      className="w-12 h-12 rounded-full object-cover ring-2 ring-amber-500/20 shadow-xs"
                      src={activeThread.senderAvatar}
                    />
                  ) : (
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm ${
                      isDark ? 'bg-amber-950 text-amber-300' : 'bg-[#dde1ff] text-[#00288e]'
                    }`}>
                      IE
                    </div>
                  )}

                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <h3 className={`text-sm sm:text-base font-extrabold ${isDark ? 'text-white' : 'text-[#0b1c30]'}`}>
                        {activeThread.senderName}
                      </h3>
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded-full">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        {isEn ? 'Online' : 'En línea'}
                      </span>
                    </div>
                    <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-[#444653]'}`}>{activeThread.senderRole}</span>
                    <span className={`text-[11px] ${isDark ? 'text-slate-500' : 'text-[#757684]'}`}>
                      {isEn ? 'Subject: ' : 'Asunto: '}
                      <strong className={isDark ? 'text-slate-300' : 'text-[#0b1c30]'}>{activeThread.subject}</strong>
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <button
                    onClick={() => showToast(isEn ? 'Printing official notice...' : 'Imprimiendo citación oficial...')}
                    className={`p-2 rounded-xl transition-colors cursor-pointer ${
                      isDark ? 'text-slate-400 hover:bg-slate-800 hover:text-white' : 'text-[#444653] hover:bg-[#eff4ff]'
                    }`}
                    title={isEn ? 'Print message' : 'Imprimir mensaje'}
                  >
                    <span className="material-symbols-outlined text-lg">print</span>
                  </button>
                  <button
                    onClick={() => showToast(isEn ? 'Message starred.' : 'Mensaje marcado con estrella.')}
                    className={`p-2 rounded-xl transition-colors cursor-pointer ${
                      isDark ? 'text-slate-400 hover:bg-slate-800 hover:text-white' : 'text-[#444653] hover:bg-[#eff4ff]'
                    }`}
                    title={isEn ? 'Star message' : 'Destacar'}
                  >
                    <span className="material-symbols-outlined text-lg">star</span>
                  </button>
                </div>
              </div>

              {/* Messages Flow Area */}
              <div className="flex-1 p-4 sm:p-6 overflow-y-auto flex flex-col gap-4">
                <div className="flex justify-center">
                  <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold border ${
                    isDark ? 'bg-slate-900 border-slate-800 text-slate-400' : 'bg-[#eff4ff] border-[#dce9ff] text-[#444653]'
                  }`}>
                    <span className="material-symbols-outlined text-xs text-amber-400">lock</span>
                    {isEn ? 'Encrypted channel linked to student academic file' : 'Canal cifrado y vinculado al expediente académico del alumno'}
                  </div>
                </div>

                {activeThread.messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${
                      msg.isSelf ? 'items-end' : 'items-start'
                    } max-w-xl ${msg.isSelf ? 'self-end' : 'self-start'}`}
                  >
                    <div className={`flex items-center gap-2 mb-1 px-1 text-[11px] ${isDark ? 'text-slate-400' : 'text-[#444653]'}`}>
                      <span className="font-bold">{msg.sender}</span>
                      <span>•</span>
                      <span>{msg.time}</span>
                    </div>

                    <div
                      className={`p-4 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-xs ${
                        msg.isSelf
                          ? isDark ? 'bg-amber-600 text-white rounded-tr-xs' : 'bg-[#00288e] text-white rounded-tr-xs'
                          : isDark ? 'bg-slate-900 text-slate-100 rounded-tl-xs border border-slate-800' : 'bg-white text-[#0b1c30] rounded-tl-xs border border-[#e5eeff]'
                      }`}
                    >
                      <p>{msg.text}</p>

                      {msg.attachment && (
                        <div
                          onClick={() => showToast(isEn ? `Downloading ${msg.attachment?.name}` : `Descargando ${msg.attachment?.name}`)}
                          className={`mt-3 p-3 rounded-xl flex items-center justify-between gap-3 cursor-pointer transition-colors ${
                            msg.isSelf
                              ? 'bg-white/10 hover:bg-white/20'
                              : isDark ? 'bg-slate-800 hover:bg-slate-700' : 'bg-[#eff4ff] hover:bg-[#dbe1ff]'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="material-symbols-outlined text-xl text-rose-500">
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
              <div className={`px-4 py-2 border-t flex items-center gap-2 overflow-x-auto text-xs ${
                isDark ? 'bg-slate-900 border-slate-800' : 'bg-white/70 border-[#eff4ff]'
              }`}>
                <span className={`text-[11px] font-bold shrink-0 ${isDark ? 'text-slate-400' : 'text-[#757684]'}`}>
                  {isEn ? 'Templates:' : 'Plantillas:'}
                </span>
                <button
                  onClick={() =>
                    handleQuickTemplate(
                      isEn
                        ? 'Good morning. I confirm my punctual attendance for the report card meeting.'
                        : 'Buenos días profesor Roberto. Confirmo mi asistencia puntual para la reunión de entrega de boletines.'
                    )
                  }
                  className={`px-3 py-1 rounded-full text-xs font-semibold shrink-0 transition-colors border cursor-pointer ${
                    isDark
                      ? 'bg-slate-800 border-slate-700 text-amber-300 hover:bg-slate-700'
                      : 'bg-[#eff4ff] border-[#dce9ff] text-[#00288e] hover:bg-[#dbe1ff]'
                  }`}
                >
                  {isEn ? 'Confirm Attendance' : 'Confirmar Asistencia'}
                </button>
                <button
                  onClick={() =>
                    handleQuickTemplate(
                      isEn
                        ? 'Due to work schedules, I would appreciate rescheduling our meeting virtually or on Thursday.'
                        : 'Profesor, por motivos laborales se me dificulta el horario. ¿Sería posible coordinar un espacio virtual?'
                    )
                  }
                  className={`px-3 py-1 rounded-full text-xs font-semibold shrink-0 transition-colors border cursor-pointer ${
                    isDark
                      ? 'bg-slate-800 border-slate-700 text-amber-300 hover:bg-slate-700'
                      : 'bg-[#eff4ff] border-[#dce9ff] text-[#00288e] hover:bg-[#dbe1ff]'
                  }`}
                >
                  {isEn ? 'Request Reschedule' : 'Solicitar Reprogramación'}
                </button>
                <button
                  onClick={() =>
                    handleQuickTemplate(
                      isEn
                        ? 'Thank you very much for the update and constant educational support.'
                        : 'Muchas gracias por el informe y por el constante acompañamiento pedagógico.'
                    )
                  }
                  className={`px-3 py-1 rounded-full text-xs font-semibold shrink-0 transition-colors border cursor-pointer ${
                    isDark
                      ? 'bg-slate-800 border-slate-700 text-amber-300 hover:bg-slate-700'
                      : 'bg-[#eff4ff] border-[#dce9ff] text-[#00288e] hover:bg-[#dbe1ff]'
                  }`}
                >
                  {isEn ? 'Acknowledge & Thank' : 'Agradecer Información'}
                </button>
              </div>

              {/* Reply Input Box */}
              <div className={`p-4 border-t flex flex-col gap-2 ${
                isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-[#eff4ff]'
              }`}>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => showToast(isEn ? 'Attach medical excuse or PDF document.' : 'Adjuntar constancia médica, permiso o documento PDF.')}
                    className={`p-2.5 rounded-xl transition-colors cursor-pointer ${
                      isDark ? 'text-slate-400 hover:bg-slate-800' : 'text-[#444653] hover:bg-[#eff4ff]'
                    }`}
                    title={isEn ? 'Attach file' : 'Adjuntar archivo'}
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
                    placeholder={isEn ? `Write a message for ${activeThread.senderName}...` : `Escribe un mensaje para ${activeThread.senderName}...`}
                    className={`flex-1 h-11 px-4 rounded-xl text-xs outline-none transition-all border ${
                      isDark
                        ? 'bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus:border-amber-400'
                        : 'bg-[#eff4ff] border-transparent text-[#0b1c30] placeholder:text-[#757684] focus:border-[#0051d5]'
                    }`}
                  />

                  <button
                    onClick={() => handleSendMessage()}
                    className={`h-11 px-5 rounded-xl text-white text-xs font-bold shadow-xs hover:shadow-md transition-all flex items-center gap-1.5 cursor-pointer ${
                      isDark ? 'bg-amber-600 hover:bg-amber-500' : 'bg-[#00288e] hover:bg-[#1e40af]'
                    }`}
                  >
                    <span>{isEn ? 'Send' : 'Enviar'}</span>
                    <span className="material-symbols-outlined text-base">send</span>
                  </button>
                </div>
                <div className={`flex items-center justify-between text-[11px] px-1 ${
                  isDark ? 'text-slate-500' : 'text-[#757684]'
                }`}>
                  <span>{isEn ? 'Teacher office hours: 07:00 AM - 03:00 PM' : 'Horario hábil de respuesta docente: 07:00 AM - 03:00 PM'}</span>
                  <span>{isEn ? 'Press Enter to send' : 'Presiona Enter para enviar'}</span>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};
