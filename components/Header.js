import { useState, useEffect, useRef } from 'react';
import { FaBars, FaSearch, FaBell, FaFilter, FaComment, FaDownload } from 'react-icons/fa';
import Link from 'next/link';

const Header = ({ toggleDateFilter, toggleCommentMode, onGeneratePDF, onSaveReport, pageTitle }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const menuRef = useRef(null);
  const dropdownRef = useRef(null);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const handleClickOutside = (event) => {
    if (menuRef.current && !menuRef.current.contains(event.target)) {
      setIsMenuOpen(false);
    }
    if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
      setIsDropdownOpen(false);
    }
  };

  useEffect(() => {
    if (isMenuOpen || isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen, isDropdownOpen]);

  return (
    <>
      <header className="bg-blue-600 text-white p-4 flex justify-between items-center fixed top-0 left-0 right-0 z-50 shadow-md">
        <div className="flex items-center">
          <FaBars className="mr-4 cursor-pointer" onClick={toggleMenu} />
          <Link href="/dashboard">
            <span className="text-xl font-bold text-white cursor-pointer">
              {'FTTH DASHBOARD'}
            </span>
          </Link>
        </div>
        <div className="flex items-center relative">
          <FaSearch className="mr-4 cursor-pointer" />
          <FaBell className="mr-4 cursor-pointer" />
          <FaComment className="mr-4 cursor-pointer" onClick={toggleCommentMode} />
          <FaFilter className="mr-4 cursor-pointer" onClick={toggleDateFilter} />
          <div className="relative">
            <FaDownload className="cursor-pointer" onClick={toggleDropdown} />
            {isDropdownOpen && (
              <div
                ref={dropdownRef}
                className="absolute right-0 mt-2 w-48 bg-white text-black rounded-md shadow-lg z-50"
              >
                <ul className="py-1">
                  <li
                    className="block px-4 py-2 text-sm hover:bg-gray-200 cursor-pointer"
                    onClick={async () => {
                      setIsDropdownOpen(false);
                      try {
                        const pdf = await onGeneratePDF();
                        const fileName = `${pageTitle || 'Rapport'}_${new Date().toISOString()}.pdf`;
                        pdf.save(fileName);
                      } catch (error) {
                        console.error('Erreur lors du téléchargement du rapport:', error);
                        alert('Une erreur est survenue lors du téléchargement du rapport.');
                      }
                    }}
                  >
                    Télécharger un rapport
                  </li>
                  <li
                    className="block px-4 py-2 text-sm hover:bg-gray-200 cursor-pointer"
                    onClick={async () => {
                      setIsDropdownOpen(false);
                      try {
                        await onSaveReport();
                        alert('Rapport enregistré et uploadé avec succès.');
                      } catch (error) {
                        console.error('Erreur lors de l\'enregistrement du rapport:', error);
                        alert('Une erreur est survenue lors de l\'enregistrement du rapport.');
                      }
                    }}
                  >
                    Enregistrer un rapport
                  </li>
                </ul>
              </div>
            )}
          </div>
        </div>
      </header>
      <div
        className={`fixed top-16 left-0 h-full bg-gray-800 text-white transition-transform duration-300 ease-in-out ${
          isMenuOpen ? 'translate-x-0' : '-translate-x-full'
        } md:w-64 w-3/4`}
        ref={menuRef}
        style={{ zIndex: 40 }}
      >
        <div className="p-4">
          <h2 className="text-xl font-bold mb-4">Menu</h2>
          <ul>
            <li className="mb-2">
              <a href="/UploadPage">Gestion des Rapport</a>
            </li>
            <li className="mb-2">
              <a href="/UploadPage">Envoyer des Rapport</a>
            </li>
            <li className="mb-2">
              <a href="#">Guide</a>
            </li>
          </ul>
        </div>
      </div>
      {isMenuOpen && (
        <div
          className="fixed inset-0 bg-black opacity-50"
          style={{ zIndex: 30 }}
          onClick={toggleMenu}
        />
      )}
    </>
  );
};

export default Header;
