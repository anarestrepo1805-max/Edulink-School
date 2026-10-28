import React, { useState, useEffect, useRef } from 'react';
import { ActiveScreen, UserRole, UserProfile } from '../types';
import { deleteUserAccount } from '../services/authService';
import { useThemeLanguage } from '../context/ThemeLanguageContext';
import { ASSETS } from '../data/mockData';
import { StudentProfileModal } from './StudentProfileModal';
import { TeacherScheduleModal } from './TeacherScheduleModal';
import {
  subscribeChatNotifications,
  markConversationAsRead,
  ChatNotification
} from '../services/messagingService';

interface NavigationShellProps {
  currentScreen: ActiveScreen;
  onSelectScreen: (screen: ActiveScreen) => void;
  userRole: UserRole;
  onSelectRole: (role: UserRole) => void;
  currentUser: UserProfile | null;
  onLogout: () => void;
  onUpdateUser?: (updated: UserProfile) => void;
  children: React.ReactNode;
}

export const NavigationShell: React.FC<NavigationShellProps> = ({
  currentScreen,
  onSelectScreen,
  currentUser,
  onLogout,
  onUpdateUser,
  children
}) => {
  const [showAuthWarning, setShowAuthWarning] = useState(false);
  const [showStudentProfileModal, setShowStudentProfileModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  // Top-right Profile Dropdown state
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Notifications state
  const [notifications, setNotifications] = useState<ChatNotification[]>([]);
  const [totalUnread, setTotalUnread] = useState(0);
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  // Modals state
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

  // Subscribe to real-time chat notifications
  useEffect(() => {
    if (!currentUser) {
      setNotifications([]);
      setTotalUnread(0);
      return;
    }

    const effectiveId = currentUser.documentId || currentUser.id;
    const unsubscribe = subscribeChatNotifications(effectiveId, (notifs, unread) => {
      setNotifications(notifs);
      setTotalUnread(unread);
    });

    return () => unsubscribe();
  }, [currentUser]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowProfileMenu(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifMenu(false);
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

  const handleOpenNotification = (notif: ChatNotification) => {
    if (!currentUser) return;
    const effectiveId = currentUser.documentId || currentUser.id;
    markConversationAsRead(notif.conversationId, effectiveId);
    setShowNotifMenu(false);

    const role = (currentUser.role || '').toLowerCase();
    if (role === 'family' || role === 'acudiente' || role === 'guardian') {
      onSelectScreen('family_messaging');
    } else if (role === 'teacher' || role === 'docente') {
      onSelectScreen('teacher_messaging');
    } else {
      onSelectScreen('teacher_messaging');
    }
  };

  const screens: { id: ActiveScreen; label: string; icon: string; category: string }[] = [
    // ROL ESTUDIANTE
    {
      id: 'student_dashboard',
      label: currentLang === 'es' ? 'Portal Estudiantil' : 'Student Portal',
      icon: 'dashboard',
      category: currentLang === 'es' ? 'Estudiante' : 'Student'
    },
    {
      id: 'student_assignment',
      label: currentLang === 'es' ? 'Tareas y Entregas' : 'Assignments & Tasks',
      icon: 'assignment',
      category: currentLang === 'es' ? 'Estudiante' : 'Student'
    },
    {
      id: 'student_forum',
      label: currentLang === 'es' ? 'Foro y encuestas' : 'Forums & Surveys',
      icon: 'forum',
      category: currentLang === 'es' ? 'Estudiante' : 'Student'
    },

    // ROL DOCENTE (5 interfaces oficiales)
    {
      id: 'teacher_grades',
      label: currentLang === 'es' ? 'Calificaciones' : 'Gradebook',
      icon: 'fact_check',
      category: currentLang === 'es' ? 'Docente' : 'Teacher'
    },
    {
      id: 'teacher_attendance',
      label: currentLang === 'es' ? 'Control de asistencia' : 'Class Attendance',
      icon: 'how_to_reg',
      category: currentLang === 'es' ? 'Docente' : 'Teacher'
    },
    {
      id: 'teacher_assignments',
      label: currentLang === 'es' ? 'Tareas y talleres' : 'Tasks & Workshops',
      icon: 'assignment',
      category: currentLang === 'es' ? 'Docente' : 'Teacher'
    },
    {
      id: 'teacher_messaging',
      label: currentLang === 'es' ? 'Mensajería y citaciones' : 'Messaging & Citations',
      icon: 'chat',
      category: currentLang === 'es' ? 'Docente' : 'Teacher'
    },
    {
      id: 'teacher_forum',
      label: currentLang === 'es' ? 'Foro y encuestas' : 'Forums & Polls',
      icon: 'forum',
      category: currentLang === 'es' ? 'Docente' : 'Teacher'
    },

    // ROL ACUDIENTE / FAMILIA
    {
      id: 'family_dashboard',
      label: currentLang === 'es' ? 'Familiar • Portal' : 'Family • Portal',
      icon: 'family_restroom',
      category: currentLang === 'es' ? 'Familia' : 'Family'
    },
    {
      id: 'family_messaging',
      label: currentLang === 'es' ? 'Familiar • Mensajería' : 'Family • Messaging',
      icon: 'mark_email_unread',
      category: currentLang === 'es' ? 'Familia' : 'Family'
    },

    // ROL ADMINISTRATIVO
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
    if (role === 'student' || role === 'estudiante') {
      return (
        screen.id === 'student_dashboard' ||
        screen.id === 'student_assignment' ||
        screen.id === 'student_forum'
      );
    }
    if (role === 'teacher' || role === 'docente') {
      return (
        screen.id === 'teacher_grades' ||
        screen.id === 'teacher_assignments' ||
        screen.id === 'teacher_attendance' ||
        screen.id === 'teacher_messaging' ||
        screen.id === 'teacher_forum'
      );
    }
    if (role === 'family' || role === 'acudiente' || role === 'guardian') {
      return screen.id === 'family_dashboard' || screen.id === 'family_messaging';
    }
    if (role === 'admin' || role === 'administrativo') {
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
      const isStudentScreen =
        screenId === 'student_dashboard' ||
        screenId === 'student_assignment' ||
        screenId === 'student_forum';
      const isTeacherScreen =
        screenId === 'teacher_grades' ||
        screenId === 'teacher_assignments' ||
        screenId === 'teacher_attendance' ||
        screenId === 'teacher_messaging' ||
        screenId === 'teacher_forum';
      const isFamilyScreen = screenId === 'family_dashboard' || screenId === 'family_messaging';
      const isAdminScreen = screenId === 'admin_dashboard';

      if (
        ((role === 'student' || role === 'estudiante') && !isStudentScreen) ||
        ((role === 'teacher' || role === 'docente') && !isTeacherScreen) ||
        ((role === 'family' || role === 'acudiente' || role === 'guardian') && !isFamilyScreen) ||
        ((role === 'admin' || role === 'administrativo') && !isAdminScreen)
      ) {
        setToastMessage(
          currentLang === 'es'
            ? 'Acceso restringido: Esta pantalla pertenece a otro rol institucional.'
            : 'Restricted access: This screen belongs to another institutional role.'
        );
        setTimeout(() => setToastMessage(null), 3500);
        return;
      }
    }
    onSelectScreen(screenId);
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

            {/* Notification Bell with Real Unread Counter */}
            {currentUser && (
              <div className="relative" ref={notifRef}>
                <button
                  type="button"
                  onClick={() => setShowNotifMenu(!showNotifMenu)}
                  className="relative w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-white/15 hover:bg-white/25 text-white flex items-center justify-center transition-all cursor-pointer border border-white/20 shadow-xs focus-visible:ring-1 focus-visible:ring-white"
                  title={currentLang === 'es' ? 'Notificaciones de Mensajería' : 'Messaging Notifications'}
                  aria-label="Notifications"
                >
                  <span className="material-symbols-outlined text-[19px]">notifications</span>
                  {totalUnread > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white font-extrabold text-[10px] flex items-center justify-center ring-2 ring-[#00288e] animate-pulse">
                      {totalUnread > 99 ? '99+' : totalUnread}
                    </span>
                  )}
                </button>

                {/* Notifications Dropdown Menu */}
                {showNotifMenu && (
                  <div className={`absolute right-0 mt-2 w-[min(calc(100vw-24px),22rem)] rounded-2xl shadow-2xl border py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150 ${
                    isDarkMode ? 'bg-slate-900 border-slate-700 text-slate-100 shadow-black/60' : 'bg-white border-[#e5eeff] text-[#0b1c30]'
                  }`}>
                    <div className={`px-4 py-2.5 border-b flex items-center justify-between ${
                      isDarkMode ? 'border-slate-800' : 'border-[#eff4ff]'
                    }`}>
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-amber-400 text-lg">chat_bubble</span>
                        <span className="text-xs font-bold uppercase tracking-wider">
                          {currentLang === 'es' ? 'Mensajes y Notificaciones' : 'Messages & Notices'}
                        </span>
                      </div>
                      {totalUnread > 0 && (
                        <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30 text-[10px] font-extrabold">
                          {totalUnread} {currentLang === 'es' ? 'sin leer' : 'unread'}
                        </span>
                      )}
                    </div>

                    <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
                      {notifications.length === 0 ? (
                        <div className="py-8 px-4 text-center">
                          <span className="material-symbols-outlined text-3xl text-slate-400 mb-1">notifications_off</span>
                          <p className="text-xs text-slate-400 font-medium">
                            {currentLang === 'es' ? 'No tienes mensajes nuevos pendientes.' : 'No new unread messages.'}
                          </p>
                        </div>
                      ) : (
                        notifications.map((notif) => (
                          <div
                            key={notif.conversationId}
                            onClick={() => handleOpenNotification(notif)}
                            className={`p-3 transition-colors cursor-pointer flex items-start gap-3 ${
                              isDarkMode ? 'hover:bg-slate-800/70' : 'hover:bg-[#f3f6ff]'
                            }`}
                          >
                            <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-xs text-amber-300 shrink-0">
                              {notif.senderAvatar ? (
                                <img src={notif.senderAvatar} alt="" className="w-full h-full object-cover" />
                              ) : (
                                notif.senderName.charAt(0)
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between text-xs mb-0.5">
                                <span className="font-bold truncate max-w-[140px]">{notif.senderName}</span>
                                <span className="text-[10px] text-slate-400">
                                  {new Date(notif.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-400 truncate mb-1">{notif.text}</p>
                              <div className="flex items-center gap-1.5">
                                <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                                  isDarkMode ? 'bg-slate-800 text-amber-300' : 'bg-[#e5eeff] text-[#00288e]'
                                }`}>
                                  {notif.senderRole}
                                </span>
                                <span className="text-[10px] text-cyan-400 font-semibold ml-auto flex items-center gap-0.5">
                                  <span>{currentLang === 'es' ? 'Abrir chat' : 'Open'}</span>
                                  <span className="material-symbols-outlined text-xs">arrow_forward</span>
                                </span>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

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
                      {/* 1. Ver y editar perfil y fotografía (Universal para todos los roles) */}
                      <button
                        onClick={() => {
                          setShowProfileMenu(false);
                          setShowStudentProfileModal(true);
                        }}
                        className={`w-full px-4 py-2.5 flex items-center gap-3 text-sm transition-colors text-left cursor-pointer ${
                          isDarkMode ? 'text-slate-200 hover:bg-slate-800 hover:text-white' : 'text-[#222] hover:bg-[#f3f6ff] hover:text-[#00288e]'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[20px] text-cyan-500">account_circle</span>
                        <div className="flex flex-col">
                          <span className="font-semibold">{currentLang === 'es' ? 'Ver y editar perfil' : 'View & edit profile'}</span>
                          <span className={`text-[11px] ${isDarkMode ? 'text-slate-400' : 'text-[#666]'}`}>
                            {currentLang === 'es' ? 'Datos personales, contacto y fotografía' : 'Personal info, contact & photo'}
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
            )}          </div>
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
      </header>

      {/* Floating Toast Message */}
      {toastMessage && (
        <div className="fixed top-16 right-4 z-50 bg-[#0b1c30] text-white px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 text-xs font-bold animate-in fade-in duration-200">
          <span className="material-symbols-outlined text-[18px] text-[#7bd0ff]">check_circle</span>
          <span>{toastMessage}</span>
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

      {/* User Profile & Photo Modal (for all authenticated roles) */}
      {currentUser && (
        <StudentProfileModal
          currentUser={currentUser}
          isOpen={showStudentProfileModal}
          onClose={() => setShowStudentProfileModal(false)}
          onUpdateUser={(updated) => {
            if (onUpdateUser) onUpdateUser(updated);
          }}
        />
      )}
    </div>
  );
};
