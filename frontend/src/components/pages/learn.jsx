import React, { useState, useEffect } from 'react';
import { generateQuiz } from './quizLogic';
import { WORD_DICT } from './aslData.jsx';

const MODES = ['ASL to Text', 'Text to ASL', 'All Modes'];

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

const DropdownMenu = ({ modes, onSelect }) => (
  <div className="flex flex-col gap-2 mt-4 w-[450px]">
    {modes.map((mode) => (
      <button
        key={mode}
        onClick={() => onSelect(mode)}
        className="w-full py-4 bg-white border-2 border-[#F5F5F5] rounded-2xl text-xl font-medium text-gray-600 hover:border-orange-400 hover:text-orange-500 transition-all shadow-sm active:scale-95"
      >
        {mode}
      </button>
    ))}
  </div>
);

const WordsDropdown = ({ onSelect }) => {
  const [selectedSub, setSelectedSub] = useState(null);
  return (
    <div className="flex flex-col items-center gap-3 mt-4 w-[450px]">
      <div className="grid grid-cols-2 gap-2 w-full">
        {WORD_DICT.map((sub) => (
          <button
            key={sub.category}
            onClick={() => setSelectedSub(selectedSub === sub.category ? null : sub.category)}
            className={`py-3 px-4 rounded-2xl text-base font-medium transition-all border-2 shadow-sm active:scale-95 ${
              selectedSub === sub.category
                ? 'bg-orange-500 text-white border-orange-500'
                : 'bg-white text-gray-600 border-[#F5F5F5] hover:border-orange-300 hover:text-orange-500'
            }`}
          >
            {sub.category}
          </button>
        ))}
      </div>
      {selectedSub && (
        <div className="flex flex-col gap-2 w-full mt-2">
          {MODES.map((mode) => (
            <button
              key={mode}
              onClick={() => onSelect(selectedSub, mode)}
              className="w-full py-4 bg-white border-2 border-[#F5F5F5] rounded-2xl text-xl font-medium text-gray-600 hover:border-orange-400 hover:text-orange-500 transition-all shadow-sm active:scale-95"
            >
              {mode}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const Learn = ({ onBack }) => {
  const [openCategory, setOpenCategory] = useState(null);
  const [phase, setPhase] = useState('menu');
  const [selection, setSelection] = useState({ category: '', drillType: '', subCategory: '' });
  const [quizData, setQuizData] = useState([]);
  const [tutorialIndex, setTutorialIndex] = useState(0);
  const [quizIndex, setQuizIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    let timer;
    if (phase === 'tutorial' && tutorialIndex < 4) {
      timer = setTimeout(() => setTutorialIndex((p) => p + 1), 2000);
    }
    return () => clearTimeout(timer);
  }, [phase, tutorialIndex]);

  const startFlow = (cat, sub, drill) => {
    const target = sub || cat;
    const data = generateQuiz(target);
    console.log(data)
    setQuizData(data);
    setSelection({ category: cat, subCategory: sub, drillType: drill });
    setTutorialIndex(0);
    setQuizIndex(0);
    setScore(0);
    setPhase('tutorial');
  };

  const handleAnswer = (choiceText, question) => {
    if (feedback) return;
    const correctVal = quizData[quizIndex].mainText;
    const isCorrect = choiceText === correctVal;

    console.log(question)
    
    setFeedback(isCorrect ? 'correct' : { type: 'wrong', correct: correctVal });
    if (isCorrect) setScore((s) => s + 1);

    setTimeout(() => {
      setFeedback(null);
      if (quizIndex + 1 < quizData.length) setQuizIndex((i) => i + 1);
      else setPhase('result');
    }, 1500);
  };

  const resetToMenu = () => {
    setPhase('menu');
    setOpenCategory(null);
    setQuizData([]);
    setTutorialIndex(0);
    setQuizIndex(0);
    setScore(0);
    setFeedback(null);
  };

  if (phase === 'tutorial') {
    const lesson = quizData[tutorialIndex];
    return (
      <div className="min-h-screen bg-white flex flex-col p-8">
        <header className="flex justify-between items-center mb-8">
          <button onClick={resetToMenu} className="text-3xl text-gray-300">✕</button>
          <div className="h-3 w-64 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-orange-500 transition-all duration-500"
              style={{ width: `${((tutorialIndex + 1) / 5) * 100}%` }}
            />
          </div>
          <span className="font-black text-gray-300 uppercase italic text-sm">Step {tutorialIndex + 1}/5</span>
        </header>
        <main className="flex-1 flex items-center justify-between w-full max-w-5xl mx-auto gap-12">
          <button
            disabled={tutorialIndex === 0}
            onClick={() => setTutorialIndex((i) => Math.max(0, i - 1))}
            className={`text-7xl font-black ${tutorialIndex === 0 ? 'text-gray-100' : 'text-orange-500'}`}
          >←</button>
          <div className="flex-1 flex flex-col items-center space-y-10">
            <h1 className="text-7xl font-black text-gray-800 italic uppercase tracking-tighter">{lesson?.mainText}</h1>
            <div className="w-full aspect-square max-w-[420px] rounded-[60px] border-[16px] border-orange-50 bg-pink-50 overflow-hidden shadow-inner flex items-center justify-center">
              <MediaRenderer src={lesson?.mainMedia} className="w-full h-full" />
            </div>
            {tutorialIndex === 4 && (
              <button
                onClick={() => setPhase('quiz')}
                className="bg-orange-500 text-white font-black py-5 px-16 rounded-[30px] shadow-xl uppercase tracking-widest text-xl"
              >START QUIZ</button>
            )}
          </div>
          <button
            disabled={tutorialIndex === 4}
            onClick={() => setTutorialIndex((i) => Math.min(4, i + 1))}
            className={`text-7xl font-black ${tutorialIndex === 4 ? 'text-gray-100' : 'text-orange-500'}`}
          >→</button>
        </main>
      </div>
    );
  }

  if (phase === 'quiz') {
    const q = quizData[quizIndex];
    const isAslToText = selection.drillType === 'ASL to Text';
    return (
      <div className="min-h-screen bg-white flex flex-col p-8 text-center">
        <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden mb-12">
          <div
            className="h-full bg-orange-500 transition-all duration-700"
            style={{ width: `${(quizIndex / 5) * 100}%` }}
          />
        </div>
        <div className="flex-1 flex flex-col items-center justify-center max-w-4xl mx-auto w-full">
          <h2 className="text-2xl font-black text-gray-400 mb-10 italic uppercase">
            {isAslToText ? 'What does this sign mean?' : `Choose the sign for "${q?.mainText}"`}
          </h2>
          {isAslToText ? (
            <div className="w-full aspect-square max-w-[340px] rounded-[40px] border-8 border-orange-500 overflow-hidden mb-12 shadow-sm mx-auto">
              <MediaRenderer src={q?.mainMedia} className="w-full h-full" />
            </div>
          ) : (
            <div className="mb-12">
              <h1 className="text-8xl font-black text-orange-500 italic uppercase">"{q?.mainText}"</h1>
            </div>
          )}
          <div className="grid grid-cols-2 gap-6 w-full max-w-3xl mx-auto">
            {q?.choices.map((c, i) => (
              <button
                key={i}
                onClick={() => handleAnswer(c.text,q)}
                className="aspect-[4/3] border-4 border-gray-100 rounded-[35px] flex items-center justify-center bg-white shadow-sm hover:border-orange-100 transition-all active:scale-95 overflow-hidden"
              >
                {isAslToText
                  ? <span className="text-3xl font-black text-gray-600 uppercase italic">{c.text}</span>
                  : <MediaRenderer src={c.media} className="w-full h-full" />}
              </button>
            ))}
          </div>
        </div>
        {feedback && (
          <div className={`fixed bottom-0 left-0 right-0 p-10 text-center font-black text-white text-3xl italic ${feedback === 'correct' ? 'bg-green-500' : 'bg-red-500'}`}>
            {feedback === 'correct' 
              ? '✓ EXCELLENT!' 
              : `✕ WRONG! Correct answer: ${feedback.correct}`}
          </div>
        )}
      </div>
    );
  }

  if (phase === 'result') {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-12 text-center">
        <div className="text-[150px] mb-12">🎯</div>
        <h2 className="text-6xl font-black italic mb-4 text-gray-800 uppercase">Awesome!</h2>
        <p className="text-3xl font-bold text-gray-400 mb-16 italic font-mono tracking-tighter">
          Score: <span className="text-orange-500">{score} / 5</span>
        </p>
        <div className="w-full max-w-md space-y-5">
          <button
            onClick={() => startFlow(selection.category, selection.subCategory, selection.drillType)}
            className="w-full bg-orange-500 text-white font-black py-7 rounded-[40px] shadow-xl uppercase tracking-widest text-2xl italic"
          >CONTINUE</button>
          <button
            onClick={() => { setScore(0); setTutorialIndex(0); setQuizIndex(0); setPhase('tutorial'); }}
            className="w-full border-4 border-orange-500 text-orange-500 font-black py-6 rounded-[40px] uppercase tracking-widest text-2xl italic"
          >RETRY LESSONS</button>
          <button
            onClick={resetToMenu}
            className="w-full bg-gray-100 text-gray-400 font-black py-7 rounded-[40px] text-2xl uppercase italic"
          >FINISH</button>
        </div>
      </div>
    );
  }

  return (
    <div className="font-fredoka min-h-screen bg-white px-6 py-8">
      <img
        src="/arrow-left.svg"
        alt="Back"
        onClick={onBack}
        className="w-10 h-10 mb-8 cursor-pointer hover:scale-110 transition-transform"
      />
      <h2 className="text-center text-[32px] font-medium text-black mb-12">
        Which do you want to <span className="text-orange-500">learn</span>?
      </h2>
      <div className="flex flex-col items-center gap-8 max-w-2xl mx-auto">
        <div className="w-full flex flex-col items-center">
          <img
            src="/alphabet-button.svg"
            alt="Alphabet"
            onClick={() => setOpenCategory(openCategory === 'alphabet' ? null : 'alphabet')}
            className="w-[500px] cursor-pointer hover:scale-105 transition-transform duration-300"
          />
          {openCategory === 'alphabet' && (
            <DropdownMenu modes={MODES} onSelect={(mode) => startFlow('Alphabet', '', mode)} />
          )}
        </div>
        <div className="w-full flex flex-col items-center">
          <img
            src="/numbers-button.svg"
            alt="Numbers"
            onClick={() => setOpenCategory(openCategory === 'numbers' ? null : 'numbers')}
            className="w-[500px] cursor-pointer hover:scale-105 transition-transform duration-300"
          />
          {openCategory === 'numbers' && (
            <DropdownMenu modes={MODES} onSelect={(mode) => startFlow('Digit', '', mode)} />
          )}
        </div>
        <div className="w-full flex flex-col items-center">
          <img
            src="/words-button.svg"
            alt="Words"
            onClick={() => setOpenCategory(openCategory === 'words' ? null : 'words')}
            className="w-[500px] cursor-pointer hover:scale-105 transition-transform duration-300"
          />
          {openCategory === 'words' && (
            <WordsDropdown onSelect={(sub, mode) => startFlow('Words', sub, mode)} />
          )}
        </div>
      </div>
    </div>
  );
};

export default Learn;