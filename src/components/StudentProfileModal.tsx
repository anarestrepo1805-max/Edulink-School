import React, { useState, useRef } from 'react';
import { UserProfile } from '../types';
import { ASSETS } from '../data/mockData';
import { useThemeLanguage } from '../context/ThemeLanguageContext';
import { uploadStudentProfilePhoto, updateStudentContactInfo } from '../services/studentProfileService';

interface StudentProfileModalProps {
  currentUser: UserProfile;
  isOpen: boolean;
  onClose: () => void;
  onUpdateUser: (updated: UserProfile) => void;
}

export const StudentProfileModal: React.FC<StudentProfileModalProps> = ({
  currentUser,
  isOpen,
  onClose,
  onUpdateUser
}) => {
  const { theme, language } = useThemeLanguage();
  const isDark = theme === 'dark';
  const isEn = language === 'en';

  const [activeTab, setActiveTab] = useState<'view' | 'edit'>('view');

  // Photo editing state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  // Contact editing state
  const [phone, setPhone] = useState(currentUser.phone || '');
  const [emergencyPhone, setEmergencyPhone] = useState(currentUser.emergencyPhone || '');
  const [isSavingContact, setIsSavingContact] = useState(false);

  // Status feedback messages
  const [feedbackSuccess, setFeedbackSuccess] = useState<string | null>(null);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFeedbackError(null);
    setFeedbackSuccess(null);
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size limit: 5MB
    if (file.size > 5 * 1024 * 1024) {
      setFeedbackError(
        isEn
          ? 'Image file exceeds 5 MB. Please select a smaller photo.'
          : 'El archivo excede el tamaño máximo permitido de 5 MB. Selecciona una fotografía más liviana.'
      );
      return;
    }

    // Check file type
    const validMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (!validMimes.includes(file.type.toLowerCase())) {
      setFeedbackError(
        isEn
          ? 'Unsupported file format. Please upload JPG, PNG or WEBP.'
          : 'Formato no compatible. Por favor sube una imagen en formato JPG, PNG o WEBP.'
      );
      return;
    }

    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
  };

  const handleCancelPhotoSelection = () => {
    setSelectedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setFeedbackError(null);
  };

  const handleSavePhoto = async () => {
    if (!selectedFile) {
      setFeedbackError(
        isEn ? 'Please select a photo first.' : 'Por favor selecciona una fotografía primero.'
      );
      return;
    }

    setIsUploadingPhoto(true);
    setFeedbackError(null);
    setFeedbackSuccess(null);

    try {
      const result = await uploadStudentProfilePhoto(currentUser.id, selectedFile, currentUser);
      onUpdateUser(result.updatedUser);
      setFeedbackSuccess(
        isEn
          ? 'Profile photo updated successfully and persisted to database!'
          : '¡Fotografía de perfil actualizada con éxito en la base de datos institucional!'
      );
      setSelectedFile(null);
      setPreviewUrl(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error desconocido al subir la fotografía.';
      setFeedbackError(msg);
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleSaveContactInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingContact(true);
    setFeedbackError(null);
    setFeedbackSuccess(null);

    try {
      const updated = await updateStudentContactInfo(
        currentUser.id,
        { phone, emergencyPhone },
        currentUser
      );
      onUpdateUser(updated);
      setFeedbackSuccess(
        isEn
          ? 'Contact information saved successfully in the database.'
          : 'Información de contacto actualizada correctamente en la base de datos.'
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al guardar los datos de contacto.';
      setFeedbackError(msg);
    } finally {
      setIsSavingContact(false);
    }
  };

  const currentDisplayAvatar = previewUrl || currentUser.avatarUrl || ASSETS.studentAvatar;
  const gradeDisplay = currentUser.gradeLevel || '11°1';

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div
        className={`w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden border my-6 animate-in zoom-in-95 duration-200 ${
          isDark
            ? 'bg-slate-900 border-slate-700/80 text-slate-100 shadow-black/80'
            : 'bg-white border-[#e5eeff] text-[#0b1c30]'
        }`}
      >
        {/* MODAL HEADER */}
        <div
          className={`px-6 py-5 text-white flex items-center justify-between border-b ${
            isDark
              ? 'bg-gradient-to-r from-slate-950 via-slate-900 to-cyan-950 border-cyan-500/20'
              : 'bg-gradient-to-r from-[#00288e] via-[#0051d5] to-[#1e40af] border-[#1e40af]'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center text-white border border-white/20">
              <span className="material-symbols-outlined text-[24px]">manage_accounts</span>
            </div>
            <div>
              <h2 className="text-lg font-extrabold tracking-tight leading-tight">
                {isEn ? 'Student Profile & Settings' : 'Mi Perfil • Rol Estudiante'}
              </h2>
              <span className="text-xs text-cyan-200">
                {isEn ? 'Institution: I.E. Vallejuelos • Medellín' : 'Institución: I.E. Vallejuelos • Medellín'}
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
            title={isEn ? 'Close' : 'Cerrar'}
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* TAB CONTROLS */}
        <div
          className={`flex border-b px-6 pt-2 gap-4 ${
            isDark ? 'border-slate-800 bg-slate-950/40' : 'border-[#eff4ff] bg-[#f8faff]'
          }`}
        >
          <button
            type="button"
            onClick={() => {
              setActiveTab('view');
              setFeedbackError(null);
              setFeedbackSuccess(null);
            }}
            className={`pb-3 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'view'
                ? isDark
                  ? 'border-cyan-400 text-cyan-300'
                  : 'border-[#00288e] text-[#00288e]'
                : isDark
                ? 'border-transparent text-slate-400 hover:text-slate-200'
                : 'border-transparent text-[#64748b] hover:text-[#0b1c30]'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">badge</span>
            <span>{isEn ? 'Consult Profile' : 'Consultar datos institucionales'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('edit');
              setFeedbackError(null);
              setFeedbackSuccess(null);
            }}
            className={`pb-3 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'edit'
                ? isDark
                  ? 'border-cyan-400 text-cyan-300'
                  : 'border-[#00288e] text-[#00288e]'
                : isDark
                ? 'border-transparent text-slate-400 hover:text-slate-200'
                : 'border-transparent text-[#64748b] hover:text-[#0b1c30]'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">add_a_photo</span>
            <span>{isEn ? 'Edit Profile & Photo' : 'Editar perfil y foto'}</span>
          </button>
        </div>

        {/* FEEDBACK BANNERS */}
        <div className="px-6 pt-4">
          {feedbackSuccess && (
            <div className="p-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center gap-2 animate-in fade-in">
              <span className="material-symbols-outlined text-[20px] text-emerald-400 shrink-0">check_circle</span>
              <span className="flex-1">{feedbackSuccess}</span>
            </div>
          )}
          {feedbackError && (
            <div className="p-3 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs font-bold flex items-center gap-2 animate-in fade-in">
              <span className="material-symbols-outlined text-[20px] text-rose-400 shrink-0">error</span>
              <span className="flex-1">{feedbackError}</span>
            </div>
          )}
        </div>

        {/* TAB 1: CONSULTAR DATOS (READ-ONLY INSTITUTIONAL RECORD) */}
        {activeTab === 'view' && (
          <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
            {/* Top Identity Card */}
            <div
              className={`p-5 rounded-2xl border flex flex-col sm:flex-row items-center gap-5 ${
                isDark
                  ? 'bg-slate-950/60 border-slate-800'
                  : 'bg-gradient-to-r from-[#eff4ff] to-[#f8faff] border-[#dce9ff]'
              }`}
            >
              <div className="relative shrink-0">
                <img
                  src={currentDisplayAvatar}
                  alt={currentUser.fullName}
                  className={`w-24 h-24 rounded-full object-cover ring-4 shadow-lg ${
                    isDark ? 'ring-cyan-500/40' : 'ring-[#1e40af]/30'
                  }`}
                />
                <span className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center text-white" title="Activo">
                  <span className="material-symbols-outlined text-[14px]">check</span>
                </span>
              </div>

              <div className="flex flex-col text-center sm:text-left min-w-0">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold self-center sm:self-start bg-cyan-950/80 text-cyan-300 border border-cyan-800/60 mb-1">
                  <span className="material-symbols-outlined text-[14px]">school</span>
                  {/* Clean student role: NO 'Taller 1' */}
                  <span>{isEn ? 'STUDENT' : 'ESTUDIANTE'}</span>
                </div>
                <h3 className={`text-xl font-extrabold leading-tight ${isDark ? 'text-white' : 'text-[#0b1c30]'}`}>
                  {currentUser.fullName}
                </h3>
                <span className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-[#444653]'}`}>
                  {currentUser.email}
                </span>

                <div className="mt-3 flex flex-wrap gap-2 justify-center sm:justify-start">
                  <button
                    type="button"
                    onClick={() => setActiveTab('edit')}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      isDark
                        ? 'bg-cyan-600 hover:bg-cyan-500 text-white'
                        : 'bg-[#00288e] hover:bg-[#1e40af] text-white shadow-xs'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[16px]">edit</span>
                    <span>{isEn ? 'Change Photo & Info' : 'Editar perfil y foto'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Official Institutional Fields Grid */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-[#444653]'}`}>
                  {isEn ? 'Official Institutional Information' : 'Datos Oficiales del Censo Institucional'}
                </span>
                <span className="text-[11px] text-amber-500 font-semibold flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">lock</span>
                  {isEn ? 'Institutional lock' : 'Campos protegidos'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* 1. Nombre */}
                <div className={`p-3.5 rounded-2xl border ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-white border-[#e5eeff]'}`}>
                  <span className={`block text-[11px] font-bold uppercase ${isDark ? 'text-slate-400' : 'text-[#64748b]'}`}>
                    {isEn ? 'Full Name' : 'Nombre Completo'}
                  </span>
                  <span className={`text-sm font-bold block mt-0.5 ${isDark ? 'text-white' : 'text-[#0b1c30]'}`}>
                    {currentUser.fullName}
                  </span>
                </div>

                {/* 2. Documento */}
                <div className={`p-3.5 rounded-2xl border ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-white border-[#e5eeff]'}`}>
                  <span className={`block text-[11px] font-bold uppercase ${isDark ? 'text-slate-400' : 'text-[#64748b]'}`}>
                    {isEn ? 'Document ID' : 'Documento de Identidad'}
                  </span>
                  <span className={`text-sm font-bold block mt-0.5 font-mono ${isDark ? 'text-white' : 'text-[#0b1c30]'}`}>
                    {currentUser.documentId || '--'}
                  </span>
                </div>

                {/* 3. Grado y Grupo */}
                <div className={`p-3.5 rounded-2xl border ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-white border-[#e5eeff]'}`}>
                  <span className={`block text-[11px] font-bold uppercase ${isDark ? 'text-cyan-400' : 'text-[#00288e]'}`}>
                    {isEn ? 'Grade & Group' : 'Grado y Grupo Asignado'}
                  </span>
                  <span className={`text-sm font-bold block mt-0.5 ${isDark ? 'text-cyan-300' : 'text-[#00288e]'}`}>
                    {gradeDisplay}
                  </span>
                </div>

                {/* 4. Matrícula / Código */}
                <div className={`p-3.5 rounded-2xl border ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-white border-[#e5eeff]'}`}>
                  <span className={`block text-[11px] font-bold uppercase ${isDark ? 'text-cyan-400' : 'text-[#00288e]'}`}>
                    {isEn ? 'Student Code / Matricula' : 'Código de Matrícula'}
                  </span>
                  <span className={`text-sm font-bold block mt-0.5 font-mono ${isDark ? 'text-cyan-300' : 'text-[#00288e]'}`}>
                    {currentUser.studentCode || currentUser.documentId || '--'}
                  </span>
                </div>

                {/* 5. Jornada */}
                <div className={`p-3.5 rounded-2xl border ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-white border-[#e5eeff]'}`}>
                  <span className={`block text-[11px] font-bold uppercase ${isDark ? 'text-slate-400' : 'text-[#64748b]'}`}>
                    {isEn ? 'School Shift' : 'Jornada Institucional'}
                  </span>
                  <span className={`text-sm font-semibold block mt-0.5 ${isDark ? 'text-slate-200' : 'text-[#0b1c30]'}`}>
                    {currentUser.shift || 'Jornada Mañana (6:15 AM - 12:15 PM)'}
                  </span>
                </div>

                {/* 6. Institución */}
                <div className={`p-3.5 rounded-2xl border ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-white border-[#e5eeff]'}`}>
                  <span className={`block text-[11px] font-bold uppercase ${isDark ? 'text-slate-400' : 'text-[#64748b]'}`}>
                    {isEn ? 'School Institution' : 'Sede e Institución'}
                  </span>
                  <span className={`text-sm font-semibold block mt-0.5 ${isDark ? 'text-slate-200' : 'text-[#0b1c30]'}`}>
                    {currentUser.institution || 'I.E. Vallejuelos • Sede Principal'}
                  </span>
                </div>

                {/* 7. Teléfono de contacto */}
                <div className={`p-3.5 rounded-2xl border ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-white border-[#e5eeff]'}`}>
                  <span className={`block text-[11px] font-bold uppercase ${isDark ? 'text-slate-400' : 'text-[#64748b]'}`}>
                    {isEn ? 'Phone Number' : 'Teléfono / Móvil'}
                  </span>
                  <span className={`text-sm font-semibold block mt-0.5 ${isDark ? 'text-slate-200' : 'text-[#0b1c30]'}`}>
                    {currentUser.phone || (isEn ? 'Not registered' : 'No registrado')}
                  </span>
                </div>

                {/* 8. Teléfono de Emergencia */}
                <div className={`p-3.5 rounded-2xl border ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-white border-[#e5eeff]'}`}>
                  <span className={`block text-[11px] font-bold uppercase ${isDark ? 'text-slate-400' : 'text-[#64748b]'}`}>
                    {isEn ? 'Emergency Contact' : 'Contacto de Emergencia'}
                  </span>
                  <span className={`text-sm font-semibold block mt-0.5 ${isDark ? 'text-slate-200' : 'text-[#0b1c30]'}`}>
                    {currentUser.emergencyPhone || (isEn ? 'Not registered' : 'No registrado')}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: EDITAR PERFIL Y CARGAR FOTO (FOTOGRAFÍA REAL CON PREVIEW Y FIREBASE STORAGE) */}
        {activeTab === 'edit' && (
          <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
            {/* PHOTO UPLOADER SECTION */}
            <div
              className={`p-5 rounded-2xl border ${
                isDark ? 'bg-slate-950/70 border-slate-800' : 'bg-[#f8faff] border-[#e2e8f0]'
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-cyan-400 text-[20px]">photo_camera</span>
                  <h4 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-[#0b1c30]'}`}>
                    {isEn ? 'Upload or Change Profile Photo' : 'Actualizar Fotografía de Perfil'}
                  </h4>
                </div>
                <span className="text-[11px] text-slate-400">JPG, PNG o WEBP (Máx. 5MB)</span>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-6">
                {/* Photo Preview Circle */}
                <div className="relative group shrink-0">
                  <img
                    src={currentDisplayAvatar}
                    alt="Preview"
                    className={`w-28 h-28 rounded-full object-cover ring-4 shadow-xl transition-all ${
                      previewUrl
                        ? 'ring-emerald-500 scale-105'
                        : isDark
                        ? 'ring-cyan-500/50'
                        : 'ring-[#00288e]/30'
                    }`}
                  />
                  {previewUrl && (
                    <span className="absolute -top-1 -right-1 bg-emerald-500 text-white rounded-full p-1 shadow-md" title="Vista previa lista para guardar">
                      <span className="material-symbols-outlined text-[16px] block">visibility</span>
                    </span>
                  )}
                </div>

                <div className="flex-1 flex flex-col gap-3 w-full">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/jpeg,image/png,image/webp,image/jpg"
                    className="hidden"
                    id="student-photo-file-input"
                  />

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                        isDark
                          ? 'bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-800/50'
                          : 'bg-white hover:bg-[#eff4ff] text-[#00288e] border border-[#cbd5e1] shadow-xs'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[18px]">upload</span>
                      <span>
                        {selectedFile
                          ? (isEn ? 'Choose another image' : 'Elegir otra imagen')
                          : (isEn ? 'Select photo from device' : 'Seleccionar foto del dispositivo')}
                      </span>
                    </button>

                    {selectedFile && (
                      <button
                        type="button"
                        onClick={handleCancelPhotoSelection}
                        disabled={isUploadingPhoto}
                        className="px-3 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-950/30 transition-colors cursor-pointer"
                      >
                        {isEn ? 'Cancel' : 'Cancelar'}
                      </button>
                    )}
                  </div>

                  {selectedFile && (
                    <div className="text-xs space-y-1">
                      <p className={`font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                        {isEn ? 'Selected file:' : 'Archivo seleccionado:'}{' '}
                        <span className="font-mono text-cyan-400">{selectedFile.name}</span> ({(selectedFile.size / 1024).toFixed(1)} KB)
                      </p>
                      <p className="text-[11px] text-emerald-400 font-bold flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">check</span>
                        {isEn ? 'Preview generated. Click "Save Photo" below to persist.' : 'Vista previa generada. Pulsa "Guardar Fotografía" para guardar permanentemente.'}
                      </p>
                    </div>
                  )}

                  {selectedFile && (
                    <button
                      type="button"
                      onClick={handleSavePhoto}
                      disabled={isUploadingPhoto}
                      className="mt-1 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md disabled:opacity-50 self-start"
                    >
                      {isUploadingPhoto ? (
                        <>
                          <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>{isEn ? 'Uploading to database...' : 'Guardando fotografía en Firebase...'}</span>
                        </>
                      ) : (
                        <>
                          <span className="material-symbols-outlined text-[18px]">cloud_upload</span>
                          <span>{isEn ? 'Save Photo Persistently' : 'Guardar Fotografía'}</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* CONTACT INFO EDITING FORM */}
            <form onSubmit={handleSaveContactInfo} className="space-y-4">
              <div className="flex items-center justify-between">
                <span className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-[#444653]'}`}>
                  {isEn ? 'Contact Information' : 'Información Personal de Contacto'}
                </span>
                <span className="text-[11px] text-slate-500">
                  {isEn ? 'Editable fields' : 'Campos editables por el estudiante'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className={`block text-xs font-bold mb-1 ${isDark ? 'text-slate-300' : 'text-[#333]'}`}>
                    {isEn ? 'Phone / Cell' : 'Teléfono o Celular Personal'}
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Ej: 310 123 4567"
                    className={`w-full h-11 px-3.5 rounded-xl text-xs border focus:outline-none transition-all ${
                      isDark
                        ? 'bg-slate-950 border-slate-700 text-white focus:border-cyan-500'
                        : 'bg-[#f8faff] border-slate-300 text-[#0b1c30] focus:border-[#00288e]'
                    }`}
                  />
                </div>

                <div>
                  <label className={`block text-xs font-bold mb-1 ${isDark ? 'text-slate-300' : 'text-[#333]'}`}>
                    {isEn ? 'Emergency Phone' : 'Teléfono de Contacto de Emergencia'}
                  </label>
                  <input
                    type="tel"
                    value={emergencyPhone}
                    onChange={(e) => setEmergencyPhone(e.target.value)}
                    placeholder="Ej: 320 987 6543 (Acudiente)"
                    className={`w-full h-11 px-3.5 rounded-xl text-xs border focus:outline-none transition-all ${
                      isDark
                        ? 'bg-slate-950 border-slate-700 text-white focus:border-cyan-500'
                        : 'bg-[#f8faff] border-slate-300 text-[#0b1c30] focus:border-[#00288e]'
                    }`}
                  />
                </div>
              </div>

              {/* Protected Institutional Notice */}
              <div
                className={`p-3.5 rounded-2xl border text-xs flex items-start gap-2.5 ${
                  isDark
                    ? 'bg-amber-950/20 border-amber-800/40 text-amber-300/90'
                    : 'bg-amber-50 border-amber-200 text-amber-800'
                }`}
              >
                <span className="material-symbols-outlined text-[20px] text-amber-500 shrink-0 mt-0.5">verified_user</span>
                <div>
                  <strong className="block font-bold">
                    {isEn ? 'Protected Institutional Records' : 'Registros Institucionales Protegidos'}
                  </strong>
                  <span>
                    {isEn
                      ? 'Your student code, grade, assigned group, official identity document, and enrollment shift can only be modified by the school secretariat and directive administration.'
                      : 'Tu código de matrícula, grado, grupo asignado, documento de identidad oficial y jornada solo pueden ser modificados por la Secretaría Académica de la institución.'}
                  </span>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={isSavingContact}
                  className={`px-5 py-2.5 rounded-xl text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-md disabled:opacity-50 ${
                    isDark ? 'bg-cyan-600 hover:bg-cyan-500' : 'bg-[#00288e] hover:bg-[#1e40af]'
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">save</span>
                  <span>{isSavingContact ? (isEn ? 'Saving...' : 'Guardando...') : (isEn ? 'Save Contact Changes' : 'Guardar Datos de Contacto')}</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* MODAL FOOTER */}
        <div
          className={`px-6 py-4 border-t flex items-center justify-between ${
            isDark ? 'bg-slate-950 border-slate-800' : 'bg-[#f8faff] border-[#eff4ff]'
          }`}
        >
          <span className="text-xs text-slate-400 font-mono">
            UID: {currentUser.id.substring(0, 14)}...
          </span>

          <button
            type="button"
            onClick={onClose}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              isDark
                ? 'bg-slate-800 hover:bg-slate-700 text-white'
                : 'bg-white hover:bg-slate-100 text-[#0b1c30] border border-slate-300 shadow-xs'
            }`}
          >
            {isEn ? 'Close' : 'Cerrar'}
          </button>
        </div>
      </div>
    </div>
  );
};
