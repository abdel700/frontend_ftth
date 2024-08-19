import React, { useState, useRef, useEffect } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import DateFilters from '../components/DateFilters';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { fetchStockData } from '../services/api';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';

// Enregistrer les composants de Chart.js
ChartJS.register(
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Title,
  Tooltip,
  Legend
);

const BacklogDetails = () => {
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [showDateFilter, setShowDateFilter] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true); // Ajout du state pour gérer le chargement
  const graphRef1 = useRef();
  const graphRef2 = useRef();
  const graphRef3 = useRef();
  const today = new Date().toLocaleString('fr-FR', { dateStyle: 'short' });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true); // Activer le chargement avant de récupérer les données
      try {
        const result = await fetchStockData();

        // Déterminer la plage de dates à utiliser
        const today = new Date();
        const defaultStartDate = new Date();
        defaultStartDate.setDate(today.getDate() - 30);
        const defaultEndDate = today;

        // Utiliser les dates fournies si disponibles, sinon utiliser les 30 derniers jours
        const rangeStartDate = startDate ? new Date(startDate) : defaultStartDate;
        const rangeEndDate = endDate ? new Date(endDate) : defaultEndDate;

        // Filtrer les données en fonction de la plage de dates sélectionnée
        const filtered = result.filter((item) => {
          const itemDate = new Date(item.date);
          return itemDate >= rangeStartDate && itemDate <= rangeEndDate;
        });
        setFilteredData(filtered);
      } catch (error) {
        console.error('Error fetching stock data:', error);
      } finally {
        setLoading(false); // Désactiver le chargement après la récupération des données
      }
    };
    fetchData();
  }, [startDate, endDate]);

  const chartOptions = {
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
        type: 'category', // Assurez-vous que le type de l'échelle est bien "category"
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

  const handleDownload = async (format) => {
    setIsDropdownOpen(false);
    const dateRange = startDate && endDate ? `_${startDate}_to_${endDate}` : '';

    if (format === 'pdf') {
      const doc = new jsPDF('p', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 15;
      const titleHeight = 10;
      const graphHeight = 60;

      doc.setFontSize(10);
      doc.text(`Effectué le : ${today}`, pageWidth - margin, 10, { align: 'right' });

      doc.setFontSize(24);
      doc.setTextColor(0, 0, 255);
      doc.setFont('helvetica', 'bold');
      doc.text('Détails du Backlog', pageWidth / 2, 20, { align: 'center' });

      if (startDate && endDate) {
        const duration = Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24));
        doc.setFontSize(12);
        doc.setTextColor(0, 0, 0);
        doc.setFont('helvetica', 'normal');
        doc.text(`De : ${startDate} à : ${endDate} (Durée : ${duration} jours)`, margin, 30);
      }

      let yOffset = 40;

      if (graphRef1.current) {
        const imgData1 = graphRef1.current.toBase64Image();
        doc.setFontSize(16);
        doc.setTextColor(54, 162, 235);
        doc.text('Backlog FTTH J Par Jour (Equipe FTTH)', pageWidth / 2, yOffset, { align: 'center' });
        doc.addImage(imgData1, 'PNG', margin, yOffset + 10, pageWidth - 2 * margin, graphHeight);
        yOffset += graphHeight + 20;
      }

      if (graphRef2.current) {
        const imgData2 = graphRef2.current.toBase64Image();
        doc.setFontSize(16);
        doc.setTextColor(255, 99, 132);
        doc.text('Backlog FTTH J-1 Par Jour (Equipe FTTH)', pageWidth / 2, yOffset, { align: 'center' });
        doc.addImage(imgData2, 'PNG', margin, yOffset + 10, pageWidth - 2 * margin, graphHeight);
        yOffset += graphHeight + 20;
      }

      if (graphRef3.current) {
        const imgData3 = graphRef3.current.toBase64Image();
        doc.setFontSize(16);
        doc.setTextColor(75, 192, 192);
        doc.text('Dossiers Traités Par Jour (Equipe FTTH)', pageWidth / 2, yOffset, { align: 'center' });
        doc.addImage(imgData3, 'PNG', margin, yOffset + 10, pageWidth - 2 * margin, graphHeight);
        yOffset += graphHeight + 20;
      }

      const tableData = filteredData.map((row, index) => [
        index + 1,
        row.date,
        row.stock,
        row.non_traite,
        row.traite,
      ]);

      doc.autoTable({
        head: [['#', 'Date', 'Backlog FTTH J', 'Backlog FTTH J-1 (Non Traité)', 'Dossiers Traités']],
        body: tableData,
        startY: yOffset,
        theme: 'striped',
      });

      const fileName = `backlog-details${dateRange}.pdf`;
      doc.save(fileName);
    } else if (format === 'csv') {
      const csvData = filteredData.map((row) => ({
        Date: row.date,
        'Backlog FTTH J': row.stock,
        'Backlog FTTH J-1 (Non Traité)': row.non_traite,
        'Dossiers Traités': row.traite,
      }));
      const csvContent = csvData.map(e => Object.values(e).join(',')).join('\n');
      const csvLink = document.createElement('a');
      csvLink.href = URL.createObjectURL(new Blob([csvContent], { type: 'text/csv' }));
      csvLink.download = `backlog-details${dateRange}.csv`;
      document.body.appendChild(csvLink);
      csvLink.click();
      document.body.removeChild(csvLink);
    } else if (format === 'xlsx') {
      const worksheet = XLSX.utils.json_to_sheet(filteredData.map((row) => ({
        Date: row.date,
        'Backlog FTTH J': row.stock,
        'Backlog FTTH J-1 (Non Traité)': row.non_traite,
        'Dossiers Traités': row.traite,
      })));
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'BacklogDetails');
      XLSX.writeFile(workbook, `backlog-details${dateRange}.xlsx`);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <Header toggleDateFilter={() => setShowDateFilter(!showDateFilter)} />
      {showDateFilter && (
        <div className="fixed top-16 right-4 z-50">
          <DateFilters setStartDate={setStartDate} setEndDate={setEndDate} closeFilter={() => setShowDateFilter(false)} />
        </div>
      )}
      <main className="container mx-auto p-6 pt-16 flex-grow transition-all duration-300 ease-in-out">
        <div className="flex flex-col items-center">
          <h1 className="text-3xl md:text-4xl font-bold mt-6 mb-6 text-center text-blue-600">Détails du Backlog</h1>
          {loading ? (
            <div className="spinner-container">
              <div className="spinner">
                <div className="spinner-text">ITS</div>
              </div>
            </div>
          ) : (
            <>
              <div className="mb-6 flex flex-col md:flex-row justify-between items-center w-full max-w-6xl mx-auto">
                <span className="text-lg font-medium">{startDate && endDate ? `De : ${startDate} À : ${endDate}` : `Date du jour : ${today}`}</span>
                {startDate && endDate && (
                  <span className="text-lg font-medium mt-4 md:mt-0">Durée : {Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24))} jours</span>
                )}
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 w-full max-w-6xl mx-auto">
                <div>
                  <h2 className="text-xl md:text-2xl font-bold mb-4 text-center text-blue-600">Backlog FTTH J Par Jour (Equipe FTTH)</h2>
                  <div style={{ position: 'relative', height: '300px', width: '100%' }}>
                    <Line
                      ref={graphRef1}
                      data={{
                        labels: filteredData.map(row => row.date),
                        datasets: [
                          {
                            label: 'Backlog FTTH J',
                            data: filteredData.map(row => row.stock),
                            borderColor: 'rgba(54, 162, 235, 0.6)',
                            fill: false,
                            borderWidth: 1.5,
                            pointRadius: 3,
                          },
                        ],
                      }}
                      options={chartOptions}
                    />
                  </div>
                </div>
                <div>
                  <h2 className="text-xl md:text-2xl font-bold mb-4 text-center text-red-600">Backlog FTTH J-1 Par Jour (Equipe FTTH)</h2>
                  <div style={{ position: 'relative', height: '300px', width: '100%' }}>
                    <Line
                      ref={graphRef2}
                      data={{
                        labels: filteredData.map(row => row.date),
                        datasets: [
                          {
                            label: 'Backlog FTTH J-1 (Non Traité)',
                            data: filteredData.map(row => row.non_traite),
                            borderColor: 'rgba(255, 99, 132, 0.6)',
                            fill: false,
                            borderWidth: 1.5,
                            pointRadius: 3,
                          },
                        ],
                      }}
                      options={chartOptions}
                    />
                  </div>
                </div>
                <div>
                  <h2 className="text-xl md:text-2xl font-bold mb-4 text-center text-green-600">Dossiers Traités Par Jour (Equipe FTTH)</h2>
                  <div style={{ position: 'relative', height: '300px', width: '100%' }}>
                    <Line
                      ref={graphRef3}
                      data={{
                        labels: filteredData.map(row => row.date),
                        datasets: [
                          {
                            label: 'Dossiers Traités',
                            data: filteredData.map(row => row.traite),
                            borderColor: 'rgba(75, 192, 192, 0.6)',
                            fill: false,
                            borderWidth: 1.5,
                            pointRadius: 3,
                          },
                        ],
                      }}
                      options={chartOptions}
                    />
                  </div>
                </div>
              </div>
              <div className="w-full max-w-6xl mx-auto mt-6 overflow-x-auto">
                <table className="min-w-full bg-white shadow-md rounded-lg overflow-hidden">
                  <thead>
                    <tr>
                      <th className="py-2 px-4 bg-blue-500 text-white">#</th>
                      <th className="py-2 px-4 bg-blue-500 text-white">Date</th>
                      <th className="py-2 px-4 bg-blue-500 text-white">Backlog FTTH J</th>
                      <th className="py-2 px-4 bg-blue-500 text-white">Backlog FTTH J-1 (Non Traité)</th>
                      <th className="py-2 px-4 bg-blue-500 text-white">Dossiers Traités</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredData.map((row, index) => (
                      <tr key={index} className="border-t">
                        <td className="py-2 px-4">{index + 1}</td>
                        <td className="py-2 px-4">{row.date}</td>
                        <td className="py-2 px-4">{row.stock}</td>
                        <td className="py-2 px-4">{row.non_traite}</td>
                        <td className="py-2 px-4">{row.traite}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex flex-col md:flex-row justify-end mt-4 space-x-0 md:space-x-4 w-full max-w-6xl mx-auto">
                <div className="relative inline-block text-left mb-4 md:mb-0">
                  <div>
                    <button
                      type="button"
                      className="inline-flex justify-center w-full px-4 py-2 bg-blue-600 text-sm font-medium text-white rounded-md hover:bg-blue-700 focus:outline-none"
                      id="options-menu"
                      onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    >
                      Télécharger
                      <svg
                        className="-mr-1 ml-2 h-5 w-5"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        aria-hidden="true"
                      >
                        <path
                          fillRule="evenodd"
                          d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 111.414 1.414l-4 4a1 1 01-1.414 0l-4-4a1 1 010-1.414z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                  </div>
                  {isDropdownOpen && (
                    <div
                      className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-10"
                    >
                      <div className="py-1" role="menu" aria-orientation="vertical" aria-labelledby="options-menu">
                        <a
                          href="#"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          onClick={() => handleDownload('csv')}
                        >
                          CSV
                        </a>
                        <a
                          href="#"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          onClick={() => handleDownload('xlsx')}
                        >
                          XLSX
                        </a>
                        <a
                          href="#"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          onClick={() => handleDownload('pdf')}
                        >
                          PDF
                        </a>
                      </div>
                    </div>
                  )}
                </div>
                <button
                  className="px-4 py-2 bg-gray-600 text-sm font-medium text-white rounded-md hover:bg-gray-700"
                  onClick={() => window.location.href = '/dashboard'}
                >
                  Retour au Dashboard
                </button>
              </div>
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default BacklogDetails;
