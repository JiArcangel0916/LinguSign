import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../supabaseClient';
import { generateQuiz } from './quizLogic';
import { WORD_DICT } from './aslData.jsx';

const MODES = ['ASL to Text', 'Text to ASL', 'All Modes'];
const XP_TABLE = { 1: 1, 2: 3, 3: 5, 4: 10, 5: 15 };
const QUIZ_LENGTH = 5;

const resolveMode = (drillType) =>
  drillType === 'All Modes'
    ? Math.random() < 0.5 ? 'ASL to Text' : 'Text to ASL'
    : drillType;

const MediaRenderer = ({ src, className }) => {
  if (!src) return <div className={`${className} flex items-center justify-center text-gray-300 text-xs`}>No Media</div>;
  const isVideo = src.toLowerCase().endsWith('.mp4');
  return isVideo ? (
    <video key={src} autoPlay loop muted playsInline className={`${className} object-cover`}>
      <source src={src} type="video/mp4" />
    </video>
  ) : (
    <img src={src} className={`${className} object-contain p-2`} alt="ASL Sign" />
  );
};

const ProgressBar = ({ value, max, className = '' }) => (
  <div className={`h-2 bg-gray-100 rounded-full overflow-hidden ${className}`}>
    <div className="h-full bg-orange-500 transition-all duration-500" style={{ width: `${Math.min((value / max) * 100, 100)}%` }} />
  </div>
);

const WordsDropdown = ({ onSelect, masteryMap, progressMap }) => {
  const [selectedSub, setSelectedSub] = useState(null);
  return (
    <div className="flex flex-col gap-2 w-full">
      <div className="grid grid-cols-2 gap-1.5 w-full">
        {WORD_DICT.map((sub) => {
          const mastered = masteryMap?.[sub.category] ?? null;
          const entry = progressMap?.[sub.category];
          const isUnlocked = entry?.unlocked === true;
          const isLocked = !isUnlocked;
          const requiredXp = entry?.requiredXp ?? 0;
          const isSelected = selectedSub === sub.category;
          return (
            <button key={sub.category}
              onClick={() => {
                if (isLocked) return;
                setSelectedSub(isSelected ? null : sub.category);
              }}
              className={`py-1.5 px-2 rounded-xl text-xs font-semibold transition-all border-2 text-left ${
                isLocked
                  ? 'bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed'
                  : isSelected
                  ? 'bg-orange-500 text-white border-orange-500'
                  : 'bg-white text-gray-600 border-gray-100 hover:border-orange-300 hover:text-orange-500'
              }`}>
              <div className="flex items-center justify-between">
                <span>{sub.category}</span>
                {isLocked ? <span className="text-xs">🔒</span> : isSelected ? <span className="text-[10px]">✓</span> : null}
              </div>
              <div className={`text-[10px] mt-0.5 ${isLocked ? 'text-gray-300' : isSelected ? 'text-orange-100' : 'text-gray-400'}`}>
                {isLocked ? `${requiredXp} XP` : mastered ? `${mastered} mastered` : '—'}
              </div>
            </button>
          );
        })}
      </div>
      {selectedSub && (
        <div className="w-full bg-orange-50 border-2 border-orange-100 rounded-xl p-2 flex flex-col gap-1.5">
          <p className="text-[10px] font-bold text-orange-400 uppercase tracking-widest text-center">{selectedSub}</p>
          <div className="flex flex-col gap-1">
            {MODES.map((mode) => (
              <button key={mode}
                onClick={() => onSelect(selectedSub, mode)}
                className="w-full py-2 bg-white border-2 border-orange-200 rounded-lg text-xs font-bold text-gray-600 hover:bg-orange-500 hover:text-white hover:border-orange-500 transition-all active:scale-95">
                {mode === 'ASL to Text' ? '👁 ASL → Text' : mode === 'Text to ASL' ? '✍ Text → ASL' : '🔀 All Modes'}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const TutorialPhase = ({ quizData, onStartQuiz, onExit }) => {
  const [idx, setIdx] = useState(0);
  const lesson = quizData[idx];

  useEffect(() => {
    if (idx === QUIZ_LENGTH - 1) return;
    const timer = setTimeout(() => setIdx((i) => Math.min(QUIZ_LENGTH - 1, i + 1)), 2500);
    return () => clearTimeout(timer);
  }, [idx]);

  return (
    <div className="h-screen bg-white flex flex-col overflow-hidden">
      <header className="flex justify-between items-center px-5 pt-4 pb-2 shrink-0 gap-3">
        <button onClick={onExit} className="text-2xl text-gray-300 hover:text-gray-400 transition-colors shrink-0">✕</button>
        <ProgressBar value={idx + 1} max={QUIZ_LENGTH} className="flex-1" />
        <span className="font-black text-gray-300 uppercase italic text-xs shrink-0">{idx + 1}/{QUIZ_LENGTH}</span>
      </header>
      <div className="shrink-0 px-5 pt-1 pb-2 text-center">
        <h1 className="text-4xl font-black text-gray-800 italic uppercase tracking-tighter leading-none">
          {lesson?.mainText}
        </h1>
      </div>
      <div className="shrink-0 mx-5 rounded-[28px] border-[10px] border-orange-50 bg-pink-50 overflow-hidden shadow-inner"
        style={{ aspectRatio: '1 / 1', maxHeight: '40vw' }}>
        <MediaRenderer src={lesson?.mainMedia} className="w-full h-full" />
      </div>
      {lesson?.directions && (
        <p className="shrink-0 text-xs text-gray-400 text-center leading-relaxed px-8 mt-2">{lesson.directions}</p>
      )}
      <div className="flex-1 min-h-0" style={{ maxHeight: '2rem' }} />
      <div className="shrink-0 flex items-center justify-center gap-3 pb-3 px-5">
        <button disabled={idx === 0} onClick={() => setIdx((i) => Math.max(0, i - 1))}
          className={`text-2xl font-black transition-colors ${idx === 0 ? 'text-gray-100' : 'text-orange-500 hover:text-orange-400'}`}>←</button>
        <div className="flex gap-2 items-center">
          {quizData.map((_, i) => (
            <button key={i} onClick={() => setIdx(i)}
              className={`h-2 rounded-full transition-all ${i === idx ? 'bg-orange-500 w-5' : 'bg-gray-200 w-2'}`} />
          ))}
        </div>
        <button disabled={idx === QUIZ_LENGTH - 1} onClick={() => setIdx((i) => Math.min(QUIZ_LENGTH - 1, i + 1))}
          className={`text-2xl font-black transition-colors ${idx === QUIZ_LENGTH - 1 ? 'text-gray-100' : 'text-orange-500 hover:text-orange-400'}`}>→</button>
      </div>
      <div className="shrink-0 px-5 pb-8">
        {idx === QUIZ_LENGTH - 1 ? (
          <button onClick={onStartQuiz}
            className="w-full bg-orange-500 text-white font-black py-4 rounded-[24px] shadow-xl uppercase tracking-widest text-base hover:bg-orange-600 transition-colors active:scale-95">
            START QUIZ
          </button>
        ) : (
          <div className="w-full py-4 opacity-0 pointer-events-none">START QUIZ</div>
        )}
      </div>
    </div>
  );
};

const QuizPhase = ({ quizData, drillType, onAnswer, onExit, quizIndex, feedback }) => {
  const q = quizData[quizIndex];
  const questionModes = useRef(quizData.map(() => resolveMode(drillType)));
  const mode = questionModes.current[quizIndex];
  const isAslToText = mode === 'ASL to Text';
  const isCorrect = feedback === 'correct';
  const showImagePopup = feedback && !isCorrect && !isAslToText;

  return (
    <div className="h-screen bg-white flex flex-col overflow-hidden relative">
      <div className="flex items-center gap-3 px-4 pt-4 pb-2 shrink-0">
        <button onClick={onExit} className="text-xl text-gray-200 hover:text-gray-400 transition-colors shrink-0">✕</button>
        <ProgressBar value={quizIndex} max={QUIZ_LENGTH} className="flex-1" />
      </div>
      <div className="flex-1 flex flex-col items-center max-w-3xl mx-auto w-full px-4 pt-4 pb-2 gap-4 min-h-0 overflow-hidden">
        <h2 className="shrink-0 text-sm font-black text-gray-400 italic uppercase">
          {isAslToText ? 'What does this sign mean?' : `Choose the sign for "${q?.mainText}"`}
        </h2>
        {isAslToText ? (
          <div className="shrink-0 w-[220px] h-[220px] rounded-[30px] border-[6px] border-orange-500 overflow-hidden shadow-sm">
            <MediaRenderer src={q?.mainMedia} className="w-full h-full" />
          </div>
        ) : (
          <h1 className="shrink-0 text-5xl font-black text-orange-500 italic uppercase">"{q?.mainText}"</h1>
        )}
        <div className="grid grid-cols-2 gap-3 w-full">
          {q?.choices.map((c, i) => (
            <button key={i} onClick={() => !feedback && onAnswer(c.text, q)} disabled={!!feedback}
              className={`border-4 border-gray-100 rounded-[24px] flex items-center justify-center bg-white shadow-sm hover:border-orange-100 transition-all active:scale-95 overflow-hidden disabled:cursor-not-allowed ${
                isAslToText ? 'py-5' : 'aspect-[3/2]'
              } ${showImagePopup ? 'blur-sm opacity-40' : ''}`}>
              {isAslToText
                ? <span className="text-xl font-black text-gray-600 uppercase italic px-2 text-center">{c.text}</span>
                : <MediaRenderer src={c.media} className="w-full h-full" />}
            </button>
          ))}
        </div>
      </div>
      {showImagePopup && (
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <div className="bg-white rounded-[28px] shadow-2xl border-4 border-red-400 p-4 flex flex-col items-center gap-2">
            <p className="text-xs font-black text-red-400 uppercase tracking-widest">Correct Sign</p>
            <div className="w-44 h-44 rounded-2xl overflow-hidden bg-pink-50">
              <MediaRenderer src={feedback.correctMedia} className="w-full h-full" />
            </div>
            <p className="text-sm font-black text-gray-700 italic uppercase">{feedback.correct}</p>
          </div>
        </div>
      )}
      {feedback && (
        <div className={`fixed bottom-0 left-0 right-0 p-5 font-black text-white text-xl italic ${isCorrect ? 'bg-green-500' : 'bg-red-500'}`}>
          {isCorrect ? (
            <div className="flex items-center justify-center gap-3 max-w-3xl mx-auto">
              <span>✓ EXCELLENT!</span>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-4 max-w-3xl mx-auto w-full">
              <span className="shrink-0">✕ WRONG!</span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold opacity-80">Correct:</span>
                <span className="text-base italic">{feedback.correct}</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const ResultPhase = ({ score, xpGained, onContinue, onRetry, onFinish }) => (
  <div className="h-screen bg-white flex flex-col items-center justify-center p-8 text-center overflow-hidden">
    <div className="text-8xl mb-4">🎯</div>
    <h2 className="text-4xl font-black italic mb-1 text-gray-800 uppercase">Awesome!</h2>
    <p className="text-xl font-bold text-gray-400 mb-1 italic font-mono">
      Score: <span className="text-orange-500">{score} / {QUIZ_LENGTH}</span>
    </p>
    {xpGained > 0 && <p className="text-lg font-bold text-green-500 mb-6">+{xpGained} XP earned!</p>}
    <div className="w-full max-w-sm space-y-3 mt-2">
      <button onClick={onContinue} className="w-full bg-orange-500 text-white font-black py-4 rounded-[32px] shadow-xl uppercase tracking-widest text-lg italic hover:bg-orange-600 transition-colors active:scale-95">CONTINUE</button>
      <button onClick={onRetry} className="w-full border-4 border-orange-500 text-orange-500 font-black py-4 rounded-[32px] uppercase tracking-widest text-lg italic hover:bg-orange-50 transition-colors active:scale-95">RETRY</button>
      <button onClick={onFinish} className="w-full bg-gray-100 text-gray-400 font-black py-4 rounded-[32px] text-lg uppercase italic hover:bg-gray-200 transition-colors active:scale-95">FINISH</button>
    </div>
  </div>
);

const Learn = ({ onBack, session }) => {
  const [openCategory, setOpenCategory] = useState(null);
  const [phase, setPhase] = useState('menu');
  const [selection, setSelection] = useState({ category: '', drillType: '', subCategory: '' });
  const [quizData, setQuizData] = useState([]);
  const [quizIndex, setQuizIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [xpGained, setXpGained] = useState(0);
  const [masteryMap, setMasteryMap] = useState({});
  const [progressMap, setProgressMap] = useState({});
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState(null);

  const scoreRef = useRef(0);
  const quizIndexRef = useRef(0);
  const answeredWordsRef = useRef([]);
  const selectionRef = useRef(selection);

  useEffect(() => {
    if (!session?.user) return;
    const resolveUserId = async () => {
      const userName = session.user.user_metadata?.username;
      const { data } = await supabase.from('User').select('user_id').eq('user_name', userName).maybeSingle();
      if (data?.user_id) setUserId(data.user_id);
    };
    resolveUserId();
  }, [session]);

  useEffect(() => { selectionRef.current = selection; }, [selection]);

  useEffect(() => {
    if (!userId) return;
    const fetchData = async () => {
      const { data: existing } = await supabase.from('UserProgress').select('progress_id').eq('user_id', userId).limit(1);
      if (!existing?.length) {
        const { data: categories } = await supabase.from('Category').select('categ_id, required_xp');
        const { data: userData } = await supabase.from('User').select('total_xp').eq('user_id', userId).maybeSingle();
        const userXp = userData?.total_xp ?? 0;
        if (categories) {
          const rows = categories.map((cat) => ({
            user_id: userId,
            categ_id: cat.categ_id,
            is_unlocked: (cat.required_xp ?? 0) <= userXp,
          }));
          await supabase.from('UserProgress').upsert(rows, { onConflict: 'user_id,categ_id' });
        }
      }
      const { data: masteryData } = await supabase
        .from('Mastery')
        .select('is_mastered, Word(categ_id, Category(categ_name))')
        .eq('user_id', userId)
        .eq('is_mastered', true);
      if (masteryData) {
        const counts = {};
        for (const row of masteryData) {
          const name = row.Word?.Category?.categ_name;
          if (name) counts[name] = (counts[name] ?? 0) + 1;
        }
        setMasteryMap(counts);
      }
      const { data: progressData } = await supabase
        .from('UserProgress')
        .select('is_unlocked, Category(categ_name, required_xp)')
        .eq('user_id', userId);
      if (progressData) {
        const prog = {};
        for (const row of progressData) {
          const name = row.Category?.categ_name;
          if (name) prog[name] = { unlocked: row.is_unlocked, requiredXp: row.Category?.required_xp ?? 0 };
        }
        setProgressMap(prog);
      }
    };
    fetchData();
  }, [userId, phase]);

  const getCategoryId = async (categoryName) => {
    const { data } = await supabase.from('Category').select('categ_id').eq('categ_name', categoryName).single();
    return data?.categ_id ?? null;
  };

  const getWordId = async (wordText, categoryName) => {
    let query = supabase.from('Word').select('word_id').eq('word', wordText);
    if (categoryName) {
      const categId = await getCategoryId(categoryName);
      if (categId) query = query.eq('categ_id', categId);
    }
    const { data } = await query.maybeSingle();
    return data?.word_id ?? null;
  };

  const updateMastery = async (wordText, isCorrect) => {
    if (!userId) return;
    const categoryName = selectionRef.current.subCategory?.trim() || selectionRef.current.category?.trim();
    const wordId = await getWordId(wordText, categoryName);
    if (!wordId) return;
    const { data: existing } = await supabase
      .from('Mastery').select('mastery_id, correct_count, is_mastered')
      .eq('user_id', userId).eq('word_id', wordId).maybeSingle();
    if (existing) {
      if (!existing.is_mastered && isCorrect) {
        const newCount = existing.correct_count + 1;
        await supabase.from('Mastery').update({ correct_count: newCount, is_mastered: newCount >= 2 }).eq('mastery_id', existing.mastery_id);
      }
    } else {
      await supabase.from('Mastery').insert({ user_id: userId, word_id: wordId, correct_count: isCorrect ? 1 : 0, is_mastered: false });
    }
  };

  const saveQuizResult = async (finalScore, wordTexts) => {
    if (!userId) return 0;
    const xp = XP_TABLE[finalScore] ?? 0;
    const categoryName = selectionRef.current.subCategory?.trim() || selectionRef.current.category?.trim();
    const categId = await getCategoryId(categoryName);
    if (!categId) return xp;
    const wordIds = await Promise.all(wordTexts.map((w) => getWordId(w, categoryName)));
    const validWordIds = wordIds.filter(Boolean);
    await supabase.from('QuizAttempt').insert({
      user_id: userId, categ_id: categId, quiz_words: validWordIds,
      score: finalScore, xp_gained: xp, completed_at: new Date().toISOString(),
    });
    const { data: userData } = await supabase.from('User').select('total_xp').eq('user_id', userId).maybeSingle();
    if (userData) {
      const newXp = (userData.total_xp ?? 0) + xp;
      await supabase.from('User').update({ total_xp: newXp }).eq('user_id', userId);
      const { data: lockedProgress } = await supabase
        .from('UserProgress').select('progress_id, categ_id, Category(required_xp)')
        .eq('user_id', userId).eq('is_unlocked', false);
      if (lockedProgress?.length) {
        const toUnlock = lockedProgress.filter((p) => (p.Category?.required_xp ?? Infinity) <= newXp).map((p) => p.progress_id);
        if (toUnlock.length) await supabase.from('UserProgress').update({ is_unlocked: true }).in('progress_id', toUnlock);
      }
    }
    return xp;
  };

  const startFlow = async (category, subCategory, drillType) => {
    setLoading(true);
    const target = subCategory || category;
    const data = await generateQuiz(target);
    scoreRef.current = 0;
    quizIndexRef.current = 0;
    answeredWordsRef.current = [];
    setQuizData(data);
    setSelection({ category, subCategory, drillType });
    selectionRef.current = { category, subCategory, drillType };
    setQuizIndex(0);
    setScore(0);
    setFeedback(null);
    setXpGained(0);
    setLoading(false);
    setPhase('tutorial');
  };

  const handleAnswer = async (choiceText, question) => {
    if (feedback) return;
    const correctVal = question.mainText;
    const correctMedia = question.mainMedia;
    const isCorrect = choiceText === correctVal;
    if (isCorrect) scoreRef.current += 1;
    const currentScore = scoreRef.current;
    const currentIndex = quizIndexRef.current;
    const questionModeRef = resolveMode(selectionRef.current.drillType);
    const isAslToText = questionModeRef === 'ASL to Text';
    setFeedback(isCorrect ? 'correct' : { correct: correctVal, correctMedia, isAslToText });
    if (isCorrect) setScore(currentScore);
    updateMastery(correctVal, isCorrect).catch((e) => console.warn('mastery error:', e));
    answeredWordsRef.current = [...answeredWordsRef.current, correctVal];
    setTimeout(async () => {
      setFeedback(null);
      const nextIndex = currentIndex + 1;
      if (nextIndex < quizData.length) {
        quizIndexRef.current = nextIndex;
        setQuizIndex(nextIndex);
      } else {
        const earned = await saveQuizResult(currentScore, answeredWordsRef.current);
        setXpGained(earned);
        setPhase('result');
      }
    }, 3000);
  };

  const resetToMenu = () => {
    scoreRef.current = 0;
    quizIndexRef.current = 0;
    answeredWordsRef.current = [];
    setPhase('menu');
    setOpenCategory(null);
    setQuizData([]);
    setQuizIndex(0);
    setScore(0);
    setFeedback(null);
    setXpGained(0);
    setSelection({ category: '', drillType: '', subCategory: '' });
  };

  if (loading) {
    return (
      <div className="h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400 font-bold uppercase tracking-widest text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  if (phase === 'tutorial') return <TutorialPhase quizData={quizData} onStartQuiz={() => setPhase('quiz')} onExit={resetToMenu} />;
  if (phase === 'quiz') return (
    <QuizPhase quizData={quizData} drillType={selection.drillType} onAnswer={handleAnswer} onExit={resetToMenu} quizIndex={quizIndex} feedback={feedback} />
  );
  if (phase === 'result') return (
    <ResultPhase
      score={score} xpGained={xpGained}
      onContinue={() => startFlow(selection.category, selection.subCategory, selection.drillType)}
      onRetry={() => { scoreRef.current = 0; quizIndexRef.current = 0; answeredWordsRef.current = []; setScore(0); setQuizIndex(0); setFeedback(null); setXpGained(0); setPhase('tutorial'); }}
      onFinish={resetToMenu}
    />
  );

  const isOpen = openCategory !== null;

  return (
    <div className="font-fredoka min-h-screen bg-white px-6 py-6">
      <img src="/arrow-left.svg" alt="Back" onClick={onBack} className="w-9 h-9 mb-6 cursor-pointer hover:scale-110 transition-transform" />
      <h2 className="text-center text-2xl font-medium text-black mb-8">
        Which do you want to <span className="text-orange-500">learn</span>?
      </h2>
      <div className="flex flex-col md:flex-row items-start gap-8 mx-auto justify-center" style={{ maxWidth: '860px' }}>
        <div className="flex flex-col gap-3 shrink-0 w-full md:w-[400px]">
          <div className="relative">
            <img
              src="/alphabet-button.svg"
              alt="Alphabet"
              onClick={() => setOpenCategory(openCategory === 'alphabet' ? null : 'alphabet')}
              className={`w-full cursor-pointer transition-all duration-300 hover:scale-105 ${openCategory === 'alphabet' ? 'scale-105 drop-shadow-md' : ''}`}
            />
            {(masteryMap['Alphabet'] ?? 0) > 0 && (
              <span className="absolute top-1 right-1 text-[10px] font-bold text-orange-400 bg-orange-50 px-1.5 py-0.5 rounded-full border border-orange-200">
                {masteryMap['Alphabet']} mastered
              </span>
            )}
          </div>
          <div className="relative">
            <img
              src="/numbers-button.svg"
              alt="Numbers"
              onClick={() => setOpenCategory(openCategory === 'numbers' ? null : 'numbers')}
              className={`w-full cursor-pointer transition-all duration-300 hover:scale-105 ${openCategory === 'numbers' ? 'scale-105 drop-shadow-md' : ''}`}
            />
            {(masteryMap['Digit'] ?? 0) > 0 && (
              <span className="absolute top-1 right-1 text-[10px] font-bold text-orange-400 bg-orange-50 px-1.5 py-0.5 rounded-full border border-orange-200">
                {masteryMap['Digit']} mastered
              </span>
            )}
          </div>
          <div className="relative">
            <img
              src="/words-button.svg"
              alt="Words"
              onClick={() => setOpenCategory(openCategory === 'words' ? null : 'words')}
              className={`w-full cursor-pointer transition-all duration-300 hover:scale-105 ${openCategory === 'words' ? 'scale-105 drop-shadow-md' : ''}`}
            />
          </div>
        </div>
        {isOpen && (
          <div className="w-full md:flex-1 min-w-0 pt-1">
            {openCategory === 'alphabet' && (
              <div className="flex flex-col gap-2">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Choose Mode</p>
                {MODES.map((mode) => (
                  <button key={mode} onClick={() => startFlow('Alphabet', '', mode)}
                    className="w-full py-5 bg-white border-2 border-gray-100 rounded-2xl text-base font-semibold text-gray-600 hover:border-orange-400 hover:text-orange-500 transition-all active:scale-95">
                    {mode === 'ASL to Text' ? '👁 ASL → Text' : mode === 'Text to ASL' ? '✍ Text → ASL' : '🔀 All Modes'}
                  </button>
                ))}
              </div>
            )}
            {openCategory === 'numbers' && (
              <div className="flex flex-col gap-2">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Choose Mode</p>
                {MODES.map((mode) => (
                  <button key={mode} onClick={() => startFlow('Digit', '', mode)}
                    className="w-full py-3 bg-white border-2 border-gray-100 rounded-2xl text-sm font-semibold text-gray-600 hover:border-orange-400 hover:text-orange-500 transition-all active:scale-95">
                    {mode === 'ASL to Text' ? '👁 ASL → Text' : mode === 'Text to ASL' ? '✍ Text → ASL' : '🔀 All Modes'}
                  </button>
                ))}
              </div>
            )}
            {openCategory === 'words' && (
              <div className="flex flex-col gap-2">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Pick Category</p>
                <WordsDropdown
                  onSelect={(sub, mode) => startFlow('Words', sub, mode)}
                  masteryMap={masteryMap}
                  progressMap={progressMap}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Learn;