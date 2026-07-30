import React, { useState, useEffect } from 'react';
import { Database, CheckCircle2, AlertCircle, Copy, Check, CloudUpload, RefreshCw, X, ShieldAlert, FileCode, Key, Link } from 'lucide-react';
import { isSupabaseConfigured, syncAllLocalToSupabase, getSupabaseCredentials, setSupabaseCredentials } from '../lib/supabase';
import { User, ShiftReport, ScheduleEntry } from '../types/nursing';

interface SupabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: User[];
  reports: ShiftReport[];
  schedule: ScheduleEntry[];
  onReloadFromSupabase: () => void;
}

export const SupabaseModal: React.FC<SupabaseModalProps> = ({
  isOpen,
  onClose,
  users,
  reports,
  schedule,
  onReloadFromSupabase
}) => {
  const isConnected = isSupabaseConfigured();
  const [copiedSql, setCopiedSql] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form State for URL and Key
  const [urlInput, setUrlInput] = useState('');
  const [keyInput, setKeyInput] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const creds = getSupabaseCredentials();
      setUrlInput(creds.url);
      setKeyInput(creds.key);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSaveCredentials = (e: React.FormEvent) => {
    e.preventDefault();
    setSupabaseCredentials(urlInput, keyInput);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  const sqlSchemaSnippet = `-- ESQUEMA SUPABASE / POSTGRESQL (HOSPITAL MARIA VENERI)
CREATE TABLE IF NOT EXISTS public.users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  coren TEXT,
  birth_date TEXT NOT NULL,
  username TEXT UNIQUE NOT NULL,
  pin TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.schedules (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL,
  user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  user_name TEXT NOT NULL,
  shift TEXT NOT NULL,
  color TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.shift_reports (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL,
  shift TEXT NOT NULL,
  author_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  author_name TEXT NOT NULL,
  author_role TEXT NOT NULL,
  author_coren TEXT,
  co_authors JSONB DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'concluido',
  recebimento_plantao TEXT,
  attachments JSONB DEFAULT '[]'::jsonb,
  movement JSONB DEFAULT '{}'::jsonb,
  checklist JSONB DEFAULT '[]'::jsonb,
  feedback JSONB DEFAULT '{}'::jsonb,
  passagem_plantao_sintese TEXT,
  complements JSONB DEFAULT '[]'::jsonb,
  tecnico_private_notes TEXT,
  enfermeiro_private_notes TEXT,
  coordinator_conference JSONB,
  view_receipts JSONB DEFAULT '[]'::jsonb,
  audit_logs JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shift_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Acesso Total Users" ON public.users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Acesso Total Schedules" ON public.schedules FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Acesso Total Shift Reports" ON public.shift_reports FOR ALL USING (true) WITH CHECK (true);`;

  const handleCopySql = () => {
    navigator.clipboard.writeText(sqlSchemaSnippet);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 3000);
  };

  const handleSyncToSupabase = async () => {
    setSyncing(true);
    setSyncMessage(null);
    const result = await syncAllLocalToSupabase(users, reports, schedule);
    setSyncing(false);
    if (result.success) {
      setSyncMessage({ type: 'success', text: result.message });
      onReloadFromSupabase();
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
            <Database className="w-5 h-5 text-emerald-400" />
            <div>
              <h2 className="font-bold text-sm">Integração com Banco de Dados (Supabase)</h2>
              <p className="text-[11px] text-sky-200">
                Sincronização Nuvem & Persistência de Dados
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
          {/* Status Bar */}
          <div
            className={`p-3.5 rounded-xl border flex items-center justify-between ${
              isConnected
                ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                : 'bg-amber-50 border-amber-300 text-amber-950'
            }`}
          >
            <div className="flex items-center gap-2.5">
              {isConnected ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
              )}
              <div>
                <div className="font-extrabold text-xs">
                  {isConnected
                    ? '⚡ Supabase Conectado e Ativo!'
                    : '⚠️ Modo de Armazenamento Local (LocalStorage)'}
                </div>
                <div className="text-[11px] opacity-90 mt-0.5">
                  {isConnected
                    ? 'Seus relatórios e cadastros estão salvos de forma permanente na nuvem Supabase.'
                    : 'Insira ou altere sua URL e Chave Anônima do Supabase abaixo para conectar o banco de dados imediato.'}
                </div>
              </div>
            </div>
          </div>

          {/* Form para Inserir / Editar URL e Anon Key */}
          <form onSubmit={handleSaveCredentials} className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-3">
            <div className="font-extrabold text-xs text-[#003865] flex items-center gap-1.5">
              <Key className="w-4 h-4 text-emerald-600" />
              Credenciais de Conexão Supabase (URL & API Key)
            </div>

            <div className="space-y-2">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center gap-1">
                  <Link className="w-3 h-3 text-slate-500" />
                  Project URL (VITE_SUPABASE_URL):
                </label>
                <input
                  type="url"
                  placeholder="https://xxxx.supabase.co"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs font-mono bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center gap-1">
                  <Key className="w-3 h-3 text-slate-500" />
                  Anon Public Key (VITE_SUPABASE_ANON_KEY):
                </label>
                <input
                  type="text"
                  placeholder="eyJhbGciOiJIUzI1NiIsInR..."
                  value={keyInput}
                  onChange={(e) => setKeyInput(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs font-mono bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              {savedSuccess ? (
                <span className="text-emerald-700 font-bold text-[11px] flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> Credenciais salvas! Atualizando...
                </span>
              ) : (
                <span className="text-[10px] text-slate-500">
                  As credenciais são mantidas com segurança no seu navegador/ambiente.
                </span>
              )}

              <button
                type="submit"
                className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-3.5 py-1.5 rounded-lg text-xs shadow-xs transition-colors flex items-center gap-1"
              >
                <Check className="w-3.5 h-3.5" />
                Salvar Credenciais
              </button>
            </div>
          </form>

          {/* Sincronização Automática ou Manual */}
          {isConnected && (
            <div className="bg-sky-50 border border-sky-200 p-4 rounded-xl space-y-2">
              <div className="font-bold text-sky-950 text-xs flex items-center gap-1.5">
                <CloudUpload className="w-4 h-4 text-sky-700" />
                Sincronização em Lote (Envio de Dados Locais para Nuvem)
              </div>
              <p className="text-[11px] text-slate-700 leading-relaxed">
                Você pode enviar todos os cadastros de usuários, escalas e relatórios de plantão do navegador diretamente para o banco de dados do Supabase.
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
                  onClick={handleSyncToSupabase}
                  disabled={syncing}
                  className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-xs transition-colors disabled:opacity-50"
                >
                  {syncing ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <CloudUpload className="w-3.5 h-3.5" />
                  )}
                  {syncing ? 'Sincronizando...' : 'Sincronizar Agora com Supabase'}
                </button>

                <button
                  onClick={onReloadFromSupabase}
                  className="bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 font-bold px-3 py-2 rounded-xl text-xs flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-slate-600" />
                  Recarregar do Supabase
                </button>
              </div>
            </div>
          )}

          {/* Guia de Configuração Passo a Passo */}
          <div className="space-y-3">
            <h3 className="font-extrabold text-xs text-[#003865] uppercase tracking-wider flex items-center gap-1.5">
              <FileCode className="w-4 h-4 text-emerald-600" />
              Como Configurar seu Banco de Dados no Supabase (Passo a Passo)
            </h3>

            <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl space-y-2 text-[11px] leading-relaxed">
              <p>
                <strong>1. Crie seu Projeto Gratuito:</strong> Acesse{' '}
                <a
                  href="https://supabase.com"
                  target="_blank"
                  rel="noreferrer"
                  className="text-emerald-700 underline font-bold"
                >
                  supabase.com
                </a>{' '}
                e crie um novo projeto.
              </p>
              <p>
                <strong>2. Execute o Script de Tabelas (SQL Schema):</strong> No painel do Supabase, clique em <strong>SQL Editor</strong> e rode o script abaixo para criar as tabelas <code className="bg-slate-200 px-1 rounded font-mono">users</code>, <code className="bg-slate-200 px-1 rounded font-mono">shift_reports</code> e <code className="bg-slate-200 px-1 rounded font-mono">schedules</code>.
              </p>
              <p>
                <strong>3. Adicione as Variáveis no seu Projeto / Cloud Run:</strong>
                <br />
                - <code className="bg-slate-200 px-1 rounded font-mono">VITE_SUPABASE_URL</code>: URL do seu projeto Supabase.
                <br />
                - <code className="bg-slate-200 px-1 rounded font-mono">VITE_SUPABASE_ANON_KEY</code>: Chave anônima pública (<code className="bg-slate-200 px-1 rounded font-mono">anon public key</code>).
              </p>
            </div>

            {/* Código SQL DDL */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-700 text-[11px]">
                  Script SQL DDL Pronto para o SQL Editor do Supabase:
                </span>
                <button
                  onClick={handleCopySql}
                  className="bg-slate-800 hover:bg-slate-900 text-white font-bold text-[10px] px-2.5 py-1 rounded-lg flex items-center gap-1 transition-colors"
                >
                  {copiedSql ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" /> Copiado!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" /> Copiar SQL
                    </>
                  )}
                </button>
              </div>

              <pre className="bg-slate-950 text-emerald-400 font-mono text-[10px] p-3 rounded-xl overflow-x-auto max-h-48 border border-slate-800 leading-normal">
                {sqlSchemaSnippet}
              </pre>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 border-t border-slate-200 p-3.5 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl text-xs transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
