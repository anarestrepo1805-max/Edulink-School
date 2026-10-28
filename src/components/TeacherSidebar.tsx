import React from 'react';
import { ActiveScreen, UserProfile } from '../types';
import { useThemeLanguage } from '../context/ThemeLanguageContext';
import { ASSETS } from '../data/mockData';

export type TeacherActiveTab =
  | 'grades'
  | 'attendance'
  | 'schedule'
  | 'assignments'
  | 'messaging'
  | 'forum';

interface TeacherSidebarProps {
  activeTab?: TeacherActiveTab;
  activeScreen?: ActiveScreen | string;
  onNavigate: (screen: ActiveScreen) => void;
  onOpenSchedule: () => void;
  currentUser?: UserProfile | null;
}

export const TeacherSidebar: React.FC<TeacherSidebarProps> = ({
  activeTab,
  activeScreen,
  onNavigate,
  onOpenSchedule,
  currentUser
}) => {
  const { theme, language } = useThemeLanguage();
  const isDark = theme === 'dark';
  const isEn = language === 'en';

  const resolvedTab: TeacherActiveTab = activeTab || (
    activeScreen === 'teacher_grades' ? 'grades' :
    activeScreen === 'teacher_attendance' ? 'attendance' :
    activeScreen === 'teacher_assignments' ? 'assignments' :
    activeScreen === 'teacher_messaging' ? 'messaging' :
    activeScreen === 'teacher_forum' ? 'forum' : 'grades'
  );

  const teacherName = currentUser?.fullName || (isEn ? 'Teacher' : 'Docente');
  const teacherArea = currentUser?.subjectArea || currentUser?.area || (isEn ? 'High School Faculty' : 'Docencia Secundaria');

  const navItems = [
    {
      id: 'grades' as const,
      label: isEn ? 'Gradebook' : 'Calificaciones',
      icon: 'fact_check',
      action: () => onNavigate('teacher_grades'),
      isActive: resolvedTab === 'grades'
    },
    {
      id: 'attendance' as const,
      label: isEn ? 'Class Attendance' : 'Control de asistencia',
      icon: 'how_to_reg',
      action: () => onNavigate('teacher_attendance'),
      isActive: resolvedTab === 'attendance'
    },
    {
      id: 'schedule' as const,
      label: isEn ? 'Personal Schedule' : 'Horario propio',
      icon: 'calendar_month',
      action: onOpenSchedule,
      isActive: resolvedTab === 'schedule'
    },
    {
      id: 'assignments' as const,
      label: isEn ? 'Tasks & Workshops' : 'Tareas y talleres',
      icon: 'assignment',
      action: () => onNavigate('teacher_assignments'),
      isActive: resolvedTab === 'assignments'
    },
    {
      id: 'messaging' as const,
      label: isEn ? 'Messaging & Citations' : 'Mensajería y citaciones',
      icon: 'chat',
      action: () => onNavigate('teacher_messaging'),
      isActive: resolvedTab === 'messaging'
    },
    {
      id: 'forum' as const,
      label: isEn ? 'Forums & Polls' : 'Foro y encuestas',
      icon: 'forum',
      action: () => onNavigate('teacher_forum'),
      isActive: resolvedTab === 'forum'
    }
  ];

  return (
    <aside
      className={`hidden lg:flex fixed left-0 top-12 bottom-0 w-72 shadow-xs z-40 flex-col justify-between border-r transition-colors ${
        isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-[#e5eeff]'
      }`}
    >
      <div className="flex flex-col">
        {/* Header Institution */}
        <div
          className={`h-20 px-6 flex items-center gap-3 border-b ${
            isDark ? 'border-slate-800' : 'border-[#eff4ff]'
          }`}
        >
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-xs ${
              isDark ? 'bg-cyan-600' : 'bg-[#00288e]'
            }`}
          >
            <span className="material-symbols-outlined text-[24px]">school</span>
          </div>
          <div className="flex flex-col">
            <span
              className={`text-xl font-extrabold leading-tight tracking-tight ${
                isDark ? 'text-white' : 'text-[#00288e]'
              }`}
            >
              Edulink
            </span>
            <span
              className={`text-[11px] font-bold uppercase tracking-wider ${
                isDark ? 'text-slate-400' : 'text-[#444653]'
              }`}
            >
              {isEn ? 'Teacher Portal' : 'Portal Docente'}
            </span>
          </div>
        </div>

        {/* Teacher Info Card */}
        <div className="p-4">
          <div
            className={`rounded-2xl p-3.5 border flex items-center gap-3 ${
              isDark
                ? 'bg-slate-800/80 border-slate-700 text-slate-100'
                : 'bg-[#eff4ff] border-[#dce9ff] text-[#0b1c30]'
            }`}
          >
            <div className="w-10 h-10 rounded-xl bg-cyan-600/20 text-cyan-400 flex items-center justify-center font-bold text-base shrink-0 overflow-hidden">
              {currentUser?.avatarUrl ? (
                <img src={currentUser.avatarUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                teacherName.charAt(0)
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="font-bold text-xs leading-tight truncate">{teacherName}</h4>
              <p
                className={`text-[11px] truncate mt-0.5 ${
                  isDark ? 'text-cyan-400' : 'text-[#0051d5]'
                }`}
              >
                {teacherArea}
              </p>
              <span className="inline-block mt-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20">
                {isEn ? 'Active Teacher' : 'Docente Titular'}
              </span>
            </div>
          </div>
        </div>

        {/* 5 Mandatory Teacher Navigation Options */}
        <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
          {navItems.map((item, idx) => {
            return (
              <button
                key={item.id}
                onClick={item.action}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left cursor-pointer ${
                  item.isActive
                    ? isDark
                      ? 'bg-cyan-600 text-white shadow-md font-bold'
                      : 'bg-[#1e40af] text-white shadow-md font-bold'
                    : isDark
                    ? 'text-slate-300 hover:bg-slate-800 hover:text-white font-medium'
                    : 'text-[#444653] hover:bg-[#eff4ff] hover:text-[#0b1c30] font-medium'
                }`}
              >
                <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                <span className="text-xs">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Synchronized status footer */}
      <div className={`p-4 border-t ${isDark ? 'border-slate-800' : 'border-[#eff4ff]'}`}>
        <div
          className={`rounded-xl p-3 flex items-center gap-3 border ${
            isDark ? 'bg-slate-800 border-slate-700' : 'bg-[#eff4ff] border-[#dce9ff]'
          }`}
        >
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
          <div className="flex flex-col">
            <span className={`text-xs font-bold ${isDark ? 'text-white' : 'text-[#0b1c30]'}`}>
              {isEn ? 'Synchronized' : 'Sincronizado'}
            </span>
            <span className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-[#444653]'}`}>
              {isEn ? 'Central Cloud OK' : 'Servidor Central OK'}
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
};
