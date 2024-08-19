import React, { useState, useRef } from 'react';

const DateFilters = ({ setStartDate, setEndDate, closeFilter }) => {
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [error, setError] = useState('');
  const endDateRef = useRef(null);

  const handleApply = () => {
    const today = new Date().toISOString().split('T')[0]; // Date du jour au format YYYY-MM-DD

    // Vérification si les champs sont remplis
    if (!start || !end) {
      setError('Veuillez remplir les deux champs de date.');
      return;
    }

    // Vérification si la date de fin dépasse la date du jour
    if (end > today) {
      setError('La date de fin ne peut pas dépasser la date du jour.');
      return;
    }

    // Vérification si la date de début est postérieure à la date de fin
    if (start > end) {
      setError('La date de début ne peut pas être postérieure à la date de fin.');
      return;
    }

    // Si tout est bon, appliquer les filtres
    setStartDate(start);
    setEndDate(end);
    setError('');
    closeFilter();
  };

  const handleStartDateInput = (e) => {
    let value = e.target.value;

    // Limite l'année à 4 chiffres
    const parts = value.split('-');
    if (parts[0].length > 4) {
      parts[0] = parts[0].slice(0, 4);
    }

    value = parts.join('-');
    setStart(value);

    // Passe au champ de la date de fin si la date est complète
    if (value.length === 10) {
      endDateRef.current.focus();
    }
  };

  const handleEndDateInput = (e) => {
    let value = e.target.value;

    // Limite l'année à 4 chiffres
    const parts = value.split('-');
    if (parts[0].length > 4) {
      parts[0] = parts[0].slice(0, 4);
    }

    value = parts.join('-');
    setEnd(value);
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
          onInput={handleStartDateInput}  // Utilisation de onInput pour valider en temps réel
          onKeyDown={handleKeyDown}
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm"
        />
      </div>
      <div className="mb-4">
        <label className="block text-gray-700">Date de fin</label>
        <input
          type="date"
          value={end}
          ref={endDateRef}
          onInput={handleEndDateInput}  // Utilisation de onInput pour valider en temps réel
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
