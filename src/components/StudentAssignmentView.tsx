import React, { useState } from 'react';
import { ActiveScreen } from '../types';
import { ASSETS } from '../data/mockData';
import { useThemeLanguage } from '../context/ThemeLanguageContext';

interface StudentAssignmentViewProps {
  onBack: () => void;
  onNavigate: (screen: ActiveScreen) => void;
}

interface UploadedFile {
  name: string;
  size: string;
}

export const StudentAssignmentView: React.FC<StudentAssignmentViewProps> = ({
  onBack,
  onNavigate
}) => {
  const { theme, language } = useThemeLanguage();
  const isDark = theme === 'dark';
  const isEn = language === 'en';

  const [studentNotes, setStudentNotes] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submissionTime, setSubmissionTime] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newFiles: UploadedFile[] = Array.from(files).map((f: File) => ({
      name: f.name,
      size: `${(f.size / (1024 * 1024)).toFixed(2)} MB`
    }));

    setUploadedFiles((prev) => [...prev, ...newFiles].slice(0, 3));
    showToast(isEn ? 'Files attached successfully.' : 'Archivos adjuntados con éxito.');
  };

  const removeFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSimulateDefaultFiles = () => {
    setUploadedFiles([
      { name: 'Taller1_Algoritmos_Jimenez_Miguel.psc', size: '0.45 MB' },
      { name: 'DiagramaFlujo_PruebasEscritorio.pdf', size: '1.80 MB' }
    ]);
    showToast(isEn ? 'Sample assignment solution files loaded.' : 'Archivos de ejemplo cargados.');
  };

  const handleSubmitAssignment = () => {
    if (uploadedFiles.length === 0) {
      showToast(isEn ? 'Please attach at least one solution file before submitting.' : 'Por favor carga al menos un archivo antes de enviar.');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
      setSubmissionTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      showToast(isEn ? 'Assignment submitted successfully!' : '¡Tarea enviada con éxito!');
    }, 1000);
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

      {/* FIXED SIDEBAR */}
      <aside className={`hidden lg:flex fixed left-0 top-12 bottom-0 w-72 shadow-xs z-40 flex-col justify-between border-r transition-colors ${
        isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-[#e5eeff]'
      }`}>
        <div className="flex flex-col">
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
                {isEn ? 'Student Portal' : 'Portal Escolar'}
              </span>
            </div>
          </div>

          <nav className="px-3 py-4 flex flex-col gap-1">
            <button
              onClick={() => onNavigate('student_dashboard')}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all text-left cursor-pointer ${
                isDark ? 'text-slate-300 hover:bg-slate-800 hover:text-white' : 'text-[#444653] hover:bg-[#eff4ff] hover:text-[#0b1c30]'
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">dashboard</span>
              <span>{isEn ? 'Dashboard' : 'Inicio'}</span>
            </button>
            <button
              onClick={() => onNavigate('student_dashboard')}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all text-left cursor-pointer ${
                isDark ? 'text-slate-300 hover:bg-slate-800 hover:text-white' : 'text-[#444653] hover:bg-[#eff4ff] hover:text-[#0b1c30]'
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">menu_book</span>
              <span>{isEn ? 'My Subjects' : 'Mis Asignaturas'}</span>
            </button>
            <button
              onClick={() => onNavigate('student_dashboard')}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all text-left cursor-pointer ${
                isDark ? 'text-slate-300 hover:bg-slate-800 hover:text-white' : 'text-[#444653] hover:bg-[#eff4ff] hover:text-[#0b1c30]'
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">assignment_turned_in</span>
              <span>{isEn ? 'Grades' : 'Calificaciones'}</span>
            </button>
            <button
              onClick={() => onNavigate('student_dashboard')}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all text-left cursor-pointer ${
                isDark ? 'text-slate-300 hover:bg-slate-800 hover:text-white' : 'text-[#444653] hover:bg-[#eff4ff] hover:text-[#0b1c30]'
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">calendar_today</span>
              <span>{isEn ? 'Schedule' : 'Horario'}</span>
            </button>
            <button
              onClick={() => onNavigate('student_assignment')}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl font-bold text-sm shadow-sm transition-all text-left cursor-pointer ${
                isDark ? 'bg-cyan-600 text-white' : 'bg-[#1e40af] text-white'
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">assignment</span>
              <span>{isEn ? 'Tasks & Workshops' : 'Tareas y Entregas'}</span>
            </button>
            <button
              onClick={() => onNavigate('family_messaging')}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all text-left cursor-pointer ${
                isDark ? 'text-slate-300 hover:bg-slate-800 hover:text-white' : 'text-[#444653] hover:bg-[#eff4ff] hover:text-[#0b1c30]'
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">chat_bubble</span>
              <span>{isEn ? 'Forums & Messages' : 'Foros y mensajería'}</span>
            </button>
          </nav>
        </div>

        <div className={`p-4 border-t ${isDark ? 'border-slate-800' : 'border-[#eff4ff]'}`}>
          <div className={`rounded-xl p-3 flex items-center justify-between ${
            isDark ? 'bg-slate-800' : 'bg-[#eff4ff]'
          }`}>
            <div className="flex items-center gap-2">
              <span className={`material-symbols-outlined text-[20px] ${isDark ? 'text-cyan-400' : 'text-[#0051d5]'}`}>
                verified
              </span>
              <span className={`text-xs font-bold ${isDark ? 'text-white' : 'text-[#0b1c30]'}`}>
                {isEn ? 'Year 2026' : 'Año 2026'}
              </span>
            </div>
            <span className={`text-xs font-medium ${isDark ? 'text-slate-400' : 'text-[#444653]'}`}>v2.4</span>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 lg:pl-72 flex flex-col min-w-0">
        {/* HEADER BAR */}
        <header className={`sticky top-12 h-16 backdrop-blur-xl shadow-xs z-30 px-4 sm:px-6 lg:px-8 flex items-center justify-between border-b transition-colors ${
          isDark ? 'bg-slate-900/95 border-slate-800' : 'bg-white/95 border-[#e5eeff]'
        }`}>
          <div className="flex items-center gap-4 flex-1 max-w-lg">
            <div className="relative w-full flex items-center">
              <span className={`material-symbols-outlined absolute left-3 text-[20px] ${
                isDark ? 'text-slate-500' : 'text-[#757684]'
              }`}>
                search
              </span>
              <input
                type="text"
                placeholder={isEn ? 'Search courses, tasks, teachers...' : 'Buscar cursos, tareas, profesores...'}
                className={`w-full h-11 pl-10 pr-4 rounded-xl text-xs focus:outline-none transition-all border ${
                  isDark
                    ? 'bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus:border-cyan-500'
                    : 'bg-[#eff4ff] border-transparent text-[#0b1c30] placeholder:text-[#757684] focus:border-[#0051d5]'
                }`}
              />
            </div>
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold shrink-0 ${
              isDark ? 'bg-cyan-950 text-cyan-300' : 'bg-[#dbe1ff] text-[#00174b]'
            }`}>
              {isEn ? 'Term 1 - 2026' : 'Período 1 - 2026'}
            </span>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => showToast(isEn ? 'All homework notifications up to date.' : 'Todas las notificaciones de tareas al día.')}
              className={`relative p-2 rounded-xl transition-colors flex items-center justify-center cursor-pointer ${
                isDark ? 'text-slate-300 hover:bg-slate-800' : 'text-[#444653] hover:bg-[#eff4ff]'
              }`}
            >
              <span className="material-symbols-outlined text-[22px]">notifications</span>
              <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-rose-500 rounded-full ring-2 ring-white" />
            </button>

            <div className={`h-8 w-px ${isDark ? 'bg-slate-800' : 'bg-[#dce9ff]'}`} />

            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:flex flex-col">
                <span className={`text-xs font-bold leading-tight ${isDark ? 'text-white' : 'text-[#0b1c30]'}`}>
                  Miguel Ángel Jiménez
                </span>
                <span className={`text-[11px] leading-tight mt-0.5 ${isDark ? 'text-slate-400' : 'text-[#444653]'}`}>
                  {isEn ? 'Student - Grade 11°B' : 'Estudiante - Grado 11°B'}
                </span>
              </div>
              <img
                alt="Profile"
                className={`w-9 h-9 rounded-full object-cover ring-2 shadow-xs ${
                  isDark ? 'ring-cyan-500/40' : 'ring-[#1e40af]/20'
                }`}
                src={ASSETS.studentAvatar}
              />
            </div>
          </div>
        </header>

        {/* WORKSPACE CONTENT */}
        <main className="p-4 sm:p-6 lg:p-8 flex flex-col gap-6 max-w-[1400px] w-full mx-auto">
          {/* Breadcrumbs */}
          <div className={`flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl shadow-xs border ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-[#e5eeff]'
          }`}>
            <div className="flex items-center gap-2 flex-wrap text-xs">
              <button
                onClick={onBack}
                className={`flex items-center gap-1 font-semibold cursor-pointer ${
                  isDark ? 'text-slate-300 hover:text-cyan-300' : 'text-[#444653] hover:text-[#00288e]'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">menu_book</span>
                <span>{isEn ? 'My Subjects' : 'Mis Asignaturas'}</span>
              </button>
              <span className={`material-symbols-outlined text-[16px] ${isDark ? 'text-slate-600' : 'text-[#c4c5d5]'}`}>
                chevron_right
              </span>
              <span className={isDark ? 'text-slate-400' : 'text-[#444653]'}>
                {isEn ? 'Software Programming' : 'Programación de Software'}
              </span>
              <span className={`material-symbols-outlined text-[16px] ${isDark ? 'text-slate-600' : 'text-[#c4c5d5]'}`}>
                chevron_right
              </span>
              <span className={isDark ? 'text-slate-400' : 'text-[#444653]'}>
                {isEn ? 'Workshops & Tasks' : 'Tareas y Entregas'}
              </span>
              <span className={`material-symbols-outlined text-[16px] ${isDark ? 'text-slate-600' : 'text-[#c4c5d5]'}`}>
                chevron_right
              </span>
              <span className={`font-bold ${isDark ? 'text-cyan-300' : 'text-[#00288e]'}`}>
                {isEn ? 'Workshop 1: Algorithms & Logic' : 'Taller 1: Algoritmos y Lógica'}
              </span>
            </div>

            <button
              onClick={onBack}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer ${
                isDark
                  ? 'bg-slate-800 hover:bg-slate-700 text-white'
                  : 'bg-[#eff4ff] hover:bg-[#e5eeff] text-[#0b1c30]'
              }`}
            >
              <span className={`material-symbols-outlined text-[18px] ${isDark ? 'text-cyan-400' : 'text-[#0051d5]'}`}>
                arrow_back
              </span>
              <span>{isEn ? 'Back to Tasks' : 'Volver a Tareas'}</span>
            </button>
          </div>

          {/* Header Banner: Task Title, Context & High-level Badges */}
          <div className={`relative overflow-hidden p-6 sm:p-8 rounded-2xl shadow-sm border ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-[#e5eeff]'
          }`}>
            <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />
            <div className="absolute -left-10 -bottom-10 w-48 h-48 rounded-full bg-indigo-500/10 blur-2xl pointer-events-none" />

            <div className="relative flex flex-col gap-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                  isDark ? 'bg-cyan-950 text-cyan-300 border border-cyan-800/40' : 'bg-[#dde1ff] text-[#001453]'
                }`}>
                  <span className="material-symbols-outlined text-[15px]">code</span>
                  {isEn ? 'Software Programming' : 'Programación de Software'}
                </span>
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                  isDark ? 'bg-slate-800 text-slate-300' : 'bg-[#dce9ff] text-[#0b1c30]'
                }`}>
                  <span className={`material-symbols-outlined text-[15px] ${isDark ? 'text-cyan-400' : 'text-[#0051d5]'}`}>
                    person
                  </span>
                  Prof. Daniela Álvarez
                </span>
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                  isDark ? 'bg-slate-800 text-slate-300' : 'bg-[#dce9ff] text-[#0b1c30]'
                }`}>
                  <span className={`material-symbols-outlined text-[15px] ${isDark ? 'text-cyan-400' : 'text-[#0051d5]'}`}>
                    grade
                  </span>
                  {isEn ? 'Max Score: 5.0 pts (20% of term)' : 'Puntaje máx: 5.0 pts (20% del período)'}
                </span>
              </div>

              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex flex-col gap-1">
                  <span className={`text-xs uppercase tracking-wider font-extrabold ${
                    isDark ? 'text-cyan-400' : 'text-[#0051d5]'
                  }`}>
                    {isEn ? 'Unit 1 • Computational Fundamentals' : 'Unidad 1 • Fundamentos Computacionales'}
                  </span>
                  <h1 className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${
                    isDark ? 'text-white' : 'text-[#0b1c30]'
                  }`}>
                    {isEn ? 'Workshop 1: Algorithms and Programming Logic' : 'Taller 1: Algoritmos y Lógica de Programación'}
                  </h1>
                </div>

                {/* Submission Status Chips */}
                <div className="flex items-center gap-3 flex-wrap">
                  <div className={`flex items-center gap-2 px-4 py-2.5 rounded-xl shadow-xs border ${
                    isDark ? 'bg-slate-800 border-slate-700' : 'bg-[#eff4ff] border-[#dce9ff]'
                  }`}>
                    <span className={`material-symbols-outlined text-[20px] ${isDark ? 'text-cyan-400' : 'text-[#0051d5]'}`}>
                      alarm
                    </span>
                    <div className="flex flex-col">
                      <span className={`text-[11px] leading-none font-medium ${isDark ? 'text-slate-400' : 'text-[#444653]'}`}>
                        {isEn ? 'Due date' : 'Fecha de entrega'}
                      </span>
                      <span className={`text-xs font-bold leading-tight mt-0.5 ${isDark ? 'text-white' : 'text-[#0b1c30]'}`}>
                        {isEn ? 'October 15, 11:59 PM' : '15 Octubre, 11:59 PM'}
                      </span>
                    </div>
                  </div>

                  <div
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl shadow-xs border ${
                      isSubmitted
                        ? isDark ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800' : 'bg-emerald-50 text-emerald-900 border-emerald-200'
                        : isDark ? 'bg-rose-950/60 text-rose-300 border-rose-800' : 'bg-[#ffdad6]/60 text-[#93000a] border-[#ffdad6]'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      {isSubmitted ? 'task_alt' : 'hourglass_top'}
                    </span>
                    <div className="flex flex-col">
                      <span className="text-[11px] leading-none font-semibold">
                        {isSubmitted ? (isEn ? 'Submitted on time' : 'Entregado a tiempo') : (isEn ? '4 days remaining' : 'Faltan 4 días')}
                      </span>
                      <span className="text-xs font-bold leading-tight mt-0.5">
                        {isSubmitted
                          ? `${isEn ? 'Submitted' : 'Entregado'} (${submissionTime})`
                          : (isEn ? 'Pending submission' : 'Pendiente de entrega')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 2-Column Content Layout (65% Left, 35% Right) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* LEFT COLUMN: Instructions, Criteria, Teacher Files */}
            <div className="lg:col-span-8 flex flex-col gap-6 min-w-0">
              {/* Activity Instructions Card */}
              <div className={`p-6 sm:p-8 rounded-2xl shadow-sm flex flex-col gap-6 border ${
                isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-[#e5eeff]'
              }`}>
                <div className={`flex items-center justify-between pb-3 border-b ${
                  isDark ? 'border-slate-800' : 'border-[#eff4ff]'
                }`}>
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-6 rounded-full ${isDark ? 'bg-cyan-500' : 'bg-[#0051d5]'}`} />
                    <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-[#0b1c30]'}`}>
                      {isEn ? 'Activity Guidelines' : 'Instrucciones de la Actividad'}
                    </h2>
                  </div>
                  <span className={`inline-flex items-center gap-1 text-xs px-3 py-1 rounded-full font-semibold ${
                    isDark ? 'bg-slate-800 text-cyan-300' : 'bg-[#eff4ff] text-[#444653]'
                  }`}>
                    <span className="material-symbols-outlined text-[14px]">school</span>
                    {isEn ? 'Grade 11°B' : 'Grado 11°B'}
                  </span>
                </div>

                {/* Rich Intro Text */}
                <p className={`text-sm sm:text-base leading-relaxed ${isDark ? 'text-slate-300' : 'text-[#444653]'}`}>
                  {isEn
                    ? 'Dear students, in this activity we will practice core programming logic, flowcharts, pseudocode in PSeInt, and conditional structures. Make sure to properly document each algorithm before submitting your solution.'
                    : 'Estimados estudiantes, en esta actividad pondremos en práctica los conceptos iniciales de lógica de programación, diagramación de flujo, pseudocódigo en PSeInt y estructuras de control selectivas. Asegúrense de documentar adecuadamente cada algoritmo antes de subir los archivos finales.'}
                </p>

                {/* Learning Objectives */}
                <div className={`p-5 rounded-2xl flex flex-col gap-3 border ${
                  isDark ? 'bg-slate-800/80 border-slate-700' : 'bg-[#eff4ff] border-[#dce9ff]'
                }`}>
                  <span className={`text-sm font-bold flex items-center gap-1.5 ${
                    isDark ? 'text-cyan-300' : 'text-[#00288e]'
                  }`}>
                    <span className="material-symbols-outlined text-[18px]">verified</span>
                    {isEn ? 'Learning Objectives' : 'Objetivos de Aprendizaje'}
                  </span>
                  <div className={`grid grid-cols-1 md:grid-cols-2 gap-2.5 text-xs ${
                    isDark ? 'text-slate-200' : 'text-[#0b1c30]'
                  }`}>
                    <div className="flex items-start gap-2">
                      <span className={`material-symbols-outlined text-[18px] shrink-0 mt-0.5 ${
                        isDark ? 'text-cyan-400' : 'text-[#0051d5]'
                      }`}>check_circle</span>
                      <span>{isEn ? 'Structure sequential and conditional algorithmic logic without ambiguity.' : 'Estructurar lógica algorítmica secuencial y condicional libre de ambigüedades.'}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className={`material-symbols-outlined text-[18px] shrink-0 mt-0.5 ${
                        isDark ? 'text-cyan-400' : 'text-[#0051d5]'
                      }`}>check_circle</span>
                      <span>{isEn ? 'Master standard ANSI flowchart symbols.' : 'Dominar la simbología estándar ANSI para diagramas de flujo interactivos.'}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className={`material-symbols-outlined text-[18px] shrink-0 mt-0.5 ${
                        isDark ? 'text-cyan-400' : 'text-[#0051d5]'
                      }`}>check_circle</span>
                      <span>{isEn ? 'Translate specifications to clean pseudocode.' : 'Traducir especificaciones funcionales a pseudocódigo estricto con validaciones.'}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className={`material-symbols-outlined text-[18px] shrink-0 mt-0.5 ${
                        isDark ? 'text-cyan-400' : 'text-[#0051d5]'
                      }`}>check_circle</span>
                      <span>{isEn ? 'Perform rigorous desk tests and variable tracing.' : 'Realizar pruebas de escritorio rigurosas mediante matrices de trazado.'}</span>
                    </div>
                  </div>
                </div>

                {/* Task Deliverables / Detailed Steps */}
                <div className="flex flex-col gap-4">
                  <h3 className={`text-base font-bold ${isDark ? 'text-white' : 'text-[#0b1c30]'}`}>
                    {isEn ? 'Steps to Complete' : 'Puntos a Desarrollar'}
                  </h3>
                  <div className="flex flex-col gap-3">
                    <div className={`flex items-start gap-4 p-4 rounded-xl border transition-colors ${
                      isDark ? 'bg-slate-950/60 border-slate-800 hover:bg-slate-800' : 'bg-[#f8f9ff] border-[#e5eeff] hover:bg-[#eff4ff]'
                    }`}>
                      <div className={`w-8 h-8 rounded-lg text-white flex items-center justify-center text-sm font-extrabold shrink-0 shadow-xs ${
                        isDark ? 'bg-cyan-600' : 'bg-[#1e40af]'
                      }`}>
                        1
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className={`text-xs sm:text-sm font-bold ${isDark ? 'text-white' : 'text-[#0b1c30]'}`}>
                          {isEn ? 'Flowchart: Grade Calculation and Passing Status' : 'Diagrama de Flujo: Cálculo y Aprobación de Calificaciones'}
                        </span>
                        <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-400' : 'text-[#444653]'}`}>
                          {isEn
                            ? 'Design the formal flowchart to calculate the weighted average of 4 terms and output status, validating grades between 1.0 and 5.0.'
                            : 'Diseñar el diagrama de flujo formal para solicitar las notas de 4 períodos lectivos, calcular el promedio ponderado y emitir un dictamen final.'}
                        </p>
                      </div>
                    </div>

                    <div className={`flex items-start gap-4 p-4 rounded-xl border transition-colors ${
                      isDark ? 'bg-slate-950/60 border-slate-800 hover:bg-slate-800' : 'bg-[#f8f9ff] border-[#e5eeff] hover:bg-[#eff4ff]'
                    }`}>
                      <div className={`w-8 h-8 rounded-lg text-white flex items-center justify-center text-sm font-extrabold shrink-0 shadow-xs ${
                        isDark ? 'bg-cyan-600' : 'bg-[#1e40af]'
                      }`}>
                        2
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className={`text-xs sm:text-sm font-bold ${isDark ? 'text-white' : 'text-[#0b1c30]'}`}>
                          {isEn ? 'Algorithm Pseudocode: Dynamic Ticket Rates' : 'Algoritmo en Pseudocódigo: Tarifas Dinámicas de Taquilla'}
                        </span>
                        <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-400' : 'text-[#444653]'}`}>
                          {isEn
                            ? 'Implement standard pseudocode (PSeInt) or Python to classify age and apply discounts according to the guide table.'
                            : 'Implementar en pseudocódigo estándar (PSeInt) o Python la solución para clasificar la edad de asistentes y otorgar descuentos.'}
                        </p>
                      </div>
                    </div>

                    <div className={`flex items-start gap-4 p-4 rounded-xl border transition-colors ${
                      isDark ? 'bg-slate-950/60 border-slate-800 hover:bg-slate-800' : 'bg-[#f8f9ff] border-[#e5eeff] hover:bg-[#eff4ff]'
                    }`}>
                      <div className={`w-8 h-8 rounded-lg text-white flex items-center justify-center text-sm font-extrabold shrink-0 shadow-xs ${
                        isDark ? 'bg-cyan-600' : 'bg-[#1e40af]'
                      }`}>
                        3
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className={`text-xs sm:text-sm font-bold ${isDark ? 'text-white' : 'text-[#0b1c30]'}`}>
                          {isEn ? 'Documented Desk Tests' : 'Pruebas de Escritorio Documentadas'}
                        </span>
                        <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-400' : 'text-[#444653]'}`}>
                          {isEn
                            ? 'Run at least 4 manual tests with test data sets and record them in the provided template.'
                            : 'Ejecutar al menos 4 corridas manuales con diferentes juegos de datos de prueba y registrarlas en la plantilla provista.'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Evaluation Rubric Table */}
                <div className="flex flex-col gap-3 pt-2">
                  <div className="flex items-center justify-between">
                    <h3 className={`text-base font-bold ${isDark ? 'text-white' : 'text-[#0b1c30]'}`}>
                      {isEn ? 'Evaluation Rubric' : 'Rúbrica de Evaluación'}
                    </h3>
                    <span className={`text-xs font-medium ${isDark ? 'text-slate-400' : 'text-[#444653]'}`}>
                      {isEn ? '100% Quantitative Evaluation' : 'Evaluación cuantitativa 100%'}
                    </span>
                  </div>
                  <div className={`overflow-x-auto rounded-xl border ${
                    isDark ? 'bg-slate-800/80 border-slate-700' : 'bg-[#eff4ff] border-[#dce9ff]'
                  }`}>
                    <table className="w-full text-left">
                      <thead>
                        <tr className={`text-xs ${isDark ? 'bg-slate-800 text-white' : 'bg-[#e5eeff] text-[#0b1c30]'}`}>
                          <th className="py-3 px-4 font-bold">{isEn ? 'Criterion' : 'Criterio'}</th>
                          <th className="py-3 px-4 font-bold">{isEn ? 'Description' : 'Descripción'}</th>
                          <th className="py-3 px-4 font-bold text-right">{isEn ? 'Weight' : 'Ponderación'}</th>
                        </tr>
                      </thead>
                      <tbody className={`divide-y text-xs ${isDark ? 'divide-slate-700' : 'divide-[#e5eeff]'}`}>
                        <tr className={isDark ? 'hover:bg-slate-750' : 'hover:bg-white/60'}>
                          <td className={`py-3 px-4 font-bold ${isDark ? 'text-white' : 'text-[#0b1c30]'}`}>
                            {isEn ? 'Logic & Flow Structure' : 'Lógica y Estructura'}
                          </td>
                          <td className={`py-3 px-4 ${isDark ? 'text-slate-400' : 'text-[#444653]'}`}>
                            {isEn ? 'Accurate conditionals, clean ANSI flowchart symbols.' : 'Uso correcto de condicionales y diagramación ANSI sin ambigüedades.'}
                          </td>
                          <td className={`py-3 px-4 text-right font-extrabold ${isDark ? 'text-cyan-300' : 'text-[#00288e]'}`}>
                            40% (2.0 pts)
                          </td>
                        </tr>
                        <tr className={isDark ? 'hover:bg-slate-750' : 'hover:bg-white/60'}>
                          <td className={`py-3 px-4 font-bold ${isDark ? 'text-white' : 'text-[#0b1c30]'}`}>
                            {isEn ? 'Syntax & Execution' : 'Sintaxis y Ejecución'}
                          </td>
                          <td className={`py-3 px-4 ${isDark ? 'text-slate-400' : 'text-[#444653]'}`}>
                            {isEn ? 'Executable code without syntax or runtime bugs.' : 'Pseudocódigo ejecutable sin errores semánticos ni sintácticos en PSeInt.'}
                          </td>
                          <td className={`py-3 px-4 text-right font-extrabold ${isDark ? 'text-cyan-300' : 'text-[#00288e]'}`}>
                            40% (2.0 pts)
                          </td>
                        </tr>
                        <tr className={isDark ? 'hover:bg-slate-750' : 'hover:bg-white/60'}>
                          <td className={`py-3 px-4 font-bold ${isDark ? 'text-white' : 'text-[#0b1c30]'}`}>
                            {isEn ? 'Documentation' : 'Documentación y Formato'}
                          </td>
                          <td className={`py-3 px-4 ${isDark ? 'text-slate-400' : 'text-[#444653]'}`}>
                            {isEn ? 'Complete desk trace matrices and comments.' : 'Pruebas de escritorio completas, comentarios y presentación.'}
                          </td>
                          <td className={`py-3 px-4 text-right font-extrabold ${isDark ? 'text-cyan-300' : 'text-[#00288e]'}`}>
                            20% (1.0 pt)
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Attachments from Teacher Card */}
              <div className={`p-6 sm:p-8 rounded-2xl shadow-sm flex flex-col gap-4 border ${
                isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-[#e5eeff]'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`material-symbols-outlined text-[22px] ${isDark ? 'text-cyan-400' : 'text-[#0051d5]'}`}>
                      attachment
                    </span>
                    <h2 className={`text-base font-bold ${isDark ? 'text-white' : 'text-[#0b1c30]'}`}>
                      {isEn ? 'Supporting Documents & Guides' : 'Material de Apoyo y Guías'}
                    </h2>
                  </div>
                  <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-[#444653]'}`}>
                    {isEn ? '2 files available' : '2 archivos disponibles'}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* File 1: PDF Guide */}
                  <div className={`flex items-center justify-between p-4 rounded-xl shadow-xs group border ${
                    isDark ? 'bg-slate-950 border-slate-800' : 'bg-[#f8f9ff] hover:bg-[#eff4ff] border-[#e5eeff]'
                  }`}>
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-11 h-11 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0 shadow-xs">
                        <span className="material-symbols-outlined text-[24px]">picture_as_pdf</span>
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className={`text-xs font-bold truncate ${isDark ? 'text-white group-hover:text-cyan-400' : 'text-[#0b1c30] group-hover:text-[#00288e]'}`}>
                          Guia_Taller1_Algoritmos.pdf
                        </span>
                        <span className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-[#444653]'}`}>2.4 MB • PDF Document</span>
                      </div>
                    </div>
                    <button
                      onClick={() => showToast(isEn ? 'Downloading Guia_Taller1_Algoritmos.pdf' : 'Descargando Guia_Taller1_Algoritmos.pdf')}
                      className={`ml-2 p-2 rounded-lg transition-all shadow-xs flex items-center justify-center border cursor-pointer ${
                        isDark
                          ? 'bg-slate-800 border-slate-700 text-cyan-300 hover:bg-slate-700'
                          : 'bg-white border-[#e2e8f0] text-[#0051d5] hover:bg-[#00288e] hover:text-white'
                      }`}
                      title={isEn ? 'Download Guide' : 'Descargar Guía'}
                      type="button"
                    >
                      <span className="material-symbols-outlined text-[20px]">download</span>
                    </button>
                  </div>

                  {/* File 2: Excel Template */}
                  <div className={`flex items-center justify-between p-4 rounded-xl shadow-xs group border ${
                    isDark ? 'bg-slate-950 border-slate-800' : 'bg-[#f8f9ff] hover:bg-[#eff4ff] border-[#e5eeff]'
                  }`}>
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-11 h-11 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 shadow-xs">
                        <span className="material-symbols-outlined text-[24px]">table_chart</span>
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className={`text-xs font-bold truncate ${isDark ? 'text-white group-hover:text-cyan-400' : 'text-[#0b1c30] group-hover:text-[#00288e]'}`}>
                          Plantilla_Pruebas_Escritorio.xlsx
                        </span>
                        <span className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-[#444653]'}`}>450 KB • Spreadsheet</span>
                      </div>
                    </div>
                    <button
                      onClick={() => showToast(isEn ? 'Downloading Plantilla_Pruebas_Escritorio.xlsx' : 'Descargando Plantilla_Pruebas_Escritorio.xlsx')}
                      className={`ml-2 p-2 rounded-lg transition-all shadow-xs flex items-center justify-center border cursor-pointer ${
                        isDark
                          ? 'bg-slate-800 border-slate-700 text-cyan-300 hover:bg-slate-700'
                          : 'bg-white border-[#e2e8f0] text-[#0051d5] hover:bg-[#00288e] hover:text-white'
                      }`}
                      title={isEn ? 'Download Template' : 'Descargar Plantilla'}
                      type="button"
                    >
                      <span className="material-symbols-outlined text-[20px]">download</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: Student Submission Panel */}
            <div className="lg:col-span-4 flex flex-col gap-6 sticky top-28">
              <div className={`p-6 rounded-2xl shadow-sm flex flex-col gap-5 border ${
                isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-[#e5eeff]'
              }`}>
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`material-symbols-outlined text-[24px] ${isDark ? 'text-cyan-400' : 'text-[#0051d5]'}`}>
                      upload_file
                    </span>
                    <h2 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-[#0b1c30]'}`}>
                      {isEn ? 'Your Submission' : 'Tu Entrega'}
                    </h2>
                  </div>
                  <span
                    className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold ${
                      isSubmitted
                        ? isDark ? 'bg-emerald-950 text-emerald-300' : 'bg-emerald-100 text-emerald-800'
                        : isDark ? 'bg-rose-950 text-rose-300' : 'bg-[#ffdad6] text-[#93000a]'
                    }`}
                  >
                    {isSubmitted ? (isEn ? 'Submitted' : 'Entregado') : (isEn ? 'Pending' : 'Sin entregar')}
                  </span>
                </div>

                {/* Student summary badge */}
                <div className={`flex items-center gap-3 p-3 rounded-xl border ${
                  isDark ? 'bg-slate-800 border-slate-700' : 'bg-[#eff4ff] border-[#dce9ff]'
                }`}>
                  <img
                    alt="Student"
                    className="w-10 h-10 rounded-full object-cover shadow-xs ring-2 ring-white/50"
                    src={ASSETS.studentAvatar}
                  />
                  <div className="flex flex-col min-w-0">
                    <span className={`text-xs font-bold truncate ${isDark ? 'text-white' : 'text-[#0b1c30]'}`}>
                      Miguel Ángel Jiménez
                    </span>
                    <span className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-[#444653]'}`}>
                      {isEn ? 'Student • Enrolled 2026-11B' : 'Estudiante • Matrícula 2026-11B'}
                    </span>
                  </div>
                </div>

                {/* Drag & Drop Zone */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <label className={`text-xs font-bold ${isDark ? 'text-white' : 'text-[#0b1c30]'}`}>
                      {isEn ? 'Upload assignment files' : 'Cargar archivos de la tarea'}
                    </label>
                    <button
                      type="button"
                      onClick={handleSimulateDefaultFiles}
                      className={`text-[11px] hover:underline font-semibold cursor-pointer ${
                        isDark ? 'text-cyan-400' : 'text-[#0051d5]'
                      }`}
                    >
                      {isEn ? '+ Load demo files' : '+ Cargar archivos de ejemplo'}
                    </button>
                  </div>
                  <div className={`relative flex flex-col items-center justify-center p-6 rounded-xl transition-all cursor-pointer text-center group border-2 border-dashed ${
                    isDark
                      ? 'bg-slate-950 border-slate-700 hover:border-cyan-400'
                      : 'bg-[#eff4ff]/60 hover:bg-[#eff4ff] border-[#c4c5d5] hover:border-[#0051d5]'
                  }`}>
                    <input
                      type="file"
                      id="file-input"
                      multiple
                      accept=".pdf,.docx,.zip,.rar,.psc"
                      onChange={handleFileUpload}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-2 transition-colors ${
                      isDark ? 'bg-cyan-500/10 text-cyan-300' : 'bg-[#0051d5]/10 text-[#0051d5]'
                    }`}>
                      <span className="material-symbols-outlined text-[26px]">
                        cloud_upload
                      </span>
                    </div>
                    <span className={`text-xs font-bold ${isDark ? 'text-white' : 'text-[#0b1c30]'}`}>
                      {isEn ? 'Drag your file here' : 'Arrastra tu archivo aquí'}
                    </span>
                    <span className={`text-[11px] mt-0.5 ${isDark ? 'text-slate-400' : 'text-[#444653]'}`}>
                      {isEn ? 'or click to browse local files' : 'o haz clic para examinar archivos locales'}
                    </span>
                    <div className={`mt-3 px-2.5 py-1 rounded-lg text-[10px] font-bold ${
                      isDark ? 'bg-slate-800 text-slate-300' : 'bg-[#e5eeff] text-[#444653]'
                    }`}>
                      PDF, DOCX, ZIP or PSC (Max. 10 MB)
                    </div>
                  </div>
                </div>

                {/* Staged Files Container */}
                <div className="flex flex-col gap-2">
                  {uploadedFiles.length === 0 ? (
                    <div className={`flex items-center justify-between p-2.5 rounded-xl shadow-xs border ${
                      isDark ? 'bg-slate-950 border-slate-800' : 'bg-[#f8f9ff] border-[#e5eeff]'
                    }`}>
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={`material-symbols-outlined text-[20px] shrink-0 ${isDark ? 'text-slate-600' : 'text-[#757684]'}`}>
                          draft
                        </span>
                        <span className={`text-xs italic truncate ${isDark ? 'text-slate-500' : 'text-[#757684]'}`}>
                          {isEn ? 'No files attached yet' : 'Ningún archivo cargado todavía'}
                        </span>
                      </div>
                      <span className={`text-[11px] font-medium ${isDark ? 'text-slate-500' : 'text-[#757684]'}`}>
                        {isEn ? '0 / 3 attached' : '0 / 3 adjuntos'}
                      </span>
                    </div>
                  ) : (
                    uploadedFiles.map((file, idx) => (
                      <div
                        key={idx}
                        className={`flex items-center justify-between p-2.5 rounded-xl shadow-xs border ${
                          isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-[#dce9ff]'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="material-symbols-outlined text-emerald-500 text-[20px] shrink-0">
                            check_circle
                          </span>
                          <span className={`text-xs font-bold truncate ${isDark ? 'text-white' : 'text-[#0b1c30]'}`}>
                            {file.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0 ml-2">
                          <span className={`text-[11px] font-medium ${isDark ? 'text-slate-400' : 'text-[#444653]'}`}>
                            {file.size}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeFile(idx)}
                            className="text-rose-400 hover:bg-rose-950/40 p-1 rounded-md transition-colors cursor-pointer"
                            title={isEn ? 'Remove file' : 'Eliminar archivo'}
                          >
                            <span className="material-symbols-outlined text-[16px]">close</span>
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Notes Field */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <label className={`text-xs font-bold ${isDark ? 'text-white' : 'text-[#0b1c30]'}`}>
                      {isEn ? 'Teacher notes' : 'Observaciones para el docente'}
                    </label>
                    <span className={`text-[11px] ${isDark ? 'text-slate-500' : 'text-[#757684]'}`}>
                      {studentNotes.length}/500
                    </span>
                  </div>
                  <textarea
                    value={studentNotes}
                    onChange={(e) => setStudentNotes(e.target.value)}
                    maxLength={500}
                    rows={3}
                    placeholder={isEn ? 'Add comments, PSeInt version used, or notes for your teacher...' : 'Escribe aquí aclaraciones sobre tu entrega, versión de PSeInt utilizada o notas importantes...'}
                    className={`w-full p-3 rounded-xl text-xs outline-none transition-all resize-none border ${
                      isDark
                        ? 'bg-slate-950 border-slate-700 text-white placeholder:text-slate-600 focus:border-cyan-400'
                        : 'bg-[#f8f9ff] border-[#cbd5e1] text-[#0b1c30] placeholder:text-[#757684] focus:bg-white focus:border-[#0051d5]'
                    }`}
                  />
                </div>

                {/* Submit Button */}
                <button
                  type="button"
                  onClick={handleSubmitAssignment}
                  disabled={isSubmitting}
                  className={`w-full h-12 rounded-xl text-white text-xs font-bold shadow-md hover:shadow-lg flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer ${
                    isSubmitted
                      ? isDark ? 'bg-cyan-700 hover:bg-cyan-600' : 'bg-[#1e40af] hover:bg-[#00288e]'
                      : 'bg-emerald-600 hover:bg-emerald-500'
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <span className="material-symbols-outlined text-[20px] animate-spin">
                        progress_activity
                      </span>
                      <span>{isEn ? 'Submitting Solution...' : 'Enviando Entrega...'}</span>
                    </>
                  ) : isSubmitted ? (
                    <>
                      <span className="material-symbols-outlined text-[20px]">task_alt</span>
                      <span>{isEn ? 'Submitted! (Resubmit)' : '¡Tarea Enviada con Éxito! (Reenviar)'}</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[20px]">send</span>
                      <span>{isEn ? 'Submit Solution' : 'Enviar Tarea Definitiva'}</span>
                    </>
                  )}
                </button>

                {/* Reassurance Notice */}
                <div className={`flex items-start gap-2.5 p-3 rounded-xl border ${
                  isDark ? 'bg-slate-800/60 border-slate-700 text-slate-300' : 'bg-[#eff4ff] border-[#dce9ff] text-[#444653]'
                }`}>
                  <span className={`material-symbols-outlined text-[18px] shrink-0 mt-0.5 ${
                    isDark ? 'text-cyan-400' : 'text-[#0051d5]'
                  }`}>
                    verified_user
                  </span>
                  <p className="text-xs leading-relaxed">
                    {isEn
                      ? 'You can update and resubmit your solution any time before the deadline (October 15, 11:59 PM). The latest version is stored.'
                      : 'Podrás anular y reenviar tu solución cuantas veces sea necesario antes de la fecha límite (15 de Octubre, 11:59 PM). El sistema registra la última versión.'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};
