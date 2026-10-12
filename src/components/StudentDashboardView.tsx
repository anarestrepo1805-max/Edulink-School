import React, { useState } from 'react';
import { ActiveScreen, Subject, UpcomingAssignment, UserProfile } from '../types';
import { ASSETS, INITIAL_SUBJECTS, INITIAL_UPCOMING_ASSIGNMENTS } from '../data/mockData';
import { OFFICIAL_SCHEDULE_11_1 } from '../data/institutionalCensus';
import { saveUserConfiguration } from '../services/authService';
import { useThemeLanguage } from '../context/ThemeLanguageContext';

interface StudentDashboardViewProps {
  currentUser?: UserProfile | null;
  onNavigate: (screen: ActiveScreen) => void;
  onLogout: () => void;
  onUpdateUser?: (updated: UserProfile) => void;
}

export const StudentDashboardView: React.FC<StudentDashboardViewProps> = ({
  currentUser,
  onNavigate,
  onLogout,
  onUpdateUser
}) => {
  const { theme, language } = useThemeLanguage();
  const isDark = theme === 'dark';
  const isEn = language === 'en';

  const isConfigured = Boolean(currentUser?.hasConfigured);
  const studentName = currentUser?.fullName || (isEn ? 'Student' : 'Estudiante');
  const gradeLevel = currentUser?.gradeLevel ? (currentUser.gradeLevel.startsWith('Grado') ? currentUser.gradeLevel : `${isEn ? 'Grade' : 'Grado'} ${currentUser.gradeLevel}`) : (isEn ? 'Grade 11°2' : 'Grado 11°2');
  const shift = currentUser?.shift || (isEn ? 'Morning Shift (6:15 AM - 12:15 PM)' : 'Jornada Mañana (6:15 AM - 12:15 PM)');

  const [subjects, setSubjects] = useState<Subject[]>(() => {
    if (currentUser?.subjects && currentUser.subjects.length > 0) {
      return currentUser.subjects;
    }
    return isConfigured ? INITIAL_SUBJECTS : [];
  });

  const [assignments, setAssignments] = useState<UpcomingAssignment[]>(() => {
    if (currentUser?.assignments && currentUser.assignments.length > 0) {
      return currentUser.assignments;
    }
    return isConfigured ? INITIAL_UPCOMING_ASSIGNMENTS : [];
  });

  const [filterUrgentOnly, setFilterUrgentOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Schedule modal state
  const [showScheduleModal, setShowScheduleModal] = useState(false);

  // Subject creation modal state
  const [showAddSubjectModal, setShowAddSubjectModal] = useState(false);
  const [newSubName, setNewSubName] = useState('');
  const [newSubTeacher, setNewSubTeacher] = useState('');
  const [newSubSchedule, setNewSubSchedule] = useState('');
  const [newSubRoom, setNewSubRoom] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const filteredAssignments = assignments
    .filter((a) => (filterUrgentOnly ? a.urgency === 'urgente' : true))
    .filter((a) =>
      searchQuery
        ? a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          a.subject.toLowerCase().includes(searchQuery.toLowerCase())
        : true
    );

  const filteredSubjects = subjects.filter((sub) =>
    searchQuery
      ? sub.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sub.teacher.toLowerCase().includes(searchQuery.toLowerCase())
      : true
  );

  const handleAddSubjectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubName.trim()) return;

    setIsSaving(true);
    const newSubjectItem: Subject = {
      id: `sub_${Date.now()}`,
      name: newSubName.trim(),
      category: isEn ? 'Enrolled Subject' : 'Asignatura Matriculada',
      teacher: newSubTeacher.trim() || (isEn ? 'Assigned Teacher' : 'Docente Asignado'),
      schedule: newSubSchedule.trim() || (isEn ? 'Mon & Wed 07:00 AM' : 'Lunes y Miércoles 07:00 AM'),
      room: newSubRoom.trim() || (isEn ? 'Room 201' : 'Aula 201'),
      grade: 4.5,
      progress: 25,
      color: '#0051d5',
      bgLight: isDark ? 'rgba(0,81,213,0.2)' : '#eff4ff',
      icon: 'menu_book',
      nextClass: isEn ? 'Next session according to schedule' : 'Próxima sesión según horario'
    };

    const updatedSubjects = [...subjects, newSubjectItem];
    setSubjects(updatedSubjects);

    if (currentUser) {
      try {
        const updated = await saveUserConfiguration(currentUser.id, {
          subjects: updatedSubjects,
          hasConfigured: true
        });
        if (onUpdateUser) {
          onUpdateUser(updated);
        }
        showToast(isEn ? 'Subject registered successfully.' : 'Asignatura guardada correctamente.');
      } catch (err) {
        console.warn('Error saving configuration:', err);
      }
    }

    setShowAddSubjectModal(false);
    setNewSubName('');
    setNewSubTeacher('');
    setNewSubSchedule('');
    setNewSubRoom('');
    setIsSaving(false);
  };

  const handleLoadSampleData = async () => {
    setIsSaving(true);
    setSubjects(INITIAL_SUBJECTS);
    setAssignments(INITIAL_UPCOMING_ASSIGNMENTS);

    if (currentUser) {
      try {
        const updated = await saveUserConfiguration(currentUser.id, {
          subjects: INITIAL_SUBJECTS,
          assignments: INITIAL_UPCOMING_ASSIGNMENTS,
          hasConfigured: true
        });
        if (onUpdateUser) {
          onUpdateUser(updated);
        }
        showToast(isEn ? 'Sample 11th grade subjects loaded.' : 'Materias de Grado 11° cargadas.');
      } catch (err) {
        console.warn('Error saving demo subjects:', err);
      }
    }
    setIsSaving(false);
  };

  return (
    <div className={`min-h-screen flex transition-colors duration-200 ${
      isDark ? 'bg-slate-950 text-slate-100' : 'bg-[#f8f9ff] text-[#0b1c30]'
    }`}>
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-16 right-4 z-50 bg-slate-900 border border-cyan-500/40 text-cyan-300 px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 text-xs font-bold animate-in fade-in duration-200">
          <span className="material-symbols-outlined text-[18px]">info</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* FIXED SIDEBAR (Portal Escolar) */}
      <aside className={`hidden lg:flex fixed left-0 top-12 bottom-0 w-72 shadow-xs z-40 flex-col justify-between border-r transition-colors ${
        isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-[#e5eeff]'
      }`}>
        <div className="flex flex-col">
          {/* Logo & School Name */}
          <div className={`h-16 px-6 flex items-center gap-3 border-b ${
            isDark ? 'border-slate-800' : 'border-[#eff4ff]'
          }`}>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-xs ${
              isDark ? 'bg-cyan-600' : 'bg-[#1e40af]'
            }`}>
              <span className="material-symbols-outlined text-[24px]">school</span>
            </div>
            <div className="flex flex-col">
              <span className={`font-extrabold text-xl leading-none tracking-tight ${
                isDark ? 'text-white' : 'text-[#00288e]'
              }`}>
                Edulink
              </span>
              <span className={`text-[11px] font-semibold leading-none mt-1 ${
                isDark ? 'text-slate-400' : 'text-[#444653]'
              }`}>
                {isEn ? 'Student Portal' : 'Portal Estudiantil'}
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="px-3 py-4 flex flex-col gap-1">
            <button
              onClick={() => onNavigate('student_dashboard')}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl font-bold text-sm shadow-sm transition-all text-left cursor-pointer ${
                isDark ? 'bg-cyan-600 text-white' : 'bg-[#1e40af] text-white'
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">dashboard</span>
              <span>{isEn ? 'Dashboard' : 'Inicio'}</span>
            </button>
            <button
              onClick={() => {
                if (!isConfigured && subjects.length === 0) {
                  setShowAddSubjectModal(true);
                } else {
                  showToast(isEn ? `Showing ${subjects.length} enrolled subjects.` : `Mostrando ${subjects.length} asignaturas matriculadas.`);
                }
              }}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all text-left cursor-pointer ${
                isDark ? 'text-slate-300 hover:bg-slate-800 hover:text-white' : 'text-[#444653] hover:bg-[#eff4ff] hover:text-[#0b1c30]'
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">menu_book</span>
              <span>{isEn ? 'My Subjects' : 'Mis Asignaturas'} ({subjects.length})</span>
            </button>
            <button
              onClick={() => {
                if (!isConfigured && subjects.length === 0) {
                  showToast(isEn ? 'No grades recorded yet. Please configure your subjects.' : 'Tu cuenta no tiene calificaciones registradas aún. Configura tus asignaturas.');
                } else {
                  showToast(isEn ? 'Current GPA: 4.2 / 5.0. No failed subjects.' : 'Promedio acumulado actual: 4.2 / 5.0. No tienes materias reprobadas.');
                }
              }}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all text-left cursor-pointer ${
                isDark ? 'text-slate-300 hover:bg-slate-800 hover:text-white' : 'text-[#444653] hover:bg-[#eff4ff] hover:text-[#0b1c30]'
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">assignment_turned_in</span>
              <span>{isEn ? 'Grades' : 'Calificaciones'}</span>
            </button>
            <button
              onClick={() => setShowScheduleModal(true)}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all text-left cursor-pointer ${
                isDark ? 'text-slate-300 hover:bg-slate-800 hover:text-white' : 'text-[#444653] hover:bg-[#eff4ff] hover:text-[#0b1c30]'
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">calendar_today</span>
              <span>{isEn ? 'Schedule' : 'Horario'}</span>
            </button>
            <button
              onClick={() => onNavigate('student_assignment')}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all text-left relative group cursor-pointer ${
                isDark ? 'text-slate-300 hover:bg-slate-800 hover:text-cyan-300' : 'text-[#444653] hover:bg-[#eff4ff] hover:text-[#00288e]'
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">assignment</span>
              <span>{isEn ? 'Tasks & Workshops' : 'Tareas y Entregas'}</span>
              {assignments.length > 0 && (
                <span className="ml-auto w-2 h-2 rounded-full bg-amber-500 animate-ping" />
              )}
            </button>
            <button
              onClick={() => showToast(isEn ? 'Technology & Innovation institutional debate forum.' : 'Acceso al foro institucional de debate sobre Tecnología e Innovación.')}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all text-left cursor-pointer ${
                isDark ? 'text-slate-300 hover:bg-slate-800 hover:text-white' : 'text-[#444653] hover:bg-[#eff4ff] hover:text-[#0b1c30]'
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">chat_bubble</span>
              <span>{isEn ? 'Forums & Surveys' : 'Foro y encuestas'}</span>
            </button>
          </nav>
        </div>

        {/* User Card & Logout Bottom */}
        <div className={`p-4 border-t flex flex-col gap-2 ${
          isDark ? 'border-slate-800' : 'border-[#eff4ff]'
        }`}>
          <div className={`flex items-center gap-3 p-2 rounded-xl ${
            isDark ? 'bg-slate-800/80' : 'bg-[#eff4ff]'
          }`}>
            <img
              src={currentUser?.avatarUrl || ASSETS.studentAvatar}
              alt="Avatar"
              className={`w-9 h-9 rounded-full object-cover ring-2 ${
                isDark ? 'ring-cyan-500/30' : 'ring-[#0051d5]/20'
              }`}
            />
            <div className="flex flex-col overflow-hidden">
              <span className={`text-xs font-bold truncate ${
                isDark ? 'text-white' : 'text-[#0b1c30]'
              }`}>
                {studentName}
              </span>
              <span className={`text-[11px] truncate ${
                isDark ? 'text-slate-400' : 'text-[#444653]'
              }`}>
                {gradeLevel}
              </span>
            </div>
          </div>
          <button
            onClick={onLogout}
            className={`w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
              isDark ? 'text-rose-400 hover:bg-rose-950/40' : 'text-[#ba1a1a] hover:bg-[#fff1f2]'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">logout</span>
            <span>{isEn ? 'Sign Out' : 'Cerrar Sesión'}</span>
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="lg:pl-72 flex-1 flex flex-col min-w-0">
        {/* TOP BAR */}
        <header className={`h-16 border-b px-4 sm:px-6 lg:px-8 flex items-center justify-between sticky top-12 z-30 shadow-xs transition-colors ${
          isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-[#e5eeff]'
        }`}>
          <div className="flex items-center gap-3 w-full max-w-md">
            <div className="relative w-full">
              <span className={`material-symbols-outlined absolute left-3 top-3 text-[20px] ${
                isDark ? 'text-slate-500' : 'text-[#757684]'
              }`}>
                search
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={isEn ? 'Search courses, assignments, teachers...' : 'Buscar asignaturas, tareas, profesores...'}
                className={`w-full h-11 pl-10 pr-4 rounded-xl text-xs focus:outline-none transition-all border ${
                  isDark
                    ? 'bg-slate-800 border-slate-700 text-slate-100 placeholder:text-slate-500 focus:border-cyan-500'
                    : 'bg-[#eff4ff] border-transparent text-[#0b1c30] placeholder:text-[#757684] focus:border-[#0051d5]'
                }`}
              />
            </div>
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold shrink-0 ${
              isDark ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-800/40' : 'bg-[#dbe1ff] text-[#00174b]'
            }`}>
              {isEn ? 'Term 1 - 2026' : 'Período 1 - 2026'}
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className={`relative p-2 rounded-xl transition-colors flex items-center justify-center cursor-pointer ${
                  isDark ? 'text-slate-300 hover:bg-slate-800' : 'text-[#444653] hover:bg-[#eff4ff] hover:text-[#0b1c30]'
                }`}
                title={isEn ? 'Notifications' : 'Notificaciones'}
              >
                <span className="material-symbols-outlined text-[22px]">notifications</span>
                <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-rose-500 rounded-full ring-2 ring-white" />
              </button>
              {showNotifications && (
                <div className={`absolute right-0 mt-2 w-72 rounded-2xl shadow-xl p-3 border z-50 ${
                  isDark ? 'bg-slate-900 border-slate-700 text-slate-200' : 'bg-white border-[#e2e8f0] text-[#0b1c30]'
                }`}>
                  <span className={`block text-xs font-bold mb-2 pb-1 border-b ${
                    isDark ? 'border-slate-800 text-white' : 'border-[#eff4ff] text-[#0b1c30]'
                  }`}>
                    {isEn ? 'Recent Notifications' : 'Notificaciones Recientes'}
                  </span>
                  <div className="flex flex-col gap-2 text-xs">
                    <div className={`p-2 rounded-lg ${isDark ? 'bg-slate-800/80' : 'bg-[#eff4ff]'}`}>
                      <strong className={`block ${isDark ? 'text-cyan-400' : 'text-[#00288e]'}`}>
                        {isEn ? 'Firestore Connected' : 'Base de Datos Conectada'}
                      </strong>
                      <span className={isDark ? 'text-slate-400' : 'text-[#444653]'}>
                        {isEn ? 'Your academic records are synchronized.' : 'Tus registros académicos están sincronizados en tiempo real.'}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className={`h-8 w-px ${isDark ? 'bg-slate-800' : 'bg-[#dce9ff]'}`} />

            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:flex flex-col">
                <span className={`text-xs font-bold leading-tight ${isDark ? 'text-white' : 'text-[#0b1c30]'}`}>
                  {studentName}
                </span>
                <span className={`text-[11px] leading-tight mt-0.5 font-medium ${isDark ? 'text-slate-400' : 'text-[#444653]'}`}>
                  {gradeLevel} {currentUser?.studentCode ? `• ${currentUser.studentCode}` : ''}
                </span>
              </div>
              <img
                alt="Student Profile"
                className={`w-9 h-9 rounded-full object-cover ring-2 shadow-xs ${
                  isDark ? 'ring-cyan-500/40' : 'ring-[#1e40af]/20'
                }`}
                src={currentUser?.avatarUrl || ASSETS.studentAvatar}
              />
            </div>
          </div>
        </header>

        {/* DASHBOARD CONTENT BODY */}
        <main className="p-4 sm:p-6 lg:p-8 flex flex-col gap-6 max-w-[1400px] w-full mx-auto">
          {/* Top Welcome Hero Banner */}
          <section className={`relative overflow-hidden rounded-2xl p-6 lg:p-8 text-white shadow-md ${
            isDark
              ? 'bg-gradient-to-r from-slate-900 via-slate-800 to-cyan-950 border border-cyan-500/20'
              : 'bg-gradient-to-r from-[#1e40af] via-[#0051d5] to-[#316bf3]'
          }`}>
            <div className="absolute -right-16 -top-20 w-80 h-80 rounded-full bg-white/10 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 right-48 w-60 h-60 rounded-full bg-cyan-400/20 blur-2xl pointer-events-none" />

            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="max-w-xl flex flex-col space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md self-start text-[11px] font-bold tracking-wide uppercase text-white">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  {isEn ? 'Active Term 2026 • Student Role' : 'Período Activo 2026 • Rol Estudiante'}
                </div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl text-white font-extrabold tracking-tight">
                  {isEn ? `Hello, ${studentName}! 👋` : `¡Hola, ${studentName}! 👋`}
                </h1>
                <p className="text-sm sm:text-base text-cyan-100 font-normal leading-relaxed">
                  {isConfigured || subjects.length > 0
                    ? (isEn
                        ? `You have ${assignments.length} scheduled assignments across your enrolled subjects.`
                        : `Tienes ${assignments.length} actividades programadas en tus asignaturas activas.`)
                    : (isEn
                        ? 'Welcome to your institutional portal. Your academic space is ready to track subjects and grades.'
                        : 'Bienvenido a tu portal institucional. Tu espacio académico está listo para que consultes tus asignaturas y calificaciones.')}
                </p>
                <div className="pt-2 flex flex-wrap items-center gap-3">
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-white/90">
                    <span className="material-symbols-outlined text-[18px] text-cyan-300">verified_user</span>
                    {gradeLevel} {currentUser?.studentCode ? `(ID: ${currentUser.studentCode})` : ''}
                  </span>
                  <span className="text-white/40">•</span>
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-white/90">
                    <span className="material-symbols-outlined text-[18px] text-cyan-300">schedule</span>
                    {shift}
                  </span>
                </div>
              </div>

              {/* Logo Emblem Frame in Hero */}
              <div className="relative shrink-0 flex items-center justify-center">
                <div className="w-36 h-36 md:w-44 md:h-44 rounded-2xl bg-white/10 backdrop-blur-md p-2 flex items-center justify-center shadow-lg transition-transform hover:scale-105 duration-300">
                  <div className="w-full h-full rounded-xl bg-white p-3 shadow-md flex items-center justify-center overflow-hidden">
                    <img
                      src={ASSETS.logoAlt}
                      alt="Edulink School"
                      className="w-full h-full object-contain"
                    />
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Metric Badges Overview (3 Cards) */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-4 -mt-2 relative z-20">
            {/* Metric 1: Promedio General */}
            <div className={`rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between border ${
              isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-[#e5eeff]'
            }`}>
              <div className="flex items-start justify-between">
                <div className="flex flex-col">
                  <span className={`text-xs uppercase tracking-wider font-bold ${
                    isDark ? 'text-slate-400' : 'text-[#444653]'
                  }`}>
                    {isEn ? 'Academic GPA' : 'Rendimiento Académico'}
                  </span>
                  <span className={`text-3xl font-extrabold mt-1 ${isDark ? 'text-white' : 'text-[#0b1c30]'}`}>
                    {subjects.length > 0 ? (
                      <>
                        4.2 <span className={`text-sm font-normal ${isDark ? 'text-slate-400' : 'text-[#444653]'}`}>/ 5.0</span>
                      </>
                    ) : (
                      <>
                        -- <span className={`text-sm font-normal ${isDark ? 'text-slate-400' : 'text-[#444653]'}`}>/ 5.0</span>
                      </>
                    )}
                  </span>
                </div>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  isDark ? 'bg-cyan-950 text-cyan-300' : 'bg-[#eff4ff] text-[#0051d5]'
                }`}>
                  <span className="material-symbols-outlined text-[24px]">grade</span>
                </div>
              </div>
              <div className={`mt-4 pt-3 flex items-center justify-between border-t ${
                isDark ? 'border-slate-800' : 'border-[#eff4ff]'
              }`}>
                {subjects.length > 0 ? (
                  <>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold">
                      <span className="material-symbols-outlined text-[14px]">check_circle</span>
                      {isEn ? 'Top Performance' : 'Excelente rendimiento'}
                    </span>
                    <span className="text-xs text-emerald-400 font-semibold">{isEn ? '+0.3 this term' : '+0.3 este período'}</span>
                  </>
                ) : (
                  <>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${
                      isDark ? 'bg-slate-800 text-slate-400' : 'bg-[#f1f5f9] text-[#64748b]'
                    }`}>
                      {isEn ? 'No grades yet' : 'Sin notas aún'}
                    </span>
                    <span className={`text-xs ${isDark ? 'text-slate-500' : 'text-[#64748b]'}`}>
                      {isEn ? 'Add subjects' : 'Configura materias'}
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Metric 2: Tareas Pendientes */}
            <div className={`rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between border ${
              isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-[#e5eeff]'
            }`}>
              <div className="flex items-start justify-between">
                <div className="flex flex-col">
                  <span className={`text-xs uppercase tracking-wider font-bold ${
                    isDark ? 'text-slate-400' : 'text-[#444653]'
                  }`}>
                    {isEn ? 'Assigned Tasks' : 'Tareas Asignadas'}
                  </span>
                  <span className={`text-3xl font-extrabold mt-1 ${isDark ? 'text-white' : 'text-[#0b1c30]'}`}>
                    {assignments.length}{' '}
                    <span className={`text-sm font-normal ${isDark ? 'text-slate-400' : 'text-[#444653]'}`}>
                      {isEn ? 'active' : 'en curso'}
                    </span>
                  </span>
                </div>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  isDark ? 'bg-amber-950/60 text-amber-400' : 'bg-amber-50 text-amber-600'
                }`}>
                  <span className="material-symbols-outlined text-[24px]">pending_actions</span>
                </div>
              </div>
              <div className={`mt-4 pt-3 flex items-center justify-between border-t ${
                isDark ? 'border-slate-800' : 'border-[#eff4ff]'
              }`}>
                {assignments.length > 0 ? (
                  <>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-xs font-bold">
                      <span className="material-symbols-outlined text-[14px]">warning</span>
                      {isEn ? 'Pending grading' : 'Por calificar/entregar'}
                    </span>
                    <span className="text-xs text-rose-400 font-bold">{isEn ? '2 urgent' : '2 urgentes'}</span>
                  </>
                ) : (
                  <>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold">
                      {isEn ? 'Up to date' : 'Al día'}
                    </span>
                    <span className="text-xs text-emerald-400">{isEn ? '0 pending' : '0 pendientes'}</span>
                  </>
                )}
              </div>
            </div>

            {/* Metric 3: Asistencia */}
            <div className={`rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between border ${
              isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-[#e5eeff]'
            }`}>
              <div className="flex items-start justify-between">
                <div className="flex flex-col">
                  <span className={`text-xs uppercase tracking-wider font-bold ${
                    isDark ? 'text-slate-400' : 'text-[#444653]'
                  }`}>
                    {isEn ? 'Overall Attendance' : 'Asistencia Global'}
                  </span>
                  <span className={`text-3xl font-extrabold mt-1 ${isDark ? 'text-white' : 'text-[#0b1c30]'}`}>
                    {subjects.length > 0 ? '98%' : '100%'}
                  </span>
                </div>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  isDark ? 'bg-cyan-950 text-cyan-400' : 'bg-[#e5eeff] text-[#1e40af]'
                }`}>
                  <span className="material-symbols-outlined text-[24px]">how_to_reg</span>
                </div>
              </div>
              <div className={`mt-4 pt-3 flex items-center justify-between border-t ${
                isDark ? 'border-slate-800' : 'border-[#eff4ff]'
              }`}>
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${
                  isDark ? 'bg-cyan-950 text-cyan-300' : 'bg-[#dbe1ff] text-[#00174b]'
                }`}>
                  <span className="material-symbols-outlined text-[14px]">event_available</span>
                  {subjects.length > 0 ? (isEn ? 'Excused (Feb 02)' : 'Justificada (02 Feb)') : (isEn ? 'No absences' : 'Sin faltas')}
                </span>
                <span className={`text-xs font-bold ${isDark ? 'text-slate-400' : 'text-[#444653]'}`}>
                  {isEn ? 'Current record' : 'Asistencia al día'}
                </span>
              </div>
            </div>
          </section>

          {/* 2-Column Split: Main Academic Workspace vs Next Deadlines Panel */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* LEFT 70% */}
            <section className="lg:col-span-8 flex flex-col space-y-6">
              {/* Section Header */}
              <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 sm:p-5 rounded-2xl shadow-sm border ${
                isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-[#e5eeff]'
              }`}>
                <div>
                  <h2 className={`text-xl font-extrabold ${isDark ? 'text-white' : 'text-[#0b1c30]'}`}>
                    {isEn ? 'My Active Subjects' : 'Mis Asignaturas Activas'}
                  </h2>
                  <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-[#444653]'}`}>
                    {isEn ? 'Enrolled academic load and real-time grading progress.' : 'Carga académica matriculada y progreso evaluativo en tiempo real.'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowAddSubjectModal(true)}
                    className={`px-3 py-1.5 rounded-xl text-white text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer ${
                      isDark ? 'bg-cyan-600 hover:bg-cyan-500' : 'bg-[#00288e] hover:bg-[#1e40af]'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[16px]">add</span>
                    <span>{isEn ? 'Add Subject' : 'Agregar Materia'}</span>
                  </button>
                </div>
              </div>

              {/* EMPTY STATE OR SUBJECTS GRID */}
              {subjects.length === 0 ? (
                <div className={`rounded-2xl p-8 sm:p-12 shadow-sm border text-center flex flex-col items-center justify-center ${
                  isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-[#e5eeff]'
                }`}>
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 ${
                    isDark ? 'bg-slate-800 text-cyan-400' : 'bg-[#eff4ff] text-[#0051d5]'
                  }`}>
                    <span className="material-symbols-outlined text-[36px]">inventory_2</span>
                  </div>
                  <h3 className={`text-xl font-extrabold mb-2 ${isDark ? 'text-white' : 'text-[#0b1c30]'}`}>
                    {isEn ? 'No subjects configured yet' : 'No hay asignaturas configuradas todavía'}
                  </h3>
                  <p className={`text-sm max-w-md mb-6 leading-relaxed ${isDark ? 'text-slate-400' : 'text-[#444653]'}`}>
                    {isEn
                      ? 'Upon registering, your profile is clean. You can add your subjects manually or load the suggested 11th grade subjects to explore the system.'
                      : 'Al registrarte en la plataforma tu perfil se encuentra completamente limpio. Puedes agregar tus materias escolares de forma manual o cargar la estructura sugerida.'}
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-3">
                    <button
                      onClick={() => setShowAddSubjectModal(true)}
                      className={`px-4 py-2.5 rounded-xl text-white text-xs font-bold shadow-sm transition-all flex items-center gap-2 cursor-pointer active:scale-95 ${
                        isDark ? 'bg-cyan-600 hover:bg-cyan-500' : 'bg-[#00288e] hover:bg-[#1e40af]'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[18px]">add_circle</span>
                      <span>{isEn ? 'Configure My First Subject' : 'Configurar mi primera Asignatura'}</span>
                    </button>
                    <button
                      onClick={handleLoadSampleData}
                      disabled={isSaving}
                      className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer active:scale-95 ${
                        isDark
                          ? 'bg-slate-800 hover:bg-slate-700 text-cyan-300'
                          : 'bg-[#eff4ff] hover:bg-[#dce9ff] text-[#00288e]'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[18px]">auto_stories</span>
                      <span>{isEn ? 'Load 11th Grade Subjects' : 'Cargar asignaturas de Grado 11°'}</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredSubjects.map((sub) => (
                    <article
                      key={sub.id}
                      className={`rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group border ${
                        isDark ? 'bg-slate-900 border-slate-800 hover:border-slate-700' : 'bg-white border-[#e5eeff]'
                      }`}
                    >
                      <div>
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-12 h-12 rounded-xl flex items-center justify-center font-bold"
                              style={{
                                backgroundColor: isDark ? 'rgba(6,182,212,0.15)' : sub.bgLight,
                                color: isDark ? '#22d3ee' : sub.color
                              }}
                            >
                              <span className="material-symbols-outlined text-[28px]">{sub.icon}</span>
                            </div>
                            <div className="flex flex-col">
                              <span
                                className="text-[11px] font-bold uppercase tracking-wider"
                                style={{ color: isDark ? '#22d3ee' : sub.color }}
                              >
                                {sub.category}
                              </span>
                              <h3 className={`text-lg font-extrabold transition-colors ${
                                isDark ? 'text-white group-hover:text-cyan-400' : 'text-[#0b1c30] group-hover:text-[#0051d5]'
                              }`}>
                                {sub.name}
                              </h3>
                            </div>
                          </div>
                          <div className="flex flex-col items-end">
                            <span className={`text-[11px] font-medium ${isDark ? 'text-slate-400' : 'text-[#444653]'}`}>
                              {isEn ? 'Cumulative' : 'Acumulada'}
                            </span>
                            <span
                              className={`text-xl font-extrabold ${
                                sub.grade >= 4.0
                                  ? 'text-emerald-500'
                                  : sub.grade >= 3.0
                                  ? 'text-amber-500'
                                  : 'text-rose-500'
                              }`}
                            >
                              {sub.grade.toFixed(1)}
                            </span>
                          </div>
                        </div>

                        <div className={`mt-4 space-y-1.5 text-xs ${isDark ? 'text-slate-400' : 'text-[#444653]'}`}>
                          <div className="flex items-center gap-2">
                            <span className={`material-symbols-outlined text-[16px] ${isDark ? 'text-slate-500' : 'text-[#757684]'}`}>
                              person
                            </span>
                            <span>
                              {isEn ? 'Teacher: ' : 'Docente: '}
                              <strong className={`font-semibold ${isDark ? 'text-white' : 'text-[#0b1c30]'}`}>
                                {sub.teacher}
                              </strong>
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`material-symbols-outlined text-[16px] ${isDark ? 'text-slate-500' : 'text-[#757684]'}`}>
                              schedule
                            </span>
                            <span>
                              {sub.schedule} • {sub.room}
                            </span>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="mt-4">
                          <div className="flex items-center justify-between text-[11px] font-semibold mb-1">
                            <span className={isDark ? 'text-slate-400' : 'text-[#444653]'}>
                              {isEn ? 'Term Progress' : 'Avance del Período'}
                            </span>
                            <span className={`font-bold ${isDark ? 'text-white' : 'text-[#0b1c30]'}`}>{sub.progress}%</span>
                          </div>
                          <div className={`w-full rounded-full h-2 overflow-hidden ${isDark ? 'bg-slate-800' : 'bg-[#e5eeff]'}`}>
                            <div
                              className="h-2 rounded-full transition-all duration-500"
                              style={{
                                width: `${sub.progress}%`,
                                backgroundColor: isDark ? '#06b6d4' : sub.color
                              }}
                            />
                          </div>
                        </div>
                      </div>

                      <div className={`mt-5 pt-3 border-t flex items-center justify-between ${
                        isDark ? 'border-slate-800' : 'border-[#eff4ff]'
                      }`}>
                        <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold ${
                          isDark ? 'text-slate-400' : 'text-[#444653]'
                        }`}>
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          {isEn ? `Next: ${sub.nextClass}` : `Próx: ${sub.nextClass}`}
                        </span>
                        <button
                          onClick={() => {
                            if (sub.id === 'prog' || sub.name.toLowerCase().includes('program') || sub.name.toLowerCase().includes('tecno')) {
                              onNavigate('student_assignment');
                            } else {
                              showToast(isEn ? `Viewing evaluations and topics for ${sub.name}.` : `Mostrando el detalle de evaluaciones de ${sub.name}.`);
                            }
                          }}
                          className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                            isDark
                              ? 'bg-slate-800 hover:bg-slate-700 text-cyan-300'
                              : 'bg-[#eff4ff] hover:bg-[#dbe1ff] text-[#1e40af]'
                          }`}
                        >
                          <span>{isEn ? 'View Detail' : 'Ver Detalle'}</span>
                          <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              )}

              {/* Quick Academic Resources Strip */}
              <div className={`rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 border ${
                isDark ? 'bg-slate-900 border-slate-800' : 'bg-[#eff4ff] border-[#dce9ff]'
              }`}>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl text-white flex items-center justify-center shrink-0 ${
                    isDark ? 'bg-cyan-600' : 'bg-[#0051d5]'
                  }`}>
                    <span className="material-symbols-outlined text-[22px]">hub</span>
                  </div>
                  <div>
                    <h4 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-[#0b1c30]'}`}>
                      {isEn ? 'Institutional Repository & Database' : 'Repositorio Institucional y Base de Datos'}
                    </h4>
                    <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-[#444653]'}`}>
                      {isEn
                        ? 'Access educational guides, workshop files, and cloud gradebook records.'
                        : 'Accede a guías pedagógicas, material de lectura y registro de calificaciones en la nube.'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => showToast(isEn ? 'Opening Vallejuelos digital library repository...' : 'Abriendo biblioteca digital Vallejuelos...')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors border shrink-0 cursor-pointer ${
                    isDark
                      ? 'bg-slate-800 hover:bg-slate-700 text-white border-slate-700'
                      : 'bg-white hover:bg-[#dce9ff] text-[#00288e] border-[#cbd5e1]'
                  }`}
                >
                  {isEn ? 'Explore Resources' : 'Explorar Recursos'}
                </button>
              </div>
            </section>

            {/* RIGHT 30% DEADLINES PANEL */}
            <aside className="lg:col-span-4 flex flex-col space-y-6">
              <div className={`rounded-2xl p-5 shadow-sm flex flex-col space-y-4 border ${
                isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-[#e5eeff]'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`material-symbols-outlined text-[22px] ${
                      isDark ? 'text-cyan-400' : 'text-[#0051d5]'
                    }`}>
                      calendar_clock
                    </span>
                    <h2 className={`text-base font-extrabold ${isDark ? 'text-white' : 'text-[#0b1c30]'}`}>
                      {isEn ? 'Upcoming Deadlines' : 'Próximas Entregas'}
                    </h2>
                  </div>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                    isDark ? 'bg-cyan-950 text-cyan-300' : 'bg-[#eff4ff] text-[#0051d5]'
                  }`}>
                    {assignments.length} {isEn ? 'Tasks' : 'Tareas'}
                  </span>
                </div>

                {assignments.length === 0 ? (
                  <div className={`p-6 rounded-xl text-center border border-dashed flex flex-col items-center ${
                    isDark ? 'bg-slate-950 border-slate-800' : 'bg-[#f8f9ff] border-[#cbd5e1]'
                  }`}>
                    <span className={`material-symbols-outlined text-[32px] mb-2 ${
                      isDark ? 'text-slate-600' : 'text-[#757684]'
                    }`}>
                      task_alt
                    </span>
                    <strong className={`text-xs font-bold block mb-1 ${isDark ? 'text-white' : 'text-[#0b1c30]'}`}>
                      {isEn ? 'No pending tasks' : 'No hay tareas pendientes'}
                    </strong>
                    <p className={`text-[11px] leading-relaxed ${isDark ? 'text-slate-400' : 'text-[#444653]'}`}>
                      {isEn
                        ? 'When your teachers publish assignments or evaluations, they will appear here with deadlines.'
                        : 'Una vez tus profesores asignen talleres o evaluaciones aparecerán listadas aquí con sus fechas límite.'}
                    </p>
                  </div>
                ) : (
                  <>
                    <div className={`flex p-1 rounded-xl text-xs font-bold ${
                      isDark ? 'bg-slate-800' : 'bg-[#eff4ff]'
                    }`}>
                      <button
                        onClick={() => setFilterUrgentOnly(false)}
                        className={`flex-1 py-1.5 rounded-lg text-center transition-all cursor-pointer ${
                          !filterUrgentOnly
                            ? isDark ? 'bg-slate-700 text-white shadow-xs' : 'bg-white text-[#0b1c30] shadow-xs'
                            : isDark ? 'text-slate-400 hover:text-white' : 'text-[#444653] hover:text-[#0b1c30]'
                        }`}
                      >
                        {isEn ? `All (${assignments.length})` : `Todas (${assignments.length})`}
                      </button>
                      <button
                        onClick={() => setFilterUrgentOnly(true)}
                        className={`flex-1 py-1.5 rounded-lg text-center transition-all cursor-pointer ${
                          filterUrgentOnly
                            ? isDark ? 'bg-slate-700 text-white shadow-xs' : 'bg-white text-[#0b1c30] shadow-xs'
                            : isDark ? 'text-slate-400 hover:text-white' : 'text-[#444653] hover:text-[#0b1c30]'
                        }`}
                      >
                        {isEn ? 'Urgent' : 'Urgentes'}
                      </button>
                    </div>

                    <div className="flex flex-col space-y-3">
                      {filteredAssignments.map((assignment) => (
                        <div
                          key={assignment.id}
                          className={`p-4 rounded-xl shadow-xs hover:shadow-md transition-all flex flex-col space-y-2 border ${
                            isDark
                              ? 'bg-slate-950/80 border-slate-800'
                              : `bg-white ${assignment.borderAccent} border-[#e5eeff]`
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className={`text-[11px] font-bold uppercase tracking-wider ${
                              isDark ? 'text-cyan-400' : assignment.subjectColor
                            }`}>
                              {assignment.subject}
                            </span>
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold ${
                                assignment.urgency === 'urgente'
                                  ? isDark ? 'bg-rose-950 text-rose-300' : 'bg-[#ffdad6] text-[#93000a]'
                                  : isDark ? 'bg-emerald-950 text-emerald-300' : 'bg-emerald-100 text-emerald-900'
                              }`}
                            >
                              <span className="material-symbols-outlined text-[13px]">alarm</span>
                              {assignment.dueText}
                            </span>
                          </div>

                          <h3 className={`text-sm font-bold leading-snug ${isDark ? 'text-white' : 'text-[#0b1c30]'}`}>
                            {assignment.title}
                          </h3>

                          <div className={`flex items-center justify-between text-xs pt-1 ${
                            isDark ? 'text-slate-400' : 'text-[#444653]'
                          }`}>
                            <span className="inline-flex items-center gap-1">
                              <span className={`material-symbols-outlined text-[16px] ${isDark ? 'text-slate-500' : 'text-[#757684]'}`}>
                                {assignment.typeIcon}
                              </span>
                              {assignment.type}
                            </span>
                            <span className={`font-bold ${isDark ? 'text-white' : 'text-[#0b1c30]'}`}>
                              {isEn ? `Points: ${assignment.points}` : `Puntos: ${assignment.points}`}
                            </span>
                          </div>

                          <div className="pt-2">
                            <button
                              onClick={() => onNavigate('student_assignment')}
                              className={`w-full py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                                isDark
                                  ? 'bg-slate-800 hover:bg-slate-700 text-cyan-300'
                                  : 'bg-[#eff4ff] hover:bg-[#dbe1ff] text-[#1e40af]'
                              }`}
                            >
                              <span className="material-symbols-outlined text-[18px]">assignment</span>
                              <span>{isEn ? 'View Task & Submit Solution' : 'Ver Tarea y Subir Entrega'}</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </aside>
          </div>
        </main>
      </div>

      {/* MODAL: ADD SUBJECT FORM */}
      {showAddSubjectModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className={`w-full max-w-md rounded-3xl p-6 shadow-2xl border animate-in fade-in zoom-in-95 duration-200 ${
            isDark ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-[#e2e8f0] text-[#0b1c30]'
          }`}>
            <div className={`flex items-center justify-between mb-4 pb-2 border-b ${
              isDark ? 'border-slate-800' : 'border-[#eff4ff]'
            }`}>
              <div className="flex items-center gap-2">
                <span className={`material-symbols-outlined text-[24px] ${isDark ? 'text-cyan-400' : 'text-[#00288e]'}`}>
                  school
                </span>
                <h3 className="font-extrabold text-lg">
                  {isEn ? 'Configure New Subject' : 'Configurar Nueva Asignatura'}
                </h3>
              </div>
              <button
                onClick={() => setShowAddSubjectModal(false)}
                className={`p-1 rounded-lg cursor-pointer ${isDark ? 'text-slate-400 hover:text-white' : 'text-[#757684] hover:text-[#0b1c30]'}`}
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleAddSubjectSubmit} className="flex flex-col gap-3.5">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold">
                  {isEn ? 'Subject Name *' : 'Nombre de la Asignatura *'}
                </label>
                <input
                  type="text"
                  value={newSubName}
                  onChange={(e) => setNewSubName(e.target.value)}
                  placeholder={isEn ? 'e.g. Mathematics, Biology, History' : 'ej. Matemáticas, Biología, Historia'}
                  required
                  className={`w-full h-10.5 px-3.5 text-sm rounded-xl outline-none border transition-all ${
                    isDark
                      ? 'bg-slate-950 border-slate-700 text-white placeholder:text-slate-600 focus:border-cyan-400'
                      : 'bg-white border-[#cbd5e1] text-[#0b1c30] placeholder:text-[#757684]/60 focus:bg-[#eff4ff] focus:border-[#0051d5]'
                  }`}
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold">
                  {isEn ? 'Teacher' : 'Docente Titular'}
                </label>
                <input
                  type="text"
                  value={newSubTeacher}
                  onChange={(e) => setNewSubTeacher(e.target.value)}
                  placeholder={isEn ? 'e.g. Prof. Roberto Gómez' : 'ej. Lic. Roberto Gómez'}
                  className={`w-full h-10.5 px-3.5 text-sm rounded-xl outline-none border transition-all ${
                    isDark
                      ? 'bg-slate-950 border-slate-700 text-white placeholder:text-slate-600 focus:border-cyan-400'
                      : 'bg-white border-[#cbd5e1] text-[#0b1c30] placeholder:text-[#757684]/60 focus:bg-[#eff4ff] focus:border-[#0051d5]'
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold">
                    {isEn ? 'Schedule' : 'Horario'}
                  </label>
                  <input
                    type="text"
                    value={newSubSchedule}
                    onChange={(e) => setNewSubSchedule(e.target.value)}
                    placeholder={isEn ? 'e.g. Tue & Thu 08:00 AM' : 'ej. Mar y Jue 08:00 AM'}
                    className={`w-full h-10.5 px-3.5 text-sm rounded-xl outline-none border transition-all ${
                      isDark
                        ? 'bg-slate-950 border-slate-700 text-white placeholder:text-slate-600 focus:border-cyan-400'
                        : 'bg-white border-[#cbd5e1] text-[#0b1c30] placeholder:text-[#757684]/60 focus:bg-[#eff4ff] focus:border-[#0051d5]'
                    }`}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold">
                    {isEn ? 'Classroom' : 'Aula / Salón'}
                  </label>
                  <input
                    type="text"
                    value={newSubRoom}
                    onChange={(e) => setNewSubRoom(e.target.value)}
                    placeholder={isEn ? 'e.g. Room 302' : 'ej. Aula 302'}
                    className={`w-full h-10.5 px-3.5 text-sm rounded-xl outline-none border transition-all ${
                      isDark
                        ? 'bg-slate-950 border-slate-700 text-white placeholder:text-slate-600 focus:border-cyan-400'
                        : 'bg-white border-[#cbd5e1] text-[#0b1c30] placeholder:text-[#757684]/60 focus:bg-[#eff4ff] focus:border-[#0051d5]'
                    }`}
                  />
                </div>
              </div>

              <div className={`mt-4 pt-3 border-t flex items-center justify-end gap-2 ${
                isDark ? 'border-slate-800' : 'border-[#eff4ff]'
              }`}>
                <button
                  type="button"
                  onClick={() => setShowAddSubjectModal(false)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer ${
                    isDark ? 'text-slate-400 hover:bg-slate-800 hover:text-white' : 'text-[#444653] hover:bg-[#eff4ff]'
                  }`}
                >
                  {isEn ? 'Cancel' : 'Cancelar'}
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className={`px-5 py-2 rounded-xl text-white text-xs font-bold shadow-sm transition-all cursor-pointer flex items-center gap-1.5 ${
                    isDark ? 'bg-cyan-600 hover:bg-cyan-500' : 'bg-[#00288e] hover:bg-[#1e40af]'
                  }`}
                >
                  {isSaving ? (
                    <span>{isEn ? 'Saving to Firestore...' : 'Guardando en Firestore...'}</span>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[18px]">save</span>
                      <span>{isEn ? 'Save Subject' : 'Guardar Asignatura'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Official Schedule Modal */}
      {showScheduleModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/75 backdrop-blur-md animate-in fade-in duration-200"
        >
          <div
            className={`relative w-full max-w-5xl max-h-[92vh] flex flex-col rounded-3xl shadow-2xl border overflow-hidden ${
              isDark
                ? 'bg-slate-900 border-slate-700 text-white shadow-cyan-950/40'
                : 'bg-white border-slate-200 text-slate-900 shadow-slate-300/60'
            }`}
          >
            {/* Header */}
            <div className={`p-5 sm:p-6 border-b flex items-center justify-between shrink-0 ${
              isDark ? 'border-slate-800 bg-slate-950/50' : 'border-[#eff4ff] bg-[#f8faff]'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`w-11 h-11 rounded-2xl flex items-center justify-center ${
                  isDark ? 'bg-cyan-950 text-cyan-300' : 'bg-[#dce9ff] text-[#00288e]'
                }`}>
                  <span className="material-symbols-outlined text-[24px]">calendar_month</span>
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-extrabold leading-tight">
                    {isEn ? 'Official Institutional Schedule' : 'Horario Escolar Oficial'}
                  </h3>
                  <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-[#444653]'}`}>
                    {gradeLevel} • {shift} • I.E. Vallejuelos
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowScheduleModal(false)}
                className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
                  isDark
                    ? 'bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            {/* Schedule Table Body */}
            <div className="p-4 sm:p-6 overflow-x-auto overflow-y-auto flex-1">
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead>
                  <tr className={`border-b text-xs font-bold uppercase tracking-wider ${
                    isDark ? 'border-slate-800 text-slate-400' : 'border-slate-200 text-[#444653]'
                  }`}>
                    <th className="py-3 px-3 w-28">{isEn ? 'Period & Time' : 'Hora / Bloque'}</th>
                    <th className="py-3 px-3">{isEn ? 'Monday' : 'Lunes'}</th>
                    <th className="py-3 px-3">{isEn ? 'Tuesday' : 'Martes'}</th>
                    <th className="py-3 px-3">{isEn ? 'Wednesday' : 'Miércoles'}</th>
                    <th className="py-3 px-3">{isEn ? 'Thursday' : 'Jueves'}</th>
                    <th className="py-3 px-3">{isEn ? 'Friday' : 'Viernes'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
                  {OFFICIAL_SCHEDULE_11_1.map((slot) => (
                    <tr
                      key={slot.period}
                      className={`transition-colors ${
                        isDark ? 'hover:bg-slate-850/60' : 'hover:bg-blue-50/40'
                      }`}
                    >
                      <td className="py-3 px-3 align-top font-mono font-bold text-[11px] text-cyan-600 dark:text-cyan-400">
                        <div className="font-sans font-bold text-slate-700 dark:text-slate-300">
                          {isEn ? `Period ${slot.period}` : `Hora ${slot.period}`}
                        </div>
                        <div>{slot.time}</div>
                      </td>
                      {[slot.monday, slot.tuesday, slot.wednesday, slot.thursday, slot.friday].map((cell, idx) => (
                        <td key={idx} className="py-2.5 px-3 align-top">
                          <div className={`p-2.5 rounded-xl border flex flex-col gap-0.5 ${
                            isDark
                              ? 'bg-slate-800/80 border-slate-700/60'
                              : 'bg-white border-slate-200/80 shadow-2xs'
                          }`}>
                            <span className="font-bold text-xs leading-tight text-slate-900 dark:text-slate-100">
                              {cell.subject}
                            </span>
                            <span className="text-[10px] text-slate-500 dark:text-slate-400">
                              {cell.teacher}
                            </span>
                          </div>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Footer */}
            <div className={`p-4 border-t flex items-center justify-between text-xs shrink-0 ${
              isDark ? 'border-slate-800 bg-slate-950/40 text-slate-400' : 'border-slate-200 bg-slate-50 text-[#757684]'
            }`}>
              <span>
                {isEn
                  ? 'Official Schedule source: Academic Direction • FET Schedule Generator'
                  : 'Fuente oficial: Coordinación Académica • Plan de Estudios Institucional'}
              </span>
              <button
                type="button"
                onClick={() => setShowScheduleModal(false)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  isDark ? 'bg-slate-800 hover:bg-slate-700 text-white' : 'bg-slate-200 hover:bg-slate-300 text-slate-800'
                }`}
              >
                {isEn ? 'Close' : 'Cerrar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
