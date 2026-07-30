import { createClient } from '@supabase/supabase-js';
import { ShiftReport, User, ScheduleEntry } from '../types/nursing';

// Helper to fetch credentials from env or localStorage
export function getSupabaseCredentials() {
  const env = (import.meta as any).env || {};
  const localUrl = typeof window !== 'undefined' ? localStorage.getItem('v_supabase_url') : null;
  const localKey = typeof window !== 'undefined' ? localStorage.getItem('v_supabase_key') : null;

  const url = localUrl || env.VITE_SUPABASE_URL || '';
  const key = localKey || env.VITE_SUPABASE_ANON_KEY || '';

  return { url, key };
}

export function setSupabaseCredentials(url: string, key: string) {
  if (typeof window !== 'undefined') {
    if (url) localStorage.setItem('v_supabase_url', url.trim());
    else localStorage.removeItem('v_supabase_url');

    if (key) localStorage.setItem('v_supabase_key', key.trim());
    else localStorage.removeItem('v_supabase_key');

    window.location.reload();
  }
}

export const isSupabaseConfigured = (): boolean => {
  const { url, key } = getSupabaseCredentials();
  return (
    Boolean(url) &&
    Boolean(key) &&
    url !== 'https://seu-projeto.supabase.co' &&
    !url.includes('seu-projeto')
  );
};

// Cliente Supabase Instanciado
export const getSupabaseClient = () => {
  const { url, key } = getSupabaseCredentials();
  if (
    url &&
    key &&
    url !== 'https://seu-projeto.supabase.co' &&
    !url.includes('seu-projeto')
  ) {
    try {
      return createClient(url, key);
    } catch (e) {
      console.error('Erro ao instanciar cliente Supabase:', e);
      return null;
    }
  }
  return null;
};

export const supabase = getSupabaseClient();

/**
 * Mapeadores de/para formato do Banco de Dados PostgreSQL (snake_case)
 */
function mapReportToDb(report: ShiftReport) {
  return {
    id: report.id,
    date: report.date,
    shift: report.shift,
    author_id: report.authorId,
    author_name: report.authorName,
    author_role: report.authorRole,
    author_coren: report.authorCoren || null,
    co_authors: report.coAuthors || [],
    status: report.status,
    recebimento_plantao: report.recebimentoPlantao || '',
    attachments: report.attachments || [],
    movement: report.movement || {},
    checklist: report.checklist || [],
    feedback: report.feedback || {},
    passagem_plantao_sintese: report.passagemPlantaoSintese || '',
    complements: report.complements || [],
    tecnico_private_notes: report.tecnicoPrivateNotes || null,
    enfermeiro_private_notes: report.enfermeiroPrivateNotes || null,
    coordinator_conference: report.coordinatorConference || null,
    view_receipts: report.viewReceipts || [],
    audit_logs: report.auditLogs || []
  };
}

function mapDbToReport(row: any): ShiftReport {
  return {
    id: row.id,
    date: row.date,
    shift: row.shift,
    authorId: row.author_id,
    authorName: row.author_name,
    authorRole: row.author_role,
    authorCoren: row.author_coren || undefined,
    coAuthors: row.co_authors || [],
    status: row.status,
    recebimentoPlantao: row.recebimento_plantao || '',
    attachments: row.attachments || [],
    movement: row.movement || {
      altas: 0,
      admissoes: 0,
      transferenciasEnviadas: 0,
      transferenciasRecebidas: 0,
      obitos: 0,
      gestantesAcompanhamento: 0,
      nascimentos: 0
    },
    checklist: row.checklist || [],
    feedback: row.feedback || {},
    passagemPlantaoSintese: row.passagem_plantao_sintese || '',
    complements: row.complements || [],
    tecnicoPrivateNotes: row.tecnico_private_notes || undefined,
    enfermeiroPrivateNotes: row.enfermeiro_private_notes || undefined,
    coordinatorConference: row.coordinator_conference || undefined,
    viewReceipts: row.view_receipts || [],
    auditLogs: row.audit_logs || [],
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function mapUserToDb(user: User) {
  return {
    id: user.id,
    name: user.name,
    role: user.role,
    coren: user.coren || null,
    birth_date: user.birthDate,
    username: user.username,
    pin: user.pin
  };
}

function mapDbToUser(row: any): User {
  return {
    id: row.id,
    name: row.name,
    role: row.role,
    coren: row.coren || undefined,
    birthDate: row.birth_date,
    username: row.username,
    pin: row.pin
  };
}

function mapScheduleToDb(entry: ScheduleEntry) {
  return {
    id: entry.id,
    date: entry.date,
    user_id: entry.userId,
    user_name: entry.userName,
    shift: entry.shift,
    color: entry.color
  };
}

function mapDbToSchedule(row: any): ScheduleEntry {
  return {
    id: row.id,
    date: row.date,
    userId: row.user_id,
    userName: row.user_name,
    shift: row.shift,
    color: row.color
  };
}

/**
 * FUNÇÕES DE CONSULTA E SINCRONIZAÇÃO SUPABASE
 */

// 1. Relatórios
export async function fetchReportsFromSupabase(): Promise<ShiftReport[] | null> {
  const client = getSupabaseClient();
  if (!client) return null;
  try {
    const { data, error } = await client
      .from('shift_reports')
      .select('*')
      .order('date', { ascending: false });

    if (error) {
      console.error('Erro ao buscar relatórios do Supabase:', error);
      return null;
    }
    return data ? data.map(mapDbToReport) : [];
  } catch (err) {
    console.error('Falha de conexão com Supabase:', err);
    return null;
  }
}

export async function saveReportToSupabase(report: ShiftReport): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;
  try {
    const payload = mapReportToDb(report);
    const { error } = await client
      .from('shift_reports')
      .upsert(payload, { onConflict: 'id' });

    if (error) {
      console.error('Erro ao salvar relatório no Supabase:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Erro ao persistir relatório no Supabase:', err);
    return false;
  }
}

export async function deleteReportFromSupabase(id: string): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;
  try {
    const { error } = await client.from('shift_reports').delete().eq('id', id);
    if (error) {
      console.error('Erro ao excluir relatório no Supabase:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Erro ao excluir no Supabase:', err);
    return false;
  }
}

// 2. Usuários
export async function fetchUsersFromSupabase(): Promise<User[] | null> {
  const client = getSupabaseClient();
  if (!client) return null;
  try {
    const { data, error } = await client.from('users').select('*').order('name');
    if (error) {
      console.error('Erro ao buscar usuários do Supabase:', error);
      return null;
    }
    return data ? data.map(mapDbToUser) : [];
  } catch (err) {
    console.error('Erro de conexão com Supabase:', err);
    return null;
  }
}

export async function saveUserToSupabase(user: User): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;
  try {
    const payload = mapUserToDb(user);
    const { error } = await client.from('users').upsert(payload, { onConflict: 'id' });
    if (error) {
      console.error('Erro ao salvar usuário no Supabase:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Erro de salvamento do usuário:', err);
    return false;
  }
}

export async function deleteUserFromSupabase(id: string): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;
  try {
    const { error } = await client.from('users').delete().eq('id', id);
    if (error) {
      console.error('Erro ao excluir usuário no Supabase:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Erro ao excluir usuário:', err);
    return false;
  }
}

// 3. Escalas
export async function fetchSchedulesFromSupabase(): Promise<ScheduleEntry[] | null> {
  const client = getSupabaseClient();
  if (!client) return null;
  try {
    const { data, error } = await client.from('schedules').select('*').order('date');
    if (error) {
      console.error('Erro ao buscar escalas do Supabase:', error);
      return null;
    }
    return data ? data.map(mapDbToSchedule) : [];
  } catch (err) {
    console.error('Erro de escala no Supabase:', err);
    return null;
  }
}

export async function saveScheduleToSupabase(entry: ScheduleEntry): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;
  try {
    const payload = mapScheduleToDb(entry);
    const { error } = await client.from('schedules').upsert(payload, { onConflict: 'id' });
    if (error) {
      console.error('Erro ao salvar escala no Supabase:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Erro de salvamento de escala:', err);
    return false;
  }
}

export async function deleteScheduleFromSupabase(id: string): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;
  try {
    const { error } = await client.from('schedules').delete().eq('id', id);
    if (error) {
      console.error('Erro ao remover escala no Supabase:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Erro de remoção de escala:', err);
    return false;
  }
}

// 4. Sincronização em Lote (Envio Inicial / Migração Local -> Supabase)
export async function syncAllLocalToSupabase(
  users: User[],
  reports: ShiftReport[],
  schedules: ScheduleEntry[]
): Promise<{ success: boolean; message: string }> {
  const client = getSupabaseClient();
  if (!client) {
    return {
      success: false,
      message: 'Supabase não está configurado. Por favor insira a URL e ANON KEY do seu projeto.'
    };
  }

  try {
    // Sincronizar usuários
    if (users.length > 0) {
      const userPayloads = users.map(mapUserToDb);
      const { error: userErr } = await client
        .from('users')
        .upsert(userPayloads, { onConflict: 'id' });
      if (userErr) throw userErr;
    }

    // Sincronizar relatórios
    if (reports.length > 0) {
      const reportPayloads = reports.map(mapReportToDb);
      const { error: reportErr } = await client
        .from('shift_reports')
        .upsert(reportPayloads, { onConflict: 'id' });
      if (reportErr) throw reportErr;
    }

    // Sincronizar escalas
    if (schedules.length > 0) {
      const schedulePayloads = schedules.map(mapScheduleToDb);
      const { error: schErr } = await client
        .from('schedules')
        .upsert(schedulePayloads, { onConflict: 'id' });
      if (schErr) throw schErr;
    }

    return {
      success: true,
      message: 'Todos os registros locais foram sincronizados com sucesso para o Supabase!'
    };
  } catch (err: any) {
    console.error('Falha na sincronização geral:', err);
    return {
      success: false,
      message: `Erro na sincronização: ${err.message || 'Verifique as tabelas do banco'}`
    };
  }
}
