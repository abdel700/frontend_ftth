import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import Header from '../components/Header';
import Footer from '../components/Footer';
import DateFilters from '../components/DateFilters';
import CombinedOverview from '../components/CombinedOverview';
import TopRulesFTTH from '../components/TopRulesFTTH';
import StockVsSortantsApercu from '../components/StockVsSortantsApercu';
import ManualBreakdown from '../components/ManualBreakdown';
import StatCard from '../components/StatCard';
import TopRulesITS from '../components/TopRules';
import { formatDate } from '../utils/formatDate';
import { fetchStockData, fetchRegleDataAlternative, uploadFile } from '../services/api';
import { Spinner } from '../components/Spinner';
import { FaTimes } from 'react-icons/fa';
import CommentPalette from '../components/CommentPalette';

export default function Dashboard() {
  // State declarations
  const [showDateFilter, setShowDateFilter] = useState(false);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [stockData, setStockData] = useState([]);
  const [regleData, setRegleData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [commentMode, setCommentMode] = useState(false);
  const [selectedTool, setSelectedTool] = useState(null);
  const [elements, setElements] = useState([]);
  const [selectedElement, setSelectedElement] = useState(null);
  const [draggingHandle, setDraggingHandle] = useState(null);
  
  // Ref declarations
  const dateFilterRef = useRef();
  const combinedOverviewRef = useRef(null);
  const topRulesFTTHRef = useRef(null);
  const topRulesITSRef = useRef(null);
  const stockVsSortantsApercuRef = useRef(null);
  const manualBreakdownRef = useRef(null);
  
  const router = useRouter();
  const today = formatDate(new Date());

  // Data fetching logic
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const stockResult = await fetchStockData();
        setStockData(stockResult);

        const regleResult = await fetchRegleDataAlternative();
        setRegleData(regleResult);
      } catch (error) {
        console.error('Erreur lors de la récupération des données:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Toggle for date filter visibility
  const toggleDateFilter = () => {
    setShowDateFilter(!showDateFilter);
  };

  // Handling clicks outside the date filter
  const handleClickOutside = (event) => {
    if (dateFilterRef.current && !dateFilterRef.current.contains(event.target)) {
      setShowDateFilter(false);
    }
  };

  // Effect to manage adding/removing event listener for click outside
  useEffect(() => {
    if (showDateFilter) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDateFilter]);

  // Toggle for comment mode
  const toggleCommentMode = () => {
    setCommentMode(!commentMode);
    setSelectedTool(null);
  };

  // Logic for calculating backlog statistics
  const lastIndex = stockData.length - 1;
  const backlogToday = stockData[lastIndex]?.stock || 0;
  const backlogYesterday = stockData[lastIndex - 1]?.stock || 0;
  const backlogDifference = backlogToday - backlogYesterday;
  const backlogDifferenceText = backlogDifference > 0
    ? `(+${backlogDifference} des commandes rajoutées)`
    : `diminution de ${Math.abs(backlogDifference)} des commandes par rapport à la veille`;

  const backlogJ1Today = stockData[lastIndex]?.non_traite || 0;
  const backlogJ1Yesterday = stockData[lastIndex - 1]?.non_traite || 0;
  const backlogJ1Difference = backlogJ1Today - backlogJ1Yesterday;
  const backlogJ1DifferenceText = backlogJ1Difference > 0
    ? `(+${backlogJ1Difference} des commandes rajoutées)`
    : `diminution de ${Math.abs(backlogJ1Difference)} des commandes par rapport à la veille`;

  const dossiersTraitesToday = stockData[lastIndex]?.traite || 0;
  const objectifValue = backlogJ1Today;
  const objectivePercentage = (objectifValue / backlogToday) * 100;

  // Navigation handling based on card clicks
  const handleCardClick = () => {
    if (!commentMode) {
      router.push('/backlogDetails');
    }
  };

  const handleTopRulesITSClick = () => {
    if (!commentMode) {
      router.push('/topReglesDetails');
    }
  };

  const handleStockVsSortantsClick = () => {
    if (!commentMode) {
      router.push('/StockVsClosedDetails');
    }
  };

  const handleTopRulesFTTHClick = () => {
    if (!commentMode) {
      router.push('/topReglesDetails');
    }
  };

  // Handling dashboard click in comment mode
  const handleDashboardClick = (e) => {
    const scrollX = window.scrollX || document.documentElement.scrollLeft;
    const scrollY = window.scrollY || document.documentElement.scrollTop;

    if (!commentMode) return;

    if (selectedTool === 'comment') {
      const newElement = {
        id: Date.now(),
        type: 'comment',
        x: e.clientX + scrollX,
        y: e.clientY + scrollY,
        content: 'Ajouter un commentaire',
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

  // Handling double-click to edit elements
  const handleDoubleClick = (index) => {
    if (!elements[index].isEditing) {
      setSelectedElement(index);
    }
  };

  // Handling text changes in elements
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

  // Handling click on elements in comment mode
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

  // Handling drag and drop functionality for elements
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
        const newY = startY + (e.clientY - offsetY);

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

  // Handling resizing and rotating elements
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

  // PDF generation function
  const generatePDF = async () => {
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;
    const contentWidth = pageWidth - margin * 2;
    let yOffset = margin;

    // Add date of report generation
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Généré le : ${today}`, pageWidth - margin, yOffset, { align: 'right' });
    yOffset += 10;

    // Add report title
    doc.setFontSize(22);
    doc.setTextColor(0, 0, 128);
    doc.setFont('helvetica', 'bold');
    doc.text('Rapport du Dashboard FTTH', pageWidth / 2, yOffset, { align: 'center' });
    yOffset += 15;

    // Add period information
    if (startDate && endDate) {
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      doc.setFont('helvetica', 'normal');
      doc.text(`Période: ${startDate} à ${endDate} (${Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24))} jours)`, pageWidth / 2, yOffset, { align: 'center' });
      yOffset += 10;
    }

    // Add horizontal line
    doc.setDrawColor(200);
    doc.line(margin, yOffset, pageWidth - margin, yOffset);
    yOffset += 10;

    // Add statistics section
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 128);
    doc.setFont('helvetica', 'bold');
    doc.text('Statistiques', margin, yOffset);
    yOffset += 8;

    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'normal');
    doc.text(`• Backlog FTTH J: ${backlogToday} (${backlogDifferenceText})`, margin, yOffset);
    yOffset += 6;
    doc.text(`• Objectif: ${objectifValue} (${objectivePercentage.toFixed(1)}% de commandes non traitées)`, margin, yOffset);
    yOffset += 6;
    doc.text(`• Backlog FTTH J-1: ${backlogJ1Today} (${backlogJ1DifferenceText})`, margin, yOffset);
    yOffset += 6;
    doc.text(`• Dossiers Traités Aujourd'hui: ${dossiersTraitesToday}`, margin, yOffset);
    yOffset += 12;

    // Add another horizontal line
    doc.setDrawColor(200);
    doc.line(margin, yOffset, pageWidth - margin, yOffset);
    yOffset += 10;

    // Function to add charts to PDF
    const addChartToPDF = async (chartRef, title) => {
      return new Promise(async (resolve) => {
        if (chartRef.current) {
          const chartElement = chartRef.current.querySelector('canvas');
          if (!chartElement) return;

          // Add white background to canvas before capture
          const context = chartElement.getContext('2d');
          context.save();
          context.globalCompositeOperation = 'destination-over';
          context.fillStyle = '#FFFFFF';
          context.fillRect(0, 0, chartElement.width, chartElement.height);
          context.restore();

          const canvas = await html2canvas(chartElement, {
            backgroundColor: null,
            scale: 1.5,
          });

          const imgData = canvas.toDataURL('image/jpeg', 0.75);
          const imgHeight = (canvas.height * contentWidth) / canvas.width;

          requestAnimationFrame(() => {
            if (yOffset + imgHeight > pageHeight - margin) {
              doc.addPage();
              yOffset = margin;
            }

            // Add chart title
            doc.setFontSize(14);
            doc.setTextColor(0, 0, 128);
            doc.setFont('helvetica', 'bold');
            doc.text(title, margin, yOffset);
            yOffset += 6;

            // Add chart image
            doc.addImage(imgData, 'JPEG', margin, yOffset, contentWidth, imgHeight);
            yOffset += imgHeight + 10;

            resolve();
          });
        } else {
          resolve();
        }
      });
    };

    // Add charts to PDF
    await addChartToPDF(combinedOverviewRef, "Vue d'ensemble combinée");
    await addChartToPDF(topRulesITSRef, 'Top 5 RÈGLES (Équipe FTTH)');
    await addChartToPDF(topRulesFTTHRef, 'Top 5 RÈGLES par jour (Équipe FTTH)');
    await addChartToPDF(stockVsSortantsApercuRef, 'Stock Vs Sortants Aperçu');
    await addChartToPDF(manualBreakdownRef, 'Répartition Manuelle: Acteurs');

    return doc;
  };

  // Saving report to AWS S3
  const onSaveReport = async () => {
    try {
      const pdf = await generatePDF();
      const pdfBlob = pdf.output('blob');
      const pdfFileName = `dashboard_report_${new Date().toISOString()}.pdf`;

      const pdfFile = new File([pdfBlob], pdfFileName, { type: 'application/pdf' });

      await uploadFile(pdfFile);

      alert('Rapport enregistré et uploadé avec succès.');
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement du rapport:', error);
      alert('Une erreur est survenue lors de l\'enregistrement du rapport.');
    }
  };


  return (
    <div
      id="dashboard"
      className="relative flex flex-col min-h-screen bg-gray-100"
      onClick={handleDashboardClick}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      <Header
        toggleDateFilter={toggleDateFilter}
        setMenuOpen={setIsMenuOpen}
        toggleCommentMode={toggleCommentMode}
        onGeneratePDF={generatePDF}
        onSaveReport={onSaveReport}
        pageTitle="Dashboard"  // Nom de la page passée ici
      />

    {showDateFilter && (
      <div ref={dateFilterRef} className="fixed top-16 right-4 z-50">
        <DateFilters
          setStartDate={setStartDate}
          setEndDate={setEndDate}
          closeFilter={() => setShowDateFilter(false)}
        />
      </div>
    )}

    <main className="container mx-auto p-6 pt-16 flex-grow">
      <div className="flex flex-col items-center">
        <h1 className="text-4xl font-bold mt-6 mb-6 text-center text-blue-600">
          Dashboard FTTH
        </h1>
        {loading ? (
          <Spinner />
        ) : (
          <>
            <div className="mb-6 flex flex-col md:flex-row justify-between items-center w-full max-w-6xl mx-auto">
              <span className="text-lg font-medium">
                {startDate && endDate
                  ? `De : ${startDate} À : ${endDate}`
                  : `Date du jour : ${today}`}
              </span>
              {startDate && endDate && (
                <span className="text-lg font-medium mt-4 md:mt-0">
                  Durée :{' '}
                  {Math.ceil(
                    (new Date(endDate) - new Date(startDate)) /
                      (1000 * 60 * 60 * 24)
                  )}{' '}
                  jours
                </span>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 w-full">
            <StatCard
                title="Backlog FTTH J-1"
                value={backlogJ1Today}
                description={backlogJ1DifferenceText}
                className="hover:shadow-lg transition-shadow duration-300 ease-in-out"
              />
              <StatCard
                title="Backlog FTTH J"
                value={backlogToday}
                description={backlogDifferenceText}
                className="hover:shadow-lg transition-shadow duration-300 ease-in-out"
              />
              <StatCard
                title="Objectif"
                value={objectifValue}
                description={`${objectivePercentage.toFixed(
                  1
                )}% de commandes non traitées`}
                isObjective={true}
                className="hover:shadow-lg transition-shadow duration-300 ease-in-out"
              />
              <StatCard
                title="Dossiers Traités"
                value={dossiersTraitesToday}
                description="Aujourd'hui"
                className="hover:shadow-lg transition-shadow duration-300 ease-in-out"
              />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
              <div
                ref={combinedOverviewRef}
                onClick={handleCardClick}
                className="cursor-pointer lg:col-span-2 hover:shadow-lg transition-shadow duration-300 ease-in-out"
              >
                <CombinedOverview startDate={startDate} endDate={endDate} />
              </div>
              <div
                ref={topRulesFTTHRef}
                onClick={handleTopRulesFTTHClick}
                className="cursor-pointer lg:col-span-1 hover:shadow-lg transition-shadow duration-300 ease-in-out"
              >
                <TopRulesFTTH startDate={startDate} endDate={endDate} />
              </div>
              <div
                ref={topRulesITSRef}
                onClick={handleTopRulesITSClick}
                className="cursor-pointer lg:col-span-1 hover:shadow-lg transition-shadow duration-300 ease-in-out"
              >
                <TopRulesITS />
              </div>
              <div
                ref={stockVsSortantsApercuRef}
                onClick={handleStockVsSortantsClick}
                className="cursor-pointer lg:col-span-2 hover:shadow-lg transition-shadow duration-300 ease-in-out"
              >
                <StockVsSortantsApercu
                  startDate={startDate}
                  endDate={endDate}
                />
              </div>
              <div ref={manualBreakdownRef} className="lg:col-span-2 mb-8">
                <ManualBreakdown startDate={startDate} endDate={endDate} />
              </div>
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
          backgroundColor: el.type === 'comment' ? 'yellow' : 'transparent',
          padding: el.type === 'comment' ? '5px' : '0',
          fontSize: el.type === 'arrow' ? `${el.size}px` : '14px',
          color: el.type === 'arrow' ? 'red' : 'black',
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
              style={{ marginRight: '5px' }}
              onClick={() => handleModify(el.id)}
            >
              Modifier
            </button>
            <button
              style={{ color: 'red' }}
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
          onAddComment={() => setSelectedTool('comment')}
          onArrowClick={() => setSelectedTool('arrow')}
        />

        <button
          className="fixed bottom-4 right-4 bg-red-600 text-white p-4 rounded-full shadow-lg z-50"
          onClick={toggleCommentMode}
          style={{ pointerEvents: 'auto' }}
        >
          <FaTimes size={20} />
        </button>
      </>
    )}
  </div>
);
}
