import React, { useState, useMemo } from 'react';
import { ActiveScreen, UserProfile } from '../types';
import { useThemeLanguage } from '../context/ThemeLanguageContext';
import { CENSUS_ADMIN_STAFF, getTeacherPersonalSchedule } from '../data/institutionalCensus';

interface TeacherMessagingViewProps {
  currentUser?: UserProfile | null;
  onNavigate: (screen: ActiveScreen) => void;
  onLogout: () => void;
  onUpdateUser?: (updated: UserProfile) => void;
}

interface MessageItem {
  id: string;
  sender: string;
  senderRole: string;
  time: string;
  text: string;
  isSelf: boolean;
  citationDate?: string;
}

interface ConversationChannel {
  id: string;
  recipientName: string;
  recipientRole: string;
  category: 'acudientes' | 'directivos' | 'orientacion';
  lastMessage: string;
  time: string;
  unread: boolean;
  messages: MessageItem[];
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
  const teacherArea = currentUser?.subjectArea || 'Docente de Asignatura';

  const [activeCategory, setActiveCategory] = useState<'all' | 'acudientes' | 'directivos' | 'orientacion'>('all');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showCitationModal, setShowCitationModal] = useState(false);

  // New citation form state
  const [citationStudentName, setCitationStudentName] = useState('Valentina Gómez Suárez (6°1)');
  const [citationGuardianName, setCitationGuardianName] = useState('Gloria Suárez (Acudiente)');
  const [citationDate, setCitationDate] = useState('2026-03-27');
  const [citationTime, setCitationTime] = useState('07:30 AM');
  const [citationReason, setCitationReason] = useState('Informe Académico y Seguimiento Disciplinario');
  const [citationNotes, setCitationNotes] = useState('Se solicita presencia para revisar desempeño en el primer periodo académico.');

  // Preloaded institutional conversation channels
  const [channels, setChannels] = useState<ConversationChannel[]>([
    {
      id: 'chan-1',
      recipientName: 'Carlos Mendoza',
      recipientRole: 'Coordinador Académico',
      category: 'directivos',
      lastMessage: 'Planillas del primer periodo abiertas hasta el viernes.',
      time: 'Hoy, 09:15 AM',
      unread: false,
      messages: [
        {
          id: 'm1',
          sender: 'Carlos Mendoza',
          senderRole: 'Coordinación Académica',
          time: 'Ayer, 03:20 PM',
          text: 'Estimados docentes, recuerden subir la ponderación de tareas antes del cierre de periodo.',
          isSelf: false
        },
        {
          id: 'm2',
          sender: teacherName,
          senderRole: 'Docente',
          time: 'Hoy, 08:45 AM',
          text: 'Entendido Coordinador, las calificaciones de 10°1 y 11°1 ya se encuentran al 80%.',
          isSelf: true
        },
        {
          id: 'm3',
          sender: 'Carlos Mendoza',
          senderRole: 'Coordinación Académica',
          time: 'Hoy, 09:15 AM',
          text: 'Excelente gestión. El sistema cerrará el viernes a las 6:00 PM.',
          isSelf: false
        }
      ]
    },
    {
      id: 'chan-2',
      recipientName: 'Gloria Suárez (Acudiente de Valentina)',
      recipientRole: 'Acudiente Grado 6°1',
      category: 'acudientes',
      lastMessage: 'Muchas gracias profesor, asistiré a la citación el viernes.',
      time: 'Ayer, 04:30 PM',
      unread: true,
      messages: [
        {
          id: 'm20',
          sender: teacherName,
          senderRole: 'Docente',
          time: 'Ayer, 02:10 PM',
          text: 'Cordial saludo señora Gloria. Le he programado una citación institucional para conversar sobre la entrega del taller de matemáticas.',
          isSelf: true,
          citationDate: '27 de Marzo - 07:30 AM'
        },
        {
          id: 'm21',
          sender: 'Gloria Suárez',
          senderRole: 'Acudiente',
          time: 'Ayer, 04:30 PM',
          text: 'Muchas gracias profesor, asistiré a la citación el viernes.',
          isSelf: false
        }
      ]
    },
    {
      id: 'chan-3',
      recipientName: 'Esteban Pérez',
      recipientRole: 'Orientador Escolar',
      category: 'orientacion',
      lastMessage: 'Seguimiento psicosocial del grado 9°2 programado para el jueves.',
      time: '18 Mar',
      unread: false,
      messages: [
        {
          id: 'm30',
          sender: 'Esteban Pérez',
          senderRole: 'Orientación Escolar',
          time: '18 Mar, 10:00 AM',
          text: 'Hola profesor, remito acta de orientación para el estudiante del grado 9°2.',
          isSelf: false
        }
      ]
    }
  ]);

  const [selectedChannelId, setSelectedChannelId] = useState<string>('chan-1');
  const [replyText, setReplyText] = useState('');

  const selectedChannel = useMemo(() => {
    return channels.find(c => c.id === selectedChannelId) || channels[0];
  }, [channels, selectedChannelId]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedChannel) return;

    const newMsg: MessageItem = {
      id: `msg-${Date.now()}`,
      sender: teacherName,
      senderRole: 'Docente',
      time: 'Ahora',
      text: replyText.trim(),
      isSelf: true
    };

    setChannels(prev =>
      prev.map(c =>
        c.id === selectedChannel.id
          ? {
              ...c,
              lastMessage: replyText.trim(),
              time: 'Ahora',
              messages: [...c.messages, newMsg]
            }
          : c
      )
    );
    setReplyText('');
    showToast(isEn ? 'Message sent successfully.' : 'Mensaje enviado correctamente.');
  };

  const handleCreateCitation = (e: React.FormEvent) => {
    e.preventDefault();
    const citationMessage: MessageItem = {
      id: `cit-${Date.now()}`,
      sender: teacherName,
      senderRole: 'Docente',
      time: 'Ahora',
      text: `CITACIÓN OFICIAL DE ACUDIENTE:\nMotivo: ${citationReason}\nEstudiante: ${citationStudentName}\nFecha y Hora: ${citationDate} a las ${citationTime}\nNota: ${citationNotes}`,
      isSelf: true,
      citationDate: `${citationDate} - ${citationTime}`
    };

    // If channel exists or create new channel
    const targetChannel = channels.find(c => c.id === 'chan-2');
    if (targetChannel) {
      setChannels(prev =>
        prev.map(c =>
          c.id === 'chan-2'
            ? {
                ...c,
                lastMessage: `Citación oficial programada para el ${citationDate}`,
                time: 'Ahora',
                messages: [...c.messages, citationMessage]
              }
            : c
        )
      );
      setSelectedChannelId('chan-2');
    }
    setShowCitationModal(false);
    showToast(isEn ? 'Official citation generated and notified.' : 'Citación oficial generada y notificada al acudiente.');
  };

  const filteredChannels = useMemo(() => {
    if (activeCategory === 'all') return channels;
    return channels.filter(c => c.category === activeCategory);
  }, [channels, activeCategory]);

  const personalSchedule = useMemo(() => {
    return getTeacherPersonalSchedule(currentUser?.fullName || currentUser?.documentId || '');
  }, [currentUser]);

  return (
    <div className={`min-h-screen ${isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-800'}`}>
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl bg-cyan-600 text-white font-medium shadow-2xl flex items-center gap-3">
          <span className="material-symbols-outlined text-xl">info</span>
          <span className="text-sm">{toastMessage}</span>
        </div>
      )}

      {/* Main Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Navigation Column */}
        <aside className="lg:col-span-3 space-y-4">
          <div className={`rounded-2xl p-5 border ${isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'} shadow-sm`}>
            <div className="flex items-center gap-3 mb-4 pb-4 border-b border-slate-800/20">
              <div className="w-12 h-12 rounded-xl bg-cyan-600/20 text-cyan-400 flex items-center justify-center font-bold text-lg">
                {teacherName.charAt(0)}
              </div>
              <div>
                <h3 className="font-bold text-sm leading-tight">{teacherName}</h3>
                <p className="text-xs text-cyan-500 font-medium">{teacherArea}</p>
                <span className="inline-block mt-1 text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
                  {isEn ? 'Teacher Role' : 'Rol Docente'}
                </span>
              </div>
            </div>

            {/* Sidebar Links */}
            <div className="space-y-1">
              <button
                onClick={() => onNavigate('teacher_grades')}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-left text-xs font-semibold transition-colors cursor-pointer ${
                  isDark ? 'text-slate-400 hover:bg-slate-800 hover:text-white' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <span className="material-symbols-outlined text-lg">fact_check</span>
                <span>{isEn ? 'Gradebook' : 'Calificaciones y Planilla'}</span>
              </button>

              <button
                onClick={() => onNavigate('teacher_assignments')}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-left text-xs font-semibold transition-colors cursor-pointer ${
                  isDark ? 'text-slate-400 hover:bg-slate-800 hover:text-white' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <span className="material-symbols-outlined text-lg">assignment_turned_in</span>
                <span>{isEn ? 'Assignments & Workshops' : 'Tareas y Talleres'}</span>
              </button>

              <button
                onClick={() => onNavigate('teacher_attendance')}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-left text-xs font-semibold transition-colors cursor-pointer ${
                  isDark ? 'text-slate-400 hover:bg-slate-800 hover:text-white' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <span className="material-symbols-outlined text-lg">how_to_reg</span>
                <span>{isEn ? 'Class Attendance' : 'Control de Asistencia'}</span>
              </button>

              <button
                onClick={() => setShowScheduleModal(true)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-left text-xs font-semibold transition-colors cursor-pointer ${
                  isDark ? 'text-slate-400 hover:bg-slate-800 hover:text-white' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <span className="material-symbols-outlined text-lg">calendar_month</span>
                <span>{isEn ? 'Personal Schedule' : 'Horario Personal Institucional'}</span>
              </button>

              <button
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-left text-xs font-semibold cursor-default ${
                  isDark ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30' : 'bg-cyan-50 text-cyan-700 border border-cyan-200'
                }`}
              >
                <span className="material-symbols-outlined text-lg">chat</span>
                <span>{isEn ? 'Teacher Messaging' : 'Mensajería y Citaciones'}</span>
              </button>
            </div>
          </div>

          <button
            onClick={() => setShowCitationModal(true)}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-cyan-600/20 cursor-pointer transition-transform active:scale-95 flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-base">event_note</span>
            <span>{isEn ? 'New Family Citation' : 'Nueva Citación Oficial'}</span>
          </button>
        </aside>

        {/* Messaging Container */}
        <main className="lg:col-span-9 grid grid-cols-1 md:grid-cols-12 gap-4">
          {/* Channel list */}
          <div className={`md:col-span-5 rounded-2xl border p-4 flex flex-col justify-between ${
            isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'
          }`}>
            <div>
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800/40">
                <h3 className="font-bold text-sm">{isEn ? 'Conversations' : 'Bandeja Institucional'}</h3>
                <span className="px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 text-[10px] font-bold">
                  {channels.length} {isEn ? 'chats' : 'canales'}
                </span>
              </div>

              {/* Filters */}
              <div className="flex gap-1 mb-3 text-[11px] font-semibold">
                <button
                  onClick={() => setActiveCategory('all')}
                  className={`px-2.5 py-1 rounded-lg cursor-pointer ${
                    activeCategory === 'all'
                      ? 'bg-cyan-600 text-white'
                      : isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {isEn ? 'All' : 'Todos'}
                </button>
                <button
                  onClick={() => setActiveCategory('acudientes')}
                  className={`px-2.5 py-1 rounded-lg cursor-pointer ${
                    activeCategory === 'acudientes'
                      ? 'bg-cyan-600 text-white'
                      : isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {isEn ? 'Guardians' : 'Acudientes'}
                </button>
                <button
                  onClick={() => setActiveCategory('directivos')}
                  className={`px-2.5 py-1 rounded-lg cursor-pointer ${
                    activeCategory === 'directivos'
                      ? 'bg-cyan-600 text-white'
                      : isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {isEn ? 'Staff' : 'Directivos'}
                </button>
              </div>

              <div className="space-y-1.5">
                {filteredChannels.map(ch => (
                  <div
                    key={ch.id}
                    onClick={() => setSelectedChannelId(ch.id)}
                    className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                      selectedChannelId === ch.id
                        ? 'bg-cyan-500/10 border-cyan-500/50'
                        : isDark ? 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700' : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-bold truncate max-w-[170px]">{ch.recipientName}</span>
                      <span className="text-[10px] text-slate-500">{ch.time}</span>
                    </div>
                    <p className="text-[11px] text-slate-400 line-clamp-1">{ch.lastMessage}</p>
                    <span className="text-[10px] text-cyan-400 mt-1 block">{ch.recipientRole}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Chat details */}
          <div className={`md:col-span-7 rounded-2xl border flex flex-col justify-between overflow-hidden ${
            isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'
          }`}>
            {/* Header */}
            <div className={`p-4 border-b flex items-center justify-between ${
              isDark ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-slate-50'
            }`}>
              <div>
                <h4 className="font-bold text-sm">{selectedChannel.recipientName}</h4>
                <p className="text-xs text-cyan-400">{selectedChannel.recipientRole}</p>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                {isEn ? 'Online' : 'Conectado'}
              </span>
            </div>

            {/* Messages body */}
            <div className="p-4 space-y-3 flex-1 overflow-y-auto max-h-[460px]">
              {selectedChannel.messages.map(msg => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${msg.isSelf ? 'items-end' : 'items-start'}`}
                >
                  <div className={`max-w-[85%] p-3.5 rounded-2xl text-xs ${
                    msg.isSelf
                      ? 'bg-cyan-600 text-white rounded-br-none'
                      : isDark ? 'bg-slate-800 text-slate-200 rounded-bl-none' : 'bg-slate-100 text-slate-800 rounded-bl-none'
                  }`}>
                    {msg.citationDate && (
                      <div className="mb-2 p-2 rounded-lg bg-black/20 text-[11px] font-bold border border-white/20">
                        <span className="material-symbols-outlined text-xs inline mr-1 align-middle">calendar_clock</span>
                        <span>{isEn ? 'Citation Time:' : 'Fecha Citación:'} {msg.citationDate}</span>
                      </div>
                    )}
                    <p className="whitespace-pre-line leading-relaxed">{msg.text}</p>
                    <span className="text-[10px] opacity-75 block text-right mt-1">{msg.time}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Reply form */}
            <form onSubmit={handleSendMessage} className={`p-3 border-t flex gap-2 ${
              isDark ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-slate-50'
            }`}>
              <input
                type="text"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder={isEn ? 'Write message as teacher...' : 'Escribir mensaje institucional...'}
                className={`flex-1 px-3 py-2 rounded-xl text-xs border ${
                  isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-white border-slate-300 text-slate-900'
                }`}
              />
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs cursor-pointer flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-base">send</span>
              </button>
            </form>
          </div>
        </main>
      </div>

      {/* Citation Modal */}
      {showCitationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className={`w-full max-w-lg rounded-3xl border shadow-2xl p-6 ${
            isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-800'
          }`}>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h2 className="text-base font-black flex items-center gap-2">
                <span className="material-symbols-outlined text-cyan-400">event_note</span>
                <span>{isEn ? 'Issue Guardian Citation' : 'Emitir Citación a Acudiente'}</span>
              </h2>
              <button
                onClick={() => setShowCitationModal(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleCreateCitation} className="space-y-3 mt-4 text-xs">
              <div>
                <label className="block font-bold text-slate-400 mb-1">
                  {isEn ? 'Student / Group' : 'Estudiante y Grado'}
                </label>
                <input
                  type="text"
                  value={citationStudentName}
                  onChange={(e) => setCitationStudentName(e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl border ${
                    isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-white border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div>
                <label className="block font-bold text-slate-400 mb-1">
                  {isEn ? 'Guardian Name' : 'Nombre del Acudiente'}
                </label>
                <input
                  type="text"
                  value={citationGuardianName}
                  onChange={(e) => setCitationGuardianName(e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl border ${
                    isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-white border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-400 mb-1">
                    {isEn ? 'Date' : 'Fecha'}
                  </label>
                  <input
                    type="date"
                    value={citationDate}
                    onChange={(e) => setCitationDate(e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl border ${
                      isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-400 mb-1">
                    {isEn ? 'Time' : 'Hora'}
                  </label>
                  <input
                    type="text"
                    value={citationTime}
                    onChange={(e) => setCitationTime(e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl border ${
                      isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-400 mb-1">
                  {isEn ? 'Reason' : 'Motivo de la Citación'}
                </label>
                <input
                  type="text"
                  value={citationReason}
                  onChange={(e) => setCitationReason(e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl border ${
                    isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-white border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div>
                <label className="block font-bold text-slate-400 mb-1">
                  {isEn ? 'Details / Observations' : 'Observaciones y Lugar'}
                </label>
                <textarea
                  rows={2}
                  value={citationNotes}
                  onChange={(e) => setCitationNotes(e.target.value)}
                  className={`w-full p-2.5 rounded-xl border ${
                    isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-white border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCitationModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300 cursor-pointer"
                >
                  {isEn ? 'Cancel' : 'Cancelar'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold cursor-pointer"
                >
                  {isEn ? 'Issue Citation' : 'Enviar Citación'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Teacher Schedule Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className={`w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl border shadow-2xl p-6 ${
            isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-800'
          }`}>
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div>
                <span className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider">
                  {isEn ? 'Official Institutional Timetable' : 'Horario Oficial FET • I.E. Vallejuelos'}
                </span>
                <h2 className="text-lg font-black">{isEn ? 'Personal Weekly Schedule' : 'Horario Personal del Docente'}</h2>
                <p className="text-xs text-slate-400">{teacherName} • {teacherArea}</p>
              </div>
              <button
                onClick={() => setShowScheduleModal(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className={`border-b ${isDark ? 'border-slate-800 text-slate-400' : 'border-slate-200 text-slate-600'}`}>
                    <th className="py-2.5 px-3 font-bold">{isEn ? 'Period' : 'Hora'}</th>
                    <th className="py-2.5 px-3 font-bold">{isEn ? 'Monday' : 'Lunes'}</th>
                    <th className="py-2.5 px-3 font-bold">{isEn ? 'Tuesday' : 'Martes'}</th>
                    <th className="py-2.5 px-3 font-bold">{isEn ? 'Wednesday' : 'Miércoles'}</th>
                    <th className="py-2.5 px-3 font-bold">{isEn ? 'Thursday' : 'Jueves'}</th>
                    <th className="py-2.5 px-3 font-bold">{isEn ? 'Friday' : 'Viernes'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40">
                  {personalSchedule.map((slot, idx) => (
                    <tr key={idx} className={slot.period === 0 ? 'bg-amber-500/5' : ''}>
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-400">{slot.time}</td>
                      <td className="py-2.5 px-3">{slot.monday.subject}</td>
                      <td className="py-2.5 px-3">{slot.tuesday.subject}</td>
                      <td className="py-2.5 px-3">{slot.wednesday.subject}</td>
                      <td className="py-2.5 px-3">{slot.thursday.subject}</td>
                      <td className="py-2.5 px-3">{slot.friday.subject}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
