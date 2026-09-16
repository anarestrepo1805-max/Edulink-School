import React, { useState, useMemo } from 'react';
import { ActiveScreen, StudentGradeRecord, UserProfile } from '../types';
import { ASSETS, INITIAL_STUDENT_GRADES } from '../data/mockData';
import { saveUserConfiguration } from '../services/authService';

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
  const isConfigured = Boolean(currentUser?.hasConfigured);
  const teacherName = currentUser?.fullName || 'Prof. Daniela Álvarez';

  const [grades, setGrades] = useState<StudentGradeRecord[]>(() => {
    return isConfigured ? INITIAL_STUDENT_GRADES : [];
  });
  const [selectedGradeGroup, setSelectedGradeGroup] = useState('10A');
  const [selectedSubject, setSelectedSubject] = useState('prog');
  const [selectedPeriod, setSelectedPeriod] = useState('p3');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'approved' | 'failed'>('all');
  const [unsavedChanges, setUnsavedChanges] = useState(0);
  const [lastSaved, setLastSaved] = useState('Hoy, 10:42 AM');
  const [showSaveToast, setShowSaveToast] = useState(false);
  const [isConfiguringDemo, setIsConfiguringDemo] = useState(false);

  const handleLoadDemoPlanilla = async () => {
    setIsConfiguringDemo(true);
    setGrades(INITIAL_STUDENT_GRADES);
    if (currentUser) {
      try {
        const updated = await saveUserConfiguration(currentUser.id, {
          hasConfigured: true
        });
        if (onUpdateUser) onUpdateUser(updated);
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
    setLastSaved(`Hoy, ${now}`);
    setShowSaveToast(true);
    setTimeout(() => setShowSaveToast(false), 3000);
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

  // Dynamic metrics calculation
  const totalStudents = 35; // base roster
  const sampleApprovedCount = grades.filter((s) => calculateFinal(s) >= 3.0).length;
  const sampleFailedCount = grades.filter((s) => calculateFinal(s) < 3.0).length;

  const currentAverage = useMemo(() => {
    const sum = grades.reduce((acc, s) => acc + calculateFinal(s), 0);
    return (sum / grades.length).toFixed(2);
  }, [grades]);

  return (
    <div className="min-h-screen bg-[#f8f9ff] flex text-[#0b1c30]">
      {/* FIXED SIDEBAR (Portal Docente) */}
      <aside className="hidden lg:flex fixed left-0 top-12 bottom-0 w-72 bg-white shadow-[0_1px_8px_rgba(0,0,0,0.04)] z-40 flex-col justify-between border-r border-[#e5eeff]">
        <div className="flex flex-col">
          <div className="h-20 px-6 flex items-center gap-3 border-b border-[#eff4ff]">
            <div className="w-10 h-10 rounded-xl bg-[#dde1ff] flex items-center justify-center text-[#00288e]">
              <span className="material-symbols-outlined text-2xl">school</span>
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-extrabold text-[#00288e] leading-tight tracking-tight">
                Edulink
              </span>
              <span className="text-[11px] font-bold text-[#444653] uppercase tracking-wider">
                Portal Docente
              </span>
            </div>
          </div>

          <div className="px-4 py-2">
            <div className="bg-[#eff4ff] rounded-xl px-3 py-2 flex items-center gap-2 border border-[#dce9ff]">
              <span className="material-symbols-outlined text-[#00288e] text-lg">verified_user</span>
              <span className="text-xs text-[#00288e] font-extrabold">Docencia Conectada</span>
            </div>
          </div>

          <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
            <button
              onClick={() => onNavigate('teacher_grades')}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[#444653] hover:bg-[#eff4ff] hover:text-[#0b1c30] transition-colors text-left"
            >
              <span className="material-symbols-outlined text-xl">dashboard</span>
              <span className="text-xs font-bold">Inicio</span>
            </button>
            <button
              onClick={() => alert('Grupos asignados: 10°A, 10°B, 11°A, 11°B.')}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[#444653] hover:bg-[#eff4ff] hover:text-[#0b1c30] transition-colors text-left"
            >
              <span className="material-symbols-outlined text-xl">groups</span>
              <span className="text-xs font-bold">Mis Grupos</span>
            </button>
            <button
              onClick={() => onNavigate('teacher_grades')}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-[#1e40af] text-white font-bold text-xs shadow-sm transition-colors text-left"
            >
              <span className="material-symbols-outlined text-xl">fact_check</span>
              <span>Calificaciones</span>
            </button>
            <button
              onClick={() => alert('Módulo de control de asistencia diaria.')}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[#444653] hover:bg-[#eff4ff] hover:text-[#0b1c30] transition-colors text-left"
            >
              <span className="material-symbols-outlined text-xl">how_to_reg</span>
              <span className="text-xs font-bold">Asistencia</span>
            </button>
            <button
              onClick={() => onNavigate('student_assignment')}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[#444653] hover:bg-[#eff4ff] hover:text-[#0b1c30] transition-colors text-left"
            >
              <span className="material-symbols-outlined text-xl">assignment</span>
              <span className="text-xs font-bold">Tareas y Exámenes</span>
            </button>
            <button
              onClick={() => alert('Publicación de anuncios para estudiantes y acudientes.')}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[#444653] hover:bg-[#eff4ff] hover:text-[#0b1c30] transition-colors text-left"
            >
              <span className="material-symbols-outlined text-xl">visibility</span>
              <span className="text-xs font-bold">Anuncios</span>
            </button>
            <button
              onClick={() => onNavigate('family_messaging')}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[#444653] hover:bg-[#eff4ff] hover:text-[#0b1c30] transition-colors text-left"
            >
              <span className="material-symbols-outlined text-xl">assessment</span>
              <span className="text-xs font-bold">Mensajes</span>
            </button>
            <div className="pt-2">
              <button
                onClick={() => alert('Configuración de escala valorativa institucional.')}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[#444653] hover:bg-[#eff4ff] hover:text-[#0b1c30] transition-colors text-left"
              >
                <span className="material-symbols-outlined text-xl">settings</span>
                <span className="text-xs font-bold">Configuración</span>
              </button>
            </div>
          </nav>
        </div>

        <div className="p-4 bg-white border-t border-[#eff4ff]">
          <div className="bg-[#eff4ff] rounded-xl p-3 flex items-center gap-3 border border-[#dce9ff]">
            <div className="w-2.5 h-2.5 rounded-full bg-[#0051d5] animate-pulse" />
            <div className="flex flex-col">
              <span className="text-xs text-[#0b1c30] font-bold">Sincronizado</span>
              <span className="text-[11px] text-[#444653]">Servidor Central OK</span>
            </div>
          </div>
        </div>
      </aside>

      {/* MAIN CONTAINER */}
      <div className="flex-1 lg:pl-72 flex flex-col min-w-0">
        {/* HEADER BAR */}
        <header className="sticky top-12 h-20 bg-white/95 backdrop-blur-xl shadow-xs z-30 px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4 border-b border-[#e5eeff]">
          <div className="flex items-center gap-4 flex-1 max-w-lg">
            <div className="relative w-full">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#757684] text-lg">
                search
              </span>
              <input
                type="text"
                placeholder="Buscar alumno, matrícula o código de clase..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-11 pl-10 pr-4 rounded-xl bg-[#eff4ff] text-[#0b1c30] placeholder:text-[#757684] text-xs focus:outline-none focus:ring-2 focus:ring-[#0051d5]/30 transition-all border border-transparent focus:border-[#0051d5]"
              />
            </div>
            <div className="hidden xl:flex items-center gap-1.5 bg-[#dce9ff] px-3 py-2 rounded-xl text-[#0b1c30] whitespace-nowrap">
              <span className="material-symbols-outlined text-[#00288e] text-base">calendar_month</span>
              <span className="text-xs font-bold text-[#00288e]">Período Activo - 2026</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <button className="w-10 h-10 rounded-xl flex items-center justify-center text-[#444653] hover:bg-[#eff4ff] transition-colors relative">
                <span className="material-symbols-outlined text-xl">notifications</span>
                <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-[#ba1a1a]" />
              </button>
              <button
                onClick={() => onNavigate('family_messaging')}
                className="w-10 h-10 rounded-xl flex items-center justify-center text-[#444653] hover:bg-[#eff4ff] transition-colors"
                title="Mensajería"
              >
                <span className="material-symbols-outlined text-xl">chat</span>
              </button>
            </div>

            <div className="h-8 w-px bg-[#dce9ff]" />

            <div className="flex items-center gap-3 pl-1">
              <div className="text-right hidden sm:flex flex-col">
                <span className="text-xs text-[#0b1c30] font-bold leading-tight">
                  {teacherName}
                </span>
                <span className="text-[11px] text-[#444653] leading-tight">
                  {currentUser?.subjectArea ? `Docente de ${currentUser.subjectArea}` : 'Docente Titular'} {currentUser?.assignedGrades ? `• ${currentUser.assignedGrades}` : '• Edulink School'}
                </span>
              </div>
              <img
                alt="Profile"
                className="w-9 h-9 rounded-full object-cover ring-2 ring-[#1e40af]/20 shadow-xs"
                src={currentUser?.avatarUrl || ASSETS.teacherDaniela}
              />
            </div>
          </div>
        </header>

        {/* WORKSPACE CONTENT */}
        <main className="p-4 sm:p-6 lg:p-8 flex flex-col gap-6 max-w-[1500px] w-full mx-auto">
          {/* Toast feedback */}
          {showSaveToast && (
            <div className="fixed top-20 right-8 z-50 bg-[#059669] text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 text-xs font-bold animate-bounce">
              <span className="material-symbols-outlined text-[20px]">check_circle</span>
              <span>¡Cambios guardados con éxito en la base de datos institucional!</span>
            </div>
          )}

          {/* 1. Page Header & Live Status (Image 7) */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-[#dce9ff] text-[#00288e]">
                  <span className="material-symbols-outlined text-lg">fact_check</span>
                </span>
                <span className="text-xs uppercase tracking-wider text-[#0051d5] font-extrabold">
                  Registro Curricular • Bachillerato
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0b1c30] tracking-tight">
                Planilla de Calificaciones Académicas
              </h1>
              <p className="text-xs sm:text-sm text-[#444653] max-w-3xl">
                Registro sistemático, ponderación automática y cierre evaluativo por competencias.
              </p>
            </div>

            {/* Sync status chip */}
            <div className="flex items-center gap-3 bg-white px-4 py-2.5 rounded-2xl shadow-xs self-start lg:self-center border border-[#e5eeff]">
              <div className="relative flex items-center justify-center">
                <span className="w-2.5 h-2.5 rounded-full bg-[#0051d5] animate-ping absolute" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#0051d5] relative" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-[#0b1c30] font-bold leading-tight">
                  Último guardado: {lastSaved}
                </span>
                <div className="flex items-center gap-1.5 text-[11px] text-[#444653] mt-0.5">
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      unsavedChanges > 0 ? 'bg-[#ba1a1a]' : 'bg-emerald-500'
                    }`}
                  />
                  <span className={unsavedChanges > 0 ? 'font-bold text-[#ba1a1a]' : 'text-emerald-700'}>
                    {unsavedChanges > 0 ? `${unsavedChanges} cambios sin guardar` : 'Todo al día'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 2. Controls & Dropdown Filters Bar */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-4 border border-[#e5eeff]">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 flex-1">
              {/* Grade selector */}
              <div className="relative flex items-center bg-[#eff4ff] rounded-xl px-3 py-2 border border-[#dce9ff]">
                <span className="material-symbols-outlined text-[#0051d5] mr-2 text-xl">groups</span>
                <div className="flex flex-col flex-1 min-w-0">
                  <span className="text-[10px] text-[#444653] font-bold leading-none uppercase">
                    Grado & Grupo
                  </span>
                  <select
                    value={selectedGradeGroup}
                    onChange={(e) => setSelectedGradeGroup(e.target.value)}
                    className="bg-transparent text-xs text-[#0b1c30] focus:outline-none cursor-pointer pr-4 appearance-none font-bold"
                  >
                    <option value="10A">10° A — Bachillerato Técnico</option>
                    <option value="10B">10° B — Bachillerato Académico</option>
                    <option value="11A">11° A — Énfasis Digital</option>
                  </select>
                </div>
                <span className="material-symbols-outlined text-[#757684] text-base pointer-events-none absolute right-3">
                  expand_more
                </span>
              </div>

              {/* Subject selector */}
              <div className="relative flex items-center bg-[#eff4ff] rounded-xl px-3 py-2 border border-[#dce9ff]">
                <span className="material-symbols-outlined text-[#0051d5] mr-2 text-xl">code</span>
                <div className="flex flex-col flex-1 min-w-0">
                  <span className="text-[10px] text-[#444653] font-bold leading-none uppercase">
                    Asignatura
                  </span>
                  <select
                    value={selectedSubject}
                    onChange={(e) => setSelectedSubject(e.target.value)}
                    className="bg-transparent text-xs text-[#0b1c30] focus:outline-none cursor-pointer pr-4 appearance-none font-bold"
                  >
                    <option value="prog">Programación de Software</option>
                    <option value="bd">Bases de Datos Relacionales</option>
                    <option value="web">Desarrollo Web Frontend</option>
                  </select>
                </div>
                <span className="material-symbols-outlined text-[#757684] text-base pointer-events-none absolute right-3">
                  expand_more
                </span>
              </div>

              {/* Period selector */}
              <div className="relative flex items-center bg-[#eff4ff] rounded-xl px-3 py-2 border border-[#dce9ff]">
                <span className="material-symbols-outlined text-[#0051d5] mr-2 text-xl">calendar_month</span>
                <div className="flex flex-col flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 leading-none">
                    <span className="text-[10px] text-[#444653] font-bold uppercase">Periodo</span>
                    <span className="px-1.5 py-0.5 rounded-full bg-[#dce9ff] text-[#00288e] font-extrabold text-[9px] tracking-wide uppercase">
                      Activo
                    </span>
                  </div>
                  <select
                    value={selectedPeriod}
                    onChange={(e) => setSelectedPeriod(e.target.value)}
                    className="bg-transparent text-xs text-[#0b1c30] focus:outline-none cursor-pointer pr-4 appearance-none font-bold mt-0.5"
                  >
                    <option value="p3">3° Periodo (2026)</option>
                    <option value="p2">2° Periodo (2026)</option>
                    <option value="p1">1° Periodo (2026)</option>
                  </select>
                </div>
                <span className="material-symbols-outlined text-[#757684] text-base pointer-events-none absolute right-3">
                  expand_more
                </span>
              </div>
            </div>

            {/* Right action button group */}
            <div className="flex items-center gap-2 flex-wrap justify-end">
              <button
                onClick={() => alert('Generando reporte en PDF y planilla Excel para Secretaría Académica.')}
                className="h-11 px-4 rounded-xl bg-[#eff4ff] text-[#0b1c30] hover:bg-[#dce9ff] transition-all flex items-center gap-1.5 text-xs font-bold border border-[#dce9ff] cursor-pointer"
                type="button"
              >
                <span className="material-symbols-outlined text-lg text-[#0051d5]">download</span>
                <span>Exportar</span>
                <span className="material-symbols-outlined text-base">arrow_drop_down</span>
              </button>

              <button
                onClick={handleSaveChanges}
                className="h-11 px-5 rounded-xl bg-[#059669] text-white hover:bg-[#047857] shadow-xs hover:shadow-md transition-all flex items-center gap-2 text-xs font-extrabold cursor-pointer"
                type="button"
              >
                <span className="material-symbols-outlined text-lg">save</span>
                <span>Guardar Cambios</span>
              </button>

              <button
                onClick={() => {
                  const name = prompt('Nombre del nuevo criterio evaluativo:', 'Exposición Proyecto');
                  if (name) alert(`Evaluación "${name}" añadida con éxito.`);
                }}
                className="h-11 px-4 rounded-xl bg-[#1e40af] text-white hover:bg-[#00288e] shadow-xs hover:shadow-md transition-all flex items-center gap-1.5 text-xs font-bold cursor-pointer"
                type="button"
              >
                <span className="material-symbols-outlined text-lg">add_circle</span>
                <span>+ Nueva Evaluación</span>
              </button>
            </div>
          </div>

          {/* 3. Metrics Banner / Roster Summary Cards (4 Cards) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Students */}
            <div className="bg-white rounded-2xl p-5 shadow-xs flex flex-col justify-between border border-[#e5eeff]">
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#444653] uppercase tracking-wider font-bold">
                  Total Alumnos
                </span>
                <span className="w-9 h-9 rounded-xl bg-[#dce9ff] text-[#00288e] flex items-center justify-center">
                  <span className="material-symbols-outlined text-xl">group</span>
                </span>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-[#0b1c30]">{totalStudents}</span>
                <span className="text-xs text-[#0051d5] font-bold">Matriculados</span>
              </div>
              <div className="mt-2 text-[#444653] text-xs flex items-center gap-1">
                <span className="material-symbols-outlined text-sm text-[#059669]">check_circle</span>
                100% de fichas verificadas
              </div>
            </div>

            {/* Class Average */}
            <div className="bg-white rounded-2xl p-5 shadow-xs flex flex-col justify-between border border-[#e5eeff]">
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#444653] uppercase tracking-wider font-bold">
                  Promedio Grupal
                </span>
                <span className="w-9 h-9 rounded-xl bg-[#dbe1ff] text-[#0051d5] flex items-center justify-center">
                  <span className="material-symbols-outlined text-xl">trending_up</span>
                </span>
              </div>
              <div className="mt-3 flex items-baseline gap-1.5">
                <span className="text-3xl font-extrabold text-[#00288e]">{currentAverage}</span>
                <span className="text-xs text-[#444653]">/ 5.0</span>
              </div>
              <div className="mt-2 w-full bg-[#eff4ff] rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-[#0051d5] h-full rounded-full transition-all duration-300"
                  style={{ width: `${(parseFloat(currentAverage) / 5.0) * 100}%` }}
                />
              </div>
            </div>

            {/* Passing Students */}
            <div className="bg-white rounded-2xl p-5 shadow-xs flex flex-col justify-between border border-[#e5eeff]">
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#444653] uppercase tracking-wider font-bold">
                  Estudiantes Aprobados
                </span>
                <span className="w-9 h-9 rounded-xl bg-[#d1fae5] text-[#047857] flex items-center justify-center">
                  <span className="material-symbols-outlined text-xl">verified</span>
                </span>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-[#059669]">
                  {Math.round((sampleApprovedCount / grades.length) * totalStudents)}
                </span>
                <span className="text-xs text-[#047857] font-bold bg-[#d1fae5] px-2 py-0.5 rounded-full">
                  {Math.round((sampleApprovedCount / grades.length) * 100)}%
                </span>
              </div>
              <div className="mt-2 text-[#444653] text-xs">
                Rendimiento óptimo (≥ 3.0)
              </div>
            </div>

            {/* At Risk / Failing */}
            <div className="bg-white rounded-2xl p-5 shadow-xs flex flex-col justify-between border border-[#e5eeff]">
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#444653] uppercase tracking-wider font-bold">
                  En Riesgo / Reprobando
                </span>
                <span className="w-9 h-9 rounded-xl bg-[#ffdad6] text-[#ba1a1a] flex items-center justify-center">
                  <span className="material-symbols-outlined text-xl">warning</span>
                </span>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-[#ba1a1a]">
                  {Math.round((sampleFailedCount / grades.length) * totalStudents)}
                </span>
                <span className="text-xs text-[#ba1a1a] font-bold bg-[#ffdad6] px-2 py-0.5 rounded-full">
                  {Math.round((sampleFailedCount / grades.length) * 100)}%
                </span>
              </div>
              <div className="mt-2 text-[#ba1a1a] text-xs flex items-center gap-1 font-semibold">
                <span className="material-symbols-outlined text-sm">assignment_late</span>
                Requieren plan de refuerzo
              </div>
            </div>
          </div>

          {/* 4. Main Grade Table Container */}
          <div className="bg-white rounded-2xl shadow-xs overflow-hidden flex flex-col border border-[#e5eeff]">
            {/* Table Toolbar */}
            <div className="p-4 flex flex-col md:flex-row items-center justify-between gap-4 bg-white border-b border-[#eff4ff]">
              <div className="flex items-center gap-2 w-full md:w-auto flex-1 max-w-md">
                <div className="relative w-full">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#757684] text-base">
                    search
                  </span>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Filtrar por estudiante, cédula o código..."
                    className="w-full h-10 pl-9 pr-3 rounded-xl bg-[#eff4ff] text-[#0b1c30] placeholder:text-[#757684] text-xs focus:outline-none focus:ring-2 focus:ring-[#0051d5]/30 transition-all border border-transparent focus:border-[#0051d5]"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap w-full md:w-auto justify-end">
                {/* Filter Tabs */}
                <div className="flex items-center bg-[#eff4ff] p-1 rounded-xl text-xs font-bold border border-[#dce9ff]">
                  <button
                    onClick={() => setStatusFilter('all')}
                    className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                      statusFilter === 'all'
                        ? 'bg-white text-[#00288e] shadow-xs'
                        : 'text-[#444653] hover:text-[#0b1c30]'
                    }`}
                  >
                    Todos ({totalStudents})
                  </button>
                  <button
                    onClick={() => setStatusFilter('approved')}
                    className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                      statusFilter === 'approved'
                        ? 'bg-white text-[#00288e] shadow-xs'
                        : 'text-[#444653] hover:text-[#0b1c30]'
                    }`}
                  >
                    Aprobados (29)
                  </button>
                  <button
                    onClick={() => setStatusFilter('failed')}
                    className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                      statusFilter === 'failed'
                        ? 'bg-white text-[#ba1a1a] shadow-xs'
                        : 'text-[#444653] hover:text-[#ba1a1a]'
                    }`}
                  >
                    Reprobados (6)
                  </button>
                </div>

                <button
                  onClick={() => alert('Ponderaciones recalculadas en tiempo real según sistema de evaluación institucional.')}
                  className="h-10 px-3 rounded-xl bg-[#dce9ff] text-[#00288e] hover:bg-[#c4e7ff] transition-colors flex items-center gap-1.5 text-xs font-bold cursor-pointer"
                  type="button"
                >
                  <span className="material-symbols-outlined text-base">calculate</span>
                  <span>Calcular Ponderaciones</span>
                </button>
              </div>
            </div>

            {/* Data Table or Empty State */}
            {grades.length === 0 ? (
              <div className="p-10 text-center flex flex-col items-center justify-center bg-white border-t border-[#e5eeff]">
                <div className="w-16 h-16 rounded-2xl bg-[#eff4ff] text-[#00288e] flex items-center justify-center mb-3">
                  <span className="material-symbols-outlined text-[32px]">fact_check</span>
                </div>
                <h3 className="text-lg font-bold text-[#0b1c30] mb-1">
                  No hay planillas ni estudiantes registrados en este grupo
                </h3>
                <p className="text-xs text-[#444653] max-w-md mb-5 leading-relaxed">
                  Como docente recién registrado en la base de datos, tu planilla está lista para ser configurada. Puedes cargar la planilla modelo del grado 10°A para explorar el módulo evaluativo.
                </p>
                <button
                  type="button"
                  onClick={handleLoadDemoPlanilla}
                  disabled={isConfiguringDemo}
                  className="px-4 py-2.5 rounded-xl bg-[#00288e] hover:bg-[#1e40af] text-white text-xs font-bold shadow-sm transition-all flex items-center gap-2 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">group_add</span>
                  <span>{isConfiguringDemo ? 'Configurando...' : 'Cargar Planilla Modelo 10°A'}</span>
                </button>
              </div>
            ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[#0b1c30] border-collapse">
                <thead>
                  <tr className="bg-[#eff4ff]/80 text-[#444653] text-[11px] uppercase tracking-wider font-extrabold border-b border-[#e5eeff]">
                    <th className="py-4 px-6 min-w-[240px]">Estudiante</th>
                    <th className="py-4 px-3 text-center min-w-[110px]">
                      <div className="flex flex-col items-center">
                        <span className="text-[#0b1c30] font-bold">Parcial 1</span>
                        <span className="text-[10px] text-[#0051d5] font-extrabold bg-white px-2 py-0.5 rounded-full mt-0.5 border border-[#dce9ff]">
                          30% • 14 Mar
                        </span>
                      </div>
                    </th>
                    <th className="py-4 px-3 text-center min-w-[110px]">
                      <div className="flex flex-col items-center">
                        <span className="text-[#0b1c30] font-bold">Parcial 2</span>
                        <span className="text-[10px] text-[#0051d5] font-extrabold bg-white px-2 py-0.5 rounded-full mt-0.5 border border-[#dce9ff]">
                          30% • 04 Abr
                        </span>
                      </div>
                    </th>
                    <th className="py-4 px-3 text-center min-w-[110px]">
                      <div className="flex flex-col items-center">
                        <span className="text-[#0b1c30] font-bold">Taller 1</span>
                        <span className="text-[10px] text-[#0051d5] font-extrabold bg-white px-2 py-0.5 rounded-full mt-0.5 border border-[#dce9ff]">
                          20% • 22 Abr
                        </span>
                      </div>
                    </th>
                    <th className="py-4 px-3 text-center min-w-[110px]">
                      <div className="flex flex-col items-center">
                        <span className="text-[#0b1c30] font-bold">Ser / Conv.</span>
                        <span className="text-[10px] text-[#0051d5] font-extrabold bg-white px-2 py-0.5 rounded-full mt-0.5 border border-[#dce9ff]">
                          20% • Período
                        </span>
                      </div>
                    </th>
                    <th className="py-4 px-4 text-center bg-[#e5eeff]/70 min-w-[120px]">
                      <div className="flex flex-col items-center">
                        <span className="text-[#00288e] font-extrabold">Definitiva</span>
                        <span className="text-[10px] text-[#00288e] font-bold">Ponderado 100%</span>
                      </div>
                    </th>
                    <th className="py-4 px-4 text-center min-w-[130px] font-bold">Estado</th>
                    <th className="py-4 px-4 text-center w-24 font-bold">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#eff4ff] text-xs">
                  {filteredStudents.map((student) => {
                    const finalGrade = calculateFinal(student);
                    const isPassed = finalGrade >= 3.0;

                    return (
                      <tr
                        key={student.id}
                        className={`transition-colors group ${
                          isPassed
                            ? 'hover:bg-[#eff4ff]/50'
                            : 'bg-[#fff1f2]/40 hover:bg-[#fff1f2]'
                        }`}
                      >
                        <td className="py-3.5 px-6">
                          <div className="flex items-center gap-3">
                            {student.avatar ? (
                              <img
                                alt={student.name}
                                className="w-10 h-10 rounded-full object-cover shadow-xs ring-2 ring-[#00288e]/10"
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
                              <span className="font-bold text-[#0b1c30] truncate">{student.name}</span>
                              <span className="text-[11px] text-[#444653] font-mono">
                                Matrícula: {student.matricula}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Editable grade inputs */}
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
                            className={`w-16 h-10 text-center font-bold rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-[#0051d5] focus:outline-none transition-all border ${
                              student.parcial1 < 3.0
                                ? 'bg-[#ffdad6]/60 text-[#ba1a1a] border-[#ffdad6]'
                                : 'bg-[#eff4ff] text-[#0b1c30] border-[#dce9ff]'
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
                            className={`w-16 h-10 text-center font-bold rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-[#0051d5] focus:outline-none transition-all border ${
                              student.parcial2 < 3.0
                                ? 'bg-[#ffdad6]/60 text-[#ba1a1a] border-[#ffdad6]'
                                : 'bg-[#eff4ff] text-[#0b1c30] border-[#dce9ff]'
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
                            className={`w-16 h-10 text-center font-bold rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-[#0051d5] focus:outline-none transition-all border ${
                              student.taller1 < 3.0
                                ? 'bg-[#ffdad6]/60 text-[#ba1a1a] border-[#ffdad6]'
                                : 'bg-[#eff4ff] text-[#0b1c30] border-[#dce9ff]'
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
                            className={`w-16 h-10 text-center font-bold rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-[#0051d5] focus:outline-none transition-all border ${
                              student.serConv < 3.0
                                ? 'bg-[#ffdad6]/60 text-[#ba1a1a] border-[#ffdad6]'
                                : 'bg-[#eff4ff] text-[#0b1c30] border-[#dce9ff]'
                            }`}
                          />
                        </td>

                        {/* Computed final grade */}
                        <td className="py-3 px-4 text-center bg-[#eff4ff]/40">
                          <span
                            className={`inline-flex items-center justify-center px-3 py-1 rounded-xl font-extrabold text-sm tracking-tight ${
                              isPassed
                                ? 'bg-[#d1fae5] text-[#059669]'
                                : 'bg-[#fee2e2] text-[#dc2626]'
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
                                ? 'bg-[#d1fae5] text-[#059669]'
                                : 'bg-[#fee2e2] text-[#dc2626]'
                            }`}
                          >
                            <span className="material-symbols-outlined text-sm">
                              {isPassed ? 'check_circle' : 'error'}
                            </span>
                            {isPassed ? 'Aprobado' : 'Reprobado'}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => {
                                const obs = prompt(
                                  `Observación pedagógica para ${student.name}:`,
                                  'Excelente desempeño en algoritmos y estructuras condicionales.'
                                );
                                if (obs) alert(`Observación guardada para ${student.name}.`);
                              }}
                              className="w-8 h-8 rounded-lg flex items-center justify-center text-[#444653] hover:bg-[#dce9ff] hover:text-[#00288e] transition-colors cursor-pointer"
                              title="Observaciones del estudiante"
                              type="button"
                            >
                              <span className="material-symbols-outlined text-lg">
                                chat_bubble_outline
                              </span>
                            </button>
                            <button
                              onClick={() => onNavigate('family_messaging')}
                              className="w-8 h-8 rounded-lg flex items-center justify-center text-[#444653] hover:bg-[#dce9ff] hover:text-[#0b1c30] transition-colors cursor-pointer"
                              title="Enviar mensaje al acudiente"
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

            {/* 5. Pagination and Footer Summary Info */}
            <div className="p-4 bg-[#eff4ff]/50 flex flex-col md:flex-row items-center justify-between gap-4 border-t border-[#e5eeff]">
              <div className="flex items-center gap-4">
                <span className="text-xs text-[#444653]">
                  Mostrando <strong className="text-[#0b1c30]">1 - {filteredStudents.length}</strong> de{' '}
                  <strong className="text-[#0b1c30]">{totalStudents}</strong> estudiantes
                </span>
                <div className="flex items-center gap-1.5 text-xs text-[#444653]">
                  <span>Ver:</span>
                  <select className="bg-white rounded-lg px-2 py-1 text-[#0b1c30] focus:outline-none cursor-pointer font-bold shadow-xs border border-[#dce9ff]">
                    <option>15 por página</option>
                    <option>25 por página</option>
                    <option>50 por página</option>
                  </select>
                </div>
              </div>

              {/* Pagination buttons */}
              <div className="flex items-center gap-1">
                <button
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-[#757684] cursor-not-allowed bg-white shadow-xs opacity-50 border border-[#e2e8f0]"
                  disabled
                  type="button"
                >
                  <span className="material-symbols-outlined text-lg">chevron_left</span>
                </button>
                <button
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold bg-[#1e40af] text-white shadow-sm"
                  type="button"
                >
                  1
                </button>
                <button
                  onClick={() => alert('Página 2 de estudiantes.')}
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-semibold text-[#444653] hover:bg-white transition-colors border border-[#e2e8f0]"
                  type="button"
                >
                  2
                </button>
                <button
                  onClick={() => alert('Página 3 de estudiantes.')}
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-semibold text-[#444653] hover:bg-white transition-colors border border-[#e2e8f0]"
                  type="button"
                >
                  3
                </button>
                <button
                  onClick={() => alert('Siguiente página de alumnos.')}
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-[#0b1c30] hover:bg-white shadow-xs transition-colors border border-[#e2e8f0]"
                  type="button"
                >
                  <span className="material-symbols-outlined text-lg">chevron_right</span>
                </button>
              </div>
            </div>

            {/* Formula Footnote */}
            <div className="px-4 py-3 bg-[#dce9ff]/40 text-[#444653] text-xs flex flex-col md:flex-row md:items-center justify-between gap-2 border-t border-[#dce9ff]">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#00288e] text-base">functions</span>
                <span className="font-mono text-[11px] font-semibold">
                  Fórmula: (P1 × 0.30) + (P2 × 0.30) + (T1 × 0.20) + (Ser × 0.20)
                </span>
              </div>
              <div className="flex items-center gap-3 text-[11px]">
                <span className="flex items-center gap-1 font-bold text-[#059669]">
                  <span className="w-2 h-2 rounded-full bg-[#059669]" /> Aprobatoria ≥ 3.0
                </span>
                <span className="flex items-center gap-1 font-bold text-[#dc2626]">
                  <span className="w-2 h-2 rounded-full bg-[#dc2626]" /> Reprobatoria &lt; 3.0
                </span>
                <span className="font-medium">• Escala: 1.0 a 5.0</span>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};
