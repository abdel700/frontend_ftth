import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import axiosInstance from '../utils/axios';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Link from 'next/link';
import useAuth from '../hooks/useAuth'; 

export default function IndexPage() {
  useAuth(); // Add this to protect the page

  const [user, setUser] = useState(null);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      const fetchUserData = async () => {
        try {
          const response = await axiosInstance.get('/users/me/', {
            headers: { Authorization: `Token ${token}` },
          });
          setUser(response.data);
        } catch (error) {
          setError('Failed to fetch user data.');
          localStorage.removeItem('token');
          router.push('/login');
        }
      };
      fetchUserData();
    }
  }, [router]);

  return (
    <div className="bg-gray-100 min-h-screen flex flex-col">
      <Header />
      <main className="container mx-auto p-4 flex-grow flex items-center justify-center">
        {error && <p className="text-red-500">{error}</p>}
        <div className="text-center bg-white p-10 rounded-lg shadow-lg">
          <h1 className="text-4xl font-bold mb-4">
            Bienvenue{' '}
            <span className="text-blue-500">{user ? user.first_name : ''}</span>{' '}
            sur le Dashboard FTTH
          </h1>
          <p className="mb-8">Analysez et visualisez les données des équipes FTTH.</p>
          <Link href="/dashboard" passHref>
            <button className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-700 transition duration-300">
              Accéder au Dashboard
            </button>
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}
