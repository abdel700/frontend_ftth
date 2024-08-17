export const fetchRegleData = async () => {
  const response = await fetch('https://tranquil-shelf-72645-6e0212cb96fc.herokuapp.com/dashboard/api/aggregated_regle/');
  if (!response.ok) {
    throw new Error('Erreur lors de la récupération des données');
  }
  return await response.json();
};

export const fetchRegleDataAlternative = async () => {
  const response = await fetch('https://tranquil-shelf-72645-6e0212cb96fc.herokuapp.com/dashboard/api/regle/');
  if (!response.ok) {
    throw new Error('Erreur lors de la récupération des données');
  }
  return await response.json();
};

export const fetchStockData = async () => {
  const response = await fetch('https://tranquil-shelf-72645-6e0212cb96fc.herokuapp.com/dashboard/api/stock/');
  if (!response.ok) {
    throw new Error('Erreur lors de la récupération des données de stock');
  }
  return await response.json();
};
