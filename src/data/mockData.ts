import { Subject, UpcomingAssignment, StudentGradeRecord, NewsFeedItem, ChatContact, ChatMessage, MessageThread } from '../types';
const logoTransparent = '/src/assets/logo_transparent.png';

export const ASSETS = {
  logo: logoTransparent,
  logoOriginal: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCSdAbxIX8CzEGwzjimeUrwJPYsoV9H5ka27VSMnOx0vMDqWCrkhJs-rJaDNNq4qqSh3CR4KGFhwmLDoh2oOv7THJ7aAlMf-jvfxAoo7B9DGuRNajB-n44BhsRTuAi6BdlwziN0F6YN-V-mIN6bpuZmR4v60lEqhRoAT4kp7rCyq4TRsJYGheDRdsBKP_pzg2tGBsgBu4npW8RvAvQDPS86EwrkvILozaRts2b9V6_R37JOZJrfASMTW7NkpVzXD6HOSg',
  logoAlt: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBT4WXc5O0uRPof6NVgScvalqZHIGnhzA__FefDtjwuXTfuH9yyXNlcOxa5x6dNg0VqlQtp2sHnTSnSddEpFYgfc5otthpyeYo-h2WBJ2mZGZJahl7n2vNuokT2o-B6-n8rqesZLcyQRRWy8unq8yP3kLnYwNq8ztMoZ4JFvIadaO4o2CTWAcrAfPAndQDI5oQp2-FsHQAArOd0pY8BKQlV8pmPTHIFso0gzpxGqxX139DZkkB8V0ITP3DNmV2ht3fqcw',
  logoSquare: 'https://lh3.googleusercontent.com/aida/AEtjO1W3zwTKsnyZfM-BFYxueai7dlE-Nf_v0pyj9wt2vW-Ks4onYYM4EVyIsWhkv45rMTgzHVh0d0i6dbZ0O1EflAlNvLkpWNkCoGyyfxKX_Qmh2eq1Xyvgcps5nm-6Y39Zvr82C38PBb4VIJi33wJB07ObPkZWGBl5eLj6IjbWvJnd_WKgmoFh05Tgi_SYFR8Srnm4AKlZOMldPt4M5a6_U1WnQLzjgZ8rQf2DUPRCm3YWzx84K2hnUfdkrbdT8B6F4SxRfsC2GSn3qA',
  studentAvatar: 'https://lh3.googleusercontent.com/aida/AEtjO1UAUp9aO-emEWz86IpIANK_B04r3G5kHHReLdccjYbf1Hsnptbqlw2QZzjU34Q8CbrRjrVZ9F4QoBqkDJTUq_H9mqDRl-HGP-g2n2yw9a3rYGQQH-nErWPuO5FmntI565U80Nt4z0CbC9PdZbpiLrZODZzRHF7InHkJO9gOoEjTZ-7IeSs32BVLLNqBNEFQbj3W_YxDG9Xa2UZuYnSRxpCRjlw6DjEVGc-VC18Y8lhFeS-bG41G8r5RFA',
  parentAvatar: 'https://lh3.googleusercontent.com/aida/AEtjO1V_seUTyWhAjk1Wgyc68lr1KzE3D-KRxqwSsuCcjjkStTh1j-ZM3X8N8Jg9YdImJSv9qZD5av2-LaYe-BqzdujPdfVzIxiMH_RnNqPa8OYgNX_sdmhcyl2GZpaX7kP6Ra5qtF_PJlQa3tsCyvcIb2FR52-pTJ7cyujpM6_uXD_ACGMs6j5ENSW-BQOmuEMT6i9asGL6dWz3iqAquyCw9-GCAhqZY0_a9_JNrByBwt-lvbTcKw70KYTMQu0Wt5mS-5NIHAQvQbrhgA',
  teacherDaniela: 'https://lh3.googleusercontent.com/aida/AEtjO1XqlvtytCnN4FfxmlPZ9qKGjaVFFqby2l87ItG0TriSiiXlGAAHVaX1MZ0hQNdIGz8NTGCsh685YfTND30zXiDmG7HGAMNkhznharxFv29I5qVnj0PTyRC-BmOpbRKb9jl08aFv41f4RuN5CLSLMM5xdAPwjFqlfO62yjQemmE1cwIOxsSwt3MjQTJLDzcA4H6Q8Bk5zLyzFuab-RTE8mw2g0KDatDJ6whZhWFH_8WFYQS8Yv-z0Bpwlg',
  studentSofia: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC_N8vAF3cMN01SLuCMK2ZC-4Z53cnxx3W0baOEyY-qBTruBbxH19I0u26pLD1jUfEuOMGfxxqKCvnrc-NiyH4TCOmjZzM9D5ekzBrwzjuAvUvm-2GIQMUGnlvMGFqcfw-GENSlBtgiG0LGQLEHhQtb66P3RLI_OR2GoOwVaJmIr_z5FD44WRr1CQz_L_08HuW2CmpDzNoMaa1_Xe4DTJTnek035Z5C-XJVb5STQKu4bu3-5GCs6sYM',
  studentCarlos: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDO0pCdmtMUY3KXNU0OkNWnfvioRcWE3iq-tOpCw7enbROm7ph3yV0rK5uOHbA0wSovDHIrNKIPvMzBRoITgPsmFt68jYULKlZYtI5GVmo6F6aRKBXkNzGV7kE1GaaELZT-OtSE8kjkMpEnvRJzoAwqGnCvXo3B92sZEfIyBUIhsfcwbIykA5IxvZaP6P00DJ1i9qGhDxln0I4WU6HYw8_7BkovkoLjX5GfmDMf58GoVh1l6iI6XVg6'
};

export const INITIAL_SUBJECTS: Subject[] = [
  {
    id: 'mat',
    name: 'Matemáticas',
    category: 'Ciencias Exactas',
    teacher: 'Lic. Roberto Gómez',
    schedule: 'Lun - Mié 07:00 AM',
    room: 'Aula 204',
    grade: 4.5,
    progress: 65,
    color: '#2563eb',
    bgLight: '#eff6ff',
    icon: 'calculate',
    nextClass: 'Lun 07:00 AM'
  },
  {
    id: 'prog',
    name: 'Programación',
    category: 'Tecnología',
    teacher: 'Ing. Claudia Restrepo',
    schedule: 'Mar - Jue 09:30 AM',
    room: 'Lab Software',
    grade: 4.8,
    progress: 78,
    color: '#4f46e5',
    bgLight: '#eef2ff',
    icon: 'terminal',
    nextClass: 'Jue 09:30 AM'
  },
  {
    id: 'leng',
    name: 'Lengua Castellana',
    category: 'Humanidades',
    teacher: 'Prof. María Helena Vélez',
    schedule: 'Mié - Vie 10:45 AM',
    room: 'Aula 102',
    grade: 3.9,
    progress: 50,
    color: '#e11d48',
    bgLight: '#fff1f2',
    icon: 'auto_stories',
    nextClass: 'Vie 10:45 AM'
  },
  {
    id: 'ing',
    name: 'Inglés B2',
    category: 'Idiomas',
    teacher: 'Teacher David Miller',
    schedule: 'Mar - Vie 08:15 AM',
    room: 'Sala Bilingüe',
    grade: 4.1,
    progress: 70,
    color: '#0d9488',
    bgLight: '#f0fdfa',
    icon: 'language',
    nextClass: 'Mar 08:15 AM'
  }
];

export const INITIAL_UPCOMING_ASSIGNMENTS: UpcomingAssignment[] = [
  {
    id: 'taller-calculo',
    subject: 'Matemáticas',
    subjectColor: 'text-blue-700',
    title: 'Taller de Cálculo Diferencial - Derivadas e Integrales',
    dueText: 'Hoy • 11:59 PM',
    dueDate: 'Hoy',
    type: 'Archivo PDF',
    typeIcon: 'picture_as_pdf',
    points: '15%',
    urgency: 'urgente',
    borderAccent: 'border-l-4 border-[#ba1a1a]'
  },
  {
    id: 'proyecto-python',
    subject: 'Programación',
    subjectColor: 'text-indigo-700',
    title: 'Proyecto Final: Sistema de Reservas en Python',
    dueText: 'Vence el Jueves (3 días)',
    dueDate: 'En 3 días',
    type: 'Repo GitHub / ZIP',
    typeIcon: 'folder_zip',
    points: '25%',
    urgency: 'urgente',
    borderAccent: 'border-l-4 border-amber-500'
  },
  {
    id: 'ensayo-soledad',
    subject: 'Lengua Castellana',
    subjectColor: 'text-rose-700',
    title: 'Ensayo Argumentativo: Realismo Mágico y Cien Años de Soledad',
    dueText: 'En 9 días • 16 Feb',
    dueDate: 'En 9 días',
    type: 'Documento Word',
    typeIcon: 'description',
    points: '20%',
    urgency: 'regular',
    borderAccent: 'border-l-4 border-emerald-500'
  }
];

export const INITIAL_STUDENT_GRADES: StudentGradeRecord[] = [
  {
    id: '1',
    name: 'Miguel Ángel Jiménez',
    matricula: '2026-1102',
    avatar: ASSETS.studentAvatar,
    parcial1: 4.5,
    parcial2: 4.8,
    taller1: 5.0,
    serConv: 4.6
  },
  {
    id: '2',
    name: 'Sofía Valentina Gómez',
    matricula: '2026-1103',
    avatar: ASSETS.studentSofia,
    parcial1: 3.8,
    parcial2: 4.0,
    taller1: 4.2,
    serConv: 4.5
  },
  {
    id: '3',
    name: 'Carlos Eduardo Morales',
    matricula: '2026-1104',
    avatar: ASSETS.studentCarlos,
    parcial1: 2.4,
    parcial2: 2.8,
    taller1: 3.0,
    serConv: 3.5
  },
  {
    id: '4',
    name: 'Isabella Torres Restrepo',
    matricula: '2026-1105',
    initials: 'IT',
    avatarBg: 'bg-[#dde1ff] text-[#001453]',
    parcial1: 4.9,
    parcial2: 5.0,
    taller1: 4.7,
    serConv: 5.0
  },
  {
    id: '5',
    name: 'Mateo Andrés Pineda',
    matricula: '2026-1106',
    initials: 'MP',
    avatarBg: 'bg-[#dce9ff] text-[#0b1c30]',
    parcial1: 2.0,
    parcial2: 2.2,
    taller1: 2.5,
    serConv: 3.0
  },
  {
    id: '6',
    name: 'Camila Lucía Ortiz',
    matricula: '2026-1107',
    initials: 'CO',
    avatarBg: 'bg-[#dbe1ff] text-[#0051d5]',
    parcial1: 3.5,
    parcial2: 3.6,
    taller1: 4.0,
    serConv: 4.2
  },
  {
    id: '7',
    name: 'Juan David Castro',
    matricula: '2026-1108',
    initials: 'JC',
    avatarBg: 'bg-[#d3e4fe] text-[#0b1c30]',
    parcial1: 3.0,
    parcial2: 3.2,
    taller1: 3.4,
    serConv: 4.0
  },
  {
    id: '8',
    name: 'Valentina Quintero',
    matricula: '2026-1109',
    initials: 'VQ',
    avatarBg: 'bg-[#c4e7ff] text-[#00394f]',
    parcial1: 4.2,
    parcial2: 4.4,
    taller1: 4.5,
    serConv: 4.8
  }
];

export const INITIAL_NEWS_FEED: NewsFeedItem[] = [
  {
    id: 'feed-1',
    title: 'El profesor de Matemáticas publicó la nota del Parcial 2',
    category: 'grades',
    author: 'Lic. Roberto Gómez',
    timeAgo: 'Hoy, hace 2 horas',
    gradeBadge: 'Nota: 4.5 / 5.0',
    content: 'Evaluación sobre Límites y Continuidad de Funciones. Miguel Ángel demostró buen dominio conceptual y destreza en los ejercicios analíticos prácticos.',
    icon: 'quiz',
    iconBg: 'bg-[#1e40af]',
    iconColor: 'text-white',
    actionText: 'Ver desglose evaluativo',
    weight: 'Ponderación: 25%'
  },
  {
    id: 'feed-2',
    title: 'Citación a entrega de boletines - 1° Período',
    category: 'meetings',
    author: 'Coordinación Académica I.E. Vallejuelos',
    timeAgo: 'Ayer, 4:15 PM',
    statusBadge: {
      text: 'Obligatoria • Presencial',
      type: 'mandatory'
    },
    content: 'Estimados acudientes: los invitamos cordialmente a la entrega oficial y análisis de los informes valorativos del 1° Período 2026 en el Aula Máxima institucional a las 7:00 AM.',
    icon: 'groups',
    iconBg: 'bg-[#316bf3]',
    iconColor: 'text-white',
    actionText: 'Confirmar Asistencia',
    actionSecondary: 'Añadir a mi calendario'
  },
  {
    id: 'feed-3',
    title: 'Nueva nota en Programación de Software: Taller 1 Algoritmos',
    category: 'grades',
    author: 'Prof. Daniela Álvarez',
    timeAgo: 'Hace 2 días',
    gradeBadge: 'Nota: 4.8 / 5.0',
    content: 'Trabajo entregado con puntualidad. Destacada estructuración lógica del diagrama de flujo, claridad en la asignación de variables y pruebas de escritorio completas.',
    icon: 'terminal',
    iconBg: 'bg-[#00394f]',
    iconColor: 'text-white',
    actionText: 'Ver retroalimentación docente'
  },
  {
    id: 'feed-4',
    title: 'Circular 014: Jornada pedagógica e institucional del próximo viernes',
    category: 'notices',
    author: 'Rectoría General',
    timeAgo: 'Hace 3 días',
    statusBadge: {
      text: 'Informativo',
      type: 'info'
    },
    content: 'Se informa a toda la comunidad educativa que el próximo viernes 15 de marzo los estudiantes no tendrán jornada presencial por motivo de capacitación docente en competencias STEM.',
    icon: 'campaign',
    iconBg: 'bg-[#dce9ff]',
    iconColor: 'text-[#00288e]',
    attachment: {
      name: 'Circular_014_2026.pdf',
      size: '142 KB'
    }
  }
];

export const INITIAL_CONTACTS: ChatContact[] = [
  {
    id: 'daniela',
    name: 'Prof. Daniela Álvarez',
    role: 'Tecnología e Informática / Programación',
    category: 'docentes',
    lastMessage: 'Claro doña Elena, he recibido el certificado médico...',
    time: '10:24 AM',
    avatar: ASSETS.teacherDaniela,
    online: true,
    statusText: 'En línea',
    unreadCount: 2,
    verified: true
  },
  {
    id: 'roberto',
    name: 'Lic. Roberto Gómez',
    role: 'Matemáticas y Cálculo (Dir. Grupo 11°B)',
    category: 'docentes',
    lastMessage: 'La reunión de seguimiento queda agendada para el jueves.',
    time: 'Ayer',
    initials: 'RG',
    online: true,
    statusText: 'En línea'
  },
  {
    id: 'marcela',
    name: 'Lic. Marcela Cadavid',
    role: 'Lengua Castellana y Literatura',
    category: 'docentes',
    lastMessage: 'Buenas tardes, envío las correcciones del ensayo final.',
    time: 'Lun',
    initials: 'MC',
    online: false,
    statusText: 'Desconectada'
  },
  {
    id: 'coordinacion',
    name: 'Coordinación I.E. Vallejuelos',
    role: 'Convivencia y Rectoría',
    category: 'coordinacion',
    lastMessage: 'Circular oficial sobre entrega de informes valorativos.',
    time: '12 Oct',
    initials: '🏛️',
    online: true,
    statusText: 'En reunión'
  },
  {
    id: 'psicologia',
    name: 'Psic. Claudia Roldán',
    role: 'Orientación Vocacional',
    category: 'orientacion',
    lastMessage: 'Resultados de la prueba Saber 11 y orientación profesional.',
    time: '05 Oct',
    initials: 'PO',
    online: false,
    statusText: 'Desconectada'
  }
];

export const INITIAL_CHAT_MESSAGES: ChatMessage[] = [
  {
    id: 'msg-1',
    sender: 'parent',
    senderName: 'Elena Jiménez',
    time: '09:45 AM',
    text: 'Buenos días, Profesora Daniela. Espero se encuentre muy bien. Le escribo para comentarle que Miguel Ángel no pudo asistir hoy a la primera hora debido a una cita médica odontológica prioritaria.'
  },
  {
    id: 'msg-2',
    sender: 'parent',
    senderName: 'Elena Jiménez',
    time: '09:47 AM',
    text: 'Adjunto la incapacidad médica oficial emitida por la EPS para justificar su inasistencia al taller de algoritmos.',
    attachment: {
      name: 'Incapacidad_Medica_Jimenez_Miguel.pdf',
      size: '1.2 MB',
      type: 'application/pdf'
    }
  },
  {
    id: 'msg-3',
    sender: 'teacher',
    senderName: 'Prof. Daniela Álvarez',
    time: '10:15 AM',
    text: 'Buenos días, estimada Sra. Elena. Muchas gracias por avisar oportunamente. He revisado el documento adjunto y queda debidamente radicada la justificación médica en el sistema de asistencia institucional.'
  },
  {
    id: 'msg-4',
    sender: 'teacher',
    senderName: 'Prof. Daniela Álvarez',
    time: '10:24 AM',
    text: 'Miguel Ángel tiene plazo habilitado hasta este viernes a las 11:59 PM para subir la entrega del Taller 1 de Lógica de Programación a través del portal de Tareas sin penalización de nota. Le comparto un gran saludo.'
  }
];

export const INITIAL_MESSAGE_THREADS: MessageThread[] = [
  {
    id: 'msg-1',
    senderName: 'Lic. Roberto Gómez',
    senderRole: 'Docente de Matemáticas & Dir. Grupo 11°B',
    senderAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    subject: 'Citación a entrega oficial de boletines - Período 1',
    preview: 'Estimada Elena, cordial saludo. Me comunico para recordarle la citación a la entrega oficial de boletines...',
    time: '10:45 AM',
    unread: true,
    category: 'citaciones',
    messages: [
      {
        id: 'm1',
        sender: 'Lic. Roberto Gómez',
        time: '10:45 AM',
        isSelf: false,
        text: 'Estimada doña Elena, cordial saludo. Me comunico para recordarle la citación presencial obligatoria para la entrega oficial de boletines del primer período académico. La jornada se llevará a cabo este viernes a partir de las 8:00 AM en el aula de 11°B.',
        attachment: {
          name: 'Citacion_Boletines_PrimerPeriodo_2026.pdf',
          size: '1.2 MB'
        }
      },
      {
        id: 'm2',
        sender: 'Elena Jiménez (Acudiente)',
        time: '11:02 AM',
        isSelf: true,
        text: 'Buenos días profesor Roberto. Muchas gracias por la información, estaré presente a las 8:00 AM puntual. ¿Debo llevar algún documento adicional para la firma de la planilla?'
      },
      {
        id: 'm3',
        sender: 'Lic. Roberto Gómez',
        time: '11:15 AM',
        isSelf: false,
        text: 'Únicamente su documento de identidad original para el registro de firmas. ¡Muchas gracias por su compromiso con el proceso formativo de Miguel Ángel!'
      }
    ]
  },
  {
    id: 'msg-2',
    senderName: 'Prof. Daniela Álvarez',
    senderRole: 'Docente de Tecnología y Programación',
    senderAvatar: ASSETS.teacherDaniela,
    subject: 'Retroalimentación y felicitación: Taller 1 Algoritmos',
    preview: 'Apreciada madre de familia, le comparto que Miguel Ángel obtuvo una calificación de 4.8...',
    time: 'Ayer',
    unread: true,
    category: 'profesores',
    messages: [
      {
        id: 'm2-1',
        sender: 'Prof. Daniela Álvarez',
        time: 'Ayer, 04:30 PM',
        isSelf: false,
        text: 'Apreciada doña Elena, le comparto con agrado que Miguel Ángel obtuvo una calificación sobresaliente (4.8 / 5.0) en el Taller 1 de Lógica de Programación. Su capacidad de análisis y estructuración de algoritmos es destacable.'
      }
    ]
  },
  {
    id: 'msg-3',
    senderName: 'Rectoría & Coordinación Académica',
    senderRole: 'I.E. Vallejuelos • Comunicados Institucionales',
    subject: 'Circular 014: Jornada Pedagógica y Cierre del Período',
    preview: 'Se informa a la comunidad educativa que el próximo viernes habrá jornada de actualización docente...',
    time: '12 Feb',
    unread: false,
    category: 'circulares',
    messages: [
      {
        id: 'm3-1',
        sender: 'Rectoría I.E. Vallejuelos',
        time: '12 Feb, 09:00 AM',
        isSelf: false,
        text: 'Se informa a toda la comunidad de padres de familia que el próximo viernes los estudiantes tendrán salida a las 10:30 AM debido a la jornada pedagógica institucional de evaluación curricular.',
        attachment: {
          name: 'Circular_014_Jornada_Pedagogica.pdf',
          size: '340 KB'
        }
      }
    ]
  },
  {
    id: 'msg-4',
    senderName: 'Lic. Claudia Restrepo',
    senderRole: 'Coordinadora de Proyectos de Grado',
    subject: 'Seguimiento Proyecto de Grado 11°B',
    preview: 'Recordatorio para la entrega del primer capítulo metodológico...',
    time: '08 Feb',
    unread: false,
    category: 'profesores',
    messages: [
      {
        id: 'm4-1',
        sender: 'Lic. Claudia Restrepo',
        time: '08 Feb, 02:15 PM',
        isSelf: false,
        text: 'Cordial saludo familia Jiménez. Les recordamos que la sustentación del anteproyecto de grado para el grupo 11°B iniciará en el mes de abril. Favor verificar los avances en la carpeta compartida.'
      }
    ]
  }
];

