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
import html2canvas from 'html2canvas';

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
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const graphRefs = useRef([]);
  const dropdownRef = useRef(null);
  const today = new Date().toLocaleString('fr-FR', { dateStyle: 'short' });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const result = await fetchStockData();

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
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [startDate, endDate]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

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
        type: 'category',
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

  const handleDownload = (format) => {
    if (format === 'pdf') {
      handleDownloadPDF();
    } else if (format === 'csv') {
      // Logique pour télécharger en CSV
      console.log('Télécharger CSV');
    } else if (format === 'xlsx') {
      // Logique pour télécharger en XLSX
      console.log('Télécharger XLSX');
    }
  };

  const handleDownloadPDF = async () => {
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;
    const contentWidth = pageWidth - margin * 2;
    let yOffset = margin;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Généré le : ${today}`, pageWidth - margin, yOffset, { align: 'right' });
    yOffset += 10;

    doc.setFontSize(22);
    doc.setTextColor(0, 0, 128);
    doc.setFont('helvetica', 'bold');
    doc.text('Détails du Backlog', pageWidth / 2, yOffset, { align: 'center' });
    yOffset += 15;

    if (startDate && endDate) {
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      doc.setFont('helvetica', 'normal');
      const duration = `(${Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24))} jours)`;
      doc.text(`Période: ${startDate} à ${endDate} ${duration}`, pageWidth / 2, yOffset, { align: 'center' });
      yOffset += 10;
    }

    doc.setDrawColor(200);
    doc.line(margin, yOffset, pageWidth - margin, yOffset);
    yOffset += 10;

    for (let index = 0; index < graphRefs.current.length; index++) {
      const graphCanvas = graphRefs.current[index]?.querySelector('canvas');

      if (graphCanvas) {
        const canvas = await html2canvas(graphCanvas, {
          backgroundColor: null,
          scale: 2,
        });
        const imgData = canvas.toDataURL('image/png');
        const imgHeight = (canvas.height * contentWidth) / canvas.width;

        if (yOffset + imgHeight > pageHeight - margin) {
          doc.addPage();
          yOffset = margin;
        }

        const titles = [
          'Backlog FTTH J Par Jour (Equipe FTTH)',
          'Backlog FTTH J-1 Par Jour (Equipe FTTH)',
          'Dossiers Traités Par Jour (Equipe FTTH)',
        ];
        const colors = [
          [54, 162, 235],
          [255, 99, 132],
          [75, 192, 192],
        ];

        doc.setFontSize(16);
        doc.setTextColor(...colors[index]);
        doc.setFont('helvetica', 'bold');
        doc.text(titles[index], margin, yOffset);
        yOffset += 10;

        doc.addImage(imgData, 'PNG', margin, yOffset, contentWidth, imgHeight);
        yOffset += imgHeight + 10;
      }
    }

    doc.setDrawColor(200);
    doc.line(margin, yOffset, pageWidth - margin, yOffset);
    yOffset += 10;

    const tableData = filteredData.map(row => [row.date, row.stock, row.non_traite, row.traite]);
    doc.autoTable({
      head: [['Date', 'Backlog FTTH J', 'Backlog FTTH J-1 (Non Traité)', 'Dossiers Traités']],
      body: tableData,
      startY: yOffset + 10,
      theme: 'grid',
    });

    const fileName = `backlog-details_${today}.pdf`;
    doc.save(fileName);
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <Header toggleDateFilter={() => setShowDateFilter(!showDateFilter)} onDownloadPDF={handleDownloadPDF} />
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
                <div ref={(el) => (graphRefs.current[0] = el)}>
                  <h2 className="text-xl md:text-2xl font-bold mb-4 text-center text-blue-600">Backlog FTTH J Par Jour (Equipe FTTH)</h2>
                  <div style={{ position: 'relative', height: '300px', width: '100%' }}>
                    <Line
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
                <div ref={(el) => (graphRefs.current[1] = el)}>
                  <h2 className="text-xl md:text-2xl font-bold mb-4 text-center text-red-600">Backlog FTTH J-1 Par Jour (Equipe FTTH)</h2>
                  <div style={{ position: 'relative', height: '300px', width: '100%' }}>
                    <Line
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
                <div ref={(el) => (graphRefs.current[2] = el)}>
                  <h2 className="text-xl md:text-2xl font-bold mb-4 text-center text-green-600">Dossiers Traités Par Jour (Equipe FTTH)</h2>
                  <div style={{ position: 'relative', height: '300px', width: '100%' }}>
                    <Line
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
              {/* Boutons sous le tableau */}
              <div className="flex flex-col md:flex-row justify-end mt-4 space-x-0 md:space-x-4 w-full max-w-6xl mx-auto">
                <div className="relative inline-block text-left mb-4 md:mb-0" ref={dropdownRef}>
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
                          d="M5.293 7.293a1 1 011.414 0L10 10.586l3.293-3.293a1 1 111.414 1.414l-4 4a1 1 01-1.414 0l-4-4a1 1 010-1.414z"
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
