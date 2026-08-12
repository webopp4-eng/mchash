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

// Runtime user cache for hydration mismatch issues
let runtimeUserCache: User | null = null;

export function getAdminApiBase(): string {
  return ADMIN_API_URL || API_URL;
}

export function getToken(): string | null {
  // Token is now stored in httpOnly cookie (not accessible from JavaScript)
  // Frontend should rely on the cookie being sent automatically with credentials: 'include'
  if (typeof window === 'undefined') return null;
  
  // Try to get from localStorage for backward compatibility (during transition)
  const stored = localStorage.getItem('cmhash_token');
  if (stored) return stored;
  
  // Token is in httpOnly cookie - not readable from JavaScript for security
  return null;
}

export function getUser(): User | null {
  if (typeof window === 'undefined') return null;
  
  // Check runtime cache first (for hydration issues)
  if (runtimeUserCache) {
    console.log('[getUser] Returning cached user:', runtimeUserCache.id);
    return runtimeUserCache;
  }
  
  const stored = localStorage.getItem('cmhash_user');
  if (!stored) {
    console.log('[getUser] No user data in localStorage');
    return null;
  }
  
  try {
    const user = JSON.parse(stored);
    console.log('[getUser] Loaded user from localStorage:', user.id);
    runtimeUserCache = user;
    return user;
  } catch (err) {
    console.error('[getUser] Failed to parse user data:', err);
    return null;
  }
}

export function setUser(user: User | null): void {
  if (typeof window === 'undefined') return;
  
  runtimeUserCache = user;
  
  if (user) {
    const userData = JSON.stringify(user);
    localStorage.setItem('cmhash_user', userData);
    console.log('[setUser] Stored user:', user.id);
  } else {
    localStorage.removeItem('cmhash_user');
    console.log('[setUser] Cleared user data');
  }
}

export function isAuthenticated(): boolean {
  // Check if user data exists - if it does, they're authenticated
  // (token is in httpOnly cookie, can't access from JS, but if user data is there, they logged in successfully)
  const user = getUser();
  const isAuth = Boolean(user);
  console.log('[isAuthenticated]', { isAuth, hasUser: !!user });
  return isAuth;
}

export async function logout(router?: ReturnType<typeof import('next/navigation').useRouter>): Promise<void> {
  try {
    // Call backend logout endpoint to clear httpOnly cookie
    await fetch(`${API_URL}/api/auth/logout`, {
      method: 'POST',
      credentials: 'include', // Include httpOnly cookies
    });
  } catch (error) {
    console.error('[logout] Request failed:', error);
  }
  
  // Clear runtime cache
  runtimeUserCache = null;
  
  // Clear localStorage
  localStorage.removeItem('cmhash_token');
  localStorage.removeItem('cmhash_user');
  localStorage.removeItem('cmhash_created');
  localStorage.removeItem('cmhash_return_url');
  localStorage.removeItem('cmhash_autoconnect');
  
  console.log('[logout] Cleared all auth data');
  
  if (router) {
    router.push('/login');
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
    const res = await fetch(`${API_URL}${path}`, {
      ...options,
      credentials: 'include', // Include httpOnly cookies with every request
      headers,
    });
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