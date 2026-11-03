import React, { useState, useEffect, useMemo, useRef } from 'react';
import { UserProfile, ActiveScreen, InstitutionalPublicationDoc, PublicationSurveyOption } from '../types';
import { useThemeLanguage } from '../context/ThemeLanguageContext';
import {
  CENSUS_STUDENTS,
  CENSUS_GUARDIANS,
  CENSUS_TEACHERS,
  CENSUS_ADMIN_STAFF,
  getCensusStudentsForGroup,
  lookupCensusGuardian,
  formatGroupDisplay,
  normalizeGroupKey,
  CensusStudent
} from '../data/institutionalCensus';
import {
  fetchOfficialCirculars,
  saveOfficialCircular,
  deleteOfficialCircular,
  OfficialCircularItem
} from '../services/circularService';
import {
  fetchCommitteeMembers,
  saveCommitteeMember,
  deleteCommitteeMember,
  resetStatutoryCommitteeToDefaults,
  CommitteeMember
} from '../services/committeeService';
import {
  downloadCircularPDF,
  downloadManualDeConvivenciaPDF
} from '../services/circularPdfService';
import {
  fetchTeacherPublications,
  saveTeacherPublication,
  deleteTeacherPublication,
  togglePublicationStatus,
  fetchSurveyResults,
  SurveyResultsData
} from '../services/teacherForumService';
import {
  subscribeUserConversations,
  subscribeConversationMessages,
  sendChatMessage,
  getAuthorizedContactsForUser,
  deleteConversationForUser,
  markConversationAsRead,
  Conversation,
  ChatMessage,
  AuthorizedContact
} from '../services/messagingService';

interface AdminDashboardViewProps {
  currentUser: UserProfile;
  currentScreen?: ActiveScreen;
  onNavigate: (screen: ActiveScreen) => void;
  onLogout: () => void;
  onUpdateUser: (user: UserProfile) => void;
}

export const AdminDashboardView: React.FC<AdminDashboardViewProps> = ({
  currentUser,
  currentScreen,
  onNavigate
}) => {
  const { theme, language } = useThemeLanguage();
  const isDark = theme === 'dark';
  const isEn = language === 'en';

  // Synchronize top-level tab with currentScreen if accessed from navigation
  const initialTab = useMemo<'overview' | 'groups' | 'circulars' | 'forum' | 'chat'>(() => {
    if (currentScreen === 'admin_messaging') return 'chat';
    if (currentScreen === 'admin_forum') return 'forum';
    return 'overview';
  }, [currentScreen]);

  const [selectedTab, setSelectedTab] = useState<'overview' | 'groups' | 'circulars' | 'forum' | 'chat'>(initialTab);
  const [circularSubTab, setCircularSubTab] = useState<'circulars' | 'manual' | 'identity' | 'committee'>('circulars');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Sync tab if currentScreen changes externally
  useEffect(() => {
    if (currentScreen === 'admin_messaging') {
      setSelectedTab('chat');
    } else if (currentScreen === 'admin_forum') {
      setSelectedTab('forum');
    }
  }, [currentScreen]);

  // -------------------------------------------------------------------
  // 1. ESTADOS Y DATOS: GRUPOS ESCOLARES (EXACTAMENTE 15 ESTUDIANTES)
  // -------------------------------------------------------------------
  const schoolGroups = [
    { grade: '6°1', studentsCount: 15, director: 'Prof. Mario Restrepo', room: 'Aula 101', shift: '6:15 AM - 12:15 PM' },
    { grade: '6°2', studentsCount: 15, director: 'Prof. Martha Gómez', room: 'Aula 102', shift: '6:15 AM - 12:15 PM' },
    { grade: '7°1', studentsCount: 15, director: 'Prof. Carlos Builes', room: 'Aula 103', shift: '6:15 AM - 12:15 PM' },
    { grade: '7°2', studentsCount: 15, director: 'Prof. Sandra Pérez', room: 'Aula 104', shift: '6:15 AM - 12:15 PM' },
    { grade: '8°1', studentsCount: 15, director: 'Prof. Andrés Henao', room: 'Aula 201', shift: '6:15 AM - 12:15 PM' },
    { grade: '8°2', studentsCount: 15, director: 'Prof. Gloria Correa', room: 'Aula 202', shift: '6:15 AM - 12:15 PM' },
    { grade: '9°1', studentsCount: 15, director: 'Prof. Javier Ramírez', room: 'Aula 203', shift: '6:15 AM - 12:15 PM' },
    { grade: '9°2', studentsCount: 15, director: 'Prof. Marcela Díaz', room: 'Aula 204', shift: '6:15 AM - 12:15 PM' },
    { grade: '10°1', studentsCount: 15, director: 'Prof. Daniela Álvarez', room: 'Laboratorio TI 1', shift: '6:15 AM - 12:15 PM' },
    { grade: '10°2', studentsCount: 15, director: 'Prof. Fernando Villa', room: 'Aula 301', shift: '6:15 AM - 12:15 PM' },
    { grade: '11°1', studentsCount: 15, director: 'Prof. Ricardo Vélez', room: 'Aula 302', shift: '6:15 AM - 12:15 PM' },
    { grade: '11°2', studentsCount: 15, director: 'Prof. Patricia López', room: 'Laboratorio TI 2', shift: '6:15 AM - 12:15 PM' }
  ];

  // Selected Group modal for "Ver Estudiantes"
  const [selectedGroupModal, setSelectedGroupModal] = useState<string | null>(null);
  const [studentSearchQuery, setStudentSearchQuery] = useState('');

  // Retrieves exactly the 15 registered students for the selected group
  const currentGroupStudents = useMemo<CensusStudent[]>(() => {
    if (!selectedGroupModal) return [];
    const all = getCensusStudentsForGroup(selectedGroupModal);
    // Guarantee max 15 students as explicitly instructed for the demo project
    return all.slice(0, 15);
  }, [selectedGroupModal]);

  const filteredGroupStudents = useMemo(() => {
    if (!studentSearchQuery.trim()) return currentGroupStudents;
    const q = studentSearchQuery.toLowerCase();
    return currentGroupStudents.filter((s) =>
      s.fullName.toLowerCase().includes(q) || s.documentId.includes(q)
    );
  }, [currentGroupStudents, studentSearchQuery]);

  // Export group student list to CSV/Excel
  const handleExportGroupRoster = (groupName: string) => {
    try {
      const rows = [
        ['N°', 'NOMBRE COMPLETO', 'DOCUMENTO', 'CORREO INSTITUCIONAL', 'ACUDIENTE ASIGNADO', 'PARENTESCO', 'TELÉFONO ACUDIENTE', 'ESTADO'],
        ...currentGroupStudents.map((st, idx) => {
          const guardian = lookupCensusGuardian(st.documentId);
          return [
            String(idx + 1),
            st.fullName,
            st.documentId,
            st.email,
            guardian?.fullName || 'Acudiente registrado',
            guardian?.relationship || 'Acudiente legal',
            guardian?.phone || '300000000',
            'Matrícula Activa'
          ];
        })
      ];

      const csvContent = '\uFEFF' + rows.map((e) => e.map((val) => `"${val}"`).join(',')).join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `Lista_Estudiantes_${groupName.replace(/[^a-zA-Z0-9]/g, '_')}_2026.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast(isEn ? `Group roster exported for ${groupName}` : `Lista oficial de estudiantes de ${groupName} exportada exitosamente.`);
    } catch (e) {
      console.warn('Error exporting roster:', e);
      showToast(isEn ? 'Error exporting roster' : 'Error al exportar la lista de estudiantes.');
    }
  };

  // -------------------------------------------------------------------
  // 3 & 7. CIRCULARES, COMUNICADOS Y ACCIONES FUNCIONALES
  // -------------------------------------------------------------------
  const [circulars, setCirculars] = useState<OfficialCircularItem[]>([]);
  const [isLoadingCirculars, setIsLoadingCirculars] = useState(false);
  const [circularTargetFilter, setCircularTargetFilter] = useState('Todos');

  // New Circular modal form state
  const [showDraftModal, setShowDraftModal] = useState(false);
  const [draftTitle, setDraftTitle] = useState('');
  const [draftNumber, setDraftNumber] = useState('Circular No. 09');
  const [draftContent, setDraftContent] = useState('');
  const [draftAuthor, setDraftAuthor] = useState('Coordinación de Convivencia');
  const [draftTarget, setDraftTarget] = useState('Toda la Comunidad Educativa');
  const [draftHasAttachment, setDraftHasAttachment] = useState(true);
  const [isSubmittingCircular, setIsSubmittingCircular] = useState(false);

  const loadCirculars = async () => {
    setIsLoadingCirculars(true);
    try {
      const data = await fetchOfficialCirculars();
      setCirculars(data);
    } catch (err) {
      console.warn('Error loading circulars:', err);
    } finally {
      setIsLoadingCirculars(false);
    }
  };

  useEffect(() => {
    loadCirculars();
  }, []);

  const handleCreateCircular = async (status: 'published' | 'draft') => {
    if (!draftTitle.trim()) {
      showToast(isEn ? 'Please enter a title for the circular' : 'Por favor ingresa un título para la circular.');
      return;
    }
    if (!draftContent.trim()) {
      showToast(isEn ? 'Please write the content of the circular' : 'Por favor escribe el contenido de la circular.');
      return;
    }

    setIsSubmittingCircular(true);
    try {
      await saveOfficialCircular({
        title: draftTitle.trim(),
        circularNumber: draftNumber.trim() || 'Circular Oficial',
        content: draftContent.trim(),
        author: draftAuthor.trim() || 'Coordinación de Convivencia',
        target: draftTarget,
        hasAttachment: draftHasAttachment,
        status,
        date: new Date().toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' })
      });

      showToast(
        status === 'published'
          ? (isEn ? 'Official circular published to the entire school community.' : 'Circular oficial publicada para la comunidad educativa.')
          : (isEn ? 'Circular saved as draft.' : 'Circular guardada exitosamente como borrador.')
      );

      // Reset form and reload
      setDraftTitle('');
      setDraftContent('');
      setShowDraftModal(false);
      await loadCirculars();
    } catch (err) {
      console.warn('Error saving circular:', err);
      showToast(isEn ? 'Error saving circular' : 'Error al guardar la circular.');
    } finally {
      setIsSubmittingCircular(false);
    }
  };

  // Reenviar circular functional sharing (navigator.share / clipboard copy)
  const handleShareCircular = async (c: OfficialCircularItem) => {
    const shareText = `*${c.title}*\n${c.author} • Destinatarios: ${c.target}\nFecha: ${c.date}\n\n${c.content}\n\nInstitución Educativa Vallejuelos — Edulink School Platform`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: c.title,
          text: shareText,
          url: window.location.href
        });
        showToast(isEn ? 'Notice shared successfully.' : 'Circular compartida exitosamente.');
        return;
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          console.warn('Share API error, fallback to clipboard:', err);
        }
      }
    }

    try {
      await navigator.clipboard.writeText(shareText);
      showToast(isEn ? 'Circular content copied to clipboard to forward.' : 'Enlace y contenido de la circular copiados al portapapeles para reenviar.');
    } catch {
      showToast(isEn ? 'Could not copy to clipboard.' : 'No se pudo copiar al portapapeles.');
    }
  };

  // -------------------------------------------------------------------
  // 4. COMITÉ ESCOLAR DE CONVIVENCIA (PERSISTENCIA FIRESTORE)
  // -------------------------------------------------------------------
  const [committeeMembers, setCommitteeMembers] = useState<CommitteeMember[]>([]);
  const [isLoadingCommittee, setIsLoadingCommittee] = useState(false);
  const [editingMember, setEditingMember] = useState<CommitteeMember | null>(null);
  const [originalOccupant, setOriginalOccupant] = useState<{ name: string; email?: string; phone?: string; notes?: string } | null>(null);
  const [candidateSearch, setCandidateSearch] = useState('');
  const [showAddGuestModal, setShowAddGuestModal] = useState(false);
  const [guestRoleTitle, setGuestRoleTitle] = useState('');
  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [isSavingMember, setIsSavingMember] = useState(false);

  const handleOpenEditMember = (member: CommitteeMember) => {
    setEditingMember({ ...member });
    setOriginalOccupant({
      name: member.name,
      email: member.email,
      phone: member.phone,
      notes: member.notes
    });
    setCandidateSearch('');
  };

  const loadCommittee = async () => {
    setIsLoadingCommittee(true);
    try {
      const data = await fetchCommitteeMembers();
      setCommitteeMembers(data);
    } catch (err) {
      console.warn('Error loading committee members:', err);
    } finally {
      setIsLoadingCommittee(false);
    }
  };

  useEffect(() => {
    loadCommittee();
  }, []);

  const handleSaveMemberEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember) return;

    setIsSavingMember(true);
    try {
      await saveCommitteeMember(editingMember);
      showToast(isEn ? 'Committee member updated successfully.' : 'Integrante del comité actualizado correctamente.');
      setEditingMember(null);
      await loadCommittee();
    } catch (err) {
      console.warn('Error saving committee member:', err);
      showToast(isEn ? 'Error saving member' : 'Error al guardar el integrante.');
    } finally {
      setIsSavingMember(false);
    }
  };

  const handleAddGuestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestRoleTitle.trim() || !guestName.trim()) {
      showToast(isEn ? 'Please specify role representation and full name' : 'Por favor ingresa la representación y el nombre del invitado.');
      return;
    }

    setIsSavingMember(true);
    try {
      await saveCommitteeMember({
        id: `guest_${Date.now()}`,
        roleTitle: guestRoleTitle.trim(),
        name: guestName.trim(),
        phone: guestPhone.trim(),
        isCustomGuest: true
      });
      showToast(isEn ? 'Guest member added to coexistence committee.' : 'Invitado agregado al Comité Escolar de Convivencia.');
      setShowAddGuestModal(false);
      setGuestRoleTitle('');
      setGuestName('');
      setGuestPhone('');
      await loadCommittee();
    } catch (err) {
      console.warn('Error adding guest:', err);
      showToast(isEn ? 'Error adding guest' : 'Error al agregar invitado.');
    } finally {
      setIsSavingMember(false);
    }
  };

  const handleDeleteMember = async (memberId: string) => {
    try {
      await deleteCommitteeMember(memberId);
      showToast(isEn ? 'Committee record updated.' : 'Registro del comité actualizado.');
      await loadCommittee();
    } catch (err) {
      console.warn('Error removing committee member:', err);
    }
  };

  const handleResetOfficialCommittee = async () => {
    setIsSavingMember(true);
    try {
      await resetStatutoryCommitteeToDefaults();
      showToast(isEn ? 'Committee members restored to official institutional data.' : 'Integrantes del comité restablecidos con la base de datos institucional.');
      await loadCommittee();
    } catch (err) {
      console.warn('Error resetting committee:', err);
      showToast(isEn ? 'Error resetting committee' : 'Error al restablecer los integrantes.');
    } finally {
      setIsSavingMember(false);
    }
  };

  // -------------------------------------------------------------------
  // 5. FORO Y ENCUESTAS DEL COORDINADOR DE CONVIVENCIA
  // -------------------------------------------------------------------
  const [forumPublications, setForumPublications] = useState<InstitutionalPublicationDoc[]>([]);
  const [isLoadingForum, setIsLoadingForum] = useState(false);
  const [forumFilter, setForumFilter] = useState<'all' | 'forums' | 'surveys'>('all');
  const [showCreateForumModal, setShowCreateForumModal] = useState(false);
  const [viewingSurveyResultsPub, setViewingSurveyResultsPub] = useState<InstitutionalPublicationDoc | null>(null);
  const [surveyResultsData, setSurveyResultsData] = useState<SurveyResultsData | null>(null);
  const [isLoadingSurveyResults, setIsLoadingSurveyResults] = useState(false);

  // Create Forum Form
  const [forumType, setForumType] = useState<'forum' | 'survey'>('forum');
  const [forumTitle, setForumTitle] = useState('');
  const [forumContent, setForumContent] = useState('');
  const [forumCategory, setForumCategory] = useState<'convivencia' | 'academico' | 'general' | 'evento'>('convivencia');
  const [forumTargetGroup, setForumTargetGroup] = useState<'all' | 'estudiantes' | 'acudientes' | 'docentes'>('all');
  const [forumSurveyQuestion, setForumSurveyQuestion] = useState('');
  const [forumSurveyOptions, setForumSurveyOptions] = useState<string[]>(['De acuerdo', 'En desacuerdo']);
  const [isSavingForum, setIsSavingForum] = useState(false);

  const loadForumPublications = async () => {
    setIsLoadingForum(true);
    try {
      const data = await fetchTeacherPublications();
      setForumPublications(data);
    } catch (err) {
      console.warn('Error loading forum publications:', err);
    } finally {
      setIsLoadingForum(false);
    }
  };

  useEffect(() => {
    if (selectedTab === 'forum') {
      loadForumPublications();
    }
  }, [selectedTab]);

  const handleSaveForumPublication = async (statusVal: 'published' | 'draft') => {
    if (!forumTitle.trim()) {
      showToast(isEn ? 'Please enter a title' : 'Por favor ingresa un título.');
      return;
    }
    if (!forumContent.trim()) {
      showToast(isEn ? 'Please enter a description' : 'Por favor ingresa una descripción o contenido.');
      return;
    }
    if (forumType === 'survey' && !forumSurveyQuestion.trim()) {
      showToast(isEn ? 'Please enter the survey question' : 'Por favor escribe la pregunta de la encuesta.');
      return;
    }

    setIsSavingForum(true);
    try {
      const optionsObjects: PublicationSurveyOption[] = forumSurveyOptions
        .filter((o) => o.trim())
        .map((text, idx) => ({
          id: `opt_${idx + 1}`,
          text: text.trim(),
          votesCount: 0
        }));

      await saveTeacherPublication({
        title: forumTitle.trim(),
        content: forumContent.trim(),
        category: forumCategory,
        authorName: currentUser.fullName || 'Coordinación de Convivencia',
        authorRole: 'coordinador',
        authorEmail: currentUser.email,
        targetGrades: [forumTargetGroup],
        hasSurvey: forumType === 'survey',
        surveyQuestion: forumType === 'survey' ? forumSurveyQuestion.trim() : undefined,
        surveyOptions: forumType === 'survey' ? optionsObjects : undefined,
        status: statusVal,
        createdAt: new Date().toISOString()
      });

      showToast(
        statusVal === 'published'
          ? (isEn ? 'Publication submitted to students and school community.' : 'Publicación enviada a estudiantes y la comunidad educativa.')
          : (isEn ? 'Publication saved as draft.' : 'Publicación guardada como borrador.')
      );

      // Reset
      setShowCreateForumModal(false);
      setForumTitle('');
      setForumContent('');
      setForumSurveyQuestion('');
      setForumSurveyOptions(['De acuerdo', 'En desacuerdo']);
      await loadForumPublications();
    } catch (err) {
      console.warn('Error saving forum publication:', err);
      showToast(isEn ? 'Error saving publication' : 'Error al guardar la publicación.');
    } finally {
      setIsSavingForum(false);
    }
  };

  const handleOpenSurveyResults = async (pub: InstitutionalPublicationDoc) => {
    setViewingSurveyResultsPub(pub);
    setIsLoadingSurveyResults(true);
    try {
      const res = await fetchSurveyResults(pub);
      setSurveyResultsData(res);
    } catch (err) {
      console.warn('Error loading survey results:', err);
    } finally {
      setIsLoadingSurveyResults(false);
    }
  };

  const handleTogglePubStatus = async (pub: InstitutionalPublicationDoc) => {
    try {
      const newStatus = await togglePublicationStatus(pub.id, pub.status);
      showToast(newStatus === 'draft' ? 'Participación cerrada exitosamente.' : 'Participación abierta y activa.');
      await loadForumPublications();
    } catch (err) {
      console.warn('Error toggling status:', err);
    }
  };

  const handleDeletePublication = async (id: string) => {
    if (!window.confirm('¿Estás seguro de eliminar esta publicación institucional?')) return;
    try {
      await deleteTeacherPublication(id);
      showToast('Publicación eliminada correctamente.');
      await loadForumPublications();
    } catch (err) {
      console.warn('Error deleting publication:', err);
    }
  };

  // -------------------------------------------------------------------
  // 6. CHAT ONLINE CON ACUDIENTES (MENSAJERÍA BIDIRECCIONAL EN TIEMPO REAL)
  // -------------------------------------------------------------------
  const coordinatorId = currentUser.documentId || currentUser.id || 'coord-convivencia';
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isLoadingChatMessages, setIsLoadingChatMessages] = useState(false);
  const [authorizedContacts, setAuthorizedContacts] = useState<AuthorizedContact[]>([]);
  const [chatSearchText, setChatSearchText] = useState('');
  const [chatReplyText, setChatReplyText] = useState('');
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const chatMessagesEndRef = useRef<HTMLDivElement>(null);

  // Subscribe to coordinator conversations
  useEffect(() => {
    if (selectedTab !== 'chat') return;

    const unsubscribe = subscribeUserConversations(coordinatorId, (convs) => {
      setConversations(convs);
      if (convs.length > 0 && !selectedConvId) {
        setSelectedConvId(convs[0].id);
        markConversationAsRead(convs[0].id, coordinatorId);
      }
    });

    return () => unsubscribe();
  }, [coordinatorId, selectedConvId, selectedTab]);

  // Load authorized contacts (guardians and teachers)
  useEffect(() => {
    if (selectedTab === 'chat') {
      getAuthorizedContactsForUser(currentUser).then((contacts) => {
        setAuthorizedContacts(contacts);
      });
    }
  }, [currentUser, selectedTab]);

  // Subscribe to selected conversation messages
  useEffect(() => {
    if (selectedTab !== 'chat' || !selectedConvId) {
      setChatMessages([]);
      return;
    }

    markConversationAsRead(selectedConvId, coordinatorId);
    setIsLoadingChatMessages(true);
    const unsubscribe = subscribeConversationMessages(selectedConvId, (msgs) => {
      setChatMessages(msgs);
      setIsLoadingChatMessages(false);
      setTimeout(() => {
        chatMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    });

    return () => unsubscribe();
  }, [selectedConvId, coordinatorId, selectedTab]);

  const activeConversation = useMemo(() => {
    return conversations.find((c) => c.id === selectedConvId) || null;
  }, [conversations, selectedConvId]);

  const activeOtherParticipant = useMemo(() => {
    if (!activeConversation) return null;
    const participantsList = Object.values(activeConversation.participants || {}) as any[];
    return participantsList.find((p) => p && p.id !== coordinatorId) || null;
  }, [activeConversation, coordinatorId]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!chatReplyText.trim() || !activeOtherParticipant || isSendingMessage) return;

    const textToSend = chatReplyText.trim();
    setChatReplyText('');
    setIsSendingMessage(true);

    try {
      await sendChatMessage({
        sender: currentUser,
        recipient: {
          id: activeOtherParticipant.id,
          fullName: activeOtherParticipant.fullName,
          role: activeOtherParticipant.role,
          email: activeOtherParticipant.email,
          avatarUrl: activeOtherParticipant.avatarUrl || (activeOtherParticipant as any).avatar
        },
        text: textToSend
      });
    } catch (err) {
      console.warn('Error sending message:', err);
      showToast('Error al enviar el mensaje. Por favor intenta de nuevo.');
      setChatReplyText(textToSend);
    } finally {
      setIsSendingMessage(false);
    }
  };

  const handleStartNewChatWithContact = async (contact: AuthorizedContact) => {
    setShowNewChatModal(false);
    try {
      const msg = await sendChatMessage({
        sender: currentUser,
        recipient: contact,
        text: 'Cordial saludo institucional. Me comunico desde la Coordinación de Convivencia de la I.E. Vallejuelos.'
      });
      setSelectedConvId(msg.conversationId);
      showToast(`Conversación iniciada con ${contact.fullName}`);
    } catch (err) {
      console.warn('Error starting new chat:', err);
      showToast('No se pudo iniciar la conversación.');
    }
  };

  const handleDeleteConversation = async (convId: string) => {
    if (!window.confirm('¿Deseas archivar o eliminar esta conversación de tu bandeja?')) return;
    try {
      await deleteConversationForUser(convId, coordinatorId);
      if (selectedConvId === convId) {
        setSelectedConvId(null);
      }
      showToast('Conversación eliminada de tu bandeja.');
    } catch (err) {
      console.warn('Error deleting conversation:', err);
    }
  };

  return (
    <div className={`min-h-screen pb-16 transition-colors duration-200 ${
      isDark ? 'bg-slate-950 text-slate-100' : 'bg-[#f8f9ff] text-[#0b1c30]'
    }`}>
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 border border-emerald-500/50 text-emerald-300 px-5 py-3.5 rounded-2xl shadow-xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4">
          <span className="material-symbols-outlined text-[20px] text-emerald-400">check_circle</span>
          <span className="text-sm font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Hero Header for Coordinador de Convivencia */}
      <div className={`text-white py-10 px-4 sm:px-8 border-b shadow-sm ${
        isDark
          ? 'bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 border-emerald-900/40'
          : 'bg-gradient-to-r from-[#00288e] via-[#0038aa] to-[#0051d5] border-[#1e40af]'
      }`}>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white shrink-0 shadow-inner">
              <span className="material-symbols-outlined text-[34px]">verified_user</span>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-white text-xs font-bold uppercase tracking-wider">
                  {isEn ? 'Coexistence & Welfare Office' : 'Coordinación de Convivencia Escolar'}
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-400/20 text-emerald-200 text-xs font-bold flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse" />
                  {isEn ? 'Morning Shift: 6:15 AM - 12:15 PM' : 'Jornada Mañana: 6:15 AM - 12:15 PM'}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                {currentUser.fullName}
              </h1>
              <p className="text-sm text-white/80 mt-1">
                {currentUser.adminPosition || 'Coordinación de Convivencia'} • {currentUser.institution || 'Institución Educativa Vallejuelos'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="bg-white/10 backdrop-blur-sm border border-white/15 px-4 py-2.5 rounded-xl text-right">
              <span className="block text-xs text-white/70">{isEn ? 'Demonstration Roster' : 'Matrícula en Demostración'}</span>
              <span className="text-xl font-extrabold text-white">180 {isEn ? 'Students (15/group)' : 'Estudiantes (15/grupo)'}</span>
            </div>
            <div className="bg-white/10 backdrop-blur-sm border border-white/15 px-4 py-2.5 rounded-xl text-right">
              <span className="block text-xs text-white/70">{isEn ? 'Secondary Groups' : 'Grupos Oficiales'}</span>
              <span className="text-xl font-extrabold text-white">12 {isEn ? 'Groups (6°1 to 11°2)' : 'Grupos (6°1 a 11°2)'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 mt-8">
        {/* Navigation Tabs (Estudiantes y Certificados has been removed as required) */}
        <div className={`flex items-center gap-2 border-b pb-3 mb-8 overflow-x-auto ${
          isDark ? 'border-slate-800' : 'border-[#e5eeff]'
        }`}>
          <button
            onClick={() => { setSelectedTab('overview'); onNavigate('admin_dashboard'); }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
              selectedTab === 'overview'
                ? isDark ? 'bg-emerald-600 text-white shadow-sm' : 'bg-[#00288e] text-white shadow-sm'
                : isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-[#444653] hover:text-[#00288e] hover:bg-[#eff4ff]'
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">dashboard</span>
            <span>{isEn ? 'Institutional Overview' : 'Resumen Institucional'}</span>
          </button>

          <button
            onClick={() => { setSelectedTab('groups'); onNavigate('admin_dashboard'); }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
              selectedTab === 'groups'
                ? isDark ? 'bg-emerald-600 text-white shadow-sm' : 'bg-[#00288e] text-white shadow-sm'
                : isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-[#444653] hover:text-[#00288e] hover:bg-[#eff4ff]'
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">view_module</span>
            <span>{isEn ? 'Grade Structure (6th to 11th)' : 'Estructura de Grados (6° a 11°)'}</span>
          </button>

          <button
            onClick={() => { setSelectedTab('circulars'); onNavigate('admin_dashboard'); }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
              selectedTab === 'circulars'
                ? isDark ? 'bg-emerald-600 text-white shadow-sm' : 'bg-[#00288e] text-white shadow-sm'
                : isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-[#444653] hover:text-[#00288e] hover:bg-[#eff4ff]'
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">campaign</span>
            <span>{isEn ? 'Notices & Coexistence' : 'Circulares y Convivencia'}</span>
          </button>

          <button
            onClick={() => { setSelectedTab('forum'); onNavigate('admin_forum'); }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
              selectedTab === 'forum'
                ? isDark ? 'bg-emerald-600 text-white shadow-sm' : 'bg-[#00288e] text-white shadow-sm'
                : isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-[#444653] hover:text-[#00288e] hover:bg-[#eff4ff]'
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">forum</span>
            <span>{isEn ? 'Forums & Surveys' : 'Foro y Encuestas'}</span>
          </button>

          <button
            onClick={() => { setSelectedTab('chat'); onNavigate('admin_messaging'); }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer whitespace-nowrap relative ${
              selectedTab === 'chat'
                ? isDark ? 'bg-emerald-600 text-white shadow-sm' : 'bg-[#00288e] text-white shadow-sm'
                : isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-[#444653] hover:text-[#00288e] hover:bg-[#eff4ff]'
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">chat</span>
            <span>{isEn ? 'Family Online Chat' : 'Chat Online con Acudientes'}</span>
          </button>
        </div>

        {/* --------------------------------------------------------------- */}
        {/* TAB 1: OVERVIEW                                                 */}
        {/* --------------------------------------------------------------- */}
        {selectedTab === 'overview' && (
          <div className="flex flex-col gap-8 animate-in fade-in">
            {/* Quick Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              <div className={`p-5 rounded-2xl border shadow-xs flex items-center justify-between ${
                isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-[#e5eeff]'
              }`}>
                <div>
                  <span className={`text-xs font-bold uppercase tracking-wider block mb-1 ${
                    isDark ? 'text-slate-400' : 'text-[#757684]'
                  }`}>
                    {isEn ? 'Official School Shift' : 'Jornada Escolar Oficial'}
                  </span>
                  <span className={`text-lg font-bold ${isDark ? 'text-emerald-400' : 'text-[#00288e]'}`}>
                    6:15 AM - 12:15 PM
                  </span>
                  <span className="text-xs text-emerald-500 block mt-1 font-semibold">
                    {isEn ? 'Active Monday to Friday' : 'Activa de lunes a viernes'}
                  </span>
                </div>
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  isDark ? 'bg-emerald-950 text-emerald-400' : 'bg-[#eff4ff] text-[#00288e]'
                }`}>
                  <span className="material-symbols-outlined text-[24px]">schedule</span>
                </div>
              </div>

              <div className={`p-5 rounded-2xl border shadow-xs flex items-center justify-between ${
                isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-[#e5eeff]'
              }`}>
                <div>
                  <span className={`text-xs font-bold uppercase tracking-wider block mb-1 ${
                    isDark ? 'text-slate-400' : 'text-[#757684]'
                  }`}>
                    {isEn ? 'Teaching Faculty' : 'Cuerpo Docente'}
                  </span>
                  <span className={`text-2xl font-extrabold ${isDark ? 'text-white' : 'text-[#0b1c30]'}`}>
                    {CENSUS_TEACHERS.length} {isEn ? 'Teachers' : 'Docentes'}
                  </span>
                  <span className="text-xs text-cyan-400 block mt-1 font-semibold">
                    {isEn ? '100% assigned to gradebooks' : '100% asignados a planillas'}
                  </span>
                </div>
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  isDark ? 'bg-cyan-950 text-cyan-400' : 'bg-[#eff4ff] text-[#0051d5]'
                }`}>
                  <span className="material-symbols-outlined text-[24px]">co_present</span>
                </div>
              </div>

              <div className={`p-5 rounded-2xl border shadow-xs flex items-center justify-between ${
                isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-[#e5eeff]'
              }`}>
                <div>
                  <span className={`text-xs font-bold uppercase tracking-wider block mb-1 ${
                    isDark ? 'text-slate-400' : 'text-[#757684]'
                  }`}>
                    {isEn ? 'Grades and Groups' : 'Grados y Grupos'}
                  </span>
                  <span className={`text-2xl font-extrabold ${isDark ? 'text-white' : 'text-[#0b1c30]'}`}>
                    12 {isEn ? 'Groups' : 'Grupos'}
                  </span>
                  <span className={`text-xs block mt-1 font-semibold ${isDark ? 'text-slate-400' : 'text-[#757684]'}`}>
                    {isEn ? '6 grades divided in 2 groups' : '6 grados divididos en 2 grupos'}
                  </span>
                </div>
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  isDark ? 'bg-emerald-950 text-emerald-400' : 'bg-[#eff4ff] text-[#00288e]'
                }`}>
                  <span className="material-symbols-outlined text-[24px]">groups</span>
                </div>
              </div>

              <div className={`p-5 rounded-2xl border shadow-xs flex items-center justify-between ${
                isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-[#e5eeff]'
              }`}>
                <div>
                  <span className={`text-xs font-bold uppercase tracking-wider block mb-1 ${
                    isDark ? 'text-slate-400' : 'text-[#757684]'
                  }`}>
                    {isEn ? 'Demo Students' : 'Estudiantes en Demostración'}
                  </span>
                  <span className={`text-2xl font-extrabold ${isDark ? 'text-white' : 'text-[#0b1c30]'}`}>
                    180 {isEn ? 'Students' : 'Estudiantes'}
                  </span>
                  <span className="text-xs text-emerald-400 block mt-1 font-semibold">
                    {isEn ? 'Exactly 15 per group' : 'Exactamente 15 por grupo'}
                  </span>
                </div>
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  isDark ? 'bg-cyan-950 text-cyan-400' : 'bg-[#eff4ff] text-[#0051d5]'
                }`}>
                  <span className="material-symbols-outlined text-[24px]">family_restroom</span>
                </div>
              </div>
            </div>

            {/* Structure Summary & Quick Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className={`lg:col-span-2 rounded-2xl p-6 border shadow-xs ${
                isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-[#e5eeff]'
              }`}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-[#0b1c30]'}`}>
                    {isEn ? 'Group Distribution per Grade (15 students each)' : 'Distribución de Grupos por Grado (15 estudiantes c/u)'}
                  </h3>
                  <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-[#757684]'}`}>
                    {isEn ? 'Academic Year 2026' : 'Año Académico 2026'}
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {schoolGroups.map((g) => (
                    <div
                      key={g.grade}
                      onClick={() => { setSelectedGroupModal(g.grade); setStudentSearchQuery(''); }}
                      className={`p-3.5 border rounded-xl transition-all cursor-pointer ${
                        isDark
                          ? 'bg-slate-950/60 border-slate-800 hover:border-emerald-500 hover:bg-slate-900'
                          : 'bg-[#f8f9ff] border-[#e5eeff] hover:border-[#00288e] hover:bg-[#eff4ff]'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-base font-extrabold ${isDark ? 'text-emerald-400' : 'text-[#00288e]'}`}>
                          {g.grade}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold">
                          {g.studentsCount} {isEn ? 'stu.' : 'est.'}
                        </span>
                      </div>
                      <p className={`text-xs truncate ${isDark ? 'text-slate-300' : 'text-[#444653]'}`}>{g.director}</p>
                      <p className={`text-[11px] mt-1 ${isDark ? 'text-slate-500' : 'text-[#757684]'}`}>{g.room} • {g.shift}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className={`rounded-2xl p-6 border shadow-xs flex flex-col justify-between ${
                isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-[#e5eeff]'
              }`}>
                <div>
                  <h3 className={`text-lg font-bold mb-2 ${isDark ? 'text-white' : 'text-[#0b1c30]'}`}>
                    {isEn ? 'Coexistence Actions' : 'Acciones de Convivencia Escolar'}
                  </h3>
                  <p className={`text-xs leading-relaxed mb-4 ${isDark ? 'text-slate-400' : 'text-[#444653]'}`}>
                    {isEn
                      ? 'Tools for student coexistence, committee management, official notices, and family chat.'
                      : 'Herramientas de mediación escolar, gestión del Comité de Convivencia, comunicaciones y diálogo directo con acudientes.'}
                  </p>

                  <div className="flex flex-col gap-2.5">
                    <button
                      onClick={() => setSelectedTab('groups')}
                      className={`w-full text-left p-3 rounded-xl border transition-all flex items-center justify-between cursor-pointer ${
                        isDark
                          ? 'bg-slate-950 border-slate-800 hover:border-emerald-500'
                          : 'bg-[#f8f9ff] hover:bg-[#eff4ff] border-[#e5eeff] hover:border-[#00288e]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="material-symbols-outlined text-[20px] text-emerald-400">groups</span>
                        <span className={`text-xs font-bold ${isDark ? 'text-white' : 'text-[#0b1c30]'}`}>
                          {isEn ? 'View Students by Grade' : 'Ver Estudiantes por Grupo'}
                        </span>
                      </div>
                      <span className="material-symbols-outlined text-[18px] text-slate-500">chevron_right</span>
                    </button>

                    <button
                      onClick={() => { setSelectedTab('circulars'); setCircularSubTab('committee'); }}
                      className={`w-full text-left p-3 rounded-xl border transition-all flex items-center justify-between cursor-pointer ${
                        isDark
                          ? 'bg-slate-950 border-slate-800 hover:border-emerald-500'
                          : 'bg-[#f8f9ff] hover:bg-[#eff4ff] border-[#e5eeff] hover:border-[#00288e]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="material-symbols-outlined text-[20px] text-emerald-400">handshake</span>
                        <span className={`text-xs font-bold ${isDark ? 'text-white' : 'text-[#0b1c30]'}`}>
                          {isEn ? 'School Coexistence Committee' : 'Comité Escolar de Convivencia'}
                        </span>
                      </div>
                      <span className="material-symbols-outlined text-[18px] text-slate-500">chevron_right</span>
                    </button>

                    <button
                      onClick={() => { setSelectedTab('circulars'); setCircularSubTab('manual'); }}
                      className={`w-full text-left p-3 rounded-xl border transition-all flex items-center justify-between cursor-pointer ${
                        isDark
                          ? 'bg-slate-950 border-slate-800 hover:border-emerald-500'
                          : 'bg-[#f8f9ff] hover:bg-[#eff4ff] border-[#e5eeff] hover:border-[#00288e]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="material-symbols-outlined text-[20px] text-emerald-400">menu_book</span>
                        <span className={`text-xs font-bold ${isDark ? 'text-white' : 'text-[#0b1c30]'}`}>
                          {isEn ? 'Coexistence Manual (PDF)' : 'Manual de Convivencia Oficial'}
                        </span>
                      </div>
                      <span className="material-symbols-outlined text-[18px] text-slate-500">chevron_right</span>
                    </button>

                    <button
                      onClick={() => setSelectedTab('forum')}
                      className={`w-full text-left p-3 rounded-xl border transition-all flex items-center justify-between cursor-pointer ${
                        isDark
                          ? 'bg-slate-950 border-slate-800 hover:border-emerald-500'
                          : 'bg-[#f8f9ff] hover:bg-[#eff4ff] border-[#e5eeff] hover:border-[#00288e]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="material-symbols-outlined text-[20px] text-emerald-400">forum</span>
                        <span className={`text-xs font-bold ${isDark ? 'text-white' : 'text-[#0b1c30]'}`}>
                          {isEn ? 'Forums & Surveys Management' : 'Crear Foro o Encuesta'}
                        </span>
                      </div>
                      <span className="material-symbols-outlined text-[18px] text-slate-500">chevron_right</span>
                    </button>

                    <button
                      onClick={() => setSelectedTab('chat')}
                      className={`w-full text-left p-3 rounded-xl border transition-all flex items-center justify-between cursor-pointer ${
                        isDark
                          ? 'bg-slate-950 border-slate-800 hover:border-emerald-500'
                          : 'bg-[#f8f9ff] hover:bg-[#eff4ff] border-[#e5eeff] hover:border-[#00288e]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="material-symbols-outlined text-[20px] text-emerald-400">chat</span>
                        <span className={`text-xs font-bold ${isDark ? 'text-white' : 'text-[#0b1c30]'}`}>
                          {isEn ? 'Online Chat with Families' : 'Chat Online con Acudientes'}
                        </span>
                      </div>
                      <span className="material-symbols-outlined text-[18px] text-slate-500">chevron_right</span>
                    </button>
                  </div>
                </div>

                <div className={`mt-6 pt-4 border-t ${isDark ? 'border-slate-800' : 'border-[#e5eeff]'}`}>
                  <div className={`flex items-center gap-2 text-xs ${isDark ? 'text-slate-400' : 'text-[#757684]'}`}>
                    <span className="material-symbols-outlined text-[18px] text-emerald-400">security</span>
                    <span>{isEn ? 'Authenticated with Coexistence Coordination role' : 'Sesión activa: Coordinador(a) de Convivencia'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* --------------------------------------------------------------- */}
        {/* TAB 2: GROUPS (Estructura Oficial y Ver Estudiantes)            */}
        {/* --------------------------------------------------------------- */}
        {selectedTab === 'groups' && (
          <div className={`rounded-2xl p-6 sm:p-8 border shadow-xs animate-in fade-in ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-[#e5eeff]'
          }`}>
            <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b ${
              isDark ? 'border-slate-800' : 'border-[#e5eeff]'
            }`}>
              <div>
                <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-[#0b1c30]'}`}>
                  {isEn ? 'Official Structure of Grades & Groups' : 'Estructura Oficial de Grados y Grupos'}
                </h2>
                <p className={`text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-[#444653]'}`}>
                  {isEn
                    ? '12 official secondary groups (6°1 to 11°2), exactly 15 students per group for demonstration in the institutional database.'
                    : 'Los 12 grupos oficiales de secundaria (6°1 a 11°2), con exactamente 15 estudiantes por grupo para la demostración en la base de datos institucional.'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-bold text-xs flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm">database</span>
                  <span>15 Estudiantes por grupo</span>
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
              {schoolGroups.map((group) => (
                <div
                  key={group.grade}
                  className={`p-5 rounded-xl border flex flex-col justify-between transition-all ${
                    isDark
                      ? 'bg-slate-950 border-slate-800 hover:border-emerald-500'
                      : 'bg-[#f8f9ff] border-[#e5eeff] hover:shadow-sm'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-2xl font-extrabold ${isDark ? 'text-emerald-400' : 'text-[#00288e]'}`}>
                        {isEn ? `Grade ${group.grade}` : `Grado ${group.grade}`}
                      </span>
                      <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold">
                        {group.studentsCount} {isEn ? 'Students' : 'Alumnos'}
                      </span>
                    </div>
                    <div className={`space-y-1.5 text-xs mt-3 ${isDark ? 'text-slate-300' : 'text-[#444653]'}`}>
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-[16px] text-emerald-400">school</span>
                        <span className="font-semibold">{isEn ? 'Director:' : 'Director:'}</span> {group.director}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-[16px] text-emerald-400">meeting_room</span>
                        <span className="font-semibold">{isEn ? 'Room:' : 'Espacio:'}</span> {group.room}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-[16px] text-emerald-400">schedule</span>
                        <span className="font-semibold">{isEn ? 'Schedule:' : 'Horario:'}</span> {group.shift}
                      </div>
                    </div>
                  </div>

                  <div className={`mt-4 pt-3 border-t flex items-center justify-between ${
                    isDark ? 'border-slate-800' : 'border-[#e5eeff]'
                  }`}>
                    <button
                      onClick={() => {
                        setSelectedGroupModal(group.grade);
                        setStudentSearchQuery('');
                      }}
                      className="text-xs font-bold text-cyan-400 hover:text-cyan-300 hover:underline cursor-pointer flex items-center gap-1.5 py-1"
                    >
                      <span>{isEn ? 'View Students' : 'Ver Estudiantes'}</span>
                      <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                    </button>
                    <span className="text-[11px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded font-medium">
                      {isEn ? '15 registered' : '15 registrados'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* --------------------------------------------------------------- */}
        {/* TAB 3: CIRCULARS & COEXISTENCE                                  */}
        {/* --------------------------------------------------------------- */}
        {selectedTab === 'circulars' && (
          <div className="flex flex-col gap-6 animate-in fade-in">
            {/* Sub-navigation bar */}
            <div className={`flex items-center gap-2 border-b pb-2 ${
              isDark ? 'border-slate-800' : 'border-[#e5eeff]'
            }`}>
              <button
                onClick={() => setCircularSubTab('circulars')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  circularSubTab === 'circulars'
                    ? isDark ? 'bg-slate-800 text-emerald-400 border border-slate-700' : 'bg-white text-[#00288e] border border-[#dce9ff] shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {isEn ? 'Official Notices & Circulars' : 'Circulares y Comunicados'}
              </button>
              <button
                onClick={() => setCircularSubTab('committee')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  circularSubTab === 'committee'
                    ? isDark ? 'bg-slate-800 text-emerald-400 border border-slate-700' : 'bg-white text-[#00288e] border border-[#dce9ff] shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span className="material-symbols-outlined text-sm">handshake</span>
                <span>{isEn ? 'Coexistence Committee' : 'Comité Escolar de Convivencia'}</span>
              </button>
              <button
                onClick={() => setCircularSubTab('manual')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  circularSubTab === 'manual'
                    ? isDark ? 'bg-slate-800 text-emerald-400 border border-slate-700' : 'bg-white text-[#00288e] border border-[#dce9ff] shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span className="material-symbols-outlined text-sm">menu_book</span>
                <span>{isEn ? 'Coexistence Manual' : 'Manual de Convivencia'}</span>
              </button>
              <button
                onClick={() => setCircularSubTab('identity')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  circularSubTab === 'identity'
                    ? isDark ? 'bg-slate-800 text-emerald-400 border border-slate-700' : 'bg-white text-[#00288e] border border-[#dce9ff] shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span className="material-symbols-outlined text-sm">military_tech</span>
                <span>{isEn ? 'Mission, Vision & Values' : 'Identidad Institucional'}</span>
              </button>
            </div>

            {/* SUBTAB A: CIRCULARES Y COMUNICADOS */}
            {circularSubTab === 'circulars' && (
              <div className={`rounded-2xl p-6 sm:p-8 border shadow-xs ${
                isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-[#e5eeff]'
              }`}>
                <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b ${
                  isDark ? 'border-slate-800' : 'border-[#e5eeff]'
                }`}>
                  <div>
                    <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-[#0b1c30]'}`}>
                      {isEn ? 'Official Notices & Directives' : 'Circulares y Comunicados Oficiales'}
                    </h2>
                    <p className={`text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-[#444653]'}`}>
                      {isEn
                        ? 'Official communications dispatched by Principal Office and Coexistence Coordination for I.E. Vallejuelos.'
                        : 'Comunicaciones emitidas por Rectoría y Coordinación de Convivencia para toda la comunidad de la I.E. Vallejuelos.'}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setShowDraftModal(true)}
                      className={`px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 cursor-pointer shadow-xs text-white ${
                        isDark ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-[#00288e] hover:bg-[#001f70]'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[18px]">add_circle</span>
                      <span>{isEn ? 'Draft Notice' : 'Redactar Circular'}</span>
                    </button>
                  </div>
                </div>

                <div className="flex flex-col gap-4 mt-6">
                  {isLoadingCirculars ? (
                    <div className="py-12 text-center text-slate-400 text-sm">
                      <span className="material-symbols-outlined text-3xl animate-spin mb-2">refresh</span>
                      <p>Cargando circulares oficiales...</p>
                    </div>
                  ) : circulars.length === 0 ? (
                    <div className="py-12 text-center text-slate-400 text-sm">
                      <span className="material-symbols-outlined text-3xl mb-2">campaign</span>
                      <p>No hay circulares registradas actualmente.</p>
                    </div>
                  ) : (
                    circulars.map((c) => (
                      <div
                        key={c.id}
                        className={`p-5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                          isDark ? 'bg-slate-950 border-slate-800' : 'bg-[#f8f9ff] border-[#e5eeff]'
                        }`}
                      >
                        <div className="flex items-start gap-3.5">
                          <div className={`w-10 h-10 rounded-xl text-white flex items-center justify-center shrink-0 ${
                            isDark ? 'bg-emerald-600' : 'bg-[#00288e]'
                          }`}>
                            <span className="material-symbols-outlined text-[20px]">campaign</span>
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                {c.circularNumber}
                              </span>
                              {c.status === 'draft' && (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-700 text-slate-300">
                                  Borrador
                                </span>
                              )}
                            </div>
                            <h4 className={`text-base font-bold ${isDark ? 'text-white' : 'text-[#0b1c30]'}`}>
                              {isEn ? c.titleEn || c.title : c.title}
                            </h4>
                            <p className={`text-xs mt-1.5 leading-relaxed ${isDark ? 'text-slate-300' : 'text-[#444653]'}`}>
                              {c.content}
                            </p>
                            <div className={`flex flex-wrap items-center gap-3 text-xs mt-2 ${
                              isDark ? 'text-slate-400' : 'text-[#757684]'
                            }`}>
                              <span className={`font-semibold ${isDark ? 'text-emerald-400' : 'text-[#00288e]'}`}>
                                {isEn ? c.authorEn || c.author : c.author}
                              </span>
                              <span>•</span>
                              <span>{isEn ? 'Recipients: ' : 'Destinatarios: '}{isEn ? c.targetEn || c.target : c.target}</span>
                              <span>•</span>
                              <span>{isEn ? 'Date: ' : 'Fecha: '}{isEn ? c.dateEn || c.date : c.date}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0 sm:self-center">
                          <button
                            onClick={() => {
                              try {
                                downloadCircularPDF({
                                  title: c.title,
                                  circularNumber: c.circularNumber,
                                  author: c.author,
                                  date: c.date,
                                  target: c.target,
                                  content: c.content
                                });
                                showToast(isEn ? 'Official circular PDF downloaded.' : 'Circular oficial descargada en PDF exitosamente.');
                              } catch (e) {
                                console.warn('PDF error:', e);
                                showToast('Error al generar el PDF de la circular.');
                              }
                            }}
                            className={`px-3 py-1.5 rounded-lg border text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs ${
                              isDark
                                ? 'border-slate-700 bg-slate-800 text-white hover:bg-slate-700'
                                : 'border-[#c4c5d5] bg-white hover:bg-slate-50 text-[#0b1c30]'
                            }`}
                            title="Descargar PDF institucional"
                          >
                            <span className="material-symbols-outlined text-[16px] text-amber-400">download</span>
                            <span>{isEn ? 'Download PDF' : 'Descargar PDF'}</span>
                          </button>

                          <button
                            onClick={() => handleShareCircular(c)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs ${
                              isDark
                                ? 'bg-slate-800 text-cyan-300 hover:bg-slate-700 border border-slate-700'
                                : 'bg-[#eff4ff] hover:bg-[#dce9ff] text-[#00288e] border border-[#dce9ff]'
                            }`}
                            title="Reenviar circular oficial"
                          >
                            <span className="material-symbols-outlined text-[16px]">share</span>
                            <span>{isEn ? 'Resend' : 'Reenviar'}</span>
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* SUBTAB B: COMITÉ ESCOLAR DE CONVIVENCIA */}
            {circularSubTab === 'committee' && (
              <div className={`rounded-2xl p-6 sm:p-8 border shadow-xs ${
                isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-[#e5eeff]'
              }`}>
                <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b ${
                  isDark ? 'border-slate-800' : 'border-[#e5eeff]'
                }`}>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-wider">
                        Ley 1620 de 2013 • Decreto 1965
                      </span>
                    </div>
                    <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-[#0b1c30]'}`}>
                      COMITÉ ESCOLAR DE CONVIVENCIA
                    </h2>
                    <p className={`text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-[#444653]'}`}>
                      {isEn
                        ? 'Institutional body responsible for leading coexistence, mediation, restorative actions, and community dialogue.'
                        : 'Órgano institucional encargado de liderar la convivencia, mediación pacífica de conflictos, acciones restaurativas y debido proceso escolar.'}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      onClick={handleResetOfficialCommittee}
                      disabled={isSavingMember}
                      className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer border transition-all ${
                        isDark
                          ? 'border-slate-700 bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700'
                          : 'border-[#dce9ff] bg-[#eff4ff] text-[#00288e] hover:bg-[#dce9ff]'
                      }`}
                      title="Sincronizar y restablecer los 8 integrantes con el censo y base de datos"
                    >
                      <span className="material-symbols-outlined text-[16px]">sync</span>
                      <span>Restablecer Integrantes Oficiales</span>
                    </button>
                    <button
                      onClick={() => setShowAddGuestModal(true)}
                      className={`px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 cursor-pointer shadow-xs text-white ${
                        isDark ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-[#00288e] hover:bg-[#001f70]'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[18px]">person_add</span>
                      <span>{isEn ? 'Add Committee Guest' : 'Agregar Invitado al Comité'}</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
                  {isLoadingCommittee ? (
                    <div className="col-span-full py-12 text-center text-slate-400 text-sm">
                      <span className="material-symbols-outlined text-3xl animate-spin mb-2">refresh</span>
                      <p>Cargando integrantes del comité...</p>
                    </div>
                  ) : (
                    committeeMembers.map((member, index) => (
                        <div
                          key={member.id}
                          className={`p-5 rounded-xl border flex flex-col justify-between transition-all ${
                            isDark ? 'bg-slate-950 border-slate-800 hover:border-slate-700' : 'bg-[#f8f9ff] border-[#e5eeff] hover:border-[#ccdfff]'
                          }`}
                        >
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                                {member.isCustomGuest ? 'Invitado Especial' : `Cargo Oficial #${index + 1}`}
                              </span>
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block"></span>
                                <span>Asignado</span>
                              </span>
                            </div>

                            <h4 className={`text-sm font-bold mb-1 leading-snug ${isDark ? 'text-white' : 'text-[#0b1c30]'}`}>
                              {member.roleTitle}
                            </h4>

                            <div className="mt-3">
                              <div className="space-y-1.5">
                                <p className="text-sm font-extrabold text-emerald-400">
                                  {member.name || 'Integrante Asignado'}
                                </p>
                                {member.phone && (
                                  <p className="text-xs text-slate-400 flex items-center gap-1">
                                    <span className="material-symbols-outlined text-xs">phone</span>
                                    <span>{member.phone}</span>
                                  </p>
                                )}
                                {member.email && (
                                  <p className="text-xs text-slate-400 flex items-center gap-1">
                                    <span className="material-symbols-outlined text-xs">mail</span>
                                    <span className="truncate">{member.email}</span>
                                  </p>
                                )}
                                {member.notes && (
                                  <p className="text-[11px] text-amber-300/90 bg-amber-500/10 px-2 py-1 rounded-md mt-1 flex items-center gap-1.5 border border-amber-500/20">
                                    <span className="material-symbols-outlined text-[13px] text-amber-400 shrink-0">badge</span>
                                    <span className="truncate">{member.notes}</span>
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className={`mt-4 pt-3 border-t flex items-center justify-between ${
                            isDark ? 'border-slate-800' : 'border-[#e5eeff]'
                          }`}>
                            <button
                              onClick={() => handleOpenEditMember(member)}
                              className="text-xs font-bold text-cyan-400 hover:text-cyan-300 hover:underline cursor-pointer flex items-center gap-1.5"
                            >
                              <span className="material-symbols-outlined text-sm">edit</span>
                              <span>Editar integrante</span>
                            </button>

                            {member.isCustomGuest && (
                              <button
                                onClick={() => handleDeleteMember(member.id)}
                                className="text-xs font-semibold text-rose-400 hover:underline cursor-pointer"
                              >
                                Eliminar
                              </button>
                            )}
                          </div>
                        </div>
                      ))
                  )}
                </div>
              </div>
            )}

            {/* SUBTAB C: MANUAL DE CONVIVENCIA */}
            {circularSubTab === 'manual' && (
              <div className={`rounded-2xl p-6 sm:p-8 border shadow-xs ${
                isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-[#e5eeff]'
              }`}>
                <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b ${
                  isDark ? 'border-slate-800' : 'border-[#e5eeff]'
                }`}>
                  <div>
                    <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-[#0b1c30]'}`}>
                      Manual de Convivencia Escolar — I.E. Vallejuelos
                    </h2>
                    <p className={`text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-[#444653]'}`}>
                      Marco normativo, derechos, deberes, clasificación de situaciones y debido proceso (Ley 1620 de 2013).
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      try {
                        downloadManualDeConvivenciaPDF();
                        showToast('Manual de Convivencia oficial descargado en PDF.');
                      } catch (e) {
                        console.warn(e);
                        showToast('Error al descargar el Manual de Convivencia.');
                      }
                    }}
                    className="px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 cursor-pointer shadow-xs text-white bg-amber-600 hover:bg-amber-500"
                  >
                    <span className="material-symbols-outlined text-[18px]">picture_as_pdf</span>
                    <span>Descargar Manual Oficial (PDF)</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                  <div className={`p-5 rounded-xl border ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-[#f8f9ff] border-[#e5eeff]'}`}>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="material-symbols-outlined text-emerald-400">verified</span>
                      <h3 className="font-bold text-sm">Derechos de los Estudiantes</h3>
                    </div>
                    <ul className="text-xs space-y-2 text-slate-300">
                      <li>• Recibir una educación inclusiva, respetuosa y orientada a la excelencia.</li>
                      <li>• Protección integral contra cualquier modalidad de acoso, violencia o discriminación.</li>
                      <li>• Disfrutar del debido proceso y legítima defensa en todos los procedimientos disciplinarios.</li>
                      <li>• Conocer oportunamente valoraciones, observaciones de seguimiento y acuerdos pedagógicos.</li>
                    </ul>
                  </div>

                  <div className={`p-5 rounded-xl border ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-[#f8f9ff] border-[#e5eeff]'}`}>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="material-symbols-outlined text-cyan-400">assignment_turned_in</span>
                      <h3 className="font-bold text-sm">Deberes y Responsabilidades</h3>
                    </div>
                    <ul className="text-xs space-y-2 text-slate-300">
                      <li>• Cumplir la jornada escolar única matinal (6:15 AM a 12:15 PM) con puntualidad estricta.</li>
                      <li>• Portar el uniforme con decoro y preservar el mobiliario, laboratorios y zonas verdes.</li>
                      <li>• Tratar con respeto, empatía y cortesía a todos los miembros de la comunidad escolar.</li>
                      <li>• Acudir a los canales de diálogo y resolución pacífica ante cualquier discrepancia.</li>
                    </ul>
                  </div>

                  <div className={`md:col-span-2 p-5 rounded-xl border ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-[#f8f9ff] border-[#e5eeff]'}`}>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="material-symbols-outlined text-amber-400">balance</span>
                      <h3 className="font-bold text-sm">Clasificación de Situaciones y Ruta de Atención</h3>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                      <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                        <span className="font-bold text-amber-300 block mb-1">Situaciones Tipo I</span>
                        <p className="text-slate-400 leading-relaxed">Conflictos manejados inadecuadamente o faltas leves. Atención: Mediación pedagógica y compromisos restaurativos.</p>
                      </div>
                      <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                        <span className="font-bold text-amber-400 block mb-1">Situaciones Tipo II</span>
                        <p className="text-slate-400 leading-relaxed">Acoso escolar (bullying), ciberacoso o agresiones repetidas sin constituir delito. Atención: Comité de Convivencia y medidas de protección.</p>
                      </div>
                      <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                        <span className="font-bold text-rose-400 block mb-1">Situaciones Tipo III</span>
                        <p className="text-slate-400 leading-relaxed">Presuntos delitos contra la libertad o integridad. Atención: Activación inmediata de la Ruta Externa (ICBF, Policía y Fiscalía).</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* SUBTAB D: IDENTIDAD INSTITUCIONAL */}
            {circularSubTab === 'identity' && (
              <div className={`rounded-2xl p-6 sm:p-8 border shadow-xs ${
                isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-[#e5eeff]'
              }`}>
                <div className={`pb-6 border-b ${isDark ? 'border-slate-800' : 'border-[#e5eeff]'}`}>
                  <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-[#0b1c30]'}`}>
                    Identidad Institucional — I.E. Vallejuelos
                  </h2>
                  <p className={`text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-[#444653]'}`}>
                    Principios fundacionales, visión de futuro y valores que orientan nuestro proyecto educativo.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                  {/* Misión */}
                  <div className={`p-6 rounded-xl border ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-[#f8f9ff] border-[#e5eeff]'}`}>
                    <div className="flex items-center gap-2.5 mb-3">
                      <div className="w-9 h-9 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                        <span className="material-symbols-outlined text-xl">flag</span>
                      </div>
                      <h3 className="font-bold text-base">Misión Institucional</h3>
                    </div>
                    <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-300' : 'text-[#444653]'}`}>
                      Formar seres humanos íntegros, críticos, innovadores y con alto sentido comunitario, mediante una educación inclusiva de calidad con pertinencia técnica y ciudadana en la jornada única escolar, promoviendo el desarrollo de competencias para la vida y la construcción de una sociedad en paz.
                    </p>
                  </div>

                  {/* Visión */}
                  <div className={`p-6 rounded-xl border ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-[#f8f9ff] border-[#e5eeff]'}`}>
                    <div className="flex items-center gap-2.5 mb-3">
                      <div className="w-9 h-9 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold">
                        <span className="material-symbols-outlined text-xl">visibility</span>
                      </div>
                      <h3 className="font-bold text-base">Visión Institucional 2030</h3>
                    </div>
                    <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-300' : 'text-[#444653]'}`}>
                      Para el año 2030, la Institución Educativa Vallejuelos será reconocida en la ciudad de Medellín y el departamento como un referente de excelencia pedagógica, convivencia armónica, innovación tecnológica y liderazgo juvenil transformador en sus egresados.
                    </p>
                  </div>

                  {/* Valores Institucionales */}
                  <div className={`md:col-span-2 p-6 rounded-xl border ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-[#f8f9ff] border-[#e5eeff]'}`}>
                    <div className="flex items-center gap-2.5 mb-4">
                      <div className="w-9 h-9 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                        <span className="material-symbols-outlined text-xl">award_star</span>
                      </div>
                      <h3 className="font-bold text-base">Valores Institucionales</h3>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {[
                        { title: 'Respeto', desc: 'Reconocimiento sincero del valor, los derechos y las diferencias de cada ser humano.' },
                        { title: 'Responsabilidad', desc: 'Cumplimiento consciente de los deberes escolares y compromisos comunitarios.' },
                        { title: 'Solidaridad', desc: 'Disposición activa para apoyar y acompañar a quienes lo necesitan.' },
                        { title: 'Honestidad', desc: 'Transparencia, verdad y rectitud en las acciones individuales y colectivas.' },
                        { title: 'Equidad', desc: 'Acceso justo e inclusivo a las oportunidades de formación integral.' },
                        { title: 'Convivencia Pacífica', desc: 'Resolución dialogada de controversias y cultura de no violencia.' },
                      ].map((val) => (
                        <div key={val.title} className="p-3.5 rounded-lg bg-slate-900 border border-slate-800">
                          <h4 className="text-xs font-bold text-amber-300 mb-1">{val.title}</h4>
                          <p className="text-[11px] text-slate-400 leading-snug">{val.desc}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* --------------------------------------------------------------- */}
        {/* TAB 4: FORO Y ENCUESTAS                                         */}
        {/* --------------------------------------------------------------- */}
        {selectedTab === 'forum' && (
          <div className={`rounded-2xl p-6 sm:p-8 border shadow-xs animate-in fade-in ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-[#e5eeff]'
          }`}>
            <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b ${
              isDark ? 'border-slate-800' : 'border-[#e5eeff]'
            }`}>
              <div>
                <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-[#0b1c30]'}`}>
                  {isEn ? 'Forums & Institutional Surveys' : 'Foro y Encuestas de Convivencia'}
                </h2>
                <p className={`text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-[#444653]'}`}>
                  {isEn
                    ? 'Create debates, consultations, and polls for students and the entire school community.'
                    : 'Publica espacios de debate, consultas y encuestas de participación ciudadana para estudiantes y acudientes.'}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowCreateForumModal(true)}
                  className={`px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 cursor-pointer shadow-xs text-white ${
                    isDark ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-[#00288e] hover:bg-[#001f70]'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">add</span>
                  <span>{isEn ? 'Create Forum / Poll' : 'Crear Foro o Encuesta'}</span>
                </button>
              </div>
            </div>

            {/* Filter */}
            <div className="flex items-center gap-2 mt-6 mb-4">
              <button
                onClick={() => setForumFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  forumFilter === 'all'
                    ? isDark ? 'bg-emerald-600 text-white' : 'bg-[#00288e] text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Todas las publicaciones
              </button>
              <button
                onClick={() => setForumFilter('forums')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  forumFilter === 'forums'
                    ? isDark ? 'bg-emerald-600 text-white' : 'bg-[#00288e] text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Solo Foros de Debate
              </button>
              <button
                onClick={() => setForumFilter('surveys')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  forumFilter === 'surveys'
                    ? isDark ? 'bg-emerald-600 text-white' : 'bg-[#00288e] text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Solo Encuestas
              </button>
            </div>

            {/* Publication Cards */}
            <div className="flex flex-col gap-4">
              {isLoadingForum ? (
                <div className="py-12 text-center text-slate-400 text-sm">
                  <span className="material-symbols-outlined text-3xl animate-spin mb-2">refresh</span>
                  <p>Cargando foros y encuestas...</p>
                </div>
              ) : forumPublications.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-sm">
                  <span className="material-symbols-outlined text-3xl mb-2">forum</span>
                  <p>No se encontraron foros ni encuestas publicadas actualmente.</p>
                </div>
              ) : (
                forumPublications
                  .filter((p) => {
                    if (forumFilter === 'forums' && p.hasSurvey) return false;
                    if (forumFilter === 'surveys' && !p.hasSurvey) return false;
                    return true;
                  })
                  .map((pub) => (
                    <div
                      key={pub.id}
                      className={`p-5 rounded-xl border flex flex-col justify-between gap-4 ${
                        isDark ? 'bg-slate-950 border-slate-800' : 'bg-[#f8f9ff] border-[#e5eeff]'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                            pub.hasSurvey ? 'bg-amber-500/20 text-amber-300' : 'bg-emerald-500/20 text-emerald-300'
                          }`}>
                            <span className="material-symbols-outlined text-[20px]">
                              {pub.hasSurvey ? 'poll' : 'forum'}
                            </span>
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-800 text-slate-300">
                                {pub.hasSurvey ? 'Encuesta Institucional' : 'Foro de Debate'}
                              </span>
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                pub.status === 'published' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                              }`}>
                                {pub.status === 'published' ? 'Abierta' : 'Cerrada'}
                              </span>
                              <span className="text-[11px] text-slate-400">
                                Destinatarios: {Array.isArray(pub.targetGrades) ? pub.targetGrades.join(', ') : pub.targetGrades}
                              </span>
                            </div>

                            <h3 className={`text-base font-bold ${isDark ? 'text-white' : 'text-[#0b1c30]'}`}>
                              {pub.title}
                            </h3>
                            <p className={`text-xs mt-1.5 leading-relaxed ${isDark ? 'text-slate-300' : 'text-[#444653]'}`}>
                              {pub.content}
                            </p>

                            {/* Survey details preview */}
                            {pub.hasSurvey && pub.surveyQuestion && (
                              <div className="mt-3 p-3 rounded-lg bg-slate-900/60 border border-slate-800/80">
                                <span className="text-xs font-bold text-amber-300 block mb-1">
                                  Pregunta: {pub.surveyQuestion}
                                </span>
                                <div className="flex flex-wrap gap-2 mt-1">
                                  {(pub.surveyOptions || []).map((opt) => (
                                    <span key={opt.id} className="text-[11px] px-2.5 py-1 rounded bg-slate-800 text-slate-300 border border-slate-700">
                                      {opt.text} ({opt.votesCount || 0} votos)
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}

                            <div className="flex items-center gap-2 text-xs text-slate-400 mt-2">
                              <span>Publicado por: <strong className="text-emerald-400">{pub.authorName}</strong></span>
                              <span>•</span>
                              <span>{new Date(pub.createdAt).toLocaleDateString('es-CO')}</span>
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 shrink-0">
                          {pub.hasSurvey && (
                            <button
                              onClick={() => handleOpenSurveyResults(pub)}
                              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 cursor-pointer flex items-center gap-1"
                            >
                              <span className="material-symbols-outlined text-sm">analytics</span>
                              <span>Resultados</span>
                            </button>
                          )}
                          <button
                            onClick={() => handleTogglePubStatus(pub)}
                            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 text-slate-200 hover:bg-slate-700 cursor-pointer"
                          >
                            {pub.status === 'published' ? 'Cerrar' : 'Reabrir'}
                          </button>
                          <button
                            onClick={() => handleDeletePublication(pub.id)}
                            className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-rose-400 hover:bg-rose-500/10 cursor-pointer"
                            title="Eliminar publicación"
                          >
                            <span className="material-symbols-outlined text-sm">delete</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
              )}
            </div>
          </div>
        )}

        {/* --------------------------------------------------------------- */}
        {/* TAB 5: CHAT ONLINE CON ACUDIENTES                               */}
        {/* --------------------------------------------------------------- */}
        {selectedTab === 'chat' && (
          <div className={`rounded-2xl border shadow-xs overflow-hidden flex flex-col md:flex-row h-[720px] animate-in fade-in ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-[#e5eeff]'
          }`}>
            {/* Left Column: Conversations and Contacts */}
            <div className={`w-full md:w-80 border-r flex flex-col ${
              isDark ? 'border-slate-800 bg-slate-950/60' : 'border-[#e5eeff] bg-[#fbfcfe]'
            }`}>
              <div className="p-4 border-b flex items-center justify-between border-slate-800">
                <div>
                  <h3 className="font-bold text-sm text-white">Bandeja de Mensajería</h3>
                  <span className="text-[11px] text-slate-400">Canal Directo con Acudientes</span>
                </div>
                <button
                  onClick={() => setShowNewChatModal(true)}
                  className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1 cursor-pointer"
                  title="Nueva conversación con acudiente"
                >
                  <span className="material-symbols-outlined text-sm">add</span>
                  <span>Nuevo</span>
                </button>
              </div>

              {/* Search conversation */}
              <div className="p-3 border-b border-slate-800">
                <input
                  type="text"
                  value={chatSearchText}
                  onChange={(e) => setChatSearchText(e.target.value)}
                  placeholder="Buscar en conversaciones..."
                  className="w-full px-3 py-1.5 text-xs rounded-lg bg-slate-900 border border-slate-700 text-white outline-none focus:border-emerald-400"
                />
              </div>

              {/* Conversations List */}
              <div className="flex-1 overflow-y-auto divide-y divide-slate-800">
                {conversations.length === 0 ? (
                  <div className="py-12 px-4 text-center text-slate-400 text-xs">
                    <span className="material-symbols-outlined text-3xl mb-1">chat_bubble_outline</span>
                    <p>No tienes conversaciones activas.</p>
                    <button
                      onClick={() => setShowNewChatModal(true)}
                      className="mt-3 text-cyan-400 font-bold hover:underline cursor-pointer"
                    >
                      + Iniciar chat con un acudiente
                    </button>
                  </div>
                ) : (
                  conversations
                    .filter((c) => {
                      if (!chatSearchText.trim()) return true;
                      const q = chatSearchText.toLowerCase();
                      const participantsList = Object.values(c.participants || {}) as any[];
                      const other = participantsList.find((p) => p && p.id !== coordinatorId);
                      return (
                        (other?.fullName || '').toLowerCase().includes(q) ||
                        (c.lastMessage || '').toLowerCase().includes(q)
                      );
                    })
                    .map((conv) => {
                      const participantsList = Object.values(conv.participants || {}) as any[];
                      const other = participantsList.find((p) => p && p.id !== coordinatorId);
                      const isSelected = conv.id === selectedConvId;
                      const unread = conv.unreadCount?.[coordinatorId] || 0;

                      return (
                        <div
                          key={conv.id}
                          onClick={() => {
                            setSelectedConvId(conv.id);
                            markConversationAsRead(conv.id, coordinatorId);
                          }}
                          className={`p-3.5 transition-colors cursor-pointer flex items-start gap-3 ${
                            isSelected
                              ? isDark ? 'bg-emerald-950/40 border-l-4 border-emerald-500' : 'bg-emerald-50 border-l-4 border-emerald-600'
                              : isDark ? 'hover:bg-slate-900' : 'hover:bg-slate-50'
                          }`}
                        >
                          <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-xs text-amber-300 shrink-0">
                            {other?.avatar ? (
                              <img src={other.avatar} alt="" className="w-full h-full object-cover" />
                            ) : (
                              (other?.fullName || 'A').charAt(0)
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between text-xs mb-0.5">
                              <span className="font-bold truncate text-white">{other?.fullName || 'Acudiente'}</span>
                              <span className="text-[10px] text-slate-500">
                                {new Date(conv.lastMessageTime || conv.updatedAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-400 truncate mb-1">
                              {conv.lastMessage || 'Mensaje institucional'}
                            </p>
                            <div className="flex items-center justify-between">
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-800 text-emerald-400">
                                {other?.role || 'Acudiente'}
                              </span>
                              {unread > 0 && (
                                <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[10px] font-bold">
                                  {unread}
                                </span>
                              )}
                            </div>
                          </div>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteConversation(conv.id);
                            }}
                            className="text-slate-500 hover:text-rose-400 p-1"
                            title="Eliminar conversación"
                          >
                            <span className="material-symbols-outlined text-sm">close</span>
                          </button>
                        </div>
                      );
                    })
                )}
              </div>
            </div>

            {/* Right Column: Active Conversation */}
            <div className="flex-1 flex flex-col justify-between bg-slate-950">
              {activeConversation && activeOtherParticipant ? (
                <>
                  {/* Chat Header */}
                  <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/80">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-amber-300">
                        {activeOtherParticipant.avatar ? (
                          <img src={activeOtherParticipant.avatar} alt="" className="w-full h-full object-cover" />
                        ) : (
                          activeOtherParticipant.fullName.charAt(0)
                        )}
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-white">{activeOtherParticipant.fullName}</h4>
                        <p className="text-[11px] text-slate-400">
                          {activeOtherParticipant.detail || activeOtherParticipant.role || 'Acudiente autorizado'} • I.E. Vallejuelos
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400">
                        Chat en Línea
                      </span>
                    </div>
                  </div>

                  {/* Messages Feed */}
                  <div className="flex-1 p-4 overflow-y-auto space-y-3">
                    {isLoadingChatMessages ? (
                      <div className="py-12 text-center text-slate-400 text-xs">
                        <span className="material-symbols-outlined text-2xl animate-spin mb-1">refresh</span>
                        <p>Cargando mensajes en tiempo real...</p>
                      </div>
                    ) : chatMessages.length === 0 ? (
                      <div className="py-12 text-center text-slate-400 text-xs">
                        <p>No hay mensajes en este chat. Escribe el primer mensaje a continuación.</p>
                      </div>
                    ) : (
                      chatMessages.map((msg) => {
                        const isMe = msg.senderId === coordinatorId;
                        return (
                          <div
                            key={msg.id}
                            className={`flex items-start gap-2.5 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}
                          >
                            <div className="w-7 h-7 rounded-full overflow-hidden bg-slate-800 border border-slate-700 flex items-center justify-center text-[11px] font-bold text-amber-300 shrink-0">
                              {msg.senderAvatar ? (
                                <img src={msg.senderAvatar} alt="" className="w-full h-full object-cover" />
                              ) : (
                                (msg.senderName || 'U').charAt(0)
                              )}
                            </div>

                            <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed ${
                              isMe
                                ? 'bg-emerald-600 text-white rounded-tr-none'
                                : 'bg-slate-800 text-slate-100 rounded-tl-none border border-slate-700'
                            }`}>
                              {!isMe && (
                                <span className="block font-bold text-[10px] text-amber-300 mb-0.5">
                                  {msg.senderName} ({msg.senderRole})
                                </span>
                              )}
                              <p>{msg.text}</p>
                              <span className={`block text-[9px] mt-1 text-right ${isMe ? 'text-emerald-200' : 'text-slate-400'}`}>
                                {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          </div>
                        );
                      })
                    )}
                    <div ref={chatMessagesEndRef} />
                  </div>

                  {/* Input Form */}
                  <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-800 flex items-center gap-2 bg-slate-900/60">
                    <input
                      type="text"
                      value={chatReplyText}
                      onChange={(e) => setChatReplyText(e.target.value)}
                      placeholder="Escribe una respuesta para el acudiente..."
                      className="flex-1 px-4 py-2.5 text-xs rounded-xl bg-slate-800 border border-slate-700 text-white outline-none focus:border-emerald-400"
                    />
                    <button
                      type="submit"
                      disabled={isSendingMessage || !chatReplyText.trim()}
                      className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white text-xs font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <span>Enviar</span>
                      <span className="material-symbols-outlined text-sm">send</span>
                    </button>
                  </form>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400">
                  <span className="material-symbols-outlined text-4xl mb-2 text-slate-500">forum</span>
                  <p className="text-sm font-semibold">Selecciona una conversación</p>
                  <p className="text-xs text-slate-500 max-w-sm mt-1">
                    Comunícate en tiempo real con los acudientes autorizados de la Institución Educativa Vallejuelos.
                  </p>
                  <button
                    onClick={() => setShowNewChatModal(true)}
                    className="mt-4 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold cursor-pointer"
                  >
                    + Iniciar chat con un acudiente
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* =============================================================== */}
      {/* MODAL 1: VER ESTUDIANTES DE UN GRUPO (EXACTAMENTE 15 ESTUDIANTES)*/}
      {/* =============================================================== */}
      {selectedGroupModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 text-slate-100 w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <span className="material-symbols-outlined text-xl">groups</span>
                </div>
                <div>
                  <h3 className="font-bold text-lg text-white">
                    Nómina de Estudiantes — Grado {selectedGroupModal}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Demostración Oficial: Se muestran exactamente los 15 estudiantes registrados para este grupo.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedGroupModal(null)}
                className="w-8 h-8 rounded-lg bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            {/* Filter and Actions Bar */}
            <div className="p-4 border-b border-slate-800 bg-slate-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-1">
                <input
                  type="text"
                  value={studentSearchQuery}
                  onChange={(e) => setStudentSearchQuery(e.target.value)}
                  placeholder="Buscar estudiante por nombre o documento..."
                  className="w-full sm:w-80 px-3.5 py-2 text-xs rounded-xl bg-slate-800 border border-slate-700 text-white outline-none focus:border-emerald-400"
                />
                <span className="text-xs font-bold text-emerald-400 px-3 py-2 rounded-xl bg-emerald-500/10 whitespace-nowrap">
                  {currentGroupStudents.length} estudiantes registrados
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleExportGroupRoster(selectedGroupModal)}
                  className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <span className="material-symbols-outlined text-sm">download</span>
                  <span>Exportar Planilla (.csv)</span>
                </button>
              </div>
            </div>

            {/* Students Table */}
            <div className="p-4 overflow-y-auto flex-1">
              {filteredGroupStudents.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs">
                  <span className="material-symbols-outlined text-3xl mb-1">person_search</span>
                  <p>No se encontraron estudiantes para este grupo o término de búsqueda.</p>
                </div>
              ) : (
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
                      <th className="py-2.5 px-3">#</th>
                      <th className="py-2.5 px-3">Nombre Completo</th>
                      <th className="py-2.5 px-3">Documento</th>
                      <th className="py-2.5 px-3">Correo Institucional</th>
                      <th className="py-2.5 px-3">Acudiente Asignado</th>
                      <th className="py-2.5 px-3">Parentesco</th>
                      <th className="py-2.5 px-3">Teléfono</th>
                      <th className="py-2.5 px-3 text-center">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {filteredGroupStudents.map((st, idx) => {
                      const guardian = lookupCensusGuardian(st.documentId);
                      return (
                        <tr key={st.documentId} className="hover:bg-slate-800/40 transition-colors">
                          <td className="py-2.5 px-3 font-mono text-slate-500">{idx + 1}</td>
                          <td className="py-2.5 px-3 font-bold text-white">{st.fullName}</td>
                          <td className="py-2.5 px-3 font-mono text-slate-300">{st.documentId}</td>
                          <td className="py-2.5 px-3 text-slate-400 truncate max-w-[140px]">{st.email}</td>
                          <td className="py-2.5 px-3 font-medium text-amber-300">
                            {guardian?.fullName || 'Elena Gómez Jiménez'}
                          </td>
                          <td className="py-2.5 px-3 text-slate-400">
                            {guardian?.relationship || 'Madre de familia'}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-slate-400">
                            {guardian?.phone || '3004175616'}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400">
                              Activo
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-3 border-t border-slate-800 bg-slate-950 flex justify-end">
              <button
                onClick={() => setSelectedGroupModal(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =============================================================== */}
      {/* MODAL 2: REDACTAR CIRCULAR OFICIAL                              */}
      {/* =============================================================== */}
      {showDraftModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 text-slate-100 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-amber-400">post_add</span>
                <h3 className="font-bold text-base text-white">Redactar Circular Institucional</h3>
              </div>
              <button
                onClick={() => setShowDraftModal(false)}
                className="w-8 h-8 rounded-lg bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Número o Identificador de Circular
                </label>
                <input
                  type="text"
                  value={draftNumber}
                  onChange={(e) => setDraftNumber(e.target.value)}
                  placeholder="Ej: Circular No. 09"
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-800 border border-slate-700 text-white outline-none focus:border-emerald-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Título de la Circular
                </label>
                <input
                  type="text"
                  value={draftTitle}
                  onChange={(e) => setDraftTitle(e.target.value)}
                  placeholder="Título claro y oficial de la comunicación..."
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-800 border border-slate-700 text-white outline-none focus:border-emerald-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Dependencia Emisora
                  </label>
                  <input
                    type="text"
                    value={draftAuthor}
                    onChange={(e) => setDraftAuthor(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-800 border border-slate-700 text-white outline-none focus:border-emerald-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Destinatarios
                  </label>
                  <select
                    value={draftTarget}
                    onChange={(e) => setDraftTarget(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-800 border border-slate-700 text-white outline-none focus:border-emerald-400"
                  >
                    <option value="Toda la Comunidad Educativa">Toda la Comunidad Educativa</option>
                    <option value="Estudiantes y Acudientes">Estudiantes y Acudientes</option>
                    <option value="Docentes y Directivos">Docentes y Directivos</option>
                    <option value="Padres de Familia y Acudientes">Padres de Familia y Acudientes</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Contenido Completo de la Comunicación
                </label>
                <textarea
                  rows={6}
                  value={draftContent}
                  onChange={(e) => setDraftContent(e.target.value)}
                  placeholder="Escribe el texto detallado de la circular institucional..."
                  className="w-full p-3 text-xs rounded-xl bg-slate-800 border border-slate-700 text-white outline-none focus:border-emerald-400"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="draftHasAttachment"
                  checked={draftHasAttachment}
                  onChange={(e) => setDraftHasAttachment(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <label htmlFor="draftHasAttachment" className="text-xs text-slate-300 cursor-pointer">
                  Habilitar generación y descarga oficial de archivo PDF firmado digitalmente
                </label>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-800 bg-slate-950 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowDraftModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-xs font-bold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isSubmittingCircular}
                onClick={() => handleCreateCircular('draft')}
                className="px-4 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold cursor-pointer"
              >
                Guardar Borrador
              </button>
              <button
                type="button"
                disabled={isSubmittingCircular}
                onClick={() => handleCreateCircular('published')}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold cursor-pointer shadow-xs"
              >
                Publicar Circular
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =============================================================== */}
      {/* MODAL 3: EDITAR O REEMPLAZAR INTEGRANTE DEL COMITÉ               */}
      {/* =============================================================== */}
      {editingMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
          <form
            onSubmit={handleSaveMemberEdit}
            className="bg-slate-900 border border-slate-800 text-slate-100 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
          >
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                  <span className="material-symbols-outlined text-xl">manage_accounts</span>
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">Editar o Reemplazar Integrante</h3>
                  <p className="text-xs text-amber-400 font-semibold">{editingMember.roleTitle}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingMember(null)}
                className="w-8 h-8 rounded-lg bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer transition-colors"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-5 flex-1">
              {/* 1. Current Occupant Box */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                  Persona que ocupa actualmente el cargo:
                </span>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-emerald-400 text-lg">verified</span>
                    <span className="font-bold text-sm text-white">
                      {originalOccupant?.name || editingMember.name || 'Sin asignar'}
                    </span>
                  </div>
                  {(originalOccupant?.phone || editingMember.phone) && (
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <span className="material-symbols-outlined text-xs">phone</span>
                      <span>{originalOccupant?.phone || editingMember.phone}</span>
                    </span>
                  )}
                </div>
                {(originalOccupant?.notes || editingMember.notes) && (
                  <p className="text-[11px] text-slate-400 mt-1.5 italic">
                    {originalOccupant?.notes || editingMember.notes}
                  </p>
                )}
              </div>

              {/* 2. Candidate Selection From Real Database / Demo Profiles */}
              {editingMember.id === 'com_docente_secundaria' && (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-sm">school</span>
                      <span>Seleccionar Docente de Secundaria (Base de Datos — 21 Docentes)</span>
                    </label>
                    <span className="text-[11px] text-slate-400">Clic para asignar</span>
                  </div>
                  <input
                    type="text"
                    value={candidateSearch}
                    onChange={(e) => setCandidateSearch(e.target.value)}
                    placeholder="Filtrar por nombre, área (ej. Física, Matemáticas) o cédula..."
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-800 border border-slate-700 text-white outline-none focus:border-cyan-400"
                  />
                  <div className="max-h-44 overflow-y-auto space-y-1.5 pr-1">
                    {CENSUS_TEACHERS.filter((t) => {
                      const q = candidateSearch.toLowerCase();
                      return (
                        !q ||
                        t.fullName.toLowerCase().includes(q) ||
                        t.area.toLowerCase().includes(q) ||
                        t.cedula.includes(q)
                      );
                    }).map((teacher) => (
                      <div
                        key={teacher.code}
                        onClick={() => {
                          setEditingMember({
                            ...editingMember,
                            name: `Lic. ${teacher.fullName}`,
                            email: teacher.email,
                            phone: `311${teacher.cedula.slice(-6)}`,
                            notes: `Docente de ${teacher.area} (Grados: ${teacher.grades}) — Cédula: ${teacher.cedula}`
                          });
                        }}
                        className={`p-2.5 rounded-lg border cursor-pointer transition-all flex items-center justify-between text-xs ${
                          editingMember.name.includes(teacher.fullName)
                            ? 'bg-emerald-950/40 border-emerald-500 text-white'
                            : 'bg-slate-800/70 border-slate-700 hover:border-cyan-500 hover:bg-slate-800 text-slate-200'
                        }`}
                      >
                        <div>
                          <p className="font-bold">{teacher.fullName}</p>
                          <p className="text-[11px] text-slate-400">
                            {teacher.area} • Grados: {teacher.grades}
                          </p>
                        </div>
                        <span className="text-[11px] font-semibold text-cyan-400">Seleccionar</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {editingMember.id === 'com_rep_estudiantes' && (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-sm">how_to_reg</span>
                      <span>Seleccionar Estudiante del Grupo 11°1 (Base de Datos — 15 Estudiantes)</span>
                    </label>
                    <span className="text-[11px] text-slate-400">Clic para asignar</span>
                  </div>
                  <input
                    type="text"
                    value={candidateSearch}
                    onChange={(e) => setCandidateSearch(e.target.value)}
                    placeholder="Filtrar por nombre o documento..."
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-800 border border-slate-700 text-white outline-none focus:border-cyan-400"
                  />
                  <div className="max-h-44 overflow-y-auto space-y-1.5 pr-1">
                    {getCensusStudentsForGroup('11-1')
                      .filter((s) => {
                        const q = candidateSearch.toLowerCase();
                        return !q || s.fullName.toLowerCase().includes(q) || s.documentId.includes(q);
                      })
                      .map((student) => (
                        <div
                          key={student.documentId}
                          onClick={() => {
                            setEditingMember({
                              ...editingMember,
                              name: student.fullName,
                              email: student.email,
                              phone: `315${student.documentId.slice(-6)}`,
                              notes: `Representante Estudiantil — Grupo 11°1 (Doc: ${student.documentId})`
                            });
                          }}
                          className={`p-2.5 rounded-lg border cursor-pointer transition-all flex items-center justify-between text-xs ${
                            editingMember.name.includes(student.fullName)
                              ? 'bg-emerald-950/40 border-emerald-500 text-white'
                              : 'bg-slate-800/70 border-slate-700 hover:border-cyan-500 hover:bg-slate-800 text-slate-200'
                          }`}
                        >
                          <div>
                            <p className="font-bold">{student.fullName}</p>
                            <p className="text-[11px] text-slate-400">
                              Grupo 11°1 • Documento: {student.documentId}
                            </p>
                          </div>
                          <span className="text-[11px] font-semibold text-cyan-400">Seleccionar</span>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {editingMember.id === 'com_personero' && (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-sm">badge</span>
                      <span>Seleccionar Estudiante de Grado 11 (Base de Datos — Grados 11°1 y 11°2)</span>
                    </label>
                    <span className="text-[11px] text-slate-400">Clic para asignar</span>
                  </div>
                  <input
                    type="text"
                    value={candidateSearch}
                    onChange={(e) => setCandidateSearch(e.target.value)}
                    placeholder="Filtrar por nombre o grupo de 11°..."
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-800 border border-slate-700 text-white outline-none focus:border-cyan-400"
                  />
                  <div className="max-h-44 overflow-y-auto space-y-1.5 pr-1">
                    {[...getCensusStudentsForGroup('11-1'), ...getCensusStudentsForGroup('11-2')]
                      .filter((s) => {
                        const q = candidateSearch.toLowerCase();
                        return !q || s.fullName.toLowerCase().includes(q) || s.documentId.includes(q);
                      })
                      .map((student) => (
                        <div
                          key={`${student.group}_${student.documentId}`}
                          onClick={() => {
                            setEditingMember({
                              ...editingMember,
                              name: student.fullName,
                              email: student.email,
                              phone: `315${student.documentId.slice(-6)}`,
                              notes: `Personero Estudiantil Institucional — Grado ${formatGroupDisplay(student.group)} (Doc: ${student.documentId})`
                            });
                          }}
                          className={`p-2.5 rounded-lg border cursor-pointer transition-all flex items-center justify-between text-xs ${
                            editingMember.name.includes(student.fullName)
                              ? 'bg-emerald-950/40 border-emerald-500 text-white'
                              : 'bg-slate-800/70 border-slate-700 hover:border-cyan-500 hover:bg-slate-800 text-slate-200'
                          }`}
                        >
                          <div>
                            <p className="font-bold">{student.fullName}</p>
                            <p className="text-[11px] text-slate-400">
                              Grado {formatGroupDisplay(student.group)} • Doc: {student.documentId}
                            </p>
                          </div>
                          <span className="text-[11px] font-semibold text-cyan-400">Seleccionar</span>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {editingMember.id === 'com_acudiente' && (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-sm">family_restroom</span>
                      <span>Seleccionar Acudiente o Padre de Familia (Base de Datos Oficial)</span>
                    </label>
                    <span className="text-[11px] text-slate-400">Clic para asignar</span>
                  </div>
                  <input
                    type="text"
                    value={candidateSearch}
                    onChange={(e) => setCandidateSearch(e.target.value)}
                    placeholder="Filtrar por nombre de acudiente o parentesco..."
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-800 border border-slate-700 text-white outline-none focus:border-cyan-400"
                  />
                  <div className="max-h-44 overflow-y-auto space-y-1.5 pr-1">
                    {CENSUS_GUARDIANS
                      .filter((g, idx, arr) => {
                        const q = candidateSearch.toLowerCase();
                        const matches = !q || g.fullName.toLowerCase().includes(q) || g.cedula.includes(q) || g.relationship.toLowerCase().includes(q);
                        const isFirstOccurrence = arr.findIndex((item) => item.fullName === g.fullName) === idx;
                        return matches && isFirstOccurrence;
                      })
                      .map((guardian) => (
                        <div
                          key={guardian.cedula}
                          onClick={() => {
                            setEditingMember({
                              ...editingMember,
                              name: guardian.fullName,
                              email: guardian.email,
                              phone: guardian.phone,
                              notes: `Acudiente legal registrada (${guardian.relationship}) — Cédula: ${guardian.cedula}`
                            });
                          }}
                          className={`p-2.5 rounded-lg border cursor-pointer transition-all flex items-center justify-between text-xs ${
                            editingMember.name.includes(guardian.fullName)
                              ? 'bg-emerald-950/40 border-emerald-500 text-white'
                              : 'bg-slate-800/70 border-slate-700 hover:border-cyan-500 hover:bg-slate-800 text-slate-200'
                          }`}
                        >
                          <div>
                            <p className="font-bold">{guardian.fullName}</p>
                            <p className="text-[11px] text-slate-400">
                              {guardian.relationship} • Cédula: {guardian.cedula} • Tel: {guardian.phone}
                            </p>
                          </div>
                          <span className="text-[11px] font-semibold text-cyan-400">Seleccionar</span>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {editingMember.id === 'com_docente_primaria' && (
                <div className="space-y-2.5">
                  <label className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-sm">badge</span>
                    <span>Perfiles Institucionales de Demostración (Docente de Primaria)</span>
                  </label>
                  <p className="text-[11px] text-slate-400">
                    No existe registro de primaria en la base de datos de secundaria. Selecciona un perfil institucional de demostración o personaliza los campos:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {[
                      {
                        name: 'Lic. Amalia Restrepo Vélez',
                        email: 'amalia.restrepo@vallejuelos.edu.co',
                        phone: '3182245901',
                        notes: 'Docente de Básica Primaria (Sede Primaria) — Perfil institucional de demostración'
                      },
                      {
                        name: 'Lic. Carlos Restrepo Henao',
                        email: 'carlos.restrepo@vallejuelos.edu.co',
                        phone: '3183451120',
                        notes: 'Docente de Básica Primaria (Grados 1° a 3°) — Perfil institucional de demostración'
                      },
                      {
                        name: 'Lic. Marta Lucía Pérez',
                        email: 'marta.perez@vallejuelos.edu.co',
                        phone: '3189912044',
                        notes: 'Docente Básica Primaria (Grados 4° y 5°) — Perfil institucional de demostración'
                      }
                    ].map((demo) => (
                      <div
                        key={demo.name}
                        onClick={() => {
                          setEditingMember({
                            ...editingMember,
                            name: demo.name,
                            email: demo.email,
                            phone: demo.phone,
                            notes: demo.notes
                          });
                        }}
                        className={`p-2.5 rounded-lg border cursor-pointer transition-all text-xs ${
                          editingMember.name.includes(demo.name)
                            ? 'bg-emerald-950/40 border-emerald-500 text-white'
                            : 'bg-slate-800/70 border-slate-700 hover:border-amber-400 text-slate-200'
                        }`}
                      >
                        <p className="font-bold text-amber-300">{demo.name}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">{demo.email}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {editingMember.id === 'com_psicologa' && (
                <div className="space-y-2.5">
                  <label className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-sm">psychology</span>
                    <span>Perfiles Institucionales de Demostración (Psicóloga / Orientación Escolar)</span>
                  </label>
                  <p className="text-[11px] text-slate-400">
                    No existe psicóloga en la base de datos docente. Selecciona un perfil institucional de demostración o personaliza los campos:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {[
                      {
                        name: 'Dra. Carolina Builes Henao',
                        email: 'carolina.builes@vallejuelos.edu.co',
                        phone: '3195531840',
                        notes: 'Psicología y Orientación Escolar — Perfil institucional de demostración'
                      },
                      {
                        name: 'Dra. Marcela Jaramillo Soto',
                        email: 'marcela.jaramillo@vallejuelos.edu.co',
                        phone: '3194481022',
                        notes: 'Psicóloga de Convivencia y Apoyo Emocional — Perfil de demostración'
                      },
                      {
                        name: 'Dr. Juan Camilo Pineda',
                        email: 'juan.pineda@vallejuelos.edu.co',
                        phone: '3196623049',
                        notes: 'Orientador Psicológico Escolar — Perfil de demostración'
                      }
                    ].map((demo) => (
                      <div
                        key={demo.name}
                        onClick={() => {
                          setEditingMember({
                            ...editingMember,
                            name: demo.name,
                            email: demo.email,
                            phone: demo.phone,
                            notes: demo.notes
                          });
                        }}
                        className={`p-2.5 rounded-lg border cursor-pointer transition-all text-xs ${
                          editingMember.name.includes(demo.name)
                            ? 'bg-emerald-950/40 border-emerald-500 text-white'
                            : 'bg-slate-800/70 border-slate-700 hover:border-amber-400 text-slate-200'
                        }`}
                      >
                        <p className="font-bold text-amber-300">{demo.name}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">{demo.email}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {(editingMember.id === 'com_coord_convivencia' || editingMember.id === 'com_rector') && (
                <div className="space-y-2.5">
                  <label className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-sm">shield_person</span>
                    <span>Equipo Directivo Institucional (Base de Datos Oficial)</span>
                  </label>
                  <p className="text-[11px] text-slate-400">
                    Predeterminados oficiales: Lic. Viviana Giraldo (Coordinadora de Convivencia) y Lic. Alejandra Moreno (Rectora). Puedes seleccionar otro directivo del censo o ajustar los datos:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {CENSUS_ADMIN_STAFF.map((staff) => (
                      <div
                        key={staff.code}
                        onClick={() => {
                          setEditingMember({
                            ...editingMember,
                            name: `Lic. ${staff.fullName}`,
                            email: staff.email,
                            notes: `${staff.cargo} — Dependencia: ${staff.dependencia} (Cédula: ${staff.cedula})`
                          });
                        }}
                        className={`p-2.5 rounded-lg border cursor-pointer transition-all text-xs ${
                          editingMember.name.includes(staff.fullName)
                            ? 'bg-emerald-950/40 border-emerald-500 text-white'
                            : 'bg-slate-800/70 border-slate-700 hover:border-cyan-400 text-slate-200'
                        }`}
                      >
                        <p className="font-bold">{staff.fullName}</p>
                        <p className="text-[10px] text-slate-400">
                          {staff.cargo} • {staff.dependencia}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 3. Confirmed details section */}
              <div className="pt-2 border-t border-slate-800 space-y-3">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Datos confirmados para el integrante:
                </span>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Nombre Completo de la Persona Asignada
                  </label>
                  <input
                    type="text"
                    required
                    value={editingMember.name}
                    onChange={(e) => setEditingMember({ ...editingMember, name: e.target.value })}
                    placeholder="Nombre y apellidos del integrante asignado..."
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-800 border border-slate-700 text-white outline-none focus:border-emerald-400"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Teléfono de Contacto
                    </label>
                    <input
                      type="text"
                      value={editingMember.phone || ''}
                      onChange={(e) => setEditingMember({ ...editingMember, phone: e.target.value })}
                      placeholder="Ej: 312 456 7890"
                      className="w-full px-3 py-2 text-xs rounded-xl bg-slate-800 border border-slate-700 text-white outline-none focus:border-emerald-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Correo Electrónico
                    </label>
                    <input
                      type="email"
                      value={editingMember.email || ''}
                      onChange={(e) => setEditingMember({ ...editingMember, email: e.target.value })}
                      placeholder="usuario@ejemplo.edu"
                      className="w-full px-3 py-2 text-xs rounded-xl bg-slate-800 border border-slate-700 text-white outline-none focus:border-emerald-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Observaciones / Grado o Representación Institucional
                  </label>
                  <input
                    type="text"
                    value={editingMember.notes || ''}
                    onChange={(e) => setEditingMember({ ...editingMember, notes: e.target.value })}
                    placeholder="Ej: Estudiante Grado 11°1, Docente de Secundaria, Perfil Institucional..."
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-800 border border-slate-700 text-white outline-none focus:border-emerald-400"
                  />
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-slate-800 bg-slate-950 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setEditingMember(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-xs font-bold cursor-pointer transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSavingMember}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold cursor-pointer transition-colors shadow-xs flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-sm">save</span>
                <span>Guardar cambios</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* =============================================================== */}
      {/* MODAL 4: AGREGAR INVITADO ESPECIAL AL COMITÉ                   */}
      {/* =============================================================== */}
      {showAddGuestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
          <form onSubmit={handleAddGuestSubmit} className="bg-slate-900 border border-slate-800 text-slate-100 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-400">group_add</span>
                <h3 className="font-bold text-base text-white">Agregar Invitado al Comité de Convivencia</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddGuestModal(false)}
                className="w-8 h-8 rounded-lg bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Rol / Dependencia / Entidad Invitada
                </label>
                <input
                  type="text"
                  value={guestRoleTitle}
                  onChange={(e) => setGuestRoleTitle(e.target.value)}
                  placeholder="Ej: Comisaría de Familia, Policía de Infancia, Líder Comunal..."
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-800 border border-slate-700 text-white outline-none focus:border-emerald-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Nombre Completo del Invitado
                </label>
                <input
                  type="text"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  placeholder="Nombre y apellidos del invitado..."
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-800 border border-slate-700 text-white outline-none focus:border-emerald-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Teléfono de Contacto (Opcional)
                </label>
                <input
                  type="text"
                  value={guestPhone}
                  onChange={(e) => setGuestPhone(e.target.value)}
                  placeholder="300 000 0000"
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-800 border border-slate-700 text-white outline-none focus:border-emerald-400"
                />
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-800 bg-slate-950 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowAddGuestModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-xs font-bold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSavingMember}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold cursor-pointer"
              >
                Registrar Invitado
              </button>
            </div>
          </form>
        </div>
      )}

      {/* =============================================================== */}
      {/* MODAL 5: CREAR FORO O ENCUESTA INSTITUCIONAL                   */}
      {/* =============================================================== */}
      {showCreateForumModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 text-slate-100 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-amber-400">forum</span>
                <h3 className="font-bold text-base text-white">Publicar Foro o Encuesta de Convivencia</h3>
              </div>
              <button
                onClick={() => setShowCreateForumModal(false)}
                className="w-8 h-8 rounded-lg bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4">
              {/* Type Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-2">
                  Tipo de Publicación
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setForumType('forum')}
                    className={`p-3 rounded-xl border flex items-center gap-2 text-xs font-bold cursor-pointer ${
                      forumType === 'forum'
                        ? 'bg-emerald-600 text-white border-emerald-500'
                        : 'bg-slate-800 text-slate-300 border-slate-700'
                    }`}
                  >
                    <span className="material-symbols-outlined text-base">forum</span>
                    <span>Foro de Debate</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setForumType('survey')}
                    className={`p-3 rounded-xl border flex items-center gap-2 text-xs font-bold cursor-pointer ${
                      forumType === 'survey'
                        ? 'bg-emerald-600 text-white border-emerald-500'
                        : 'bg-slate-800 text-slate-300 border-slate-700'
                    }`}
                  >
                    <span className="material-symbols-outlined text-base">poll</span>
                    <span>Encuesta de Votación</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Título
                </label>
                <input
                  type="text"
                  value={forumTitle}
                  onChange={(e) => setForumTitle(e.target.value)}
                  placeholder="Título del foro o tema de la consulta..."
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-800 border border-slate-700 text-white outline-none focus:border-emerald-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Categoría
                  </label>
                  <select
                    value={forumCategory}
                    onChange={(e: any) => setForumCategory(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-800 border border-slate-700 text-white outline-none"
                  >
                    <option value="convivencia">Convivencia Escolar</option>
                    <option value="academico">Académico</option>
                    <option value="general">Institucional General</option>
                    <option value="evento">Evento o Actividad</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Destinatarios
                  </label>
                  <select
                    value={forumTargetGroup}
                    onChange={(e: any) => setForumTargetGroup(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-800 border border-slate-700 text-white outline-none"
                  >
                    <option value="all">Toda la Comunidad Educativa</option>
                    <option value="estudiantes">Solo Estudiantes</option>
                    <option value="acudientes">Solo Acudientes</option>
                    <option value="docentes">Solo Docentes</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Descripción o Planteamiento
                </label>
                <textarea
                  rows={4}
                  value={forumContent}
                  onChange={(e) => setForumContent(e.target.value)}
                  placeholder="Describe la temática de debate o el contexto de la consulta..."
                  className="w-full p-3 text-xs rounded-xl bg-slate-800 border border-slate-700 text-white outline-none focus:border-emerald-400"
                />
              </div>

              {/* If Survey: Questions & Options */}
              {forumType === 'survey' && (
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-amber-300 mb-1">
                      Pregunta de la Encuesta
                    </label>
                    <input
                      type="text"
                      value={forumSurveyQuestion}
                      onChange={(e) => setForumSurveyQuestion(e.target.value)}
                      placeholder="Ej: ¿Considera oportuno ajustar el protocolo de uso de celulares en el aula?"
                      className="w-full px-3 py-2 text-xs rounded-xl bg-slate-900 border border-slate-700 text-white outline-none focus:border-amber-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-2">
                      Opciones de Respuesta
                    </label>
                    <div className="space-y-2">
                      {forumSurveyOptions.map((opt, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <input
                            type="text"
                            value={opt}
                            onChange={(e) => {
                              const newOpts = [...forumSurveyOptions];
                              newOpts[idx] = e.target.value;
                              setForumSurveyOptions(newOpts);
                            }}
                            className="flex-1 px-3 py-1.5 text-xs rounded-lg bg-slate-900 border border-slate-700 text-white outline-none"
                          />
                          {forumSurveyOptions.length > 2 && (
                            <button
                              type="button"
                              onClick={() => {
                                const newOpts = forumSurveyOptions.filter((_, i) => i !== idx);
                                setForumSurveyOptions(newOpts);
                              }}
                              className="text-slate-500 hover:text-rose-400 p-1"
                            >
                              <span className="material-symbols-outlined text-sm">remove_circle</span>
                            </button>
                          )}
                        </div>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={() => setForumSurveyOptions([...forumSurveyOptions, `Opción ${forumSurveyOptions.length + 1}`])}
                      className="mt-2 text-xs font-bold text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-sm">add</span>
                      <span>Agregar otra opción</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-slate-800 bg-slate-950 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowCreateForumModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-xs font-bold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isSavingForum}
                onClick={() => handleSaveForumPublication('draft')}
                className="px-4 py-2 rounded-xl bg-slate-700 text-white hover:bg-slate-600 text-xs font-bold cursor-pointer"
              >
                Guardar Borrador
              </button>
              <button
                type="button"
                disabled={isSavingForum}
                onClick={() => handleSaveForumPublication('published')}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold cursor-pointer shadow-xs"
              >
                Publicar Ahora
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =============================================================== */}
      {/* MODAL 6: VER RESULTADOS DE ENCUESTA                             */}
      {/* =============================================================== */}
      {viewingSurveyResultsPub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 text-slate-100 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-amber-400">poll</span>
                <h3 className="font-bold text-base text-white">Resultados de la Encuesta</h3>
              </div>
              <button
                onClick={() => setViewingSurveyResultsPub(null)}
                className="w-8 h-8 rounded-lg bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <h4 className="font-bold text-sm text-white mb-1">{viewingSurveyResultsPub.title}</h4>
                <p className="text-xs text-amber-300 font-semibold">{viewingSurveyResultsPub.surveyQuestion}</p>
              </div>

              {isLoadingSurveyResults ? (
                <div className="py-8 text-center text-slate-400 text-xs">
                  <span className="material-symbols-outlined text-2xl animate-spin mb-1">refresh</span>
                  <p>Cargando votos en tiempo real...</p>
                </div>
              ) : surveyResultsData ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs text-slate-400 pb-2 border-b border-slate-800">
                    <span>Total de participantes:</span>
                    <strong className="text-white">{surveyResultsData.totalVotes} votos</strong>
                  </div>

                  {surveyResultsData.options.map((opt) => (
                    <div key={opt.id} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-slate-200">{opt.text}</span>
                        <span className="font-bold text-emerald-400">{opt.votes} ({opt.percentage}%)</span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                          style={{ width: `${opt.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400">No se encontraron resultados para esta encuesta.</p>
              )}
            </div>

            <div className="px-6 py-3 border-t border-slate-800 bg-slate-950 flex justify-end">
              <button
                onClick={() => setViewingSurveyResultsPub(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-white text-xs font-bold cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =============================================================== */}
      {/* MODAL 7: INICIAR NUEVO CHAT CON UN ACUDIENTE                    */}
      {/* =============================================================== */}
      {showNewChatModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 text-slate-100 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-400">person_add</span>
                <h3 className="font-bold text-base text-white">Iniciar Chat con Acudiente</h3>
              </div>
              <button
                onClick={() => setShowNewChatModal(false)}
                className="w-8 h-8 rounded-lg bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            <div className="p-4 border-b border-slate-800">
              <p className="text-xs text-slate-400 mb-2">
                Selecciona al acudiente oficial con quien deseas iniciar comunicación directa institucional:
              </p>
              <input
                type="text"
                placeholder="Buscar por nombre de acudiente o estudiante..."
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-800 border border-slate-700 text-white outline-none focus:border-emerald-400"
              />
            </div>

            <div className="p-4 overflow-y-auto space-y-2 flex-1">
              {authorizedContacts
                .filter((c) => c.role === 'family')
                .map((contact) => (
                  <div
                    key={contact.id}
                    onClick={() => handleStartNewChatWithContact(contact)}
                    className="p-3 rounded-xl border border-slate-800 hover:border-emerald-500 hover:bg-slate-800/60 transition-all cursor-pointer flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-xs text-amber-300 shrink-0">
                        {contact.avatar ? (
                          <img src={contact.avatar} alt="" className="w-full h-full object-cover rounded-full" />
                        ) : (
                          contact.fullName.charAt(0)
                        )}
                      </div>
                      <div>
                        <h4 className="font-bold text-xs text-white">{contact.fullName}</h4>
                        <p className="text-[11px] text-slate-400">{contact.detail || 'Acudiente registrado'}</p>
                      </div>
                    </div>

                    <span className="text-xs font-bold text-cyan-400 flex items-center gap-1">
                      <span>Conversar</span>
                      <span className="material-symbols-outlined text-xs">arrow_forward</span>
                    </span>
                  </div>
                ))}
            </div>

            <div className="px-6 py-3 border-t border-slate-800 bg-slate-950 flex justify-end">
              <button
                onClick={() => setShowNewChatModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-white text-xs font-bold cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
