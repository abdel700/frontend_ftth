import React, { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

ChartJS.register(ArcElement, Title, Tooltip, Legend);

const ManualBreakdown = ({ startDate, endDate }) => {
  const [chartData, setChartData] = useState({
    labels: ['DSI-EXP-Acamar', 'DSI-EXP Transverse', 'Autre'],
    datasets: [
      {
        label: 'Acteur',
        data: [0, 0, 0],
        backgroundColor: ['#36A2EB', '#4BC0C0', '#FFCE56'],
        hoverBackgroundColor: ['#36A2EB', '#4BC0C0', '#FFCE56'],
      },
    ],
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('https://tranquil-shelf-72645-6e0212cb96fc.herokuapp.com/dashboard/api/regle/');
        const data = await response.json();

        
        let filteredData = data;
        if (startDate && endDate) {
          filteredData = data.filter(row => {
            const rowDate = new Date(row.date);
            return rowDate >= new Date(startDate) && rowDate <= new Date(endDate);
          });
        }

        const actorCounts = {
          'DSI-EXP-Acamar': 0,
          'DSI-EXP-Acamar-Swap': 0,
          'DSI-EXP Transverse': 0,
          'Autre': 0,
        };

        const autresActeurs = new Set();

        filteredData.forEach(item => {
          const acteur = item.acteur.trim().toLowerCase();
          if (acteur === 'dsi-exp-acamar') {
            actorCounts['DSI-EXP-Acamar']++;
          } else if (acteur === 'dsi-exp-acamar-swap') {
            actorCounts['DSI-EXP-Acamar-Swap']++;
          } else if (acteur === 'dsi-exp transverse') {
            actorCounts['DSI-EXP Transverse']++;
          } else {
            actorCounts['Autre']++;
            autresActeurs.add(item.acteur);
          }
        });

        const total = actorCounts['DSI-EXP-Acamar'] + actorCounts['DSI-EXP-Acamar-Swap'] + actorCounts['DSI-EXP Transverse'] + actorCounts['Autre'];

        const percentages = [
          (actorCounts['DSI-EXP-Acamar'] / total) * 100,
          (actorCounts['DSI-EXP-Acamar-Swap'] / total) * 100,
          (actorCounts['DSI-EXP Transverse'] / total) * 100,
          (actorCounts['Autre'] / total) * 100,
        ];

       
        const autresLabels = [...autresActeurs];
        const labels = ['DSI-EXP-Acamar', 'DSI-EXP-Acamar-Swap', 'DSI-EXP Transverse', ...autresLabels];

        
        const autresData = autresLabels.map(acteur => {
          return (filteredData.filter(item => item.acteur === acteur).length / total) * 100;
        });

        const backgroundColors = labels.map(label => {
          if (label === 'DSI-EXP-Acamar') return '#36A2EB'; 
          if (label === 'DSI-EXP-Acamar-Swap') return '#FF6384';
          if (label === 'DSI-EXP Transverse') return '#4BC0C0';
          if (label === 'Hors SLA Phenix') return '#FF9F40';
          return '#9966FF'; 
        });

        
        const uniqueLabels = [...new Set(labels)];
        const uniqueBackgroundColors = backgroundColors.slice(0, uniqueLabels.length);
        const uniquePercentages = [...percentages.slice(0, 3), ...autresData];

        setChartData({
          labels: uniqueLabels,
          datasets: [
            {
              label: 'Acteur',
              data: uniquePercentages,
              backgroundColor: uniqueBackgroundColors,
              hoverBackgroundColor: uniqueBackgroundColors,
              borderWidth: uniqueLabels.map(label =>
                label === 'DSI-EXP-Acamar' || label === 'DSI-EXP-Acamar-Swap' ? 2 : 1
              ),
              borderColor: uniqueLabels.map(label =>
                label === 'DSI-EXP-Acamar' || label === 'DSI-EXP-Acamar-Swap' ? '#000000' : '#FFFFFF'
              ),
            },
          ],
        });
      } catch (error) {
        console.error('Erreur lors de la récupération des données:', error);
      }
    };

    fetchData();
  }, [startDate, endDate]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          filter: (legendItem) => {
            return legendItem.text !== 'DSI-EXP Transverse';
          },
        },
      },
    },
  };

  const chartData2 = {
    labels: ['01-ActiGp 1-Provisioning', '02-AutreGp', '01-ActiGp 2-Installation', '01-ActiGp 3-Post-Installation', 'Autre'],
    datasets: [
      {
        label: 'Manuel',
        data: [23.6, 26.6, 15.4, 14.8, 19.6],
        backgroundColor: ['#36A2EB', '#FF6384', '#FFCE56', '#4BC0C0', '#9966FF'],
        hoverBackgroundColor: ['#36A2EB', '#FF6384', '#FFCE56', '#4BC0C0', '#9966FF'],
      },
    ],
  };

  const options2 = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
    },
  };

  return (
    <div className="p-6 bg-white shadow-md rounded-lg w-full hover:shadow-lg transition-shadow duration-300 ease-in-out">
      <h2 className="text-2xl font-bold mb-4 text-blue-600 text-center">Répartition Manuelle</h2>
      <div className="flex flex-wrap justify-around">
        <div className="flex flex-col items-center w-full md:w-1/2"> {/* Adjusted width */}
          <div className="w-full h-64">
            <Doughnut data={chartData} options={options} />
          </div>
          <span className="text-center text-gray-700 mt-2">Acteur</span>
        </div>
        <div className="flex flex-col items-center w-full md:w-1/2"> {/* Adjusted width */}
          <div className="w-full h-64">
            <Doughnut data={chartData2} options={options2} />
          </div>
          <span className="text-center text-gray-700 mt-2">Manuel</span>
        </div>
      </div>
    </div>
  );
};

export default ManualBreakdown;
