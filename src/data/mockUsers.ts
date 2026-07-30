import { User, ShiftReport, ScheduleEntry } from '../types/nursing';
import { DEFAULT_CHECKLIST } from './defaultChecklist';

// Calculate DDMM from YYYY-MM-DD
export function getDDMMFromBirthDate(birthDateStr: string): string {
  if (!birthDateStr) return '0101';
  const parts = birthDateStr.split('-');
  if (parts.length === 3) {
    const day = parts[2].padStart(2, '0');
    const month = parts[1].padStart(2, '0');
    return `${day}${month}`;
  }
  return '0101';
}

export const INITIAL_USERS: User[] = [
  {
    id: 'u-admin',
    name: 'Administrador do Sistema',
    role: 'Admin',
    coren: 'COREN-ADMIN',
    birthDate: '1980-01-01',
    username: 'admin',
    pin: '0000'
  }
];

// Clean initial state with no mock reports
export const INITIAL_REPORTS: ShiftReport[] = [];

// Clean initial schedule
export const INITIAL_SCHEDULE: ScheduleEntry[] = [];
