import React, { useState, useEffect, useMemo } from 'react';
import { ActiveScreen, UserProfile, InstitutionalPublicationDoc, PublicationSurveyOption } from '../types';
import { useThemeLanguage } from '../context/ThemeLanguageContext';
import { TeacherSidebar } from './TeacherSidebar';
import { TeacherScheduleModal } from './TeacherScheduleModal';
import {
  fetchTeacherPublications,
  saveTeacherPublication,
  deleteTeacherPublication,
  togglePublicationStatus,
  fetchSurveyResults,
  SurveyResultsData
} from '../services/teacherForumService';
import { getTeacherAssignedGroups } from '../data/institutionalCensus';

interface TeacherForumViewProps {
  currentUser?: UserProfile | null;
  onNavigate: (screen: ActiveScreen) => void;
  onLogout: () => void;
}

export const TeacherForumView: React.FC<TeacherForumViewProps> = ({
  currentUser,
  onNavigate,
  onLogout: _onLogout
}) => {
  const { theme, language } = useThemeLanguage();
  const isDark = theme === 'dark';
  const isEn = language === 'en';

  const teacherName = currentUser?.fullName || 'Prof. Carlos Ramírez';
  const teacherArea = currentUser?.subjectArea || 'Filosofía de Vida';
  const assignedGroups = useMemo(() => {
    return getTeacherAssignedGroups(currentUser?.fullName || currentUser?.documentId);
  }, [currentUser]);

  // Main state
  const [publications, setPublications] = useState<InstitutionalPublicationDoc[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<'all' | 'forums' | 'surveys'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modals
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [viewingResultsPub, setViewingResultsPub] = useState<InstitutionalPublicationDoc | null>(null);
  const [surveyResults, setSurveyResults] = useState<SurveyResultsData | null>(null);
  const [isLoadingResults, setIsLoadingResults] = useState(false);

  // Form state
  const [pubType, setPubType] = useState<'forum' | 'survey'>('forum');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<'general' | 'academico' | 'convivencia' | 'evento'>('academico');
  const [targetAllGroups, setTargetAllGroups] = useState(false);
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [status, setStatus] = useState<'published' | 'draft'>('published');

  // Survey options form
  const [surveyQuestion, setSurveyQuestion] = useState('');
  const [surveyOptions, setSurveyOptions] = useState<string[]>(['De acuerdo', 'En desacuerdo']);
  const [isSaving, setIsSaving] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Load publications
  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await fetchTeacherPublications(teacherName, currentUser?.email);
      setPublications(data);
    } catch (err) {
      console.warn('Error loading teacher publications:', err);
      showToast(isEn ? 'Error loading forums & surveys' : 'Error al cargar foros y encuestas');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    if (assignedGroups.length > 0) {
      setSelectedGroups([assignedGroups[0]]);
    }
  }, [assignedGroups]);

  // Filtered publications
  const filteredPubs = useMemo(() => {
    return publications.filter((p) => {
      if (activeFilter === 'forums' && p.hasSurvey) return false;
      if (activeFilter === 'surveys' && !p.hasSurvey) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = p.title.toLowerCase().includes(q);
        const matchContent = p.content.toLowerCase().includes(q);
        const matchCategory = p.category.toLowerCase().includes(q);
        if (!matchTitle && !matchContent && !matchCategory) return false;
      }
      return true;
    });
  }, [publications, activeFilter, searchQuery]);

  // Metrics
  const metrics = useMemo(() => {
    const forumsCount = publications.filter((p) => !p.hasSurvey).length;
    const surveysCount = publications.filter((p) => p.hasSurvey).length;
    const publishedCount = publications.filter((p) => p.status === 'published').length;
    return { forumsCount, surveysCount, publishedCount };
  }, [publications]);

  // Handle open create modal
  const handleOpenCreateModal = (type: 'forum' | 'survey') => {
    setPubType(type);
    setTitle('');
    setContent('');
    setCategory('academico');
    setTargetAllGroups(false);
    setSelectedGroups(assignedGroups.length > 0 ? [assignedGroups[0]] : ['8°1']);
    setStatus('published');
    setSurveyQuestion('');
    setSurveyOptions(['Opción 1', 'Opción 2']);
    setShowCreateModal(true);
  };

  // Add survey option
  const handleAddOption = () => {
    if (surveyOptions.length >= 6) {
      showToast(isEn ? 'Maximum 6 options allowed' : 'Máximo 6 opciones permitidas');
      return;
    }
    setSurveyOptions([...surveyOptions, `Opción ${surveyOptions.length + 1}`]);
  };

  // Remove survey option
  const handleRemoveOption = (index: number) => {
    if (surveyOptions.length <= 2) {
      showToast(isEn ? 'A minimum of 2 options is required' : 'Se requieren mínimo 2 opciones');
      return;
    }
    setSurveyOptions(surveyOptions.filter((_, idx) => idx !== index));
  };

  // Toggle group selection
  const handleToggleGroup = (grp: string) => {
    if (selectedGroups.includes(grp)) {
      setSelectedGroups(selectedGroups.filter((g) => g !== grp));
    } else {
      setSelectedGroups([...selectedGroups, grp]);
    }
  };

  // Submit creation
  const handleSavePublication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      showToast(isEn ? 'Please fill in title and description' : 'Por favor ingresa título y descripción');
      return;
    }

    if (pubType === 'survey') {
      if (!surveyQuestion.trim()) {
        showToast(isEn ? 'Please specify the survey question' : 'Por favor especifica la pregunta de la encuesta');
        return;
      }
      const validOptions = surveyOptions.map((o) => o.trim()).filter(Boolean);
      if (validOptions.length < 2) {
        showToast(isEn ? 'At least 2 valid options required' : 'Debes definir al menos 2 opciones válidas');
        return;
      }
    }

    const targets = targetAllGroups ? ['all'] : selectedGroups.length > 0 ? selectedGroups : ['8°1'];

    setIsSaving(true);
    try {
      const formattedOptions: PublicationSurveyOption[] =
        pubType === 'survey'
          ? surveyOptions.map((optText, idx) => ({
              id: `opt_${Date.now()}_${idx}`,
              text: optText.trim(),
              votesCount: 0
            }))
          : [];

      await saveTeacherPublication({
        title: title.trim(),
        content: content.trim(),
        category,
        authorName: teacherName,
        authorRole: 'docente',
        authorEmail: currentUser?.email || 'docente@vallejuelos.edu.co',
        targetGrades: targets,
        createdAt: new Date().toISOString(),
        hasSurvey: pubType === 'survey',
        surveyQuestion: pubType === 'survey' ? surveyQuestion.trim() : undefined,
        surveyOptions: formattedOptions,
        status
      });

      setShowCreateModal(false);
      showToast(
        pubType === 'survey'
          ? isEn ? 'Survey published successfully!' : '¡Encuesta institucional publicada con éxito!'
          : isEn ? 'Pedagogical forum published successfully!' : '¡Foro de debate publicado con éxito!'
      );
      await loadData();
    } catch (err) {
      console.error('Error creating publication:', err);
      showToast(isEn ? 'Error saving publication' : 'Error al guardar la publicación');
    } finally {
      setIsSaving(false);
    }
  };

  // Toggle status (close / open)
  const handleToggleStatus = async (pub: InstitutionalPublicationDoc) => {
    try {
      const updatedStatus = await togglePublicationStatus(pub.id, pub.status);
      showToast(
        updatedStatus === 'published'
          ? isEn ? 'Publication opened for students.' : 'Publicación activada para los estudiantes.'
          : isEn ? 'Publication closed (draft).' : 'Publicación cerrada (modo borrador).'
      );
      await loadData();
    } catch (err) {
      console.error('Error toggling status:', err);
      showToast(isEn ? 'Failed to update status' : 'No se pudo actualizar el estado');
    }
  };

  // Delete publication
  const handleDelete = async (pub: InstitutionalPublicationDoc) => {
    const confirmDelete = window.confirm(
      isEn
        ? `Are you sure you want to delete "${pub.title}"?`
        : `¿Confirmas que deseas eliminar "${pub.title}"?`
    );
    if (!confirmDelete) return;

    try {
      await deleteTeacherPublication(pub.id);
      showToast(isEn ? 'Publication deleted.' : 'Publicación eliminada correctamente.');
      if (viewingResultsPub?.id === pub.id) {
        setViewingResultsPub(null);
      }
      await loadData();
    } catch (err) {
      console.error('Error deleting:', err);
      showToast(isEn ? 'Failed to delete' : 'Error al eliminar');
    }
  };

  // View survey results
  const handleViewResults = async (pub: InstitutionalPublicationDoc) => {
    setViewingResultsPub(pub);
    setIsLoadingResults(true);
    try {
      const res = await fetchSurveyResults(pub);
      setSurveyResults(res);
    } catch (err) {
      console.error('Error loading survey results:', err);
      showToast(isEn ? 'Error loading poll results' : 'Error al cargar los resultados de la encuesta');
    } finally {
      setIsLoadingResults(false);
    }
  };

  return (
    <div className={`min-h-screen flex transition-colors duration-200 ${
      isDark ? 'bg-slate-950 text-slate-100' : 'bg-[#f8f9ff] text-[#0b1c30]'
    }`}>
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-5 py-3 rounded-2xl bg-cyan-600 text-white font-medium shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <span className="material-symbols-outlined text-xl">info</span>
          <span className="text-sm font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* FIXED TEACHER SIDEBAR */}
      <TeacherSidebar
        activeTab="forum"
        currentUser={currentUser}
        onNavigate={onNavigate}
        onOpenSchedule={() => setShowScheduleModal(true)}
      />

      {/* MAIN CONTAINER */}
      <div className="flex-1 lg:pl-72 flex flex-col min-w-0">
        {/* Header Bar */}
        <header className={`sticky top-12 h-20 backdrop-blur-xl shadow-xs z-30 px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4 border-b transition-colors ${
          isDark ? 'bg-slate-900/95 border-slate-800' : 'bg-white/95 border-[#e5eeff]'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
              isDark ? 'bg-cyan-950 border-cyan-800 text-cyan-300' : 'bg-[#eff4ff] border-[#dce9ff] text-[#00288e]'
            }`}>
              <span className="material-symbols-outlined text-2xl">forum</span>
            </div>
            <div>
              <h2 className={`text-base font-extrabold ${isDark ? 'text-white' : 'text-[#0b1c30]'}`}>
                {isEn ? 'Forums & Institutional Surveys' : 'Foros Pedagógicos y Encuestas'}
              </h2>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-[#444653]'}`}>
                {teacherName} • {teacherArea} • I.E. Vallejuelos
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => handleOpenCreateModal('forum')}
              className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs uppercase tracking-wider shadow-sm cursor-pointer transition-all flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-base">post_add</span>
              <span className="hidden sm:inline">{isEn ? 'New Forum' : 'Nuevo Foro'}</span>
            </button>
            <button
              onClick={() => handleOpenCreateModal('survey')}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-600 hover:to-indigo-600 text-white font-bold text-xs uppercase tracking-wider shadow-sm cursor-pointer transition-all flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-base">poll</span>
              <span className="hidden sm:inline">{isEn ? 'New Poll' : 'Nueva Encuesta'}</span>
            </button>
          </div>
        </header>

        {/* Workspace Body */}
        <main className="p-4 sm:p-6 lg:p-8 flex flex-col gap-6 max-w-[1440px] w-full mx-auto">
          {/* KPI Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className={`p-4 rounded-2xl border flex items-center justify-between ${
              isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-[#e5eeff]'
            }`}>
              <div>
                <span className={`text-[11px] font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-[#64748b]'}`}>
                  {isEn ? 'Active Forums' : 'Foros de Debate'}
                </span>
                <p className={`text-2xl font-extrabold mt-1 ${isDark ? 'text-cyan-400' : 'text-[#00288e]'}`}>
                  {metrics.forumsCount}
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-cyan-500/15 text-cyan-400 flex items-center justify-center">
                <span className="material-symbols-outlined text-xl">forum</span>
              </div>
            </div>

            <div className={`p-4 rounded-2xl border flex items-center justify-between ${
              isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-[#e5eeff]'
            }`}>
              <div>
                <span className={`text-[11px] font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-[#64748b]'}`}>
                  {isEn ? 'Surveys / Polls' : 'Encuestas Institucionales'}
                </span>
                <p className={`text-2xl font-extrabold mt-1 ${isDark ? 'text-indigo-400' : 'text-[#0051d5]'}`}>
                  {metrics.surveysCount}
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-indigo-500/15 text-indigo-400 flex items-center justify-center">
                <span className="material-symbols-outlined text-xl">how_to_vote</span>
              </div>
            </div>

            <div className={`p-4 rounded-2xl border flex items-center justify-between ${
              isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-[#e5eeff]'
            }`}>
              <div>
                <span className={`text-[11px] font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-[#64748b]'}`}>
                  {isEn ? 'Published & Active' : 'Publicadas y Vigentes'}
                </span>
                <p className="text-2xl font-extrabold mt-1 text-emerald-400">
                  {metrics.publishedCount}
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
                <span className="material-symbols-outlined text-xl">verified</span>
              </div>
            </div>
          </div>

          {/* Controls: Search & Tabs */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            <div className={`flex items-center gap-1 p-1 rounded-2xl border self-start ${
              isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-[#e2e8f0]'
            }`}>
              <button
                type="button"
                onClick={() => setActiveFilter('all')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeFilter === 'all'
                    ? isDark ? 'bg-cyan-600 text-white shadow-xs' : 'bg-[#00288e] text-white shadow-xs'
                    : isDark ? 'text-slate-400 hover:text-white' : 'text-[#444653] hover:text-[#0b1c30]'
                }`}
              >
                {isEn ? 'All Publications' : 'Todas'} ({publications.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveFilter('forums')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeFilter === 'forums'
                    ? isDark ? 'bg-cyan-600 text-white shadow-xs' : 'bg-[#00288e] text-white shadow-xs'
                    : isDark ? 'text-slate-400 hover:text-white' : 'text-[#444653] hover:text-[#0b1c30]'
                }`}
              >
                {isEn ? 'Pedagogical Forums' : 'Foros de Debate'} ({metrics.forumsCount})
              </button>
              <button
                type="button"
                onClick={() => setActiveFilter('surveys')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeFilter === 'surveys'
                    ? isDark ? 'bg-cyan-600 text-white shadow-xs' : 'bg-[#00288e] text-white shadow-xs'
                    : isDark ? 'text-slate-400 hover:text-white' : 'text-[#444653] hover:text-[#0b1c30]'
                }`}
              >
                {isEn ? 'Surveys' : 'Encuestas'} ({metrics.surveysCount})
              </button>
            </div>

            <div className="relative w-full sm:w-72">
              <span className={`material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-lg ${
                isDark ? 'text-slate-500' : 'text-[#757684]'
              }`}>
                search
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={isEn ? 'Search publications...' : 'Buscar foros y encuestas...'}
                className={`w-full h-10 pl-9 pr-4 rounded-xl text-xs border focus:outline-none transition-all ${
                  isDark
                    ? 'bg-slate-900 border-slate-800 text-slate-100 placeholder-slate-500 focus:border-cyan-500'
                    : 'bg-white border-[#dce9ff] text-[#0b1c30] placeholder-slate-400 focus:border-[#00288e]'
                }`}
              />
            </div>
          </div>

          {/* Publications List */}
          {isLoading ? (
            <div className="py-16 text-center text-xs text-slate-400">
              <span className="inline-block animate-spin mr-2">⟳</span>
              {isEn ? 'Loading publications...' : 'Cargando foros y encuestas institucionales...'}
            </div>
          ) : filteredPubs.length === 0 ? (
            <div className={`p-12 text-center rounded-3xl border ${
              isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-[#e5eeff]'
            }`}>
              <div className="w-16 h-16 rounded-2xl mx-auto mb-3 bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
                <span className="material-symbols-outlined text-3xl">forum</span>
              </div>
              <h3 className={`text-base font-bold mb-1 ${isDark ? 'text-white' : 'text-[#0b1c30]'}`}>
                {isEn ? 'No publications found' : 'No hay publicaciones en esta categoría'}
              </h3>
              <p className={`text-xs max-w-sm mx-auto mb-4 ${isDark ? 'text-slate-400' : 'text-[#64748b]'}`}>
                {isEn
                  ? 'Create a forum for student discussion or a poll to collect feedback across your assigned groups.'
                  : 'Crea un foro de debate pedagógico o una encuesta con opciones para tus grupos asignados.'}
              </p>
              <div className="flex justify-center gap-3">
                <button
                  type="button"
                  onClick={() => handleOpenCreateModal('forum')}
                  className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs cursor-pointer"
                >
                  {isEn ? 'Create Forum' : 'Crear Primer Foro'}
                </button>
                <button
                  type="button"
                  onClick={() => handleOpenCreateModal('survey')}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs cursor-pointer"
                >
                  {isEn ? 'Create Poll' : 'Crear Encuesta'}
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filteredPubs.map((pub) => {
                const isPoll = pub.hasSurvey;
                const isPublished = pub.status === 'published';

                return (
                  <div
                    key={pub.id}
                    className={`p-5 rounded-3xl border flex flex-col justify-between transition-all ${
                      isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-[#e5eeff] shadow-xs'
                    }`}
                  >
                    <div>
                      {/* Top Badges */}
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                            isPoll
                              ? isDark ? 'bg-indigo-950 text-indigo-300 border border-indigo-800/40' : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                              : isDark ? 'bg-cyan-950 text-cyan-300 border border-cyan-800/40' : 'bg-cyan-50 text-cyan-700 border border-cyan-200'
                          }`}>
                            {isPoll ? (isEn ? 'Poll / Survey' : 'Encuesta Institucional') : (isEn ? 'Discussion Forum' : 'Foro Pedagógico')}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize ${
                            isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-700'
                          }`}>
                            {pub.category}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <span className={`w-2 h-2 rounded-full ${isPublished ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                          <span className={`text-[11px] font-bold ${isPublished ? 'text-emerald-400' : 'text-amber-400'}`}>
                            {isPublished ? (isEn ? 'Active' : 'Activo') : (isEn ? 'Draft' : 'Borrador')}
                          </span>
                        </div>
                      </div>

                      {/* Title & Content */}
                      <h3 className={`text-base font-bold leading-snug mb-1.5 ${isDark ? 'text-white' : 'text-[#0b1c30]'}`}>
                        {pub.title}
                      </h3>
                      <p className={`text-xs line-clamp-3 leading-relaxed mb-4 ${isDark ? 'text-slate-300' : 'text-[#444653]'}`}>
                        {pub.content}
                      </p>

                      {/* If survey: show options preview */}
                      {isPoll && pub.surveyOptions && pub.surveyOptions.length > 0 && (
                        <div className={`mb-4 p-3 rounded-2xl border space-y-1.5 ${
                          isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
                        }`}>
                          <span className={`text-[10px] font-bold uppercase tracking-wider block ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                            {pub.surveyQuestion || (isEn ? 'Poll Question:' : 'Pregunta de la votación:')}
                          </span>
                          <div className="space-y-1">
                            {pub.surveyOptions.slice(0, 3).map((opt) => (
                              <div key={opt.id} className="text-xs flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" />
                                <span className="truncate">{opt.text}</span>
                              </div>
                            ))}
                            {pub.surveyOptions.length > 3 && (
                              <span className="text-[10px] text-slate-400 font-medium pl-3.5 block">
                                +{pub.surveyOptions.length - 3} {isEn ? 'more options' : 'opciones más'}
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Target Groups Pills */}
                      <div className="flex items-center gap-1.5 flex-wrap mb-4">
                        <span className={`text-[10px] font-semibold ${isDark ? 'text-slate-400' : 'text-[#64748b]'}`}>
                          {isEn ? 'Target:' : 'Destinatarios:'}
                        </span>
                        {pub.targetGrades.map((tg) => (
                          <span
                            key={tg}
                            className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                              isDark ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-blue-50 border-blue-200 text-[#00288e]'
                            }`}
                          >
                            {tg === 'all' ? (isEn ? 'All Groups' : 'Todos los grupos') : tg}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Card Actions Footer */}
                    <div className={`pt-3 border-t flex flex-wrap items-center justify-between gap-2 ${
                      isDark ? 'border-slate-800' : 'border-[#eff4ff]'
                    }`}>
                      <span className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-[#64748b]'}`}>
                        {new Date(pub.createdAt).toLocaleDateString([], { day: '2-digit', month: 'short', year: 'numeric' })}
                      </span>

                      <div className="flex items-center gap-2">
                        {isPoll && (
                          <button
                            type="button"
                            onClick={() => handleViewResults(pub)}
                            className="px-3 py-1.5 rounded-xl bg-indigo-600/15 hover:bg-indigo-600 text-indigo-400 hover:text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                          >
                            <span className="material-symbols-outlined text-[16px]">bar_chart</span>
                            <span>{isEn ? 'Results' : 'Resultados'}</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => handleToggleStatus(pub)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                            isPublished
                              ? isDark ? 'border-amber-500/40 text-amber-300 hover:bg-amber-950/30' : 'border-amber-300 text-amber-800 hover:bg-amber-50'
                              : isDark ? 'border-emerald-500/40 text-emerald-300 hover:bg-emerald-950/30' : 'border-emerald-300 text-emerald-800 hover:bg-emerald-50'
                          }`}
                        >
                          {isPublished ? (isEn ? 'Close' : 'Cerrar') : (isEn ? 'Publish' : 'Publicar')}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDelete(pub)}
                          className="p-1.5 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                          title={isEn ? 'Delete publication' : 'Eliminar publicación'}
                        >
                          <span className="material-symbols-outlined text-[18px]">delete</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>

      {/* MODAL: CREATE FORUM OR POLL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className={`w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden border max-h-[90vh] flex flex-col ${
            isDark ? 'bg-slate-900 border-slate-700 text-slate-100 shadow-black/80' : 'bg-white border-[#e5eeff] text-[#0b1c30]'
          }`}>
            <div className={`p-5 text-white flex items-center justify-between shrink-0 ${
              pubType === 'survey'
                ? 'bg-gradient-to-r from-blue-700 to-indigo-700'
                : isDark ? 'bg-gradient-to-r from-slate-950 via-slate-900 to-cyan-950' : 'bg-gradient-to-r from-[#00288e] to-[#1e40af]'
            }`}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-white">
                  <span className="material-symbols-outlined text-[24px]">
                    {pubType === 'survey' ? 'poll' : 'forum'}
                  </span>
                </div>
                <div>
                  <h3 className="text-base font-bold leading-tight">
                    {pubType === 'survey'
                      ? isEn ? 'Create Institutional Poll' : 'Crear Encuesta Institucional'
                      : isEn ? 'Create Pedagogical Forum' : 'Crear Foro Pedagógico de Debate'}
                  </h3>
                  <p className="text-xs text-white/80">
                    {teacherName} • {teacherArea}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <form onSubmit={handleSavePublication} className="p-6 space-y-4 overflow-y-auto flex-1">
              {/* Type Switcher */}
              <div>
                <label className="block text-xs font-bold mb-1.5 opacity-90">
                  {isEn ? 'Publication Format *' : 'Tipo de Publicación *'}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPubType('forum')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-2 ${
                      pubType === 'forum'
                        ? isDark ? 'bg-cyan-600 text-white border-cyan-500' : 'bg-[#00288e] text-white border-[#00288e]'
                        : isDark ? 'bg-slate-950 border-slate-800 text-slate-400' : 'bg-slate-100 border-slate-300 text-slate-700'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[18px]">forum</span>
                    <span>{isEn ? 'Pedagogical Forum' : 'Foro de Debate'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPubType('survey')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-2 ${
                      pubType === 'survey'
                        ? isDark ? 'bg-indigo-600 text-white border-indigo-500' : 'bg-indigo-700 text-white border-indigo-700'
                        : isDark ? 'bg-slate-950 border-slate-800 text-slate-400' : 'bg-slate-100 border-slate-300 text-slate-700'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[18px]">how_to_vote</span>
                    <span>{isEn ? 'Survey / Poll' : 'Encuesta con Votación'}</span>
                  </button>
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-xs font-bold mb-1 opacity-90">
                  {isEn ? 'Title *' : 'Título de la Publicación *'}
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={
                    pubType === 'survey'
                      ? 'Ej: Encuesta de Elección de Temáticas para el Proyecto de Filosofía 2026'
                      : 'Ej: Foro de Discusión: Ética y Responsabilidad Ciudadana en la Era Digital'
                  }
                  className={`w-full h-11 px-3.5 rounded-xl text-xs border focus:outline-none transition-all ${
                    isDark
                      ? 'bg-slate-950 border-slate-700 text-white focus:border-cyan-500'
                      : 'bg-[#f8faff] border-slate-300 text-[#0b1c30] focus:border-[#00288e]'
                  }`}
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs font-bold mb-1 opacity-90">
                  {isEn ? 'Institutional Category *' : 'Categoría Temática *'}
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className={`w-full h-11 px-3.5 rounded-xl text-xs border focus:outline-none transition-all ${
                    isDark
                      ? 'bg-slate-950 border-slate-700 text-white focus:border-cyan-500'
                      : 'bg-[#f8faff] border-slate-300 text-[#0b1c30] focus:border-[#00288e]'
                  }`}
                >
                  <option value="academico">Académico y Plan de Estudios</option>
                  <option value="convivencia">Convivencia y Cultura de Paz</option>
                  <option value="evento">Evento Institucional o Actividad</option>
                  <option value="general">Información General</option>
                </select>
              </div>

              {/* Description / Instructions */}
              <div>
                <label className="block text-xs font-bold mb-1 opacity-90">
                  {isEn ? 'Description & Participation Guidelines *' : 'Descripción y Pautas de Participación *'}
                </label>
                <textarea
                  rows={3}
                  required
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Detalla el contexto, la pregunta orientadora o la justificación pedagógica..."
                  className={`w-full p-3 rounded-xl text-xs border focus:outline-none transition-all resize-none ${
                    isDark
                      ? 'bg-slate-950 border-slate-700 text-white focus:border-cyan-500'
                      : 'bg-[#f8faff] border-slate-300 text-[#0b1c30] focus:border-[#00288e]'
                  }`}
                />
              </div>

              {/* If Poll: Question and dynamic options */}
              {pubType === 'survey' && (
                <div className={`p-4 rounded-2xl border space-y-3 ${
                  isDark ? 'bg-slate-950 border-slate-800' : 'bg-indigo-50/50 border-indigo-200'
                }`}>
                  <div>
                    <label className="block text-xs font-bold text-indigo-400 mb-1">
                      {isEn ? 'Main Question *' : 'Pregunta Principal para Votar *'}
                    </label>
                    <input
                      type="text"
                      required
                      value={surveyQuestion}
                      onChange={(e) => setSurveyQuestion(e.target.value)}
                      placeholder="Ej: ¿Qué enfoque prefieres para el seminario de bioética?"
                      className={`w-full h-10 px-3 rounded-xl text-xs border focus:outline-none ${
                        isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                      }`}
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-bold text-indigo-400">
                        {isEn ? 'Voting Options (2 to 6)' : 'Opciones de Respuesta (2 a 6)'}
                      </label>
                      <button
                        type="button"
                        onClick={handleAddOption}
                        className="text-[11px] font-bold text-indigo-400 hover:text-indigo-300 cursor-pointer flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined text-sm">add</span>
                        <span>{isEn ? 'Add Option' : 'Agregar opción'}</span>
                      </button>
                    </div>

                    <div className="space-y-2">
                      {surveyOptions.map((opt, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <span className="text-xs font-bold opacity-60 w-4">{idx + 1}.</span>
                          <input
                            type="text"
                            required
                            value={opt}
                            onChange={(e) => {
                              const copy = [...surveyOptions];
                              copy[idx] = e.target.value;
                              setSurveyOptions(copy);
                            }}
                            className={`flex-1 h-9 px-3 rounded-xl text-xs border focus:outline-none ${
                              isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                            }`}
                          />
                          {surveyOptions.length > 2 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveOption(idx)}
                              className="w-8 h-8 rounded-xl text-rose-400 hover:bg-rose-500/10 flex items-center justify-center cursor-pointer"
                            >
                              <span className="material-symbols-outlined text-base">remove</span>
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Target Groups */}
              <div>
                <label className="block text-xs font-bold mb-1.5 opacity-90">
                  {isEn ? 'Target Groups *' : 'Grupos Asignados Destinatarios *'}
                </label>
                <div className="flex items-center gap-2 mb-2">
                  <input
                    type="checkbox"
                    id="cb-all-target"
                    checked={targetAllGroups}
                    onChange={(e) => setTargetAllGroups(e.target.checked)}
                    className="w-4 h-4 rounded text-cyan-600 focus:ring-cyan-500 cursor-pointer"
                  />
                  <label htmlFor="cb-all-target" className="text-xs font-semibold cursor-pointer">
                    {isEn ? 'All Groups of Institution' : 'Todos los grupos de la institución'}
                  </label>
                </div>

                {!targetAllGroups && (
                  <div className="flex flex-wrap gap-1.5 p-3 rounded-2xl border max-h-32 overflow-y-auto">
                    {assignedGroups.map((grp) => {
                      const isSelected = selectedGroups.includes(grp);
                      return (
                        <button
                          key={grp}
                          type="button"
                          onClick={() => handleToggleGroup(grp)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                            isSelected
                              ? isDark ? 'bg-cyan-600 text-white border-cyan-500' : 'bg-[#00288e] text-white border-[#00288e]'
                              : isDark ? 'bg-slate-950 border-slate-800 text-slate-400' : 'bg-slate-100 border-slate-200 text-slate-700'
                          }`}
                        >
                          {grp}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Status */}
              <div>
                <label className="block text-xs font-bold mb-1 opacity-90">
                  {isEn ? 'Initial Status' : 'Estado Inicial'}
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className={`w-full h-11 px-3.5 rounded-xl text-xs border focus:outline-none transition-all ${
                    isDark
                      ? 'bg-slate-950 border-slate-700 text-white'
                      : 'bg-[#f8faff] border-slate-300 text-[#0b1c30]'
                  }`}
                >
                  <option value="published">Publicado inmediatamente (visible a estudiantes)</option>
                  <option value="draft">Borrador (guardado para editar más tarde)</option>
                </select>
              </div>

              {/* Modal Footer Actions */}
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer text-slate-400 hover:text-white"
                >
                  {isEn ? 'Cancel' : 'Cancelar'}
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className={`px-5 py-2.5 rounded-xl text-white text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-md disabled:opacity-50 ${
                    pubType === 'survey' ? 'bg-indigo-600 hover:bg-indigo-500' : 'bg-cyan-600 hover:bg-cyan-500'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">send</span>
                  <span>{isSaving ? (isEn ? 'Publishing...' : 'Publicando...') : (isEn ? 'Publish Now' : 'Publicar')}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: SURVEY RESULTS BREAKDOWN */}
      {viewingResultsPub && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className={`w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden border max-h-[90vh] flex flex-col ${
            isDark ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-[#e5eeff] text-[#0b1c30]'
          }`}>
            <div className="p-5 bg-gradient-to-r from-indigo-700 to-blue-700 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[24px]">leaderboard</span>
                </div>
                <div>
                  <h3 className="text-base font-bold leading-tight">
                    {isEn ? 'Survey Results & Votes' : 'Resultados de la Votación'}
                  </h3>
                  <p className="text-xs text-indigo-200 truncate max-w-xs">
                    {viewingResultsPub.title}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setViewingResultsPub(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto flex-1">
              {isLoadingResults ? (
                <div className="py-12 text-center text-xs text-slate-400">
                  <span className="inline-block animate-spin mr-2">⟳</span>
                  {isEn ? 'Computing votes...' : 'Calculando resultados en vivo...'}
                </div>
              ) : surveyResults ? (
                <>
                  <div className={`p-4 rounded-2xl border flex items-center justify-between ${
                    isDark ? 'bg-slate-950 border-slate-800' : 'bg-indigo-50/60 border-indigo-200'
                  }`}>
                    <div>
                      <span className="text-xs font-bold opacity-80">{isEn ? 'Total Student Votes' : 'Total Votos Recibidos'}</span>
                      <p className="text-2xl font-extrabold text-indigo-400 mt-0.5">{surveyResults.totalVotes}</p>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      Sincronizado con Estudiantes
                    </span>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider mb-2 opacity-80">
                      {isEn ? 'Options Breakdown' : 'Distribución por Opción'}
                    </h4>
                    <div className="space-y-3">
                      {surveyResults.options.map((opt) => (
                        <div key={opt.id} className="space-y-1">
                          <div className="flex items-center justify-between text-xs font-semibold">
                            <span>{opt.text}</span>
                            <span className="font-mono text-indigo-400 font-bold">
                              {opt.votes} {isEn ? 'votes' : 'votos'} ({opt.percentage}%)
                            </span>
                          </div>
                          <div className={`w-full h-3 rounded-full overflow-hidden ${
                            isDark ? 'bg-slate-800' : 'bg-slate-200'
                          }`}>
                            <div
                              className="h-full rounded-full bg-indigo-500 transition-all duration-500"
                              style={{ width: `${opt.percentage}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {surveyResults.responses.length > 0 && (
                    <div className="pt-2">
                      <h4 className="text-xs font-bold uppercase tracking-wider mb-2 opacity-80">
                        {isEn ? 'Registered Student Voters' : 'Estudiantes Participantes'}
                      </h4>
                      <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1 text-xs">
                        {surveyResults.responses.map((resp) => (
                          <div
                            key={resp.id}
                            className={`p-2.5 rounded-xl border flex items-center justify-between ${
                              isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
                            }`}
                          >
                            <div>
                              <span className="font-bold block">{resp.studentName}</span>
                              <span className="text-[10px] text-slate-400">{resp.studentGrade}</span>
                            </div>
                            <span className="text-[11px] font-semibold text-indigo-400 px-2 py-0.5 rounded-md bg-indigo-500/10">
                              {resp.optionText}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : null}

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => setViewingResultsPub(null)}
                  className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isDark ? 'bg-slate-800 hover:bg-slate-700 text-white' : 'bg-slate-200 hover:bg-slate-300 text-slate-800'
                  }`}
                >
                  {isEn ? 'Close' : 'Cerrar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SCHEDULE MODAL */}
      <TeacherScheduleModal
        isOpen={showScheduleModal}
        onClose={() => setShowScheduleModal(false)}
        currentUser={currentUser}
      />
    </div>
  );
};
