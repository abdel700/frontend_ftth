import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: 'https://ftth-authentification-100be1e354a5.herokuapp.com/api/', 
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default axiosInstance;
