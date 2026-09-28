import React, { useState, useMemo } from 'react';
import { ActiveScreen, StudentGradeRecord, UserProfile } from '../types';
import { ASSETS, INITIAL_STUDENT_GRADES } from '../data/mockData';
import { saveUserConfiguration } from '../services/authService';
import { useThemeLanguage } from '../context/ThemeLanguageContext';

interface TeacherGradesViewProps {
  currentUser?: UserProfile | null;
  onNavigate: (screen: ActiveScreen) => void;
  onLogout: () => void;
  onUpdateUser?: (updated: UserProfile) => void;
}

export const TeacherGradesView: React.FC<TeacherGradesViewProps> = ({
  currentUser,
  onNavigate,
  onLogout,
  onUpdateUser
}) => {
  const { theme, language } = useThemeLanguage();
  const isDark = theme === 'dark';
  const isEn = language === 'en';

  const isConfigured = Boolean(currentUser?.hasConfigured);
  const teacherName = currentUser?.fullName || (isEn ? 'Prof. Daniela Álvarez' : 'Prof. Daniela Álvarez');

  const [grades, setGrades] = useState<StudentGradeRecord[]>(() => {
    return isConfigured ? INITIAL_STUDENT_GRADES : [];
  });
  const [selectedGradeGroup, setSelectedGradeGroup] = useState('10°1');
  const [selectedSubject, setSelectedSubject] = useState('prog');
  const [selectedPeriod, setSelectedPeriod] = useState('p1');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'approved' | 'failed'>('all');
  const [unsavedChanges, setUnsavedChanges] = useState(0);
  const [lastSaved, setLastSaved] = useState(isEn ? 'Today, 10:42 AM' : 'Hoy, 10:42 AM');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isConfiguringDemo, setIsConfiguringDemo] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleLoadDemoPlanilla = async () => {
    setIsConfiguringDemo(true);
    setGrades(INITIAL_STUDENT_GRADES);
    if (currentUser) {
      try {
        const updated = await saveUserConfiguration(currentUser.id, {
          hasConfigured: true
        });
        if (onUpdateUser) onUpdateUser(updated);
        showToast(isEn ? 'Model gradebook loaded successfully.' : 'Planilla modelo cargada con éxito.');
      } catch (err) {
        console.warn('Error saving teacher config:', err);
      }
    }
    setIsConfiguringDemo(false);
  };

  // Compute student weighted grade
  const calculateFinal = (s: StudentGradeRecord): number => {
    const finalGrade = s.parcial1 * 0.3 + s.parcial2 * 0.3 + s.taller1 * 0.2 + s.serConv * 0.2;
    return Math.round(finalGrade * 10) / 10;
  };

  const handleGradeChange = (
    studentId: string,
    field: 'parcial1' | 'parcial2' | 'taller1' | 'serConv',
    value: string
  ) => {
    const num = Math.min(5.0, Math.max(1.0, parseFloat(value) || 1.0));
    setGrades((prev) =>
      prev.map((student) => {
        if (student.id === studentId) {
          return {
            ...student,
            [field]: num
          };
        }
        return student;
      })
    );
    setUnsavedChanges((prev) => prev + 1);
  };

  const handleSaveChanges = () => {
    setUnsavedChanges(0);
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setLastSaved(isEn ? `Today, ${now}` : `Hoy, ${now}`);
    showToast(isEn ? 'Changes saved to institutional cloud system!' : '¡Cambios guardados con éxito en el sistema institucional!');
  };

  // Filtered students
  const filteredStudents = useMemo(() => {
    return grades.filter((student) => {
      const matchesSearch =
        student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.matricula.toLowerCase().includes(searchTerm.toLowerCase());

      const finalGrade = calculateFinal(student);
      const isApproved = finalGrade >= 3.0;

      if (!matchesSearch) return false;
      if (statusFilter === 'approved') return isApproved;
      if (statusFilter === 'failed') return !isApproved;
      return true;
    });
  }, [grades, searchTerm, statusFilter]);

  const totalStudents = 35;
  const sampleApprovedCount = grades.filter((s) => calculateFinal(s) >= 3.0).length;
  const sampleFailedCount = grades.filter((s) => calculateFinal(s) < 3.0).length;

  const currentAverage = useMemo(() => {
    if (grades.length === 0) return '0.0';
    const sum = grades.reduce((acc, s) => acc + calculateFinal(s), 0);
    return (sum / grades.length).toFixed(2);
  }, [grades]);

  return (
    <div className={`min-h-screen flex transition-colors duration-200 ${
      isDark ? 'bg-slate-950 text-slate-100' : 'bg-[#f8f9ff] text-[#0b1c30]'
    }`}>
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-16 right-4 z-50 bg-slate-900 border border-emerald-500/40 text-emerald-300 px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 text-xs font-bold animate-in fade-in duration-200">
          <span className="material-symbols-outlined text-[18px]">check_circle</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* FIXED SIDEBAR (Portal Docente) */}
      <aside className={`hidden lg:flex fixed left-0 top-12 bottom-0 w-72 shadow-xs z-40 flex-col justify-between border-r transition-colors ${
        isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-[#e5eeff]'
      }`}>
        <div className="flex flex-col">
          <div className={`h-20 px-6 flex items-center gap-3 border-b ${
            isDark ? 'border-slate-800' : 'border-[#eff4ff]'
          }`}>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white ${
              isDark ? 'bg-cyan-600' : 'bg-[#00288e]'
            }`}>
              <span className="material-symbols-outlined text-2xl">school</span>
            </div>
            <div className="flex flex-col">
              <span className={`text-xl font-extrabold leading-tight tracking-tight ${
                isDark ? 'text-white' : 'text-[#00288e]'
              }`}>
                Edulink
              </span>
              <span className={`text-[11px] font-bold uppercase tracking-wider ${
                isDark ? 'text-slate-400' : 'text-[#444653]'
              }`}>
                {isEn ? 'Teacher Portal' : 'Portal Docente'}
              </span>
            </div>
          </div>

          <div className="px-4 py-2">
            <div className={`rounded-xl px-3 py-2 flex items-center gap-2 border ${
              isDark ? 'bg-slate-800 border-slate-700 text-cyan-300' : 'bg-[#eff4ff] border-[#dce9ff] text-[#00288e]'
            }`}>
              <span className="material-symbols-outlined text-lg">verified_user</span>
              <span className="text-xs font-extrabold">{isEn ? 'Connected Gradebook' : 'Docencia Conectada'}</span>
            </div>
          </div>

          <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
            <button
              onClick={() => onNavigate('teacher_grades')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors text-left cursor-pointer ${
                isDark ? 'text-slate-300 hover:bg-slate-800 hover:text-white' : 'text-[#444653] hover:bg-[#eff4ff] hover:text-[#0b1c30]'
              }`}
            >
              <span className="material-symbols-outlined text-xl">dashboard</span>
              <span className="text-xs font-bold">{isEn ? 'Home' : 'Inicio'}</span>
            </button>
            <button
              onClick={() => showToast(isEn ? 'Assigned Groups: 6°1, 6°2, 10°1, 10°2, 11°1, 11°2.' : 'Grupos asignados: 6°1, 6°2, 10°1, 10°2, 11°1, 11°2.')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors text-left cursor-pointer ${
                isDark ? 'text-slate-300 hover:bg-slate-800 hover:text-white' : 'text-[#444653] hover:bg-[#eff4ff] hover:text-[#0b1c30]'
              }`}
            >
              <span className="material-symbols-outlined text-xl">groups</span>
              <span className="text-xs font-bold">{isEn ? 'My Groups' : 'Mis Grupos'}</span>
            </button>
            <button
              onClick={() => onNavigate('teacher_grades')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-xs shadow-sm transition-colors text-left cursor-pointer ${
                isDark ? 'bg-cyan-600 text-white' : 'bg-[#1e40af] text-white'
              }`}
            >
              <span className="material-symbols-outlined text-xl">fact_check</span>
              <span>{isEn ? 'Gradebook' : 'Calificaciones'}</span>
            </button>
            <button
              onClick={() => showToast(isEn ? 'Daily institutional attendance tracking module.' : 'Módulo de control de asistencia diaria.')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors text-left cursor-pointer ${
                isDark ? 'text-slate-300 hover:bg-slate-800 hover:text-white' : 'text-[#444653] hover:bg-[#eff4ff] hover:text-[#0b1c30]'
              }`}
            >
              <span className="material-symbols-outlined text-xl">how_to_reg</span>
              <span className="text-xs font-bold">{isEn ? 'Attendance' : 'Asistencia'}</span>
            </button>
            <button
              onClick={() => onNavigate('student_assignment')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors text-left cursor-pointer ${
                isDark ? 'text-slate-300 hover:bg-slate-800 hover:text-white' : 'text-[#444653] hover:bg-[#eff4ff] hover:text-[#0b1c30]'
              }`}
            >
              <span className="material-symbols-outlined text-xl">assignment</span>
              <span className="text-xs font-bold">{isEn ? 'Tasks & Exams' : 'Tareas y Exámenes'}</span>
            </button>
            <button
              onClick={() => onNavigate('family_messaging')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors text-left cursor-pointer ${
                isDark ? 'text-slate-300 hover:bg-slate-800 hover:text-white' : 'text-[#444653] hover:bg-[#eff4ff] hover:text-[#0b1c30]'
              }`}
            >
              <span className="material-symbols-outlined text-xl">assessment</span>
              <span className="text-xs font-bold">{isEn ? 'Messaging' : 'Mensajes'}</span>
            </button>
          </nav>
        </div>

        <div className={`p-4 border-t ${isDark ? 'border-slate-800' : 'border-[#eff4ff]'}`}>
          <div className={`rounded-xl p-3 flex items-center gap-3 border ${
            isDark ? 'bg-slate-800 border-slate-700' : 'bg-[#eff4ff] border-[#dce9ff]'
          }`}>
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <div className="flex flex-col">
              <span className={`text-xs font-bold ${isDark ? 'text-white' : 'text-[#0b1c30]'}`}>
                {isEn ? 'Synchronized' : 'Sincronizado'}
              </span>
              <span className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-[#444653]'}`}>
                {isEn ? 'Central Cloud OK' : 'Servidor Central OK'}
              </span>
            </div>
          </div>
        </div>
      </aside>

      {/* MAIN CONTAINER */}
      <div className="flex-1 lg:pl-72 flex flex-col min-w-0">
        {/* HEADER BAR */}
        <header className={`sticky top-12 h-20 backdrop-blur-xl shadow-xs z-30 px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4 border-b transition-colors ${
          isDark ? 'bg-slate-900/95 border-slate-800' : 'bg-white/95 border-[#e5eeff]'
        }`}>
          <div className="flex items-center gap-4 flex-1 max-w-lg">
            <div className="relative w-full">
              <span className={`material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-lg ${
                isDark ? 'text-slate-500' : 'text-[#757684]'
              }`}>
                search
              </span>
              <input
                type="text"
                placeholder={isEn ? 'Search student, ID, or matricula...' : 'Buscar alumno, matrícula o código...'}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full h-11 pl-10 pr-4 rounded-xl text-xs focus:outline-none transition-all border ${
                  isDark
                    ? 'bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus:border-cyan-500'
                    : 'bg-[#eff4ff] border-transparent text-[#0b1c30] placeholder:text-[#757684] focus:border-[#0051d5]'
                }`}
              />
            </div>
            <div className={`hidden xl:flex items-center gap-1.5 px-3 py-2 rounded-xl whitespace-nowrap ${
              isDark ? 'bg-cyan-950 text-cyan-300' : 'bg-[#dce9ff] text-[#0b1c30]'
            }`}>
              <span className="material-symbols-outlined text-base">calendar_month</span>
              <span className="text-xs font-bold">{isEn ? 'Active Term - 2026' : 'Período Activo - 2026'}</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => onNavigate('family_messaging')}
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors cursor-pointer ${
                isDark ? 'text-slate-300 hover:bg-slate-800' : 'text-[#444653] hover:bg-[#eff4ff]'
              }`}
              title={isEn ? 'Messaging' : 'Mensajería'}
            >
              <span className="material-symbols-outlined text-xl">chat</span>
            </button>

            <div className={`h-8 w-px ${isDark ? 'bg-slate-800' : 'bg-[#dce9ff]'}`} />

            <div className="flex items-center gap-3 pl-1">
              <div className="text-right hidden sm:flex flex-col">
                <span className={`text-xs font-bold leading-tight ${isDark ? 'text-white' : 'text-[#0b1c30]'}`}>
                  {teacherName}
                </span>
                <span className={`text-[11px] leading-tight ${isDark ? 'text-slate-400' : 'text-[#444653]'}`}>
                  {currentUser?.subjectArea ? (isEn ? `Teacher of ${currentUser.subjectArea}` : `Docente de ${currentUser.subjectArea}`) : (isEn ? 'Tenured Teacher' : 'Docente Titular')} {currentUser?.assignedGrades ? `• ${currentUser.assignedGrades}` : '• Edulink School'}
                </span>
              </div>
              <img
                alt="Profile"
                className={`w-9 h-9 rounded-full object-cover ring-2 shadow-xs ${
                  isDark ? 'ring-cyan-500/40' : 'ring-[#1e40af]/20'
                }`}
                src={currentUser?.avatarUrl || ASSETS.teacherDaniela}
              />
            </div>
          </div>
        </header>

        {/* WORKSPACE CONTENT */}
        <main className="p-4 sm:p-6 lg:p-8 flex flex-col gap-6 max-w-[1500px] w-full mx-auto">
          {/* 1. Page Header & Live Status */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center justify-center w-8 h-8 rounded-lg ${
                  isDark ? 'bg-cyan-950 text-cyan-300' : 'bg-[#dce9ff] text-[#00288e]'
                }`}>
                  <span className="material-symbols-outlined text-lg">fact_check</span>
                </span>
                <span className={`text-xs uppercase tracking-wider font-extrabold ${
                  isDark ? 'text-cyan-400' : 'text-[#0051d5]'
                }`}>
                  {isEn ? 'Curricular Record • High School' : 'Registro Curricular • Bachillerato'}
                </span>
              </div>
              <h1 className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-[#0b1c30]'}`}>
                {isEn ? 'Academic Gradebook Spreadsheet' : 'Planilla de Calificaciones Académicas'}
              </h1>
              <p className={`text-xs sm:text-sm max-w-3xl ${isDark ? 'text-slate-400' : 'text-[#444653]'}`}>
                {isEn
                  ? 'Systematic recording, automatic weighting, and term closure by competencies.'
                  : 'Registro sistemático, ponderación automática y cierre evaluativo por competencias.'}
              </p>
            </div>

            {/* Sync status chip */}
            <div className={`flex items-center gap-3 px-4 py-2.5 rounded-2xl shadow-xs self-start lg:self-center border ${
              isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-[#e5eeff]'
            }`}>
              <div className="relative flex items-center justify-center">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-500 animate-ping absolute" />
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-500 relative" />
              </div>
              <div className="flex flex-col">
                <span className={`text-xs font-bold leading-tight ${isDark ? 'text-white' : 'text-[#0b1c30]'}`}>
                  {isEn ? `Last saved: ${lastSaved}` : `Último guardado: ${lastSaved}`}
                </span>
                <div className="flex items-center gap-1.5 text-[11px] mt-0.5">
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      unsavedChanges > 0 ? 'bg-rose-500' : 'bg-emerald-500'
                    }`}
                  />
                  <span className={unsavedChanges > 0 ? 'font-bold text-rose-400' : 'text-emerald-400'}>
                    {unsavedChanges > 0
                      ? (isEn ? `${unsavedChanges} unsaved changes` : `${unsavedChanges} cambios sin guardar`)
                      : (isEn ? 'All changes saved' : 'Todo al día')}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 2. Controls & Dropdown Filters Bar */}
          <div className={`rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-4 border ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-[#e5eeff]'
          }`}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 flex-1">
              {/* Grade selector */}
              <div className={`relative flex items-center rounded-xl px-3 py-2 border ${
                isDark ? 'bg-slate-800 border-slate-700' : 'bg-[#eff4ff] border-[#dce9ff]'
              }`}>
                <span className={`material-symbols-outlined mr-2 text-xl ${isDark ? 'text-cyan-400' : 'text-[#0051d5]'}`}>
                  groups
                </span>
                <div className="flex flex-col flex-1 min-w-0">
                  <span className={`text-[10px] font-bold leading-none uppercase ${isDark ? 'text-slate-400' : 'text-[#444653]'}`}>
                    {isEn ? 'Grade & Group' : 'Grado & Grupo'}
                  </span>
                  <select
                    value={selectedGradeGroup}
                    onChange={(e) => setSelectedGradeGroup(e.target.value)}
                    className={`bg-transparent text-xs focus:outline-none cursor-pointer pr-4 appearance-none font-bold ${
                      isDark ? 'text-white' : 'text-[#0b1c30]'
                    }`}
                  >
                    <option value="6°1">6°1 — {isEn ? 'Basic Secondary' : 'Básica Secundaria'}</option>
                    <option value="6°2">6°2 — {isEn ? 'Basic Secondary' : 'Básica Secundaria'}</option>
                    <option value="7°1">7°1 — {isEn ? 'Basic Secondary' : 'Básica Secundaria'}</option>
                    <option value="7°2">7°2 — {isEn ? 'Basic Secondary' : 'Básica Secundaria'}</option>
                    <option value="8°1">8°1 — {isEn ? 'Basic Secondary' : 'Básica Secundaria'}</option>
                    <option value="8°2">8°2 — {isEn ? 'Basic Secondary' : 'Básica Secundaria'}</option>
                    <option value="9°1">9°1 — {isEn ? 'Basic Secondary' : 'Básica Secundaria'}</option>
                    <option value="9°2">9°2 — {isEn ? 'Basic Secondary' : 'Básica Secundaria'}</option>
                    <option value="10°1">10°1 — {isEn ? 'Technical High' : 'Media Técnica'}</option>
                    <option value="10°2">10°2 — {isEn ? 'Technical High' : 'Media Técnica'}</option>
                    <option value="11°1">11°1 — {isEn ? 'Technical High' : 'Media Técnica'}</option>
                    <option value="11°2">11°2 — {isEn ? 'Technical High' : 'Media Técnica'}</option>
                  </select>
                </div>
                <span className={`material-symbols-outlined text-base pointer-events-none absolute right-3 ${isDark ? 'text-slate-500' : 'text-[#757684]'}`}>
                  expand_more
                </span>
              </div>

              {/* Subject selector */}
              <div className={`relative flex items-center rounded-xl px-3 py-2 border ${
                isDark ? 'bg-slate-800 border-slate-700' : 'bg-[#eff4ff] border-[#dce9ff]'
              }`}>
                <span className={`material-symbols-outlined mr-2 text-xl ${isDark ? 'text-cyan-400' : 'text-[#0051d5]'}`}>
                  code
                </span>
                <div className="flex flex-col flex-1 min-w-0">
                  <span className={`text-[10px] font-bold leading-none uppercase ${isDark ? 'text-slate-400' : 'text-[#444653]'}`}>
                    {isEn ? 'Subject' : 'Asignatura'}
                  </span>
                  <select
                    value={selectedSubject}
                    onChange={(e) => setSelectedSubject(e.target.value)}
                    className={`bg-transparent text-xs focus:outline-none cursor-pointer pr-4 appearance-none font-bold ${
                      isDark ? 'text-white' : 'text-[#0b1c30]'
                    }`}
                  >
                    <option value="prog">{isEn ? 'Software Programming' : 'Programación de Software'}</option>
                    <option value="bd">{isEn ? 'Relational Databases' : 'Bases de Datos Relacionales'}</option>
                    <option value="web">{isEn ? 'Frontend Web Development' : 'Desarrollo Web Frontend'}</option>
                  </select>
                </div>
                <span className={`material-symbols-outlined text-base pointer-events-none absolute right-3 ${isDark ? 'text-slate-500' : 'text-[#757684]'}`}>
                  expand_more
                </span>
              </div>

              {/* Period selector */}
              <div className={`relative flex items-center rounded-xl px-3 py-2 border ${
                isDark ? 'bg-slate-800 border-slate-700' : 'bg-[#eff4ff] border-[#dce9ff]'
              }`}>
                <span className={`material-symbols-outlined mr-2 text-xl ${isDark ? 'text-cyan-400' : 'text-[#0051d5]'}`}>
                  calendar_month
                </span>
                <div className="flex flex-col flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 leading-none">
                    <span className={`text-[10px] font-bold uppercase ${isDark ? 'text-slate-400' : 'text-[#444653]'}`}>
                      {isEn ? 'Term' : 'Periodo'}
                    </span>
                    <span className={`px-1.5 py-0.5 rounded-full font-extrabold text-[9px] tracking-wide uppercase ${
                      isDark ? 'bg-cyan-950 text-cyan-300' : 'bg-[#dce9ff] text-[#00288e]'
                    }`}>
                      {isEn ? 'Active' : 'Activo'}
                    </span>
                  </div>
                  <select
                    value={selectedPeriod}
                    onChange={(e) => setSelectedPeriod(e.target.value)}
                    className={`bg-transparent text-xs focus:outline-none cursor-pointer pr-4 appearance-none font-bold mt-0.5 ${
                      isDark ? 'text-white' : 'text-[#0b1c30]'
                    }`}
                  >
                    <option value="p1">{isEn ? '1st Term (2026)' : '1° Periodo (2026)'}</option>
                    <option value="p2">{isEn ? '2nd Term (2026)' : '2° Periodo (2026)'}</option>
                    <option value="p3">{isEn ? '3rd Term (2026)' : '3° Periodo (2026)'}</option>
                    <option value="p4">{isEn ? '4th Term (2026)' : '4° Periodo (2026)'}</option>
                  </select>
                </div>
                <span className={`material-symbols-outlined text-base pointer-events-none absolute right-3 ${isDark ? 'text-slate-500' : 'text-[#757684]'}`}>
                  expand_more
                </span>
              </div>
            </div>

            {/* Right action button group */}
            <div className="flex items-center gap-2 flex-wrap justify-end">
              <button
                onClick={() => showToast(isEn ? 'Exporting PDF & Excel report for Academic Records.' : 'Generando reporte en PDF y planilla Excel para Secretaría Académica.')}
                className={`h-11 px-4 rounded-xl transition-all flex items-center gap-1.5 text-xs font-bold border cursor-pointer ${
                  isDark
                    ? 'bg-slate-800 border-slate-700 text-white hover:bg-slate-700'
                    : 'bg-[#eff4ff] border-[#dce9ff] text-[#0b1c30] hover:bg-[#dce9ff]'
                }`}
                type="button"
              >
                <span className={`material-symbols-outlined text-lg ${isDark ? 'text-cyan-400' : 'text-[#0051d5]'}`}>
                  download
                </span>
                <span>{isEn ? 'Export' : 'Exportar'}</span>
              </button>

              <button
                onClick={handleSaveChanges}
                className="h-11 px-5 rounded-xl bg-emerald-600 text-white hover:bg-emerald-500 shadow-xs hover:shadow-md transition-all flex items-center gap-2 text-xs font-extrabold cursor-pointer"
                type="button"
              >
                <span className="material-symbols-outlined text-lg">save</span>
                <span>{isEn ? 'Save Changes' : 'Guardar Cambios'}</span>
              </button>

              <button
                onClick={() => showToast(isEn ? 'New evaluation criterion modal opened.' : 'Nueva evaluación añadida a la planilla.')}
                className={`h-11 px-4 rounded-xl text-white shadow-xs hover:shadow-md transition-all flex items-center gap-1.5 text-xs font-bold cursor-pointer ${
                  isDark ? 'bg-cyan-600 hover:bg-cyan-500' : 'bg-[#1e40af] hover:bg-[#00288e]'
                }`}
                type="button"
              >
                <span className="material-symbols-outlined text-lg">add_circle</span>
                <span>{isEn ? '+ New Evaluation' : '+ Nueva Evaluación'}</span>
              </button>
            </div>
          </div>

          {/* 3. Metrics Banner / Roster Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className={`rounded-2xl p-5 shadow-xs flex flex-col justify-between border ${
              isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-[#e5eeff]'
            }`}>
              <div className="flex items-center justify-between">
                <span className={`text-xs uppercase tracking-wider font-bold ${isDark ? 'text-slate-400' : 'text-[#444653]'}`}>
                  {isEn ? 'Total Students' : 'Total Alumnos'}
                </span>
                <span className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                  isDark ? 'bg-cyan-950 text-cyan-300' : 'bg-[#dce9ff] text-[#00288e]'
                }`}>
                  <span className="material-symbols-outlined text-xl">group</span>
                </span>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className={`text-3xl font-extrabold ${isDark ? 'text-white' : 'text-[#0b1c30]'}`}>
                  {totalStudents}
                </span>
                <span className={`text-xs font-bold ${isDark ? 'text-cyan-400' : 'text-[#0051d5]'}`}>
                  {isEn ? 'Enrolled' : 'Matriculados'}
                </span>
              </div>
              <div className={`mt-2 text-xs flex items-center gap-1 ${isDark ? 'text-slate-400' : 'text-[#444653]'}`}>
                <span className="material-symbols-outlined text-sm text-emerald-500">check_circle</span>
                {isEn ? '100% verified census records' : '100% de fichas verificadas'}
              </div>
            </div>

            <div className={`rounded-2xl p-5 shadow-xs flex flex-col justify-between border ${
              isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-[#e5eeff]'
            }`}>
              <div className="flex items-center justify-between">
                <span className={`text-xs uppercase tracking-wider font-bold ${isDark ? 'text-slate-400' : 'text-[#444653]'}`}>
                  {isEn ? 'Group Average' : 'Promedio Grupal'}
                </span>
                <span className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                  isDark ? 'bg-cyan-950 text-cyan-300' : 'bg-[#dbe1ff] text-[#0051d5]'
                }`}>
                  <span className="material-symbols-outlined text-xl">trending_up</span>
                </span>
              </div>
              <div className="mt-3 flex items-baseline gap-1.5">
                <span className={`text-3xl font-extrabold ${isDark ? 'text-cyan-300' : 'text-[#00288e]'}`}>
                  {currentAverage}
                </span>
                <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-[#444653]'}`}>/ 5.0</span>
              </div>
              <div className={`mt-2 w-full rounded-full h-1.5 overflow-hidden ${isDark ? 'bg-slate-800' : 'bg-[#eff4ff]'}`}>
                <div
                  className="bg-cyan-500 h-full rounded-full transition-all duration-300"
                  style={{ width: `${(parseFloat(currentAverage) / 5.0) * 100}%` }}
                />
              </div>
            </div>

            <div className={`rounded-2xl p-5 shadow-xs flex flex-col justify-between border ${
              isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-[#e5eeff]'
            }`}>
              <div className="flex items-center justify-between">
                <span className={`text-xs uppercase tracking-wider font-bold ${isDark ? 'text-slate-400' : 'text-[#444653]'}`}>
                  {isEn ? 'Passing Students' : 'Estudiantes Aprobados'}
                </span>
                <span className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <span className="material-symbols-outlined text-xl">verified</span>
                </span>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-emerald-500">
                  {grades.length > 0 ? Math.round((sampleApprovedCount / grades.length) * totalStudents) : 0}
                </span>
                <span className="text-xs font-bold bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full">
                  {grades.length > 0 ? Math.round((sampleApprovedCount / grades.length) * 100) : 0}%
                </span>
              </div>
              <div className={`mt-2 text-xs ${isDark ? 'text-slate-400' : 'text-[#444653]'}`}>
                {isEn ? 'Passing score (≥ 3.0)' : 'Rendimiento óptimo (≥ 3.0)'}
              </div>
            </div>

            <div className={`rounded-2xl p-5 shadow-xs flex flex-col justify-between border ${
              isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-[#e5eeff]'
            }`}>
              <div className="flex items-center justify-between">
                <span className={`text-xs uppercase tracking-wider font-bold ${isDark ? 'text-slate-400' : 'text-[#444653]'}`}>
                  {isEn ? 'Failing / At Risk' : 'En Riesgo / Reprobando'}
                </span>
                <span className="w-9 h-9 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center">
                  <span className="material-symbols-outlined text-xl">warning</span>
                </span>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-rose-500">
                  {grades.length > 0 ? Math.round((sampleFailedCount / grades.length) * totalStudents) : 0}
                </span>
                <span className="text-xs font-bold bg-rose-500/20 text-rose-400 px-2 py-0.5 rounded-full">
                  {grades.length > 0 ? Math.round((sampleFailedCount / grades.length) * 100) : 0}%
                </span>
              </div>
              <div className="mt-2 text-rose-400 text-xs flex items-center gap-1 font-semibold">
                <span className="material-symbols-outlined text-sm">assignment_late</span>
                {isEn ? 'Support plan required' : 'Requieren plan de refuerzo'}
              </div>
            </div>
          </div>

          {/* 4. Main Grade Table Container */}
          <div className={`rounded-2xl shadow-xs overflow-hidden flex flex-col border ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-[#e5eeff]'
          }`}>
            {/* Table Toolbar */}
            <div className={`p-4 flex flex-col md:flex-row items-center justify-between gap-4 border-b ${
              isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-[#eff4ff]'
            }`}>
              <div className="flex items-center gap-2 w-full md:w-auto flex-1 max-w-md">
                <div className="relative w-full">
                  <span className={`material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-base ${isDark ? 'text-slate-500' : 'text-[#757684]'}`}>
                    search
                  </span>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder={isEn ? 'Filter by student or ID...' : 'Filtrar por estudiante, cédula o código...'}
                    className={`w-full h-10 pl-9 pr-3 rounded-xl text-xs focus:outline-none transition-all border ${
                      isDark
                        ? 'bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus:border-cyan-500'
                        : 'bg-[#eff4ff] border-transparent text-[#0b1c30] placeholder:text-[#757684] focus:border-[#0051d5]'
                    }`}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap w-full md:w-auto justify-end">
                {/* Filter Tabs */}
                <div className={`flex items-center p-1 rounded-xl text-xs font-bold border ${
                  isDark ? 'bg-slate-800 border-slate-700' : 'bg-[#eff4ff] border-[#dce9ff]'
                }`}>
                  <button
                    onClick={() => setStatusFilter('all')}
                    className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                      statusFilter === 'all'
                        ? isDark ? 'bg-slate-700 text-white shadow-xs' : 'bg-white text-[#00288e] shadow-xs'
                        : isDark ? 'text-slate-400 hover:text-white' : 'text-[#444653] hover:text-[#0b1c30]'
                    }`}
                  >
                    {isEn ? `All (${totalStudents})` : `Todos (${totalStudents})`}
                  </button>
                  <button
                    onClick={() => setStatusFilter('approved')}
                    className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                      statusFilter === 'approved'
                        ? isDark ? 'bg-slate-700 text-white shadow-xs' : 'bg-white text-[#00288e] shadow-xs'
                        : isDark ? 'text-slate-400 hover:text-white' : 'text-[#444653] hover:text-[#0b1c30]'
                    }`}
                  >
                    {isEn ? 'Passing' : 'Aprobados'}
                  </button>
                  <button
                    onClick={() => setStatusFilter('failed')}
                    className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                      statusFilter === 'failed'
                        ? isDark ? 'bg-slate-700 text-rose-400 shadow-xs' : 'bg-white text-[#ba1a1a] shadow-xs'
                        : isDark ? 'text-slate-400 hover:text-rose-400' : 'text-[#444653] hover:text-[#ba1a1a]'
                    }`}
                  >
                    {isEn ? 'Failing' : 'Reprobados'}
                  </button>
                </div>

                <button
                  onClick={() => showToast(isEn ? 'Weights recalculated in real-time according to school criteria.' : 'Ponderaciones recalculadas en tiempo real según sistema de evaluación institucional.')}
                  className={`h-10 px-3 rounded-xl transition-colors flex items-center gap-1.5 text-xs font-bold cursor-pointer ${
                    isDark ? 'bg-cyan-950 text-cyan-300 hover:bg-cyan-900' : 'bg-[#dce9ff] text-[#00288e] hover:bg-[#c4e7ff]'
                  }`}
                  type="button"
                >
                  <span className="material-symbols-outlined text-base">calculate</span>
                  <span>{isEn ? 'Recalculate' : 'Calcular Ponderaciones'}</span>
                </button>
              </div>
            </div>

            {/* Data Table or Empty State */}
            {grades.length === 0 ? (
              <div className={`p-10 text-center flex flex-col items-center justify-center border-t ${
                isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-[#e5eeff]'
              }`}>
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-3 ${
                  isDark ? 'bg-slate-800 text-cyan-400' : 'bg-[#eff4ff] text-[#00288e]'
                }`}>
                  <span className="material-symbols-outlined text-[32px]">fact_check</span>
                </div>
                <h3 className={`text-lg font-bold mb-1 ${isDark ? 'text-white' : 'text-[#0b1c30]'}`}>
                  {isEn ? 'No gradebook data registered for this group' : 'No hay planillas ni estudiantes registrados en este grupo'}
                </h3>
                <p className={`text-xs max-w-md mb-5 leading-relaxed ${isDark ? 'text-slate-400' : 'text-[#444653]'}`}>
                  {isEn
                    ? 'As a teacher registered in the institutional database, your gradebook is ready. You can load the sample 10th grade roster to explore.'
                    : 'Como docente registrado en la base de datos, tu planilla está lista para ser configurada. Puedes cargar la planilla modelo del grado 10°A.'}
                </p>
                <button
                  type="button"
                  onClick={handleLoadDemoPlanilla}
                  disabled={isConfiguringDemo}
                  className={`px-4 py-2.5 rounded-xl text-white text-xs font-bold shadow-sm transition-all flex items-center gap-2 cursor-pointer ${
                    isDark ? 'bg-cyan-600 hover:bg-cyan-500' : 'bg-[#00288e] hover:bg-[#1e40af]'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">group_add</span>
                  <span>{isConfiguringDemo ? (isEn ? 'Configuring...' : 'Configurando...') : (isEn ? 'Load Model Gradebook 10°1' : 'Cargar Planilla Modelo 10°1')}</span>
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className={`w-full text-left border-collapse ${isDark ? 'text-slate-100' : 'text-[#0b1c30]'}`}>
                  <thead>
                    <tr className={`text-[11px] uppercase tracking-wider font-extrabold border-b ${
                      isDark ? 'bg-slate-800/90 text-slate-300 border-slate-700' : 'bg-[#eff4ff]/80 text-[#444653] border-[#e5eeff]'
                    }`}>
                      <th className="py-4 px-6 min-w-[240px]">{isEn ? 'Student' : 'Estudiante'}</th>
                      <th className="py-4 px-3 text-center min-w-[110px]">
                        <div className="flex flex-col items-center">
                          <span className={isDark ? 'text-white' : 'text-[#0b1c30]'}>{isEn ? 'Exam 1' : 'Parcial 1'}</span>
                          <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full mt-0.5 border ${
                            isDark ? 'bg-slate-900 text-cyan-300 border-slate-700' : 'bg-white text-[#0051d5] border-[#dce9ff]'
                          }`}>
                            30% • 14 Mar
                          </span>
                        </div>
                      </th>
                      <th className="py-4 px-3 text-center min-w-[110px]">
                        <div className="flex flex-col items-center">
                          <span className={isDark ? 'text-white' : 'text-[#0b1c30]'}>{isEn ? 'Exam 2' : 'Parcial 2'}</span>
                          <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full mt-0.5 border ${
                            isDark ? 'bg-slate-900 text-cyan-300 border-slate-700' : 'bg-white text-[#0051d5] border-[#dce9ff]'
                          }`}>
                            30% • 04 Apr
                          </span>
                        </div>
                      </th>
                      <th className="py-4 px-3 text-center min-w-[110px]">
                        <div className="flex flex-col items-center">
                          <span className={isDark ? 'text-white' : 'text-[#0b1c30]'}>{isEn ? 'Task 1' : 'Taller 1'}</span>
                          <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full mt-0.5 border ${
                            isDark ? 'bg-slate-900 text-cyan-300 border-slate-700' : 'bg-white text-[#0051d5] border-[#dce9ff]'
                          }`}>
                            20% • 22 Apr
                          </span>
                        </div>
                      </th>
                      <th className="py-4 px-3 text-center min-w-[110px]">
                        <div className="flex flex-col items-center">
                          <span className={isDark ? 'text-white' : 'text-[#0b1c30]'}>{isEn ? 'Attitude' : 'Ser / Conv.'}</span>
                          <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full mt-0.5 border ${
                            isDark ? 'bg-slate-900 text-cyan-300 border-slate-700' : 'bg-white text-[#0051d5] border-[#dce9ff]'
                          }`}>
                            20% • Term
                          </span>
                        </div>
                      </th>
                      <th className={`py-4 px-4 text-center min-w-[120px] ${
                        isDark ? 'bg-slate-800' : 'bg-[#e5eeff]/70'
                      }`}>
                        <div className="flex flex-col items-center">
                          <span className={`font-extrabold ${isDark ? 'text-cyan-300' : 'text-[#00288e]'}`}>
                            {isEn ? 'Final Grade' : 'Definitiva'}
                          </span>
                          <span className={`text-[10px] font-bold ${isDark ? 'text-slate-400' : 'text-[#00288e]'}`}>
                            100%
                          </span>
                        </div>
                      </th>
                      <th className="py-4 px-4 text-center min-w-[130px] font-bold">{isEn ? 'Status' : 'Estado'}</th>
                      <th className="py-4 px-4 text-center w-24 font-bold">{isEn ? 'Actions' : 'Acciones'}</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y text-xs ${isDark ? 'divide-slate-800' : 'divide-[#eff4ff]'}`}>
                    {filteredStudents.map((student) => {
                      const finalGrade = calculateFinal(student);
                      const isPassed = finalGrade >= 3.0;

                      return (
                        <tr
                          key={student.id}
                          className={`transition-colors group ${
                            isPassed
                              ? isDark ? 'hover:bg-slate-800/50' : 'hover:bg-[#eff4ff]/50'
                              : isDark ? 'bg-rose-950/20 hover:bg-rose-950/40' : 'bg-[#fff1f2]/40 hover:bg-[#fff1f2]'
                          }`}
                        >
                          <td className="py-3.5 px-6">
                            <div className="flex items-center gap-3">
                              {student.avatar ? (
                                <img
                                  alt={student.name}
                                  className="w-10 h-10 rounded-full object-cover shadow-xs ring-2 ring-white/20"
                                  src={student.avatar}
                                />
                              ) : (
                                <div
                                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs shadow-xs ${
                                    student.avatarBg || 'bg-[#dde1ff] text-[#001453]'
                                  }`}
                                >
                                  {student.initials}
                                </div>
                              )}
                              <div className="flex flex-col min-w-0">
                                <span className={`font-bold truncate ${isDark ? 'text-white' : 'text-[#0b1c30]'}`}>
                                  {student.name}
                                </span>
                                <span className={`text-[11px] font-mono ${isDark ? 'text-slate-400' : 'text-[#444653]'}`}>
                                  ID: {student.matricula}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Editable inputs */}
                          <td className="py-3 px-2 text-center">
                            <input
                              type="number"
                              step="0.1"
                              min="1.0"
                              max="5.0"
                              value={student.parcial1}
                              onChange={(e) =>
                                handleGradeChange(student.id, 'parcial1', e.target.value)
                              }
                              className={`w-16 h-10 text-center font-bold rounded-xl text-xs outline-none transition-all border ${
                                student.parcial1 < 3.0
                                  ? isDark ? 'bg-rose-950 border-rose-800 text-rose-300' : 'bg-[#ffdad6]/60 text-[#ba1a1a] border-[#ffdad6]'
                                  : isDark ? 'bg-slate-800 border-slate-700 text-white focus:border-cyan-400' : 'bg-[#eff4ff] text-[#0b1c30] border-[#dce9ff] focus:bg-white focus:border-[#0051d5]'
                              }`}
                            />
                          </td>

                          <td className="py-3 px-2 text-center">
                            <input
                              type="number"
                              step="0.1"
                              min="1.0"
                              max="5.0"
                              value={student.parcial2}
                              onChange={(e) =>
                                handleGradeChange(student.id, 'parcial2', e.target.value)
                              }
                              className={`w-16 h-10 text-center font-bold rounded-xl text-xs outline-none transition-all border ${
                                student.parcial2 < 3.0
                                  ? isDark ? 'bg-rose-950 border-rose-800 text-rose-300' : 'bg-[#ffdad6]/60 text-[#ba1a1a] border-[#ffdad6]'
                                  : isDark ? 'bg-slate-800 border-slate-700 text-white focus:border-cyan-400' : 'bg-[#eff4ff] text-[#0b1c30] border-[#dce9ff] focus:bg-white focus:border-[#0051d5]'
                              }`}
                            />
                          </td>

                          <td className="py-3 px-2 text-center">
                            <input
                              type="number"
                              step="0.1"
                              min="1.0"
                              max="5.0"
                              value={student.taller1}
                              onChange={(e) =>
                                handleGradeChange(student.id, 'taller1', e.target.value)
                              }
                              className={`w-16 h-10 text-center font-bold rounded-xl text-xs outline-none transition-all border ${
                                student.taller1 < 3.0
                                  ? isDark ? 'bg-rose-950 border-rose-800 text-rose-300' : 'bg-[#ffdad6]/60 text-[#ba1a1a] border-[#ffdad6]'
                                  : isDark ? 'bg-slate-800 border-slate-700 text-white focus:border-cyan-400' : 'bg-[#eff4ff] text-[#0b1c30] border-[#dce9ff] focus:bg-white focus:border-[#0051d5]'
                              }`}
                            />
                          </td>

                          <td className="py-3 px-2 text-center">
                            <input
                              type="number"
                              step="0.1"
                              min="1.0"
                              max="5.0"
                              value={student.serConv}
                              onChange={(e) =>
                                handleGradeChange(student.id, 'serConv', e.target.value)
                              }
                              className={`w-16 h-10 text-center font-bold rounded-xl text-xs outline-none transition-all border ${
                                student.serConv < 3.0
                                  ? isDark ? 'bg-rose-950 border-rose-800 text-rose-300' : 'bg-[#ffdad6]/60 text-[#ba1a1a] border-[#ffdad6]'
                                  : isDark ? 'bg-slate-800 border-slate-700 text-white focus:border-cyan-400' : 'bg-[#eff4ff] text-[#0b1c30] border-[#dce9ff] focus:bg-white focus:border-[#0051d5]'
                              }`}
                            />
                          </td>

                          {/* Final grade */}
                          <td className={`py-3 px-4 text-center ${isDark ? 'bg-slate-800/40' : 'bg-[#eff4ff]/40'}`}>
                            <span
                              className={`inline-flex items-center justify-center px-3 py-1 rounded-xl font-extrabold text-sm tracking-tight ${
                                isPassed
                                  ? isDark ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-[#d1fae5] text-[#059669]'
                                  : isDark ? 'bg-rose-950 text-rose-300 border border-rose-800' : 'bg-[#fee2e2] text-[#dc2626]'
                              }`}
                            >
                              {finalGrade.toFixed(1)}
                            </span>
                          </td>

                          {/* Status */}
                          <td className="py-3 px-4 text-center">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                                isPassed
                                  ? isDark ? 'bg-emerald-950/80 text-emerald-300' : 'bg-[#d1fae5] text-[#059669]'
                                  : isDark ? 'bg-rose-950/80 text-rose-300' : 'bg-[#fee2e2] text-[#dc2626]'
                              }`}
                            >
                              <span className="material-symbols-outlined text-sm">
                                {isPassed ? 'check_circle' : 'error'}
                              </span>
                              {isPassed ? (isEn ? 'Passed' : 'Aprobado') : (isEn ? 'Failed' : 'Reprobado')}
                            </span>
                          </td>

                          {/* Actions */}
                          <td className="py-3 px-4 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => showToast(isEn ? `Note saved for ${student.name}.` : `Observación guardada para ${student.name}.`)}
                                className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
                                  isDark ? 'text-slate-400 hover:bg-slate-800 hover:text-white' : 'text-[#444653] hover:bg-[#dce9ff] hover:text-[#00288e]'
                                }`}
                                title={isEn ? 'Student note' : 'Observaciones del estudiante'}
                                type="button"
                              >
                                <span className="material-symbols-outlined text-lg">
                                  chat_bubble_outline
                                </span>
                              </button>
                              <button
                                onClick={() => onNavigate('family_messaging')}
                                className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
                                  isDark ? 'text-slate-400 hover:bg-slate-800 hover:text-white' : 'text-[#444653] hover:bg-[#dce9ff] hover:text-[#0b1c30]'
                                }`}
                                title={isEn ? 'Send message to guardian' : 'Enviar mensaje al acudiente'}
                                type="button"
                              >
                                <span className="material-symbols-outlined text-lg">mail</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination & Footer Summary */}
            <div className={`p-4 flex flex-col md:flex-row items-center justify-between gap-4 border-t ${
              isDark ? 'bg-slate-900 border-slate-800' : 'bg-[#eff4ff]/50 border-[#e5eeff]'
            }`}>
              <div className="flex items-center gap-4">
                <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-[#444653]'}`}>
                  {isEn ? 'Showing ' : 'Mostrando '}
                  <strong className={isDark ? 'text-white' : 'text-[#0b1c30]'}>1 - {filteredStudents.length}</strong>{' '}
                  {isEn ? 'of ' : 'de '}
                  <strong className={isDark ? 'text-white' : 'text-[#0b1c30]'}>{totalStudents}</strong>{' '}
                  {isEn ? 'students' : 'estudiantes'}
                </span>
              </div>

              <div className="flex items-center gap-1">
                <button
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold bg-cyan-600 text-white shadow-sm"
                  type="button"
                >
                  1
                </button>
                <button
                  onClick={() => showToast(isEn ? 'Page 2 of students' : 'Página 2 de estudiantes')}
                  className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-semibold transition-colors border cursor-pointer ${
                    isDark ? 'border-slate-700 text-slate-300 hover:bg-slate-800' : 'border-[#e2e8f0] text-[#444653] hover:bg-white'
                  }`}
                  type="button"
                >
                  2
                </button>
              </div>
            </div>

            {/* Formula Footnote */}
            <div className={`px-4 py-3 text-xs flex flex-col md:flex-row md:items-center justify-between gap-2 border-t ${
              isDark ? 'bg-slate-950 border-slate-800 text-slate-400' : 'bg-[#dce9ff]/40 border-[#dce9ff] text-[#444653]'
            }`}>
              <div className="flex items-center gap-2">
                <span className={`material-symbols-outlined text-base ${isDark ? 'text-cyan-400' : 'text-[#00288e]'}`}>
                  functions
                </span>
                <span className="font-mono text-[11px] font-semibold">
                  {isEn
                    ? 'Formula: (Exam1 × 0.30) + (Exam2 × 0.30) + (Task1 × 0.20) + (Attitude × 0.20)'
                    : 'Fórmula: (P1 × 0.30) + (P2 × 0.30) + (T1 × 0.20) + (Ser × 0.20)'}
                </span>
              </div>
              <div className="flex items-center gap-3 text-[11px]">
                <span className="flex items-center gap-1 font-bold text-emerald-500">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" /> {isEn ? 'Passing ≥ 3.0' : 'Aprobatoria ≥ 3.0'}
                </span>
                <span className="flex items-center gap-1 font-bold text-rose-500">
                  <span className="w-2 h-2 rounded-full bg-rose-500" /> {isEn ? 'Failing < 3.0' : 'Reprobatoria < 3.0'}
                </span>
                <span className="font-medium">• {isEn ? 'Scale: 1.0 to 5.0' : 'Escala: 1.0 a 5.0'}</span>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};
