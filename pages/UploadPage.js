import { useState, useEffect, useRef } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { FaTrashAlt, FaDownload, FaEnvelope } from 'react-icons/fa';
import { listFiles, uploadFile, deleteFile, downloadFile } from '../services/api';
import { Spinner } from '../components/Spinner';

export default function UploadPage() {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const loadFiles = async () => {
      setLoading(true);
      try {
        const filesList = await listFiles();
        setFiles(filesList);
      } catch (error) {
        console.error('Erreur lors de la récupération des fichiers:', error);
      } finally {
        setLoading(false);
      }
    };

    loadFiles();
  }, []);

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setLoading(true);
    try {
      await uploadFile(file);
      const updatedFiles = await listFiles();
      setFiles(updatedFiles);
    } catch (error) {
      console.error('Erreur lors de l\'upload du fichier:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileDelete = async (fileId) => {
    setLoading(true);
    try {
      await deleteFile(fileId);
      const updatedFiles = await listFiles();
      setFiles(updatedFiles);
    } catch (error) {
      console.error('Erreur lors de la suppression du fichier:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileDownload = async (fileId) => {
    try {
        const response = await fetch(`https://tranquil-shelf-72645-6e0212cb96fc.herokuapp.com/dashboard/api/download/${fileId}/`);
        const data = await response.json();
        if (response.ok && data.url) {
            window.open(data.url, '_blank');
        } else {
            throw new Error("Erreur lors du téléchargement du fichier");
        }
    } catch (error) {
        console.error('Erreur lors du téléchargement du fichier:', error);
        alert("Une erreur est survenue lors du téléchargement. Veuillez réessayer.");
    }
  };

  const handleFileSend = async (fileId) => {
    alert('Envoyer le fichier avec ID: ' + fileId);
  };

  return (
    <div className="relative flex flex-col min-h-screen bg-gray-100">
      <Header />
      <main className="container mx-auto p-6 pt-16 flex-grow">
        <h1 className="text-4xl font-bold mt-6 mb-6 text-center text-blue-600">Gestion des Rapport</h1>
        
        <div className="flex flex-col items-center mb-8">
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            onChange={handleFileUpload}
          />
        </div>
        
        {loading ? (
          <Spinner />
        ) : (
          <div className="w-full max-w-7xl mx-auto bg-white shadow-lg rounded-lg p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {files.length === 0 ? (
              <p className="text-center text-gray-500 col-span-full">Aucun fichier disponible.</p>
            ) : (
              files.map((file) => (
                <div key={file.id} className="bg-white rounded-lg p-6 shadow-md hover:shadow-lg transition-shadow duration-300">
                  <h2 className="text-lg font-semibold text-gray-800 truncate mb-2">{file.file.split('/').pop()}</h2>
                  <p className="text-gray-500 text-sm mb-4">{new Date(file.uploaded_at).toLocaleString()}</p>
                  <div className="flex justify-between mt-4">
                    <button
                      className="text-blue-600 hover:text-blue-800"
                      onClick={() => handleFileDownload(file.id)}
                    >
                      <FaDownload size={20} />
                    </button>
                    <button
                      className="text-green-600 hover:text-green-800"
                      onClick={() => handleFileSend(file.id)}
                    >
                      <FaEnvelope size={20} />
                    </button>
                    <button
                      className="text-red-600 hover:text-red-800"
                      onClick={() => handleFileDelete(file.id)}
                    >
                      <FaTrashAlt size={20} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
