import React, { useState } from 'react';

const DateFilters = ({ setStartDate, setEndDate, closeFilter }) => {
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [error, setError] = useState('');

  const handleApply = () => {
    if (!start || !end) {
      setError('Veuillez remplir les deux champs de date.');
    } else {
      setStartDate(start);
      setEndDate(end);
      setError('');
      closeFilter();
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter') {
      handleApply();
    }
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-lg">
      <div className="mb-4">
        <label className="block text-gray-700">Date de début</label>
        <input
          type="date"
          value={start}
          onChange={(e) => setStart(e.target.value)}
          onKeyDown={handleKeyDown}
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm"
        />
      </div>
      <div className="mb-4">
        <label className="block text-gray-700">Date de fin</label>
        <input
          type="date"
          value={end}
          onChange={(e) => setEnd(e.target.value)}
          onKeyDown={handleKeyDown}
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm"
        />
      </div>
      {error && <p className="text-red-500">{error}</p>}
      <div className="flex justify-end">
        <button
          onClick={handleApply}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Appliquer
        </button>
      </div>
    </div>
  );
};

export default DateFilters;
