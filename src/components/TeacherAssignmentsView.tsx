import React, { useState, useEffect, useMemo, useRef } from 'react';
import { ActiveScreen, UserProfile } from '../types';
import { useThemeLanguage } from '../context/ThemeLanguageContext';
import {
  fetchAllInstitutionalAssignments,
  publishInstitutionalAssignment,
  fetchSubmissionsForAssignment,
  gradeStudentSubmission,
  InstitutionalAssignmentDoc,
  StudentSubmission,
  AssignmentAttachment
} from '../services/assignmentService';
import {
  getTeacherAssignedGroups,
  getTeacherSubjectArea,
  getTeacherAcademicAssignments
} from '../data/institutionalCensus';
import { TeacherSidebar } from './TeacherSidebar';
import { TeacherScheduleModal } from './TeacherScheduleModal';

interface TeacherAssignmentsViewProps {
  currentUser?: UserProfile | null;
  onNavigate: (screen: ActiveScreen) => void;
  onLogout: () => void;
  onUpdateUser?: (updated: UserProfile) => void;
}

export const TeacherAssignmentsView: React.FC<TeacherAssignmentsViewProps> = ({
  currentUser,
  onNavigate
}) => {
  const { theme, language } = useThemeLanguage();
  const isDark = theme === 'dark';
  const isEn = language === 'en';

  const teacherName = currentUser?.fullName || (isEn ? 'Teacher' : 'Docente');
  // Determina la asignatura asignada exclusivamente en la base de datos oficial
  const teacherArea = useMemo(() => {
    return getTeacherSubjectArea(currentUser?.fullName || currentUser?.documentId);
  }, [currentUser?.fullName, currentUser?.documentId]);

  // Grupos asignados exclusivamente al docente (nunca "Todos los grupos")
  const assignedGroups = useMemo<string[]>(() => {
    return getTeacherAssignedGroups(currentUser?.fullName || currentUser?.documentId || currentUser?.email);
  }, [currentUser?.fullName, currentUser?.documentId, currentUser?.email]);

  const [assignments, setAssignments] = useState<InstitutionalAssignmentDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGroup, setSelectedGroup] = useState<string>(() => assignedGroups[0] || '10°1');
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // New assignment modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newSubject, setNewSubject] = useState(teacherArea);
  const [newGroup, setNewGroup] = useState<string>(() => assignedGroups[0] || '10°1');
  const [newDueDate, setNewDueDate] = useState('2026-04-15');
  const [newDueText, setNewDueText] = useState('Miércoles 11:59 PM');
  const [newPoints, setNewPoints] = useState('20% (100 pts)');
  const [newUrgency, setNewUrgency] = useState<'regular' | 'urgente'>('regular');
  const [newInstructions, setNewInstructions] = useState('');

  // PDF Attachment State
  const [pdfFile, setPdfFile] = useState<{
    name: string;
    size: string;
    dataUrl: string;
  } | null>(null);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Submissions drawer/modal
  const [selectedAssignmentForReview, setSelectedAssignmentForReview] = useState<InstitutionalAssignmentDoc | null>(null);
  const [submissions, setSubmissions] = useState<StudentSubmission[]>([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<StudentSubmission | null>(null);
  const [gradeScore, setGradeScore] = useState<string>('4.5');
  const [gradeFeedback, setGradeFeedback] = useState<string>('');
  const [isGrading, setIsGrading] = useState(false);

  // Teacher Schedule Modal
  const [showScheduleModal, setShowScheduleModal] = useState(false);

  // Keep selectedGroup valid if assignedGroups change
  useEffect(() => {
    if (assignedGroups.length > 0 && !assignedGroups.includes(selectedGroup)) {
      setSelectedGroup(assignedGroups[0]);
    }
  }, [assignedGroups, selectedGroup]);

  // Keep newSubject synced with teacher's assigned area
  useEffect(() => {
    setNewSubject(teacherArea);
  }, [teacherArea]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadAssignments = async () => {
    setLoading(true);
    try {
      const data = await fetchAllInstitutionalAssignments();
      if (data && data.length > 0) {
        setAssignments(data);
      } else {
        setAssignments([]);
      }
    } catch (err) {
      console.warn('Error loading assignments:', err);
      setAssignments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAssignments();
  }, []);

  // Handle PDF file selection
  const handlePdfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPdfError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setPdfError(isEn ? 'Only PDF files are allowed.' : 'Solo se permiten archivos en formato PDF.');
      return;
    }

    // 15 MB limit for Base64 in Firestore
    if (file.size > 15 * 1024 * 1024) {
      setPdfError(isEn ? 'PDF file size must be under 15 MB.' : 'El archivo PDF no debe exceder 15 MB.');
      return;
    }

    const formattedSize = file.size > 1024 * 1024
      ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
      : `${Math.round(file.size / 1024)} KB`;

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setPdfFile({
        name: file.name,
        size: formattedSize,
        dataUrl: result
      });
    };
    reader.onerror = () => {
      setPdfError(isEn ? 'Error reading the PDF file.' : 'Error al procesar el archivo PDF.');
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePdf = () => {
    setPdfFile(null);
    setPdfError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      showToast(isEn ? 'Title is required' : 'El título es obligatorio');
      return;
    }

    setIsSubmitting(true);
    try {
      const attachment: AssignmentAttachment | undefined = pdfFile
        ? {
            name: pdfFile.name,
            size: pdfFile.size,
            type: 'application/pdf',
            dataUrl: pdfFile.dataUrl,
            uploadedAt: new Date().toISOString()
          }
        : undefined;

      const created = await publishInstitutionalAssignment({
        title: newTitle.trim(),
        subject: teacherArea,
        gradeLevel: newGroup,
        group: newGroup,
        teacherName: teacherName,
        teacherId: currentUser?.id || currentUser?.documentId || '',
        dueDate: newDueDate || '2026-04-15',
        dueText: newDueText || 'Fecha límite establecida',
        urgency: newUrgency,
        isPublished: true,
        type: pdfFile ? 'Documento PDF' : 'Taller / Evaluación',
        typeIcon: pdfFile ? 'picture_as_pdf' : 'assignment',
        points: newPoints,
        instructions: newInstructions,
        attachment
      });

      setAssignments(prev => [created, ...prev]);
      setShowCreateModal(false);
      setNewTitle('');
      setNewInstructions('');
      handleRemovePdf();
      showToast(isEn ? 'Assignment created and published successfully!' : '¡Tarea académica y archivo PDF publicados con éxito!');
    } catch (err) {
      console.error('Error creating assignment:', err);
      showToast(isEn ? 'Failed to create assignment' : 'Error al crear la tarea');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenReview = async (assignment: InstitutionalAssignmentDoc) => {
    setSelectedAssignmentForReview(assignment);
    setLoadingSubmissions(true);
    setSelectedSubmission(null);
    try {
      const subs = await fetchSubmissionsForAssignment(assignment.id);
      setSubmissions(subs);
    } catch (err) {
      console.warn('Error fetching submissions:', err);
      setSubmissions([]);
    } finally {
      setLoadingSubmissions(false);
    }
  };

  const handleGradeSubmission = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssignmentForReview || !selectedSubmission) return;

    const numericScore = parseFloat(gradeScore);
    if (isNaN(numericScore) || numericScore < 1.0 || numericScore > 5.0) {
      showToast(isEn ? 'Grade must be between 1.0 and 5.0' : 'La calificación debe estar entre 1.0 y 5.0');
      return;
    }

    setIsGrading(true);
    try {
      await gradeStudentSubmission(
        selectedAssignmentForReview.id,
        selectedSubmission.studentId,
        numericScore,
        gradeFeedback
      );

      // Update local state
      setSubmissions(prev =>
        prev.map(sub =>
          sub.id === selectedSubmission.id
            ? { ...sub, status: 'graded', score: numericScore }
            : sub
        )
      );
      setSelectedSubmission(null);
      showToast(isEn ? `Grade ${numericScore.toFixed(1)} registered successfully!` : `¡Calificación de ${numericScore.toFixed(1)} registrada correctamente!`);
    } catch (err) {
      console.error('Error grading submission:', err);
      showToast(isEn ? 'Error saving grade' : 'Error al guardar la calificación');
    } finally {
      setIsGrading(false);
    }
  };

  // Filtrado estricto: solo muestra tareas que coincidan con el grupo seleccionado y asignado al docente
  const filteredAssignments = useMemo(() => {
    const normSelected = selectedGroup.replace(/°/g, '-').replace(/_/g, '-');
    return assignments.filter(item => {
      const itemGroupNorm = (item.group || item.gradeLevel || '').replace(/°/g, '-').replace(/_/g, '-');
      const matchGroup = itemGroupNorm.includes(normSelected) || normSelected.includes(itemGroupNorm);
      const matchSearch =
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.subject.toLowerCase().includes(searchQuery.toLowerCase());
      return matchGroup && matchSearch;
    });
  }, [assignments, selectedGroup, searchQuery]);

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

      {/* Menú lateral docente unificado oficial */}
      <TeacherSidebar
        activeTab="assignments"
        onNavigate={onNavigate}
        onOpenSchedule={() => setShowScheduleModal(true)}
        currentUser={currentUser}
      />

      {/* MAIN CONTAINER */}
      <div className="flex-1 lg:pl-72 flex flex-col min-w-0">
        {/* HEADER BAR UNIFICADO */}
        <header className={`sticky top-12 h-20 backdrop-blur-xl shadow-xs z-30 px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4 border-b transition-colors ${
          isDark ? 'bg-slate-900/95 border-slate-800' : 'bg-white/95 border-[#e5eeff]'
        }`}>
          <div className="flex items-center gap-3.5 min-w-0">
            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-xs ${
              isDark ? 'bg-cyan-950 text-cyan-300 border border-cyan-800' : 'bg-[#eff4ff] text-[#00288e] border border-[#dce9ff]'
            }`}>
              <span className="material-symbols-outlined text-2xl">assignment</span>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className={`text-base sm:text-lg font-black tracking-tight truncate ${
                  isDark ? 'text-white' : 'text-[#0b1c30]'
                }`}>
                  {isEn ? 'Assignments & Workshops' : 'Tareas y Talleres'}
                </h1>
                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase tracking-wide border shrink-0 ${
                  isDark ? 'bg-cyan-950/80 text-cyan-300 border-cyan-800' : 'bg-[#e0eaff] text-[#00288e] border-[#ccdfff]'
                }`}>
                  {teacherArea}
                </span>
              </div>
              <p className={`text-xs truncate ${isDark ? 'text-slate-400' : 'text-[#444653]'}`}>
                {teacherName} • {isEn ? 'Assigned Groups' : 'Grupos Asignados'}: {assignedGroups.join(', ')} • I.E. Vallejuelos
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowCreateModal(true)}
              className={`h-11 px-4 sm:px-5 rounded-xl text-white shadow-xs hover:shadow-md transition-all flex items-center gap-2 text-xs font-bold cursor-pointer shrink-0 ${
                isDark ? 'bg-cyan-600 hover:bg-cyan-500' : 'bg-[#00288e] hover:bg-[#1e40af]'
              }`}
              type="button"
            >
              <span className="material-symbols-outlined text-lg">add_circle</span>
              <span className="hidden sm:inline">{isEn ? 'New Assignment' : 'Nueva Tarea / Taller'}</span>
              <span className="sm:hidden">{isEn ? 'New' : 'Nueva'}</span>
            </button>
          </div>
        </header>

        {/* CONTENIDO PRINCIPAL */}
        <main className="p-4 sm:p-6 lg:p-8 space-y-6">
          {/* Fila de controles: Selector de Grupo Asignado y Buscador */}
          <div className={`p-4 rounded-2xl border shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-[#e5eeff]'
          }`}>
            <div className="flex flex-wrap items-center gap-2">
              <span className={`text-xs font-bold mr-1 ${isDark ? 'text-slate-400' : 'text-[#444653]'}`}>
                {isEn ? 'Assigned Group:' : 'Grupo Asignado:'}
              </span>
              {assignedGroups.map(grp => (
                <button
                  key={grp}
                  type="button"
                  onClick={() => setSelectedGroup(grp)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                    selectedGroup === grp
                      ? isDark
                        ? 'bg-cyan-600 text-white border-cyan-500 shadow-xs'
                        : 'bg-[#00288e] text-white border-[#00288e] shadow-xs'
                      : isDark
                      ? 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-800'
                      : 'bg-[#eff4ff] text-[#0b1c30] border-[#dce9ff] hover:bg-[#dce9ff]'
                  }`}
                >
                  {grp}
                </button>
              ))}
            </div>

            <div className="relative w-full md:w-72">
              <span className={`material-symbols-outlined absolute left-3 top-2.5 text-lg ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                search
              </span>
              <input
                type="text"
                placeholder={isEn ? 'Search assignment...' : 'Buscar tarea o tema...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full h-10 pl-9 pr-4 rounded-xl text-xs border focus:outline-none transition-all ${
                  isDark
                    ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500 focus:border-cyan-500'
                    : 'bg-[#f8f9ff] border-[#dce9ff] text-[#0b1c30] placeholder-slate-400 focus:border-[#00288e]'
                }`}
              />
            </div>
          </div>

          {/* Resumen métrico del grupo */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className={`rounded-2xl p-4 shadow-xs border ${
              isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-[#e5eeff]'
            }`}>
              <div className="flex items-center justify-between">
                <span className={`text-xs font-bold ${isDark ? 'text-slate-400' : 'text-[#444653]'}`}>
                  {isEn ? 'Tasks in Group' : 'Tareas en este Grupo'}
                </span>
                <span className="material-symbols-outlined text-lg text-cyan-500">assignment</span>
              </div>
              <p className="text-2xl font-black mt-2">{filteredAssignments.length}</p>
              <span className="text-[11px] text-slate-500">Grupo {selectedGroup}</span>
            </div>

            <div className={`rounded-2xl p-4 shadow-xs border ${
              isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-[#e5eeff]'
            }`}>
              <div className="flex items-center justify-between">
                <span className={`text-xs font-bold ${isDark ? 'text-slate-400' : 'text-[#444653]'}`}>
                  {isEn ? 'With Attached PDF' : 'Con PDF Adjunto'}
                </span>
                <span className="material-symbols-outlined text-lg text-rose-500">picture_as_pdf</span>
              </div>
              <p className="text-2xl font-black mt-2 text-rose-500">
                {filteredAssignments.filter(a => a.attachment).length}
              </p>
              <span className="text-[11px] text-slate-500">{isEn ? 'Available for students' : 'Listos para descarga'}</span>
            </div>

            <div className={`rounded-2xl p-4 shadow-xs border ${
              isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-[#e5eeff]'
            }`}>
              <div className="flex items-center justify-between">
                <span className={`text-xs font-bold ${isDark ? 'text-slate-400' : 'text-[#444653]'}`}>
                  {isEn ? 'Subject' : 'Asignatura Asignada'}
                </span>
                <span className="material-symbols-outlined text-lg text-indigo-500">auto_stories</span>
              </div>
              <p className="text-sm font-black mt-2 truncate text-indigo-600 dark:text-indigo-400">{teacherArea}</p>
              <span className="text-[11px] text-slate-500">{isEn ? 'Verified in census' : 'Oficial en la base de datos'}</span>
            </div>

            <div className={`rounded-2xl p-4 shadow-xs border ${
              isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-[#e5eeff]'
            }`}>
              <div className="flex items-center justify-between">
                <span className={`text-xs font-bold ${isDark ? 'text-slate-400' : 'text-[#444653]'}`}>
                  {isEn ? 'Academic Shift' : 'Jornada Escolar'}
                </span>
                <span className="material-symbols-outlined text-lg text-amber-500">schedule</span>
              </div>
              <p className="text-sm font-bold mt-2">6:15 AM - 12:15 PM</p>
              <span className="text-[11px] text-slate-500">Descanso: 9:00 - 9:30 AM</span>
            </div>
          </div>

          {/* LISTADO DE TAREAS Y TALLERES */}
          {loading ? (
            <div className="py-20 text-center">
              <span className="material-symbols-outlined text-4xl animate-spin text-cyan-500">
                progress_activity
              </span>
              <p className="text-xs font-bold mt-3 text-slate-400">
                {isEn ? 'Loading institutional assignments...' : 'Consultando tareas institucionales en la base de datos...'}
              </p>
            </div>
          ) : filteredAssignments.length === 0 ? (
            <div className={`p-12 rounded-3xl border text-center ${
              isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-[#e5eeff]'
            }`}>
              <div className="w-16 h-16 rounded-2xl bg-cyan-500/15 text-cyan-500 flex items-center justify-center mx-auto mb-4">
                <span className="material-symbols-outlined text-3xl">assignment_add</span>
              </div>
              <h3 className="text-base font-bold">
                {isEn ? `No assignments for group ${selectedGroup}` : `No hay tareas publicadas para el grupo ${selectedGroup}`}
              </h3>
              <p className={`text-xs max-w-md mx-auto mt-2 ${isDark ? 'text-slate-400' : 'text-[#444653]'}`}>
                {isEn
                  ? 'Click "New Assignment" above to publish a task with guidelines and an attached PDF document for your students.'
                  : 'Pulsa el botón "+ Nueva Tarea / Taller" para publicar una actividad académica con instrucciones y archivo PDF adjunto.'}
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                className={`mt-5 px-5 py-2.5 rounded-xl text-white text-xs font-bold transition-all cursor-pointer ${
                  isDark ? 'bg-cyan-600 hover:bg-cyan-500' : 'bg-[#00288e] hover:bg-[#1e40af]'
                }`}
                type="button"
              >
                + {isEn ? 'Create Assignment' : 'Publicar Tarea Ahora'}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {filteredAssignments.map((assignment) => (
                <div
                  key={assignment.id}
                  className={`rounded-2xl p-6 border shadow-xs hover:shadow-md transition-all flex flex-col justify-between ${
                    isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-[#e5eeff]'
                  }`}
                >
                  <div className="space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border ${
                            isDark ? 'bg-cyan-950 text-cyan-300 border-cyan-800' : 'bg-[#e0eaff] text-[#00288e] border-[#ccdfff]'
                          }`}>
                            {assignment.subject}
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                            Grupo {assignment.group || assignment.gradeLevel}
                          </span>
                          {assignment.points && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                              {assignment.points}
                            </span>
                          )}
                        </div>
                        <h3 className="text-base font-bold mt-2 leading-snug">
                          {assignment.title}
                        </h3>
                      </div>
                    </div>

                    <p className={`text-xs leading-relaxed line-clamp-3 ${isDark ? 'text-slate-300' : 'text-[#444653]'}`}>
                      {assignment.instructions || (isEn ? 'No instructions provided.' : 'Sin instrucciones adicionales.')}
                    </p>

                    {/* PDF ADJUNTO OFICIAL */}
                    {assignment.attachment ? (
                      <div className={`p-3 rounded-xl border flex items-center justify-between gap-3 ${
                        isDark ? 'bg-slate-800/70 border-slate-700' : 'bg-rose-50/50 border-rose-200/70'
                      }`}>
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="material-symbols-outlined text-rose-500 text-2xl shrink-0">
                            picture_as_pdf
                          </span>
                          <div className="min-w-0">
                            <p className="text-xs font-bold truncate text-slate-800 dark:text-slate-100">
                              {assignment.attachment.name}
                            </p>
                            <span className="text-[10px] text-slate-500 font-medium">
                              {assignment.attachment.size} • PDF Oficial
                            </span>
                          </div>
                        </div>

                        <a
                          href={assignment.attachment.dataUrl}
                          download={assignment.attachment.name}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer ${
                            isDark
                              ? 'bg-slate-700 hover:bg-slate-600 text-cyan-300'
                              : 'bg-white hover:bg-rose-100 text-rose-700 border border-rose-200 shadow-xs'
                          }`}
                        >
                          <span className="material-symbols-outlined text-sm">download</span>
                          <span>{isEn ? 'Download' : 'Descargar'}</span>
                        </a>
                      </div>
                    ) : (
                      <div className={`p-2.5 rounded-xl border text-xs text-slate-400 italic flex items-center gap-2 ${
                        isDark ? 'bg-slate-950/40 border-slate-800/80' : 'bg-slate-50 border-slate-200/60'
                      }`}>
                        <span className="material-symbols-outlined text-sm">info</span>
                        <span>{isEn ? 'No PDF file attached to this assignment' : 'Sin documento PDF adjunto'}</span>
                      </div>
                    )}
                  </div>

                  <div className={`mt-5 pt-4 border-t flex items-center justify-between gap-2 ${
                    isDark ? 'border-slate-800' : 'border-[#eff4ff]'
                  }`}>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                      <span className="material-symbols-outlined text-sm">event</span>
                      <span>{assignment.dueText || assignment.dueDate}</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleOpenReview(assignment)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
                        isDark
                          ? 'bg-slate-800 hover:bg-slate-700 text-cyan-300 border-slate-700'
                          : 'bg-[#eff4ff] hover:bg-[#dce9ff] text-[#00288e] border-[#dce9ff]'
                      }`}
                    >
                      <span className="material-symbols-outlined text-sm">fact_check</span>
                      <span>{isEn ? 'Review Submissions' : 'Revisar Entregas'}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>

      {/* MODAL: CREAR TAREA Y ADJUNTAR PDF */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className={`w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden border animate-in zoom-in-95 duration-150 ${
            isDark ? 'bg-slate-900 border-slate-700 text-slate-100 shadow-black/80' : 'bg-white border-[#e5eeff] text-[#0b1c30]'
          }`}>
            <div className={`p-5 text-white flex items-center justify-between ${
              isDark ? 'bg-gradient-to-r from-slate-950 via-slate-900 to-cyan-950 border-b border-cyan-500/20' : 'bg-gradient-to-r from-[#00288e] to-[#1e40af]'
            }`}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-white">
                  <span className="material-symbols-outlined text-[24px]">assignment</span>
                </div>
                <div>
                  <h3 className="text-base font-bold leading-tight">
                    {isEn ? 'Publish Academic Task / PDF' : 'Publicar Tarea o Taller con PDF'}
                  </h3>
                  <p className="text-xs text-cyan-200">
                    {teacherArea} • {teacherName} • I.E. Vallejuelos
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowCreateModal(false);
                  handleRemovePdf();
                }}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <form onSubmit={handleCreateAssignment} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <div>
                <label className="block text-xs font-bold mb-1.5">
                  {isEn ? 'Assignment Title *' : 'Título de la Tarea o Taller *'}
                </label>
                <input
                  type="text"
                  required
                  placeholder={isEn ? 'e.g. Workshop: Ethical Dilemmas & Values' : 'Ej: Taller 1: Dilemas éticos y proyecto de vida'}
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className={`w-full h-11 px-4 rounded-xl text-xs border focus:outline-none transition-all ${
                    isDark
                      ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500 focus:border-cyan-500'
                      : 'bg-[#f8f9ff] border-[#dce9ff] text-[#0b1c30] placeholder-slate-400 focus:border-[#00288e]'
                  }`}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold mb-1.5">
                    {isEn ? 'Assigned Subject' : 'Asignatura Asignada'}
                  </label>
                  <input
                    type="text"
                    readOnly
                    value={teacherArea}
                    className={`w-full h-11 px-4 rounded-xl text-xs border font-bold cursor-not-allowed ${
                      isDark ? 'bg-slate-800/50 border-slate-700 text-cyan-300' : 'bg-slate-100 border-[#dce9ff] text-[#00288e]'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold mb-1.5">
                    {isEn ? 'Assigned Group *' : 'Grupo Asignado *'}
                  </label>
                  <select
                    value={newGroup}
                    onChange={(e) => setNewGroup(e.target.value)}
                    className={`w-full h-11 px-4 rounded-xl text-xs border focus:outline-none transition-all font-bold ${
                      isDark
                        ? 'bg-slate-800 border-slate-700 text-white focus:border-cyan-500'
                        : 'bg-[#f8f9ff] border-[#dce9ff] text-[#0b1c30] focus:border-[#00288e]'
                    }`}
                  >
                    {assignedGroups.map(grp => (
                      <option key={grp} value={grp}>
                        Grupo {grp}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold mb-1.5">
                    {isEn ? 'Due Date' : 'Fecha Límite'}
                  </label>
                  <input
                    type="date"
                    value={newDueDate}
                    onChange={(e) => setNewDueDate(e.target.value)}
                    className={`w-full h-11 px-4 rounded-xl text-xs border focus:outline-none transition-all ${
                      isDark
                        ? 'bg-slate-800 border-slate-700 text-white focus:border-cyan-500'
                        : 'bg-[#f8f9ff] border-[#dce9ff] text-[#0b1c30] focus:border-[#00288e]'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold mb-1.5">
                    {isEn ? 'Academic Weight / Points' : 'Ponderación / Calificación'}
                  </label>
                  <input
                    type="text"
                    placeholder="20% (100 pts)"
                    value={newPoints}
                    onChange={(e) => setNewPoints(e.target.value)}
                    className={`w-full h-11 px-4 rounded-xl text-xs border focus:outline-none transition-all ${
                      isDark
                        ? 'bg-slate-800 border-slate-700 text-white focus:border-cyan-500'
                        : 'bg-[#f8f9ff] border-[#dce9ff] text-[#0b1c30] focus:border-[#00288e]'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold mb-1.5">
                  {isEn ? 'Instructions for Students' : 'Instrucciones Pedagógicas'}
                </label>
                <textarea
                  rows={3}
                  placeholder={isEn ? 'Detailed steps, submission guidelines, questions...' : 'Detalla los puntos a desarrollar, criterios de evaluación y lineamientos de entrega...'}
                  value={newInstructions}
                  onChange={(e) => setNewInstructions(e.target.value)}
                  className={`w-full p-3.5 rounded-xl text-xs border focus:outline-none transition-all ${
                    isDark
                      ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500 focus:border-cyan-500'
                      : 'bg-[#f8f9ff] border-[#dce9ff] text-[#0b1c30] placeholder-slate-400 focus:border-[#00288e]'
                  }`}
                />
              </div>

              {/* CARGA DE ARCHIVO PDF OFICIAL */}
              <div className="pt-2">
                <label className="block text-xs font-bold mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-rose-500 text-base">picture_as_pdf</span>
                    {isEn ? 'Attach PDF File (Required for workshops)' : 'Adjuntar Documento PDF de la Tarea'}
                  </span>
                  <span className="text-[11px] text-slate-400 font-normal">Máx 15 MB</span>
                </label>

                {pdfFile ? (
                  <div className={`p-4 rounded-2xl border flex items-center justify-between gap-3 ${
                    isDark ? 'bg-slate-800 border-cyan-500/40 text-slate-100' : 'bg-emerald-50/70 border-emerald-300 text-emerald-900'
                  }`}>
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-rose-500/15 text-rose-500 flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-2xl">picture_as_pdf</span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold truncate">{pdfFile.name}</p>
                        <p className="text-[11px] text-slate-500">{pdfFile.size} • Listo para almacenar</p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleRemovePdf}
                      className="w-8 h-8 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 flex items-center justify-center transition-colors cursor-pointer shrink-0"
                      title={isEn ? 'Remove file' : 'Quitar archivo'}
                    >
                      <span className="material-symbols-outlined text-base">delete</span>
                    </button>
                  </div>
                ) : (
                  <div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="application/pdf,.pdf"
                      onChange={handlePdfChange}
                      className="hidden"
                      id="pdf-upload-input"
                    />
                    <label
                      htmlFor="pdf-upload-input"
                      className={`w-full p-5 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-2 cursor-pointer transition-all ${
                        isDark
                          ? 'border-slate-700 bg-slate-800/40 hover:border-cyan-500 hover:bg-cyan-950/20'
                          : 'border-slate-300 bg-slate-50/80 hover:border-[#00288e] hover:bg-blue-50/40'
                      }`}
                    >
                      <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center">
                        <span className="material-symbols-outlined text-2xl">upload_file</span>
                      </div>
                      <div className="text-center">
                        <p className="text-xs font-bold">
                          {isEn ? 'Click to select and upload a PDF' : 'Haz clic para seleccionar y cargar un archivo PDF'}
                        </p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {isEn ? 'Students of this group will be able to consult and download it' : 'Quedará guardado de forma persistente para tus estudiantes'}
                        </p>
                      </div>
                    </label>
                  </div>
                )}

                {pdfError && (
                  <p className="text-[11px] text-rose-500 font-bold mt-1.5 flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs">error</span>
                    {pdfError}
                  </p>
                )}
              </div>

              <div className={`pt-4 border-t flex items-center justify-end gap-3 ${
                isDark ? 'border-slate-800' : 'border-[#eff4ff]'
              }`}>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    handleRemovePdf();
                  }}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isDark ? 'bg-slate-800 hover:bg-slate-700 text-white' : 'bg-slate-200 hover:bg-slate-300 text-slate-800'
                  }`}
                >
                  {isEn ? 'Cancel' : 'Cancelar'}
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`px-6 py-2.5 rounded-xl text-white text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-md disabled:opacity-50 ${
                    isDark ? 'bg-cyan-600 hover:bg-cyan-500' : 'bg-[#00288e] hover:bg-[#1e40af]'
                  }`}
                >
                  <span className="material-symbols-outlined text-base">cloud_upload</span>
                  <span>{isSubmitting ? (isEn ? 'Publishing...' : 'Publicando...') : (isEn ? 'Publish Assignment' : 'Publicar Tarea')}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DRAWER / MODAL: REVISAR ENTREGAS DE ESTUDIANTES */}
      {selectedAssignmentForReview && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className={`w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden border animate-in zoom-in-95 duration-150 ${
            isDark ? 'bg-slate-900 border-slate-700 text-slate-100 shadow-black/80' : 'bg-white border-[#e5eeff] text-[#0b1c30]'
          }`}>
            <div className={`p-5 text-white flex items-center justify-between ${
              isDark ? 'bg-gradient-to-r from-slate-950 via-slate-900 to-cyan-950 border-b border-cyan-500/20' : 'bg-gradient-to-r from-[#00288e] to-[#1e40af]'
            }`}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-white">
                  <span className="material-symbols-outlined text-[24px]">fact_check</span>
                </div>
                <div>
                  <h3 className="text-base font-bold leading-tight">
                    {isEn ? 'Student Submissions' : 'Entregas de Estudiantes'}
                  </h3>
                  <p className="text-xs text-cyan-200">
                    {selectedAssignmentForReview.title} • Grupo {selectedAssignmentForReview.group || selectedAssignmentForReview.gradeLevel}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedAssignmentForReview(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="p-6 max-h-[70vh] overflow-y-auto space-y-4">
              {loadingSubmissions ? (
                <div className="py-12 text-center">
                  <span className="material-symbols-outlined text-3xl animate-spin text-cyan-500">progress_activity</span>
                  <p className="text-xs font-bold mt-2 text-slate-400">
                    {isEn ? 'Loading student submissions...' : 'Consultando entregas en la base de datos...'}
                  </p>
                </div>
              ) : submissions.length === 0 ? (
                <div className="py-12 text-center">
                  <span className="material-symbols-outlined text-4xl text-slate-400">hourglass_empty</span>
                  <h4 className="text-sm font-bold mt-2">
                    {isEn ? 'No submissions registered yet' : 'Aún no hay entregas de estudiantes para esta tarea'}
                  </h4>
                  <p className={`text-xs max-w-sm mx-auto mt-1 ${isDark ? 'text-slate-400' : 'text-[#64748b]'}`}>
                    {isEn
                      ? 'When students submit their solutions or attachments, they will appear here for grading.'
                      : 'Cuando los estudiantes del grupo adjunten sus soluciones y envíen su trabajo, aparecerán listados aquí para calificar.'}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {submissions.map((sub) => (
                    <div
                      key={sub.id}
                      className={`p-4 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                        isDark ? 'bg-slate-800/80 border-slate-700' : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div>
                        <h4 className="text-xs font-bold">{sub.studentName}</h4>
                        <p className="text-[11px] text-slate-500">
                          {isEn ? 'Submitted on' : 'Enviado el'}: {new Date(sub.submittedAt).toLocaleString()}
                        </p>
                        {sub.files && sub.files.length > 0 && (
                          <div className="flex items-center gap-1.5 mt-1">
                            <span className="material-symbols-outlined text-xs text-rose-500">attach_file</span>
                            <span className="text-[10px] font-semibold text-slate-400">
                              {sub.files.map(f => f.name).join(', ')}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {sub.status === 'graded' && sub.score !== undefined ? (
                          <span className="px-3 py-1 rounded-xl text-xs font-extrabold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                            {sub.score.toFixed(1)} / 5.0
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setSelectedSubmission(sub)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                              isDark ? 'bg-cyan-600 hover:bg-cyan-500 text-white' : 'bg-[#00288e] hover:bg-[#1e40af] text-white'
                            }`}
                          >
                            {isEn ? 'Grade' : 'Calificar'}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Formulario de Calificación */}
              {selectedSubmission && (
                <form onSubmit={handleGradeSubmission} className={`p-4 rounded-2xl border mt-4 ${
                  isDark ? 'bg-slate-950 border-cyan-500/30' : 'bg-white border-blue-200'
                }`}>
                  <h4 className="text-xs font-bold mb-3 flex items-center gap-1.5 text-cyan-500">
                    <span className="material-symbols-outlined text-base">grade</span>
                    {isEn ? `Calificar entrega de ${selectedSubmission.studentName}` : `Calificar entrega de ${selectedSubmission.studentName}`}
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                    <div>
                      <label className="block text-[11px] font-bold mb-1">
                        {isEn ? 'Score (1.0 to 5.0)' : 'Nota (1.0 a 5.0)'}
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        min="1.0"
                        max="5.0"
                        value={gradeScore}
                        onChange={(e) => setGradeScore(e.target.value)}
                        className={`w-full h-10 px-3 rounded-xl text-xs border font-bold ${
                          isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                        }`}
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold mb-1">
                        {isEn ? 'Feedback / Notes' : 'Retroalimentación Pedagógica'}
                      </label>
                      <input
                        type="text"
                        placeholder={isEn ? 'Well done! Excellent analysis.' : 'Excelente análisis y resolución.'}
                        value={gradeFeedback}
                        onChange={(e) => setGradeFeedback(e.target.value)}
                        className={`w-full h-10 px-3 rounded-xl text-xs border ${
                          isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                        }`}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedSubmission(null)}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-400 hover:text-white"
                    >
                      {isEn ? 'Cancel' : 'Cancelar'}
                    </button>
                    <button
                      type="submit"
                      disabled={isGrading}
                      className={`px-4 py-1.5 rounded-lg text-xs font-bold text-white ${
                        isDark ? 'bg-cyan-600 hover:bg-cyan-500' : 'bg-[#00288e] hover:bg-[#1e40af]'
                      }`}
                    >
                      {isGrading ? (isEn ? 'Saving...' : 'Guardando...') : (isEn ? 'Save Grade' : 'Guardar Calificación')}
                    </button>
                  </div>
                </form>
              )}
            </div>

            <div className={`p-4 border-t flex justify-end ${
              isDark ? 'bg-slate-950 border-slate-800' : 'bg-[#f8faff] border-[#eff4ff]'
            }`}>
              <button
                type="button"
                onClick={() => setSelectedAssignmentForReview(null)}
                className={`px-5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  isDark ? 'bg-slate-800 hover:bg-slate-700 text-white' : 'bg-slate-200 hover:bg-slate-300 text-slate-800'
                }`}
              >
                {isEn ? 'Close' : 'Cerrar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Horario Propio */}
      {showScheduleModal && (
        <TeacherScheduleModal
          currentUser={currentUser}
          isOpen={showScheduleModal}
          onClose={() => setShowScheduleModal(false)}
        />
      )}
    </div>
  );
};
