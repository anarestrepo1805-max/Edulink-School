import React, { useState } from 'react';
import { ActiveScreen, NewsFeedItem, UserProfile } from '../types';
import { ASSETS, INITIAL_NEWS_FEED } from '../data/mockData';
import { OFFICIAL_SCHEDULE_8_1 } from '../data/institutionalCensus';
import { saveUserConfiguration } from '../services/authService';
import { useThemeLanguage } from '../context/ThemeLanguageContext';
import { generateStudentReportCardPdf } from '../services/reportCardPdfService';

interface FamilyDashboardViewProps {
  currentUser?: UserProfile | null;
  onNavigate: (screen: ActiveScreen) => void;
  onLogout: () => void;
  onUpdateUser?: (updated: UserProfile) => void;
}

export const FamilyDashboardView: React.FC<FamilyDashboardViewProps> = ({
  currentUser,
  onNavigate,
  onLogout,
  onUpdateUser
}) => {
  const { theme, language } = useThemeLanguage();
  const isDark = theme === 'dark';
  const isEn = language === 'en';

  const isConfigured = Boolean(currentUser?.hasConfigured);
  const parentName = currentUser?.fullName || (isEn ? 'Elena Gómez Jiménez' : 'Elena Gómez Jiménez');
  const [activeCategory, setActiveCategory] = useState<'all' | 'grades' | 'meetings' | 'notices'>('all');
  const [confirmedMeeting, setConfirmedMeeting] = useState(false);
  const [isConfiguringDemo, setIsConfiguringDemo] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleLoadDemoFamily = async () => {
    setIsConfiguringDemo(true);
    if (currentUser) {
      try {
        const updated = await saveUserConfiguration(currentUser.id, {
          hasConfigured: true
        });
        if (onUpdateUser) onUpdateUser(updated);
        showToast(isEn ? 'Family demo profile loaded.' : 'Perfil familiar cargado exitosamente.');
      } catch (err) {
        console.warn('Error saving family config:', err);
      }
    }
    setIsConfiguringDemo(false);
  };

  // Real student: Valentina Gómez Suárez, Grado 8°1, doc: 1007855552
  const currentStudent = {
    name: currentUser?.representedStudentName || 'Valentina Gómez Suárez',
    grade: currentUser?.gradeLevel || (isEn ? 'Grade 8°1' : 'Grado 8°1'),
    matricula: currentUser?.representedStudentCode || '1007855552',
    avatar: ASSETS.studentSofia || ASSETS.studentAvatar,
    director: 'Lic. Gabriel Mendoza C.',
    average: '4.6',
    attendance: '98%',
    attendanceDetail: isEn ? '48 of 49 classes attended' : '48 de 49 clases asistidas',
    rank: isEn ? 'Rank 2nd of 34' : 'Puesto 2° de 34'
  };

  const handleDownloadReportCard = () => {
    try {
      generateStudentReportCardPdf({
        studentName: currentStudent.name,
        documentId: currentStudent.matricula,
        grade: currentStudent.grade,
        term: '1° Período 2026',
        groupDirector: currentStudent.director
      });
      showToast(isEn ? 'Official report card PDF downloaded.' : 'Boletín oficial PDF descargado exitosamente.');
    } catch (e) {
      console.error(e);
      showToast(isEn ? 'Error generating PDF report card.' : 'Error al generar el boletín en PDF.');
    }
  };

  const filteredFeed: NewsFeedItem[] = INITIAL_NEWS_FEED.filter((item) => {
    if (activeCategory === 'all') return true;
    return item.category === activeCategory;
  });

  return (
    <div className={`min-h-screen flex transition-colors duration-200 ${
      isDark ? 'bg-slate-950 text-slate-100' : 'bg-[#f8f9ff] text-[#0b1c30]'
    }`}>
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-16 right-4 z-50 bg-slate-900 border border-amber-500/40 text-amber-300 px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 text-xs font-bold animate-in fade-in duration-200">
          <span className="material-symbols-outlined text-[18px]">info</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* FIXED SIDEBAR (Portal Familiar) */}
      <aside className={`hidden lg:flex fixed left-0 top-12 bottom-0 w-72 shadow-xs z-40 flex-col justify-between border-r transition-colors ${
        isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-[#e5eeff]'
      }`}>
        <div className="flex flex-col">
          <div className={`h-20 px-6 flex items-center gap-3 border-b ${
            isDark ? 'border-slate-800' : 'border-[#eff4ff]'
          }`}>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
              isDark ? 'bg-amber-950 border-amber-800 text-amber-300' : 'bg-[#eff4ff] border-[#dce9ff] text-[#00288e]'
            }`}>
              <span className="material-symbols-outlined text-2xl">school</span>
            </div>
            <div className="flex flex-col">
              <span className={`text-lg font-extrabold leading-tight ${isDark ? 'text-white' : 'text-[#00288e]'}`}>
                Edulink School
              </span>
              <span className={`text-[11px] font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-[#444653]'}`}>
                {isEn ? 'Family Portal' : 'Portal Familiar'}
              </span>
            </div>
          </div>

          <nav className="flex flex-col gap-1 px-4 py-4">
            <button
              onClick={() => onNavigate('family_dashboard')}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl font-bold text-xs shadow-sm transition-all text-left cursor-pointer ${
                isDark ? 'bg-amber-600 text-white' : 'bg-[#1e40af] text-white'
              }`}
            >
              <span className="material-symbols-outlined text-xl">dashboard</span>
              <span>{isEn ? 'Home / Overview' : 'Inicio / Dashboard'}</span>
            </button>
            <button
              onClick={handleDownloadReportCard}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all text-left cursor-pointer ${
                isDark ? 'text-slate-300 hover:bg-slate-800 hover:text-white' : 'text-[#444653] hover:bg-[#eff4ff] hover:text-[#0b1c30]'
              }`}
            >
              <span className="material-symbols-outlined text-xl">assignment</span>
              <span>{isEn ? 'Grades & Official Report Card' : 'Calificaciones y Boletín'}</span>
            </button>
            <button
              onClick={() => setShowScheduleModal(true)}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all text-left cursor-pointer ${
                isDark ? 'text-slate-300 hover:bg-slate-800 hover:text-white' : 'text-[#444653] hover:bg-[#eff4ff] hover:text-[#0b1c30]'
              }`}
            >
              <span className="material-symbols-outlined text-xl">calendar_today</span>
              <span>{isEn ? 'Class Schedule 8°1' : 'Horario Escolar (8°1)'}</span>
            </button>
            <button
              onClick={() => showToast(isEn ? 'Behavior log: Exemplary conduct Type A. No disciplinary notes.' : 'Observador convivencial: Conducta Ejemplar Tipo A. Sin anotaciones.')}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all text-left cursor-pointer ${
                isDark ? 'text-slate-300 hover:bg-slate-800 hover:text-white' : 'text-[#444653] hover:bg-[#eff4ff] hover:text-[#0b1c30]'
              }`}
            >
              <span className="material-symbols-outlined text-xl">verified_user</span>
              <span>{isEn ? 'Behavior Log' : 'Observador Convivencial'}</span>
            </button>
            <button
              onClick={() => onNavigate('family_messaging')}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all text-left group cursor-pointer ${
                isDark ? 'text-slate-300 hover:bg-slate-800 hover:text-amber-300' : 'text-[#444653] hover:bg-[#eff4ff] hover:text-[#00288e]'
              }`}
            >
              <span className="material-symbols-outlined text-xl">mail</span>
              <span className="text-xs font-semibold">{isEn ? 'Chat & Notices' : 'Chat y Comunicados'}</span>
              <span className="ml-auto px-1.5 py-0.2 bg-amber-500 text-white text-[10px] font-bold rounded-full">
                1
              </span>
            </button>
          </nav>
        </div>

        <div className={`p-4 border-t ${isDark ? 'border-slate-800' : 'border-[#eff4ff]'}`}>
          <div className={`p-3.5 rounded-xl flex flex-col gap-1 border ${
            isDark ? 'bg-slate-800 border-slate-700' : 'bg-[#eff4ff] border-[#dce9ff]'
          }`}>
            <div className={`flex items-center gap-1.5 ${isDark ? 'text-slate-300' : 'text-[#444653]'}`}>
              <span className={`material-symbols-outlined text-sm ${isDark ? 'text-amber-400' : 'text-[#0051d5]'}`}>account_balance</span>
              <span className="text-[11px] font-bold">I.E. Vallejuelos</span>
            </div>
            <span className={`text-xs font-bold ${isDark ? 'text-white' : 'text-[#0b1c30]'}`}>
              {isEn ? 'School Year 2026' : 'Año lectivo 2026'}
            </span>
          </div>
        </div>
      </aside>

      {/* MAIN CONTAINER */}
      <div className="flex-1 lg:pl-72 flex flex-col min-w-0">
        {/* HEADER BAR */}
        <header className={`sticky top-12 h-20 backdrop-blur-xl shadow-xs z-30 flex items-center justify-between px-4 sm:px-6 lg:px-8 border-b transition-colors ${
          isDark ? 'bg-slate-900/95 border-slate-800' : 'bg-white/95 border-[#e5eeff]'
        }`}>
          {/* Active Student badge (No switcher) */}
          <div className="flex items-center">
            <div
              className={`flex items-center gap-3 px-3.5 py-1.5 rounded-xl border ${
                isDark ? 'bg-slate-800 border-slate-700' : 'bg-[#eff4ff] border-[#dce9ff]'
              }`}
            >
              <div className={`w-9 h-9 rounded-full flex items-center justify-center font-extrabold text-sm shrink-0 ${
                isDark ? 'bg-amber-500/20 text-amber-300' : 'bg-[#dbe1ff] text-[#00288e]'
              }`}>
                {currentStudent.name[0]}
              </div>
              <div className="flex flex-col text-left">
                <span className={`text-[10px] font-medium leading-none ${isDark ? 'text-slate-400' : 'text-[#444653]'}`}>
                  {isEn ? 'Student in charge:' : 'Estudiante a cargo:'}
                </span>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className={`text-xs font-bold ${isDark ? 'text-white' : 'text-[#0b1c30]'}`}>{currentStudent.name}</span>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    isDark ? 'bg-amber-950 text-amber-300' : 'bg-[#dce9ff] text-[#00288e]'
                  }`}>
                    {currentStudent.grade}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => onNavigate('family_messaging')}
              className={`relative w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                isDark ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-[#eff4ff] text-[#444653] hover:bg-[#e5eeff]'
              }`}
              title={isEn ? 'Notifications & Messages' : 'Notificaciones y Mensajes'}
            >
              <span className="material-symbols-outlined text-xl">notifications</span>
              <span className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full bg-rose-500 ring-2 ring-white" />
            </button>

            <div className={`h-8 w-px ${isDark ? 'bg-slate-800' : 'bg-[#dce9ff]'}`} />

            <div className="flex items-center gap-3">
              <div className="flex flex-col text-right hidden sm:flex">
                <span className={`text-xs font-bold ${isDark ? 'text-white' : 'text-[#0b1c30]'}`}>{parentName}</span>
                <span className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-[#444653]'}`}>
                  {isEn ? 'Guardian (Mother)' : 'Acudiente (Madre)'} • {currentStudent.name}
                </span>
              </div>
              <img
                alt="Profile"
                className={`w-9 h-9 rounded-full object-cover ring-2 shadow-xs ${
                  isDark ? 'ring-amber-500/30' : 'ring-[#00288e]/20'
                }`}
                src={currentUser?.avatarUrl || ASSETS.parentAvatar}
              />
            </div>
          </div>
        </header>

        {/* WORKSPACE CONTENT */}
        <main className="p-4 sm:p-6 lg:p-8 flex flex-col gap-6 max-w-[1440px] w-full mx-auto">
          {!isConfigured ? (
            <div className={`rounded-2xl shadow-xs p-10 text-center flex flex-col items-center justify-center border ${
              isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-[#e5eeff]'
            }`}>
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 ${
                isDark ? 'bg-slate-800 text-amber-400' : 'bg-[#eff4ff] text-[#00288e]'
              }`}>
                <span className="material-symbols-outlined text-[36px]">family_restroom</span>
              </div>
              <h3 className={`text-xl font-extrabold mb-2 ${isDark ? 'text-white' : 'text-[#0b1c30]'}`}>
                {isEn ? `Linked Student: ${currentStudent.name}` : `Estudiante vinculada: ${currentStudent.name}`}
              </h3>
              <p className={`text-sm max-w-lg mb-6 leading-relaxed ${isDark ? 'text-slate-400' : 'text-[#444653]'}`}>
                {isEn
                  ? 'Your family account is officially verified for Valentina Gómez Suárez (Grade 8°1). You can explore official report cards, class schedules, and institutional communications.'
                  : 'Tu cuenta familiar está verificada formalmente para Valentina Gómez Suárez (Grado 8°1). Puedes acceder a calificaciones, boletines oficiales, horarios y comunicados institucionales.'}
              </p>
              <button
                type="button"
                onClick={handleLoadDemoFamily}
                disabled={isConfiguringDemo}
                className={`px-5 py-2.5 rounded-xl text-white text-xs font-bold shadow-sm transition-all flex items-center gap-2 cursor-pointer ${
                  isDark ? 'bg-amber-600 hover:bg-amber-500' : 'bg-[#00288e] hover:bg-[#1e40af]'
                }`}
              >
                <span className="material-symbols-outlined text-lg">supervised_user_circle</span>
                <span>{isConfiguringDemo ? (isEn ? 'Configuring...' : 'Configurando...') : (isEn ? 'Open Family Dashboard' : 'Ingresar al Portal Familiar')}</span>
              </button>
            </div>
          ) : (
            <>
              {/* 1. BARRA SUPERIOR DE CONTEXTO DEL ESTUDIANTE */}
              <div className={`rounded-2xl shadow-xs p-6 flex flex-col xl:flex-row items-start xl:items-center justify-between gap-6 relative overflow-hidden border ${
                isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-[#e5eeff]'
              }`}>
                <div className="flex items-center gap-4 z-10">
                  <div className="relative shrink-0">
                    <img
                      alt={currentStudent.name}
                      className="w-20 h-20 rounded-full object-cover shadow-xs ring-4 ring-amber-500/20"
                      src={currentStudent.avatar}
                    />
                    <span className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center text-xs font-bold shadow-xs">
                      <span className="material-symbols-outlined text-[15px]">school</span>
                    </span>
                  </div>

                  <div className="flex flex-col">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`text-xl font-extrabold ${isDark ? 'text-white' : 'text-[#0b1c30]'}`}>
                        {currentStudent.name}
                      </span>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        isDark ? 'bg-amber-950 text-amber-300' : 'bg-[#dde1ff] text-[#001453]'
                      }`}>
                        {currentStudent.grade}
                      </span>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold flex items-center gap-1.5 ${
                        isDark ? 'bg-slate-800 text-slate-300' : 'bg-[#e5eeff] text-[#0051d5]'
                      }`}>
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        {isEn ? 'Enrolled Student' : 'Hija matriculada'}
                      </span>
                    </div>

                    <p className={`text-xs mt-1.5 ${isDark ? 'text-slate-400' : 'text-[#444653]'}`}>
                      {isEn ? 'ID / Document: ' : 'Documento de Identidad: '}
                      <strong className={`font-bold ${isDark ? 'text-white' : 'text-[#0b1c30]'}`}>{currentStudent.matricula}</strong> •{' '}
                      {isEn ? 'Term: ' : 'Período Activo: '}
                      <strong className={`font-bold ${isDark ? 'text-white' : 'text-[#0b1c30]'}`}>{isEn ? '1st Term 2026' : '1° Período 2026'}</strong> •{' '}
                      {isEn ? 'Group Director: ' : 'Director de Grupo: '}
                      <strong className={`font-bold ${isDark ? 'text-white' : 'text-[#0b1c30]'}`}>{currentStudent.director}</strong>
                    </p>

                    <div className="mt-2 flex items-center gap-2">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        isDark ? 'bg-emerald-950 text-emerald-300' : 'bg-[#e5eeff] text-[#00394f]'
                      }`}>
                        <span className="material-symbols-outlined text-sm text-emerald-500">verified</span>
                        {isEn ? 'Status: Active and Enrolled' : 'Estado: Matrícula Activa y al Día'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Direct Action: Download PDF Report Card */}
                <div className="flex flex-wrap items-center gap-3 z-10 w-full xl:w-auto justify-start xl:justify-end">
                  <button
                    type="button"
                    onClick={handleDownloadReportCard}
                    className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-xs font-bold transition-all shadow-xs cursor-pointer ${
                      isDark ? 'bg-amber-600 hover:bg-amber-500' : 'bg-[#00288e] hover:bg-[#1e40af]'
                    }`}
                  >
                    <span className="material-symbols-outlined text-lg">picture_as_pdf</span>
                    <span>{isEn ? 'Download Official Report Card (PDF)' : 'Descargar Boletín Oficial (PDF)'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowScheduleModal(true)}
                    className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-xs border cursor-pointer ${
                      isDark ? 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-750' : 'bg-[#eff4ff] border-[#dce9ff] text-[#00288e] hover:bg-[#e5eeff]'
                    }`}
                  >
                    <span className="material-symbols-outlined text-lg">calendar_month</span>
                    <span>{isEn ? 'View Schedule' : 'Ver Horario Escolar'}</span>
                  </button>
                </div>
              </div>

              {/* 2. TARJETAS DE RESUMEN EJECUTIVO (3 KPI Cards) */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* KPI 1 */}
                <div className={`p-5 rounded-2xl shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden group border ${
                  isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-[#e5eeff]'
                }`}>
                  <div className="flex items-start justify-between">
                    <div className="flex flex-col">
                      <span className={`text-xs uppercase tracking-wider font-bold ${isDark ? 'text-slate-400' : 'text-[#444653]'}`}>
                        {isEn ? 'Cumulative GPA' : 'Promedio General Acumulado'}
                      </span>
                      <div className="flex items-baseline gap-2 mt-1">
                        <span className={`text-3xl font-extrabold ${isDark ? 'text-amber-400' : 'text-[#00288e]'}`}>
                          {currentStudent.average}
                        </span>
                        <span className={`text-sm ${isDark ? 'text-slate-400' : 'text-[#444653]'}`}>/ 5.0</span>
                      </div>
                    </div>
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      isDark ? 'bg-amber-950 text-amber-300' : 'bg-[#eff4ff] text-[#00288e]'
                    }`}>
                      <span className="material-symbols-outlined text-2xl">military_tech</span>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-col gap-1.5">
                    <div className={`flex justify-between text-xs ${isDark ? 'text-slate-400' : 'text-[#444653]'}`}>
                      <span>{isEn ? 'Academic Performance' : 'Desempeño Académico'}</span>
                      <span className={`font-bold ${isDark ? 'text-amber-300' : 'text-[#00288e]'}`}>92% (Superior)</span>
                    </div>
                    <div className={`w-full h-2 rounded-full overflow-hidden ${isDark ? 'bg-slate-800' : 'bg-[#e5eeff]'}`}>
                      <div className="h-full rounded-full bg-amber-500 transition-all duration-500" style={{ width: '92%' }} />
                    </div>
                  </div>

                  <div className={`mt-4 pt-3 flex items-center justify-between border-t ${isDark ? 'border-slate-800' : 'border-[#eff4ff]'}`}>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${
                      isDark ? 'bg-amber-950 text-amber-300' : 'bg-[#eff4ff] text-[#00288e]'
                    }`}>
                      <span className="material-symbols-outlined text-xs">trending_up</span> +0.4 {isEn ? 'vs previous term' : 'vs ciclo anterior'}
                    </span>
                    <span className={`text-xs font-bold ${isDark ? 'text-slate-400' : 'text-[#444653]'}`}>{currentStudent.rank}</span>
                  </div>
                </div>

                {/* KPI 2 */}
                <div className={`p-5 rounded-2xl shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden group border ${
                  isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-[#e5eeff]'
                }`}>
                  <div className="flex items-start justify-between">
                    <div className="flex flex-col">
                      <span className={`text-xs uppercase tracking-wider font-bold ${isDark ? 'text-slate-400' : 'text-[#444653]'}`}>
                        {isEn ? 'Attendance Percentage' : 'Porcentaje de Asistencia'}
                      </span>
                      <div className="flex items-baseline gap-2 mt-1">
                        <span className={`text-3xl font-extrabold ${isDark ? 'text-cyan-300' : 'text-[#0051d5]'}`}>
                          {currentStudent.attendance}
                        </span>
                        <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-[#444653]'}`}>
                          {isEn ? 'Active punctuality' : 'Puntualidad activa'}
                        </span>
                      </div>
                    </div>
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      isDark ? 'bg-cyan-950 text-cyan-300' : 'bg-[#eff4ff] text-[#0051d5]'
                    }`}>
                      <span className="material-symbols-outlined text-2xl">event_available</span>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center gap-3">
                    <span className="w-3 h-3 rounded-full bg-cyan-400" />
                    <span className={`text-xs font-medium ${isDark ? 'text-white' : 'text-[#0b1c30]'}`}>
                      {currentStudent.attendanceDetail}
                    </span>
                  </div>

                  <div className={`mt-4 pt-3 flex items-center justify-between border-t ${isDark ? 'border-slate-800' : 'border-[#eff4ff]'}`}>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                      isDark ? 'bg-slate-800 text-slate-300' : 'bg-[#e5eeff] text-[#0b1c30]'
                    }`}>
                      <span className="material-symbols-outlined text-xs text-cyan-400">check_circle</span>
                      {isEn ? '1 medical excuse justified' : '1 falta justificada con constancia'}
                    </span>
                  </div>
                </div>

                {/* KPI 3 */}
                <div className={`p-5 rounded-2xl shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden group border ${
                  isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-[#e5eeff]'
                }`}>
                  <div className="flex items-start justify-between">
                    <div className="flex flex-col">
                      <span className={`text-xs uppercase tracking-wider font-bold ${isDark ? 'text-slate-400' : 'text-[#444653]'}`}>
                        {isEn ? 'Disciplinary Reports' : 'Reportes Convivenciales'}
                      </span>
                      <div className="flex items-baseline gap-2 mt-1">
                        <span className={`text-3xl font-extrabold ${isDark ? 'text-emerald-400' : 'text-[#00394f]'}`}>0</span>
                        <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-[#444653]'}`}>
                          {isEn ? 'observations' : 'observaciones'}
                        </span>
                      </div>
                    </div>
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      isDark ? 'bg-emerald-950 text-emerald-300' : 'bg-[#eff4ff] text-[#00394f]'
                    }`}>
                      <span className="material-symbols-outlined text-2xl">shield</span>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-col gap-1">
                    <span className={`text-xs font-bold ${isDark ? 'text-white' : 'text-[#0b1c30]'}`}>
                      {isEn ? 'Zero infractions recorded' : 'Sin faltas registradas'}
                    </span>
                    <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-[#444653]'}`}>
                      {isEn ? 'Full compliance with institutional code of conduct.' : 'Cumplimiento cabal de las directrices del Manual de Convivencia.'}
                    </p>
                  </div>

                  <div className={`mt-4 pt-3 flex items-center justify-between border-t ${isDark ? 'border-slate-800' : 'border-[#eff4ff]'}`}>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${
                      isDark ? 'bg-emerald-950 text-emerald-300' : 'bg-[#dce9ff] text-[#00288e]'
                    }`}>
                      <span className="material-symbols-outlined text-xs">verified_user</span>
                      {isEn ? 'Exemplary Conduct • Type A' : 'Conducta Ejemplar • Tipo A'}
                    </span>
                  </div>
                </div>
              </div>

              {/* 3. GRID DE CONTENIDO PRINCIPAL */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* COLUMNA IZQUIERDA: Muro de Novedades */}
                <div className="lg:col-span-8 flex flex-col gap-4">
                  <div className={`p-5 sm:p-6 rounded-2xl shadow-xs flex flex-col gap-4 border ${
                    isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-[#e5eeff]'
                  }`}>
                    {/* Header */}
                    <div className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-2 border-b ${
                      isDark ? 'border-slate-800' : 'border-[#eff4ff]'
                    }`}>
                      <div className="flex items-center gap-2">
                        <span className={`w-2.5 h-6 rounded-full ${isDark ? 'bg-amber-500' : 'bg-[#00288e]'}`} />
                        <h2 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-[#0b1c30]'}`}>
                          {isEn ? 'Institutional Updates & Notices' : 'Muro de Novedades y Seguimiento'}
                        </h2>
                      </div>

                      {/* Filters */}
                      <div className={`flex flex-wrap items-center gap-1 p-1 rounded-xl text-xs font-bold border ${
                        isDark ? 'bg-slate-800 border-slate-700' : 'bg-[#eff4ff] border-[#dce9ff]'
                      }`}>
                        <button
                          type="button"
                          onClick={() => setActiveCategory('all')}
                          className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                            activeCategory === 'all'
                              ? isDark ? 'bg-slate-700 text-white shadow-xs' : 'bg-white text-[#00288e] shadow-xs'
                              : isDark ? 'text-slate-400 hover:text-white' : 'text-[#444653] hover:text-[#0b1c30]'
                          }`}
                        >
                          {isEn ? 'All' : 'Todas'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveCategory('grades')}
                          className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                            activeCategory === 'grades'
                              ? isDark ? 'bg-slate-700 text-white shadow-xs' : 'bg-white text-[#00288e] shadow-xs'
                              : isDark ? 'text-slate-400 hover:text-white' : 'text-[#444653] hover:text-[#0b1c30]'
                          }`}
                        >
                          {isEn ? 'Grades' : 'Calificaciones'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveCategory('meetings')}
                          className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                            activeCategory === 'meetings'
                              ? isDark ? 'bg-slate-700 text-white shadow-xs' : 'bg-white text-[#00288e] shadow-xs'
                              : isDark ? 'text-slate-400 hover:text-white' : 'text-[#444653] hover:text-[#0b1c30]'
                          }`}
                        >
                          {isEn ? 'Meetings' : 'Citaciones'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveCategory('notices')}
                          className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                            activeCategory === 'notices'
                              ? isDark ? 'bg-slate-700 text-white shadow-xs' : 'bg-white text-[#00288e] shadow-xs'
                              : isDark ? 'text-slate-400 hover:text-white' : 'text-[#444653] hover:text-[#0b1c30]'
                          }`}
                        >
                          {isEn ? 'Circulars' : 'Circulares'}
                        </button>
                      </div>
                    </div>

                    {/* Feed Items Container */}
                    <div className="flex flex-col gap-4">
                      {filteredFeed.map((item) => (
                        <div
                          key={item.id}
                          className={`p-4 sm:p-5 rounded-2xl transition-all flex flex-col gap-2 border ${
                            isDark
                              ? 'bg-slate-800/60 hover:bg-slate-800 border-slate-700'
                              : 'bg-[#eff4ff]/60 hover:bg-[#eff4ff] border-[#dce9ff]'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-10 h-10 rounded-xl ${item.iconBg} ${item.iconColor} flex items-center justify-center shrink-0 shadow-xs`}
                              >
                                <span className="material-symbols-outlined text-xl">{item.icon}</span>
                              </div>
                              <div>
                                <h3 className={`text-xs sm:text-sm font-bold ${isDark ? 'text-white' : 'text-[#0b1c30]'}`}>
                                  {item.title}
                                </h3>
                                <span className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-[#444653]'}`}>
                                  {item.timeAgo} • {item.author}
                                </span>
                              </div>
                            </div>

                            {item.gradeBadge && (
                              <span className={`px-2.5 py-1 rounded-full text-xs font-extrabold shadow-xs shrink-0 border ${
                                isDark
                                  ? 'bg-slate-900 border-slate-700 text-amber-300'
                                  : 'bg-white border-[#dce9ff] text-[#00288e]'
                              }`}>
                                {item.gradeBadge}
                              </span>
                            )}

                            {item.statusBadge && (
                              <span
                                className={`px-2.5 py-1 rounded-full text-xs font-bold shrink-0 ${
                                  item.statusBadge.type === 'mandatory'
                                    ? isDark ? 'bg-rose-950 text-rose-300' : 'bg-[#ffdad6] text-[#ba1a1a]'
                                    : isDark ? 'bg-cyan-950 text-cyan-300' : 'bg-[#d3e4fe] text-[#00288e]'
                                }`}
                              >
                                {item.statusBadge.text}
                              </span>
                            )}
                          </div>

                          <p className={`text-xs sm:text-sm mt-1 pl-0 sm:pl-13 leading-relaxed ${
                            isDark ? 'text-slate-300' : 'text-[#0b1c30]'
                          }`}>
                            {item.content}
                          </p>

                          {/* Actions */}
                          <div className="mt-2 pl-0 sm:pl-13 flex flex-wrap items-center justify-between gap-2">
                            {item.id === 'feed-2' ? (
                              <div className="flex flex-wrap items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setConfirmedMeeting(!confirmedMeeting);
                                    showToast(confirmedMeeting ? (isEn ? 'Attendance cancelled.' : 'Asistencia cancelada.') : (isEn ? 'Attendance confirmed for report card delivery!' : '¡Asistencia confirmada para la entrega de boletines!'));
                                  }}
                                  className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer ${
                                    confirmedMeeting
                                      ? 'bg-emerald-600 text-white'
                                      : isDark ? 'bg-amber-600 hover:bg-amber-500 text-white' : 'bg-[#00288e] text-white hover:bg-[#1e40af]'
                                  }`}
                                >
                                  <span className="material-symbols-outlined text-sm">
                                    {confirmedMeeting ? 'check_circle' : 'done_all'}
                                  </span>
                                  <span>{confirmedMeeting ? (isEn ? 'Confirmed' : 'Asistencia Confirmada') : (isEn ? 'Confirm Attendance' : 'Confirmar Asistencia')}</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={handleDownloadReportCard}
                                  className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold shadow-xs transition-all border cursor-pointer ${
                                    isDark
                                      ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                                      : 'bg-white border-[#e2e8f0] text-[#444653] hover:text-[#0b1c30]'
                                  }`}
                                >
                                  <span className="material-symbols-outlined text-sm">picture_as_pdf</span>
                                  <span>{isEn ? 'View Report Card' : 'Ver Boletín Oficial'}</span>
                                </button>
                              </div>
                            ) : item.attachment ? (
                              <button
                                type="button"
                                onClick={handleDownloadReportCard}
                                className={`inline-flex items-center gap-1.5 text-xs font-bold cursor-pointer ${
                                  isDark ? 'text-cyan-400 hover:text-cyan-300' : 'text-[#00288e] hover:text-[#1e40af]'
                                }`}
                              >
                                <span className="material-symbols-outlined text-base">picture_as_pdf</span>
                                <span>{isEn ? 'Download Official Report Card (PDF)' : 'Descargar Boletín Oficial (PDF)'}</span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => onNavigate('family_messaging')}
                                className={`inline-flex items-center gap-1 text-xs font-bold cursor-pointer ${
                                  isDark ? 'text-amber-400 hover:text-amber-300' : 'text-[#0051d5] hover:text-[#00288e]'
                                }`}
                              >
                                <span>{item.actionText || (isEn ? 'View details' : 'Ver detalles')}</span>
                                <span className="material-symbols-outlined text-sm">arrow_forward</span>
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* COLUMNA DERECHA: Accesos Rápidos & Canales de Atención */}
                <div className="lg:col-span-4 flex flex-col gap-4">
                  {/* Quick shortcuts */}
                  <div className={`p-5 rounded-2xl shadow-xs flex flex-col gap-4 border ${
                    isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-[#e5eeff]'
                  }`}>
                    <div className="flex items-center gap-2">
                      <span className={`w-2.5 h-6 rounded-full ${isDark ? 'bg-amber-500' : 'bg-[#0051d5]'}`} />
                      <h2 className={`text-base font-bold ${isDark ? 'text-white' : 'text-[#0b1c30]'}`}>
                        {isEn ? 'Quick Shortcuts' : 'Accesos Rápidos'}
                      </h2>
                    </div>

                    <div className="flex flex-col gap-2.5">
                      <button
                        type="button"
                        onClick={handleDownloadReportCard}
                        className={`w-full text-left p-3.5 rounded-xl transition-all group flex items-start gap-3 shadow-xs border cursor-pointer ${
                          isDark
                            ? 'bg-slate-800 border-slate-700 hover:bg-slate-750'
                            : 'bg-[#eff4ff] border-[#dce9ff] hover:bg-[#e5eeff]'
                        }`}
                      >
                        <div className="w-10 h-10 rounded-xl bg-amber-600 text-white flex items-center justify-center shrink-0">
                          <span className="material-symbols-outlined text-xl">download</span>
                        </div>
                        <div className="flex flex-col">
                          <span className={`text-xs font-bold ${isDark ? 'text-white' : 'text-[#00288e]'}`}>
                            {isEn ? 'Download Report Card (PDF)' : 'Descargar Boletín Oficial (PDF)'}
                          </span>
                          <span className={`text-[11px] mt-0.5 ${isDark ? 'text-slate-400' : 'text-[#444653]'}`}>
                            {isEn ? 'Digitally certified 1st term 2026 report' : 'Informe oficial 1° Período 2026 firmado digitalmente'}
                          </span>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => onNavigate('family_messaging')}
                        className={`w-full text-left p-3.5 rounded-xl transition-all group flex items-start gap-3 shadow-xs border cursor-pointer ${
                          isDark
                            ? 'bg-slate-800 border-slate-700 hover:bg-slate-750'
                            : 'bg-[#eff4ff] border-[#dce9ff] hover:bg-[#e5eeff]'
                        }`}
                      >
                        <div className="w-10 h-10 rounded-xl bg-cyan-600 text-white flex items-center justify-center shrink-0">
                          <span className="material-symbols-outlined text-xl">chat</span>
                        </div>
                        <div className="flex flex-col">
                          <span className={`text-xs font-bold ${isDark ? 'text-white' : 'text-[#0b1c30]'}`}>
                            {isEn ? 'Online Institutional Chat' : 'Chat Institucional en Línea'}
                          </span>
                          <span className={`text-[11px] mt-0.5 ${isDark ? 'text-slate-400' : 'text-[#444653]'}`}>
                            {isEn ? 'Direct communication with teachers' : 'Comunicación bidireccional con docentes'}
                          </span>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setShowScheduleModal(true)}
                        className={`w-full text-left p-3.5 rounded-xl transition-all group flex items-start gap-3 shadow-xs border cursor-pointer ${
                          isDark
                            ? 'bg-slate-800 border-slate-700 hover:bg-slate-750'
                            : 'bg-[#eff4ff] border-[#dce9ff] hover:bg-[#e5eeff]'
                        }`}
                      >
                        <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0">
                          <span className="material-symbols-outlined text-xl">schedule</span>
                        </div>
                        <div className="flex flex-col">
                          <span className={`text-xs font-bold ${isDark ? 'text-white' : 'text-[#0b1c30]'}`}>
                            {isEn ? 'Official Schedule 8°1' : 'Horario Escolar Oficial (8°1)'}
                          </span>
                          <span className={`text-[11px] mt-0.5 ${isDark ? 'text-slate-400' : 'text-[#444653]'}`}>
                            {isEn ? 'Morning Shift (6:15 AM - 12:15 PM)' : 'Jornada Mañana (6:15 AM a 12:15 PM)'}
                          </span>
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Direct Contact Channels (Presencial + Chat en línea only) */}
                  <div className={`p-5 rounded-2xl shadow-xs flex flex-col gap-4 border ${
                    isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-[#e5eeff]'
                  }`}>
                    <div className="flex items-center gap-2">
                      <span className={`w-2.5 h-6 rounded-full ${isDark ? 'bg-amber-500' : 'bg-[#00394f]'}`} />
                      <h2 className={`text-base font-bold ${isDark ? 'text-white' : 'text-[#0b1c30]'}`}>
                        {isEn ? 'Attention Channels' : 'Canales de Atención Institucional'}
                      </h2>
                    </div>

                    <div className="flex flex-col gap-2.5">
                      <div className={`flex items-start gap-3 p-3 rounded-xl border ${
                        isDark ? 'bg-slate-800/80 border-slate-700' : 'bg-[#eff4ff] border-[#dce9ff]'
                      }`}>
                        <span className={`material-symbols-outlined text-xl shrink-0 mt-0.5 ${isDark ? 'text-amber-400' : 'text-[#00288e]'}`}>
                          location_on
                        </span>
                        <div className="flex flex-col">
                          <span className={`text-xs font-bold ${isDark ? 'text-white' : 'text-[#0b1c30]'}`}>
                            {isEn ? 'In-Person Attention' : 'Atención Presencial en Sede'}
                          </span>
                          <span className={`text-[11px] mt-0.5 font-semibold ${isDark ? 'text-amber-300' : 'text-[#00288e]'}`}>
                            {isEn ? 'Mon - Fri: 7:00 AM - 3:00 PM' : 'Lunes a viernes 7:00 a.m. - 3:00 p.m.'}
                          </span>
                          <span className={`text-[10px] mt-0.5 ${isDark ? 'text-slate-400' : 'text-[#444653]'}`}>
                            Secretaría Académica y Rectoría • I.E. Vallejuelos
                          </span>
                        </div>
                      </div>

                      <div className={`flex items-start gap-3 p-3 rounded-xl border ${
                        isDark ? 'bg-slate-800/80 border-slate-700' : 'bg-[#eff4ff] border-[#dce9ff]'
                      }`}>
                        <span className={`material-symbols-outlined text-xl shrink-0 mt-0.5 ${isDark ? 'text-cyan-400' : 'text-[#0051d5]'}`}>
                          forum
                        </span>
                        <div className="flex flex-col flex-1">
                          <span className={`text-xs font-bold ${isDark ? 'text-white' : 'text-[#0b1c30]'}`}>
                            {isEn ? 'Online Official Chat' : 'Chat en Línea Institucional'}
                          </span>
                          <span className={`text-[11px] mt-0.5 ${isDark ? 'text-slate-300' : 'text-[#444653]'}`}>
                            {isEn ? 'Direct channel with assigned teachers and administrators' : 'Atención institucional directa con docentes de 8°1 y directivos'}
                          </span>
                          <button
                            type="button"
                            onClick={() => onNavigate('family_messaging')}
                            className={`mt-2 px-3 py-1.5 rounded-lg text-xs font-bold text-white transition-all self-start cursor-pointer ${
                              isDark ? 'bg-cyan-600 hover:bg-cyan-500' : 'bg-[#0051d5] hover:bg-[#00288e]'
                            }`}
                          >
                            {isEn ? 'Open Chat Now' : 'Ir al Chat Institucional'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </main>
      </div>

      {/* INSTITUTIONAL SCHEDULE MODAL FOR GRADE 8°1 */}
      {showScheduleModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200"
        >
          <div className={`relative w-full max-w-4xl max-h-[90vh] rounded-3xl shadow-2xl border flex flex-col overflow-hidden transition-all ${
            isDark ? 'bg-slate-900 border-slate-700/80 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            {/* Modal Header */}
            <div className={`p-4 sm:p-6 border-b flex items-center justify-between shrink-0 ${
              isDark ? 'border-slate-800 bg-slate-950/50' : 'border-slate-200 bg-slate-50/80'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
                  isDark ? 'bg-amber-500/20 text-amber-400' : 'bg-amber-100 text-[#00288e]'
                }`}>
                  <span className="material-symbols-outlined text-[24px]">calendar_month</span>
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold leading-tight">
                    {isEn ? `Class Schedule - ${currentStudent.name}` : `Horario Escolar Oficial - ${currentStudent.name}`}
                  </h3>
                  <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-[#444653]'}`}>
                    {isEn
                      ? `Grade 8°1 • Morning Shift (6:15 AM - 12:15 PM) • I.E. Vallejuelos`
                      : `Grado 8°1 • Jornada Mañana (6:15 AM - 12:15 PM) • I.E. Vallejuelos`}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowScheduleModal(false)}
                className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors cursor-pointer ${
                  isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-slate-200/70 hover:bg-slate-300 text-slate-700'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            {/* Schedule Table Body */}
            <div className="p-4 sm:p-6 overflow-x-auto overflow-y-auto flex-1">
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead>
                  <tr className={`border-b text-xs font-bold uppercase tracking-wider ${
                    isDark ? 'border-slate-800 text-slate-300' : 'border-slate-200 text-[#0b1c30]'
                  }`}>
                    <th className="py-3 px-3 w-28">{isEn ? 'Period & Time' : 'Hora / Bloque'}</th>
                    <th className="py-3 px-3">{isEn ? 'Monday' : 'Lunes'}</th>
                    <th className="py-3 px-3">{isEn ? 'Tuesday' : 'Martes'}</th>
                    <th className="py-3 px-3">{isEn ? 'Wednesday' : 'Miércoles'}</th>
                    <th className="py-3 px-3">{isEn ? 'Thursday' : 'Jueves'}</th>
                    <th className="py-3 px-3">{isEn ? 'Friday' : 'Viernes'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-150 dark:divide-slate-800/60 text-xs">
                  {OFFICIAL_SCHEDULE_8_1.map((slot) => {
                    const isBreak = slot.period === 0;
                    return (
                      <tr
                        key={slot.period}
                        className={`transition-colors ${
                          isBreak
                            ? isDark ? 'bg-amber-950/20' : 'bg-amber-50/60'
                            : isDark ? 'hover:bg-slate-850/60' : 'hover:bg-blue-50/40'
                        }`}
                      >
                        <td className="py-3 px-3 align-middle font-mono font-bold text-[11px] text-amber-500 dark:text-amber-400">
                          <div className="font-sans font-extrabold text-slate-900 dark:text-slate-100">
                            {isBreak ? (isEn ? 'Recess' : 'Descanso') : (isEn ? `Period ${slot.period}` : `Hora ${slot.period}`)}
                          </div>
                          <div className="text-slate-600 dark:text-slate-400">{slot.time}</div>
                        </td>

                        {isBreak ? (
                          <td colSpan={5} className="py-3 px-3 align-middle">
                            <div className={`p-3 rounded-2xl flex items-center justify-center gap-3 border ${
                              isDark
                                ? 'bg-amber-950/40 border-amber-500/40 text-amber-200'
                                : 'bg-amber-100/80 border-amber-300 text-amber-950'
                            }`}>
                              <span className="material-symbols-outlined text-2xl text-amber-500 shrink-0">restaurant</span>
                              <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2">
                                <span className="font-extrabold text-xs uppercase tracking-wider">
                                  {isEn ? 'Institutional Recess & Break' : 'Descanso y Recreo Pedagógico'}
                                </span>
                                <span className="text-[11px] font-semibold opacity-90">
                                  (9:00 AM - 9:30 AM) • {isEn ? 'Educational Community' : 'Comunidad Educativa'}
                                </span>
                              </div>
                            </div>
                          </td>
                        ) : (
                          [slot.monday, slot.tuesday, slot.wednesday, slot.thursday, slot.friday].map((cell, idx) => (
                            <td key={idx} className="py-2.5 px-3 align-top">
                              <div className={`p-2.5 rounded-xl border flex flex-col gap-1 transition-all ${
                                isDark
                                  ? 'bg-slate-800/90 border-slate-700/80 shadow-xs'
                                  : 'bg-white border-slate-200/90 shadow-2xs'
                              }`}>
                                <span className="font-extrabold text-xs leading-tight text-slate-950 dark:text-slate-50">
                                  {cell.subject}
                                </span>
                                <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                                  {cell.teacher}
                                </span>
                              </div>
                            </td>
                          ))
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Footer */}
            <div className={`p-4 border-t flex items-center justify-between text-xs shrink-0 ${
              isDark ? 'border-slate-800 bg-slate-950/40 text-slate-400' : 'border-slate-200 bg-slate-50 text-[#757684]'
            }`}>
              <span>
                {isEn
                  ? 'Official Schedule source: Academic Direction • Grade 8°1 I.E. Vallejuelos'
                  : 'Fuente oficial: Coordinación Académica • Grado 8°1 I.E. Vallejuelos'}
              </span>
              <button
                type="button"
                onClick={() => setShowScheduleModal(false)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  isDark ? 'bg-slate-800 hover:bg-slate-700 text-white' : 'bg-slate-200 hover:bg-slate-300 text-slate-800'
                }`}
              >
                {isEn ? 'Close' : 'Cerrar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
