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
  employeeStatus?: string;
  avatar?: string;
  /** Dashboard page whitelist for EMPLOYEE accounts (null = not configured/legacy full access). */
  pagePermissions?: string[] | null;
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
    if (process.env.NODE_ENV === 'development' || localStorage.getItem('cmhash_debug')) {
      console.log(`[AUTH-DEBUG:STATE] getUser() from cache: id=${runtimeUserCache.id}`);
    }
    return runtimeUserCache;
  }
  
  const stored = localStorage.getItem('cmhash_user');
  if (!stored) {
    if (process.env.NODE_ENV === 'development' || localStorage.getItem('cmhash_debug')) {
      console.log(`[AUTH-DEBUG:STATE] getUser() no data in localStorage`);
    }
    return null;
  }
  
  try {
    const user = JSON.parse(stored);
    if (process.env.NODE_ENV === 'development' || localStorage.getItem('cmhash_debug')) {
      console.log(`[AUTH-DEBUG:STATE] getUser() from localStorage: id=${user.id}`);
    }
    runtimeUserCache = user;
    return user;
  } catch (err) {
    if (process.env.NODE_ENV === 'development' || localStorage.getItem('cmhash_debug')) {
      console.error(`[AUTH-DEBUG:STATE] getUser() failed to parse: ${err instanceof Error ? err.message : String(err)}`);
    }
    return null;
  }
}

export function setUser(user: User | null): void {
  if (typeof window === 'undefined') return;
  
  runtimeUserCache = user;
  
  if (user) {
    const userData = JSON.stringify(user);
    localStorage.setItem('cmhash_user', userData);
    if (process.env.NODE_ENV === 'development' || localStorage.getItem('cmhash_debug')) {
      console.log(`[AUTH-DEBUG:STATE] setUser() stored: id=${user.id}`);
      console.log(`[AUTH-DEBUG:STATE] runtimeUserCache updated`);
      console.log(`[AUTH-DEBUG:STORAGE] localStorage['cmhash_user'] set`);
    }
  } else {
    localStorage.removeItem('cmhash_user');
    if (process.env.NODE_ENV === 'development' || localStorage.getItem('cmhash_debug')) {
      console.log(`[AUTH-DEBUG:STATE] setUser(null) cleared user data`);
      console.log(`[AUTH-DEBUG:STORAGE] localStorage['cmhash_user'] removed`);
    }
  }
}

export function isAuthenticated(): boolean {
  // Check if user data exists - if it does, they're authenticated
  // (token is in httpOnly cookie, can't access from JS, but if user data is there, they logged in successfully)
  const user = getUser();
  const isAuth = Boolean(user);
  if (process.env.NODE_ENV === 'development' || localStorage.getItem('cmhash_debug')) {
    console.log(`[AUTH-DEBUG:STATE] isAuthenticated() result: ${isAuth}`);
  }
  return isAuth;
}

export async function logout(router?: ReturnType<typeof import('next/navigation').useRouter>): Promise<void> {
  try {
    if (process.env.NODE_ENV === 'development' || localStorage.getItem('cmhash_debug')) {
      console.log(`[AUTH-DEBUG:REQUEST] POST /api/auth/logout calling`);
    }

    // Call backend logout endpoint to clear httpOnly cookie
    await fetch(`${API_URL}/api/auth/logout`, {
      method: 'POST',
      credentials: 'include', // Include httpOnly cookies
    });

    if (process.env.NODE_ENV === 'development' || localStorage.getItem('cmhash_debug')) {
      console.log(`[AUTH-DEBUG:REQUEST] POST /api/auth/logout completed`);
    }
  } catch (error) {
    if (process.env.NODE_ENV === 'development' || localStorage.getItem('cmhash_debug')) {
      console.error(`[AUTH-DEBUG:REQUEST] POST /api/auth/logout failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  // Clear runtime cache
  runtimeUserCache = null;
  
  // Clear localStorage
  localStorage.removeItem('cmhash_token');
  localStorage.removeItem('cmhash_user');
  localStorage.removeItem('cmhash_created');
  localStorage.removeItem('cmhash_return_url');
  localStorage.removeItem('cmhash_autoconnect');
  
  if (process.env.NODE_ENV === 'development' || localStorage.getItem('cmhash_debug')) {
    console.log(`[AUTH-DEBUG:STATE] logout() cleared all auth data`);
  }
  
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

  if (process.env.NODE_ENV === 'development' || localStorage.getItem('cmhash_debug')) {
    console.log(`[AUTH-DEBUG:REQUEST] ${options.method || 'GET'} ${path} called`);
    console.log(`[AUTH-DEBUG:REQUEST] fetch options: credentials='include'`);
  }

  try {
    const res = await fetch(`${API_URL}${path}`, {
      ...options,
      credentials: 'include', // Include httpOnly cookies with every request
      headers,
    });

    if (process.env.NODE_ENV === 'development' || localStorage.getItem('cmhash_debug')) {
      console.log(`[AUTH-DEBUG:REQUEST] Response status: ${res.status} for ${path}`);
    }

    if (res.status === 401) {
      if (process.env.NODE_ENV === 'development' || localStorage.getItem('cmhash_debug')) {
        console.error(`[AUTH-DEBUG:REQUEST] Unauthorized (401), logging out`);
      }
      logout();
      throw new Error('Session expired');
    }

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      if (process.env.NODE_ENV === 'development' || localStorage.getItem('cmhash_debug')) {
        console.error(`[AUTH-DEBUG:REQUEST] Request failed: ${res.status} ${path}`);
        console.error(`[AUTH-DEBUG:REQUEST] Error: ${data.error}`);
      }
      throw new Error(data.error || 'Request failed');
    }
    return data;
  } catch (error) {
    if (process.env.NODE_ENV === 'development' || localStorage.getItem('cmhash_debug')) {
      console.error(`[AUTH-DEBUG:REQUEST] Exception: ${path} - ${error instanceof Error ? error.message : String(error)}`);
    }
    throw error;
  }
}