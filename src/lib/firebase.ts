import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  query,
  orderBy,
  writeBatch
} from 'firebase/firestore';
import { ShiftReport, User, ScheduleEntry } from '../types/nursing';
import firebaseConfigJson from '../../firebase-applet-config.json';

// Configuração Firebase
const firebaseConfig = firebaseConfigJson;

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Usa a ID do banco especificada na configuração do applet se houver
const databaseId = firebaseConfigJson.firestoreDatabaseId || '(default)';
export const db = getFirestore(app, databaseId);

export const isFirebaseConfigured = (): boolean => {
  return Boolean(firebaseConfig.projectId && firebaseConfig.apiKey);
};

// Helper de timeout para chamadas de rede do Firebase (evita travamentos se estiver offline)
async function withTimeout<T>(promise: Promise<T>, timeoutMs = 6000): Promise<T> {
  let timeoutId: any;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error('Firebase operation timed out'));
    }, timeoutMs);
  });
  return Promise.race([promise, timeoutPromise]).finally(() => {
    clearTimeout(timeoutId);
  });
}

/**
 * Funções de Sanitização para o Firestore (remove propriedades com valor 'undefined')
 */
function sanitizeForFirestore<T>(obj: T): T {
  if (obj === null || obj === undefined) {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeForFirestore(item)) as unknown as T;
  }
  if (typeof obj === 'object') {
    const cleaned: any = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) {
        cleaned[key] = sanitizeForFirestore(value);
      }
    }
    return cleaned;
  }
  return obj;
}

/**
 * 1. RELATÓRIOS (shift_reports)
 */
export async function fetchReportsFromFirebase(): Promise<ShiftReport[] | null> {
  try {
    const q = query(collection(db, 'shift_reports'), orderBy('date', 'desc'));
    const snapshot = await withTimeout(getDocs(q));
    const reports: ShiftReport[] = [];
    snapshot.forEach((docSnap) => {
      reports.push(docSnap.data() as ShiftReport);
    });
    return reports;
  } catch (err) {
    console.warn('Firebase em modo offline ou indisponível (Relatórios):', err);
    return null;
  }
}

export async function saveReportToFirebase(report: ShiftReport): Promise<boolean> {
  try {
    const cleanData = sanitizeForFirestore(report);
    await withTimeout(setDoc(doc(db, 'shift_reports', report.id), cleanData, { merge: true }));
    return true;
  } catch (err) {
    console.warn('Erro ao salvar relatório no Firebase:', err);
    return false;
  }
}

export async function deleteReportFromFirebase(id: string): Promise<boolean> {
  try {
    await withTimeout(deleteDoc(doc(db, 'shift_reports', id)));
    return true;
  } catch (err) {
    console.warn('Erro ao excluir relatório no Firebase:', err);
    return false;
  }
}

/**
 * 2. USUÁRIOS (users)
 */
export async function fetchUsersFromFirebase(): Promise<User[] | null> {
  try {
    const snapshot = await withTimeout(getDocs(collection(db, 'users')));
    const users: User[] = [];
    snapshot.forEach((docSnap) => {
      users.push(docSnap.data() as User);
    });
    return users;
  } catch (err) {
    console.warn('Firebase em modo offline ou indisponível (Usuários):', err);
    return null;
  }
}

export async function saveUserToFirebase(user: User): Promise<boolean> {
  try {
    const cleanData = sanitizeForFirestore(user);
    await withTimeout(setDoc(doc(db, 'users', user.id), cleanData, { merge: true }));
    return true;
  } catch (err) {
    console.warn('Erro ao salvar usuário no Firebase:', err);
    return false;
  }
}

export async function deleteUserFromFirebase(id: string): Promise<boolean> {
  try {
    await withTimeout(deleteDoc(doc(db, 'users', id)));
    return true;
  } catch (err) {
    console.warn('Erro ao excluir usuário no Firebase:', err);
    return false;
  }
}

/**
 * 3. ESCALAS (schedules)
 */
export async function fetchSchedulesFromFirebase(): Promise<ScheduleEntry[] | null> {
  try {
    const snapshot = await withTimeout(getDocs(collection(db, 'schedules')));
    const schedules: ScheduleEntry[] = [];
    snapshot.forEach((docSnap) => {
      schedules.push(docSnap.data() as ScheduleEntry);
    });
    return schedules;
  } catch (err) {
    console.warn('Firebase em modo offline ou indisponível (Escalas):', err);
    return null;
  }
}

export async function saveScheduleToFirebase(entry: ScheduleEntry): Promise<boolean> {
  try {
    const cleanData = sanitizeForFirestore(entry);
    await withTimeout(setDoc(doc(db, 'schedules', entry.id), cleanData, { merge: true }));
    return true;
  } catch (err) {
    console.warn('Erro ao salvar escala no Firebase:', err);
    return false;
  }
}

export async function deleteScheduleFromFirebase(id: string): Promise<boolean> {
  try {
    await withTimeout(deleteDoc(doc(db, 'schedules', id)));
    return true;
  } catch (err) {
    console.warn('Erro ao remover escala no Firebase:', err);
    return false;
  }
}

/**
 * 4. SINCRONIZAÇÃO EM LOTE (Locais -> Firebase Firestore)
 */
export async function syncAllLocalToFirebase(
  users: User[],
  reports: ShiftReport[],
  schedules: ScheduleEntry[]
): Promise<{ success: boolean; message: string }> {
  try {
    const batch = writeBatch(db);

    users.forEach((u) => {
      batch.set(doc(db, 'users', u.id), sanitizeForFirestore(u), { merge: true });
    });

    reports.forEach((r) => {
      batch.set(doc(db, 'shift_reports', r.id), sanitizeForFirestore(r), { merge: true });
    });

    schedules.forEach((s) => {
      batch.set(doc(db, 'schedules', s.id), sanitizeForFirestore(s), { merge: true });
    });

    await withTimeout(batch.commit(), 10000);

    return {
      success: true,
      message: 'Todos os registros locais foram sincronizados com sucesso no Firebase Cloud Firestore!'
    };
  } catch (err: any) {
    console.warn('Erro de sincronização com Firebase:', err);
    return {
      success: false,
      message: `Erro na sincronização: ${err.message || 'Falha ao conectar ao Firestore'}`
    };
  }
}
