import React, { useState } from "react";
import LandingLayout from "./components/layout/landinglayout";
import Landing from "./components/pages/landing";
import LearnLayout from "./components/layout/learnlayout";
import Learn from "./components/pages/learn";
import DictionaryLayout from "./components/layout/dictionarylayout";
import Dictionary from "./components/pages/dictionary";

function App() {
  const [view, setView] = useState("landing");

  return (
    <>
      {/* LANDING VIEW */}
      {view === "landing" && (
        <LandingLayout>
          <Landing 
            onLearnClick={() => setView("learn")} 
            onDictClick={() => setView("dictionary")} 
          />
        </LandingLayout>
      )}

      {/* LEARN VIEW */}
      {view === "learn" && (
        <LearnLayout>
          <Learn onBack={() => setView("landing")} />
        </LearnLayout>
      )}

      {/* DICTIONARY VIEW */}
      {view === "dictionary" && (
        <DictionaryLayout>
          <Dictionary onBack={() => setView("landing")} />
        </DictionaryLayout>
      )}
    </>
  );
}

export default App;