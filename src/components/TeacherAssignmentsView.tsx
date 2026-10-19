import React, { useState, useEffect, useMemo } from 'react';
import { ActiveScreen, UserProfile } from '../types';
import { ASSETS } from '../data/mockData';
import { useThemeLanguage } from '../context/ThemeLanguageContext';
import {
  fetchAllInstitutionalAssignments,
  publishInstitutionalAssignment,
  fetchSubmissionsForAssignment,
  gradeStudentSubmission,
  InstitutionalAssignmentDoc,
  StudentSubmission
} from '../services/assignmentService';
import { getTeacherPersonalSchedule, CENSUS_TEACHERS } from '../data/institutionalCensus';
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

  const teacherName = currentUser?.fullName || 'Prof. Daniela Álvarez';
  const teacherArea = currentUser?.subjectArea || 'Docente de Asignatura';

  const [assignments, setAssignments] = useState<InstitutionalAssignmentDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGroup, setSelectedGroup] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // New assignment modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newSubject, setNewSubject] = useState(currentUser?.subjectArea || 'Matemáticas');
  const [newGroup, setNewGroup] = useState('11-1');
  const [newDueDate, setNewDueDate] = useState('');
  const [newDueText, setNewDueText] = useState('Próximo lunes 11:59 PM');
  const [newType, setNewType] = useState('Documento PDF');
  const [newPoints, setNewPoints] = useState('20% (100 pts)');
  const [newUrgency, setNewUrgency] = useState<'regular' | 'urgente'>('regular');
  const [newInstructions, setNewInstructions] = useState('');

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

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      showToast(isEn ? 'Title is required' : 'El título es obligatorio');
      return;
    }
    setIsSubmitting(true);
    try {
      const created = await publishInstitutionalAssignment({
        title: newTitle.trim(),
        subject: newSubject.trim(),
        gradeLevel: newGroup,
        group: newGroup,
        teacherName: teacherName,
        teacherId: currentUser?.id || '',
        dueDate: newDueDate || '2026-04-15',
        dueText: newDueText || 'Fecha límite establecida',
        urgency: newUrgency,
        isPublished: true,
        type: newType,
        typeIcon: 'assignment',
        points: newPoints,
        instructions: newInstructions
      });
      setAssignments(prev => [created, ...prev]);
      setShowCreateModal(false);
      setNewTitle('');
      setNewInstructions('');
      showToast(isEn ? 'Assignment created and published successfully!' : '¡Tarea académica creada y publicada con éxito!');
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

  const personalSchedule = useMemo(() => {
    return getTeacherPersonalSchedule(currentUser?.fullName || currentUser?.documentId || '');
  }, [currentUser]);

  const filteredAssignments = useMemo(() => {
    return assignments.filter(item => {
      const matchGroup = selectedGroup === 'all' || item.gradeLevel.toLowerCase().includes(selectedGroup.toLowerCase()) || (item.group && item.group.toLowerCase().includes(selectedGroup.toLowerCase()));
      const matchSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) || item.subject.toLowerCase().includes(searchQuery.toLowerCase());
      return matchGroup && matchSearch;
    });
  }, [assignments, selectedGroup, searchQuery]);

  return (
    <div className={`min-h-screen ${isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-800'}`}>
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl bg-cyan-600 text-white font-medium shadow-2xl flex items-center gap-3">
          <span className="material-symbols-outlined text-xl">info</span>
          <span className="text-sm">{toastMessage}</span>
        </div>
      )}

      {/* Main Grid Layout with Teacher Sidebar */}
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

            {/* 5 Navegaciones Oficiales del Rol Docente */}
            <div className="space-y-1">
              {/* 1. Calificaciones */}
              <button
                onClick={() => onNavigate('teacher_grades')}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-left text-xs font-semibold transition-colors cursor-pointer ${
                  isDark ? 'text-slate-400 hover:bg-slate-800 hover:text-white' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <span className="material-symbols-outlined text-lg">fact_check</span>
                <span>{isEn ? 'Gradebook' : 'Calificaciones'}</span>
              </button>

              {/* 2. Control de asistencia */}
              <button
                onClick={() => onNavigate('teacher_attendance')}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-left text-xs font-semibold transition-colors cursor-pointer ${
                  isDark ? 'text-slate-400 hover:bg-slate-800 hover:text-white' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <span className="material-symbols-outlined text-lg">how_to_reg</span>
                <span>{isEn ? 'Class Attendance' : 'Control de asistencia'}</span>
              </button>

              {/* 3. Horario propio */}
              <button
                onClick={() => setShowScheduleModal(true)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-left text-xs font-semibold transition-colors cursor-pointer ${
                  isDark ? 'text-slate-400 hover:bg-slate-800 hover:text-white' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <span className="material-symbols-outlined text-lg">calendar_month</span>
                <span>{isEn ? 'Personal Schedule' : 'Horario propio'}</span>
              </button>

              {/* 4. Tareas y talleres (ACTIVO) */}
              <button
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-left text-xs font-bold cursor-default ${
                  isDark ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30' : 'bg-cyan-50 text-cyan-700 border border-cyan-200'
                }`}
              >
                <span className="material-symbols-outlined text-lg">assignment</span>
                <span>{isEn ? 'Tasks & Workshops' : 'Tareas y talleres'}</span>
              </button>

              {/* 5. Mensajería y citaciones */}
              <button
                onClick={() => onNavigate('teacher_messaging')}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-left text-xs font-semibold transition-colors cursor-pointer ${
                  isDark ? 'text-slate-400 hover:bg-slate-800 hover:text-white' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <span className="material-symbols-outlined text-lg">chat</span>
                <span>{isEn ? 'Messaging & Citations' : 'Mensajería y citaciones'}</span>
              </button>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className={`rounded-2xl p-4 border ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200'} space-y-3`}>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">{isEn ? 'Total Created' : 'Total Tareas'}</span>
              <span className="font-bold text-cyan-400">{assignments.length}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">{isEn ? 'Active Groups' : 'Grupos Asignados'}</span>
              <span className="font-bold text-emerald-400">6°1 a 11°2</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">{isEn ? 'Institution' : 'Institución'}</span>
              <span className="font-medium text-slate-300">I.E. Vallejuelos</span>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="lg:col-span-9 space-y-6">
          {/* Header Card */}
          <div className={`p-6 rounded-2xl border ${isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'} shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4`}>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  {isEn ? 'Teacher Center' : 'Módulo Docente'}
                </span>
                <span className="text-xs text-slate-400">• I.E. Vallejuelos</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight">
                {isEn ? 'Assignments & Workshop Manager' : 'Gestor de Tareas y Talleres'}
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                {isEn
                  ? 'Publish homework, define submission criteria, review student deliveries and assign grades.'
                  : 'Publica talleres, define criterios de entrega, revisa los envíos de los estudiantes y califica con retroalimentación.'}
              </p>
            </div>

            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-cyan-600/20 cursor-pointer transition-transform active:scale-95"
            >
              <span className="material-symbols-outlined text-lg">add_circle</span>
              <span>{isEn ? 'New Assignment' : 'Nueva Tarea'}</span>
            </button>
          </div>

          {/* Filters & Search Bar */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={isEn ? 'Search assignment by title or subject...' : 'Buscar tarea por título o materia...'}
                className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-xs border ${
                  isDark ? 'bg-slate-900 border-slate-800 text-slate-200' : 'bg-white border-slate-300 text-slate-800'
                } focus:outline-none focus:ring-2 focus:ring-cyan-500`}
              />
            </div>

            <div className="flex gap-2">
              <select
                value={selectedGroup}
                onChange={(e) => setSelectedGroup(e.target.value)}
                className={`px-3 py-2.5 rounded-xl text-xs font-medium border ${
                  isDark ? 'bg-slate-900 border-slate-800 text-slate-200' : 'bg-white border-slate-300 text-slate-800'
                }`}
              >
                <option value="all">{isEn ? 'All Groups' : 'Todos los Grupos'}</option>
                <option value="6-1">Grado 6°1</option>
                <option value="6-2">Grado 6°2</option>
                <option value="7-1">Grado 7°1</option>
                <option value="7-2">Grado 7°2</option>
                <option value="8-1">Grado 8°1</option>
                <option value="8-2">Grado 8°2</option>
                <option value="9-1">Grado 9°1</option>
                <option value="9-2">Grado 9°2</option>
                <option value="10-1">Grado 10°1</option>
                <option value="10-2">Grado 10°2</option>
                <option value="11-1">Grado 11°1</option>
                <option value="11-2">Grado 11°2</option>
              </select>

              <button
                onClick={loadAssignments}
                title={isEn ? 'Reload assignments' : 'Recargar tareas'}
                className={`px-3 py-2.5 rounded-xl border flex items-center justify-center cursor-pointer ${
                  isDark ? 'bg-slate-900 border-slate-800 hover:bg-slate-800 text-slate-300' : 'bg-white border-slate-300 hover:bg-slate-100 text-slate-700'
                }`}
              >
                <span className="material-symbols-outlined text-lg">refresh</span>
              </button>
            </div>
          </div>

          {/* Assignments List */}
          {loading ? (
            <div className="p-12 text-center">
              <div className="w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-xs text-slate-400">{isEn ? 'Loading assignments...' : 'Cargando tareas académicas...'}</p>
            </div>
          ) : filteredAssignments.length === 0 ? (
            <div className={`p-10 rounded-2xl border text-center ${isDark ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-slate-200'}`}>
              <span className="material-symbols-outlined text-4xl text-slate-500 mb-2">assignment_late</span>
              <h3 className="font-bold text-sm">{isEn ? 'No assignments found' : 'No se encontraron tareas'}</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                {isEn ? 'Create your first assignment or change filters to see tasks.' : 'Crea tu primera tarea académica con el botón "Nueva Tarea" o modifica los filtros.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredAssignments.map((asg) => (
                <div
                  key={asg.id}
                  className={`p-5 rounded-2xl border flex flex-col justify-between transition-all hover:border-cyan-500/40 ${
                    isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                        {asg.subject}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        asg.urgency === 'urgente'
                          ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      }`}>
                        {asg.gradeLevel || asg.group || '11°1'}
                      </span>
                    </div>

                    <h3 className="font-bold text-sm text-slate-100 line-clamp-2 mb-1">
                      {asg.title}
                    </h3>

                    {asg.instructions && (
                      <p className="text-xs text-slate-400 line-clamp-2 mb-3">
                        {asg.instructions}
                      </p>
                    )}

                    <div className="space-y-1.5 text-xs text-slate-400 pt-2 border-t border-slate-800/40">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-sm text-cyan-400">event</span>
                        <span>{isEn ? 'Due:' : 'Entrega:'} <strong className="text-slate-300">{asg.dueText || asg.dueDate}</strong></span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-sm text-blue-400">verified</span>
                        <span>{isEn ? 'Weight:' : 'Ponderación:'} <strong className="text-slate-300">{asg.points || '20%'}</strong></span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800/40 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400">
                      {asg.type || 'Documento'}
                    </span>
                    <button
                      onClick={() => handleOpenReview(asg)}
                      className="px-3.5 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <span className="material-symbols-outlined text-sm">visibility</span>
                      <span>{isEn ? 'Review Submissions' : 'Ver Entregas'}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Review & Grading Drawer / Modal */}
      {selectedAssignmentForReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className={`w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl border shadow-2xl p-6 ${
            isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-800'
          }`}>
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div>
                <span className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider">
                  {selectedAssignmentForReview.subject} • {selectedAssignmentForReview.gradeLevel}
                </span>
                <h2 className="text-lg font-black">{selectedAssignmentForReview.title}</h2>
              </div>
              <button
                onClick={() => setSelectedAssignmentForReview(null)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mt-6">
              {/* Left Column: Submissions list */}
              <div className="md:col-span-6 space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                  <span>{isEn ? 'Submissions Received' : 'Entregas Recibidas'}</span>
                  <span className="px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 font-bold">
                    {submissions.length}
                  </span>
                </h3>

                {loadingSubmissions ? (
                  <div className="p-8 text-center text-xs text-slate-400">
                    <div className="w-6 h-6 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    {isEn ? 'Loading submissions...' : 'Cargando entregas...'}
                  </div>
                ) : submissions.length === 0 ? (
                  <div className={`p-6 rounded-2xl border text-center ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                    <p className="text-xs text-slate-400">
                      {isEn ? 'No submissions uploaded yet for this assignment.' : 'Aún no hay entregas subidas por los estudiantes de este grupo.'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                    {submissions.map((sub) => (
                      <div
                        key={sub.id}
                        onClick={() => {
                          setSelectedSubmission(sub);
                          setGradeScore(sub.score ? sub.score.toString() : '4.5');
                        }}
                        className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                          selectedSubmission?.id === sub.id
                            ? 'bg-cyan-500/10 border-cyan-500 text-white'
                            : isDark ? 'bg-slate-950 border-slate-800 hover:border-slate-700' : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="font-bold">{sub.studentName}</span>
                          {sub.status === 'graded' ? (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold">
                              Nota: {sub.score?.toFixed(1)}
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-bold">
                              {isEn ? 'Pending Grade' : 'Por Calificar'}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400 truncate">
                          {sub.files?.map(f => f.name).join(', ') || 'Entrega digital'}
                        </p>
                        <span className="text-[10px] text-slate-500 block mt-1">
                          {new Date(sub.submittedAt).toLocaleDateString()}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Right Column: Grading Panel */}
              <div className="md:col-span-6">
                {selectedSubmission ? (
                  <form onSubmit={handleGradeSubmission} className={`p-5 rounded-2xl border ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'} space-y-4`}>
                    <div>
                      <h4 className="font-bold text-sm text-cyan-400">{selectedSubmission.studentName}</h4>
                      <p className="text-xs text-slate-400">{isEn ? 'Document ID:' : 'Doc. Identidad:'} {selectedSubmission.studentDocumentId || selectedSubmission.studentId}</p>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-400 mb-1">
                        {isEn ? 'Grade / Score (1.0 to 5.0)' : 'Calificación Numérica (1.0 a 5.0)'}
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        min="1.0"
                        max="5.0"
                        value={gradeScore}
                        onChange={(e) => setGradeScore(e.target.value)}
                        required
                        className={`w-full px-3 py-2 rounded-xl text-sm font-bold border ${
                          isDark ? 'bg-slate-900 border-slate-700 text-cyan-300' : 'bg-white border-slate-300 text-cyan-700'
                        }`}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-400 mb-1">
                        {isEn ? 'Teacher Feedback & Observations' : 'Retroalimentación y Observaciones Docente'}
                      </label>
                      <textarea
                        rows={3}
                        value={gradeFeedback}
                        onChange={(e) => setGradeFeedback(e.target.value)}
                        placeholder={isEn ? 'Add constructive feedback...' : 'Escribe observaciones pedagógicas para el estudiante...'}
                        className={`w-full p-3 rounded-xl text-xs border ${
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
                      <span>{isGrading ? (isEn ? 'Saving...' : 'Guardando...') : (isEn ? 'Save Grade & Feedback' : 'Asignar Nota')}</span>
                    </button>
                  </form>
                ) : (
                  <div className={`p-8 rounded-2xl border text-center ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                    <span className="material-symbols-outlined text-3xl text-slate-500 mb-2">touch_app</span>
                    <p className="text-xs text-slate-400">
                      {isEn ? 'Select a student submission from the left list to review and assign a grade.' : 'Selecciona una entrega de la lista izquierda para revisarla y calificarla.'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create New Assignment Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className={`w-full max-w-xl rounded-3xl border shadow-2xl p-6 ${
            isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-800'
          }`}>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h2 className="text-base font-black flex items-center gap-2">
                <span className="material-symbols-outlined text-cyan-400">post_add</span>
                <span>{isEn ? 'Create Institutional Assignment' : 'Crear Tarea / Taller Académico'}</span>
              </h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleCreateAssignment} className="space-y-4 mt-4 text-xs">
              <div>
                <label className="block font-bold text-slate-400 mb-1">
                  {isEn ? 'Assignment Title' : 'Título del Taller o Tarea'} *
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Ej: Taller 2 - Ecuaciones Cuadráticas y Modelado"
                  className={`w-full px-3 py-2.5 rounded-xl border ${
                    isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-white border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-400 mb-1">
                    {isEn ? 'Subject' : 'Asignatura'}
                  </label>
                  <input
                    type="text"
                    value={newSubject}
                    onChange={(e) => setNewSubject(e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl border ${
                      isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-400 mb-1">
                    {isEn ? 'Target Group' : 'Grupo Asignado'}
                  </label>
                  <select
                    value={newGroup}
                    onChange={(e) => setNewGroup(e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl border ${
                      isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  >
                    <option value="6-1">Grado 6°1</option>
                    <option value="6-2">Grado 6°2</option>
                    <option value="7-1">Grado 7°1</option>
                    <option value="7-2">Grado 7°2</option>
                    <option value="8-1">Grado 8°1</option>
                    <option value="8-2">Grado 8°2</option>
                    <option value="9-1">Grado 9°1</option>
                    <option value="9-2">Grado 9°2</option>
                    <option value="10-1">Grado 10°1</option>
                    <option value="10-2">Grado 10°2</option>
                    <option value="11-1">Grado 11°1</option>
                    <option value="11-2">Grado 11°2</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-400 mb-1">
                    {isEn ? 'Due Date' : 'Fecha de Entrega'}
                  </label>
                  <input
                    type="date"
                    value={newDueDate}
                    onChange={(e) => setNewDueDate(e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl border ${
                      isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-400 mb-1">
                    {isEn ? 'Weight / Points' : 'Ponderación'}
                  </label>
                  <input
                    type="text"
                    value={newPoints}
                    onChange={(e) => setNewPoints(e.target.value)}
                    placeholder="20% (100 pts)"
                    className={`w-full px-3 py-2 rounded-xl border ${
                      isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-400 mb-1">
                  {isEn ? 'Instructions & Guidelines' : 'Instrucciones y Criterios'}
                </label>
                <textarea
                  rows={3}
                  value={newInstructions}
                  onChange={(e) => setNewInstructions(e.target.value)}
                  placeholder="Detalla los pasos que deben seguir los estudiantes..."
                  className={`w-full p-3 rounded-xl border ${
                    isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-white border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300 cursor-pointer"
                >
                  {isEn ? 'Cancel' : 'Cancelar'}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold cursor-pointer"
                >
                  {isSubmitting ? (isEn ? 'Publishing...' : 'Publicando...') : (isEn ? 'Publish Assignment' : 'Publicar Tarea')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Teacher Personal Schedule Modal */}
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
