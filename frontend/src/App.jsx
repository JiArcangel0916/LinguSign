import React, { useState } from "react";
import LandingLayout from "./components/layout/landinglayout";
import Landing from "./components/pages/landing";
import LearnLayout from "./components/layout/learnlayout";
import Learn from "./components/pages/learn";
import DictionaryLayout from "./components/layout/dictionarylayout";
import Dictionary from "./components/pages/dictionary";
import Translation from "./components/pages/translation";

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
            onTranslateClick={() => setView("translation")} // 2. Ikabit ang translation click
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

      {/* TRANSLATION VIEW */}
      {view === "translation" && (
        <LearnLayout> 
          <Translation onBack={() => setView("landing")} />
        </LearnLayout>
      )}
    </>
  );
}

export default App;