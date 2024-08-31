import Link from 'next/link';
import Header from '../components/Header';
import Footer from '../components/Footer';

export default function Home() {
  return (
    <div className="bg-gray-100 min-h-screen flex flex-col">
      <Header />
      <main className="container mx-auto p-4 flex-grow flex items-center justify-center">
        <div className="text-center bg-white p-10 rounded-lg shadow-lg">
          <h1 className="text-4xl font-bold mb-4">Bienvenue sur le Dashboard FTTH</h1>
          <p className="mb-8">Analysez et visualisez les données des équipes FTTH.</p>
          <Link href="/dashboard" passHref>
            <button className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-700 transition duration-300">Accéder au Dashboard</button>
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}






