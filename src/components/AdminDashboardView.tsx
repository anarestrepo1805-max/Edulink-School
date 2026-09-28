import React, { useState } from 'react';
import { UserProfile, ActiveScreen } from '../types';
import { useThemeLanguage } from '../context/ThemeLanguageContext';

interface AdminDashboardViewProps {
  currentUser: UserProfile;
  onNavigate: (screen: ActiveScreen) => void;
  onLogout: () => void;
  onUpdateUser: (user: UserProfile) => void;
}

interface StudentRegistrationItem {
  id: string;
  name: string;
  documentId: string;
  grade: string;
  shift: string;
  status: 'Activo' | 'Pendiente' | 'Paz y Salvo';
  guardianName: string;
}

export const AdminDashboardView: React.FC<AdminDashboardViewProps> = ({
  currentUser
}) => {
  const { theme, language } = useThemeLanguage();
  const isDark = theme === 'dark';
  const isEn = language === 'en';

  const [selectedTab, setSelectedTab] = useState<'overview' | 'groups' | 'certificates' | 'circulars'>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterGrade, setFilterGrade] = useState('Todos');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const schoolGroups = [
    { grade: '6°1', studentsCount: 34, director: 'Prof. Mario Restrepo', room: 'Aula 101', shift: '6:15 AM - 12:15 PM' },
    { grade: '6°2', studentsCount: 33, director: 'Prof. Martha Gómez', room: 'Aula 102', shift: '6:15 AM - 12:15 PM' },
    { grade: '7°1', studentsCount: 32, director: 'Prof. Carlos Builes', room: 'Aula 103', shift: '6:15 AM - 12:15 PM' },
    { grade: '7°2', studentsCount: 35, director: 'Prof. Sandra Pérez', room: 'Aula 104', shift: '6:15 AM - 12:15 PM' },
    { grade: '8°1', studentsCount: 31, director: 'Prof. Andrés Henao', room: 'Aula 201', shift: '6:15 AM - 12:15 PM' },
    { grade: '8°2', studentsCount: 32, director: 'Prof. Gloria Correa', room: 'Aula 202', shift: '6:15 AM - 12:15 PM' },
    { grade: '9°1', studentsCount: 30, director: 'Prof. Javier Ramírez', room: 'Aula 203', shift: '6:15 AM - 12:15 PM' },
    { grade: '9°2', studentsCount: 31, director: 'Prof. Marcela Díaz', room: 'Aula 204', shift: '6:15 AM - 12:15 PM' },
    { grade: '10°1', studentsCount: 29, director: 'Prof. Daniela Álvarez', room: 'Laboratorio TI 1', shift: '6:15 AM - 12:15 PM' },
    { grade: '10°2', studentsCount: 30, director: 'Prof. Fernando Villa', room: 'Aula 301', shift: '6:15 AM - 12:15 PM' },
    { grade: '11°1', studentsCount: 28, director: 'Prof. Ricardo Vélez', room: 'Aula 302', shift: '6:15 AM - 12:15 PM' },
    { grade: '11°2', studentsCount: 29, director: 'Prof. Patricia López', room: 'Laboratorio TI 2', shift: '6:15 AM - 12:15 PM' }
  ];

  const [students] = useState<StudentRegistrationItem[]>([
    { id: '1', name: 'Miguel Ángel Jiménez', documentId: '1092837465', grade: '11°2', shift: '6:15 AM - 12:15 PM', status: 'Activo', guardianName: 'Elena Gómez Jiménez' },
    { id: '2', name: 'Sofía Restrepo Jiménez', documentId: '1038472910', grade: '6°1', shift: '6:15 AM - 12:15 PM', status: 'Activo', guardianName: 'Elena Gómez Jiménez' },
    { id: '3', name: 'Mateo Cárdenas Ospina', documentId: '1019283746', grade: '10°1', shift: '6:15 AM - 12:15 PM', status: 'Activo', guardianName: 'Rodrigo Cárdenas' },
    { id: '4', name: 'Valentina Muñoz Londoño', documentId: '1094820194', grade: '8°2', shift: '6:15 AM - 12:15 PM', status: 'Paz y Salvo', guardianName: 'Lorena Londoño' },
    { id: '5', name: 'Santiago Echeverri Ruiz', documentId: '1039482019', grade: '7°1', shift: '6:15 AM - 12:15 PM', status: 'Activo', guardianName: 'Marcela Ruiz' },
    { id: '6', name: 'Camila Zapata Vargas', documentId: '1029481023', grade: '9°2', shift: '6:15 AM - 12:15 PM', status: 'Activo', guardianName: 'Guillermo Zapata' }
  ]);

  const [circulars] = useState([
    {
      id: 'c1',
      title: 'Circular Oficial No. 08: Cronograma de Evaluaciones del Primer Período',
      titleEn: 'Official Notice No. 08: First Term Evaluation Schedule',
      target: 'Toda la Comunidad Educativa',
      targetEn: 'Entire Educational Community',
      date: '14 de Septiembre, 2026',
      dateEn: 'September 14, 2026',
      author: 'Coordinación Académica',
      authorEn: 'Academic Coordination'
    },
    {
      id: 'c2',
      title: 'Disposición Institucional: Cumplimiento de la Jornada Escolar (6:15 AM - 12:15 PM)',
      titleEn: 'Institutional Directive: School Schedule Compliance (6:15 AM - 12:15 PM)',
      target: 'Estudiantes y Acudientes',
      targetEn: 'Students and Guardians',
      date: '10 de Septiembre, 2026',
      dateEn: 'September 10, 2026',
      author: 'Rectoría General',
      authorEn: 'Principal Office'
    },
    {
      id: 'c3',
      title: 'Convocatoria a Elección de Representantes al Consejo Directivo',
      titleEn: 'Call for Election of Representatives to School Board',
      target: 'Docentes y Padres de Familia',
      targetEn: 'Teachers and Parents',
      date: '05 de Septiembre, 2026',
      dateEn: 'September 05, 2026',
      author: 'Consejo Electoral Escolar',
      authorEn: 'School Electoral Board'
    }
  ]);

  const filteredStudents = students.filter((s) => {
    const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) || s.documentId.includes(searchQuery);
    const matchesGrade = filterGrade === 'Todos' || s.grade === filterGrade;
    return matchesSearch && matchesGrade;
  });

  return (
    <div className={`min-h-screen pb-16 transition-colors duration-200 ${
      isDark ? 'bg-slate-950 text-slate-100' : 'bg-[#f8f9ff] text-[#0b1c30]'
    }`}>
      {/* Toast alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 border border-emerald-500/50 text-emerald-300 px-5 py-3.5 rounded-2xl shadow-xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4">
          <span className="material-symbols-outlined text-[20px] text-emerald-400">check_circle</span>
          <span className="text-sm font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Hero Header for Administrative Staff */}
      <div className={`text-white py-10 px-4 sm:px-8 border-b shadow-sm ${
        isDark
          ? 'bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 border-emerald-900/40'
          : 'bg-gradient-to-r from-[#00288e] via-[#0038aa] to-[#0051d5] border-[#1e40af]'
      }`}>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white shrink-0 shadow-inner">
              <span className="material-symbols-outlined text-[34px]">admin_panel_settings</span>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-white text-xs font-bold uppercase tracking-wider">
                  {isEn ? 'Leadership & Academic Office' : 'Panel de Coordinación y Rectoría'}
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-400/20 text-emerald-200 text-xs font-bold flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse" />
                  {isEn ? 'Morning Shift: 6:15 AM - 12:15 PM' : 'Jornada Mañana: 6:15 AM - 12:15 PM'}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                {currentUser.fullName}
              </h1>
              <p className="text-sm text-white/80 mt-1">
                {currentUser.adminPosition || (isEn ? 'General Coordination' : 'Coordinación General & Académica')} • {currentUser.institution || 'Institución Educativa Vallejuelos'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="bg-white/10 backdrop-blur-sm border border-white/15 px-4 py-2.5 rounded-xl text-right">
              <span className="block text-xs text-white/70">{isEn ? 'Total Active Enrollment' : 'Matrícula Total Activa'}</span>
              <span className="text-xl font-extrabold text-white">378 {isEn ? 'Students' : 'Estudiantes'}</span>
            </div>
            <div className="bg-white/10 backdrop-blur-sm border border-white/15 px-4 py-2.5 rounded-xl text-right">
              <span className="block text-xs text-white/70">{isEn ? 'Official Groups' : 'Grados Oficiales'}</span>
              <span className="text-xl font-extrabold text-white">12 {isEn ? 'Groups (6th to 11th)' : 'Grupos (6° a 11°)'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 mt-8">
        {/* Navigation Tabs */}
        <div className={`flex items-center gap-2 border-b pb-3 mb-8 overflow-x-auto ${
          isDark ? 'border-slate-800' : 'border-[#e5eeff]'
        }`}>
          <button
            onClick={() => setSelectedTab('overview')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
              selectedTab === 'overview'
                ? isDark ? 'bg-emerald-600 text-white shadow-sm' : 'bg-[#00288e] text-white shadow-sm'
                : isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-[#444653] hover:text-[#00288e] hover:bg-[#eff4ff]'
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">dashboard</span>
            <span>{isEn ? 'Institutional Overview' : 'Resumen Institucional'}</span>
          </button>

          <button
            onClick={() => setSelectedTab('groups')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
              selectedTab === 'groups'
                ? isDark ? 'bg-emerald-600 text-white shadow-sm' : 'bg-[#00288e] text-white shadow-sm'
                : isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-[#444653] hover:text-[#00288e] hover:bg-[#eff4ff]'
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">view_module</span>
            <span>{isEn ? 'Grade Structure (6th to 11th)' : 'Estructura de Grados (6° a 11°)'}</span>
          </button>

          <button
            onClick={() => setSelectedTab('certificates')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
              selectedTab === 'certificates'
                ? isDark ? 'bg-emerald-600 text-white shadow-sm' : 'bg-[#00288e] text-white shadow-sm'
                : isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-[#444653] hover:text-[#00288e] hover:bg-[#eff4ff]'
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">badge</span>
            <span>{isEn ? 'Students & Certificates' : 'Estudiantes y Certificados'}</span>
          </button>

          <button
            onClick={() => setSelectedTab('circulars')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
              selectedTab === 'circulars'
                ? isDark ? 'bg-emerald-600 text-white shadow-sm' : 'bg-[#00288e] text-white shadow-sm'
                : isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-[#444653] hover:text-[#00288e] hover:bg-[#eff4ff]'
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">campaign</span>
            <span>{isEn ? 'Official Notices & Circulars' : 'Circulares y Comunicados'}</span>
          </button>
        </div>

        {/* TAB 1: OVERVIEW */}
        {selectedTab === 'overview' && (
          <div className="flex flex-col gap-8 animate-in fade-in">
            {/* Quick Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              <div className={`p-5 rounded-2xl border shadow-xs flex items-center justify-between ${
                isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-[#e5eeff]'
              }`}>
                <div>
                  <span className={`text-xs font-bold uppercase tracking-wider block mb-1 ${
                    isDark ? 'text-slate-400' : 'text-[#757684]'
                  }`}>
                    {isEn ? 'Official School Shift' : 'Jornada Escolar Oficial'}
                  </span>
                  <span className={`text-lg font-bold ${isDark ? 'text-emerald-400' : 'text-[#00288e]'}`}>
                    6:15 AM - 12:15 PM
                  </span>
                  <span className="text-xs text-emerald-500 block mt-1 font-semibold">
                    {isEn ? 'Active Monday to Friday' : 'Activa de lunes a viernes'}
                  </span>
                </div>
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  isDark ? 'bg-emerald-950 text-emerald-400' : 'bg-[#eff4ff] text-[#00288e]'
                }`}>
                  <span className="material-symbols-outlined text-[24px]">schedule</span>
                </div>
              </div>

              <div className={`p-5 rounded-2xl border shadow-xs flex items-center justify-between ${
                isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-[#e5eeff]'
              }`}>
                <div>
                  <span className={`text-xs font-bold uppercase tracking-wider block mb-1 ${
                    isDark ? 'text-slate-400' : 'text-[#757684]'
                  }`}>
                    {isEn ? 'Teaching Faculty' : 'Cuerpo Docente'}
                  </span>
                  <span className={`text-2xl font-extrabold ${isDark ? 'text-white' : 'text-[#0b1c30]'}`}>
                    24 {isEn ? 'Teachers' : 'Docentes'}
                  </span>
                  <span className="text-xs text-cyan-400 block mt-1 font-semibold">
                    {isEn ? '100% assigned to gradebooks' : '100% asignados a planillas'}
                  </span>
                </div>
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  isDark ? 'bg-cyan-950 text-cyan-400' : 'bg-[#eff4ff] text-[#0051d5]'
                }`}>
                  <span className="material-symbols-outlined text-[24px]">co_present</span>
                </div>
              </div>

              <div className={`p-5 rounded-2xl border shadow-xs flex items-center justify-between ${
                isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-[#e5eeff]'
              }`}>
                <div>
                  <span className={`text-xs font-bold uppercase tracking-wider block mb-1 ${
                    isDark ? 'text-slate-400' : 'text-[#757684]'
                  }`}>
                    {isEn ? 'Grades and Groups' : 'Grados y Grupos'}
                  </span>
                  <span className={`text-2xl font-extrabold ${isDark ? 'text-white' : 'text-[#0b1c30]'}`}>
                    12 {isEn ? 'Groups' : 'Grupos'}
                  </span>
                  <span className={`text-xs block mt-1 font-semibold ${isDark ? 'text-slate-400' : 'text-[#757684]'}`}>
                    {isEn ? '6 grades divided in 2 groups' : '6 grados divididos en 2 grupos'}
                  </span>
                </div>
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  isDark ? 'bg-emerald-950 text-emerald-400' : 'bg-[#eff4ff] text-[#00288e]'
                }`}>
                  <span className="material-symbols-outlined text-[24px]">groups</span>
                </div>
              </div>

              <div className={`p-5 rounded-2xl border shadow-xs flex items-center justify-between ${
                isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-[#e5eeff]'
              }`}>
                <div>
                  <span className={`text-xs font-bold uppercase tracking-wider block mb-1 ${
                    isDark ? 'text-slate-400' : 'text-[#757684]'
                  }`}>
                    {isEn ? 'Linked Families' : 'Acudientes Vinculados'}
                  </span>
                  <span className={`text-2xl font-extrabold ${isDark ? 'text-white' : 'text-[#0b1c30]'}`}>
                    312 {isEn ? 'Families' : 'Familias'}
                  </span>
                  <span className="text-xs text-emerald-400 block mt-1 font-semibold">
                    {isEn ? 'Direct communication channel' : 'Canal directo de mensajería'}
                  </span>
                </div>
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  isDark ? 'bg-cyan-950 text-cyan-400' : 'bg-[#eff4ff] text-[#0051d5]'
                }`}>
                  <span className="material-symbols-outlined text-[24px]">family_restroom</span>
                </div>
              </div>
            </div>

            {/* Structure Summary & Quick Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className={`lg:col-span-2 rounded-2xl p-6 border shadow-xs ${
                isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-[#e5eeff]'
              }`}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-[#0b1c30]'}`}>
                    {isEn ? 'Group Distribution per Grade' : 'Distribución de Grupos por Grado Escolar'}
                  </h3>
                  <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-[#757684]'}`}>
                    {isEn ? 'Academic Year 2026' : 'Año Académico 2026'}
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {schoolGroups.map((g) => (
                    <div
                      key={g.grade}
                      className={`p-3.5 border rounded-xl transition-colors ${
                        isDark
                          ? 'bg-slate-950/60 border-slate-800 hover:border-emerald-500'
                          : 'bg-[#f8f9ff] border-[#e5eeff] hover:border-[#00288e]'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-base font-extrabold ${isDark ? 'text-emerald-400' : 'text-[#00288e]'}`}>
                          {g.grade}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold">
                          {g.studentsCount} {isEn ? 'stu.' : 'est.'}
                        </span>
                      </div>
                      <p className={`text-xs truncate ${isDark ? 'text-slate-300' : 'text-[#444653]'}`}>{g.director}</p>
                      <p className={`text-[11px] mt-1 ${isDark ? 'text-slate-500' : 'text-[#757684]'}`}>{g.room} • {g.shift}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className={`rounded-2xl p-6 border shadow-xs flex flex-col justify-between ${
                isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-[#e5eeff]'
              }`}>
                <div>
                  <h3 className={`text-lg font-bold mb-2 ${isDark ? 'text-white' : 'text-[#0b1c30]'}`}>
                    {isEn ? 'Administration Actions' : 'Acciones de Secretaría y Rectoría'}
                  </h3>
                  <p className={`text-xs leading-relaxed mb-4 ${isDark ? 'text-slate-400' : 'text-[#444653]'}`}>
                    {isEn
                      ? 'Management tools, official certificates, and community notifications.'
                      : 'Herramientas de gestión administrativa, expedición de certificados oficiales y comunicaciones directas.'}
                  </p>

                  <div className="flex flex-col gap-2.5">
                    <button
                      onClick={() => setSelectedTab('certificates')}
                      className={`w-full text-left p-3 rounded-xl border transition-all flex items-center justify-between cursor-pointer ${
                        isDark
                          ? 'bg-slate-950 border-slate-800 hover:border-emerald-500'
                          : 'bg-[#f8f9ff] hover:bg-[#eff4ff] border-[#e5eeff] hover:border-[#00288e]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="material-symbols-outlined text-[20px] text-emerald-400">description</span>
                        <span className={`text-xs font-bold ${isDark ? 'text-white' : 'text-[#0b1c30]'}`}>
                          {isEn ? 'Generate Enrollment Certificate' : 'Generar Certificado de Estudio'}
                        </span>
                      </div>
                      <span className="material-symbols-outlined text-[18px] text-slate-500">chevron_right</span>
                    </button>

                    <button
                      onClick={() => setSelectedTab('groups')}
                      className={`w-full text-left p-3 rounded-xl border transition-all flex items-center justify-between cursor-pointer ${
                        isDark
                          ? 'bg-slate-950 border-slate-800 hover:border-emerald-500'
                          : 'bg-[#f8f9ff] hover:bg-[#eff4ff] border-[#e5eeff] hover:border-[#00288e]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="material-symbols-outlined text-[20px] text-emerald-400">co_present</span>
                        <span className={`text-xs font-bold ${isDark ? 'text-white' : 'text-[#0b1c30]'}`}>
                          {isEn ? 'View Group Directors' : 'Ver Directores de Grupo'}
                        </span>
                      </div>
                      <span className="material-symbols-outlined text-[18px] text-slate-500">chevron_right</span>
                    </button>

                    <button
                      onClick={() => setSelectedTab('circulars')}
                      className={`w-full text-left p-3 rounded-xl border transition-all flex items-center justify-between cursor-pointer ${
                        isDark
                          ? 'bg-slate-950 border-slate-800 hover:border-emerald-500'
                          : 'bg-[#f8f9ff] hover:bg-[#eff4ff] border-[#e5eeff] hover:border-[#00288e]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="material-symbols-outlined text-[20px] text-emerald-400">send</span>
                        <span className={`text-xs font-bold ${isDark ? 'text-white' : 'text-[#0b1c30]'}`}>
                          {isEn ? 'Publish Official Circular' : 'Publicar Circular Institucional'}
                        </span>
                      </div>
                      <span className="material-symbols-outlined text-[18px] text-slate-500">chevron_right</span>
                    </button>
                  </div>
                </div>

                <div className={`mt-6 pt-4 border-t ${isDark ? 'border-slate-800' : 'border-[#e5eeff]'}`}>
                  <div className={`flex items-center gap-2 text-xs ${isDark ? 'text-slate-400' : 'text-[#757684]'}`}>
                    <span className="material-symbols-outlined text-[18px] text-emerald-400">security</span>
                    <span>{isEn ? 'Authenticated with Academic Office profile' : 'Acceso autenticado con perfil de Coordinación'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: GROUPS (6°1 to 11°2) */}
        {selectedTab === 'groups' && (
          <div className={`rounded-2xl p-6 sm:p-8 border shadow-xs animate-in fade-in ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-[#e5eeff]'
          }`}>
            <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b ${
              isDark ? 'border-slate-800' : 'border-[#e5eeff]'
            }`}>
              <div>
                <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-[#0b1c30]'}`}>
                  {isEn ? 'Official Structure of Grades & Groups' : 'Estructura Oficial de Grados y Grupos'}
                </h2>
                <p className={`text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-[#444653]'}`}>
                  {isEn
                    ? 'All 6 secondary grades divided into 2 groups each (6°1 & 6°2 to 11°1 & 11°2) with official morning shift: 6:15 AM - 12:15 PM.'
                    : 'Los 6 grados de secundaria divididos en 2 grupos cada uno (6°1 y 6°2 hasta 11°1 y 11°2) en la jornada escolar de 6:15 AM a 12:15 PM.'}
                </p>
              </div>
              <button
                onClick={() => showToast(isEn ? 'Faculty workload sheet synchronized' : 'Planilla de asignación de carga académica actualizada')}
                className={`px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 cursor-pointer shadow-xs text-white ${
                  isDark ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-[#00288e] hover:bg-[#001f70]'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">add</span>
                <span>{isEn ? 'Assign Teaching Load' : 'Asignar Carga Docente'}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
              {schoolGroups.map((group) => (
                <div
                  key={group.grade}
                  className={`p-5 rounded-xl border flex flex-col justify-between transition-all ${
                    isDark
                      ? 'bg-slate-950 border-slate-800 hover:border-emerald-500'
                      : 'bg-[#f8f9ff] border-[#e5eeff] hover:shadow-sm'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-2xl font-extrabold ${isDark ? 'text-emerald-400' : 'text-[#00288e]'}`}>
                        {isEn ? `Grade ${group.grade}` : `Grado ${group.grade}`}
                      </span>
                      <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold">
                        {group.studentsCount} {isEn ? 'Students' : 'Alumnos'}
                      </span>
                    </div>
                    <div className={`space-y-1.5 text-xs mt-3 ${isDark ? 'text-slate-300' : 'text-[#444653]'}`}>
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-[16px] text-emerald-400">school</span>
                        <span className="font-semibold">{isEn ? 'Director:' : 'Director:'}</span> {group.director}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-[16px] text-emerald-400">meeting_room</span>
                        <span className="font-semibold">{isEn ? 'Room:' : 'Espacio:'}</span> {group.room}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-[16px] text-emerald-400">schedule</span>
                        <span className="font-semibold">{isEn ? 'Schedule:' : 'Horario:'}</span> {group.shift}
                      </div>
                    </div>
                  </div>

                  <div className={`mt-4 pt-3 border-t flex items-center justify-between ${
                    isDark ? 'border-slate-800' : 'border-[#e5eeff]'
                  }`}>
                    <button
                      onClick={() => {
                        setFilterGrade(group.grade);
                        setSelectedTab('certificates');
                      }}
                      className="text-xs font-bold text-cyan-400 hover:underline cursor-pointer flex items-center gap-1"
                    >
                      <span>{isEn ? 'View Students' : 'Ver Estudiantes'}</span>
                      <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                    </button>
                    <span className="text-[11px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded font-medium">
                      {isEn ? 'Active roster' : 'Planilla al día'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: CERTIFICATES & STUDENTS */}
        {selectedTab === 'certificates' && (
          <div className={`rounded-2xl p-6 sm:p-8 border shadow-xs animate-in fade-in ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-[#e5eeff]'
          }`}>
            <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b ${
              isDark ? 'border-slate-800' : 'border-[#e5eeff]'
            }`}>
              <div>
                <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-[#0b1c30]'}`}>
                  {isEn ? 'Enrollment Census & Certificate Issuance' : 'Directorio de Matrículas y Emisión de Certificados'}
                </h2>
                <p className={`text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-[#444653]'}`}>
                  {isEn
                    ? 'Search enrolled students by ID document and issue digitally signed official certificates.'
                    : 'Consulta de estudiantes matriculados por documento de identidad y expedición de constancias oficiales.'}
                </p>
              </div>

              {/* Filters */}
              <div className="flex flex-wrap items-center gap-3">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={isEn ? 'Search name or ID...' : 'Buscar por nombre o documento...'}
                  className={`px-4 py-2.5 text-sm rounded-xl outline-none w-64 border transition-all ${
                    isDark
                      ? 'bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus:border-emerald-400'
                      : 'bg-[#f8f9ff] border-[#dce9ff] text-[#0b1c30] placeholder:text-[#757684] focus:border-[#00288e]'
                  }`}
                />
                <select
                  value={filterGrade}
                  onChange={(e) => setFilterGrade(e.target.value)}
                  className={`px-3 py-2.5 text-sm rounded-xl outline-none border ${
                    isDark
                      ? 'bg-slate-800 border-slate-700 text-white'
                      : 'bg-[#f8f9ff] border-[#dce9ff] text-[#0b1c30]'
                  }`}
                >
                  <option value="Todos">{isEn ? 'All Grades' : 'Todos los grados'}</option>
                  <option value="6°1">6°1</option>
                  <option value="6°2">6°2</option>
                  <option value="7°1">7°1</option>
                  <option value="7°2">7°2</option>
                  <option value="8°1">8°1</option>
                  <option value="8°2">8°2</option>
                  <option value="9°1">9°1</option>
                  <option value="9°2">9°2</option>
                  <option value="10°1">10°1</option>
                  <option value="10°2">10°2</option>
                  <option value="11°1">11°1</option>
                  <option value="11°2">11°2</option>
                </select>
              </div>
            </div>

            <div className="mt-6 overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className={`text-xs font-bold uppercase tracking-wider border-b ${
                    isDark ? 'bg-slate-800 text-slate-300 border-slate-700' : 'bg-[#f8f9ff] text-[#757684] border-[#e5eeff]'
                  }`}>
                    <th className="py-3 px-4">{isEn ? 'Student' : 'Estudiante'}</th>
                    <th className="py-3 px-4">{isEn ? 'ID Document' : 'Documento'}</th>
                    <th className="py-3 px-4">{isEn ? 'Grade & Group' : 'Grado y Grupo'}</th>
                    <th className="py-3 px-4">{isEn ? 'Shift' : 'Jornada'}</th>
                    <th className="py-3 px-4">{isEn ? 'Guardian' : 'Acudiente'}</th>
                    <th className="py-3 px-4">{isEn ? 'Status' : 'Estado'}</th>
                    <th className="py-3 px-4 text-center">{isEn ? 'Actions' : 'Acciones'}</th>
                  </tr>
                </thead>
                <tbody className={`divide-y text-sm ${isDark ? 'divide-slate-800' : 'divide-[#e5eeff]'}`}>
                  {filteredStudents.map((st) => (
                    <tr key={st.id} className={isDark ? 'hover:bg-slate-800/50' : 'hover:bg-[#f8f9ff]'}>
                      <td className={`py-3 px-4 font-bold ${isDark ? 'text-white' : 'text-[#0b1c30]'}`}>
                        {st.name}
                      </td>
                      <td className={`py-3 px-4 font-mono text-xs ${isDark ? 'text-slate-400' : 'text-[#444653]'}`}>
                        {st.documentId}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`font-bold px-2.5 py-1 rounded-lg ${
                          isDark ? 'bg-slate-800 text-emerald-400' : 'bg-[#eff4ff] text-[#00288e]'
                        }`}>
                          {st.grade}
                        </span>
                      </td>
                      <td className={`py-3 px-4 text-xs ${isDark ? 'text-slate-400' : 'text-[#444653]'}`}>
                        {st.shift}
                      </td>
                      <td className={`py-3 px-4 text-xs ${isDark ? 'text-slate-400' : 'text-[#444653]'}`}>
                        {st.guardianName}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400">
                          {st.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => showToast(isEn ? `Study certificate issued for ${st.name} (${st.grade})` : `Certificado de estudio expedido para ${st.name} (Grado ${st.grade})`)}
                          className={`px-3 py-1.5 rounded-lg text-white text-xs font-bold flex items-center gap-1.5 mx-auto cursor-pointer shadow-xs ${
                            isDark ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-[#00288e] hover:bg-[#001f70]'
                          }`}
                        >
                          <span className="material-symbols-outlined text-[16px]">print</span>
                          <span>{isEn ? 'Certificate' : 'Certificado'}</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: CIRCULARS */}
        {selectedTab === 'circulars' && (
          <div className={`rounded-2xl p-6 sm:p-8 border shadow-xs animate-in fade-in ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-[#e5eeff]'
          }`}>
            <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b ${
              isDark ? 'border-slate-800' : 'border-[#e5eeff]'
            }`}>
              <div>
                <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-[#0b1c30]'}`}>
                  {isEn ? 'Official Notices & Directives' : 'Circulares y Resoluciones Oficiales'}
                </h2>
                <p className={`text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-[#444653]'}`}>
                  {isEn
                    ? 'Official communications dispatched by Principal Office and Academic Coordination for I.E. Vallejuelos.'
                    : 'Comunicaciones emitidas por Rectoría y Coordinación Académica para toda la comunidad de la I.E. Vallejuelos.'}
                </p>
              </div>
              <button
                onClick={() => showToast(isEn ? 'New notice template drafted and archived' : 'Nueva circular institucional redactada y archivada')}
                className={`px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 cursor-pointer shadow-xs text-white ${
                  isDark ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-[#00288e] hover:bg-[#001f70]'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">add_circle</span>
                <span>{isEn ? 'Draft Notice' : 'Redactar Circular'}</span>
              </button>
            </div>

            <div className="flex flex-col gap-4 mt-6">
              {circulars.map((c) => (
                <div
                  key={c.id}
                  className={`p-5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                    isDark ? 'bg-slate-950 border-slate-800' : 'bg-[#f8f9ff] border-[#e5eeff]'
                  }`}
                >
                  <div className="flex items-start gap-3.5">
                    <div className={`w-10 h-10 rounded-xl text-white flex items-center justify-center shrink-0 ${
                      isDark ? 'bg-emerald-600' : 'bg-[#00288e]'
                    }`}>
                      <span className="material-symbols-outlined text-[20px]">campaign</span>
                    </div>
                    <div>
                      <h4 className={`text-base font-bold ${isDark ? 'text-white' : 'text-[#0b1c30]'}`}>
                        {isEn ? c.titleEn : c.title}
                      </h4>
                      <div className={`flex flex-wrap items-center gap-3 text-xs mt-1 ${
                        isDark ? 'text-slate-400' : 'text-[#757684]'
                      }`}>
                        <span className={`font-semibold ${isDark ? 'text-emerald-400' : 'text-[#00288e]'}`}>
                          {isEn ? c.authorEn : c.author}
                        </span>
                        <span>•</span>
                        <span>{isEn ? 'Recipients: ' : 'Destinatarios: '}{isEn ? c.targetEn : c.target}</span>
                        <span>•</span>
                        <span>{isEn ? 'Date: ' : 'Fecha: '}{isEn ? c.dateEn : c.date}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => showToast(isEn ? `Downloading official PDF: ${c.titleEn}` : `Descargando PDF oficial: ${c.title}`)}
                      className={`px-3 py-1.5 rounded-lg border text-xs font-bold flex items-center gap-1 cursor-pointer ${
                        isDark
                          ? 'border-slate-700 bg-slate-800 text-white hover:bg-slate-700'
                          : 'border-[#c4c5d5] hover:bg-white text-[#0b1c30]'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[16px]">download</span>
                      <span>{isEn ? 'Download PDF' : 'Descargar PDF'}</span>
                    </button>
                    <button
                      onClick={() => showToast(isEn ? 'Notification dispatched to student and family emails.' : 'Notificación enviada a correos y portal')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer ${
                        isDark
                          ? 'bg-slate-800 text-cyan-300 hover:bg-slate-700'
                          : 'bg-[#eff4ff] hover:bg-[#dce9ff] text-[#00288e]'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[16px]">share</span>
                      <span>{isEn ? 'Resend' : 'Reenviar'}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
