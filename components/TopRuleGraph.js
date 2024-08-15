import React, { forwardRef } from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const TopRuleGraph = forwardRef(({ rule, filteredData }, ref) => {
  const reversedData = [...filteredData].reverse();

  const chartData = {
    labels: reversedData.map((data) => data.date),
    datasets: [
      {
        label: `Règle ${rule}`,
        data: reversedData.map((data) => data.value),
        backgroundColor: 'rgba(75,192,192,0.4)',
        borderColor: 'rgba(75,192,192,1)',
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
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
          text: 'Stock',
        },
      },
    },
  };

  return <Bar ref={ref} data={chartData} options={options} />;
});

export default TopRuleGraph;
