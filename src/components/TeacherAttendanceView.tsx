import React, { useState, useMemo } from 'react';
import { ActiveScreen, UserProfile } from '../types';
import { useThemeLanguage } from '../context/ThemeLanguageContext';
import { CENSUS_STUDENTS, getTeacherAssignedGroups, normalizeGroupKey } from '../data/institutionalCensus';
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
  onLogout: _onLogout
}) => {
  const { theme, language } = useThemeLanguage();
  const isDark = theme === 'dark';
  const isEn = language === 'en';

  const teacherName = currentUser?.fullName || 'Prof. Carlos Ramírez';
  const teacherArea = currentUser?.subjectArea || 'Filosofía de Vida';

  // Get assigned groups for this teacher
  const assignedGroups = useMemo(() => {
    return getTeacherAssignedGroups(currentUser?.fullName || currentUser?.documentId);
  }, [currentUser]);

  const [selectedGroupDisplay, setSelectedGroupDisplay] = useState(() => assignedGroups[0] || '8°1');
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [classHour, setClassHour] = useState('1a Hora (6:15 - 7:10 AM)');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);

  // Group students from real census
  const groupStudents = useMemo(() => {
    const key = normalizeGroupKey(selectedGroupDisplay);
    const matched = CENSUS_STUDENTS.filter(s => normalizeGroupKey(s.group) === key);
    if (matched.length > 0) return matched;
    return CENSUS_STUDENTS.slice(0, 15);
  }, [selectedGroupDisplay]);

  // Attendance state dictionary per student documentId
  const [attendanceMap, setAttendanceMap] = useState<Record<string, { status: AttendanceStatus; note: string }>>({});

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
    setIsSaved(false);
  };

  const setStudentNote = (docId: string, note: string) => {
    setAttendanceMap(prev => ({
      ...prev,
      [docId]: {
        status: prev[docId]?.status || 'present',
        note
      }
    }));
    setIsSaved(false);
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
    setIsSaved(false);
    showToast(isEn ? 'All students marked as present.' : 'Todos los estudiantes marcados como presentes.');
  };

  const handleSaveAttendance = () => {
    const recordKey = `attendance_${selectedGroupDisplay}_${selectedDate}`;
    try {
      localStorage.setItem(recordKey, JSON.stringify(attendanceMap));
    } catch (e) {
      console.warn('Storage quota error', e);
    }
    setIsSaved(true);
    showToast(isEn ? `Attendance for ${selectedGroupDisplay} saved successfully!` : `¡Asistencia de ${selectedGroupDisplay} guardada exitosamente!`);
  };

  // Metrics
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

    return { present, late, excused, absent, total: groupStudents.length };
  }, [groupStudents, attendanceMap]);

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
        activeTab="attendance"
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
              <span className="material-symbols-outlined text-2xl">how_to_reg</span>
            </div>
            <div>
              <h2 className={`text-base font-extrabold ${isDark ? 'text-white' : 'text-[#0b1c30]'}`}>
                {isEn ? 'Daily Class Attendance' : 'Control de Asistencia y Novedades'}
              </h2>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-[#444653]'}`}>
                {teacherName} • {teacherArea} • Grupo {selectedGroupDisplay}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={markAllPresent}
              className="px-3.5 py-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 font-bold text-xs uppercase tracking-wider cursor-pointer transition-colors flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-base">done_all</span>
              <span className="hidden sm:inline">{isEn ? 'All Present' : 'Marcar Todos'}</span>
            </button>

            <button
              onClick={handleSaveAttendance}
              className={`px-4 py-2 rounded-xl font-bold text-xs uppercase tracking-wider cursor-pointer shadow-md flex items-center gap-1.5 transition-all active:scale-95 text-white ${
                isSaved ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-cyan-600 hover:bg-cyan-500 shadow-cyan-600/20'
              }`}
            >
              <span className="material-symbols-outlined text-base">save</span>
              <span>{isSaved ? (isEn ? 'Saved' : 'Guardado') : (isEn ? 'Save' : 'Guardar')}</span>
            </button>
          </div>
        </header>

        {/* Workspace Body */}
        <main className="p-4 sm:p-6 lg:p-8 flex flex-col gap-6 max-w-[1440px] w-full mx-auto">
          {/* Metrics summary cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-between">
              <div>
                <span className="block text-[10px] uppercase font-bold">{isEn ? 'Present' : 'Presentes'}</span>
                <span className="text-xl font-black">{metrics.present}</span>
              </div>
              <span className="material-symbols-outlined text-2xl">check_circle</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-between">
              <div>
                <span className="block text-[10px] uppercase font-bold">{isEn ? 'Late' : 'Tardanzas'}</span>
                <span className="text-xl font-black">{metrics.late}</span>
              </div>
              <span className="material-symbols-outlined text-2xl">schedule</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-between">
              <div>
                <span className="block text-[10px] uppercase font-bold">{isEn ? 'Excused' : 'Excusas'}</span>
                <span className="text-xl font-black">{metrics.excused}</span>
              </div>
              <span className="material-symbols-outlined text-2xl">verified</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-between">
              <div>
                <span className="block text-[10px] uppercase font-bold">{isEn ? 'Absent' : 'Faltas'}</span>
                <span className="text-xl font-black">{metrics.absent}</span>
              </div>
              <span className="material-symbols-outlined text-2xl">cancel</span>
            </div>
          </div>

          {/* Group and session selector */}
          <div className={`p-4 rounded-2xl border flex flex-wrap items-center justify-between gap-4 ${
            isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'
          }`}>
            <div className="flex flex-wrap items-center gap-3">
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                  {isEn ? 'Assigned Group' : 'Grupo Asignado'}
                </label>
                <select
                  value={selectedGroupDisplay}
                  onChange={(e) => setSelectedGroupDisplay(e.target.value)}
                  className={`h-10 px-3 rounded-xl text-xs font-bold border focus:outline-none ${
                    isDark ? 'bg-slate-950 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                >
                  {assignedGroups.map((g) => (
                    <option key={g} value={g}>
                      Grupo {g}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                  {isEn ? 'Session Date' : 'Fecha'}
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className={`h-10 px-3 rounded-xl text-xs font-bold border focus:outline-none ${
                    isDark ? 'bg-slate-950 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                  {isEn ? 'Class Hour' : 'Hora de Clase'}
                </label>
                <select
                  value={classHour}
                  onChange={(e) => setClassHour(e.target.value)}
                  className={`h-10 px-3 rounded-xl text-xs font-bold border focus:outline-none ${
                    isDark ? 'bg-slate-950 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                >
                  <option value="1a Hora (6:15 - 7:10 AM)">1a Hora (6:15 - 7:10 AM)</option>
                  <option value="2a Hora (7:10 - 8:05 AM)">2a Hora (7:10 - 8:05 AM)</option>
                  <option value="3a Hora (8:05 - 9:00 AM)">3a Hora (8:05 - 9:00 AM)</option>
                  <option value="4a Hora (9:30 - 10:25 AM)">4a Hora (9:30 - 10:25 AM)</option>
                  <option value="5a Hora (10:25 - 11:20 AM)">5a Hora (10:25 - 11:20 AM)</option>
                  <option value="6a Hora (11:20 - 12:15 PM)">6a Hora (11:20 - 12:15 PM)</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-3 text-xs text-slate-400 font-semibold">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                P = Presente
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                T = Tardanza
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                E = Excusa
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                F = Falta
              </span>
            </div>
          </div>

          {/* Attendance Table */}
          <div className={`rounded-3xl border overflow-hidden shadow-xs ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-[#e5eeff]'
          }`}>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className={`border-b font-extrabold uppercase tracking-wider text-[11px] ${
                    isDark ? 'border-slate-800 text-slate-400 bg-slate-950/40' : 'border-slate-200 text-[#444653] bg-slate-50'
                  }`}>
                    <th className="py-3 px-4 w-12 text-center">#</th>
                    <th className="py-3 px-4">{isEn ? 'Student Full Name' : 'Estudiante'}</th>
                    <th className="py-3 px-4">{isEn ? 'Document ID' : 'Documento'}</th>
                    <th className="py-3 px-4 text-center">{isEn ? 'Status' : 'Estado'}</th>
                    <th className="py-3 px-4">{isEn ? 'Pedagogical Observation / Note' : 'Observación / Justificación'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40">
                  {groupStudents.map((student, idx) => {
                    const currentRecord = attendanceMap[student.documentId] || { status: 'present', note: '' };
                    return (
                      <tr
                        key={student.documentId}
                        className={`transition-colors ${
                          isDark ? 'hover:bg-slate-800/40' : 'hover:bg-slate-50'
                        }`}
                      >
                        <td className="py-3 px-4 text-center font-bold opacity-60">{idx + 1}</td>
                        <td className="py-3 px-4">
                          <span className="font-bold block text-slate-100">{student.fullName}</span>
                          <span className="text-[10px] text-slate-400">{student.email}</span>
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-400">{student.documentId}</td>
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => setStudentStatus(student.documentId, 'present')}
                              title={isEn ? 'Present' : 'Presente'}
                              className={`w-8 h-8 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                                currentRecord.status === 'present'
                                  ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
                                  : 'bg-slate-800/60 text-slate-400 hover:text-emerald-400 hover:bg-slate-800'
                              }`}
                            >
                              P
                            </button>
                            <button
                              type="button"
                              onClick={() => setStudentStatus(student.documentId, 'late')}
                              title={isEn ? 'Late' : 'Llegada Tarde'}
                              className={`w-8 h-8 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                                currentRecord.status === 'late'
                                  ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20'
                                  : 'bg-slate-800/60 text-slate-400 hover:text-amber-400 hover:bg-slate-800'
                              }`}
                            >
                              T
                            </button>
                            <button
                              type="button"
                              onClick={() => setStudentStatus(student.documentId, 'excused')}
                              title={isEn ? 'Excused' : 'Excusa Justificada'}
                              className={`w-8 h-8 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                                currentRecord.status === 'excused'
                                  ? 'bg-blue-500 text-white shadow-md shadow-blue-500/20'
                                  : 'bg-slate-800/60 text-slate-400 hover:text-blue-400 hover:bg-slate-800'
                              }`}
                            >
                              E
                            </button>
                            <button
                              type="button"
                              onClick={() => setStudentStatus(student.documentId, 'absent')}
                              title={isEn ? 'Absent' : 'Inasistencia Injustificada'}
                              className={`w-8 h-8 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                                currentRecord.status === 'absent'
                                  ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20'
                                  : 'bg-slate-800/60 text-slate-400 hover:text-rose-400 hover:bg-slate-800'
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
                            placeholder={isEn ? 'Optional note...' : 'Novedad o motivo de inasistencia...'}
                            className={`w-full px-2.5 py-1.5 rounded-lg text-xs border ${
                              isDark ? 'bg-slate-950 border-slate-800 text-slate-300' : 'bg-white border-slate-300 text-slate-800'
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

      {/* Teacher Schedule Modal */}
      <TeacherScheduleModal
        isOpen={showScheduleModal}
        onClose={() => setShowScheduleModal(false)}
        currentUser={currentUser}
      />
    </div>
  );
};
