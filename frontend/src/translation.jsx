import React, { useState, useRef, useEffect } from 'react';
import { ALPHABET_DICT, WORD_DICT } from './aslData';

const ORANGE = "#F97316";
const NAVY = "#1E3A5F";

const Translation = ({ onBack }) => {
  const [mode, setMode] = useState('TexttoASL');
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [transcript, setTranscript] = useState("");
  const [inputText, setInputText] = useState("");
  const [sequence, setSequence] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const videoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    if (recording) {
      timerRef.current = setInterval(() => setSeconds(p => p + 1), 1000);
    } else {
      clearInterval(timerRef.current);
      setSeconds(0);
    }
    return () => clearInterval(timerRef.current);
  }, [recording]);

  const toggleRecording = async () => {
    if (recording && mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setRecording(false);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) videoRef.current.srcObject = stream;
      setRecording(true);
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      const chunks = [];
      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = async () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        const formData = new FormData();
        formData.append('file', blob);
        setTranscript("Translating...");
        try {
          const res = await fetch('http://127.0.0.1:8000/translate-video', {
            method: 'POST',
            body: formData,
          });
          const data = await res.json();
          setTranscript(data.text);
        } catch {
          setTranscript("Server Error");
        }
        stream.getTracks().forEach(t => t.stop());
        setRecording(false);
      };
      recorder.start();
      setTimeout(() => {
        if (recorder.state === "recording") {
          recorder.stop();
          setRecording(false);
        }
      }, 10000);
    } catch {
      setTranscript("Camera access denied");
    }
  };

  const handleTranslateText = () => {
    if (!inputText.trim()) return;
    const words = inputText.trim().toUpperCase().split(/\s+/);
    let final = [];
    words.forEach(word => {
      let found = null;
      for (const cat of WORD_DICT) {
        const match = cat.words.find(w => w.word.toUpperCase() === word);
        if (match) { found = { ...match, type: 'word' }; break; }
      }
      if (found) final.push(found);
      else {
        word.split("").forEach(char => {
          const letter = ALPHABET_DICT.find(a => a.word.toUpperCase() === char);
          if (letter) final.push({ ...letter, type: 'alphabet' });
        });
      }
    });
    setSequence(final);
    setCurrentIndex(0);
    setIsPlaying(final.length > 0);
  };

  useEffect(() => {
    if (isPlaying && currentIndex < sequence.length) {
      const duration = sequence[currentIndex].type === 'word' ? 3000 : 1500;
      const timer = setTimeout(() => {
        if (currentIndex < sequence.length - 1) setCurrentIndex(p => p + 1);
        else setIsPlaying(false);
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [currentIndex, isPlaying, sequence]);

  const formatTime = (s) => {
    const mins = Math.floor(s / 60).toString().padStart(2, '0');
    const secs = (s % 60).toString().padStart(2, '0');
    return `00:${mins}:${secs}`;
  };

  const nextSlide = () => {
    setIsPlaying(false);
    if (currentIndex < sequence.length - 1) setCurrentIndex(p => p + 1);
  };

  const prevSlide = () => {
    setIsPlaying(false);
    if (currentIndex > 0) setCurrentIndex(p => p - 1);
  };

  const renderMedia = (item) => {
    const path = item.media.replace(/[<>]/g, "");
    const isVideo = path.toLowerCase().endsWith('.mp4');
    if (isVideo) {
      return (
        <video
          key={path}
          src={path}
          autoPlay
          muted
          loop
          style={{ width: "100%", height: "100%", objectFit: "contain" }}
        />
      );
    }
    return (
      <img
        src={path}
        alt="sign"
        style={{ width: "100%", height: "100%", objectFit: "contain" }}
      />
    );
  };

  return (
    <div style={{ minHeight: "100vh", background: "#EDEDED", fontFamily: "'Nunito', sans-serif" }}>
      <div style={{
        background: ORANGE,
        height: 70,
        display: "flex",
        alignItems: "center",
        padding: "0 28px",
        gap: 12,
        boxShadow: "0 2px 8px rgba(249,115,22,0.3)",
      }}>
        <span style={{ fontSize: 26 }}>🤚</span>
        <span style={{ fontSize: 26, fontWeight: 800, color: "white", letterSpacing: "-0.5px" }}>Palmingo</span>
      </div>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "28px 20px" }}>
        <div style={{ display: "flex", alignItems: "center", marginBottom: 24 }}>
          <button
            onClick={onBack}
            style={{
              background: "none", border: "none", cursor: "pointer",
              fontSize: 15, fontWeight: 700, color: NAVY,
              fontFamily: "'Nunito', sans-serif", padding: "6px 0",
              display: "flex", alignItems: "center", gap: 6,
            }}
          >
            ← Back
          </button>
        </div>

        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 12, marginBottom: 28 }}>
          {['TexttoASL', 'ASLtoText'].map((m) => (
            <button
              key={m}
              onClick={() => { setMode(m); setTranscript(""); setSequence([]); setInputText(""); setIsPlaying(false); }}
              style={{
                padding: "10px 28px",
                borderRadius: 50,
                fontFamily: "'Nunito', sans-serif",
                fontSize: 14,
                fontWeight: 800,
                cursor: "pointer",
                border: `2px solid ${ORANGE}`,
                background: mode === m ? ORANGE : "white",
                color: mode === m ? "white" : ORANGE,
                transition: "all 0.18s",
                letterSpacing: "0.3px",
              }}
            >
              {m === 'TexttoASL' ? 'Text to ASL' : 'ASL to Text'}
            </button>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          <div style={{
            background: "white",
            borderRadius: 28,
            padding: 20,
            boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
            aspectRatio: "1/1",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}>
            {mode === 'TexttoASL' ? (
              <>
                <div style={{
                  flex: 1,
                  border: "1.5px solid #F3F4F6",
                  borderRadius: 18,
                  padding: 16,
                  marginBottom: 14,
                  position: "relative",
                }}>
                  <textarea
                    value={inputText}
                    onChange={e => setInputText(e.target.value)}
                    placeholder="Write something here..."
                    style={{
                      width: "100%",
                      height: "100%",
                      border: "none",
                      outline: "none",
                      resize: "none",
                      fontFamily: "'Nunito', sans-serif",
                      fontSize: 15,
                      fontWeight: 600,
                      color: NAVY,
                      background: "transparent",
                    }}
                  />
                </div>
                <button
                  onClick={handleTranslateText}
                  style={{
                    background: ORANGE,
                    color: "white",
                    border: "none",
                    borderRadius: 50,
                    padding: "13px",
                    fontFamily: "'Nunito', sans-serif",
                    fontSize: 15,
                    fontWeight: 800,
                    cursor: "pointer",
                    width: "100%",
                    letterSpacing: "0.5px",
                  }}
                >
                  {isPlaying ? "🔄 Auto-playing..." : "Translate to ASL →"}
                </button>
              </>
            ) : (
              <div style={{
                flex: 1,
                background: "#F9FAFB",
                borderRadius: 20,
                position: "relative",
                overflow: "hidden",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}>
                <video ref={videoRef} autoPlay muted style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 20 }} />
                {recording && (
                  <div style={{
                    position: "absolute", top: 14, left: "50%", transform: "translateX(-50%)",
                    background: "#DC2626", color: "white", padding: "4px 14px",
                    borderRadius: 8, fontFamily: "monospace", fontSize: 15, fontWeight: 700,
                  }}>
                    {formatTime(seconds)}
                  </div>
                )}
                <div style={{ position: "absolute", bottom: 16, left: "50%", transform: "translateX(-50%)" }}>
                  <div style={{
                    width: 64, height: 64, borderRadius: "50%",
                    border: "3px solid white",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <button
                      onClick={toggleRecording}
                      style={{
                        width: recording ? 22 : 46,
                        height: recording ? 22 : 46,
                        background: "#DC2626",
                        border: "none",
                        borderRadius: recording ? 4 : "50%",
                        cursor: "pointer",
                        transition: "all 0.25s",
                      }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          <div style={{
            background: "white",
            borderRadius: 28,
            padding: 20,
            boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
            aspectRatio: "1/1",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            overflow: "hidden",
            position: "relative",
          }}>
            {mode === 'TexttoASL' ? (
              sequence.length > 0 ? (
                <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", position: "relative" }}>
                  <div style={{
                    position: "absolute", top: 0, right: 0,
                    background: "#FFF7ED", color: ORANGE,
                    padding: "6px 14px", borderRadius: 50,
                    fontSize: 13, fontWeight: 800,
                  }}>
                    {currentIndex + 1} / {sequence.length}
                  </div>
                  
                  <div style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", flex: 1 }}>
                    <button 
                      onClick={prevSlide}
                      disabled={currentIndex === 0}
                      style={{ 
                        background: "#F3F4F6", border: "none", borderRadius: "50%", 
                        width: 36, height: 36, cursor: currentIndex === 0 ? "default" : "pointer",
                        color: NAVY, fontWeight: "bold", opacity: currentIndex === 0 ? 0.3 : 1
                      }}
                    >
                      ‹
                    </button>

                    <div style={{ width: "70%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {renderMedia(sequence[currentIndex])}
                    </div>

                    <button 
                      onClick={nextSlide}
                      disabled={currentIndex === sequence.length - 1}
                      style={{ 
                        background: "#F3F4F6", border: "none", borderRadius: "50%", 
                        width: 36, height: 36, cursor: currentIndex === sequence.length - 1 ? "default" : "pointer",
                        color: NAVY, fontWeight: "bold", opacity: currentIndex === sequence.length - 1 ? 0.3 : 1
                      }}
                    >
                      ›
                    </button>
                  </div>

                  <p style={{ fontSize: 32, fontWeight: 800, color: ORANGE, marginTop: 10, textTransform: "uppercase", letterSpacing: "-0.5px" }}>
                    {sequence[currentIndex].word}
                  </p>

                  <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
                    {sequence.map((_, i) => (
                      <div key={i} style={{
                        width: i === currentIndex ? 16 : 6,
                        height: 6,
                        borderRadius: 99,
                        background: i === currentIndex ? ORANGE : "#E5E7EB",
                        transition: "all 0.3s",
                      }} />
                    ))}
                  </div>
                
                </div>
              ) : (
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 48, marginBottom: 12 }}>👐</div>
                  <p style={{ color: "#9CA3AF", fontWeight: 600, fontSize: 14 }}>ASL visualization will appear here</p>
                </div>
              )
            ) : (
              <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "flex-start" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                  <p style={{ fontSize: 11, fontWeight: 800, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.15em" }}>
                    Live Transcript
                  </p>
                  {recording && (
                    <span style={{
                      background: "#FEE2E2", color: "#DC2626",
                      fontSize: 11, fontWeight: 800, padding: "3px 10px",
                      borderRadius: 50, textTransform: "uppercase", letterSpacing: "0.1em",
                    }}>
                      Live
                    </span>
                  )}
                </div>
                <div style={{
                  flex: 1,
                  border: "1.5px solid #F3F4F6",
                  borderRadius: 18,
                  padding: 16,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}>
                  <p style={{
                    fontSize: transcript ? 28 : 15,
                    fontWeight: 800,
                    color: transcript ? ORANGE : "#D1D5DB",
                    fontStyle: transcript ? "italic" : "normal",
                    textAlign: "center",
                    lineHeight: 1.4,
                  }}>
                    {transcript || "Waiting for translation..."}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Translation;