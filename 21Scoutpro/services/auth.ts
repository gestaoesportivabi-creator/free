/**
 * Serviço de Autenticação
 * 
 * Usa o Backend PostgreSQL (SCOUT 21 PRO)
 * - Login: POST /api/auth/login
 * - Registro: POST /api/auth/register
 */

import { User } from '../types';
import { getApiUrl } from '../config';

// Interface para dados do coach (armazenado localmente)
export interface CoachData {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  teamName: string;
  sport: string;
  photoUrl: string;
  role: 'Treinador';
  createdAt: string;
  spreadsheetId: string;
  spreadsheetUrl?: string; // URL completa do Web App
  active: boolean;
}

// Simulação de banco de dados de coaches
const MOCK_COACHES: CoachData[] = [
  {
    id: 'default-coach-1',
    name: 'Treinador Demo',
    email: 'treinador@clube.com',
    passwordHash: 'e99a18c428cb38d5f260853678922e03', // hash de 'afc25'
    teamName: 'AFC 25',
    sport: 'futsal',
    photoUrl: 'https://images.unsplash.com/photo-1560272564-c83b66b1ad12?q=80&w=600&auto=format&fit=crop',
    role: 'Treinador',
    createdAt: new Date().toISOString(),
    spreadsheetId: '1h1EeCezkEfFZ-oxObrs3G8f0f4DODEsTXv10WYduL2w',
    spreadsheetUrl: 'https://script.google.com/macros/s/AKfycbywCHc-MEJDN-nvNLVYCC3UXelnZFxhQEuZr4aBfz4kQjvLfzqTRD1NuBytgKLs8TD5/exec',
    active: true
  }
];

/**
 * Autentica um treinador via API Mestra
 */
export async function authenticateCoach(email: string, password: string): Promise<User | null> {
  try {
    const apiUrl = `${getApiUrl()}/auth/login`;

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const result = await response.json();

    if (!result.success || !result.data) {
      console.error('❌ Login failed:', result.error);
      return null;
    }

    const userData = result.data.user;
    return {
      id: userData.id,
      name: userData.name,
      email: userData.email,
      role: userData.role === 'TECNICO' ? 'Treinador' : userData.role,
    };

  } catch (error) {
    console.error('❌ Exception in authentication:', error);
    return null;
  }
}

/**
 * Registra um novo treinador (SaaS V2)
 */
export async function registerCoach(name: string, email: string, password: string): Promise<{ success: boolean, error?: string, user?: User }> {
  try {
    const apiUrl = `${getApiUrl()}/auth/register`;
    const payload = {
      name: name.trim(),
      email: email.trim(),
      password,
      roleName: 'TECNICO'
    };

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const result = await response.json();

    if (result.success && result.data) {
      return {
        success: true,
        user: {
          id: result.data.user.id,
          name: result.data.user.name,
          email: result.data.user.email,
          role: result.data.user.role === 'TECNICO' ? 'Treinador' : result.data.user.role,
        }
      };
    }
    return { success: false, error: result.error || 'Erro ao criar conta' };

  } catch (e: any) {
    console.error('❌ Exception in registration:', e);
    return { success: false, error: e.toString() };
  }
}

/**
 * Valida se o usuário está autenticado
 */
export function isAuthenticated(user: User | null): boolean {
  return user !== null && user.role === 'Treinador';
}

/**
 * Logout (limpa sessão)
 */
export function logout(): void {
  /* noop — sessão limpa pelo chamador */
}

/**
 * Função mock para compatibilidade (não usada mais)
 */
export async function getCoachByEmail(email: string): Promise<CoachData | null> {
  const normalizedEmail = email.trim().toLowerCase();
  return MOCK_COACHES.find(c => c.email === normalizedEmail) || null;
}
