import React, { useState, useMemo, useEffect } from 'react';
import { ActiveScreen, UserProfile } from '../types';
import { useThemeLanguage } from '../context/ThemeLanguageContext';
import {
  CENSUS_STUDENTS,
  getTeacherAcademicAssignments,
  TeacherAcademicAssignment
} from '../data/institutionalCensus';
import { TeacherSidebar } from './TeacherSidebar';
import { TeacherScheduleModal } from './TeacherScheduleModal';

interface TeacherAttendanceViewProps {
  currentUser?: UserProfile | null;
  onNavigate: (screen: ActiveScreen) => void;
  onLogout: () => void;
  onUpdateUser?: (updated: UserProfile) => void;
}

type AttendanceStatus = 'present' | 'late' | 'excused' | 'absent';

export const TeacherAttendanceView: React.FC<TeacherAttendanceViewProps> = ({
  currentUser,
  onNavigate,
  onLogout
}) => {
  const { theme, language } = useThemeLanguage();
  const isDark = theme === 'dark';
  const isEn = language === 'en';

  const teacherName = currentUser?.fullName || 'Patricia Quintero';

  // Obtenemos estrictamente las asignaturas y grupos asignados al docente
  const teacherAssignments = useMemo<TeacherAcademicAssignment[]>(() => {
    return getTeacherAcademicAssignments(
      currentUser?.fullName || currentUser?.documentId || currentUser?.email,
      currentUser?.subjectArea,
      currentUser?.assignedGrades
    );
  }, [currentUser?.fullName, currentUser?.documentId, currentUser?.email, currentUser?.subjectArea, currentUser?.assignedGrades]);

  const teacherArea = teacherAssignments[0]?.subjectName || currentUser?.subjectArea || 'Filosofía de vida';

  // Inicialización estricta al primer grupo asignado al docente
  const [selectedGroup, setSelectedGroup] = useState<string>(() => {
    return teacherAssignments[0]?.groupKey || '10-1';
  });

  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [classHour, setClassHour] = useState('2a Hora (7:10 - 8:05 AM)');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);

  // Asegurar que selectedGroup siempre pertenezca a los grupos asignados
  useEffect(() => {
    if (teacherAssignments.length > 0) {
      const exists = teacherAssignments.some(asg => asg.groupKey === selectedGroup);
      if (!exists) {
        setSelectedGroup(teacherAssignments[0].groupKey);
      }
    }
  }, [teacherAssignments, selectedGroup]);

  // Estudiantes del grupo asignado del censo institucional oficial
  const groupStudents = useMemo(() => {
    const matched = CENSUS_STUDENTS.filter(s => s.group === selectedGroup);
    if (matched.length > 0) return matched;
    return CENSUS_STUDENTS.filter(s => s.group === '10-1');
  }, [selectedGroup]);

  // Mapa de asistencia por estudiante
  const [attendanceMap, setAttendanceMap] = useState<Record<string, { status: AttendanceStatus; note: string }>>({});

  // Cargar asistencia guardada previamente en localStorage si existe
  useEffect(() => {
    const recordKey = `attendance_${selectedGroup}_${selectedDate}`;
    try {
      const saved = localStorage.getItem(recordKey);
      if (saved) {
        setAttendanceMap(JSON.parse(saved));
      } else {
        // Inicializar con todos presentes
        const initial: Record<string, { status: AttendanceStatus; note: string }> = {};
        groupStudents.forEach(s => {
          initial[s.documentId] = { status: 'present', note: '' };
        });
        setAttendanceMap(initial);
      }
    } catch {
      const initial: Record<string, { status: AttendanceStatus; note: string }> = {};
      groupStudents.forEach(s => {
        initial[s.documentId] = { status: 'present', note: '' };
      });
      setAttendanceMap(initial);
    }
  }, [selectedGroup, selectedDate, groupStudents]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const setStudentStatus = (docId: string, status: AttendanceStatus) => {
    setAttendanceMap(prev => ({
      ...prev,
      [docId]: {
        status,
        note: prev[docId]?.note || ''
      }
    }));
  };

  const setStudentNote = (docId: string, note: string) => {
    setAttendanceMap(prev => ({
      ...prev,
      [docId]: {
        status: prev[docId]?.status || 'present',
        note
      }
    }));
  };

  const markAllPresent = () => {
    const updated: Record<string, { status: AttendanceStatus; note: string }> = {};
    groupStudents.forEach(s => {
      updated[s.documentId] = {
        status: 'present',
        note: attendanceMap[s.documentId]?.note || ''
      };
    });
    setAttendanceMap(updated);
    showToast(isEn ? 'All students marked as present.' : 'Todos los estudiantes marcados como presentes.');
  };

  const handleSaveAttendance = () => {
    const recordKey = `attendance_${selectedGroup}_${selectedDate}`;
    try {
      localStorage.setItem(recordKey, JSON.stringify(attendanceMap));
    } catch (e) {
      console.warn('Storage quota error', e);
    }
    const groupName = teacherAssignments.find(a => a.groupKey === selectedGroup)?.group || selectedGroup;
    showToast(isEn ? `Attendance for ${groupName} saved successfully!` : `¡Asistencia de ${groupName} guardada exitosamente!`);
  };

  // Métricas de asistencia
  const metrics = useMemo(() => {
    let present = 0;
    let late = 0;
    let excused = 0;
    let absent = 0;

    groupStudents.forEach(s => {
      const st = attendanceMap[s.documentId]?.status || 'present';
      if (st === 'present') present++;
      else if (st === 'late') late++;
      else if (st === 'excused') excused++;
      else if (st === 'absent') absent++;
    });

    return { total: groupStudents.length, present, late, excused, absent };
  }, [groupStudents, attendanceMap]);

  const activeGroupAssignment = teacherAssignments.find(a => a.groupKey === selectedGroup) || teacherAssignments[0];

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

      {/* Menú lateral docente exclusivo con las 5 interfaces oficiales */}
      <TeacherSidebar
        activeTab="attendance"
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

      {/* MAIN CONTAINER: Con lg:pl-72 para resolver superposiciones y desbordes */}
      <div className="flex-1 lg:pl-72 flex flex-col min-w-0">
        {/* HEADER BAR FIJO: Idéntico a Calificaciones */}
        <header className={`sticky top-12 h-20 backdrop-blur-xl shadow-xs z-30 px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4 border-b transition-colors ${
          isDark ? 'bg-slate-900/95 border-slate-800' : 'bg-white/95 border-[#e5eeff]'
        }`}>
          <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
            <span className={`material-symbols-outlined text-2xl ${isDark ? 'text-cyan-400' : 'text-[#0051d5]'}`}>
              how_to_reg
            </span>
            <div className="min-w-0">
              <h1 className={`text-sm sm:text-base font-extrabold truncate ${isDark ? 'text-white' : 'text-[#0b1c30]'}`}>
                {isEn ? 'Daily Attendance Control' : 'Control de Asistencia Diaria'}
              </h1>
              <p className={`text-[11px] truncate ${isDark ? 'text-slate-400' : 'text-[#757684]'}`}>
                {teacherArea} • {activeGroupAssignment?.group || '10°1'} • I.E. Vallejuelos
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={markAllPresent}
              className={`h-11 px-3.5 sm:px-4 rounded-xl border text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors ${
                isDark
                  ? 'border-emerald-500/40 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400'
                  : 'border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800'
              }`}
              type="button"
            >
              <span className="material-symbols-outlined text-base">done_all</span>
              <span className="hidden sm:inline">{isEn ? 'All Present' : 'Todos Presentes'}</span>
            </button>

            <button
              onClick={handleSaveAttendance}
              className="h-11 px-4 sm:px-5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-cyan-600/20 cursor-pointer transition-transform active:scale-95 flex items-center gap-1.5"
              type="button"
            >
              <span className="material-symbols-outlined text-base">save</span>
              <span>{isEn ? 'Save' : 'Guardar'}</span>
            </button>
          </div>
        </header>

        {/* CONTENIDO PRINCIPAL */}
        <main className="p-4 sm:p-6 lg:p-8 space-y-6">
          {/* Tarjeta de Control y Filtros de Grupo (SOLO GRUPOS ASIGNADOS AL DOCENTE) */}
          <div className={`p-5 sm:p-6 rounded-2xl border shadow-xs ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-[#e5eeff]'
          }`}>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Selector de Grupo: ÚNICAMENTE los grupos asignados a este profesor */}
              <div>
                <label className={`block text-xs font-bold uppercase tracking-wider mb-1.5 ${
                  isDark ? 'text-slate-400' : 'text-[#444653]'
                }`}>
                  {isEn ? 'Assigned Group' : 'Grupo Asignado'} *
                </label>
                <div className={`relative flex items-center rounded-xl px-3 py-2 border ${
                  isDark ? 'bg-slate-800 border-slate-700' : 'bg-[#eff4ff] border-[#dce9ff]'
                }`}>
                  <span className={`material-symbols-outlined mr-2 text-xl ${isDark ? 'text-cyan-400' : 'text-[#0051d5]'}`}>
                    group
                  </span>
                  <select
                    value={selectedGroup}
                    onChange={(e) => setSelectedGroup(e.target.value)}
                    className={`bg-transparent text-xs font-extrabold focus:outline-none cursor-pointer pr-4 appearance-none w-full ${
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
                  <span className={`material-symbols-outlined text-base pointer-events-none absolute right-3 ${
                    isDark ? 'text-slate-500' : 'text-[#757684]'
                  }`}>
                    expand_more
                  </span>
                </div>
              </div>

              {/* Selector de Fecha */}
              <div>
                <label className={`block text-xs font-bold uppercase tracking-wider mb-1.5 ${
                  isDark ? 'text-slate-400' : 'text-[#444653]'
                }`}>
                  {isEn ? 'Date' : 'Fecha de la Clase'}
                </label>
                <div className={`relative flex items-center rounded-xl px-3 py-2 border ${
                  isDark ? 'bg-slate-800 border-slate-700' : 'bg-[#eff4ff] border-[#dce9ff]'
                }`}>
                  <span className={`material-symbols-outlined mr-2 text-xl ${isDark ? 'text-cyan-400' : 'text-[#0051d5]'}`}>
                    calendar_today
                  </span>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className={`bg-transparent text-xs font-bold focus:outline-none w-full ${
                      isDark ? 'text-white' : 'text-[#0b1c30]'
                    }`}
                  />
                </div>
              </div>

              {/* Selector de Hora de Clase Institucional */}
              <div>
                <label className={`block text-xs font-bold uppercase tracking-wider mb-1.5 ${
                  isDark ? 'text-slate-400' : 'text-[#444653]'
                }`}>
                  {isEn ? 'Class Hour' : 'Bloque Horario (Jornada Mañana)'}
                </label>
                <div className={`relative flex items-center rounded-xl px-3 py-2 border ${
                  isDark ? 'bg-slate-800 border-slate-700' : 'bg-[#eff4ff] border-[#dce9ff]'
                }`}>
                  <span className={`material-symbols-outlined mr-2 text-xl ${isDark ? 'text-cyan-400' : 'text-[#0051d5]'}`}>
                    schedule
                  </span>
                  <select
                    value={classHour}
                    onChange={(e) => setClassHour(e.target.value)}
                    className={`bg-transparent text-xs font-bold focus:outline-none cursor-pointer pr-4 appearance-none w-full ${
                      isDark ? 'text-white' : 'text-[#0b1c30]'
                    }`}
                  >
                    <option value="1a" className={isDark ? 'bg-slate-900 text-white' : 'bg-white'}>1a Hora (6:15 - 7:10 AM)</option>
                    <option value="2a" className={isDark ? 'bg-slate-900 text-white' : 'bg-white'}>2a Hora (7:10 - 8:05 AM)</option>
                    <option value="3a" className={isDark ? 'bg-slate-900 text-white' : 'bg-white'}>3a Hora (8:05 - 9:00 AM)</option>
                    <option value="4a" className={isDark ? 'bg-slate-900 text-white' : 'bg-white'}>4a Hora (9:30 - 10:25 AM)</option>
                    <option value="5a" className={isDark ? 'bg-slate-900 text-white' : 'bg-white'}>5a Hora (10:25 - 11:20 AM)</option>
                    <option value="6a" className={isDark ? 'bg-slate-900 text-white' : 'bg-white'}>6a Hora (11:20 - 12:15 PM)</option>
                  </select>
                  <span className={`material-symbols-outlined text-base pointer-events-none absolute right-3 ${
                    isDark ? 'text-slate-500' : 'text-[#757684]'
                  }`}>
                    expand_more
                  </span>
                </div>
              </div>
            </div>

            {/* Resumen de Asistencia de la Sesión */}
            <div className={`mt-5 pt-4 border-t grid grid-cols-2 sm:grid-cols-5 gap-3 ${
              isDark ? 'border-slate-800' : 'border-[#eff4ff]'
            }`}>
              <div className={`p-3 rounded-xl border flex flex-col justify-between ${
                isDark ? 'bg-slate-800/60 border-slate-700' : 'bg-[#eff4ff] border-[#dce9ff]'
              }`}>
                <span className="text-[10px] uppercase font-bold text-slate-400">Total Alumnos</span>
                <span className="text-xl font-black mt-1">{metrics.total}</span>
              </div>
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex flex-col justify-between">
                <span className="text-[10px] uppercase font-bold">Presentes (P)</span>
                <span className="text-xl font-black mt-1">{metrics.present}</span>
              </div>
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex flex-col justify-between">
                <span className="text-[10px] uppercase font-bold">Tardanzas (T)</span>
                <span className="text-xl font-black mt-1">{metrics.late}</span>
              </div>
              <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400 flex flex-col justify-between">
                <span className="text-[10px] uppercase font-bold">Excusas (E)</span>
                <span className="text-xl font-black mt-1">{metrics.excused}</span>
              </div>
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex flex-col justify-between">
                <span className="text-[10px] uppercase font-bold">Faltas (F)</span>
                <span className="text-xl font-black mt-1">{metrics.absent}</span>
              </div>
            </div>
          </div>

          {/* Tabla de Asistencia de Estudiantes */}
          <div className={`rounded-2xl border overflow-hidden shadow-xs ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-[#e5eeff]'
          }`}>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className={`border-b ${
                    isDark ? 'bg-slate-800/40 border-slate-800 text-slate-300' : 'bg-[#eff4ff] border-[#e5eeff] text-[#00288e]'
                  }`}>
                    <th className="py-3 px-4 font-extrabold w-12 text-center">#</th>
                    <th className="py-3 px-4 font-extrabold">{isEn ? 'Student Name' : 'Nombre Completo del Estudiante'}</th>
                    <th className="py-3 px-4 font-extrabold">{isEn ? 'Document ID' : 'Documento de Identidad'}</th>
                    <th className="py-3 px-4 font-extrabold text-center w-52">{isEn ? 'Attendance Status' : 'Estado de Asistencia'}</th>
                    <th className="py-3 px-4 font-extrabold">{isEn ? 'Teacher Observations' : 'Observación / Justificación'}</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isDark ? 'divide-slate-800/60' : 'divide-[#eff4ff]'}`}>
                  {groupStudents.map((student, idx) => {
                    const currentRecord = attendanceMap[student.documentId] || { status: 'present', note: '' };
                    return (
                      <tr
                        key={student.documentId}
                        className={`transition-colors ${
                          currentRecord.status === 'absent'
                            ? isDark ? 'bg-rose-950/20 hover:bg-rose-950/30' : 'bg-rose-50/50 hover:bg-rose-50'
                            : isDark ? 'hover:bg-slate-800/40' : 'hover:bg-[#f8faff]'
                        }`}
                      >
                        <td className="py-3 px-4 font-mono text-center text-slate-400">{idx + 1}</td>
                        <td className="py-3 px-4">
                          <span className={`font-extrabold block ${isDark ? 'text-white' : 'text-[#0b1c30]'}`}>
                            {student.fullName}
                          </span>
                          <span className="text-[11px] text-slate-400 font-medium">{student.email}</span>
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-400 font-semibold">{student.documentId}</td>
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => setStudentStatus(student.documentId, 'present')}
                              title={isEn ? 'Present' : 'Presente'}
                              className={`w-8 h-8 rounded-lg font-black text-xs transition-all cursor-pointer ${
                                currentRecord.status === 'present'
                                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30 scale-105'
                                  : isDark
                                  ? 'bg-slate-800 text-slate-400 hover:text-emerald-400 hover:bg-slate-700'
                                  : 'bg-slate-100 text-slate-500 hover:text-emerald-600 hover:bg-slate-200'
                              }`}
                            >
                              P
                            </button>
                            <button
                              type="button"
                              onClick={() => setStudentStatus(student.documentId, 'late')}
                              title={isEn ? 'Late' : 'Llegada Tarde'}
                              className={`w-8 h-8 rounded-lg font-black text-xs transition-all cursor-pointer ${
                                currentRecord.status === 'late'
                                  ? 'bg-amber-500 text-white shadow-md shadow-amber-500/30 scale-105'
                                  : isDark
                                  ? 'bg-slate-800 text-slate-400 hover:text-amber-400 hover:bg-slate-700'
                                  : 'bg-slate-100 text-slate-500 hover:text-amber-600 hover:bg-slate-200'
                              }`}
                            >
                              T
                            </button>
                            <button
                              type="button"
                              onClick={() => setStudentStatus(student.documentId, 'excused')}
                              title={isEn ? 'Excused' : 'Excusa Médica / Justificada'}
                              className={`w-8 h-8 rounded-lg font-black text-xs transition-all cursor-pointer ${
                                currentRecord.status === 'excused'
                                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 scale-105'
                                  : isDark
                                  ? 'bg-slate-800 text-slate-400 hover:text-blue-400 hover:bg-slate-700'
                                  : 'bg-slate-100 text-slate-500 hover:text-blue-600 hover:bg-slate-200'
                              }`}
                            >
                              E
                            </button>
                            <button
                              type="button"
                              onClick={() => setStudentStatus(student.documentId, 'absent')}
                              title={isEn ? 'Absent' : 'Inasistencia'}
                              className={`w-8 h-8 rounded-lg font-black text-xs transition-all cursor-pointer ${
                                currentRecord.status === 'absent'
                                  ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30 scale-105'
                                  : isDark
                                  ? 'bg-slate-800 text-slate-400 hover:text-rose-400 hover:bg-slate-700'
                                  : 'bg-slate-100 text-slate-500 hover:text-rose-600 hover:bg-slate-200'
                              }`}
                            >
                              F
                            </button>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <input
                            type="text"
                            value={currentRecord.note}
                            onChange={(e) => setStudentNote(student.documentId, e.target.value)}
                            placeholder={isEn ? 'Optional note or excuse details...' : 'Observación o radicado de excusa...'}
                            className={`w-full px-3 py-1.5 rounded-xl text-xs border focus:outline-none transition-all ${
                              isDark
                                ? 'bg-slate-950 border-slate-700 text-slate-200 focus:border-cyan-500'
                                : 'bg-[#eff4ff] border-[#dce9ff] text-[#0b1c30] focus:border-[#0051d5]'
                            }`}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};
