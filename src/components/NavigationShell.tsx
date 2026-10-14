import React, { useState, useEffect, useRef } from 'react';
import { ActiveScreen, UserRole, UserProfile } from '../types';
import { deleteUserAccount } from '../services/authService';
import { useThemeLanguage } from '../context/ThemeLanguageContext';
import { ASSETS } from '../data/mockData';

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

  // Top-right Profile Dropdown state
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Modals state
  const [showViewProfileModal, setShowViewProfileModal] = useState(false);
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);

  // Theme & Language context
  const { theme, toggleTheme, language, toggleLanguage } = useThemeLanguage();
  const isDarkMode = theme === 'dark';
  const currentLang = language;

  // Notification for theme or language toggle
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Account deletion form state
  const [deletePassword, setDeletePassword] = useState('');
  const [confirmWord, setConfirmWord] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggleTheme = () => {
    toggleTheme();
    setToastMessage(!isDarkMode ? (currentLang === 'es' ? 'Tema Oscuro activado' : 'Dark Mode activated') : (currentLang === 'es' ? 'Tema Claro activado' : 'Light Mode activated'));
    setShowProfileMenu(false);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleToggleLanguage = () => {
    toggleLanguage();
    setToastMessage(currentLang === 'es' ? 'Language changed to English' : 'Idioma cambiado a Español');
    setShowProfileMenu(false);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleDeleteAccountSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setDeleteError('');

    if (!deletePassword.trim()) {
      setDeleteError(currentLang === 'es'
        ? 'Debes ingresar tu contraseña actual para confirmar la eliminación.'
        : 'You must enter your current password to confirm deletion.');
      return;
    }

    if (confirmWord !== 'ACEPTO') {
      setDeleteError(currentLang === 'es'
        ? 'Debes ingresar exactamente la palabra "ACEPTO" en mayúsculas.'
        : 'You must enter exactly the word "ACEPTO" in uppercase.');
      return;
    }

    if (!currentUser) return;

    setIsDeleting(true);
    try {
      await deleteUserAccount(currentUser.id, deletePassword, confirmWord);
      setShowDeleteAccountModal(false);
      onLogout();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al eliminar la cuenta.';
      setDeleteError(msg);
    } finally {
      setIsDeleting(false);
    }
  };

  const screens: { id: ActiveScreen; label: string; icon: string; category: string }[] = [
    {
      id: 'student_dashboard',
      label: currentLang === 'es' ? 'Estudiante • Portal' : 'Student • Portal',
      icon: 'dashboard',
      category: currentLang === 'es' ? 'Estudiante' : 'Student'
    },
    {
      id: 'student_assignment',
      label: currentLang === 'es' ? 'Estudiante • Taller 1' : 'Student • Workshop 1',
      icon: 'assignment',
      category: currentLang === 'es' ? 'Estudiante' : 'Student'
    },
    {
      id: 'teacher_grades',
      label: currentLang === 'es' ? 'Docente • Calificaciones' : 'Teacher • Gradebook',
      icon: 'fact_check',
      category: currentLang === 'es' ? 'Docente' : 'Teacher'
    },
    {
      id: 'family_dashboard',
      label: currentLang === 'es' ? 'Familiar • Portal' : 'Family • Portal',
      icon: 'family_restroom',
      category: currentLang === 'es' ? 'Familia' : 'Family'
    },
    {
      id: 'family_messaging',
      label: currentLang === 'es' ? 'Familiar • Mensajería' : 'Family • Messaging',
      icon: 'chat',
      category: currentLang === 'es' ? 'Familia' : 'Family'
    },
    {
      id: 'admin_dashboard',
      label: currentLang === 'es' ? 'Administrativo • Panel' : 'Staff • Dashboard',
      icon: 'admin_panel_settings',
      category: currentLang === 'es' ? 'Administración' : 'Administration'
    }
  ];

  const visibleScreens = screens.filter((screen) => {
    if (!currentUser) return true;
    const role = currentUser.role;
    if (role === 'student') {
      return screen.id === 'student_dashboard' || screen.id === 'student_assignment';
    }
    if (role === 'teacher') {
      return screen.id === 'teacher_grades';
    }
    if (role === 'family' || role === 'guardian') {
      return screen.id === 'family_dashboard' || screen.id === 'family_messaging';
    }
    if (role === 'admin') {
      return screen.id === 'admin_dashboard';
    }
    return true;
  });

  const handleScreenClick = (screenId: ActiveScreen) => {
    if (!currentUser && screenId !== 'login') {
      setShowAuthWarning(true);
      setTimeout(() => setShowAuthWarning(false), 4000);
      onSelectScreen('login');
      return;
    }
    if (currentUser) {
      const role = currentUser.role;
      const isStudentScreen = screenId === 'student_dashboard' || screenId === 'student_assignment';
      const isTeacherScreen = screenId === 'teacher_grades';
      const isFamilyScreen = screenId === 'family_dashboard' || screenId === 'family_messaging';
      const isAdminScreen = screenId === 'admin_dashboard';

      if (
        (role === 'student' && !isStudentScreen) ||
        (role === 'teacher' && !isTeacherScreen) ||
        ((role === 'family' || role === 'guardian') && !isFamilyScreen) ||
        (role === 'admin' && !isAdminScreen)
      ) {
        setToastMessage(currentLang === 'es' ? 'Acceso restringido: Pantalla exclusiva de otro rol institucional.' : 'Restricted access: Screen exclusive to another institutional role.');
        setTimeout(() => setToastMessage(null), 3500);
        return;
      }
    }
    onSelectScreen(screenId);
    setIsExpanded(false);
  };

  const getRoleLabel = (role?: UserRole) => {
    switch (role) {
      case 'student':
        return currentLang === 'es' ? 'Estudiante' : 'Student';
      case 'teacher':
        return currentLang === 'es' ? 'Docente' : 'Teacher';
      case 'family':
        return currentLang === 'es' ? 'Acudiente' : 'Guardian';
      case 'admin':
        return currentLang === 'es' ? 'Administrativo' : 'Administrator';
      default:
        return currentLang === 'es' ? 'Usuario' : 'User';
    }
  };

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-200 ${
      isDarkMode ? 'bg-slate-950 text-slate-100 selection:bg-cyan-900' : 'bg-[#f8f9ff] text-[#0b1c30] selection:bg-[#dde1ff]'
    }`}>
      {/* Top Floating Navigator */}
      <header className={`sticky top-0 z-50 backdrop-blur-md text-white border-b shadow-md px-3 py-2 transition-all ${
        isDarkMode ? 'bg-slate-900/95 border-cyan-500/25 shadow-black/40' : 'bg-[#00288e]/95 border-[#1e40af]'
      }`}>
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
          {/* Logo brand & indicator */}
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-2.5 h-2.5 rounded-full bg-[#10b981] animate-pulse shrink-0"></span>
            <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
              <img
                src={ASSETS.logo}
                alt="Edulink School Logo"
                className="w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9 object-contain shrink-0 filter drop-shadow-[0_2px_8px_rgba(6,182,212,0.4)]"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = '/logo_transparent.png';
                }}
              />
              <span className="font-bold text-sm sm:text-base md:text-lg tracking-tight text-white truncate">
                Edulink School
              </span>
            </div>
            <span className="hidden md:inline-block text-[11px] px-2 py-0.5 rounded-full bg-white/10 text-[#c4e7ff] font-semibold shrink-0">
              I.E. Vallejuelos
            </span>
          </div>

          {/* Quick Screen Switcher Pills */}
          <div className="hidden lg:flex items-center gap-1 overflow-x-auto py-0.5 no-scrollbar">
            {visibleScreens.map((screen) => {
              const isActive = currentScreen === screen.id;
              const isLocked = !currentUser && screen.id !== 'login';
              return (
                <button
                  key={screen.id}
                  onClick={() => handleScreenClick(screen.id)}
                  title={isLocked ? 'Debes iniciar sesión primero' : screen.label}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap focus-visible:ring-2 focus-visible:ring-white ${
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

          {/* User Session & Profile Menu Button */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Quick compact theme & language capsule */}
            <div className="flex items-center bg-white/15 border border-white/20 rounded-full p-0.5 shadow-xs">
              <button
                type="button"
                onClick={handleToggleTheme}
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-white/90 hover:text-amber-300 hover:bg-white/20 transition-all cursor-pointer focus-visible:ring-1 focus-visible:ring-white"
                title={isDarkMode ? (currentLang === 'es' ? 'Cambiar a Modo Claro' : 'Switch to Light Mode') : (currentLang === 'es' ? 'Cambiar a Modo Oscuro' : 'Switch to Dark Mode')}
                aria-label="Toggle Theme"
              >
                <span className="material-symbols-outlined text-[17px]">
                  {isDarkMode ? 'light_mode' : 'dark_mode'}
                </span>
              </button>
              <span className="w-[1px] h-3.5 bg-white/25" />
              <button
                type="button"
                onClick={handleToggleLanguage}
                className="px-2 h-7 sm:h-8 rounded-full flex items-center justify-center text-white/90 hover:text-cyan-200 hover:bg-white/20 text-[11px] font-bold tracking-wider transition-all cursor-pointer focus-visible:ring-1 focus-visible:ring-white"
                title={currentLang === 'es' ? 'Switch to English' : 'Cambiar a Español'}
                aria-label="Toggle Language"
              >
                {currentLang === 'es' ? 'EN' : 'ES'}
              </button>
            </div>

            {currentUser ? (
              <div className="relative" ref={menuRef}>
                {/* Profile Toggle Button with User Name */}
                <button
                  id="user-profile-menu-button"
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 min-h-[40px] rounded-xl bg-white/15 hover:bg-white/25 text-white transition-all cursor-pointer border border-white/20 shadow-xs active:scale-95 focus-visible:ring-2 focus-visible:ring-white"
                  title={currentLang === 'es' ? 'Opciones de perfil y cuenta' : 'Profile & account options'}
                  aria-expanded={showProfileMenu}
                >
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/25 flex items-center justify-center text-white text-xs font-bold ring-2 ring-white/30 overflow-hidden shrink-0">
                    {currentUser.avatarUrl ? (
                      <img src={currentUser.avatarUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      currentUser.fullName.charAt(0).toUpperCase()
                    )}
                  </div>

                  <div className="text-left hidden sm:flex flex-col leading-tight">
                    <span className="text-xs font-bold text-white max-w-[130px] md:max-w-[160px] truncate">
                      {currentUser.fullName}
                    </span>
                    <span className="text-[10px] text-[#7bd0ff] font-semibold">
                      {getRoleLabel(currentUser.role)}
                    </span>
                  </div>

                  <span className={`material-symbols-outlined text-[18px] text-white/80 transition-transform duration-200 ${showProfileMenu ? 'rotate-180' : ''}`}>
                    expand_more
                  </span>
                </button>

                {/* Profile Options Dropdown Menu */}
                {showProfileMenu && (
                  <div
                    id="user-profile-dropdown"
                    className={`absolute right-0 mt-2 w-[min(calc(100vw-24px),18rem)] rounded-2xl shadow-2xl border py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150 ${
                      isDarkMode ? 'bg-slate-900 border-slate-700 text-slate-100 shadow-black/60' : 'bg-white border-[#e5eeff] text-[#0b1c30]'
                    }`}
                  >
                    {/* Header info */}
                    <div className={`px-4 py-3 border-b ${isDarkMode ? 'border-slate-800' : 'border-[#eff4ff]'}`}>
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm overflow-hidden shrink-0 ${
                          isDarkMode ? 'bg-slate-800 border border-slate-700 text-cyan-300' : 'bg-[#eff4ff] border border-[#dce9ff] text-[#00288e]'
                        }`}>
                          {currentUser.avatarUrl ? (
                            <img src={currentUser.avatarUrl} alt="" className="w-full h-full object-cover" />
                          ) : (
                            currentUser.fullName.charAt(0).toUpperCase()
                          )}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className={`text-sm font-bold truncate ${isDarkMode ? 'text-white' : 'text-[#0b1c30]'}`}>
                            {currentUser.fullName}
                          </span>
                          <span className={`text-xs truncate ${isDarkMode ? 'text-slate-400' : 'text-[#555]'}`}>
                            {currentUser.email}
                          </span>
                          <div className="flex items-center gap-1.5 mt-1">
                            <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              isDarkMode ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-800/50' : 'bg-[#eff4ff] text-[#00288e]'
                            }`}>
                              {getRoleLabel(currentUser.role)}
                            </span>
                            <span className={`text-[11px] ${isDarkMode ? 'text-slate-400' : 'text-[#777]'}`}>
                              Doc: {currentUser.documentId}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Menu Actions List */}
                    <div className="py-1">
                      {/* 1. Ver Perfil */}
                      <button
                        onClick={() => {
                          setShowProfileMenu(false);
                          setShowViewProfileModal(true);
                        }}
                        className={`w-full px-4 py-2.5 flex items-center gap-3 text-sm transition-colors text-left cursor-pointer ${
                          isDarkMode ? 'text-slate-200 hover:bg-slate-800 hover:text-white' : 'text-[#222] hover:bg-[#f3f6ff] hover:text-[#00288e]'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[20px] text-cyan-500">account_circle</span>
                        <div className="flex flex-col">
                          <span className="font-semibold">{currentLang === 'es' ? 'Ver perfil' : 'View profile'}</span>
                          <span className={`text-[11px] ${isDarkMode ? 'text-slate-400' : 'text-[#666]'}`}>
                            {currentLang === 'es' ? 'Datos personales e institucionales' : 'Personal & school details'}
                          </span>
                        </div>
                      </button>

                      {/* 2. Cambiar de temas (claro/oscuro) */}
                      <button
                        onClick={handleToggleTheme}
                        className={`w-full px-4 py-2.5 flex items-center justify-between text-sm transition-colors text-left cursor-pointer ${
                          isDarkMode ? 'text-slate-200 hover:bg-slate-800' : 'text-[#222] hover:bg-[#f3f6ff]'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="material-symbols-outlined text-[20px] text-[#f59e0b]">
                            {isDarkMode ? 'light_mode' : 'dark_mode'}
                          </span>
                          <div className="flex flex-col">
                            <span className="font-semibold">
                              {currentLang === 'es' ? 'Cambiar de tema' : 'Switch theme'}
                            </span>
                            <span className={`text-[11px] ${isDarkMode ? 'text-slate-400' : 'text-[#666]'}`}>
                              {isDarkMode ? (currentLang === 'es' ? 'Tema actual: Oscuro' : 'Current: Dark') : (currentLang === 'es' ? 'Tema actual: Claro' : 'Current: Light')}
                            </span>
                          </div>
                        </div>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                          isDarkMode ? 'bg-slate-800 text-amber-300' : 'bg-[#f1f5f9] text-[#334155]'
                        }`}>
                          {isDarkMode ? '🌙 Dark' : '☀️ Light'}
                        </span>
                      </button>

                      {/* 3. Idioma (español/inglés) */}
                      <button
                        onClick={handleToggleLanguage}
                        className={`w-full px-4 py-2.5 flex items-center justify-between text-sm transition-colors text-left cursor-pointer ${
                          isDarkMode ? 'text-slate-200 hover:bg-slate-800' : 'text-[#222] hover:bg-[#f3f6ff]'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="material-symbols-outlined text-[20px] text-[#10b981]">translate</span>
                          <div className="flex flex-col">
                            <span className="font-semibold">
                              {currentLang === 'es' ? 'Idioma' : 'Language'}
                            </span>
                            <span className={`text-[11px] ${isDarkMode ? 'text-slate-400' : 'text-[#666]'}`}>
                              {currentLang === 'es' ? 'Español / English' : 'Spanish / English'}
                            </span>
                          </div>
                        </div>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                          isDarkMode ? 'bg-slate-800 text-emerald-300' : 'bg-[#f1f5f9] text-[#334155]'
                        }`}>
                          {currentLang === 'es' ? '🇪🇸 ES' : '🇺🇸 EN'}
                        </span>
                      </button>

                      <div className={`my-1 border-t ${isDarkMode ? 'border-slate-800' : 'border-[#f1f5f9]'}`} />

                      {/* 4. Cerrar sesión */}
                      <button
                        onClick={() => {
                          setShowProfileMenu(false);
                          onLogout();
                        }}
                        className={`w-full px-4 py-2.5 flex items-center gap-3 text-sm transition-colors text-left cursor-pointer ${
                          isDarkMode ? 'text-slate-200 hover:bg-slate-800 hover:text-cyan-300' : 'text-[#222] hover:bg-[#f3f6ff] hover:text-[#00288e]'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[20px] text-slate-400">logout</span>
                        <span className="font-semibold">
                          {currentLang === 'es' ? 'Cerrar sesión' : 'Sign out'}
                        </span>
                      </button>

                      {/* 5. Eliminar cuenta */}
                      <button
                        onClick={() => {
                          setShowProfileMenu(false);
                          setDeletePassword('');
                          setConfirmWord('');
                          setDeleteError('');
                          setShowDeleteAccountModal(true);
                        }}
                        className={`w-full px-4 py-2.5 flex items-center gap-3 text-sm text-[#ba1a1a] transition-colors text-left cursor-pointer ${
                          isDarkMode ? 'hover:bg-rose-950/40 text-rose-400' : 'hover:bg-[#fff1f2] text-[#ba1a1a]'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[20px]">delete_forever</span>
                        <div className="flex flex-col">
                          <span className="font-bold">
                            {currentLang === 'es' ? 'Eliminar cuenta' : 'Delete account'}
                          </span>
                          <span className={`text-[11px] ${isDarkMode ? 'text-rose-400/80' : 'text-[#ba1a1a]/80'}`}>
                            {currentLang === 'es' ? 'Requiere validación de seguridad' : 'Requires security validation'}
                          </span>
                        </div>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => onSelectScreen('login')}
                className="px-3.5 py-1.5 rounded-xl bg-white text-[#00288e] text-xs font-bold shadow-xs hover:bg-[#eff4ff] transition-all cursor-pointer"
              >
                {currentLang === 'es' ? 'Iniciar Sesión / Registro' : 'Sign In / Register'}
              </button>
            )}

            {/* Mobile menu button */}
            <div className="flex lg:hidden items-center gap-1">
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-10 h-10 rounded-xl bg-white/15 hover:bg-white/25 active:bg-white/30 text-white flex items-center justify-center transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-white shrink-0"
                aria-label={currentLang === 'es' ? 'Abrir navegación móvil' : 'Open mobile menu'}
                aria-expanded={isExpanded}
              >
                <span className="material-symbols-outlined text-[24px]">
                  {isExpanded ? 'close' : 'menu'}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Warning notification banner when an unregistered user clicks locked view */}
        {showAuthWarning && (
          <div className="mt-2 p-2.5 rounded-xl bg-[#b91c1c] text-white text-xs font-bold flex items-center justify-between gap-2 shadow-md animate-in fade-in">
            <div className="flex items-center gap-2 min-w-0">
              <span className="material-symbols-outlined text-[18px] shrink-0">warning</span>
              <span className="truncate">{currentLang === 'es' ? 'Acceso denegado: El usuario no ha iniciado sesión.' : 'Access denied: Please sign in first.'}</span>
            </div>
            <button
              onClick={() => onSelectScreen('login')}
              className="px-3 py-1.5 min-h-[36px] rounded-lg bg-white text-[#b91c1c] text-xs font-bold shrink-0 cursor-pointer hover:bg-white/90 transition-colors"
            >
              {currentLang === 'es' ? 'Ir al inicio' : 'Go to login'}
            </button>
          </div>
        )}

        {/* Mobile Dropdown Navigation */}
        {isExpanded && (
          <div className="lg:hidden mt-2 pt-2 border-t border-white/15 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 pb-1 animate-in fade-in slide-in-from-top-1 duration-150">
            {visibleScreens.map((screen) => {
              const isActive = currentScreen === screen.id;
              const isLocked = !currentUser && screen.id !== 'login';
              return (
                <button
                  key={screen.id}
                  onClick={() => handleScreenClick(screen.id)}
                  className={`flex items-center gap-2.5 p-3 min-h-[44px] rounded-xl text-xs font-semibold text-left transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-white ${
                    isActive
                      ? 'bg-white text-[#00288e] shadow-sm font-bold'
                      : 'text-white/90 hover:bg-white/20 active:bg-white/25'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px] shrink-0">
                    {isLocked ? 'lock' : screen.icon}
                  </span>
                  <span className="truncate">{screen.label}</span>
                </button>
              );
            })}
          </div>
        )}
      </header>

      {/* Floating Toast Message */}
      {toastMessage && (
        <div className="fixed top-16 right-4 z-50 bg-[#0b1c30] text-white px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 text-xs font-bold animate-in fade-in duration-200">
          <span className="material-symbols-outlined text-[18px] text-[#7bd0ff]">check_circle</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ---------------- MODAL 1: VER PERFIL ---------------- */}
      {showViewProfileModal && currentUser && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className={`w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden border animate-in zoom-in-95 duration-150 ${
            isDarkMode ? 'bg-slate-900 border-slate-700 text-slate-100 shadow-black/80' : 'bg-white border-[#e5eeff] text-[#0b1c30]'
          }`}>
            {/* Modal Header */}
            <div className={`p-6 text-white flex items-center justify-between ${
              isDarkMode ? 'bg-gradient-to-r from-slate-950 via-slate-900 to-cyan-950 border-b border-cyan-500/20' : 'bg-gradient-to-r from-[#00288e] to-[#1e40af]'
            }`}>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-white text-lg font-bold border-2 border-white/40 overflow-hidden">
                  {currentUser.avatarUrl ? (
                    <img src={currentUser.avatarUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    currentUser.fullName.charAt(0).toUpperCase()
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-bold leading-tight">{currentUser.fullName}</h3>
                  <span className="inline-block mt-0.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-white/20 text-[#c4e7ff]">
                    {getRoleLabel(currentUser.role)}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setShowViewProfileModal(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
                title={currentLang === 'es' ? 'Cerrar' : 'Close'}
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {/* Modal Body Info Details */}
            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className={`p-3 rounded-xl border ${
                  isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-[#f8f9ff] border-[#e5eeff]'
                }`}>
                  <span className={`block text-[11px] font-bold uppercase ${isDarkMode ? 'text-slate-400' : 'text-[#64748b]'}`}>
                    {currentLang === 'es' ? 'Nombre Completo' : 'Full Name'}
                  </span>
                  <span className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-[#0b1c30]'}`}>{currentUser.fullName}</span>
                </div>

                <div className={`p-3 rounded-xl border ${
                  isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-[#f8f9ff] border-[#e5eeff]'
                }`}>
                  <span className={`block text-[11px] font-bold uppercase ${isDarkMode ? 'text-slate-400' : 'text-[#64748b]'}`}>
                    {currentLang === 'es' ? 'Documento de Identidad' : 'ID Document'}
                  </span>
                  <span className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-[#0b1c30]'}`}>{currentUser.documentId}</span>
                </div>

                <div className={`p-3 rounded-xl border ${
                  isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-[#f8f9ff] border-[#e5eeff]'
                }`}>
                  <span className={`block text-[11px] font-bold uppercase ${isDarkMode ? 'text-slate-400' : 'text-[#64748b]'}`}>
                    {currentLang === 'es' ? 'Correo Electrónico' : 'Email Address'}
                  </span>
                  <span className={`text-sm font-semibold truncate block ${isDarkMode ? 'text-white' : 'text-[#0b1c30]'}`}>{currentUser.email}</span>
                </div>

                <div className={`p-3 rounded-xl border ${
                  isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-[#f8f9ff] border-[#e5eeff]'
                }`}>
                  <span className={`block text-[11px] font-bold uppercase ${isDarkMode ? 'text-slate-400' : 'text-[#64748b]'}`}>
                    {currentLang === 'es' ? 'Institución Educativa' : 'Educational Institution'}
                  </span>
                  <span className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-[#0b1c30]'}`}>I.E. Vallejuelos • Medellín</span>
                </div>

                <div className={`p-3 rounded-xl border sm:col-span-2 ${
                  isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-[#f8f9ff] border-[#e5eeff]'
                }`}>
                  <span className={`block text-[11px] font-bold uppercase ${isDarkMode ? 'text-slate-400' : 'text-[#64748b]'}`}>
                    {currentLang === 'es' ? 'Jornada Escolar Oficial' : 'Official School Shift'}
                  </span>
                  <span className={`text-sm font-semibold ${isDarkMode ? 'text-cyan-300' : 'text-[#0b1c30]'}`}>
                    {currentLang === 'es' ? 'Jornada Mañana (6:15 AM a 12:15 PM)' : 'Morning Shift (6:15 AM to 12:15 PM)'}
                  </span>
                </div>

                {/* Role specific info */}
                {currentUser.role === 'student' && (
                  <>
                    <div className={`p-3 rounded-xl border ${
                      isDarkMode ? 'bg-blue-950/40 border-blue-800/60' : 'bg-[#eff4ff] border-[#dce9ff]'
                    }`}>
                      <span className={`block text-[11px] font-bold uppercase ${isDarkMode ? 'text-cyan-400' : 'text-[#00288e]'}`}>
                        {currentLang === 'es' ? 'Grado y Grupo Oficial' : 'Official Grade & Group'}
                      </span>
                      <span className={`text-sm font-bold ${isDarkMode ? 'text-cyan-300' : 'text-[#00288e]'}`}>{currentUser.gradeLevel || 'Grado 11°1'}</span>
                    </div>
                    <div className={`p-3 rounded-xl border ${
                      isDarkMode ? 'bg-blue-950/40 border-blue-800/60' : 'bg-[#eff4ff] border-[#dce9ff]'
                    }`}>
                      <span className={`block text-[11px] font-bold uppercase ${isDarkMode ? 'text-cyan-400' : 'text-[#00288e]'}`}>
                        {currentLang === 'es' ? 'Código / Matrícula' : 'Student Code'}
                      </span>
                      <span className={`text-sm font-bold ${isDarkMode ? 'text-cyan-300' : 'text-[#00288e]'}`}>{currentUser.studentCode || 'EST-2026-042'}</span>
                    </div>
                  </>
                )}

                {currentUser.role === 'teacher' && (
                  <>
                    <div className={`p-3 rounded-xl border ${
                      isDarkMode ? 'bg-indigo-950/40 border-indigo-800/60' : 'bg-[#eff4ff] border-[#dce9ff]'
                    }`}>
                      <span className={`block text-[11px] font-bold uppercase ${isDarkMode ? 'text-indigo-400' : 'text-[#00288e]'}`}>
                        {currentLang === 'es' ? 'Área Académica' : 'Academic Area'}
                      </span>
                      <span className={`text-sm font-bold ${isDarkMode ? 'text-indigo-300' : 'text-[#00288e]'}`}>{currentUser.subjectArea || 'Tecnología e Informática'}</span>
                    </div>
                    <div className={`p-3 rounded-xl border ${
                      isDarkMode ? 'bg-indigo-950/40 border-indigo-800/60' : 'bg-[#eff4ff] border-[#dce9ff]'
                    }`}>
                      <span className={`block text-[11px] font-bold uppercase ${isDarkMode ? 'text-indigo-400' : 'text-[#00288e]'}`}>
                        {currentLang === 'es' ? 'Grados Asignados' : 'Assigned Grades'}
                      </span>
                      <span className={`text-sm font-bold ${isDarkMode ? 'text-indigo-300' : 'text-[#00288e]'}`}>{currentUser.assignedGrades || '6°1, 6°2, 7°1, 7°2'}</span>
                    </div>
                  </>
                )}

                {currentUser.role === 'family' && (
                  <>
                    <div className={`p-3 rounded-xl border ${
                      isDarkMode ? 'bg-amber-950/40 border-amber-800/60' : 'bg-[#eff4ff] border-[#dce9ff]'
                    }`}>
                      <span className={`block text-[11px] font-bold uppercase ${isDarkMode ? 'text-amber-400' : 'text-[#00288e]'}`}>
                        {currentLang === 'es' ? 'Parentesco' : 'Relationship'}
                      </span>
                      <span className={`text-sm font-bold ${isDarkMode ? 'text-amber-300' : 'text-[#00288e]'}`}>{currentUser.relationship || 'Madre de familia'}</span>
                    </div>
                    <div className={`p-3 rounded-xl border ${
                      isDarkMode ? 'bg-amber-950/40 border-amber-800/60' : 'bg-[#eff4ff] border-[#dce9ff]'
                    }`}>
                      <span className={`block text-[11px] font-bold uppercase ${isDarkMode ? 'text-amber-400' : 'text-[#00288e]'}`}>
                        {currentLang === 'es' ? 'Estudiante Representado' : 'Represented Student'}
                      </span>
                      <span className={`text-sm font-bold ${isDarkMode ? 'text-amber-300' : 'text-[#00288e]'}`}>
                        {currentUser.representedStudentName || (currentLang === 'es' ? 'Estudiante acudido' : 'Represented student')}
                      </span>
                    </div>
                  </>
                )}

                {currentUser.role === 'admin' && (
                  <>
                    <div className={`p-3 rounded-xl border ${
                      isDarkMode ? 'bg-emerald-950/40 border-emerald-800/60' : 'bg-[#eff4ff] border-[#dce9ff]'
                    }`}>
                      <span className={`block text-[11px] font-bold uppercase ${isDarkMode ? 'text-emerald-400' : 'text-[#00288e]'}`}>
                        {currentLang === 'es' ? 'Cargo Oficial' : 'Official Position'}
                      </span>
                      <span className={`text-sm font-bold ${isDarkMode ? 'text-emerald-300' : 'text-[#00288e]'}`}>{currentUser.adminPosition || currentUser.department || 'Coordinación Académica'}</span>
                    </div>
                    <div className={`p-3 rounded-xl border ${
                      isDarkMode ? 'bg-emerald-950/40 border-emerald-800/60' : 'bg-[#eff4ff] border-[#dce9ff]'
                    }`}>
                      <span className={`block text-[11px] font-bold uppercase ${isDarkMode ? 'text-emerald-400' : 'text-[#00288e]'}`}>
                        {currentLang === 'es' ? 'Nivel de Acceso' : 'Access Level'}
                      </span>
                      <span className={`text-sm font-bold ${isDarkMode ? 'text-emerald-300' : 'text-[#00288e]'}`}>{currentLang === 'es' ? 'Gestión Institucional' : 'Institutional Leadership'}</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className={`p-4 border-t flex justify-end ${isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-[#f8f9ff] border-[#e5eeff]'}`}>
              <button
                type="button"
                onClick={() => setShowViewProfileModal(false)}
                className={`px-5 py-2.5 rounded-xl text-white text-xs font-bold transition-all cursor-pointer shadow-xs ${
                  isDarkMode ? 'bg-cyan-600 hover:bg-cyan-500' : 'bg-[#00288e] hover:bg-[#1e40af]'
                }`}
              >
                {currentLang === 'es' ? 'Cerrar' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------- MODAL 2: ELIMINAR CUENTA (CON VALIDACIÓN DE CONTRASEÑA Y 'ACEPTO') ---------------- */}
      {showDeleteAccountModal && currentUser && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className={`w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border animate-in zoom-in-95 duration-150 ${
            isDarkMode ? 'bg-slate-900 border-rose-900/60 text-slate-100 shadow-black/80' : 'bg-white border-red-200 text-[#0b1c30]'
          }`}>
            {/* Header with warning icon */}
            <div className="bg-gradient-to-r from-red-600 to-red-700 p-5 text-white flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-white shrink-0">
                <span className="material-symbols-outlined text-[24px]">warning</span>
              </div>
              <div>
                <h3 className="text-base font-bold leading-tight">
                  {currentLang === 'es' ? 'Eliminar Cuenta Institucional' : 'Delete Institutional Account'}
                </h3>
                <p className="text-xs text-red-100">
                  {currentLang === 'es' ? 'Acción permanente e irreversible' : 'Permanent & irreversible action'}
                </p>
              </div>
            </div>

            {/* Body */}
            <form onSubmit={handleDeleteAccountSubmit} className="p-5 space-y-4">
              <div className={`p-3 rounded-xl border text-xs space-y-1 ${
                isDarkMode ? 'bg-rose-950/40 border-rose-900/60 text-rose-300' : 'bg-red-50 border-red-200 text-red-800'
              }`}>
                <p className="font-bold flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px] text-red-500">info</span>
                  {currentLang === 'es' ? 'Atención: Esta acción no se puede deshacer.' : 'Warning: This action cannot be undone.'}
                </p>
                <p>
                  {currentLang === 'es'
                    ? 'Se eliminarán todos tus datos personales, rol institucional y registros de acceso permanentemente.'
                    : 'All your personal data, institutional role, and access records will be permanently removed.'}
                </p>
              </div>

              {/* Input 1: Contraseña actual */}
              <div>
                <label className={`block text-xs font-bold mb-1 ${isDarkMode ? 'text-slate-300' : 'text-[#333]'}`}>
                  {currentLang === 'es' ? 'Ingresa tu contraseña actual *' : 'Enter your current password *'}
                </label>
                <input
                  type="password"
                  value={deletePassword}
                  onChange={(e) => {
                    setDeletePassword(e.target.value);
                    setDeleteError('');
                  }}
                  className={`w-full h-11 px-3.5 rounded-xl text-sm border focus:outline-none transition-all ${
                    isDarkMode ? 'bg-slate-950 border-slate-700 text-white focus:border-red-500' : 'bg-[#f8f9ff] border-gray-300 text-[#0b1c30] focus:border-red-600'
                  }`}
                  required
                />
              </div>

              {/* Input 2: Palabra 'ACEPTO' */}
              <div>
                <label className={`block text-xs font-bold mb-1 ${isDarkMode ? 'text-slate-300' : 'text-[#333]'}`}>
                  {currentLang === 'es' ? (
                    <>Escribe literalmente la palabra <span className="font-extrabold text-red-500 px-1.5 py-0.5 rounded bg-red-500/10 border border-red-500/30">ACEPTO</span> para confirmar *</>
                  ) : (
                    <>Type literally the word <span className="font-extrabold text-red-500 px-1.5 py-0.5 rounded bg-red-500/10 border border-red-500/30">ACEPTO</span> to confirm *</>
                  )}
                </label>
                <input
                  type="text"
                  value={confirmWord}
                  onChange={(e) => {
                    setConfirmWord(e.target.value);
                    setDeleteError('');
                  }}
                  className={`w-full h-11 px-3.5 rounded-xl text-sm font-bold tracking-widest uppercase border focus:outline-none transition-all ${
                    isDarkMode ? 'bg-slate-950 border-slate-700 text-white focus:border-red-500' : 'bg-[#f8f9ff] border-gray-300 text-[#0b1c30] focus:border-red-600'
                  }`}
                  required
                />
              </div>

              {/* Error Message */}
              {deleteError && (
                <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400 text-xs font-bold flex items-center gap-2 animate-in fade-in">
                  <span className="material-symbols-outlined text-[18px] shrink-0 text-red-500">error</span>
                  <span>{deleteError}</span>
                </div>
              )}

              {/* Actions buttons */}
              <div className={`pt-2 flex items-center justify-end gap-2 border-t ${isDarkMode ? 'border-slate-800' : 'border-gray-100'}`}>
                <button
                  type="button"
                  onClick={() => setShowDeleteAccountModal(false)}
                  disabled={isDeleting}
                  className={`px-4 py-2.5 rounded-xl border text-xs font-semibold transition-colors cursor-pointer ${
                    isDarkMode ? 'border-slate-700 text-slate-300 hover:bg-slate-800' : 'border-gray-300 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {currentLang === 'es' ? 'Cancelar' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={isDeleting}
                  className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-[16px]">delete_forever</span>
                  <span>{isDeleting ? (currentLang === 'es' ? 'Eliminando...' : 'Deleting...') : (currentLang === 'es' ? 'Eliminar Cuenta Permanentemente' : 'Permanently Delete Account')}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Primary App Views Container */}
      <main className="flex-1 w-full">
        {children}
      </main>
    </div>
  );
};
