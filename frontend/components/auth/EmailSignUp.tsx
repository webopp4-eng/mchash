'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { API_URL } from '@/lib/auth';

interface EmailSignUpProps {
  onBack: () => void;
  onLoginClick: () => void;
}

export default function EmailSignUp({ onBack, onLoginClick }: EmailSignUpProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
    country: '',
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear field error when user starts typing
    if (fieldErrors[name]) {
      setFieldErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setFieldErrors({});

    try {
      const response = await fetch(`${API_URL}/api/auth/email/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.errors && typeof data.errors === 'object') {
          setFieldErrors(data.errors);
        } else {
          setError(data.error || 'Registration failed');
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
      console.error('Signup error:', err);
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
        <h2 className="text-2xl font-bold text-slate-900">Create Account</h2>
        <p className="text-slate-600 text-sm mt-1">Join CM HASH with your email</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Full Name */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
          <input
            type="text"
            name="fullName"
            value={formData.fullName}
            onChange={handleChange}
            placeholder="John Doe"
            className={`w-full px-4 py-2 bg-white border rounded-lg text-slate-900 placeholder-slate-500 focus:outline-none focus:border-cmblue-500 ${
              fieldErrors.fullName ? 'border-red-500' : 'border-slate-300'
            }`}
            disabled={loading}
          />
          {fieldErrors.fullName && <p className="text-red-600 text-xs mt-1">{fieldErrors.fullName}</p>}
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="you@example.com"
            className={`w-full px-4 py-2 bg-white border rounded-lg text-slate-900 placeholder-slate-500 focus:outline-none focus:border-cmblue-500 ${
              fieldErrors.email ? 'border-red-500' : 'border-slate-300'
            }`}
            disabled={loading}
          />
          {fieldErrors.email && <p className="text-red-600 text-xs mt-1">{fieldErrors.email}</p>}
        </div>

        {/* Username */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Username</label>
          <input
            type="text"
            name="username"
            value={formData.username}
            onChange={handleChange}
            placeholder="john_doe"
            className={`w-full px-4 py-2 bg-white border rounded-lg text-slate-900 placeholder-slate-500 focus:outline-none focus:border-cmblue-500 ${
              fieldErrors.username ? 'border-red-500' : 'border-slate-300'
            }`}
            disabled={loading}
          />
          {fieldErrors.username && <p className="text-red-600 text-xs mt-1">{fieldErrors.username}</p>}
        </div>

        {/* Country */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Country</label>
          <select
            name="country"
            value={formData.country}
            onChange={handleChange}
            className={`w-full px-4 py-2 bg-white border rounded-lg text-slate-900 focus:outline-none focus:border-cmblue-500 ${
              fieldErrors.country ? 'border-red-500' : 'border-slate-300'
            }`}
            disabled={loading}
          >
            <option value="">Select a country</option>
            <option value="United States">United States</option>
            <option value="Canada">Canada</option>
            <option value="United Kingdom">United Kingdom</option>
            <option value="Australia">Australia</option>
            <option value="Germany">Germany</option>
            <option value="France">France</option>
            <option value="Other">Other</option>
          </select>
          {fieldErrors.country && <p className="text-red-600 text-xs mt-1">{fieldErrors.country}</p>}
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
            className={`w-full px-4 py-2 bg-white border rounded-lg text-slate-900 placeholder-slate-500 focus:outline-none focus:border-cmblue-500 ${
              fieldErrors.password ? 'border-red-500' : 'border-slate-300'
            }`}
            disabled={loading}
          />
          {fieldErrors.password && <p className="text-red-600 text-xs mt-1">{fieldErrors.password}</p>}
        </div>

        {/* Confirm Password */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Confirm Password</label>
          <input
            type="password"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            placeholder="••••••••"
            className={`w-full px-4 py-2 bg-white border rounded-lg text-slate-900 placeholder-slate-500 focus:outline-none focus:border-cmblue-500 ${
              fieldErrors.confirmPassword ? 'border-red-500' : 'border-slate-300'
            }`}
            disabled={loading}
          />
          {fieldErrors.confirmPassword && (
            <p className="text-red-600 text-xs mt-1">{fieldErrors.confirmPassword}</p>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-cmblue-600 hover:bg-cmblue-700 disabled:bg-slate-300 text-white font-semibold py-3 px-4 rounded-lg transition duration-200 shadow-sm"
        >
          {loading ? 'Creating Account...' : 'Create Account'}
        </button>
      </form>

      {/* Sign In Link */}
      <p className="text-center text-slate-600 text-sm">
        Already have an account?{' '}
        <button onClick={onLoginClick} className="text-cmblue-600 hover:text-cmblue-700 font-semibold">
          Sign In
        </button>
      </p>
    </div>
  );
}
