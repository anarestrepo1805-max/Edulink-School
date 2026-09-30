import React, { useState, useEffect } from 'react';
import { useThemeLanguage } from '../context/ThemeLanguageContext';
import {
  requestPasswordReset,
  verifyPasswordResetCode,
  completePasswordReset
} from '../services/authService';

interface PasswordRecoveryModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialEmail?: string;
  onPasswordResetSuccess?: (newEmail: string) => void;
}

export const PasswordRecoveryModal: React.FC<PasswordRecoveryModalProps> = ({
  isOpen,
  onClose,
  initialEmail = '',
  onPasswordResetSuccess,
}) => {
  const { theme, language } = useThemeLanguage();
  const isEn = language === 'en';
  const isDark = theme === 'dark';

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [email, setEmail] = useState(initialEmail);
  const [verificationCode, setVerificationCode] = useState('');
  const [resendTimer, setResendTimer] = useState(60);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Dynamic error and alert translation helper so switching language immediately updates alerts
  const translateError = (msg: string | null): string | null => {
    if (!msg) return null;
    if (msg.includes('Contraseña incorrecta') || msg.includes('Incorrect password')) {
      return isEn ? 'Incorrect password. Please verify your credentials.' : 'Contraseña incorrecta. Por favor verifique sus datos.';
    }
    if (msg.includes('no se encuentra registrado') || msg.includes('not registered')) {
      return isEn
        ? `The email "${email}" is not registered on the platform. Please check the address or register first.`
        : `El correo "${email}" no se encuentra registrado en la plataforma. Por favor verifica la dirección o regístrate primero.`;
    }
    if (msg.includes('correo electrónico institucional') || msg.includes('institutional email')) {
      return isEn ? 'Please enter a valid institutional email address.' : 'Ingresa un correo electrónico institucional válido.';
    }
    if (msg.includes('código completo') || msg.includes('complete 6-digit')) {
      return isEn ? 'Please enter the complete 6-digit verification code.' : 'Por favor ingresa el código completo de 6 dígitos.';
    }
    if (msg.includes('Código de verificación incorrecto') || msg.includes('Incorrect verification code')) {
      return isEn
        ? 'Incorrect or expired verification code. Please check your email and try again.'
        : 'Código de verificación incorrecto o expirado. Por favor revisa tu correo e intenta nuevamente.';
    }
    if (msg.includes('ha expirado') || msg.includes('expired')) {
      return isEn
        ? 'The verification code has expired (10-minute validity). Please request a new code.'
        : 'El código de verificación ha expirado (validez de 10 minutos). Por favor solicita un nuevo código.';
    }
    if (msg.includes('menos 8 caracteres') || msg.includes('at least 8 characters')) {
      return isEn ? 'Password must be at least 8 characters long.' : 'La contraseña debe tener al menos 8 caracteres.';
    }
    if (msg.includes('mayúscula') || msg.includes('uppercase')) {
      return isEn ? 'Password must contain at least one uppercase letter (A-Z).' : 'La contraseña debe contener al menos una letra mayúscula (A-Z).';
    }
    if (msg.includes('minúscula') || msg.includes('lowercase')) {
      return isEn ? 'Password must contain at least one lowercase letter (a-z).' : 'La contraseña debe contener al menos una letra minúscula (a-z).';
    }
    if (msg.includes('especial') || msg.includes('special character')) {
      return isEn ? 'Password must contain at least one special character (!@#$%).' : 'La contraseña debe contener al menos un carácter especial (!@#$%).';
    }
    if (msg.includes('no coinciden') || msg.includes('do not match')) {
      return isEn ? 'Passwords do not match. Please verify carefully.' : 'Las contraseñas no coinciden. Verifica e intenta nuevamente.';
    }
    return msg;
  };

  // Sync initial email when opened
  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setEmail(initialEmail || '');
      setVerificationCode('');
      setNewPassword('');
      setConfirmPassword('');
      setErrorMessage(null);
      setResendTimer(60);
    }
  }, [isOpen, initialEmail]);

  // Countdown timer for Step 2
  useEffect(() => {
    let interval: any = null;
    if (isOpen && step === 2 && resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isOpen, step, resendTimer]);

  // Automatic redirect upon successful password reset in Step 4
  useEffect(() => {
    let timer: any = null;
    if (isOpen && step === 4) {
      timer = setTimeout(() => {
        if (onPasswordResetSuccess) {
          onPasswordResetSuccess(email);
        }
        onClose();
      }, 2000);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [isOpen, step, email, onPasswordResetSuccess, onClose]);

  if (!isOpen) return null;

  // Password rules validation
  const hasMinLength = newPassword.length >= 8;
  const hasUppercase = /[A-Z]/.test(newPassword);
  const hasLowercase = /[a-z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(newPassword);
  const passwordsMatch = newPassword.length > 0 && newPassword === confirmPassword;

  // Calculate password strength score (0 to 100)
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

  // 1. Pantalla 1: Solicitud de Correo -> Envío con Resend desde el Backend
  // NO se muestra en pantalla ningún código de verificación ni contraseña temporal
  const handleSendRecoveryCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setErrorMessage(isEn ? 'Please enter your institutional email.' : 'Por favor ingresa tu correo electrónico institucional.');
      return;
    }

    if (!cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setErrorMessage(isEn ? 'Please enter a valid email format.' : 'Ingresa un formato de correo electrónico válido.');
      return;
    }

    setIsLoading(true);
    try {
      // Backend generates 6-digit code with 10-minute expiry and dispatches via Resend
      await requestPasswordReset(cleanEmail, language);
      setIsLoading(false);
      setStep(2);
      setResendTimer(60);
      setVerificationCode('');
    } catch (err: any) {
      setIsLoading(false);
      setErrorMessage(err.message || (isEn ? 'Error sending recovery code.' : 'Error al enviar el código de verificación.'));
    }
  };

  // Reenviar código
  const handleResendRecoveryCode = async () => {
    if (resendTimer > 0) return;
    setIsLoading(true);
    setErrorMessage(null);
    try {
      await requestPasswordReset(email.trim(), language);
      setIsLoading(false);
      setResendTimer(60);
    } catch (err: any) {
      setIsLoading(false);
      setErrorMessage(err.message || (isEn ? 'Error resending code.' : 'Error al reenviar el código.'));
    }
  };

  // 2. Pantalla 2: Verificación de Código OTP
  const handleVerifyCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanCode = verificationCode.trim().replace(/\s+/g, '');
    if (!cleanCode || cleanCode.length !== 6) {
      setErrorMessage(isEn ? 'Please enter the complete 6-digit verification code.' : 'Por favor ingresa el código completo de 6 dígitos.');
      return;
    }

    setIsLoading(true);
    try {
      await verifyPasswordResetCode(email, cleanCode, language);
      setIsLoading(false);
      setStep(3);
      setErrorMessage(null);
    } catch (err: any) {
      setIsLoading(false);
      setErrorMessage(err.message || (isEn ? 'Invalid verification code.' : 'Código de verificación incorrecto o expirado.'));
    }
  };

  // 3. Pantalla 3: Restablecer Contraseña
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!hasMinLength) {
      setErrorMessage(isEn ? 'Password must be at least 8 characters long.' : 'La contraseña debe tener al menos 8 caracteres.');
      return;
    }
    if (!hasUppercase) {
      setErrorMessage(isEn ? 'Password must contain at least one uppercase letter (A-Z).' : 'La contraseña debe contener al menos una letra mayúscula (A-Z).');
      return;
    }
    if (!hasLowercase) {
      setErrorMessage(isEn ? 'Password must contain at least one lowercase letter (a-z).' : 'La contraseña debe contener al menos una letra minúscula (a-z).');
      return;
    }
    if (!hasSpecial) {
      setErrorMessage(isEn ? 'Password must contain at least one special character (!@#$%).' : 'La contraseña debe contener al menos un carácter especial (!@#$%).');
      return;
    }
    if (!passwordsMatch) {
      setErrorMessage(isEn ? 'Passwords do not match. Please verify carefully.' : 'Las contraseñas no coinciden. Verifica e intenta nuevamente.');
      return;
    }

    setIsLoading(true);
    try {
      await completePasswordReset(email, verificationCode, newPassword, language);
      setIsLoading(false);
      // 4. Finalización: Modal limpio con confirmación y redirección automática a inicio de sesión
      setStep(4);
    } catch (err: any) {
      setIsLoading(false);
      setErrorMessage(err.message || (isEn ? 'Error updating password.' : 'Error al actualizar la contraseña.'));
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div
        className={`relative w-full max-w-lg rounded-3xl p-6 sm:p-8 shadow-2xl border transition-all duration-300 ${
          isDark
            ? 'bg-slate-900/95 border-slate-700/80 text-white shadow-cyan-950/40'
            : 'bg-white border-slate-200 text-slate-900 shadow-slate-300/60'
        }`}
      >
        {/* Close Button */}
        {step !== 4 && (
          <button
            type="button"
            onClick={onClose}
            className={`absolute top-5 right-5 w-9 h-9 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
              isDark
                ? 'bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900'
            }`}
            title={isEn ? 'Close' : 'Cerrar ventana'}
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        )}

        {/* Steps Progress Indicator (Steps 1 to 3) */}
        {step !== 4 && (
          <div className="flex items-center justify-between gap-2 mb-6">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-cyan-500/20 border border-cyan-400/40 text-cyan-500 font-bold text-xs flex items-center justify-center">
                {step}
              </div>
              <span className="text-xs uppercase tracking-wider font-semibold text-cyan-500">
                {isEn ? `Step ${step} of 3` : `Paso ${step} de 3`}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className={`w-8 h-1.5 rounded-full transition-all ${step >= 1 ? 'bg-cyan-500' : isDark ? 'bg-slate-700' : 'bg-slate-200'}`} />
              <span className={`w-8 h-1.5 rounded-full transition-all ${step >= 2 ? 'bg-cyan-500' : isDark ? 'bg-slate-700' : 'bg-slate-200'}`} />
              <span className={`w-8 h-1.5 rounded-full transition-all ${step >= 3 ? 'bg-cyan-500' : isDark ? 'bg-slate-700' : 'bg-slate-200'}`} />
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* PANTALLA 1: Solicitud de Correo                                           */}
        {/* ========================================================================= */}
        {step === 1 && (
          <div>
            <div className="text-center sm:text-left mb-5">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/15 border border-cyan-400/30 text-cyan-500 flex items-center justify-center mb-3 shadow-inner">
                <span className="material-symbols-outlined text-[26px]">mark_email_read</span>
              </div>
              <h3 className={`text-2xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {isEn ? 'Password Recovery' : 'Recuperar Contraseña'}
              </h3>
              <p className={`text-sm mt-1 leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                {isEn
                  ? 'Enter your registered email address to receive a 6-digit verification code.'
                  : 'Ingresa tu correo electrónico registrado para recibir el código de verificación de 6 dígitos.'}
              </p>
            </div>

            <form onSubmit={handleSendRecoveryCode} className="space-y-4">
              <div>
                <label className={`block text-xs font-bold uppercase tracking-wider mb-1.5 ${isDark ? 'text-cyan-300' : 'text-blue-900'}`}>
                  {isEn ? 'Registered Email Address' : 'Correo Electrónico Registrado'}
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 material-symbols-outlined text-[22px] text-cyan-500">
                    mail
                  </span>
                  <input
                    id="recovery-email-input"
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setErrorMessage(null);
                    }}
                    placeholder=""
                    className={`w-full pl-11 pr-4 py-3.5 text-base rounded-xl outline-none transition-all ${
                      isDark
                        ? 'bg-slate-950/60 border border-slate-700/80 text-white focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/25'
                        : 'bg-slate-50 border border-slate-300 text-slate-900 focus:border-blue-600 focus:bg-white focus:ring-2 focus:ring-blue-500/20'
                    }`}
                    required
                    autoFocus
                  />
                </div>
              </div>

              {errorMessage && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/40 text-rose-500 text-xs sm:text-sm rounded-xl flex items-start gap-2 animate-in fade-in">
                  <span className="material-symbols-outlined text-[18px] text-rose-500 shrink-0 mt-0.5">error</span>
                  <span>{translateError(errorMessage)}</span>
                </div>
              )}

              <div className="pt-2">
                <button
                  id="btn-send-verification-code"
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-blue-600 via-cyan-600 to-teal-500 hover:from-blue-500 hover:via-cyan-500 hover:to-teal-400 active:opacity-90 text-white font-bold text-base py-3.5 rounded-xl transition-all duration-200 cursor-pointer text-center shadow-lg shadow-cyan-500/25 flex items-center justify-center gap-2 disabled:opacity-75"
                >
                  {isLoading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>{isEn ? 'Dispatching code...' : 'Enviando código...'}</span>
                    </>
                  ) : (
                    <>
                      <span>{isEn ? 'Send link / verification code' : 'Enviar enlace / código de verificación'}</span>
                      <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ========================================================================= */}
        {/* PANTALLA 2: Verificación de Código OTP o Enlace                           */}
        {/* ========================================================================= */}
        {step === 2 && (
          <div>
            <div className="text-center sm:text-left mb-4">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/15 border border-cyan-400/30 text-cyan-500 flex items-center justify-center mb-3 shadow-inner">
                <span className="material-symbols-outlined text-[26px]">pin</span>
              </div>
              <h3 className={`text-2xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {isEn ? 'Verification Code' : 'Código de Verificación'}
              </h3>
              <p className={`text-sm mt-1 leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                {isEn
                  ? 'We have sent a 6-digit verification code to your registered email'
                  : 'Hemos enviado un código de verificación de 6 dígitos a tu correo electrónico registrado'}
              </p>
            </div>

            {/* Confirmation Banner with User Email */}
            <div className={`p-3.5 rounded-2xl border mb-3 flex items-center gap-3 ${
              isDark ? 'bg-cyan-950/40 border-cyan-500/40 text-cyan-200' : 'bg-cyan-50 border-cyan-200 text-cyan-950'
            }`}>
              <span className="material-symbols-outlined text-[22px] text-cyan-500 shrink-0">mark_email_read</span>
              <div className="overflow-hidden">
                <span className="text-[10px] uppercase tracking-wider block opacity-75 font-semibold">
                  {isEn ? 'Registered Inbox' : 'Bandeja Registrada'}
                </span>
                <span className="font-mono text-sm sm:text-base font-bold truncate block text-cyan-500">
                  {email}
                </span>
              </div>
            </div>

            {/* 10-Minute Expiration Notice */}
            <div className={`p-2.5 rounded-xl border mb-4 flex items-center justify-center gap-2 text-xs font-semibold ${
              isDark ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300' : 'bg-blue-50 border-blue-200 text-blue-900'
            }`}>
              <span className="material-symbols-outlined text-[16px] text-cyan-500">schedule</span>
              <span>{isEn ? 'This code is valid for 10 minutes.' : 'Este código es válido durante 10 minutos.'}</span>
            </div>

            <form onSubmit={handleVerifyCodeSubmit} className="space-y-4">
              <div>
                <label className={`block text-xs font-bold uppercase tracking-wider mb-2 text-center ${isDark ? 'text-cyan-300' : 'text-blue-900'}`}>
                  {isEn ? 'Enter 6-Digit Code' : 'Ingresa el Código de 6 Dígitos'}
                </label>
                
                {/* 6 Digit Input */}
                <div className="relative">
                  <input
                    id="input-verification-code"
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    value={verificationCode}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9]/g, '');
                      setVerificationCode(val);
                      setErrorMessage(null);
                    }}
                    placeholder=""
                    className={`w-full py-3.5 text-2xl tracking-[0.5em] font-mono font-black text-center rounded-2xl outline-none transition-all ${
                      isDark
                        ? 'bg-slate-950/80 border border-slate-700/80 text-cyan-300 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/25'
                        : 'bg-slate-50 border border-slate-300 text-slate-900 focus:border-blue-600 focus:bg-white focus:ring-2 focus:ring-blue-500/20'
                    }`}
                    required
                    autoFocus
                  />
                </div>

                {/* Visual Digit Cells */}
                <div className="flex justify-center gap-2 mt-3">
                  {[0, 1, 2, 3, 4, 5].map((idx) => {
                    const digit = verificationCode[idx];
                    return (
                      <div
                        key={idx}
                        className={`w-10 h-12 sm:w-11 sm:h-14 rounded-xl flex items-center justify-center font-mono font-bold text-lg sm:text-xl border transition-all ${
                          digit
                            ? isDark
                              ? 'bg-cyan-950/60 border-cyan-400 text-cyan-300 shadow-sm shadow-cyan-500/20'
                              : 'bg-blue-50 border-blue-600 text-blue-900 shadow-xs'
                            : isDark
                            ? 'bg-slate-950/40 border-slate-700/60 text-slate-600'
                            : 'bg-slate-100 border-slate-200 text-slate-400'
                        }`}
                      >
                        {digit || ''}
                      </div>
                    );
                  })}
                </div>
              </div>

              {errorMessage && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/40 text-rose-500 text-xs sm:text-sm rounded-xl flex items-start gap-2 animate-in fade-in">
                  <span className="material-symbols-outlined text-[18px] text-rose-500 shrink-0 mt-0.5">error</span>
                  <span>{translateError(errorMessage)}</span>
                </div>
              )}

              {/* Countdown Timer / Resend Action */}
              <div className="flex items-center justify-between text-xs pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setStep(1);
                    setErrorMessage(null);
                  }}
                  className={`font-medium hover:underline cursor-pointer ${isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-800'}`}
                >
                  {isEn ? '← Change email' : '← Cambiar correo'}
                </button>

                {resendTimer > 0 ? (
                  <div className={`flex items-center gap-1.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    <span className="material-symbols-outlined text-[16px] text-cyan-500 animate-spin" style={{ animationDuration: '4s' }}>
                      timer
                    </span>
                    <span>
                      {isEn ? 'Resend code in ' : 'Reenviar código en '}
                      <strong className="text-cyan-500 font-mono font-bold">{resendTimer}s</strong>
                    </span>
                  </div>
                ) : (
                  <button
                    id="btn-resend-otp"
                    type="button"
                    onClick={handleResendRecoveryCode}
                    disabled={isLoading}
                    className="inline-flex items-center gap-1 text-cyan-500 hover:text-cyan-400 font-bold hover:underline cursor-pointer transition-colors"
                  >
                    <span className="material-symbols-outlined text-[16px]">refresh</span>
                    <span>{isEn ? 'Resend code' : 'Reenviar código'}</span>
                  </button>
                )}
              </div>

              <div className="pt-2">
                <button
                  id="btn-validate-code"
                  type="submit"
                  disabled={isLoading || verificationCode.length !== 6}
                  className="w-full bg-gradient-to-r from-blue-600 via-cyan-600 to-teal-500 hover:from-blue-500 hover:via-cyan-500 hover:to-teal-400 active:opacity-90 text-white font-bold text-base py-3.5 rounded-xl transition-all duration-200 cursor-pointer text-center shadow-lg shadow-cyan-500/25 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>{isEn ? 'Validating code...' : 'Validando código...'}</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[20px]">verified_user</span>
                      <span>{isEn ? 'Validate code' : 'Validar código'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ========================================================================= */}
        {/* PANTALLA 3: Restablecer Contraseña                                        */}
        {/* ========================================================================= */}
        {step === 3 && (
          <div>
            <div className="text-center sm:text-left mb-4">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/15 border border-cyan-400/30 text-cyan-500 flex items-center justify-center mb-3 shadow-inner">
                <span className="material-symbols-outlined text-[26px]">lock_reset</span>
              </div>
              <h3 className={`text-2xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {isEn ? 'Reset Password' : 'Restablecer Contraseña'}
              </h3>
              <p className={`text-sm mt-1 leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                {isEn
                  ? 'Define your new password for account:'
                  : 'Define tu nueva contraseña para la cuenta:'}{' '}
                <strong className={isDark ? 'text-cyan-300 font-semibold' : 'text-blue-700 font-semibold'}>{email}</strong>
              </p>
            </div>

            <form onSubmit={handleResetPassword} className="space-y-3.5">
              {/* Nueva Contraseña */}
              <div>
                <label className={`block text-xs font-bold uppercase tracking-wider mb-1 ${isDark ? 'text-cyan-300' : 'text-blue-900'}`}>
                  {isEn ? 'New password' : 'Nueva contraseña'}
                </label>
                <div className="relative">
                  <input
                    id="recovery-new-password"
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      setErrorMessage(null);
                    }}
                    placeholder=""
                    className={`w-full pl-4 pr-11 py-3 text-base rounded-xl outline-none transition-all ${
                      isDark
                        ? 'bg-slate-950/60 border border-slate-700 text-white focus:border-cyan-400'
                        : 'bg-slate-50 border border-slate-300 text-slate-900 focus:border-blue-600 focus:bg-white'
                    }`}
                    required
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-cyan-500 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      {showNewPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Confirmar Nueva Contraseña */}
              <div>
                <label className={`block text-xs font-bold uppercase tracking-wider mb-1 ${isDark ? 'text-cyan-300' : 'text-blue-900'}`}>
                  {isEn ? 'Confirm new password' : 'Confirmar nueva contraseña'}
                </label>
                <div className="relative">
                  <input
                    id="recovery-confirm-password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      setErrorMessage(null);
                    }}
                    placeholder=""
                    className={`w-full pl-4 pr-11 py-3 text-base rounded-xl outline-none transition-all ${
                      isDark
                        ? 'bg-slate-950/60 border border-slate-700 text-white focus:border-cyan-400'
                        : 'bg-slate-50 border border-slate-300 text-slate-900 focus:border-blue-600 focus:bg-white'
                    }`}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-cyan-500 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      {showConfirmPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Password Strength Meter */}
              {newPassword.length > 0 && (
                <div className="space-y-2 pt-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className={isDark ? 'text-slate-400' : 'text-slate-600'}>
                      {isEn ? 'Password strength:' : 'Nivel de seguridad:'}
                    </span>
                    <span className={`font-bold ${getStrengthLabel().color}`}>
                      {getStrengthLabel().label}
                    </span>
                  </div>
                  <div className={`w-full h-1.5 rounded-full overflow-hidden ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`}>
                    <div
                      className={`h-full transition-all duration-300 ${getStrengthLabel().bg}`}
                      style={{ width: `${strengthScore}%` }}
                    />
                  </div>

                  {/* Checklist Rules */}
                  <div className="grid grid-cols-2 gap-1.5 pt-1 text-[11px]">
                    <div className={`flex items-center gap-1.5 ${hasMinLength ? 'text-emerald-500 font-semibold' : isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      <span className="material-symbols-outlined text-[14px]">
                        {hasMinLength ? 'check_circle' : 'radio_button_unchecked'}
                      </span>
                      <span>{isEn ? 'Min. 8 characters' : 'Mín. 8 caracteres'}</span>
                    </div>
                    <div className={`flex items-center gap-1.5 ${hasUppercase ? 'text-emerald-500 font-semibold' : isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      <span className="material-symbols-outlined text-[14px]">
                        {hasUppercase ? 'check_circle' : 'radio_button_unchecked'}
                      </span>
                      <span>{isEn ? 'Uppercase (A-Z)' : 'Mayúscula (A-Z)'}</span>
                    </div>
                    <div className={`flex items-center gap-1.5 ${hasLowercase ? 'text-emerald-500 font-semibold' : isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      <span className="material-symbols-outlined text-[14px]">
                        {hasLowercase ? 'check_circle' : 'radio_button_unchecked'}
                      </span>
                      <span>{isEn ? 'Lowercase (a-z)' : 'Minúscula (a-z)'}</span>
                    </div>
                    <div className={`flex items-center gap-1.5 ${hasSpecial ? 'text-emerald-500 font-semibold' : isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      <span className="material-symbols-outlined text-[14px]">
                        {hasSpecial ? 'check_circle' : 'radio_button_unchecked'}
                      </span>
                      <span>{isEn ? 'Special (!@#$)' : 'Carácter especial (!@#$)'}</span>
                    </div>
                  </div>
                </div>
              )}

              {errorMessage && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/40 text-rose-500 text-xs sm:text-sm rounded-xl flex items-start gap-2 animate-in fade-in">
                  <span className="material-symbols-outlined text-[18px] text-rose-500 shrink-0 mt-0.5">error</span>
                  <span>{translateError(errorMessage)}</span>
                </div>
              )}

              <div className="pt-2">
                <button
                  id="btn-save-new-password"
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-blue-600 via-cyan-600 to-teal-500 hover:from-blue-500 hover:via-cyan-500 hover:to-teal-400 active:opacity-90 text-white font-bold text-base py-3.5 rounded-xl transition-all duration-200 cursor-pointer text-center shadow-lg shadow-cyan-500/25 flex items-center justify-center gap-2 disabled:opacity-75"
                >
                  {isLoading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>{isEn ? 'Saving password...' : 'Guardando y actualizando contraseña...'}</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[20px]">save</span>
                      <span>{isEn ? 'Save and update password' : 'Guardar y actualizar contraseña'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 5. FINALIZACIÓN: Alerta modal limpia y redirección automática             */}
        {/* ========================================================================= */}
        {step === 4 && (
          <div className="text-center py-6 animate-in zoom-in-95 duration-300">
            <div className="w-20 h-20 rounded-full bg-emerald-500/20 border-2 border-emerald-400 text-emerald-400 flex items-center justify-center mx-auto mb-4 shadow-[0_0_24px_rgba(16,185,129,0.35)]">
              <span className="material-symbols-outlined text-[44px]">check_circle</span>
            </div>
            
            <h3 className={`text-2xl sm:text-3xl font-black tracking-tight mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {isEn ? 'Password updated successfully!' : '¡Contraseña actualizada con éxito!'}
            </h3>
            
            <p className={`text-sm sm:text-base max-w-sm mx-auto mb-6 leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              {isEn
                ? 'Your password has been changed. Redirecting automatically to sign in...'
                : 'Tu contraseña ha sido modificada. Redirigiendo automáticamente a la pantalla de iniciar sesión...'}
            </p>

            <button
              id="btn-back-to-login"
              type="button"
              onClick={() => {
                if (onPasswordResetSuccess) {
                  onPasswordResetSuccess(email);
                }
                onClose();
              }}
              className="w-full bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:via-teal-500 hover:to-cyan-500 active:opacity-90 text-white font-bold text-base py-3.5 rounded-xl transition-all duration-200 cursor-pointer shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-[20px]">login</span>
              <span>{isEn ? 'Sign in now' : 'Iniciar sesión ahora'}</span>
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
