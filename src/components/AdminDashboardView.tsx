import React, { useState, useEffect } from 'react';
import { UserProfile, ActiveScreen, InstitutionalPublicationDoc } from '../types';
import { useThemeLanguage } from '../context/ThemeLanguageContext';
import {
  getCensusStudentsForGroup,
  lookupCensusGuardian,
  formatGroupDisplay,
  CensusStudent,
  CENSUS_GUARDIANS
} from '../data/institutionalCensus';
import {
  OfficialCircular,
  fetchCirculars,
  saveCircular,
  deleteCircular,
  generateIdentidadInstitucionalPdf,
  MANUAL_DE_CONVIVENCIA_DATA,
  INSTITUTIONAL_IDENTITY
} from '../services/circularService';
import {
  downloadCircularPDF,
  downloadManualDeConvivenciaPDF
} from '../services/circularPdfService';
import {
  fetchCommitteeMembers,
  saveCommitteeMember,
  deleteCommitteeMember,
  resetStatutoryCommitteeToDefaults,
  CommitteeMember
} from '../services/committeeService';
import {
  fetchTeacherPublications,
  saveTeacherPublication,
  deleteTeacherPublication,
  fetchSurveyResults,
  SurveyResultsData
} from '../services/teacherForumService';
import {
  subscribeUserConversations,
  subscribeConversationMessages,
  sendChatMessage,
  Conversation,
  ChatMessage,
  RecipientOption,
  getAuthorizedRecipients
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

  // Navigation tab state (Estudiantes y Certificados has been removed for Coordinador de Convivencia)
  const [selectedTab, setSelectedTab] = useState<'overview' | 'groups' | 'circulars' | 'forums' | 'chat'>('overview');
  const [circularSubTab, setCircularSubTab] = useState<'notices' | 'manual' | 'identity' | 'committee'>('notices');

  // Synchronize with currentScreen if navigated from top bar
  useEffect(() => {
    if (currentScreen === 'admin_messaging') {
      setSelectedTab('chat');
    } else if (currentScreen === 'admin_forum') {
      setSelectedTab('forums');
    }
  }, [currentScreen]);

  // General toast notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3800);
  };

  // Official school groups (12 groups: 6°1 to 11°2)
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

  // -------------------------------------------------------------
  // REQ 1: MODAL DE ESTUDIANTES POR GRADO (15 estudiantes reales)
  // -------------------------------------------------------------
  const [selectedGroupModal, setSelectedGroupModal] = useState<string | null>(null);
  const [groupStudentsSearch, setGroupStudentsSearch] = useState('');
  const [activeGroupStudents, setActiveGroupStudents] = useState<CensusStudent[]>([]);

  useEffect(() => {
    if (selectedGroupModal) {
      const list = getCensusStudentsForGroup(selectedGroupModal);
      setActiveGroupStudents(list);
      setGroupStudentsSearch('');
    } else {
      setActiveGroupStudents([]);
    }
  }, [selectedGroupModal]);

  const filteredGroupStudents = activeGroupStudents.filter((st) => {
    const q = groupStudentsSearch.toLowerCase();
    return st.fullName.toLowerCase().includes(q) || st.documentId.includes(q);
  });

  // -------------------------------------------------------------
  // REQ 3: CIRCULARES Y COMUNICADOS (Firebase Firestore)
  // -------------------------------------------------------------
  const [circularsList, setCircularsList] = useState<OfficialCircular[]>([]);
  const [isLoadingCirculars, setIsLoadingCirculars] = useState(false);
  const [showDraftCircularModal, setShowDraftCircularModal] = useState(false);
  const [isSavingCircular, setIsSavingCircular] = useState(false);
  const [circularFormError, setCircularFormError] = useState('');

  // Circular Form State
  const [circTitle, setCircTitle] = useState('');
  const [circContent, setCircContent] = useState('');
  const [circTarget, setCircTarget] = useState('Toda la Comunidad Educativa');
  const [circUrgency, setCircUrgency] = useState<'normal' | 'alta' | 'urgente'>('normal');

  const loadCircularsFromDb = async () => {
    setIsLoadingCirculars(true);
    try {
      const data = await fetchCirculars();
      setCircularsList(data);
    } catch (err) {
      console.error('Error loading circulars:', err);
    } finally {
      setIsLoadingCirculars(false);
    }
  };

  useEffect(() => {
    loadCircularsFromDb();
  }, []);

  const handleSaveCircularSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSavingCircular) return; // Prevent duplicate clicks
    setCircularFormError('');

    if (!circTitle.trim()) {
      setCircularFormError(isEn ? 'Title is required.' : 'El título de la circular es obligatorio.');
      return;
    }
    if (!circContent.trim()) {
      setCircularFormError(isEn ? 'Content cannot be empty.' : 'El contenido de la circular no puede estar vacío.');
      return;
    }
    if (!circTarget.trim()) {
      setCircularFormError(isEn ? 'Recipients field is required.' : 'Debe especificar los destinatarios.');
      return;
    }

    setIsSavingCircular(true);
    try {
      const saved = await saveCircular({
        title: circTitle,
        content: circContent,
        target: circTarget,
        urgency: circUrgency,
        author: currentUser.fullName || 'Ana Restrepo',
        authorRole: currentUser.adminPosition || 'Coordinadora de Convivencia',
        authorEmail: currentUser.email || 'anarestrepo1805@gmail.com',
        authorId: currentUser.id || ''
      });

      // Update local state immediately with the confirmed saved circular from Firebase
      setCircularsList((prev) => [saved, ...prev.filter((c) => c.id !== saved.id)]);
      setShowDraftCircularModal(false);
      setCircTitle('');
      setCircContent('');
      setCircTarget('Toda la Comunidad Educativa');
      setCircUrgency('normal');
      showToast(isEn ? 'Official notice published to Firestore successfully!' : '¡Circular oficial publicada y guardada exitosamente en Firebase!');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al guardar la circular.';
      setCircularFormError(msg);
    } finally {
      setIsSavingCircular(false);
    }
  };

  const handleDeleteCircular = async (circId: string, circTitleStr: string) => {
    if (!window.confirm(isEn ? `Are you sure you want to delete notice "${circTitleStr}"?` : `¿Está seguro de eliminar la circular "${circTitleStr}"?`)) {
      return;
    }
    try {
      await deleteCircular(circId);
      setCircularsList((prev) => prev.filter((c) => c.id !== circId));
      showToast(isEn ? 'Notice deleted from Firestore' : 'Circular eliminada de Firebase');
    } catch (err) {
      console.error('Error deleting circular:', err);
      showToast(isEn ? 'Could not delete notice' : 'No se pudo eliminar la circular');
    }
  };

  const handleShareCircular = async (circular: OfficialCircular) => {
    const shareText = `*${circular.title}*\n\n${circular.content}\n\nEmitido por: ${circular.author} (${circular.authorRole})\nFecha: ${circular.date}\nInstitución Educativa Vallejuelos`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: circular.title,
          text: shareText
        });
        showToast(isEn ? 'Shared successfully' : 'Circular compartida exitosamente');
      } catch {
        // Fallback to clipboard
        await navigator.clipboard.writeText(shareText);
        showToast(isEn ? 'Notice copied to clipboard' : 'Contenido copiado al portapapeles');
      }
    } else {
      await navigator.clipboard.writeText(shareText);
      showToast(isEn ? 'Notice copied to clipboard' : 'Contenido copiado al portapapeles');
    }
  };

  // -------------------------------------------------------------
  // REQ 4: COMITÉ ESCOLAR DE CONVIVENCIA (8 Puestos Oficiales)
  // -------------------------------------------------------------
  const [committeeMembers, setCommitteeMembers] = useState<CommitteeMember[]>([]);
  const [isLoadingCommittee, setIsLoadingCommittee] = useState(false);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [newMemberRole, setNewMemberRole] = useState('');
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberDoc, setNewMemberDoc] = useState('');
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberPhone, setNewMemberPhone] = useState('');
  const [newMemberNotes, setNewMemberNotes] = useState('');

  const loadCommitteeMembers = async () => {
    setIsLoadingCommittee(true);
    try {
      const data = await fetchCommitteeMembers();
      setCommitteeMembers(data);
    } catch (err) {
      console.error('Error loading committee members:', err);
    } finally {
      setIsLoadingCommittee(false);
    }
  };

  useEffect(() => {
    loadCommitteeMembers();
  }, []);

  const handleSaveMemberSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberName.trim() || !newMemberRole.trim()) {
      showToast(isEn ? 'Name and seat role are required.' : 'Nombre y cargo son obligatorios.');
      return;
    }

    const nextSeat = committeeMembers.length + 1;
    const memberObj: CommitteeMember = {
      id: `seat_${Date.now()}`,
      seatNumber: nextSeat,
      roleTitle: newMemberRole.trim(),
      name: newMemberName.trim(),
      documentId: newMemberDoc.trim(),
      email: newMemberEmail.trim(),
      phone: newMemberPhone.trim(),
      isMandatory: false,
      notes: newMemberNotes.trim()
    };

    try {
      await saveCommitteeMember(memberObj);
      setCommitteeMembers((prev) => [...prev, memberObj]);
      setShowAddMemberModal(false);
      setNewMemberRole('');
      setNewMemberName('');
      setNewMemberDoc('');
      setNewMemberEmail('');
      setNewMemberPhone('');
      setNewMemberNotes('');
      showToast(isEn ? 'Member added to Coexistence Committee' : 'Integrante agregado al Comité de Convivencia');
    } catch (err) {
      console.error('Error saving member:', err);
      showToast(isEn ? 'Error saving member' : 'Error al guardar integrante');
    }
  };

  const handleDeleteMember = async (id: string, name: string) => {
    if (!window.confirm(isEn ? `Remove member ${name}?` : `¿Retirar a ${name} del comité?`)) return;
    try {
      await deleteCommitteeMember(id);
      setCommitteeMembers((prev) => prev.filter((m) => m.id !== id));
      showToast(isEn ? 'Member removed' : 'Integrante retirado');
    } catch (err) {
      console.error('Error deleting member:', err);
      showToast(isEn ? 'Could not remove member' : 'No se pudo retirar integrante');
    }
  };

  // -------------------------------------------------------------
  // REQ 5: FORO Y ENCUESTAS PARA EL COORDINADOR
  // -------------------------------------------------------------
  const [forumPublications, setForumPublications] = useState<InstitutionalPublicationDoc[]>([]);
  const [isLoadingForum, setIsLoadingForum] = useState(false);
  const [showCreatePostModal, setShowCreatePostModal] = useState(false);
  const [postTitle, setPostTitle] = useState('');
  const [postContent, setPostContent] = useState('');
  const [postCategory, setPostCategory] = useState<'convivencia' | 'clima' | 'formativo' | 'general'>('convivencia');
  const [postHasSurvey, setPostHasSurvey] = useState(false);
  const [postSurveyQuestion, setPostSurveyQuestion] = useState('');
  const [postSurveyOptions, setPostSurveyOptions] = useState<string[]>(['De acuerdo', 'En desacuerdo', 'Requiere revisión']);
  const [isSavingPost, setIsSavingPost] = useState(false);
  const [activeSurveyResults, setActiveSurveyResults] = useState<Record<string, SurveyResultsData>>({});

  const loadForumPosts = async () => {
    setIsLoadingForum(true);
    try {
      const posts = await fetchTeacherPublications();
      setForumPublications(posts);

      // Load survey results for posts that have surveys
      for (const p of posts) {
        if (p.hasSurvey) {
          fetchSurveyResults(p).then((res) => {
            setActiveSurveyResults((prev) => ({ ...prev, [p.id]: res }));
          });
        }
      }
    } catch (err) {
      console.error('Error loading forum posts:', err);
    } finally {
      setIsLoadingForum(false);
    }
  };

  useEffect(() => {
    if (selectedTab === 'forums') {
      loadForumPosts();
    }
  }, [selectedTab]);

  const handleSavePostSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!postTitle.trim() || !postContent.trim()) {
      showToast(isEn ? 'Title and content are required' : 'Título y contenido son obligatorios');
      return;
    }

    setIsSavingPost(true);
    try {
      const cleanOptions = postHasSurvey
        ? postSurveyOptions.filter((o) => o.trim()).map((t, idx) => ({ id: `opt_${idx + 1}`, text: t.trim(), votesCount: 0 }))
        : [];

      const newPub = await saveTeacherPublication({
        title: postTitle,
        content: postContent,
        category: postCategory,
        authorName: currentUser.fullName || 'Ana Restrepo',
        authorRole: 'coordinador',
        authorEmail: currentUser.email || 'anarestrepo1805@gmail.com',
        targetGrades: ['all'],
        hasSurvey: postHasSurvey,
        surveyQuestion: postSurveyQuestion,
        surveyOptions: cleanOptions,
        status: 'published'
      });

      setForumPublications((prev) => [newPub, ...prev]);
      setShowCreatePostModal(false);
      setPostTitle('');
      setPostContent('');
      setPostHasSurvey(false);
      setPostSurveyQuestion('');
      showToast(isEn ? 'Institutional forum publication created' : 'Publicación de convivencia creada con éxito');
    } catch (err) {
      console.error('Error creating post:', err);
      showToast(isEn ? 'Error creating publication' : 'Error al crear la publicación');
    } finally {
      setIsSavingPost(false);
    }
  };

  // -------------------------------------------------------------
  // REQ 6: CHAT ONLINE CON ACUDIENTES
  // -------------------------------------------------------------
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [activeMessages, setActiveMessages] = useState<ChatMessage[]>([]);
  const [chatMessageText, setChatMessageText] = useState('');
  const [chatValidationError, setChatValidationError] = useState<string | null>(null);
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [recipientsList, setRecipientsList] = useState<RecipientOption[]>([]);
  const [chatSearchRecipient, setChatSearchRecipient] = useState('');

  const effectiveUserId = currentUser.documentId || currentUser.id || '43589120';

  useEffect(() => {
    const list = getAuthorizedRecipients('admin');
    setRecipientsList(list);

    const unsub = subscribeUserConversations(effectiveUserId, (convs) => {
      setConversations(convs);
      if (convs.length > 0 && !activeConversationId) {
        setActiveConversationId(convs[0].id);
      }
    });
    return () => unsub();
  }, [effectiveUserId]);

  useEffect(() => {
    setChatValidationError(null);
    if (!activeConversationId) {
      setActiveMessages([]);
      return;
    }
    const unsub = subscribeConversationMessages(activeConversationId, (msgs) => {
      setActiveMessages(msgs);
    });
    return () => unsub();
  }, [activeConversationId]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!chatMessageText.trim()) {
      setChatValidationError('Debes escribir un mensaje para poder enviarlo.');
      return;
    }
    setChatValidationError(null);
    if (!activeConversationId || isSendingMessage) return;

    const currentConv = conversations.find((c) => c.id === activeConversationId);
    if (!currentConv) return;

    const otherParticipantId = currentConv.participantIds.find((id) => id !== effectiveUserId) || '';
    const otherParticipant = currentConv.participants[otherParticipantId];

    setIsSendingMessage(true);
    try {
      await sendChatMessage({
        sender: currentUser,
        recipient: {
          id: otherParticipantId,
          fullName: otherParticipant?.fullName || 'Acudiente',
          role: otherParticipant?.role || 'Acudiente',
          email: otherParticipant?.email,
          detail: otherParticipant?.detail,
          avatarUrl: otherParticipant?.avatarUrl
        },
        text: chatMessageText.trim()
      });
      setChatMessageText('');
    } catch (err) {
      console.error('Error sending message:', err);
      showToast(isEn ? 'Could not send message' : 'No se pudo enviar el mensaje');
    } finally {
      setIsSendingMessage(false);
    }
  };

  const handleStartChatWithRecipient = async (rec: RecipientOption) => {
    // Generate deterministic conversation id
    const ids = [effectiveUserId, rec.id].sort();
    const convId = `conv_${ids[0]}_${ids[1]}`;

    // Switch to chat tab and set active
    setSelectedTab('chat');
    setActiveConversationId(convId);
    showToast(isEn ? `Chat channel opened with ${rec.name}` : `Canal de chat abierto con ${rec.name}`);
  };

  return (
    <div className={`min-h-screen pb-20 transition-colors duration-200 ${
      isDark ? 'bg-slate-950 text-slate-100' : 'bg-[#f8f9ff] text-[#0b1c30]'
    }`}>
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 border border-emerald-500/50 text-emerald-300 px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4">
          <span className="material-symbols-outlined text-[20px] text-emerald-400">check_circle</span>
          <span className="text-sm font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Hero Header for Coordinadora de Convivencia */}
      <div className={`text-white py-10 px-4 sm:px-8 border-b shadow-sm ${
        isDark
          ? 'bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 border-emerald-900/40'
          : 'bg-gradient-to-r from-[#00288e] via-[#0038aa] to-[#0051d5] border-[#1e40af]'
      }`}>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white shrink-0 shadow-inner">
              <span className="material-symbols-outlined text-[36px]">shield_person</span>
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                <span className="px-3 py-0.5 rounded-full bg-white/20 text-white text-xs font-bold uppercase tracking-wider">
                  {currentUser.adminPosition || 'Coordinación de Convivencia'}
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-400/20 text-emerald-200 text-xs font-bold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse" />
                  <span>Jornada Escolar: 6:15 AM - 12:15 PM</span>
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-cyan-400/20 text-cyan-200 text-xs font-bold">
                  Ley 1620 de Convivencia
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                {currentUser.fullName}
              </h1>
              <p className="text-sm text-white/80 mt-1">
                {currentUser.institution || 'Institución Educativa Vallejuelos'} • Comuna 7 Robledo, Medellín
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="bg-white/10 backdrop-blur-sm border border-white/15 px-4 py-2.5 rounded-xl text-right">
              <span className="block text-xs text-white/70">Estudiantes en Censo</span>
              <span className="text-xl font-extrabold text-white">180 Alumnos (12 Grupos)</span>
            </div>
            <div className="bg-white/10 backdrop-blur-sm border border-white/15 px-4 py-2.5 rounded-xl text-right">
              <span className="block text-xs text-white/70">Comité de Convivencia</span>
              <span className="text-xl font-extrabold text-emerald-300">{committeeMembers.length} Miembros Activos</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 mt-8">
        {/* Navigation Tabs (Strictly 5 tabs, No Estudiantes y Certificados) */}
        <div className={`flex items-center gap-2 border-b pb-3 mb-8 overflow-x-auto ${
          isDark ? 'border-slate-800' : 'border-[#e5eeff]'
        }`}>
          <button
            onClick={() => setSelectedTab('overview')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
              selectedTab === 'overview'
                ? isDark ? 'bg-emerald-600 text-white shadow-sm' : 'bg-[#00288e] text-white shadow-sm'
                : isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-[#444653] hover:text-[#00288e] hover:bg-[#eff4ff]'
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">dashboard</span>
            <span>Resumen Institucional</span>
          </button>

          <button
            onClick={() => setSelectedTab('groups')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
              selectedTab === 'groups'
                ? isDark ? 'bg-emerald-600 text-white shadow-sm' : 'bg-[#00288e] text-white shadow-sm'
                : isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-[#444653] hover:text-[#00288e] hover:bg-[#eff4ff]'
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">groups</span>
            <span>Estructura de Grados (6° a 11°)</span>
          </button>

          <button
            onClick={() => setSelectedTab('circulars')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
              selectedTab === 'circulars'
                ? isDark ? 'bg-emerald-600 text-white shadow-sm' : 'bg-[#00288e] text-white shadow-sm'
                : isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-[#444653] hover:text-[#00288e] hover:bg-[#eff4ff]'
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">campaign</span>
            <span>Circulares y Convivencia</span>
          </button>

          <button
            onClick={() => setSelectedTab('forums')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
              selectedTab === 'forums'
                ? isDark ? 'bg-emerald-600 text-white shadow-sm' : 'bg-[#00288e] text-white shadow-sm'
                : isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-[#444653] hover:text-[#00288e] hover:bg-[#eff4ff]'
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">forum</span>
            <span>Foros y Encuestas</span>
          </button>

          <button
            onClick={() => setSelectedTab('chat')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
              selectedTab === 'chat'
                ? isDark ? 'bg-emerald-600 text-white shadow-sm' : 'bg-[#00288e] text-white shadow-sm'
                : isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-[#444653] hover:text-[#00288e] hover:bg-[#eff4ff]'
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">chat</span>
            <span>Mensajería con Familias</span>
          </button>
        </div>

        {/* ========================================================= */}
        {/* TAB 1: OVERVIEW */}
        {/* ========================================================= */}
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
                    Jornada Oficial
                  </span>
                  <span className={`text-lg font-bold ${isDark ? 'text-emerald-400' : 'text-[#00288e]'}`}>
                    6:15 AM - 12:15 PM
                  </span>
                  <span className="text-xs text-emerald-500 block mt-1 font-semibold">
                    100% puntualidad requerida
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
                    Comité Convivencia
                  </span>
                  <span className={`text-2xl font-extrabold ${isDark ? 'text-white' : 'text-[#0b1c30]'}`}>
                    8 Asientos
                  </span>
                  <span className="text-xs text-cyan-400 block mt-1 font-semibold">
                    Instalado según Ley 1620
                  </span>
                </div>
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  isDark ? 'bg-cyan-950 text-cyan-400' : 'bg-[#eff4ff] text-[#0051d5]'
                }`}>
                  <span className="material-symbols-outlined text-[24px]">balance</span>
                </div>
              </div>

              <div className={`p-5 rounded-2xl border shadow-xs flex items-center justify-between ${
                isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-[#e5eeff]'
              }`}>
                <div>
                  <span className={`text-xs font-bold uppercase tracking-wider block mb-1 ${
                    isDark ? 'text-slate-400' : 'text-[#757684]'
                  }`}>
                    Grupos Oficiales
                  </span>
                  <span className={`text-2xl font-extrabold ${isDark ? 'text-white' : 'text-[#0b1c30]'}`}>
                    12 Grupos
                  </span>
                  <span className={`text-xs block mt-1 font-semibold ${isDark ? 'text-slate-400' : 'text-[#757684]'}`}>
                    15 alumnos por grupo (180 tot.)
                  </span>
                </div>
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  isDark ? 'bg-emerald-950 text-emerald-400' : 'bg-[#eff4ff] text-[#00288e]'
                }`}>
                  <span className="material-symbols-outlined text-[24px]">domain</span>
                </div>
              </div>

              <div className={`p-5 rounded-2xl border shadow-xs flex items-center justify-between ${
                isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-[#e5eeff]'
              }`}>
                <div>
                  <span className={`text-xs font-bold uppercase tracking-wider block mb-1 ${
                    isDark ? 'text-slate-400' : 'text-[#757684]'
                  }`}>
                    Circulares en Firebase
                  </span>
                  <span className={`text-2xl font-extrabold ${isDark ? 'text-white' : 'text-[#0b1c30]'}`}>
                    {circularsList.length} Publicadas
                  </span>
                  <span className="text-xs text-emerald-400 block mt-1 font-semibold">
                    Con descarga oficial en PDF
                  </span>
                </div>
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  isDark ? 'bg-cyan-950 text-cyan-400' : 'bg-[#eff4ff] text-[#0051d5]'
                }`}>
                  <span className="material-symbols-outlined text-[24px]">campaign</span>
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
                    Resumen de Grupos y Convivencia Escolar
                  </h3>
                  <span className={`text-xs font-medium ${isDark ? 'text-slate-400' : 'text-[#757684]'}`}>
                    Año Lectivo 2026
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {schoolGroups.map((g) => (
                    <div
                      key={g.grade}
                      onClick={() => setSelectedGroupModal(g.grade)}
                      className={`p-3.5 border rounded-xl transition-all cursor-pointer ${
                        isDark
                          ? 'bg-slate-950/60 border-slate-800 hover:border-emerald-500 hover:bg-slate-800/40'
                          : 'bg-[#f8f9ff] border-[#e5eeff] hover:border-[#00288e] hover:bg-[#eff4ff]'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-base font-extrabold ${isDark ? 'text-emerald-400' : 'text-[#00288e]'}`}>
                          {g.grade}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold">
                          15 est.
                        </span>
                      </div>
                      <p className={`text-xs truncate font-medium ${isDark ? 'text-slate-300' : 'text-[#444653]'}`}>{g.director}</p>
                      <p className={`text-[11px] mt-1 ${isDark ? 'text-slate-500' : 'text-[#757684]'}`}>{g.room}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className={`rounded-2xl p-6 border shadow-xs flex flex-col justify-between ${
                isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-[#e5eeff]'
              }`}>
                <div>
                  <h3 className={`text-lg font-bold mb-2 ${isDark ? 'text-white' : 'text-[#0b1c30]'}`}>
                    Gestión de Convivencia
                  </h3>
                  <p className={`text-xs leading-relaxed mb-4 ${isDark ? 'text-slate-400' : 'text-[#444653]'}`}>
                    Acciones directas para la Coordinadora de Convivencia: comunicados oficiales, manual institucional y mediación con familias.
                  </p>

                  <div className="flex flex-col gap-2.5">
                    <button
                      onClick={() => {
                        setSelectedTab('circulars');
                        setCircularSubTab('notices');
                        setShowDraftCircularModal(true);
                      }}
                      className={`w-full text-left p-3 rounded-xl border transition-all flex items-center justify-between cursor-pointer ${
                        isDark
                          ? 'bg-slate-950 border-slate-800 hover:border-emerald-500'
                          : 'bg-[#f8f9ff] hover:bg-[#eff4ff] border-[#e5eeff] hover:border-[#00288e]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="material-symbols-outlined text-[20px] text-emerald-400">edit_note</span>
                        <span className={`text-xs font-bold ${isDark ? 'text-white' : 'text-[#0b1c30]'}`}>
                          Redactar Nueva Circular Oficial
                        </span>
                      </div>
                      <span className="material-symbols-outlined text-[18px] text-slate-500">chevron_right</span>
                    </button>

                    <button
                      onClick={() => {
                        setSelectedTab('circulars');
                        setCircularSubTab('manual');
                      }}
                      className={`w-full text-left p-3 rounded-xl border transition-all flex items-center justify-between cursor-pointer ${
                        isDark
                          ? 'bg-slate-950 border-slate-800 hover:border-emerald-500'
                          : 'bg-[#f8f9ff] hover:bg-[#eff4ff] border-[#e5eeff] hover:border-[#00288e]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="material-symbols-outlined text-[20px] text-cyan-400">menu_book</span>
                        <span className={`text-xs font-bold ${isDark ? 'text-white' : 'text-[#0b1c30]'}`}>
                          Consultar Manual de Convivencia
                        </span>
                      </div>
                      <span className="material-symbols-outlined text-[18px] text-slate-500">chevron_right</span>
                    </button>

                    <button
                      onClick={() => {
                        setSelectedTab('circulars');
                        setCircularSubTab('committee');
                      }}
                      className={`w-full text-left p-3 rounded-xl border transition-all flex items-center justify-between cursor-pointer ${
                        isDark
                          ? 'bg-slate-950 border-slate-800 hover:border-emerald-500'
                          : 'bg-[#f8f9ff] hover:bg-[#eff4ff] border-[#e5eeff] hover:border-[#00288e]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="material-symbols-outlined text-[20px] text-amber-400">diversity_3</span>
                        <span className={`text-xs font-bold ${isDark ? 'text-white' : 'text-[#0b1c30]'}`}>
                          Comité Escolar de Convivencia
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
                        <span className="material-symbols-outlined text-[20px] text-emerald-400">forum</span>
                        <span className={`text-xs font-bold ${isDark ? 'text-white' : 'text-[#0b1c30]'}`}>
                          Chat Online con Acudientes
                        </span>
                      </div>
                      <span className="material-symbols-outlined text-[18px] text-slate-500">chevron_right</span>
                    </button>
                  </div>
                </div>

                <div className={`mt-6 pt-4 border-t ${isDark ? 'border-slate-800' : 'border-[#e5eeff]'}`}>
                  <div className={`flex items-center gap-2 text-xs ${isDark ? 'text-slate-400' : 'text-[#757684]'}`}>
                    <span className="material-symbols-outlined text-[18px] text-emerald-400">verified_user</span>
                    <span>Perfil Oficial de Convivencia Escolar Activo</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 2: GROUPS (Estructura de Grados con 15 estudiantes)  */}
        {/* ========================================================= */}
        {selectedTab === 'groups' && (
          <div className={`rounded-2xl p-6 sm:p-8 border shadow-xs animate-in fade-in ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-[#e5eeff]'
          }`}>
            <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b ${
              isDark ? 'border-slate-800' : 'border-[#e5eeff]'
            }`}>
              <div>
                <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-[#0b1c30]'}`}>
                  Estructura Oficial de Grados y Grupos (6° a 11°)
                </h2>
                <p className={`text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-[#444653]'}`}>
                  Cada grupo cuenta con sus 15 estudiantes registrados oficialmente en el censo institucional. Haz clic en «Ver Estudiantes» para consultar la nómina completa y sus acudientes.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30">
                  12 Grupos • 180 Estudiantes en Censo
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mt-6">
              {schoolGroups.map((group) => (
                <div
                  key={group.grade}
                  className={`p-5 rounded-2xl border flex flex-col justify-between transition-all ${
                    isDark
                      ? 'bg-slate-950 border-slate-800 hover:border-emerald-500 shadow-sm'
                      : 'bg-[#f8f9ff] border-[#e5eeff] hover:shadow-md'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-2xl font-extrabold ${isDark ? 'text-emerald-400' : 'text-[#00288e]'}`}>
                        Grado {group.grade}
                      </span>
                      <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-extrabold">
                        15 Estudiantes Reales
                      </span>
                    </div>

                    <div className={`space-y-2 text-xs mt-4 ${isDark ? 'text-slate-300' : 'text-[#444653]'}`}>
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-[18px] text-emerald-400">person</span>
                        <span className="font-semibold">Director:</span> {group.director}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-[18px] text-emerald-400">meeting_room</span>
                        <span className="font-semibold">Espacio:</span> {group.room}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-[18px] text-emerald-400">schedule</span>
                        <span className="font-semibold">Jornada:</span> {group.shift}
                      </div>
                    </div>
                  </div>

                  <div className={`mt-5 pt-3.5 border-t flex items-center justify-between ${
                    isDark ? 'border-slate-800' : 'border-[#e5eeff]'
                  }`}>
                    <button
                      type="button"
                      onClick={() => setSelectedGroupModal(group.grade)}
                      className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
                    >
                      <span className="material-symbols-outlined text-[16px]">visibility</span>
                      <span>Ver Estudiantes ({group.studentsCount})</span>
                    </button>
                    <span className="text-[11px] text-cyan-400 font-semibold">
                      Censo Activo
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 3: CIRCULARES Y COMUNICADOS INSTITUCIONALES           */}
        {/* ========================================================= */}
        {selectedTab === 'circulars' && (
          <div className="flex flex-col gap-6 animate-in fade-in">
            {/* Sub-tabs for Circulars & Convivencia */}
            <div className={`flex items-center gap-2 p-1.5 rounded-2xl border ${
              isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-[#e5eeff]'
            }`}>
              <button
                onClick={() => setCircularSubTab('notices')}
                className={`flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                  circularSubTab === 'notices'
                    ? isDark ? 'bg-emerald-600 text-white shadow-sm' : 'bg-[#00288e] text-white shadow-sm'
                    : isDark ? 'text-slate-400 hover:text-white' : 'text-[#444653] hover:text-[#00288e]'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">campaign</span>
                <span>Circulares Oficiales</span>
              </button>

              <button
                onClick={() => setCircularSubTab('manual')}
                className={`flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                  circularSubTab === 'manual'
                    ? isDark ? 'bg-emerald-600 text-white shadow-sm' : 'bg-[#00288e] text-white shadow-sm'
                    : isDark ? 'text-slate-400 hover:text-white' : 'text-[#444653] hover:text-[#00288e]'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">menu_book</span>
                <span>Manual de Convivencia</span>
              </button>

              <button
                onClick={() => setCircularSubTab('identity')}
                className={`flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                  circularSubTab === 'identity'
                    ? isDark ? 'bg-emerald-600 text-white shadow-sm' : 'bg-[#00288e] text-white shadow-sm'
                    : isDark ? 'text-slate-400 hover:text-white' : 'text-[#444653] hover:text-[#00288e]'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">verified</span>
                <span>Identidad Institucional</span>
              </button>

              <button
                onClick={() => setCircularSubTab('committee')}
                className={`flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                  circularSubTab === 'committee'
                    ? isDark ? 'bg-emerald-600 text-white shadow-sm' : 'bg-[#00288e] text-white shadow-sm'
                    : isDark ? 'text-slate-400 hover:text-white' : 'text-[#444653] hover:text-[#00288e]'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">diversity_3</span>
                <span>Comité de Convivencia</span>
              </button>
            </div>

            {/* SUBTAB A: NOTICES LIST & ACTIONS */}
            {circularSubTab === 'notices' && (
              <div className={`rounded-2xl p-6 sm:p-8 border shadow-xs ${
                isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-[#e5eeff]'
              }`}>
                <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b ${
                  isDark ? 'border-slate-800' : 'border-[#e5eeff]'
                }`}>
                  <div>
                    <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-[#0b1c30]'}`}>
                      Circulares y Resoluciones Oficiales
                    </h2>
                    <p className={`text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-[#444653]'}`}>
                      Comunicaciones oficiales sincronizadas en tiempo real con Firebase Firestore. Descarga el PDF original o reenvía el comunicado a las familias.
                    </p>
                  </div>
                  <button
                    onClick={() => setShowDraftCircularModal(true)}
                    className={`px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 cursor-pointer shadow-xs text-white ${
                      isDark ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-[#00288e] hover:bg-[#001f70]'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[18px]">add_circle</span>
                    <span>Redactar Circular</span>
                  </button>
                </div>

                {isLoadingCirculars ? (
                  <div className="py-12 text-center text-sm text-slate-400">
                    Cargando circulares oficiales de Firebase...
                  </div>
                ) : circularsList.length === 0 ? (
                  <div className="py-12 text-center text-sm text-slate-400">
                    No hay circulares registradas actualmente. Presiona «Redactar Circular» para publicar una.
                  </div>
                ) : (
                  <div className="flex flex-col gap-4 mt-6">
                    {circularsList.map((c) => (
                      <div
                        key={c.id}
                        className={`p-5 rounded-2xl border transition-all ${
                          isDark ? 'bg-slate-950 border-slate-800 hover:border-slate-700' : 'bg-[#f8f9ff] border-[#e5eeff]'
                        }`}
                      >
                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                          <div className="flex items-start gap-3.5">
                            <div className={`w-11 h-11 rounded-xl text-white flex items-center justify-center shrink-0 shadow-sm ${
                              c.urgency === 'urgente'
                                ? 'bg-rose-600'
                                : c.urgency === 'alta'
                                ? 'bg-amber-600'
                                : isDark ? 'bg-emerald-600' : 'bg-[#00288e]'
                            }`}>
                              <span className="material-symbols-outlined text-[22px]">
                                {c.urgency === 'urgente' ? 'priority_high' : 'campaign'}
                              </span>
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className={`text-base font-extrabold ${isDark ? 'text-white' : 'text-[#0b1c30]'}`}>
                                  {c.title}
                                </h4>
                                {c.urgency === 'urgente' && (
                                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-400">
                                    URGENTE
                                  </span>
                                )}
                              </div>
                              <div className={`flex flex-wrap items-center gap-2.5 text-xs mt-1.5 ${
                                isDark ? 'text-slate-400' : 'text-[#757684]'
                              }`}>
                                <span className={`font-semibold ${isDark ? 'text-emerald-400' : 'text-[#00288e]'}`}>
                                  {c.author} ({c.authorRole})
                                </span>
                                <span>•</span>
                                <span>Destinatarios: <strong>{c.target}</strong></span>
                                <span>•</span>
                                <span>Fecha: {c.date}</span>
                              </div>

                              <p className={`text-xs mt-3 leading-relaxed whitespace-pre-line ${
                                isDark ? 'text-slate-300' : 'text-[#444653]'
                              }`}>
                                {c.content}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 self-end md:self-start shrink-0">
                            <button
                              onClick={() => downloadCircularPDF({
                                title: c.title,
                                author: `${c.author} (${c.authorRole})`,
                                date: c.date,
                                target: c.target,
                                content: c.content
                              })}
                              className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all ${
                                isDark
                                  ? 'border-slate-700 bg-slate-800 text-white hover:bg-slate-700'
                                  : 'border-[#c4c5d5] bg-white hover:bg-[#eff4ff] text-[#0b1c30]'
                              }`}
                              title="Descargar PDF con membrete oficial"
                            >
                              <span className="material-symbols-outlined text-[16px] text-emerald-400">download</span>
                              <span>Descargar PDF</span>
                            </button>

                            <button
                              onClick={() => handleShareCircular(c)}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all ${
                                isDark
                                  ? 'bg-slate-800 text-cyan-300 hover:bg-slate-700'
                                  : 'bg-[#eff4ff] hover:bg-[#dce9ff] text-[#00288e]'
                              }`}
                              title="Reenviar a comunidad y redes"
                            >
                              <span className="material-symbols-outlined text-[16px]">share</span>
                              <span>Reenviar</span>
                            </button>

                            <button
                              onClick={() => handleDeleteCircular(c.id, c.title)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all cursor-pointer"
                              title="Eliminar circular"
                            >
                              <span className="material-symbols-outlined text-[18px]">delete</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* SUBTAB B: MANUAL DE CONVIVENCIA */}
            {circularSubTab === 'manual' && (
              <div className={`rounded-2xl p-6 sm:p-8 border shadow-xs ${
                isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-[#e5eeff]'
              }`}>
                <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b ${
                  isDark ? 'border-slate-800' : 'border-[#e5eeff]'
                }`}>
                  <div>
                    <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-[#0b1c30]'}`}>
                      Manual de Convivencia Escolar Oficial
                    </h2>
                    <p className={`text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-[#444653]'}`}>
                      Pacto de Convivencia, Derechos, Deberes, Clasificación de Situaciones Tipo I, II y III (Ley 1620 de 2013) y Debido Proceso.
                    </p>
                  </div>
                  <button
                    onClick={() => downloadManualDeConvivenciaPDF()}
                    className={`px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 cursor-pointer shadow-xs text-white ${
                      isDark ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-[#00288e] hover:bg-[#001f70]'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[18px]">picture_as_pdf</span>
                    <span>Descargar Manual Completo (PDF)</span>
                  </button>
                </div>

                <div className="space-y-6 mt-6">
                  {MANUAL_DE_CONVIVENCIA_DATA.map((section) => (
                    <div
                      key={section.chapter}
                      className={`p-5 rounded-2xl border ${
                        isDark ? 'bg-slate-950 border-slate-800' : 'bg-[#f8f9ff] border-[#e5eeff]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 mb-3">
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-extrabold uppercase">
                          {section.chapter}
                        </span>
                        <h3 className={`text-base font-bold ${isDark ? 'text-white' : 'text-[#0b1c30]'}`}>
                          {section.title}
                        </h3>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                        {section.articles.map((art) => (
                          <div
                            key={art.code}
                            className={`p-4 rounded-xl border ${
                              isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-[#e5eeff]'
                            }`}
                          >
                            <span className="text-xs font-mono font-bold text-cyan-400 block mb-1">
                              {art.code} — {art.title}
                            </span>
                            <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-300' : 'text-[#444653]'}`}>
                              {art.text}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* SUBTAB C: IDENTIDAD INSTITUCIONAL */}
            {circularSubTab === 'identity' && (
              <div className={`rounded-2xl p-6 sm:p-8 border shadow-xs ${
                isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-[#e5eeff]'
              }`}>
                <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b ${
                  isDark ? 'border-slate-800' : 'border-[#e5eeff]'
                }`}>
                  <div>
                    <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-[#0b1c30]'}`}>
                      Identidad y Horizonte Institucional
                    </h2>
                    <p className={`text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-[#444653]'}`}>
                      Misión, Visión, Valores Rectores y Lema de la Institución Educativa Vallejuelos (Medellín).
                    </p>
                  </div>
                  <button
                    onClick={() => generateIdentidadInstitucionalPdf()}
                    className={`px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 cursor-pointer shadow-xs text-white ${
                      isDark ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-[#00288e] hover:bg-[#001f70]'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[18px]">download</span>
                    <span>Descargar Identidad Oficial (PDF)</span>
                  </button>
                </div>

                <div className="mt-6 flex flex-col gap-6">
                  {/* Motto */}
                  <div className={`p-4 rounded-2xl border text-center ${
                    isDark ? 'bg-slate-950 border-emerald-500/30 text-emerald-300' : 'bg-[#eff4ff] border-[#00288e]/30 text-[#00288e]'
                  }`}>
                    <span className="text-xs uppercase tracking-wider block font-bold mb-1 opacity-75">
                      Lema Institucional
                    </span>
                    <span className="text-base sm:text-lg font-extrabold italic">
                      {INSTITUTIONAL_IDENTITY.motto}
                    </span>
                  </div>

                  {/* Mission & Vision */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className={`p-6 rounded-2xl border ${
                      isDark ? 'bg-slate-950 border-slate-800' : 'bg-[#f8f9ff] border-[#e5eeff]'
                    }`}>
                      <div className="flex items-center gap-2.5 mb-3">
                        <span className="material-symbols-outlined text-[24px] text-emerald-400">target</span>
                        <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-[#0b1c30]'}`}>
                          Misión Institucional
                        </h3>
                      </div>
                      <p className={`text-xs sm:text-sm leading-relaxed ${isDark ? 'text-slate-300' : 'text-[#444653]'}`}>
                        {INSTITUTIONAL_IDENTITY.mission}
                      </p>
                    </div>

                    <div className={`p-6 rounded-2xl border ${
                      isDark ? 'bg-slate-950 border-slate-800' : 'bg-[#f8f9ff] border-[#e5eeff]'
                    }`}>
                      <div className="flex items-center gap-2.5 mb-3">
                        <span className="material-symbols-outlined text-[24px] text-cyan-400">visibility</span>
                        <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-[#0b1c30]'}`}>
                          Visión (Horizonte 2030)
                        </h3>
                      </div>
                      <p className={`text-xs sm:text-sm leading-relaxed ${isDark ? 'text-slate-300' : 'text-[#444653]'}`}>
                        {INSTITUTIONAL_IDENTITY.vision}
                      </p>
                    </div>
                  </div>

                  {/* Values */}
                  <div>
                    <h3 className={`text-base font-bold mb-3 ${isDark ? 'text-white' : 'text-[#0b1c30]'}`}>
                      Valores Institucionales Fundamentales
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {INSTITUTIONAL_IDENTITY.values.map((v) => (
                        <div
                          key={v.name}
                          className={`p-4 rounded-xl border ${
                            isDark ? 'bg-slate-950 border-slate-800' : 'bg-white border-[#e5eeff]'
                          }`}
                        >
                          <span className="text-sm font-extrabold text-emerald-400 block mb-1">
                            {v.name}
                          </span>
                          <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-300' : 'text-[#444653]'}`}>
                            {v.desc}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* SUBTAB D: COMITÉ ESCOLAR DE CONVIVENCIA (8 Puestos Oficiales) */}
            {circularSubTab === 'committee' && (
              <div className={`rounded-2xl p-6 sm:p-8 border shadow-xs ${
                isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-[#e5eeff]'
              }`}>
                <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b ${
                  isDark ? 'border-slate-800' : 'border-[#e5eeff]'
                }`}>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold">
                        Ley 1620 de 2013 • Artículo 12
                      </span>
                    </div>
                    <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-[#0b1c30]'}`}>
                      Comité Escolar de Convivencia
                    </h2>
                    <p className={`text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-[#444653]'}`}>
                      Órgano consultor y mediador encargado de liderar la Ruta de Atención Integral, prevenir situaciones que afecten el clima escolar y garantizar el debido proceso.
                    </p>
                  </div>
                  <button
                    onClick={() => setShowAddMemberModal(true)}
                    className={`px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 cursor-pointer shadow-xs text-white ${
                      isDark ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-[#00288e] hover:bg-[#001f70]'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[18px]">person_add</span>
                    <span>Agregar Integrante o Invitado</span>
                  </button>
                </div>

                {isLoadingCommittee ? (
                  <div className="py-12 text-center text-sm text-slate-400">
                    Cargando integrantes del comité...
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                    {committeeMembers.map((member) => (
                      <div
                        key={member.id}
                        className={`p-5 rounded-2xl border flex flex-col justify-between ${
                          isDark ? 'bg-slate-950 border-slate-800' : 'bg-[#f8f9ff] border-[#e5eeff]'
                        }`}
                      >
                        <div>
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 text-xs font-bold">
                              Asiento #{member.seatNumber}
                            </span>
                            {!member.isMandatory && (
                              <button
                                onClick={() => handleDeleteMember(member.id, member.name)}
                                className="text-slate-500 hover:text-rose-400 transition-colors p-1"
                                title="Retirar integrante"
                              >
                                <span className="material-symbols-outlined text-[16px]">delete</span>
                              </button>
                            )}
                          </div>

                          <h4 className={`text-sm font-extrabold ${isDark ? 'text-emerald-400' : 'text-[#00288e]'}`}>
                            {member.roleTitle}
                          </h4>
                          <p className={`text-base font-bold mt-1 ${isDark ? 'text-white' : 'text-[#0b1c30]'}`}>
                            {member.name}
                          </p>

                          <div className={`mt-3 space-y-1 text-xs ${isDark ? 'text-slate-400' : 'text-[#757684]'}`}>
                            {member.documentId && (
                              <p>C.C. / Doc: <strong className="font-mono">{member.documentId}</strong></p>
                            )}
                            {member.email && (
                              <p>Correo: {member.email}</p>
                            )}
                            {member.phone && (
                              <p>Tel: {member.phone}</p>
                            )}
                            {member.notes && (
                              <p className="italic mt-1.5 text-slate-400">«{member.notes}»</p>
                            )}
                          </div>
                        </div>

                        <div className={`mt-4 pt-3 border-t flex items-center justify-between text-[11px] ${
                          isDark ? 'border-slate-800' : 'border-[#e5eeff]'
                        }`}>
                          <span className="text-emerald-400 font-semibold flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                            {member.isMandatory ? 'Asiento Mandatorio por Ley' : 'Invitado Institucional'}
                          </span>
                          <button
                            onClick={() => showToast(`Contacto de ${member.name}: ${member.phone || member.email || 'Sin datos de contacto'}`)}
                            className="text-cyan-400 hover:underline cursor-pointer font-bold"
                          >
                            Ver Contacto
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 4: FOROS Y ENCUESTAS                                   */}
        {/* ========================================================= */}
        {selectedTab === 'forums' && (
          <div className={`rounded-2xl p-6 sm:p-8 border shadow-xs animate-in fade-in ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-[#e5eeff]'
          }`}>
            <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b ${
              isDark ? 'border-slate-800' : 'border-[#e5eeff]'
            }`}>
              <div>
                <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-[#0b1c30]'}`}>
                  Foros, Debates y Encuestas de Convivencia
                </h2>
                <p className={`text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-[#444653]'}`}>
                  Publica temas de discusión, sondeos y encuestas institucionales dirigidas a estudiantes, familias y docentes. Consulta los resultados en tiempo real.
                </p>
              </div>
              <button
                onClick={() => setShowCreatePostModal(true)}
                className={`px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 cursor-pointer shadow-xs text-white ${
                  isDark ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-[#00288e] hover:bg-[#001f70]'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">add_circle</span>
                <span>Crear Foro o Encuesta</span>
              </button>
            </div>

            {isLoadingForum ? (
              <div className="py-12 text-center text-sm text-slate-400">
                Cargando foros y encuestas institucionales...
              </div>
            ) : forumPublications.length === 0 ? (
              <div className="py-12 text-center text-sm text-slate-400">
                No hay publicaciones registradas aún. Presiona «Crear Foro o Encuesta» para iniciar una nueva discusión.
              </div>
            ) : (
              <div className="flex flex-col gap-6 mt-6">
                {forumPublications.map((pub) => {
                  const surveyData = activeSurveyResults[pub.id];
                  return (
                    <div
                      key={pub.id}
                      className={`p-6 rounded-2xl border transition-all ${
                        isDark ? 'bg-slate-950 border-slate-800' : 'bg-[#f8f9ff] border-[#e5eeff]'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="flex flex-wrap items-center gap-2 mb-1.5">
                            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold">
                              {pub.category.toUpperCase()}
                            </span>
                            {pub.hasSurvey && (
                              <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 text-xs font-bold flex items-center gap-1">
                                <span className="material-symbols-outlined text-[14px]">poll</span>
                                <span>Encuesta Activa</span>
                              </span>
                            )}
                          </div>
                          <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-[#0b1c30]'}`}>
                            {pub.title}
                          </h3>
                          <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-[#757684]'}`}>
                            Por <strong>{pub.authorName}</strong> ({pub.authorRole}) • {new Date(pub.createdAt).toLocaleDateString('es-CO')}
                          </p>
                        </div>

                        <button
                          onClick={async () => {
                            if (window.confirm('¿Eliminar esta publicación?')) {
                              await deleteTeacherPublication(pub.id);
                              setForumPublications((prev) => prev.filter((p) => p.id !== pub.id));
                              showToast('Publicación eliminada');
                            }
                          }}
                          className="text-slate-500 hover:text-rose-400 transition-colors p-1"
                          title="Eliminar publicación"
                        >
                          <span className="material-symbols-outlined text-[18px]">delete</span>
                        </button>
                      </div>

                      <p className={`text-sm mt-3 leading-relaxed ${isDark ? 'text-slate-300' : 'text-[#444653]'}`}>
                        {pub.content}
                      </p>

                      {/* Survey voting results if survey is attached */}
                      {pub.hasSurvey && (
                        <div className={`mt-5 p-4 rounded-xl border ${
                          isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-[#e5eeff]'
                        }`}>
                          <h4 className={`text-xs font-bold uppercase tracking-wider mb-2 ${
                            isDark ? 'text-cyan-400' : 'text-[#00288e]'
                          }`}>
                            Pregunta de Encuesta: {pub.surveyQuestion}
                          </h4>

                          <div className="space-y-2.5 mt-3">
                            {(surveyData?.options || pub.surveyOptions || []).map((opt) => (
                              <div key={opt.id} className="space-y-1">
                                <div className="flex justify-between text-xs font-semibold">
                                  <span className={isDark ? 'text-slate-200' : 'text-[#0b1c30]'}>
                                    {opt.text}
                                  </span>
                                  <span className="text-cyan-400 font-mono">
                                    {'votes' in opt ? `${opt.votes} votos (${opt.percentage}%)` : '0 votos (0%)'}
                                  </span>
                                </div>
                                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                                  <div
                                    className="bg-cyan-500 h-full rounded-full transition-all duration-500"
                                    style={{ width: `${'percentage' in opt ? opt.percentage : 0}%` }}
                                  />
                                </div>
                              </div>
                            ))}
                          </div>

                          <div className="mt-3 text-[11px] text-slate-400 text-right">
                            Total de respuestas registradas: {surveyData?.totalVotes || 0}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 5: CHAT ONLINE CON ACUDIENTES                         */}
        {/* ========================================================= */}
        {selectedTab === 'chat' && (
          <div className={`rounded-2xl border shadow-xs overflow-hidden animate-in fade-in ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-[#e5eeff]'
          }`}>
            <div className={`p-4 border-b flex items-center justify-between ${
              isDark ? 'border-slate-800 bg-slate-950/40' : 'border-[#e5eeff] bg-[#f8f9ff]'
            }`}>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <h2 className={`text-base font-bold ${isDark ? 'text-white' : 'text-[#0b1c30]'}`}>
                  Mensajería Institucional y Convivencia Escolar
                </h2>
              </div>
              <span className="text-xs text-slate-400">
                Canal Oficial Seguro • I.E. Vallejuelos
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 min-h-[550px]">
              {/* Left Column: Authorized Contacts & Conversations */}
              <div className={`p-4 border-r flex flex-col ${
                isDark ? 'border-slate-800 bg-slate-950/60' : 'border-[#e5eeff] bg-[#f8f9ff]'
              }`}>
                <div className="mb-3">
                  <input
                    type="text"
                    value={chatSearchRecipient}
                    onChange={(e) => setChatSearchRecipient(e.target.value)}
                    placeholder="Buscar acudiente o docente..."
                    className={`w-full px-3 py-2 text-xs rounded-xl border outline-none ${
                      isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-[#dce9ff] text-[#0b1c30]'
                    }`}
                  />
                </div>

                <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Acudientes y Contactos
                </div>

                <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                  {recipientsList
                    .filter((r) => r.name.toLowerCase().includes(chatSearchRecipient.toLowerCase()))
                    .map((rec) => {
                      const ids = [effectiveUserId, rec.id].sort();
                      const convId = `conv_${ids[0]}_${ids[1]}`;
                      const isSelected = activeConversationId === convId;

                      return (
                        <div
                          key={rec.id}
                          onClick={() => handleStartChatWithRecipient(rec)}
                          className={`p-3 rounded-xl border cursor-pointer transition-all ${
                            isSelected
                              ? isDark ? 'bg-emerald-600/20 border-emerald-500' : 'bg-[#eff4ff] border-[#00288e]'
                              : isDark ? 'bg-slate-900 border-slate-800 hover:border-slate-700' : 'bg-white border-[#e5eeff] hover:shadow-xs'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className={`text-xs font-bold truncate ${isDark ? 'text-white' : 'text-[#0b1c30]'}`}>
                              {rec.name}
                            </span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-semibold">
                              {rec.role}
                            </span>
                          </div>
                          <p className={`text-[11px] truncate mt-1 ${isDark ? 'text-slate-400' : 'text-[#757684]'}`}>
                            {rec.detail}
                          </p>
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* Right Column: Active Conversation Messages */}
              <div className="md:col-span-2 flex flex-col justify-between p-4">
                {activeConversationId ? (
                  <>
                    {/* Header */}
                    <div className={`pb-3 border-b flex items-center justify-between ${
                      isDark ? 'border-slate-800' : 'border-[#e5eeff]'
                    }`}>
                      <div>
                        <span className="text-xs text-slate-400 block">Conversación Activa</span>
                        <span className={`text-sm font-bold ${isDark ? 'text-white' : 'text-[#0b1c30]'}`}>
                          {conversations.find((c) => c.id === activeConversationId)?.participants[
                            conversations.find((c) => c.id === activeConversationId)?.participantIds.find((id) => id !== effectiveUserId) || ''
                          ]?.fullName || 'Acudiente'}
                        </span>
                      </div>
                      <span className="text-[11px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded font-semibold">
                        En línea
                      </span>
                    </div>

                    {/* Message history */}
                    <div className="flex-1 overflow-y-auto py-4 space-y-3 pr-2 max-h-[420px]">
                      {activeMessages.length === 0 ? (
                        <div className="h-full flex items-center justify-center text-xs text-slate-400">
                          Inicia una conversación con este acudiente. Escribe un mensaje abajo.
                        </div>
                      ) : (
                        activeMessages.map((msg) => {
                          const isMine = msg.senderId === effectiveUserId;
                          return (
                            <div
                              key={msg.id}
                              className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}
                            >
                              <div className={`max-w-[80%] p-3.5 rounded-2xl text-xs leading-relaxed ${
                                isMine
                                  ? isDark ? 'bg-emerald-600 text-white rounded-br-none' : 'bg-[#00288e] text-white rounded-br-none'
                                  : isDark ? 'bg-slate-800 text-slate-200 rounded-bl-none' : 'bg-[#f1f5f9] text-[#0b1c30] rounded-bl-none'
                              }`}>
                                <div className="text-[10px] font-bold opacity-75 mb-1">
                                  {msg.senderName} ({msg.senderRole})
                                </div>
                                <p>{msg.text}</p>
                                <div className="text-[9px] text-right mt-1.5 opacity-60">
                                  {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>

                    {/* Message Input */}
                    <form onSubmit={handleSendMessage} className="pt-3 border-t flex flex-col gap-1.5">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={chatMessageText}
                          onChange={(e) => {
                            setChatMessageText(e.target.value);
                            if (chatValidationError && e.target.value.trim()) {
                              setChatValidationError(null);
                            }
                          }}
                          placeholder="Escribe un mensaje de orientación o citación para la familia..."
                          className={`flex-1 px-4 py-2.5 text-xs rounded-xl border outline-none ${
                            chatValidationError
                              ? 'border-rose-500 focus:border-rose-500'
                              : isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-[#f8f9ff] border-[#dce9ff] text-[#0b1c30]'
                          }`}
                        />
                        <button
                          type="submit"
                          disabled={isSendingMessage}
                          className={`px-4 py-2.5 rounded-xl text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50 ${
                            isDark ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-[#00288e] hover:bg-[#001f70]'
                          }`}
                        >
                          <span className="material-symbols-outlined text-[16px]">send</span>
                          <span>Enviar</span>
                        </button>
                      </div>
                      {chatValidationError && (
                        <p className="text-xs text-rose-500 font-medium flex items-center gap-1 pl-1">
                          <span className="material-symbols-outlined text-[14px]">error</span>
                          <span>{chatValidationError}</span>
                        </p>
                      )}
                    </form>
                  </>
                ) : (
                  <div className="h-full flex items-center justify-center text-xs text-slate-400">
                    Selecciona un acudiente del listado lateral para comenzar.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* MODAL 1: VER ESTUDIANTES POR GRADO (15 estudiantes reales) */}
      {/* ========================================================= */}
      {selectedGroupModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className={`w-full max-w-4xl max-h-[90vh] rounded-2xl border shadow-2xl flex flex-col overflow-hidden ${
            isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-[#dce9ff] text-[#0b1c30]'
          }`}>
            {/* Modal Header */}
            <div className={`p-5 border-b flex items-center justify-between ${
              isDark ? 'border-slate-800 bg-slate-950/60' : 'border-[#e5eeff] bg-[#f8f9ff]'
            }`}>
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold">
                    Censo Oficial Escolar
                  </span>
                  <span className="text-xs text-slate-400">Jornada 6:15 AM - 12:15 PM</span>
                </div>
                <h3 className="text-xl font-extrabold mt-1">
                  Estudiantes Matriculados — Grado {selectedGroupModal} ({activeGroupStudents.length} Alumnos)
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setSelectedGroupModal(null)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {/* Modal Search Bar */}
            <div className={`p-4 border-b flex items-center justify-between gap-4 ${
              isDark ? 'border-slate-800' : 'border-[#e5eeff]'
            }`}>
              <div className="flex-1 relative">
                <span className="material-symbols-outlined text-[18px] text-slate-400 absolute left-3 top-2.5">
                  search
                </span>
                <input
                  type="text"
                  value={groupStudentsSearch}
                  onChange={(e) => setGroupStudentsSearch(e.target.value)}
                  placeholder={`Buscar en los 15 estudiantes de ${selectedGroupModal} por nombre o documento...`}
                  className={`w-full pl-9 pr-4 py-2 text-xs rounded-xl border outline-none ${
                    isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-[#f8f9ff] border-[#dce9ff] text-[#0b1c30]'
                  }`}
                />
              </div>
              <span className="text-xs text-emerald-400 font-bold shrink-0">
                {filteredGroupStudents.length} de {activeGroupStudents.length} visibles
              </span>
            </div>

            {/* Modal Content: Table of 15 Students */}
            <div className="flex-1 overflow-y-auto p-4">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className={`text-[11px] font-bold uppercase tracking-wider border-b ${
                    isDark ? 'bg-slate-800 text-slate-300 border-slate-700' : 'bg-[#f8f9ff] text-[#757684] border-[#e5eeff]'
                  }`}>
                    <th className="py-2.5 px-3">#</th>
                    <th className="py-2.5 px-3">Estudiante</th>
                    <th className="py-2.5 px-3">Documento</th>
                    <th className="py-2.5 px-3">Acudiente Vinculado</th>
                    <th className="py-2.5 px-3">Estado</th>
                    <th className="py-2.5 px-3 text-center">Acciones Convivencia</th>
                  </tr>
                </thead>
                <tbody className={`divide-y text-xs ${isDark ? 'divide-slate-800' : 'divide-[#e5eeff]'}`}>
                  {filteredGroupStudents.map((st, idx) => {
                    const guardian = lookupCensusGuardian(st.documentId);
                    return (
                      <tr key={st.documentId} className={isDark ? 'hover:bg-slate-800/40' : 'hover:bg-[#f8f9ff]'}>
                        <td className="py-2.5 px-3 text-slate-400 font-mono">
                          {idx + 1}
                        </td>
                        <td className="py-2.5 px-3 font-bold">
                          {st.fullName}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-cyan-400">
                          {st.documentId}
                        </td>
                        <td className="py-2.5 px-3">
                          {guardian ? (
                            <div>
                              <span className="font-semibold">{guardian.fullName}</span>
                              <span className="text-[11px] text-slate-400 block">
                                ({guardian.relationship}) • Tel: {guardian.phone}
                              </span>
                            </div>
                          ) : (
                            <span className="text-slate-500 italic">Por asignar</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400">
                            Matriculado • Activo
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => showToast(`Ficha convivencial generada para ${st.fullName} (${selectedGroupModal})`)}
                              className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-white text-[11px] font-bold cursor-pointer transition-colors"
                              title="Generar reporte o ficha convivencial"
                            >
                              Ficha Convivencial
                            </button>
                            {guardian && (
                              <button
                                onClick={() => {
                                  setSelectedGroupModal(null);
                                  handleStartChatWithRecipient({
                                    id: guardian.cedula,
                                    name: guardian.fullName,
                                    role: 'Acudiente',
                                    category: 'acudientes',
                                    detail: `Acudiente de ${st.fullName}`,
                                    email: guardian.email
                                  });
                                }}
                                className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold cursor-pointer transition-colors flex items-center gap-1"
                                title="Contactar acudiente por chat"
                              >
                                <span className="material-symbols-outlined text-[13px]">chat</span>
                                <span>Contactar</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Modal Footer */}
            <div className={`p-4 border-t flex items-center justify-between ${
              isDark ? 'border-slate-800 bg-slate-950/60' : 'border-[#e5eeff] bg-[#f8f9ff]'
            }`}>
              <span className="text-xs text-slate-400">
                15 estudiantes matriculados en Grado {selectedGroupModal} • I.E. Vallejuelos
              </span>
              <button
                type="button"
                onClick={() => setSelectedGroupModal(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold cursor-pointer"
              >
                Cerrar Nómina
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 2: REDACTAR CIRCULAR INSTITUCIONAL (Firebase Save)  */}
      {/* ========================================================= */}
      {showDraftCircularModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className={`w-full max-w-2xl rounded-2xl border shadow-2xl overflow-hidden ${
            isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-[#dce9ff] text-[#0b1c30]'
          }`}>
            <div className={`p-5 border-b flex items-center justify-between ${
              isDark ? 'border-slate-800 bg-slate-950/60' : 'border-[#e5eeff] bg-[#f8f9ff]'
            }`}>
              <div>
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider block">
                  Publicación en Firebase Firestore
                </span>
                <h3 className="text-lg font-extrabold mt-0.5">
                  Redactar Nueva Circular Oficial
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowDraftCircularModal(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <form onSubmit={handleSaveCircularSubmit} className="p-6 space-y-4">
              {circularFormError && (
                <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-semibold">
                  {circularFormError}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Título de la Circular *
                </label>
                <input
                  type="text"
                  value={circTitle}
                  onChange={(e) => setCircTitle(e.target.value)}
                  placeholder="Ej: Circular Oficial No. 11: Jornada Pedagógica y Acuerdos de Convivencia"
                  className={`w-full px-4 py-2.5 text-xs sm:text-sm rounded-xl border outline-none ${
                    isDark ? 'bg-slate-800 border-slate-700 text-white focus:border-emerald-400' : 'bg-[#f8f9ff] border-[#dce9ff] text-[#0b1c30] focus:border-[#00288e]'
                  }`}
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Destinatarios *
                  </label>
                  <select
                    value={circTarget}
                    onChange={(e) => setCircTarget(e.target.value)}
                    className={`w-full px-4 py-2.5 text-xs sm:text-sm rounded-xl border outline-none ${
                      isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-[#f8f9ff] border-[#dce9ff] text-[#0b1c30]'
                    }`}
                  >
                    <option value="Toda la Comunidad Educativa">Toda la Comunidad Educativa</option>
                    <option value="Estudiantes y Acudientes">Estudiantes y Acudientes</option>
                    <option value="Docentes y Padres de Familia">Docentes y Padres de Familia</option>
                    <option value="Consejo Directivo y Académico">Consejo Directivo y Académico</option>
                    <option value="Comité Escolar de Convivencia">Comité Escolar de Convivencia</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Nivel de Urgencia
                  </label>
                  <select
                    value={circUrgency}
                    onChange={(e) => setCircUrgency(e.target.value as 'normal' | 'alta' | 'urgente')}
                    className={`w-full px-4 py-2.5 text-xs sm:text-sm rounded-xl border outline-none ${
                      isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-[#f8f9ff] border-[#dce9ff] text-[#0b1c30]'
                    }`}
                  >
                    <option value="normal">Normal (Informativa)</option>
                    <option value="alta">Alta (Requerimiento institucional)</option>
                    <option value="urgente">Urgente (Atención inmediata)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Contenido Oficial del Comunicado *
                </label>
                <textarea
                  rows={5}
                  value={circContent}
                  onChange={(e) => setCircContent(e.target.value)}
                  placeholder="Redacta los antecedentes, disposiciones, instrucciones y fechas relevantes para la comunidad..."
                  className={`w-full p-4 text-xs sm:text-sm rounded-xl border outline-none ${
                    isDark ? 'bg-slate-800 border-slate-700 text-white focus:border-emerald-400' : 'bg-[#f8f9ff] border-[#dce9ff] text-[#0b1c30] focus:border-[#00288e]'
                  }`}
                  required
                />
              </div>

              <div className="flex items-center justify-between text-xs text-slate-400 pt-2">
                <span>Autor: <strong>{currentUser.fullName}</strong> ({currentUser.adminPosition || 'Coordinadora de Convivencia'})</span>
                <span>Fecha: <strong>{new Date().toLocaleDateString('es-CO')}</strong></span>
              </div>

              <div className="pt-4 border-t flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowDraftCircularModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSavingCircular}
                  className={`px-5 py-2.5 rounded-xl text-white text-xs font-bold flex items-center gap-2 cursor-pointer shadow-md disabled:opacity-50 ${
                    isDark ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-[#00288e] hover:bg-[#001f70]'
                  }`}
                >
                  {isSavingCircular ? (
                    <>
                      <span className="material-symbols-outlined text-[16px] animate-spin">sync</span>
                      <span>Guardando en Firebase...</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[16px]">publish</span>
                      <span>Publicar Circular Oficial</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 3: AGREGAR INTEGRANTE AL COMITÉ DE CONVIVENCIA      */}
      {/* ========================================================= */}
      {showAddMemberModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className={`w-full max-w-lg rounded-2xl border shadow-2xl overflow-hidden ${
            isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-[#dce9ff] text-[#0b1c30]'
          }`}>
            <div className={`p-5 border-b flex items-center justify-between ${
              isDark ? 'border-slate-800 bg-slate-950/60' : 'border-[#e5eeff] bg-[#f8f9ff]'
            }`}>
              <div>
                <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider block">
                  Comité Escolar de Convivencia
                </span>
                <h3 className="text-lg font-extrabold mt-0.5">
                  Agregar Integrante o Invitado
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddMemberModal(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <form onSubmit={handleSaveMemberSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Cargo o Asiento en el Comité *
                </label>
                <input
                  type="text"
                  value={newMemberRole}
                  onChange={(e) => setNewMemberRole(e.target.value)}
                  placeholder="Ej: Delegado de Convivencia Comunitaria / Invitado Especial"
                  className={`w-full px-4 py-2.5 text-xs rounded-xl border outline-none ${
                    isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-[#f8f9ff] border-[#dce9ff] text-[#0b1c30]'
                  }`}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Nombre Completo *
                </label>
                <input
                  type="text"
                  value={newMemberName}
                  onChange={(e) => setNewMemberName(e.target.value)}
                  placeholder="Nombre y apellidos del integrante"
                  className={`w-full px-4 py-2.5 text-xs rounded-xl border outline-none ${
                    isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-[#f8f9ff] border-[#dce9ff] text-[#0b1c30]'
                  }`}
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Documento de Identidad
                  </label>
                  <input
                    type="text"
                    value={newMemberDoc}
                    onChange={(e) => setNewMemberDoc(e.target.value)}
                    placeholder="Número de cédula"
                    className={`w-full px-3 py-2 text-xs rounded-xl border outline-none ${
                      isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-[#f8f9ff] border-[#dce9ff] text-[#0b1c30]'
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Teléfono de Contacto
                  </label>
                  <input
                    type="text"
                    value={newMemberPhone}
                    onChange={(e) => setNewMemberPhone(e.target.value)}
                    placeholder="Celular"
                    className={`w-full px-3 py-2 text-xs rounded-xl border outline-none ${
                      isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-[#f8f9ff] border-[#dce9ff] text-[#0b1c30]'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Correo Electrónico
                </label>
                <input
                  type="email"
                  value={newMemberEmail}
                  onChange={(e) => setNewMemberEmail(e.target.value)}
                  placeholder="correo@ejemplo.com"
                  className={`w-full px-3 py-2 text-xs rounded-xl border outline-none ${
                    isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-[#f8f9ff] border-[#dce9ff] text-[#0b1c30]'
                  }`}
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Observaciones / Acta de Elección
                </label>
                <input
                  type="text"
                  value={newMemberNotes}
                  onChange={(e) => setNewMemberNotes(e.target.value)}
                  placeholder="Ej: Invitado para mediación de caso específico según acta 04"
                  className={`w-full px-3 py-2 text-xs rounded-xl border outline-none ${
                    isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-[#f8f9ff] border-[#dce9ff] text-[#0b1c30]'
                  }`}
                />
              </div>

              <div className="pt-4 border-t flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddMemberModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className={`px-5 py-2.5 rounded-xl text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md ${
                    isDark ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-[#00288e] hover:bg-[#001f70]'
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">check</span>
                  <span>Guardar en Comité</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 4: CREAR FORO O ENCUESTA DE CONVIVENCIA             */}
      {/* ========================================================= */}
      {showCreatePostModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className={`w-full max-w-xl rounded-2xl border shadow-2xl overflow-hidden ${
            isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-[#dce9ff] text-[#0b1c30]'
          }`}>
            <div className={`p-5 border-b flex items-center justify-between ${
              isDark ? 'border-slate-800 bg-slate-950/60' : 'border-[#e5eeff] bg-[#f8f9ff]'
            }`}>
              <div>
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider block">
                  Participación y Democracia Escolar
                </span>
                <h3 className="text-lg font-extrabold mt-0.5">
                  Crear Nuevo Foro o Encuesta
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCreatePostModal(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <form onSubmit={handleSavePostSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Título del Debate o Consulta *
                </label>
                <input
                  type="text"
                  value={postTitle}
                  onChange={(e) => setPostTitle(e.target.value)}
                  placeholder="Ej: Pacto de Uso de Teléfonos Móviles en Horas de Clase"
                  className={`w-full px-4 py-2 text-xs rounded-xl border outline-none ${
                    isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-[#f8f9ff] border-[#dce9ff] text-[#0b1c30]'
                  }`}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Categoría
                </label>
                <select
                  value={postCategory}
                  onChange={(e) => setPostCategory(e.target.value as 'convivencia' | 'clima' | 'formativo' | 'general')}
                  className={`w-full px-3 py-2 text-xs rounded-xl border outline-none ${
                    isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-[#f8f9ff] border-[#dce9ff] text-[#0b1c30]'
                  }`}
                >
                  <option value="convivencia">Convivencia Escolar</option>
                  <option value="clima">Clima Institucional</option>
                  <option value="formativo">Proceso Formativo</option>
                  <option value="general">Interés General</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Descripción o Planteamiento del Debate *
                </label>
                <textarea
                  rows={4}
                  value={postContent}
                  onChange={(e) => setPostContent(e.target.value)}
                  placeholder="Explica el contexto y lo que se busca reflexionar con la comunidad educativa..."
                  className={`w-full p-3 text-xs rounded-xl border outline-none ${
                    isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-[#f8f9ff] border-[#dce9ff] text-[#0b1c30]'
                  }`}
                  required
                />
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={postHasSurvey}
                    onChange={(e) => setPostHasSurvey(e.target.checked)}
                    className="rounded text-emerald-500 focus:ring-emerald-400"
                  />
                  <span className="text-xs font-bold text-cyan-400">
                    Incluir Encuesta de Votación Comunitaria
                  </span>
                </label>
              </div>

              {postHasSurvey && (
                <div className={`p-4 rounded-xl border space-y-3 ${
                  isDark ? 'bg-slate-800/60 border-slate-700' : 'bg-[#f8f9ff] border-[#dce9ff]'
                }`}>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 mb-1">
                      Pregunta de la Encuesta
                    </label>
                    <input
                      type="text"
                      value={postSurveyQuestion}
                      onChange={(e) => setPostSurveyQuestion(e.target.value)}
                      placeholder="¿Está de acuerdo con restringir los celulares durante los descansos?"
                      className={`w-full px-3 py-1.5 text-xs rounded-lg border outline-none ${
                        isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-[#dce9ff] text-[#0b1c30]'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 mb-1">
                      Opciones de Respuesta
                    </label>
                    <div className="space-y-2">
                      {postSurveyOptions.map((opt, idx) => (
                        <input
                          key={idx}
                          type="text"
                          value={opt}
                          onChange={(e) => {
                            const copy = [...postSurveyOptions];
                            copy[idx] = e.target.value;
                            setPostSurveyOptions(copy);
                          }}
                          className={`w-full px-3 py-1.5 text-xs rounded-lg border outline-none ${
                            isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-[#dce9ff] text-[#0b1c30]'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-4 border-t flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreatePostModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSavingPost}
                  className={`px-5 py-2.5 rounded-xl text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md disabled:opacity-50 ${
                    isDark ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-[#00288e] hover:bg-[#001f70]'
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">send</span>
                  <span>{isSavingPost ? 'Publicando...' : 'Publicar Foro'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
