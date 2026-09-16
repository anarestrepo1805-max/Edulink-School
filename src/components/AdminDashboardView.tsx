import React, { useState } from 'react';
import { UserProfile, ActiveScreen } from '../types';

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
  currentUser,
  onNavigate
}) => {
  const [selectedTab, setSelectedTab] = useState<'overview' | 'groups' | 'certificates' | 'circulars'>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterGrade, setFilterGrade] = useState('Todos');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // 6 Grades, each with 2 groups as requested: 6°1, 6°2, 7°1, 7°2, 8°1, 8°2, 9°1, 9°2, 10°1, 10°2, 11°1, 11°2
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

  const [students, setStudents] = useState<StudentRegistrationItem[]>([
    { id: '1', name: 'Miguel Ángel Jiménez', documentId: '1092837465', grade: '11°2', shift: '6:15 AM - 12:15 PM', status: 'Activo', guardianName: 'Elena Gómez Jiménez' },
    { id: '2', name: 'Sofía Restrepo Jiménez', documentId: '1038472910', grade: '6°1', shift: '6:15 AM - 12:15 PM', status: 'Activo', guardianName: 'Elena Gómez Jiménez' },
    { id: '3', name: 'Mateo Cárdenas Ospina', documentId: '1019283746', grade: '10°1', shift: '6:15 AM - 12:15 PM', status: 'Activo', guardianName: 'Rodrigo Cárdenas' },
    { id: '4', name: 'Valentina Muñoz Londoño', documentId: '1094820194', grade: '8°2', shift: '6:15 AM - 12:15 PM', status: 'Paz y Salvo', guardianName: 'Lorena Londoño' },
    { id: '5', name: 'Santiago Echeverri Ruiz', documentId: '1039482019', grade: '7°1', shift: '6:15 AM - 12:15 PM', status: 'Activo', guardianName: 'Marcela Ruiz' },
    { id: '6', name: 'Camila Zapata Vargas', documentId: '1029481023', grade: '9°2', shift: '6:15 AM - 12:15 PM', status: 'Activo', guardianName: 'Guillermo Zapata' }
  ]);

  const [circulars, setCirculars] = useState([
    {
      id: 'c1',
      title: 'Circular Oficial No. 08: Cronograma de Evaluaciones del Primer Período',
      target: 'Toda la Comunidad Educativa',
      date: '14 de Septiembre, 2026',
      author: 'Coordinación Académica'
    },
    {
      id: 'c2',
      title: 'Disposición Institucional: Cumplimiento de la Jornada Escolar (6:15 AM - 12:15 PM)',
      target: 'Estudiantes y Acudientes',
      date: '10 de Septiembre, 2026',
      author: 'Rectoría General'
    },
    {
      id: 'c3',
      title: 'Convocatoria a Elección de Representantes al Consejo Directivo',
      target: 'Docentes y Padres de Familia',
      date: '05 de Septiembre, 2026',
      author: 'Consejo Electoral Escolar'
    }
  ]);

  const filteredStudents = students.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) || s.documentId.includes(searchQuery);
    const matchesGrade = filterGrade === 'Todos' || s.grade === filterGrade;
    return matchesSearch && matchesGrade;
  });

  return (
    <div className="min-h-screen bg-[#f8f9ff] text-[#0b1c30] pb-16">
      {/* Toast alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#00288e] text-white px-5 py-3.5 rounded-2xl shadow-xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4">
          <span className="material-symbols-outlined text-[20px] text-emerald-300">check_circle</span>
          <span className="text-sm font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Hero Header for Administrative Staff */}
      <div className="bg-gradient-to-r from-[#00288e] via-[#0038aa] to-[#0051d5] text-white py-10 px-4 sm:px-8 border-b border-[#1e40af] shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white shrink-0 shadow-inner">
              <span className="material-symbols-outlined text-[34px]">admin_panel_settings</span>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-white text-xs font-bold uppercase tracking-wider">
                  Panel de Coordinación y Rectoría
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-400/20 text-emerald-200 text-xs font-bold flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse" />
                  Jornada Mañana: 6:15 AM - 12:15 PM
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                {currentUser.fullName}
              </h1>
              <p className="text-sm text-white/80 mt-1">
                {currentUser.adminPosition || 'Coordinación General & Académica'} • {currentUser.institution || 'Institución Educativa Vallejuelos'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="bg-white/10 backdrop-blur-sm border border-white/15 px-4 py-2.5 rounded-xl text-right">
              <span className="block text-xs text-white/70">Matrícula Total Activa</span>
              <span className="text-xl font-extrabold text-white">378 Estudiantes</span>
            </div>
            <div className="bg-white/10 backdrop-blur-sm border border-white/15 px-4 py-2.5 rounded-xl text-right">
              <span className="block text-xs text-white/70">Grados Oficiales</span>
              <span className="text-xl font-extrabold text-white">12 Grupos (6° a 11°)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 mt-8">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-[#e5eeff] pb-3 mb-8 overflow-x-auto">
          <button
            onClick={() => setSelectedTab('overview')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
              selectedTab === 'overview'
                ? 'bg-[#00288e] text-white shadow-sm'
                : 'text-[#444653] hover:text-[#00288e] hover:bg-[#eff4ff]'
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">dashboard</span>
            <span>Resumen Institucional</span>
          </button>

          <button
            onClick={() => setSelectedTab('groups')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
              selectedTab === 'groups'
                ? 'bg-[#00288e] text-white shadow-sm'
                : 'text-[#444653] hover:text-[#00288e] hover:bg-[#eff4ff]'
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">view_module</span>
            <span>Estructura de Grados (6° a 11°)</span>
          </button>

          <button
            onClick={() => setSelectedTab('certificates')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
              selectedTab === 'certificates'
                ? 'bg-[#00288e] text-white shadow-sm'
                : 'text-[#444653] hover:text-[#00288e] hover:bg-[#eff4ff]'
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">badge</span>
            <span>Estudiantes y Certificados</span>
          </button>

          <button
            onClick={() => setSelectedTab('circulars')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
              selectedTab === 'circulars'
                ? 'bg-[#00288e] text-white shadow-sm'
                : 'text-[#444653] hover:text-[#00288e] hover:bg-[#eff4ff]'
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">campaign</span>
            <span>Circulares y Comunicados</span>
          </button>
        </div>

        {/* TAB 1: OVERVIEW */}
        {selectedTab === 'overview' && (
          <div className="flex flex-col gap-8 animate-in fade-in">
            {/* Quick Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              <div className="bg-white p-5 rounded-2xl border border-[#e5eeff] shadow-xs flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-[#757684] uppercase tracking-wider block mb-1">
                    Jornada Escolar Oficial
                  </span>
                  <span className="text-lg font-bold text-[#00288e]">
                    6:15 AM - 12:15 PM
                  </span>
                  <span className="text-xs text-emerald-600 block mt-1 font-semibold">
                    Activa de lunes a viernes
                  </span>
                </div>
                <div className="w-12 h-12 rounded-xl bg-[#eff4ff] text-[#00288e] flex items-center justify-center">
                  <span className="material-symbols-outlined text-[24px]">schedule</span>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-[#e5eeff] shadow-xs flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-[#757684] uppercase tracking-wider block mb-1">
                    Cuerpo Docente
                  </span>
                  <span className="text-2xl font-extrabold text-[#0b1c30]">
                    24 Docentes
                  </span>
                  <span className="text-xs text-[#0051d5] block mt-1 font-semibold">
                    100% asignados a planillas
                  </span>
                </div>
                <div className="w-12 h-12 rounded-xl bg-[#eff4ff] text-[#0051d5] flex items-center justify-center">
                  <span className="material-symbols-outlined text-[24px]">co_present</span>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-[#e5eeff] shadow-xs flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-[#757684] uppercase tracking-wider block mb-1">
                    Grados y Grupos
                  </span>
                  <span className="text-2xl font-extrabold text-[#0b1c30]">
                    12 Grupos
                  </span>
                  <span className="text-xs text-[#757684] block mt-1 font-semibold">
                    6 grados divididos en 2 grupos
                  </span>
                </div>
                <div className="w-12 h-12 rounded-xl bg-[#eff4ff] text-[#00288e] flex items-center justify-center">
                  <span className="material-symbols-outlined text-[24px]">groups</span>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-[#e5eeff] shadow-xs flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-[#757684] uppercase tracking-wider block mb-1">
                    Acudientes Vinculados
                  </span>
                  <span className="text-2xl font-extrabold text-[#0b1c30]">
                    312 Familias
                  </span>
                  <span className="text-xs text-emerald-600 block mt-1 font-semibold">
                    Canal directo de mensajería
                  </span>
                </div>
                <div className="w-12 h-12 rounded-xl bg-[#eff4ff] text-[#0051d5] flex items-center justify-center">
                  <span className="material-symbols-outlined text-[24px]">family_restroom</span>
                </div>
              </div>
            </div>

            {/* Structure Summary & Quick Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-[#e5eeff] shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-[#0b1c30]">
                    Distribución de Grupos por Grado Escolar
                  </h3>
                  <span className="text-xs text-[#757684]">
                    Año Académico 2026
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {schoolGroups.map((g) => (
                    <div key={g.grade} className="p-3.5 bg-[#f8f9ff] border border-[#e5eeff] rounded-xl hover:border-[#00288e] transition-colors">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-base font-extrabold text-[#00288e]">{g.grade}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                          {g.studentsCount} est.
                        </span>
                      </div>
                      <p className="text-xs text-[#444653] truncate">{g.director}</p>
                      <p className="text-[11px] text-[#757684] mt-1">{g.room} • {g.shift}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 border border-[#e5eeff] shadow-xs flex flex-col justify-between">
                <div>
                  <h3 className="text-lg font-bold text-[#0b1c30] mb-2">
                    Acciones de Secretaría y Rectoría
                  </h3>
                  <p className="text-xs text-[#444653] leading-relaxed mb-4">
                    Herramientas de gestión administrativa, expedición de certificados oficiales y comunicaciones directas.
                  </p>

                  <div className="flex flex-col gap-2.5">
                    <button
                      onClick={() => setSelectedTab('certificates')}
                      className="w-full text-left p-3 rounded-xl bg-[#f8f9ff] hover:bg-[#eff4ff] border border-[#e5eeff] hover:border-[#00288e] transition-all flex items-center justify-between cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="material-symbols-outlined text-[20px] text-[#00288e]">description</span>
                        <span className="text-xs font-bold text-[#0b1c30]">Generar Certificado de Estudio</span>
                      </div>
                      <span className="material-symbols-outlined text-[18px] text-[#757684]">chevron_right</span>
                    </button>

                    <button
                      onClick={() => setSelectedTab('groups')}
                      className="w-full text-left p-3 rounded-xl bg-[#f8f9ff] hover:bg-[#eff4ff] border border-[#e5eeff] hover:border-[#00288e] transition-all flex items-center justify-between cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="material-symbols-outlined text-[20px] text-[#00288e]">co_present</span>
                        <span className="text-xs font-bold text-[#0b1c30]">Ver Directores de Grupo</span>
                      </div>
                      <span className="material-symbols-outlined text-[18px] text-[#757684]">chevron_right</span>
                    </button>

                    <button
                      onClick={() => setSelectedTab('circulars')}
                      className="w-full text-left p-3 rounded-xl bg-[#f8f9ff] hover:bg-[#eff4ff] border border-[#e5eeff] hover:border-[#00288e] transition-all flex items-center justify-between cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="material-symbols-outlined text-[20px] text-[#00288e]">send</span>
                        <span className="text-xs font-bold text-[#0b1c30]">Publicar Circular Institucional</span>
                      </div>
                      <span className="material-symbols-outlined text-[18px] text-[#757684]">chevron_right</span>
                    </button>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-[#e5eeff]">
                  <div className="flex items-center gap-2 text-xs text-[#757684]">
                    <span className="material-symbols-outlined text-[18px] text-[#00288e]">security</span>
                    <span>Acceso autenticado con perfil de Coordinación</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: GROUPS (6°1 to 11°2) */}
        {selectedTab === 'groups' && (
          <div className="bg-white rounded-2xl p-6 sm:p-8 border border-[#e5eeff] shadow-xs animate-in fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#e5eeff]">
              <div>
                <h2 className="text-xl font-bold text-[#0b1c30]">
                  Estructura Oficial de Grados y Grupos
                </h2>
                <p className="text-sm text-[#444653] mt-1">
                  Los 6 grados de secundaria divididos en 2 grupos cada uno (6°1 y 6°2 hasta 11°1 y 11°2) en la jornada escolar de 6:15 AM a 12:15 PM.
                </p>
              </div>
              <button
                onClick={() => showToast('Planilla de asignación de carga académica actualizada')}
                className="px-4 py-2.5 bg-[#00288e] hover:bg-[#001f70] text-white rounded-xl text-sm font-bold flex items-center gap-2 cursor-pointer shadow-xs"
              >
                <span className="material-symbols-outlined text-[18px]">add</span>
                <span>Asignar Carga Docente</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
              {schoolGroups.map((group) => (
                <div key={group.grade} className="p-5 rounded-xl border border-[#e5eeff] bg-[#f8f9ff] flex flex-col justify-between hover:shadow-sm transition-all">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-2xl font-extrabold text-[#00288e]">
                        Grado {group.grade}
                      </span>
                      <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
                        {group.studentsCount} Alumnos
                      </span>
                    </div>
                    <div className="space-y-1.5 text-xs text-[#444653] mt-3">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-[16px] text-[#00288e]">school</span>
                        <span className="font-semibold">Director:</span> {group.director}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-[16px] text-[#00288e]">meeting_room</span>
                        <span className="font-semibold">Espacio:</span> {group.room}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-[16px] text-[#00288e]">schedule</span>
                        <span className="font-semibold">Horario:</span> {group.shift}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-[#e5eeff] flex items-center justify-between">
                    <button
                      onClick={() => {
                        setFilterGrade(group.grade);
                        setSelectedTab('certificates');
                      }}
                      className="text-xs font-bold text-[#0051d5] hover:underline cursor-pointer flex items-center gap-1"
                    >
                      <span>Ver Estudiantes</span>
                      <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                    </button>
                    <span className="text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-medium">
                      Planilla al día
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: CERTIFICATES & STUDENTS */}
        {selectedTab === 'certificates' && (
          <div className="bg-white rounded-2xl p-6 sm:p-8 border border-[#e5eeff] shadow-xs animate-in fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#e5eeff]">
              <div>
                <h2 className="text-xl font-bold text-[#0b1c30]">
                  Directorio de Matrículas y Emisión de Certificados
                </h2>
                <p className="text-sm text-[#444653] mt-1">
                  Consulta de estudiantes matriculados por documento de identidad y expedición de constancias oficiales.
                </p>
              </div>

              {/* Filters */}
              <div className="flex flex-wrap items-center gap-3">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar por nombre o documento..."
                  className="px-4 py-2.5 text-sm bg-[#f8f9ff] border border-[#dce9ff] rounded-xl outline-none focus:border-[#00288e] w-64"
                />
                <select
                  value={filterGrade}
                  onChange={(e) => setFilterGrade(e.target.value)}
                  className="px-3 py-2.5 text-sm bg-[#f8f9ff] border border-[#dce9ff] rounded-xl outline-none focus:border-[#00288e]"
                >
                  <option value="Todos">Todos los grados</option>
                  <option value="6°1">Grado 6°1</option>
                  <option value="6°2">Grado 6°2</option>
                  <option value="7°1">Grado 7°1</option>
                  <option value="7°2">Grado 7°2</option>
                  <option value="8°1">Grado 8°1</option>
                  <option value="8°2">Grado 8°2</option>
                  <option value="9°1">Grado 9°1</option>
                  <option value="9°2">Grado 9°2</option>
                  <option value="10°1">Grado 10°1</option>
                  <option value="10°2">Grado 10°2</option>
                  <option value="11°1">Grado 11°1</option>
                  <option value="11°2">Grado 11°2</option>
                </select>
              </div>
            </div>

            <div className="mt-6 overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#e5eeff] text-xs font-bold text-[#757684] uppercase tracking-wider bg-[#f8f9ff]">
                    <th className="py-3 px-4">Estudiante</th>
                    <th className="py-3 px-4">Documento</th>
                    <th className="py-3 px-4">Grado y Grupo</th>
                    <th className="py-3 px-4">Jornada</th>
                    <th className="py-3 px-4">Acudiente</th>
                    <th className="py-3 px-4">Estado</th>
                    <th className="py-3 px-4 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e5eeff] text-sm">
                  {filteredStudents.map((st) => (
                    <tr key={st.id} className="hover:bg-[#f8f9ff] transition-colors">
                      <td className="py-3 px-4 font-bold text-[#0b1c30]">
                        {st.name}
                      </td>
                      <td className="py-3 px-4 font-mono text-xs text-[#444653]">
                        {st.documentId}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-bold text-[#00288e] px-2.5 py-1 rounded-lg bg-[#eff4ff]">
                          {st.grade}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-xs text-[#444653]">
                        {st.shift}
                      </td>
                      <td className="py-3 px-4 text-xs text-[#444653]">
                        {st.guardianName}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                          {st.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => showToast(`Certificado de estudio expedido para ${st.name} (Grado ${st.grade})`)}
                          className="px-3 py-1.5 rounded-lg bg-[#00288e] hover:bg-[#001f70] text-white text-xs font-bold flex items-center gap-1.5 mx-auto cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[16px]">print</span>
                          <span>Certificado</span>
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
          <div className="bg-white rounded-2xl p-6 sm:p-8 border border-[#e5eeff] shadow-xs animate-in fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#e5eeff]">
              <div>
                <h2 className="text-xl font-bold text-[#0b1c30]">
                  Circulares y Resoluciones Oficiales
                </h2>
                <p className="text-sm text-[#444653] mt-1">
                  Comunicaciones emitidas por Rectoría y Coordinación Académica para toda la comunidad de la I.E. Vallejuelos.
                </p>
              </div>
              <button
                onClick={() => showToast('Nueva circular institucional redactada y archivada')}
                className="px-4 py-2.5 bg-[#00288e] hover:bg-[#001f70] text-white rounded-xl text-sm font-bold flex items-center gap-2 cursor-pointer shadow-xs"
              >
                <span className="material-symbols-outlined text-[18px]">add_circle</span>
                <span>Redactar Circular</span>
              </button>
            </div>

            <div className="flex flex-col gap-4 mt-6">
              {circulars.map((c) => (
                <div key={c.id} className="p-5 rounded-xl border border-[#e5eeff] bg-[#f8f9ff] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-[#00288e] text-white flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-[20px]">campaign</span>
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-[#0b1c30]">
                        {c.title}
                      </h4>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-[#757684] mt-1">
                        <span className="font-semibold text-[#00288e]">{c.author}</span>
                        <span>•</span>
                        <span>Destinatarios: {c.target}</span>
                        <span>•</span>
                        <span>Fecha: {c.date}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => showToast(`Descargando PDF oficial: ${c.title}`)}
                      className="px-3 py-1.5 rounded-lg border border-[#c4c5d5] hover:bg-white text-xs font-bold text-[#0b1c30] flex items-center gap-1 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[16px]">download</span>
                      <span>Descargar PDF</span>
                    </button>
                    <button
                      onClick={() => showToast('Notificación enviada a correos y portal')}
                      className="px-3 py-1.5 rounded-lg bg-[#eff4ff] hover:bg-[#dce9ff] text-xs font-bold text-[#00288e] flex items-center gap-1 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[16px]">share</span>
                      <span>Reenviar</span>
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
