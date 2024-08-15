import React, { useState, useEffect, useRef } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import DateFilters from '../components/DateFilters';
import TopRuleGraph from '../components/TopRuleGraph';
import { fetchRegleData } from '../services/api';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';

const TopReglesDetails = () => {
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [showDateFilter, setShowDateFilter] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [data, setData] = useState([]);
  const today = new Date().toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' });
  const graphRefs = useRef([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const regleData = await fetchRegleData();
        console.log('Données de règles par jour :', regleData);
        setData(regleData);
      } catch (error) {
        console.error('Erreur lors de la récupération des données :', error);
      }
    };

    loadData();
  }, []);

  const getLastThreeDaysData = (data) => {
    const uniqueDates = [...new Set(data.map(item => item.date))]
      .sort((a, b) => new Date(b) - new Date(a))
      .slice(0, 3);

    return data.filter(item => uniqueDates.includes(item.date));
  };

  const filteredData = startDate && endDate
    ? data.filter(row => {
        const date = new Date(row.date);
        return (!startDate || date >= new Date(startDate)) && (!endDate || date <= new Date(endDate));
      })
    : getLastThreeDaysData(data);

  const calculateTopRules = (data) => {
    const ruleOccurrences = {};

    data.forEach((item) => {
      ruleOccurrences[item.regle] = (ruleOccurrences[item.regle] || 0) + item.nbr_stoc_du_jour;
    });

    return Object.keys(ruleOccurrences)
      .sort((a, b) => ruleOccurrences[b] - ruleOccurrences[a])
      .slice(0, 5);
  };

  const topRules = calculateTopRules(filteredData);

  const calculateRuleDataForDateRange = (rule, filteredData) => {
    const ruleData = {};

    filteredData.forEach(item => {
      if (item.regle === rule) {
        if (!ruleData[item.date]) {
          ruleData[item.date] = 0;
        }
        ruleData[item.date] += item.nbr_stoc_du_jour;
      }
    });

    return ruleData;
  };

  const handleDownload = async (format) => {
    setIsDropdownOpen(false);
    const dateRange = startDate && endDate ? `_${startDate}_to_${endDate}` : '';

    if (format === 'pdf') {
      const doc = new jsPDF('p', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 15;

      doc.setFontSize(10);
      doc.text(`Effectué le : ${today}`, pageWidth - margin, 10, { align: 'right' });

      doc.setFontSize(24);
      doc.setTextColor(0, 0, 255);
      doc.setFont('helvetica', 'bold');
      doc.text('Détails du Top 5 Règles', pageWidth / 2, 20, { align: 'center' });

      if (startDate && endDate) {
        doc.setFontSize(12);
        doc.setTextColor(0, 0, 0);
        doc.setFont('helvetica', 'normal');
        doc.text(`De : ${startDate} à : ${endDate}`, margin, 30);
      }

      let yOffset = 40; 

      topRules.forEach((rule, index) => {
        const graphCanvas = graphRefs.current[index]?.querySelector('canvas');
        if (graphCanvas) {
          const imgData = graphCanvas.toDataURL('image/png');

          if (yOffset + 70 > pageHeight - margin) {
            doc.addPage();
            yOffset = margin;
          }

          doc.setFontSize(16);
          doc.setTextColor(0, 0, 0);
          doc.text(`Règle ${rule}`, pageWidth / 2, yOffset, { align: 'center' });

          yOffset += 10;

          doc.addImage(imgData, 'PNG', margin, yOffset, pageWidth - 2 * margin, 60);
          yOffset += 70;
        }
      });

      // Add table after the graphs
      const tableData = filteredData.map(row => [row.date, row.regle, row.nbr_stoc_du_jour]);
      doc.autoTable({
        head: [['Date', 'Règle', 'Stock']],
        body: tableData,
        startY: yOffset + 10,
        theme: 'grid',
      });

      const fileName = `top-regles-details${dateRange}.pdf`;
      doc.save(fileName);
    } else if (format === 'csv') {
      const csvContent = [
        ['Date', 'Règle', 'Stock'],
        ...filteredData.map(row => [row.date, row.regle, row.nbr_stoc_du_jour])
      ].map(e => e.join(",")).join("\n");

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `top-regles-details${dateRange}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } else if (format === 'xlsx') {
      const worksheet = XLSX.utils.json_to_sheet(filteredData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'TopRegles');
      XLSX.writeFile(workbook, `top-regles-details${dateRange}.xlsx`);
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
          <h1 className="text-4xl font-bold mb-6 text-center text-blue-600">Détails du Top 5 Règles</h1>
          <div className="mb-6 flex justify-between items-center w-full max-w-6xl mx-auto">
            <span className="text-lg font-medium">{startDate && endDate ? `De : ${startDate} À : ${endDate}` : `Date du jour : ${today}`}</span>
            {startDate && endDate && (
              <span className="text-lg font-medium">Durée : {Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24))} jours</span>
            )}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 w-full max-w-6xl mx-auto">
            {topRules.map((rule, index) => {
              const ruleData = calculateRuleDataForDateRange(rule, filteredData);
              return (
                <div key={rule} className="mb-6">
                  <h2 className="text-2xl font-semibold mb-4 text-center">Détails de la règle {rule}</h2>
                  <div ref={(el) => (graphRefs.current[index] = el)}>
                    <TopRuleGraph rule={rule} filteredData={Object.entries(ruleData).map(([date, value]) => ({ date, value }))} />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="w-full max-w-6xl mx-auto mt-6">
            <table className="min-w-full bg-white shadow-md rounded-lg overflow-hidden">
              <thead>
                <tr>
                  <th className="py-2 px-4 bg-blue-500 text-white">ID</th>
                  <th className="py-2 px-4 bg-blue-500 text-white">Date</th>
                  <th className="py-2 px-4 bg-blue-500 text-white">Règle</th>
                  <th className="py-2 px-4 bg-blue-500 text-white">Stock</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map((row, index) => (
                  <tr key={index} className="border-t">
                    <td className="py-2 px-4">{index + 1}</td>
                    <td className="py-2 px-4">{row.date}</td>
                    <td className="py-2 px-4">{row.regle}</td>
                    <td className="py-2 px-4">{row.nbr_stoc_du_jour}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="flex justify-end mt-4 space-x-4">
              <div className="relative inline-block text-left">
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
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default TopReglesDetails;
