import React, { useState, useEffect, useRef } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import DateFilters from '../components/DateFilters';
import TopRuleGraph from '../components/TopRuleGraph';
import { fetchRegleData, uploadFile } from '../services/api'; // Assurez-vous que uploadFile est importé ici
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import html2canvas from 'html2canvas';

const TopReglesDetails = () => {
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [showDateFilter, setShowDateFilter] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const today = new Date().toLocaleString('fr-FR', { dateStyle: 'short' });
  const graphRefs = useRef([]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const regleData = await fetchRegleData();
        setData(regleData);
      } catch (error) {
        console.error('Erreur lors de la récupération des données :', error);
      } finally {
        setLoading(false);
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
    doc.text('Détails du Top 5 Règles', pageWidth / 2, yOffset, { align: 'center' });
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

    for (let index = 0; index < topRules.length; index++) {
      const rule = topRules[index];
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

        doc.setFontSize(16);
        doc.setTextColor(0, 0, 128);
        doc.setFont('helvetica', 'bold');
        doc.text(`Détails de la règle ${rule}`, margin, yOffset); 
        yOffset += 10;

        doc.addImage(imgData, 'PNG', margin, yOffset, contentWidth, imgHeight);
        yOffset += imgHeight + 10;
      }
    }

    doc.setDrawColor(200);
    doc.line(margin, yOffset, pageWidth - margin, yOffset);
    yOffset += 10;

    const tableData = filteredData.map(row => [row.date, row.regle, row.nbr_stoc_du_jour]);
    doc.autoTable({
      head: [['Date', 'Règle', 'Stock']],
      body: tableData,
      startY: yOffset + 10,
      theme: 'grid',
    });

    return doc;
  };

  const handleSaveReport = async () => {
    try {
      const pdf = await handleDownloadPDF();
      const pdfBlob = pdf.output('blob');
      const pdfFileName = `top-regles-details_${new Date().toISOString()}.pdf`;

      const pdfFile = new File([pdfBlob], pdfFileName, { type: 'application/pdf' });

      await uploadFile(pdfFile);

      alert('Rapport enregistré et uploadé avec succès.');
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement du rapport:', error);
      alert('Une erreur est survenue lors de l\'enregistrement du rapport.');
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <Header
        toggleDateFilter={() => setShowDateFilter(!showDateFilter)}
        onGeneratePDF={handleDownloadPDF}
        onSaveReport={handleSaveReport}
        pageTitle="Top Règles Details"
      />
      {showDateFilter && (
        <div className="fixed top-16 right-4 z-50">
          <DateFilters setStartDate={setStartDate} setEndDate={setEndDate} closeFilter={() => setShowDateFilter(false)} />
        </div>
      )}
      <main className="container mx-auto p-6 pt-16 flex-grow transition-all duration-300 ease-in-out">
        <div className="flex flex-col items-center">
          <h1 className="text-4xl font-bold mt-6 mb-6 text-center text-blue-600">Détails du Top 5 Règles</h1>
          {loading ? (
            <div className="spinner-container">
              <div className="spinner">
                <div className="spinner-text">ITS</div>
              </div>
            </div>
          ) : (
            <>
              <div className="mb-6 flex flex-col md:flex-row justify-between items-center w-full max-w-6xl mx-auto">
                <span className="text-lg font-medium">
                  {startDate && endDate ? `De : ${startDate} À : ${endDate}` : `Date du jour : ${today}`}
                </span>
                {startDate && endDate && (
                  <span className="text-lg font-medium mt-4 md:mt-0">
                    Durée : {Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24))} jours
                  </span>
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
              <div className="w-full max-w-6xl mx-auto mt-6 overflow-x-auto">
                <table className="min-w-full bg-white shadow-md rounded-lg overflow-hidden">
                  <thead>
                    <tr>
                      <th className="py-2 px-4 bg-blue-500 text-white">#</th>
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
                          onClick={() => handleDownloadPDF()}
                        >
                          PDF
                        </a>
                        <a
                          href="#"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          onClick={handleSaveReport}
                        >
                          Enregistrer un rapport
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

export default TopReglesDetails;
