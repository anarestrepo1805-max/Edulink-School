import React, { useState, useEffect } from 'react';
import { useThemeLanguage } from '../context/ThemeLanguageContext';
import { sendFirebasePasswordReset } from '../services/authService';

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
}) => {
  const { theme, language } = useThemeLanguage();
  const isEn = language === 'en';
  const isDark = theme === 'dark';

  const [email, setEmail] = useState(initialEmail);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  // Sync initial email and reset state when opened
  useEffect(() => {
    if (isOpen) {
      setEmail(initialEmail || '');
      setIsLoading(false);
      setErrorMessage(null);
      setIsSubmitted(false);
      setSuccessNotice(null);
    }
  }, [isOpen, initialEmail]);

  if (!isOpen) return null;

  const handleSendResetEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanInput = email.trim();

    if (!cleanInput) {
      setErrorMessage(
        isEn
          ? 'Please enter your registered identity document or email.'
          : 'Por favor ingresa tu documento de identidad registrado o correo electrónico.'
      );
      return;
    }

    setIsLoading(true);
    try {
      // Send official Firebase Authentication reset email or resolve institutional account
      const result = await sendFirebasePasswordReset(cleanInput, language);
      setIsLoading(false);
      setIsSubmitted(true);
      setSuccessNotice(result.message);
    } catch (err: any) {
      setIsLoading(false);
      setErrorMessage(
        err.message ||
          (isEn
            ? 'An error occurred while sending the recovery link. Please try again.'
            : 'Ocurrió un error al enviar el enlace de recuperación. Por favor intenta más tarde.')
      );
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-recovery-title"
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

        {/* ------------------------------------------------------------- */}
        {/* ESTADO 1: Formulario de Solicitud de Correo                     */}
        {/* ------------------------------------------------------------- */}
        {!isSubmitted ? (
          <div>
            {/* Header */}
            <div className="text-center sm:text-left mb-6">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/15 border border-cyan-400/30 text-cyan-500 flex items-center justify-center mb-3 shadow-inner">
                <span className="material-symbols-outlined text-[26px]">lock_reset</span>
              </div>
              <h3
                id="modal-recovery-title"
                className={`text-2xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}
              >
                {isEn ? 'Password Recovery' : 'Recuperar Contraseña'}
              </h3>
              <p className={`text-sm mt-1.5 leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                {isEn
                  ? 'Enter your institutional or registered email address to receive an official Firebase recovery link.'
                  : 'Ingresa tu correo institucional o registrado para recibir el enlace oficial de restablecimiento de Firebase.'}
              </p>
            </div>

            {/* Error Message Box */}
            {errorMessage && (
              <div
                role="alert"
                className="mb-5 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs sm:text-sm flex items-start gap-2.5 animate-in fade-in"
              >
                <span className="material-symbols-outlined text-[20px] shrink-0 mt-0.5">error</span>
                <span className="leading-snug">{errorMessage}</span>
              </div>
            )}

            {/* Email Form */}
            <form onSubmit={handleSendResetEmail} className="space-y-5">
              <div>
                <label
                  htmlFor="input-recovery-email"
                  className={`block text-xs font-bold uppercase tracking-wider mb-2 ${
                    isDark ? 'text-slate-300' : 'text-slate-700'
                  }`}
                >
                  {isEn ? 'Identity Document or Registered Email' : 'Documento de Identidad o Correo Registrado'}
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">
                    badge
                  </span>
                  <input
                    id="input-recovery-email"
                    type="text"
                    autoFocus
                    autoComplete="username"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setErrorMessage(null);
                    }}
                    placeholder={isEn ? 'e.g. 1001234567 or user@vallejuelos.edu.co' : 'ej. 1001234567 o usuario@vallejuelos.edu.co'}
                    className={`w-full pl-11 pr-4 py-3 rounded-2xl text-sm border outline-none transition-all ${
                      isDark
                        ? 'bg-slate-800/80 border-slate-700 text-white placeholder:text-slate-500 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20'
                        : 'bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20'
                    }`}
                  />
                </div>
              </div>

              {/* Informative Security Tip */}
              <div
                className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 ${
                  isDark ? 'bg-cyan-950/30 border-cyan-500/30 text-cyan-200' : 'bg-cyan-50 border-cyan-200 text-cyan-900'
                }`}
              >
                <span className="material-symbols-outlined text-[18px] text-cyan-500 shrink-0 mt-0.5">shield</span>
                <span className="leading-relaxed">
                  {isEn
                    ? 'Firebase Authentication will generate a secure one-time link to create a new password.'
                    : 'Firebase Authentication generará un enlace seguro de un solo uso para que crees tu nueva contraseña.'}
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col-reverse sm:flex-row items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isLoading}
                  className={`w-full sm:w-auto px-5 py-3 rounded-2xl text-sm font-semibold transition-colors flex items-center justify-center gap-2 cursor-pointer ${
                    isDark
                      ? 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                  <span>{isEn ? 'Back to Sign In' : 'Volver al inicio de sesión'}</span>
                </button>

                <button
                  id="btn-submit-recovery"
                  type="submit"
                  disabled={isLoading}
                  className="w-full sm:flex-1 py-3 px-6 rounded-2xl bg-gradient-to-r from-blue-600 via-cyan-500 to-teal-400 hover:from-blue-500 hover:to-teal-300 text-white font-bold text-sm shadow-lg shadow-cyan-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>{isEn ? 'Sending link...' : 'Enviando enlace...'}</span>
                    </>
                  ) : (
                    <>
                      <span>{isEn ? 'Send Recovery Link' : 'Enviar enlace de recuperación'}</span>
                      <span className="material-symbols-outlined text-[18px]">send</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        ) : (
          /* ------------------------------------------------------------- */
          /* ESTADO 2: Confirmación Exitosa (Genérica Anti-Enumeración)     */
          /* ------------------------------------------------------------- */
          <div className="text-center py-2 animate-in fade-in duration-200">
            {/* Success Icon */}
            <div className="w-16 h-16 rounded-3xl bg-emerald-500/15 border border-emerald-400/30 text-emerald-400 flex items-center justify-center mx-auto mb-4 shadow-inner">
              <span className="material-symbols-outlined text-[34px]">mark_email_read</span>
            </div>

            <h3 className={`text-2xl font-bold tracking-tight mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {isEn ? 'Recovery Link Sent!' : '¡Enlace de recuperación enviado!'}
            </h3>

            <p className={`text-sm leading-relaxed mb-5 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              {successNotice ||
                (isEn
                  ? 'We have sent official Firebase instructions to reset your password directly to this email address.'
                  : 'Hemos enviado las instrucciones y el enlace oficial de Firebase para restablecer tu contraseña directamente a esta dirección de correo.')}
            </p>

            {/* Highlighted Email Badge */}
            <div
              className={`p-3.5 rounded-2xl border mb-4 flex items-center justify-center gap-2 font-mono text-sm font-bold ${
                isDark ? 'bg-slate-800/80 border-slate-700 text-cyan-400' : 'bg-slate-100 border-slate-200 text-cyan-700'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">mail</span>
              <span className="truncate max-w-[280px]">{email}</span>
            </div>

            {/* Spam Folder Alert */}
            <div
              className={`p-3 rounded-2xl border text-xs text-left mb-6 flex items-start gap-2.5 ${
                isDark ? 'bg-amber-500/10 border-amber-500/30 text-amber-300' : 'bg-amber-50 border-amber-200 text-amber-900'
              }`}
            >
              <span className="material-symbols-outlined text-[18px] text-amber-500 shrink-0 mt-0.5">info</span>
              <span className="leading-relaxed">
                {isEn
                  ? 'Please check your primary inbox as well as your Spam or Junk folder. The email is sent directly from Firebase Authentication.'
                  : 'Por favor revisa tu bandeja de entrada principal y también tu carpeta de Spam o Correo no deseado. El mensaje es enviado directamente por Firebase Authentication.'}
              </span>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                type="button"
                onClick={onClose}
                className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-blue-600 via-cyan-500 to-teal-400 hover:from-blue-500 hover:to-teal-300 text-white font-bold text-sm shadow-lg shadow-cyan-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">login</span>
                <span>{isEn ? 'Back to Sign In' : 'Volver al inicio de sesión'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsSubmitted(false);
                  setErrorMessage(null);
                }}
                className={`w-full py-2.5 text-xs font-semibold transition-colors cursor-pointer ${
                  isDark ? 'text-slate-400 hover:text-cyan-400' : 'text-slate-500 hover:text-cyan-600'
                }`}
              >
                {isEn ? 'Didn’t receive it? Send to another address' : '¿No recibiste el correo? Probar con otra dirección'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
