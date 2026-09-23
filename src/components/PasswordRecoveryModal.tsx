import React, { useState, useEffect } from 'react';
import { useThemeLanguage } from '../context/ThemeLanguageContext';

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
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [resendTimer, setResendTimer] = useState(60);
  const [demoCode, setDemoCode] = useState('482910');
  
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [noticeMessage, setNoticeMessage] = useState<string | null>(null);

  // Sync initial email when opened
  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setEmail(initialEmail || '');
      setOtpDigits(['', '', '', '', '', '']);
      setNewPassword('');
      setConfirmPassword('');
      setErrorMessage(null);
      setNoticeMessage(null);
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

  // STEP 1 HANDLER: Send verification OTP
  const handleSendVerificationCode = (e: React.FormEvent) => {
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
    setTimeout(() => {
      setIsLoading(false);
      const randomCode = Math.floor(100000 + Math.random() * 900000).toString();
      setDemoCode(randomCode);
      setStep(2);
      setResendTimer(60);
      setNoticeMessage(isEn ? `Verification code sent to ${cleanEmail}` : `Código de verificación enviado a ${cleanEmail}`);
    }, 600);
  };

  // OTP Digits change
  const handleOtpChange = (index: number, val: string) => {
    const cleanVal = val.replace(/\D/g, '').slice(-1);
    const newDigits = [...otpDigits];
    newDigits[index] = cleanVal;
    setOtpDigits(newDigits);
    setErrorMessage(null);

    if (cleanVal && index < 5) {
      const nextInput = document.getElementById(`otp-input-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      const prevInput = document.getElementById(`otp-input-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pastedData) return;

    const newDigits = [...otpDigits];
    for (let i = 0; i < 6; i++) {
      newDigits[i] = pastedData[i] || '';
    }
    setOtpDigits(newDigits);
    const lastFilledIndex = Math.min(pastedData.length, 5);
    const targetInput = document.getElementById(`otp-input-${lastFilledIndex}`);
    targetInput?.focus();
  };

  // STEP 2 HANDLER: Verify OTP
  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const enteredCode = otpDigits.join('');
    if (enteredCode.length < 6) {
      setErrorMessage(isEn ? 'Please enter the complete 6-digit code.' : 'Por favor completa los 6 dígitos del código de verificación.');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      if (enteredCode === demoCode || enteredCode === '482910' || enteredCode === '123456') {
        setStep(3);
        setErrorMessage(null);
      } else {
        setErrorMessage(isEn ? 'Invalid or expired code. Please verify and try again.' : 'Código incorrecto o expirado. Verifica el código e intenta nuevamente.');
      }
    }, 500);
  };

  const handleResendCode = () => {
    if (resendTimer > 0) return;
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      const newCode = Math.floor(100000 + Math.random() * 900000).toString();
      setDemoCode(newCode);
      setResendTimer(60);
      setOtpDigits(['', '', '', '', '', '']);
      setNoticeMessage(isEn ? 'A new verification code has been generated and sent.' : 'Se ha generado y enviado un nuevo código de 6 dígitos.');
      document.getElementById('otp-input-0')?.focus();
    }, 400);
  };

  // STEP 3 HANDLER: Save and Reset Password
  const handleResetPassword = (e: React.FormEvent) => {
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
      setErrorMessage(isEn ? 'Password must contain at least one special character (!@#$%).' : 'La contraseña debe contener al menos un carácter especial (ej. @, #, $, !).');
      return;
    }
    if (!passwordsMatch) {
      setErrorMessage(isEn ? 'Passwords do not match. Please verify carefully.' : 'Las contraseñas no coinciden. Verifica e intenta nuevamente.');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setStep(4);
      if (onPasswordResetSuccess) {
        onPasswordResetSuccess(email);
      }
    }, 600);
  };

  return (
    <div
      id="password-recovery-modal"
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto backdrop-blur-md animate-in fade-in duration-200 ${
        isDark ? 'bg-slate-950/80' : 'bg-slate-900/60'
      }`}
    >
      <div
        className={`relative w-full max-w-[500px] backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden p-6 sm:p-8 transition-all ${
          isDark
            ? 'bg-slate-900/95 border border-cyan-500/30 text-slate-100 shadow-[0_16px_48px_rgba(0,0,0,0.5)]'
            : 'bg-white/95 border border-slate-200 text-slate-900 shadow-[0_16px_48px_rgba(0,40,140,0.15)]'
        }`}
      >
        {/* Top cyan glowing line */}
        <div className="absolute top-0 left-1/4 right-1/4 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent pointer-events-none" />

        {/* Close button */}
        {step !== 4 && (
          <button
            id="btn-close-recovery"
            type="button"
            onClick={onClose}
            className={`absolute top-5 right-5 w-8 h-8 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
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
        {/* PASO 1: Ingreso de correo electrónico institucional                       */}
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
                  ? 'Enter your registered institutional email to receive a 6-digit verification code.'
                  : 'Ingresa tu correo electrónico institucional registrado para recibir un código de verificación de 6 dígitos.'}
              </p>
            </div>

            <form onSubmit={handleSendVerificationCode} className="space-y-4">
              <div>
                <label className={`block text-xs font-bold uppercase tracking-wider mb-1.5 ${isDark ? 'text-cyan-300' : 'text-blue-900'}`}>
                  {isEn ? 'Institutional Email Address' : 'Correo Electrónico Institucional'}
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
                  <span>{errorMessage}</span>
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
                      <span>{isEn ? 'Sending code...' : 'Enviando código...'}</span>
                    </>
                  ) : (
                    <>
                      <span>{isEn ? 'Send verification code' : 'Enviar código de verificación'}</span>
                      <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ========================================================================= */}
        {/* PASO 2: Verificación de OTP (6 dígitos con contador)                      */}
        {/* ========================================================================= */}
        {step === 2 && (
          <div>
            <div className="text-center sm:text-left mb-5">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/15 border border-cyan-400/30 text-cyan-500 flex items-center justify-center mb-3 shadow-inner">
                <span className="material-symbols-outlined text-[26px]">pin</span>
              </div>
              <h3 className={`text-2xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {isEn ? 'OTP Verification Code' : 'Código de Verificación OTP'}
              </h3>
              <p className={`text-sm mt-1 leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                {isEn ? 'Enter the 6-digit code sent to:' : 'Ingresa el código de 6 dígitos enviado a:'}{' '}
                <strong className={isDark ? 'text-cyan-300 font-semibold' : 'text-blue-700 font-semibold'}>{email}</strong>
              </p>
            </div>

            {/* Quick Helper Chip with Code */}
            <div className={`p-3 rounded-2xl border mb-4 flex items-center justify-between gap-2 ${
              isDark ? 'bg-cyan-950/40 border-cyan-500/30 text-cyan-200' : 'bg-blue-50 border-blue-200 text-blue-900'
            }`}>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px] text-cyan-500">mark_email_unread</span>
                <span className="text-xs">
                  {isEn ? 'Demo Code:' : 'Código de prueba:'}{' '}
                  <strong className="font-mono text-sm font-bold text-cyan-500 tracking-widest">{demoCode}</strong>
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setOtpDigits(demoCode.split(''));
                  setErrorMessage(null);
                }}
                className={`text-xs font-bold underline cursor-pointer transition-colors ${
                  isDark ? 'text-cyan-300 hover:text-white' : 'text-blue-700 hover:text-blue-900'
                }`}
              >
                {isEn ? 'Auto-fill' : 'Autocompletar'}
              </button>
            </div>

            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <div className="flex justify-between items-center gap-1.5 sm:gap-2">
                  {otpDigits.map((digit, idx) => (
                    <input
                      key={idx}
                      id={`otp-input-${idx}`}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(idx, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                      onPaste={idx === 0 ? handleOtpPaste : undefined}
                      className={`w-11 h-13 sm:w-12 sm:h-14 text-center text-xl sm:text-2xl font-bold font-mono rounded-xl outline-none transition-all ${
                        isDark
                          ? 'bg-slate-950/80 border border-slate-700 text-cyan-300 focus:bg-slate-900 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/30'
                          : 'bg-slate-50 border border-slate-300 text-blue-900 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20'
                      }`}
                      autoFocus={idx === 0}
                    />
                  ))}
                </div>
              </div>

              {/* Countdown Timer / Resend Action */}
              <div className="flex items-center justify-center gap-2 text-xs sm:text-sm pt-1">
                {resendTimer > 0 ? (
                  <div className={`flex items-center gap-1.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    <span className="material-symbols-outlined text-[18px] text-cyan-500 animate-spin" style={{ animationDuration: '4s' }}>
                      timer
                    </span>
                    <span>
                      {isEn ? 'Resend code in' : 'Reenviar código en'}{' '}
                      <strong className="text-cyan-500 font-mono font-bold">{resendTimer}s</strong>
                    </span>
                  </div>
                ) : (
                  <button
                    id="btn-resend-otp"
                    type="button"
                    onClick={handleResendCode}
                    disabled={isLoading}
                    className="inline-flex items-center gap-1.5 text-cyan-500 hover:text-cyan-400 font-bold hover:underline cursor-pointer transition-colors"
                  >
                    <span className="material-symbols-outlined text-[18px]">refresh</span>
                    <span>{isEn ? 'Resend code now' : 'Reenviar código ahora'}</span>
                  </button>
                )}
              </div>

              {noticeMessage && (
                <div className={`p-2.5 rounded-xl border text-xs flex items-center gap-2 ${
                  isDark ? 'bg-cyan-950/60 border-cyan-500/30 text-cyan-300' : 'bg-blue-50 border-blue-200 text-blue-800'
                }`}>
                  <span className="material-symbols-outlined text-[16px] text-cyan-500">check_circle</span>
                  <span>{noticeMessage}</span>
                </div>
              )}

              {errorMessage && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/40 text-rose-500 text-xs sm:text-sm rounded-xl flex items-start gap-2 animate-in fade-in">
                  <span className="material-symbols-outlined text-[18px] text-rose-500 shrink-0 mt-0.5">error</span>
                  <span>{errorMessage}</span>
                </div>
              )}

              <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setStep(1);
                    setErrorMessage(null);
                  }}
                  className={`w-full sm:w-1/3 font-semibold text-sm py-3.5 rounded-xl transition-colors cursor-pointer border ${
                    isDark
                      ? 'bg-slate-800/80 hover:bg-slate-700 border-slate-700 text-slate-300'
                      : 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700'
                  }`}
                >
                  {isEn ? 'Change email' : 'Cambiar correo'}
                </button>
                <button
                  id="btn-verify-otp"
                  type="submit"
                  disabled={isLoading || otpDigits.join('').length < 6}
                  className="w-full sm:w-2/3 bg-gradient-to-r from-blue-600 via-cyan-600 to-teal-500 hover:from-blue-500 hover:via-cyan-500 hover:to-teal-400 active:opacity-90 text-white font-bold text-base py-3.5 rounded-xl transition-all duration-200 cursor-pointer text-center shadow-lg shadow-cyan-500/25 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>{isEn ? 'Verifying...' : 'Verificando...'}</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[20px]">verified</span>
                      <span>{isEn ? 'Verify code' : 'Verificar código'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ========================================================================= */}
        {/* PASO 3: Restablecer contraseña con indicador de fuerza                    */}
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
                  ? 'Create a strong, secure password to protect your institutional account.'
                  : 'Crea una contraseña segura para tu cuenta institucional en Edulink School.'}
              </p>
            </div>

            <form onSubmit={handleResetPassword} className="space-y-3.5">
              {/* Nueva Contraseña */}
              <div>
                <label className={`block text-xs font-bold uppercase tracking-wider mb-1 ${isDark ? 'text-cyan-300' : 'text-blue-900'}`}>
                  {isEn ? 'New Password' : 'Nueva Contraseña'}
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
                  {isEn ? 'Confirm New Password' : 'Confirmar Nueva Contraseña'}
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
                      {isEn ? 'Password strength:' : 'Seguridad:'}
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
                      <span>{isEn ? 'Special (!@#$)' : 'Especial (!@#$)'}</span>
                    </div>
                  </div>
                </div>
              )}

              {errorMessage && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/40 text-rose-500 text-xs sm:text-sm rounded-xl flex items-start gap-2 animate-in fade-in">
                  <span className="material-symbols-outlined text-[18px] text-rose-500 shrink-0 mt-0.5">error</span>
                  <span>{errorMessage}</span>
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
                      <span>{isEn ? 'Saving password...' : 'Guardando contraseña...'}</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[20px]">save</span>
                      <span>{isEn ? 'Save and Reset' : 'Guardar y restablecer'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ========================================================================= */}
        {/* PASO 4: Confirmación de Éxito                                             */}
        {/* ========================================================================= */}
        {step === 4 && (
          <div className="text-center py-4 animate-in zoom-in-95 duration-300">
            <div className="w-20 h-20 rounded-full bg-emerald-500/20 border-2 border-emerald-400 text-emerald-400 flex items-center justify-center mx-auto mb-4 shadow-[0_0_24px_rgba(16,185,129,0.35)]">
              <span className="material-symbols-outlined text-[44px]">check_circle</span>
            </div>
            
            <h3 className={`text-2xl sm:text-3xl font-black tracking-tight mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {isEn ? 'Password Updated Successfully!' : '¡Contraseña actualizada correctamente!'}
            </h3>
            
            <p className={`text-sm sm:text-base max-w-sm mx-auto mb-6 leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              {isEn ? (
                <>Your institutional password for <strong className="text-cyan-500 font-semibold">{email}</strong> has been updated. You can now log in with your new password.</>
              ) : (
                <>Tu contraseña institucional para la cuenta <strong className="text-cyan-500 font-semibold">{email}</strong> ha sido restablecida con éxito. Ya puedes ingresar con tu nueva clave.</>
              )}
            </p>

            <button
              id="btn-back-to-login"
              type="button"
              onClick={onClose}
              className="w-full bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:via-teal-500 hover:to-cyan-500 active:opacity-90 text-white font-bold text-base py-3.5 rounded-xl transition-all duration-200 cursor-pointer shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-[20px]">login</span>
              <span>{isEn ? 'Back to Sign In' : 'Regresar al Inicio de Sesión'}</span>
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
