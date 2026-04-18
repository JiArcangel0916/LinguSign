import React from "react";

const Landing = ({ onLearnClick, onDictClick }) => {
  return (
    <div className="flex flex-col items-center justify-start pt-15 font-fredoka">
      <h1 className="text-[32px] font-medium text-black mb-24">
        What do you want to do today?
      </h1>

      <div className="flex gap-16">
        <img
          src="/learn-button.svg"
          alt="Learn"
          onClick={onLearnClick}
          className="w-[260px] cursor-pointer hover:scale-110 hover:-translate-y-2 transition duration-300"
        />

        <img
          src="/dictionary-button.svg"
          alt="Dictionary"
          onClick={onDictClick}
          className="w-[260px] cursor-pointer hover:scale-110 hover:-translate-y-2 transition duration-300"
        />

        <img
          src="/translate-button.svg"
          alt="Translate"
          className="w-[260px] cursor-pointer hover:scale-110 hover:-translate-y-2 transition duration-300"
        />
      </div>
    </div>
  );
};

export default Landing;