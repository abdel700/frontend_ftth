import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: 'https://ftth-authentification-100be1e354a5.herokuapp.com/api/', // Remplacez par l'URL de votre API avec un slash à la fin
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default axiosInstance;
