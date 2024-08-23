import React, { useState, useRef } from 'react';
import { FaCommentDots, FaArrowRight, FaGripLines } from 'react-icons/fa';

const CommentPalette = ({ onAddComment, onArrowClick }) => {
  const [position, setPosition] = useState({ x: 100, y: 100 });
  const paletteRef = useRef(null);
  const dragRef = useRef(null);
  const isDragging = useRef(false);
  const offset = useRef({ x: 0, y: 0 });

  const handleMouseDown = (e) => {
    const palette = paletteRef.current;
    const rect = palette.getBoundingClientRect();

    // Calcul de l'offset pour maintenir la position relative de la souris
    offset.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
    
    isDragging.current = true;

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleMouseMove = (e) => {
    if (!isDragging.current) return;

    // Mise à jour de la position en tenant compte de l'offset
    setPosition({
      x: e.clientX - offset.current.x,
      y: e.clientY - offset.current.y,
    });
  };

  const handleMouseUp = () => {
    isDragging.current = false;
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  };

  return (
    <div
      ref={paletteRef}
      className="fixed bg-gray-800 text-white rounded-lg shadow-lg"
      style={{ top: position.y, left: position.x, zIndex: 1000 }}
    >
      {/* Barre de déplacement */}
      <div
        ref={dragRef}
        className="flex items-center justify-center bg-gray-700 p-2 cursor-move"
        onMouseDown={handleMouseDown}
      >
        <FaGripLines />
      </div>

      {/* Contenu de la palette */}
      <div className="flex flex-col items-center p-3 space-y-4">
        <FaCommentDots size={24} className="cursor-pointer" onClick={onAddComment} title="Ajouter un commentaire" />
        <FaArrowRight size={24} className="cursor-pointer" onClick={onArrowClick} title="Outil de flèche" />
      </div>
    </div>
  );
};

export default CommentPalette;
