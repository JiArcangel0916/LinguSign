import React from 'react';

const LearnLayout = ({ children }) => {
  return (
    <div className="min-h-screen bg-white font-fredoka">
      {/* NAVBAR */}
      <div className="bg-primary h-[80px] w-full flex items-center px-10">
        <img src="/palmingo-logo-white.svg" alt="Palmingo Logo" className="h-12" />
      </div>

      {/* Main Content Area */}
      <main className="max-w-4xl mx-auto px-6 py-10">
        {children}
      </main>
    </div>
  );
};

export default LearnLayout;