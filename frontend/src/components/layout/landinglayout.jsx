import React from "react";

const LandingLayout = ({ children }) => {
  return (
    <div className="min-h-screen w-full flex flex-col bg-[#EDEDED]">
      {/* NAVBAR */}
      <div className="bg-primary h-[80px] w-full flex items-center px-10">
        <img src="/palmingo-logo-white.svg" alt="Palmingo Logo" className="h-12" />
      </div>

      {/* CONTENT */}
      <div className="flex-1 w-full">
        {children}
      </div>
    </div>
  );
};

export default LandingLayout;