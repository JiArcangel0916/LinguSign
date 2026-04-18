import React, { useState, useRef, useEffect } from 'react';
import { ALPHABET_DICT, WORD_DICT } from './aslData';

const Translation = () => {
  const [mode, setMode] = useState('ASLtoText');
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
      timerRef.current = setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);
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
        } catch (err) {
          setTranscript("Server Error");
        }
        stream.getTracks().forEach(track => track.stop());
        setRecording(false);
      };

      recorder.start();
      setTimeout(() => {
        if (recorder.state === "recording") {
          recorder.stop();
          setRecording(false);
        }
      }, 10000);
    } catch (err) {
      setTranscript("Camera access denied");
    }
  };

  const handleTranslateText = () => {
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
        if (currentIndex < sequence.length - 1) setCurrentIndex(prev => prev + 1);
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
          className="max-h-[65%] w-full object-contain drop-shadow-2xl"
        />
      );
    }
    return (
      <img 
        src={path} 
        className="max-h-[65%] object-contain drop-shadow-2xl" 
        alt="sign" 
      />
    );
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex justify-center space-x-4 mb-10">
        {['TexttoASL', 'ASLtoText'].map((m) => (
          <button
            key={m}
            onClick={() => { setMode(m); setTranscript(""); setSequence([]); }}
            className={`px-8 py-3 rounded-2xl font-bold border-2 transition-all ${mode === m ? 'bg-orange-500 text-white border-orange-500 shadow-lg' : 'text-orange-500 border-orange-500 hover:bg-orange-50'}`}
          >
            {m === 'TexttoASL' ? 'Text to ASL' : 'ASL to Text'}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        <div className="bg-white p-6 rounded-[40px] shadow-xl border-4 border-gray-50 aspect-square flex flex-col relative overflow-hidden">
          {mode === 'ASLtoText' ? (
            <div className="relative h-full w-full bg-gray-100 rounded-[35px] overflow-hidden">
              <video ref={videoRef} autoPlay muted className="w-full h-full object-cover" />
              {recording && (
                <div className="absolute top-8 left-1/2 -translate-x-1/2 bg-red-600 text-white px-4 py-1 rounded-lg font-mono text-lg font-bold shadow-md animate-pulse">
                  {formatTime(seconds)}
                </div>
              )}
              <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex items-center justify-center">
                <div className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center">
                  <button 
                    onClick={toggleRecording}
                    className={`transition-all duration-300 shadow-xl ${
                      recording ? 'w-8 h-8 bg-red-600 rounded-sm' : 'w-14 h-14 bg-red-600 rounded-full hover:scale-110'
                    }`}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col h-full space-y-4">
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Type your message here..."
                className="flex-1 p-6 rounded-3xl border-2 border-orange-100 outline-none focus:border-orange-500 font-bold text-xl text-orange-600 resize-none"
              />
              <button 
                onClick={handleTranslateText}
                className="w-full bg-orange-500 text-white py-5 rounded-2xl font-black text-xl hover:bg-orange-600 transition shadow-lg"
              >
                {isPlaying ? "🔄 REPLAYING..." : "TRANSLATE TO ASL"}
              </button>
            </div>
          )}
        </div>

        <div className="bg-white p-6 rounded-[40px] shadow-xl border-4 border-gray-50 aspect-square flex flex-col justify-center items-center text-center">
          {mode === 'ASLtoText' ? (
            <div className="w-full h-full flex flex-col justify-center">
              <p className="text-gray-400 text-xs font-bold uppercase tracking-[0.2em] mb-4">AI Interpretation</p>
              <h2 className="text-orange-500 text-5xl font-black italic break-words px-4 leading-tight">
                {transcript || "Waiting..."}
              </h2>
            </div>
          ) : (
            <div className="w-full h-full relative flex flex-col items-center justify-center">
              {sequence.length > 0 ? (
                <>
                  {renderMedia(sequence[currentIndex])}
                  <h2 className="text-orange-500 text-5xl font-black mt-6 uppercase tracking-tighter">
                    {sequence[currentIndex].word}
                  </h2>
                  <div className="absolute top-0 right-0 bg-orange-100 text-orange-600 px-4 py-2 rounded-2xl text-sm font-black">
                    {currentIndex + 1} / {sequence.length}
                  </div>
                </>
              ) : (
                <div className="text-gray-300 italic font-medium">ASL Visualization will appear here</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Translation;