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

      // Success - redirect to dashboard
      router.push('/dashboard');
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
          className="text-slate-600 hover:text-slate-900 text-sm flex items-center gap-2 mb-4"
        >
          ← Back
        </button>
        <h2 className="text-2xl font-bold text-slate-900">Sign In</h2>
        <p className="text-slate-600 text-sm mt-1">Welcome back to CM HASH</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="you@example.com"
            className="w-full px-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-500 focus:outline-none focus:border-cmblue-500 focus:ring-1 focus:ring-cmblue-500 transition"
            disabled={loading}
            required
          />
        </div>

        {/* Password */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="••••••••"
            className="w-full px-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-500 focus:outline-none focus:border-cmblue-500 focus:ring-1 focus:ring-cmblue-500 transition"
            disabled={loading}
            required
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-cmblue-600 hover:bg-cmblue-700 disabled:bg-slate-300 text-white font-semibold py-3 px-4 rounded-lg transition duration-200 shadow-sm"
        >
          {loading ? 'Signing In...' : 'Sign In'}
        </button>
      </form>

      {/* Sign Up Link */}
      <p className="text-center text-slate-600 text-sm">
        Don't have an account?{' '}
        <button onClick={onSignUpClick} className="text-cmblue-600 hover:text-cmblue-700 font-semibold">
          Create One
        </button>
      </p>
    </div>
  );
}
