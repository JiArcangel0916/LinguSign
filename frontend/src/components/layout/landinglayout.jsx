import React from "react";

const LandingLayout = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col bg-[#EDEDED]">

      {/* NAVBAR */}
      <div className="bg-[#F48426] h-[80px] flex items-center px-10">
        <img
          src="/palmingo-logo-white.svg"
          alt="Palmingo Logo"
          className="h-12"
        />
      </div>

      {/* CONTENT */}
      <div className="flex-1">
        {children}
      </div>

    </div>
  );
};

export default LandingLayout;