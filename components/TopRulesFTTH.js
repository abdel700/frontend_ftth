import React, { useState, useEffect } from 'react';
import { Bar } from 'react-chartjs-2';
import { useRouter } from 'next/router'; // Importez useRouter pour la redirection
import { fetchRegleData } from '../services/api';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const TopRulesFTTH = ({ startDate, endDate }) => {
  const [data, setData] = useState([]);
  const router = useRouter(); // Initialisez useRouter

  useEffect(() => {
    const loadData = async () => {
      try {
        const regleData = await fetchRegleData();
        setData(regleData);
      } catch (error) {
        console.error('Erreur lors de la récupération des données:', error);
      }
    };

    loadData();
  }, []);

  if (!data || data.length === 0) {
    return <div>Aucune donnée disponible</div>;
  }

  let filteredData = data;

  if (startDate && endDate) {
    filteredData = data.filter(item => {
      const itemDate = new Date(item.date);
      return itemDate >= new Date(startDate) && itemDate <= new Date(endDate);
    });
  } else {
    const uniqueDates = [...new Set(data.map(item => item.date))]
      .sort((a, b) => new Date(b) - new Date(a))
      .slice(0, 3)
      .reverse();

    filteredData = data.filter(item => uniqueDates.includes(item.date));
  }

  filteredData.sort((a, b) => new Date(a.date) - new Date(b.date));

  const topRulesPerDate = filteredData.reduce((acc, curr) => {
    const date = curr.date;
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(curr);
    return acc;
  }, {});

  const sortedTopRulesPerDate = Object.keys(topRulesPerDate).map(date => {
    return {
      date,
      rules: topRulesPerDate[date]
        .sort((a, b) => b.nbr_stoc_du_jour - a.nbr_stoc_du_jour)
        .slice(0, 5),
    };
  });

  const formattedLabels = sortedTopRulesPerDate.flatMap(({ date, rules }, index) => {
    const labels = rules.map(rule => `${date} - ${rule.regle}`);
    if (index < sortedTopRulesPerDate.length - 1) {
      labels.push("");
    }
    return labels;
  });

  const chartData = {
    labels: formattedLabels,
    datasets: [
      {
        label: 'Nbr Stock du Jour',
        data: sortedTopRulesPerDate.flatMap(({ rules }) => rules.map(rule => rule.nbr_stoc_du_jour).concat([null])),
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
          text: 'Date - Règle',
        },
        grid: {
          display: false,
        },
        ticks: {
          autoSkip: false,
          callback: function(value, index, values) {
            const label = this.getLabelForValue(value);
            if (label) {
              const date = label.split(' - ')[0];
              return index % 6 === 2 ? date : '';
            }
            return '';
          },
          maxRotation: 0,
          minRotation: 0,
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
            const labelParts = context.label ? context.label.split(' - ') : [''];
            return `Règle: ${labelParts[1]}, Nbr Stock du Jour: ${context.raw}`;
          },
        },
      },
    },
    onClick: (event, elements) => {
      if (elements.length > 0) {
        router.push('/topReglesDetails'); // Redirigez vers la page de détails
      }
    },
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow-md cursor-pointer">
      <h2 className="text-xl font-bold text-blue-600 mb-4 text-left">Top 5 RÈGLES par jour (Équipe FTTH)</h2>
      <Bar data={chartData} options={chartOptions} />
    </div>
  );
};

export default TopRulesFTTH;
