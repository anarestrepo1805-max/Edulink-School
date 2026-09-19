import React, { useState, useEffect } from 'react';

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
  ].filter(Boolean).length;

  const getStrengthMeta = () => {
    if (newPassword.length === 0) return { label: 'Sin ingresar', color: 'bg-slate-700', text: 'text-slate-400', width: 'w-0' };
    if (strengthScore <= 2) return { label: 'Débil', color: 'bg-rose-500', text: 'text-rose-400', width: 'w-1/4' };
    if (strengthScore === 3) return { label: 'Media', color: 'bg-amber-400', text: 'text-amber-300', width: 'w-2/4' };
    if (strengthScore === 4) return { label: 'Segura', color: 'bg-cyan-400', text: 'text-cyan-300', width: 'w-3/4' };
    return { label: 'Excelente', color: 'bg-emerald-400', text: 'text-emerald-300', width: 'w-full' };
  };

  const strengthMeta = getStrengthMeta();

  // Handlers for OTP Inputs
  const handleOtpChange = (index: number, value: string) => {
    const digit = value.replace(/[^0-9]/g, '').slice(-1);
    const updated = [...otpDigits];
    updated[index] = digit;
    setOtpDigits(updated);
    setErrorMessage(null);

    // Auto-focus next input if digit entered
    if (digit && index < 5) {
      const nextInput = document.getElementById(`recovery-otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      const prevInput = document.getElementById(`recovery-otp-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, 6);
    if (pasted) {
      const updated = [...otpDigits];
      for (let i = 0; i < 6; i++) {
        updated[i] = pasted[i] || '';
      }
      setOtpDigits(updated);
      const focusIndex = Math.min(pasted.length, 5);
      const targetInput = document.getElementById(`recovery-otp-${focusIndex}`);
      targetInput?.focus();
    }
  };

  // Step 1: Send Verification Code
  const handleSendVerificationCode = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setErrorMessage('Por favor ingresa tu correo electrónico institucional.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      setErrorMessage('Ingresa un formato de correo electrónico válido (ej. usuario@edulink.edu.co).');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      const newCode = Math.floor(100000 + Math.random() * 900000).toString();
      setDemoCode(newCode);
      setResendTimer(60);
      setNoticeMessage(`Código de verificación enviado al correo ${cleanEmail}.`);
      setStep(2);
    }, 700);
  };

  // Step 2: Resend Code
  const handleResendCode = () => {
    if (resendTimer > 0) return;
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      const newCode = Math.floor(100000 + Math.random() * 900000).toString();
      setDemoCode(newCode);
      setResendTimer(60);
      setOtpDigits(['', '', '', '', '', '']);
      setNoticeMessage(`Hemos reenviado un nuevo código a ${email}.`);
    }, 500);
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const enteredCode = otpDigits.join('');
    if (enteredCode.length < 6) {
      setErrorMessage('Por favor ingresa los 6 dígitos del código de verificación.');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      // Accept demoCode or any valid 6 digit submission for smooth simulation
      setNoticeMessage(null);
      setStep(3);
    }, 600);
  };

  // Step 3: Save and Reset Password
  const handleSavePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!hasMinLength) {
      setErrorMessage('La contraseña debe tener al menos 8 caracteres.');
      return;
    }
    if (!hasUppercase || !hasLowercase) {
      setErrorMessage('La contraseña debe contener al menos una letra mayúscula y una minúscula.');
      return;
    }
    if (!hasSpecial) {
      setErrorMessage('La contraseña debe contener al menos un carácter especial (ej. @, #, $, !).');
      return;
    }
    if (!passwordsMatch) {
      setErrorMessage('Las contraseñas no coinciden. Verifica e intenta nuevamente.');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setStep(4);
      if (onPasswordResetSuccess) {
        onPasswordResetSuccess(email);
      }
    }, 800);
  };

  return (
    <div
      id="password-recovery-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-[500px] bg-slate-900/90 backdrop-blur-xl border border-cyan-500/30 rounded-3xl shadow-[0_16px_48px_rgba(0,0,0,0.5)] overflow-hidden text-slate-100 p-6 sm:p-8">
        
        {/* Top cyan glowing line */}
        <div className="absolute top-0 left-1/4 right-1/4 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent pointer-events-none" />

        {/* Close button (only visible on steps 1, 2, 3) */}
        {step !== 4 && (
          <button
            id="btn-close-recovery"
            type="button"
            onClick={onClose}
            className="absolute top-5 right-5 w-8 h-8 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            title="Cerrar ventana"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        )}

        {/* Steps Progress Indicator (Steps 1 to 3) */}
        {step !== 4 && (
          <div className="flex items-center justify-between gap-2 mb-6">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 font-bold text-xs flex items-center justify-center">
                {step}
              </div>
              <span className="text-xs uppercase tracking-wider font-semibold text-cyan-300">
                Paso {step} de 3
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className={`w-8 h-1.5 rounded-full transition-all ${step >= 1 ? 'bg-cyan-400' : 'bg-slate-700'}`} />
              <span className={`w-8 h-1.5 rounded-full transition-all ${step >= 2 ? 'bg-cyan-400' : 'bg-slate-700'}`} />
              <span className={`w-8 h-1.5 rounded-full transition-all ${step >= 3 ? 'bg-cyan-400' : 'bg-slate-700'}`} />
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* PASO 1: Ingreso de correo electrónico institucional                       */}
        {/* ========================================================================= */}
        {step === 1 && (
          <div>
            <div className="text-center sm:text-left mb-5">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/15 border border-cyan-400/30 text-cyan-400 flex items-center justify-center mb-3 shadow-inner">
                <span className="material-symbols-outlined text-[26px]">mark_email_read</span>
              </div>
              <h3 className="text-2xl font-bold text-white tracking-tight">Recuperar Contraseña</h3>
              <p className="text-sm text-slate-300 mt-1 leading-relaxed">
                Ingresa tu correo electrónico institucional registrado para recibir un código de verificación de 6 dígitos.
              </p>
            </div>

            <form onSubmit={handleSendVerificationCode} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-cyan-300 uppercase tracking-wider mb-1.5">
                  Correo Electrónico Institucional
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 material-symbols-outlined text-[22px] text-cyan-400/80">
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
                    className="w-full pl-11 pr-4 py-3.5 text-base bg-slate-950/60 border border-slate-700/80 rounded-xl focus:bg-slate-900/90 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/25 outline-none text-white transition-all"
                    required
                    autoFocus
                  />
                </div>
              </div>

              {errorMessage && (
                <div className="p-3 bg-rose-950/70 border border-rose-500/40 text-rose-200 text-xs sm:text-sm rounded-xl flex items-start gap-2 animate-in fade-in">
                  <span className="material-symbols-outlined text-[18px] text-rose-400 shrink-0 mt-0.5">error</span>
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
                      <span>Enviando código...</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[20px]">send</span>
                      <span>Enviar código de verificación</span>
                    </>
                  )}
                </button>
              </div>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="text-slate-400 hover:text-white text-xs font-semibold hover:underline cursor-pointer transition-colors"
                >
                  Cancelar y regresar
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ========================================================================= */}
        {/* PASO 2: Verificación de Código OTP de 6 Dígitos                           */}
        {/* ========================================================================= */}
        {step === 2 && (
          <div>
            <div className="text-center sm:text-left mb-4">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/15 border border-cyan-400/30 text-cyan-400 flex items-center justify-center mb-3 shadow-inner">
                <span className="material-symbols-outlined text-[26px]">pin</span>
              </div>
              <h3 className="text-2xl font-bold text-white tracking-tight">Verificación de Código</h3>
              <p className="text-sm text-slate-300 mt-1 leading-relaxed">
                Ingresa el código de 6 dígitos que enviamos a{' '}
                <strong className="text-cyan-300">{email}</strong>.
              </p>
            </div>

            {/* Simulated OTP hint for convenience */}
            <div className="p-3 rounded-xl bg-cyan-950/50 border border-cyan-500/30 flex items-center justify-between gap-2 text-xs text-cyan-200 mb-4">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-cyan-400">info</span>
                <span>Código enviado a tu bandeja de entrada:</span>
              </div>
              <span className="font-mono font-bold tracking-widest text-white bg-cyan-900/60 px-2 py-0.5 rounded border border-cyan-400/40">
                {demoCode}
              </span>
            </div>

            <form onSubmit={handleVerifyOtp} className="space-y-4">
              {/* 6 Digit OTP Inputs */}
              <div>
                <label className="block text-xs font-bold text-cyan-300 uppercase tracking-wider text-center mb-2">
                  Código de 6 dígitos
                </label>
                <div className="flex justify-center gap-2 sm:gap-3">
                  {otpDigits.map((digit, idx) => (
                    <input
                      key={idx}
                      id={`recovery-otp-${idx}`}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(idx, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                      onPaste={idx === 0 ? handleOtpPaste : undefined}
                      className="w-11 h-13 sm:w-12 sm:h-14 text-center text-xl sm:text-2xl font-bold font-mono bg-slate-950/80 border border-slate-700/90 rounded-xl text-cyan-300 focus:bg-slate-900 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/30 outline-none transition-all"
                      autoFocus={idx === 0}
                    />
                  ))}
                </div>
              </div>

              {/* Countdown Timer / Resend Action */}
              <div className="flex items-center justify-center gap-2 text-xs sm:text-sm pt-1">
                {resendTimer > 0 ? (
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <span className="material-symbols-outlined text-[18px] text-cyan-400 animate-spin" style={{ animationDuration: '4s' }}>
                      timer
                    </span>
                    <span>
                      Reenviar código en <strong className="text-cyan-300 font-mono font-bold">{resendTimer}s</strong>
                    </span>
                  </div>
                ) : (
                  <button
                    id="btn-resend-otp"
                    type="button"
                    onClick={handleResendCode}
                    disabled={isLoading}
                    className="inline-flex items-center gap-1.5 text-cyan-400 hover:text-cyan-300 font-bold hover:underline cursor-pointer transition-colors"
                  >
                    <span className="material-symbols-outlined text-[18px]">refresh</span>
                    <span>Reenviar código ahora</span>
                  </button>
                )}
              </div>

              {noticeMessage && (
                <div className="p-2.5 bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 text-xs rounded-xl flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px] text-cyan-400">check_circle</span>
                  <span>{noticeMessage}</span>
                </div>
              )}

              {errorMessage && (
                <div className="p-3 bg-rose-950/70 border border-rose-500/40 text-rose-200 text-xs sm:text-sm rounded-xl flex items-start gap-2 animate-in fade-in">
                  <span className="material-symbols-outlined text-[18px] text-rose-400 shrink-0 mt-0.5">error</span>
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
                  className="w-full sm:w-1/3 bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-300 font-semibold text-sm py-3.5 rounded-xl transition-colors cursor-pointer"
                >
                  Cambiar correo
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
                      <span>Verificando...</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[20px]">verified</span>
                      <span>Verificar código</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ========================================================================= */}
        {/* PASO 3: Restablecer Contraseña (Nueva & Confirmación)                      */}
        {/* ========================================================================= */}
        {step === 3 && (
          <div>
            <div className="text-center sm:text-left mb-4">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/15 border border-cyan-400/30 text-cyan-400 flex items-center justify-center mb-3 shadow-inner">
                <span className="material-symbols-outlined text-[26px]">lock_reset</span>
              </div>
              <h3 className="text-2xl font-bold text-white tracking-tight">Nueva Contraseña</h3>
              <p className="text-sm text-slate-300 mt-1 leading-relaxed">
                Crea una nueva contraseña segura para tu cuenta institucional de Edulink School.
              </p>
            </div>

            <form onSubmit={handleSavePassword} className="space-y-4">
              {/* Nueva Contraseña */}
              <div>
                <label className="block text-xs font-bold text-cyan-300 uppercase tracking-wider mb-1.5">
                  Nueva Contraseña
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 material-symbols-outlined text-[22px] text-cyan-400/80">
                    lock
                  </span>
                  <input
                    id="recovery-new-password"
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      setErrorMessage(null);
                    }}
                    placeholder=""
                    className="w-full pl-11 pr-12 py-3 text-base bg-slate-950/60 border border-slate-700/80 rounded-xl focus:bg-slate-900/90 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/25 outline-none text-white transition-all"
                    required
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-cyan-300 p-1 cursor-pointer transition-colors"
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      {showNewPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Password Strength Meter */}
              {newPassword.length > 0 && (
                <div className="space-y-1.5 bg-slate-950/40 p-3 rounded-xl border border-slate-800">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Fuerza de la clave:</span>
                    <span className={`font-bold ${strengthMeta.text}`}>{strengthMeta.label}</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div className={`h-full ${strengthMeta.color} ${strengthMeta.width} transition-all duration-300`} />
                  </div>
                  <div className="grid grid-cols-2 gap-1.5 pt-1 text-[11px] text-slate-400">
                    <span className={`flex items-center gap-1 ${hasMinLength ? 'text-emerald-400' : 'text-slate-500'}`}>
                      <span className="material-symbols-outlined text-[13px]">{hasMinLength ? 'check' : 'close'}</span>
                      Mínimo 8 caracteres
                    </span>
                    <span className={`flex items-center gap-1 ${hasUppercase && hasLowercase ? 'text-emerald-400' : 'text-slate-500'}`}>
                      <span className="material-symbols-outlined text-[13px]">{hasUppercase && hasLowercase ? 'check' : 'close'}</span>
                      Mayúscula y minúscula
                    </span>
                    <span className={`flex items-center gap-1 ${hasNumber ? 'text-emerald-400' : 'text-slate-500'}`}>
                      <span className="material-symbols-outlined text-[13px]">{hasNumber ? 'check' : 'close'}</span>
                      Al menos un número
                    </span>
                    <span className={`flex items-center gap-1 ${hasSpecial ? 'text-emerald-400' : 'text-slate-500'}`}>
                      <span className="material-symbols-outlined text-[13px]">{hasSpecial ? 'check' : 'close'}</span>
                      Carácter especial
                    </span>
                  </div>
                </div>
              )}

              {/* Confirmar Nueva Contraseña */}
              <div>
                <label className="block text-xs font-bold text-cyan-300 uppercase tracking-wider mb-1.5">
                  Confirmar Nueva Contraseña
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 material-symbols-outlined text-[22px] text-cyan-400/80">
                    lock_clock
                  </span>
                  <input
                    id="recovery-confirm-password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      setErrorMessage(null);
                    }}
                    placeholder=""
                    className="w-full pl-11 pr-12 py-3 text-base bg-slate-950/60 border border-slate-700/80 rounded-xl focus:bg-slate-900/90 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/25 outline-none text-white transition-all"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-cyan-300 p-1 cursor-pointer transition-colors"
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      {showConfirmPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
                {confirmPassword.length > 0 && (
                  <span className={`block text-[11px] mt-1 font-medium ${passwordsMatch ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {passwordsMatch ? '✓ Las contraseñas coinciden' : '✕ Las contraseñas no coinciden'}
                  </span>
                )}
              </div>

              {errorMessage && (
                <div className="p-3 bg-rose-950/70 border border-rose-500/40 text-rose-200 text-xs sm:text-sm rounded-xl flex items-start gap-2 animate-in fade-in">
                  <span className="material-symbols-outlined text-[18px] text-rose-400 shrink-0 mt-0.5">error</span>
                  <span>{errorMessage}</span>
                </div>
              )}

              <div className="pt-2">
                <button
                  id="btn-save-new-password"
                  type="submit"
                  disabled={isLoading || !passwordsMatch || !hasMinLength}
                  className="w-full bg-gradient-to-r from-blue-600 via-cyan-600 to-teal-500 hover:from-blue-500 hover:via-cyan-500 hover:to-teal-400 active:opacity-90 text-white font-bold text-base py-3.5 rounded-xl transition-all duration-200 cursor-pointer text-center shadow-lg shadow-cyan-500/25 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Guardando contraseña...</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[20px]">save</span>
                      <span>Guardar y restablecer</span>
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
            
            <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-2">
              ¡Contraseña actualizada correctamente!
            </h3>
            
            <p className="text-slate-300 text-sm sm:text-base max-w-sm mx-auto mb-6 leading-relaxed">
              Tu contraseña institucional para la cuenta <strong className="text-cyan-300">{email}</strong> ha sido restablecida con éxito. Ya puedes ingresar con tu nueva clave.
            </p>

            <button
              id="btn-back-to-login"
              type="button"
              onClick={onClose}
              className="w-full bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:via-teal-500 hover:to-cyan-500 active:opacity-90 text-white font-bold text-base py-3.5 rounded-xl transition-all duration-200 cursor-pointer shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-[20px]">login</span>
              <span>Regresar al Inicio de Sesión</span>
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
