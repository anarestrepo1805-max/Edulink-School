import React, { useState, useEffect, useMemo } from 'react';
import { ActiveScreen, UserProfile, InstitutionalPublicationDoc } from '../types';
import { ASSETS } from '../data/mockData';
import { useThemeLanguage } from '../context/ThemeLanguageContext';
import {
  fetchInstitutionalPublicationsForStudent,
  checkStudentSurveySubmission,
  submitStudentSurveyVote
} from '../services/studentProfileService';

interface StudentForumViewProps {
  currentUser?: UserProfile | null;
  onNavigate: (screen: ActiveScreen) => void;
  onLogout: () => void;
  onUpdateUser?: (updated: UserProfile) => void;
}

export const StudentForumView: React.FC<StudentForumViewProps> = ({
  currentUser,
  onNavigate,
  onLogout,
  onUpdateUser: _onUpdateUser
}) => {
  const { theme, language } = useThemeLanguage();
  const isDark = theme === 'dark';
  const isEn = language === 'en';

  const [activeTab, setActiveTab] = useState<'publications' | 'surveys'>('publications');
  const [publications, setPublications] = useState<InstitutionalPublicationDoc[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Survey voting state
  const [selectedSurveyOptions, setSelectedSurveyOptions] = useState<Record<string, string>>({});
  const [votedSurveys, setVotedSurveys] = useState<Record<string, boolean>>({});
  const [isSubmittingVote, setIsSubmittingVote] = useState<Record<string, boolean>>({});
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const studentName = currentUser?.fullName || (isEn ? 'Student' : 'Estudiante');
  const studentGrade = currentUser?.gradeLevel || '11°1';
  const studentKey = currentUser?.documentId || currentUser?.id || currentUser?.studentCode || '';

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Load real institutional publications from Firestore
  useEffect(() => {
    let isMounted = true;
    const loadPublications = async () => {
      setIsLoading(true);
      try {
        const studentGroup = currentUser?.group || '';
        const realDocs = await fetchInstitutionalPublicationsForStudent(studentGrade, studentGroup);
        if (isMounted) {
          setPublications(realDocs);

          // Check which surveys the student has already voted in
          if (studentKey && realDocs.length > 0) {
            for (const pub of realDocs) {
              if (pub.hasSurvey) {
                const sub = await checkStudentSurveySubmission(pub.id, studentKey);
                if (sub && isMounted) {
                  setVotedSurveys((prev) => ({ ...prev, [pub.id]: true }));
                  setSelectedSurveyOptions((prev) => ({ ...prev, [pub.id]: sub.optionId }));
                }
              }
            }
          }
        }
      } catch (err) {
        console.warn('Error loading institutional publications from Firestore:', err);
        if (isMounted) {
          setPublications([]);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadPublications();
    return () => {
      isMounted = false;
    };
  }, [studentGrade, currentUser?.group, studentKey]);

  // Handle vote submission
  const handleVoteSubmit = async (pub: InstitutionalPublicationDoc) => {
    const selectedOptId = selectedSurveyOptions[pub.id];
    if (!selectedOptId) {
      showToast(isEn ? 'Please select an option to vote.' : 'Por favor selecciona una opción antes de votar.');
      return;
    }

    if (!studentKey) {
      showToast(isEn ? 'User session not verified.' : 'No se pudo verificar la sesión del estudiante.');
      return;
    }

    const selectedOption = pub.surveyOptions?.find((o) => o.id === selectedOptId);
    if (!selectedOption) return;

    setIsSubmittingVote((prev) => ({ ...prev, [pub.id]: true }));

    try {
      await submitStudentSurveyVote({
        publicationId: pub.id,
        studentId: studentKey,
        studentName,
        studentGrade,
        optionId: selectedOptId,
        optionText: selectedOption.text
      });

      setVotedSurveys((prev) => ({ ...prev, [pub.id]: true }));
      showToast(
        isEn
          ? 'Your response was successfully recorded in the institutional database.'
          : 'Tu respuesta ha sido registrada exitosamente en la base de datos institucional.'
      );
    } catch (err) {
      console.error('Error submitting survey vote:', err);
      showToast(
        isEn
          ? 'Error recording your response. Please try again.'
          : 'Error al registrar tu voto. Por favor intenta de nuevo.'
      );
    } finally {
      setIsSubmittingVote((prev) => ({ ...prev, [pub.id]: false }));
    }
  };

  // Filtered publications
  const filteredPublications = useMemo(() => {
    return publications
      .filter((p) => (activeTab === 'surveys' ? p.hasSurvey : true))
      .filter((p) => {
        if (selectedCategory === 'all') return true;
        return p.category === selectedCategory;
      })
      .filter((p) => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
          p.title.toLowerCase().includes(q) ||
          p.content.toLowerCase().includes(q) ||
          p.authorName.toLowerCase().includes(q)
        );
      });
  }, [publications, activeTab, selectedCategory, searchQuery]);

  const surveyCount = useMemo(() => {
    return publications.filter((p) => p.hasSurvey).length;
  }, [publications]);

  return (
    <div
      className={`min-h-screen flex flex-col transition-colors duration-200 ${
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

      {/* FIXED SIDEBAR (Portal Estudiantil) */}
      <aside
        className={`hidden lg:flex fixed left-0 top-12 bottom-0 w-72 shadow-xs z-40 flex-col justify-between border-r transition-colors ${
          isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-[#e5eeff]'
        }`}
      >
        <div className="flex flex-col">
          {/* Logo & School Header */}
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
                {isEn ? 'Student Portal' : 'Portal Estudiantil'}
              </span>
            </div>
          </div>

          {/* Navigation Links (Dedicated to student) */}
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
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all text-left cursor-pointer ${
                isDark ? 'text-slate-300 hover:bg-slate-800 hover:text-cyan-300' : 'text-[#444653] hover:bg-[#eff4ff] hover:text-[#00288e]'
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">assignment</span>
              <span>{isEn ? 'Tasks & Workshops' : 'Tareas y Entregas'}</span>
            </button>

            {/* ACTIVE SCREEN: Foro y encuestas */}
            <button
              onClick={() => onNavigate('student_forum')}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl font-bold text-sm shadow-sm transition-all text-left cursor-pointer ${
                isDark ? 'bg-cyan-600 text-white' : 'bg-[#1e40af] text-white'
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">forum</span>
              <span>{isEn ? 'Forums & Surveys' : 'Foro y encuestas'}</span>
            </button>
          </nav>
        </div>

        {/* Institutional Status Badge */}
        <div className={`p-4 border-t ${isDark ? 'border-slate-800' : 'border-[#eff4ff]'}`}>
          <div
            className={`rounded-xl p-3 flex items-center justify-between border ${
              isDark ? 'bg-slate-800/80 border-slate-700' : 'bg-[#eff4ff] border-[#dce9ff]'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className={`material-symbols-outlined text-[20px] ${isDark ? 'text-cyan-400' : 'text-[#0051d5]'}`}>
                verified
              </span>
              <span className={`text-xs font-bold ${isDark ? 'text-white' : 'text-[#0b1c30]'}`}>
                {isEn ? 'Year 2026' : 'Año 2026'}
              </span>
            </div>
            <span className={`text-xs font-medium ${isDark ? 'text-slate-400' : 'text-[#444653]'}`}>
              I.E. Vallejuelos
            </span>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="lg:pl-72 flex-1 flex flex-col min-w-0">
        {/* TOP BAR */}
        <header
          className={`h-16 border-b px-4 sm:px-6 lg:px-8 flex items-center justify-between sticky top-12 z-30 shadow-xs transition-colors ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-[#e5eeff]'
          }`}
        >
          {/* Breadcrumb / Section Header */}
          <div className="flex items-center gap-2 min-w-0">
            <span className="material-symbols-outlined text-cyan-400 text-[22px]">forum</span>
            <div className="flex flex-col">
              <h1 className={`text-sm sm:text-base font-extrabold tracking-tight truncate ${isDark ? 'text-white' : 'text-[#0b1c30]'}`}>
                {isEn ? 'Institutional Forums & Surveys' : 'Foro y Encuestas Institucionales'}
              </h1>
              <span className="text-[11px] text-slate-400 hidden sm:block">
                {isEn ? 'Official announcements and institutional participation' : 'Información oficial publicada por docentes y directivos'}
              </span>
            </div>
          </div>

          {/* Student Profile in Header - Clean, NO "Taller 1" */}
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:flex flex-col">
              <span className={`text-xs font-bold leading-tight ${isDark ? 'text-white' : 'text-[#0b1c30]'}`}>
                {studentName}
              </span>
              <span className={`text-[11px] leading-tight mt-0.5 font-medium ${isDark ? 'text-slate-400' : 'text-[#444653]'}`}>
                {/* Clean role badge without 'Taller 1' */}
                {isEn ? 'Student' : 'Estudiante'} • {studentGrade}
              </span>
            </div>

            <div className="relative">
              <img
                src={currentUser?.avatarUrl || ASSETS.studentAvatar}
                alt={studentName}
                className={`w-9 h-9 rounded-full object-cover ring-2 shadow-xs ${
                  isDark ? 'ring-cyan-500/40' : 'ring-[#1e40af]/20'
                }`}
              />
              <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-slate-900" />
            </div>
          </div>
        </header>

        {/* MAIN BODY */}
        <main className="p-4 sm:p-6 lg:p-8 flex flex-col gap-6 max-w-[1200px] w-full mx-auto">
          {/* Hero Banner */}
          <section
            className={`relative overflow-hidden rounded-3xl p-6 lg:p-7 text-white shadow-md border ${
              isDark
                ? 'bg-gradient-to-r from-slate-900 via-slate-800 to-cyan-950 border-cyan-500/20'
                : 'bg-gradient-to-r from-[#00288e] via-[#0051d5] to-[#1e40af] border-[#1e40af]'
            }`}
          >
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-5">
              <div className="max-w-xl space-y-2 text-center md:text-left">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-[11px] font-bold tracking-wide uppercase text-white">
                  <span className="w-2 h-2 rounded-full bg-cyan-300 animate-pulse" />
                  {isEn ? 'Institutional Channel' : 'Canal Oficial Institucional'}
                </div>
                <h2 className="text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight">
                  {isEn ? 'Institutional Information & Surveys' : 'Foro y Encuestas Estudiantiles'}
                </h2>
                <p className="text-xs sm:text-sm text-cyan-100 font-normal leading-relaxed">
                  {isEn
                    ? 'Here you will find announcements, academic debate topics, and official surveys published by authorized teachers and directive coordinators.'
                    : 'Espacio para consultar circulares informativas, debates académicos y encuestas de participación habilitadas por los docentes y directivos de la I.E. Vallejuelos.'}
                </p>
              </div>
            </div>
          </section>

          {/* SECTION TABS: PUBLICACIONES VS ENCUESTAS */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b pb-3 border-slate-700/50">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveTab('publications')}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
                  activeTab === 'publications'
                    ? isDark
                      ? 'bg-cyan-600 text-white shadow-md'
                      : 'bg-[#00288e] text-white shadow-sm'
                    : isDark
                    ? 'bg-slate-900 text-slate-300 hover:bg-slate-800'
                    : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">article</span>
                <span>{isEn ? 'Institutional Publications' : 'Publicaciones y Foros'}</span>
                <span className="text-[11px] px-1.5 py-0.5 rounded-full bg-white/20">
                  {publications.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('surveys')}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
                  activeTab === 'surveys'
                    ? isDark
                      ? 'bg-cyan-600 text-white shadow-md'
                      : 'bg-[#00288e] text-white shadow-sm'
                    : isDark
                    ? 'bg-slate-900 text-slate-300 hover:bg-slate-800'
                    : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">how_to_vote</span>
                <span>{isEn ? 'Active Surveys' : 'Encuestas Institucionales'}</span>
                <span className="text-[11px] px-1.5 py-0.5 rounded-full bg-white/20">
                  {surveyCount}
                </span>
              </button>
            </div>

            {/* Search filter if there is content */}
            {publications.length > 0 && (
              <div className="relative w-full sm:w-64">
                <span className="material-symbols-outlined absolute left-3 top-2.5 text-[18px] text-slate-400">
                  search
                </span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={isEn ? 'Search publications...' : 'Buscar publicaciones...'}
                  className={`w-full h-9 pl-9 pr-3 rounded-xl text-xs focus:outline-none transition-all border ${
                    isDark
                      ? 'bg-slate-900 border-slate-700 text-white focus:border-cyan-500'
                      : 'bg-white border-slate-300 text-slate-800 focus:border-[#00288e]'
                  }`}
                />
              </div>
            )}
          </div>

          {/* LOADING STATE */}
          {isLoading && (
            <div className="py-16 flex flex-col items-center justify-center gap-3 text-slate-400">
              <span className="w-8 h-8 border-3 border-cyan-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-xs font-semibold">
                {isEn ? 'Connecting to Firestore database...' : 'Consultando base de datos institucional en Firestore...'}
              </span>
            </div>
          )}

          {/* EMPTY STATES AS EXPLICITLY REQUIRED IN PROMPT POINT 4 */}
          {!isLoading && filteredPublications.length === 0 && (
            <div
              className={`rounded-3xl p-10 sm:p-14 text-center border flex flex-col items-center justify-center max-w-xl mx-auto my-6 ${
                isDark
                  ? 'bg-slate-900/60 border-slate-800/80 text-slate-300'
                  : 'bg-white border-[#e5eeff] text-[#444653] shadow-xs'
              }`}
            >
              <div
                className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 ${
                  isDark ? 'bg-slate-800 text-cyan-400' : 'bg-[#eff4ff] text-[#00288e]'
                }`}
              >
                <span className="material-symbols-outlined text-[32px]">
                  {activeTab === 'surveys' ? 'how_to_vote' : 'forum'}
                </span>
              </div>

              {/* Exact discrete empty state text as requested in requirement */}
              <h3 className={`text-lg font-extrabold mb-1.5 ${isDark ? 'text-white' : 'text-[#0b1c30]'}`}>
                {activeTab === 'surveys'
                  ? (isEn ? 'No surveys available at this time' : 'Aún no hay encuestas disponibles')
                  : (isEn ? 'No institutional publications yet' : 'Aún no hay publicaciones institucionales')}
              </h3>

              <p className={`text-xs max-w-md leading-relaxed ${isDark ? 'text-slate-400' : 'text-[#64748b]'}`}>
                {activeTab === 'surveys'
                  ? (isEn
                      ? 'Institutional queries and voting enabled for students will appear here when authorized by the faculty or administrative board.'
                      : 'Las consultas y votaciones institucionales dirigidas a tu grado se mostrarán en esta sección cuando sean publicadas y habilitadas por los docentes o la administración.')
                  : (isEn
                      ? 'Authorized faculty and administrators have not published announcements or debate topics for your grade yet. Content will be displayed once published.'
                      : 'En este momento los docentes y el personal directivo no han emitido comunicados ni temas de debate para tu grado. Tan pronto se publique información oficial en la plataforma, aparecerá aquí.')}
              </p>

              <div className="mt-6 flex items-center gap-2 text-[11px] text-cyan-400 font-semibold bg-cyan-950/40 px-3.5 py-1.5 rounded-full border border-cyan-800/40">
                <span className="material-symbols-outlined text-[15px]">verified</span>
                <span>{isEn ? 'Connected to Firebase Cloud Firestore' : 'Conectado a Firebase Cloud Firestore'}</span>
              </div>
            </div>
          )}

          {/* REAL PUBLICATIONS & DEBATE FORUMS LIST (ONLY WHEN REAL DATA EXISTS IN FIRESTORE) */}
          {!isLoading && filteredPublications.length > 0 && (
            <div className="space-y-4">
              {filteredPublications.map((pub) => {
                const hasVoted = votedSurveys[pub.id];
                const isVoting = isSubmittingVote[pub.id];
                const selectedOpt = selectedSurveyOptions[pub.id];

                return (
                  <article
                    key={pub.id}
                    className={`rounded-2xl p-5 sm:p-6 border transition-all ${
                      isDark
                        ? 'bg-slate-900 border-slate-800 hover:border-cyan-500/40'
                        : 'bg-white border-[#e5eeff] hover:shadow-md'
                    }`}
                  >
                    {/* Publication Header */}
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                              pub.authorRole === 'docente'
                                ? 'bg-cyan-950 text-cyan-300 border border-cyan-800/50'
                                : 'bg-purple-950 text-purple-300 border border-purple-800/50'
                            }`}
                          >
                            {pub.authorRole === 'docente' ? 'Docente' : 'Directivo / Administración'}
                          </span>
                          <span className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                            {pub.authorName}
                          </span>
                        </div>
                        <h3 className={`text-base font-extrabold leading-snug ${isDark ? 'text-white' : 'text-[#0b1c30]'}`}>
                          {pub.title}
                        </h3>
                      </div>

                      <span className="text-[11px] text-slate-400 shrink-0 font-mono">
                        {pub.createdAt ? new Date(pub.createdAt).toLocaleDateString() : ''}
                      </span>
                    </div>

                    {/* Publication Content Body */}
                    <p className={`text-xs sm:text-sm leading-relaxed mb-4 whitespace-pre-line ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                      {pub.content}
                    </p>

                    {/* Optional Attachment */}
                    {pub.attachmentName && (
                      <div className={`p-3 rounded-xl border flex items-center justify-between gap-2 mb-4 ${
                        isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
                      }`}>
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="material-symbols-outlined text-cyan-400 text-[18px]">attachment</span>
                          <span className="text-xs font-semibold truncate">{pub.attachmentName}</span>
                        </div>
                        {pub.attachmentUrl && (
                          <a
                            href={pub.attachmentUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs font-bold text-cyan-400 hover:underline"
                          >
                            {isEn ? 'View file' : 'Ver archivo'}
                          </a>
                        )}
                      </div>
                    )}

                    {/* INTEGRATED SURVEY VOTING SECTION (IF PUBLICATION INCLUDES SURVEY) */}
                    {pub.hasSurvey && pub.surveyOptions && pub.surveyOptions.length > 0 && (
                      <div
                        className={`mt-4 p-4 rounded-xl border ${
                          isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-[#f8faff] border-[#dce9ff]'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-3">
                          <span className="material-symbols-outlined text-amber-400 text-[18px]">how_to_vote</span>
                          <h4 className={`text-xs sm:text-sm font-bold ${isDark ? 'text-white' : 'text-[#0b1c30]'}`}>
                            {pub.surveyQuestion || (isEn ? 'Institutional Consultation' : 'Consulta Institucional')}
                          </h4>
                        </div>

                        {/* Survey Options Radio Group */}
                        <div className="space-y-2 mb-4">
                          {pub.surveyOptions.map((opt) => {
                            const isSelected = selectedOpt === opt.id;
                            return (
                              <label
                                key={opt.id}
                                className={`flex items-center justify-between p-3 rounded-xl border text-xs transition-all cursor-pointer ${
                                  hasVoted
                                    ? isSelected
                                      ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                                      : 'bg-transparent border-slate-800/40 text-slate-500 opacity-60'
                                    : isSelected
                                    ? 'bg-cyan-500/15 border-cyan-500/50 text-cyan-300'
                                    : isDark
                                    ? 'bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-300'
                                    : 'bg-white border-slate-200 hover:border-slate-300 text-slate-800'
                                }`}
                              >
                                <div className="flex items-center gap-2.5">
                                  <input
                                    type="radio"
                                    name={`survey_${pub.id}`}
                                    value={opt.id}
                                    disabled={hasVoted || isVoting}
                                    checked={isSelected}
                                    onChange={() =>
                                      setSelectedSurveyOptions((prev) => ({
                                        ...prev,
                                        [pub.id]: opt.id
                                      }))
                                    }
                                    className="accent-cyan-500 cursor-pointer"
                                  />
                                  <span className="font-semibold">{opt.text}</span>
                                </div>
                                {hasVoted && isSelected && (
                                  <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1">
                                    <span className="material-symbols-outlined text-[14px]">check</span>
                                    {isEn ? 'Your vote' : 'Tu selección'}
                                  </span>
                                )}
                              </label>
                            );
                          })}
                        </div>

                        {/* Submit Button or Already Voted Badge */}
                        <div className="flex items-center justify-between">
                          {hasVoted ? (
                            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                              <span className="material-symbols-outlined text-[16px]">check_circle</span>
                              <span>{isEn ? 'Response recorded in Firebase.' : 'Respuesta registrada en la base de datos.'}</span>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleVoteSubmit(pub)}
                              disabled={isVoting || !selectedOpt}
                              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm disabled:opacity-40 ${
                                isDark ? 'bg-cyan-600 hover:bg-cyan-500 text-white' : 'bg-[#00288e] hover:bg-[#1e40af] text-white'
                              }`}
                            >
                              {isVoting ? (
                                <span>{isEn ? 'Saving vote...' : 'Registrando respuesta...'}</span>
                              ) : (
                                <>
                                  <span className="material-symbols-outlined text-[16px]">how_to_vote</span>
                                  <span>{isEn ? 'Submit Vote' : 'Enviar Respuesta'}</span>
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </main>
      </div>

      {/* STUDENT PROFILE & PHOTO EDIT MODAL */}
      {currentUser && (
        <StudentProfileModal
          currentUser={currentUser}
          isOpen={showProfileModal}
          onClose={() => setShowProfileModal(false)}
          onUpdateUser={(updated) => {
            if (onUpdateUser) onUpdateUser(updated);
          }}
        />
      )}
    </div>
  );
};
