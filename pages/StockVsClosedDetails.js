import React, { useState, useRef, useEffect } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import DateFilters from '../components/DateFilters';
import StockVsClosedGraph from '../components/StockVsClosed';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import html2canvas from 'html2canvas';
import { uploadFile } from '../services/api';
import CommentPalette from '../components/CommentPalette';
import { FaTimes } from 'react-icons/fa';

const fetchRegleData = async () => {
  const response = await fetch('https://tranquil-shelf-72645-6e0212cb96fc.herokuapp.com/dashboard/api/regle/');
  return response.json();
};

const calculateTopRules = (data) => {
  const ruleSums = data.reduce((acc, curr) => {
    acc[curr.regle] = (acc[curr.regle] || 0) + curr.nbr_stoc_du_jour;
    return acc;
  }, {});

  return Object.entries(ruleSums)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([rule]) => rule);
};

const getLastThreeDaysData = (data) => {
  const dates = [...new Set(data.map(row => row.date))].sort((a, b) => new Date(b) - new Date(a));
  const lastThreeDates = dates.slice(0, 3);
  return data.filter(row => lastThreeDates.includes(row.date));
};

const StockVsClosedDetails = () => {
  const pageTitle = "StockVsClosedDetails";
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [showDateFilter, setShowDateFilter] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [filteredData, setFilteredData] = useState([]);
  const [topRules, setTopRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [commentMode, setCommentMode] = useState(false);
  const [selectedTool, setSelectedTool] = useState(null);
  const [elements, setElements] = useState([]);
  const [selectedElement, setSelectedElement] = useState(null);
  const [draggingHandle, setDraggingHandle] = useState(null);

  const today = new Date().toLocaleString('fr-FR', { dateStyle: 'short' });
  const graphRefs = useRef([]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const regleData = await fetchRegleData();
        let data = regleData;

        if (startDate && endDate) {
          data = data.filter(row => {
            const rowDate = new Date(row.date);
            return rowDate >= new Date(startDate) && rowDate <= new Date(endDate);
          });
        } else {
          data = getLastThreeDaysData(data);
        }

        setFilteredData(data);
        const topRules = calculateTopRules(data);
        setTopRules(topRules);
      } catch (error) {
        console.error('Erreur lors de la récupération des données :', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [startDate, endDate]);

  const handleDownload = (type) => {
    switch (type) {
      case 'csv':
        handleDownloadCSV();
        break;
      case 'xlsx':
        handleDownloadXLSX();
        break;
      case 'pdf':
        generatePDF().then((pdf) => pdf.save(`${pageTitle}_${new Date().toISOString()}.pdf`));
        break;
      default:
        break;
    }
  };

  const handleDownloadCSV = () => {
    const csvData = filteredData.map(row => ({
      Date: row.date,
      Règle: row.regle,
      'Nbr stock veille': row.nbr_stoc_veille ?? 0,
      'Fermer hier': row.fermer_hier ?? 0,
    }));

    const csv = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).join(',')),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${pageTitle}_${new Date().toISOString()}.csv`);
    link.click();
  };

  const handleDownloadXLSX = () => {
    const worksheet = XLSX.utils.json_to_sheet(filteredData.map(row => ({
      Date: row.date,
      Règle: row.regle,
      'Nbr stock veille': row.nbr_stoc_veille ?? 0,
      'Fermer hier': row.fermer_hier ?? 0,
    })));

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');
    XLSX.writeFile(workbook, `${pageTitle}_${new Date().toISOString()}.xlsx`);
  };

  const generatePDF = async () => {
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
    doc.text('Détails des Entrants vs Sortants', pageWidth / 2, yOffset, { align: 'center' });
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
        doc.setTextColor(0, 0, 0);
        doc.setFont('helvetica', 'bold');
        doc.text(`Entrants vs Sortants de la Règle ${rule}`, margin, yOffset);
        yOffset += 10;

        doc.addImage(imgData, 'PNG', margin, yOffset, contentWidth, imgHeight);
        yOffset += imgHeight + 10;
      }
    }

    doc.setDrawColor(200);
    doc.line(margin, yOffset, pageWidth - margin, yOffset);
    yOffset += 10;

    const tableData = filteredData.map(row => [
      row.date,
      row.regle,
      row.nbr_stoc_veille ?? 0,
      row.fermer_hier ?? 0
    ]);

    doc.autoTable({
      head: [['Date', 'Règle', 'Nbr stock veille', 'Fermer hier']],
      body: tableData,
      startY: yOffset + 10,
      theme: 'grid',
    });

    return doc;
  };

  const onSaveReport = async () => {
    try {
      const pdf = await generatePDF();
      const pdfBlob = pdf.output('blob');
      const pdfFileName = `${pageTitle}_${new Date().toISOString()}.pdf`;

      const pdfFile = new File([pdfBlob], pdfFileName, { type: 'application/pdf' });

      await uploadFile(pdfFile);

      alert('Rapport enregistré et uploadé avec succès.');
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement du rapport:', error);
      alert('Une erreur est survenue lors de l\'enregistrement du rapport.');
    }
  };

  const handleDashboardClick = (e) => {
    const scrollX = window.scrollX || document.documentElement.scrollLeft;
    const scrollY = window.scrollY || document.documentElement.scrollTop;

    if (!commentMode) return;

    if (selectedTool === 'commentYellow' || selectedTool === 'commentGreen' || selectedTool === 'commentRed') {
      const color = selectedTool === 'commentYellow' ? 'yellow' : selectedTool === 'commentGreen' ? 'green' : 'red';
      const textColor = selectedTool === 'commentYellow' ? 'black' : 'white';
      const newElement = {
        id: Date.now(),
        type: 'comment',
        x: e.clientX + scrollX,
        y: e.clientY + scrollY,
        content: 'Ajouter un commentaire',
        color,
        textColor,
        isEditing: false,
      };
      setElements([...elements, newElement]);
      setSelectedTool(null);
    } else if (selectedTool === 'arrow') {
      const newElement = {
        id: Date.now(),
        type: 'arrow',
        x: e.clientX + scrollX,
        y: e.clientY + scrollY,
        content: '→',
        size: 24,
        rotation: 0,
      };
      setElements([...elements, newElement]);
      setSelectedTool(null);
    }
  };

  const handleDoubleClick = (index) => {
    if (!elements[index].isEditing) {
      setSelectedElement(index);
    }
  };

  const handleTextChange = (e, id) => {
    setElements(elements.map((el) => (el.id === id ? { ...el, content: e.target.value } : el)));
  };

  const handleBlur = (id) => {
    setElements(elements.map((el) => (el.id === id ? { ...el, isEditing: false } : el)));
    setSelectedElement(null);
  };

  const handleKeyDown = (e, id) => {
    if (e.key === 'Enter') {
      handleBlur(id);
    }
  };

  const handleElementClick = (id) => {
    if (commentMode && selectedTool === 'erase') {
      setElements(prevElements => prevElements.filter((el) => el.id !== id));
    }
  };

  const handleModify = (id) => {
    setElements(elements.map((el) => (el.id === id ? { ...el, isEditing: true } : el)));
    setSelectedElement(null);
  };

  const handleDelete = (id) => {
    setElements(prevElements => prevElements.filter((el) => el.id !== id));
    setSelectedElement(null);
  };

  const handleDragStart = (id, e) => {
    const element = elements.find(el => el.id === id);
    e.dataTransfer.setData('text/plain', JSON.stringify({ id, startX: element.x, startY: element.y, offsetX: e.clientX, offsetY: e.clientY }));
  };

  const handleDrop = (e) => {
    try {
      const data = e.dataTransfer.getData('text/plain');
      if (data) {
        const parsedData = JSON.parse(data);
        const { id, startX, startY, offsetX, offsetY } = parsedData;
        const newX = startX + (e.clientX - offsetX);
        const newY = startY + (offsetY - e.clientY);

        const updatedElements = elements.map((el) =>
          el.id === id ? { ...el, x: newX, y: newY } : el
        );
        setElements(updatedElements);
      }
    } catch (error) {
      console.error('Erreur lors du déplacement de l\'élément:', error);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const startResizingOrRotating = (handle, index, e) => {
    setDraggingHandle({ handle, index });
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', stopResizingOrRotating);
  };

  const stopResizingOrRotating = () => {
    setDraggingHandle(null);
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', stopResizingOrRotating);
  };

  const onMouseMove = (e) => {
    if (!draggingHandle) return;

    const { handle, index } = draggingHandle;
    const element = elements[index];
    const centerX = element.x + 12;
    const centerY = element.y + 12;

    const deltaX = e.clientX - centerX;
    const deltaY = e.clientY - centerY;

    if (handle === 'resize') {
      const newSize = Math.max(10, Math.sqrt(deltaX * deltaX + deltaY * deltaY));
      setElements(elements.map((el, i) => i === index ? { ...el, size: newSize } : el));
    } else if (handle === 'rotate') {
      const newRotation = Math.atan2(deltaY, deltaX) * (180 / Math.PI);
      setElements(elements.map((el, i) => i === index ? { ...el, rotation: newRotation } : el));
    }
  };

  return (
    <div
      id="stock-vs-closed-details"
      className="relative flex flex-col min-h-screen bg-gray-100"
      onClick={handleDashboardClick}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      <Header 
        toggleDateFilter={() => setShowDateFilter(!showDateFilter)} 
        onGeneratePDF={generatePDF} 
        onSaveReport={onSaveReport}
        pageTitle={pageTitle}  
        toggleCommentMode={() => setCommentMode(!commentMode)} 
      />
      {showDateFilter && (
        <div className="fixed top-16 right-4 z-50">
          <DateFilters setStartDate={setStartDate} setEndDate={setEndDate} closeFilter={() => setShowDateFilter(false)} />
        </div>
      )}
      <main className="container mx-auto p-6 pt-16 flex-grow transition-all duration-300 ease-in-out">
        <div className="flex flex-col items-center">
          <h1 className="text-3xl md:text-4xl font-bold mt-6 mb-6 text-center text-blue-600">Détails des Entrants vs Sortants</h1>
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
                  const ruleData = filteredData.filter(row => row.regle === rule);
                  return (
                    <div key={rule} className="mb-6">
                      <h2 className="text-2xl font-semibold mb-4 text-center">Détails de la règle {rule}</h2>
                      <div ref={(el) => (graphRefs.current[index] = el)}>
                        <StockVsClosedGraph ruleData={ruleData} rule={rule} />
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
                      <th className="py-2 px-4 bg-blue-500 text-white">Nbr stock veille</th>
                      <th className="py-2 px-4 bg-blue-500 text-white">Fermer hier</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredData.map((row, index) => (
                      <tr key={index} className="border-t">
                        <td className="py-2 px-4">{index + 1}</td>
                        <td className="py-2 px-4">{row.date}</td>
                        <td className="py-2 px-4">{row.regle}</td>
                        <td className="py-2 px-4">{row.nbr_stoc_veille ?? 'Valeur non disponible'}</td>
                        <td className="py-2 px-4">{row.fermer_hier ?? 'Valeur non disponible'}</td>
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

      {/* Affichage des éléments ajoutés */}
      {elements.map((el, index) => (
        <div
          key={el.id}
          style={{
            position: 'absolute',
            top: el.y,
            left: el.x,
            backgroundColor: el.color,
            padding: el.type === 'comment' ? '5px' : '0',
            fontSize: el.type === 'arrow' ? `${el.size}px` : '14px',
            color: el.textColor,
            cursor:
              selectedTool === 'erase' && commentMode
                ? 'not-allowed'
                : el.isEditing
                ? 'text'
                : 'pointer',
            transform: el.type === 'arrow' ? `rotate(${el.rotation}deg)` : 'none',
          }}
          draggable={!el.isEditing && selectedTool !== 'erase'}
          onDragStart={(e) => handleDragStart(el.id, e)}
          onDoubleClick={() => handleDoubleClick(index)}
        >
          {el.isEditing ? (
            <input
              type="text"
              value={el.content}
              onChange={(e) => handleTextChange(e, el.id)}
              onBlur={() => handleBlur(el.id)}
              onKeyDown={(e) => handleKeyDown(e, el.id)}
              autoFocus
              style={{
                color: 'black',
                backgroundColor: 'white',
                borderColor: el.color === 'yellow' ? 'blue' : 'red',
              }}
            />
          ) : (
            el.content
          )}

          {el.type === 'arrow' && (
            <>
              <div
                style={{
                  position: 'absolute',
                  right: '-10px',
                  top: '-10px',
                  width: '10px',
                  height: '10px',
                  backgroundColor: 'blue',
                  cursor: 'nwse-resize',
                }}
                onMouseDown={(e) => startResizingOrRotating('resize', index, e)}
              ></div>
              <div
                style={{
                  position: 'absolute',
                  left: '50%',
                  top: '-20px',
                  width: '10px',
                  height: '10px',
                  backgroundColor: 'green',
                  cursor: 'grab',
                  transform: 'translateX(-50%)',
                }}
                onMouseDown={(e) => startResizingOrRotating('rotate', index, e)}
              ></div>
            </>
          )}
          {selectedElement === index && !el.isEditing && (
            <div
              style={{
                position: 'absolute',
                top: '-30px',
                left: '0',
                backgroundColor: 'white',
                border: '1px solid #ccc',
                padding: '5px',
                borderRadius: '5px',
                zIndex: 1000,
              }}
            >
              <button
                style={{
                  marginRight: '5px',
                  color: 'black',
                }}
                onClick={() => handleModify(el.id)}
              >
                Modifier
              </button>
              <button
                style={{
                  color: 'red',
                }}
                onClick={() => handleDelete(el.id)}
              >
                Supprimer
              </button>
            </div>
          )}
        </div>
      ))}

      {/* Affichage de la palette de commentaires lorsqu'elle est activée */}
      {commentMode && (
        <>
          <div className="fixed inset-0 bg-transparent z-40"></div>

          <CommentPalette
            onAddComment={(color) => setSelectedTool(color)}
            onArrowClick={() => setSelectedTool('arrow')}
          />

          <button
            className="fixed bottom-4 right-4 bg-red-600 text-white p-4 rounded-full shadow-lg z-50"
            onClick={() => setCommentMode(false)}
            style={{ pointerEvents: 'auto' }}
          >
            <FaTimes size={20} />
          </button>
        </>
      )}
    </div>
  );
};

export default StockVsClosedDetails;
