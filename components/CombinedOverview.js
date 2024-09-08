import React, { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import { useRouter } from 'next/router';
import { fetchStockData } from '../services/api';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, LineElement, PointElement, Title, Tooltip, Legend);

const CombinedOverview = ({ startDate, endDate }) => {
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const result = await fetchStockData();
        setData(result);

        const today = new Date();
        const defaultStartDate = new Date();
        defaultStartDate.setDate(today.getDate() - 30);
        const defaultEndDate = today;

        const rangeStartDate = startDate ? new Date(startDate) : defaultStartDate;
        const rangeEndDate = endDate ? new Date(endDate) : defaultEndDate;

        const filtered = result.filter((item) => {
          const itemDate = new Date(item.date);
          return itemDate >= rangeStartDate && itemDate <= rangeEndDate;
        });
        setFilteredData(filtered);
      } catch (error) {
        console.error('Error fetching stock data:', error);
      }
    };
    fetchData();
  }, [startDate, endDate]);

  const chartData = {
    labels: filteredData.map(item => item.date),
    datasets: [
      {
        label: 'Backlog FTTH J',
        data: filteredData.map(item => item.stock),
        borderColor: 'rgba(54, 162, 235, 0.6)', 
        fill: false,
        borderWidth: 1.5,
        pointRadius: 3,
      },
      {
        label: 'Backlog FTTH J-1 (Non Traité)',
        data: filteredData.map(item => item.non_traite),
        borderColor: 'rgba(255, 99, 132, 0.6)', 
        fill: false,
        borderWidth: 1.5,
        pointRadius: 3,
      },
      {
        label: 'Dossiers Traités',
        data: filteredData.map(item => item.traite),
        borderColor: 'rgba(75, 192, 192, 0.6)', 
        fill: false,
        borderWidth: 1.5,
        pointRadius: 3,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    devicePixelRatio: 2, 
    elements: {
      line: {
        tension: 0.4, 
      },
      point: {
        radius: 3, 
      },
    },
    plugins: {
      legend: {
        position: 'top',
      },
      tooltip: {
        callbacks: {
          label: function (tooltipItem) {
            return `${tooltipItem.dataset.label}: ${tooltipItem.raw}`;
          },
        },
      },
    },
    scales: {
      x: {
        ticks: {
          autoSkip: true,
          maxTicksLimit: 10,
        },
      },
      y: {
        beginAtZero: true,
      },
    },
  };

  const handleCardClick = () => {
    router.push('/backlogDetails');
  };

  return (
    <div onClick={handleCardClick} className="card p-6 bg-white shadow-md rounded-lg w-full cursor-pointer">
      <h2 className="text-2xl font-bold mb-4 text-blue-600">Vue Globale sur le Backlog</h2>
      <div style={{ position: 'relative', height: '400px', width: '100%' }}>
        <Line data={chartData} options={options} width={800} height={400} />
      </div>
    </div>
  );
};

export default CombinedOverview;
