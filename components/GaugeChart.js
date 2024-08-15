// components/GaugeChart.js
import React from 'react';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

const GaugeChart = ({ value }) => {
  const data = {
    datasets: [
      {
        data: [value, 100 - value],
        backgroundColor: ['#00FF00', '#FF0000'],
        borderWidth: 0,
      },
    ],
  };

  const options = {
    rotation: -90,
    circumference: 180,
    cutout: '70%',
    plugins: {
      tooltip: {
        enabled: false,
      },
      legend: {
        display: false,
      },
    },
  };

  return (
    <div className="relative">
      <Doughnut data={data} options={options} />
      <div className="absolute inset-0 flex items-center justify-center text-3xl font-bold">{value}</div>
    </div>
  );
};

export default GaugeChart;
