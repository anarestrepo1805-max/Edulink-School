import React, { useState, useEffect, useMemo, useRef } from 'react';
import { ActiveScreen, UserProfile } from '../types';
import { useThemeLanguage } from '../context/ThemeLanguageContext';
import {
  fetchAllInstitutionalAssignments,
  publishInstitutionalAssignment,
  fetchSubmissionsForAssignment,
  gradeStudentSubmission,
  InstitutionalAssignmentDoc,
  StudentSubmission
} from '../services/assignmentService';
import {
  getTeacherAcademicAssignments,
  TeacherAcademicAssignment
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
  onNavigate,
  onLogout
}) => {
  const { theme, language } = useThemeLanguage();
  const isDark = theme === 'dark';
  const isEn = language === 'en';

  const teacherName = currentUser?.fullName || 'Patricia Quintero';

  // Obtenemos de forma estricta las asignaturas y grupos asignados al docente autenticado
  const teacherAssignments = useMemo<TeacherAcademicAssignment[]>(() => {
    return getTeacherAcademicAssignments(
      currentUser?.fullName || currentUser?.documentId || currentUser?.email,
      currentUser?.subjectArea,
      currentUser?.assignedGrades
    );
  }, [currentUser?.fullName, currentUser?.documentId, currentUser?.email, currentUser?.subjectArea, currentUser?.assignedGrades]);

  const teacherArea = teacherAssignments[0]?.subjectName || currentUser?.subjectArea || 'Filosofía de vida';

  const [assignments, setAssignments] = useState<InstitutionalAssignmentDoc[]>([]);
  const [loading, setLoading] = useState(true);

  // El grupo seleccionado se inicia en el primer grupo asignado al docente (NUNCA "all")
  const [selectedGroup, setSelectedGroup] = useState<string>(() => {
    return teacherAssignments[0]?.groupKey || '10-1';
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // New assignment modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newGroup, setNewGroup] = useState<string>(() => {
    return teacherAssignments[0]?.groupKey || '10-1';
  });
  const [newDueDate, setNewDueDate] = useState('');
  const [newDueText, setNewDueText] = useState('Próximo lunes 11:59 PM');
  const [newType, setNewType] = useState('Taller en PDF');
  const [newPoints, setNewPoints] = useState('20% (100 pts)');
  const [newUrgency, setNewUrgency] = useState<'regular' | 'urgente'>('regular');
  const [newInstructions, setNewInstructions] = useState('');

  // PDF Attachment State
  const [pdfAttachment, setPdfAttachment] = useState<{
    file: File;
    name: string;
    sizeFormatted: string;
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

  // Update selectedGroup if teacherAssignments changes and selectedGroup is invalid
  useEffect(() => {
    if (teacherAssignments.length > 0) {
      const valid = teacherAssignments.some(asg => asg.groupKey === selectedGroup);
      if (!valid) {
        setSelectedGroup(teacherAssignments[0].groupKey);
      }
    }
  }, [teacherAssignments, selectedGroup]);

  // Manejo de carga y validación de archivos PDF (Máx 5MB, solo .pdf)
  const handlePdfFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPdfError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const isPdf = file.name.toLowerCase().endsWith('.pdf') || file.type === 'application/pdf';
    if (!isPdf) {
      setPdfError(isEn ? 'Only PDF (.pdf) files are allowed' : 'Solo se permiten archivos en formato PDF (.pdf)');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
    if (file.size > MAX_SIZE_BYTES) {
      setPdfError(isEn ? 'PDF file must not exceed 5 MB' : 'El archivo PDF supera el límite de 5 MB permitidos');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    const formatBytes = (bytes: number): string => {
      if (bytes < 1024 * 1024) {
        return `${(bytes / 1024).toFixed(1)} KB`;
      }
      return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    };

    const reader = new FileReader();
    reader.onload = () => {
      setPdfAttachment({
        file,
        name: file.name,
        sizeFormatted: formatBytes(file.size),
        dataUrl: reader.result as string
      });
    };
    reader.onerror = () => {
      setPdfError(isEn ? 'Error reading PDF file' : 'Error al procesar el archivo PDF');
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePdf = () => {
    setPdfAttachment(null);
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

    const assignedGroupObj = teacherAssignments.find(a => a.groupKey === newGroup) || teacherAssignments[0];
    const groupDisplay = assignedGroupObj?.group || newGroup;

    setIsSubmitting(true);
    try {
      const created = await publishInstitutionalAssignment({
        title: newTitle.trim(),
        subject: teacherArea,
        gradeLevel: groupDisplay,
        group: newGroup,
        teacherName: teacherName,
        teacherId: currentUser?.id || '',
        dueDate: newDueDate || '2026-04-15',
        dueText: newDueText || 'Fecha límite establecida',
        urgency: newUrgency,
        isPublished: true,
        type: newType,
        typeIcon: pdfAttachment ? 'picture_as_pdf' : 'assignment',
        points: newPoints,
        instructions: newInstructions,
        pdfUrl: pdfAttachment?.dataUrl,
        pdfName: pdfAttachment?.name,
        pdfSize: pdfAttachment?.sizeFormatted
      });
      setAssignments(prev => [created, ...prev]);
      setShowCreateModal(false);
      setNewTitle('');
      setNewInstructions('');
      setPdfAttachment(null);
      setPdfError(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      showToast(isEn ? 'Assignment published successfully with PDF!' : '¡Tarea pedagógica publicada exitosamente con PDF adjunto!');
    } catch (err) {
      console.error('Error creating assignment:', err);
      showToast(isEn ? 'Failed to publish assignment' : 'Error al publicar la tarea');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenReview = async (assignment: InstitutionalAssignmentDoc) => {
    setSelectedAssignmentForReview(assignment);
    setSelectedSubmission(null);
    setLoadingSubmissions(true);
    try {
      const subs = await fetchSubmissionsForAssignment(assignment.id);
      setSubmissions(subs);
      if (subs.length > 0) {
        setSelectedSubmission(subs[0]);
        setGradeScore(subs[0].score ? subs[0].score.toString() : '4.5');
        setGradeFeedback(subs[0].notes || '');
      }
    } catch (err) {
      console.warn('Error fetching submissions:', err);
      setSubmissions([]);
    } finally {
      setLoadingSubmissions(false);
    }
  };

  const handleGradeSubmission = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubmission || !selectedAssignmentForReview) return;
    const num = parseFloat(gradeScore);
    if (isNaN(num) || num < 1.0 || num > 5.0) {
      showToast(isEn ? 'Score must be between 1.0 and 5.0' : 'La nota debe estar entre 1.0 y 5.0');
      return;
    }
    setIsGrading(true);
    try {
      await gradeStudentSubmission(
        selectedAssignmentForReview.id,
        selectedSubmission.studentId || selectedSubmission.id,
        num,
        gradeFeedback
      );
      setSubmissions(prev => prev.map(s => s.id === selectedSubmission.id ? { ...s, score: num, status: 'graded', notes: gradeFeedback } : s));
      setSelectedSubmission(prev => prev ? { ...prev, score: num, status: 'graded', notes: gradeFeedback } : null);
      showToast(isEn ? 'Submission graded successfully!' : '¡Entrega calificada exitosamente en el censo!');
    } catch (err) {
      console.error('Error grading:', err);
      showToast(isEn ? 'Failed to save grade' : 'Error al guardar la calificación');
    } finally {
      setIsGrading(false);
    }
  };

  // Filtrar tareas por los grupos que tiene asignados el docente y por el grupo activo
  const filteredAssignments = useMemo(() => {
    const allowedGroupKeys = new Set(teacherAssignments.map(a => a.groupKey.toLowerCase()));
    const allowedGroupDisplays = new Set(teacherAssignments.map(a => a.group.toLowerCase()));

    return assignments.filter((asg) => {
      // Debe corresponder a la asignatura del docente
      const asgSubj = (asg.subject || '').toLowerCase();
      const matchSubject = asgSubj.includes(teacherArea.toLowerCase()) || teacherArea.toLowerCase().includes(asgSubj);

      // Debe pertenecer a un grupo asignado al docente
      const asgGrp = (asg.group || asg.gradeLevel || '').toLowerCase().replace('°', '-');
      const isAllowedGroup = allowedGroupKeys.has(asgGrp) || allowedGroupDisplays.has(asg.group?.toLowerCase() || '') || allowedGroupDisplays.has(asg.gradeLevel?.toLowerCase() || '');

      // Filtro de grupo activo seleccionado
      const matchesGroupFilter = selectedGroup
        ? asgGrp === selectedGroup.toLowerCase() || (asg.gradeLevel || '').replace('°', '-') === selectedGroup.toLowerCase()
        : true;

      const matchesSearch = !searchQuery.trim() ||
        asg.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        asg.subject.toLowerCase().includes(searchQuery.toLowerCase());

      return (matchSubject || isAllowedGroup) && matchesGroupFilter && matchesSearch;
    });
  }, [assignments, selectedGroup, searchQuery, teacherAssignments, teacherArea]);

  return (
    <div className={`min-h-screen flex flex-col selection:bg-cyan-500 selection:text-white ${
      isDark ? 'bg-slate-950 text-slate-100' : 'bg-[#f4f7fb] text-[#0b1c30]'
    }`}>
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-16 right-4 z-50 bg-slate-900 border border-cyan-500/40 text-cyan-300 px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 text-xs font-bold animate-in fade-in duration-200">
          <span className="material-symbols-outlined text-[18px]">check_circle</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Menú lateral docente oficial unificado */}
      <TeacherSidebar
        activeTab="assignments"
        onNavigate={onNavigate}
        onOpenSchedule={() => setShowScheduleModal(true)}
        currentUser={currentUser}
      />

      {/* Modal Horario Propio */}
      {showScheduleModal && (
        <TeacherScheduleModal
          isOpen={showScheduleModal}
          onClose={() => setShowScheduleModal(false)}
          teacherName={teacherName}
          teacherDoc={currentUser?.documentId}
        />
      )}

      {/* MAIN CONTAINER: Con padding izquierdo fijo lg:pl-72 para evitar desbordes y superposiciones */}
      <div className="flex-1 lg:pl-72 flex flex-col min-w-0">
        {/* SUBHEADER FIJO */}
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
                placeholder={isEn ? 'Search assignment by title or subject...' : 'Buscar tarea por título o descripción...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full h-11 pl-10 pr-4 rounded-xl text-xs focus:outline-none transition-all border ${
                  isDark
                    ? 'bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus:border-cyan-500'
                    : 'bg-[#eff4ff] border-transparent text-[#0b1c30] placeholder:text-[#757684] focus:border-[#0051d5]'
                }`}
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowCreateModal(true)}
              className="h-11 px-5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-cyan-600/20 cursor-pointer transition-transform active:scale-95 flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-lg">add_circle</span>
              <span>{isEn ? '+ New Assignment' : '+ Nueva Tarea'}</span>
            </button>
          </div>
        </header>

        {/* CONTENIDO PRINCIPAL */}
        <main className="p-4 sm:p-6 lg:p-8 space-y-6">
          {/* Header Card Informativo */}
          <div className={`p-6 rounded-2xl border shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-[#e5eeff]'
          }`}>
            <div>
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                  isDark ? 'bg-cyan-950 text-cyan-300 border border-cyan-800/50' : 'bg-[#dce9ff] text-[#00288e]'
                }`}>
                  {teacherArea}
                </span>
                <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-[#757684]'}`}>
                  • Docente: <strong className={isDark ? 'text-white' : 'text-[#0b1c30]'}>{teacherName}</strong> • I.E. Vallejuelos
                </span>
              </div>
              <h1 className={`text-xl sm:text-2xl font-black tracking-tight ${isDark ? 'text-white' : 'text-[#0b1c30]'}`}>
                {isEn ? 'Assignments & Workshops' : 'Tareas y Talleres Pedagógicos'}
              </h1>
              <p className={`text-xs sm:text-sm mt-1 max-w-2xl ${isDark ? 'text-slate-400' : 'text-[#444653]'}`}>
                {isEn
                  ? 'Publish homework, attach study PDF guides, review submissions, and enter academic evaluations.'
                  : 'Publica talleres, adjunta guías de estudio en PDF, revisa las entregas de los estudiantes y califica con retroalimentación.'}
              </p>
            </div>

            {/* Controles de Grupo: ÚNICAMENTE los grupos asignados al docente */}
            <div className="flex items-center gap-3">
              <div className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border ${
                isDark ? 'bg-slate-800 border-slate-700' : 'bg-[#eff4ff] border-[#dce9ff]'
              }`}>
                <span className={`material-symbols-outlined text-lg ${isDark ? 'text-cyan-400' : 'text-[#0051d5]'}`}>
                  group
                </span>
                <div className="flex flex-col">
                  <span className={`text-[10px] font-bold uppercase ${isDark ? 'text-slate-400' : 'text-[#444653]'}`}>
                    {isEn ? 'Assigned Group' : 'Grupo Asignado'}
                  </span>
                  <select
                    value={selectedGroup}
                    onChange={(e) => setSelectedGroup(e.target.value)}
                    className={`bg-transparent text-xs font-extrabold focus:outline-none cursor-pointer pr-4 appearance-none ${
                      isDark ? 'text-white' : 'text-[#0b1c30]'
                    }`}
                  >
                    {teacherAssignments.map((asg) => (
                      <option
                        key={asg.id}
                        value={asg.groupKey}
                        className={isDark ? 'bg-slate-900 text-white' : 'bg-white text-[#0b1c30]'}
                      >
                        {asg.group} ({asg.subjectName})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                onClick={loadAssignments}
                title={isEn ? 'Reload assignments' : 'Recargar tareas'}
                className={`w-11 h-11 rounded-xl border flex items-center justify-center cursor-pointer transition-colors ${
                  isDark ? 'bg-slate-800 border-slate-700 hover:bg-slate-700 text-slate-300' : 'bg-[#eff4ff] border-[#dce9ff] hover:bg-[#dce9ff] text-[#0b1c30]'
                }`}
              >
                <span className="material-symbols-outlined text-lg">refresh</span>
              </button>
            </div>
          </div>

          {/* Listado de Tareas */}
          {loading ? (
            <div className="p-16 text-center">
              <div className="w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-xs text-slate-400">{isEn ? 'Loading assignments...' : 'Consultando tareas en la base de datos...'}</p>
            </div>
          ) : filteredAssignments.length === 0 ? (
            <div className={`p-12 rounded-3xl border text-center ${
              isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-[#e5eeff]'
            }`}>
              <div className={`w-16 h-16 rounded-2xl mx-auto flex items-center justify-center mb-4 ${
                isDark ? 'bg-cyan-950 text-cyan-400' : 'bg-[#dce9ff] text-[#00288e]'
              }`}>
                <span className="material-symbols-outlined text-3xl">assignment_add</span>
              </div>
              <h3 className={`font-extrabold text-base ${isDark ? 'text-white' : 'text-[#0b1c30]'}`}>
                {isEn ? 'No assignments published for this group' : 'No hay tareas publicadas para este grupo'}
              </h3>
              <p className={`text-xs mt-1 max-w-md mx-auto ${isDark ? 'text-slate-400' : 'text-[#444653]'}`}>
                {isEn
                  ? 'Click "+ New Assignment" to publish a task with guidelines and attach a PDF document.'
                  : 'Haz clic en el botón "+ Nueva Tarea" para crear una actividad con instrucciones y adjuntar un archivo PDF.'}
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="mt-5 px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs uppercase tracking-wider cursor-pointer shadow-md inline-flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-base">add_circle</span>
                <span>{isEn ? 'Create Assignment Now' : 'Crear Tarea Ahora'}</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {filteredAssignments.map((asg) => (
                <div
                  key={asg.id}
                  className={`p-5 rounded-2xl border flex flex-col justify-between transition-all hover:shadow-lg ${
                    isDark
                      ? 'bg-slate-900 border-slate-800 hover:border-cyan-500/40'
                      : 'bg-white border-[#e5eeff] hover:border-[#0051d5]/40 shadow-xs'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2.5">
                      <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                        isDark ? 'bg-cyan-950 text-cyan-300 border border-cyan-800/40' : 'bg-[#dce9ff] text-[#00288e]'
                      }`}>
                        {asg.subject}
                      </span>
                      <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold ${
                        isDark ? 'bg-slate-800 text-slate-300 border border-slate-700' : 'bg-slate-100 text-slate-700 border border-slate-200'
                      }`}>
                        {asg.gradeLevel || asg.group}
                      </span>
                    </div>

                    <h3 className={`font-black text-sm line-clamp-2 mb-1.5 ${isDark ? 'text-white' : 'text-[#0b1c30]'}`}>
                      {asg.title}
                    </h3>

                    {asg.instructions && (
                      <p className={`text-xs line-clamp-2 mb-3 ${isDark ? 'text-slate-400' : 'text-[#444653]'}`}>
                        {asg.instructions}
                      </p>
                    )}

                    {/* PDF Attachment Badge */}
                    {asg.pdfUrl ? (
                      <div className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 mb-3 ${
                        isDark ? 'bg-slate-950/80 border-rose-500/30 text-rose-300' : 'bg-rose-50 border-rose-200 text-rose-900'
                      }`}>
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="material-symbols-outlined text-xl text-rose-500 shrink-0">picture_as_pdf</span>
                          <div className="min-w-0">
                            <span className="text-[11px] font-extrabold truncate block">
                              {asg.pdfName || 'Documento_Adjunto.pdf'}
                            </span>
                            {asg.pdfSize && (
                              <span className="text-[10px] opacity-75 block">{asg.pdfSize}</span>
                            )}
                          </div>
                        </div>
                        <a
                          href={asg.pdfUrl}
                          download={asg.pdfName || 'Guia_Adjunta.pdf'}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 text-[10px] font-bold flex items-center gap-1 shrink-0 transition-colors"
                        >
                          <span className="material-symbols-outlined text-sm">download</span>
                          <span>PDF</span>
                        </a>
                      </div>
                    ) : (
                      <div className={`p-2 rounded-xl text-[10px] font-medium flex items-center gap-1.5 mb-3 ${
                        isDark ? 'text-slate-500 bg-slate-950/40' : 'text-[#757684] bg-slate-50'
                      }`}>
                        <span className="material-symbols-outlined text-sm">info</span>
                        <span>{isEn ? 'No PDF file attached' : 'Sin archivo PDF adjunto'}</span>
                      </div>
                    )}

                    <div className={`space-y-1.5 text-xs pt-3 border-t ${
                      isDark ? 'border-slate-800 text-slate-400' : 'border-[#eff4ff] text-[#444653]'
                    }`}>
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <span className={`material-symbols-outlined text-sm ${isDark ? 'text-cyan-400' : 'text-[#0051d5]'}`}>event</span>
                          {isEn ? 'Due Date:' : 'Entrega:'}
                        </span>
                        <strong className={isDark ? 'text-slate-200' : 'text-[#0b1c30]'}>
                          {asg.dueText || asg.dueDate}
                        </strong>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <span className={`material-symbols-outlined text-sm ${isDark ? 'text-cyan-400' : 'text-[#0051d5]'}`}>grade</span>
                          {isEn ? 'Weight:' : 'Ponderación:'}
                        </span>
                        <strong className={isDark ? 'text-slate-200' : 'text-[#0b1c30]'}>
                          {asg.points || '20%'}
                        </strong>
                      </div>
                    </div>
                  </div>

                  <div className={`mt-4 pt-3 border-t flex items-center justify-between ${
                    isDark ? 'border-slate-800' : 'border-[#eff4ff]'
                  }`}>
                    <span className={`text-[11px] font-medium ${isDark ? 'text-slate-500' : 'text-[#757684]'}`}>
                      {asg.type || 'Taller'}
                    </span>
                    <button
                      onClick={() => handleOpenReview(asg)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                        isDark
                          ? 'bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/30'
                          : 'bg-[#dce9ff] hover:bg-[#c9ddff] text-[#00288e]'
                      }`}
                    >
                      <span className="material-symbols-outlined text-sm">fact_check</span>
                      <span>{isEn ? 'Review & Grade' : 'Revisar y Calificar'}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>

      {/* MODAL 1: CREAR TAREA CON ADJUNTO PDF */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
          <div className={`w-full max-w-xl rounded-3xl border shadow-2xl p-6 overflow-hidden max-h-[92vh] flex flex-col ${
            isDark ? 'bg-slate-900 border-slate-700 text-slate-100 shadow-black/80' : 'bg-white border-[#e5eeff] text-[#0b1c30]'
          }`}>
            <div className={`flex items-center justify-between pb-4 border-b ${
              isDark ? 'border-slate-800' : 'border-[#eff4ff]'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white ${
                  isDark ? 'bg-cyan-600' : 'bg-[#1e40af]'
                }`}>
                  <span className="material-symbols-outlined text-2xl">post_add</span>
                </div>
                <div>
                  <h2 className="text-base font-extrabold leading-tight">
                    {isEn ? 'Create Institutional Assignment' : 'Crear Tarea / Taller Académico'}
                  </h2>
                  <p className={`text-xs ${isDark ? 'text-cyan-300' : 'text-[#0051d5]'}`}>
                    {teacherArea} • {teacherName}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className={`w-8 h-8 rounded-full flex items-center justify-center cursor-pointer transition-colors ${
                  isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-[#757684] hover:text-[#0b1c30] hover:bg-slate-100'
                }`}
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            <form onSubmit={handleCreateAssignment} className="space-y-4 mt-4 text-xs overflow-y-auto pr-1 flex-1">
              {/* Título de la tarea */}
              <div>
                <label className={`block font-bold mb-1 ${isDark ? 'text-slate-300' : 'text-[#444653]'}`}>
                  {isEn ? 'Assignment Title' : 'Título del Taller o Tarea'} *
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Ej: Taller 1 - Fundamentos de Filosofía y Reflexión Ética"
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-semibold focus:outline-none transition-all ${
                    isDark
                      ? 'bg-slate-950 border-slate-700 text-white focus:border-cyan-500'
                      : 'bg-[#eff4ff] border-[#dce9ff] text-[#0b1c30] focus:border-[#0051d5]'
                  }`}
                />
              </div>

              {/* Asignatura (Fijada a la del docente) y Grupo Asignado */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={`block font-bold mb-1 ${isDark ? 'text-slate-300' : 'text-[#444653]'}`}>
                    {isEn ? 'Subject' : 'Asignatura Asignada'}
                  </label>
                  <div className={`px-3.5 py-2.5 rounded-xl border font-bold flex items-center justify-between ${
                    isDark ? 'bg-slate-950/70 border-slate-800 text-cyan-300' : 'bg-slate-100 border-slate-200 text-[#00288e]'
                  }`}>
                    <span>{teacherArea}</span>
                    <span className="material-symbols-outlined text-sm opacity-60">lock</span>
                  </div>
                </div>

                <div>
                  <label className={`block font-bold mb-1 ${isDark ? 'text-slate-300' : 'text-[#444653]'}`}>
                    {isEn ? 'Assigned Group' : 'Grupo Asignado'} *
                  </label>
                  <select
                    value={newGroup}
                    onChange={(e) => setNewGroup(e.target.value)}
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-bold focus:outline-none transition-all ${
                      isDark
                        ? 'bg-slate-950 border-slate-700 text-white focus:border-cyan-500'
                        : 'bg-[#eff4ff] border-[#dce9ff] text-[#0b1c30] focus:border-[#0051d5]'
                    }`}
                  >
                    {teacherAssignments.map((asg) => (
                      <option
                        key={asg.id}
                        value={asg.groupKey}
                        className={isDark ? 'bg-slate-900 text-white' : 'bg-white text-[#0b1c30]'}
                      >
                        {asg.group}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Fecha de Entrega y Ponderación */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={`block font-bold mb-1 ${isDark ? 'text-slate-300' : 'text-[#444653]'}`}>
                    {isEn ? 'Due Date' : 'Fecha de Entrega'}
                  </label>
                  <input
                    type="date"
                    value={newDueDate}
                    onChange={(e) => setNewDueDate(e.target.value)}
                    className={`w-full px-3.5 py-2 rounded-xl border text-xs font-semibold focus:outline-none ${
                      isDark
                        ? 'bg-slate-950 border-slate-700 text-white'
                        : 'bg-[#eff4ff] border-[#dce9ff] text-[#0b1c30]'
                    }`}
                  />
                </div>

                <div>
                  <label className={`block font-bold mb-1 ${isDark ? 'text-slate-300' : 'text-[#444653]'}`}>
                    {isEn ? 'Weight / Percentage' : 'Ponderación'}
                  </label>
                  <input
                    type="text"
                    value={newPoints}
                    onChange={(e) => setNewPoints(e.target.value)}
                    placeholder="20% (100 pts)"
                    className={`w-full px-3.5 py-2 rounded-xl border text-xs font-semibold focus:outline-none ${
                      isDark
                        ? 'bg-slate-950 border-slate-700 text-white'
                        : 'bg-[#eff4ff] border-[#dce9ff] text-[#0b1c30]'
                    }`}
                  />
                </div>
              </div>

              {/* Instrucciones y Criterios */}
              <div>
                <label className={`block font-bold mb-1 ${isDark ? 'text-slate-300' : 'text-[#444653]'}`}>
                  {isEn ? 'Instructions & Guidelines' : 'Instrucciones y Criterios Pedagógicos'}
                </label>
                <textarea
                  rows={3}
                  value={newInstructions}
                  onChange={(e) => setNewInstructions(e.target.value)}
                  placeholder="Detalla los pasos que deben seguir los estudiantes para completar la entrega..."
                  className={`w-full p-3 rounded-xl border text-xs focus:outline-none resize-none ${
                    isDark
                      ? 'bg-slate-950 border-slate-700 text-white placeholder:text-slate-500'
                      : 'bg-[#eff4ff] border-[#dce9ff] text-[#0b1c30] placeholder:text-[#757684]'
                  }`}
                />
              </div>

              {/* SECCIÓN ADJUNTAR ARCHIVO PDF (REQUISITO 4) */}
              <div className={`p-4 rounded-2xl border ${
                isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-[#f8faff] border-[#dce9ff]'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-lg text-rose-500">picture_as_pdf</span>
                    <label className={`font-extrabold text-xs ${isDark ? 'text-white' : 'text-[#0b1c30]'}`}>
                      {isEn ? 'Attach PDF Workshop / Guide (Max 5 MB)' : 'Adjuntar Archivo PDF del Taller (Máx 5 MB)'}
                    </label>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-200 text-slate-600'
                  }`}>
                    Formato .pdf
                  </span>
                </div>

                {pdfError && (
                  <div className="mb-3 p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2 animate-in fade-in">
                    <span className="material-symbols-outlined text-base shrink-0">error</span>
                    <span>{pdfError}</span>
                  </div>
                )}

                {pdfAttachment ? (
                  /* Preview del archivo cargado con opción de eliminar o cambiar */
                  <div className={`p-3 rounded-xl border flex items-center justify-between gap-3 ${
                    isDark ? 'bg-slate-900 border-rose-500/40 text-white' : 'bg-white border-rose-300 text-[#0b1c30] shadow-xs'
                  }`}>
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-500 flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-2xl">picture_as_pdf</span>
                      </div>
                      <div className="min-w-0">
                        <span className="font-extrabold text-xs truncate block">
                          {pdfAttachment.name}
                        </span>
                        <span className="text-[11px] text-slate-400 font-medium block">
                          {pdfAttachment.sizeFormatted} • Archivo validado y listo para publicar
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                          isDark ? 'bg-slate-800 hover:bg-slate-700 text-cyan-300' : 'bg-slate-100 hover:bg-slate-200 text-[#0051d5]'
                        }`}
                      >
                        {isEn ? 'Change' : 'Cambiar'}
                      </button>
                      <button
                        type="button"
                        onClick={handleRemovePdf}
                        title={isEn ? 'Remove file' : 'Eliminar archivo'}
                        className="w-8 h-8 rounded-lg bg-rose-500/10 hover:bg-rose-500/25 text-rose-400 flex items-center justify-center cursor-pointer transition-colors"
                      >
                        <span className="material-symbols-outlined text-base">delete</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Input para seleccionar archivo */
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-1.5 ${
                      isDark
                        ? 'border-slate-800 hover:border-cyan-500/60 hover:bg-cyan-950/10 text-slate-400 hover:text-cyan-300'
                        : 'border-[#cbd5e1] hover:border-[#0051d5] hover:bg-blue-50/50 text-[#757684] hover:text-[#0051d5]'
                    }`}
                  >
                    <span className="material-symbols-outlined text-2xl text-cyan-500">upload_file</span>
                    <span className="font-bold text-xs">
                      {isEn ? 'Click to select PDF document' : 'Haz clic para seleccionar el archivo PDF desde tu equipo'}
                    </span>
                    <span className="text-[10px] opacity-75">
                      {isEn ? 'Only .pdf files up to 5 MB' : 'Solo archivos con extensión .pdf de hasta 5 MB'}
                    </span>
                  </div>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,application/pdf"
                  onChange={handlePdfFileChange}
                  className="hidden"
                />
              </div>

              {/* Botones de acción del Modal */}
              <div className={`pt-3 border-t flex justify-end gap-2.5 ${
                isDark ? 'border-slate-800' : 'border-[#eff4ff]'
              }`}>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className={`px-4 py-2.5 rounded-xl border text-xs font-bold cursor-pointer transition-colors ${
                    isDark ? 'border-slate-700 hover:bg-slate-800 text-slate-300' : 'border-slate-300 hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  {isEn ? 'Cancel' : 'Cancelar'}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs uppercase tracking-wider shadow-md cursor-pointer disabled:opacity-50 flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>{isEn ? 'Publishing...' : 'Publicando...'}</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-base">send</span>
                      <span>{isEn ? 'Publish Assignment' : 'Publicar Tarea'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: REVISIÓN Y CALIFICACIÓN DE ENTREGAS */}
      {selectedAssignmentForReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
          <div className={`w-full max-w-4xl rounded-3xl border shadow-2xl p-6 overflow-hidden max-h-[92vh] flex flex-col ${
            isDark ? 'bg-slate-900 border-slate-700 text-slate-100 shadow-black/80' : 'bg-white border-[#e5eeff] text-[#0b1c30]'
          }`}>
            <div className={`flex items-center justify-between pb-4 border-b ${
              isDark ? 'border-slate-800' : 'border-[#eff4ff]'
            }`}>
              <div>
                <span className={`text-[11px] font-bold uppercase tracking-wider ${isDark ? 'text-cyan-400' : 'text-[#0051d5]'}`}>
                  {selectedAssignmentForReview.subject} • {selectedAssignmentForReview.gradeLevel || selectedAssignmentForReview.group}
                </span>
                <h2 className="text-lg font-black">{selectedAssignmentForReview.title}</h2>
              </div>
              <button
                type="button"
                onClick={() => setSelectedAssignmentForReview(null)}
                className={`w-8 h-8 rounded-full flex items-center justify-center cursor-pointer transition-colors ${
                  isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-[#757684] hover:text-[#0b1c30] hover:bg-slate-100'
                }`}
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mt-4 flex-1 overflow-y-auto">
              {/* Left Column: Submissions List */}
              <div className="md:col-span-6 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className={`font-extrabold text-xs uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-[#444653]'}`}>
                    {isEn ? 'Student Submissions' : 'Entregas Recibidas'} ({submissions.length})
                  </h3>
                </div>

                {loadingSubmissions ? (
                  <div className="p-8 text-center">
                    <div className="w-8 h-8 border-3 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    <p className="text-xs text-slate-400">{isEn ? 'Loading submissions...' : 'Cargando entregas...'}</p>
                  </div>
                ) : submissions.length === 0 ? (
                  <div className={`p-8 rounded-2xl border text-center ${
                    isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
                  }`}>
                    <span className="material-symbols-outlined text-3xl text-slate-500 mb-1">inbox</span>
                    <p className="text-xs text-slate-400">
                      {isEn ? 'No student has submitted work for this task yet.' : 'Ningún estudiante ha enviado tareas para esta actividad todavía.'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {submissions.map((sub) => (
                      <div
                        key={sub.id}
                        onClick={() => {
                          setSelectedSubmission(sub);
                          setGradeScore(sub.score ? sub.score.toString() : '4.5');
                          setGradeFeedback(sub.notes || '');
                        }}
                        className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all ${
                          selectedSubmission?.id === sub.id
                            ? 'bg-cyan-500/10 border-cyan-500 text-white shadow-sm'
                            : isDark
                            ? 'bg-slate-950 border-slate-800 hover:border-slate-700'
                            : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="font-extrabold">{sub.studentName}</span>
                          {sub.status === 'graded' ? (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[10px] font-extrabold">
                              Nota: {sub.score?.toFixed(1)}
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30 text-[10px] font-extrabold">
                              {isEn ? 'Pending Grade' : 'Por Calificar'}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400 truncate">
                          {sub.files?.map(f => f.name).join(', ') || 'Entrega digital'}
                        </p>
                        <span className="text-[10px] text-slate-500 block mt-1">
                          {new Date(sub.submittedAt).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Right Column: Grading Form */}
              <div className="md:col-span-6">
                {selectedSubmission ? (
                  <form onSubmit={handleGradeSubmission} className={`p-5 rounded-2xl border space-y-4 ${
                    isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
                  }`}>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 block">
                        {isEn ? 'Student Submission' : 'Ficha del Estudiante'}
                      </span>
                      <h4 className="font-black text-base text-white">{selectedSubmission.studentName}</h4>
                      <p className="text-xs text-slate-400">
                        {isEn ? 'Document:' : 'Doc. Identidad:'} {selectedSubmission.studentDocumentId || selectedSubmission.studentId}
                      </p>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-400 mb-1">
                        {isEn ? 'Academic Grade (1.0 to 5.0)' : 'Calificación Numérica Oficial (1.0 a 5.0)'} *
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        min="1.0"
                        max="5.0"
                        value={gradeScore}
                        onChange={(e) => setGradeScore(e.target.value)}
                        required
                        className={`w-full px-3.5 py-2 rounded-xl text-base font-black border focus:outline-none ${
                          isDark ? 'bg-slate-900 border-slate-700 text-cyan-300' : 'bg-white border-slate-300 text-cyan-700'
                        }`}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-400 mb-1">
                        {isEn ? 'Pedagogical Feedback' : 'Retroalimentación Pedagógica'}
                      </label>
                      <textarea
                        rows={3}
                        value={gradeFeedback}
                        onChange={(e) => setGradeFeedback(e.target.value)}
                        placeholder="Escribe comentarios pedagógicos constructivos para el estudiante..."
                        className={`w-full p-3 rounded-xl text-xs border focus:outline-none resize-none ${
                          isDark ? 'bg-slate-900 border-slate-700 text-slate-200' : 'bg-white border-slate-300 text-slate-800'
                        }`}
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isGrading}
                      className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer flex items-center justify-center gap-2"
                    >
                      <span className="material-symbols-outlined text-sm">check_circle</span>
                      <span>{isGrading ? (isEn ? 'Saving...' : 'Guardando...') : (isEn ? 'Save Grade & Feedback' : 'Guardar Calificación')}</span>
                    </button>
                  </form>
                ) : (
                  <div className={`p-8 rounded-2xl border text-center ${
                    isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
                  }`}>
                    <span className="material-symbols-outlined text-3xl text-slate-500 mb-2">touch_app</span>
                    <p className="text-xs text-slate-400">
                      {isEn ? 'Select a student submission to evaluate.' : 'Selecciona una entrega de la lista izquierda para revisarla y asignarle calificación.'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
