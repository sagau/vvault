"use client";

  import { auth } from '@/lib/firebase';
  import { signInWithEmailAndPassword } from 'firebase/auth';
  import { useRouter } from 'next/navigation';
  import { useState, useEffect } from 'react';

  export default function LoginPage() {
    const [email, setEmail] = useState('vendor@example.com');
    const [password, setPassword] = useState('vendor123');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [redirectTo, setRedirectTo] = useState<string | null>(null);
    const router = useRouter();

    const handleLogin = async (e) => {
      e.preventDefault(); // Ensure no page refresh
      setLoading(true);
      setError('');
      console.log('Attempting login with:', { email, password });
      try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        console.log('Auth successful:', userCredential);
        const user = userCredential.user;
        const claims = (await user.getIdTokenResult()).claims;
        console.log('Claims:', claims);
        const role = claims.role;
        const companyId = claims.companyId || 'acme-company';
        const redirectPath = `/${companyId}/${role}/dashboard`;
        setRedirectTo(redirectPath);
        console.log('Setting redirect to:', redirectPath);
      } catch (err) {
        console.error('Login Error Details:', err);
        setError(`Login failed: ${err.message} (Code: ${err.code})`);
      } finally {
        setLoading(false);
      }
    };

    useEffect(() => {
      if (redirectTo) {
        console.log('Attempting navigation to:', redirectTo);
        try {
          window.location.href = redirectTo; // Force hard navigation
          console.log('Navigation triggered via window.location.href');
        } catch (navErr) {
          console.error('Navigation failed with window.location.href:', navErr);
          router.push(redirectTo); // Fallback to router.push
          console.log('Falling back to router.push');
        }
      }
    }, [redirectTo, router]);

    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <form onSubmit={handleLogin} className="p-6 bg-gray-800 rounded shadow-lg text-white">
          <h1 className="text-2xl mb-4">Login</h1>
          {error && <p className="text-red-500 mb-4">{error}</p>}
          {loading && <p className="text-yellow-500 mb-4">Logging in...</p>}
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="w-full p-2 mb-4 bg-gray-700 rounded"
            required
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password (try 'vendor123')"
            className="w-full p-2 mb-4 bg-gray-700 rounded"
            required
          />
          <button type="submit" className="w-full p-2 bg-blue-600 rounded hover:bg-blue-700" disabled={loading}>
            Login
          </button>
        </form>
      </div>
    );
  }