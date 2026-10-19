import { Subject, UpcomingAssignment, StudentGradeRecord, NewsFeedItem, ChatContact, ChatMessage, MessageThread } from '../types';
import logoTransparent from '../assets/logo_transparent.png';

export const ASSETS = {
  logo: logoTransparent || '/logo_transparent.png',
  logoOriginal: logoTransparent || '/logo_transparent.png',
  logoAlt: logoTransparent || '/logo_transparent.png',
  logoSquare: logoTransparent || '/logo_transparent.png',
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

export const INITIAL_UPCOMING_ASSIGNMENTS: UpcomingAssignment[] = [];


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

export const INITIAL_NEWS_FEED: NewsFeedItem[] = [];


export const INITIAL_CONTACTS: ChatContact[] = [];


export const INITIAL_CHAT_MESSAGES: ChatMessage[] = [];
export const INITIAL_MESSAGE_THREADS: MessageThread[] = [];


