import React, { useEffect, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { fetchRegleDataAlternative } from '../services/api'; // Assurez-vous que le chemin est correct

// Enregistrement des composants nécessaires de Chart.js
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const StockVsSortantsApercu = ({ startDate, endDate }) => {
  const [chartData, setChartData] = useState(null);

  useEffect(() => {
    const loadChartData = async () => {
      try {
        const data = await fetchRegleDataAlternative();

        // Regrouper les données par date et calculer les sommes pour chaque jour
        const groupedData = data.reduce((acc, curr) => {
          const date = curr.date;
          if (!acc[date]) {
            acc[date] = {
              stock: 0,
              closed: 0,
            };
          }
          acc[date].stock += curr.nbr_stoc_veille;
          acc[date].closed += curr.fermer_hier;
          return acc;
        }, {});

        // Trier les dates
        let sortedDates = Object.keys(groupedData).sort((a, b) => new Date(a) - new Date(b));

        // Appliquer le filtre de dates si nécessaire
        if (startDate && endDate) {
          sortedDates = sortedDates.filter(date => {
            const dateObj = new Date(date);
            return dateObj >= new Date(startDate) && dateObj <= new Date(endDate);
          });
        } else {
          // Si aucune plage de dates n'est fournie, affichez les 7 dernières dates
          sortedDates = sortedDates.slice(-7);
        }

        // Récupérez les données associées aux dates triées
        const stockData = sortedDates.map(date => groupedData[date].stock);
        const closedData = sortedDates.map(date => groupedData[date].closed);

        setChartData({
          labels: sortedDates,
          datasets: [
            {
              label: 'Stock de la veille',
              data: stockData,
              backgroundColor: 'rgba(54, 162, 235, 0.6)', 
              borderColor: 'rgba(54, 162, 235, 1)', 
              borderWidth: 1, 
            },
            {
              label: 'Stock fermé hier',
              data: closedData,
              backgroundColor: 'rgba(255, 99, 132, 0.6)', 
              borderColor: 'rgba(255, 99, 132, 1)', 
              borderWidth: 1, 
            },
          ],
        });
      } catch (error) {
        console.error('Erreur lors de la récupération des données :', error);
      }
    };

    loadChartData();
  }, [startDate, endDate]);

  if (!chartData) {
    return (
      <div className="card p-6 bg-white shadow-md rounded-lg w-full hover:shadow-lg transition-shadow duration-300 ease-in-out">
        <h2 className="text-2xl font-bold mb-4 text-blue-600">Stock vs Sortants (Aperçu)</h2>
        <div>Chargement des données...</div>
      </div>
    );
  }

  // Options pour le graphique
  const options = {
    responsive: true,
    maintainAspectRatio: false, 
    devicePixelRatio: 2,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Stock vs Sortants Aperçu',
      },
    },
    scales: {
      x: {
        beginAtZero: true,
        ticks: {
          callback: function (value, index) {
            return chartData.labels[index]; 
          },
        },
      },
      y: {
        beginAtZero: true,
        stepSize: 10, 
        ticks: {
          precision: 0,
        },
      },
    },
  };

  return (
    <div className="card p-6 bg-white shadow-md rounded-lg w-full hover:shadow-lg transition-shadow duration-300 ease-in-out">
      <h2 className="text-2xl font-bold mb-4 text-blue-600">Entrants vs Sortants (Aperçu)</h2>
      <div style={{ position: 'relative', height: '400px' }}>
        <Bar data={chartData} options={options} width={800} height={400} />
      </div>
    </div>
  );
};

export default StockVsSortantsApercu;
