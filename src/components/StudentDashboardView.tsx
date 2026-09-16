import React, { useState } from 'react';
import { ActiveScreen, Subject, UpcomingAssignment, UserProfile } from '../types';
import { ASSETS, INITIAL_SUBJECTS, INITIAL_UPCOMING_ASSIGNMENTS } from '../data/mockData';
import { saveUserConfiguration } from '../services/authService';

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
  // Check if user has configured their account
  const isConfigured = Boolean(currentUser?.hasConfigured);
  const studentName = currentUser?.fullName || 'Miguel Ángel Jiménez';
  const gradeLevel = currentUser?.gradeLevel || 'Grado 11°B';

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
  const [activePeriod, setActivePeriod] = useState('Primer Período 2026');
  const [showNotifications, setShowNotifications] = useState(false);

  // Subject creation modal state for empty account
  const [showAddSubjectModal, setShowAddSubjectModal] = useState(false);
  const [newSubName, setNewSubName] = useState('');
  const [newSubTeacher, setNewSubTeacher] = useState('');
  const [newSubSchedule, setNewSubSchedule] = useState('');
  const [newSubRoom, setNewSubRoom] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const filteredAssignments = filterUrgentOnly
    ? assignments.filter((a) => a.urgency === 'urgente')
    : assignments;

  // Handle adding a first subject manually
  const handleAddSubjectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubName.trim()) return;

    setIsSaving(true);
    const newSubjectItem: Subject = {
      id: `sub_${Date.now()}`,
      name: newSubName.trim(),
      category: 'Asignatura Matriculada',
      teacher: newSubTeacher.trim() || 'Docente Asignado',
      schedule: newSubSchedule.trim() || 'Lunes y Miércoles 07:00 AM',
      room: newSubRoom.trim() || 'Aula 201',
      grade: 4.5,
      progress: 25,
      color: '#0051d5',
      bgLight: '#eff4ff',
      icon: 'menu_book',
      nextClass: 'Próxima sesión según horario'
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

  // Handle loading recommended demo subjects into empty account
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
      } catch (err) {
        console.warn('Error saving demo subjects:', err);
      }
    }
    setIsSaving(false);
  };

  return (
    <div className="min-h-screen bg-[#f8f9ff] flex text-[#0b1c30]">
      {/* FIXED SIDEBAR (Portal Escolar) */}
      <aside className="hidden lg:flex fixed left-0 top-12 bottom-0 w-72 bg-white shadow-[0_1px_8px_rgba(0,0,0,0.04)] z-40 flex-col justify-between border-r border-[#e5eeff]">
        <div className="flex flex-col">
          {/* Logo & School Name */}
          <div className="h-16 px-6 flex items-center gap-3 border-b border-[#eff4ff]">
            <div className="w-10 h-10 rounded-xl bg-[#1e40af] flex items-center justify-center text-white shadow-xs">
              <span className="material-symbols-outlined text-[24px]">school</span>
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-xl text-[#00288e] leading-none tracking-tight">
                Edulink
              </span>
              <span className="text-[11px] font-semibold text-[#444653] leading-none mt-1">
                Portal Estudiantil
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="px-3 py-4 flex flex-col gap-1">
            <button
              onClick={() => onNavigate('student_dashboard')}
              className="flex items-center gap-3 px-4 py-2.5 rounded-xl font-bold text-sm bg-[#1e40af] text-white shadow-sm transition-all text-left"
            >
              <span className="material-symbols-outlined text-[20px]">dashboard</span>
              <span>Inicio</span>
            </button>
            <button
              onClick={() => {
                if (!isConfigured && subjects.length === 0) {
                  setShowAddSubjectModal(true);
                } else {
                  alert(`Mostrando ${subjects.length} asignaturas matriculadas.`);
                }
              }}
              className="flex items-center gap-3 px-4 py-2.5 rounded-xl font-semibold text-sm text-[#444653] hover:bg-[#eff4ff] hover:text-[#0b1c30] transition-all text-left cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px]">menu_book</span>
              <span>Mis Asignaturas ({subjects.length})</span>
            </button>
            <button
              onClick={() => {
                if (!isConfigured && subjects.length === 0) {
                  alert('Tu cuenta no tiene calificaciones registradas aún. Configura tus asignaturas primero.');
                } else {
                  alert('Promedio acumulado actual: 4.2 / 5.0. No tienes materias reprobadas.');
                }
              }}
              className="flex items-center gap-3 px-4 py-2.5 rounded-xl font-semibold text-sm text-[#444653] hover:bg-[#eff4ff] hover:text-[#0b1c30] transition-all text-left cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px]">assignment_turned_in</span>
              <span>Calificaciones</span>
            </button>
            <button
              onClick={() => alert('Horario institucional: Jornada Diurna 06:15 AM - 12:15 PM.')}
              className="flex items-center gap-3 px-4 py-2.5 rounded-xl font-semibold text-sm text-[#444653] hover:bg-[#eff4ff] hover:text-[#0b1c30] transition-all text-left cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px]">calendar_today</span>
              <span>Horario</span>
            </button>
            <button
              onClick={() => onNavigate('student_assignment')}
              className="flex items-center gap-3 px-4 py-2.5 rounded-xl font-semibold text-sm text-[#444653] hover:bg-[#eff4ff] hover:text-[#00288e] transition-all text-left relative group cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px] group-hover:text-[#00288e]">assignment</span>
              <span>Tareas y Entregas</span>
              {assignments.length > 0 && (
                <span className="ml-auto w-2 h-2 rounded-full bg-amber-500 animate-ping" />
              )}
            </button>
            <button
              onClick={() => alert('Acceso al foro institucional de debate sobre Tecnología e Innovación.')}
              className="flex items-center gap-3 px-4 py-2.5 rounded-xl font-semibold text-sm text-[#444653] hover:bg-[#eff4ff] hover:text-[#0b1c30] transition-all text-left cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px]">chat_bubble</span>
              <span>Foro y encuestas</span>
            </button>
          </nav>
        </div>

        {/* User Card & Logout Bottom */}
        <div className="p-4 border-t border-[#eff4ff] flex flex-col gap-2">
          <div className="flex items-center gap-3 p-2 rounded-xl bg-[#eff4ff]">
            <img
              src={currentUser?.avatarUrl || ASSETS.studentAvatar}
              alt="Avatar"
              className="w-9 h-9 rounded-full object-cover ring-2 ring-[#0051d5]/20"
            />
            <div className="flex flex-col overflow-hidden">
              <span className="text-xs font-bold text-[#0b1c30] truncate">
                {studentName}
              </span>
              <span className="text-[11px] text-[#444653] truncate">
                {gradeLevel}
              </span>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-semibold text-[#ba1a1a] hover:bg-[#fff1f2] transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">logout</span>
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="lg:pl-72 flex-1 flex flex-col min-w-0">
        {/* TOP BAR */}
        <header className="h-16 bg-white border-b border-[#e5eeff] px-4 sm:px-6 lg:px-8 flex items-center justify-between sticky top-12 z-30 shadow-xs">
          <div className="flex items-center gap-3 w-full max-w-md">
            <div className="relative w-full">
              <span className="material-symbols-outlined absolute left-3 top-3 text-[#757684] text-[20px]">
                search
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar cursos, tareas, profesores..."
                className="w-full h-11 pl-10 pr-4 bg-[#eff4ff] text-[#0b1c30] placeholder:text-[#757684] rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#0051d5]/30 transition-all border border-transparent focus:border-[#0051d5]"
              />
            </div>
            <span className="inline-flex items-center px-3 py-1 rounded-full bg-[#dbe1ff] text-[#00174b] text-xs font-bold shrink-0">
              Período 1 - 2026
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 rounded-xl text-[#444653] hover:bg-[#eff4ff] hover:text-[#0b1c30] transition-colors flex items-center justify-center cursor-pointer"
                title="Notificaciones"
              >
                <span className="material-symbols-outlined text-[22px]">notifications</span>
                <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-[#ba1a1a] rounded-full ring-2 ring-white" />
              </button>
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl p-3 border border-[#e2e8f0] z-50">
                  <span className="block text-xs font-bold text-[#0b1c30] mb-2 pb-1 border-b border-[#eff4ff]">
                    Notificaciones Recientes
                  </span>
                  <div className="flex flex-col gap-2 text-xs">
                    <div className="p-2 bg-[#eff4ff] rounded-lg">
                      <strong className="text-[#00288e] block">Base de Datos Firestore Conectada</strong>
                      <span className="text-[#444653]">Tu cuenta y sesiones están sincronizadas en tiempo real.</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="h-8 w-px bg-[#dce9ff]" />

            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:flex flex-col">
                <span className="text-xs text-[#0b1c30] font-bold leading-tight">
                  {studentName}
                </span>
                <span className="text-[11px] text-[#444653] leading-tight mt-0.5 font-medium">
                  {gradeLevel} {currentUser?.studentCode ? `• ${currentUser.studentCode}` : ''}
                </span>
              </div>
              <img
                alt="Foto de perfil de estudiante"
                className="w-9 h-9 rounded-full object-cover ring-2 ring-[#1e40af]/20 shadow-xs"
                src={currentUser?.avatarUrl || ASSETS.studentAvatar}
              />
            </div>
          </div>
        </header>

        {/* DASHBOARD CONTENT BODY */}
        <main className="p-4 sm:p-6 lg:p-8 flex flex-col gap-6 max-w-[1400px] w-full mx-auto">
          {/* Top Welcome Hero Banner */}
          <section className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#1e40af] via-[#0051d5] to-[#316bf3] p-6 lg:p-8 text-white shadow-md">
            <div className="absolute -right-16 -top-20 w-80 h-80 rounded-full bg-white/10 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 right-48 w-60 h-60 rounded-full bg-[#7bd0ff]/20 blur-2xl pointer-events-none" />

            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="max-w-xl flex flex-col space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md self-start text-[11px] font-bold tracking-wide uppercase text-[#dbe1ff]">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Período Activo 2026 • Rol Estudiante
                </div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl text-white font-extrabold tracking-tight">
                  ¡Hola, {studentName}! 👋
                </h1>
                <p className="text-sm sm:text-base text-[#d3e4fe] font-normal leading-relaxed">
                  {isConfigured || subjects.length > 0
                    ? `Tienes ${assignments.length} actividades programadas en tus asignaturas activas.`
                    : 'Tu cuenta de estudiante ha sido creada exitosamente en Firestore. Como recién ingresas, tu portal está listo para que agregues tu información y asignaturas.'}
                </p>
                <div className="pt-2 flex flex-wrap items-center gap-3">
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-white/90">
                    <span className="material-symbols-outlined text-[18px] text-[#7bd0ff]">verified_user</span>
                    {gradeLevel} {currentUser?.studentCode ? `(Carnet: ${currentUser.studentCode})` : ''}
                  </span>
                  {currentUser?.shift && (
                    <>
                      <span className="text-white/40">•</span>
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-white/90">
                        <span className="material-symbols-outlined text-[18px] text-[#7bd0ff]">schedule</span>
                        {currentUser.shift}
                      </span>
                    </>
                  )}
                  <span className="text-white/40">•</span>
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-white/90">
                    <span className="material-symbols-outlined text-[18px] text-[#7bd0ff]">database</span>
                    Usuario Registrado en Base de Datos
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
            <div className="bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between border border-[#e5eeff]">
              <div className="flex items-start justify-between">
                <div className="flex flex-col">
                  <span className="text-xs uppercase tracking-wider text-[#444653] font-bold">
                    Rendimiento Académico
                  </span>
                  <span className="text-3xl font-extrabold text-[#0b1c30] mt-1">
                    {subjects.length > 0 ? (
                      <>
                        4.2 <span className="text-sm font-normal text-[#444653]">/ 5.0</span>
                      </>
                    ) : (
                      <>
                        -- <span className="text-sm font-normal text-[#444653]">/ 5.0</span>
                      </>
                    )}
                  </span>
                </div>
                <div className="w-10 h-10 rounded-xl bg-[#eff4ff] flex items-center justify-center text-[#0051d5]">
                  <span className="material-symbols-outlined text-[24px]">grade</span>
                </div>
              </div>
              <div className="mt-4 pt-3 flex items-center justify-between border-t border-[#eff4ff]">
                {subjects.length > 0 ? (
                  <>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
                      <span className="material-symbols-outlined text-[14px]">check_circle</span>
                      Excelente rendimiento
                    </span>
                    <span className="text-xs text-emerald-700 font-semibold">+0.3 este período</span>
                  </>
                ) : (
                  <>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#f1f5f9] text-[#64748b] text-xs font-bold">
                      Sin notas aún
                    </span>
                    <span className="text-xs text-[#64748b]">Configura materias</span>
                  </>
                )}
              </div>
            </div>

            {/* Metric 2: Tareas Pendientes */}
            <div className="bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between border border-[#e5eeff]">
              <div className="flex items-start justify-between">
                <div className="flex flex-col">
                  <span className="text-xs uppercase tracking-wider text-[#444653] font-bold">
                    Tareas Asignadas
                  </span>
                  <span className="text-3xl font-extrabold text-[#0b1c30] mt-1">
                    {assignments.length}{' '}
                    <span className="text-sm font-normal text-[#444653]">
                      {assignments.length === 1 ? 'en curso' : 'en curso'}
                    </span>
                  </span>
                </div>
                <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
                  <span className="material-symbols-outlined text-[24px]">pending_actions</span>
                </div>
              </div>
              <div className="mt-4 pt-3 flex items-center justify-between border-t border-[#eff4ff]">
                {assignments.length > 0 ? (
                  <>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-xs font-bold">
                      <span className="material-symbols-outlined text-[14px]">warning</span>
                      Por calificar/entregar
                    </span>
                    <span className="text-xs text-[#ba1a1a] font-bold">2 urgentes</span>
                  </>
                ) : (
                  <>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
                      Al día
                    </span>
                    <span className="text-xs text-emerald-700">0 pendientes</span>
                  </>
                )}
              </div>
            </div>

            {/* Metric 3: Asistencia */}
            <div className="bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between border border-[#e5eeff]">
              <div className="flex items-start justify-between">
                <div className="flex flex-col">
                  <span className="text-xs uppercase tracking-wider text-[#444653] font-bold">
                    Asistencia Global
                  </span>
                  <span className="text-3xl font-extrabold text-[#0b1c30] mt-1">
                    {subjects.length > 0 ? '98%' : '100%'}
                  </span>
                </div>
                <div className="w-10 h-10 rounded-xl bg-[#e5eeff] flex items-center justify-center text-[#1e40af]">
                  <span className="material-symbols-outlined text-[24px]">how_to_reg</span>
                </div>
              </div>
              <div className="mt-4 pt-3 flex items-center justify-between border-t border-[#eff4ff]">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#dbe1ff] text-[#00174b] text-xs font-bold">
                  <span className="material-symbols-outlined text-[14px]">event_available</span>
                  {subjects.length > 0 ? 'Justificada (02 Feb)' : 'Sin faltas'}
                </span>
                <span className="text-xs text-[#444653] font-bold">Asistencia al día</span>
              </div>
            </div>
          </section>

          {/* 2-Column Split: Main Academic Workspace vs Next Deadlines Panel */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* LEFT 70% */}
            <section className="lg:col-span-8 flex flex-col space-y-6">
              {/* Section Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-[#e5eeff]">
                <div>
                  <h2 className="text-xl font-extrabold text-[#0b1c30]">Mis Asignaturas Activas</h2>
                  <p className="text-xs text-[#444653]">
                    Carga académica matriculada y progreso evaluativo en tiempo real.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowAddSubjectModal(true)}
                    className="px-3 py-1.5 rounded-xl bg-[#00288e] hover:bg-[#1e40af] text-white text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px]">add</span>
                    <span>Agregar Materia</span>
                  </button>
                </div>
              </div>

              {/* EMPTY STATE OR SUBJECTS GRID */}
              {subjects.length === 0 ? (
                /* MANDATORY EMPTY STATE: USER JUST REGISTERED AND HAS NOT CONFIGURED ANYTHING */
                <div className="bg-white rounded-2xl p-8 sm:p-12 shadow-sm border border-[#e5eeff] text-center flex flex-col items-center justify-center">
                  <div className="w-16 h-16 rounded-2xl bg-[#eff4ff] text-[#0051d5] flex items-center justify-center mb-4">
                    <span className="material-symbols-outlined text-[36px]">inventory_2</span>
                  </div>
                  <h3 className="text-xl font-extrabold text-[#0b1c30] mb-2">
                    No hay asignaturas configuradas todavía
                  </h3>
                  <p className="text-sm text-[#444653] max-w-md mb-6 leading-relaxed">
                    Al registrarte en la plataforma tu perfil se encuentra completamente limpio. Puedes agregar tus materias escolares de forma manual o cargar la estructura sugerida para explorar el sistema.
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-3">
                    <button
                      onClick={() => setShowAddSubjectModal(true)}
                      className="px-4 py-2.5 rounded-xl bg-[#00288e] hover:bg-[#1e40af] text-white text-xs font-bold shadow-sm transition-all flex items-center gap-2 cursor-pointer active:scale-95"
                    >
                      <span className="material-symbols-outlined text-[18px]">add_circle</span>
                      <span>Configurar mi primera Asignatura</span>
                    </button>
                    <button
                      onClick={handleLoadSampleData}
                      disabled={isSaving}
                      className="px-4 py-2.5 rounded-xl bg-[#eff4ff] hover:bg-[#dce9ff] text-[#00288e] text-xs font-bold transition-all flex items-center gap-2 cursor-pointer active:scale-95"
                    >
                      <span className="material-symbols-outlined text-[18px]">auto_stories</span>
                      <span>Cargar asignaturas de Grado 11°</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* 2x2 Subjects Grid */
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {subjects.map((sub) => (
                    <article
                      key={sub.id}
                      className="bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group border border-[#e5eeff]"
                    >
                      <div>
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-12 h-12 rounded-xl flex items-center justify-center font-bold"
                              style={{ backgroundColor: sub.bgLight, color: sub.color }}
                            >
                              <span className="material-symbols-outlined text-[28px]">{sub.icon}</span>
                            </div>
                            <div className="flex flex-col">
                              <span
                                className="text-[11px] font-bold uppercase tracking-wider"
                                style={{ color: sub.color }}
                              >
                                {sub.category}
                              </span>
                              <h3 className="text-lg font-extrabold text-[#0b1c30] group-hover:text-[#0051d5] transition-colors">
                                {sub.name}
                              </h3>
                            </div>
                          </div>
                          <div className="flex flex-col items-end">
                            <span className="text-[11px] text-[#444653] font-medium">Acumulada</span>
                            <span
                              className={`text-xl font-extrabold ${
                                sub.grade >= 4.0
                                  ? 'text-emerald-600'
                                  : sub.grade >= 3.0
                                  ? 'text-amber-600'
                                  : 'text-red-600'
                              }`}
                            >
                              {sub.grade.toFixed(1)}
                            </span>
                          </div>
                        </div>

                        <div className="mt-4 space-y-1.5 text-xs text-[#444653]">
                          <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-[16px] text-[#757684]">person</span>
                            <span>
                              Docente: <strong className="text-[#0b1c30] font-semibold">{sub.teacher}</strong>
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-[16px] text-[#757684]">schedule</span>
                            <span>
                              {sub.schedule} • {sub.room}
                            </span>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="mt-4">
                          <div className="flex items-center justify-between text-[11px] font-semibold mb-1">
                            <span className="text-[#444653]">Avance del Período</span>
                            <span className="text-[#0b1c30] font-bold">{sub.progress}%</span>
                          </div>
                          <div className="w-full bg-[#e5eeff] rounded-full h-2 overflow-hidden">
                            <div
                              className="h-2 rounded-full transition-all duration-500"
                              style={{
                                width: `${sub.progress}%`,
                                backgroundColor: sub.color
                              }}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="mt-5 pt-3 border-t border-[#eff4ff] flex items-center justify-between">
                        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#444653]">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          Próx: {sub.nextClass}
                        </span>
                        <button
                          onClick={() => {
                            if (sub.id === 'prog' || sub.name.toLowerCase().includes('program')) {
                              onNavigate('student_assignment');
                            } else {
                              alert(`Mostrando el detalle de contenidos y evaluaciones de ${sub.name}.`);
                            }
                          }}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#eff4ff] hover:bg-[#dbe1ff] text-[#1e40af] text-xs font-bold transition-colors cursor-pointer"
                        >
                          <span>Ver Detalle</span>
                          <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              )}

              {/* Quick Academic Resources Strip */}
              <div className="bg-[#eff4ff] rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 border border-[#dce9ff]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#0051d5] text-white flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[22px]">hub</span>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-[#0b1c30]">
                      Repositorio Institucional y Base de Datos
                    </h4>
                    <p className="text-xs text-[#444653]">
                      Accede a guías pedagógicas, material de lectura y registro de calificaciones en la nube.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => alert('Abriendo biblioteca digital Vallejuelos...')}
                  className="px-4 py-2 rounded-xl bg-white hover:bg-[#dce9ff] text-[#00288e] text-xs font-bold transition-colors border border-[#cbd5e1] shrink-0 cursor-pointer"
                >
                  Explorar Recursos
                </button>
              </div>
            </section>

            {/* RIGHT 30% DEADLINES PANEL */}
            <aside className="lg:col-span-4 flex flex-col space-y-6">
              <div className="bg-white rounded-2xl p-5 shadow-sm flex flex-col space-y-4 border border-[#e5eeff]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#0051d5] text-[22px]">
                      calendar_clock
                    </span>
                    <h2 className="text-base font-extrabold text-[#0b1c30]">Próximas Entregas</h2>
                  </div>
                  <span className="text-xs font-bold text-[#0051d5] bg-[#eff4ff] px-2 py-0.5 rounded-full">
                    {assignments.length} Tareas
                  </span>
                </div>

                {assignments.length === 0 ? (
                  <div className="p-6 rounded-xl bg-[#f8f9ff] text-center border border-dashed border-[#cbd5e1] flex flex-col items-center">
                    <span className="material-symbols-outlined text-[#757684] text-[32px] mb-2">
                      task_alt
                    </span>
                    <strong className="text-xs font-bold text-[#0b1c30] block mb-1">
                      No hay tareas pendientes
                    </strong>
                    <p className="text-[11px] text-[#444653] leading-relaxed">
                      Una vez tus profesores asignen talleres o evaluaciones aparecerán listadas aquí con sus fechas límite.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="flex bg-[#eff4ff] p-1 rounded-xl text-xs font-bold">
                      <button
                        onClick={() => setFilterUrgentOnly(false)}
                        className={`flex-1 py-1.5 rounded-lg text-center transition-all cursor-pointer ${
                          !filterUrgentOnly
                            ? 'bg-white text-[#0b1c30] shadow-xs'
                            : 'text-[#444653] hover:text-[#0b1c30]'
                        }`}
                      >
                        Todas ({assignments.length})
                      </button>
                      <button
                        onClick={() => setFilterUrgentOnly(true)}
                        className={`flex-1 py-1.5 rounded-lg text-center transition-all cursor-pointer ${
                          filterUrgentOnly
                            ? 'bg-white text-[#0b1c30] shadow-xs'
                            : 'text-[#444653] hover:text-[#0b1c30]'
                        }`}
                      >
                        Urgentes
                      </button>
                    </div>

                    <div className="flex flex-col space-y-3">
                      {filteredAssignments.map((assignment) => (
                        <div
                          key={assignment.id}
                          className={`p-4 rounded-xl bg-white ${assignment.borderAccent} shadow-xs hover:shadow-md transition-all flex flex-col space-y-2 border border-[#e5eeff]`}
                        >
                          <div className="flex items-center justify-between">
                            <span className={`text-[11px] font-bold uppercase tracking-wider ${assignment.subjectColor}`}>
                              {assignment.subject}
                            </span>
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold ${
                                assignment.urgency === 'urgente'
                                  ? 'bg-[#ffdad6] text-[#93000a]'
                                  : 'bg-emerald-100 text-emerald-900'
                              }`}
                            >
                              <span className="material-symbols-outlined text-[13px]">alarm</span>
                              {assignment.dueText}
                            </span>
                          </div>

                          <h3 className="text-sm font-bold text-[#0b1c30] leading-snug">
                            {assignment.title}
                          </h3>

                          <div className="flex items-center justify-between text-xs text-[#444653] pt-1">
                            <span className="inline-flex items-center gap-1">
                              <span className="material-symbols-outlined text-[16px] text-[#757684]">
                                {assignment.typeIcon}
                              </span>
                              {assignment.type}
                            </span>
                            <span className="font-bold text-[#0b1c30]">Puntos: {assignment.points}</span>
                          </div>

                          <div className="pt-2">
                            <button
                              onClick={() => onNavigate('student_assignment')}
                              className="w-full py-2 px-3 rounded-xl bg-[#eff4ff] hover:bg-[#dbe1ff] text-[#1e40af] text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
                            >
                              <span className="material-symbols-outlined text-[18px]">assignment</span>
                              <span>Ver Tarea y Subir Entrega</span>
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
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-[#e2e8f0] animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-[#eff4ff]">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#00288e] text-[24px]">school</span>
                <h3 className="font-extrabold text-lg text-[#0b1c30]">Configurar Nueva Asignatura</h3>
              </div>
              <button
                onClick={() => setShowAddSubjectModal(false)}
                className="p-1 rounded-lg text-[#757684] hover:text-[#0b1c30] cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleAddSubjectSubmit} className="flex flex-col gap-3.5">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-[#0b1c30]">Nombre de la Asignatura</label>
                <input
                  type="text"
                  value={newSubName}
                  onChange={(e) => setNewSubName(e.target.value)}
                  placeholder="ej. Matemáticas, Biología, Historia"
                  required
                  className="w-full h-10.5 px-3.5 bg-white text-[#0b1c30] text-sm rounded-xl outline-none transition-all placeholder:text-[#757684]/60 focus:bg-[#eff4ff] border border-[#cbd5e1] focus:border-[#0051d5]"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-[#0b1c30]">Docente Titular</label>
                <input
                  type="text"
                  value={newSubTeacher}
                  onChange={(e) => setNewSubTeacher(e.target.value)}
                  placeholder="ej. Lic. Roberto Gómez"
                  className="w-full h-10.5 px-3.5 bg-white text-[#0b1c30] text-sm rounded-xl outline-none transition-all placeholder:text-[#757684]/60 focus:bg-[#eff4ff] border border-[#cbd5e1] focus:border-[#0051d5]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-[#0b1c30]">Horario</label>
                  <input
                    type="text"
                    value={newSubSchedule}
                    onChange={(e) => setNewSubSchedule(e.target.value)}
                    placeholder="ej. Mar y Jue 08:00 AM"
                    className="w-full h-10.5 px-3.5 bg-white text-[#0b1c30] text-sm rounded-xl outline-none transition-all placeholder:text-[#757684]/60 focus:bg-[#eff4ff] border border-[#cbd5e1] focus:border-[#0051d5]"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-[#0b1c30]">Aula / Salón</label>
                  <input
                    type="text"
                    value={newSubRoom}
                    onChange={(e) => setNewSubRoom(e.target.value)}
                    placeholder="ej. Aula 302"
                    className="w-full h-10.5 px-3.5 bg-white text-[#0b1c30] text-sm rounded-xl outline-none transition-all placeholder:text-[#757684]/60 focus:bg-[#eff4ff] border border-[#cbd5e1] focus:border-[#0051d5]"
                  />
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-[#eff4ff] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddSubjectModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-[#444653] hover:bg-[#eff4ff] cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 rounded-xl bg-[#00288e] hover:bg-[#1e40af] text-white text-xs font-bold shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
                >
                  {isSaving ? (
                    <span>Guardando en Firestore...</span>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[18px]">save</span>
                      <span>Guardar Asignatura</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
