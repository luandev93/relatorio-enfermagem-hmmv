import React, { useState, useEffect } from 'react';
import { User, ShiftReport, ScheduleEntry, ReportAddendum } from './types/nursing';
import { INITIAL_USERS, INITIAL_REPORTS, INITIAL_SCHEDULE } from './data/mockUsers';
import { DEFAULT_CHECKLIST } from './data/defaultChecklist';
import { Header } from './components/Header';
import { AuthScreen } from './components/AuthScreen';
import { Dashboard } from './components/Dashboard';
import { ShiftReportForm } from './components/ShiftReportForm';
import { ReportDetailModal } from './components/ReportDetailModal';
import { PendingSignaturesModal } from './components/PendingSignaturesModal';
import { UserManagementModal } from './components/UserManagementModal';
import { ChangePasswordModal } from './components/ChangePasswordModal';
import { FirebaseModal } from './components/FirebaseModal';
import {
  isFirebaseConfigured,
  fetchReportsFromFirebase,
  fetchUsersFromFirebase,
  fetchSchedulesFromFirebase,
  saveReportToFirebase,
  deleteReportFromFirebase,
  saveUserToFirebase,
  deleteUserFromFirebase,
  saveScheduleToFirebase,
  deleteScheduleFromFirebase
} from './lib/firebase';
import {
  isSupabaseConfigured,
  fetchReportsFromSupabase,
  fetchUsersFromSupabase,
  fetchSchedulesFromSupabase,
  saveReportToSupabase,
  deleteReportFromSupabase,
  saveUserToSupabase,
  deleteUserFromSupabase,
  saveScheduleToSupabase,
  deleteScheduleFromSupabase
} from './lib/supabase';

export default function App() {
  // LocalStorage Persistence Keys
  const STORAGE_USERS = 'hmsm_nursing_users_v4';
  const STORAGE_REPORTS = 'hmsm_nursing_reports_v4';
  const STORAGE_SCHEDULE = 'hmsm_nursing_schedule_v4';
  const STORAGE_SESSION = 'hmsm_nursing_session_v4';

  // State
  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem(STORAGE_USERS);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Error parsing stored users', e);
      }
    }
    return INITIAL_USERS;
  });

  const [reports, setReports] = useState<ShiftReport[]>(() => {
    const saved = localStorage.getItem(STORAGE_REPORTS);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Error parsing stored reports', e);
      }
    }
    return INITIAL_REPORTS;
  });

  const [schedule, setSchedule] = useState<ScheduleEntry[]>(() => {
    const saved = localStorage.getItem(STORAGE_SCHEDULE);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Error parsing stored schedule', e);
      }
    }
    return INITIAL_SCHEDULE;
  });

  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem(STORAGE_SESSION) || sessionStorage.getItem(STORAGE_SESSION);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Error parsing session', e);
      }
    }
    return null;
  });

  // Controla se a sessão atual deve persistir entre fechamentos do
  // navegador (localStorage) ou apenas durante a aba aberta (sessionStorage)
  const [rememberSession, setRememberSession] = useState<boolean>(true);

  // UI Navigation & Modals
  const [currentView, setCurrentView] = useState<'dashboard' | 'form'>('dashboard');
  const [editingReport, setEditingReport] = useState<ShiftReport | null>(null);
  const [viewingReport, setViewingReport] = useState<ShiftReport | null>(null);
  const [showPendingModal, setShowPendingModal] = useState<boolean>(false);
  const [showUserManagement, setShowUserManagement] = useState<boolean>(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState<boolean>(false);
  const [showSupabaseModal, setShowSupabaseModal] = useState<boolean>(false);
  const [showFirebaseModal, setShowFirebaseModal] = useState<boolean>(false);

  // Carregar Dados do Firebase Firestore (relatorio-hmmv)
  const loadDataFromFirebase = async () => {
    if (!isFirebaseConfigured()) return;

    try {
      const [remoteReports, remoteUsers, remoteSchedules] = await Promise.all([
        fetchReportsFromFirebase(),
        fetchUsersFromFirebase(),
        fetchSchedulesFromFirebase()
      ]);

      if (remoteReports && remoteReports.length > 0) {
        setReports(remoteReports);
      }
      if (remoteUsers && remoteUsers.length > 0) {
        setUsers(remoteUsers);
      }
      if (remoteSchedules && remoteSchedules.length > 0) {
        setSchedule(remoteSchedules);
      }
    } catch (err) {
      console.error('Erro ao carregar dados do Firebase:', err);
    }
  };

  // Carregar Dados do Supabase
  const loadDataFromSupabase = async () => {
    if (!isSupabaseConfigured()) return;

    try {
      const [remoteReports, remoteUsers, remoteSchedules] = await Promise.all([
        fetchReportsFromSupabase(),
        fetchUsersFromSupabase(),
        fetchSchedulesFromSupabase()
      ]);

      if (remoteReports && remoteReports.length > 0) {
        setReports(remoteReports);
      }
      if (remoteUsers && remoteUsers.length > 0) {
        setUsers(remoteUsers);
      }
      if (remoteSchedules && remoteSchedules.length > 0) {
        setSchedule(remoteSchedules);
      }
    } catch (err) {
      console.error('Erro ao carregar dados do Supabase:', err);
    }
  };

  useEffect(() => {
    // Tenta carregar do Firebase primeiro, depois do Supabase se necessário
    const initData = async () => {
      await loadDataFromFirebase();
      if (!isFirebaseConfigured()) {
        await loadDataFromSupabase();
      }
    };
    initData();
  }, []);

  // Sync to LocalStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_USERS, JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem(STORAGE_REPORTS, JSON.stringify(reports));
  }, [reports]);

  useEffect(() => {
    localStorage.setItem(STORAGE_SCHEDULE, JSON.stringify(schedule));
  }, [schedule]);

  useEffect(() => {
    if (currentUser) {
      if (rememberSession) {
        localStorage.setItem(STORAGE_SESSION, JSON.stringify(currentUser));
        sessionStorage.removeItem(STORAGE_SESSION);
      } else {
        sessionStorage.setItem(STORAGE_SESSION, JSON.stringify(currentUser));
        localStorage.removeItem(STORAGE_SESSION);
      }
    } else {
      localStorage.removeItem(STORAGE_SESSION);
      sessionStorage.removeItem(STORAGE_SESSION);
    }
  }, [currentUser, rememberSession]);

  // Auth Handlers
  const handleLogin = (user: User, rememberMe: boolean) => {
    setRememberSession(rememberMe);
    setCurrentUser(user);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentView('dashboard');
    setEditingReport(null);
  };

  const handleAddUser = (newUserRaw: Omit<User, 'id'>) => {
    const newUser: User = {
      ...newUserRaw,
      id: `u-${Date.now()}`
    };
    setUsers((prev) => [...prev, newUser]);
    saveUserToFirebase(newUser);
    saveUserToSupabase(newUser);
  };

  const handleEditUser = (updatedUser: User) => {
    setUsers((prev) => prev.map((u) => (u.id === updatedUser.id ? updatedUser : u)));
    saveUserToFirebase(updatedUser);
    saveUserToSupabase(updatedUser);
    if (currentUser && currentUser.id === updatedUser.id) {
      setCurrentUser(updatedUser);
    }
  };

  const handleDeleteUser = (userId: string) => {
    setUsers((prev) => prev.filter((u) => u.id !== userId));
    deleteUserFromFirebase(userId);
    deleteUserFromSupabase(userId);
  };

  const handleUpdatePassword = (userId: string, newPin: string) => {
    setUsers((prev) => {
      const updated = prev.map((u) => (u.id === userId ? { ...u, pin: newPin } : u));
      const targetUser = updated.find((u) => u.id === userId);
      if (targetUser) {
        saveUserToFirebase(targetUser);
        saveUserToSupabase(targetUser);
      }
      return updated;
    });
    if (currentUser && currentUser.id === userId) {
      setCurrentUser((prev) => (prev ? { ...prev, pin: newPin } : null));
    }
  };

  // Schedule Handlers
  const handleAddScheduleEntry = (newEntryRaw: Omit<ScheduleEntry, 'id'>) => {
    const newEntry: ScheduleEntry = {
      ...newEntryRaw,
      id: `sch-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`
    };
    setSchedule((prev) => [...prev, newEntry]);
    saveScheduleToFirebase(newEntry);
    saveScheduleToSupabase(newEntry);
  };

  const handleRemoveScheduleEntry = (id: string) => {
    setSchedule((prev) => prev.filter((s) => s.id !== id));
    deleteScheduleFromFirebase(id);
    deleteScheduleFromSupabase(id);
  };

  // Report Handlers
  const handleSaveReport = (savedReport: ShiftReport) => {
    setReports((prev) => {
      const exists = prev.some((r) => r.id === savedReport.id);
      if (exists) {
        return prev.map((r) => (r.id === savedReport.id ? savedReport : r));
      }
      return [savedReport, ...prev];
    });
    saveReportToFirebase(savedReport);
    saveReportToSupabase(savedReport);
    setEditingReport(null);
    setCurrentView('dashboard');
  };

  const handleDeleteReport = (reportId: string) => {
    setReports((prev) => prev.filter((r) => r.id !== reportId));
    deleteReportFromFirebase(reportId);
    deleteReportFromSupabase(reportId);
    if (viewingReport && viewingReport.id === reportId) {
      setViewingReport(null);
    }
  };

  const handleRegisterView = (reportId: string, user: User) => {
    setReports((prev) =>
      prev.map((rep) => {
        if (rep.id !== reportId) return rep;

        const existingReceipts = rep.viewReceipts || [];
        const alreadyViewed = existingReceipts.some((v) => v.userId === user.id);
        if (alreadyViewed) return rep;

        const newReceipt = {
          userId: user.id,
          userName: user.name,
          userRole: user.role,
          timestamp: Date.now()
        };

        const updatedReport = {
          ...rep,
          viewReceipts: [...existingReceipts, newReceipt]
        };

        saveReportToFirebase(updatedReport);
        saveReportToSupabase(updatedReport);

        if (viewingReport && viewingReport.id === reportId) {
          setViewingReport(updatedReport);
        }

        return updatedReport;
      })
    );
  };

  const handleCoordinatorConference = (reportId: string, notes?: string) => {
    if (!currentUser) return;
    const now = Date.now();
    setReports((prev) =>
      prev.map((rep) => {
        if (rep.id !== reportId) return rep;

        const conferenceData = {
          userId: currentUser.id,
          userName: currentUser.name,
          userRole: currentUser.role,
          timestamp: now,
          notes
        };

        const conferenceAuditLog = {
          id: `audit-${now}`,
          timestamp: now,
          editorId: currentUser.id,
          editorName: currentUser.name,
          editorRole: currentUser.role,
          summary: `Conferência e validação da Coordenação realizada por ${currentUser.name}`
        };

        const updatedAudit = [conferenceAuditLog, ...(rep.auditLogs || [])];

        const updatedReport: ShiftReport = {
          ...rep,
          coordinatorConference: conferenceData,
          auditLogs: updatedAudit,
          updatedAt: now
        };

        saveReportToFirebase(updatedReport);
        saveReportToSupabase(updatedReport);

        if (viewingReport && viewingReport.id === reportId) {
          setViewingReport(updatedReport);
        }

        return updatedReport;
      })
    );
  };

  const handleValidateReport = (reportId: string, userId: string) => {
    setReports((prev) =>
      prev.map((rep) => {
        if (rep.id !== reportId) return rep;

        const updatedCoAuthors = rep.coAuthors.map((ca) =>
          ca.userId === userId ? { ...ca, validated: true, validatedAt: Date.now() } : ca
        );

        const allValidated = updatedCoAuthors.every((ca) => ca.validated);
        const newStatus = allValidated ? 'concluido' : 'aguardando_assinatura';

        const updatedReport: ShiftReport = {
          ...rep,
          coAuthors: updatedCoAuthors,
          status: newStatus,
          updatedAt: new Date().toISOString()
        };

        saveReportToFirebase(updatedReport);
        saveReportToSupabase(updatedReport);

        if (viewingReport && viewingReport.id === reportId) {
          setViewingReport(updatedReport);
        }

        return updatedReport;
      })
    );
  };

  const handleAddComplement = (reportId: string, text: string) => {
    if (!currentUser) return;
    const now = new Date().toISOString();

    const newAddendum: ReportAddendum = {
      id: `add-${Date.now()}`,
      authorId: currentUser.id,
      authorName: currentUser.name,
      authorRole: currentUser.role,
      text,
      timestamp: Date.now()
    };

    setReports((prev) =>
      prev.map((rep) => {
        if (rep.id !== reportId) return rep;

        const updatedComplements = [...(rep.complements || []), newAddendum];
        const updatedReport: ShiftReport = {
          ...rep,
          complements: updatedComplements,
          updatedAt: now
        };

        saveReportToFirebase(updatedReport);
        saveReportToSupabase(updatedReport);

        if (viewingReport && viewingReport.id === reportId) {
          setViewingReport(updatedReport);
        }

        return updatedReport;
      })
    );
  };

  // Pending signatures count
  const pendingSignaturesCount = 0;

  // Unauthenticated view
  if (!currentUser) {
    return (
      <AuthScreen
        users={users}
        onLogin={handleLogin}
        onAddUser={handleAddUser}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-800 print:bg-white print:min-h-0 print:h-auto">
      <div className="flex-1 flex flex-col print:hidden">
        {/* Top Navigation Header */}
        <Header
          currentUser={currentUser}
          pendingSignaturesCount={pendingSignaturesCount}
          onOpenPendingModal={() => setShowPendingModal(true)}
          onOpenUserManagement={() => setShowUserManagement(true)}
          onOpenChangePassword={() => setShowChangePasswordModal(true)}
          onOpenFirebaseModal={() => setShowFirebaseModal(true)}
          onNewReport={() => {
            setEditingReport(null);
            setCurrentView('form');
          }}
          onLogout={handleLogout}
        />

        {/* Main Container */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6 sm:px-6">
          {currentView === 'dashboard' ? (
            <Dashboard
              reports={reports}
              currentUser={currentUser}
              allUsers={users}
              schedule={schedule}
              onNewReport={() => {
                setEditingReport(null);
                setCurrentView('form');
              }}
              onOpenReportDetail={(report) => setViewingReport(report)}
              onEditReport={(report) => {
                setEditingReport(report);
                setCurrentView('form');
              }}
              onDeleteReport={handleDeleteReport}
              onValidateReport={handleValidateReport}
              onAddScheduleEntry={handleAddScheduleEntry}
              onRemoveScheduleEntry={handleRemoveScheduleEntry}
            />
          ) : (
            <ShiftReportForm
              initialReport={editingReport}
              currentUser={currentUser}
              allUsers={users}
              defaultChecklist={DEFAULT_CHECKLIST}
              onSaveReport={handleSaveReport}
              onCancel={() => {
                setEditingReport(null);
                setCurrentView('dashboard');
              }}
            />
          )}
        </main>

        {/* Hospital Footer */}
        <footer className="bg-slate-800 text-slate-400 text-xs text-center py-4 px-4 border-t border-slate-700 mt-auto print:hidden">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
            <span>Hospital Municipal Maria Veneri • Sistema Digital de Registro</span>
            <span>Acesso Seguro (DDMM) • LGPD Compliant</span>
          </div>
        </footer>
      </div>

      {/* Modals */}
      {viewingReport && (
        <ReportDetailModal
          report={viewingReport}
          currentUser={currentUser}
          onRegisterView={handleRegisterView}
          onCoordinatorConference={handleCoordinatorConference}
          onAddComplement={handleAddComplement}
          onEditReport={(rep) => {
            setEditingReport(rep);
            setCurrentView('form');
          }}
          onDeleteReport={handleDeleteReport}
          onClose={() => setViewingReport(null)}
        />
      )}

      {showPendingModal && (
        <PendingSignaturesModal
          currentUser={currentUser}
          reports={reports}
          onValidateReport={handleValidateReport}
          onOpenReportDetail={(report) => setViewingReport(report)}
          onClose={() => setShowPendingModal(false)}
        />
      )}

      {showUserManagement && (
        <UserManagementModal
          users={users}
          currentUser={currentUser}
          onAddUser={handleAddUser}
          onEditUser={handleEditUser}
          onDeleteUser={handleDeleteUser}
          onClose={() => setShowUserManagement(false)}
        />
      )}

      {showChangePasswordModal && (
        <ChangePasswordModal
          currentUser={currentUser}
          onUpdatePassword={handleUpdatePassword}
          onClose={() => setShowChangePasswordModal(false)}
        />
      )}

      {showFirebaseModal && (
        <FirebaseModal
          isOpen={showFirebaseModal}
          onClose={() => setShowFirebaseModal(false)}
          users={users}
          reports={reports}
          schedule={schedule}
          onReloadFromFirebase={loadDataFromFirebase}
        />
      )}

      {/* Hospital Footer */}
      <footer className="bg-slate-800 text-slate-400 text-xs text-center py-4 px-4 border-t border-slate-700 print:hidden mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Hospital Municipal Maria Veneri • Relatório da Equipe de Enfermagem</span>
          <span>Acesso Seguro (DDMM) & LGPD Compliant</span>
        </div>
      </footer>
    </div>
  );
}

