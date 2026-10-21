import React, { useState, useEffect, useMemo } from 'react';
import { ActiveScreen, UserProfile } from '../types';
import { ASSETS } from '../data/mockData';
import { useThemeLanguage } from '../context/ThemeLanguageContext';
import {
  fetchDetailedPublishedAssignmentsForStudent,
  fetchStudentSubmission,
  saveStudentSubmission,
  InstitutionalAssignmentDoc,
  StudentSubmission
} from '../services/assignmentService';

interface StudentAssignmentViewProps {
  currentUser?: UserProfile | null;
  onBack: () => void;
  onNavigate: (screen: ActiveScreen) => void;
  initialAssignmentId?: string;
}

interface UploadedFile {
  name: string;
  size: string;
}

export const StudentAssignmentView: React.FC<StudentAssignmentViewProps> = ({
  currentUser,
  onBack,
  onNavigate,
  initialAssignmentId
}) => {
  const { theme, language } = useThemeLanguage();
  const isDark = theme === 'dark';
  const isEn = language === 'en';

  const [publishedAssignments, setPublishedAssignments] = useState<InstitutionalAssignmentDoc[]>([]);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string | null>(initialAssignmentId || null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [studentSubmission, setStudentSubmission] = useState<StudentSubmission | null>(null);
  const [isLoadingSubmission, setIsLoadingSubmission] = useState(false);

  const [studentNotes, setStudentNotes] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Student identification key for submissions
  const studentKey = useMemo(() => {
    return currentUser?.documentId || currentUser?.id || currentUser?.studentCode || '';
  }, [currentUser]);

  // Load real published assignments from Firestore for the student's grade/group
  useEffect(() => {
    let isMounted = true;
    const loadAssignments = async () => {
      setIsLoading(true);
      setLoadError(null);
      try {
        const studentGrade = currentUser?.gradeLevel || currentUser?.group || '';
        const studentGroup = currentUser?.group || '';
        const studentShift = currentUser?.shift || '';

        const realDocs = await fetchDetailedPublishedAssignmentsForStudent(
          studentGrade,
          studentGroup,
          studentShift
        );

        if (isMounted) {
          setPublishedAssignments(realDocs);
          if (realDocs.length > 0) {
            setSelectedAssignmentId((prev) =>
              prev && realDocs.some((d) => d.id === prev) ? prev : realDocs[0].id
            );
          } else {
            setSelectedAssignmentId(null);
          }
        }
      } catch (err: unknown) {
        console.warn('Error loading published assignments from Firestore:', err);
        if (isMounted) {
          setLoadError(
            isEn
              ? 'Could not connect to database to check assignments.'
              : 'Error al conectar con la base de datos para consultar las tareas.'
          );
          setPublishedAssignments([]);
          setSelectedAssignmentId(null);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadAssignments();
    return () => {
      isMounted = false;
    };
  }, [currentUser?.gradeLevel, currentUser?.group, currentUser?.shift, isEn]);

  // Active assignment selected
  const activeAssignment = useMemo(() => {
    if (!selectedAssignmentId) return publishedAssignments[0] || null;
    return publishedAssignments.find((a) => a.id === selectedAssignmentId) || publishedAssignments[0] || null;
  }, [publishedAssignments, selectedAssignmentId]);

  // Query Firestore for the student's real submission for the active assignment
  useEffect(() => {
    let isMounted = true;
    const loadSubmission = async () => {
      if (!activeAssignment || !studentKey) {
        setStudentSubmission(null);
        setUploadedFiles([]);
        setStudentNotes('');
        return;
      }

      setIsLoadingSubmission(true);
      try {
        const realSub = await fetchStudentSubmission(activeAssignment.id, studentKey);
        if (isMounted) {
          setStudentSubmission(realSub);
          if (realSub) {
            setUploadedFiles(realSub.files || []);
            setStudentNotes(realSub.notes || '');
          } else {
            setUploadedFiles([]);
            setStudentNotes('');
          }
        }
      } catch (err) {
        console.warn('Error querying real submission:', err);
        if (isMounted) {
          setStudentSubmission(null);
          setUploadedFiles([]);
          setStudentNotes('');
        }
      } finally {
        if (isMounted) {
          setIsLoadingSubmission(false);
        }
      }
    };

    loadSubmission();
    return () => {
      isMounted = false;
    };
  }, [activeAssignment, studentKey]);

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

  const handleSubmitAssignment = async () => {
    if (!activeAssignment) return;
    if (uploadedFiles.length === 0) {
      showToast(
        isEn
          ? 'Please attach at least one solution file before submitting.'
          : 'Por favor carga al menos un archivo antes de enviar.'
      );
      return;
    }

    if (!studentKey) {
      showToast(
        isEn
          ? 'Error: Authenticated student session could not be verified.'
          : 'Error: No se pudo verificar la sesión del estudiante autenticado.'
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const saved = await saveStudentSubmission({
        assignmentId: activeAssignment.id,
        studentId: studentKey,
        studentName: currentUser?.fullName || (isEn ? 'Student' : 'Estudiante'),
        studentDocumentId: currentUser?.documentId || '',
        studentCode: currentUser?.studentCode || '',
        gradeLevel: currentUser?.gradeLevel || '',
        files: uploadedFiles,
        notes: studentNotes
      });

      setStudentSubmission(saved);
      showToast(
        isEn
          ? 'Assignment submitted and registered successfully in database!'
          : '¡Tarea entregada y registrada con éxito en la base de datos!'
      );
    } catch (err) {
      console.error('Error saving submission to Firestore:', err);
      showToast(
        isEn
          ? 'Error saving submission to database. Please try again.'
          : 'Error al registrar la entrega en la base de datos. Inténtalo de nuevo.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const studentDisplayName = currentUser?.fullName || (isEn ? 'Student' : 'Estudiante');
  const studentDisplayCode = currentUser?.studentCode
    ? `${isEn ? 'Code' : 'Código'}: ${currentUser.studentCode}`
    : currentUser?.documentId
    ? `${isEn ? 'Doc' : 'Doc'}: ${currentUser.documentId}`
    : '';
  const studentDisplayGrade = currentUser?.gradeLevel || (isEn ? 'Grade 11°B' : 'Grado 11°B');

  return (
    <div
      className={`min-h-screen flex transition-colors duration-200 ${
        isDark ? 'bg-slate-950 text-slate-100' : 'bg-[#f8f9ff] text-[#0b1c30]'
      }`}
    >
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-16 right-4 z-50 bg-slate-900 border border-cyan-500/40 text-cyan-300 px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 text-xs font-bold animate-in fade-in duration-200">
          <span className="material-symbols-outlined text-[18px]">info</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* FIXED SIDEBAR */}
      <aside
        className={`hidden lg:flex fixed left-0 top-12 bottom-0 w-72 shadow-xs z-40 flex-col justify-between border-r transition-colors ${
          isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-[#e5eeff]'
        }`}
      >
        <div className="flex flex-col">
          <div
            className={`h-16 px-6 flex items-center gap-3 border-b ${
              isDark ? 'border-slate-800' : 'border-[#eff4ff]'
            }`}
          >
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-xs ${
                isDark ? 'bg-cyan-600' : 'bg-[#1e40af]'
              }`}
            >
              <span className="material-symbols-outlined text-[24px]">school</span>
            </div>
            <div className="flex flex-col">
              <span
                className={`font-extrabold text-xl leading-none tracking-tight ${
                  isDark ? 'text-white' : 'text-[#00288e]'
                }`}
              >
                Edulink
              </span>
              <span
                className={`text-[11px] font-semibold leading-none mt-1 ${
                  isDark ? 'text-slate-400' : 'text-[#444653]'
                }`}
              >
                {isEn ? 'Student Portal' : 'Portal Escolar'}
              </span>
            </div>
          </div>

          <nav className="px-3 py-4 flex flex-col gap-1">
            <button
              onClick={() => onNavigate('student_dashboard')}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all text-left cursor-pointer ${
                isDark
                  ? 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  : 'text-[#444653] hover:bg-[#eff4ff] hover:text-[#0b1c30]'
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">dashboard</span>
              <span>{isEn ? 'Dashboard' : 'Inicio'}</span>
            </button>
            <button
              onClick={() => onNavigate('student_dashboard')}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all text-left cursor-pointer ${
                isDark
                  ? 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  : 'text-[#444653] hover:bg-[#eff4ff] hover:text-[#0b1c30]'
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">menu_book</span>
              <span>{isEn ? 'My Subjects' : 'Mis Asignaturas'}</span>
            </button>
            <button
              onClick={() => onNavigate('student_dashboard')}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all text-left cursor-pointer ${
                isDark
                  ? 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  : 'text-[#444653] hover:bg-[#eff4ff] hover:text-[#0b1c30]'
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">assignment_turned_in</span>
              <span>{isEn ? 'Grades' : 'Calificaciones'}</span>
            </button>
            <button
              onClick={() => onNavigate('student_dashboard')}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all text-left cursor-pointer ${
                isDark
                  ? 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  : 'text-[#444653] hover:bg-[#eff4ff] hover:text-[#0b1c30]'
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
              onClick={() => onNavigate('student_forum')}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all text-left cursor-pointer ${
                isDark
                  ? 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  : 'text-[#444653] hover:bg-[#eff4ff] hover:text-[#0b1c30]'
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">forum</span>
              <span>{isEn ? 'Forums & Surveys' : 'Foro y encuestas'}</span>
            </button>
          </nav>
        </div>

        <div className={`p-4 border-t ${isDark ? 'border-slate-800' : 'border-[#eff4ff]'}`}>
          <div
            className={`rounded-xl p-3 flex items-center justify-between ${
              isDark ? 'bg-slate-800' : 'bg-[#eff4ff]'
            }`}
          >
            <div className="flex items-center gap-2">
              <span
                className={`material-symbols-outlined text-[20px] ${
                  isDark ? 'text-cyan-400' : 'text-[#0051d5]'
                }`}
              >
                verified
              </span>
              <span className={`text-xs font-bold ${isDark ? 'text-white' : 'text-[#0b1c30]'}`}>
                {isEn ? 'Year 2026' : 'Año 2026'}
              </span>
            </div>
            <span className={`text-xs font-medium ${isDark ? 'text-slate-400' : 'text-[#444653]'}`}>
              v2.4
            </span>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 lg:pl-72 flex flex-col min-w-0">
        {/* HEADER BAR */}
        <header
          className={`sticky top-12 h-16 backdrop-blur-xl shadow-xs z-30 px-4 sm:px-6 lg:px-8 flex items-center justify-between border-b transition-colors ${
            isDark ? 'bg-slate-900/95 border-slate-800' : 'bg-white/95 border-[#e5eeff]'
          }`}
        >
          <div className="flex items-center gap-4 flex-1 max-w-lg">
            <div className="relative w-full flex items-center">
              <span
                className={`material-symbols-outlined absolute left-3 text-[20px] ${
                  isDark ? 'text-slate-500' : 'text-[#757684]'
                }`}
              >
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
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold shrink-0 ${
                isDark ? 'bg-cyan-950 text-cyan-300' : 'bg-[#dbe1ff] text-[#00174b]'
              }`}
            >
              {isEn ? 'Term 1 - 2026' : 'Período 1 - 2026'}
            </span>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() =>
                showToast(
                  isEn
                    ? 'All homework notifications up to date.'
                    : 'Todas las notificaciones de tareas al día.'
                )
              }
              className={`relative p-2 rounded-xl transition-colors flex items-center justify-center cursor-pointer ${
                isDark ? 'text-slate-300 hover:bg-slate-800' : 'text-[#444653] hover:bg-[#eff4ff]'
              }`}
            >
              <span className="material-symbols-outlined text-[22px]">notifications</span>
              <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-rose-500 rounded-full ring-2 ring-white" />
            </button>

            <div className={`h-8 w-px ${isDark ? 'bg-slate-800' : 'bg-[#dce9ff]'}`} />

            {/* Authenticated Student Identity Badge */}
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:flex flex-col">
                <span
                  className={`text-xs font-bold leading-tight ${
                    isDark ? 'text-white' : 'text-[#0b1c30]'
                  }`}
                >
                  {studentDisplayName}
                </span>
                <span
                  className={`text-[11px] leading-tight mt-0.5 ${
                    isDark ? 'text-slate-400' : 'text-[#444653]'
                  }`}
                >
                  {isEn ? 'Student' : 'Estudiante'} • {studentDisplayGrade}
                </span>
              </div>
              <img
                alt="Profile"
                className={`w-9 h-9 rounded-full object-cover ring-2 shadow-xs ${
                  isDark ? 'ring-cyan-500/40' : 'ring-[#1e40af]/20'
                }`}
                src={currentUser?.avatarUrl || ASSETS.studentAvatar}
              />
            </div>
          </div>
        </header>

        {/* WORKSPACE CONTENT */}
        <main className="p-4 sm:p-6 lg:p-8 flex flex-col gap-6 max-w-[1400px] w-full mx-auto">
          {/* Breadcrumbs */}
          <div
            className={`flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl shadow-xs border ${
              isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-[#e5eeff]'
            }`}
          >
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
              <span
                className={`material-symbols-outlined text-[16px] ${
                  isDark ? 'text-slate-600' : 'text-[#c4c5d5]'
                }`}
              >
                chevron_right
              </span>
              <span className={isDark ? 'text-slate-400' : 'text-[#444653]'}>
                {activeAssignment ? activeAssignment.subject : isEn ? 'Tasks & Workshops' : 'Tareas y Entregas'}
              </span>
              {activeAssignment && (
                <>
                  <span
                    className={`material-symbols-outlined text-[16px] ${
                      isDark ? 'text-slate-600' : 'text-[#c4c5d5]'
                    }`}
                  >
                    chevron_right
                  </span>
                  <span className={`font-bold ${isDark ? 'text-cyan-300' : 'text-[#00288e]'}`}>
                    {activeAssignment.title}
                  </span>
                </>
              )}
            </div>

            <button
              onClick={onBack}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer ${
                isDark
                  ? 'bg-slate-800 hover:bg-slate-700 text-white'
                  : 'bg-[#eff4ff] hover:bg-[#e5eeff] text-[#0b1c30]'
              }`}
            >
              <span
                className={`material-symbols-outlined text-[18px] ${
                  isDark ? 'text-cyan-400' : 'text-[#0051d5]'
                }`}
              >
                arrow_back
              </span>
              <span>{isEn ? 'Back to Dashboard' : 'Volver al Inicio'}</span>
            </button>
          </div>

          {/* LOADING STATE */}
          {isLoading ? (
            <div
              className={`p-12 rounded-3xl shadow-sm text-center flex flex-col items-center justify-center gap-3 border ${
                isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-[#e5eeff]'
              }`}
            >
              <span className="material-symbols-outlined text-4xl text-cyan-500 animate-spin">
                progress_activity
              </span>
              <p className="text-sm font-semibold text-slate-500">
                {isEn ? 'Loading published assignments...' : 'Consultando talleres y tareas publicados...'}
              </p>
            </div>
          ) : publishedAssignments.length === 0 ? (
            /* EMPTY STATE: No published workshops or assignments */
            <div
              className={`p-8 sm:p-14 rounded-3xl shadow-sm flex flex-col items-center text-center max-w-3xl mx-auto w-full border ${
                isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-[#e5eeff]'
              }`}
            >
              <div
                className={`w-20 h-20 rounded-3xl flex items-center justify-center mb-6 shadow-inner ${
                  isDark ? 'bg-slate-800 text-cyan-400' : 'bg-[#eff4ff] text-[#0051d5]'
                }`}
              >
                <span className="material-symbols-outlined text-[44px]">task_alt</span>
              </div>

              <h2
                className={`text-2xl sm:text-3xl font-extrabold tracking-tight mb-3 ${
                  isDark ? 'text-white' : 'text-[#0b1c30]'
                }`}
              >
                {isEn ? 'No published workshops or assignments' : 'No hay talleres ni tareas publicados'}
              </h2>

              <p
                className={`text-sm sm:text-base leading-relaxed max-w-xl mb-6 ${
                  isDark ? 'text-slate-400' : 'text-[#444653]'
                }`}
              >
                {isEn
                  ? 'No teacher has published assignments or workshops for your grade and group yet. Once an authorized teacher publishes a task, you will see its details, attachments, and can submit your work here.'
                  : 'Ningún docente ha publicado talleres o tareas para tu grado y grupo por el momento. Una vez un docente autorizado publique una actividad pedagógica en la base de datos institucional, aparecerán aquí sus lineamientos y podrás subir tu entrega oficial.'}
              </p>

              {/* Verified Student Details Confirmation Strip */}
              <div
                className={`p-4 rounded-2xl flex flex-wrap items-center justify-center gap-4 text-xs font-semibold mb-8 border ${
                  isDark ? 'bg-slate-800/80 border-slate-700 text-slate-300' : 'bg-[#f8f9ff] border-[#cbd5e1] text-[#0b1c30]'
                }`}
              >
                <span className="inline-flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px] text-cyan-500">account_circle</span>
                  {studentDisplayName}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px] text-cyan-500">school</span>
                  {studentDisplayGrade}
                </span>
                {studentDisplayCode && (
                  <span className="inline-flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px] text-cyan-500">badge</span>
                    {studentDisplayCode}
                  </span>
                )}
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-200/60 dark:bg-slate-700 text-[11px] font-bold">
                  {isEn ? '0 registered submissions' : '0 entregas registradas'}
                </span>
              </div>

              <button
                type="button"
                onClick={onBack}
                className={`px-6 py-3 rounded-xl text-xs font-bold transition-all shadow-md hover:shadow-lg cursor-pointer ${
                  isDark
                    ? 'bg-cyan-600 hover:bg-cyan-500 text-white'
                    : 'bg-[#0051d5] hover:bg-[#00288e] text-white'
                }`}
              >
                {isEn ? 'Return to Dashboard' : 'Volver al Panel Principal'}
              </button>
            </div>
          ) : (
            /* REAL PUBLISHED ASSIGNMENTS DISPLAY */
            activeAssignment && (
              <div className="flex flex-col gap-6">
                {/* Multiple assignments selector tabs if more than 1 published */}
                {publishedAssignments.length > 1 && (
                  <div className="flex items-center gap-2 overflow-x-auto pb-1">
                    <span className={`text-xs font-bold shrink-0 mr-2 ${isDark ? 'text-slate-400' : 'text-[#444653]'}`}>
                      {isEn ? 'Select Task:' : 'Seleccionar Tarea:'}
                    </span>
                    {publishedAssignments.map((ass) => (
                      <button
                        key={ass.id}
                        onClick={() => setSelectedAssignmentId(ass.id)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer border ${
                          selectedAssignmentId === ass.id
                            ? isDark
                              ? 'bg-cyan-600 text-white border-cyan-500 shadow-sm'
                              : 'bg-[#0051d5] text-white border-[#0051d5] shadow-sm'
                            : isDark
                            ? 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                            : 'bg-white border-[#e5eeff] text-[#444653] hover:bg-[#eff4ff]'
                        }`}
                      >
                        {ass.subject}: {ass.title}
                      </button>
                    ))}
                  </div>
                )}

                {/* Header Banner: Task Title, Context & High-level Badges */}
                <div
                  className={`relative overflow-hidden p-6 sm:p-8 rounded-2xl shadow-sm border ${
                    isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-[#e5eeff]'
                  }`}
                >
                  <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />
                  <div className="absolute -left-10 -bottom-10 w-48 h-48 rounded-full bg-indigo-500/10 blur-2xl pointer-events-none" />

                  <div className="relative flex flex-col gap-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                          isDark ? 'bg-cyan-950 text-cyan-300 border border-cyan-800/40' : 'bg-[#dde1ff] text-[#001453]'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[15px]">menu_book</span>
                        {activeAssignment.subject}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                          isDark ? 'bg-slate-800 text-slate-300' : 'bg-[#dce9ff] text-[#0b1c30]'
                        }`}
                      >
                        <span
                          className={`material-symbols-outlined text-[15px] ${
                            isDark ? 'text-cyan-400' : 'text-[#0051d5]'
                          }`}
                        >
                          person
                        </span>
                        {activeAssignment.teacherName || (isEn ? 'Authorized Teacher' : 'Docente Titular')}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                          isDark ? 'bg-slate-800 text-slate-300' : 'bg-[#dce9ff] text-[#0b1c30]'
                        }`}
                      >
                        <span
                          className={`material-symbols-outlined text-[15px] ${
                            isDark ? 'text-cyan-400' : 'text-[#0051d5]'
                          }`}
                        >
                          grade
                        </span>
                        {activeAssignment.points || (isEn ? '100 points' : '100 puntos')}
                      </span>
                    </div>

                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="flex flex-col gap-1">
                        <span
                          className={`text-xs uppercase tracking-wider font-extrabold ${
                            isDark ? 'text-cyan-400' : 'text-[#0051d5]'
                          }`}
                        >
                          {activeAssignment.gradeLevel} • {isEn ? 'Official Assignment' : 'Taller Evaluativo'}
                        </span>
                        <h1
                          className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${
                            isDark ? 'text-white' : 'text-[#0b1c30]'
                          }`}
                        >
                          {activeAssignment.title}
                        </h1>
                      </div>

                      {/* Submission Status Chips */}
                      <div className="flex items-center gap-3 flex-wrap">
                        <div
                          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl shadow-xs border ${
                            isDark ? 'bg-slate-800 border-slate-700' : 'bg-[#eff4ff] border-[#dce9ff]'
                          }`}
                        >
                          <span
                            className={`material-symbols-outlined text-[20px] ${
                              isDark ? 'text-cyan-400' : 'text-[#0051d5]'
                            }`}
                          >
                            alarm
                          </span>
                          <div className="flex flex-col">
                            <span
                              className={`text-[11px] leading-none font-medium ${
                                isDark ? 'text-slate-400' : 'text-[#444653]'
                              }`}
                            >
                              {isEn ? 'Due date' : 'Fecha límite'}
                            </span>
                            <span
                              className={`text-xs font-bold leading-tight mt-0.5 ${
                                isDark ? 'text-white' : 'text-[#0b1c30]'
                              }`}
                            >
                              {activeAssignment.dueText || activeAssignment.dueDate}
                            </span>
                          </div>
                        </div>

                        <div
                          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl shadow-xs border ${
                            studentSubmission
                              ? isDark
                                ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800'
                                : 'bg-emerald-50 text-emerald-900 border-emerald-200'
                              : isDark
                              ? 'bg-rose-950/60 text-rose-300 border-rose-800'
                              : 'bg-[#ffdad6]/60 text-[#93000a] border-[#ffdad6]'
                          }`}
                        >
                          <span className="material-symbols-outlined text-[20px]">
                            {studentSubmission ? 'task_alt' : 'hourglass_top'}
                          </span>
                          <div className="flex flex-col">
                            <span className="text-[11px] leading-none font-semibold">
                              {studentSubmission
                                ? isEn
                                  ? 'Submission recorded'
                                  : 'Entrega registrada'
                                : isEn
                                ? 'Pending submission'
                                : 'Pendiente de entrega'}
                            </span>
                            <span className="text-xs font-bold leading-tight mt-0.5">
                              {studentSubmission
                                ? `${isEn ? 'Submitted' : 'Entregado'} (${new Date(
                                    studentSubmission.submittedAt
                                  ).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`
                                : isEn
                                ? 'Not submitted yet'
                                : 'Sin entregar'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2-Column Content Layout (65% Left, 35% Right) */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  {/* LEFT COLUMN: Instructions, Criteria, Teacher Guidelines */}
                  <div className="lg:col-span-8 flex flex-col gap-6 min-w-0">
                    <div
                      className={`p-6 sm:p-8 rounded-2xl shadow-sm flex flex-col gap-6 border ${
                        isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-[#e5eeff]'
                      }`}
                    >
                      <div
                        className={`flex items-center justify-between pb-3 border-b ${
                          isDark ? 'border-slate-800' : 'border-[#eff4ff]'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-2.5 h-6 rounded-full ${
                              isDark ? 'bg-cyan-500' : 'bg-[#0051d5]'
                            }`}
                          />
                          <h2
                            className={`text-xl font-bold ${
                              isDark ? 'text-white' : 'text-[#0b1c30]'
                            }`}
                          >
                            {isEn ? 'Activity Guidelines' : 'Instrucciones de la Actividad'}
                          </h2>
                        </div>
                        <span
                          className={`inline-flex items-center gap-1 text-xs px-3 py-1 rounded-full font-semibold ${
                            isDark ? 'bg-slate-800 text-cyan-300' : 'bg-[#eff4ff] text-[#444653]'
                          }`}
                        >
                          <span className="material-symbols-outlined text-[14px]">school</span>
                          {activeAssignment.gradeLevel}
                        </span>
                      </div>

                      <p
                        className={`text-sm sm:text-base leading-relaxed ${
                          isDark ? 'text-slate-300' : 'text-[#444653]'
                        }`}
                      >
                        {activeAssignment.instructions ||
                          (isEn
                            ? 'Please follow the teacher guidelines, prepare your solution files, and attach them using the submission panel on the right.'
                            : 'Estimado estudiante, consulta las directrices establecidas por el docente, desarrolla tu solución de forma individual y adjunta los archivos finales en el panel derecho antes del plazo límite de entrega.')}
                      </p>

                      {activeAssignment.pdfUrl && (
                        <div
                          className={`p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 border ${
                            isDark
                              ? 'bg-slate-950/70 border-cyan-500/30 text-white'
                              : 'bg-white border-blue-200 text-slate-900 shadow-xs'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-11 h-11 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0 border border-rose-500/30">
                              <span className="material-symbols-outlined text-2xl">picture_as_pdf</span>
                            </div>
                            <div className="min-w-0">
                              <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wider block">
                                {isEn ? 'Official Attachment' : 'Documento / Guía Adjunta'}
                              </span>
                              <span className="text-sm font-extrabold truncate block">
                                {activeAssignment.pdfName || 'Guia_de_Actividad.pdf'}
                              </span>
                              {activeAssignment.pdfSize && (
                                <span className="text-xs text-slate-400 font-medium">
                                  {activeAssignment.pdfSize} • Formato PDF institucional
                                </span>
                              )}
                            </div>
                          </div>
                          <a
                            href={activeAssignment.pdfUrl}
                            download={activeAssignment.pdfName || 'Guia_de_Actividad.pdf'}
                            target="_blank"
                            rel="noreferrer"
                            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md transition-all active:scale-95 shrink-0"
                          >
                            <span className="material-symbols-outlined text-base">download</span>
                            <span>{isEn ? 'Download PDF' : 'Descargar PDF'}</span>
                          </a>
                        </div>
                      )}

                      <div
                        className={`p-5 rounded-2xl flex flex-col gap-3 border ${
                          isDark ? 'bg-slate-800/80 border-slate-700' : 'bg-[#eff4ff] border-[#dce9ff]'
                        }`}
                      >
                        <span
                          className={`text-sm font-bold flex items-center gap-1.5 ${
                            isDark ? 'text-cyan-300' : 'text-[#00288e]'
                          }`}
                        >
                          <span className="material-symbols-outlined text-[18px]">verified</span>
                          {isEn ? 'Submission Instructions' : 'Indicaciones de Entrega'}
                        </span>
                        <div
                          className={`grid grid-cols-1 md:grid-cols-2 gap-2.5 text-xs ${
                            isDark ? 'text-slate-200' : 'text-[#0b1c30]'
                          }`}
                        >
                          <div className="flex items-start gap-2">
                            <span
                              className={`material-symbols-outlined text-[18px] shrink-0 mt-0.5 ${
                                isDark ? 'text-cyan-400' : 'text-[#0051d5]'
                              }`}
                            >
                              check_circle
                            </span>
                            <span>
                              {isEn
                                ? 'Upload standard formats (PDF, DOCX, ZIP, PSC).'
                                : 'Formatos admitidos: Archivos PDF, documentos Word, ZIP o pseudocódigo.'}
                            </span>
                          </div>
                          <div className="flex items-start gap-2">
                            <span
                              className={`material-symbols-outlined text-[18px] shrink-0 mt-0.5 ${
                                isDark ? 'text-cyan-400' : 'text-[#0051d5]'
                              }`}
                            >
                              check_circle
                            </span>
                            <span>
                              {isEn
                                ? 'Max file size per upload is 10 MB.'
                                : 'El tamaño máximo por archivo permitido es de 10 MB.'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* RIGHT COLUMN: Real Authenticated Student Submission Panel */}
                  <div className="lg:col-span-4 flex flex-col gap-6 sticky top-28">
                    <div
                      className={`p-6 rounded-2xl shadow-sm flex flex-col gap-5 border ${
                        isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-[#e5eeff]'
                      }`}
                    >
                      {/* Header */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span
                            className={`material-symbols-outlined text-[24px] ${
                              isDark ? 'text-cyan-400' : 'text-[#0051d5]'
                            }`}
                          >
                            upload_file
                          </span>
                          <h2
                            className={`text-lg font-bold ${
                              isDark ? 'text-white' : 'text-[#0b1c30]'
                            }`}
                          >
                            {isEn ? 'Your Submission' : 'Tu Entrega'}
                          </h2>
                        </div>
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold ${
                            studentSubmission
                              ? isDark
                                ? 'bg-emerald-950 text-emerald-300'
                                : 'bg-emerald-100 text-emerald-800'
                              : isDark
                              ? 'bg-rose-950 text-rose-300'
                              : 'bg-[#ffdad6] text-[#93000a]'
                          }`}
                        >
                          {studentSubmission
                            ? isEn
                              ? 'Submitted'
                              : 'Entregado'
                            : isEn
                            ? 'Pending'
                            : 'Sin entregar'}
                        </span>
                      </div>

                      {/* Real Student Summary Badge */}
                      <div
                        className={`flex items-center gap-3 p-3 rounded-xl border ${
                          isDark ? 'bg-slate-800 border-slate-700' : 'bg-[#eff4ff] border-[#dce9ff]'
                        }`}
                      >
                        <img
                          alt="Student"
                          className="w-10 h-10 rounded-full object-cover shadow-xs ring-2 ring-white/50"
                          src={currentUser?.avatarUrl || ASSETS.studentAvatar}
                        />
                        <div className="flex flex-col min-w-0">
                          <span
                            className={`text-xs font-bold truncate ${
                              isDark ? 'text-white' : 'text-[#0b1c30]'
                            }`}
                          >
                            {studentDisplayName}
                          </span>
                          <span
                            className={`text-[11px] ${
                              isDark ? 'text-slate-400' : 'text-[#444653]'
                            }`}
                          >
                            {studentDisplayGrade} {studentDisplayCode ? `• ${studentDisplayCode}` : ''}
                          </span>
                        </div>
                      </div>

                      {/* File Upload Zone - Real Files Only */}
                      <div className="flex flex-col gap-2">
                        <label
                          className={`text-xs font-bold ${isDark ? 'text-white' : 'text-[#0b1c30]'}`}
                        >
                          {isEn ? 'Upload assignment files' : 'Cargar archivos de la tarea'}
                        </label>
                        <div
                          className={`relative flex flex-col items-center justify-center p-6 rounded-xl transition-all cursor-pointer text-center group border-2 border-dashed ${
                            isDark
                              ? 'bg-slate-950 border-slate-700 hover:border-cyan-400'
                              : 'bg-[#eff4ff]/60 hover:bg-[#eff4ff] border-[#c4c5d5] hover:border-[#0051d5]'
                          }`}
                        >
                          <input
                            type="file"
                            id="file-input"
                            multiple
                            accept=".pdf,.docx,.zip,.rar,.psc"
                            onChange={handleFileUpload}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          />
                          <div
                            className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-2 transition-colors ${
                              isDark ? 'bg-cyan-500/10 text-cyan-300' : 'bg-[#0051d5]/10 text-[#0051d5]'
                            }`}
                          >
                            <span className="material-symbols-outlined text-[26px]">
                              cloud_upload
                            </span>
                          </div>
                          <span
                            className={`text-xs font-bold ${
                              isDark ? 'text-white' : 'text-[#0b1c30]'
                            }`}
                          >
                            {isEn ? 'Drag your file here' : 'Arrastra tu archivo aquí'}
                          </span>
                          <span
                            className={`text-[11px] mt-0.5 ${
                              isDark ? 'text-slate-400' : 'text-[#444653]'
                            }`}
                          >
                            {isEn ? 'or click to browse local files' : 'o haz clic para examinar archivos locales'}
                          </span>
                          <div
                            className={`mt-3 px-2.5 py-1 rounded-lg text-[10px] font-bold ${
                              isDark ? 'bg-slate-800 text-slate-300' : 'bg-[#e5eeff] text-[#444653]'
                            }`}
                          >
                            PDF, DOCX, ZIP or PSC (Max. 10 MB)
                          </div>
                        </div>
                      </div>

                      {/* Staged Files Container */}
                      <div className="flex flex-col gap-2">
                        {uploadedFiles.length === 0 ? (
                          <div
                            className={`flex items-center justify-between p-2.5 rounded-xl shadow-xs border ${
                              isDark ? 'bg-slate-950 border-slate-800' : 'bg-[#f8f9ff] border-[#e5eeff]'
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span
                                className={`material-symbols-outlined text-[20px] shrink-0 ${
                                  isDark ? 'text-slate-600' : 'text-[#757684]'
                                }`}
                              >
                                draft
                              </span>
                              <span
                                className={`text-xs italic truncate ${
                                  isDark ? 'text-slate-500' : 'text-[#757684]'
                                }`}
                              >
                                {isEn ? 'No files attached yet' : 'Ningún archivo cargado todavía'}
                              </span>
                            </div>
                            <span
                              className={`text-[11px] font-medium ${
                                isDark ? 'text-slate-500' : 'text-[#757684]'
                              }`}
                            >
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
                                <span
                                  className={`text-xs font-bold truncate ${
                                    isDark ? 'text-white' : 'text-[#0b1c30]'
                                  }`}
                                >
                                  {file.name}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 shrink-0 ml-2">
                                <span
                                  className={`text-[11px] font-medium ${
                                    isDark ? 'text-slate-400' : 'text-[#444653]'
                                  }`}
                                >
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
                          <label
                            className={`text-xs font-bold ${isDark ? 'text-white' : 'text-[#0b1c30]'}`}
                          >
                            {isEn ? 'Teacher notes' : 'Observaciones para el docente'}
                          </label>
                          <span
                            className={`text-[11px] ${
                              isDark ? 'text-slate-500' : 'text-[#757684]'
                            }`}
                          >
                            {studentNotes.length}/500
                          </span>
                        </div>
                        <textarea
                          value={studentNotes}
                          onChange={(e) => setStudentNotes(e.target.value)}
                          maxLength={500}
                          rows={3}
                          placeholder={
                            isEn
                              ? 'Add comments, details, or questions for your teacher...'
                              : 'Escribe aquí aclaraciones sobre tu entrega o notas para el docente...'
                          }
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
                          studentSubmission
                            ? isDark
                              ? 'bg-cyan-700 hover:bg-cyan-600'
                              : 'bg-[#1e40af] hover:bg-[#00288e]'
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
                        ) : studentSubmission ? (
                          <>
                            <span className="material-symbols-outlined text-[20px]">task_alt</span>
                            <span>{isEn ? 'Submitted! (Resubmit)' : '¡Tarea Entregada! (Actualizar Entrega)'}</span>
                          </>
                        ) : (
                          <>
                            <span className="material-symbols-outlined text-[20px]">send</span>
                            <span>{isEn ? 'Submit Solution' : 'Enviar Tarea Definitiva'}</span>
                          </>
                        )}
                      </button>

                      {/* Reassurance Notice */}
                      <div
                        className={`flex items-start gap-2.5 p-3 rounded-xl border ${
                          isDark
                            ? 'bg-slate-800/60 border-slate-700 text-slate-300'
                            : 'bg-[#eff4ff] border-[#dce9ff] text-[#444653]'
                        }`}
                      >
                        <span
                          className={`material-symbols-outlined text-[18px] shrink-0 mt-0.5 ${
                            isDark ? 'text-cyan-400' : 'text-[#0051d5]'
                          }`}
                        >
                          verified_user
                        </span>
                        <p className="text-xs leading-relaxed">
                          {isEn
                            ? 'Submissions are linked to your authenticated student profile and saved in the institutional database.'
                            : 'Las entregas quedan vinculadas a tu perfil de estudiante autenticado y registradas de forma segura en la base de datos institucional.'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          )}
        </main>
      </div>
    </div>
  );
};
