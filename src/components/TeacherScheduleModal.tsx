import React, { useMemo } from 'react';
import { UserProfile, ScheduleSlot } from '../types';
import { getTeacherPersonalSchedule, getOfficialScheduleForGrade } from '../data/institutionalCensus';
import { useThemeLanguage } from '../context/ThemeLanguageContext';

export interface TeacherScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser?: UserProfile | null;
}

export const TeacherScheduleModal: React.FC<TeacherScheduleModalProps> = ({
  isOpen,
  onClose,
  currentUser
}) => {
  const { theme, language } = useThemeLanguage();
  const isDark = theme === 'dark';
  const isEn = language === 'en';

  const isTeacher = currentUser?.role === 'teacher' || currentUser?.role === 'docente';
  const isStudent = currentUser?.role === 'student' || currentUser?.role === 'estudiante';
  const userName = currentUser?.fullName || (isTeacher ? (isEn ? 'Teacher' : 'Docente') : (isEn ? 'Student' : 'Estudiante'));

  const scheduleData = useMemo<ScheduleSlot[]>(() => {
    if (isTeacher) {
      return getTeacherPersonalSchedule(currentUser?.fullName || currentUser?.documentId || currentUser?.employeeId);
    }
    const grade = currentUser?.gradeLevel || currentUser?.group || '11-1';
    return getOfficialScheduleForGrade(grade);
  }, [currentUser, isTeacher]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/75 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div
        className={`relative w-full max-w-5xl max-h-[92vh] flex flex-col rounded-3xl shadow-2xl border overflow-hidden ${
          isDark
            ? 'bg-slate-900 border-slate-700 text-white shadow-cyan-950/40'
            : 'bg-white border-slate-200 text-slate-900 shadow-slate-300/60'
        }`}
      >
        {/* Header */}
        <div
          className={`p-5 sm:p-6 border-b flex items-center justify-between shrink-0 ${
            isDark ? 'border-slate-800 bg-slate-950/50' : 'border-[#eff4ff] bg-[#f8faff]'
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-11 h-11 rounded-2xl flex items-center justify-center ${
                isDark ? 'bg-cyan-950 text-cyan-400 border border-cyan-800/50' : 'bg-[#eff4ff] text-[#00288e]'
              }`}
            >
              <span className="material-symbols-outlined text-[24px]">calendar_month</span>
            </div>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg tracking-tight">
                {isTeacher
                  ? (isEn ? 'Personal Teacher Schedule' : 'Horario Personal Docente')
                  : (isEn ? 'Academic Schedule' : 'Horario Académico')}
              </h3>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-[#444653]'}`}>
                {userName} • I.E. Vallejuelos • {isTeacher ? (currentUser?.area || 'Docencia') : `Grado ${currentUser?.gradeLevel || currentUser?.group || '11-1'}`} • {isEn ? 'Morning Shift (6:15 AM - 12:15 PM)' : 'Jornada Mañana (6:15 AM - 12:15 PM)'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className={`p-2 rounded-xl transition-colors cursor-pointer ${
              isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-[#757684] hover:text-[#0b1c30] hover:bg-[#eff4ff]'
            }`}
            aria-label="Cerrar horario"
          >
            <span className="material-symbols-outlined text-[22px]">close</span>
          </button>
        </div>

        {/* Schedule Table Body */}
        <div className="p-4 sm:p-6 overflow-x-auto overflow-y-auto flex-1">
          <table className="w-full text-left text-xs border-collapse min-w-[700px]">
            <thead>
              <tr className={`border-b ${isDark ? 'border-slate-800 text-slate-400' : 'border-[#e5eeff] text-[#444653]'}`}>
                <th className="py-3 px-3 font-extrabold uppercase tracking-wider w-28">
                  {isEn ? 'Time' : 'Horario'}
                </th>
                <th className="py-3 px-3 font-extrabold uppercase tracking-wider">{isEn ? 'Monday' : 'Lunes'}</th>
                <th className="py-3 px-3 font-extrabold uppercase tracking-wider">{isEn ? 'Tuesday' : 'Martes'}</th>
                <th className="py-3 px-3 font-extrabold uppercase tracking-wider">{isEn ? 'Wednesday' : 'Miércoles'}</th>
                <th className="py-3 px-3 font-extrabold uppercase tracking-wider">{isEn ? 'Thursday' : 'Jueves'}</th>
                <th className="py-3 px-3 font-extrabold uppercase tracking-wider">{isEn ? 'Friday' : 'Viernes'}</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDark ? 'divide-slate-800' : 'divide-[#eff4ff]'}`}>
              {scheduleData.map((slot, idx) => {
                const isBreak = slot.period === 0;

                if (isBreak) {
                  return (
                    <tr
                      key={`break-${idx}`}
                      className={isDark ? 'bg-amber-950/20 text-amber-300' : 'bg-amber-50 text-amber-800'}
                    >
                      <td className="py-2.5 px-3 font-bold whitespace-nowrap">{slot.time}</td>
                      <td colSpan={5} className="py-2.5 px-3 text-center font-bold tracking-wide">
                        {isEn ? 'Break / Institutional Recess' : 'Descanso / Recreo Institucional'}
                      </td>
                    </tr>
                  );
                }

                return (
                  <tr
                    key={`slot-${slot.period}-${idx}`}
                    className={`transition-colors ${isDark ? 'hover:bg-slate-800/40' : 'hover:bg-[#f8faff]'}`}
                  >
                    <td className={`py-3 px-3 font-bold whitespace-nowrap ${isDark ? 'text-cyan-400' : 'text-[#00288e]'}`}>
                      {slot.time}
                    </td>
                    {(['monday', 'tuesday', 'wednesday', 'thursday', 'friday'] as const).map((day) => {
                      const cell = slot[day];
                      const hasClass = cell && cell.subject && !cell.subject.includes('Descanso');

                      return (
                        <td key={day} className="py-2.5 px-3 align-top">
                          {hasClass ? (
                            <div
                              className={`p-2 rounded-xl border ${
                                isDark
                                  ? 'bg-slate-800/80 border-slate-700/80 text-white'
                                  : 'bg-[#eff4ff] border-[#dce9ff] text-[#0b1c30]'
                              }`}
                            >
                              <div className="font-extrabold text-[11px] leading-tight text-cyan-500 dark:text-cyan-400">
                                {cell.subject}
                              </div>
                              {cell.teacher && (
                                <div className={`text-[10px] mt-1 ${isDark ? 'text-slate-400' : 'text-[#444653]'}`}>
                                  {cell.teacher}
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className={`p-1.5 rounded-lg border border-dashed text-[10px] leading-tight ${
                              isDark ? 'border-slate-800 text-slate-500 bg-slate-900/40' : 'border-slate-200 text-slate-400 bg-slate-50'
                            }`}>
                              <span className="font-medium">{isEn ? 'Free period / Prep time' : 'Espacio libre / Preparación'}</span>
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div
          className={`p-4 border-t flex items-center justify-between text-xs shrink-0 ${
            isDark ? 'border-slate-800 bg-slate-950/40 text-slate-400' : 'border-[#eff4ff] bg-[#f8faff] text-[#444653]'
          }`}
        >
          <span>{isEn ? 'Institution: I.E. Vallejuelos • Medellín' : 'Institución Educativa Vallejuelos • Medellín'}</span>
          <button
            type="button"
            onClick={onClose}
            className={`px-4 py-2 rounded-xl font-bold cursor-pointer transition-colors ${
              isDark ? 'bg-slate-800 hover:bg-slate-700 text-white' : 'bg-white hover:bg-slate-100 text-[#0b1c30] border border-slate-200'
            }`}
          >
            {isEn ? 'Close' : 'Cerrar'}
          </button>
        </div>
      </div>
    </div>
  );
};
