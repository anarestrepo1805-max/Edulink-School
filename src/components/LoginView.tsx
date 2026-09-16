import React, { useState } from 'react';
import { UserRole, UserProfile } from '../types';
import { ASSETS } from '../data/mockData';
import { loginUser, registerNewUser } from '../services/authService';

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

  // Registration Modal state (Facebook Style)
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [regRole, setRegRole] = useState<'student' | 'teacher' | 'family'>('student');
  const [regFullName, setRegFullName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);

  // Dynamic role-specific fields
  // Student fields
  const [regGradeLevel, setRegGradeLevel] = useState('Grado 10°A');
  const [regStudentCode, setRegStudentCode] = useState('');
  const [regShift, setRegShift] = useState('Jornada Mañana (06:30 AM - 12:30 PM)');

  // Teacher fields
  const [regSubjectArea, setRegSubjectArea] = useState('Tecnología e Informática');
  const [regEmployeeId, setRegEmployeeId] = useState('');
  const [regAssignedGrades, setRegAssignedGrades] = useState('Grados 10°A, 10°B y 11°A');

  // Family / Guardian fields
  const [regRelationship, setRegRelationship] = useState('Madre de familia');
  const [regGuardianDocId, setRegGuardianDocId] = useState('');
  const [regRepresentedStudentName, setRegRepresentedStudentName] = useState('');
  const [regRepresentedStudentCode, setRegRepresentedStudentCode] = useState('');
  const [regEmergencyPhone, setRegEmergencyPhone] = useState('');

  // Register status states
  const [regLoading, setRegLoading] = useState(false);
  const [regError, setRegError] = useState<string | null>(null);
  const [regSuccess, setRegSuccess] = useState<string | null>(null);

  // Handle Login submission
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    if (!identifier.trim()) {
      setLoginError('Por favor ingresa tu correo electrónico o número de documento de identidad.');
      return;
    }

    if (!loginPassword) {
      setLoginError('Por favor ingresa tu contraseña institucional.');
      return;
    }

    setIsLoading(true);

    try {
      // Authenticate with Firebase & verify registration in Firestore
      const userProfile = await loginUser(identifier, loginPassword);
      onLoginSuccess(userProfile);
    } catch (err: any) {
      // Display database error (e.g. user not registered)
      setLoginError(err.message || 'Error al iniciar sesión en el sistema institucional.');
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
      setRegError('Por favor ingresa tu correo electrónico.');
      return;
    }

    if (regPassword.length < 6) {
      setRegError('La contraseña debe tener mínimo 6 caracteres.');
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setRegError('Las contraseñas no coinciden. Por favor verifícalas.');
      return;
    }

    // Role-specific validation
    if (regRole === 'student' && !regStudentCode.trim()) {
      setRegError('Por favor ingresa tu número de documento de identidad o carnet.');
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

    setRegLoading(true);

    try {
      const selectedDocId = 
        regRole === 'student' ? regStudentCode.trim() :
        regRole === 'teacher' ? regEmployeeId.trim() :
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
        employeeId: regRole === 'teacher' ? regEmployeeId : undefined,
        assignedGrades: regRole === 'teacher' ? regAssignedGrades : undefined,
        relationship: regRole === 'family' ? regRelationship : undefined,
        representedStudentName: regRole === 'family' ? regRepresentedStudentName : undefined,
        representedStudentCode: regRole === 'family' ? regRepresentedStudentCode : undefined,
        emergencyPhone: regRole === 'family' ? regEmergencyPhone : undefined
      });

      setRegSuccess('¡Cuenta registrada exitosamente en la base de datos! Ingresando...');
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
    <div className="min-h-screen bg-[#f8f9ff] flex flex-col justify-between font-sans selection:bg-[#00288e]/15 selection:text-[#00288e]">
      {/* AMBIENT BACKGROUND ACCENTS */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-[#dde1ff]/40 blur-3xl" />
        <div className="absolute top-1/3 -right-40 w-96 h-96 rounded-full bg-[#d3e4fe]/30 blur-3xl" />
      </div>

      {/* MAIN CONTAINER: TWO-COLUMN STRUCTURE (BRAND IDENTITY + LOGIN CARD) */}
      <main className="relative z-10 w-full max-w-[1040px] mx-auto pt-8 sm:pt-16 lg:pt-24 pb-12 px-4 sm:px-6 flex-1 flex flex-col lg:flex-row items-center lg:items-start justify-between gap-10 lg:gap-14">
        
        {/* LEFT COLUMN: BRAND IDENTITY & INSTITUTIONAL MOTTO */}
        <section className="w-full lg:w-[560px] text-center lg:text-left lg:pt-6 flex flex-col items-center lg:items-start">
          <div className="flex items-center gap-3.5 mb-4 justify-center lg:justify-start">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white p-2.5 shadow-sm border border-[#e5eeff] flex items-center justify-center shrink-0">
              <img
                src={ASSETS.logo}
                alt="Edulink School Logo"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="flex items-baseline">
              <span className="text-[#00288e] font-extrabold text-[40px] sm:text-[50px] tracking-tight leading-none">
                edulink
              </span>
              <span className="text-[#0051d5] font-bold text-[28px] sm:text-[36px] tracking-tight ml-1.5">
                school
              </span>
            </div>
          </div>

          <h2 className="text-[#0b1c30] text-[22px] sm:text-[26px] lg:text-[30px] font-bold leading-[1.25] max-w-[520px] mb-4 tracking-tight">
            Plataforma institucional de gestión curricular, calificaciones y comunidad académica.
          </h2>

          <p className="text-[#444653] text-[15px] sm:text-[16px] leading-relaxed max-w-[480px] mb-6">
            Conecta en tiempo real a estudiantes, docentes titulares y acudientes en un entorno seguro y unificado.
          </p>

          {/* Institutional Trust Badge */}
          <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-white border border-[#dce9ff] text-[#0b1c30] text-xs font-semibold shadow-xs">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Institución Educativa Vallejuelos • Sede Medellín, Colombia</span>
          </div>

          {/* Institutional Feature Highlights (No example data) */}
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-[480px]">
            <div className="p-3 bg-white/80 rounded-xl border border-[#dce9ff] text-left">
              <div className="flex items-center gap-2 text-[#00288e] font-bold text-xs mb-1">
                <span className="material-symbols-outlined text-[18px]">verified_user</span>
                <span>Acceso Seguro</span>
              </div>
              <p className="text-[11px] text-[#444653] leading-relaxed">
                Ingreso protegido con correo institucional o documento de identidad registrado.
              </p>
            </div>
            <div className="p-3 bg-white/80 rounded-xl border border-[#dce9ff] text-left">
              <div className="flex items-center gap-2 text-[#0051d5] font-bold text-xs mb-1">
                <span className="material-symbols-outlined text-[18px]">cloud_sync</span>
                <span>Gestión en Línea</span>
              </div>
              <p className="text-[11px] text-[#444653] leading-relaxed">
                Sincronización en tiempo real de calificaciones, boletines y comunicaciones.
              </p>
            </div>
          </div>
        </section>

        {/* RIGHT COLUMN: LOGIN CARD */}
        <section className="w-full max-w-[420px] flex flex-col items-center">
          <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,40,142,0.08)] p-6 sm:p-7 w-full border border-[#e5eeff] flex flex-col gap-4">
            
            <div className="pb-1">
              <h3 className="text-xl font-bold text-[#0b1c30]">Iniciar Sesión</h3>
              <p className="text-xs text-[#444653] mt-0.5">Ingresa tus credenciales institucionales de acceso</p>
            </div>

            {/* Error banner */}
            {loginError && (
              <div className="p-3 bg-[#ffdad6] border border-[#ba1a1a]/30 text-[#93000a] text-xs rounded-xl flex items-start gap-2 animate-in fade-in">
                <span className="material-symbols-outlined text-[18px] shrink-0 mt-0.5">error</span>
                <div className="leading-snug">
                  <strong className="block font-bold">Error de Acceso:</strong>
                  <span>{loginError}</span>
                </div>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleLoginSubmit} className="flex flex-col gap-3.5">
              <div>
                <label className="block text-[11px] font-bold text-[#444653] uppercase tracking-wider mb-1">
                  Correo electrónico o número de documento de identidad
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 material-symbols-outlined text-[20px] text-[#757684]">
                    badge
                  </span>
                  <input
                    type="text"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder=""
                    className="w-full pl-10.5 pr-4 py-3 text-sm bg-[#f8f9ff] border border-[#c4c5d5]/60 rounded-xl focus:bg-white focus:border-[#00288e] focus:ring-2 focus:ring-[#00288e]/15 outline-none text-[#0b1c30] transition-all"
                    autoComplete="username"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#444653] uppercase tracking-wider mb-1">
                  Contraseña
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 material-symbols-outlined text-[20px] text-[#757684]">
                    lock
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder=""
                    className="w-full pl-10.5 pr-11 py-3 text-sm bg-[#f8f9ff] border border-[#c4c5d5]/60 rounded-xl focus:bg-white focus:border-[#00288e] focus:ring-2 focus:ring-[#00288e]/15 outline-none text-[#0b1c30] transition-all"
                    autoComplete="current-password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#757684] hover:text-[#0b1c30] p-1 cursor-pointer"
                    title={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      {showPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Login Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-1 bg-[#00288e] hover:bg-[#001f70] active:bg-[#001453] text-white font-bold text-[16px] py-3 rounded-xl transition duration-150 cursor-pointer text-center shadow-md shadow-[#00288e]/20 flex items-center justify-center gap-2 disabled:opacity-75"
              >
                {isLoading ? (
                  <>
                    <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Verificando credenciales...</span>
                  </>
                ) : (
                  <>
                    <span>Iniciar sesión</span>
                    <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
                  </>
                )}
              </button>
            </form>

            {/* Forgot password link */}
            <div className="text-center pt-0.5">
              <button
                type="button"
                onClick={() => setLoginError('Para recuperar tu contraseña, acércate a la Secretaría Académica de la Institución Educativa Vallejuelos o contacta al administrador de TI.')}
                className="text-[#0051d5] hover:text-[#00288e] text-xs font-semibold hover:underline cursor-pointer"
              >
                ¿Olvidaste tu contraseña institucional?
              </button>
            </div>

            {/* Divider line */}
            <div className="relative my-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#e5eeff]" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-3 text-[#757684] font-medium text-[11px]">
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
                className="w-full bg-[#0051d5] hover:bg-[#0041ab] active:bg-[#003185] text-white font-bold text-[15px] px-5 py-3 rounded-xl cursor-pointer transition duration-150 shadow-sm flex items-center justify-center gap-2 active:scale-[0.99]"
              >
                <span className="material-symbols-outlined text-[20px]">person_add</span>
                <span>Crear cuenta nueva</span>
              </button>
            </div>
          </div>

          {/* Subtext below login card */}
          <p className="text-xs text-[#444653] text-center mt-6 leading-relaxed max-w-[360px]">
            Acceso seguro protegido mediante cifrado institucional y validación en base de datos Google Firestore.
          </p>
        </section>
      </main>

      {/* INSTITUTIONAL FOOTER */}
      <footer className="relative z-10 w-full bg-white border-t border-[#e5eeff] py-6 text-[#757684] text-xs">
        <div className="max-w-[1040px] mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div className="flex items-center gap-2 text-[#0b1c30] font-semibold">
            <img src={ASSETS.logo} alt="" className="w-5 h-5 object-contain" />
            <span>Edulink School © 2026 • Institución Educativa Vallejuelos</span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-4 text-[#444653]">
            <span className="hover:text-[#00288e] cursor-pointer">Manual de Convivencia</span>
            <span>•</span>
            <span className="hover:text-[#00288e] cursor-pointer">Soporte Técnico</span>
            <span>•</span>
            <span className="hover:text-[#00288e] cursor-pointer">Secretaría de Educación</span>
          </div>
        </div>
      </footer>

      {/* ========================================================================= */}
      {/* REGISTRATION MODAL WITH EDULINK BRANDING & DYNAMIC ROLE SELECTION */}
      {/* ========================================================================= */}
      {isRegisterModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#0b1c30]/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[560px] my-6 border border-[#e5eeff] overflow-hidden flex flex-col max-h-[92vh]">
            
            {/* MODAL HEADER */}
            <div className="p-5 sm:p-6 flex items-start justify-between border-b border-[#e5eeff] bg-[#f8f9ff] shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#00288e] text-white flex items-center justify-center shadow-sm shrink-0">
                  <span className="material-symbols-outlined text-[22px]">person_add</span>
                </div>
                <div>
                  <h3 className="text-xl sm:text-2xl font-bold text-[#0b1c30] leading-tight">
                    Crear Cuenta Institucional
                  </h3>
                  <p className="text-xs sm:text-sm text-[#444653] mt-0.5">
                    Selecciona tu rol para configurar tu perfil en la base de datos
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsRegisterModalOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-[#757684] hover:bg-[#e5eeff] hover:text-[#0b1c30] cursor-pointer transition-colors"
                title="Cerrar"
              >
                <span className="material-symbols-outlined text-[22px]">close</span>
              </button>
            </div>

            {/* MODAL BODY (SCROLLABLE FORM) */}
            <div className="p-5 sm:p-6 overflow-y-auto flex-1 flex flex-col gap-4">
              
              {/* Feedback banners */}
              {regError && (
                <div className="p-3.5 bg-[#ffdad6] border border-[#ba1a1a]/30 text-[#93000a] text-xs rounded-xl flex items-start gap-2.5">
                  <span className="material-symbols-outlined text-[18px] shrink-0 mt-0.5">error</span>
                  <span>{regError}</span>
                </div>
              )}

              {regSuccess && (
                <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-start gap-2.5">
                  <span className="material-symbols-outlined text-[18px] shrink-0 mt-0.5">check_circle</span>
                  <span>{regSuccess}</span>
                </div>
              )}

              <form onSubmit={handleRegisterSubmit} className="flex flex-col gap-4">
                
                {/* 1. CAMPO PARA DEFINIR EL ROL INSTITUCIONAL (User Prompt Requirement) */}
                <div className="bg-[#eff4ff] p-4 rounded-2xl border border-[#dce9ff]">
                  <div className="flex items-center justify-between mb-2.5">
                    <label className="text-xs font-bold text-[#00288e] uppercase tracking-wider flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[18px] text-[#00288e]">badge</span>
                      <span>Rol con el que te registrarás:</span>
                    </label>
                    <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-[#00288e]/10 text-[#00288e] font-bold">
                      Obligatorio
                    </span>
                  </div>

                  {/* 3 Role Selection Tiles */}
                  <div className="grid grid-cols-3 gap-2.5">
                    <button
                      type="button"
                      onClick={() => setRegRole('student')}
                      className={`p-3 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1 ${
                        regRole === 'student'
                          ? 'bg-white border-[#00288e] shadow-sm text-[#00288e] ring-2 ring-[#00288e]/20 font-bold'
                          : 'bg-white/70 border-[#dce9ff] text-[#444653] hover:bg-white hover:text-[#0b1c30]'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[24px]">school</span>
                      <span className="text-xs font-bold leading-tight">Estudiante</span>
                      <span className="text-[10px] text-[#444653] hidden sm:inline">Alumno</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setRegRole('teacher')}
                      className={`p-3 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1 ${
                        regRole === 'teacher'
                          ? 'bg-white border-[#00288e] shadow-sm text-[#00288e] ring-2 ring-[#00288e]/20 font-bold'
                          : 'bg-white/70 border-[#dce9ff] text-[#444653] hover:bg-white hover:text-[#0b1c30]'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[24px]">menu_book</span>
                      <span className="text-xs font-bold leading-tight">Docente</span>
                      <span className="text-[10px] text-[#444653] hidden sm:inline">Profesor</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setRegRole('family')}
                      className={`p-3 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1 ${
                        regRole === 'family'
                          ? 'bg-white border-[#00288e] shadow-sm text-[#00288e] ring-2 ring-[#00288e]/20 font-bold'
                          : 'bg-white/70 border-[#dce9ff] text-[#444653] hover:bg-white hover:text-[#0b1c30]'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[24px]">family_restroom</span>
                      <span className="text-xs font-bold leading-tight">Acudiente</span>
                      <span className="text-[10px] text-[#444653] hidden sm:inline">Familia</span>
                    </button>
                  </div>
                </div>

                {/* 2. INFORMACIÓN Y CAMPOS CORRESPONDIENTES AL ROL SELECCIONADO (User Prompt Requirement) */}
                
                {/* CASE A: ROL ESTUDIANTE */}
                {regRole === 'student' && (
                  <div className="bg-[#eff4ff] border border-[#b8c4ff] rounded-2xl p-4 flex flex-col gap-3.5 animate-in fade-in">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-xl bg-[#00288e] text-white flex items-center justify-center shrink-0 shadow-xs">
                        <span className="material-symbols-outlined text-[18px]">school</span>
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-[#00288e]">
                          Información Académica del Estudiante
                        </h4>
                        <p className="text-[11px] text-[#444653] leading-relaxed mt-0.5">
                          Al registrarte como estudiante tendrás acceso a tus asignaturas, calificaciones de los cuatro períodos, descarga de talleres y entrega digital de tareas.
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <div>
                        <label className="block text-[11px] font-bold text-[#0b1c30] mb-1">
                          Grado y Grupo *
                        </label>
                        <select
                          value={regGradeLevel}
                          onChange={(e) => setRegGradeLevel(e.target.value)}
                          className="w-full px-3 py-2 text-xs bg-white border border-[#dce9ff] rounded-xl focus:border-[#00288e] focus:ring-1 focus:ring-[#00288e] outline-none text-[#0b1c30]"
                        >
                          <option value="Grado 10°A">Grado 10°A (Secundaria Media)</option>
                          <option value="Grado 10°B">Grado 10°B (Secundaria Media)</option>
                          <option value="Grado 11°A">Grado 11°A (Secundaria Media)</option>
                          <option value="Grado 11°B">Grado 11°B (Secundaria Media)</option>
                          <option value="Grado 9°A">Grado 9°A (Básica Secundaria)</option>
                          <option value="Grado 8°A">Grado 8°A (Básica Secundaria)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-[#0b1c30] mb-1">
                          Número de Documento de Identidad (TI / CC) o Código *
                        </label>
                        <input
                          type="text"
                          value={regStudentCode}
                          onChange={(e) => setRegStudentCode(e.target.value)}
                          placeholder=""
                          className="w-full px-3 py-2 text-xs bg-white border border-[#dce9ff] rounded-xl focus:border-[#00288e] focus:ring-1 focus:ring-[#00288e] outline-none text-[#0b1c30]"
                          required
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-[11px] font-bold text-[#0b1c30] mb-1">
                          Jornada Escolar
                        </label>
                        <select
                          value={regShift}
                          onChange={(e) => setRegShift(e.target.value)}
                          className="w-full px-3 py-2 text-xs bg-white border border-[#dce9ff] rounded-xl focus:border-[#00288e] focus:ring-1 focus:ring-[#00288e] outline-none text-[#0b1c30]"
                        >
                          <option value="Jornada Mañana (06:30 AM - 12:30 PM)">Jornada Mañana (06:30 AM - 12:30 PM)</option>
                          <option value="Jornada Tarde (12:30 PM - 06:30 PM)">Jornada Tarde (12:30 PM - 06:30 PM)</option>
                          <option value="Jornada Única Institucional">Jornada Única Institucional</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {/* CASE B: ROL DOCENTE */}
                {regRole === 'teacher' && (
                  <div className="bg-[#eef2ff] border border-[#c7d2fe] rounded-2xl p-4 flex flex-col gap-3.5 animate-in fade-in">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-xl bg-[#1e40af] text-white flex items-center justify-center shrink-0 shadow-xs">
                        <span className="material-symbols-outlined text-[18px]">menu_book</span>
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-[#1e40af]">
                          Información Docente y Grupos a Cargo
                        </h4>
                        <p className="text-[11px] text-[#444653] leading-relaxed mt-0.5">
                          Al registrarte como docente podrás ingresar calificaciones en la planilla oficial, registrar valoraciones por período, controlar asistencia y publicar talleres institucionales.
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <div>
                        <label className="block text-[11px] font-bold text-[#0b1c30] mb-1">
                          Área o Asignatura Principal *
                        </label>
                        <select
                          value={regSubjectArea}
                          onChange={(e) => setRegSubjectArea(e.target.value)}
                          className="w-full px-3 py-2 text-xs bg-white border border-[#c7d2fe] rounded-xl focus:border-[#1e40af] focus:ring-1 focus:ring-[#1e40af] outline-none text-[#0b1c30]"
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
                        <label className="block text-[11px] font-bold text-[#0b1c30] mb-1">
                          Número de Documento de Identidad (Cédula) *
                        </label>
                        <input
                          type="text"
                          value={regEmployeeId}
                          onChange={(e) => setRegEmployeeId(e.target.value)}
                          placeholder=""
                          className="w-full px-3 py-2 text-xs bg-white border border-[#c7d2fe] rounded-xl focus:border-[#1e40af] focus:ring-1 focus:ring-[#1e40af] outline-none text-[#0b1c30]"
                          required
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-[11px] font-bold text-[#0b1c30] mb-1">
                          Grados Asignados
                        </label>
                        <input
                          type="text"
                          value={regAssignedGrades}
                          onChange={(e) => setRegAssignedGrades(e.target.value)}
                          placeholder=""
                          className="w-full px-3 py-2 text-xs bg-white border border-[#c7d2fe] rounded-xl focus:border-[#1e40af] focus:ring-1 focus:ring-[#1e40af] outline-none text-[#0b1c30]"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* CASE C: ROL ACUDIENTE / FAMILIA */}
                {regRole === 'family' && (
                  <div className="bg-[#fff7ed] border border-[#ffedd5] rounded-2xl p-4 flex flex-col gap-3.5 animate-in fade-in">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-xl bg-[#c2410c] text-white flex items-center justify-center shrink-0 shadow-xs">
                        <span className="material-symbols-outlined text-[18px]">family_restroom</span>
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-[#9a3412]">
                          Información Familiar y Estudiante a Cargo
                        </h4>
                        <p className="text-[11px] text-[#444653] leading-relaxed mt-0.5">
                          Al registrarte como acudiente podrás consultar el boletín de notas de tus hijos, justificar ausencias escolares, recibir circulares y enviar mensajes a docentes.
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <div>
                        <label className="block text-[11px] font-bold text-[#0b1c30] mb-1">
                          Parentesco con el Estudiante *
                        </label>
                        <select
                          value={regRelationship}
                          onChange={(e) => setRegRelationship(e.target.value)}
                          className="w-full px-3 py-2 text-xs bg-white border border-[#fed7aa] rounded-xl focus:border-[#c2410c] focus:ring-1 focus:ring-[#c2410c] outline-none text-[#0b1c30]"
                        >
                          <option value="Madre de familia">Madre de familia</option>
                          <option value="Padre de familia">Padre de familia</option>
                          <option value="Acudiente Legal Autorizado">Acudiente Legal Autorizado</option>
                          <option value="Tutor(a) / Familiar Cercano">Tutor(a) / Familiar Cercano</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-[#0b1c30] mb-1">
                          Número de Documento de Identidad del Acudiente *
                        </label>
                        <input
                          type="text"
                          value={regGuardianDocId}
                          onChange={(e) => setRegGuardianDocId(e.target.value)}
                          placeholder=""
                          className="w-full px-3 py-2 text-xs bg-white border border-[#fed7aa] rounded-xl focus:border-[#c2410c] focus:ring-1 focus:ring-[#c2410c] outline-none text-[#0b1c30]"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-[#0b1c30] mb-1">
                          Teléfono de Contacto Familiar *
                        </label>
                        <input
                          type="text"
                          value={regEmergencyPhone}
                          onChange={(e) => setRegEmergencyPhone(e.target.value)}
                          placeholder=""
                          className="w-full px-3 py-2 text-xs bg-white border border-[#fed7aa] rounded-xl focus:border-[#c2410c] focus:ring-1 focus:ring-[#c2410c] outline-none text-[#0b1c30]"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-[#0b1c30] mb-1">
                          Documento del Estudiante Representado
                        </label>
                        <input
                          type="text"
                          value={regRepresentedStudentCode}
                          onChange={(e) => setRegRepresentedStudentCode(e.target.value)}
                          placeholder=""
                          className="w-full px-3 py-2 text-xs bg-white border border-[#fed7aa] rounded-xl focus:border-[#c2410c] focus:ring-1 focus:ring-[#c2410c] outline-none text-[#0b1c30]"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-[11px] font-bold text-[#0b1c30] mb-1">
                          Nombre Completo del Estudiante que Representas *
                        </label>
                        <input
                          type="text"
                          value={regRepresentedStudentName}
                          onChange={(e) => setRegRepresentedStudentName(e.target.value)}
                          placeholder=""
                          className="w-full px-3 py-2 text-xs bg-white border border-[#fed7aa] rounded-xl focus:border-[#c2410c] focus:ring-1 focus:ring-[#c2410c] outline-none text-[#0b1c30]"
                          required
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. CAMPOS GENERALES DE CUENTA (Nombre, Correo, Contraseña) */}
                <div className="flex flex-col gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-[#0b1c30] mb-1">
                      Nombre Completo *
                    </label>
                    <input
                      type="text"
                      value={regFullName}
                      onChange={(e) => setRegFullName(e.target.value)}
                      placeholder=""
                      className="w-full px-3.5 py-2.5 text-sm bg-[#f8f9ff] border border-[#dce9ff] rounded-xl focus:bg-white focus:border-[#00288e] focus:ring-1 focus:ring-[#00288e] outline-none text-[#0b1c30]"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[#0b1c30] mb-1">
                      Correo Electrónico *
                    </label>
                    <input
                      type="email"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder=""
                      className="w-full px-3.5 py-2.5 text-sm bg-[#f8f9ff] border border-[#dce9ff] rounded-xl focus:bg-white focus:border-[#00288e] focus:ring-1 focus:ring-[#00288e] outline-none text-[#0b1c30]"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-[#0b1c30] mb-1">
                        Contraseña Nueva *
                      </label>
                      <input
                        type={showRegPassword ? 'text' : 'password'}
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        placeholder=""
                        className="w-full px-3.5 py-2.5 text-sm bg-[#f8f9ff] border border-[#dce9ff] rounded-xl focus:bg-white focus:border-[#00288e] focus:ring-1 focus:ring-[#00288e] outline-none text-[#0b1c30]"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-[#0b1c30] mb-1">
                        Confirmar Contraseña *
                      </label>
                      <input
                        type={showRegPassword ? 'text' : 'password'}
                        value={regConfirmPassword}
                        onChange={(e) => setRegConfirmPassword(e.target.value)}
                        placeholder=""
                        className="w-full px-3.5 py-2.5 text-sm bg-[#f8f9ff] border border-[#dce9ff] rounded-xl focus:bg-white focus:border-[#00288e] focus:ring-1 focus:ring-[#00288e] outline-none text-[#0b1c30]"
                        required
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-[#444653]">
                    <input
                      type="checkbox"
                      id="showRegPass"
                      checked={showRegPassword}
                      onChange={(e) => setShowRegPassword(e.target.checked)}
                      className="rounded text-[#00288e] focus:ring-0 cursor-pointer"
                    />
                    <label htmlFor="showRegPass" className="cursor-pointer font-medium">
                      Mostrar contraseñas
                    </label>
                  </div>
                </div>

                {/* Terms notice */}
                <p className="text-[11px] text-[#757684] leading-relaxed">
                  Al hacer clic en Registrarte, aceptas las condiciones institucionales de tratamiento de datos académicos de la Institución Educativa Vallejuelos y la plataforma Edulink School.
                </p>

                {/* Submit button */}
                <div className="text-center pt-2">
                  <button
                    type="submit"
                    disabled={regLoading}
                    className="bg-[#00288e] hover:bg-[#001f70] active:bg-[#001453] text-white font-bold text-[16px] py-3 px-10 rounded-xl shadow-md shadow-[#00288e]/20 cursor-pointer transition duration-150 active:scale-[0.98] disabled:opacity-75 flex items-center justify-center gap-2 mx-auto"
                  >
                    {regLoading ? (
                      <>
                        <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Registrando en Base de Datos...</span>
                      </>
                    ) : (
                      <>
                        <span>Completar Registro</span>
                        <span className="material-symbols-outlined text-[20px]">how_to_reg</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
