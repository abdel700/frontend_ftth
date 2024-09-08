import React, { useState, useEffect } from 'react';
import { Bar } from 'react-chartjs-2';
import { fetchRegleData } from '../services/api';

const TopRules = () => {
  const [data, setData] = useState([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const regleData = await fetchRegleData();
        console.log('Données de règles :', regleData);
        setData(regleData);
      } catch (error) {
        console.error('Erreur lors de la récupération des données :', error);
      }
    };

    loadData();
  }, []);

  if (!data || data.length === 0) {
    return <div>Aucune donnée disponible</div>;
  }

  // Regrouper les règles similaires et calculer la somme de leurs 'nbr_stoc_du_jour'
  const ruleTotals = data.reduce((acc, curr) => {
    if (acc[curr.regle]) {
      acc[curr.regle] += curr.nbr_stoc_du_jour;
    } else {
      acc[curr.regle] = curr.nbr_stoc_du_jour;
    }
    return acc;
  }, {});

  // Convertir en tableau et trier par somme décroissante
  const top5Rules = Object.entries(ruleTotals)
    .map(([rule, total]) => ({ rule, total }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 5); // Garder seulement les 5 règles avec les plus grandes valeurs

  const chartData = {
    labels: top5Rules.map(item => item.rule),
    datasets: [
      {
        label: 'Nbr Stock du Jour',
        data: top5Rules.map(item => item.total),
        backgroundColor: 'rgba(54, 162, 235, 0.6)',
        borderColor: 'rgba(0, 0, 0, 1)',
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    scales: {
      x: {
        title: {
          display: true,
          text: 'Règles',
        },
        grid: {
          display: false,
        },
      },
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Stock',
        },
      },
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            return `Nbr Stock du Jour: ${context.raw}`;
          },
        },
      },
    },
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow-md">
      <h2 className="text-xl font-bold text-blue-600 mb-4">Top 5 RÈGLES (Équipe FTTH)</h2>
      <Bar data={chartData} options={chartOptions} />
    </div>
  );
};

export default TopRules;
