import React, { useState, useMemo } from 'react';
import { ActiveScreen, UserProfile } from '../types';
import { useThemeLanguage } from '../context/ThemeLanguageContext';
import { CENSUS_STUDENTS, getTeacherPersonalSchedule } from '../data/institutionalCensus';

interface TeacherAttendanceViewProps {
  currentUser?: UserProfile | null;
  onNavigate: (screen: ActiveScreen) => void;
  onLogout: () => void;
  onUpdateUser?: (updated: UserProfile) => void;
}

type AttendanceStatus = 'present' | 'late' | 'excused' | 'absent';

interface StudentAttendanceRecord {
  documentId: string;
  fullName: string;
  status: AttendanceStatus;
  note?: string;
}

export const TeacherAttendanceView: React.FC<TeacherAttendanceViewProps> = ({
  currentUser,
  onNavigate,
  onLogout
}) => {
  const { theme, language } = useThemeLanguage();
  const isDark = theme === 'dark';
  const isEn = language === 'en';

  const teacherName = currentUser?.fullName || 'Prof. Daniela Álvarez';
  const teacherArea = currentUser?.subjectArea || 'Docente de Asignatura';

  const [selectedGroup, setSelectedGroup] = useState('11-1');
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [classHour, setClassHour] = useState('1a Hora (6:15 - 7:10 AM)');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);

  // Group students from real census
  const groupStudents = useMemo(() => {
    const matched = CENSUS_STUDENTS.filter(s => s.group === selectedGroup);
    if (matched.length > 0) return matched;
    // Fallback if none in group
    return CENSUS_STUDENTS.slice(0, 15);
  }, [selectedGroup]);

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
    // Save to localStorage for persistence across reloads
    const recordKey = `attendance_${selectedGroup}_${selectedDate}`;
    try {
      localStorage.setItem(recordKey, JSON.stringify(attendanceMap));
    } catch (e) {
      console.warn('Storage quota error', e);
    }
    setIsSaved(true);
    showToast(isEn ? `Attendance for ${selectedGroup} saved successfully!` : `¡Asistencia de ${selectedGroup} guardada exitosamente!`);
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

    return { total: groupStudents.length, present, late, excused, absent };
  }, [groupStudents, attendanceMap]);

  const personalSchedule = useMemo(() => {
    return getTeacherPersonalSchedule(currentUser?.fullName || currentUser?.documentId || '');
  }, [currentUser]);

  return (
    <div className={`min-h-screen ${isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-800'}`}>
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl bg-cyan-600 text-white font-medium shadow-2xl flex items-center gap-3">
          <span className="material-symbols-outlined text-xl">info</span>
          <span className="text-sm">{toastMessage}</span>
        </div>
      )}

      {/* Main Grid */}
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

            {/* Sidebar Links */}
            <div className="space-y-1">
              <button
                onClick={() => onNavigate('teacher_grades')}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-left text-xs font-semibold transition-colors cursor-pointer ${
                  isDark ? 'text-slate-400 hover:bg-slate-800 hover:text-white' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <span className="material-symbols-outlined text-lg">fact_check</span>
                <span>{isEn ? 'Gradebook' : 'Calificaciones y Planilla'}</span>
              </button>

              <button
                onClick={() => onNavigate('teacher_assignments')}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-left text-xs font-semibold transition-colors cursor-pointer ${
                  isDark ? 'text-slate-400 hover:bg-slate-800 hover:text-white' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <span className="material-symbols-outlined text-lg">assignment_turned_in</span>
                <span>{isEn ? 'Assignments & Workshops' : 'Tareas y Talleres'}</span>
              </button>

              <button
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-left text-xs font-semibold cursor-default ${
                  isDark ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30' : 'bg-cyan-50 text-cyan-700 border border-cyan-200'
                }`}
              >
                <span className="material-symbols-outlined text-lg">how_to_reg</span>
                <span>{isEn ? 'Class Attendance' : 'Control de Asistencia'}</span>
              </button>

              <button
                onClick={() => setShowScheduleModal(true)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-left text-xs font-semibold transition-colors cursor-pointer ${
                  isDark ? 'text-slate-400 hover:bg-slate-800 hover:text-white' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <span className="material-symbols-outlined text-lg">calendar_month</span>
                <span>{isEn ? 'Personal Schedule' : 'Horario Personal Institucional'}</span>
              </button>

              <button
                onClick={() => onNavigate('teacher_messaging')}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-left text-xs font-semibold transition-colors cursor-pointer ${
                  isDark ? 'text-slate-400 hover:bg-slate-800 hover:text-white' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <span className="material-symbols-outlined text-lg">chat</span>
                <span>{isEn ? 'Teacher Messaging' : 'Mensajería y Citaciones'}</span>
              </button>
            </div>
          </div>

          {/* Attendance Stats Widget */}
          <div className={`rounded-2xl p-4 border ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200'} space-y-3`}>
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              {isEn ? 'Class Summary' : 'Resumen de Clase'}
            </h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                <span className="block text-[10px] uppercase font-bold">{isEn ? 'Present' : 'Presentes'}</span>
                <span className="text-lg font-black">{metrics.present}</span>
              </div>
              <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
                <span className="block text-[10px] uppercase font-bold">{isEn ? 'Late' : 'Tardanzas'}</span>
                <span className="text-lg font-black">{metrics.late}</span>
              </div>
              <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
                <span className="block text-[10px] uppercase font-bold">{isEn ? 'Excused' : 'Excusas'}</span>
                <span className="text-lg font-black">{metrics.excused}</span>
              </div>
              <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
                <span className="block text-[10px] uppercase font-bold">{isEn ? 'Absent' : 'Faltas'}</span>
                <span className="text-lg font-black">{metrics.absent}</span>
              </div>
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
                  {isEn ? 'Class Roll Call' : 'Control de Asistencia Diaria'}
                </span>
                <span className="text-xs text-slate-400">• I.E. Vallejuelos</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight">
                {isEn ? 'Class Roll Call & Absences' : 'Toma de Asistencia y Novedades'}
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                {isEn
                  ? 'Record daily student attendance, register late arrivals, and annotate verified medical or family excuses.'
                  : 'Registra la asistencia en tiempo real, marca tardanzas, excusas justificadas e inasistencias por estudiante.'}
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={markAllPresent}
                className="px-4 py-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 font-bold text-xs uppercase tracking-wider cursor-pointer transition-colors flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-base">done_all</span>
                <span>{isEn ? 'Mark All Present' : 'Todos Presentes'}</span>
              </button>

              <button
                onClick={handleSaveAttendance}
                className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-cyan-600/20 cursor-pointer transition-transform active:scale-95 flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-base">save</span>
                <span>{isEn ? 'Save Roll Call' : 'Guardar Planilla'}</span>
              </button>
            </div>
          </div>

          {/* Group and Date Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1">
                {isEn ? 'Class Group' : 'Grupo Académico'}
              </label>
              <select
                value={selectedGroup}
                onChange={(e) => setSelectedGroup(e.target.value)}
                className={`w-full px-3 py-2.5 rounded-xl text-xs font-semibold border ${
                  isDark ? 'bg-slate-900 border-slate-800 text-slate-200' : 'bg-white border-slate-300 text-slate-800'
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

            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1">
                {isEn ? 'Class Date' : 'Fecha de la Clase'}
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className={`w-full px-3 py-2.5 rounded-xl text-xs font-semibold border ${
                  isDark ? 'bg-slate-900 border-slate-800 text-slate-200' : 'bg-white border-slate-300 text-slate-800'
                }`}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1">
                {isEn ? 'Period / Hour' : 'Hora de Clase'}
              </label>
              <select
                value={classHour}
                onChange={(e) => setClassHour(e.target.value)}
                className={`w-full px-3 py-2.5 rounded-xl text-xs font-semibold border ${
                  isDark ? 'bg-slate-900 border-slate-800 text-slate-200' : 'bg-white border-slate-300 text-slate-800'
                }`}
              >
                <option value="1a">1a Hora (6:15 - 7:10 AM)</option>
                <option value="2a">2a Hora (7:10 - 8:05 AM)</option>
                <option value="3a">3a Hora (8:35 - 9:30 AM)</option>
                <option value="4a">4a Hora (9:30 - 10:25 AM)</option>
                <option value="5a">5a Hora (10:25 - 11:20 AM)</option>
                <option value="6a">6a Hora (11:20 - 12:15 PM)</option>
              </select>
            </div>
          </div>

          {/* Students Roll Call Table */}
          <div className={`rounded-2xl border overflow-hidden ${isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'}`}>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className={`border-b ${isDark ? 'bg-slate-800/40 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
                    <th className="py-3 px-4 font-bold">#</th>
                    <th className="py-3 px-4 font-bold">{isEn ? 'Student Name' : 'Nombre del Estudiante'}</th>
                    <th className="py-3 px-4 font-bold">{isEn ? 'Document ID' : 'Documento'}</th>
                    <th className="py-3 px-4 font-bold text-center">{isEn ? 'Status' : 'Estado'}</th>
                    <th className="py-3 px-4 font-bold">{isEn ? 'Teacher Notes' : 'Observaciones'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40">
                  {groupStudents.map((student, idx) => {
                    const currentRecord = attendanceMap[student.documentId] || { status: 'present', note: '' };
                    return (
                      <tr key={student.documentId} className={`hover:bg-cyan-500/5 transition-colors ${
                        currentRecord.status === 'absent' ? 'bg-rose-500/5' : ''
                      }`}>
                        <td className="py-3 px-4 font-mono text-slate-400">{idx + 1}</td>
                        <td className="py-3 px-4">
                          <span className="font-bold block">{student.fullName}</span>
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
                            placeholder={isEn ? 'Optional note...' : 'Novedad opcional...'}
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
