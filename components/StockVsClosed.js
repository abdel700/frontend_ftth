import React from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const StockVsClosedGraph = ({ rule, ruleData }) => {
  if (!ruleData || ruleData.length === 0) {
    return <p>Aucune donnée disponible pour la règle {rule}</p>;
  }

  const reversedData = [...ruleData].reverse();

  const chartData = {
    labels: reversedData.map((d) => d.date),
    datasets: [
      {
        label: 'Nbr stock veille',
        data: reversedData.map((d) => d.nbr_stoc_veille),
        backgroundColor: 'rgba(54, 162, 235, 0.6)', // Couleur pour le stock
        borderColor: 'rgba(54, 162, 235, 1)', // Ajout d'un contour pour plus de netteté
        borderWidth: 1, // Taille du contour
      },
      {
        label: 'Fermer hier',
        data: reversedData.map((d) => d.fermer_hier),
        backgroundColor: 'rgba(255, 99, 132, 0.6)', // Couleur pour les fermetures
        borderColor: 'rgba(255, 99, 132, 1)', // Ajout d'un contour pour plus de netteté
        borderWidth: 1, // Taille du contour
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: false, // Supprimer le titre pour réduire l'espace
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Date',
        },
        grid: {
          display: false,
        },
      },
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Valeurs',
        },
      },
    },
  };

  return <Bar data={chartData} options={options} />;
};

export default StockVsClosedGraph;
