export type UserRole = 'student' | 'teacher' | 'family' | 'estudiante' | 'docente' | 'acudiente';

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  createdAt: string;
  hasConfigured: boolean;
  institution?: string;
  gradeLevel?: string;
  studentCode?: string;
  shift?: string;
  subjectArea?: string;
  employeeId?: string;
  assignedGrades?: string;
  relationship?: string;
  representedStudentName?: string;
  representedStudentCode?: string;
  emergencyPhone?: string;
  phone?: string;
  avatarUrl?: string;
  subjects?: Subject[];
  assignments?: UpcomingAssignment[];
  students?: { id: string; name: string; grade: string }[];
}

export interface MessageThread {
  id: string;
  senderName: string;
  senderRole: string;
  senderAvatar?: string;
  subject: string;
  preview: string;
  time: string;
  unread: boolean;
  category: 'profesores' | 'citaciones' | 'circulares';
  messages: {
    id: string;
    sender: string;
    time: string;
    isSelf: boolean;
    text: string;
    attachment?: {
      name: string;
      size: string;
    };
  }[];
}

export type ActiveScreen = 
  | 'login'
  | 'student_dashboard'
  | 'student_assignment'
  | 'teacher_grades'
  | 'family_dashboard'
  | 'family_messaging';

export interface Subject {
  id: string;
  name: string;
  category: string;
  teacher: string;
  schedule: string;
  room: string;
  grade: number;
  progress: number;
  color: string;
  bgLight: string;
  icon: string;
  nextClass: string;
}

export interface UpcomingAssignment {
  id: string;
  subject: string;
  subjectColor: string;
  title: string;
  dueText: string;
  dueDate: string;
  type: string;
  typeIcon: string;
  points: string;
  urgency: 'urgente' | 'regular';
  borderAccent: string;
}

export interface StudentGradeRecord {
  id: string;
  name: string;
  matricula: string;
  avatar?: string;
  initials?: string;
  avatarBg?: string;
  parcial1: number;
  parcial2: number;
  taller1: number;
  serConv: number;
  definitiva?: number;
  observaciones?: string;
}

export interface NewsFeedItem {
  id: string;
  title: string;
  category: 'grades' | 'meetings' | 'notices';
  author: string;
  timeAgo: string;
  gradeBadge?: string;
  statusBadge?: {
    text: string;
    type: 'warning' | 'info' | 'mandatory';
  };
  content: string;
  icon: string;
  iconBg: string;
  iconColor: string;
  actionText?: string;
  actionSecondary?: string;
  attachment?: {
    name: string;
    size: string;
  };
  weight?: string;
}

export interface ChatMessage {
  id: string;
  sender: 'parent' | 'teacher';
  senderName: string;
  time: string;
  text: string;
  attachment?: {
    name: string;
    size: string;
    type: string;
  };
}

export interface ChatContact {
  id: string;
  name: string;
  role: string;
  category: 'docentes' | 'coordinacion' | 'orientacion';
  lastMessage: string;
  time: string;
  avatar?: string;
  initials?: string;
  online: boolean;
  statusText: string;
  unreadCount?: number;
  verified?: boolean;
}
