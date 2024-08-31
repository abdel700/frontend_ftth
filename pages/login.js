import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import AuthHeader from '../components/AuthHeader';
import axiosInstance from '../utils/axios';
import Link from 'next/link';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      router.push('/');
    }
  }, [router]);

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const response = await axiosInstance.post('/login/', {
        email,
        password,
      });
      localStorage.setItem('token', response.data.token);
      router.push('/');
    } catch (error) {
      if (error.response && error.response.status === 403) {
        setError("Votre compte n'est pas encore approuvé. Veuillez contacter l'administrateur.");
      } else {
        setError('Connexion échouée. Veuillez vérifier vos informations.');
      }
      console.error('Login failed:', error.response ? error.response.data : error.message);
    }
  };

  return (
    <div className="bg-gray-100 min-h-screen flex flex-col">
      <AuthHeader />
      <main className="container mx-auto p-4 flex-grow flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
          <h2 className="text-3xl font-bold mb-6 text-center text-blue-600">Connexion</h2>
          {error && <p className="text-red-500 mb-4">{error}</p>}
          <form onSubmit={handleLogin}>
            <div className="mb-4">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
            <div className="mb-4">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">Mot de passe</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
            <button
              type="submit"
              className="w-full py-2 px-4 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-700 transition duration-300"
            >
              Connexion
            </button>
          </form>
          {/*<p className="mt-6 text-center">
            Vous n'avez pas de compte? <Link href="/signup" className="text-blue-500">Créer un compte</Link>
          </p> */}
        </div>
      </main>
    </div>
  );
}
