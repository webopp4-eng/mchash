'use client';

export interface User {
  id: string;
  walletAddress: string;
  chain: string;
  walletType?: string;
  username?: string;
  referralCode: string;
  platformBalance: string;
  role: string;
}

export const API_URL = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_RENDER_API_URL || 'https://mchash.onrender.com';

export const ADMIN_API_URL = process.env.NEXT_PUBLIC_ADMIN_API_URL || API_URL;

export function getAdminApiBase(): string {
  return ADMIN_API_URL || API_URL;
}

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('cmhash_token');
}

export function getUser(): User | null {
  if (typeof window === 'undefined') return null;
  const stored = localStorage.getItem('cmhash_user');
  if (!stored) return null;
  try {
    return JSON.parse(stored);
  } catch {
    return null;
  }
}

export function isAuthenticated(): boolean {
  return Boolean(getToken());
}

export function logout(router?: ReturnType<typeof import('next/navigation').useRouter>): void {
  localStorage.removeItem('cmhash_token');
  localStorage.removeItem('cmhash_user');
  if (router) {
    router.replace('/login');
  } else {
    window.location.href = '/login';
  }
}

export async function apiFetch(path: string, options: RequestInit = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  try {
    const res = await fetch(`${API_URL}${path}`, { ...options, headers });
    if (res.status === 401) {
      console.error('[apiFetch] Unauthorized access detected, logging out', path);
      logout();
      throw new Error('Session expired');
    }
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      console.error('[apiFetch] Backend request failed:', res.status, path, data);
      throw new Error(data.error || 'Request failed');
    }
    return data;
  } catch (error) {
    console.error('[apiFetch] Request error:', path, error);
    throw error;
  }
}