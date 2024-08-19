import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
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
import { fetchStockData, fetchRegleDataAlternative } from '../services/api';
import { Spinner } from '../components/Spinner';

export default function Dashboard() {
  const [showDateFilter, setShowDateFilter] = useState(false);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [stockData, setStockData] = useState([]);
  const [regleData, setRegleData] = useState([]);
  const [loading, setLoading] = useState(true);
  const dateFilterRef = useRef();
  const router = useRouter();

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

  const toggleDateFilter = () => {
    setShowDateFilter(!showDateFilter);
  };

  const handleClickOutside = (event) => {
    if (dateFilterRef.current && !dateFilterRef.current.contains(event.target)) {
      setShowDateFilter(false);
    }
  };

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

  const today = formatDate(new Date());
  const duration = startDate && endDate
    ? `Durée : ${Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24))} jours`
    : '';

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

  const handleCardClick = () => {
    router.push('/backlogDetails');
  };

  const handleTopRulesITSClick = () => {
    router.push('/topReglesDetails');
  };

  const handleStockVsSortantsClick = () => {
    router.push('/StockVsClosedDetails');
  };

  const handleTopRulesFTTHClick = () => {
    router.push('/topReglesDetails');
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <Header toggleDateFilter={toggleDateFilter} setMenuOpen={setIsMenuOpen} />
      {showDateFilter && (
        <div ref={dateFilterRef} className="fixed top-16 right-4 z-50">
          <DateFilters setStartDate={setStartDate} setEndDate={setEndDate} closeFilter={() => setShowDateFilter(false)} />
        </div>
      )}
      <main className="container mx-auto p-6 pt-16 flex-grow transition-all duration-300 ease-in-out">
        <div className="flex flex-col items-center">
          <h1 className="text-4xl font-bold mt-6 mb-6 text-center text-blue-600">Dashboard FTTH</h1>
          {loading ? (
            <Spinner />
          ) : (
            <>
              <div className="mb-6 flex flex-col md:flex-row justify-between items-center w-full max-w-6xl mx-auto">
                <span className="text-lg font-medium">
                  {startDate && endDate ? `De : ${startDate} À : ${endDate}` : `Date du jour : ${today}`}
                </span>
                {startDate && endDate && (
                  <span className="text-lg font-medium mt-4 md:mt-0">
                    {duration}
                  </span>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 w-full">
                <StatCard
                  title="Backlog FTTH J"
                  value={backlogToday}
                  description={backlogDifferenceText}
                  className="hover:shadow-lg transition-shadow duration-300 ease-in-out"
                />
                <StatCard
                  title="Objectif"
                  value={objectifValue}
                  description={`${objectivePercentage.toFixed(1)}% de commandes non traitées`}
                  isObjective={true}
                  className="hover:shadow-lg transition-shadow duration-300 ease-in-out"
                />
                <StatCard
                  title="Backlog FTTH J-1"
                  value={backlogJ1Today}
                  description={backlogJ1DifferenceText}
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
                <div onClick={handleCardClick} className="cursor-pointer lg:col-span-2 hover:shadow-lg transition-shadow duration-300 ease-in-out">
                  <CombinedOverview startDate={startDate} endDate={endDate} />
                </div>
                <div onClick={handleTopRulesFTTHClick} className="cursor-pointer lg:col-span-1 hover:shadow-lg transition-shadow duration-300 ease-in-out">
                  <TopRulesFTTH startDate={startDate} endDate={endDate} />
                </div>
                <div onClick={handleTopRulesITSClick} className="cursor-pointer lg:col-span-1 hover:shadow-lg transition-shadow duration-300 ease-in-out">
                  <TopRulesITS />
                </div>
                <div onClick={handleStockVsSortantsClick} className="cursor-pointer lg:col-span-2 hover:shadow-lg transition-shadow duration-300 ease-in-out">
                  <StockVsSortantsApercu startDate={startDate} endDate={endDate} />
                </div>
                <div className="lg:col-span-2 mb-8">
                  <ManualBreakdown startDate={startDate} endDate={endDate} />
                </div>
              </div>
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
