// Exemple de modification des appels API pour pointer vers le backend sur Heroku

// URL de base de votre backend sur Heroku
const BASE_API_URL = 'https://tranquil-shelf-72645.herokuapp.com';

// Fonction pour récupérer les données de regle
export const fetchRegleData = async () => {
  const response = await fetch(`${BASE_API_URL}/dashboard/api/aggregated_regle/`);
  if (!response.ok) {
    throw new Error('Erreur lors de la récupération des données');
  }
  return await response.json();
};

// Fonction alternative pour récupérer les données de regle
export const fetchRegleDataAlternative = async () => {
  const response = await fetch(`${BASE_API_URL}/dashboard/api/regle/`);
  if (!response.ok) {
    throw new Error('Erreur lors de la récupération des données');
  }
  return await response.json();
};

// Fonction pour récupérer les données de stock
export const fetchStockData = async () => {
  const response = await fetch(`${BASE_API_URL}/dashboard/api/stock/`);
  if (!response.ok) {
    throw new Error('Erreur lors de la récupération des données de stock');
  }
  return await response.json();
};
