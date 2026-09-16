import React, { useState } from 'react';
import { ActiveScreen, UserRole, UserProfile } from '../types';

interface NavigationShellProps {
  currentScreen: ActiveScreen;
  onSelectScreen: (screen: ActiveScreen) => void;
  userRole: UserRole;
  onSelectRole: (role: UserRole) => void;
  currentUser: UserProfile | null;
  onLogout: () => void;
  children: React.ReactNode;
}

export const NavigationShell: React.FC<NavigationShellProps> = ({
  currentScreen,
  onSelectScreen,
  currentUser,
  onLogout,
  children
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showAuthWarning, setShowAuthWarning] = useState(false);

  const screens: { id: ActiveScreen; label: string; icon: string; category: string }[] = [
    { id: 'student_dashboard', label: 'Estudiante • Dashboard', icon: 'dashboard', category: 'Estudiante' },
    { id: 'student_assignment', label: 'Estudiante • Taller 1 Entrega', icon: 'assignment', category: 'Estudiante' },
    { id: 'teacher_grades', label: 'Docente • Planilla Calificaciones', icon: 'fact_check', category: 'Docente' },
    { id: 'family_dashboard', label: 'Familiar • Dashboard', icon: 'family_restroom', category: 'Familia' },
    { id: 'family_messaging', label: 'Familiar • Mensajería Escolar', icon: 'chat', category: 'Familia' }
  ];

  const handleScreenClick = (screenId: ActiveScreen) => {
    // If not authenticated and attempting to view internal screen, enforce restriction
    if (!currentUser && screenId !== 'login') {
      setShowAuthWarning(true);
      setTimeout(() => setShowAuthWarning(false), 4000);
      onSelectScreen('login');
      return;
    }
    onSelectScreen(screenId);
    setIsExpanded(false);
  };

  return (
    <div className="min-h-screen bg-[#f8f9ff] flex flex-col selection:bg-[#dde1ff]">
      {/* Top Floating Navigator */}
      <header className="sticky top-0 z-50 bg-[#00288e]/95 backdrop-blur-md text-white border-b border-[#1e40af] shadow-md px-3 py-2 transition-all">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 flex-wrap">
          {/* Logo brand & indicator */}
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#10b981] animate-pulse"></span>
            <span className="font-bold text-sm tracking-tight text-white flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[18px] text-[#7bd0ff]">school</span>
              Edulink School
            </span>
            <span className="hidden sm:inline-block text-[11px] px-2 py-0.5 rounded-full bg-white/10 text-[#c4e7ff] font-medium">
              Firestore DB
            </span>
          </div>

          {/* Quick Screen Switcher Pills */}
          <div className="hidden lg:flex items-center gap-1 overflow-x-auto py-0.5">
            {screens.map((screen) => {
              const isActive = currentScreen === screen.id;
              const isLocked = !currentUser && screen.id !== 'login';
              return (
                <button
                  key={screen.id}
                  onClick={() => handleScreenClick(screen.id)}
                  title={isLocked ? 'Debes iniciar sesión o registrarte primero' : screen.label}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                    isActive
                      ? 'bg-white text-[#00288e] shadow-sm scale-105'
                      : isLocked
                      ? 'text-white/50 hover:text-white/80 hover:bg-white/10'
                      : 'text-white/80 hover:text-white hover:bg-white/15'
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">
                    {isLocked ? 'lock' : screen.icon}
                  </span>
                  <span>{screen.label}</span>
                </button>
              );
            })}
          </div>

          {/* User Session Info & Logout */}
          <div className="flex items-center gap-2">
            {currentUser ? (
              <div className="flex items-center gap-2">
                <div className="hidden sm:flex flex-col text-right leading-tight">
                  <span className="text-xs font-bold text-white max-w-[140px] truncate">
                    {currentUser.fullName}
                  </span>
                  <span className="text-[10px] text-[#7bd0ff] font-semibold uppercase">
                    {currentUser.role === 'student' ? 'Estudiante' : currentUser.role === 'teacher' ? 'Docente' : 'Acudiente'}
                  </span>
                </div>
                <button
                  onClick={onLogout}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white/15 hover:bg-red-500/80 text-white text-xs font-bold transition-colors cursor-pointer"
                  title="Cerrar sesión"
                >
                  <span className="material-symbols-outlined text-[15px]">logout</span>
                  <span className="hidden md:inline">Cerrar Sesión</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-[#d3e4fe] hidden sm:inline">
                  Acceso protegido:
                </span>
                <button
                  onClick={() => onSelectScreen('login')}
                  className="px-3 py-1 rounded-lg bg-white text-[#00288e] text-xs font-bold shadow-xs hover:bg-[#eff4ff] transition-all cursor-pointer"
                >
                  Iniciar Sesión / Registro
                </button>
              </div>
            )}

            {/* Mobile menu button */}
            <div className="flex lg:hidden items-center gap-1">
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex items-center gap-1 p-1.5 rounded-lg bg-white/15 hover:bg-white/20 text-white text-xs font-semibold"
              >
                <span className="material-symbols-outlined text-[18px]">menu</span>
              </button>
            </div>
          </div>
        </div>

        {/* Warning notification banner when an unregistered user clicks locked view */}
        {showAuthWarning && (
          <div className="mt-2 p-2 rounded-lg bg-[#b91c1c] text-white text-xs font-bold flex items-center justify-between animate-in fade-in">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">warning</span>
              <span>Acceso denegado: El usuario no está registrado o no ha iniciado sesión.</span>
            </div>
            <button
              onClick={() => onSelectScreen('login')}
              className="px-2 py-0.5 rounded bg-white text-[#b91c1c] text-[11px] font-bold"
            >
              Ir a Iniciar Sesión / Registro
            </button>
          </div>
        )}

        {/* Mobile Dropdown Menu */}
        {isExpanded && (
          <div className="lg:hidden mt-2 pt-2 border-t border-white/15 grid grid-cols-2 sm:grid-cols-3 gap-1.5">
            {screens.map((screen) => {
              const isActive = currentScreen === screen.id;
              const isLocked = !currentUser && screen.id !== 'login';
              return (
                <button
                  key={screen.id}
                  onClick={() => handleScreenClick(screen.id)}
                  className={`flex items-center gap-1.5 p-2 rounded-lg text-xs font-semibold text-left transition-colors ${
                    isActive
                      ? 'bg-white text-[#00288e]'
                      : 'text-white/80 hover:bg-white/15'
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">
                    {isLocked ? 'lock' : screen.icon}
                  </span>
                  <span className="truncate">{screen.label}</span>
                </button>
              );
            })}
          </div>
        )}
      </header>

      {/* Primary App Views Container */}
      <main className="flex-1 w-full">
        {children}
      </main>
    </div>
  );
};
