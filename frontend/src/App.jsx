import React, { useState, useEffect, useRef } from "react";
import { supabase } from "./supabaseClient";
import LandingLayout from "./components/layout/landinglayout";
import Landing from "./components/pages/landing";
import LearnLayout from "./components/layout/learnlayout";
import Learn from "./components/pages/learn";
import DictionaryLayout from "./components/layout/dictionarylayout";
import Dictionary from "./components/pages/dictionary";
import Translation from "./components/pages/translation";
import Login from "./components/pages/Login";
import Signup from "./components/pages/Signup";
import ForgotPassword from "./components/pages/ForgotPassword";
import ResetPassword from "./components/pages/ResetPassword";

function App() {
  const [view, setView] = useState("login");
  const [session, setSession] = useState(null);
  const isSigningUp = useRef(false);
  const initialSessionChecked = useRef(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (_event === "INITIAL_SESSION") {
        initialSessionChecked.current = true;
        setSession(session);
      } else if (_event === "SIGNED_IN" && initialSessionChecked.current && !isSigningUp.current) {
        setSession(session);
        setView("landing");
      } else if (_event === "PASSWORD_RECOVERY") {
        setSession(session);
        setView("reset-password");
      } else if (_event === "SIGNED_OUT") {
        setSession(null);
        setView("login");
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setView("login");
  };

  return (
    <>
      {view === "login" && (
        <Login
          onSuccess={() => {
            supabase.auth.getSession().then(({ data: { session } }) => {
              setSession(session);
              setView("landing");
            });
          }}
          onSignupClick={() => {
            isSigningUp.current = true;
            setView("signup");
          }}
          onForgotClick={() => setView("forgot-password")}
        />
      )}
      {view === "signup" && (
        <Signup
          onBack={() => {
            isSigningUp.current = false;
            setView("login");
          }}
          onSuccess={() => {
            isSigningUp.current = false;
            setView("login");
          }}
        />
      )}
      {view === "forgot-password" && (
        <ForgotPassword onBack={() => setView("login")} />
      )}
      {view === "reset-password" && (
        <ResetPassword onSuccess={() => setView("landing")} />
      )}
  {view === "landing" && session && (
  <LandingLayout onLogout={handleLogout}>
    <Landing
      onLearnClick={() => setView("learn")}
      onDictClick={() => setView("dictionary")}
      onTranslateClick={() => setView("translation")}
    />
  </LandingLayout>
)}
      {view === "learn" && session && (
        <LearnLayout>
          <Learn onBack={() => setView("landing")} session={session} />
        </LearnLayout>
      )}
      {view === "dictionary" && session && (
        <DictionaryLayout>
          <Dictionary onBack={() => setView("landing")} />
        </DictionaryLayout>
      )}
      {view === "translation" && session && (
        <LearnLayout>
          <Translation onBack={() => setView("landing")} />
        </LearnLayout>
      )}
    </>
  );
}

export default App;