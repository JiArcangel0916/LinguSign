import React from "react";

const Landing = ({ onLearnClick, onDictClick, onTranslateClick }) => {
  return (
    <div className="flex flex-col items-center justify-start font-fredoka px-6">
      <h1 className="text-2xl md:text-[32px] font-medium text-black mb-12 md:mb-24 mt-10 md:mt-20 text-center">
        What do you want to do today?
      </h1>
      <div className="flex flex-col md:flex-row items-center gap-8 md:gap-16">
        <img
          src="/learn-button.svg"
          alt="Learn"
          onClick={onLearnClick}
          className="w-[180px] md:w-[260px] cursor-pointer hover:scale-110 hover:-translate-y-2 transition duration-300"
        />
        <img
          src="/dictionary-button.svg"
          alt="Dictionary"
          onClick={onDictClick}
          className="w-[180px] md:w-[260px] cursor-pointer hover:scale-110 hover:-translate-y-2 transition duration-300"
        />
        <img
          src="/translate-button.svg"
          alt="Translate"
          onClick={onTranslateClick}
          className="w-[180px] md:w-[260px] cursor-pointer hover:scale-110 hover:-translate-y-2 transition duration-300"
        />
      </div>
    </div>
  );
};

export default Landing;