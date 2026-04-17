import React, { useState, useRef } from 'react';

const ASL_EMOJI = {
  A:'🤛',B:'✋',C:'🤙',D:'☝️',E:'🤞',F:'👌',G:'👉',H:'🤞',
  I:'🤙',J:'🤙',K:'✌️',L:'🤙',M:'✊',N:'✊',O:'👌',P:'👇',
  Q:'👇',R:'✌️',S:'✊',T:'✊',U:'✌️',V:'✌️',W:'🖖',X:'☝️',
  Y:'🤙',Z:'☝️',' ':' '
};

const Translation = () => {
  const [mode, setMode] = useState('ASLToText');
  const [recording, setRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [textInput, setTextInput] = useState('');
  const [aslLetters, setAslLetters] = useState([]);
  const videoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);

  const toggleRecording = async () => {
    if (recording && mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      streamRef.current = stream;
      videoRef.current.srcObject = stream;
      setRecording(true);

      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      const chunks = [];

      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = async () => {
        setRecording(false);
        const blob = new Blob(chunks, { type: 'video/webm' });
        const formData = new FormData();
        formData.append('file', blob);
        setTranscript('Translating...');
        try {
          const res = await fetch('http://localhost:8000/translate-video', { method: 'POST', body: formData });
          if (!res.ok) throw new Error();
          const data = await res.json();
          setTranscript(data.text);
        } catch {
          setTranscript('Error connecting to server');
        }
        stream.getTracks().forEach(t => t.stop());
      };

      recorder.start();
      setTimeout(() => {
        if (recorder.state === 'recording') recorder.stop();
      }, 10000);
    } catch {
      setTranscript('Camera access denied');
    }
  };

  const translateText = () => {
    const letters = textInput.toUpperCase().trim().split('');
    setAslLetters(letters);
  };

  return (
    <div style={{ fontFamily: 'sans-serif', background: '#f9fafb', minHeight: '100vh' }}>
      <div style={{ background: '#f97316', padding: '14px 24px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ color: 'white', fontSize: 22, fontWeight: 500, fontStyle: 'italic' }}>Palmingo</span>
      </div>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 32 }}>
          <button
            onClick={() => setMode('TextToASL')}
            style={{
              padding: '10px 24px', borderRadius: 12, border: '1.5px solid #f97316',
              background: mode === 'TextToASL' ? '#f97316' : 'transparent',
              color: mode === 'TextToASL' ? 'white' : '#f97316',
              fontSize: 14, fontWeight: 500, cursor: 'pointer'
            }}
          >
            Text to ASL
          </button>
          <span style={{ color: '#f97316', fontSize: 20 }}>⇄</span>
          <button
            onClick={() => setMode('ASLToText')}
            style={{
              padding: '10px 24px', borderRadius: 12, border: '1.5px solid #f97316',
              background: mode === 'ASLToText' ? '#f97316' : 'transparent',
              color: mode === 'ASLToText' ? 'white' : '#f97316',
              fontSize: 14, fontWeight: 500, cursor: 'pointer'
            }}
          >
            ASL to Text
          </button>
        </div>

        {mode === 'ASLToText' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={{ position: 'relative', aspectRatio: '1', background: '#fce7f3', borderRadius: 16, overflow: 'hidden' }}>
              <video ref={videoRef} autoPlay muted playsInline style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              <button
                onClick={toggleRecording}
                style={{
                  position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)',
                  padding: '10px 22px', borderRadius: 999, border: 'none',
                  background: recording ? '#dc2626' : '#f97316',
                  color: 'white', fontSize: 13, fontWeight: 500, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap'
                }}
              >
                <span style={{
                  width: 8, height: 8, borderRadius: '50%', background: 'white',
                  animation: recording ? 'pulse 1s infinite' : 'none'
                }} />
                {recording ? 'Stop recording' : 'Start recording'}
              </button>
            </div>

            <div style={{ background: 'white', border: '0.5px solid #e5e7eb', borderRadius: 16, padding: 20, display: 'flex', flexDirection: 'column', minHeight: 280 }}>
              <p style={{ fontSize: 11, fontWeight: 500, color: '#9ca3af', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 12 }}>Translated Text</p>
              <div style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                textAlign: 'center', fontSize: transcript && transcript !== 'Translating...' ? 28 : 16,
                fontWeight: 500, color: transcript ? '#f97316' : '#9ca3af'
              }}>
                {transcript || 'Waiting for sign...'}
              </div>
            </div>
          </div>
        )}

        {mode === 'TextToASL' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={{ background: 'white', border: '0.5px solid #e5e7eb', borderRadius: 16, padding: 20, display: 'flex', flexDirection: 'column', gap: 12, minHeight: 280 }}>
              <p style={{ fontSize: 11, fontWeight: 500, color: '#9ca3af', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Type a word or letter</p>
              <textarea
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder="Write something here..."
                maxLength={30}
                style={{
                  flex: 1, border: '0.5px solid #d1d5db', borderRadius: 8, padding: 12,
                  fontSize: 15, fontFamily: 'sans-serif', resize: 'none', outline: 'none',
                  minHeight: 120, background: '#f9fafb'
                }}
              />
              <button
                onClick={translateText}
                style={{
                  padding: 10, borderRadius: 8, border: 'none',
                  background: '#f97316', color: 'white', fontSize: 14, fontWeight: 500, cursor: 'pointer'
                }}
              >
                Show ASL fingerspelling
              </button>
            </div>

            <div style={{ background: 'white', border: '0.5px solid #e5e7eb', borderRadius: 16, padding: 20, display: 'flex', flexDirection: 'column', minHeight: 280 }}>
              <p style={{ fontSize: 11, fontWeight: 500, color: '#9ca3af', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 12 }}>ASL fingerspelling</p>
              <div style={{ flex: 1, display: 'flex', flexWrap: 'wrap', gap: 8, alignContent: 'flex-start' }}>
                {aslLetters.length === 0 ? (
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', fontSize: 15 }}>
                    Output appears here
                  </div>
                ) : aslLetters.map((char, i) => (
                  char === ' ' ? (
                    <div key={i} style={{ width: 48, height: 56, borderRadius: 8, border: '1.5px dashed #d1d5db', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ fontSize: 9, color: '#9ca3af', fontWeight: 500 }}>SPACE</span>
                    </div>
                  ) : (
                    <div key={i} style={{ width: 48, height: 56, borderRadius: 8, background: '#fff7ed', border: '1.5px solid #fed7aa', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
                      <span style={{ fontSize: 20 }}>{ASL_EMOJI[char] || char}</span>
                      <span style={{ fontSize: 9, color: '#c2410c', fontWeight: 500 }}>{char}</span>
                    </div>
                  )
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }`}</style>
    </div>
  );
};

export default Translation;
