import React, { useState, useEffect, useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import { vocabularyData, Word } from '../data/vocabulary';
import { Volume2, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';
import { fetchTTSAudio, getAudioContext } from '../services/tts';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { recordMistake } from '../utils/mistakeTracker';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type QuizType = 'word-to-meaning' | 'meaning-to-word' | 'audio-to-word';

interface Question {
  type: QuizType;
  word: Word;
  options: string[];
  correctAnswer: string;
}

export const Quiz: React.FC = () => {
  const { selectedCategory, setCurrentView, reviewWord, theme } = useAppContext();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  // Generate quiz questions
  useEffect(() => {
    const categoryWords = vocabularyData.filter(w => w.category === selectedCategory);
    if (categoryWords.length < 4) return; // Need at least 4 words for options

    // Shuffle and pick 10 words (or less if not enough)
    const shuffledWords = [...categoryWords].sort(() => 0.5 - Math.random()).slice(0, 10);
    
    const generatedQuestions: Question[] = shuffledWords.map(word => {
      const types: QuizType[] = ['word-to-meaning', 'meaning-to-word', 'audio-to-word'];
      const type = types[Math.floor(Math.random() * types.length)];
      
      let correctAnswer = '';
      let optionsPool: string[] = [];

      if (type === 'word-to-meaning') {
        correctAnswer = word.translation;
        optionsPool = categoryWords.map(w => w.translation).filter(t => t !== correctAnswer);
      } else {
        correctAnswer = word.word;
        optionsPool = categoryWords.map(w => w.word).filter(w => w !== correctAnswer);
      }

      // Pick 3 random wrong options
      const wrongOptions = [...optionsPool].sort(() => 0.5 - Math.random()).slice(0, 3);
      const options = [...wrongOptions, correctAnswer].sort(() => 0.5 - Math.random());

      return { type, word, options, correctAnswer };
    });

    setQuestions(generatedQuestions);
  }, [selectedCategory]);

  const playAudio = async (text: string) => {
    try {
      const prompt = `Say the word clearly and naturally: "${text}"`;
      const audioBuffer = await fetchTTSAudio(prompt);
      const ctx = getAudioContext();
      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(ctx.destination);
      source.start();
    } catch (error) {
      console.error(error);
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'en-US';
        window.speechSynthesis.speak(utterance);
      }
    }
  };

  // Auto-play audio for audio questions
  useEffect(() => {
    if (questions.length > 0 && !isFinished && questions[currentIndex].type === 'audio-to-word' && !selectedAnswer) {
      playAudio(questions[currentIndex].word.word);
    }
  }, [currentIndex, questions, isFinished, selectedAnswer]);

  const handleAnswer = (answer: string) => {
    if (selectedAnswer) return; // Prevent multiple clicks
    setSelectedAnswer(answer);
    
    const isCorrect = answer === questions[currentIndex].correctAnswer;
    if (isCorrect) {
      setScore(s => s + 1);
      reviewWord(questions[currentIndex].word.id, 4); // Good
    } else {
      reviewWord(questions[currentIndex].word.id, 2); // Hard/Incorrect
    }
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setSelectedAnswer(null);
      setCurrentIndex(prev => prev + 1);
    } else {
      setIsFinished(true);
    }
  };

  if (questions.length === 0) {
    return <div className="text-center p-10 dark:text-white">Not enough words in this category to generate a quiz.</div>;
  }

  if (isFinished) {
    return (
      <div className={cn(
        "max-w-md mx-auto p-8 rounded-3xl shadow-lg text-center mt-10 border",
        theme === 'dark' ? "bg-slate-900 border-white/10" : "bg-white border-slate-100"
      )}>
        <h2 className="text-3xl font-bold mb-4">Quiz Complete!</h2>
        <div className="text-6xl font-bold mb-6" style={{ color: 'var(--accent)' }}>
          {score} / {questions.length}
        </div>
        <p className="opacity-60 mb-8">
          {score === questions.length ? 'Perfect score! Outstanding!' : 'Good job! Keep practicing.'}
        </p>
        <button 
          onClick={() => setCurrentView('dashboard')}
          className="w-full py-4 text-white rounded-xl font-semibold transition-all shadow-lg hover:scale-[1.02] active:scale-95"
          style={{ backgroundColor: 'var(--accent)' }}
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  const currentQ = questions[currentIndex];

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <span className="text-sm font-medium opacity-60">
          Question {currentIndex + 1} of {questions.length}
        </span>
        <span className="text-sm font-medium" style={{ color: 'var(--accent)' }}>
          Score: {score}
        </span>
      </div>

      <div className={cn(
        "rounded-3xl p-8 shadow-sm border mb-8 min-h-[200px] flex flex-col items-center justify-center text-center",
        theme === 'dark' ? "bg-slate-900 border-white/10" : "bg-white border-slate-100"
      )}>
        {currentQ.type === 'word-to-meaning' && (
          <>
            <p className="text-sm opacity-60 uppercase tracking-wider mb-4">What does this mean?</p>
            <h2 className="text-4xl font-bold">{currentQ.word.word}</h2>
            <button onClick={() => playAudio(currentQ.word.word)} className="mt-4 transition-colors" style={{ color: 'var(--accent)' }}>
              <Volume2 className="w-6 h-6" />
            </button>
          </>
        )}
        
        {currentQ.type === 'meaning-to-word' && (
          <>
            <p className="text-sm opacity-60 uppercase tracking-wider mb-4">Which word means:</p>
            <h2 className="text-3xl font-bold">{currentQ.word.translation}</h2>
          </>
        )}

        {currentQ.type === 'audio-to-word' && (
          <>
            <p className="text-sm opacity-60 uppercase tracking-wider mb-4">Listen and choose</p>
            <button 
              onClick={() => playAudio(currentQ.word.word)} 
              className="p-6 rounded-full transition-all"
              style={{ backgroundColor: 'var(--accent)22', color: 'var(--accent)' }}
            >
              <Volume2 className="w-12 h-12" />
            </button>
          </>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {currentQ.options.map((option, idx) => {
          let btnStyle: React.CSSProperties = {
            padding: '1.5rem',
            borderRadius: '1.5rem',
            fontSize: '1.125rem',
            fontWeight: 500,
            transition: 'all 200ms',
            border: '2px solid transparent'
          };
          
          let className = "";

          if (!selectedAnswer) {
            className = cn(
              "border-2 hover:scale-[1.02] active:scale-95 shadow-sm",
              theme === 'dark' ? "bg-slate-900 border-white/10 hover:border-[var(--accent)]" : "bg-white border-slate-100 hover:border-[var(--accent)]"
            );
          } else if (option === currentQ.correctAnswer) {
            className = "bg-green-500/10 border-green-500 text-green-500";
          } else if (option === selectedAnswer) {
            className = "bg-red-500/10 border-red-500 text-red-500";
          } else {
            className = "opacity-20 grayscale cursor-not-allowed";
            if (theme === 'dark') className += " bg-slate-900 border-white/5";
            else className += " bg-white border-slate-100";
          }

          return (
            <button
              key={idx}
              onClick={() => handleAnswer(option)}
              disabled={!!selectedAnswer}
              className={className}
              style={btnStyle}
            >
              {option}
            </button>
          );
        })}
      </div>

      {selectedAnswer && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8 flex justify-end"
        >
          <button 
            onClick={handleNext}
            className="flex items-center gap-2 px-8 py-4 text-white rounded-full font-semibold transition-all shadow-lg hover:scale-[1.05]"
            style={{ backgroundColor: 'var(--accent)' }}
          >
            {currentIndex < questions.length - 1 ? 'Next Question' : 'Finish Quiz'} <ArrowRight className="w-5 h-5" />
          </button>
        </motion.div>
      )}
    </div>
  );
};
