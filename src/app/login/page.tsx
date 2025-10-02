"use client";

  import { auth } from '@/lib/firebase';
  import { signInWithEmailAndPassword } from 'firebase/auth'; // Import the method
  import { useRouter } from 'next/navigation';
  import { useState } from 'react';

  export default function LoginPage() {
    const [email, setEmail] = useState('vendor@example.com'); // Pre-fill for testing
    const [password, setPassword] = useState('vendor'); // Pre-fill for testing
    const [error, setError] = useState('');
    const router = useRouter();

    const handleLogin = async (e) => {
      e.preventDefault();
      try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password); // Use method with auth
        const user = userCredential.user;
        const claims = (await user.getIdTokenResult()).claims;
        const role = claims.role;
        const companyId = claims.companyId || 'acme-company'; // Default to acme-company
        router.push(`/${companyId}/${role}/dashboard`);
      } catch (err) {
        setError(`Login failed: ${err.message} (Code: ${err.code})`);
        console.error('Login Error:', err); // Debug
      }
    };

    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <form onSubmit={handleLogin} className="p-6 bg-gray-800 rounded shadow-lg text-white">
          <h1 className="text-2xl mb-4">Login</h1>
          {error && <p className="text-red-500 mb-4">{error}</p>}
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
            placeholder="Password"
            className="w-full p-2 mb-4 bg-gray-700 rounded"
            required
          />
          <button type="submit" className="w-full p-2 bg-blue-600 rounded hover:bg-blue-700">
            Login
          </button>
        </form>
      </div>
    );
  }