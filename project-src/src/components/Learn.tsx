import React, { useState, useEffect, useRef } from 'react';
import { useAppContext } from '../context/AppContext';
import { vocabularyData, Word } from '../data/vocabulary';
import { Volume2, ArrowLeft, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { fetchTTSAudio, getAudioContext } from '../services/tts';
import { WaveformVisualizer } from './WaveformVisualizer';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const Learn: React.FC = () => {
  const { selectedCategory, wordStats, reviewWord, setCurrentView, theme } = useAppContext();
  const [words, setWords] = useState<Word[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);

  useEffect(() => {
    const now = Date.now();
    const categoryWords = vocabularyData.filter(w => w.category === selectedCategory);
    
    // 1. Words due for review
    const dueWords = categoryWords.filter(w => wordStats[w.id] && wordStats[w.id].nextReviewDate <= now);
    
    // 2. New words
    const newWords = categoryWords.filter(w => !wordStats[w.id]);

    // Combine them (reviews first, then new words)
    const queue = [...dueWords, ...newWords].slice(0, 20); // Limit session to 20 words

    if (queue.length === 0) {
      // If nothing is due, just show some random learned words for practice
      setWords(categoryWords.sort(() => 0.5 - Math.random()).slice(0, 10));
    } else {
      setWords(queue);
    }
    setCurrentIndex(0);
    setIsFlipped(false);
  }, [selectedCategory, wordStats]);

  const stopAudio = () => {
    if (sourceRef.current) {
      try { sourceRef.current.stop(); } catch (e) {}
      sourceRef.current = null;
    }
    setIsPlaying(false);
  };

  useEffect(() => {
    return () => stopAudio();
  }, []);

  const playDetailedAudio = async (word: string) => {
    if (isPlaying || isLoadingAudio) return;
    setIsLoadingAudio(true);
    try {
      const prompt = `Act as an encouraging English teacher. Say the word "${word}" clearly. Then break it down into syllables and pronounce each syllable slowly. Then say the word again with a warm, human-like tone.`;
      const audioBuffer = await fetchTTSAudio(prompt);
      
      const ctx = getAudioContext();
      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      
      const newAnalyser = ctx.createAnalyser();
      source.connect(newAnalyser);
      newAnalyser.connect(ctx.destination);
      
      setAnalyser(newAnalyser);
      sourceRef.current = source;
      
      source.onended = () => setIsPlaying(false);
      source.start();
      setIsPlaying(true);
    } catch (error) {
      console.error(error);
      // Fallback to standard TTS if Gemini fails
      const utterance = new SpeechSynthesisUtterance(word);
      window.speechSynthesis.speak(utterance);
    } finally {
      setIsLoadingAudio(false);
    }
  };

  const playExampleAudio = async (example: string) => {
    if (isPlaying || isLoadingAudio) return;
    setIsLoadingAudio(true);
    try {
      const prompt = `Read this example sentence naturally and expressively: "${example}"`;
      const audioBuffer = await fetchTTSAudio(prompt);
      
      const ctx = getAudioContext();
      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      
      const newAnalyser = ctx.createAnalyser();
      source.connect(newAnalyser);
      newAnalyser.connect(ctx.destination);
      
      setAnalyser(newAnalyser);
      sourceRef.current = source;
      
      source.onended = () => setIsPlaying(false);
      source.start();
      setIsPlaying(true);
    } catch (error) {
      console.error(error);
      const utterance = new SpeechSynthesisUtterance(example);
      window.speechSynthesis.speak(utterance);
    } finally {
      setIsLoadingAudio(false);
    }
  };

  const handleReview = (quality: number) => {
    stopAudio();
    if (words[currentIndex]) {
      reviewWord(words[currentIndex].id, quality);
    }
    if (currentIndex < words.length - 1) {
      setIsFlipped(false);
      setCurrentIndex(prev => prev + 1);
    } else {
      setCurrentView('dashboard');
    }
  };

  if (words.length === 0) {
    return <div className="text-center p-10 dark:text-white">Loading...</div>;
  }

  const currentWord = words[currentIndex];

  return (
    <div className="max-w-2xl mx-auto p-6 flex flex-col items-center justify-center min-h-[70vh]">
      <div className="w-full flex justify-between items-center mb-6 opacity-60">
        <span>{currentIndex + 1} / {words.length}</span>
        <span 
          className="px-3 py-1 rounded-full text-sm font-medium"
          style={{ backgroundColor: 'var(--accent)22', color: 'var(--accent)' }}
        >
          {selectedCategory}
        </span>
      </div>

      <div className="relative w-full h-96 perspective-1000">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentWord.id + (isFlipped ? '-flipped' : '')}
            initial={{ rotateY: isFlipped ? -90 : 90, opacity: 0 }}
            animate={{ rotateY: 0, opacity: 1 }}
            exit={{ rotateY: isFlipped ? 90 : -90, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 w-full h-full cursor-pointer"
            onClick={() => {
              if (!isPlaying && !isLoadingAudio) {
                setIsFlipped(!isFlipped);
              }
            }}
          >
            {/* Front of Card */}
            <div className={cn(
               "w-full h-full rounded-3xl shadow-lg border flex flex-col items-center justify-center p-8 text-center",
               theme === 'dark' ? "bg-slate-900 border-white/10" : "bg-white border-slate-100",
               isFlipped && "hidden"
            )}>
              <h2 className="text-5xl font-bold mb-4">{currentWord.word}</h2>
              <p className="text-xl font-mono mb-6 opacity-60">{currentWord.phonetic}</p>
              
              <div className="h-20 mb-4 flex items-center justify-center w-full">
                <WaveformVisualizer analyser={analyser} isPlaying={isPlaying && !isFlipped} />
              </div>

              <button 
                onClick={(e) => { e.stopPropagation(); playDetailedAudio(currentWord.word); }}
                disabled={isLoadingAudio || isPlaying}
                className="p-4 rounded-full transition-all disabled:opacity-50"
                style={{ 
                  backgroundColor: 'var(--accent)22',
                  color: 'var(--accent)'
                }}
                title="AI Detailed Pronunciation"
              >
                {isLoadingAudio ? <Loader2 className="w-8 h-8 animate-spin text-accent" /> : <Volume2 className="w-8 h-8 text-accent" />}
              </button>
              
              <p className="mt-6 text-sm opacity-40 uppercase tracking-widest">Tap to flip</p>
            </div>

            {/* Back of Card */}
            <div className={cn(
               "w-full h-full rounded-3xl shadow-lg border flex flex-col items-center justify-center p-8 text-center",
               theme === 'dark' ? "bg-slate-900 border-white/10" : "bg-white border-slate-100",
               !isFlipped && "hidden"
            )}>
              <h2 className="text-4xl font-bold mb-6">{currentWord.translation}</h2>
              
              <div className={cn(
                "w-full max-w-md p-6 rounded-2xl flex flex-col items-center",
                theme === 'dark' ? "bg-white/5" : "bg-slate-50"
              )}>
                <p className="text-lg italic mb-4 opacity-80">"{currentWord.example}"</p>
                
                <div className="h-12 mb-2 flex items-center justify-center w-full">
                  <WaveformVisualizer analyser={analyser} isPlaying={isPlaying && isFlipped} />
                </div>

                <button 
                  onClick={(e) => { e.stopPropagation(); playExampleAudio(currentWord.example); }}
                  disabled={isLoadingAudio || isPlaying}
                  className="flex items-center gap-2 mx-auto text-sm font-medium disabled:opacity-50 transition-colors"
                  style={{ color: 'var(--accent)' }}
                >
                  {isLoadingAudio ? <Loader2 className="w-4 h-4 animate-spin text-accent" /> : <Volume2 className="w-4 h-4 text-accent" />} 
                  Listen to example
                </button>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="flex items-center justify-between w-full mt-10">
        <button 
          onClick={() => {
            if (currentIndex > 0) {
              stopAudio();
              setIsFlipped(false);
              setCurrentIndex(prev => prev - 1);
            }
          }}
          disabled={currentIndex === 0}
          className="p-4 rounded-full disabled:opacity-50 transition-colors"
          style={{ backgroundColor: 'var(--accent)11' }}
        >
          <ArrowLeft className="w-6 h-6" style={{ color: 'var(--accent)' }} />
        </button>
        
        {isFlipped ? (
          <div className="flex gap-2">
            <button onClick={() => handleReview(1)} className="px-4 py-2 bg-red-500/10 text-red-500 rounded-xl font-medium hover:bg-red-500/20 transition-colors">Again</button>
            <button onClick={() => handleReview(3)} className="px-4 py-2 bg-orange-500/10 text-orange-500 rounded-xl font-medium hover:bg-orange-500/20 transition-colors">Hard</button>
            <button onClick={() => handleReview(4)} className="px-4 py-2 bg-[#0EA5E9]/10 text-[#0EA5E9] rounded-xl font-medium hover:bg-[#0EA5E9]/20 transition-colors">Good</button>
            <button onClick={() => handleReview(5)} className="px-4 py-2 bg-green-500/10 text-green-500 rounded-xl font-medium hover:bg-green-500/20 transition-colors">Easy</button>
          </div>
        ) : (
          <div className="text-sm opacity-40">Flip to rate</div>
        )}
      </div>
    </div>
  );
};
