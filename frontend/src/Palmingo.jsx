import React, { useState, useEffect, useRef } from 'react';
import { generateQuiz } from './quizLogic';
import { ALPHABET_DICT, DIGIT_DICT, WORD_DICT } from './aslData';

const PalmingoApp = () => {
    const [view, setView] = useState('home');
    const [expandedCat, setExpandedCat] = useState(null);
    const [expandedDictCat, setExpandedDictCat] = useState(null);
    const [selectedDictItem, setSelectedDictItem] = useState(null);
    const [selection, setSelection] = useState({ category: '', drillType: '', subCategory: '' });
    const [tutorialIndex, setTutorialIndex] = useState(0);
    const [quizData, setQuizData] = useState([]);
    const [quizIndex, setQuizIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [feedback, setFeedback] = useState(null);

    // Translation State
    const [isRecording, setIsRecording] = useState(false);
    const [transcript, setTranscript] = useState("Waiting for signs...");
    const videoRef = useRef(null);
    const mediaRecorderRef = useRef(null);

    useEffect(() => {
        let timer;
        if (view === 'tutorial' && tutorialIndex < 4) {
            timer = setTimeout(() => {
                setTutorialIndex(prev => prev + 1);
            }, 2000);
        }
        return () => clearTimeout(timer);
    }, [view, tutorialIndex]);

    const navigateTo = (targetView) => {
        setExpandedCat(null);
        setExpandedDictCat(null);
        setSelection({ category: '', drillType: '', subCategory: '' });
        setView(targetView);
    };

    const startFlow = (cat, sub = '', drill = '') => {
        const target = sub || cat;
        const data = generateQuiz(target);
        setQuizData(data);
        setSelection({ category: cat, subCategory: sub, drillType: drill });
        setTutorialIndex(0);
        setQuizIndex(0);
        setScore(0);
        setView('tutorial');
    };

    const handleAnswer = (choiceText) => {
        if (feedback) return;
        const isCorrect = choiceText === quizData[quizIndex].mainText;
        setFeedback(isCorrect ? 'correct' : 'wrong');
        if (isCorrect) setScore(s => s + 1);
        setTimeout(() => {
            setFeedback(null);
            if (quizIndex + 1 < quizData.length) {
                setQuizIndex(i => i + 1);
            } else {
                setView('result');
            }
        }, 1000);
    };

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            if (videoRef.current) videoRef.current.srcObject = stream;
        } catch (err) {
            console.error("Camera error:", err);
        }
    };

    const handleTranslateRecord = () => {
        if (!isRecording) {
            setIsRecording(true);
            setTranscript("Recording word...");
            const stream = videoRef.current.srcObject;
            const recorder = new MediaRecorder(stream);
            const chunks = [];
            recorder.ondataavailable = (e) => chunks.push(e.data);
            recorder.onstop = async () => {
                const blob = new Blob(chunks, { type: 'video/webm' });
                const formData = new FormData();
                formData.append('video', blob);
                try {
                    const response = await fetch('http://127.0.0.1:8000/translate-video', {
                        method: 'POST',
                        body: formData
                    });
                    const data = await response.json();
                    setTranscript(data.prediction || "Sign not recognized");
                } catch (err) {
                    setTranscript("Error connecting to backend");
                }
                setIsRecording(false);
            };
            mediaRecorderRef.current = recorder;
            recorder.start();
            setTimeout(() => recorder.stop(), 3000);
        }
    };

    const MediaRenderer = ({ src, className }) => {
        if (!src) return <div className={className}>No Media</div>;
        const isVideo = src.toLowerCase().endsWith('.mp4');
        return isVideo ? (
            <video key={src} autoPlay loop muted playsInline className={`${className} object-cover`}>
                <source src={src} type="video/mp4" />
            </video>
        ) : (
            <img src={src} className={`${className} object-contain p-4`} alt="ASL Sign" />
        );
    };

    // ─── LEARN MENU ──────────────────────────────────────────────────────────────
    const renderLearnMenu = () => {
        const drillOptions = ['ASL to Text', 'Text to ASL', 'All Modes'];
        return (
            <div className="min-h-screen bg-white">
                <header className="bg-orange-500 p-6 flex items-center gap-4 text-white font-black">
                    <button onClick={() => setView('home')} className="text-2xl">←</button>
                    <h2 className="text-xl uppercase font-bold tracking-tight">WHICH DO YOU WANT TO LEARN?</h2>
                </header>
                <div className="p-8 max-w-4xl mx-auto space-y-6">
                    {['Alphabet', 'Digit'].map(cat => (
                        <div key={cat} className="w-full">
                            <button
                                onClick={() => setExpandedCat(expandedCat === cat ? null : cat)}
                                className={`w-full flex justify-between items-center p-8 rounded-[30px] border-4 transition-all ${expandedCat === cat ? 'border-orange-500 bg-orange-50 -translate-y-1 shadow-sm' : 'border-gray-50 bg-gray-50'}`}
                            >
                                <span className="text-2xl font-black text-gray-700 uppercase">{cat}</span>
                                <span className="text-4xl">{cat === 'Alphabet' ? 'abc' : '123'}</span>
                            </button>
                            {expandedCat === cat && (
                                <div className="grid grid-cols-1 gap-3 p-2 mt-4">
                                    {drillOptions.map(drill => (
                                        <button key={drill} onClick={() => startFlow(cat, '', drill)} className="w-full bg-white border-2 border-orange-200 py-4 rounded-2xl font-black text-orange-500 hover:bg-orange-500 hover:text-white uppercase text-sm">
                                            {drill}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}

                    <div className="w-full">
                        <button
                            onClick={() => setExpandedCat(expandedCat === 'Words' ? null : 'Words')}
                            className={`w-full flex justify-between items-center p-8 rounded-[30px] border-4 transition-all ${expandedCat === 'Words' ? 'border-orange-500 bg-orange-50 -translate-y-1 shadow-sm' : 'border-gray-50 bg-gray-50'}`}
                        >
                            <span className="text-2xl font-black text-gray-700 uppercase">Words</span>
                            <span className="text-4xl">💬</span>
                        </button>
                        {expandedCat === 'Words' && (
                            <div className="bg-gray-50 p-6 rounded-[30px] grid grid-cols-2 md:grid-cols-3 gap-3 mt-4">
                                {WORD_DICT.map(sub => (
                                    <button
                                        key={sub.category}
                                        onClick={() => setSelection({ ...selection, subCategory: sub.category })}
                                        className={`p-4 rounded-2xl font-black text-sm uppercase transition-all ${selection.subCategory === sub.category ? 'bg-orange-500 text-white shadow-md' : 'bg-white text-gray-400'}`}
                                    >
                                        {sub.category}
                                    </button>
                                ))}
                                {selection.subCategory && (
                                    <div className="col-span-full mt-6 p-6 bg-white rounded-3xl border-2 border-orange-100 text-center">
                                        <p className="text-xs font-black text-orange-400 mb-4 uppercase italic tracking-widest">Select Drill Mode for {selection.subCategory}</p>
                                        <div className="flex flex-col gap-2">
                                            {drillOptions.map(drill => (
                                                <button key={drill} onClick={() => startFlow('Words', selection.subCategory, drill)} className="bg-orange-50 py-4 rounded-2xl font-black text-orange-600 hover:bg-orange-600 hover:text-white text-xs uppercase tracking-tighter">
                                                    {drill}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    // ─── TUTORIAL ────────────────────────────────────────────────────────────────
    const renderTutorial = () => {
        const lesson = quizData[tutorialIndex];
        return (
            <div className="min-h-screen bg-white flex flex-col p-8">
                <header className="flex justify-between items-center mb-8">
                    <button onClick={() => setView('learn-menu')} className="text-3xl text-gray-300">✕</button>
                    <div className="h-3 w-64 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-orange-500 transition-all duration-500" style={{ width: `${((tutorialIndex + 1) / 5) * 100}%` }} />
                    </div>
                    <span className="font-black text-gray-300 uppercase italic text-sm">Step {tutorialIndex + 1}/5</span>
                </header>
                <main className="flex-1 flex items-center justify-between w-full max-w-5xl mx-auto gap-12">
                    <button disabled={tutorialIndex === 0} onClick={() => setTutorialIndex(i => Math.max(0, i - 1))} className={`text-7xl font-black ${tutorialIndex === 0 ? 'text-gray-100' : 'text-orange-500'}`}>←</button>
                    <div className="flex-1 flex flex-col items-center space-y-10">
                        <h1 className="text-7xl font-black text-gray-800 italic uppercase tracking-tighter">{lesson?.mainText}</h1>
                        <div className="w-full aspect-square max-w-[420px] rounded-[60px] border-[16px] border-orange-50 bg-pink-50 overflow-hidden shadow-inner flex items-center justify-center">
                            <MediaRenderer src={lesson?.mainMedia} className="w-full h-full" />
                        </div>
                        {tutorialIndex === 4 && (
                            <button onClick={() => setView('quiz')} className="bg-orange-500 text-white font-black py-5 px-16 rounded-[30px] shadow-xl uppercase tracking-widest text-xl">START QUIZ</button>
                        )}
                    </div>
                    <button disabled={tutorialIndex === 4} onClick={() => setTutorialIndex(i => Math.min(4, i + 1))} className={`text-7xl font-black ${tutorialIndex === 4 ? 'text-gray-100' : 'text-orange-500'}`}>→</button>
                </main>
            </div>
        );
    };

    // ─── QUIZ ────────────────────────────────────────────────────────────────────
    const renderQuiz = () => {
        const q = quizData[quizIndex];
        const isAslToText = selection.drillType === 'ASL to Text';
        return (
            <div className="min-h-screen bg-white flex flex-col p-8 text-center">
                <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden mb-12">
                    <div className="h-full bg-orange-500 transition-all duration-700" style={{ width: `${(quizIndex / 5) * 100}%` }} />
                </div>
                <div className="flex-1 flex flex-col items-center justify-center max-w-4xl mx-auto w-full">
                    <h2 className="text-2xl font-black text-gray-400 mb-10 italic uppercase">{isAslToText ? "What does this sign mean?" : `Choose the sign for "${q?.mainText}"`}</h2>
                    {isAslToText ? (
                        <div className="w-full aspect-square max-w-[340px] rounded-[40px] border-8 border-orange-500 overflow-hidden mb-12 shadow-sm mx-auto">
                            <MediaRenderer src={q?.mainMedia} className="w-full h-full" />
                        </div>
                    ) : (
                        <div className="mb-12"><h1 className="text-8xl font-black text-orange-500 italic uppercase">"{q?.mainText}"</h1></div>
                    )}
                    <div className="grid grid-cols-2 gap-6 w-full max-w-2xl mx-auto">
                        {q?.choices.map((c, i) => (
                            <button key={i} onClick={() => handleAnswer(c.text)} className="p-8 border-4 border-gray-100 rounded-[35px] flex items-center justify-center bg-white shadow-sm hover:border-orange-100 transition-all active:scale-95 overflow-hidden">
                                {isAslToText ? <span className="text-2xl font-black text-gray-600 uppercase italic">{c.text}</span> : <MediaRenderer src={c.media} className="h-28 w-full" />}
                            </button>
                        ))}
                    </div>
                </div>
                {feedback && (
                    <div className={`fixed bottom-0 left-0 right-0 p-12 text-center font-black text-white text-3xl italic ${feedback === 'correct' ? 'bg-green-500' : 'bg-red-500'}`}>
                        {feedback === 'correct' ? '✓ EXCELLENT!' : '✕ WRONG!'}
                    </div>
                )}
            </div>
        );
    };

    // ─── DICTIONARY ──────────────────────────────────────────────────────────────
    const renderDictionary = () => {
        // Build unified category list matching learn menu structure
        const dictCategories = [
            { key: 'Alphabet', label: 'Alphabet', icon: 'abc', items: ALPHABET_DICT },
            { key: 'Digit',    label: 'Digit',    icon: '123', items: DIGIT_DICT },
            ...WORD_DICT.map(sub => ({
                key: sub.category,
                label: sub.category,
                icon: '💬',
                items: sub.words,
            })),
        ];

        return (
            <div className="min-h-screen bg-white">
                <header className="bg-orange-500 p-6 flex items-center gap-4 text-white font-black">
                    <button onClick={() => navigateTo('home')} className="text-2xl">←</button>
                    <h2 className="text-xl uppercase font-bold tracking-tight">DICTIONARY</h2>
                </header>

                <div className="p-8 max-w-4xl mx-auto space-y-4">
                    {dictCategories.map(({ key, label, icon, items }) => {
                        const isOpen = expandedDictCat === key;
                        return (
                            <div key={key} className="w-full">
                                {/* Category row — same style as learn menu */}
                                <button
                                    onClick={() => setExpandedDictCat(isOpen ? null : key)}
                                    className={`w-full flex justify-between items-center p-8 rounded-[30px] border-4 transition-all ${isOpen ? 'border-orange-500 bg-orange-50 -translate-y-1 shadow-sm' : 'border-gray-50 bg-gray-50'}`}
                                >
                                    <span className="text-2xl font-black text-gray-700 uppercase">{label}</span>
                                    <span className="text-4xl font-black text-gray-400 select-none">{icon}</span>
                                </button>

                                {/* Expanded word grid */}
                                {isOpen && (
                                    <div className="mt-4 bg-gray-50 rounded-[30px] p-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                                        {items.map((item, idx) => (
                                            <button
                                                key={idx}
                                                onClick={() => setSelectedDictItem(item)}
                                                className="bg-white border-2 border-orange-100 rounded-[20px] p-4 flex flex-col items-center gap-2 hover:border-orange-400 hover:bg-orange-50 transition-all active:scale-95 shadow-sm"
                                            >
                                                <span className="text-2xl font-black text-gray-700 uppercase tracking-tight">{item.word}</span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Word detail popup */}
                {selectedDictItem && (
                    <div
                        className="fixed inset-0 bg-black/70 flex items-center justify-center p-6 z-50"
                        onClick={() => setSelectedDictItem(null)}
                    >
                        <div
                            className="bg-white w-full max-w-2xl rounded-[60px] p-12 flex flex-col items-center space-y-8 shadow-2xl"
                            onClick={e => e.stopPropagation()}
                        >
                            <h3 className="text-5xl font-black text-gray-800 italic underline decoration-orange-500 decoration-8 underline-offset-8 uppercase">
                                "{selectedDictItem.word}"
                            </h3>

                            {/* Media: image or video */}
                            <div className="w-full aspect-video rounded-[40px] overflow-hidden bg-orange-50 border-4 border-orange-100 shadow-inner flex items-center justify-center">
                                <MediaRenderer
                                    src={selectedDictItem.media}
                                    className="w-full h-full"
                                />
                            </div>

                            {/* Directions / tips */}
                            <div className="bg-orange-50 p-8 rounded-[35px] w-full text-center italic font-bold text-orange-900 text-lg border-2 border-orange-100">
                                "{selectedDictItem.directions}"
                            </div>

                            <button
                                onClick={() => setSelectedDictItem(null)}
                                className="w-full bg-orange-500 text-white font-black py-6 rounded-[35px] shadow-xl text-xl uppercase tracking-widest hover:bg-orange-600 transition-colors"
                            >
                                CLOSE
                            </button>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    // ─── APP SHELL ───────────────────────────────────────────────────────────────
    return (
        <div className="font-sans select-none overflow-x-hidden bg-white">

            {/* HOME */}
            {view === 'home' && (
                <div className="min-h-screen bg-white flex flex-col items-center justify-center p-10 space-y-8">
                    <div className="w-48 h-48 bg-orange-100 rounded-full flex items-center justify-center"><span className="text-8xl">👌</span></div>
                    <h1 className="text-7xl font-black text-gray-800 italic tracking-tighter text-center">PALMINGO</h1>
                    <div className="w-full max-w-md space-y-5">
                        <button onClick={() => navigateTo('learn-menu')} className="w-full bg-orange-500 text-white font-black py-7 rounded-[40px] shadow-lg text-2xl uppercase italic">LEARN</button>
                        <button onClick={() => navigateTo('dictionary')} className="w-full bg-orange-500 text-white font-black py-7 rounded-[40px] shadow-lg text-2xl uppercase italic">DICTIONARY</button>
                        <button onClick={() => { startCamera(); setView('translate'); }} className="w-full bg-orange-500 text-white font-black py-7 rounded-[40px] shadow-lg text-2xl uppercase italic">TRANSLATE</button>
                    </div>
                </div>
            )}

            {view === 'learn-menu'  && renderLearnMenu()}
            {view === 'tutorial'    && renderTutorial()}
            {view === 'quiz'        && renderQuiz()}
            {view === 'dictionary'  && renderDictionary()}

            {/* TRANSLATE */}
            {view === 'translate' && (
                <div className="min-h-screen bg-purple-500 p-8 flex flex-col text-white">
                    <header className="flex items-center gap-4 mb-8">
                        <button onClick={() => {
                            if (videoRef.current?.srcObject) {
                                videoRef.current.srcObject.getTracks().forEach(track => track.stop());
                            }
                            setView('home');
                        }} className="text-3xl">←</button>
                        <h2 className="text-3xl font-black italic uppercase">AI Translator</h2>
                    </header>
                    <div className="flex-1 bg-white rounded-[60px] shadow-inner p-10 flex flex-col gap-6 items-center">
                        <div className="w-full flex-1 bg-gray-100 rounded-[45px] border-8 border-purple-50 overflow-hidden relative">
                            <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover grayscale-[0.5]" />
                            <button
                                onClick={handleTranslateRecord}
                                disabled={isRecording}
                                className={`absolute bottom-8 left-1/2 -translate-x-1/2 px-10 py-5 rounded-full font-black text-xl shadow-2xl transition-all ${isRecording ? 'bg-red-200 text-red-500 animate-pulse' : 'bg-purple-600 text-white hover:scale-105'}`}
                            >
                                {isRecording ? "RECORDING..." : "RECOGNIZE SIGN"}
                            </button>
                        </div>
                        <div className="w-full h-48 bg-purple-50 rounded-[40px] p-8 border-4 border-purple-100 text-center flex flex-col justify-center">
                            <p className="text-xs font-black text-purple-300 uppercase tracking-widest mb-2 italic">Live Transcript</p>
                            <p className="text-3xl font-black text-purple-900 italic tracking-tight uppercase">{transcript}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* RESULT */}
            {view === 'result' && (
                <div className="min-h-screen bg-white flex flex-col items-center justify-center p-12 text-center">
                    <div className="text-[150px] mb-12">🎯</div>
                    <h2 className="text-6xl font-black italic mb-4 text-gray-800 uppercase">Awesome!</h2>
                    <p className="text-3xl font-bold text-gray-400 mb-16 italic font-mono tracking-tighter">Score: <span className="text-orange-500">{score} / 5</span></p>
                    <div className="w-full max-w-md space-y-5">
                        <button onClick={() => { setScore(0); setTutorialIndex(0); setQuizIndex(0); setView('tutorial'); }} className="w-full bg-orange-500 text-white font-black py-7 rounded-[40px] shadow-xl uppercase tracking-widest text-2xl italic">RETRY LESSONS</button>
                        <button onClick={() => setView('home')} className="w-full bg-gray-100 text-gray-400 font-black py-7 rounded-[40px] text-2xl uppercase italic text-center">FINISH</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PalmingoApp;