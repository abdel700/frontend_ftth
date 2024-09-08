import { useRouter } from 'next/router';
import { useEffect } from 'react';
import axiosInstance from '../utils/axios';

const useAuth = () => {
  const router = useRouter();

  useEffect(() => {
    const publicPages = ['/login', '/signup']; 
    const pathIsProtected = !publicPages.includes(router.pathname);

    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (!token && pathIsProtected) {
        router.push('/login'); // Redirection vers login si pas de token
      } else if (token) {
        try {
          await axiosInstance.get('/users/me/', {
            headers: { Authorization: `Token ${token}` },
          });
          // Si la requête réussit, l'utilisateur reste sur la page actuelle
        } catch (error) {
          localStorage.removeItem('token'); 
          if (pathIsProtected) {
            router.push('/login'); 
          }
        }
      }
    };

    checkAuth();
  }, [router]); 

  return null; 
};

export default useAuth;
