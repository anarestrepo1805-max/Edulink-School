import React, { useState } from 'react';
import { UserRole, UserProfile } from '../types';
import { ASSETS } from '../data/mockData';
import {
  loginUser,
  registerNewUser,
  getTeacherAssignmentByCode,
  getAdminAssignmentByCode,
  lookupEnrolledStudent,
  isUserRegisteredInDatabase
} from '../services/authService';
import { PasswordRecoveryModal } from './PasswordRecoveryModal';
import { useThemeLanguage } from '../context/ThemeLanguageContext';

interface LoginViewProps {
  onLoginSuccess: (user: UserProfile) => void;
  initialRole?: UserRole;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  const { theme, toggleTheme, language, toggleLanguage, t } = useThemeLanguage();
  const isDark = theme === 'dark';
  const isEn = language === 'en';

  // Dynamic error and alert translation helper so switching language immediately updates alerts
  const translateErrorMessage = (msg: string | null): string => {
    if (!msg) return '';
    // Login / Credentials
    if (msg.includes('Contraseña incorrecta') || msg.includes('Incorrect password')) {
      return isEn ? 'Incorrect password. Please verify your credentials.' : 'Contraseña incorrecta. Por favor verifique sus datos.';
    }
    if (msg.includes('no está registrado') || msg.includes('not registered on the platform')) {
      return isEn ? 'The user is not registered on the platform. Please register to continue.' : 'El usuario no está registrado en la plataforma. Por favor regístrese para continuar.';
    }
    if (msg.includes('ingresa tu correo electrónico institucional') || msg.includes('enter your institutional email')) {
      return isEn ? 'Please enter your institutional email.' : 'Por favor ingresa tu correo electrónico institucional.';
    }
    if (msg.includes('correo electrónico válido') || msg.includes('valid email address')) {
      return isEn ? 'Please enter a valid email address (e.g. user@edulink.edu.co).' : 'Por favor ingresa un correo electrónico válido (ej. usuario@edulink.edu.co).';
    }
    if (msg.includes('ingresa tu contraseña') || msg.includes('enter your password')) {
      return isEn ? 'Please enter your password.' : 'Por favor ingresa tu contraseña institucional.';
    }
    if (msg.includes('Error al iniciar sesión') || msg.includes('Error signing in')) {
      return isEn ? 'Error signing in to the platform.' : 'Error al iniciar sesión en la plataforma.';
    }

    // Registration general
    if (msg.includes('nombre completo') || msg.includes('full name')) {
      return isEn ? 'Please enter your full name.' : 'Por favor ingresa tu nombre completo.';
    }
    if (msg.includes('correo electrónico institucional o personal') || msg.includes('institutional or personal email')) {
      return isEn ? 'Please enter your institutional or personal email.' : 'Por favor ingresa tu correo electrónico institucional o personal.';
    }
    if (msg.includes('documento de identidad (TI/CC)') || msg.includes('Student ID (TI/CC)')) {
      return isEn ? 'Please enter your Student ID (TI/CC).' : 'Por favor ingresa tu documento de identidad (TI/CC).';
    }
    if (msg.includes('censo oficial de matrículas') || msg.includes('official enrollment census')) {
      return isEn
        ? 'The entered student document is not registered in the official enrollment census. You cannot register in a grade you do not belong to.'
        : 'El documento ingresado no se encuentra en el censo oficial de matrículas de la I.E. Vallejuelos. Debes ingresar un documento válido para asociar tu grado oficial.';
    }
    if (msg.includes('ya se encuentra registrado con una cuenta activa') || msg.includes('already registered with an active account')) {
      return isEn
        ? 'This student document is already registered with an active account. Please sign in.'
        : 'Este documento de estudiante ya se encuentra registrado con una cuenta activa. Por favor inicia sesión.';
    }
    if (msg.includes('ya cuenta con un usuario registrado') || msg.includes('already registered with an active account. Please sign in')) {
      return isEn
        ? 'This student is already registered in the platform. Please sign in.'
        : 'Este estudiante ya cuenta con un usuario registrado en la plataforma. Por favor inicia sesión.';
    }

    // Teacher registration
    if (msg.includes('Código de Vinculación Docente') || msg.includes('Teacher Linking Code')) {
      return isEn
        ? 'Mandatory: You must enter the Teacher Linking Code issued by Academic Direction.'
        : 'Obligatorio: Debes ingresar el Código de Vinculación Docente emitido por la Coordinación Académica.';
    }
    if (msg.includes('cédula de ciudadanía de docente') || msg.includes('Teacher Citizen ID')) {
      return isEn ? 'Please enter your Teacher Citizen ID (CC).' : 'Por favor ingresa tu cédula de ciudadanía de docente.';
    }
    if (msg.includes('código de docente no es válido') || msg.includes('Teacher code not found') || msg.includes('Código de docente no encontrado')) {
      return isEn
        ? 'Teacher code not found in institutional faculty registry. Verify your code.'
        : 'El código de docente no es válido o no existe en la base de datos de vinculación.';
    }
    if (msg.includes('ya fue utilizado') || msg.includes('already claimed')) {
      return isEn
        ? 'This teacher code was already claimed by another faculty member. Codes are unique and single-use.'
        : 'Este código de docente ya fue utilizado por otro educador registrado. Los códigos son únicos e irrepetibles.';
    }

    // Family registration
    if (msg.includes('documento de identidad del acudiente') || msg.includes('Guardian ID Document')) {
      return isEn ? 'Please enter the Guardian ID Document (CC).' : 'Por favor ingresa el documento de identidad del acudiente.';
    }
    if (msg.includes('documento del estudiante a representar') || msg.includes('student ID document to represent')) {
      return isEn ? 'Please enter the student ID document to represent.' : 'Por favor ingresa el documento del estudiante a representar.';
    }
    if (msg.includes('estudiante a representar no existe') || msg.includes('represented student is not registered')) {
      return isEn
        ? 'The represented student is not registered in the institutional census.'
        : 'El estudiante a representar no existe en el censo de matrícula escolar.';
    }

    // Admin registration
    if (msg.includes('código de verificación directiva') || msg.includes('directive verification code')) {
      return isEn ? 'Please enter your directive verification code.' : 'Por favor ingresa tu código de verificación directiva.';
    }
    if (msg.includes('cédula de directivo o administrativo') || msg.includes('Staff Citizen ID')) {
      return isEn ? 'Please enter your Staff Citizen ID (CC).' : 'Por favor ingresa tu cédula de directivo o administrativo.';
    }
    if (msg.includes('código directivo no es válido') || msg.includes('Directive verification code is not valid')) {
      return isEn
        ? 'Directive verification code is not valid in the institutional leadership registry.'
        : 'El código directivo no es válido o no existe en la base de datos institucional.';
    }

    // Passwords
    if (msg.includes('menos 8 caracteres') || msg.includes('at least 8 characters')) {
      return isEn ? 'Password must be at least 8 characters long.' : 'La contraseña debe tener al menos 8 caracteres.';
    }
    if (msg.includes('letra mayúscula') || msg.includes('uppercase letter')) {
      return isEn ? 'Password must contain at least one uppercase letter (A-Z).' : 'La contraseña debe contener al menos una letra mayúscula (A-Z).';
    }
    if (msg.includes('letra minúscula') || msg.includes('lowercase letter')) {
      return isEn ? 'Password must contain at least one lowercase letter (a-z).' : 'La contraseña debe contener al menos una letra minúscula (a-z).';
    }
    if (msg.includes('carácter especial') || msg.includes('special character')) {
      return isEn ? 'Password must contain at least one special character (!@#$%).' : 'La contraseña debe contener al menos un carácter especial (!@#$%).';
    }
    if (msg.includes('contraseñas no coinciden') || msg.includes('Passwords do not match')) {
      return isEn ? 'Passwords do not match. Please verify carefully.' : 'Las contraseñas no coinciden. Verifica e intenta nuevamente.';
    }
    if (msg.includes('términos y la política') || msg.includes('terms and policy')) {
      return isEn
        ? 'You must accept the personal data protection policy to register.'
        : 'Debes aceptar los términos y la política de tratamiento de datos personales para registrarte.';
    }

    return msg;
  };

  // Login form states: Verified strictly by Email and Password
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [resetSuccessNotice, setResetSuccessNotice] = useState(false);

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
  // Student fields: Census-driven registration
  const [regGradeLevel, setRegGradeLevel] = useState('');
  const [regStudentCode, setRegStudentCode] = useState('');
  const [regShift, setRegShift] = useState('Jornada Mañana (6:15 AM - 12:15 PM)');
  const [studentDocFeedback, setStudentDocFeedback] = useState<{
    status: 'idle' | 'found' | 'not_found' | 'already_registered';
    message: string;
  }>({ status: 'idle', message: '' });

  // Teacher fields + Role Verification Code
  const [regTeacherCode, setRegTeacherCode] = useState('');
  const [regSubjectArea, setRegSubjectArea] = useState('Tecnología e Informática');
  const [regEmployeeId, setRegEmployeeId] = useState('');
  const [regAssignedGrades, setRegAssignedGrades] = useState('6°1, 6°2 y 7°1');

  // Family / Guardian fields
  const [regRelationship, setRegRelationship] = useState('Madre de familia');
  const [regGuardianDocId, setRegGuardianDocId] = useState('');
  const [regRepresentedStudentName, setRegRepresentedStudentName] = useState('');
  const [regRepresentedStudentCode, setRegRepresentedStudentCode] = useState('');
  const [regEmergencyPhone, setRegEmergencyPhone] = useState('');

  // Administrative fields + Security Token
  const [regAdminKey, setRegAdminKey] = useState('');
  const [regAdminPosition, setRegAdminPosition] = useState('Coordinación Académica');
  const [regAdminDocId, setRegAdminDocId] = useState('');
  const [regAdminEmployeeCode, setRegAdminEmployeeCode] = useState('');

  // Real-time verification states for role assignments
  const [teacherFeedback, setTeacherFeedback] = useState<{
    status: 'idle' | 'valid' | 'claimed' | 'invalid';
    message: string;
  }>({ status: 'idle', message: '' });

  const [adminFeedback, setAdminFeedback] = useState<{
    status: 'idle' | 'valid' | 'claimed' | 'invalid';
    message: string;
  }>({ status: 'idle', message: '' });

  const [studentLookupFeedback, setStudentLookupFeedback] = useState<{
    status: 'idle' | 'found' | 'not_found';
    message: string;
  }>({ status: 'idle', message: '' });

  // Register status states
  const [regLoading, setRegLoading] = useState(false);
  const [regError, setRegError] = useState<string | null>(null);
  const [regSuccess, setRegSuccess] = useState<string | null>(null);

  // Real-time lookup for Teacher linking code
  const handleTeacherCodeChange = async (val: string) => {
    const code = val.toUpperCase().trim();
    setRegTeacherCode(code);
    setRegError(null);
    if (!code) {
      setTeacherFeedback({ status: 'idle', message: '' });
      return;
    }
    const res = await getTeacherAssignmentByCode(code);
    if (res.valid && res.assignment) {
      if (res.claimed) {
        setTeacherFeedback({
          status: 'claimed',
          message: isEn
            ? 'This linking code has already been registered by another teacher. Each code is unique and non-repeatable.'
            : 'Este código de vinculación docente ya fue registrado por otro docente. Cada código es único e irrepetible.'
        });
      } else {
        setRegSubjectArea(res.assignment.subjectArea);
        setRegAssignedGrades(res.assignment.assignedGrades);
        setTeacherFeedback({
          status: 'valid',
          message: isEn
            ? `Assigned: ${res.assignment.subjectArea} (${res.assignment.assignedGrades})`
            : `Asignación oficial: ${res.assignment.subjectArea} | Grados: ${res.assignment.assignedGrades}`
        });
      }
    } else if (code.length >= 4) {
      setTeacherFeedback({
        status: 'invalid',
        message: isEn
          ? 'Teacher linking code not found in institutional database.'
          : 'Código de vinculación docente no encontrado en la base de datos institucional.'
      });
    } else {
      setTeacherFeedback({ status: 'idle', message: '' });
    }
  };

  // Real-time lookup for Administrative authorization code
  const handleAdminCodeChange = async (val: string) => {
    const code = val.toUpperCase().trim();
    setRegAdminKey(code);
    setRegError(null);
    if (!code) {
      setAdminFeedback({ status: 'idle', message: '' });
      return;
    }
    const res = await getAdminAssignmentByCode(code);
    if (res.valid && res.assignment) {
      if (res.claimed) {
        setAdminFeedback({
          status: 'claimed',
          message: isEn
            ? 'This code has already been assigned to another staff member. Each position has a unique code.'
            : 'Este código de verificación directiva ya fue asignado a otro funcionario. Cada cargo tiene un código único e intransferible.'
        });
      } else {
        setRegAdminPosition(res.assignment.position);
        setAdminFeedback({
          status: 'valid',
          message: isEn
            ? `Official Position Assigned: ${res.assignment.position}`
            : `Cargo oficial asignado: ${res.assignment.position}`
        });
      }
    } else if (code.length >= 4) {
      setAdminFeedback({
        status: 'invalid',
        message: isEn
          ? 'Directive authorization code not recognized in institutional database.'
          : 'Código de verificación directiva no reconocido en la base de datos institucional.'
      });
    } else {
      setAdminFeedback({ status: 'idle', message: '' });
    }
  };

  // Real-time lookup for Enrolled Student ID (Guardian registration)
  const handleRepresentedStudentDocChange = async (val: string) => {
    const clean = val.trim();
    setRegRepresentedStudentCode(clean);
    setRegError(null);
    if (!clean) {
      setStudentLookupFeedback({ status: 'idle', message: '' });
      setRegRepresentedStudentName('');
      return;
    }
    const student = await lookupEnrolledStudent(clean);
    if (student) {
      setRegRepresentedStudentName(student.fullName);
      setStudentLookupFeedback({
        status: 'found',
        message: isEn
          ? `Enrolled Student: ${student.fullName} (${student.gradeLevel})`
          : `Estudiante matriculado: ${student.fullName} (${student.gradeLevel})`
      });
    } else if (clean.length >= 4) {
      setRegRepresentedStudentName('');
      setStudentLookupFeedback({
        status: 'not_found',
        message: isEn
          ? 'No enrolled student found with this document in institutional census.'
          : 'No se encontró ningún estudiante matriculado con este documento en el censo oficial.'
      });
    } else {
      setStudentLookupFeedback({ status: 'idle', message: '' });
    }
  };

  // Password validation helper tests
  const passHasUpper = /[A-Z]/.test(regPassword);
  const passHasLower = /[a-z]/.test(regPassword);
  const passHasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(regPassword);
  const passHasMinLength = regPassword.length >= 8;

  // Real-time lookup for Student Document Number in Census
  const handleStudentDocChange = async (val: string) => {
    const clean = val.trim();
    setRegStudentCode(clean);
    setRegError(null);
    if (!clean) {
      setStudentDocFeedback({ status: 'idle', message: '' });
      setRegFullName('');
      setRegGradeLevel('');
      setRegShift('Jornada Mañana (6:15 AM - 12:15 PM)');
      return;
    }
    // Check if this student document is already registered
    const isReg = await isUserRegisteredInDatabase(clean);
    if (isReg.registered) {
      setStudentDocFeedback({
        status: 'already_registered',
        message: isEn
          ? 'This student document is already registered with an active account. Please sign in.'
          : 'Este estudiante ya cuenta con un usuario registrado en la plataforma. Por favor inicia sesión.'
      });
      return;
    }

    const student = await lookupEnrolledStudent(clean);
    if (student) {
      setRegFullName(student.fullName);
      setRegGradeLevel(student.gradeLevel);
      setRegShift(student.shift || 'Jornada Mañana (6:15 AM - 12:15 PM)');
      if (!regEmail || regEmail.includes('@edulink.edu.co') || !regEmail.includes('@')) {
        setRegEmail(student.email);
      }
      setStudentDocFeedback({
        status: 'found',
        message: isEn
          ? `Verified Enrolled Student: ${student.fullName} • Grade ${student.gradeLevel} • Morning Shift (6:15 AM - 12:15 PM)`
          : `Estudiante matriculado verificado: ${student.fullName} • Grado ${student.gradeLevel} • Jornada Mañana (6:15 AM - 12:15 PM)`
      });
    } else if (clean.length >= 4) {
      setRegFullName('');
      setRegGradeLevel('');
      setStudentDocFeedback({
        status: 'not_found',
        message: isEn
          ? 'Document not found in official institutional enrollment census. Check your number.'
          : 'Documento no encontrado en el censo oficial de matrículas de la I.E. Vallejuelos. Verifica tu número de documento.'
      });
    } else {
      setStudentDocFeedback({ status: 'idle', message: '' });
    }
  };

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

  // Handle Login submission: Validated strictly by registered email and password
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    const cleanEmail = loginEmail.trim().toLowerCase();

    if (!cleanEmail) {
      setLoginError(isEn ? 'Please enter your institutional email.' : 'Por favor ingresa tu correo electrónico institucional.');
      return;
    }

    if (!cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setLoginError(isEn ? 'Please enter a valid email address.' : 'Por favor ingresa un correo electrónico válido (ej. usuario@edulink.edu.co).');
      return;
    }

    if (!loginPassword) {
      setLoginError(isEn ? 'Please enter your password.' : 'Por favor ingresa tu contraseña institucional.');
      return;
    }

    setIsLoading(true);

    try {
      const userProfile = await loginUser(cleanEmail, loginPassword, language);
      onLoginSuccess(userProfile);
    } catch (err: any) {
      setLoginError(err.message || (isEn ? 'Error signing in to the platform.' : 'Error al iniciar sesión en la plataforma.'));
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
      setRegError(isEn ? 'Please enter your full name.' : 'Por favor ingresa tu nombre completo.');
      return;
    }

    if (!regEmail.trim()) {
      setRegError(isEn ? 'Please enter your institutional or personal email.' : 'Por favor ingresa tu correo electrónico institucional o personal.');
      return;
    }

    // Role-specific strict validations
    if (regRole === 'student') {
      if (!regStudentCode.trim()) {
        setRegError(isEn ? 'Please enter your Student ID (TI/CC).' : 'Por favor ingresa tu documento de identidad (TI/CC).');
        return;
      }
      if (!regFullName.trim() || !regGradeLevel.trim() || studentDocFeedback.status === 'not_found') {
        setRegError(isEn
          ? 'The entered student document is not registered in the official enrollment census. You cannot register in a grade you do not belong to.'
          : 'El documento ingresado no se encuentra en el censo oficial de matrículas de la I.E. Vallejuelos. Debes ingresar un documento válido para asociar tu grado oficial.');
        return;
      }
      if (studentDocFeedback.status === 'already_registered') {
        setRegError(isEn
          ? 'This student document is already registered with an active account. Please sign in.'
          : 'Este documento de estudiante ya se encuentra registrado con una cuenta activa. Por favor inicia sesión.');
        return;
      }
    } else if (regRole === 'teacher') {
      if (!regTeacherCode.trim()) {
        setRegError(isEn
          ? 'Mandatory: You must enter the Teacher Linking Code issued by Academic Direction to prevent unauthorized faculty registration.'
          : 'Obligatorio: Debes ingresar el Código de Vinculación Docente emitido por la Coordinación Académica para prevenir registros no autorizados.');
        return;
      }
      if (!regEmployeeId.trim()) {
        setRegError(isEn ? 'Please enter your Citizen ID number (CC).' : 'Por favor ingresa tu número de cédula de ciudadanía.');
        return;
      }
    } else if (regRole === 'admin') {
      if (!regAdminKey.trim()) {
        setRegError(isEn
          ? 'Mandatory: Administrative privileges require a valid Directive Authorization Key issued by Rectoría.'
          : 'Obligatorio: Los privilegios administrativos exigen la Llave de Autorización Directiva emitida por Rectoría.');
        return;
      }
      if (!regAdminDocId.trim()) {
        setRegError(isEn ? 'Please enter your Citizen ID number (CC).' : 'Por favor ingresa tu cédula de ciudadanía.');
        return;
      }
    } else if (regRole === 'family') {
      if (!regRepresentedStudentCode.trim()) {
        setRegError(isEn
          ? 'Mandatory: Please enter the ID document or enrollment code of the represented student to verify institutional enrollment in the database.'
          : 'Obligatorio: Debes ingresar el documento de identidad o matrícula del estudiante representado para verificar su matrícula en la base de datos.');
        return;
      }
      if (!regRepresentedStudentName.trim()) {
        setRegError(isEn ? 'Please enter the full name of the represented student.' : 'Por favor ingresa el nombre completo del estudiante representado.');
        return;
      }
      if (!regGuardianDocId.trim()) {
        setRegError(isEn ? 'Please enter your Guardian ID number.' : 'Por favor ingresa tu número de documento de identidad como acudiente.');
        return;
      }
    }

    // Password validations: minimum 8 characters, uppercase, lowercase, special character
    if (!passHasMinLength) {
      setRegError(isEn ? 'Password must be at least 8 characters long.' : 'La contraseña debe tener un mínimo de 8 caracteres.');
      return;
    }

    if (!passHasUpper) {
      setRegError(isEn ? 'Password must contain at least one uppercase letter (A-Z).' : 'La contraseña debe contener al menos una letra mayúscula (A-Z).');
      return;
    }

    if (!passHasLower) {
      setRegError(isEn ? 'Password must contain at least one lowercase letter (a-z).' : 'La contraseña debe contener al menos una letra minúscula (a-z).');
      return;
    }

    if (!passHasSpecial) {
      setRegError(isEn ? 'Password must contain at least one special character (!@#$%&*).' : 'La contraseña debe contener al menos un carácter especial (ej. !@#$%&*).');
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setRegError(isEn ? 'Passwords do not match. Please verify.' : 'Las contraseñas ingresadas no coinciden. Verifica e intenta nuevamente.');
      return;
    }

    if (!acceptDataPolicy) {
      setRegError(isEn ? 'You must accept the personal data processing policy.' : 'Debes aceptar la política de tratamiento de datos personales para continuar.');
      return;
    }

    setRegLoading(true);

    try {
      const roleCode = regRole === 'teacher' ? regTeacherCode.trim() : regRole === 'admin' ? regAdminKey.trim() : undefined;

      const newUser = await registerNewUser({
        fullName: regFullName.trim(),
        email: regEmail.trim(),
        password: regPassword,
        role: regRole,
        documentId: regRole === 'family'
          ? regGuardianDocId.trim()
          : regRole === 'teacher'
            ? regEmployeeId.trim()
            : regRole === 'admin'
              ? regAdminDocId.trim()
              : regStudentCode.trim(),
        gradeLevel: regRole === 'student' ? regGradeLevel : undefined,
        studentCode: regRole === 'student' ? regStudentCode.trim() : undefined,
        shift: regRole === 'student' ? regShift : undefined,
        subjectArea: regRole === 'teacher' ? regSubjectArea : undefined,
        employeeId: regRole === 'teacher' ? regEmployeeId.trim() : regRole === 'admin' ? regAdminEmployeeCode.trim() : undefined,
        assignedGrades: regRole === 'teacher' ? regAssignedGrades.trim() : undefined,
        relationship: regRole === 'family' ? regRelationship : undefined,
        emergencyPhone: regRole === 'family' ? regEmergencyPhone.trim() : undefined,
        representedStudentName: regRole === 'family' ? regRepresentedStudentName.trim() : undefined,
        representedStudentCode: regRole === 'family' ? regRepresentedStudentCode.trim() : undefined,
        adminPosition: regRole === 'admin' ? regAdminPosition : undefined,
        roleVerificationCode: roleCode,
        lang: language,
      });

      setRegSuccess(isEn ? 'Account successfully registered and verified in the database! Signing in...' : '¡Cuenta registrada y verificada con éxito en la base de datos! Iniciando sesión...');
      setTimeout(() => {
        setIsRegisterModalOpen(false);
        onLoginSuccess(newUser);
      }, 1000);
    } catch (err: any) {
      setRegError(err.message || (isEn ? 'Error creating institutional account.' : 'Error al registrar la cuenta institucional.'));
    } finally {
      setRegLoading(false);
    }
  };

  return (
    <div
      className={`min-h-screen relative flex flex-col justify-between overflow-x-hidden transition-colors duration-300 ${
        isDark
          ? 'bg-gradient-to-b from-[#080d1a] via-[#0f172a] to-[#1e3a8a] text-slate-100'
          : 'bg-gradient-to-b from-[#f8fafc] via-[#e2e8f0] to-[#cbd5e1] text-slate-900'
      }`}
    >
      {/* ========================================================================= */}
      {/* TOP INSTITUTIONAL BAR: Aesthetic, compact, non-intrusive control capsule  */}
      {/* ========================================================================= */}
      <header className="relative z-30 w-full max-w-[1160px] mx-auto px-4 sm:px-6 pt-3 sm:pt-4 pb-0 flex items-center justify-end">
        {/* Right: Sleek, compact aesthetic control capsule */}
        <div className={`flex items-center gap-1 p-1 rounded-full backdrop-blur-xl border shadow-sm transition-all duration-300 ${
          isDark
            ? 'bg-slate-900/85 border-cyan-500/25 shadow-black/30'
            : 'bg-white/95 border-slate-200 shadow-slate-200/50'
        }`}>
          {/* Theme button: Compact, elegant toggle */}
          <button
            id="btn-toggle-theme"
            type="button"
            onClick={toggleTheme}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-bold transition-all duration-200 cursor-pointer active:scale-95 ${
              isDark
                ? 'text-amber-300 hover:bg-slate-800/80 hover:text-amber-200'
                : 'text-amber-600 hover:bg-slate-100 hover:text-amber-700'
            }`}
            title={isDark ? (isEn ? 'Switch to Light Mode' : 'Cambiar a Modo Claro') : (isEn ? 'Switch to Dark Mode' : 'Cambiar a Modo Oscuro')}
            aria-label="Toggle Theme"
          >
            <span className="material-symbols-outlined text-[18px]">
              {isDark ? 'light_mode' : 'dark_mode'}
            </span>
            <span className="text-[11px] font-semibold hidden sm:inline">
              {isDark ? (isEn ? 'Light' : 'Claro') : (isEn ? 'Dark' : 'Oscuro')}
            </span>
          </button>

          <span className={`w-[1px] h-3.5 mx-0.5 ${isDark ? 'bg-slate-700/80' : 'bg-slate-200'}`} />

          {/* Language button: Compact, elegant toggle */}
          <button
            id="btn-toggle-language"
            type="button"
            onClick={toggleLanguage}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-bold transition-all duration-200 cursor-pointer active:scale-95 ${
              isDark
                ? 'text-cyan-300 hover:bg-slate-800/80 hover:text-cyan-200'
                : 'text-blue-700 hover:bg-slate-100 hover:text-blue-800'
            }`}
            title={isEn ? 'Cambiar a Español' : 'Switch to English'}
            aria-label="Toggle Language"
          >
            <span className="material-symbols-outlined text-[17px]">translate</span>
            <span className="text-[11px] font-bold tracking-wider">
              {isEn ? 'ES' : 'EN'}
            </span>
          </button>
        </div>
      </header>

      {/* Atmospheric Celestial Backdrop */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        {/* Ambient celestial lights */}
        <div className={`absolute -top-40 -left-40 w-96 h-96 rounded-full blur-3xl pointer-events-none transition-opacity duration-500 ${
          isDark ? 'bg-cyan-500/15 opacity-100' : 'bg-blue-400/15 opacity-60'
        }`} />
        <div className={`absolute top-1/3 -right-40 w-[500px] h-[500px] rounded-full blur-3xl pointer-events-none transition-opacity duration-500 ${
          isDark ? 'bg-blue-600/20 opacity-100' : 'bg-cyan-300/20 opacity-60'
        }`} />
        <div className={`absolute -bottom-32 left-1/3 w-[600px] h-96 rounded-full blur-3xl pointer-events-none transition-opacity duration-500 ${
          isDark ? 'bg-teal-500/15 opacity-100' : 'bg-slate-300/30 opacity-40'
        }`} />

        {/* Twinkling star particles (Visible in dark mode, subtle in light) */}
        {isDark && (
          <>
            <div className="absolute top-12 left-1/6 w-1.5 h-1.5 rounded-full bg-cyan-300 shadow-[0_0_8px_#67e8f9] animate-twinkle-fast" />
            <div className="absolute top-24 right-1/4 w-2 h-2 rounded-full bg-white shadow-[0_0_10px_#ffffff] animate-twinkle-slow" style={{ animationDelay: '0.8s' }} />
            <div className="absolute top-48 left-1/3 w-1 h-1 rounded-full bg-teal-300 shadow-[0_0_6px_#5eead4] animate-twinkle-fast" style={{ animationDelay: '1.2s' }} />
            <div className="absolute top-80 right-1/5 w-1.5 h-1.5 rounded-full bg-blue-300 shadow-[0_0_8px_#93c5fd] animate-twinkle-slow" style={{ animationDelay: '2.1s' }} />
            <div className="absolute bottom-40 left-24 w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee] animate-twinkle-slow" style={{ animationDelay: '1.4s' }} />
            <div className="absolute bottom-28 right-1/4 w-2 h-2 rounded-full bg-blue-300 shadow-[0_0_10px_#93c5fd] animate-twinkle-fast" style={{ animationDelay: '0.4s' }} />
          </>
        )}
      </div>

      {/* Main container: Two-column layout (Brand Identity + Glassmorphism Login Card) */}
      <main className="relative z-10 w-full max-w-[1160px] mx-auto pt-4 sm:pt-6 lg:pt-6 pb-12 px-4 sm:px-6 flex-1 flex flex-col lg:flex-row items-center lg:items-start justify-between gap-10 lg:gap-12">
        
        {/* Left Column: Brand Identity, Free Floating Glowing Tree Logo, Content & Institutional Contact */}
        <section className="w-full lg:w-[620px] text-left flex flex-col items-center lg:items-start">
          
          {/* Top Institutional Eyebrow */}
          <div className="flex flex-wrap items-center gap-2 mb-3 justify-center lg:justify-start">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-xs border ${
              isDark
                ? 'bg-cyan-500/15 border-cyan-400/30 text-cyan-300'
                : 'bg-blue-100/90 border-blue-300 text-blue-800'
            }`}>
              <span className="material-symbols-outlined text-[15px]">account_balance</span>
              {isEn ? 'Official Institutional Portal' : 'Portal Institucional Oficial'}
            </span>
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium backdrop-blur-sm border ${
              isDark
                ? 'bg-slate-900/60 border-slate-700/60 text-slate-300'
                : 'bg-white/80 border-slate-300 text-slate-700'
            }`}>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              I.E. Vallejuelos • Medellín
            </span>
          </div>

          {/* 1. Page Name: Title with Capital Initials "Edulink School" */}
          <div className="w-full flex items-center justify-center lg:justify-start gap-2.5 mb-1">
            <span className={`font-black text-4xl sm:text-5xl lg:text-[54px] tracking-tight leading-none drop-shadow-md ${
              isDark ? 'text-white' : 'text-slate-900'
            }`}>
              Edulink
            </span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-500 via-teal-400 to-sky-400 font-black text-4xl sm:text-5xl lg:text-[54px] tracking-tight leading-none drop-shadow-md">
              School
            </span>
          </div>
          <p className={`text-xs sm:text-sm font-semibold tracking-wide mb-3 text-center lg:text-left ${
            isDark ? 'text-cyan-200/80' : 'text-blue-900/80'
          }`}>
            {isEn
              ? 'Integrated Academic & Community Management System'
              : 'Sistema Integral de Gestión Académica y Comunitaria'}
          </p>

          {/* 2. Logo: Free Floating Tree (No White Box), Glowing Leaves & Progressively Illuminated Cyan Roots */}
          <div className="w-full flex justify-center items-center my-3 relative py-4">
            {/* Ambient pulsating backdrop aura */}
            <div className={`absolute w-52 h-52 sm:w-64 sm:h-64 rounded-full blur-3xl pointer-events-none animate-pulse-glow ${
              isDark
                ? 'bg-gradient-to-tr from-cyan-500/25 via-blue-600/30 to-teal-400/25'
                : 'bg-gradient-to-tr from-cyan-400/20 via-blue-400/20 to-teal-300/20'
            }`} />

            {/* Tree roots progressive aquamarine/cyan illumination glow */}
            <div className="absolute bottom-4 w-40 sm:w-56 h-14 bg-gradient-to-r from-teal-400/40 via-cyan-400/70 to-blue-500/40 rounded-full blur-xl pointer-events-none animate-root-pulse" />

            {/* Sparkles */}
            <div className="absolute -top-1 right-1/4 sm:right-1/3 text-cyan-400 animate-sparkle-1 pointer-events-none">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5L12 0Z" />
              </svg>
            </div>
            <div className="absolute top-2 left-1/4 sm:left-1/3 text-teal-400 animate-sparkle-2 pointer-events-none">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
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
          <h2 className={`text-xl sm:text-2xl lg:text-[27px] font-bold leading-snug max-w-[560px] mb-3 tracking-tight text-center lg:text-left drop-shadow-sm ${
            isDark ? 'text-white' : 'text-slate-900'
          }`}>
            {isEn
              ? 'Institutional platform for curriculum management, grades, and academic community.'
              : 'Plataforma institucional de gestión curricular, calificaciones y comunidad académica.'}
          </h2>

          <p className={`text-sm sm:text-base leading-relaxed max-w-[540px] mb-5 text-center lg:text-left ${
            isDark ? 'text-slate-300' : 'text-slate-600'
          }`}>
            {isEn
              ? 'Connecting students, teachers, families, and leadership in a unified, high-security environment.'
              : 'Conecta en tiempo real a estudiantes, docentes, acudientes y equipo directivo en un entorno seguro y unificado.'}
          </p>

          {/* 4. Jornada & COMUNIDAD (Glassmorphism Cards) */}
          <div className="w-full max-w-[560px] mb-5 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Jornada */}
            <div className={`p-4 rounded-2xl backdrop-blur-md border shadow-lg transition-all ${
              isDark
                ? 'bg-slate-900/65 border-cyan-500/20 shadow-black/20 hover:border-cyan-400/40 text-slate-100'
                : 'bg-white/85 border-slate-300/80 shadow-slate-300/30 hover:border-blue-400 text-slate-900'
            } flex items-center gap-3.5`}>
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 shadow-inner border ${
                isDark ? 'bg-cyan-500/15 border-cyan-500/30 text-cyan-400' : 'bg-blue-50 border-blue-200 text-blue-700'
              }`}>
                <span className="material-symbols-outlined text-[24px]">schedule</span>
              </div>
              <div>
                <span className={`block text-[11px] font-bold uppercase tracking-wider ${isDark ? 'text-cyan-400' : 'text-blue-700'}`}>
                  {isEn ? 'Shift' : 'Jornada'}
                </span>
                <span className={`text-sm sm:text-base font-extrabold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  6:15 AM - 12:15 PM
                </span>
                <span className={`block text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  {isEn ? 'Morning Shift' : 'Jornada Mañana'}
                </span>
              </div>
            </div>

            {/* COMUNIDAD (Single Clean Direct Block) */}
            <div className={`p-4 rounded-2xl backdrop-blur-md border shadow-lg transition-all ${
              isDark
                ? 'bg-slate-900/65 border-teal-500/25 shadow-black/20 hover:border-teal-400/45 text-slate-100'
                : 'bg-white/85 border-slate-300/80 shadow-slate-300/30 hover:border-teal-400 text-slate-900'
            } flex items-start gap-3.5`}>
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 shadow-inner mt-0.5 border ${
                isDark ? 'bg-teal-500/15 border-teal-500/30 text-teal-300' : 'bg-teal-50 border-teal-200 text-teal-700'
              }`}>
                <span className="material-symbols-outlined text-[24px]">groups</span>
              </div>
              <div className="min-w-0">
                <span className={`block text-[11px] font-bold uppercase tracking-wider ${isDark ? 'text-teal-400' : 'text-teal-700'}`}>
                  {isEn ? 'COMMUNITY' : 'COMUNIDAD'}
                </span>
                <span className={`text-sm sm:text-base font-extrabold block ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {isEn ? 'Grades 6th to 11th & Pensar Grade' : 'Grados 6° a 11° y Grado Pensar'}
                </span>
                <p className={`text-[11px] leading-snug mt-1 font-medium ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                  {isEn
                    ? 'Groups: 6°1, 6°2, 7°1, 7°2, 8°1, 8°2, 9°1, 9°2, 10°1, 10°2, 11°1, 11°2 and Pensar.'
                    : 'Grupos: 6°1, 6°2, 7°1, 7°2, 8°1, 8°2, 9°1, 9°2, 10°1, 10°2, 11°1, 11°2 y Pensar.'}
                </p>
              </div>
            </div>
          </div>

          {/* 5. Institutional Location & Contact Card */}
          <div className={`w-full max-w-[560px] rounded-2xl border shadow-lg backdrop-blur-md p-4 sm:p-5 text-left transition-all ${
            isDark
              ? 'bg-slate-900/65 border-cyan-500/20 shadow-black/20 hover:border-cyan-400/35'
              : 'bg-white/85 border-slate-300/80 shadow-slate-300/30 hover:border-blue-400'
          }`}>
            <div className={`flex items-start justify-between gap-3 pb-3 border-b mb-3 ${
              isDark ? 'border-slate-800/80' : 'border-slate-200'
            }`}>
              <div>
                <h3 className={`text-base sm:text-lg font-bold leading-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Institución Educativa Vallejuelos
                </h3>
                <p className={`text-xs sm:text-sm mt-0.5 ${isDark ? 'text-cyan-300/80' : 'text-blue-700'}`}>
                  {isEn ? 'General Education School in Medellín' : 'Escuela de enseñanza general en Medellín'}
                </p>
              </div>
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                isDark ? 'bg-cyan-500/15 border-cyan-500/30 text-cyan-400' : 'bg-blue-50 border-blue-200 text-blue-700'
              }`}>
                <span className="material-symbols-outlined text-[20px]">school</span>
              </div>
            </div>

            <div className="space-y-2.5 text-xs sm:text-sm">
              <div className="flex items-start gap-2.5">
                <span className="material-symbols-outlined text-[20px] text-rose-500 shrink-0 mt-0.5">
                  location_on
                </span>
                <div className={`leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  <strong className={isDark ? 'text-white' : 'text-slate-900'}>{isEn ? 'Address:' : 'Dirección:'}</strong>{' '}
                  Cra. 104c #20, Santa Margarita, Medellín, Robledo, Antioquia
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-[20px] text-cyan-500 shrink-0">
                  call
                </span>
                <div className={isDark ? 'text-slate-300' : 'text-slate-700'}>
                  <strong className={isDark ? 'text-white' : 'text-slate-900'}>{isEn ? 'Phone:' : 'Teléfono:'}</strong>{' '}
                  <a
                    href="tel:3004175616"
                    className="text-cyan-500 hover:text-cyan-400 font-semibold hover:underline cursor-pointer"
                  >
                    300 4175616
                  </a>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-[20px] text-teal-500 shrink-0">
                  schedule
                </span>
                <div className={isDark ? 'text-slate-300' : 'text-slate-700'}>
                  <strong className={isDark ? 'text-white' : 'text-slate-900'}>{isEn ? 'Office Hours:' : 'Horario:'}</strong>{' '}
                  <span className="text-emerald-500 font-bold">{isEn ? 'Open' : 'Abierto'}</span>
                  <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>{isEn ? ' · Closes at 5:30 p.m.' : ' · Cierra a las 5:30 p.m.'}</span>
                </div>
              </div>
            </div>
          </div>

        </section>

        {/* ========================================================================= */}
        {/* Right Column: Glassmorphism Login Card                                   */}
        {/* ========================================================================= */}
        <section className="w-full max-w-[440px] flex flex-col items-center">
          <div className={`backdrop-blur-xl rounded-3xl p-7 sm:p-9 w-full border shadow-2xl flex flex-col gap-5 relative overflow-hidden transition-all duration-300 ${
            isDark
              ? 'bg-slate-900/80 border-cyan-500/30 shadow-[0_8px_32px_0_rgba(6,182,212,0.18)] hover:border-cyan-400/50 hover:shadow-[0_12px_40px_0_rgba(6,182,212,0.25)]'
              : 'bg-white/95 border-slate-200 shadow-[0_16px_40px_rgba(0,40,140,0.12)] hover:border-blue-400'
          }`}>
            
            {/* Soft decorative bar along the top edge */}
            <div className="absolute top-0 left-1/4 right-1/4 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent pointer-events-none" />

            <div className={`pb-1 border-b ${isDark ? 'border-slate-800/80' : 'border-slate-200'}`}>
              <h3 className={`text-2xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {isEn ? 'Sign In' : 'Iniciar Sesión'}
              </h3>
              <p className={`text-sm mt-1 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                {isEn ? 'Enter your institutional credentials' : 'Ingresa tus credenciales institucionales de acceso'}
              </p>
            </div>

            {/* Login Form */}
            <form onSubmit={handleLoginSubmit} className="flex flex-col gap-4">
              <div>
                <label className={`block text-xs font-bold uppercase tracking-wider mb-1.5 ${
                  isDark ? 'text-cyan-300' : 'text-blue-950'
                }`}>
                  {isEn ? 'Institutional Email' : 'Correo electrónico'}
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 material-symbols-outlined text-[22px] text-cyan-500">
                    alternate_email
                  </span>
                  <input
                    type="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder=""
                    className={`w-full pl-11 pr-4 py-3.5 text-base rounded-xl outline-none transition-all ${
                      isDark
                        ? 'bg-slate-950/60 border border-slate-700/80 text-white focus:bg-slate-900/90 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/25'
                        : 'bg-slate-50 border border-slate-300 text-slate-900 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20'
                    }`}
                    autoComplete="username email"
                    required
                  />
                </div>
              </div>

              <div>
                <label className={`block text-xs font-bold uppercase tracking-wider mb-1.5 ${
                  isDark ? 'text-cyan-300' : 'text-blue-950'
                }`}>
                  {isEn ? 'Password' : 'Contraseña'}
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 material-symbols-outlined text-[22px] text-cyan-500">
                    lock
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder=""
                    className={`w-full pl-11 pr-12 py-3.5 text-base rounded-xl outline-none transition-all ${
                      isDark
                        ? 'bg-slate-950/60 border border-slate-700/80 text-white focus:bg-slate-900/90 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/25'
                        : 'bg-slate-50 border border-slate-300 text-slate-900 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20'
                    }`}
                    autoComplete="current-password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className={`absolute right-3.5 top-1/2 -translate-y-1/2 p-1 cursor-pointer transition-colors ${
                      isDark ? 'text-slate-400 hover:text-cyan-300' : 'text-slate-500 hover:text-blue-700'
                    }`}
                    title={showPassword ? (isEn ? 'Hide password' : 'Ocultar contraseña') : (isEn ? 'Show password' : 'Ver contraseña')}
                  >
                    <span className="material-symbols-outlined text-[22px]">
                      {showPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Success notification after password reset */}
              {resetSuccessNotice && (
                <div className="p-3.5 bg-emerald-500/15 border border-emerald-500/40 text-emerald-600 dark:text-emerald-400 text-sm rounded-xl flex items-start gap-2.5 animate-in fade-in">
                  <span className="material-symbols-outlined text-[20px] text-emerald-500 shrink-0 mt-0.5">check_circle</span>
                  <div className="leading-snug">
                    <strong className="block font-bold">{isEn ? 'Password Updated!' : '¡Contraseña Actualizada!'}</strong>
                    <span>{isEn ? 'Your password has been successfully updated. Enter your new password to sign in.' : 'Tu contraseña ha sido actualizada con éxito. Ingresa tu nueva contraseña para iniciar sesión.'}</span>
                  </div>
                </div>
              )}

              {/* Error message */}
              {loginError && (
                <div className="p-3.5 bg-rose-500/10 border border-rose-500/40 text-rose-600 text-sm rounded-xl flex items-start gap-2.5 animate-in fade-in">
                  <span className="material-symbols-outlined text-[20px] text-rose-500 shrink-0 mt-0.5">error</span>
                  <div className="leading-snug">
                    <strong className="block font-bold">{isEn ? 'Access Error:' : 'Error de Acceso:'}</strong>
                    <span>{translateErrorMessage(loginError)}</span>
                  </div>
                </div>
              )}

              {/* Login Button with Blue-Aquamarine Gradient */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-1 bg-gradient-to-r from-blue-600 via-cyan-600 to-teal-500 hover:from-blue-500 hover:via-cyan-500 hover:to-teal-400 active:opacity-90 text-white font-bold text-base py-3.5 rounded-xl transition-all duration-200 cursor-pointer text-center shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/45 hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2 disabled:opacity-75"
              >
                {isLoading ? (
                  <>
                    <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>{isEn ? 'Verifying credentials...' : 'Verificando credenciales...'}</span>
                  </>
                ) : (
                  <>
                    <span>{isEn ? 'Enter Platform' : 'Iniciar sesión'}</span>
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
                className="text-cyan-500 hover:text-cyan-400 text-sm font-semibold hover:underline cursor-pointer transition-colors"
              >
                {isEn ? 'Forgot your password?' : '¿Olvidaste tu contraseña?'}
              </button>
            </div>

            {/* Divider line */}
            <div className="relative my-1">
              <div className="absolute inset-0 flex items-center">
                <div className={`w-full border-t ${isDark ? 'border-slate-800' : 'border-slate-200'}`} />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className={`px-3 text-xs tracking-wider border rounded-full py-0.5 font-semibold ${
                  isDark ? 'bg-slate-900/95 border-slate-800 text-slate-400' : 'bg-white border-slate-200 text-slate-500'
                }`}>
                  {isEn ? 'New to Edulink School?' : '¿Nuevo en Edulink School?'}
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
                className={`w-full font-bold text-base px-5 py-3.5 rounded-xl cursor-pointer transition-all duration-150 shadow-sm flex items-center justify-center gap-2 active:scale-[0.99] border ${
                  isDark
                    ? 'bg-slate-800/80 hover:bg-slate-700/80 border-cyan-500/30 hover:border-cyan-400/60 text-white hover:shadow-cyan-500/10'
                    : 'bg-slate-100 hover:bg-slate-200/90 border-slate-300 text-slate-900 hover:border-blue-400'
                }`}
              >
                <span className="material-symbols-outlined text-[22px] text-cyan-500">person_add</span>
                <span>{isEn ? 'Create New Account' : 'Crear cuenta nueva'}</span>
              </button>
            </div>
          </div>

          {/* Subtext below login card */}
          <p className={`text-xs text-center mt-6 leading-relaxed max-w-[380px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            {isEn
              ? 'Institutional access protected via encrypted credentials and database verification.'
              : 'Acceso institucional protegido mediante credenciales cifradas y validación oficial.'}
          </p>
        </section>
      </main>

      {/* Institutional Footer */}
      <footer className={`relative z-10 w-full backdrop-blur-md border-t py-6 text-sm ${
        isDark
          ? 'bg-slate-950/80 border-cyan-500/15 text-slate-400'
          : 'bg-white/80 border-slate-200 text-slate-600'
      }`}>
        <div className="max-w-[1080px] mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div className={`flex items-center gap-2 font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
            <img src={ASSETS.logo} alt="" className="w-6 h-6 object-contain filter drop-shadow-[0_0_6px_rgba(6,182,212,0.6)]" />
            <span>Edulink School © 2026 • Institución Educativa Vallejuelos</span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-4 text-xs sm:text-sm">
            <span className="hover:text-cyan-500 cursor-pointer transition-colors">
              {isEn ? 'Coexistence Manual' : 'Manual de Convivencia'}
            </span>
            <span>•</span>
            <span className="hover:text-cyan-500 cursor-pointer transition-colors">
              {isEn ? 'Technical Support' : 'Soporte Técnico'}
            </span>
            <span>•</span>
            <span className="hover:text-cyan-500 cursor-pointer transition-colors">
              {isEn ? 'Secretary of Education' : 'Secretaría de Educación'}
            </span>
          </div>
        </div>
      </footer>

      {/* ========================================================================= */}
      {/* REGISTRATION MODAL WITH STRICT ROLE CONDITIONING & DATABASE VERIFICATION  */}
      {/* ========================================================================= */}
      {isRegisterModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className={`rounded-2xl shadow-2xl w-full max-w-[640px] my-6 border overflow-hidden flex flex-col max-h-[92vh] ${
            isDark ? 'bg-slate-900 text-slate-100 border-cyan-500/30' : 'bg-white text-slate-900 border-slate-200'
          }`}>
            
            {/* Modal Header */}
            <div className={`p-5 sm:p-6 flex items-start justify-between border-b shrink-0 ${
              isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-blue-700 text-white flex items-center justify-center shadow-sm shrink-0">
                  <span className="material-symbols-outlined text-[26px]">person_add</span>
                </div>
                <div>
                  <h3 className={`text-xl sm:text-2xl font-bold leading-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {isEn ? 'Create Institutional Account' : 'Crear Cuenta Institucional'}
                  </h3>
                  <p className={`text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    {isEn ? 'Select your role and provide required institutional verification' : 'Selecciona tu rol y suministra la información de verificación requerida'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsRegisterModalOpen(false)}
                className={`w-9 h-9 rounded-full flex items-center justify-center cursor-pointer transition-colors ${
                  isDark ? 'text-slate-400 hover:bg-slate-800 hover:text-white' : 'text-slate-500 hover:bg-slate-200 hover:text-slate-900'
                }`}
                title={isEn ? 'Close' : 'Cerrar'}
              >
                <span className="material-symbols-outlined text-[24px]">close</span>
              </button>
            </div>

            {/* Modal Body (Scrollable Form) */}
            <div className="p-5 sm:p-7 overflow-y-auto flex-1 flex flex-col gap-5">
              
              <form onSubmit={handleRegisterSubmit} className="flex flex-col gap-5">
                
                {/* 1. SELECCIÓN DE LOS 4 ROLES */}
                <div className={`p-4 sm:p-5 rounded-2xl border ${
                  isDark ? 'bg-slate-950/50 border-slate-800' : 'bg-blue-50/70 border-blue-100'
                }`}>
                  <div className="flex items-center justify-between mb-3">
                    <label className={`text-sm font-bold uppercase tracking-wider flex items-center gap-2 ${
                      isDark ? 'text-cyan-300' : 'text-blue-900'
                    }`}>
                      <span className="material-symbols-outlined text-[20px]">badge</span>
                      <span>{isEn ? 'Registration Role:' : 'Rol con el que te registrarás:'}</span>
                    </label>
                    <span className="text-xs px-2.5 py-1 rounded-full bg-blue-600/15 text-blue-600 font-bold">
                      {isEn ? 'Mandatory' : 'Obligatorio'}
                    </span>
                  </div>

                  {/* 4 Role Selection Tiles */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    <button
                      type="button"
                      onClick={() => setRegRole('student')}
                      className={`p-3 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1.5 ${
                        regRole === 'student'
                          ? 'bg-blue-600 text-white border-blue-500 shadow-md font-bold'
                          : isDark
                            ? 'bg-slate-900/90 border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[26px]">school</span>
                      <span className="text-sm font-bold leading-tight">{isEn ? 'Student' : 'Estudiante'}</span>
                      <span className={`text-xs ${regRole === 'student' ? 'text-blue-100' : 'text-slate-400'}`}>{isEn ? 'Learner' : 'Alumno'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setRegRole('teacher')}
                      className={`p-3 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1.5 ${
                        regRole === 'teacher'
                          ? 'bg-indigo-600 text-white border-indigo-500 shadow-md font-bold'
                          : isDark
                            ? 'bg-slate-900/90 border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[26px]">menu_book</span>
                      <span className="text-sm font-bold leading-tight">{isEn ? 'Teacher' : 'Docente'}</span>
                      <span className={`text-xs ${regRole === 'teacher' ? 'text-indigo-100' : 'text-slate-400'}`}>{isEn ? 'Protected' : 'Protegido'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setRegRole('family')}
                      className={`p-3 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1.5 ${
                        regRole === 'family'
                          ? 'bg-amber-600 text-white border-amber-500 shadow-md font-bold'
                          : isDark
                            ? 'bg-slate-900/90 border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[26px]">family_restroom</span>
                      <span className="text-sm font-bold leading-tight">{isEn ? 'Family' : 'Acudiente'}</span>
                      <span className={`text-xs ${regRole === 'family' ? 'text-amber-100' : 'text-slate-400'}`}>{isEn ? 'Guardian' : 'Familia'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setRegRole('admin')}
                      className={`p-3 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1.5 ${
                        regRole === 'admin'
                          ? 'bg-emerald-600 text-white border-emerald-500 shadow-md font-bold'
                          : isDark
                            ? 'bg-slate-900/90 border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[26px]">admin_panel_settings</span>
                      <span className="text-sm font-bold leading-tight">{isEn ? 'Staff / Admin' : 'Administrativo'}</span>
                      <span className={`text-xs ${regRole === 'admin' ? 'text-emerald-100' : 'text-slate-400'}`}>{isEn ? 'Protected' : 'Protegido'}</span>
                    </button>
                  </div>
                </div>

                {/* 2. CAMPOS CONDICIONADOS POR ROL */}
                
                {/* CASE A: ROL ESTUDIANTE (VALIDACIÓN PREVIA POR DOCUMENTO DE IDENTIDAD EN CENSO) */}
                {regRole === 'student' && (
                  <div className={`rounded-2xl p-5 flex flex-col gap-4 border ${
                    isDark ? 'bg-blue-950/30 border-blue-800/40 text-blue-100' : 'bg-blue-50 border-blue-200 text-blue-900'
                  }`}>
                    {/* Student Document Input (First Step: Identificación oficial) */}
                    <div className={`p-4 rounded-xl border ${
                      isDark ? 'bg-slate-900/90 border-blue-500/40' : 'bg-white border-blue-200 shadow-xs'
                    }`}>
                      <label className="block text-xs font-bold uppercase tracking-wider text-blue-600 mb-1.5 flex items-center justify-between">
                        <span>{isEn ? 'Student ID Document (TI / CC) *' : 'Documento de Identidad del Estudiante (TI / CC) *'}</span>
                        <span className="material-symbols-outlined text-[18px]">badge</span>
                      </label>
                      <input
                        id="input-student-document-lookup"
                        type="text"
                        autoComplete="off"
                        value={regStudentCode}
                        onChange={(e) => handleStudentDocChange(e.target.value)}
                        placeholder={isEn ? 'Enter your student ID number' : 'Ingresa tu número de documento de identidad'}
                        className={`w-full px-3.5 py-2.5 text-sm font-mono font-bold tracking-wider rounded-xl outline-none border transition-all ${
                          studentDocFeedback.status === 'found'
                            ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400'
                            : studentDocFeedback.status === 'not_found' || studentDocFeedback.status === 'already_registered'
                              ? 'bg-rose-500/10 border-rose-500 text-rose-400'
                              : isDark
                                ? 'bg-slate-950 border-blue-500/50 text-blue-300 focus:border-blue-400'
                                : 'bg-blue-50/50 border-blue-300 text-blue-900 focus:bg-white focus:border-blue-600'
                        }`}
                        required
                      />

                      {/* Real-time verification feedback */}
                      {studentDocFeedback.message && (
                        <div className={`mt-2 p-2 rounded-lg text-xs flex items-center gap-2 ${
                          studentDocFeedback.status === 'found'
                            ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-semibold'
                            : 'bg-rose-500/15 border border-rose-500/30 text-rose-400 font-medium'
                        }`}>
                          <span className="material-symbols-outlined text-[16px] shrink-0">
                            {studentDocFeedback.status === 'found' ? 'verified' : 'error'}
                          </span>
                          <span>{translateErrorMessage(studentDocFeedback.message)}</span>
                        </div>
                      )}
                    </div>

                    {/* Pre-populated Academic Information (Readonly) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                      <div>
                        <label className="block text-xs font-bold mb-1.5 flex items-center justify-between">
                          <span>{isEn ? 'Official Grade & Group' : 'Grado y Grupo Oficial'}</span>
                          <span className="text-[10px] text-blue-500 font-semibold">
                            {isEn ? 'Locked by enrollment census' : 'Asignado por censo oficial'}
                          </span>
                        </label>
                        <input
                          type="text"
                          readOnly
                          value={regGradeLevel ? (isEn ? `Grade ${regGradeLevel}` : `Grado ${regGradeLevel}`) : ''}
                          placeholder={isEn ? 'Auto-filled upon entering document' : 'Se asigna automáticamente'}
                          className={`w-full px-3.5 py-2.5 text-sm font-bold rounded-xl outline-none border cursor-not-allowed ${
                            regGradeLevel
                              ? isDark ? 'bg-slate-950/80 border-emerald-500/60 text-emerald-400' : 'bg-emerald-50 border-emerald-300 text-emerald-900'
                              : isDark ? 'bg-slate-950/50 border-slate-800 text-slate-400' : 'bg-slate-100 border-slate-200 text-slate-500'
                          }`}
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold mb-1.5 flex items-center justify-between">
                          <span>{isEn ? 'Official Institutional Shift' : 'Jornada Escolar Institucional'}</span>
                          <span className="text-[10px] text-blue-500 font-semibold">
                            {isEn ? 'Official Schedule' : 'Horario Oficial'}
                          </span>
                        </label>
                        <input
                          type="text"
                          readOnly
                          value={isEn ? 'Morning Shift (6:15 AM - 12:15 PM)' : 'Jornada Mañana (6:15 AM - 12:15 PM)'}
                          className={`w-full px-3.5 py-2.5 text-sm font-semibold rounded-xl outline-none border cursor-not-allowed ${
                            isDark
                              ? 'bg-slate-950/80 border-slate-700 text-blue-300'
                              : 'bg-slate-100 border-slate-300 text-slate-800'
                          }`}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* CASE B: ROL DOCENTE (PROTEGIDO CON CÓDIGO ÚNICO E IRREPETIBLE) */}
                {regRole === 'teacher' && (
                  <div className={`rounded-2xl p-5 flex flex-col gap-4 border ${
                    isDark ? 'bg-indigo-950/30 border-indigo-800/50 text-indigo-100' : 'bg-indigo-50 border-indigo-200 text-indigo-950'
                  }`}>
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                        <span className="material-symbols-outlined text-[20px]">verified_user</span>
                      </div>
                      <div>
                        <h4 className="text-sm font-bold flex items-center gap-2">
                          <span>{isEn ? 'Faculty Verification & Protected Access' : 'Verificación Docente y Acceso Protegido'}</span>
                          <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-indigo-600 text-white font-bold">
                            {isEn ? 'Unique Code' : 'Código Único'}
                          </span>
                        </h4>
                        <p className={`text-xs leading-relaxed mt-0.5 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                          {isEn
                            ? 'Security constraint: To register as a Teacher, enter your official Faculty Code issued in physical format by Academic Direction. Each code is unique, non-repeatable, and automatically assigns your subjects and grades.'
                            : 'Condición de seguridad: Para registrarte como Docente, ingresa tu Código de Vinculación Docente entregado en físico por Coordinación. El código es único, irrepetible y asigna automáticamente tus materias y grupos.'}
                        </p>
                      </div>
                    </div>

                    {/* Teacher Linking Code Input (Strictly manual, no autocomplete) */}
                    <div className={`p-3.5 rounded-xl border ${
                      isDark ? 'bg-slate-900/90 border-indigo-500/40' : 'bg-white border-indigo-200 shadow-xs'
                    }`}>
                      <label className="block text-xs font-bold uppercase tracking-wider text-indigo-600 mb-1.5 flex items-center justify-between">
                        <span>{isEn ? 'Teacher Linking Code (Personal & Non-transferable) *' : 'Código de Vinculación Docente (Único e Intransferible) *'}</span>
                        <span className="material-symbols-outlined text-[16px]">key</span>
                      </label>
                      <input
                        id="input-teacher-verification-code"
                        type="text"
                        autoComplete="off"
                        autoCorrect="off"
                        spellCheck="false"
                        value={regTeacherCode}
                        onChange={(e) => handleTeacherCodeChange(e.target.value)}
                        placeholder={isEn ? 'Enter your assigned teacher code' : 'Ingresa tu código único de docente'}
                        className={`w-full px-3.5 py-2.5 text-sm font-mono font-bold tracking-wider rounded-xl outline-none border transition-all ${
                          teacherFeedback.status === 'valid'
                            ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400'
                            : teacherFeedback.status === 'claimed' || teacherFeedback.status === 'invalid'
                              ? 'bg-rose-500/10 border-rose-500 text-rose-400'
                              : isDark
                                ? 'bg-slate-950 border-indigo-500/50 text-indigo-300 focus:border-indigo-400'
                                : 'bg-indigo-50/50 border-indigo-300 text-indigo-900 focus:bg-white focus:border-indigo-600'
                        }`}
                        required
                      />

                      {/* Real-time verification feedback */}
                      {teacherFeedback.message && (
                        <div className={`mt-2 p-2 rounded-lg text-xs flex items-center gap-2 ${
                          teacherFeedback.status === 'valid'
                            ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-semibold'
                            : 'bg-rose-500/15 border border-rose-500/30 text-rose-400'
                        }`}>
                          <span className="material-symbols-outlined text-[16px] shrink-0">
                            {teacherFeedback.status === 'valid' ? 'check_circle' : 'error'}
                          </span>
                          <span>{translateErrorMessage(teacherFeedback.message)}</span>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                      <div>
                        <label className="block text-xs font-bold mb-1.5 flex items-center justify-between">
                          <span>{isEn ? 'Assigned Subject Area' : 'Área o Asignatura Asignada'}</span>
                          <span className="text-[10px] text-indigo-500 font-semibold">
                            {isEn ? 'Auto-assigned by code' : 'Asignada por código'}
                          </span>
                        </label>
                        <input
                          type="text"
                          readOnly
                          value={regSubjectArea}
                          className={`w-full px-3.5 py-2.5 text-sm font-semibold rounded-xl outline-none border cursor-not-allowed ${
                            isDark
                              ? 'bg-slate-950/80 border-slate-700 text-indigo-300'
                              : 'bg-slate-100 border-slate-300 text-slate-800'
                          }`}
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold mb-1.5">
                          {isEn ? 'Teacher Citizen ID (CC) *' : 'Número de Cédula de Ciudadanía *'}
                        </label>
                        <input
                          type="text"
                          autoComplete="off"
                          value={regEmployeeId}
                          onChange={(e) => setRegEmployeeId(e.target.value)}
                          placeholder={isEn ? 'Citizen identification number' : 'Número de identificación'}
                          className={`w-full px-3.5 py-2.5 text-sm rounded-xl outline-none border ${
                            isDark
                              ? 'bg-slate-900 border-slate-700 text-white focus:border-indigo-400'
                              : 'bg-white border-slate-300 text-slate-900 focus:border-indigo-600'
                          }`}
                          required
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-xs font-bold mb-1.5 flex items-center justify-between">
                          <span>{isEn ? 'Assigned Academic Groups' : 'Grupos Académicos Asignados'}</span>
                          <span className="text-[10px] text-indigo-500 font-semibold">
                            {isEn ? 'Bound to official schedule' : 'Vinculados según carga oficial'}
                          </span>
                        </label>
                        <input
                          type="text"
                          readOnly
                          value={regAssignedGrades}
                          className={`w-full px-3.5 py-2.5 text-sm font-semibold rounded-xl outline-none border cursor-not-allowed ${
                            isDark
                              ? 'bg-slate-950/80 border-slate-700 text-indigo-300'
                              : 'bg-slate-100 border-slate-300 text-slate-800'
                          }`}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* CASE C: ROL ACUDIENTE / FAMILIA (VERIFICADO CON AUTOCOMPLETADO DE NOMBRE) */}
                {regRole === 'family' && (
                  <div className={`rounded-2xl p-5 flex flex-col gap-4 border ${
                    isDark ? 'bg-amber-950/30 border-amber-800/50 text-amber-100' : 'bg-amber-50 border-amber-200 text-amber-950'
                  }`}>
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-xl bg-amber-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                        <span className="material-symbols-outlined text-[20px]">family_restroom</span>
                      </div>
                      <div>
                        <h4 className="text-sm font-bold flex items-center gap-2">
                          <span>{isEn ? 'Family Representation & Enrollment Verification' : 'Vinculación Familiar y Verificación de Matrícula'}</span>
                        </h4>
                        <p className={`text-xs leading-relaxed mt-0.5 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                          {isEn
                            ? 'Condition: Enter your student’s document number. The system will automatically look up the official census and auto-complete the student’s name to ensure legitimate representation.'
                            : 'Condición: Digita el documento de identidad de tu estudiante. El sistema consultará el censo oficial y autocompletará su nombre automáticamente para verificar la matrícula.'}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                      <div>
                        <label className="block text-xs font-bold mb-1.5">
                          {isEn ? 'Relationship with Student *' : 'Parentesco con el Estudiante *'}
                        </label>
                        <select
                          value={regRelationship}
                          onChange={(e) => setRegRelationship(e.target.value)}
                          className={`w-full px-3.5 py-2.5 text-sm rounded-xl outline-none border ${
                            isDark
                              ? 'bg-slate-900 border-slate-700 text-white focus:border-amber-400'
                              : 'bg-white border-slate-300 text-slate-900 focus:border-amber-600'
                          }`}
                        >
                          <option value="Madre de familia">{isEn ? 'Mother' : 'Madre de familia'}</option>
                          <option value="Padre de familia">{isEn ? 'Father' : 'Padre de familia'}</option>
                          <option value="Acudiente Legal Autorizado">{isEn ? 'Authorized Legal Guardian' : 'Acudiente Legal Autorizado'}</option>
                          <option value="Tutor(a) / Familiar Cercano">{isEn ? 'Tutor / Close Relative' : 'Tutor(a) / Familiar Cercano'}</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold mb-1.5">
                          {isEn ? 'Guardian ID Document (CC) *' : 'Documento de Identidad del Acudiente *'}
                        </label>
                        <input
                          type="text"
                          autoComplete="off"
                          value={regGuardianDocId}
                          onChange={(e) => setRegGuardianDocId(e.target.value)}
                          placeholder={isEn ? 'Guardian ID number' : 'Cédula del acudiente'}
                          className={`w-full px-3.5 py-2.5 text-sm rounded-xl outline-none border ${
                            isDark
                              ? 'bg-slate-900 border-slate-700 text-white focus:border-amber-400'
                              : 'bg-white border-slate-300 text-slate-900 focus:border-amber-600'
                          }`}
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold mb-1.5 flex items-center justify-between">
                          <span>{isEn ? 'Student ID Number *' : 'Documento del Estudiante *'}</span>
                          <span className="text-[10px] text-amber-500 font-semibold">
                            {isEn ? 'Type to search census' : 'Digita para consultar'}
                          </span>
                        </label>
                        <input
                          type="text"
                          autoComplete="off"
                          value={regRepresentedStudentCode}
                          onChange={(e) => handleRepresentedStudentDocChange(e.target.value)}
                          placeholder={isEn ? 'Enter student document' : 'Digita el documento del estudiante'}
                          className={`w-full px-3.5 py-2.5 text-sm rounded-xl outline-none border font-mono ${
                            studentLookupFeedback.status === 'found'
                              ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400 font-bold'
                              : studentLookupFeedback.status === 'not_found'
                                ? 'bg-rose-500/10 border-rose-500 text-rose-400 font-bold'
                                : isDark
                                  ? 'bg-slate-900 border-slate-700 text-white focus:border-amber-400'
                                  : 'bg-white border-slate-300 text-slate-900 focus:border-amber-600'
                          }`}
                          required
                        />
                        {studentLookupFeedback.message && (
                          <div className={`mt-1.5 p-1.5 rounded-lg text-[11px] flex items-center gap-1.5 ${
                            studentLookupFeedback.status === 'found'
                              ? 'text-emerald-400 font-semibold'
                              : 'text-rose-400'
                          }`}>
                            <span className="material-symbols-outlined text-[15px] shrink-0">
                              {studentLookupFeedback.status === 'found' ? 'verified' : 'cancel'}
                            </span>
                            <span>{translateErrorMessage(studentLookupFeedback.message)}</span>
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="block text-xs font-bold mb-1.5 flex items-center justify-between">
                          <span>{isEn ? 'Student Full Name' : 'Nombre Completo del Estudiante'}</span>
                          <span className="text-[10px] text-amber-500 font-semibold">
                            {isEn ? 'Auto-completed' : 'Autocompletado oficial'}
                          </span>
                        </label>
                        <input
                          type="text"
                          readOnly
                          value={regRepresentedStudentName}
                          placeholder={isEn ? 'Auto-filled upon entering document' : 'Se autocompleta con el documento'}
                          className={`w-full px-3.5 py-2.5 text-sm rounded-xl outline-none border font-semibold ${
                            regRepresentedStudentName
                              ? isDark ? 'bg-slate-950/80 border-emerald-500/60 text-emerald-400' : 'bg-emerald-50 border-emerald-300 text-emerald-900'
                              : isDark ? 'bg-slate-950/50 border-slate-800 text-slate-400' : 'bg-slate-100 border-slate-200 text-slate-500'
                          }`}
                          required
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-xs font-bold mb-1.5">
                          {isEn ? 'Family Contact Phone *' : 'Teléfono de Contacto Familiar *'}
                        </label>
                        <input
                          type="text"
                          autoComplete="off"
                          value={regEmergencyPhone}
                          onChange={(e) => setRegEmergencyPhone(e.target.value)}
                          placeholder={isEn ? 'Emergency contact telephone' : 'Número de teléfono o celular'}
                          className={`w-full px-3.5 py-2.5 text-sm rounded-xl outline-none border ${
                            isDark
                              ? 'bg-slate-900 border-slate-700 text-white focus:border-amber-400'
                              : 'bg-white border-slate-300 text-slate-900 focus:border-amber-600'
                          }`}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* CASE D: ROL ADMINISTRATIVO (PROTEGIDO CON CÓDIGO DIRECTIVO ÚNICO) */}
                {regRole === 'admin' && (
                  <div className={`rounded-2xl p-5 flex flex-col gap-4 border ${
                    isDark ? 'bg-emerald-950/30 border-emerald-800/50 text-emerald-100' : 'bg-emerald-50 border-emerald-200 text-emerald-950'
                  }`}>
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                        <span className="material-symbols-outlined text-[20px]">admin_panel_settings</span>
                      </div>
                      <div>
                        <h4 className="text-sm font-bold flex items-center gap-2">
                          <span>{isEn ? 'Directive Verification & Staff Authorization' : 'Verificación Directiva y Autorización de Personal'}</span>
                          <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-emerald-600 text-white font-bold">
                            {isEn ? 'Strict Security' : 'Seguridad Estricta'}
                          </span>
                        </h4>
                        <p className={`text-xs leading-relaxed mt-0.5 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                          {isEn
                            ? 'Directive constraint: Registration for leadership and staff roles requires the directive verification code issued in physical format. Each code corresponds strictly and uniquely to one official position.'
                            : 'Condición directiva: El registro como directivo o administrativo exige el código de verificación directiva entregado en físico. Cada código corresponde de forma única e irrepetible a un cargo oficial.'}
                        </p>
                      </div>
                    </div>

                    {/* Directive Authorization Code Input (Strictly manual, no autocomplete, no displayed keys) */}
                    <div className={`p-3.5 rounded-xl border ${
                      isDark ? 'bg-slate-900/90 border-emerald-500/40' : 'bg-white border-emerald-200 shadow-xs'
                    }`}>
                      <label className="block text-xs font-bold uppercase tracking-wider text-emerald-600 mb-1.5 flex items-center justify-between">
                        <span>{isEn ? 'Directive Verification Code *' : 'Código de Verificación Directiva *'}</span>
                        <span className="material-symbols-outlined text-[16px]">lock</span>
                      </label>
                      <input
                        id="input-admin-verification-code"
                        type="text"
                        autoComplete="off"
                        autoCorrect="off"
                        spellCheck="false"
                        value={regAdminKey}
                        onChange={(e) => handleAdminCodeChange(e.target.value)}
                        placeholder={isEn ? 'Enter directive authorization code' : 'Ingresa tu código de verificación directiva'}
                        className={`w-full px-3.5 py-2.5 text-sm font-mono font-bold tracking-wider rounded-xl outline-none border transition-all ${
                          adminFeedback.status === 'valid'
                            ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400'
                            : adminFeedback.status === 'claimed' || adminFeedback.status === 'invalid'
                              ? 'bg-rose-500/10 border-rose-500 text-rose-400'
                              : isDark
                                ? 'bg-slate-950 border-emerald-500/50 text-emerald-300 focus:border-emerald-400'
                                : 'bg-emerald-50/50 border-emerald-300 text-emerald-900 focus:bg-white focus:border-emerald-600'
                        }`}
                        required
                      />

                      {/* Real-time verification feedback */}
                      {adminFeedback.message && (
                        <div className={`mt-2 p-2 rounded-lg text-xs flex items-center gap-2 ${
                          adminFeedback.status === 'valid'
                            ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-semibold'
                            : 'bg-rose-500/15 border border-rose-500/30 text-rose-400'
                        }`}>
                          <span className="material-symbols-outlined text-[16px] shrink-0">
                            {adminFeedback.status === 'valid' ? 'check_circle' : 'error'}
                          </span>
                          <span>{translateErrorMessage(adminFeedback.message)}</span>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                      <div>
                        <label className="block text-xs font-bold mb-1.5 flex items-center justify-between">
                          <span>{isEn ? 'Position / Department' : 'Cargo o Dependencia'}</span>
                          <span className="text-[10px] text-emerald-500 font-semibold">
                            {isEn ? 'Auto-bound to code' : 'Vinculado al código'}
                          </span>
                        </label>
                        <input
                          type="text"
                          readOnly
                          value={regAdminPosition}
                          className={`w-full px-3.5 py-2.5 text-sm font-semibold rounded-xl outline-none border cursor-not-allowed ${
                            isDark
                              ? 'bg-slate-950/80 border-slate-700 text-emerald-400'
                              : 'bg-slate-100 border-slate-300 text-slate-800'
                          }`}
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold mb-1.5">
                          {isEn ? 'Citizen ID (CC) *' : 'Documento de Identidad (Cédula) *'}
                        </label>
                        <input
                          type="text"
                          autoComplete="off"
                          value={regAdminDocId}
                          onChange={(e) => setRegAdminDocId(e.target.value)}
                          placeholder={isEn ? 'Staff ID number' : 'Cédula de ciudadanía'}
                          className={`w-full px-3.5 py-2.5 text-sm rounded-xl outline-none border ${
                            isDark
                              ? 'bg-slate-900 border-slate-700 text-white focus:border-emerald-400'
                              : 'bg-white border-slate-300 text-slate-900 focus:border-emerald-600'
                          }`}
                          required
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-xs font-bold mb-1.5">
                          {isEn ? 'Institutional Employee Code' : 'Código de Empleado o Dependencia Institucional'}
                        </label>
                        <input
                          type="text"
                          autoComplete="off"
                          value={regAdminEmployeeCode}
                          onChange={(e) => setRegAdminEmployeeCode(e.target.value)}
                          placeholder={isEn ? 'Optional employee code' : 'Código opcional de nómina o dependencia'}
                          className={`w-full px-3.5 py-2.5 text-sm rounded-xl outline-none border ${
                            isDark
                              ? 'bg-slate-900 border-slate-700 text-white focus:border-emerald-400'
                              : 'bg-white border-slate-300 text-slate-900 focus:border-emerald-600'
                          }`}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. CAMPOS GENERALES DE CUENTA (Nombre, Correo, Contraseña) */}
                <div className="flex flex-col gap-4">
                  <div>
                    <label className="block text-xs font-bold mb-1.5 flex items-center justify-between">
                      <span>{isEn ? 'Full Name *' : 'Nombre Completo *'}</span>
                      {regRole === 'student' && regFullName && (
                        <span className="text-[10px] text-emerald-500 font-semibold flex items-center gap-1">
                          <span className="material-symbols-outlined text-[13px]">verified</span>
                          {isEn ? 'Census verified' : 'Verificado en censo escolar'}
                        </span>
                      )}
                    </label>
                    <input
                      type="text"
                      readOnly={regRole === 'student' && Boolean(regFullName)}
                      value={regFullName}
                      onChange={(e) => setRegFullName(e.target.value)}
                      placeholder={regRole === 'student' ? (isEn ? 'Auto-filled upon entering document' : 'Se autocompleta con tu documento') : ''}
                      className={`w-full px-4 py-3 text-base rounded-xl outline-none border ${
                        regRole === 'student' && regFullName
                          ? isDark ? 'bg-slate-950/80 border-emerald-500/60 text-emerald-400 font-semibold cursor-not-allowed' : 'bg-emerald-50 border-emerald-300 text-emerald-900 font-semibold cursor-not-allowed'
                          : isDark
                            ? 'bg-slate-950 border-slate-700 text-white focus:border-cyan-400'
                            : 'bg-slate-50 border-slate-300 text-slate-900 focus:bg-white focus:border-blue-600'
                      }`}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold mb-1.5">
                      {isEn ? 'Email Address *' : 'Correo Electrónico *'}
                    </label>
                    <input
                      type="email"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder=""
                      className={`w-full px-4 py-3 text-base rounded-xl outline-none border ${
                        isDark
                          ? 'bg-slate-950 border-slate-700 text-white focus:border-cyan-400'
                          : 'bg-slate-50 border-slate-300 text-slate-900 focus:bg-white focus:border-blue-600'
                      }`}
                      required
                    />
                  </div>

                  {/* Password with rules and validations */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-xs font-bold mb-1.5">
                        {isEn ? 'New Password *' : 'Contraseña Nueva *'}
                      </label>
                      <input
                        type={showRegPassword ? 'text' : 'password'}
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        placeholder=""
                        className={`w-full px-4 py-3 text-base rounded-xl outline-none border ${
                          isDark
                            ? 'bg-slate-950 border-slate-700 text-white focus:border-cyan-400'
                            : 'bg-slate-50 border-slate-300 text-slate-900 focus:bg-white focus:border-blue-600'
                        }`}
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold mb-1.5">
                        {isEn ? 'Confirm Password *' : 'Confirmar Contraseña *'}
                      </label>
                      <input
                        type={showRegPassword ? 'text' : 'password'}
                        value={regConfirmPassword}
                        onChange={(e) => setRegConfirmPassword(e.target.value)}
                        placeholder=""
                        className={`w-full px-4 py-3 text-base rounded-xl outline-none border ${
                          isDark
                            ? 'bg-slate-950 border-slate-700 text-white focus:border-cyan-400'
                            : 'bg-slate-50 border-slate-300 text-slate-900 focus:bg-white focus:border-blue-600'
                        }`}
                        required
                      />
                    </div>
                  </div>

                  {/* Password Rule Requirements Checklist */}
                  <div className={`p-3.5 rounded-xl border text-xs space-y-1.5 ${
                    isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
                  }`}>
                    <span className="font-bold block mb-1">
                      {isEn ? 'Password security requirements:' : 'Requisitos de seguridad para la contraseña:'}
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div className={`flex items-center gap-1.5 font-medium ${passHasMinLength ? 'text-emerald-500' : 'text-slate-400'}`}>
                        <span className="material-symbols-outlined text-[16px]">
                          {passHasMinLength ? 'check_circle' : 'radio_button_unchecked'}
                        </span>
                        <span>{isEn ? 'Minimum 8 characters' : 'Mínimo 8 caracteres'}</span>
                      </div>
                      <div className={`flex items-center gap-1.5 font-medium ${passHasUpper ? 'text-emerald-500' : 'text-slate-400'}`}>
                        <span className="material-symbols-outlined text-[16px]">
                          {passHasUpper ? 'check_circle' : 'radio_button_unchecked'}
                        </span>
                        <span>{isEn ? 'One uppercase letter (A-Z)' : 'Una letra mayúscula (A-Z)'}</span>
                      </div>
                      <div className={`flex items-center gap-1.5 font-medium ${passHasLower ? 'text-emerald-500' : 'text-slate-400'}`}>
                        <span className="material-symbols-outlined text-[16px]">
                          {passHasLower ? 'check_circle' : 'radio_button_unchecked'}
                        </span>
                        <span>{isEn ? 'One lowercase letter (a-z)' : 'Una letra minúscula (a-z)'}</span>
                      </div>
                      <div className={`flex items-center gap-1.5 font-medium ${passHasSpecial ? 'text-emerald-500' : 'text-slate-400'}`}>
                        <span className="material-symbols-outlined text-[16px]">
                          {passHasSpecial ? 'check_circle' : 'radio_button_unchecked'}
                        </span>
                        <span>{isEn ? 'One special character (!@#$%&*)' : 'Un carácter especial (!@#$%&*)'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      id="showRegPass"
                      checked={showRegPassword}
                      onChange={(e) => setShowRegPassword(e.target.checked)}
                      className="w-4 h-4 rounded text-blue-600 focus:ring-0 cursor-pointer"
                    />
                    <label htmlFor="showRegPass" className="cursor-pointer font-medium select-none">
                      {isEn ? 'Show passwords' : 'Mostrar contraseñas'}
                    </label>
                  </div>
                </div>

                {/* 4. MANDATORY CASILLA: PERSONAL DATA TREATMENT POLICY */}
                <div className={`flex items-start gap-3 p-4 rounded-xl border ${
                  isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
                }`}>
                  <input
                    type="checkbox"
                    id="acceptDataPolicy"
                    checked={acceptDataPolicy}
                    onChange={(e) => setAcceptDataPolicy(e.target.checked)}
                    className="mt-1 w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-600 cursor-pointer shrink-0"
                    required
                  />
                  <label htmlFor="acceptDataPolicy" className="text-sm leading-snug cursor-pointer select-none">
                    {isEn ? (
                      <>I accept the <span className="font-bold text-blue-600">personal data protection and processing policy</span> and the institutional educational service terms of Institución Educativa Vallejuelos.</>
                    ) : (
                      <>Acepto la <span className="font-bold text-blue-600">política de uso y tratamiento de datos personales</span> y los términos del servicio educativo institucional de la Institución Educativa Vallejuelos.</>
                    )}
                  </label>
                </div>

                {/* Error message */}
                {regError && (
                  <div className="p-4 bg-rose-500/10 border border-rose-500/40 text-rose-500 text-sm rounded-xl flex items-start gap-2.5 animate-in fade-in">
                    <span className="material-symbols-outlined text-[20px] shrink-0 mt-0.5">error</span>
                    <div className="leading-snug">
                      <strong className="block font-bold">{isEn ? 'Registration Error:' : 'Error en el registro:'}</strong>
                      <span>{translateErrorMessage(regError)}</span>
                    </div>
                  </div>
                )}

                {regSuccess && (
                  <div className="p-4 bg-emerald-500/15 border border-emerald-500/40 text-emerald-500 text-sm rounded-xl flex items-start gap-2.5 animate-in fade-in">
                    <span className="material-symbols-outlined text-[20px] shrink-0 mt-0.5">check_circle</span>
                    <span>{regSuccess}</span>
                  </div>
                )}

                {/* Submit button */}
                <div className="text-center pt-2">
                  <button
                    type="submit"
                    disabled={regLoading}
                    className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-base py-3.5 px-10 rounded-xl shadow-md cursor-pointer transition duration-150 active:scale-[0.98] disabled:opacity-75 flex items-center justify-center gap-2 mx-auto"
                  >
                    {regLoading ? (
                      <>
                        <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>{isEn ? 'Registering...' : 'registrando'}</span>
                      </>
                    ) : (
                      <>
                        <span>{isEn ? 'Sign Up' : 'Registrarse'}</span>
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
        initialEmail={loginEmail.includes('@') ? loginEmail : ''}
        onPasswordResetSuccess={(resetEmail) => {
          setLoginEmail(resetEmail);
          setLoginPassword('');
          setLoginError(null);
          setResetSuccessNotice(true);
        }}
      />
    </div>
  );
};
