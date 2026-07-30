import React, { useState } from 'react';
import { Flame, CheckCircle2, AlertCircle, CloudUpload, RefreshCw, X, ShieldCheck, Database, Layers } from 'lucide-react';
import { isFirebaseConfigured, syncAllLocalToFirebase } from '../lib/firebase';
import { User, ShiftReport, ScheduleEntry } from '../types/nursing';
import firebaseConfig from '../../firebase-applet-config.json';

interface FirebaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: User[];
  reports: ShiftReport[];
  schedule: ScheduleEntry[];
  onReloadFromFirebase: () => void;
}

export const FirebaseModal: React.FC<FirebaseModalProps> = ({
  isOpen,
  onClose,
  users,
  reports,
  schedule,
  onReloadFromFirebase
}) => {
  const isConnected = isFirebaseConfigured();
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!isOpen) return null;

  const handleSyncToFirebase = async () => {
    setSyncing(true);
    setSyncMessage(null);
    const result = await syncAllLocalToFirebase(users, reports, schedule);
    setSyncing(false);
    if (result.success) {
      setSyncMessage({ type: 'success', text: result.message });
      onReloadFromFirebase();
    } else {
      setSyncMessage({ type: 'error', text: result.message });
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-[#003865] text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Flame className="w-6 h-6 text-amber-400 fill-amber-400" />
            <div>
              <h2 className="font-bold text-sm">Banco de Dados Firebase Firestore (Relatorio-HMMV)</h2>
              <p className="text-[11px] text-sky-200">
                Sincronização Nuvem em Tempo Real • Hospital Maria Veneri
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-300 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs text-slate-800">
          {/* Connection Badge */}
          <div
            className={`p-3.5 rounded-xl border flex items-center justify-between ${
              isConnected
                ? 'bg-amber-50/80 border-amber-300 text-amber-950'
                : 'bg-slate-50 border-slate-300 text-slate-900'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-500/10 rounded-lg">
                <Flame className="w-5 h-5 text-amber-600 fill-amber-500" />
              </div>
              <div>
                <div className="font-extrabold text-xs flex items-center gap-1.5">
                  <span>Firebase Project:</span>
                  <span className="font-mono bg-amber-200/60 text-amber-900 px-1.5 py-0.5 rounded text-[11px]">
                    {firebaseConfig.projectId || 'relatorio-hmmv'}
                  </span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 inline" />
                </div>
                <div className="text-[11px] text-slate-600 mt-0.5">
                  Conectado ao Firestore (ID: <code className="font-mono text-[10px]">{firebaseConfig.firestoreDatabaseId}</code>)
                </div>
              </div>
            </div>
          </div>

          {/* Details & Actions */}
          <div className="bg-sky-50 border border-sky-200 p-4 rounded-xl space-y-2.5">
            <div className="font-bold text-sky-950 text-xs flex items-center gap-1.5">
              <CloudUpload className="w-4 h-4 text-sky-700" />
              Sincronização com Firestore (Nuvem Google Firebase)
            </div>
            <p className="text-[11px] text-slate-700 leading-relaxed">
              Todos os seus dados de enfermeiros, relatórios de plantão de 12h e escalas de trabalho são automaticamente sincronizados com o banco de dados seguro do projeto <strong>relatorio-hmmv</strong>.
            </p>

            {syncMessage && (
              <div
                className={`p-2.5 rounded-lg text-xs font-semibold ${
                  syncMessage.type === 'success'
                    ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                    : 'bg-rose-100 text-rose-900 border border-rose-300'
                }`}
              >
                {syncMessage.text}
              </div>
            )}

            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={handleSyncToFirebase}
                disabled={syncing}
                className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
              >
                {syncing ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <CloudUpload className="w-3.5 h-3.5" />
                )}
                {syncing ? 'Sincronizando...' : 'Enviar Dados Locais para o Firebase'}
              </button>

              <button
                onClick={onReloadFromFirebase}
                className="bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 font-bold px-3 py-2 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5 text-slate-600" />
                Recarregar do Firebase
              </button>
            </div>
          </div>

          {/* Firestore Security Rules Info */}
          <div className="bg-emerald-50 border border-emerald-200 p-3.5 rounded-xl space-y-1.5">
            <div className="font-extrabold text-xs text-emerald-950 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Regras de Segurança Publicadas
            </div>
            <p className="text-[11px] text-emerald-900 leading-relaxed">
              Suas regras do Firestore (<code className="font-mono bg-emerald-100 px-1 rounded">firestore.rules</code>) foram compiladas e implantadas com sucesso no seu projeto Firebase <strong>relatorio-hmmv</strong>.
            </p>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-2.5 text-center">
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
              <div className="text-[10px] text-slate-500 uppercase font-semibold">Relatórios</div>
              <div className="text-base font-extrabold text-[#003865]">{reports.length}</div>
            </div>
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
              <div className="text-[10px] text-slate-500 uppercase font-semibold">Usuários</div>
              <div className="text-base font-extrabold text-[#003865]">{users.length}</div>
            </div>
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
              <div className="text-[10px] text-slate-500 uppercase font-semibold">Escalas</div>
              <div className="text-base font-extrabold text-[#003865]">{schedule.length}</div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 border-t border-slate-200 p-3.5 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
