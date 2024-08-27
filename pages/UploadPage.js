import { useState, useEffect, useRef } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Modal from 'react-modal';
import { FaTrashAlt, FaDownload, FaEnvelope } from 'react-icons/fa';
import { listFiles, uploadFile, deleteFile, downloadFile } from '../services/api';
import { Spinner } from '../components/Spinner';

export default function UploadPage() {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailDescription, setEmailDescription] = useState('');
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

  const openModal = (file) => {
    setSelectedFile(file);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEmailSubject('');
    setEmailDescription('');
  };

  const openMailServicePage = () => {
    if (typeof window !== "undefined") {
      const popup = window.open('', '_blank', 'width=400,height=400');
      popup.document.write(`
        <html>
        <head>
          <title>Choisissez un service de messagerie</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              height: 100vh;
              margin: 0;
              background-color: #f4f4f4;
            }
            h3 {
              margin-bottom: 20px;
            }
            ul {
              list-style-type: none;
              padding: 0;
            }
            li {
              margin: 10px 0;
            }
            a {
              text-decoration: none;
              color: #007BFF;
              font-weight: bold;
              padding: 10px 20px;
              background-color: #fff;
              border-radius: 5px;
              border: 1px solid #007BFF;
              transition: background-color 0.3s ease;
            }
            a:hover {
              background-color: #007BFF;
              color: #fff;
            }
          </style>
        </head>
        <body>
          <h3>Choisissez un service de messagerie</h3>
          <ul>
            <li><a href="#" onclick="window.opener.sendWithGmail(); window.close(); return false;">Gmail</a></li>
            <li><a href="#" onclick="window.opener.sendWithOutlook(); window.close(); return false;">Outlook</a></li>
          </ul>
        </body>
        </html>
      `);
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.sendWithGmail = function () {
        const mailtoLink = `mailto:?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailDescription)}`;
        window.location.href = mailtoLink;
      };
  
      window.sendWithOutlook = function () {
        const mailtoLink = `mailto:?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailDescription)}`;
        window.location.href = mailtoLink;
      };
    }
  }, [emailSubject, emailDescription]);
  
  

  const handleSendEmail = () => {
    openMailServicePage();
    closeModal();
  };

  return (
    <div className="relative flex flex-col min-h-screen bg-gray-100">
      <Header />
      <main className="container mx-auto p-6 pt-16 flex-grow">
        <h1 className="text-4xl font-bold mt-6 mb-6 text-center text-blue-600">Gestion des Rapports</h1>

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
                      onClick={() => openModal(file)}
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

      <Modal isOpen={isModalOpen} onRequestClose={closeModal} contentLabel="Envoyer un fichier">
        <h2 className="text-lg font-semibold mb-4">Envoyer le fichier</h2>
        <label className="block mb-2">Objet du mail:</label>
        <input
          type="text"
          value={emailSubject}
          onChange={(e) => setEmailSubject(e.target.value)}
          className="w-full p-2 mb-4 border rounded"
        />
        <label className="block mb-2">Description du mail:</label>
        <textarea
          value={emailDescription}
          onChange={(e) => setEmailDescription(e.target.value)}
          className="w-full p-2 mb-4 border rounded"
        />
        <div className="mb-4">
          <strong>Pièce jointe:</strong> {selectedFile?.file.split('/').pop()}
        </div>
        <button onClick={handleSendEmail} className="bg-blue-600 text-white px-4 py-2 rounded">Envoyer</button>
      </Modal>
    </div>
  );
}
