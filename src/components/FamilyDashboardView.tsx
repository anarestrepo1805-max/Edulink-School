import React, { useState } from 'react';
import { ActiveScreen, NewsFeedItem, UserProfile } from '../types';
import { ASSETS, INITIAL_NEWS_FEED } from '../data/mockData';
import { saveUserConfiguration } from '../services/authService';

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
  const isConfigured = Boolean(currentUser?.hasConfigured);
  const parentName = currentUser?.fullName || 'Elena Jiménez';
  const [selectedStudent, setSelectedStudent] = useState<'miguel' | 'sofia'>('miguel');
  const [showStudentDropdown, setShowStudentDropdown] = useState(false);
  const [activeCategory, setActiveCategory] = useState<'all' | 'grades' | 'meetings' | 'notices'>('all');
  const [confirmedMeeting, setConfirmedMeeting] = useState(false);
  const [isConfiguringDemo, setIsConfiguringDemo] = useState(false);

  const handleLoadDemoFamily = async () => {
    setIsConfiguringDemo(true);
    if (currentUser) {
      try {
        const updated = await saveUserConfiguration(currentUser.id, {
          hasConfigured: true
        });
        if (onUpdateUser) onUpdateUser(updated);
      } catch (err) {
        console.warn('Error saving family config:', err);
      }
    }
    setIsConfiguringDemo(false);
  };

  const studentData = {
    miguel: {
      name: 'Miguel Ángel Jiménez',
      grade: 'Grado 11°B',
      avatar: ASSETS.studentAvatar,
      matricula: '2026-11B',
      director: 'Prof. Roberto Gómez',
      average: '4.2',
      attendance: '98%',
      attendanceDetail: '48 de 49 clases asistidas',
      rank: 'Puesto 4° de 35'
    },
    sofia: {
      name: 'Sofía Valentina Jiménez',
      grade: 'Grado 6°A',
      avatar: ASSETS.studentSofia,
      matricula: '2026-06A',
      director: 'Lic. Claudia Morales',
      average: '4.6',
      attendance: '100%',
      attendanceDetail: '49 de 49 clases asistidas',
      rank: 'Puesto 2° de 32'
    }
  };

  const currentStudent = studentData[selectedStudent];

  const filteredFeed: NewsFeedItem[] = INITIAL_NEWS_FEED.filter((item) => {
    if (activeCategory === 'all') return true;
    return item.category === activeCategory;
  });

  return (
    <div className="min-h-screen bg-[#f8f9ff] flex text-[#0b1c30]">
      {/* FIXED SIDEBAR (Portal Familiar) */}
      <aside className="hidden lg:flex fixed left-0 top-12 bottom-0 w-72 bg-white shadow-[0_1px_8px_rgba(0,0,0,0.04)] z-40 flex-col justify-between border-r border-[#e5eeff]">
        <div className="flex flex-col">
          <div className="h-20 px-6 flex items-center gap-3 border-b border-[#eff4ff]">
            <div className="w-10 h-10 rounded-xl bg-[#eff4ff] flex items-center justify-center text-[#00288e] shrink-0 border border-[#dce9ff]">
              <span className="material-symbols-outlined text-2xl">school</span>
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-extrabold text-[#00288e] leading-tight">
                Edulink School
              </span>
              <span className="text-[11px] font-bold text-[#444653] uppercase tracking-wider">
                Portal Familiar
              </span>
            </div>
          </div>

          <nav className="flex flex-col gap-1 px-4 py-4">
            <button
              onClick={() => onNavigate('family_dashboard')}
              className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-[#1e40af] text-white font-bold text-xs shadow-sm transition-all text-left"
            >
              <span className="material-symbols-outlined text-xl">dashboard</span>
              <span>Inicio / Dashboard</span>
            </button>
            <button
              onClick={() => alert('Boletines oficiales de calificaciones firmados por Rectoría.')}
              className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-[#444653] hover:bg-[#eff4ff] hover:text-[#0b1c30] transition-all text-left"
            >
              <span className="material-symbols-outlined text-xl">assignment</span>
              <span className="text-xs font-semibold">Calificaciones y Boletines</span>
            </button>
            <button
              onClick={() => alert('Módulo de asistencia y seguimiento de asignaturas.')}
              className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-[#444653] hover:bg-[#eff4ff] hover:text-[#0b1c30] transition-all text-left"
            >
              <span className="material-symbols-outlined text-xl">calendar_today</span>
              <span className="text-xs font-semibold">Asistencia y Asignaturas</span>
            </button>
            <button
              onClick={() => alert('Observador convivencial: Conducta Ejemplar Tipo A. Sin anotaciones.')}
              className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-[#444653] hover:bg-[#eff4ff] hover:text-[#0b1c30] transition-all text-left"
            >
              <span className="material-symbols-outlined text-xl">verified_user</span>
              <span className="text-xs font-semibold">Observador Convivencial</span>
            </button>
            {/* Direct navigation to Screen 6 / Family Messaging */}
            <button
              onClick={() => onNavigate('family_messaging')}
              className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-[#444653] hover:bg-[#eff4ff] hover:text-[#00288e] transition-all text-left group"
            >
              <span className="material-symbols-outlined text-xl group-hover:text-[#00288e]">mail</span>
              <span className="text-xs font-semibold">Comunicados y Citaciones</span>
              <span className="ml-auto px-1.5 py-0.2 bg-[#0051d5] text-white text-[10px] font-bold rounded-full">
                3
              </span>
            </button>
            <button
              onClick={() => alert('Directorio y horarios de atención de los docentes.')}
              className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-[#444653] hover:bg-[#eff4ff] hover:text-[#0b1c30] transition-all text-left"
            >
              <span className="material-symbols-outlined text-xl">contact_phone</span>
              <span className="text-xs font-semibold">Tareas y contacto profesores</span>
            </button>
            <button
              onClick={() => alert('Ajustes de privacidad y notificaciones por WhatsApp/SMS.')}
              className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-[#444653] hover:bg-[#eff4ff] hover:text-[#0b1c30] transition-all text-left"
            >
              <span className="material-symbols-outlined text-xl">settings</span>
              <span className="text-xs font-semibold">Configuración</span>
            </button>
          </nav>
        </div>

        <div className="p-4 border-t border-[#eff4ff]">
          <div className="p-3.5 rounded-xl bg-[#eff4ff] flex flex-col gap-1 border border-[#dce9ff]">
            <div className="flex items-center gap-1.5 text-[#444653]">
              <span className="material-symbols-outlined text-sm text-[#0051d5]">account_balance</span>
              <span className="text-[11px] font-bold">I.E. Vallejuelos</span>
            </div>
            <span className="text-xs text-[#0b1c30] font-bold">Año lectivo 2026</span>
          </div>
        </div>
      </aside>

      {/* MAIN CONTAINER */}
      <div className="flex-1 lg:pl-72 flex flex-col min-w-0">
        {/* HEADER BAR */}
        <header className="sticky top-12 h-20 bg-white/95 backdrop-blur-xl shadow-xs z-30 flex items-center justify-between px-4 sm:px-6 lg:px-8 border-b border-[#e5eeff]">
          {/* Active Student quick pill */}
          <div className="flex items-center">
            <div
              onClick={() => setShowStudentDropdown(!showStudentDropdown)}
              className="flex items-center gap-3 px-3.5 py-1.5 rounded-xl bg-[#eff4ff] hover:bg-[#e5eeff] transition-colors cursor-pointer border border-[#dce9ff]"
            >
              <div className="w-9 h-9 rounded-full bg-[#dbe1ff] flex items-center justify-center text-[#00288e] font-extrabold text-sm shrink-0">
                {currentStudent.name[0]}
              </div>
              <div className="flex flex-col text-left">
                <span className="text-[10px] text-[#444653] font-medium leading-none">
                  Viendo información de:
                </span>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-[#0b1c30] font-bold">{currentStudent.name}</span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-[#dce9ff] text-[#00288e] text-[10px] font-bold">
                    {currentStudent.grade}
                  </span>
                </div>
              </div>
              <div className="ml-2 flex items-center gap-1 text-[#0051d5] text-xs font-bold">
                <span className="hidden sm:inline">Cambiar</span>
                <span className="material-symbols-outlined text-lg">expand_more</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => onNavigate('family_messaging')}
              className="relative w-10 h-10 rounded-xl bg-[#eff4ff] hover:bg-[#e5eeff] text-[#444653] hover:text-[#0b1c30] flex items-center justify-center transition-all cursor-pointer"
              title="Notificaciones y Mensajes"
            >
              <span className="material-symbols-outlined text-xl">notifications</span>
              <span className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full bg-[#ba1a1a] ring-2 ring-white" />
            </button>

            <div className="h-8 w-px bg-[#dce9ff]" />

            <div className="flex items-center gap-3">
              <div className="flex flex-col text-right hidden sm:flex">
                <span className="text-xs text-[#0b1c30] font-bold">{parentName}</span>
                <span className="text-[11px] text-[#444653]">
                  {currentUser?.relationship || 'Acudiente Principal'} {currentUser?.representedStudentName ? `• de ${currentUser.representedStudentName}` : ''}
                </span>
              </div>
              <img
                alt="Profile"
                className="w-9 h-9 rounded-full object-cover ring-2 ring-[#00288e]/20 shadow-xs"
                src={currentUser?.avatarUrl || ASSETS.parentAvatar}
              />
            </div>
          </div>
        </header>

        {/* WORKSPACE CONTENT */}
        <main className="p-4 sm:p-6 lg:p-8 flex flex-col gap-6 max-w-[1440px] w-full mx-auto">
          {!isConfigured ? (
            <div className="bg-white rounded-2xl shadow-xs p-10 text-center flex flex-col items-center justify-center border border-[#e5eeff]">
              <div className="w-16 h-16 rounded-2xl bg-[#eff4ff] text-[#00288e] flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-[36px]">family_restroom</span>
              </div>
              <h3 className="text-xl font-extrabold text-[#0b1c30] mb-2">
                {currentUser?.representedStudentName
                  ? `Estudiante vinculado: ${currentUser.representedStudentName}`
                  : 'No has vinculado estudiantes a tu cuenta familiar aún'}
              </h3>
              <p className="text-sm text-[#444653] max-w-lg mb-6 leading-relaxed">
                {currentUser?.representedStudentName
                  ? `Estás registrado como ${currentUser.relationship || 'acudiente'} de ${currentUser.representedStudentName} (Doc/Carnet: ${currentUser.representedStudentCode || 'Pendiente'}). Como recién ingresas a la plataforma, aún no se han subido registros de calificaciones para este alumno. Puedes cargar el perfil familiar de prueba para explorar boletines y reportes.`
                  : 'Como usuario acudiente recién registrado en el sistema, tu panel se encuentra sin información académica vinculada. Puedes cargar los perfiles escolares de ejemplo para explorar las calificaciones, reportes y comunicados.'}
              </p>
              <button
                type="button"
                onClick={handleLoadDemoFamily}
                disabled={isConfiguringDemo}
                className="px-5 py-2.5 rounded-xl bg-[#00288e] hover:bg-[#1e40af] text-white text-xs font-bold shadow-sm transition-all flex items-center gap-2 cursor-pointer"
              >
                <span className="material-symbols-outlined text-lg">supervised_user_circle</span>
                <span>{isConfiguringDemo ? 'Configurando...' : 'Cargar Perfil Familiar Demo'}</span>
              </button>
            </div>
          ) : (
            <>
          {/* 1. BARRA SUPERIOR DE CONTEXTO DEL HIJO / ESTUDIANTE (Image 10) */}
          <div className="bg-white rounded-2xl shadow-xs p-6 flex flex-col xl:flex-row items-start xl:items-center justify-between gap-6 relative overflow-hidden border border-[#e5eeff]">
            <div className="absolute -right-12 -top-12 w-48 h-48 rounded-full bg-[#eff4ff] pointer-events-none opacity-60" />

            <div className="flex items-center gap-4 z-10">
              <div className="relative shrink-0">
                <img
                  alt={currentStudent.name}
                  className="w-20 h-20 rounded-full object-cover shadow-xs ring-4 ring-[#1e40af]/15"
                  src={currentStudent.avatar}
                />
                <span className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-[#316bf3] text-white flex items-center justify-center text-xs font-bold shadow-xs">
                  <span className="material-symbols-outlined text-[15px]">school</span>
                </span>
              </div>

              <div className="flex flex-col">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xl font-extrabold text-[#0b1c30]">{currentStudent.name}</span>
                  <span className="px-2.5 py-0.5 rounded-full bg-[#dde1ff] text-[#001453] text-xs font-bold">
                    {currentStudent.grade}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-[#e5eeff] text-[#0051d5] text-xs font-semibold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#316bf3]" />
                    {selectedStudent === 'miguel' ? '1 de 2 hijos matriculados' : '2 de 2 hijos matriculados'}
                  </span>
                </div>

                <p className="text-xs text-[#444653] mt-1.5">
                  Matrícula: <strong className="text-[#0b1c30] font-bold">{currentStudent.matricula}</strong> • Período Activo: <strong className="text-[#0b1c30] font-bold">1° Período 2026</strong> • Director de Grupo: <strong className="text-[#0b1c30] font-bold">{currentStudent.director}</strong>
                </p>

                <div className="mt-2 flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#e5eeff] text-[#00394f] text-xs font-bold">
                    <span className="material-symbols-outlined text-sm text-[#0051d5]">verified</span>
                    Estado: Matrícula Activa y al Día
                  </span>
                </div>
              </div>
            </div>

            {/* Student Switcher Dropdown & Actions */}
            <div className="flex flex-wrap items-center gap-3 z-10 w-full xl:w-auto justify-start xl:justify-end">
              <div className="relative inline-block text-left">
                <button
                  type="button"
                  onClick={() => setShowStudentDropdown(!showStudentDropdown)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#eff4ff] hover:bg-[#e5eeff] text-[#00288e] text-xs font-bold transition-all shadow-xs border border-[#dce9ff] cursor-pointer"
                >
                  <span className="material-symbols-outlined text-lg">swap_horiz</span>
                  <span>Cambiar Estudiante</span>
                  <span className="material-symbols-outlined text-base">expand_more</span>
                </button>

                {showStudentDropdown && (
                  <div className="absolute right-0 mt-2 w-64 rounded-xl bg-white shadow-xl p-2 z-50 flex flex-col gap-1 border border-[#e2e8f0]">
                    <div className="px-2 py-1 text-[#444653] text-[11px] font-bold uppercase border-b border-[#eff4ff]">
                      Hijos matriculados
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedStudent('miguel');
                        setShowStudentDropdown(false);
                      }}
                      className={`w-full text-left p-2 rounded-lg flex items-center gap-2.5 transition-colors ${
                        selectedStudent === 'miguel' ? 'bg-[#eff4ff]' : 'hover:bg-slate-50'
                      }`}
                    >
                      <div className="w-8 h-8 rounded-full bg-[#1e40af] text-white font-bold flex items-center justify-center text-xs">
                        M
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-[#0b1c30]">Miguel Ángel Jiménez</span>
                        <span className="text-[11px] text-[#444653]">Grado 11°B {selectedStudent === 'miguel' && '(Actual)'}</span>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedStudent('sofia');
                        setShowStudentDropdown(false);
                      }}
                      className={`w-full text-left p-2 rounded-lg flex items-center gap-2.5 transition-colors ${
                        selectedStudent === 'sofia' ? 'bg-[#eff4ff]' : 'hover:bg-slate-50'
                      }`}
                    >
                      <div className="w-8 h-8 rounded-full bg-[#dce9ff] text-[#00288e] font-bold flex items-center justify-center text-xs">
                        S
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-[#0b1c30]">Sofía Valentina Jiménez</span>
                        <span className="text-[11px] text-[#444653]">Grado 6°A {selectedStudent === 'sofia' && '(Actual)'}</span>
                      </div>
                    </button>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => alert(`Ficha integral del estudiante ${currentStudent.name} (Historial médico, asistencias, acudientes).`)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#00288e] hover:bg-[#1e40af] text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                <span className="material-symbols-outlined text-lg">description</span>
                <span>Ficha del Alumno</span>
              </button>
            </div>
          </div>

          {/* 2. TARJETAS DE RESUMEN EJECUTIVO (3 KPI Cards) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* KPI 1: Promedio General */}
            <div className="bg-white p-5 rounded-2xl shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden group border border-[#e5eeff]">
              <div className="flex items-start justify-between">
                <div className="flex flex-col">
                  <span className="text-xs text-[#444653] uppercase tracking-wider font-bold">
                    Promedio General Acumulado
                  </span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-3xl font-extrabold text-[#00288e]">{currentStudent.average}</span>
                    <span className="text-sm font-normal text-[#444653]">/ 5.0</span>
                  </div>
                </div>
                <div className="w-12 h-12 rounded-xl bg-[#eff4ff] text-[#00288e] flex items-center justify-center group-hover:bg-[#1e40af] group-hover:text-white transition-colors">
                  <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                    military_tech
                  </span>
                </div>
              </div>

              <div className="mt-4 flex flex-col gap-1.5">
                <div className="flex justify-between text-xs text-[#444653]">
                  <span>Rendimiento Académico</span>
                  <span className="font-bold text-[#00288e]">84%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-[#e5eeff] overflow-hidden">
                  <div className="h-full rounded-full bg-[#316bf3] transition-all duration-500" style={{ width: '84%' }} />
                </div>
              </div>

              <div className="mt-4 pt-3 flex items-center justify-between border-t border-[#eff4ff]">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#eff4ff] text-[#00288e] text-xs font-bold">
                  <span className="material-symbols-outlined text-xs">trending_up</span> +0.3 vs ciclo anterior
                </span>
                <span className="text-xs text-[#444653] font-bold">{currentStudent.rank}</span>
              </div>
            </div>

            {/* KPI 2: Porcentaje de Asistencia */}
            <div className="bg-white p-5 rounded-2xl shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden group border border-[#e5eeff]">
              <div className="flex items-start justify-between">
                <div className="flex flex-col">
                  <span className="text-xs text-[#444653] uppercase tracking-wider font-bold">
                    Porcentaje de Asistencia
                  </span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-3xl font-extrabold text-[#0051d5]">{currentStudent.attendance}</span>
                    <span className="text-xs text-[#444653] font-semibold">Puntualidad activa</span>
                  </div>
                </div>
                <div className="w-12 h-12 rounded-xl bg-[#eff4ff] text-[#0051d5] flex items-center justify-center group-hover:bg-[#0051d5] group-hover:text-white transition-colors">
                  <span className="material-symbols-outlined text-2xl">event_available</span>
                </div>
              </div>

              <div className="mt-4 flex items-center gap-3">
                <span className="w-3 h-3 rounded-full bg-[#316bf3]" />
                <span className="text-xs text-[#0b1c30] font-medium">{currentStudent.attendanceDetail}</span>
              </div>

              <div className="mt-4 pt-3 flex items-center justify-between border-t border-[#eff4ff]">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#e5eeff] text-[#0b1c30] text-xs font-semibold">
                  <span className="material-symbols-outlined text-xs text-[#0051d5]">check_circle</span>
                  1 falta médica justificada (02 Feb)
                </span>
              </div>
            </div>

            {/* KPI 3: Reportes Convivenciales */}
            <div className="bg-white p-5 rounded-2xl shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden group border border-[#e5eeff]">
              <div className="flex items-start justify-between">
                <div className="flex flex-col">
                  <span className="text-xs text-[#444653] uppercase tracking-wider font-bold">
                    Reportes Convivenciales
                  </span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-3xl font-extrabold text-[#00394f]">0</span>
                    <span className="text-xs text-[#444653]">observaciones</span>
                  </div>
                </div>
                <div className="w-12 h-12 rounded-xl bg-[#eff4ff] text-[#00394f] flex items-center justify-center group-hover:bg-[#00394f] group-hover:text-white transition-colors">
                  <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                    shield
                  </span>
                </div>
              </div>

              <div className="mt-4 flex flex-col gap-1">
                <span className="text-xs font-bold text-[#0b1c30]">Sin faltas registradas</span>
                <p className="text-[11px] text-[#444653]">Cumplimiento cabal de las directrices del Manual de Convivencia.</p>
              </div>

              <div className="mt-4 pt-3 flex items-center justify-between border-t border-[#eff4ff]">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#dce9ff] text-[#00288e] text-xs font-bold">
                  <span className="material-symbols-outlined text-xs">verified_user</span>
                  Conducta Ejemplar • Tipo A
                </span>
              </div>
            </div>
          </div>

          {/* 3. GRID DE CONTENIDO PRINCIPAL (Columna Izquierda 68%, Columna Derecha 32%) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* COLUMNA IZQUIERDA: Muro de Novedades y Seguimiento (8 cols) */}
            <div className="lg:col-span-8 flex flex-col gap-4">
              <div className="bg-white p-5 sm:p-6 rounded-2xl shadow-xs flex flex-col gap-4 border border-[#e5eeff]">
                {/* Cabecera de Novedades y Filtros */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-2 border-b border-[#eff4ff]">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-6 rounded-full bg-[#00288e]" />
                    <h2 className="text-lg font-bold text-[#0b1c30]">Muro de Novedades y Seguimiento</h2>
                  </div>

                  {/* Filtros de píldoras */}
                  <div className="flex flex-wrap items-center gap-1 bg-[#eff4ff] p-1 rounded-xl text-xs font-bold border border-[#dce9ff]">
                    <button
                      type="button"
                      onClick={() => setActiveCategory('all')}
                      className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                        activeCategory === 'all'
                          ? 'bg-white text-[#00288e] shadow-xs'
                          : 'text-[#444653] hover:text-[#0b1c30]'
                      }`}
                    >
                      Todas
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveCategory('grades')}
                      className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                        activeCategory === 'grades'
                          ? 'bg-white text-[#00288e] shadow-xs'
                          : 'text-[#444653] hover:text-[#0b1c30]'
                      }`}
                    >
                      Calificaciones
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveCategory('meetings')}
                      className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                        activeCategory === 'meetings'
                          ? 'bg-white text-[#00288e] shadow-xs'
                          : 'text-[#444653] hover:text-[#0b1c30]'
                      }`}
                    >
                      Citaciones
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveCategory('notices')}
                      className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                        activeCategory === 'notices'
                          ? 'bg-white text-[#00288e] shadow-xs'
                          : 'text-[#444653] hover:text-[#0b1c30]'
                      }`}
                    >
                      Circulares
                    </button>
                  </div>
                </div>

                {/* Feed Items Container */}
                <div className="flex flex-col gap-4">
                  {filteredFeed.map((item) => (
                    <div
                      key={item.id}
                      className="bg-[#eff4ff]/60 p-4 sm:p-5 rounded-2xl hover:bg-[#eff4ff] transition-all flex flex-col gap-2 border border-[#dce9ff]"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-10 h-10 rounded-xl ${item.iconBg} ${item.iconColor} flex items-center justify-center shrink-0 shadow-xs`}
                          >
                            <span className="material-symbols-outlined text-xl">{item.icon}</span>
                          </div>
                          <div>
                            <h3 className="text-xs sm:text-sm font-bold text-[#0b1c30]">
                              {item.title}
                            </h3>
                            <span className="text-[11px] text-[#444653]">
                              {item.timeAgo} • {item.author}
                            </span>
                          </div>
                        </div>

                        {item.gradeBadge && (
                          <span className="px-2.5 py-1 rounded-full bg-white text-[#00288e] text-xs font-extrabold shadow-xs shrink-0 border border-[#dce9ff]">
                            {item.gradeBadge}
                          </span>
                        )}

                        {item.statusBadge && (
                          <span
                            className={`px-2.5 py-1 rounded-full text-xs font-bold shrink-0 ${
                              item.statusBadge.type === 'mandatory'
                                ? 'bg-[#ffdad6] text-[#ba1a1a]'
                                : 'bg-[#d3e4fe] text-[#00288e]'
                            }`}
                          >
                            {item.statusBadge.text}
                          </span>
                        )}
                      </div>

                      <p className="text-xs sm:text-sm text-[#0b1c30] mt-1 pl-0 sm:pl-13 leading-relaxed">
                        {item.content}
                      </p>

                      {/* Item Actions */}
                      <div className="mt-2 pl-0 sm:pl-13 flex flex-wrap items-center justify-between gap-2">
                        {item.id === 'feed-2' ? (
                          <div className="flex flex-wrap items-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setConfirmedMeeting(!confirmedMeeting);
                                alert(confirmedMeeting ? 'Asistencia cancelada.' : '¡Asistencia confirmada para la entrega de boletines!');
                              }}
                              className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer ${
                                confirmedMeeting
                                  ? 'bg-[#059669] text-white'
                                  : 'bg-[#00288e] text-white hover:bg-[#1e40af]'
                              }`}
                            >
                              <span className="material-symbols-outlined text-sm">
                                {confirmedMeeting ? 'check_circle' : 'done_all'}
                              </span>
                              <span>{confirmedMeeting ? 'Asistencia Confirmada' : 'Confirmar Asistencia'}</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => alert('Evento añadido a Google Calendar institucional.')}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white text-[#444653] hover:text-[#0b1c30] text-xs font-semibold shadow-xs transition-all border border-[#e2e8f0]"
                            >
                              <span className="material-symbols-outlined text-sm">event</span>
                              <span>Añadir a mi calendario</span>
                            </button>
                          </div>
                        ) : item.attachment ? (
                          <button
                            type="button"
                            onClick={() => alert(`Descargando archivo adjunto: ${item.attachment?.name}`)}
                            className="inline-flex items-center gap-1.5 text-[#00288e] hover:text-[#1e40af] text-xs font-bold cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-base">picture_as_pdf</span>
                            <span>Descargar {item.attachment.name} ({item.attachment.size})</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => onNavigate('family_messaging')}
                            className="inline-flex items-center gap-1 text-[#0051d5] hover:text-[#00288e] text-xs font-bold cursor-pointer"
                          >
                            <span>{item.actionText || 'Ver detalles'}</span>
                            <span className="material-symbols-outlined text-sm">arrow_forward</span>
                          </button>
                        )}

                        {item.weight && (
                          <span className="text-[11px] text-[#444653] font-medium">{item.weight}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* COLUMNA DERECHA: Accesos Rápidos & Soporte (4 cols) */}
            <div className="lg:col-span-4 flex flex-col gap-4">
              {/* Panel de Accesos Rápidos del Acudiente */}
              <div className="bg-white p-5 rounded-2xl shadow-xs flex flex-col gap-4 border border-[#e5eeff]">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-6 rounded-full bg-[#0051d5]" />
                  <h2 className="text-base font-bold text-[#0b1c30]">Accesos Rápidos</h2>
                </div>

                <div className="flex flex-col gap-2.5">
                  {/* Botón 1: Descargar Boletín */}
                  <button
                    type="button"
                    onClick={() => alert(`Descargando Boletín de Calificaciones oficial de ${currentStudent.name} (1° Período 2026 - Certificado Digital).`)}
                    className="w-full text-left p-3.5 rounded-xl bg-[#eff4ff] hover:bg-[#e5eeff] transition-all group flex items-start gap-3 shadow-xs border border-[#dce9ff] cursor-pointer"
                  >
                    <div className="w-10 h-10 rounded-xl bg-[#00288e] text-white flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <span className="material-symbols-outlined text-xl">download</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-[#00288e] group-hover:text-[#1e40af]">
                        Descargar Boletín (PDF)
                      </span>
                      <span className="text-[11px] text-[#444653] mt-0.5">
                        Informe oficial 1° Período 2026 firmado digitalmente
                      </span>
                    </div>
                  </button>

                  {/* Botón 2: Solicitar Cita */}
                  <button
                    type="button"
                    onClick={() => onNavigate('family_messaging')}
                    className="w-full text-left p-3.5 rounded-xl bg-[#eff4ff] hover:bg-[#e5eeff] transition-all group flex items-start gap-3 shadow-xs border border-[#dce9ff] cursor-pointer"
                  >
                    <div className="w-10 h-10 rounded-xl bg-[#316bf3] text-white flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <span className="material-symbols-outlined text-xl">calendar_month</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-[#0b1c30] group-hover:text-[#00288e]">
                        Solicitar Cita Docente
                      </span>
                      <span className="text-[11px] text-[#444653] mt-0.5">
                        Atención: Mar y Jue 10:00 AM • Prof. Roberto Gómez
                      </span>
                    </div>
                  </button>

                  {/* Botón 3: Ver Horario */}
                  <button
                    type="button"
                    onClick={() => alert('Jornada Mañana: 6:15 AM a 12:15 PM. Descanso pedagógico: 09:15 AM.')}
                    className="w-full text-left p-3.5 rounded-xl bg-[#eff4ff] hover:bg-[#e5eeff] transition-all group flex items-start gap-3 shadow-xs border border-[#dce9ff] cursor-pointer"
                  >
                    <div className="w-10 h-10 rounded-xl bg-[#d3e4fe] text-[#00288e] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <span className="material-symbols-outlined text-xl">schedule</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-[#0b1c30] group-hover:text-[#00288e]">
                        Horario de Clases y Exámenes
                      </span>
                      <span className="text-[11px] text-[#444653] mt-0.5">
                        Jornada Mañana (6:15 AM - 12:15 PM)
                      </span>
                    </div>
                  </button>

                  {/* Botón 4: Tareas pendientes */}
                  <button
                    type="button"
                    onClick={() => onNavigate('student_assignment')}
                    className="w-full text-left p-3.5 rounded-xl bg-[#eff4ff] hover:bg-[#e5eeff] transition-all group flex items-start gap-3 shadow-xs border border-[#dce9ff] cursor-pointer"
                  >
                    <div className="w-10 h-10 rounded-xl bg-[#dce9ff] text-[#00394f] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <span className="material-symbols-outlined text-xl">receipt_long</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-[#0b1c30] group-hover:text-[#00288e]">
                        Tareas pendientes y contacto profesores
                      </span>
                      <span className="text-[11px] text-[#444653] mt-0.5">
                        Números, correos y tareas actualizadas
                      </span>
                    </div>
                  </button>
                </div>
              </div>

              {/* Canales de Atención Directa */}
              <div className="bg-white p-5 rounded-2xl shadow-xs flex flex-col gap-4 border border-[#e5eeff]">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-6 rounded-full bg-[#00394f]" />
                  <h2 className="text-base font-bold text-[#0b1c30]">Canales de Atención</h2>
                </div>

                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-3 p-2.5 rounded-xl bg-[#eff4ff]">
                    <span className="material-symbols-outlined text-[#00288e] text-xl">phone</span>
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-[#0b1c30]">Secretaría Académica</span>
                      <span className="text-[11px] text-[#444653] font-mono">+57 (4) 444-2390 Ext. 102</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-2.5 rounded-xl bg-[#eff4ff]">
                    <span className="material-symbols-outlined text-[#00288e] text-xl">mail</span>
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-[#0b1c30]">Soporte a Familias</span>
                      <span className="text-[11px] text-[#444653]">familias@vallejuelos.edu.co</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-2.5 rounded-xl bg-[#eff4ff]">
                    <span className="material-symbols-outlined text-[#00288e] text-xl">access_time</span>
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-[#0b1c30]">Horario Presencial</span>
                      <span className="text-[11px] text-[#444653]">Lunes a Viernes 7:00 AM - 3:00 PM</span>
                    </div>
                  </div>
                </div>

                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => alert('Abriendo Centro de Ayuda Edulink School.')}
                    className="w-full py-2.5 rounded-xl bg-[#eff4ff] hover:bg-[#e5eeff] text-[#00288e] text-xs font-bold flex items-center justify-center gap-2 transition-colors border border-[#dce9ff] cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-lg">help_outline</span>
                    <span>Centro de Ayuda Edulink</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
          </>
          )}
        </main>
      </div>
    </div>
  );
};
