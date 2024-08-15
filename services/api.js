// Fonction existante, elle reste intacte
export const fetchRegleData = async () => {
  const response = await fetch('http://localhost:8000/dashboard/api/aggregated_regle/');
  if (!response.ok) {
    throw new Error('Erreur lors de la récupération des données');
  }
  return await response.json();
};

// Nouvelle fonction pour récupérer les données de regle depuis une autre adresse
export const fetchRegleDataAlternative = async () => {
  const response = await fetch('http://localhost:8000/dashboard/api/regle/');
  if (!response.ok) {
    throw new Error('Erreur lors de la récupération des données');
  }
  return await response.json();
};

// Nouvelle fonction pour récupérer les données de stock
export const fetchStockData = async () => {
  const response = await fetch('http://localhost:8000/dashboard/api/stock/');
  if (!response.ok) {
    throw new Error('Erreur lors de la récupération des données de stock');
  }
  return await response.json();
};
