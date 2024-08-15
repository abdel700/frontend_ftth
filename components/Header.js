// components/Header.js
import React, { useState, useEffect, useRef } from 'react';
import { FaBars, FaSearch, FaBell, FaFilter } from 'react-icons/fa';
import Link from 'next/link';

const Header = ({ toggleDateFilter, setMenuOpen }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const toggleMenu = () => {
    const newMenuState = !isMenuOpen;
    setIsMenuOpen(newMenuState);
    setMenuOpen(newMenuState);
  };

  const handleClickOutside = (event) => {
    if (menuRef.current && !menuRef.current.contains(event.target)) {
      setIsMenuOpen(false);
      setMenuOpen(false);
    }
  };

  useEffect(() => {
    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen]);

  return (
    <>
      <header className="bg-blue-600 text-white p-4 flex justify-between items-center fixed top-0 left-0 right-0 z-50 shadow-md">
        <div className="flex items-center">
          <FaBars className="mr-4 cursor-pointer" onClick={toggleMenu} />
          <Link href="/dashboard" className="text-xl font-bold text-white">
            FTTH DASHBOARD
          </Link>
        </div>
        <div className="flex items-center">
          <FaSearch className="mr-4 cursor-pointer" />
          <FaBell className="mr-4 cursor-pointer" />
          <FaFilter className="cursor-pointer" onClick={toggleDateFilter} />
        </div>
      </header>
      <div className={`fixed top-16 left-0 h-full bg-gray-800 text-white transition-transform duration-300 ease-in-out ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:w-64 w-3/4`} ref={menuRef} style={{ zIndex: 40 }}>
        <div className="p-4">
          <h2 className="text-xl font-bold mb-4">Menu</h2>
          <ul>
            <li className="mb-2"><a href="#">Page 1</a></li>
            <li className="mb-2"><a href="#">Page 2</a></li>
            <li className="mb-2"><a href="#">Page 3</a></li>
          </ul>
        </div>
      </div>
      {isMenuOpen && <div className="fixed inset-0 bg-black opacity-50" style={{ zIndex: 30 }} onClick={toggleMenu} />}
    </>
  );
};

export default Header;
