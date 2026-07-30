-- =================================================================
-- ESQUEMA COMPLETO DE BANCO DE DADOS - HOSPITAL MARIA VENERI
-- SUPABASE / POSTGRESQL DDL SCRIPT
-- =================================================================
-- Copie e cole este código no "SQL Editor" do seu painel do Supabase.

-- 1. EXTENSÕES ÚTEIS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TABELA DE USUÁRIOS E EQUIPE DE ENFERMAGEM
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

-- 3. TABELA DE ESCALA MENSAL/DIÁRIA
CREATE TABLE IF NOT EXISTS public.schedules (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL, -- Formato YYYY-MM-DD
  user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  user_name TEXT NOT NULL,
  shift TEXT NOT NULL, -- 'diurno' | 'noturno'
  color TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. TABELA PRINCIPAL DE RELATÓRIOS DE PLANTÃO (12h)
CREATE TABLE IF NOT EXISTS public.shift_reports (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL, -- Formato YYYY-MM-DD
  shift TEXT NOT NULL, -- 'diurno' | 'noturno'
  author_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  author_name TEXT NOT NULL,
  author_role TEXT NOT NULL,
  author_coren TEXT,
  co_authors JSONB DEFAULT '[]'::jsonb, -- Array de CoAuthorValidation
  status TEXT NOT NULL DEFAULT 'concluido', -- 'concluido' | 'aguardando_assinatura' | 'rascunho'
  
  -- Seções do Relatório
  recebimento_plantao TEXT,
  attachments JSONB DEFAULT '[]'::jsonb,
  movement JSONB DEFAULT '{}'::jsonb, -- PatientMovement
  checklist JSONB DEFAULT '[]'::jsonb, -- ChecklistItem[]
  feedback JSONB DEFAULT '{}'::jsonb, -- FeedbackData
  passagem_plantao_sintese TEXT,
  complements JSONB DEFAULT '[]'::jsonb, -- ReportAddendum[]
  
  -- Notas Privadas por Perfil
  tecnico_private_notes TEXT,
  enfermeiro_private_notes TEXT,
  
  -- Conferência e Auditoria
  coordinator_conference JSONB, -- CoordinatorConference
  view_receipts JSONB DEFAULT '[]'::jsonb, -- ViewReceipt[]
  audit_logs JSONB DEFAULT '[]'::jsonb, -- AuditLog[]
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. ÍNDICES DE DESEMPENHO
CREATE INDEX IF NOT EXISTS idx_shift_reports_date ON public.shift_reports(date);
CREATE INDEX IF NOT EXISTS idx_shift_reports_author ON public.shift_reports(author_id);
CREATE INDEX IF NOT EXISTS idx_schedules_date ON public.schedules(date);
CREATE INDEX IF NOT EXISTS idx_users_username ON public.users(username);

-- 6. TRIGGER PARA ATUALIZAR TIMESTAMP AUTOMATICAMENTE
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_users_timestamp ON public.users;
CREATE TRIGGER trg_update_users_timestamp
BEFORE UPDATE ON public.users
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

DROP TRIGGER IF EXISTS trg_update_shift_reports_timestamp ON public.shift_reports;
CREATE TRIGGER trg_update_shift_reports_timestamp
BEFORE UPDATE ON public.shift_reports
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- 7. DESABILITAR RLS (OU LIBERAR ACESSO ANON) PARA USO COM VITE_SUPABASE_ANON_KEY
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shift_reports ENABLE ROW LEVEL SECURITY;

-- Políticas de Acesso Público para a chave de API Anônima
DROP POLICY IF EXISTS "Acesso Total Anonimo Users" ON public.users;
CREATE POLICY "Acesso Total Anonimo Users" ON public.users FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Acesso Total Anonimo Schedules" ON public.schedules;
CREATE POLICY "Acesso Total Anonimo Schedules" ON public.schedules FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Acesso Total Anonimo Shift Reports" ON public.shift_reports;
CREATE POLICY "Acesso Total Anonimo Shift Reports" ON public.shift_reports FOR ALL USING (true) WITH CHECK (true);

-- HABILITAR REALTIME NO SUPABASE (OPCIONAL)
BEGIN;
  DROP PUBLICATION IF EXISTS supabase_realtime;
  CREATE PUBLICATION supabase_realtime FOR TABLE public.shift_reports, public.users, public.schedules;
COMMIT;
