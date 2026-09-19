import React, { useState } from 'react';
import { UserRole, UserProfile } from '../types';
import { ASSETS } from '../data/mockData';
import { loginUser, registerNewUser } from '../services/authService';
import { PasswordRecoveryModal } from './PasswordRecoveryModal';

interface LoginViewProps {
  onLoginSuccess: (user: UserProfile) => void;
  initialRole?: UserRole;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  // Login form states
  const [identifier, setIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Password Recovery Modal state
  const [isRecoveryModalOpen, setIsRecoveryModalOpen] = useState(false);

  // Registration Modal state (Facebook Style)
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [regRole, setRegRole] = useState<'student' | 'teacher' | 'family' | 'admin'>('student');
  const [regFullName, setRegFullName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [acceptDataPolicy, setAcceptDataPolicy] = useState(false);

  // Dynamic role-specific fields
  // Student fields (6 Grades, each with 2 groups: 6°1, 6°2 up to 11°1, 11°2)
  const [regGradeLevel, setRegGradeLevel] = useState('6°1');
  const [regStudentCode, setRegStudentCode] = useState('');
  const [regShift, setRegShift] = useState('Jornada Mañana (6:15 AM - 12:15 PM)');

  // Teacher fields
  const [regSubjectArea, setRegSubjectArea] = useState('Tecnología e Informática');
  const [regEmployeeId, setRegEmployeeId] = useState('');
  const [regAssignedGrades, setRegAssignedGrades] = useState('6°1, 6°2 y 7°1');

  // Family / Guardian fields
  const [regRelationship, setRegRelationship] = useState('Madre de familia');
  const [regGuardianDocId, setRegGuardianDocId] = useState('');
  const [regRepresentedStudentName, setRegRepresentedStudentName] = useState('');
  const [regRepresentedStudentCode, setRegRepresentedStudentCode] = useState('');
  const [regEmergencyPhone, setRegEmergencyPhone] = useState('');

  // Administrative fields (4th role)
  const [regAdminPosition, setRegAdminPosition] = useState('Coordinación Académica');
  const [regAdminDocId, setRegAdminDocId] = useState('');
  const [regAdminEmployeeCode, setRegAdminEmployeeCode] = useState('');

  // Register status states
  const [regLoading, setRegLoading] = useState(false);
  const [regError, setRegError] = useState<string | null>(null);
  const [regSuccess, setRegSuccess] = useState<string | null>(null);

  // Password validation helper tests
  const passHasUpper = /[A-Z]/.test(regPassword);
  const passHasLower = /[a-z]/.test(regPassword);
  const passHasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(regPassword);
  const passHasMinLength = regPassword.length >= 8;

  // Grade options: Grados 6° a 11° (grupos 1 y 2) y Pensar
  const GRADE_OPTIONS = [
    '6°1', '6°2',
    '7°1', '7°2',
    '8°1', '8°2',
    '9°1', '9°2',
    '10°1', '10°2',
    '11°1', '11°2',
    'Pensar'
  ];

  // Handle Login submission
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    if (!identifier.trim()) {
      setLoginError('Por favor ingresa tu correo electrónico o número de documento de identidad.');
      return;
    }

    if (!loginPassword) {
      setLoginError('Por favor ingresa tu contraseña.');
      return;
    }

    setIsLoading(true);

    try {
      const userProfile = await loginUser(identifier, loginPassword);
      onLoginSuccess(userProfile);
    } catch (err: any) {
      setLoginError(err.message || 'Error al iniciar sesión en la plataforma.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Registration submission
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError(null);
    setRegSuccess(null);

    if (!regFullName.trim()) {
      setRegError('Por favor ingresa tu nombre completo.');
      return;
    }

    if (!regEmail.trim()) {
      setRegError('Por favor ingresa tu correo electrónico institucional o personal.');
      return;
    }

    // Password validations: minimum 8 characters, uppercase, lowercase, special character
    if (!passHasMinLength) {
      setRegError('La contraseña debe tener un mínimo de 8 caracteres.');
      return;
    }

    if (!passHasUpper) {
      setRegError('La contraseña debe incluir al menos una letra mayúscula (A-Z).');
      return;
    }

    if (!passHasLower) {
      setRegError('La contraseña debe incluir al menos una letra minúscula (a-z).');
      return;
    }

    if (!passHasSpecial) {
      setRegError('La contraseña debe incluir al menos un carácter especial (ejemplo: !@#$%&*).');
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setRegError('Las contraseñas no coinciden. Por favor verifícalas cuidadosamente.');
      return;
    }

    // Data treatment policy acceptance validation
    if (!acceptDataPolicy) {
      setRegError('Debes marcar la casilla para aceptar la política de tratamiento y protección de datos.');
      return;
    }

    // Role-specific validation
    if (regRole === 'student' && !regStudentCode.trim()) {
      setRegError('Por favor ingresa tu número de documento de identidad (TI / CC) o código estudiantil.');
      return;
    }

    if (regRole === 'teacher' && !regEmployeeId.trim()) {
      setRegError('Por favor ingresa tu número de documento de identidad (cédula).');
      return;
    }

    if (regRole === 'family' && !regGuardianDocId.trim()) {
      setRegError('Por favor ingresa tu número de documento de identidad como acudiente.');
      return;
    }

    if (regRole === 'admin' && !regAdminDocId.trim()) {
      setRegError('Por favor ingresa tu número de documento de identidad (cédula) de personal administrativo.');
      return;
    }

    setRegLoading(true);

    try {
      const selectedDocId = 
        regRole === 'student' ? regStudentCode.trim() :
        regRole === 'teacher' ? regEmployeeId.trim() :
        regRole === 'admin' ? regAdminDocId.trim() :
        regGuardianDocId.trim() || regRepresentedStudentCode.trim();

      const newProfile = await registerNewUser({
        email: regEmail,
        password: regPassword,
        fullName: regFullName,
        role: regRole,
        documentId: selectedDocId,
        gradeLevel: regRole === 'student' ? regGradeLevel : undefined,
        studentCode: regRole === 'student' ? regStudentCode : undefined,
        shift: regRole === 'student' ? regShift : undefined,
        subjectArea: regRole === 'teacher' ? regSubjectArea : undefined,
        employeeId: regRole === 'teacher' ? regEmployeeId : regRole === 'admin' ? regAdminEmployeeCode : undefined,
        assignedGrades: regRole === 'teacher' ? regAssignedGrades : undefined,
        relationship: regRole === 'family' ? regRelationship : undefined,
        representedStudentName: regRole === 'family' ? regRepresentedStudentName : undefined,
        representedStudentCode: regRole === 'family' ? regRepresentedStudentCode : undefined,
        emergencyPhone: regRole === 'family' ? regEmergencyPhone : undefined,
        adminPosition: regRole === 'admin' ? regAdminPosition : undefined,
        department: regRole === 'admin' ? 'Dirección y Coordinación Institucional' : undefined
      });

      setRegSuccess('¡Cuenta registrada con éxito! Ingresando...');
      setTimeout(() => {
        setIsRegisterModalOpen(false);
        onLoginSuccess(newProfile);
      }, 700);
    } catch (err: any) {
      setRegError(err.message || 'Error al completar el registro.');
    } finally {
      setRegLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#080d1a] via-[#0f172a] to-[#1e3a8a] text-slate-100 flex flex-col justify-between font-sans selection:bg-cyan-500/30 selection:text-cyan-200 relative overflow-x-hidden">
      
      {/* ========================================================================= */}
      {/* 1. DYNAMIC CELESTIAL ATMOSPHERE: Radial Glows, Twinkling & Shooting Stars */}
      {/* ========================================================================= */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        {/* Deep ambient radial glows */}
        <div className="absolute -top-32 -left-32 w-[520px] h-[520px] rounded-full bg-cyan-600/15 blur-[120px]" />
        <div className="absolute top-1/4 -right-32 w-[600px] h-[600px] rounded-full bg-blue-700/20 blur-[140px]" />
        <div className="absolute bottom-10 left-1/3 w-[480px] h-[480px] rounded-full bg-teal-500/10 blur-[110px]" />

        {/* Shooting Stars (Estrellas Fugaces) */}
        <div className="absolute top-12 right-12 w-36 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-white rounded-full animate-shooting-star-1 opacity-0 shadow-[0_0_12px_#22d3ee]" />
        <div className="absolute top-1/4 right-1/3 w-48 h-[2px] bg-gradient-to-r from-transparent via-teal-300 to-white rounded-full animate-shooting-star-2 opacity-0 shadow-[0_0_14px_#06b6d4]" />
        <div className="absolute top-1/3 right-16 w-40 h-[2px] bg-gradient-to-r from-transparent via-blue-400 to-white rounded-full animate-shooting-star-3 opacity-0 shadow-[0_0_12px_#38bdf8]" />

        {/* Floating Twinkling Stars (Electric Blue, Aquamarine, Cyan, White) */}
        <div className="absolute top-16 left-20 w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee] animate-twinkle-slow" />
        <div className="absolute top-28 left-1/3 w-2 h-2 rounded-full bg-[#06b6d4] shadow-[0_0_10px_#06b6d4] animate-twinkle-fast" />
        <div className="absolute top-44 left-1/4 w-1 h-1 rounded-full bg-white shadow-[0_0_6px_#ffffff] animate-twinkle-slow" style={{ animationDelay: '1.2s' }} />
        <div className="absolute top-14 right-1/4 w-1.5 h-1.5 rounded-full bg-teal-300 shadow-[0_0_8px_#5eead4] animate-twinkle-fast" style={{ animationDelay: '0.6s' }} />
        <div className="absolute top-36 right-1/3 w-2 h-2 rounded-full bg-blue-400 shadow-[0_0_10px_#60a5fa] animate-twinkle-slow" style={{ animationDelay: '2.1s' }} />
        <div className="absolute top-64 right-20 w-1.5 h-1.5 rounded-full bg-cyan-300 shadow-[0_0_8px_#67e8f9] animate-twinkle-fast" style={{ animationDelay: '1.7s' }} />
        <div className="absolute top-80 left-16 w-2 h-2 rounded-full bg-teal-400 shadow-[0_0_10px_#2dd4bf] animate-twinkle-slow" style={{ animationDelay: '0.9s' }} />
        <div className="absolute top-96 left-2/5 w-1 h-1 rounded-full bg-white shadow-[0_0_6px_#ffffff] animate-twinkle-fast" style={{ animationDelay: '2.5s' }} />
        <div className="absolute bottom-40 left-24 w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee] animate-twinkle-slow" style={{ animationDelay: '1.4s' }} />
        <div className="absolute bottom-28 right-1/4 w-2 h-2 rounded-full bg-blue-300 shadow-[0_0_10px_#93c5fd] animate-twinkle-fast" style={{ animationDelay: '0.4s' }} />
        <div className="absolute bottom-60 right-16 w-1 h-1 rounded-full bg-[#06b6d4] shadow-[0_0_6px_#06b6d4] animate-twinkle-slow" style={{ animationDelay: '1.9s' }} />
      </div>

      {/* Main container: Two-column layout (Brand Identity + Glassmorphism Login Card) */}
      <main className="relative z-10 w-full max-w-[1160px] mx-auto pt-8 sm:pt-12 lg:pt-14 pb-12 px-4 sm:px-6 flex-1 flex flex-col lg:flex-row items-center lg:items-start justify-between gap-10 lg:gap-12">
        
        {/* Left Column: Brand Identity, Free Floating Glowing Tree Logo, Content & Institutional Contact */}
        <section className="w-full lg:w-[620px] text-left flex flex-col items-center lg:items-start">
          
          {/* Top Institutional Eyebrow */}
          <div className="flex flex-wrap items-center gap-2 mb-3 justify-center lg:justify-start">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/15 border border-cyan-400/30 text-cyan-300 text-xs font-bold uppercase tracking-wider shadow-xs">
              <span className="material-symbols-outlined text-[15px]">account_balance</span>
              Portal Institucional Oficial
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900/60 border border-slate-700/60 text-slate-300 text-xs font-medium backdrop-blur-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              I.E. Vallejuelos • Medellín
            </span>
          </div>

          {/* 1. Page Name: Title with Capital Initials "Edulink School" */}
          <div className="w-full flex items-center justify-center lg:justify-start gap-2.5 mb-1">
            <span className="text-white font-black text-4xl sm:text-5xl lg:text-[54px] tracking-tight leading-none drop-shadow-md">
              Edulink
            </span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-teal-300 to-sky-300 font-black text-4xl sm:text-5xl lg:text-[54px] tracking-tight leading-none drop-shadow-md">
              School
            </span>
          </div>
          <p className="text-xs sm:text-sm font-semibold text-cyan-200/80 tracking-wide mb-3 text-center lg:text-left">
            Sistema Integral de Gestión Académica y Comunitaria
          </p>

          {/* 2. Logo: Free Floating Tree (No White Box), Glowing Leaves & Progressively Illuminated Cyan Roots */}
          <div className="w-full flex justify-center items-center my-3 relative py-4">
            {/* Ambient pulsating backdrop aura */}
            <div className="absolute w-52 h-52 sm:w-64 sm:h-64 rounded-full bg-gradient-to-tr from-cyan-500/25 via-blue-600/30 to-teal-400/25 blur-3xl pointer-events-none animate-pulse-glow" />

            {/* Tree roots progressive aquamarine/cyan illumination glow */}
            <div className="absolute bottom-4 w-40 sm:w-56 h-14 bg-gradient-to-r from-teal-400/40 via-cyan-400/70 to-blue-500/40 rounded-full blur-xl pointer-events-none animate-root-pulse" />

            {/* Sparkle 1: Top Right - Cyan */}
            <div className="absolute -top-1 right-1/4 sm:right-1/3 text-cyan-300 animate-sparkle-1 pointer-events-none">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5L12 0Z" />
              </svg>
            </div>

            {/* Sparkle 2: Top Left - Aquamarine */}
            <div className="absolute top-2 left-1/4 sm:left-1/3 text-teal-300 animate-sparkle-2 pointer-events-none">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5L12 0Z" />
              </svg>
            </div>

            {/* Sparkle 3: Bottom Right - Electric Blue */}
            <div className="absolute bottom-2 right-1/4 sm:right-1/3 text-blue-400 animate-sparkle-3 pointer-events-none">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5L12 0Z" />
              </svg>
            </div>

            {/* Sparkle 4: Bottom Left - Bright Cyan */}
            <div className="absolute -bottom-1 left-1/4 sm:left-1/3 text-cyan-400 animate-sparkle-4 pointer-events-none">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5L12 0Z" />
              </svg>
            </div>

            {/* Sparkle 5: Far Right - Soft Ice Blue */}
            <div className="absolute top-1/2 -right-1 sm:right-1/4 text-teal-200 animate-sparkle-5 pointer-events-none">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5L12 0Z" />
              </svg>
            </div>

            {/* Transparent, Freely Floating Tree Logo with Glowing Breathing Animation */}
            <div className="relative z-10 w-36 h-36 sm:w-44 sm:h-44 lg:w-48 lg:h-48 flex items-center justify-center animate-tree-glow cursor-pointer transition-transform hover:scale-105">
              <img
                src={ASSETS.logo}
                alt="Edulink School Logo"
                className="w-full h-full object-contain filter drop-shadow-[0_8px_20px_rgba(6,182,212,0.4)]"
              />
            </div>
          </div>

          {/* 3. Text below the Logo */}
          <h2 className="text-white text-xl sm:text-2xl lg:text-[27px] font-bold leading-snug max-w-[560px] mb-3 tracking-tight text-center lg:text-left drop-shadow-sm">
            Plataforma institucional de gestión curricular, calificaciones y comunidad académica.
          </h2>

          <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-[540px] mb-5 text-center lg:text-left">
            Conecta en tiempo real a estudiantes, docentes, acudientes y equipo directivo en un entorno seguro y unificado.
          </p>

          {/* 4. Jornada & COMUNIDAD (Glassmorphism Cards) */}
          <div className="w-full max-w-[560px] mb-5 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Jornada */}
            <div className="p-4 rounded-2xl bg-slate-900/65 backdrop-blur-md border border-cyan-500/20 shadow-lg shadow-black/20 flex items-center gap-3.5 transition-all hover:border-cyan-400/40">
              <div className="w-11 h-11 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 flex items-center justify-center shrink-0 shadow-inner">
                <span className="material-symbols-outlined text-[24px]">schedule</span>
              </div>
              <div>
                <span className="block text-[11px] font-bold text-cyan-400 uppercase tracking-wider">Jornada</span>
                <span className="text-sm sm:text-base font-extrabold text-white">6:15 AM - 12:15 PM</span>
                <span className="block text-[11px] text-slate-400">Jornada Mañana</span>
              </div>
            </div>

            {/* COMUNIDAD (Un solo bloque limpio y directo) */}
            <div className="p-4 rounded-2xl bg-slate-900/65 backdrop-blur-md border border-teal-500/25 shadow-lg shadow-black/20 flex items-start gap-3.5 transition-all hover:border-teal-400/45">
              <div className="w-11 h-11 rounded-xl bg-teal-500/15 border border-teal-500/30 text-teal-300 flex items-center justify-center shrink-0 shadow-inner mt-0.5">
                <span className="material-symbols-outlined text-[24px]">groups</span>
              </div>
              <div className="min-w-0">
                <span className="block text-[11px] font-bold text-teal-400 uppercase tracking-wider">COMUNIDAD</span>
                <span className="text-sm sm:text-base font-extrabold text-white block">Grados 6° a 11° y Grado Pensar</span>
                <p className="text-[11px] text-slate-300 leading-snug mt-1 font-medium">
                  Grupos: 6°1, 6°2, 7°1, 7°2, 8°1, 8°2, 9°1, 9°2, 10°1, 10°2, 11°1, 11°2 y Pensar.
                </p>
              </div>
            </div>
          </div>

          {/* 5. Institutional Location & Contact Card (from Google Maps capture) */}
          <div className="w-full max-w-[560px] bg-slate-900/65 backdrop-blur-md rounded-2xl border border-cyan-500/20 shadow-lg shadow-black/20 p-4 sm:p-5 text-left transition-all hover:border-cyan-400/35">
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-800/80 mb-3">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-white leading-tight">
                  Institución Educativa Vallejuelos
                </h3>
                <p className="text-xs sm:text-sm text-cyan-300/80 mt-0.5">
                  Escuela de enseñanza general en Medellín
                </p>
              </div>
              <div className="w-9 h-9 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[20px]">school</span>
              </div>
            </div>

            <div className="space-y-2.5 text-xs sm:text-sm">
              {/* Dirección */}
              <div className="flex items-start gap-2.5">
                <span className="material-symbols-outlined text-[20px] text-rose-400 shrink-0 mt-0.5">
                  location_on
                </span>
                <div className="text-slate-300 leading-relaxed">
                  <strong className="text-white">Dirección:</strong> Cra. 104c #20, Santa Margarita, Medellín, Robledo, Medellín, Antioquia
                </div>
              </div>

              {/* Teléfono */}
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-[20px] text-cyan-400 shrink-0">
                  call
                </span>
                <div className="text-slate-300">
                  <strong className="text-white">Teléfono:</strong>{' '}
                  <a
                    href="tel:3004175616"
                    className="text-cyan-400 hover:text-cyan-300 font-semibold hover:underline cursor-pointer"
                  >
                    300 4175616
                  </a>
                </div>
              </div>

              {/* Horario */}
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-[20px] text-teal-400 shrink-0">
                  schedule
                </span>
                <div className="text-slate-300">
                  <strong className="text-white">Horario:</strong>{' '}
                  <span className="text-emerald-400 font-bold">Abierto</span>
                  <span className="text-slate-400"> · Cierra a las 5:30 p.m.</span>
                </div>
              </div>
            </div>
          </div>

        </section>

        {/* ========================================================================= */}
        {/* Right Column: Glassmorphism Login Card with Aquamarine Glowing Accents   */}
        {/* ========================================================================= */}
        <section className="w-full max-w-[440px] flex flex-col items-center">
          <div className="bg-slate-900/70 backdrop-blur-xl rounded-3xl p-7 sm:p-9 w-full border border-cyan-500/30 shadow-[0_8px_32px_0_rgba(6,182,212,0.18)] flex flex-col gap-5 relative overflow-hidden transition-all duration-300 hover:border-cyan-400/50 hover:shadow-[0_12px_40px_0_rgba(6,182,212,0.25)]">
            
            {/* Soft aquamarine light bar along the top edge */}
            <div className="absolute top-0 left-1/4 right-1/4 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent pointer-events-none" />

            <div className="pb-1 border-b border-slate-800/80">
              <h3 className="text-2xl font-bold text-white tracking-tight">Iniciar Sesión</h3>
              <p className="text-sm text-slate-300 mt-1">Ingresa tus credenciales institucionales de acceso</p>
            </div>

            {/* Login Form */}
            <form onSubmit={handleLoginSubmit} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-bold text-cyan-300 uppercase tracking-wider mb-1.5">
                  Correo electrónico o documento de identidad
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 material-symbols-outlined text-[22px] text-cyan-400/80">
                    badge
                  </span>
                  <input
                    type="text"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder=""
                    className="w-full pl-11 pr-4 py-3.5 text-base bg-slate-950/60 border border-slate-700/80 rounded-xl focus:bg-slate-900/90 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/25 outline-none text-white transition-all"
                    autoComplete="username"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-cyan-300 uppercase tracking-wider mb-1.5">
                  Contraseña
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 material-symbols-outlined text-[22px] text-cyan-400/80">
                    lock
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder=""
                    className="w-full pl-11 pr-12 py-3.5 text-base bg-slate-950/60 border border-slate-700/80 rounded-xl focus:bg-slate-900/90 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/25 outline-none text-white transition-all"
                    autoComplete="current-password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-cyan-300 p-1 cursor-pointer transition-colors"
                    title={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                  >
                    <span className="material-symbols-outlined text-[22px]">
                      {showPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Error message in dark rose glass style */}
              {loginError && (
                <div className="p-3.5 bg-rose-950/70 border border-rose-500/40 text-rose-200 text-sm rounded-xl flex items-start gap-2.5 animate-in fade-in">
                  <span className="material-symbols-outlined text-[20px] text-rose-400 shrink-0 mt-0.5">error</span>
                  <div className="leading-snug">
                    <strong className="block font-bold text-rose-100">Error de Acceso:</strong>
                    <span>{loginError}</span>
                  </div>
                </div>
              )}

              {/* Login Button with Blue-Aquamarine Gradient & Hover Elevation */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-1 bg-gradient-to-r from-blue-600 via-cyan-600 to-teal-500 hover:from-blue-500 hover:via-cyan-500 hover:to-teal-400 active:opacity-90 text-white font-bold text-base py-3.5 rounded-xl transition-all duration-200 cursor-pointer text-center shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/45 hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2 disabled:opacity-75"
              >
                {isLoading ? (
                  <>
                    <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Verificando credenciales...</span>
                  </>
                ) : (
                  <>
                    <span>Iniciar sesión</span>
                    <span className="material-symbols-outlined text-[22px]">arrow_forward</span>
                  </>
                )}
              </button>
            </form>

            {/* Forgot password link */}
            <div className="text-center pt-1">
              <button
                id="btn-forgot-password"
                type="button"
                onClick={() => {
                  setLoginError(null);
                  setIsRecoveryModalOpen(true);
                }}
                className="text-cyan-400 hover:text-cyan-300 text-sm font-semibold hover:underline cursor-pointer transition-colors"
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>

            {/* Divider line */}
            <div className="relative my-1">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-800" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-slate-900/95 px-3 text-slate-400 font-semibold text-xs tracking-wider border border-slate-800 rounded-full py-0.5">
                  ¿Nuevo en Edulink School?
                </span>
              </div>
            </div>

            {/* Create New Account Button */}
            <div className="text-center">
              <button
                type="button"
                onClick={() => {
                  setRegError(null);
                  setRegSuccess(null);
                  setIsRegisterModalOpen(true);
                }}
                className="w-full bg-slate-800/80 hover:bg-slate-700/80 active:bg-slate-800 border border-cyan-500/30 hover:border-cyan-400/60 text-white font-bold text-base px-5 py-3.5 rounded-xl cursor-pointer transition-all duration-150 shadow-sm flex items-center justify-center gap-2 active:scale-[0.99] hover:shadow-cyan-500/10"
              >
                <span className="material-symbols-outlined text-[22px] text-cyan-400">person_add</span>
                <span>Crear cuenta nueva</span>
              </button>
            </div>
          </div>

          {/* Subtext below login card */}
          <p className="text-xs text-slate-400 text-center mt-6 leading-relaxed max-w-[380px]">
            Acceso institucional protegido mediante credenciales cifradas y validación oficial.
          </p>
        </section>
      </main>

      {/* Institutional Footer */}
      <footer className="relative z-10 w-full bg-slate-950/80 backdrop-blur-md border-t border-cyan-500/15 py-6 text-slate-400 text-sm">
        <div className="max-w-[1080px] mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div className="flex items-center gap-2 text-white font-semibold">
            <img src={ASSETS.logo} alt="" className="w-6 h-6 object-contain filter drop-shadow-[0_0_6px_rgba(6,182,212,0.6)]" />
            <span>Edulink School © 2026 • Institución Educativa Vallejuelos</span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-4 text-slate-400">
            <span className="hover:text-cyan-300 cursor-pointer transition-colors">Manual de Convivencia</span>
            <span>•</span>
            <span className="hover:text-cyan-300 cursor-pointer transition-colors">Soporte Técnico</span>
            <span>•</span>
            <span className="hover:text-cyan-300 cursor-pointer transition-colors">Secretaría de Educación</span>
          </div>
        </div>
      </footer>

      {/* ========================================================================= */}
      {/* REGISTRATION MODAL WITH 4 ROLES, DATA POLICY & HARDENED PASSWORD RULES     */}
      {/* ========================================================================= */}
      {isRegisterModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#0b1c30]/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[620px] my-6 border border-[#e5eeff] overflow-hidden flex flex-col max-h-[92vh]">
            
            {/* Modal Header */}
            <div className="p-5 sm:p-6 flex items-start justify-between border-b border-[#e5eeff] bg-[#f8f9ff] shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-[#00288e] text-white flex items-center justify-center shadow-sm shrink-0">
                  <span className="material-symbols-outlined text-[26px]">person_add</span>
                </div>
                <div>
                  <h3 className="text-xl sm:text-2xl font-bold text-[#0b1c30] leading-tight">
                    Crear Cuenta Institucional
                  </h3>
                  <p className="text-sm text-[#444653] mt-1">
                    Selecciona tu rol para configurar tu perfil institucional
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsRegisterModalOpen(false)}
                className="w-9 h-9 rounded-full flex items-center justify-center text-[#757684] hover:bg-[#e5eeff] hover:text-[#0b1c30] cursor-pointer transition-colors"
                title="Cerrar"
              >
                <span className="material-symbols-outlined text-[24px]">close</span>
              </button>
            </div>

            {/* Modal Body (Scrollable Form) */}
            <div className="p-5 sm:p-7 overflow-y-auto flex-1 flex flex-col gap-5">
              
              <form onSubmit={handleRegisterSubmit} className="flex flex-col gap-5">
                
                {/* 1. SELECCIÓN DE LOS 4 ROLES (Estudiante, Docente, Acudiente, Administrativo) */}
                <div className="bg-[#eff4ff] p-4 sm:p-5 rounded-2xl border border-[#dce9ff]">
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm font-bold text-[#00288e] uppercase tracking-wider flex items-center gap-2">
                      <span className="material-symbols-outlined text-[20px] text-[#00288e]">badge</span>
                      <span>Rol con el que te registrarás:</span>
                    </label>
                    <span className="text-xs px-2.5 py-1 rounded-full bg-[#00288e]/10 text-[#00288e] font-bold">
                      Obligatorio
                    </span>
                  </div>

                  {/* 4 Role Selection Tiles */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    <button
                      type="button"
                      onClick={() => setRegRole('student')}
                      className={`p-3 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1.5 ${
                        regRole === 'student'
                          ? 'bg-white border-[#00288e] shadow-sm text-[#00288e] ring-2 ring-[#00288e]/20 font-bold'
                          : 'bg-white/70 border-[#dce9ff] text-[#444653] hover:bg-white hover:text-[#0b1c30]'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[26px]">school</span>
                      <span className="text-sm font-bold leading-tight">Estudiante</span>
                      <span className="text-xs text-[#757684]">Alumno</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setRegRole('teacher')}
                      className={`p-3 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1.5 ${
                        regRole === 'teacher'
                          ? 'bg-white border-[#00288e] shadow-sm text-[#00288e] ring-2 ring-[#00288e]/20 font-bold'
                          : 'bg-white/70 border-[#dce9ff] text-[#444653] hover:bg-white hover:text-[#0b1c30]'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[26px]">menu_book</span>
                      <span className="text-sm font-bold leading-tight">Docente</span>
                      <span className="text-xs text-[#757684]">Profesor</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setRegRole('family')}
                      className={`p-3 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1.5 ${
                        regRole === 'family'
                          ? 'bg-white border-[#00288e] shadow-sm text-[#00288e] ring-2 ring-[#00288e]/20 font-bold'
                          : 'bg-white/70 border-[#dce9ff] text-[#444653] hover:bg-white hover:text-[#0b1c30]'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[26px]">family_restroom</span>
                      <span className="text-sm font-bold leading-tight">Acudiente</span>
                      <span className="text-xs text-[#757684]">Familia</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setRegRole('admin')}
                      className={`p-3 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1.5 ${
                        regRole === 'admin'
                          ? 'bg-white border-[#00288e] shadow-sm text-[#00288e] ring-2 ring-[#00288e]/20 font-bold'
                          : 'bg-white/70 border-[#dce9ff] text-[#444653] hover:bg-white hover:text-[#0b1c30]'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[26px]">admin_panel_settings</span>
                      <span className="text-sm font-bold leading-tight">Administrativo</span>
                      <span className="text-xs text-[#757684]">Coordinación</span>
                    </button>
                  </div>
                </div>

                {/* 2. CAMPOS CORRESPONDIENTES AL ROL */}
                
                {/* CASE A: ROL ESTUDIANTE */}
                {regRole === 'student' && (
                  <div className="bg-[#eff4ff] border border-[#b8c4ff] rounded-2xl p-5 flex flex-col gap-4 animate-in fade-in">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-xl bg-[#00288e] text-white flex items-center justify-center shrink-0 shadow-xs">
                        <span className="material-symbols-outlined text-[20px]">school</span>
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-[#00288e]">
                          Información Académica del Estudiante
                        </h4>
                        <p className="text-xs text-[#444653] leading-relaxed mt-0.5">
                          Acceso a asignaturas, calificaciones de los cuatro períodos, entrega de talleres y boletines escolares.
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                      <div>
                        <label className="block text-xs font-bold text-[#0b1c30] mb-1.5">
                          Grado y Grupo *
                        </label>
                        <select
                          value={regGradeLevel}
                          onChange={(e) => setRegGradeLevel(e.target.value)}
                          className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#dce9ff] rounded-xl focus:border-[#00288e] focus:ring-1 focus:ring-[#00288e] outline-none text-[#0b1c30]"
                        >
                          {GRADE_OPTIONS.map(g => (
                            <option key={g} value={g}>Grado {g}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-[#0b1c30] mb-1.5">
                          Documento de Identidad (TI / CC) o Código *
                        </label>
                        <input
                          type="text"
                          value={regStudentCode}
                          onChange={(e) => setRegStudentCode(e.target.value)}
                          placeholder=""
                          className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#dce9ff] rounded-xl focus:border-[#00288e] focus:ring-1 focus:ring-[#00288e] outline-none text-[#0b1c30]"
                          required
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-xs font-bold text-[#0b1c30] mb-1.5">
                          Jornada Escolar Oficial
                        </label>
                        <select
                          value={regShift}
                          onChange={(e) => setRegShift(e.target.value)}
                          className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#dce9ff] rounded-xl focus:border-[#00288e] focus:ring-1 focus:ring-[#00288e] outline-none text-[#0b1c30]"
                        >
                          <option value="Jornada Mañana (6:15 AM - 12:15 PM)">Jornada Mañana (6:15 AM - 12:15 PM)</option>
                          <option value="Jornada Tarde (12:15 PM - 6:15 PM)">Jornada Tarde (12:15 PM - 6:15 PM)</option>
                          <option value="Jornada Única Institucional">Jornada Única Institucional</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {/* CASE B: ROL DOCENTE */}
                {regRole === 'teacher' && (
                  <div className="bg-[#eef2ff] border border-[#c7d2fe] rounded-2xl p-5 flex flex-col gap-4 animate-in fade-in">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-xl bg-[#1e40af] text-white flex items-center justify-center shrink-0 shadow-xs">
                        <span className="material-symbols-outlined text-[20px]">menu_book</span>
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-[#1e40af]">
                          Información Docente y Grupos a Cargo
                        </h4>
                        <p className="text-xs text-[#444653] leading-relaxed mt-0.5">
                          Ingreso y registro de calificaciones en planilla oficial, control de asistencia y asignación de talleres para grupos 6°1 a 11°2.
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                      <div>
                        <label className="block text-xs font-bold text-[#0b1c30] mb-1.5">
                          Área o Asignatura Principal *
                        </label>
                        <select
                          value={regSubjectArea}
                          onChange={(e) => setRegSubjectArea(e.target.value)}
                          className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#c7d2fe] rounded-xl focus:border-[#1e40af] focus:ring-1 focus:ring-[#1e40af] outline-none text-[#0b1c30]"
                        >
                          <option value="Tecnología e Informática">Tecnología e Informática</option>
                          <option value="Matemáticas y Geometría">Matemáticas y Geometría</option>
                          <option value="Ciencias Naturales y Química">Ciencias Naturales y Química</option>
                          <option value="Lengua Castellana">Lengua Castellana</option>
                          <option value="Ciencias Sociales e Historia">Ciencias Sociales e Historia</option>
                          <option value="Inglés y Bilingüismo">Inglés y Bilingüismo</option>
                          <option value="Educación Física y Deportes">Educación Física y Deportes</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-[#0b1c30] mb-1.5">
                          Número de Documento de Identidad (Cédula) *
                        </label>
                        <input
                          type="text"
                          value={regEmployeeId}
                          onChange={(e) => setRegEmployeeId(e.target.value)}
                          placeholder=""
                          className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#c7d2fe] rounded-xl focus:border-[#1e40af] focus:ring-1 focus:ring-[#1e40af] outline-none text-[#0b1c30]"
                          required
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-xs font-bold text-[#0b1c30] mb-1.5">
                          Grupos Asignados (ej: 6°1, 6°2, 7°1)
                        </label>
                        <input
                          type="text"
                          value={regAssignedGrades}
                          onChange={(e) => setRegAssignedGrades(e.target.value)}
                          placeholder=""
                          className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#c7d2fe] rounded-xl focus:border-[#1e40af] focus:ring-1 focus:ring-[#1e40af] outline-none text-[#0b1c30]"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* CASE C: ROL ACUDIENTE / FAMILIA */}
                {regRole === 'family' && (
                  <div className="bg-[#fff7ed] border border-[#ffedd5] rounded-2xl p-5 flex flex-col gap-4 animate-in fade-in">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-xl bg-[#c2410c] text-white flex items-center justify-center shrink-0 shadow-xs">
                        <span className="material-symbols-outlined text-[20px]">family_restroom</span>
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-[#9a3412]">
                          Información Familiar y Estudiante a Cargo
                        </h4>
                        <p className="text-xs text-[#444653] leading-relaxed mt-0.5">
                          Consulta de boletín de notas, seguimiento de asistencia escolar, recepción de circulares oficiales y comunicación con docentes.
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                      <div>
                        <label className="block text-xs font-bold text-[#0b1c30] mb-1.5">
                          Parentesco con el Estudiante *
                        </label>
                        <select
                          value={regRelationship}
                          onChange={(e) => setRegRelationship(e.target.value)}
                          className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#fed7aa] rounded-xl focus:border-[#c2410c] focus:ring-1 focus:ring-[#c2410c] outline-none text-[#0b1c30]"
                        >
                          <option value="Madre de familia">Madre de familia</option>
                          <option value="Padre de familia">Padre de familia</option>
                          <option value="Acudiente Legal Autorizado">Acudiente Legal Autorizado</option>
                          <option value="Tutor(a) / Familiar Cercano">Tutor(a) / Familiar Cercano</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-[#0b1c30] mb-1.5">
                          Número de Documento de Identidad del Acudiente *
                        </label>
                        <input
                          type="text"
                          value={regGuardianDocId}
                          onChange={(e) => setRegGuardianDocId(e.target.value)}
                          placeholder=""
                          className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#fed7aa] rounded-xl focus:border-[#c2410c] focus:ring-1 focus:ring-[#c2410c] outline-none text-[#0b1c30]"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-[#0b1c30] mb-1.5">
                          Teléfono de Contacto Familiar *
                        </label>
                        <input
                          type="text"
                          value={regEmergencyPhone}
                          onChange={(e) => setRegEmergencyPhone(e.target.value)}
                          placeholder=""
                          className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#fed7aa] rounded-xl focus:border-[#c2410c] focus:ring-1 focus:ring-[#c2410c] outline-none text-[#0b1c30]"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-[#0b1c30] mb-1.5">
                          Documento de Identidad del Estudiante
                        </label>
                        <input
                          type="text"
                          value={regRepresentedStudentCode}
                          onChange={(e) => setRegRepresentedStudentCode(e.target.value)}
                          placeholder=""
                          className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#fed7aa] rounded-xl focus:border-[#c2410c] focus:ring-1 focus:ring-[#c2410c] outline-none text-[#0b1c30]"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-xs font-bold text-[#0b1c30] mb-1.5">
                          Nombre Completo del Estudiante Representado *
                        </label>
                        <input
                          type="text"
                          value={regRepresentedStudentName}
                          onChange={(e) => setRegRepresentedStudentName(e.target.value)}
                          placeholder=""
                          className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#fed7aa] rounded-xl focus:border-[#c2410c] focus:ring-1 focus:ring-[#c2410c] outline-none text-[#0b1c30]"
                          required
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* CASE D: ROL ADMINISTRATIVO (4th Role) */}
                {regRole === 'admin' && (
                  <div className="bg-[#f0fdf4] border border-[#bbf7d0] rounded-2xl p-5 flex flex-col gap-4 animate-in fade-in">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-xl bg-[#15803d] text-white flex items-center justify-center shrink-0 shadow-xs">
                        <span className="material-symbols-outlined text-[20px]">admin_panel_settings</span>
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-[#15803d]">
                          Información de Personal Administrativo y Directivo
                        </h4>
                        <p className="text-xs text-[#444653] leading-relaxed mt-0.5">
                          Gestión institucional de la I.E. Vallejuelos, supervisión de grupos (6°1 a 11°2), jornada escolar (6:15 AM - 12:15 PM), expedición de certificados y circulares oficiales.
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                      <div>
                        <label className="block text-xs font-bold text-[#0b1c30] mb-1.5">
                          Cargo o Dependencia *
                        </label>
                        <select
                          value={regAdminPosition}
                          onChange={(e) => setRegAdminPosition(e.target.value)}
                          className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#bbf7d0] rounded-xl focus:border-[#15803d] focus:ring-1 focus:ring-[#15803d] outline-none text-[#0b1c30]"
                        >
                          <option value="Coordinación Académica">Coordinación Académica</option>
                          <option value="Rectoría General">Rectoría General</option>
                          <option value="Coordinación de Convivencia">Coordinación de Convivencia</option>
                          <option value="Secretaría General & Matrículas">Secretaría General & Matrículas</option>
                          <option value="Orientación Escolar y Psicosocial">Orientación Escolar y Psicosocial</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-[#0b1c30] mb-1.5">
                          Documento de Identidad (Cédula de Ciudadanía) *
                        </label>
                        <input
                          type="text"
                          value={regAdminDocId}
                          onChange={(e) => setRegAdminDocId(e.target.value)}
                          placeholder=""
                          className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#bbf7d0] rounded-xl focus:border-[#15803d] focus:ring-1 focus:ring-[#15803d] outline-none text-[#0b1c30]"
                          required
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-xs font-bold text-[#0b1c30] mb-1.5">
                          Código de Empleado o Dependencia Institucional
                        </label>
                        <input
                          type="text"
                          value={regAdminEmployeeCode}
                          onChange={(e) => setRegAdminEmployeeCode(e.target.value)}
                          placeholder=""
                          className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#bbf7d0] rounded-xl focus:border-[#15803d] focus:ring-1 focus:ring-[#15803d] outline-none text-[#0b1c30]"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. CAMPOS GENERALES DE CUENTA (Nombre, Correo, Contraseña) */}
                <div className="flex flex-col gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[#0b1c30] mb-1.5">
                      Nombre Completo *
                    </label>
                    <input
                      type="text"
                      value={regFullName}
                      onChange={(e) => setRegFullName(e.target.value)}
                      placeholder=""
                      className="w-full px-4 py-3 text-base bg-[#f8f9ff] border border-[#dce9ff] rounded-xl focus:bg-white focus:border-[#00288e] focus:ring-1 focus:ring-[#00288e] outline-none text-[#0b1c30]"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#0b1c30] mb-1.5">
                      Correo Electrónico *
                    </label>
                    <input
                      type="email"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder=""
                      className="w-full px-4 py-3 text-base bg-[#f8f9ff] border border-[#dce9ff] rounded-xl focus:bg-white focus:border-[#00288e] focus:ring-1 focus:ring-[#00288e] outline-none text-[#0b1c30]"
                      required
                    />
                  </div>

                  {/* Password with rules and validations */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-xs font-bold text-[#0b1c30] mb-1.5">
                        Contraseña Nueva *
                      </label>
                      <input
                        type={showRegPassword ? 'text' : 'password'}
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        placeholder=""
                        className="w-full px-4 py-3 text-base bg-[#f8f9ff] border border-[#dce9ff] rounded-xl focus:bg-white focus:border-[#00288e] focus:ring-1 focus:ring-[#00288e] outline-none text-[#0b1c30]"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#0b1c30] mb-1.5">
                        Confirmar Contraseña *
                      </label>
                      <input
                        type={showRegPassword ? 'text' : 'password'}
                        value={regConfirmPassword}
                        onChange={(e) => setRegConfirmPassword(e.target.value)}
                        placeholder=""
                        className="w-full px-4 py-3 text-base bg-[#f8f9ff] border border-[#dce9ff] rounded-xl focus:bg-white focus:border-[#00288e] focus:ring-1 focus:ring-[#00288e] outline-none text-[#0b1c30]"
                        required
                      />
                    </div>
                  </div>

                  {/* Password Rule Requirements Checklist */}
                  <div className="p-3.5 bg-[#f8f9ff] border border-[#dce9ff] rounded-xl text-xs space-y-1.5">
                    <span className="font-bold text-[#0b1c30] block mb-1">
                      Requisitos de seguridad para la contraseña:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div className={`flex items-center gap-1.5 font-medium ${passHasMinLength ? 'text-emerald-700' : 'text-[#757684]'}`}>
                        <span className="material-symbols-outlined text-[16px]">
                          {passHasMinLength ? 'check_circle' : 'radio_button_unchecked'}
                        </span>
                        <span>Mínimo 8 caracteres</span>
                      </div>
                      <div className={`flex items-center gap-1.5 font-medium ${passHasUpper ? 'text-emerald-700' : 'text-[#757684]'}`}>
                        <span className="material-symbols-outlined text-[16px]">
                          {passHasUpper ? 'check_circle' : 'radio_button_unchecked'}
                        </span>
                        <span>Una letra mayúscula (A-Z)</span>
                      </div>
                      <div className={`flex items-center gap-1.5 font-medium ${passHasLower ? 'text-emerald-700' : 'text-[#757684]'}`}>
                        <span className="material-symbols-outlined text-[16px]">
                          {passHasLower ? 'check_circle' : 'radio_button_unchecked'}
                        </span>
                        <span>Una letra minúscula (a-z)</span>
                      </div>
                      <div className={`flex items-center gap-1.5 font-medium ${passHasSpecial ? 'text-emerald-700' : 'text-[#757684]'}`}>
                        <span className="material-symbols-outlined text-[16px]">
                          {passHasSpecial ? 'check_circle' : 'radio_button_unchecked'}
                        </span>
                        <span>Un carácter especial (!@#$%&*)</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-[#444653]">
                    <input
                      type="checkbox"
                      id="showRegPass"
                      checked={showRegPassword}
                      onChange={(e) => setShowRegPassword(e.target.checked)}
                      className="w-4 h-4 rounded text-[#00288e] focus:ring-0 cursor-pointer"
                    />
                    <label htmlFor="showRegPass" className="cursor-pointer font-medium select-none">
                      Mostrar contraseñas
                    </label>
                  </div>
                </div>

                {/* 4. CASILLA OBLIGATORIA: POLÍTICA DE USO DE DATOS (User Prompt Requirement) */}
                <div className="flex items-start gap-3 p-4 bg-[#f8f9ff] border border-[#dce9ff] rounded-xl">
                  <input
                    type="checkbox"
                    id="acceptDataPolicy"
                    checked={acceptDataPolicy}
                    onChange={(e) => setAcceptDataPolicy(e.target.checked)}
                    className="mt-1 w-5 h-5 rounded border-gray-300 text-[#00288e] focus:ring-[#00288e] cursor-pointer shrink-0"
                    required
                  />
                  <label htmlFor="acceptDataPolicy" className="text-sm text-[#444653] leading-snug cursor-pointer select-none">
                    Acepto la <span className="font-bold text-[#00288e]">política de uso y tratamiento de datos personales</span> y los términos del servicio educativo institucional de la Institución Educativa Vallejuelos.
                  </label>
                </div>

                {/* Error message displayed at the bottom right before the submit button */}
                {regError && (
                  <div className="p-4 bg-[#ffdad6] border border-[#ba1a1a]/30 text-[#93000a] text-sm rounded-xl flex items-start gap-2.5 animate-in fade-in">
                    <span className="material-symbols-outlined text-[20px] shrink-0 mt-0.5">error</span>
                    <div className="leading-snug">
                      <strong className="block font-bold">Error en el registro:</strong>
                      <span>{regError}</span>
                    </div>
                  </div>
                )}

                {regSuccess && (
                  <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm rounded-xl flex items-start gap-2.5 animate-in fade-in">
                    <span className="material-symbols-outlined text-[20px] shrink-0 mt-0.5">check_circle</span>
                    <span>{regSuccess}</span>
                  </div>
                )}

                {/* Submit button: Says "registrando" when loading */}
                <div className="text-center pt-2">
                  <button
                    type="submit"
                    disabled={regLoading}
                    className="bg-[#00288e] hover:bg-[#001f70] active:bg-[#001453] text-white font-bold text-base py-3.5 px-10 rounded-xl shadow-md shadow-[#00288e]/20 cursor-pointer transition duration-150 active:scale-[0.98] disabled:opacity-75 flex items-center justify-center gap-2 mx-auto"
                  >
                    {regLoading ? (
                      <>
                        <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>registrando</span>
                      </>
                    ) : (
                      <>
                        <span>Registrarse</span>
                        <span className="material-symbols-outlined text-[22px]">how_to_reg</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      {/* Multi-Step Password Recovery Modal */}
      <PasswordRecoveryModal
        isOpen={isRecoveryModalOpen}
        onClose={() => setIsRecoveryModalOpen(false)}
        initialEmail={identifier.includes('@') ? identifier : ''}
        onPasswordResetSuccess={(resetEmail) => {
          setIdentifier(resetEmail);
          setLoginPassword('');
          setLoginError(null);
        }}
      />
    </div>
  );
};
