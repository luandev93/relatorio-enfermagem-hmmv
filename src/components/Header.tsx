import React from 'react';
import { User } from '../types/nursing';
import { Activity, Bell, LogOut, Users, PlusCircle, KeyRound, Flame } from 'lucide-react';
import { isFirebaseConfigured } from '../lib/firebase';

interface HeaderProps {
  currentUser: User | null;
  pendingSignaturesCount: number;
  onOpenPendingModal: () => void;
  onOpenUserManagement: () => void;
  onOpenChangePassword: () => void;
  onOpenFirebaseModal: () => void;
  onNewReport: () => void;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  pendingSignaturesCount,
  onOpenPendingModal,
  onOpenUserManagement,
  onOpenChangePassword,
  onOpenFirebaseModal,
  onNewReport,
  onLogout
}) => {
  const isFirebaseActive = isFirebaseConfigured();
  const isAdmin = currentUser?.username === 'admin' || currentUser?.role === 'Admin' || currentUser?.role === 'Coordenador(a) de Enfermagem';

  return (
    <header className="bg-emerald-800 text-white shadow-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 py-3 sm:px-6 flex flex-wrap items-center justify-between gap-3">
        {/* Simple Header mentioning Relatório da Equipe de Enfermagem */}
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-full bg-emerald-900 border border-emerald-400 flex items-center justify-center text-white shadow-inner shrink-0">
            <Activity className="w-5 h-5 text-emerald-300" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-bold tracking-tight leading-tight">
              Relatório da Equipe de Enfermagem
            </h1>
            <p className="text-[11px] text-emerald-200 font-medium flex items-center gap-1.5 flex-wrap">
              <span>Hospital Municipal Maria Veneri</span>

              {/* Badge Firebase (Apenas visível para Admins) */}
              {isAdmin && (
                <button
                  type="button"
                  onClick={onOpenFirebaseModal}
                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-amber-950/80 border border-amber-400/60 hover:bg-amber-900 transition-colors cursor-pointer text-amber-200"
                  title="Configurações Firebase Firestore (relatorio-hmmv)"
                >
                  <Flame className="w-3 h-3 text-amber-400 fill-amber-400" />
                  <span>Firebase On</span>
                </button>
              )}
            </p>
          </div>
        </div>

        {/* User Status & Action Controls */}
        {currentUser && (
          <div className="flex items-center gap-2 sm:gap-2.5 ml-auto">
            {/* Button: Firebase Modal (Apenas visível para Admins) */}
            {isAdmin && (
              <button
                onClick={onOpenFirebaseModal}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-amber-600/90 hover:bg-amber-600 text-white border border-amber-400/60 transition-all cursor-pointer shadow-xs"
                title="Banco de Dados Firebase (relatorio-hmmv)"
              >
                <Flame className="w-3.5 h-3.5 fill-amber-300 text-amber-300" />
                <span className="hidden lg:inline">Firebase</span>
              </button>
            )}

            {/* Button: Adicionar novo relatório */}
            <button
              onClick={onNewReport}
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-xl text-xs font-semibold shadow-xs transition-all border border-emerald-400/40 active:scale-95"
              title="Adicionar novo relatório"
            >
              <PlusCircle className="w-4 h-4 text-emerald-200" />
              <span>Adicionar novo relatório</span>
            </button>

            {/* Pending Signatures Badge */}
            {pendingSignaturesCount > 0 && (
              <button
                onClick={onOpenPendingModal}
                className="relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-amber-500 text-amber-950 border border-amber-300 shadow-xs transition-all animate-pulse"
                title="Assinaturas Pendentes"
              >
                <Bell className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Pendências</span>
                <span className="bg-amber-900 text-amber-100 px-1.5 py-0.2 rounded-full text-[10px] font-bold">
                  {pendingSignaturesCount}
                </span>
              </button>
            )}

            {/* Staff Management */}
            <button
              onClick={onOpenUserManagement}
              className="flex items-center gap-1 bg-emerald-900/60 hover:bg-emerald-900 text-emerald-100 px-2.5 py-1.5 rounded-xl text-xs font-medium border border-emerald-700/60 transition-colors"
              title="Equipe"
            >
              <Users className="w-4 h-4" />
              <span className="hidden md:inline">Equipe</span>
            </button>

            {/* Change password button */}
            <button
              onClick={onOpenChangePassword}
              className="p-1.5 bg-emerald-900/60 hover:bg-emerald-900 text-emerald-100 rounded-xl border border-emerald-700/60 transition-colors"
              title="Alterar Senha"
            >
              <KeyRound className="w-4 h-4 text-emerald-300" />
            </button>

            {/* Current user badge */}
            <div className="hidden sm:flex items-center gap-2 bg-emerald-900/80 px-2.5 py-1 rounded-xl border border-emerald-700/80 text-xs">
              <div className="text-left">
                <div className="font-semibold text-white leading-tight">{currentUser.name}</div>
                <div className="text-[10px] text-emerald-200 leading-tight">{currentUser.role}</div>
              </div>
            </div>

            {/* Logout Button */}
            <button
              onClick={onLogout}
              className="p-1.5 text-emerald-200 hover:text-white hover:bg-emerald-700 rounded-xl transition-colors"
              title="Sair"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

