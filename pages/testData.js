// pages/testData.js
import React, { useEffect, useState } from 'react';
import { getRegleData } from '../services/api'; // Assurez-vous que ce chemin est correct

const TestData = () => {
  const [data, setData] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await getRegleData();  // Appeler la fonction qui fait la requête API
        console.log('Données récupérées de l\'API:', response.data); // Journaliser pour voir les données récupérées
        setData(response.data);  // Définir les données dans l'état
      } catch (err) {
        console.error('Erreur lors de la récupération des données:', err);  // En cas d'erreur
        setError(err);
      }
    };

    loadData();
  }, []);

  if (error) {
    return <div>Erreur : Impossible de récupérer les données. {error.message}</div>;
  }

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Test de récupération des données</h2>
      {data.length === 0 ? (
        <p>Aucune donnée disponible</p>
      ) : (
        <ul>
          {data.map((item, index) => (
            <li key={index}>
              Date: {item.date}, Règle: {item.rule}, Valeur: {item.value}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default TestData;
