import React, { useState, useEffect } from 'react';
import { useThemeLanguage } from '../context/ThemeLanguageContext';
import { completePasswordReset } from '../services/authService';

interface ResetPasswordViewProps {
  onSuccess: (email: string) => void;
  onBackToLogin: () => void;
}

export const ResetPasswordView: React.FC<ResetPasswordViewProps> = ({
  onSuccess,
  onBackToLogin
}) => {
  const { theme, toggleTheme, language, toggleLanguage } = useThemeLanguage();
  const isEn = language === 'en';
  const isDark = theme === 'dark';

  // Extract email from query param or localStorage
  const [email, setEmail] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const urlEmail = params.get('email');
      if (urlEmail) return urlEmail;
      const stored = localStorage.getItem('edulink_pending_reset_email') || localStorage.getItem('edulink_reset_email');
      if (stored) return stored;
    }
    return '';
  });

  const [oobCode] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.get('oobCode') || params.get('code') || '';
    }
    return '';
  });

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  // Verify action code on mount if user arrived from Firebase email link
  useEffect(() => {
    if (oobCode) {
      import('../lib/firebase').then(({ auth }) => {
        import('firebase/auth').then(({ verifyPasswordResetCode }) => {
          verifyPasswordResetCode(auth, oobCode)
            .then((verifiedEmail) => {
              if (verifiedEmail) {
                setEmail(verifiedEmail);
              }
            })
            .catch((err) => {
              console.warn('Action code check notice:', err);
              if (err?.code === 'auth/expired-action-code') {
                setErrorMessage(
                  isEn
                    ? 'This password reset link has expired. Please request a new one.'
                    : 'Este enlace de recuperación ha expirado. Por favor solicita uno nuevo.'
                );
              } else if (err?.code === 'auth/invalid-action-code') {
                setErrorMessage(
                  isEn
                    ? 'This reset link is invalid or has already been used.'
                    : 'Este enlace de recuperación es inválido o ya ha sido utilizado.'
                );
              }
            });
        });
      });
    }
  }, [oobCode, isEn]);

  // Password rules validation
  const hasMinLength = newPassword.length >= 8;
  const hasUppercase = /[A-Z]/.test(newPassword);
  const hasLowercase = /[a-z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(newPassword);
  const passwordsMatch = newPassword.length > 0 && newPassword === confirmPassword;

  // Strength score
  const strengthScore = [
    hasMinLength,
    hasUppercase,
    hasLowercase,
    hasNumber,
    hasSpecial,
  ].filter(Boolean).length * 20;

  const getStrengthLabel = () => {
    if (strengthScore <= 20) return { label: isEn ? 'Very Weak' : 'Muy débil', color: 'text-rose-400', bg: 'bg-rose-500' };
    if (strengthScore <= 40) return { label: isEn ? 'Weak' : 'Débil', color: 'text-amber-400', bg: 'bg-amber-500' };
    if (strengthScore <= 60) return { label: isEn ? 'Fair' : 'Aceptable', color: 'text-yellow-400', bg: 'bg-yellow-400' };
    if (strengthScore <= 80) return { label: isEn ? 'Good' : 'Buena', color: 'text-cyan-400', bg: 'bg-cyan-400' };
    return { label: isEn ? 'Very Strong' : 'Muy segura', color: 'text-emerald-400', bg: 'bg-emerald-400' };
  };

  // Automatic redirect upon success
  useEffect(() => {
    let timer: any = null;
    if (isSuccess) {
      timer = setTimeout(() => {
        // Clean URL action param
        if (typeof window !== 'undefined') {
          window.history.replaceState({}, '', window.location.pathname);
        }
        onSuccess(email);
      }, 2000);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [isSuccess, email, onSuccess]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setErrorMessage(isEn ? 'Please specify your registered institutional email.' : 'Por favor ingresa tu correo electrónico registrado.');
      return;
    }

    if (newPassword.length < 8) {
      setErrorMessage(isEn ? 'Password must be at least 8 characters long.' : 'La contraseña debe tener al menos 8 caracteres.');
      return;
    }

    if (!passwordsMatch) {
      setErrorMessage(isEn ? 'Passwords do not match. Please verify carefully.' : 'Las contraseñas no coinciden. Verifica e intenta nuevamente.');
      return;
    }

    setIsLoading(true);
    try {
      await completePasswordReset(cleanEmail, oobCode || 'email_link_verified', newPassword, language);
      setIsLoading(false);
      setIsSuccess(true);
    } catch (err: any) {
      setIsLoading(false);
      setErrorMessage(err.message || (isEn ? 'Error updating password.' : 'Error al actualizar la contraseña.'));
    }
  };

  return (
    <div className={`min-h-screen flex flex-col justify-between transition-colors duration-300 ${
      isDark ? 'bg-[#080d1a] text-slate-100' : 'bg-slate-50 text-slate-900'
    }`}>
      {/* Top Navbar */}
      <header className={`w-full px-6 py-4 flex items-center justify-between border-b backdrop-blur-md sticky top-0 z-40 ${
        isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-white/80 border-slate-200 shadow-xs'
      }`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-cyan-500 to-teal-400 p-0.5 shadow-md shadow-cyan-500/20">
            <div className="w-full h-full bg-[#0a1128] rounded-[10px] flex items-center justify-center">
              <span className="material-symbols-outlined text-[22px] text-cyan-400">school</span>
            </div>
          </div>
          <div>
            <span className={`text-base font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Edulink <span className="text-cyan-500">School</span>
            </span>
            <span className="hidden sm:inline-block text-[11px] text-slate-400 font-medium ml-2 border-l border-slate-300 dark:border-slate-700 pl-2">
              {isEn ? 'Institutional Platform' : 'Plataforma Educativa Institucional'}
            </span>
          </div>
        </div>

        {/* Toggles */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleLanguage}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
              isDark
                ? 'bg-slate-900 border-slate-700 text-slate-300 hover:text-white hover:border-cyan-400'
                : 'bg-white border-slate-300 text-slate-700 hover:text-slate-900 hover:border-blue-500'
            }`}
          >
            {isEn ? 'ES' : 'EN'}
          </button>

          <button
            type="button"
            onClick={toggleTheme}
            className={`p-2 rounded-lg border transition-colors cursor-pointer ${
              isDark
                ? 'bg-slate-900 border-slate-700 text-amber-400 hover:text-amber-300'
                : 'bg-white border-slate-300 text-slate-700 hover:text-blue-600'
            }`}
            title={isDark ? (isEn ? 'Switch to light' : 'Modo claro') : (isEn ? 'Switch to dark' : 'Modo oscuro')}
          >
            <span className="material-symbols-outlined text-[18px]">
              {isDark ? 'light_mode' : 'dark_mode'}
            </span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-10 sm:py-16">
        {/* Header exact match to user design */}
        <div className="text-center mb-6 sm:mb-8 animate-in fade-in duration-300">
          <h1 className={`text-3xl sm:text-4xl font-extrabold tracking-tight ${
            isDark ? 'text-white' : 'text-slate-900'
          }`}>
            {isEn ? 'New Password' : 'Nueva Contraseña'}
          </h1>
          <p className={`text-sm sm:text-base mt-2 font-medium ${
            isDark ? 'text-slate-400' : 'text-slate-500'
          }`}>
            {isEn ? 'Enter your new password' : 'Ingresa tu nueva contraseña'}
          </p>
        </div>

        {/* Card exact match to user design */}
        <div className={`w-full max-w-[420px] rounded-2xl p-6 sm:p-8 shadow-xl border transition-all duration-300 ${
          isDark
            ? 'bg-slate-900/90 border-slate-800 text-white shadow-cyan-950/20'
            : 'bg-white border-slate-200/90 text-slate-900 shadow-slate-200/70'
        }`}>
          {isSuccess ? (
            <div className="text-center py-6 animate-in zoom-in-95 duration-300">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-400 text-emerald-400 flex items-center justify-center mx-auto mb-4 shadow-[0_0_24px_rgba(16,185,129,0.35)]">
                <span className="material-symbols-outlined text-[36px]">check_circle</span>
              </div>
              <h3 className={`text-2xl font-bold tracking-tight mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {isEn ? 'Password updated successfully!' : '¡Contraseña actualizada con éxito!'}
              </h3>
              <p className={`text-sm mb-6 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                {isEn
                  ? 'Your password has been changed. Redirecting to sign in...'
                  : 'Tu contraseña ha sido modificada. Redirigiendo a la pantalla de inicio de sesión...'}
              </p>
              <button
                type="button"
                onClick={() => {
                  if (typeof window !== 'undefined') {
                    window.history.replaceState({}, '', window.location.pathname);
                  }
                  onSuccess(email);
                }}
                className="w-full bg-[#1b263b] dark:bg-emerald-600 hover:bg-[#0f172a] dark:hover:bg-emerald-500 text-white font-bold py-3.5 rounded-xl transition-all cursor-pointer shadow-md"
              >
                {isEn ? 'Sign in now' : 'Iniciar sesión ahora'}
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Optional Email input only if email is not yet identified */}
              {!email && (
                <div>
                  <label className={`block text-sm font-bold mb-1.5 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                    {isEn ? 'Registered Email' : 'Correo Electrónico'}
                  </label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">
                      mail
                    </span>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setErrorMessage(null);
                      }}
                      placeholder={isEn ? 'name@institution.edu' : 'usuario@institucion.edu'}
                      className={`w-full pl-10 pr-4 py-3 text-sm sm:text-base rounded-xl outline-none transition-all ${
                        isDark
                          ? 'bg-slate-950/60 border border-slate-700 text-white focus:border-cyan-400'
                          : 'bg-white border border-slate-200 text-slate-900 focus:border-slate-400 focus:ring-1 focus:ring-slate-400/20'
                      }`}
                      required
                    />
                  </div>
                </div>
              )}

              {/* Nueva Contraseña */}
              <div>
                <label className={`block text-sm font-bold mb-1.5 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                  {isEn ? 'New Password' : 'Nueva Contraseña'}
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">
                    lock
                  </span>
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      setErrorMessage(null);
                    }}
                    placeholder={isEn ? 'Minimum 8 characters' : 'Mínimo 8 caracteres'}
                    className={`w-full pl-10 pr-10 py-3 text-sm sm:text-base rounded-xl outline-none transition-all placeholder:text-slate-400 ${
                      isDark
                        ? 'bg-slate-950/60 border border-slate-700 text-white focus:border-cyan-400'
                        : 'bg-white border border-slate-200 text-slate-900 focus:border-slate-400 focus:ring-1 focus:ring-slate-400/20'
                    }`}
                    required
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-cyan-400 cursor-pointer"
                    title={showNewPassword ? (isEn ? 'Hide' : 'Ocultar') : (isEn ? 'Show' : 'Mostrar')}
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      {showNewPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Confirmar Contraseña */}
              <div>
                <label className={`block text-sm font-bold mb-1.5 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                  {isEn ? 'Confirm Password' : 'Confirmar Contraseña'}
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">
                    lock
                  </span>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      setErrorMessage(null);
                    }}
                    placeholder="........"
                    className={`w-full pl-10 pr-10 py-3 text-sm sm:text-base rounded-xl outline-none transition-all placeholder:text-slate-400 font-mono tracking-widest ${
                      isDark
                        ? 'bg-slate-950/60 border border-slate-700 text-white focus:border-cyan-400'
                        : 'bg-white border border-slate-200 text-slate-900 focus:border-slate-400 focus:ring-1 focus:ring-slate-400/20'
                    }`}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-cyan-400 cursor-pointer"
                    title={showConfirmPassword ? (isEn ? 'Hide' : 'Ocultar') : (isEn ? 'Show' : 'Mostrar')}
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      {showConfirmPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Real-time match hint */}
              {confirmPassword.length > 0 && (
                <div className="text-xs flex items-center gap-1.5 pt-0.5">
                  <span className={`material-symbols-outlined text-[16px] ${passwordsMatch ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {passwordsMatch ? 'check_circle' : 'cancel'}
                  </span>
                  <span className={passwordsMatch ? 'text-emerald-600 dark:text-emerald-400 font-medium' : 'text-rose-500 font-medium'}>
                    {passwordsMatch
                      ? (isEn ? 'Passwords match' : 'Las contraseñas coinciden')
                      : (isEn ? 'Passwords do not match' : 'Las contraseñas no coinciden')}
                  </span>
                </div>
              )}

              {/* Password Strength Bar */}
              {newPassword.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>
                      {isEn ? 'Security:' : 'Seguridad:'}
                    </span>
                    <span className={`font-bold ${getStrengthLabel().color}`}>
                      {getStrengthLabel().label}
                    </span>
                  </div>
                  <div className={`w-full h-1 rounded-full overflow-hidden ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}>
                    <div
                      className={`h-full transition-all duration-300 ${getStrengthLabel().bg}`}
                      style={{ width: `${strengthScore}%` }}
                    />
                  </div>
                </div>
              )}

              {errorMessage && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs sm:text-sm rounded-xl flex items-start gap-2 animate-in fade-in">
                  <span className="material-symbols-outlined text-[18px] text-rose-500 shrink-0 mt-0.5">error</span>
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Submit Button - adapted to platform visual style matching image */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className={`w-full font-bold text-sm sm:text-base py-3.5 rounded-xl transition-all duration-200 cursor-pointer shadow-md flex items-center justify-center gap-2 ${
                    isDark
                      ? 'bg-gradient-to-r from-blue-600 via-cyan-600 to-teal-500 hover:from-blue-500 text-white shadow-cyan-500/20 active:opacity-90'
                      : 'bg-[#1b263b] hover:bg-[#0f172a] text-white active:scale-[0.99]'
                  } disabled:opacity-70`}
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>{isEn ? 'Updating password...' : 'Restableciendo...'}</span>
                    </>
                  ) : (
                    <span>{isEn ? 'Reset Password' : 'Restablecer Contraseña'}</span>
                  )}
                </button>
              </div>

              {/* Back to sign in link */}
              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => {
                    if (typeof window !== 'undefined') {
                      window.history.replaceState({}, '', window.location.pathname);
                    }
                    onBackToLogin();
                  }}
                  className={`text-xs font-semibold hover:underline cursor-pointer transition-colors ${
                    isDark ? 'text-slate-400 hover:text-cyan-400' : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  {isEn ? '← Back to Sign In' : '← Volver a Iniciar Sesión'}
                </button>
              </div>
            </form>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className={`py-4 text-center text-xs border-t ${
        isDark ? 'border-slate-800/80 text-slate-500' : 'border-slate-200 text-slate-400'
      }`}>
        <p>© 2026 Edulink School. Todos los derechos reservados.</p>
      </footer>
    </div>
  );
};
