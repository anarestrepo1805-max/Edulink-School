import React, { useState } from 'react';
import { ActiveScreen, UserRole, UserProfile } from './types';
import { NavigationShell } from './components/NavigationShell';
import { LoginView } from './components/LoginView';
import { StudentDashboardView } from './components/StudentDashboardView';
import { StudentAssignmentView } from './components/StudentAssignmentView';
import { TeacherGradesView } from './components/TeacherGradesView';
import { FamilyDashboardView } from './components/FamilyDashboardView';
import { FamilyMessagingView } from './components/FamilyMessagingView';
import { getCurrentUser, logoutUser } from './services/authService';

export default function App() {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => getCurrentUser());
  // The first screen of the platform MUST be Login / Register as requested
  const [currentScreen, setCurrentScreen] = useState<ActiveScreen>('login');
  const [userRole, setUserRole] = useState<UserRole>(() => currentUser?.role || 'student');

  const handleLoginSuccess = (user: UserProfile) => {
    setCurrentUser(user);
    setUserRole(user.role);
    if (user.role === 'student') {
      setCurrentScreen('student_dashboard');
    } else if (user.role === 'teacher') {
      setCurrentScreen('teacher_grades');
    } else if (user.role === 'family') {
      setCurrentScreen('family_dashboard');
    }
  };

  const handleLogout = () => {
    logoutUser();
    setCurrentUser(null);
    setCurrentScreen('login');
  };

  const handleUpdateUser = (updatedUser: UserProfile) => {
    setCurrentUser(updatedUser);
  };

  // The first interface corresponds STRICTLY to the Facebook-style login/registration,
  // with no buttons or tabs from other sections visible.
  if (currentScreen === 'login' || !currentUser) {
    return (
      <LoginView
        onLoginSuccess={handleLoginSuccess}
        initialRole={userRole}
      />
    );
  }

  return (
    <NavigationShell
      currentScreen={currentScreen}
      onSelectScreen={setCurrentScreen}
      userRole={userRole}
      onSelectRole={setUserRole}
      currentUser={currentUser}
      onLogout={handleLogout}
    >
      {currentScreen === 'student_dashboard' && (
        <StudentDashboardView
          currentUser={currentUser}
          onNavigate={setCurrentScreen}
          onLogout={handleLogout}
          onUpdateUser={handleUpdateUser}
        />
      )}

      {currentScreen === 'student_assignment' && (
        <StudentAssignmentView
          onBack={() => setCurrentScreen('student_dashboard')}
          onNavigate={setCurrentScreen}
        />
      )}

      {currentScreen === 'teacher_grades' && (
        <TeacherGradesView
          currentUser={currentUser}
          onNavigate={setCurrentScreen}
          onLogout={handleLogout}
          onUpdateUser={handleUpdateUser}
        />
      )}

      {currentScreen === 'family_dashboard' && (
        <FamilyDashboardView
          currentUser={currentUser}
          onNavigate={setCurrentScreen}
          onLogout={handleLogout}
          onUpdateUser={handleUpdateUser}
        />
      )}

      {currentScreen === 'family_messaging' && (
        <FamilyMessagingView
          onNavigate={setCurrentScreen}
          onLogout={handleLogout}
        />
      )}
    </NavigationShell>
  );
}
