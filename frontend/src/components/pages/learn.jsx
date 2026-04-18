import React, { useState } from 'react';

const Learn = ({ onBack }) => {
  const [openCategory, setOpenCategory] = useState(null);

  // Define the modes for the dropdown
  const modes = ["ASL to Text", "Text to ASL", "All modes"];

  const toggleDropdown = (id) => {
    setOpenCategory(openCategory === id ? null : id);
  };

  return (
    <div className="font-fredoka">
      {/* BACK BUTTON */}
      <img 
        src="/arrow-left.svg" 
        alt="Back" 
        onClick={onBack}
        className="w-10 h-10 mb-8 cursor-pointer hover:scale-110 transition-transform" 
      />

      {/* TITLE */}
      <h2 className="text-center text-[32px] font-medium text-black mb-12">
        Which do you want to <span className="text-primary">learn</span>?
      </h2>

      {/* IMAGE-BASED BUTTON LIST */}
      <div className="flex flex-col items-center gap-8 max-w-2xl mx-auto">
        
        {/* ALPHABET SECTION */}
        <div className="w-full flex flex-col items-center">
          <img
            src="/alphabet-button.svg"
            alt="Alphabet"
            onClick={() => toggleDropdown('alphabet')}
            className="w-[500px] cursor-pointer hover:scale-105 transition-transform duration-300"
          />
          {openCategory === 'alphabet' && <DropdownMenu modes={modes} />}
        </div>

        {/* NUMBERS SECTION */}
        <div className="w-full flex flex-col items-center">
          <img
            src="/numbers-button.svg"
            alt="Numbers"
            onClick={() => toggleDropdown('numbers')}
            className="w-[500px] cursor-pointer hover:scale-105 transition-transform duration-300"
          />
          {openCategory === 'numbers' && <DropdownMenu modes={modes} />}
        </div>

        {/* WORDS SECTION */}
        <div className="w-full flex flex-col items-center">
          <img
            src="/words-button.svg"
            alt="Words"
            onClick={() => toggleDropdown('words')}
            className="w-[500px] cursor-pointer hover:scale-105 transition-transform duration-300"
          />
          {openCategory === 'words' && <DropdownMenu modes={modes} />}
        </div>

      </div>
    </div>
  );
};

// Sub-component for the 3-row dropdown menu
const DropdownMenu = ({ modes }) => (
  <div className="flex flex-col gap-2 mt-4 w-[450px] animate-in fade-in slide-in-from-top-2 duration-300">
    {modes.map((mode) => (
      <button 
        key={mode}
        className="w-full py-4 bg-white border-2 border-[#F5F5F5] rounded-2xl text-xl font-medium text-gray-600 hover:border-primary hover:text-primary transition-all shadow-sm active:scale-95"
      >
        {mode}
      </button>
    ))}
  </div>
);

export default Learn;