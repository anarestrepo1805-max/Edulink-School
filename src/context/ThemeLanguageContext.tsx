import React, { createContext, useContext, useState, useEffect } from 'react';

export type ThemeMode = 'dark' | 'light';
export type Language = 'es' | 'en';

interface Translations {
  [key: string]: {
    es: string;
    en: string;
  };
}

export const TRANSLATIONS: Translations = {
  // Theme and language buttons
  darkMode: { es: 'Modo Oscuro', en: 'Dark Mode' },
  lightMode: { es: 'Modo Claro', en: 'Light Mode' },
  toggleTheme: { es: 'Cambiar tema', en: 'Toggle theme' },
  language: { es: 'Idioma', en: 'Language' },
  switchLanguage: { es: 'Cambiar a Inglés', en: 'Switch to Spanish' },

  // Top Eyebrow & Brand
  officialPortal: { es: 'Portal Institucional Oficial', en: 'Official Institutional Portal' },
  institutionName: { es: 'I.E. Vallejuelos • Medellín', en: 'I.E. Vallejuelos • Medellín' },
  brandName: { es: 'Edulink School', en: 'Edulink School' },
  brandTagline: { es: 'Sistema Integral de Gestión Académica y Comunitaria', en: 'Comprehensive Academic & Community Management System' },
  heroDescription: {
    es: 'Conecta en tiempo real a estudiantes, docentes, acudientes y equipo directivo en un entorno seguro y unificado.',
    en: 'Connects students, teachers, families, and administrative staff in a secure and unified real-time environment.'
  },

  // Community Cards
  scheduleTitle: { es: 'Jornada', en: 'Schedule' },
  scheduleHours: { es: '6:15 AM - 12:15 PM', en: '6:15 AM - 12:15 PM' },
  scheduleShift: { es: 'Jornada Mañana', en: 'Morning Shift' },
  communityTitle: { es: 'COMUNIDAD', en: 'COMMUNITY' },
  communityGrades: { es: 'Grados 6° a 11° y Grado Pensar', en: 'Grades 6th to 11th & Pensar Grade' },
  communityGroups: {
    es: 'Grupos: 6°1, 6°2, 7°1, 7°2, 8°1, 8°2, 9°1, 9°2, 10°1, 10°2, 11°1, 11°2 y Pensar.',
    en: 'Groups: 6°1, 6°2, 7°1, 7°2, 8°1, 8°2, 9°1, 9°2, 10°1, 10°2, 11°1, 11°2 and Pensar.'
  },

  // Institutional Contact
  addressTitle: { es: 'Dirección', en: 'Address' },
  addressValue: { es: 'Carrera 108 # 63-12, Vallejuelos, Medellín', en: 'Carrera 108 # 63-12, Vallejuelos, Medellín' },
  phoneTitle: { es: 'Teléfono', en: 'Phone' },
  phoneValue: { es: '(+57) 604 421 8900 / 312 849 5012', en: '(+57) 604 421 8900 / 312 849 5012' },
  hoursTitle: { es: 'Horario de Atención', en: 'Office Hours' },
  hoursValue: { es: 'Lunes a Viernes: 6:30 AM - 3:30 PM', en: 'Monday to Friday: 6:30 AM - 3:30 PM' },

  // Login Card
  loginTitle: { es: 'Iniciar Sesión', en: 'Sign In' },
  loginSubtitle: { es: 'Ingresa a tu cuenta institucional', en: 'Access your institutional account' },
  idOrEmailLabel: { es: 'Documento de Identidad o Correo Institucional', en: 'ID Document or Institutional Email' },
  passwordLabel: { es: 'Contraseña', en: 'Password' },
  enterPlatform: { es: 'Entrar a la Plataforma', en: 'Enter Platform' },
  loggingIn: { es: 'Iniciando sesión...', en: 'Signing in...' },
  forgotPassword: { es: '¿Olvidaste tu contraseña?', en: 'Forgot your password?' },
  noAccountQuestion: { es: '¿No tienes una cuenta institucional?', en: "Don't have an institutional account?" },
  createAccount: { es: 'Crear cuenta nueva', en: 'Create new account' },
  quickAccessDemo: { es: 'Acceso Rápido de Prueba', en: 'Quick Demo Access' },

  // Roles
  student: { es: 'Estudiante', en: 'Student' },
  teacher: { es: 'Docente', en: 'Teacher' },
  family: { es: 'Acudiente / Familia', en: 'Family / Guardian' },
  admin: { es: 'Administrativo', en: 'Staff & Leadership' },

  // Role descriptions
  studentDesc: { es: 'Acceso a notas y tareas', en: 'Grades & assignments' },
  teacherDesc: { es: 'Planilla de notas', en: 'Gradebook & attendance' },
  familyDesc: { es: 'Seguimiento de acudido', en: 'Student progress tracking' },
  adminDesc: { es: 'Coordinación escolar', en: 'School leadership' },

  // Registration Modal
  regModalTitle: { es: 'Registro Institucional', en: 'Institutional Registration' },
  regModalSubtitle: { es: 'Crea tu cuenta oficial en Edulink School', en: 'Create your official account on Edulink School' },
  regSelectRoleTitle: { es: '1. Selecciona tu Rol Institucional', en: '1. Select your Institutional Role' },
  regSecuredBadge: { es: 'Roles protegidos con validación institucional', en: 'Roles protected with institutional validation' },
  
  // Teacher verification
  teacherVerificationTitle: { es: 'Validación de Vinculación Docente', en: 'Teacher Institutional Verification' },
  teacherVerificationDesc: {
    es: 'Para garantizar la seguridad de las planillas de calificaciones, el registro docente exige un Código de Vinculación Institucional oficial validado en la base de datos.',
    en: 'To ensure gradebook integrity, teacher registration requires an official Institutional Linking Code validated in the database.'
  },
  teacherCodeLabel: { es: 'Código de Vinculación Docente (Emitido por Coordinación) *', en: 'Teacher Linking Code (Issued by Academic Office) *' },
  teacherCodeHelper: { es: 'Códigos oficiales de prueba autorizados: DOC-VALLE-2026, DOC-TEC-8421, DOC-MAT-7139', en: 'Official authorized test codes: DOC-VALLE-2026, DOC-TEC-8421, DOC-MAT-7139' },
  subjectAreaLabel: { es: 'Área o Asignatura Principal *', en: 'Main Subject or Department *' },
  teacherDocLabel: { es: 'Número de Documento de Identidad (Cédula) *', en: 'ID Document Number (National ID) *' },
  assignedGradesLabel: { es: 'Grupos Asignados (ej: 6°1, 6°2, 7°1)', en: 'Assigned Groups (e.g. 6°1, 6°2, 7°1)' },

  // Admin verification
  adminVerificationTitle: { es: 'Autorización Directiva y Administrativa', en: 'Leadership & Administrative Authorization' },
  adminVerificationDesc: {
    es: 'El rol administrativo tiene acceso a la gestión institucional completa. Requiere una Llave de Autorización Directiva emitida por Rectoría validada en la base de datos.',
    en: 'The administrative role has full school management access. It requires an Administrative Security Key issued by Principal office validated in database.'
  },
  adminKeyLabel: { es: 'Llave de Autorización Directiva / Token de Seguridad *', en: 'Administrative Security Key / Institutional Token *' },
  adminKeyHelper: { es: 'Llaves oficiales de prueba autorizadas: ADM-DIR-2026-VALLE, ADM-COORD-2026, ADM-SEC-9876', en: 'Official authorized test keys: ADM-DIR-2026-VALLE, ADM-COORD-2026, ADM-SEC-9876' },
  adminPositionLabel: { es: 'Cargo o Dependencia *', en: 'Position or Department *' },
  adminDocLabel: { es: 'Documento de Identidad (Cédula) *', en: 'ID Document Number (National ID) *' },
  adminEmployeeCodeLabel: { es: 'Código de Empleado Institucional', en: 'Institutional Employee Code' },

  // Family verification
  familyVerificationTitle: { es: 'Verificación del Estudiante a Representar', en: 'Verification of Represented Student' },
  familyVerificationDesc: {
    es: 'Para registrarse como acudiente, debes ingresar el documento o código del estudiante matriculado. El sistema verificará en la base de datos institucional que el estudiante exista.',
    en: 'To register as a family guardian, you must enter the enrolled student ID or code. The system will verify student enrollment in the institutional database.'
  },
  familyRelationshipLabel: { es: 'Parentesco con el Estudiante *', en: 'Relationship to Student *' },
  guardianDocLabel: { es: 'Número de Documento del Acudiente *', en: 'Guardian ID Document Number *' },
  guardianPhoneLabel: { es: 'Teléfono de Contacto Familiar *', en: 'Family Contact Phone *' },
  representedStudentDocLabel: { es: 'Documento de Identidad o Matrícula del Estudiante *', en: 'Student ID Document or Enrollment Code *' },
  representedStudentNameLabel: { es: 'Nombre Completo del Estudiante Representado *', en: 'Full Name of Represented Student *' },
  studentHint: { es: 'Estudiante registrado de prueba: 1092837465 (Miguel Ángel Jiménez - 11°B)', en: 'Registered demo student: 1092837465 (Miguel Ángel Jiménez - 11°B)' },

  // Student fields
  studentAcademicTitle: { es: 'Información Académica del Estudiante', en: 'Student Academic Information' },
  studentAcademicDesc: {
    es: 'Acceso a asignaturas, calificaciones de los cuatro períodos, entrega de talleres y boletines escolares.',
    en: 'Access to subjects, 4-term grade report cards, assignment submissions, and school circulars.'
  },
  studentGradeLabel: { es: 'Grado y Grupo *', en: 'Grade and Group *' },
  studentDocInputLabel: { es: 'Documento de Identidad (TI / CC) o Código *', en: 'ID Document (TI / CC) or Student Code *' },
  studentShiftLabel: { es: 'Jornada Escolar Oficial', en: 'Official School Shift' },

  // Account credentials
  accountCredentialsTitle: { es: '2. Información de Cuenta y Credenciales', en: '2. Account Credentials & Information' },
  fullNameInputLabel: { es: 'Nombre Completo *', en: 'Full Name *' },
  emailInputLabel: { es: 'Correo Electrónico *', en: 'Email Address *' },
  passwordInputLabel: { es: 'Contraseña *', en: 'Password *' },
  confirmPasswordInputLabel: { es: 'Confirmar Contraseña *', en: 'Confirm Password *' },
  acceptPolicyLabel: {
    es: 'Acepto la política de uso y tratamiento de datos personales de la I.E. Vallejuelos.',
    en: 'I accept the personal data use and processing policy of I.E. Vallejuelos.'
  },
  submitRegister: { es: 'Registrarse', en: 'Register' },
  registeringText: { es: 'Registrando...', en: 'Registering...' },
  alreadyRegistered: { es: '¿Ya tienes una cuenta?', en: 'Already have an account?' },
  closeModal: { es: 'Cerrar', en: 'Close' },

  // Password rules
  ruleMinLength: { es: 'Mínimo 8 caracteres', en: 'At least 8 characters' },
  ruleUpper: { es: 'Una letra mayúscula', en: 'One uppercase letter' },
  ruleLower: { es: 'Una letra minúscula', en: 'One lowercase letter' },
  ruleSpecial: { es: 'Un carácter especial (!@#$%)', en: 'One special character (!@#$%)' },

  // Recovery modal
  recoveryTitle: { es: 'Recuperación de Contraseña', en: 'Password Recovery' },
  recoveryStep1Desc: { es: 'Ingresa tu correo institucional registrado para recibir el código.', en: 'Enter your registered institutional email to receive verification code.' },
  sendOtpButton: { es: 'Enviar código de verificación', en: 'Send verification code' },
  recoveryStep2Desc: { es: 'Ingresa el código de 6 dígitos enviado a tu correo.', en: 'Enter the 6-digit code sent to your email.' },
  resendCodeIn: { es: 'Reenviar código en', en: 'Resend code in' },
  resendCodeNow: { es: 'Reenviar nuevo código', en: 'Resend new code' },
  verifyOtpButton: { es: 'Verificar código', en: 'Verify code' },
  recoveryStep3Desc: { es: 'Crea una contraseña segura para tu cuenta.', en: 'Create a secure password for your account.' },
  newPasswordLabel: { es: 'Nueva Contraseña', en: 'New Password' },
  confirmNewPasswordLabel: { es: 'Confirmar Nueva Contraseña', en: 'Confirm New Password' },
  resetPasswordButton: { es: 'Guardar y Restablecer', en: 'Save & Reset Password' },
  recoveryStep4Title: { es: '¡Contraseña actualizada correctamente!', en: 'Password successfully updated!' },
  recoveryStep4Desc: { es: 'Tu clave de acceso ha sido actualizada. Ya puedes iniciar sesión.', en: 'Your password has been updated. You can now sign in.' },
  backToLoginButton: { es: 'Regresar al Inicio de Sesión', en: 'Back to Sign In' },

  // Footer copyright
  copyright: {
    es: '© 2026 Institución Educativa Vallejuelos • Plataforma Edulink School. Todos los derechos reservados.',
    en: '© 2026 Vallejuelos Educational Institution • Edulink School Platform. All rights reserved.'
  }
};

interface ThemeLanguageContextType {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (key: string) => string;
}

const ThemeLanguageContext = createContext<ThemeLanguageContextType | undefined>(undefined);

export const ThemeLanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    try {
      const saved = localStorage.getItem('edulink_theme');
      if (saved === 'light' || saved === 'dark') return saved;
    } catch {}
    return 'dark';
  });

  const [language, setLanguageState] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem('edulink_lang');
      if (saved === 'en' || saved === 'es') return saved;
    } catch {}
    return 'es';
  });

  const setTheme = (newTheme: ThemeMode) => {
    setThemeState(newTheme);
    try {
      localStorage.setItem('edulink_theme', newTheme);
      if (newTheme === 'dark') {
        document.documentElement.classList.add('dark');
        document.documentElement.classList.remove('light');
      } else {
        document.documentElement.classList.remove('dark');
        document.documentElement.classList.add('light');
      }
    } catch {}
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const setLanguage = (newLang: Language) => {
    setLanguageState(newLang);
    try {
      localStorage.setItem('edulink_lang', newLang);
      document.documentElement.lang = newLang;
    } catch {}
  };

  const toggleLanguage = () => {
    setLanguage(language === 'es' ? 'en' : 'es');
  };

  // Sync initial classes to HTML
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    }
    document.documentElement.lang = language;
  }, [theme, language]);

  const t = (key: string): string => {
    if (TRANSLATIONS[key]) {
      return TRANSLATIONS[key][language] || TRANSLATIONS[key]['es'] || key;
    }
    return key;
  };

  return (
    <ThemeLanguageContext.Provider
      value={{
        theme,
        setTheme,
        toggleTheme,
        language,
        setLanguage,
        toggleLanguage,
        t
      }}
    >
      {children}
    </ThemeLanguageContext.Provider>
  );
};

export function useThemeLanguage(): ThemeLanguageContextType {
  const context = useContext(ThemeLanguageContext);
  if (!context) {
    throw new Error('useThemeLanguage must be used within a ThemeLanguageProvider');
  }
  return context;
}
