import React, { useState } from "react";
import LandingLayout from "./components/layout/landinglayout";
import Landing from "./components/pages/landing";
import LearnLayout from "./components/layout/learnlayout";
import Learn from "./components/pages/learn";

function App() {
  const [view, setView] = useState("landing");

  return (
    <>
      {view === "landing" ? (
        <LandingLayout>
          <Landing onLearnClick={() => setView("learn")} />
        </LandingLayout>
      ) : (
        <LearnLayout>
          <Learn onBack={() => setView("landing")} />
        </LearnLayout>
      )}
    </>
  );
}

export default App;