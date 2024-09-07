import { useState } from 'react';
import axiosInstance from '../utils/axios';
import { useRouter } from 'next/router';
import AuthHeader from '../components/AuthHeader';
import Link from 'next/link';

export default function Signup() {
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const router = useRouter();

  const validateEmail = (email) => {
    const domain = '@intelcia.com';
    return email.endsWith(domain);
  };

  const validatePassword = (password) => {
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{6,}$/;
    return regex.test(password);
  };

  const handleSignup = async (e) => {
    e.preventDefault();

    if (!validateEmail(email)) {
      setError('L\'email doit être sous le domaine @intelcia.com');
      return;
    }

    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }

    if (!validatePassword(password)) {
      setError('Le mot de passe doit contenir au moins 6 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial.');
      return;
    }

    try {
      await axiosInstance.post('/register/', {
        email,
        first_name: firstName,
        password,
      });
      setError('');
      setSuccessMessage('Compte créé avec succès !');
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch (error) {
      setError('Une erreur est survenue lors de la création du compte.');
      console.error('Signup failed:', error.response ? error.response.data : error.message);
    }
  };

  return (
    <>
      <AuthHeader />
      <div className="flex items-center justify-center min-h-screen bg-gray-100 pt-16">
        <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
          <h2 className="text-3xl font-bold mb-6 text-center text-blue-600">Créer un compte</h2>
          {successMessage && <div className="text-green-500 mb-4">{successMessage}</div>}
          {error && <p className="text-red-500 mb-4">{error}</p>}
          <form onSubmit={handleSignup}>
            <div className="mb-4">
              <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">Nom</label>
              <input
                id="firstName"
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
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
            <div className="mb-6">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">Mot de passe</label>
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
              <div className="mt-2">
                <label className="inline-flex items-center">
                  <input
                    type="checkbox"
                    checked={showPassword}
                    onChange={() => setShowPassword(!showPassword)}
                    className="form-checkbox"
                  />
                  <span className="ml-2 text-sm text-gray-600">Afficher le mot de passe</span>
                </label>
              </div>
            </div>
            <div className="mb-6">
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">Confirmez le mot de passe</label>
              <input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
              <div className="mt-2">
                <label className="inline-flex items-center">
                  <input
                    type="checkbox"
                    checked={showConfirmPassword}
                    onChange={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="form-checkbox"
                  />
                  <span className="ml-2 text-sm text-gray-600">Afficher le mot de passe</span>
                </label>
              </div>
            </div>
            <button
              type="submit"
              className="w-full py-2 px-4 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-700 transition duration-300"
            >
              Créer un compte
            </button>
            <p className="mt-6 text-center">
              Vous avez déjà un compte? <Link href="/login" className="text-blue-500">Connectez-vous</Link>
            </p>
          </form>
        </div>
      </div>
    </>
  );
}
