import React from 'react';

const Dictionary = ({ onBack }) => {
  return (
    <div className="font-fredoka">
      <img 
        src="/arrow-left.svg" 
        alt="Back" 
        onClick={onBack}
        className="w-10 h-10 mb-8 cursor-pointer hover:scale-110 transition-transform" 
      />

      <h2 className="text-center text-[32px] font-medium text-black mb-12">
        Palmingo <span className="text-primary">Dictionary</span>
      </h2>

      <div className="flex flex-col items-center justify-center p-20 border-2 border-dashed border-gray-200 rounded-3xl bg-[#FAFAFA]">
        <p className="text-gray-400 text-xl font-medium">Coming Soon: Sign Library</p>
      </div>
    </div>
  );
};

export default Dictionary;