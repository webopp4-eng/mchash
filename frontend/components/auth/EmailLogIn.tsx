'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { API_URL } from '@/lib/auth';

interface EmailLogInProps {
  onBack: () => void;
  onSignUpClick: () => void;
}

export default function EmailLogIn({ onBack, onSignUpClick }: EmailLogInProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setError(null);
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/api/auth/email/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          setError('Invalid email or password. Please check your credentials or create a new account.');
        } else if (response.status === 400) {
          setError('Please enter a valid email and password.');
        } else if (response.status === 403) {
          setError('Your account has been deactivated. Please contact support.');
        } else {
          setError(data.error || 'Login failed');
        }
        return;
      }

      // Store user data in localStorage
      if (data.user) {
        localStorage.setItem('cmhash_user', JSON.stringify(data.user));
      }
      if (data.token) {
        localStorage.setItem('cmhash_token', data.token);
      }

      // Success - redirect based on role
      const role = data.user?.role;
      if (role === 'SUPER_ADMIN' || role === 'EMPLOYEE') {
        router.push('/admin');
      } else {
        router.push('/dashboard');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <button
          onClick={onBack}
          className="mb-4 flex items-center gap-2 rounded-full border border-sky-100 bg-white/80 px-3 py-1.5 text-xs font-bold text-slate-600 shadow-sm transition-colors hover:border-cmblue-200 hover:text-cmblue-700"
        >
          ← Back
        </button>
        <div className="flex items-center gap-2.5">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-cmblue-500 to-sky-500 text-white shadow-md">
            ⛏
          </span>
          <div>
            <h2 className="text-xl font-extrabold tracking-tight text-slate-950">Welcome back</h2>
            <p className="text-xs font-medium text-slate-500">Sign in to continue mining with CM HASH</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-[22px] border border-rose-200/80 bg-rose-50/80 px-4 py-3 text-sm font-semibold text-rose-600 backdrop-blur-xl">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Email */}
        <div>
          <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-slate-500">Email</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="you@example.com"
            className="mc-input"
            disabled={loading}
            required
          />
        </div>

        {/* Password */}
        <div>
          <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-slate-500">Password</label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="••••••••"
            className="mc-input"
            disabled={loading}
            required
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cmblue-500 to-sky-500 px-4 py-3 text-sm font-bold text-white shadow-[0_10px_24px_rgba(0,130,255,0.35)] ring-1 ring-white/30 transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              Signing In...
            </>
          ) : (
            'Sign In'
          )}
        </button>
      </form>

      {/* Sign Up Link */}
      <p className="text-center text-sm font-medium text-slate-500">
        Don't have an account?{' '}
        <button onClick={onSignUpClick} className="font-bold text-cmblue-600 hover:text-cmblue-700">
          Create One
        </button>
      </p>
    </div>
  );
}
