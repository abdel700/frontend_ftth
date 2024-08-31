// components/StatCard.js
import React, { useEffect, useState } from 'react';

const StatCard = ({ title, value, description, isObjective }) => {
  const [GaugeChart, setGaugeChart] = useState(null);

  useEffect(() => {
    if (isObjective) {
      import('react-gauge-chart').then((module) => {
        setGaugeChart(() => module.default);
      });
    }
  }, [isObjective]);

  // Set the fixed value for the large number
  const fixedObjectiveValue = 400;
  const maxNonTreatedOrders = fixedObjectiveValue;

  return (
    <div className="p-4 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 ease-in-out">
      <h2 className="text-xl font-bold text-blue-600 mb-2">{title}</h2>
      {isObjective && GaugeChart ? (
        <div className="flex flex-col items-center">
          <div className="text-3xl font-bold mb-2 self-start">{fixedObjectiveValue}</div>
          <GaugeChart
            id="gauge-chart"
            nrOfLevels={30}
            colors={["#00FF00", "#FFFF00", "#FF0000"]} // Gradient from green to red
            arcWidth={0.3}
            percent={value / maxNonTreatedOrders}
            textColor="#00000000" // Make the text transparent
            needleColor="#757575"
            style={{ width: '100%', height: '100%' }} // Responsive size
            formatTextValue={() => ''} // Remove default text
          />
    
          <div className="mt-4 text-center text-sm font-medium">
            {`${value} commandes`} {/* Updated small text */}
          </div>
        </div>
      ) : (
        <>
          <div className="text-3xl font-bold mb-2">{value}</div>
          <div className="text-gray-500">{description}</div>
        </>
      )}
    </div>
  );
};

export default StatCard;
