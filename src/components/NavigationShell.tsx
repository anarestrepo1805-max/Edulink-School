import React, { useState, useEffect, useRef } from 'react';
import { ActiveScreen, UserRole, UserProfile } from '../types';
import { deleteUserAccount } from '../services/authService';

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

  // Theme state (claro / oscuro)
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    try {
      return localStorage.getItem('edulink_theme') === 'dark' || document.documentElement.classList.contains('dark');
    } catch {
      return false;
    }
  });

  // Language state (español / inglés)
  const [currentLang, setCurrentLang] = useState<'es' | 'en'>(() => {
    try {
      return (localStorage.getItem('edulink_lang') as 'es' | 'en') || 'es';
    } catch {
      return 'es';
    }
  });

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
    const nextDark = !isDarkMode;
    setIsDarkMode(nextDark);
    if (nextDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('edulink_theme', 'dark');
      setToastMessage(currentLang === 'es' ? 'Tema Oscuro activado' : 'Dark Mode activated');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('edulink_theme', 'light');
      setToastMessage(currentLang === 'es' ? 'Tema Claro activado' : 'Light Mode activated');
    }
    setShowProfileMenu(false);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleToggleLanguage = () => {
    const nextLang = currentLang === 'es' ? 'en' : 'es';
    setCurrentLang(nextLang);
    localStorage.setItem('edulink_lang', nextLang);
    setToastMessage(nextLang === 'es' ? 'Idioma cambiado a Español' : 'Language changed to English');
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
    { id: 'student_dashboard', label: 'Estudiante • Portal', icon: 'dashboard', category: 'Estudiante' },
    { id: 'student_assignment', label: 'Estudiante • Taller 1', icon: 'assignment', category: 'Estudiante' },
    { id: 'teacher_grades', label: 'Docente • Calificaciones', icon: 'fact_check', category: 'Docente' },
    { id: 'family_dashboard', label: 'Familiar • Portal', icon: 'family_restroom', category: 'Familia' },
    { id: 'family_messaging', label: 'Familiar • Mensajería', icon: 'chat', category: 'Familia' },
    { id: 'admin_dashboard', label: 'Administrativo • Panel', icon: 'admin_panel_settings', category: 'Administración' }
  ];

  const handleScreenClick = (screenId: ActiveScreen) => {
    if (!currentUser && screenId !== 'login') {
      setShowAuthWarning(true);
      setTimeout(() => setShowAuthWarning(false), 4000);
      onSelectScreen('login');
      return;
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
        return 'Usuario';
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9ff] flex flex-col selection:bg-[#dde1ff]">
      {/* Top Floating Navigator */}
      <header className="sticky top-0 z-50 bg-[#00288e]/95 backdrop-blur-md text-white border-b border-[#1e40af] shadow-md px-3 py-2 transition-all">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
          {/* Logo brand & indicator */}
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#10b981] animate-pulse"></span>
            <span className="font-bold text-base sm:text-lg tracking-tight text-white flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[22px] text-[#7bd0ff]">school</span>
              Edulink School
            </span>
            <span className="hidden sm:inline-block text-xs px-2.5 py-0.5 rounded-full bg-white/10 text-[#c4e7ff] font-semibold">
              I.E. Vallejuelos
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
                  title={isLocked ? 'Debes iniciar sesión primero' : screen.label}
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

          {/* User Session & Profile Menu Button */}
          <div className="flex items-center gap-2">
            {currentUser ? (
              <div className="relative" ref={menuRef}>
                {/* Profile Toggle Button with User Name */}
                <button
                  id="user-profile-menu-button"
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white transition-all cursor-pointer border border-white/20 shadow-xs active:scale-95"
                  title="Opciones de perfil y cuenta"
                >
                  <div className="w-8 h-8 rounded-full bg-white/25 flex items-center justify-center text-white text-xs font-bold ring-2 ring-white/30 overflow-hidden shrink-0">
                    {currentUser.avatarUrl ? (
                      <img src={currentUser.avatarUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      currentUser.fullName.charAt(0).toUpperCase()
                    )}
                  </div>

                  <div className="text-left hidden sm:flex flex-col leading-tight">
                    <span className="text-xs font-bold text-white max-w-[150px] truncate">
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
                    className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-[#e5eeff] py-2 text-[#0b1c30] z-50 animate-in fade-in slide-in-from-top-2 duration-150"
                  >
                    {/* Header info */}
                    <div className="px-4 py-3 border-b border-[#eff4ff]">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#eff4ff] border border-[#dce9ff] flex items-center justify-center text-[#00288e] font-bold text-sm overflow-hidden shrink-0">
                          {currentUser.avatarUrl ? (
                            <img src={currentUser.avatarUrl} alt="" className="w-full h-full object-cover" />
                          ) : (
                            currentUser.fullName.charAt(0).toUpperCase()
                          )}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-sm font-bold text-[#0b1c30] truncate">
                            {currentUser.fullName}
                          </span>
                          <span className="text-xs text-[#555] truncate">
                            {currentUser.email}
                          </span>
                          <div className="flex items-center gap-1.5 mt-1">
                            <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#eff4ff] text-[#00288e]">
                              {getRoleLabel(currentUser.role)}
                            </span>
                            <span className="text-[11px] text-[#777]">
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
                        className="w-full px-4 py-2.5 flex items-center gap-3 text-sm text-[#222] hover:bg-[#f3f6ff] hover:text-[#00288e] transition-colors text-left cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[20px] text-[#0051d5]">account_circle</span>
                        <div className="flex flex-col">
                          <span className="font-semibold">{currentLang === 'es' ? 'Ver perfil' : 'View profile'}</span>
                          <span className="text-[11px] text-[#666]">
                            {currentLang === 'es' ? 'Datos personales e institucionales' : 'Personal & school details'}
                          </span>
                        </div>
                      </button>

                      {/* 2. Cambiar de temas (claro/oscuro) */}
                      <button
                        onClick={handleToggleTheme}
                        className="w-full px-4 py-2.5 flex items-center justify-between text-sm text-[#222] hover:bg-[#f3f6ff] transition-colors text-left cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <span className="material-symbols-outlined text-[20px] text-[#f59e0b]">
                            {isDarkMode ? 'dark_mode' : 'light_mode'}
                          </span>
                          <div className="flex flex-col">
                            <span className="font-semibold">
                              {currentLang === 'es' ? 'Cambiar de tema' : 'Switch theme'}
                            </span>
                            <span className="text-[11px] text-[#666]">
                              {isDarkMode ? (currentLang === 'es' ? 'Tema actual: Oscuro' : 'Current: Dark') : (currentLang === 'es' ? 'Tema actual: Claro' : 'Current: Light')}
                            </span>
                          </div>
                        </div>
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-[#f1f5f9] text-[#334155]">
                          {isDarkMode ? '🌙 Oscuro' : '☀️ Claro'}
                        </span>
                      </button>

                      {/* 3. Idioma (español/inglés) */}
                      <button
                        onClick={handleToggleLanguage}
                        className="w-full px-4 py-2.5 flex items-center justify-between text-sm text-[#222] hover:bg-[#f3f6ff] transition-colors text-left cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <span className="material-symbols-outlined text-[20px] text-[#10b981]">translate</span>
                          <div className="flex flex-col">
                            <span className="font-semibold">
                              {currentLang === 'es' ? 'Idioma' : 'Language'}
                            </span>
                            <span className="text-[11px] text-[#666]">
                              {currentLang === 'es' ? 'Español / English' : 'Spanish / English'}
                            </span>
                          </div>
                        </div>
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-[#f1f5f9] text-[#334155]">
                          {currentLang === 'es' ? '🇪🇸 ES' : '🇺🇸 EN'}
                        </span>
                      </button>

                      <div className="my-1 border-t border-[#f1f5f9]" />

                      {/* 4. Cerrar sesión */}
                      <button
                        onClick={() => {
                          setShowProfileMenu(false);
                          onLogout();
                        }}
                        className="w-full px-4 py-2.5 flex items-center gap-3 text-sm text-[#222] hover:bg-[#f3f6ff] hover:text-[#00288e] transition-colors text-left cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[20px] text-[#64748b]">logout</span>
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
                        className="w-full px-4 py-2.5 flex items-center gap-3 text-sm text-[#ba1a1a] hover:bg-[#fff1f2] transition-colors text-left cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[20px] text-[#ba1a1a]">delete_forever</span>
                        <div className="flex flex-col">
                          <span className="font-bold">
                            {currentLang === 'es' ? 'Eliminar cuenta' : 'Delete account'}
                          </span>
                          <span className="text-[11px] text-[#ba1a1a]/80">
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
                Iniciar Sesión / Registro
              </button>
            )}

            {/* Mobile menu button */}
            <div className="flex lg:hidden items-center gap-1">
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex items-center gap-1 p-1.5 rounded-lg bg-white/15 hover:bg-white/20 text-white text-xs font-semibold"
                aria-label="Abrir navegación móvil"
              >
                <span className="material-symbols-outlined text-[20px]">menu</span>
              </button>
            </div>
          </div>
        </div>

        {/* Warning notification banner when an unregistered user clicks locked view */}
        {showAuthWarning && (
          <div className="mt-2 p-2 rounded-lg bg-[#b91c1c] text-white text-xs font-bold flex items-center justify-between animate-in fade-in">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">warning</span>
              <span>Acceso denegado: El usuario no ha iniciado sesión.</span>
            </div>
            <button
              onClick={() => onSelectScreen('login')}
              className="px-2 py-0.5 rounded bg-white text-[#b91c1c] text-[11px] font-bold"
            >
              Ir al inicio
            </button>
          </div>
        )}

        {/* Mobile Dropdown Navigation */}
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

      {/* Floating Toast Message */}
      {toastMessage && (
        <div className="fixed top-16 right-4 z-50 bg-[#0b1c30] text-white px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 text-xs font-bold animate-in fade-in duration-200">
          <span className="material-symbols-outlined text-[18px] text-[#7bd0ff]">check_circle</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ---------------- MODAL 1: VER PERFIL ---------------- */}
      {showViewProfileModal && currentUser && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden border border-[#e5eeff] animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-[#00288e] to-[#1e40af] p-6 text-white flex items-center justify-between">
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
                title="Cerrar"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {/* Modal Body Info Details */}
            <div className="p-6 space-y-4 text-[#0b1c30] max-h-[75vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="p-3 rounded-xl bg-[#f8f9ff] border border-[#e5eeff]">
                  <span className="block text-[11px] font-bold text-[#64748b] uppercase">Nombre Completo</span>
                  <span className="text-sm font-semibold text-[#0b1c30]">{currentUser.fullName}</span>
                </div>

                <div className="p-3 rounded-xl bg-[#f8f9ff] border border-[#e5eeff]">
                  <span className="block text-[11px] font-bold text-[#64748b] uppercase">Documento de Identidad</span>
                  <span className="text-sm font-semibold text-[#0b1c30]">{currentUser.documentId}</span>
                </div>

                <div className="p-3 rounded-xl bg-[#f8f9ff] border border-[#e5eeff]">
                  <span className="block text-[11px] font-bold text-[#64748b] uppercase">Correo Electrónico</span>
                  <span className="text-sm font-semibold text-[#0b1c30] truncate">{currentUser.email}</span>
                </div>

                <div className="p-3 rounded-xl bg-[#f8f9ff] border border-[#e5eeff]">
                  <span className="block text-[11px] font-bold text-[#64748b] uppercase">Institución Educativa</span>
                  <span className="text-sm font-semibold text-[#0b1c30]">I.E. Vallejuelos • Medellín</span>
                </div>

                <div className="p-3 rounded-xl bg-[#f8f9ff] border border-[#e5eeff] sm:col-span-2">
                  <span className="block text-[11px] font-bold text-[#64748b] uppercase">Jornada Escolar</span>
                  <span className="text-sm font-semibold text-[#0b1c30]">
                    {currentUser.shift || 'Jornada Mañana (6:15 AM a 12:15 PM)'}
                  </span>
                </div>

                {/* Role specific info */}
                {currentUser.role === 'student' && (
                  <>
                    <div className="p-3 rounded-xl bg-[#eff4ff] border border-[#dce9ff]">
                      <span className="block text-[11px] font-bold text-[#00288e] uppercase">Grado y Grupo</span>
                      <span className="text-sm font-bold text-[#00288e]">{currentUser.gradeLevel || 'Grado 6°1'}</span>
                    </div>
                    <div className="p-3 rounded-xl bg-[#eff4ff] border border-[#dce9ff]">
                      <span className="block text-[11px] font-bold text-[#00288e] uppercase">Código / Carnet</span>
                      <span className="text-sm font-bold text-[#00288e]">{currentUser.studentCode || '2026-601'}</span>
                    </div>
                  </>
                )}

                {currentUser.role === 'teacher' && (
                  <>
                    <div className="p-3 rounded-xl bg-[#eff4ff] border border-[#dce9ff]">
                      <span className="block text-[11px] font-bold text-[#00288e] uppercase">Área Académica</span>
                      <span className="text-sm font-bold text-[#00288e]">{currentUser.subjectArea || 'Tecnología e Informática'}</span>
                    </div>
                    <div className="p-3 rounded-xl bg-[#eff4ff] border border-[#dce9ff]">
                      <span className="block text-[11px] font-bold text-[#00288e] uppercase">Grados Asignados</span>
                      <span className="text-sm font-bold text-[#00288e]">{currentUser.assignedGrades || '6°1, 6°2, 10°1, 10°2'}</span>
                    </div>
                  </>
                )}

                {currentUser.role === 'family' && (
                  <>
                    <div className="p-3 rounded-xl bg-[#eff4ff] border border-[#dce9ff]">
                      <span className="block text-[11px] font-bold text-[#00288e] uppercase">Parentesco</span>
                      <span className="text-sm font-bold text-[#00288e]">{currentUser.relationship || 'Acudiente Principal'}</span>
                    </div>
                    <div className="p-3 rounded-xl bg-[#eff4ff] border border-[#dce9ff]">
                      <span className="block text-[11px] font-bold text-[#00288e] uppercase">Estudiante a Cargo</span>
                      <span className="text-sm font-bold text-[#00288e]">{currentUser.representedStudentName || 'Miguel Ángel Jiménez (6°1)'}</span>
                    </div>
                  </>
                )}

                {currentUser.role === 'admin' && (
                  <>
                    <div className="p-3 rounded-xl bg-[#eff4ff] border border-[#dce9ff]">
                      <span className="block text-[11px] font-bold text-[#00288e] uppercase">Dependencia / Cargo</span>
                      <span className="text-sm font-bold text-[#00288e]">{currentUser.department || 'Dirección / Secretaría Académica'}</span>
                    </div>
                    <div className="p-3 rounded-xl bg-[#eff4ff] border border-[#dce9ff]">
                      <span className="block text-[11px] font-bold text-[#00288e] uppercase">Nivel de Acceso</span>
                      <span className="text-sm font-bold text-[#00288e]">Gestión Institucional Total</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-[#f8f9ff] border-t border-[#e5eeff] flex justify-end">
              <button
                type="button"
                onClick={() => setShowViewProfileModal(false)}
                className="px-5 py-2.5 rounded-xl bg-[#00288e] hover:bg-[#1e40af] text-white text-xs font-bold transition-all cursor-pointer shadow-xs"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------- MODAL 2: ELIMINAR CUENTA (CON VALIDACIÓN DE CONTRASEÑA Y 'ACEPTO') ---------------- */}
      {showDeleteAccountModal && currentUser && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-red-200 animate-in zoom-in-95 duration-150">
            {/* Header with warning icon */}
            <div className="bg-gradient-to-r from-red-600 to-red-700 p-5 text-white flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-white shrink-0">
                <span className="material-symbols-outlined text-[24px]">warning</span>
              </div>
              <div>
                <h3 className="text-base font-bold leading-tight">Eliminar Cuenta Institucional</h3>
                <p className="text-xs text-red-100">Acción permanente e irreversible</p>
              </div>
            </div>

            {/* Body */}
            <form onSubmit={handleDeleteAccountSubmit} className="p-5 space-y-4">
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800 space-y-1">
                <p className="font-bold flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px] text-red-600">info</span>
                  Atención: Esta acción no se puede deshacer.
                </p>
                <p>
                  Se eliminarán todos tus datos personales, rol institucional, asignaturas y registros de acceso permanentemente.
                </p>
              </div>

              {/* Input 1: Contraseña actual */}
              <div>
                <label className="block text-xs font-bold text-[#333] mb-1">
                  Ingresa tu contraseña actual *
                </label>
                <input
                  type="password"
                  value={deletePassword}
                  onChange={(e) => {
                    setDeletePassword(e.target.value);
                    setDeleteError('');
                  }}
                  className="w-full h-11 px-3.5 rounded-xl bg-[#f8f9ff] text-sm text-[#0b1c30] border border-gray-300 focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-600 transition-all"
                  required
                />
              </div>

              {/* Input 2: Palabra 'ACEPTO' */}
              <div>
                <label className="block text-xs font-bold text-[#333] mb-1">
                  Escribe literalmente la palabra <span className="font-extrabold text-red-700 px-1.5 py-0.5 rounded bg-red-100 border border-red-200">ACEPTO</span> para confirmar *
                </label>
                <input
                  type="text"
                  value={confirmWord}
                  onChange={(e) => {
                    setConfirmWord(e.target.value);
                    setDeleteError('');
                  }}
                  className="w-full h-11 px-3.5 rounded-xl bg-[#f8f9ff] text-sm font-bold tracking-widest text-[#0b1c30] uppercase border border-gray-300 focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-600 transition-all"
                  required
                />
              </div>

              {/* Error Message placed strictly at the bottom as requested */}
              {deleteError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold flex items-center gap-2 animate-in fade-in">
                  <span className="material-symbols-outlined text-[18px] shrink-0 text-red-600">error</span>
                  <span>{deleteError}</span>
                </div>
              )}

              {/* Actions buttons */}
              <div className="pt-2 flex items-center justify-end gap-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowDeleteAccountModal(false)}
                  disabled={isDeleting}
                  className="px-4 py-2.5 rounded-xl border border-gray-300 text-xs font-semibold text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isDeleting}
                  className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-[16px]">delete_forever</span>
                  <span>{isDeleting ? 'Eliminando...' : 'Eliminar Cuenta Permanentemente'}</span>
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
