'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Mail, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth';

export default function RegisterPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const formData = new FormData(e.currentTarget);
    const data = {
      email: formData.get('email') as string,
      password: formData.get('password') as string,
      name: formData.get('name') as string,
      organizationName: formData.get('organizationName') as string,
    };

    try {
      const response = await api.register(data);
      if (response.data) {
        setAuth(
          response.data.user as Parameters<typeof setAuth>[0],
          response.data.accessToken,
          response.data.refreshToken,
        );
        router.push('/dashboard');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <Mail className="h-10 w-10 text-sky-500" />
            <span className="text-2xl font-bold text-navy-900">InboxPilot</span>
          </Link>
        </div>

        {/* Card */}
        <div className="card">
          <h1 className="text-2xl font-bold text-navy-900 mb-2">
            Create your account
          </h1>
          <p className="text-gray-600 mb-6">Start your free trial today</p>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-700 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Your name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                required
                className="input"
                placeholder="John Doe"
              />
            </div>

            <div>
              <label
                htmlFor="organizationName"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Company name
              </label>
              <input
                type="text"
                id="organizationName"
                name="organizationName"
                required
                className="input"
                placeholder="Acme Inc"
              />
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Work email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                required
                className="input"
                placeholder="you@company.com"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Password
              </label>
              <input
                type="password"
                id="password"
                name="password"
                required
                minLength={8}
                className="input"
                placeholder="At least 8 characters"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                'Create account'
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-600">
            Already have an account?{' '}
            <Link
              href="/auth/login"
              className="font-medium text-sky-500 hover:text-sky-600"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
