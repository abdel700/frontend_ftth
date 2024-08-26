import React from 'react';

const ReportsTable = ({ reports }) => {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white">
        <thead>
          <tr>
            <th className="py-2 px-4 border-b">Nom du Fichier</th>
            <th className="py-2 px-4 border-b">Date d'Enregistrement</th>
            <th className="py-2 px-4 border-b">Actions</th>
          </tr>
        </thead>
        <tbody>
          {reports.map((report, index) => (
            <tr key={index}>
              <td className="py-2 px-4 border-b">{report.name}</td>
              <td className="py-2 px-4 border-b">{report.date}</td>
              <td className="py-2 px-4 border-b">
                <button className="bg-blue-500 text-white px-2 py-1 mr-2">Modifier</button>
                <button className="bg-green-500 text-white px-2 py-1 mr-2">Envoyer</button>
                <button className="bg-yellow-500 text-white px-2 py-1 mr-2">Télécharger</button>
                <button className="bg-red-500 text-white px-2 py-1">Supprimer</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ReportsTable;