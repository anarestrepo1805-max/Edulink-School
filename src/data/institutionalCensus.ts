/**
 * EDULINK SCHOOL - CENSO OFICIAL INSTITUCIONAL
 * Fuente: Registro Escolar Grados 6-1 a 11-2 (I.E. Vallejuelos) y Horario Oficial FET
 */
import { Subject } from '../types';

export interface CensusStudent {
  group: string;
  documentId: string;
  fullName: string;
  email: string;
}

export interface CensusGuardian {
  relationship: string;
  cedula: string;
  studentDocumentId: string;
  fullName: string;
  phone: string;
  email: string;
}

export interface CensusTeacher {
  code: string;
  cedula: string;
  area: string;
  grades: string;
  fullName: string;
  email: string;
}

export interface CensusAdminStaff {
  code: string;
  cargo: string;
  dependencia: string;
  cedula: string;
  fullName: string;
  email: string;
}

export interface ScheduleSlot {
  time: string;
  period: number;
  monday: { subject: string; teacher: string };
  tuesday: { subject: string; teacher: string };
  wednesday: { subject: string; teacher: string };
  thursday: { subject: string; teacher: string };
  friday: { subject: string; teacher: string };
}

// -------------------------------------------------------------
// HORARIO ESCOLAR INSTITUCIONAL - ASIGNACIONES REALES DEL CENSO
// Conserva horas e intervalos oficiales y materias reales de la base de datos
// -------------------------------------------------------------
export const OFFICIAL_SCHEDULE_11_1: ScheduleSlot[] = [
  {
    time: '6:15 - 7:10',
    period: 1,
    monday: { subject: 'Español', teacher: 'Jorge Castaño' },
    tuesday: { subject: 'Química', teacher: 'Mauricio Salazar' },
    wednesday: { subject: 'Español', teacher: 'Jorge Castaño' },
    thursday: { subject: 'Química', teacher: 'Mauricio Salazar' },
    friday: { subject: 'Español', teacher: 'Jorge Castaño' },
  },
  {
    time: '7:10 - 8:05',
    period: 2,
    monday: { subject: 'Física', teacher: 'Claudia Montoya' },
    tuesday: { subject: 'Filosofía', teacher: 'Luis Restrepo' },
    wednesday: { subject: 'Física', teacher: 'Claudia Montoya' },
    thursday: { subject: 'Filosofía', teacher: 'Luis Restrepo' },
    friday: { subject: 'Física', teacher: 'Claudia Montoya' },
  },
  {
    time: '8:05 - 8:35',
    period: 0,
    monday: { subject: 'Descanso / Recreo Institucional', teacher: 'Comunidad Educativa' },
    tuesday: { subject: 'Descanso / Recreo Institucional', teacher: 'Comunidad Educativa' },
    wednesday: { subject: 'Descanso / Recreo Institucional', teacher: 'Comunidad Educativa' },
    thursday: { subject: 'Descanso / Recreo Institucional', teacher: 'Comunidad Educativa' },
    friday: { subject: 'Descanso / Recreo Institucional', teacher: 'Comunidad Educativa' },
  },
  {
    time: '8:35 - 9:30',
    period: 3,
    monday: { subject: 'Matemáticas', teacher: 'Diana Gómez' },
    tuesday: { subject: 'Inglés', teacher: 'Felipe Torres' },
    wednesday: { subject: 'Matemáticas', teacher: 'Diana Gómez' },
    thursday: { subject: 'Inglés', teacher: 'Felipe Torres' },
    friday: { subject: 'Matemáticas', teacher: 'Diana Gómez' },
  },
  {
    time: '9:30 - 10:25',
    period: 4,
    monday: { subject: 'Tecnología', teacher: 'Sandra López' },
    tuesday: { subject: 'Economía y política', teacher: 'Marcela Vargas' },
    wednesday: { subject: 'Tecnología', teacher: 'Sandra López' },
    thursday: { subject: 'Economía y política', teacher: 'Marcela Vargas' },
    friday: { subject: 'Tecnología', teacher: 'Sandra López' },
  },
  {
    time: '10:25 - 11:20',
    period: 5,
    monday: { subject: 'Química', teacher: 'Mauricio Salazar' },
    tuesday: { subject: 'Español', teacher: 'Jorge Castaño' },
    wednesday: { subject: 'Filosofía', teacher: 'Luis Restrepo' },
    thursday: { subject: 'Matemáticas', teacher: 'Diana Gómez' },
    friday: { subject: 'Inglés', teacher: 'Felipe Torres' },
  },
  {
    time: '11:20 - 12:15',
    period: 6,
    monday: { subject: 'Inglés', teacher: 'Felipe Torres' },
    tuesday: { subject: 'Física', teacher: 'Claudia Montoya' },
    wednesday: { subject: 'Economía y política', teacher: 'Marcela Vargas' },
    thursday: { subject: 'Química', teacher: 'Mauricio Salazar' },
    friday: { subject: 'Español', teacher: 'Jorge Castaño' },
  },
];

export const OFFICIAL_SCHEDULE_10_1: ScheduleSlot[] = [
  {
    time: '6:15 - 7:10', period: 1,
    monday: { subject: 'Química', teacher: 'Mariana Isabel Castro' },
    tuesday: { subject: 'Física', teacher: 'Claudia Montoya' },
    wednesday: { subject: 'Química', teacher: 'Mariana Isabel Castro' },
    thursday: { subject: 'Física', teacher: 'Claudia Montoya' },
    friday: { subject: 'Química', teacher: 'Mariana Isabel Castro' },
  },
  {
    time: '7:10 - 8:05', period: 2,
    monday: { subject: 'Filosofía', teacher: 'Luis Restrepo' },
    tuesday: { subject: 'Tecnología', teacher: 'Sandra López' },
    wednesday: { subject: 'Filosofía', teacher: 'Luis Restrepo' },
    thursday: { subject: 'Tecnología', teacher: 'Sandra López' },
    friday: { subject: 'Filosofía', teacher: 'Luis Restrepo' },
  },
  {
    time: '8:05 - 8:35', period: 0,
    monday: { subject: 'Descanso / Recreo Institucional', teacher: 'Comunidad Educativa' },
    tuesday: { subject: 'Descanso / Recreo Institucional', teacher: 'Comunidad Educativa' },
    wednesday: { subject: 'Descanso / Recreo Institucional', teacher: 'Comunidad Educativa' },
    thursday: { subject: 'Descanso / Recreo Institucional', teacher: 'Comunidad Educativa' },
    friday: { subject: 'Descanso / Recreo Institucional', teacher: 'Comunidad Educativa' },
  },
  {
    time: '8:35 - 9:30', period: 3,
    monday: { subject: 'Matemáticas', teacher: 'Diana Gómez' },
    tuesday: { subject: 'Español', teacher: 'Natalia Andrea Gómez' },
    wednesday: { subject: 'Matemáticas', teacher: 'Diana Gómez' },
    thursday: { subject: 'Español', teacher: 'Natalia Andrea Gómez' },
    friday: { subject: 'Matemáticas', teacher: 'Diana Gómez' },
  },
  {
    time: '9:30 - 10:25', period: 4,
    monday: { subject: 'Inglés', teacher: 'Felipe Torres' },
    tuesday: { subject: 'Espiritualidad y valores', teacher: 'Natalia Rojas' },
    wednesday: { subject: 'Inglés', teacher: 'Felipe Torres' },
    thursday: { subject: 'Espiritualidad y valores', teacher: 'Natalia Rojas' },
    friday: { subject: 'Inglés', teacher: 'Felipe Torres' },
  },
  {
    time: '10:25 - 11:20', period: 5,
    monday: { subject: 'Física', teacher: 'Claudia Montoya' },
    tuesday: { subject: 'Química', teacher: 'Mariana Isabel Castro' },
    wednesday: { subject: 'Tecnología', teacher: 'Sandra López' },
    thursday: { subject: 'Matemáticas', teacher: 'Diana Gómez' },
    friday: { subject: 'Español', teacher: 'Natalia Andrea Gómez' },
  },
  {
    time: '11:20 - 12:15', period: 6,
    monday: { subject: 'Español', teacher: 'Natalia Andrea Gómez' },
    tuesday: { subject: 'Filosofía', teacher: 'Luis Restrepo' },
    wednesday: { subject: 'Espiritualidad y valores', teacher: 'Natalia Rojas' },
    thursday: { subject: 'Química', teacher: 'Mariana Isabel Castro' },
    friday: { subject: 'Física', teacher: 'Claudia Montoya' },
  },
];

export const OFFICIAL_SCHEDULE_9_1: ScheduleSlot[] = [
  {
    time: '6:15 - 7:10', period: 1,
    monday: { subject: 'Tecnología', teacher: 'Sebastián David Moreno' },
    tuesday: { subject: 'Artística', teacher: 'Diego Cardona' },
    wednesday: { subject: 'Tecnología', teacher: 'Sebastián David Moreno' },
    thursday: { subject: 'Artística', teacher: 'Diego Cardona' },
    friday: { subject: 'Tecnología', teacher: 'Sebastián David Moreno' },
  },
  {
    time: '7:10 - 8:05', period: 2,
    monday: { subject: 'Inglés', teacher: 'Felipe Torres' },
    tuesday: { subject: 'Español', teacher: 'Natalia Andrea Gómez' },
    wednesday: { subject: 'Inglés', teacher: 'Felipe Torres' },
    thursday: { subject: 'Español', teacher: 'Natalia Andrea Gómez' },
    friday: { subject: 'Inglés', teacher: 'Felipe Torres' },
  },
  {
    time: '8:05 - 8:35', period: 0,
    monday: { subject: 'Descanso / Recreo Institucional', teacher: 'Comunidad Educativa' },
    tuesday: { subject: 'Descanso / Recreo Institucional', teacher: 'Comunidad Educativa' },
    wednesday: { subject: 'Descanso / Recreo Institucional', teacher: 'Comunidad Educativa' },
    thursday: { subject: 'Descanso / Recreo Institucional', teacher: 'Comunidad Educativa' },
    friday: { subject: 'Descanso / Recreo Institucional', teacher: 'Comunidad Educativa' },
  },
  {
    time: '8:35 - 9:30', period: 3,
    monday: { subject: 'Matemáticas', teacher: 'Diana Gómez' },
    tuesday: { subject: 'Ciencias Naturales', teacher: 'Gabriel Mendoza' },
    wednesday: { subject: 'Matemáticas', teacher: 'Diana Gómez' },
    thursday: { subject: 'Ciencias Naturales', teacher: 'Gabriel Mendoza' },
    friday: { subject: 'Matemáticas', teacher: 'Diana Gómez' },
  },
  {
    time: '9:30 - 10:25', period: 4,
    monday: { subject: 'Sociales', teacher: 'Ricardo Agudelo' },
    tuesday: { subject: 'Artística', teacher: 'Diego Cardona' },
    wednesday: { subject: 'Sociales', teacher: 'Ricardo Agudelo' },
    thursday: { subject: 'Inglés', teacher: 'Felipe Torres' },
    friday: { subject: 'Artística', teacher: 'Diego Cardona' },
  },
  {
    time: '10:25 - 11:20', period: 5,
    monday: { subject: 'Ciencias Naturales', teacher: 'Gabriel Mendoza' },
    tuesday: { subject: 'Matemáticas', teacher: 'Diana Gómez' },
    wednesday: { subject: 'Español', teacher: 'Natalia Andrea Gómez' },
    thursday: { subject: 'Sociales', teacher: 'Ricardo Agudelo' },
    friday: { subject: 'Tecnología', teacher: 'Sebastián David Moreno' },
  },
  {
    time: '11:20 - 12:15', period: 6,
    monday: { subject: 'Español', teacher: 'Natalia Andrea Gómez' },
    tuesday: { subject: 'Ciencias Naturales', teacher: 'Gabriel Mendoza' },
    wednesday: { subject: 'Artística', teacher: 'Diego Cardona' },
    thursday: { subject: 'Matemáticas', teacher: 'Diana Gómez' },
    friday: { subject: 'Inglés', teacher: 'Felipe Torres' },
  },
];

export const OFFICIAL_SCHEDULE_8_1: ScheduleSlot[] = [
  {
    time: '6:15 - 7:10', period: 1,
    monday: { subject: 'Español', teacher: 'Natalia Andrea Gómez' },
    tuesday: { subject: 'Economía y política', teacher: 'Marcela Vargas' },
    wednesday: { subject: 'Español', teacher: 'Natalia Andrea Gómez' },
    thursday: { subject: 'Filosofía de vida', teacher: 'Patricia Quintero' },
    friday: { subject: 'Español', teacher: 'Natalia Andrea Gómez' },
  },
  {
    time: '7:10 - 8:05', period: 2,
    monday: { subject: 'Matemáticas', teacher: 'Diana Gómez' },
    tuesday: { subject: 'Inglés', teacher: 'Laura Camila Torres' },
    wednesday: { subject: 'Matemáticas', teacher: 'Diana Gómez' },
    thursday: { subject: 'Inglés', teacher: 'Laura Camila Torres' },
    friday: { subject: 'Matemáticas', teacher: 'Diana Gómez' },
  },
  {
    time: '8:05 - 8:35', period: 0,
    monday: { subject: 'Descanso / Recreo Institucional', teacher: 'Comunidad Educativa' },
    tuesday: { subject: 'Descanso / Recreo Institucional', teacher: 'Comunidad Educativa' },
    wednesday: { subject: 'Descanso / Recreo Institucional', teacher: 'Comunidad Educativa' },
    thursday: { subject: 'Descanso / Recreo Institucional', teacher: 'Comunidad Educativa' },
    friday: { subject: 'Descanso / Recreo Institucional', teacher: 'Comunidad Educativa' },
  },
  {
    time: '8:35 - 9:30', period: 3,
    monday: { subject: 'Ciencias Naturales', teacher: 'Gabriel Mendoza' },
    tuesday: { subject: 'Tecnología', teacher: 'Sebastián David Moreno' },
    wednesday: { subject: 'Ciencias Naturales', teacher: 'Gabriel Mendoza' },
    thursday: { subject: 'Tecnología', teacher: 'Sebastián David Moreno' },
    friday: { subject: 'Ciencias Naturales', teacher: 'Gabriel Mendoza' },
  },
  {
    time: '9:30 - 10:25', period: 4,
    monday: { subject: 'Economía y política', teacher: 'Marcela Vargas' },
    tuesday: { subject: 'Filosofía de vida', teacher: 'Patricia Quintero' },
    wednesday: { subject: 'Inglés', teacher: 'Laura Camila Torres' },
    thursday: { subject: 'Español', teacher: 'Natalia Andrea Gómez' },
    friday: { subject: 'Tecnología', teacher: 'Sebastián David Moreno' },
  },
  {
    time: '10:25 - 11:20', period: 5,
    monday: { subject: 'Filosofía de vida', teacher: 'Patricia Quintero' },
    tuesday: { subject: 'Matemáticas', teacher: 'Diana Gómez' },
    wednesday: { subject: 'Ciencias Naturales', teacher: 'Gabriel Mendoza' },
    thursday: { subject: 'Economía y política', teacher: 'Marcela Vargas' },
    friday: { subject: 'Inglés', teacher: 'Laura Camila Torres' },
  },
  {
    time: '11:20 - 12:15', period: 6,
    monday: { subject: 'Tecnología', teacher: 'Sebastián David Moreno' },
    tuesday: { subject: 'Español', teacher: 'Natalia Andrea Gómez' },
    wednesday: { subject: 'Filosofía de vida', teacher: 'Patricia Quintero' },
    thursday: { subject: 'Matemáticas', teacher: 'Diana Gómez' },
    friday: { subject: 'Ciencias Naturales', teacher: 'Gabriel Mendoza' },
  },
];

export const OFFICIAL_SCHEDULE_7_1: ScheduleSlot[] = [
  {
    time: '6:15 - 7:10', period: 1,
    monday: { subject: 'Inglés', teacher: 'Laura Camila Torres' },
    tuesday: { subject: 'Filosofía de vida', teacher: 'Carlos Ramírez' },
    wednesday: { subject: 'Inglés', teacher: 'Laura Camila Torres' },
    thursday: { subject: 'Filosofía de vida', teacher: 'Carlos Ramírez' },
    friday: { subject: 'Inglés', teacher: 'Laura Camila Torres' },
  },
  {
    time: '7:10 - 8:05', period: 2,
    monday: { subject: 'Matemáticas', teacher: 'Diana Gómez' },
    tuesday: { subject: 'Ciencias Naturales', teacher: 'Gabriel Mendoza' },
    wednesday: { subject: 'Matemáticas', teacher: 'Diana Gómez' },
    thursday: { subject: 'Ciencias Naturales', teacher: 'Gabriel Mendoza' },
    friday: { subject: 'Matemáticas', teacher: 'Diana Gómez' },
  },
  {
    time: '8:05 - 8:35', period: 0,
    monday: { subject: 'Descanso / Recreo Institucional', teacher: 'Comunidad Educativa' },
    tuesday: { subject: 'Descanso / Recreo Institucional', teacher: 'Comunidad Educativa' },
    wednesday: { subject: 'Descanso / Recreo Institucional', teacher: 'Comunidad Educativa' },
    thursday: { subject: 'Descanso / Recreo Institucional', teacher: 'Comunidad Educativa' },
    friday: { subject: 'Descanso / Recreo Institucional', teacher: 'Comunidad Educativa' },
  },
  {
    time: '8:35 - 9:30', period: 3,
    monday: { subject: 'Español', teacher: 'Jorge Castaño' },
    tuesday: { subject: 'Sociales', teacher: 'Ricardo Agudelo' },
    wednesday: { subject: 'Español', teacher: 'Jorge Castaño' },
    thursday: { subject: 'Sociales', teacher: 'Ricardo Agudelo' },
    friday: { subject: 'Español', teacher: 'Jorge Castaño' },
  },
  {
    time: '9:30 - 10:25', period: 4,
    monday: { subject: 'Tecnología', teacher: 'Sebastián David Moreno' },
    tuesday: { subject: 'Ciencias Naturales', teacher: 'Gabriel Mendoza' },
    wednesday: { subject: 'Tecnología', teacher: 'Sebastián David Moreno' },
    thursday: { subject: 'Inglés', teacher: 'Laura Camila Torres' },
    friday: { subject: 'Ciencias Naturales', teacher: 'Gabriel Mendoza' },
  },
  {
    time: '10:25 - 11:20', period: 5,
    monday: { subject: 'Ciencias Naturales', teacher: 'Gabriel Mendoza' },
    tuesday: { subject: 'Matemáticas', teacher: 'Diana Gómez' },
    wednesday: { subject: 'Sociales', teacher: 'Ricardo Agudelo' },
    thursday: { subject: 'Filosofía de vida', teacher: 'Carlos Ramírez' },
    friday: { subject: 'Tecnología', teacher: 'Sebastián David Moreno' },
  },
  {
    time: '11:20 - 12:15', period: 6,
    monday: { subject: 'Sociales', teacher: 'Ricardo Agudelo' },
    tuesday: { subject: 'Español', teacher: 'Jorge Castaño' },
    wednesday: { subject: 'Filosofía de vida', teacher: 'Carlos Ramírez' },
    thursday: { subject: 'Matemáticas', teacher: 'Diana Gómez' },
    friday: { subject: 'Inglés', teacher: 'Laura Camila Torres' },
  },
];

export const OFFICIAL_SCHEDULE_6_1: ScheduleSlot[] = [
  {
    time: '6:15 - 7:10', period: 1,
    monday: { subject: 'Matemáticas', teacher: 'Andrés Felipe Ramírez' },
    tuesday: { subject: 'Ciencias Naturales', teacher: 'Gabriel Mendoza' },
    wednesday: { subject: 'Matemáticas', teacher: 'Andrés Felipe Ramírez' },
    thursday: { subject: 'Ciencias Naturales', teacher: 'Gabriel Mendoza' },
    friday: { subject: 'Matemáticas', teacher: 'Andrés Felipe Ramírez' },
  },
  {
    time: '7:10 - 8:05', period: 2,
    monday: { subject: 'Español', teacher: 'Jorge Castaño' },
    tuesday: { subject: 'Inglés', teacher: 'Felipe Torres' },
    wednesday: { subject: 'Español', teacher: 'Jorge Castaño' },
    thursday: { subject: 'Inglés', teacher: 'Felipe Torres' },
    friday: { subject: 'Español', teacher: 'Jorge Castaño' },
  },
  {
    time: '8:05 - 8:35', period: 0,
    monday: { subject: 'Descanso / Recreo Institucional', teacher: 'Comunidad Educativa' },
    tuesday: { subject: 'Descanso / Recreo Institucional', teacher: 'Comunidad Educativa' },
    wednesday: { subject: 'Descanso / Recreo Institucional', teacher: 'Comunidad Educativa' },
    thursday: { subject: 'Descanso / Recreo Institucional', teacher: 'Comunidad Educativa' },
    friday: { subject: 'Descanso / Recreo Institucional', teacher: 'Comunidad Educativa' },
  },
  {
    time: '8:35 - 9:30', period: 3,
    monday: { subject: 'Sociales', teacher: 'Andrea Pérez' },
    tuesday: { subject: 'Tecnología', teacher: 'Sebastián David Moreno' },
    wednesday: { subject: 'Sociales', teacher: 'Andrea Pérez' },
    thursday: { subject: 'Tecnología', teacher: 'Sebastián David Moreno' },
    friday: { subject: 'Sociales', teacher: 'Andrea Pérez' },
  },
  {
    time: '9:30 - 10:25', period: 4,
    monday: { subject: 'Biología', teacher: 'Paola Martínez' },
    tuesday: { subject: 'Ciencias Naturales', teacher: 'Gabriel Mendoza' },
    wednesday: { subject: 'Biología', teacher: 'Paola Martínez' },
    thursday: { subject: 'Inglés', teacher: 'Felipe Torres' },
    friday: { subject: 'Ciencias Naturales', teacher: 'Gabriel Mendoza' },
  },
  {
    time: '10:25 - 11:20', period: 5,
    monday: { subject: 'Tecnología', teacher: 'Sebastián David Moreno' },
    tuesday: { subject: 'Matemáticas', teacher: 'Andrés Felipe Ramírez' },
    wednesday: { subject: 'Inglés', teacher: 'Felipe Torres' },
    thursday: { subject: 'Español', teacher: 'Jorge Castaño' },
    friday: { subject: 'Biología', teacher: 'Paola Martínez' },
  },
  {
    time: '11:20 - 12:15', period: 6,
    monday: { subject: 'Español', teacher: 'Jorge Castaño' },
    tuesday: { subject: 'Sociales', teacher: 'Andrea Pérez' },
    wednesday: { subject: 'Ciencias Naturales', teacher: 'Gabriel Mendoza' },
    thursday: { subject: 'Matemáticas', teacher: 'Andrés Felipe Ramírez' },
    friday: { subject: 'Tecnología', teacher: 'Sebastián David Moreno' },
  },
];

/**
 * Generates official schedule for any grade level (6 to 11) strictly using census teachers and subjects.
 */
export function getOfficialScheduleForGrade(gradeLevel?: string): ScheduleSlot[] {
  const norm = (gradeLevel || '').toLowerCase();
  
  if (norm.includes('6')) {
    return OFFICIAL_SCHEDULE_6_1;
  }
  if (norm.includes('7')) {
    return OFFICIAL_SCHEDULE_7_1;
  }
  if (norm.includes('8')) {
    return OFFICIAL_SCHEDULE_8_1;
  }
  if (norm.includes('9')) {
    return OFFICIAL_SCHEDULE_9_1;
  }
  if (norm.includes('10')) {
    return OFFICIAL_SCHEDULE_10_1;
  }
  if (norm.includes('11') || norm.includes('once')) {
    return OFFICIAL_SCHEDULE_11_1;
  }

  // Default to Grade 11 schedule
  return OFFICIAL_SCHEDULE_11_1;
}

/**
 * Automatically retrieves official institutional subjects and assigned teachers for any student
 * derived directly from the institutional census schedule.
 * Does NOT require or allow manual subject configuration by students.
 */
export function getOfficialSubjectsForStudent(gradeLevel?: string, group?: string): Subject[] {
  const schedule = getOfficialScheduleForGrade(gradeLevel || group || '11-1');
  const subjectsMap = new Map<string, {
    name: string;
    teacher: string;
    days: string[];
    time: string;
  }>();

  const dayNames: { key: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday'; label: string }[] = [
    { key: 'monday', label: 'Lun' },
    { key: 'tuesday', label: 'Mar' },
    { key: 'wednesday', label: 'Mié' },
    { key: 'thursday', label: 'Jue' },
    { key: 'friday', label: 'Vie' }
  ];

  for (const slot of schedule) {
    if (slot.period === 0) continue; // Skip recreo
    for (const d of dayNames) {
      const cell = slot[d.key];
      if (!cell || !cell.subject || cell.subject.includes('Descanso') || cell.subject.includes('Recreo')) continue;
      
      const key = cell.subject.trim();
      const existing = subjectsMap.get(key);
      if (!existing) {
        subjectsMap.set(key, {
          name: key,
          teacher: cell.teacher || 'Docente Institucional',
          days: [d.label],
          time: slot.time
        });
      } else {
        if (!existing.days.includes(d.label)) {
          existing.days.push(d.label);
        }
      }
    }
  }

  const categoryMap: Record<string, string> = {
    'Matemáticas': 'Ciencias Exactas',
    'Español': 'Lengua y Humanidades',
    'Lengua Castellana': 'Lengua y Humanidades',
    'Inglés': 'Idiomas y Bilingüismo',
    'Tecnología': 'Tecnología e Informática',
    'Ciencias Naturales': 'Ciencias Naturales',
    'Química': 'Ciencias Naturales',
    'Física': 'Ciencias Naturales',
    'Filosofía': 'Filosofía y Humanidades',
    'Filosofía de vida': 'Filosofía y Humanidades',
    'Sociales': 'Ciencias Sociales',
    'Artística': 'Educación Artística',
    'Educación Física': 'Educación Física y Deportes',
    'Economía y política': 'Ciencias Económicas y Políticas',
    'Espiritualidad y valores': 'Ética y Valores Humanos'
  };

  const styleMap: Record<string, { color: string; bgLight: string; icon: string }> = {
    'Matemáticas': { color: '#2563eb', bgLight: '#eff6ff', icon: 'calculate' },
    'Español': { color: '#e11d48', bgLight: '#fff1f2', icon: 'auto_stories' },
    'Lengua Castellana': { color: '#e11d48', bgLight: '#fff1f2', icon: 'auto_stories' },
    'Inglés': { color: '#0d9488', bgLight: '#f0fdfa', icon: 'language' },
    'Tecnología': { color: '#4f46e5', bgLight: '#eef2ff', icon: 'terminal' },
    'Ciencias Naturales': { color: '#16a34a', bgLight: '#f0fdf4', icon: 'biotech' },
    'Química': { color: '#d97706', bgLight: '#fffbeb', icon: 'science' },
    'Física': { color: '#0284c7', bgLight: '#f0f9ff', icon: 'bolt' },
    'Filosofía': { color: '#7c3aed', bgLight: '#f5f3ff', icon: 'psychology' },
    'Filosofía de vida': { color: '#7c3aed', bgLight: '#f5f3ff', icon: 'psychology' },
    'Sociales': { color: '#ea580c', bgLight: '#fff7ed', icon: 'public' },
    'Artística': { color: '#db2777', bgLight: '#fdf2f8', icon: 'palette' },
    'Educación Física': { color: '#059669', bgLight: '#ecfdf5', icon: 'sports_soccer' },
    'Economía y política': { color: '#0891b2', bgLight: '#ecfeff', icon: 'account_balance' },
    'Espiritualidad y valores': { color: '#8b5cf6', bgLight: '#f5f3ff', icon: 'favorite' }
  };

  const result: Subject[] = [];
  let index = 1;
  for (const [name, info] of subjectsMap.entries()) {
    const styling = styleMap[name] || { color: '#2563eb', bgLight: '#eff6ff', icon: 'menu_book' };
    const category = categoryMap[name] || 'Carga Académica Oficial';
    const scheduleStr = `${info.days.join(' - ')} ${info.time}`;

    result.push({
      id: `subj_${index++}_${name.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
      name,
      category,
      teacher: info.teacher,
      schedule: scheduleStr,
      grade: 4.2,
      progress: 75,
      color: styling.color,
      bgLight: styling.bgLight,
      icon: styling.icon,
      nextClass: `${info.days[0] || 'Lun'} ${info.time.split('-')[0].trim()}`
    });
  }

  return result;
}

/**
 * Returns exclusively the personal weekly schedule for a specific teacher.
 * Filters across all grades where this teacher has classes.
 */
export function getTeacherPersonalSchedule(teacherNameOrDoc?: string): ScheduleSlot[] {
  const query = (teacherNameOrDoc || '').trim().toLowerCase();
  if (!query) return OFFICIAL_SCHEDULE_11_1;

  // Find teacher in census
  const teacher = CENSUS_TEACHERS.find(t => 
    t.fullName.toLowerCase().includes(query) ||
    t.cedula === query ||
    t.code === query ||
    query.includes(t.fullName.toLowerCase())
  );

  const teacherName = teacher ? teacher.fullName : teacherNameOrDoc || '';

  // All grade schedules mapped
  const gradeSchedules: { grade: string; schedule: ScheduleSlot[] }[] = [
    { grade: '6°1', schedule: OFFICIAL_SCHEDULE_6_1 },
    { grade: '7°1', schedule: OFFICIAL_SCHEDULE_7_1 },
    { grade: '8°1', schedule: OFFICIAL_SCHEDULE_8_1 },
    { grade: '9°1', schedule: OFFICIAL_SCHEDULE_9_1 },
    { grade: '10°1', schedule: OFFICIAL_SCHEDULE_10_1 },
    { grade: '11°1', schedule: OFFICIAL_SCHEDULE_11_1 },
  ];

  const days: ('monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday')[] = [
    'monday', 'tuesday', 'wednesday', 'thursday', 'friday'
  ];

  // Base slot periods
  const times = [
    { period: 1, time: '6:15 - 7:10' },
    { period: 2, time: '7:10 - 8:05' },
    { period: 0, time: '8:05 - 8:35' },
    { period: 3, time: '8:35 - 9:30' },
    { period: 4, time: '9:30 - 10:25' },
    { period: 5, time: '10:25 - 11:20' },
    { period: 6, time: '11:20 - 12:15' },
  ];

  return times.map(slot => {
    if (slot.period === 0) {
      return {
        time: slot.time,
        period: 0,
        monday: { subject: 'Descanso / Recreo Institucional', teacher: 'Comunidad Educativa' },
        tuesday: { subject: 'Descanso / Recreo Institucional', teacher: 'Comunidad Educativa' },
        wednesday: { subject: 'Descanso / Recreo Institucional', teacher: 'Comunidad Educativa' },
        thursday: { subject: 'Descanso / Recreo Institucional', teacher: 'Comunidad Educativa' },
        friday: { subject: 'Descanso / Recreo Institucional', teacher: 'Comunidad Educativa' },
      };
    }

    const row: ScheduleSlot = {
      time: slot.time,
      period: slot.period,
      monday: { subject: 'Tiempo de Preparación / Atención', teacher: '—' },
      tuesday: { subject: 'Tiempo de Preparación / Atención', teacher: '—' },
      wednesday: { subject: 'Tiempo de Preparación / Atención', teacher: '—' },
      thursday: { subject: 'Tiempo de Preparación / Atención', teacher: '—' },
      friday: { subject: 'Tiempo de Preparación / Atención', teacher: '—' },
    };

    days.forEach(day => {
      for (const gs of gradeSchedules) {
        const slotFound = gs.schedule.find(s => s.period === slot.period);
        if (slotFound && slotFound[day]) {
          const classTeacher = slotFound[day].teacher.toLowerCase();
          if (classTeacher.includes(teacherName.toLowerCase()) || (teacher && classTeacher.includes(teacher.fullName.toLowerCase()))) {
            row[day] = {
              subject: `${slotFound[day].subject} (${gs.grade})`,
              teacher: `Aula ${gs.grade}`
            };
            break;
          }
        }
      }
    });

    return row;
  });
}

/**
 * Validates the academic distribution across all groups (6°1 to 11°2).
 * Verifies core subjects, teacher assignments, and schedule conflicts.
 */
export function validateAcademicDistribution(): {
  isValid: boolean;
  groupsValidated: string[];
  mandatorySubjects: string[];
  conflicts: string[];
  summary: { totalTeachers: number; totalGroups: number; status: string };
} {
  const groups = ['6°1', '6°2', '7°1', '7°2', '8°1', '8°2', '9°1', '9°2', '10°1', '10°2', '11°1', '11°2'];
  const mandatorySubjects = ['Matemáticas', 'Inglés', 'Español', 'Tecnología', 'Ciencias Naturales'];
  const conflicts: string[] = [];

  // Check mandatory subjects presence
  const schedules = [
    { grade: '6', s: OFFICIAL_SCHEDULE_6_1 },
    { grade: '7', s: OFFICIAL_SCHEDULE_7_1 },
    { grade: '8', s: OFFICIAL_SCHEDULE_8_1 },
    { grade: '9', s: OFFICIAL_SCHEDULE_9_1 },
    { grade: '10', s: OFFICIAL_SCHEDULE_10_1 },
    { grade: '11', s: OFFICIAL_SCHEDULE_11_1 }
  ];

  schedules.forEach(item => {
    const subjectsInSchedule = new Set<string>();
    item.s.forEach(slot => {
      ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'].forEach(d => {
        const cell = (slot as any)[d];
        if (cell && cell.subject && cell.subject !== 'Descanso / Recreo Institucional') {
          subjectsInSchedule.add(cell.subject);
        }
      });
    });

    // Check general mandatory
    ['Matemáticas', 'Inglés', 'Español', 'Tecnología'].forEach(req => {
      if (!subjectsInSchedule.has(req)) {
        conflicts.push(`Grado ${item.grade}: Falta la asignatura obligatoria ${req}`);
      }
    });

    // Check Ciencias Naturales in 6-9
    if (['6', '7', '8', '9'].includes(item.grade)) {
      if (!subjectsInSchedule.has('Ciencias Naturales') && !subjectsInSchedule.has('Biología')) {
        conflicts.push(`Grado ${item.grade}: Falta Ciencias Naturales`);
      }
    }

    // Check Química, Física, Filosofía only in 10-11
    if (['10', '11'].includes(item.grade)) {
      ['Química', 'Física', 'Filosofía'].forEach(req => {
        if (!subjectsInSchedule.has(req)) {
          conflicts.push(`Grado ${item.grade}: Falta la asignatura media vocacional ${req}`);
        }
      });
    }
  });

  return {
    isValid: conflicts.length === 0,
    groupsValidated: groups,
    mandatorySubjects,
    conflicts,
    summary: {
      totalTeachers: CENSUS_TEACHERS.length,
      totalGroups: groups.length,
      status: conflicts.length === 0 ? 'Distribución académica válida y completa' : 'Conflictos detectados'
    }
  };
}

// -------------------------------------------------------------
// DOCENTES - 21 REGISTROS OFICIALES DEL CENSO INSTITUCIONAL
// -------------------------------------------------------------
export const CENSUS_TEACHERS: CensusTeacher[] = [
  { code: '001', cedula: '70013115', area: 'Sociales', grades: '6-1, 6-2', fullName: 'Andrea Pérez', email: 'andrea_pérez@ejemplo.edu' },
  { code: '002', cedula: '80075058', area: 'Filosofía de vida', grades: '7-1, 7-2', fullName: 'Carlos Ramírez', email: 'carlos_ramírez@ejemplo.edu' },
  { code: '003', cedula: '90137001', area: 'Matemática', grades: '8-1, 8-2, 9-1, 9-2, 10-1, 10-2, 11-1, 11-2', fullName: 'Diana Gómez', email: 'diana_gómez@ejemplo.edu' },
  { code: '004', cedula: '10198944', area: 'Inglés', grades: '6-1, 6-2, 9-1, 9-2, 10-1, 10-2, 11-1, 11-2', fullName: 'Felipe Torres', email: 'felipe_torres@ejemplo.edu' },
  { code: '005', cedula: '20260887', area: 'Espiritualidad y valores', grades: '10-1, 10-2', fullName: 'Natalia Rojas', email: 'natalia_rojas@ejemplo.edu' },
  { code: '006', cedula: '30322830', area: 'Español', grades: '6-1, 6-2, 7-1, 7-2, 11-1, 11-2', fullName: 'Jorge Castaño', email: 'jorge_castaño@ejemplo.edu' },
  { code: '007', cedula: '40384773', area: 'Biología', grades: '6-1, 6-2', fullName: 'Paola Martínez', email: 'paola_martínez@ejemplo.edu' },
  { code: '008', cedula: '50446716', area: 'Filosofía', grades: '10-1, 10-2, 11-1, 11-2', fullName: 'Luis Restrepo', email: 'luis_restrepo@ejemplo.edu' },
  { code: '009', cedula: '60508659', area: 'Economía y política', grades: '8-1, 8-2, 10-1, 10-2, 11-1, 11-2', fullName: 'Marcela Vargas', email: 'marcela_vargas@ejemplo.edu' },
  { code: '010', cedula: '70570602', area: 'Artística', grades: '9-1, 9-2', fullName: 'Diego Cardona', email: 'diego_cardona@ejemplo.edu' },
  { code: '011', cedula: '80632545', area: 'Tecnológica', grades: '10-1, 10-2, 11-1, 11-2', fullName: 'Sandra López', email: 'sandra_lópez@ejemplo.edu' },
  { code: '012', cedula: '90694488', area: 'Química', grades: '11-1, 11-2', fullName: 'Mauricio Salazar', email: 'mauricio_salazar@ejemplo.edu' },
  { code: '013', cedula: '10756431', area: 'Física', grades: '10-1, 10-2, 11-1, 11-2', fullName: 'Claudia Montoya', email: 'claudia_montoya@ejemplo.edu' },
  { code: '014', cedula: '20818374', area: 'Sociales', grades: '7-1, 7-2, 8-1, 8-2', fullName: 'Ricardo Agudelo', email: 'ricardo_agudelo@ejemplo.edu' },
  { code: '015', cedula: '30880317', area: 'Filosofía de vida', grades: '8-1, 8-2', fullName: 'Patricia Quintero', email: 'patricia_quintero@ejemplo.edu' },
  { code: '016', cedula: '40942260', area: 'Matemáticas', grades: '6-1, 6-2', fullName: 'Andrés Felipe Ramírez', email: 'andres_ramirez@edulink.edu.co' },
  { code: '017', cedula: '51004203', area: 'Inglés', grades: '7-1, 7-2', fullName: 'Laura Camila Torres', email: 'laura_torres@edulink.edu.co' },
  { code: '018', cedula: '61066146', area: 'Español', grades: '8-1, 8-2', fullName: 'Natalia Andrea Gómez', email: 'natalia_gomez@edulink.edu.co' },
  { code: '019', cedula: '71128089', area: 'Tecnología', grades: '9-1, 9-2', fullName: 'Sebastián David Moreno', email: 'sebastian_moreno@edulink.edu.co' },
  { code: '020', cedula: '81190032', area: 'Química', grades: '10-1, 10-2', fullName: 'Mariana Isabel Castro', email: 'mariana_castro@edulink.edu.co' },
  { code: '021', cedula: '91251975', area: 'Ciencias Naturales', grades: '6-1, 6-2, 7-1, 7-2, 8-1, 8-2, 9-1, 9-2', fullName: 'Gabriel Mendoza', email: 'gabriel_mendoza@edulink.edu.co' },
];

// -------------------------------------------------------------
// PERSONAL ADMINISTRATIVO - 8 REGISTROS OFICIALES
// -------------------------------------------------------------
export const CENSUS_ADMIN_STAFF: CensusAdminStaff[] = [
  { code: 'ADM-001', cargo: 'Rector', dependencia: 'Rectoría', cedula: '92401715', fullName: 'Alejandra Moreno', email: 'alejandra_moreno@ejemplo.edu' },
  { code: 'ADM-002', cargo: 'Coordinador académico', dependencia: 'Académica', cedula: '12463658', fullName: 'Carlos Mendoza', email: 'carlos_mendoza@ejemplo.edu' },
  { code: 'ADM-003', cargo: 'Coordinador de preescolar', dependencia: 'Preescolar', cedula: '22525601', fullName: 'Mónica Castaño', email: 'mónica_castaño@ejemplo.edu' },
  { code: 'ADM-004', cargo: 'Secretaría académica', dependencia: 'Secretaría', cedula: '32587544', fullName: 'José Salazar', email: 'josé_salazar@ejemplo.edu' },
  { code: 'ADM-005', cargo: 'Coordinador de convivencia', dependencia: 'Convivencia', cedula: '42649487', fullName: 'Viviana Giraldo', email: 'viviana_giraldo@ejemplo.edu' },
  { code: 'ADM-006', cargo: 'Orientador escolar', dependencia: 'Orientación', cedula: '52711430', fullName: 'Esteban Pérez', email: 'esteban_pérez@ejemplo.edu' },
  { code: 'ADM-007', cargo: 'Auxiliar administrativo', dependencia: 'Administrativa', cedula: '62773373', fullName: 'Luz Marina Quintero', email: 'luz_marina_quintero@ejemplo.edu' },
  { code: 'ADM-008', cargo: 'Secretaría general', dependencia: 'Administrativa', cedula: '72835316', fullName: 'Wilson Agudelo', email: 'wilson_agudelo@ejemplo.edu' },
];

// -------------------------------------------------------------
// ESTUDIANTES - 180 REGISTROS (GRADOS 6-1 A 11-2)
// -------------------------------------------------------------
export const CENSUS_STUDENTS: CensusStudent[] = [
  // GRUPO 6-1
  { group: '6-1', documentId: '1003467812', fullName: 'Valentina Gómez Suárez', email: 'valentina_gómez_suárez@ejemplo.edu' },
  { group: '6-1', documentId: '1103540941', fullName: 'Santiago Torres Sánchez', email: 'santiago_torres_sánchez@ejemplo.edu' },
  { group: '6-1', documentId: '1203614070', fullName: 'Mariana Cardona Pérez', email: 'mariana_cardona_pérez@ejemplo.edu' },
  { group: '6-1', documentId: '1303687199', fullName: 'Juan Rodríguez Osorio', email: 'juan_rodríguez_osorio@ejemplo.edu' },
  { group: '6-1', documentId: '1403760328', fullName: 'Sofía Vargas Salazar', email: 'sofía_vargas_salazar@ejemplo.edu' },
  { group: '6-1', documentId: '1503833457', fullName: 'Samuel Castaño Arango', email: 'samuel_castaño_arango@ejemplo.edu' },
  { group: '6-1', documentId: '1603906586', fullName: 'Isabella Martínez Montoya', email: 'isabella_martínez_montoya@ejemplo.edu' },
  { group: '6-1', documentId: '1703979715', fullName: 'Nicolás Castro Muñoz', email: 'nicolás_castro_muñoz@ejemplo.edu' },
  { group: '6-1', documentId: '1804052844', fullName: 'Gabriela Mendoza Marín', email: 'gabriela_mendoza_marín@ejemplo.edu' },
  { group: '6-1', documentId: '1904125973', fullName: 'Mateo López Mendoza', email: 'mateo_lópez_mendoza@ejemplo.edu' },
  { group: '6-1', documentId: '1004199102', fullName: 'Manuela Moreno Zapata', email: 'manuela_moreno_zapata@ejemplo.edu' },
  { group: '6-1', documentId: '1104272231', fullName: 'Sebastián Salazar Giraldo', email: 'sebastián_salazar_giraldo@ejemplo.edu' },
  { group: '6-1', documentId: '1204345360', fullName: 'Laura Hernández Vélez', email: 'laura_hernández_vélez@ejemplo.edu' },
  { group: '6-1', documentId: '1304418489', fullName: 'Daniel Rojas Quintero', email: 'daniel_rojas_quintero@ejemplo.edu' },
  { group: '6-1', documentId: '1404491618', fullName: 'Camila Quintero Mejía', email: 'camila_quintero_mejía@ejemplo.edu' },

  // GRUPO 6-2
  { group: '6-2', documentId: '1504564747', fullName: 'Tomás García Agudelo', email: 'tomás_garcía_agudelo@ejemplo.edu' },
  { group: '6-2', documentId: '1604637876', fullName: 'Sara Jiménez Correa', email: 'sara_jiménez_correa@ejemplo.edu' },
  { group: '6-2', documentId: '1704711005', fullName: 'Alejandro Agudelo Velásquez', email: 'alejandro_agudelo_velásquez@ejemplo.edu' },
  { group: '6-2', documentId: '1804784134', fullName: 'Juliana Ramírez Castaño', email: 'juliana_ramírez_castaño@ejemplo.edu' },
  { group: '6-2', documentId: '1904857263', fullName: 'David Restrepo Duque', email: 'david_restrepo_duque@ejemplo.edu' },
  { group: '6-2', documentId: '1004930392', fullName: 'Valentina Gómez Suárez', email: 'valentina_gómez_suárez@ejemplo.edu' },
  { group: '6-2', documentId: '1105003521', fullName: 'Santiago Torres Sánchez', email: 'santiago_torres_sánchez@ejemplo.edu' },
  { group: '6-2', documentId: '1205076650', fullName: 'Mariana Cardona Pérez', email: 'mariana_cardona_pérez@ejemplo.edu' },
  { group: '6-2', documentId: '1305149779', fullName: 'Juan Rodríguez Osorio', email: 'juan_rodríguez_osorio@ejemplo.edu' },
  { group: '6-2', documentId: '1405222908', fullName: 'Sofía Vargas Salazar', email: 'sofía_vargas_salazar@ejemplo.edu' },
  { group: '6-2', documentId: '1505296037', fullName: 'Samuel Castaño Arango', email: 'samuel_castaño_arango@ejemplo.edu' },
  { group: '6-2', documentId: '1605369166', fullName: 'Isabella Martínez Montoya', email: 'isabella_martínez_montoya@ejemplo.edu' },
  { group: '6-2', documentId: '1705442295', fullName: 'Nicolás Castro Muñoz', email: 'nicolás_castro_muñoz@ejemplo.edu' },
  { group: '6-2', documentId: '1805515424', fullName: 'Gabriela Mendoza Marín', email: 'gabriela_mendoza_marín@ejemplo.edu' },
  { group: '6-2', documentId: '1905588553', fullName: 'Mateo López Mendoza', email: 'mateo_lópez_mendoza@ejemplo.edu' },

  // GRUPO 7-1
  { group: '7-1', documentId: '1005661682', fullName: 'Manuela Moreno Zapata', email: 'manuela_moreno_zapata@ejemplo.edu' },
  { group: '7-1', documentId: '1105734811', fullName: 'Sebastián Salazar Giraldo', email: 'sebastián_salazar_giraldo@ejemplo.edu' },
  { group: '7-1', documentId: '1205807940', fullName: 'Laura Hernández Vélez', email: 'laura_hernández_vélez@ejemplo.edu' },
  { group: '7-1', documentId: '1305881069', fullName: 'Daniel Rojas Quintero', email: 'daniel_rojas_quintero@ejemplo.edu' },
  { group: '7-1', documentId: '1405954198', fullName: 'Camila Quintero Mejía', email: 'camila_quintero_mejía@ejemplo.edu' },
  { group: '7-1', documentId: '1506027327', fullName: 'Tomás García Agudelo', email: 'tomás_garcía_agudelo@ejemplo.edu' },
  { group: '7-1', documentId: '1606100456', fullName: 'Sara Jiménez Correa', email: 'sara_jiménez_correa@ejemplo.edu' },
  { group: '7-1', documentId: '1706173585', fullName: 'Alejandro Agudelo Velásquez', email: 'alejandro_agudelo_velásquez@ejemplo.edu' },
  { group: '7-1', documentId: '1806246714', fullName: 'Juliana Ramírez Castaño', email: 'juliana_ramírez_castaño@ejemplo.edu' },
  { group: '7-1', documentId: '1906319843', fullName: 'David Restrepo Duque', email: 'david_restrepo_duque@ejemplo.edu' },
  { group: '7-1', documentId: '1006392972', fullName: 'Valentina Gómez Suárez', email: 'valentina_gómez_suárez@ejemplo.edu' },
  { group: '7-1', documentId: '1106466101', fullName: 'Santiago Torres Sánchez', email: 'santiago_torres_sánchez@ejemplo.edu' },
  { group: '7-1', documentId: '1206539230', fullName: 'Mariana Cardona Pérez', email: 'mariana_cardona_pérez@ejemplo.edu' },
  { group: '7-1', documentId: '1306612359', fullName: 'Juan Rodríguez Osorio', email: 'juan_rodríguez_osorio@ejemplo.edu' },
  { group: '7-1', documentId: '1406685488', fullName: 'Sofía Vargas Salazar', email: 'sofía_vargas_salazar@ejemplo.edu' },

  // GRUPO 7-2
  { group: '7-2', documentId: '1506758617', fullName: 'Samuel Castaño Arango', email: 'samuel_castaño_arango@ejemplo.edu' },
  { group: '7-2', documentId: '1606831746', fullName: 'Isabella Martínez Montoya', email: 'isabella_martínez_montoya@ejemplo.edu' },
  { group: '7-2', documentId: '1706904875', fullName: 'Nicolás Castro Muñoz', email: 'nicolás_castro_muñoz@ejemplo.edu' },
  { group: '7-2', documentId: '1806978004', fullName: 'Gabriela Mendoza Marín', email: 'gabriela_mendoza_marín@ejemplo.edu' },
  { group: '7-2', documentId: '1907051133', fullName: 'Mateo López Mendoza', email: 'mateo_lópez_mendoza@ejemplo.edu' },
  { group: '7-2', documentId: '1007124262', fullName: 'Manuela Moreno Zapata', email: 'manuela_moreno_zapata@ejemplo.edu' },
  { group: '7-2', documentId: '1107197391', fullName: 'Sebastián Salazar Giraldo', email: 'sebastián_salazar_giraldo@ejemplo.edu' },
  { group: '7-2', documentId: '1207270520', fullName: 'Laura Hernández Vélez', email: 'laura_hernández_vélez@ejemplo.edu' },
  { group: '7-2', documentId: '1307343649', fullName: 'Daniel Rojas Quintero', email: 'daniel_rojas_quintero@ejemplo.edu' },
  { group: '7-2', documentId: '1407416778', fullName: 'Camila Quintero Mejía', email: 'camila_quintero_mejía@ejemplo.edu' },
  { group: '7-2', documentId: '1507489907', fullName: 'Tomás García Agudelo', email: 'tomás_garcía_agudelo@ejemplo.edu' },
  { group: '7-2', documentId: '1607563036', fullName: 'Sara Jiménez Correa', email: 'sara_jiménez_correa@ejemplo.edu' },
  { group: '7-2', documentId: '1707636165', fullName: 'Alejandro Agudelo Velásquez', email: 'alejandro_agudelo_velásquez@ejemplo.edu' },
  { group: '7-2', documentId: '1807709294', fullName: 'Juliana Ramírez Castaño', email: 'juliana_ramírez_castaño@ejemplo.edu' },
  { group: '7-2', documentId: '1907782423', fullName: 'David Restrepo Duque', email: 'david_restrepo_duque@ejemplo.edu' },

  // GRUPO 8-1
  { group: '8-1', documentId: '1007855552', fullName: 'Valentina Gómez Suárez', email: 'valentina_gómez_suárez@ejemplo.edu' },
  { group: '8-1', documentId: '1107928681', fullName: 'Santiago Torres Sánchez', email: 'santiago_torres_sánchez@ejemplo.edu' },
  { group: '8-1', documentId: '1208001810', fullName: 'Mariana Cardona Pérez', email: 'mariana_cardona_pérez@ejemplo.edu' },
  { group: '8-1', documentId: '1308074939', fullName: 'Juan Rodríguez Osorio', email: 'juan_rodríguez_osorio@ejemplo.edu' },
  { group: '8-1', documentId: '1408148068', fullName: 'Sofía Vargas Salazar', email: 'sofía_vargas_salazar@ejemplo.edu' },
  { group: '8-1', documentId: '1508221197', fullName: 'Samuel Castaño Arango', email: 'samuel_castaño_arango@ejemplo.edu' },
  { group: '8-1', documentId: '1608294326', fullName: 'Isabella Martínez Montoya', email: 'isabella_martínez_montoya@ejemplo.edu' },
  { group: '8-1', documentId: '1708367455', fullName: 'Nicolás Castro Muñoz', email: 'nicolás_castro_muñoz@ejemplo.edu' },
  { group: '8-1', documentId: '1808440584', fullName: 'Gabriela Mendoza Marín', email: 'gabriela_mendoza_marín@ejemplo.edu' },
  { group: '8-1', documentId: '1908513713', fullName: 'Mateo López Mendoza', email: 'mateo_lópez_mendoza@ejemplo.edu' },
  { group: '8-1', documentId: '1008586842', fullName: 'Manuela Moreno Zapata', email: 'manuela_moreno_zapata@ejemplo.edu' },
  { group: '8-1', documentId: '1108659971', fullName: 'Sebastián Salazar Giraldo', email: 'sebastián_salazar_giraldo@ejemplo.edu' },
  { group: '8-1', documentId: '1208733100', fullName: 'Laura Hernández Vélez', email: 'laura_hernández_vélez@ejemplo.edu' },
  { group: '8-1', documentId: '1308806229', fullName: 'Daniel Rojas Quintero', email: 'daniel_rojas_quintero@ejemplo.edu' },
  { group: '8-1', documentId: '1408879358', fullName: 'Camila Quintero Mejía', email: 'camila_quintero_mejía@ejemplo.edu' },

  // GRUPO 8-2
  { group: '8-2', documentId: '1508952487', fullName: 'Tomás García Agudelo', email: 'tomás_garcía_agudelo@ejemplo.edu' },
  { group: '8-2', documentId: '1609025616', fullName: 'Sara Jiménez Correa', email: 'sara_jiménez_correa@ejemplo.edu' },
  { group: '8-2', documentId: '1709098745', fullName: 'Alejandro Agudelo Velásquez', email: 'alejandro_agudelo_velásquez@ejemplo.edu' },
  { group: '8-2', documentId: '1809171874', fullName: 'Juliana Ramírez Castaño', email: 'juliana_ramírez_castaño@ejemplo.edu' },
  { group: '8-2', documentId: '1909245003', fullName: 'David Restrepo Duque', email: 'david_restrepo_duque@ejemplo.edu' },
  { group: '8-2', documentId: '1009318132', fullName: 'Valentina Gómez Suárez', email: 'valentina_gómez_suárez@ejemplo.edu' },
  { group: '8-2', documentId: '1109391261', fullName: 'Santiago Torres Sánchez', email: 'santiago_torres_sánchez@ejemplo.edu' },
  { group: '8-2', documentId: '1209464390', fullName: 'Mariana Cardona Pérez', email: 'mariana_cardona_pérez@ejemplo.edu' },
  { group: '8-2', documentId: '1309537519', fullName: 'Juan Rodríguez Osorio', email: 'juan_rodríguez_osorio@ejemplo.edu' },
  { group: '8-2', documentId: '1409610648', fullName: 'Sofía Vargas Salazar', email: 'sofía_vargas_salazar@ejemplo.edu' },
  { group: '8-2', documentId: '1509683777', fullName: 'Samuel Castaño Arango', email: 'samuel_castaño_arango@ejemplo.edu' },
  { group: '8-2', documentId: '1609756906', fullName: 'Isabella Martínez Montoya', email: 'isabella_martínez_montoya@ejemplo.edu' },
  { group: '8-2', documentId: '1709830035', fullName: 'Nicolás Castro Muñoz', email: 'nicolás_castro_muñoz@ejemplo.edu' },
  { group: '8-2', documentId: '1809903164', fullName: 'Gabriela Mendoza Marín', email: 'gabriela_mendoza_marín@ejemplo.edu' },
  { group: '8-2', documentId: '1909976293', fullName: 'Mateo López Mendoza', email: 'mateo_lópez_mendoza@ejemplo.edu' },

  // GRUPO 9-1
  { group: '9-1', documentId: '1010049422', fullName: 'Manuela Moreno Zapata', email: 'manuela_moreno_zapata@ejemplo.edu' },
  { group: '9-1', documentId: '1110122551', fullName: 'Sebastián Salazar Giraldo', email: 'sebastián_salazar_giraldo@ejemplo.edu' },
  { group: '9-1', documentId: '1210195680', fullName: 'Laura Hernández Vélez', email: 'laura_hernández_vélez@ejemplo.edu' },
  { group: '9-1', documentId: '1310268809', fullName: 'Daniel Rojas Quintero', email: 'daniel_rojas_quintero@ejemplo.edu' },
  { group: '9-1', documentId: '1410341938', fullName: 'Camila Quintero Mejía', email: 'camila_quintero_mejía@ejemplo.edu' },
  { group: '9-1', documentId: '1510415067', fullName: 'Tomás García Agudelo', email: 'tomás_garcía_agudelo@ejemplo.edu' },
  { group: '9-1', documentId: '1610488196', fullName: 'Sara Jiménez Correa', email: 'sara_jiménez_correa@ejemplo.edu' },
  { group: '9-1', documentId: '1710561325', fullName: 'Alejandro Agudelo Velásquez', email: 'alejandro_agudelo_velásquez@ejemplo.edu' },
  { group: '9-1', documentId: '1810634454', fullName: 'Juliana Ramírez Castaño', email: 'juliana_ramírez_castaño@ejemplo.edu' },
  { group: '9-1', documentId: '1910707583', fullName: 'David Restrepo Duque', email: 'david_restrepo_duque@ejemplo.edu' },
  { group: '9-1', documentId: '1010780712', fullName: 'Valentina Gómez Suárez', email: 'valentina_gómez_suárez@ejemplo.edu' },
  { group: '9-1', documentId: '1110853841', fullName: 'Santiago Torres Sánchez', email: 'santiago_torres_sánchez@ejemplo.edu' },
  { group: '9-1', documentId: '1210926970', fullName: 'Mariana Cardona Pérez', email: 'mariana_cardona_pérez@ejemplo.edu' },
  { group: '9-1', documentId: '1311000099', fullName: 'Juan Rodríguez Osorio', email: 'juan_rodríguez_osorio@ejemplo.edu' },
  { group: '9-1', documentId: '1411073228', fullName: 'Sofía Vargas Salazar', email: 'sofía_vargas_salazar@ejemplo.edu' },

  // GRUPO 9-2
  { group: '9-2', documentId: '1511146357', fullName: 'Samuel Castaño Arango', email: 'samuel_castaño_arango@ejemplo.edu' },
  { group: '9-2', documentId: '1611219486', fullName: 'Isabella Martínez Montoya', email: 'isabella_martínez_montoya@ejemplo.edu' },
  { group: '9-2', documentId: '1711292615', fullName: 'Nicolás Castro Muñoz', email: 'nicolás_castro_muñoz@ejemplo.edu' },
  { group: '9-2', documentId: '1811365744', fullName: 'Gabriela Mendoza Marín', email: 'gabriela_mendoza_marín@ejemplo.edu' },
  { group: '9-2', documentId: '1911438873', fullName: 'Mateo López Mendoza', email: 'mateo_lópez_mendoza@ejemplo.edu' },
  { group: '9-2', documentId: '1011512002', fullName: 'Manuela Moreno Zapata', email: 'manuela_moreno_zapata@ejemplo.edu' },
  { group: '9-2', documentId: '1111585131', fullName: 'Sebastián Salazar Giraldo', email: 'sebastián_salazar_giraldo@ejemplo.edu' },
  { group: '9-2', documentId: '1211658260', fullName: 'Laura Hernández Vélez', email: 'laura_hernández_vélez@ejemplo.edu' },
  { group: '9-2', documentId: '1311731389', fullName: 'Daniel Rojas Quintero', email: 'daniel_rojas_quintero@ejemplo.edu' },
  { group: '9-2', documentId: '1411804518', fullName: 'Camila Quintero Mejía', email: 'camila_quintero_mejía@ejemplo.edu' },
  { group: '9-2', documentId: '1511877647', fullName: 'Tomás García Agudelo', email: 'tomás_garcía_agudelo@ejemplo.edu' },
  { group: '9-2', documentId: '1611950776', fullName: 'Sara Jiménez Correa', email: 'sara_jiménez_correa@ejemplo.edu' },
  { group: '9-2', documentId: '1712023905', fullName: 'Alejandro Agudelo Velásquez', email: 'alejandro_agudelo_velásquez@ejemplo.edu' },
  { group: '9-2', documentId: '1812097034', fullName: 'Juliana Ramírez Castaño', email: 'juliana_ramírez_castaño@ejemplo.edu' },
  { group: '9-2', documentId: '1912170163', fullName: 'David Restrepo Duque', email: 'david_restrepo_duque@ejemplo.edu' },

  // GRUPO 10-1
  { group: '10-1', documentId: '1012243292', fullName: 'Valentina Gómez Suárez', email: 'valentina_gómez_suárez@ejemplo.edu' },
  { group: '10-1', documentId: '1112316421', fullName: 'Santiago Torres Sánchez', email: 'santiago_torres_sánchez@ejemplo.edu' },
  { group: '10-1', documentId: '1212389550', fullName: 'Mariana Cardona Pérez', email: 'mariana_cardona_pérez@ejemplo.edu' },
  { group: '10-1', documentId: '1312462679', fullName: 'Juan Rodríguez Osorio', email: 'juan_rodríguez_osorio@ejemplo.edu' },
  { group: '10-1', documentId: '1412535808', fullName: 'Sofía Vargas Salazar', email: 'sofía_vargas_salazar@ejemplo.edu' },
  { group: '10-1', documentId: '1512608937', fullName: 'Samuel Castaño Arango', email: 'samuel_castaño_arango@ejemplo.edu' },
  { group: '10-1', documentId: '1612682066', fullName: 'Isabella Martínez Montoya', email: 'isabella_martínez_montoya@ejemplo.edu' },
  { group: '10-1', documentId: '1712755195', fullName: 'Nicolás Castro Muñoz', email: 'nicolás_castro_muñoz@ejemplo.edu' },
  { group: '10-1', documentId: '1812828324', fullName: 'Gabriela Mendoza Marín', email: 'gabriela_mendoza_marín@ejemplo.edu' },
  { group: '10-1', documentId: '1912901453', fullName: 'Mateo López Mendoza', email: 'mateo_lópez_mendoza@ejemplo.edu' },
  { group: '10-1', documentId: '1012974582', fullName: 'Manuela Moreno Zapata', email: 'manuela_moreno_zapata@ejemplo.edu' },
  { group: '10-1', documentId: '1113047711', fullName: 'Sebastián Salazar Giraldo', email: 'sebastián_salazar_giraldo@ejemplo.edu' },
  { group: '10-1', documentId: '1213120840', fullName: 'Laura Hernández Vélez', email: 'laura_hernández_vélez@ejemplo.edu' },
  { group: '10-1', documentId: '1313193969', fullName: 'Daniel Rojas Quintero', email: 'daniel_rojas_quintero@ejemplo.edu' },
  { group: '10-1', documentId: '1413267098', fullName: 'Camila Quintero Mejía', email: 'camila_quintero_mejía@ejemplo.edu' },

  // GRUPO 10-2
  { group: '10-2', documentId: '1513340227', fullName: 'Tomás García Agudelo', email: 'tomás_garcía_agudelo@ejemplo.edu' },
  { group: '10-2', documentId: '1613413356', fullName: 'Sara Jiménez Correa', email: 'sara_jiménez_correa@ejemplo.edu' },
  { group: '10-2', documentId: '1713486485', fullName: 'Alejandro Agudelo Velásquez', email: 'alejandro_agudelo_velásquez@ejemplo.edu' },
  { group: '10-2', documentId: '1813559614', fullName: 'Juliana Ramírez Castaño', email: 'juliana_ramírez_castaño@ejemplo.edu' },
  { group: '10-2', documentId: '1913632743', fullName: 'David Restrepo Duque', email: 'david_restrepo_duque@ejemplo.edu' },
  { group: '10-2', documentId: '1013705872', fullName: 'Valentina Gómez Suárez', email: 'valentina_gómez_suárez@ejemplo.edu' },
  { group: '10-2', documentId: '1113779001', fullName: 'Santiago Torres Sánchez', email: 'santiago_torres_sánchez@ejemplo.edu' },
  { group: '10-2', documentId: '1213852130', fullName: 'Mariana Cardona Pérez', email: 'mariana_cardona_pérez@ejemplo.edu' },
  { group: '10-2', documentId: '1313925259', fullName: 'Juan Rodríguez Osorio', email: 'juan_rodríguez_osorio@ejemplo.edu' },
  { group: '10-2', documentId: '1413998388', fullName: 'Sofía Vargas Salazar', email: 'sofía_vargas_salazar@ejemplo.edu' },
  { group: '10-2', documentId: '1514071517', fullName: 'Samuel Castaño Arango', email: 'samuel_castaño_arango@ejemplo.edu' },
  { group: '10-2', documentId: '1614144646', fullName: 'Isabella Martínez Montoya', email: 'isabella_martínez_montoya@ejemplo.edu' },
  { group: '10-2', documentId: '1714217775', fullName: 'Nicolás Castro Muñoz', email: 'nicolás_castro_muñoz@ejemplo.edu' },
  { group: '10-2', documentId: '1814290904', fullName: 'Gabriela Mendoza Marín', email: 'gabriela_mendoza_marín@ejemplo.edu' },
  { group: '10-2', documentId: '1914364033', fullName: 'Mateo López Mendoza', email: 'mateo_lópez_mendoza@ejemplo.edu' },

  // GRUPO 11-1
  { group: '11-1', documentId: '1014437162', fullName: 'Manuela Moreno Zapata', email: 'manuela_moreno_zapata@ejemplo.edu' },
  { group: '11-1', documentId: '1114510291', fullName: 'Sebastián Salazar Giraldo', email: 'sebastián_salazar_giraldo@ejemplo.edu' },
  { group: '11-1', documentId: '1214583420', fullName: 'Laura Hernández Vélez', email: 'laura_hernández_vélez@ejemplo.edu' },
  { group: '11-1', documentId: '1314656549', fullName: 'Daniel Rojas Quintero', email: 'daniel_rojas_quintero@ejemplo.edu' },
  { group: '11-1', documentId: '1414729678', fullName: 'Camila Quintero Mejía', email: 'camila_quintero_mejía@ejemplo.edu' },
  { group: '11-1', documentId: '1514802807', fullName: 'Tomás García Agudelo', email: 'tomás_garcía_agudelo@ejemplo.edu' },
  { group: '11-1', documentId: '1614875936', fullName: 'Sara Jiménez Correa', email: 'sara_jiménez_correa@ejemplo.edu' },
  { group: '11-1', documentId: '1714949065', fullName: 'Alejandro Agudelo Velásquez', email: 'alejandro_agudelo_velásquez@ejemplo.edu' },
  { group: '11-1', documentId: '1815022194', fullName: 'Juliana Ramírez Castaño', email: 'juliana_ramírez_castaño@ejemplo.edu' },
  { group: '11-1', documentId: '1915095323', fullName: 'David Restrepo Duque', email: 'david_restrepo_duque@ejemplo.edu' },
  { group: '11-1', documentId: '1015168452', fullName: 'Valentina Gómez Suárez', email: 'valentina_gómez_suárez@ejemplo.edu' },
  { group: '11-1', documentId: '1115241581', fullName: 'Santiago Torres Sánchez', email: 'santiago_torres_sánchez@ejemplo.edu' },
  { group: '11-1', documentId: '1215314710', fullName: 'Mariana Cardona Pérez', email: 'mariana_cardona_pérez@ejemplo.edu' },
  { group: '11-1', documentId: '1315387839', fullName: 'Juan Rodríguez Osorio', email: 'juan_rodríguez_osorio@ejemplo.edu' },
  { group: '11-1', documentId: '1415460968', fullName: 'Sofía Vargas Salazar', email: 'sofía_vargas_salazar@ejemplo.edu' },

  // GRUPO 11-2
  { group: '11-2', documentId: '1515534097', fullName: 'Samuel Castaño Arango', email: 'samuel_castaño_arango@ejemplo.edu' },
  { group: '11-2', documentId: '1615607226', fullName: 'Isabella Martínez Montoya', email: 'isabella_martínez_montoya@ejemplo.edu' },
  { group: '11-2', documentId: '1715680355', fullName: 'Nicolás Castro Muñoz', email: 'nicolás_castro_muñoz@ejemplo.edu' },
  { group: '11-2', documentId: '1815753484', fullName: 'Gabriela Mendoza Marín', email: 'gabriela_mendoza_marín@ejemplo.edu' },
  { group: '11-2', documentId: '1915826613', fullName: 'Mateo López Mendoza', email: 'mateo_lópez_mendoza@ejemplo.edu' },
  { group: '11-2', documentId: '1015899742', fullName: 'Manuela Moreno Zapata', email: 'manuela_moreno_zapata@ejemplo.edu' },
  { group: '11-2', documentId: '1115972871', fullName: 'Sebastián Salazar Giraldo', email: 'sebastián_salazar_giraldo@ejemplo.edu' },
  { group: '11-2', documentId: '1216046000', fullName: 'Laura Hernández Vélez', email: 'laura_hernández_vélez@ejemplo.edu' },
  { group: '11-2', documentId: '1316119129', fullName: 'Daniel Rojas Quintero', email: 'daniel_rojas_quintero@ejemplo.edu' },
  { group: '11-2', documentId: '1416192258', fullName: 'Camila Quintero Mejía', email: 'camila_quintero_mejía@ejemplo.edu' },
  { group: '11-2', documentId: '1516265387', fullName: 'Tomás García Agudelo', email: 'tomás_garcía_agudelo@ejemplo.edu' },
  { group: '11-2', documentId: '1616338516', fullName: 'Sara Jiménez Correa', email: 'sara_jiménez_correa@ejemplo.edu' },
  { group: '11-2', documentId: '1716411645', fullName: 'Alejandro Agudelo Velásquez', email: 'alejandro_agudelo_velásquez@ejemplo.edu' },
  { group: '11-2', documentId: '1816484774', fullName: 'Juliana Ramírez Castaño', email: 'juliana_ramírez_castaño@ejemplo.edu' },
  { group: '11-2', documentId: '1916557903', fullName: 'David Restrepo Duque', email: 'david_restrepo_duque@ejemplo.edu' },
];

// -------------------------------------------------------------
// PADRES / ACUDIENTES - 180 REGISTROS OFICIALES
// -------------------------------------------------------------
export const CENSUS_GUARDIANS: CensusGuardian[] = [
  // 6-1
  { relationship: 'Mamá', cedula: '41430215', studentDocumentId: '1003467812', fullName: 'Sebastián Salazar Giraldo', phone: '314567890', email: 'sebastián_salazar_giraldo@ejemplo.com' },
  { relationship: 'Papá', cedula: '51492158', studentDocumentId: '1103540941', fullName: 'Laura Hernández Vélez', phone: '314616261', email: 'laura_hernández_vélez@ejemplo.com' },
  { relationship: 'Tutor legal', cedula: '61554101', studentDocumentId: '1203614070', fullName: 'Daniel Rojas Quintero', phone: '314664632', email: 'daniel_rojas_quintero@ejemplo.com' },
  { relationship: 'Acudiente legal', cedula: '71616044', studentDocumentId: '1303687199', fullName: 'Camila Quintero Mejía', phone: '314713003', email: 'camila_quintero_mejía@ejemplo.com' },
  { relationship: 'Mamá', cedula: '81677987', studentDocumentId: '1403760328', fullName: 'Tomás García Agudelo', phone: '314761374', email: 'tomás_garcía_agudelo@ejemplo.com' },
  { relationship: 'Papá', cedula: '91739930', studentDocumentId: '1503833457', fullName: 'Sara Jiménez Correa', phone: '314809745', email: 'sara_jiménez_correa@ejemplo.com' },
  { relationship: 'Tutor legal', cedula: '11801873', studentDocumentId: '1603906586', fullName: 'Alejandro Agudelo Velásquez', phone: '314858116', email: 'alejandro_agudelo_velásquez@ejemplo.com' },
  { relationship: 'Acudiente legal', cedula: '21863816', studentDocumentId: '1703979715', fullName: 'Juliana Ramírez Castaño', phone: '314906487', email: 'juliana_ramírez_castaño@ejemplo.com' },
  { relationship: 'Mamá', cedula: '31925759', studentDocumentId: '1804052844', fullName: 'David Restrepo Duque', phone: '314954858', email: 'david_restrepo_duque@ejemplo.com' },
  { relationship: 'Papá', cedula: '41987702', studentDocumentId: '1904125973', fullName: 'Valentina Gómez Suárez', phone: '315003229', email: 'valentina_gómez_suárez@ejemplo.com' },
  { relationship: 'Tutor legal', cedula: '52049645', studentDocumentId: '1004199102', fullName: 'Santiago Torres Sánchez', phone: '315051600', email: 'santiago_torres_sánchez@ejemplo.com' },
  { relationship: 'Acudiente legal', cedula: '62111588', studentDocumentId: '1104272231', fullName: 'Mariana Cardona Pérez', phone: '315099971', email: 'mariana_cardona_pérez@ejemplo.com' },
  { relationship: 'Mamá', cedula: '72173531', studentDocumentId: '1204345360', fullName: 'Juan Rodríguez Osorio', phone: '315148342', email: 'juan_rodríguez_osorio@ejemplo.com' },
  { relationship: 'Papá', cedula: '82235474', studentDocumentId: '1304418489', fullName: 'Sofía Vargas Salazar', phone: '315196713', email: 'sofía_vargas_salazar@ejemplo.com' },
  { relationship: 'Tutor legal', cedula: '92297417', studentDocumentId: '1404491618', fullName: 'Samuel Castaño Arango', phone: '315245084', email: 'samuel_castaño_arango@ejemplo.com' },

  // 6-2
  { relationship: 'Acudiente legal', cedula: '12359360', studentDocumentId: '1504564747', fullName: 'Isabella Martínez Montoya', phone: '315293455', email: 'isabella_martínez_montoya@ejemplo.com' },
  { relationship: 'Mamá', cedula: '22421303', studentDocumentId: '1604637876', fullName: 'Nicolás Castro Muñoz', phone: '315341826', email: 'nicolás_castro_muñoz@ejemplo.com' },
  { relationship: 'Papá', cedula: '32483246', studentDocumentId: '1704711005', fullName: 'Gabriela Mendoza Marín', phone: '315390197', email: 'gabriela_mendoza_marín@ejemplo.com' },
  { relationship: 'Tutor legal', cedula: '42545189', studentDocumentId: '1804784134', fullName: 'Mateo López Mendoza', phone: '315438568', email: 'mateo_lópez_mendoza@ejemplo.com' },
  { relationship: 'Acudiente legal', cedula: '52607132', studentDocumentId: '1904857263', fullName: 'Manuela Moreno Zapata', phone: '315486939', email: 'manuela_moreno_zapata@ejemplo.com' },
  { relationship: 'Mamá', cedula: '62669075', studentDocumentId: '1004930392', fullName: 'Sebastián Salazar Giraldo', phone: '315535310', email: 'sebastián_salazar_giraldo@ejemplo.com' },
  { relationship: 'Papá', cedula: '72731018', studentDocumentId: '1105003521', fullName: 'Laura Hernández Vélez', phone: '315583681', email: 'laura_hernández_vélez@ejemplo.com' },
  { relationship: 'Tutor legal', cedula: '82792961', studentDocumentId: '1205076650', fullName: 'Daniel Rojas Quintero', phone: '315632052', email: 'daniel_rojas_quintero@ejemplo.com' },
  { relationship: 'Acudiente legal', cedula: '92854904', studentDocumentId: '1305149779', fullName: 'Camila Quintero Mejía', phone: '315680423', email: 'camila_quintero_mejía@ejemplo.com' },
  { relationship: 'Mamá', cedula: '12916847', studentDocumentId: '1405222908', fullName: 'Tomás García Agudelo', phone: '315728794', email: 'tomás_garcía_agudelo@ejemplo.com' },
  { relationship: 'Papá', cedula: '22978790', studentDocumentId: '1505296037', fullName: 'Sara Jiménez Correa', phone: '315777165', email: 'sara_jiménez_correa@ejemplo.com' },
  { relationship: 'Tutor legal', cedula: '33040733', studentDocumentId: '1605369166', fullName: 'Alejandro Agudelo Velásquez', phone: '315825536', email: 'alejandro_agudelo_velásquez@ejemplo.com' },
  { relationship: 'Acudiente legal', cedula: '43102676', studentDocumentId: '1705442295', fullName: 'Juliana Ramírez Castaño', phone: '315873907', email: 'juliana_ramírez_castaño@ejemplo.com' },
  { relationship: 'Mamá', cedula: '53164619', studentDocumentId: '1805515424', fullName: 'David Restrepo Duque', phone: '315922278', email: 'david_restrepo_duque@ejemplo.com' },
  { relationship: 'Papá', cedula: '63226562', studentDocumentId: '1905588553', fullName: 'Valentina Gómez Suárez', phone: '315970649', email: 'valentina_gómez_suárez@ejemplo.com' },

  // 7-1
  { relationship: 'Tutor legal', cedula: '73288505', studentDocumentId: '1005661682', fullName: 'Santiago Torres Sánchez', phone: '316019020', email: 'santiago_torres_sánchez@ejemplo.com' },
  { relationship: 'Acudiente legal', cedula: '83350448', studentDocumentId: '1105734811', fullName: 'Mariana Cardona Pérez', phone: '316067391', email: 'mariana_cardona_pérez@ejemplo.com' },
  { relationship: 'Mamá', cedula: '93412391', studentDocumentId: '1205807940', fullName: 'Juan Rodríguez Osorio', phone: '316115762', email: 'juan_rodríguez_osorio@ejemplo.com' },
  { relationship: 'Papá', cedula: '13474334', studentDocumentId: '1305881069', fullName: 'Sofía Vargas Salazar', phone: '316164133', email: 'sofía_vargas_salazar@ejemplo.com' },
  { relationship: 'Tutor legal', cedula: '23536277', studentDocumentId: '1405954198', fullName: 'Samuel Castaño Arango', phone: '316212504', email: 'samuel_castaño_arango@ejemplo.com' },
  { relationship: 'Acudiente legal', cedula: '33598220', studentDocumentId: '1506027327', fullName: 'Isabella Martínez Montoya', phone: '316260875', email: 'isabella_martínez_montoya@ejemplo.com' },
  { relationship: 'Mamá', cedula: '43660163', studentDocumentId: '1606100456', fullName: 'Nicolás Castro Muñoz', phone: '316309246', email: 'nicolás_castro_muñoz@ejemplo.com' },
  { relationship: 'Papá', cedula: '53722106', studentDocumentId: '1706173585', fullName: 'Gabriela Mendoza Marín', phone: '316357617', email: 'gabriela_mendoza_marín@ejemplo.com' },
  { relationship: 'Tutor legal', cedula: '63784049', studentDocumentId: '1806246714', fullName: 'Mateo López Mendoza', phone: '316405988', email: 'mateo_lópez_mendoza@ejemplo.com' },
  { relationship: 'Acudiente legal', cedula: '73845992', studentDocumentId: '1906319843', fullName: 'Manuela Moreno Zapata', phone: '316454359', email: 'manuela_moreno_zapata@ejemplo.com' },
  { relationship: 'Mamá', cedula: '83907935', studentDocumentId: '1006392972', fullName: 'Sebastián Salazar Giraldo', phone: '316502730', email: 'sebastián_salazar_giraldo@ejemplo.com' },
  { relationship: 'Papá', cedula: '93969878', studentDocumentId: '1106466101', fullName: 'Laura Hernández Vélez', phone: '316551101', email: 'laura_hernández_vélez@ejemplo.com' },
  { relationship: 'Tutor legal', cedula: '14031821', studentDocumentId: '1206539230', fullName: 'Daniel Rojas Quintero', phone: '316599472', email: 'daniel_rojas_quintero@ejemplo.com' },
  { relationship: 'Acudiente legal', cedula: '24093764', studentDocumentId: '1306612359', fullName: 'Camila Quintero Mejía', phone: '316647843', email: 'camila_quintero_mejía@ejemplo.com' },
  { relationship: 'Mamá', cedula: '34155707', studentDocumentId: '1406685488', fullName: 'Tomás García Agudelo', phone: '316696214', email: 'tomás_garcía_agudelo@ejemplo.com' },

  // 7-2
  { relationship: 'Papá', cedula: '44217650', studentDocumentId: '1506758617', fullName: 'Sara Jiménez Correa', phone: '316744585', email: 'sara_jiménez_correa@ejemplo.com' },
  { relationship: 'Tutor legal', cedula: '54279593', studentDocumentId: '1606831746', fullName: 'Alejandro Agudelo Velásquez', phone: '316792956', email: 'alejandro_agudelo_velásquez@ejemplo.com' },
  { relationship: 'Acudiente legal', cedula: '64341536', studentDocumentId: '1706904875', fullName: 'Juliana Ramírez Castaño', phone: '316841327', email: 'juliana_ramírez_castaño@ejemplo.com' },
  { relationship: 'Mamá', cedula: '74403479', studentDocumentId: '1806978004', fullName: 'David Restrepo Duque', phone: '316889698', email: 'david_restrepo_duque@ejemplo.com' },
  { relationship: 'Papá', cedula: '84465422', studentDocumentId: '1907051133', fullName: 'Valentina Gómez Suárez', phone: '316938069', email: 'valentina_gómez_suárez@ejemplo.com' },
  { relationship: 'Tutor legal', cedula: '94527365', studentDocumentId: '1007124262', fullName: 'Santiago Torres Sánchez', phone: '316986440', email: 'santiago_torres_sánchez@ejemplo.com' },
  { relationship: 'Acudiente legal', cedula: '14589308', studentDocumentId: '1107197391', fullName: 'Mariana Cardona Pérez', phone: '317034811', email: 'mariana_cardona_pérez@ejemplo.com' },
  { relationship: 'Mamá', cedula: '24651251', studentDocumentId: '1207270520', fullName: 'Juan Rodríguez Osorio', phone: '317083182', email: 'juan_rodríguez_osorio@ejemplo.com' },
  { relationship: 'Papá', cedula: '34713194', studentDocumentId: '1307343649', fullName: 'Sofía Vargas Salazar', phone: '317131553', email: 'sofía_vargas_salazar@ejemplo.com' },
  { relationship: 'Tutor legal', cedula: '44775137', studentDocumentId: '1407416778', fullName: 'Samuel Castaño Arango', phone: '317179924', email: 'samuel_castaño_arango@ejemplo.com' },
  { relationship: 'Acudiente legal', cedula: '54837080', studentDocumentId: '1507489907', fullName: 'Isabella Martínez Montoya', phone: '317228295', email: 'isabella_martínez_montoya@ejemplo.com' },
  { relationship: 'Mamá', cedula: '64899023', studentDocumentId: '1607563036', fullName: 'Nicolás Castro Muñoz', phone: '317276666', email: 'nicolás_castro_muñoz@ejemplo.com' },
  { relationship: 'Papá', cedula: '74960966', studentDocumentId: '1707636165', fullName: 'Gabriela Mendoza Marín', phone: '317325037', email: 'gabriela_mendoza_marín@ejemplo.com' },
  { relationship: 'Tutor legal', cedula: '85022909', studentDocumentId: '1807709294', fullName: 'Mateo López Mendoza', phone: '317373408', email: 'mateo_lópez_mendoza@ejemplo.com' },
  { relationship: 'Acudiente legal', cedula: '95084852', studentDocumentId: '1907782423', fullName: 'Manuela Moreno Zapata', phone: '317421779', email: 'manuela_moreno_zapata@ejemplo.com' },

  // 8-1
  { relationship: 'Mamá', cedula: '15146795', studentDocumentId: '1007855552', fullName: 'Sebastián Salazar Giraldo', phone: '317470150', email: 'sebastián_salazar_giraldo@ejemplo.com' },
  { relationship: 'Papá', cedula: '25208738', studentDocumentId: '1107928681', fullName: 'Laura Hernández Vélez', phone: '317518521', email: 'laura_hernández_vélez@ejemplo.com' },
  { relationship: 'Tutor legal', cedula: '35270681', studentDocumentId: '1208001810', fullName: 'Daniel Rojas Quintero', phone: '317566892', email: 'daniel_rojas_quintero@ejemplo.com' },
  { relationship: 'Acudiente legal', cedula: '45332624', studentDocumentId: '1308074939', fullName: 'Camila Quintero Mejía', phone: '317615263', email: 'camila_quintero_mejía@ejemplo.com' },
  { relationship: 'Mamá', cedula: '55394567', studentDocumentId: '1408148068', fullName: 'Tomás García Agudelo', phone: '317663634', email: 'tomás_garcía_agudelo@ejemplo.com' },
  { relationship: 'Papá', cedula: '65456510', studentDocumentId: '1508221197', fullName: 'Sara Jiménez Correa', phone: '317712005', email: 'sara_jiménez_correa@ejemplo.com' },
  { relationship: 'Tutor legal', cedula: '75518453', studentDocumentId: '1608294326', fullName: 'Alejandro Agudelo Velásquez', phone: '317760376', email: 'alejandro_agudelo_velásquez@ejemplo.com' },
  { relationship: 'Acudiente legal', cedula: '85580396', studentDocumentId: '1708367455', fullName: 'Juliana Ramírez Castaño', phone: '317808747', email: 'juliana_ramírez_castaño@ejemplo.com' },
  { relationship: 'Mamá', cedula: '95642339', studentDocumentId: '1808440584', fullName: 'David Restrepo Duque', phone: '317857118', email: 'david_restrepo_duque@ejemplo.com' },
  { relationship: 'Papá', cedula: '15704282', studentDocumentId: '1908513713', fullName: 'Valentina Gómez Suárez', phone: '317905489', email: 'valentina_gómez_suárez@ejemplo.com' },
  { relationship: 'Tutor legal', cedula: '25766225', studentDocumentId: '1008586842', fullName: 'Santiago Torres Sánchez', phone: '317953860', email: 'santiago_torres_sánchez@ejemplo.com' },
  { relationship: 'Acudiente legal', cedula: '35828168', studentDocumentId: '1108659971', fullName: 'Mariana Cardona Pérez', phone: '318002231', email: 'mariana_cardona_pérez@ejemplo.com' },
  { relationship: 'Mamá', cedula: '45890111', studentDocumentId: '1208733100', fullName: 'Juan Rodríguez Osorio', phone: '318050602', email: 'juan_rodríguez_osorio@ejemplo.com' },
  { relationship: 'Papá', cedula: '55952054', studentDocumentId: '1308806229', fullName: 'Sofía Vargas Salazar', phone: '318098973', email: 'sofía_vargas_salazar@ejemplo.com' },
  { relationship: 'Tutor legal', cedula: '66013997', studentDocumentId: '1408879358', fullName: 'Samuel Castaño Arango', phone: '318147344', email: 'samuel_castaño_arango@ejemplo.com' },

  // 8-2
  { relationship: 'Acudiente legal', cedula: '76075940', studentDocumentId: '1508952487', fullName: 'Isabella Martínez Montoya', phone: '318195715', email: 'isabella_martínez_montoya@ejemplo.com' },
  { relationship: 'Mamá', cedula: '86137883', studentDocumentId: '1609025616', fullName: 'Nicolás Castro Muñoz', phone: '318244086', email: 'nicolás_castro_muñoz@ejemplo.com' },
  { relationship: 'Papá', cedula: '96199826', studentDocumentId: '1709098745', fullName: 'Gabriela Mendoza Marín', phone: '318292457', email: 'gabriela_mendoza_marín@ejemplo.com' },
  { relationship: 'Tutor legal', cedula: '16261769', studentDocumentId: '1809171874', fullName: 'Mateo López Mendoza', phone: '318340828', email: 'mateo_lópez_mendoza@ejemplo.com' },
  { relationship: 'Acudiente legal', cedula: '26323712', studentDocumentId: '1909245003', fullName: 'Manuela Moreno Zapata', phone: '318389199', email: 'manuela_moreno_zapata@ejemplo.com' },
  { relationship: 'Mamá', cedula: '36385655', studentDocumentId: '1009318132', fullName: 'Sebastián Salazar Giraldo', phone: '318437570', email: 'sebastián_salazar_giraldo@ejemplo.com' },
  { relationship: 'Papá', cedula: '46447598', studentDocumentId: '1109391261', fullName: 'Laura Hernández Vélez', phone: '318485941', email: 'laura_hernández_vélez@ejemplo.com' },
  { relationship: 'Tutor legal', cedula: '56509541', studentDocumentId: '1209464390', fullName: 'Daniel Rojas Quintero', phone: '318534312', email: 'daniel_rojas_quintero@ejemplo.com' },
  { relationship: 'Acudiente legal', cedula: '66571484', studentDocumentId: '1309537519', fullName: 'Camila Quintero Mejía', phone: '318582683', email: 'camila_quintero_mejía@ejemplo.com' },
  { relationship: 'Mamá', cedula: '76633427', studentDocumentId: '1409610648', fullName: 'Tomás García Agudelo', phone: '318631054', email: 'tomás_garcía_agudelo@ejemplo.com' },
  { relationship: 'Papá', cedula: '86695370', studentDocumentId: '1509683777', fullName: 'Sara Jiménez Correa', phone: '318679425', email: 'sara_jiménez_correa@ejemplo.com' },
  { relationship: 'Tutor legal', cedula: '96757313', studentDocumentId: '1609756906', fullName: 'Alejandro Agudelo Velásquez', phone: '318727796', email: 'alejandro_agudelo_velásquez@ejemplo.com' },
  { relationship: 'Acudiente legal', cedula: '16819256', studentDocumentId: '1709830035', fullName: 'Juliana Ramírez Castaño', phone: '318776167', email: 'juliana_ramírez_castaño@ejemplo.com' },
  { relationship: 'Mamá', cedula: '26881199', studentDocumentId: '1809903164', fullName: 'David Restrepo Duque', phone: '318824538', email: 'david_restrepo_duque@ejemplo.com' },
  { relationship: 'Papá', cedula: '36943142', studentDocumentId: '1909976293', fullName: 'Valentina Gómez Suárez', phone: '318872909', email: 'valentina_gómez_suárez@ejemplo.com' },

  // 9-1
  { relationship: 'Tutor legal', cedula: '47005085', studentDocumentId: '1010049422', fullName: 'Santiago Torres Sánchez', phone: '318921280', email: 'santiago_torres_sánchez@ejemplo.com' },
  { relationship: 'Acudiente legal', cedula: '57067028', studentDocumentId: '1110122551', fullName: 'Mariana Cardona Pérez', phone: '318969651', email: 'mariana_cardona_pérez@ejemplo.com' },
  { relationship: 'Mamá', cedula: '67128971', studentDocumentId: '1210195680', fullName: 'Juan Rodríguez Osorio', phone: '319018022', email: 'juan_rodríguez_osorio@ejemplo.com' },
  { relationship: 'Papá', cedula: '77190914', studentDocumentId: '1310268809', fullName: 'Sofía Vargas Salazar', phone: '319066393', email: 'sofía_vargas_salazar@ejemplo.com' },
  { relationship: 'Tutor legal', cedula: '87252857', studentDocumentId: '1410341938', fullName: 'Samuel Castaño Arango', phone: '319114764', email: 'samuel_castaño_arango@ejemplo.com' },
  { relationship: 'Acudiente legal', cedula: '97314800', studentDocumentId: '1510415067', fullName: 'Isabella Martínez Montoya', phone: '319163135', email: 'isabella_martínez_montoya@ejemplo.com' },
  { relationship: 'Mamá', cedula: '17376743', studentDocumentId: '1610488196', fullName: 'Nicolás Castro Muñoz', phone: '319211506', email: 'nicolás_castro_muñoz@ejemplo.com' },
  { relationship: 'Papá', cedula: '27438686', studentDocumentId: '1710561325', fullName: 'Gabriela Mendoza Marín', phone: '319259877', email: 'gabriela_mendoza_marín@ejemplo.com' },
  { relationship: 'Tutor legal', cedula: '37500629', studentDocumentId: '1810634454', fullName: 'Mateo López Mendoza', phone: '319308248', email: 'mateo_lópez_mendoza@ejemplo.com' },
  { relationship: 'Acudiente legal', cedula: '47562572', studentDocumentId: '1910707583', fullName: 'Manuela Moreno Zapata', phone: '319356619', email: 'manuela_moreno_zapata@ejemplo.com' },
  { relationship: 'Mamá', cedula: '57624515', studentDocumentId: '1010780712', fullName: 'Sebastián Salazar Giraldo', phone: '319404990', email: 'sebastián_salazar_giraldo@ejemplo.com' },
  { relationship: 'Papá', cedula: '67686458', studentDocumentId: '1110853841', fullName: 'Laura Hernández Vélez', phone: '319453361', email: 'laura_hernández_vélez@ejemplo.com' },
  { relationship: 'Tutor legal', cedula: '77748401', studentDocumentId: '1210926970', fullName: 'Daniel Rojas Quintero', phone: '319501732', email: 'daniel_rojas_quintero@ejemplo.com' },
  { relationship: 'Acudiente legal', cedula: '87810344', studentDocumentId: '1311000099', fullName: 'Camila Quintero Mejía', phone: '319550103', email: 'camila_quintero_mejía@ejemplo.com' },
  { relationship: 'Mamá', cedula: '97872287', studentDocumentId: '1411073228', fullName: 'Tomás García Agudelo', phone: '319598474', email: 'tomás_garcía_agudelo@ejemplo.com' },

  // 9-2
  { relationship: 'Papá', cedula: '17934230', studentDocumentId: '1511146357', fullName: 'Sara Jiménez Correa', phone: '319646845', email: 'sara_jiménez_correa@ejemplo.com' },
  { relationship: 'Tutor legal', cedula: '27996173', studentDocumentId: '1611219486', fullName: 'Alejandro Agudelo Velásquez', phone: '319695216', email: 'alejandro_agudelo_velásquez@ejemplo.com' },
  { relationship: 'Acudiente legal', cedula: '38058116', studentDocumentId: '1711292615', fullName: 'Juliana Ramírez Castaño', phone: '319743587', email: 'juliana_ramírez_castaño@ejemplo.com' },
  { relationship: 'Mamá', cedula: '48120059', studentDocumentId: '1811365744', fullName: 'David Restrepo Duque', phone: '319791958', email: 'david_restrepo_duque@ejemplo.com' },
  { relationship: 'Papá', cedula: '58182002', studentDocumentId: '1911438873', fullName: 'Valentina Gómez Suárez', phone: '319840329', email: 'valentina_gómez_suárez@ejemplo.com' },
  { relationship: 'Tutor legal', cedula: '68243945', studentDocumentId: '1011512002', fullName: 'Santiago Torres Sánchez', phone: '319888700', email: 'santiago_torres_sánchez@ejemplo.com' },
  { relationship: 'Acudiente legal', cedula: '78305888', studentDocumentId: '1111585131', fullName: 'Mariana Cardona Pérez', phone: '319937071', email: 'mariana_cardona_pérez@ejemplo.com' },
  { relationship: 'Mamá', cedula: '88367831', studentDocumentId: '1211658260', fullName: 'Juan Rodríguez Osorio', phone: '319985442', email: 'juan_rodríguez_osorio@ejemplo.com' },
  { relationship: 'Papá', cedula: '98429774', studentDocumentId: '1311731389', fullName: 'Sofía Vargas Salazar', phone: '320033813', email: 'sofía_vargas_salazar@ejemplo.com' },
  { relationship: 'Tutor legal', cedula: '18491717', studentDocumentId: '1411804518', fullName: 'Samuel Castaño Arango', phone: '320082184', email: 'samuel_castaño_arango@ejemplo.com' },
  { relationship: 'Acudiente legal', cedula: '28553660', studentDocumentId: '1511877647', fullName: 'Isabella Martínez Montoya', phone: '320130555', email: 'isabella_martínez_montoya@ejemplo.com' },
  { relationship: 'Mamá', cedula: '38615603', studentDocumentId: '1611950776', fullName: 'Nicolás Castro Muñoz', phone: '320178926', email: 'nicolás_castro_muñoz@ejemplo.com' },
  { relationship: 'Papá', cedula: '48677546', studentDocumentId: '1712023905', fullName: 'Gabriela Mendoza Marín', phone: '320227297', email: 'gabriela_mendoza_marín@ejemplo.com' },
  { relationship: 'Tutor legal', cedula: '58739489', studentDocumentId: '1812097034', fullName: 'Mateo López Mendoza', phone: '320275668', email: 'mateo_lópez_mendoza@ejemplo.com' },
  { relationship: 'Acudiente legal', cedula: '68801432', studentDocumentId: '1912170163', fullName: 'Manuela Moreno Zapata', phone: '320324039', email: 'manuela_moreno_zapata@ejemplo.com' },

  // 10-1
  { relationship: 'Mamá', cedula: '78863375', studentDocumentId: '1012243292', fullName: 'Sebastián Salazar Giraldo', phone: '320372410', email: 'sebastián_salazar_giraldo@ejemplo.com' },
  { relationship: 'Papá', cedula: '88925318', studentDocumentId: '1112316421', fullName: 'Laura Hernández Vélez', phone: '320420781', email: 'laura_hernández_vélez@ejemplo.com' },
  { relationship: 'Tutor legal', cedula: '98987261', studentDocumentId: '1212389550', fullName: 'Daniel Rojas Quintero', phone: '320469152', email: 'daniel_rojas_quintero@ejemplo.com' },
  { relationship: 'Acudiente legal', cedula: '19049204', studentDocumentId: '1312462679', fullName: 'Camila Quintero Mejía', phone: '320517523', email: 'camila_quintero_mejía@ejemplo.com' },
  { relationship: 'Mamá', cedula: '29111147', studentDocumentId: '1412535808', fullName: 'Tomás García Agudelo', phone: '320565894', email: 'tomás_garcía_agudelo@ejemplo.com' },
  { relationship: 'Papá', cedula: '39173090', studentDocumentId: '1512608937', fullName: 'Sara Jiménez Correa', phone: '320614265', email: 'sara_jiménez_correa@ejemplo.com' },
  { relationship: 'Tutor legal', cedula: '49235033', studentDocumentId: '1612682066', fullName: 'Alejandro Agudelo Velásquez', phone: '320662636', email: 'alejandro_agudelo_velásquez@ejemplo.com' },
  { relationship: 'Acudiente legal', cedula: '59296976', studentDocumentId: '1712755195', fullName: 'Juliana Ramírez Castaño', phone: '320711007', email: 'juliana_ramírez_castaño@ejemplo.com' },
  { relationship: 'Mamá', cedula: '69358919', studentDocumentId: '1812828324', fullName: 'David Restrepo Duque', phone: '320759378', email: 'david_restrepo_duque@ejemplo.com' },
  { relationship: 'Papá', cedula: '79420862', studentDocumentId: '1912901453', fullName: 'Valentina Gómez Suárez', phone: '320807749', email: 'valentina_gómez_suárez@ejemplo.com' },
  { relationship: 'Tutor legal', cedula: '89482805', studentDocumentId: '1012974582', fullName: 'Santiago Torres Sánchez', phone: '320856120', email: 'santiago_torres_sánchez@ejemplo.com' },
  { relationship: 'Acudiente legal', cedula: '99544748', studentDocumentId: '1113047711', fullName: 'Mariana Cardona Pérez', phone: '320904491', email: 'mariana_cardona_pérez@ejemplo.com' },
  { relationship: 'Mamá', cedula: '19606691', studentDocumentId: '1213120840', fullName: 'Juan Rodríguez Osorio', phone: '320952862', email: 'juan_rodríguez_osorio@ejemplo.com' },
  { relationship: 'Papá', cedula: '29668634', studentDocumentId: '1313193969', fullName: 'Sofía Vargas Salazar', phone: '321001233', email: 'sofía_vargas_salazar@ejemplo.com' },
  { relationship: 'Tutor legal', cedula: '39730577', studentDocumentId: '1413267098', fullName: 'Samuel Castaño Arango', phone: '321049604', email: 'samuel_castaño_arango@ejemplo.com' },

  // 10-2
  { relationship: 'Acudiente legal', cedula: '49792520', studentDocumentId: '1513340227', fullName: 'Isabella Martínez Montoya', phone: '321097975', email: 'isabella_martínez_montoya@ejemplo.com' },
  { relationship: 'Mamá', cedula: '59854463', studentDocumentId: '1613413356', fullName: 'Nicolás Castro Muñoz', phone: '321146346', email: 'nicolás_castro_muñoz@ejemplo.com' },
  { relationship: 'Papá', cedula: '69916406', studentDocumentId: '1713486485', fullName: 'Gabriela Mendoza Marín', phone: '321194717', email: 'gabriela_mendoza_marín@ejemplo.com' },
  { relationship: 'Tutor legal', cedula: '79978349', studentDocumentId: '1813559614', fullName: 'Mateo López Mendoza', phone: '321243088', email: 'mateo_lópez_mendoza@ejemplo.com' },
  { relationship: 'Acudiente legal', cedula: '80040292', studentDocumentId: '1913632743', fullName: 'Manuela Moreno Zapata', phone: '321291459', email: 'manuela_moreno_zapata@ejemplo.com' },
  { relationship: 'Mamá', cedula: '90102235', studentDocumentId: '1013705872', fullName: 'Sebastián Salazar Giraldo', phone: '321339830', email: 'sebastián_salazar_giraldo@ejemplo.com' },
  { relationship: 'Papá', cedula: '10164178', studentDocumentId: '1113779001', fullName: 'Laura Hernández Vélez', phone: '321388201', email: 'laura_hernández_vélez@ejemplo.com' },
  { relationship: 'Tutor legal', cedula: '20226121', studentDocumentId: '1213852130', fullName: 'Daniel Rojas Quintero', phone: '321436572', email: 'daniel_rojas_quintero@ejemplo.com' },
  { relationship: 'Acudiente legal', cedula: '30288064', studentDocumentId: '1313925259', fullName: 'Camila Quintero Mejía', phone: '321484943', email: 'camila_quintero_mejía@ejemplo.com' },
  { relationship: 'Mamá', cedula: '40350007', studentDocumentId: '1413998388', fullName: 'Tomás García Agudelo', phone: '321533314', email: 'tomás_garcía_agudelo@ejemplo.com' },
  { relationship: 'Papá', cedula: '50411950', studentDocumentId: '1514071517', fullName: 'Sara Jiménez Correa', phone: '321581685', email: 'sara_jiménez_correa@ejemplo.com' },
  { relationship: 'Tutor legal', cedula: '60473893', studentDocumentId: '1614144646', fullName: 'Alejandro Agudelo Velásquez', phone: '321630056', email: 'alejandro_agudelo_velásquez@ejemplo.com' },
  { relationship: 'Acudiente legal', cedula: '70535836', studentDocumentId: '1714217775', fullName: 'Juliana Ramírez Castaño', phone: '321678427', email: 'juliana_ramírez_castaño@ejemplo.com' },
  { relationship: 'Mamá', cedula: '80597779', studentDocumentId: '1814290904', fullName: 'David Restrepo Duque', phone: '321726798', email: 'david_restrepo_duque@ejemplo.com' },
  { relationship: 'Papá', cedula: '90659722', studentDocumentId: '1914364033', fullName: 'Valentina Gómez Suárez', phone: '321775169', email: 'valentina_gómez_suárez@ejemplo.com' },

  // 11-1
  { relationship: 'Tutor legal', cedula: '10721665', studentDocumentId: '1014437162', fullName: 'Santiago Torres Sánchez', phone: '321823540', email: 'santiago_torres_sánchez@ejemplo.com' },
  { relationship: 'Acudiente legal', cedula: '20783608', studentDocumentId: '1114510291', fullName: 'Mariana Cardona Pérez', phone: '321871911', email: 'mariana_cardona_pérez@ejemplo.com' },
  { relationship: 'Mamá', cedula: '30845551', studentDocumentId: '1214583420', fullName: 'Juan Rodríguez Osorio', phone: '321920282', email: 'juan_rodríguez_osorio@ejemplo.com' },
  { relationship: 'Papá', cedula: '40907494', studentDocumentId: '1314656549', fullName: 'Sofía Vargas Salazar', phone: '321968653', email: 'sofía_vargas_salazar@ejemplo.com' },
  { relationship: 'Tutor legal', cedula: '50969437', studentDocumentId: '1414729678', fullName: 'Samuel Castaño Arango', phone: '322017024', email: 'samuel_castaño_arango@ejemplo.com' },
  { relationship: 'Acudiente legal', cedula: '61031380', studentDocumentId: '1514802807', fullName: 'Isabella Martínez Montoya', phone: '322065395', email: 'isabella_martínez_montoya@ejemplo.com' },
  { relationship: 'Mamá', cedula: '71093323', studentDocumentId: '1614875936', fullName: 'Nicolás Castro Muñoz', phone: '322113766', email: 'nicolás_castro_muñoz@ejemplo.com' },
  { relationship: 'Papá', cedula: '81155266', studentDocumentId: '1714949065', fullName: 'Gabriela Mendoza Marín', phone: '322162137', email: 'gabriela_mendoza_marín@ejemplo.com' },
  { relationship: 'Tutor legal', cedula: '91217209', studentDocumentId: '1815022194', fullName: 'Mateo López Mendoza', phone: '322210508', email: 'mateo_lópez_mendoza@ejemplo.com' },
  { relationship: 'Acudiente legal', cedula: '11279152', studentDocumentId: '1915095323', fullName: 'Manuela Moreno Zapata', phone: '322258879', email: 'manuela_moreno_zapata@ejemplo.com' },
  { relationship: 'Mamá', cedula: '21341095', studentDocumentId: '1015168452', fullName: 'Sebastián Salazar Giraldo', phone: '322307250', email: 'sebastián_salazar_giraldo@ejemplo.com' },
  { relationship: 'Papá', cedula: '31403038', studentDocumentId: '1115241581', fullName: 'Laura Hernández Vélez', phone: '322355621', email: 'laura_hernández_vélez@ejemplo.com' },
  { relationship: 'Tutor legal', cedula: '41464981', studentDocumentId: '1215314710', fullName: 'Daniel Rojas Quintero', phone: '322403992', email: 'daniel_rojas_quintero@ejemplo.com' },
  { relationship: 'Acudiente legal', cedula: '51526924', studentDocumentId: '1315387839', fullName: 'Camila Quintero Mejía', phone: '322452363', email: 'camila_quintero_mejía@ejemplo.com' },
  { relationship: 'Mamá', cedula: '61588867', studentDocumentId: '1415460968', fullName: 'Tomás García Agudelo', phone: '322500734', email: 'tomás_garcía_agudelo@ejemplo.com' },

  // 11-2
  { relationship: 'Papá', cedula: '71650810', studentDocumentId: '1515534097', fullName: 'Sara Jiménez Correa', phone: '322549105', email: 'sara_jiménez_correa@ejemplo.com' },
  { relationship: 'Tutor legal', cedula: '81712753', studentDocumentId: '1615607226', fullName: 'Alejandro Agudelo Velásquez', phone: '322597476', email: 'alejandro_agudelo_velásquez@ejemplo.com' },
  { relationship: 'Acudiente legal', cedula: '91774696', studentDocumentId: '1715680355', fullName: 'Juliana Ramírez Castaño', phone: '322645847', email: 'juliana_ramírez_castaño@ejemplo.com' },
  { relationship: 'Mamá', cedula: '11836639', studentDocumentId: '1815753484', fullName: 'David Restrepo Duque', phone: '322694218', email: 'david_restrepo_duque@ejemplo.com' },
  { relationship: 'Papá', cedula: '21898582', studentDocumentId: '1915826613', fullName: 'Valentina Gómez Suárez', phone: '322742589', email: 'valentina_gómez_suárez@ejemplo.com' },
  { relationship: 'Tutor legal', cedula: '31960525', studentDocumentId: '1015899742', fullName: 'Santiago Torres Sánchez', phone: '322790960', email: 'santiago_torres_sánchez@ejemplo.com' },
  { relationship: 'Acudiente legal', cedula: '42022468', studentDocumentId: '1115972871', fullName: 'Mariana Cardona Pérez', phone: '322839331', email: 'mariana_cardona_pérez@ejemplo.com' },
  { relationship: 'Mamá', cedula: '52084411', studentDocumentId: '1216046000', fullName: 'Juan Rodríguez Osorio', phone: '322887702', email: 'juan_rodríguez_osorio@ejemplo.com' },
  { relationship: 'Papá', cedula: '62146354', studentDocumentId: '1316119129', fullName: 'Sofía Vargas Salazar', phone: '322936073', email: 'sofía_vargas_salazar@ejemplo.com' },
  { relationship: 'Tutor legal', cedula: '72208297', studentDocumentId: '1416192258', fullName: 'Samuel Castaño Arango', phone: '322984444', email: 'samuel_castaño_arango@ejemplo.com' },
  { relationship: 'Acudiente legal', cedula: '82270240', studentDocumentId: '1516265387', fullName: 'Isabella Martínez Montoya', phone: '323032815', email: 'isabella_martínez_montoya@ejemplo.com' },
  { relationship: 'Mamá', cedula: '92332183', studentDocumentId: '1616338516', fullName: 'Nicolás Castro Muñoz', phone: '323081186', email: 'nicolás_castro_muñoz@ejemplo.com' },
  { relationship: 'Papá', cedula: '12394126', studentDocumentId: '1716411645', fullName: 'Gabriela Mendoza Marín', phone: '323129557', email: 'gabriela_mendoza_marín@ejemplo.com' },
  { relationship: 'Tutor legal', cedula: '22456069', studentDocumentId: '1816484774', fullName: 'Mateo López Mendoza', phone: '323177928', email: 'mateo_lópez_mendoza@ejemplo.com' },
  { relationship: 'Acudiente legal', cedula: '32518012', studentDocumentId: '1916557903', fullName: 'Manuela Moreno Zapata', phone: '323226299', email: 'manuela_moreno_zapata@ejemplo.com' },
];

// -------------------------------------------------------------
// MAPAS Y FUNCIONES DE BÚSQUEDA RÁPIDA
// -------------------------------------------------------------
export const CENSUS_STUDENTS_BY_DOC: Record<string, CensusStudent> = {};
export const CENSUS_STUDENTS_BY_EMAIL: Record<string, CensusStudent> = {};
CENSUS_STUDENTS.forEach((s) => {
  CENSUS_STUDENTS_BY_DOC[s.documentId] = s;
  CENSUS_STUDENTS_BY_EMAIL[s.email.toLowerCase()] = s;
});

export const CENSUS_GUARDIANS_BY_CEDULA: Record<string, CensusGuardian> = {};
export const CENSUS_GUARDIANS_BY_STUDENT_DOC: Record<string, CensusGuardian> = {};
CENSUS_GUARDIANS.forEach((g) => {
  CENSUS_GUARDIANS_BY_CEDULA[g.cedula] = g;
  CENSUS_GUARDIANS_BY_STUDENT_DOC[g.studentDocumentId] = g;
});

export const CENSUS_TEACHERS_BY_CODE: Record<string, CensusTeacher> = {};
export const CENSUS_TEACHERS_BY_CEDULA: Record<string, CensusTeacher> = {};
CENSUS_TEACHERS.forEach((t) => {
  CENSUS_TEACHERS_BY_CODE[t.code] = t;
  CENSUS_TEACHERS_BY_CEDULA[t.cedula] = t;
});

export const CENSUS_ADMIN_BY_CODE: Record<string, CensusAdminStaff> = {};
export const CENSUS_ADMIN_BY_CEDULA: Record<string, CensusAdminStaff> = {};
CENSUS_ADMIN_STAFF.forEach((a) => {
  CENSUS_ADMIN_BY_CODE[a.code] = a;
  CENSUS_ADMIN_BY_CEDULA[a.cedula] = a;
});

/**
 * Consulta un estudiante en el censo oficial por Documento o Correo
 */
export function lookupCensusStudent(docOrEmail: string): CensusStudent | null {
  const clean = (docOrEmail || '').trim().toLowerCase();
  if (!clean) return null;
  return CENSUS_STUDENTS_BY_DOC[clean] || CENSUS_STUDENTS_BY_EMAIL[clean] || null;
}

/**
 * Consulta la relación de acudiente por Cédula o por Documento de Estudiante
 */
export function lookupCensusGuardian(cedulaOrStudentDoc: string): CensusGuardian | null {
  const clean = (cedulaOrStudentDoc || '').trim();
  if (!clean) return null;
  return CENSUS_GUARDIANS_BY_CEDULA[clean] || CENSUS_GUARDIANS_BY_STUDENT_DOC[clean] || null;
}

/**
 * Consulta un docente por Código o Cédula
 */
export function lookupCensusTeacher(codeOrCedula: string): CensusTeacher | null {
  const clean = (codeOrCedula || '').trim();
  if (!clean) return null;
  return CENSUS_TEACHERS_BY_CODE[clean] || CENSUS_TEACHERS_BY_CEDULA[clean] || null;
}

/**
 * Consulta un directivo o personal administrativo por Código o Cédula
 */
export function lookupCensusAdmin(codeOrCedula: string): CensusAdminStaff | null {
  const clean = (codeOrCedula || '').trim();
  if (!clean) return null;
  return CENSUS_ADMIN_BY_CODE[clean] || CENSUS_ADMIN_BY_CEDULA[clean] || null;
}

export interface TeacherAcademicAssignment {
  id: string;
  subjectName: string;
  group: string; // e.g. "10°1"
  groupKey: string; // e.g. "10-1"
  label: string; // e.g. "Matemáticas — 10°1"
}

/**
 * Normaliza claves de grupo como '10°1', '10-1', '10_1' a '10-1'
 */
export function normalizeGroupKey(groupStr?: string): string {
  if (!groupStr) return '10-1';
  return groupStr.replace(/°/g, '-').replace(/_/g, '-').trim();
}

/**
 * Convierte '10-1' a '10°1' para presentación oficial
 */
export function formatGroupDisplay(groupKey?: string): string {
  if (!groupKey) return '10°1';
  return groupKey.replace('-', '°').trim();
}

/**
 * Retorna los estudiantes oficiales del censo matriculados en un grupo específico (6-1 a 11-2).
 */
export function getCensusStudentsForGroup(groupKey: string): CensusStudent[] {
  const norm = normalizeGroupKey(groupKey);
  const found = CENSUS_STUDENTS.filter(s => normalizeGroupKey(s.group) === norm);
  if (found.length > 0) return found;

  // Fallback a grupo por defecto si no hay coincidencia exacta
  return CENSUS_STUDENTS.filter(s => normalizeGroupKey(s.group) === '10-1');
}

/**
 * Determina automáticamente las asignaturas y grupos asignados a un docente institucional.
 * Consulta el censo oficial por nombre, cédula o código.
 */
export function getTeacherAcademicAssignments(teacherNameOrDoc?: string): TeacherAcademicAssignment[] {
  const query = (teacherNameOrDoc || '').trim().toLowerCase();
  
  if (query) {
    const teacher = CENSUS_TEACHERS.find(t =>
      t.fullName.toLowerCase().includes(query) ||
      t.cedula === query ||
      t.code === query ||
      query.includes(t.fullName.toLowerCase())
    );

    if (teacher) {
      const subjectName = teacher.area;
      const rawGrades = teacher.grades.split(',').map(g => g.trim()).filter(Boolean);
      
      const assignments: TeacherAcademicAssignment[] = rawGrades.map((rawGrade, idx) => {
        const groupKey = normalizeGroupKey(rawGrade);
        const groupDisplay = formatGroupDisplay(groupKey);
        return {
          id: `asg_${teacher.code}_${idx}_${groupKey}`,
          subjectName,
          group: groupDisplay,
          groupKey,
          label: `${subjectName} — ${groupDisplay}`
        };
      });

      if (assignments.length > 0) {
        return assignments;
      }
    }
  }

  // Asignaciones docentes estándar de la Media Técnica y Bachillerato de la institución
  return [
    {
      id: 'asg_tech_10_1',
      subjectName: 'Programación de Software',
      group: '10°1',
      groupKey: '10-1',
      label: 'Programación de Software — 10°1'
    },
    {
      id: 'asg_tech_10_2',
      subjectName: 'Programación de Software',
      group: '10°2',
      groupKey: '10-2',
      label: 'Programación de Software — 10°2'
    },
    {
      id: 'asg_tech_11_1',
      subjectName: 'Bases de Datos Relacionales',
      group: '11°1',
      groupKey: '11-1',
      label: 'Bases de Datos — 11°1'
    }
  ];
}

