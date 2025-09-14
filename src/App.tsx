import React, { useState, useEffect } from 'react';
import { Share2, HelpCircle, Clock } from 'lucide-react';
import { words, emojiHints } from './wordData';
import Keyboard from './components/Keyboard';
import GameBoard from './components/GameBoard';
import HelpModal from './components/HelpModal';
import StatsModal from './components/StatsModal';

// Seeded random number generator for consistent daily words
class SeededRandom {
  private seed: number;

  constructor(seed: number) {
    this.seed = seed;
  }

  next(): number {
    this.seed = (this.seed * 9301 + 49297) % 233280;
    return this.seed / 233280;
  }
}

function App() {
  const [dailyWords, setDailyWords] = useState<string[]>([]);
  const [currentPuzzleIndex, setCurrentPuzzleIndex] = useState(0);
  const [completedPuzzles, setCompletedPuzzles] = useState<boolean[]>([]);
  const [guesses, setGuesses] = useState<string[]>([]);
  const [currentGuess, setCurrentGuess] = useState('');
  const [gameStatus, setGameStatus] = useState<'playing' | 'won' | 'lost'>('playing');
  const [showHelp, setShowHelp] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showCompletion, setShowCompletion] = useState(false);
  const [stats, setStats] = useState({
    gamesPlayed: 0,
    gamesWon: 0,
    currentStreak: 0,
    maxStreak: 0,
    guessDistribution: [0, 0, 0, 0, 0]
  });
  const [message, setMessage] = useState('');
  const [shake, setShake] = useState(false);
  const [celebrate, setCelebrate] = useState(false);
  const [showResult, setShowResult] = useState(false);

  const getTodayDateString = (): string => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const getDateSeed = (dateString: string): number => {
    const date = new Date(dateString);
    return date.getFullYear() * 10000 + (date.getMonth() + 1) * 100 + date.getDate();
  };

  const generateDailyWords = (dateString: string): string[] => {
    const seed = getDateSeed(dateString);
    const rng = new SeededRandom(seed);
    
    const shuffledWords = [...words];
    for (let i = shuffledWords.length - 1; i > 0; i--) {
      const j = Math.floor(rng.next() * (i + 1));
      [shuffledWords[i], shuffledWords[j]] = [shuffledWords[j], shuffledWords[i]];
    }
    
    return shuffledWords.slice(0, 10);
  };

  const getTimeUntilNextChallenge = (): string => {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    const diff = tomorrow.getTime() - now.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}h ${minutes}m`;
  };

  useEffect(() => {
    initializeDaily();
    loadStats();
  }, []);

  const initializeDaily = () => {
    const today = getTodayDateString();
    const savedDate = localStorage.getItem('wordMujiDate');
    const savedProgress = localStorage.getItem('wordMujiProgress');
    const savedCompleted = localStorage.getItem('wordMujiCompleted');

    if (savedDate === today && savedProgress && savedCompleted) {
      // Continue today's progress
      const progress = JSON.parse(savedProgress);
      const completed = JSON.parse(savedCompleted);
      setCurrentPuzzleIndex(progress.currentIndex);
      setCompletedPuzzles(completed);
      setDailyWords(generateDailyWords(today));
      
      // Check if all puzzles are completed
      if (completed.every((c: boolean) => c)) {
        setShowCompletion(true);
      }
    } else {
      // New day - reset everything
      const newWords = generateDailyWords(today);
      setDailyWords(newWords);
      setCurrentPuzzleIndex(0);
      setCompletedPuzzles(new Array(10).fill(false));
      
      localStorage.setItem('wordMujiDate', today);
      localStorage.setItem('wordMujiProgress', JSON.stringify({ currentIndex: 0 }));
      localStorage.setItem('wordMujiCompleted', JSON.stringify(new Array(10).fill(false)));
    }
  };

  const loadStats = () => {
    const savedStats = localStorage.getItem('wordMujiStats');
    if (savedStats) {
      setStats(JSON.parse(savedStats));
    }
  };

  const saveStats = (newStats: typeof stats) => {
    localStorage.setItem('wordMujiStats', JSON.stringify(newStats));
    setStats(newStats);
  };

  const saveProgress = (index: number, completed: boolean[]) => {
    localStorage.setItem('wordMujiProgress', JSON.stringify({ currentIndex: index }));
    localStorage.setItem('wordMujiCompleted', JSON.stringify(completed));
  };

  const handleKeyPress = (key: string) => {
    if (gameStatus !== 'playing' || showCompletion) return;

    const currentWord = dailyWords[currentPuzzleIndex];
    if (!currentWord) return;

    if (key === 'ENTER') {
      submitGuess();
    } else if (key === 'BACKSPACE') {
      setCurrentGuess(prev => prev.slice(0, -1));
    } else if (/^[A-Z]$/.test(key) && currentGuess.length < currentWord.length) {
      setCurrentGuess(prev => prev + key);
    }
  };

  const submitGuess = () => {
    const currentWord = dailyWords[currentPuzzleIndex];
    if (!currentWord) return;

    if (currentGuess.length !== currentWord.length) {
      setMessage(`Word must be ${currentWord.length} letters`);
      setShake(true);
      setTimeout(() => setShake(false), 500);
      return;
    }

    const newGuesses = [...guesses, currentGuess];
    setGuesses(newGuesses);
    setCurrentGuess('');
    setMessage('');

    if (currentGuess.toLowerCase() === currentWord) {
      setGameStatus('won');
      setCelebrate(true);
      setShowResult(true);
      
      // Mark puzzle as completed
      const newCompleted = [...completedPuzzles];
      newCompleted[currentPuzzleIndex] = true;
      setCompletedPuzzles(newCompleted);
      
      // Update stats
      const guessNumber = newGuesses.length - 1;
      const newStats = {
        ...stats,
        gamesPlayed: stats.gamesPlayed + 1,
        gamesWon: stats.gamesWon + 1,
        currentStreak: stats.currentStreak + 1,
        maxStreak: Math.max(stats.maxStreak, stats.currentStreak + 1),
        guessDistribution: stats.guessDistribution.map((count, i) => 
          i === guessNumber ? count + 1 : count
        )
      };
      saveStats(newStats);
      
      // Check if all puzzles completed
      if (newCompleted.every(c => c)) {
        setTimeout(() => {
          setCelebrate(false);
          setShowCompletion(true);
        }, 2000);
      } else {
        // Move to next puzzle
        setTimeout(() => {
          setCelebrate(false);
          const nextIndex = currentPuzzleIndex + 1;
          setCurrentPuzzleIndex(nextIndex);
          setGuesses([]);
          setGameStatus('playing');
          setShowResult(false);
          setMessage(`Puzzle ${nextIndex + 1} of 10`);
          setTimeout(() => setMessage(''), 2000);
          saveProgress(nextIndex, newCompleted);
        }, 2000);
      }
      
      saveProgress(currentPuzzleIndex, newCompleted);
    } else if (newGuesses.length >= 5) {
      setGameStatus('lost');
      setShowResult(true);
      
      const newStats = {
        ...stats,
        gamesPlayed: stats.gamesPlayed + 1,
        currentStreak: 0
      };
      saveStats(newStats);
      
      // Move to next puzzle after showing result
      setTimeout(() => {
        if (currentPuzzleIndex < 9) {
          const nextIndex = currentPuzzleIndex + 1;
          setCurrentPuzzleIndex(nextIndex);
          setGuesses([]);
          setGameStatus('playing');
          setShowResult(false);
          setMessage(`Puzzle ${nextIndex + 1} of 10`);
          setTimeout(() => setMessage(''), 2000);
          saveProgress(nextIndex, completedPuzzles);
        } else {
          // All puzzles attempted
          setShowCompletion(true);
        }
      }, 3000);
    }
  };

  const generateShareText = () => {
    const completedCount = completedPuzzles.filter(c => c).length;
    const today = new Date().toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
    
    return `WordMuji ${today}\n${completedCount}/10 puzzles completed! 🎯\n\nPlay today's puzzles at wordmuji.com`;
  };

  const shareResults = () => {
    const shareText = generateShareText();
    const shareData = { 
      title: 'WordMuji Daily Results', 
      text: shareText 
    };

    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      navigator.share(shareData)
        .catch(() => {
          copyToClipboard(shareText);
        });
    } else {
      copyToClipboard(shareText);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
      .then(() => setMessage('Copied to clipboard!'))
      .catch(() => setMessage('Failed to copy'));
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        handleKeyPress('ENTER');
      } else if (e.key === 'Backspace') {
        handleKeyPress('BACKSPACE');
      } else if (/^[a-zA-Z]$/.test(e.key)) {
        handleKeyPress(e.key.toUpperCase());
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentGuess, gameStatus, showCompletion]);

  const currentWord = dailyWords[currentPuzzleIndex] || '';
  const currentEmojis = emojiHints[currentWord] || ['❓', '❓', '❓'];
  const completedCount = completedPuzzles.filter(c => c).length;
  const allCompleted = completedPuzzles.every(c => c);

  // Show completion screen
  if (showCompletion || allCompleted) {
    return (
      <div className="min-h-screen bg-[#FFF8E7] flex flex-col items-center justify-center relative">
        <div className="w-full max-w-md px-4 space-y-8 text-center">
          {/* Celebration */}
          <div className="space-y-4">
            <div className="text-6xl animate-bounce">🎉</div>
            <h1 className="text-3xl font-bold text-[#4169E1]">
              {allCompleted ? 'All Puzzles Complete!' : 'Daily Challenge Over!'}
            </h1>
            <p className="text-lg text-[#4169E1]/80">
              You completed {completedCount}/10 puzzles today!
            </p>
          </div>

          {/* Progress visualization */}
          <div className="bg-[#4169E1]/10 p-6 rounded-xl">
            <div className="flex justify-between items-center mb-4">
              <span className="text-sm font-medium text-[#4169E1]">Today's Progress</span>
              <span className="text-sm text-[#4169E1]/70">{completedCount}/10</span>
            </div>
            <div className="flex gap-1 mb-4">
              {Array.from({ length: 10 }).map((_, i) => (
                <div
                  key={i}
                  className={`h-3 flex-1 rounded-full ${
                    completedPuzzles[i] ? 'bg-green-500' : 'bg-[#4169E1]/20'
                  }`}
                />
              ))}
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-[#4169E1] mb-2">
                {Math.round((completedCount / 10) * 100)}%
              </div>
              <div className="text-sm text-[#4169E1]/70">Success Rate</div>
            </div>
          </div>

          {/* Next challenge countdown */}
          <div className="bg-gradient-to-r from-[#FFD700]/20 to-[#4169E1]/20 p-6 rounded-xl border border-[#FFD700]/30">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Clock className="text-[#4169E1]" size={20} />
              <span className="font-semibold text-[#4169E1]">Next Challenge</span>
            </div>
            <p className="text-2xl font-bold text-[#4169E1] mb-2">{getTimeUntilNextChallenge()}</p>
            <p className="text-sm text-[#4169E1]/70">Come back tomorrow for 10 new puzzles!</p>
          </div>

          {/* Action buttons */}
          <div className="flex gap-4 justify-center">
            <button 
              onClick={() => setShowStats(true)}
              className="flex items-center gap-2 bg-[#4169E1] hover:bg-[#4169E1]/80 text-white px-6 py-3 rounded-lg transition-colors font-semibold"
            >
              📊 View Stats
            </button>
            <button 
              onClick={shareResults}
              className="flex items-center gap-2 bg-[#FFD700] hover:bg-[#FFD700]/80 text-[#4169E1] px-6 py-3 rounded-lg transition-colors font-semibold"
            >
              <Share2 size={18} />
              Share
            </button>
          </div>
        </div>

        {showStats && (
          <StatsModal 
            stats={stats} 
            onClose={() => setShowStats(false)}
            onNewGame={() => setShowStats(false)}
          />
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFF8E7] flex flex-col items-center relative">
      {/* Celebration overlay */}
      {celebrate && (
        <div className="fixed inset-0 pointer-events-none z-30 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-[#FFD700]/10 via-transparent to-[#4169E1]/10 animate-pulse"></div>
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="absolute text-3xl opacity-80 animate-float"
              style={{
                left: `${20 + Math.random() * 60}%`,
                top: `${10 + Math.random() * 30}%`,
                animationDelay: `${Math.random() * 1}s`,
                animationDuration: `${2 + Math.random()}s`
              }}
            >
              {['🎉', '✨', '🌟', '💫'][Math.floor(Math.random() * 4)]}
            </div>
          ))}
        </div>
      )}

      <header className="w-full max-w-md py-4 px-4 flex justify-between items-center">
        <button 
          onClick={() => setShowHelp(true)}
          className="p-2 rounded-full hover:bg-[#4169E1]/20 transition-colors"
          aria-label="Help"
        >
          <HelpCircle className="text-[#4169E1]" size={24} />
        </button>
        <div className="flex flex-col items-center gap-1">
          <div className="text-3xl tracking-wider">
            <span className="text-red-500">🆆</span>
            <span className="text-blue-500">🅾</span>
            <span className="text-green-500">🆁</span>
            <span className="text-yellow-500">🅳</span>
          </div>
          <div className="text-3xl tracking-wider">
            <span className="text-purple-500">🅼</span>
            <span className="text-orange-500">🆄</span>
            <span className="text-pink-500">🅹</span>
            <span className="text-teal-500">🅸</span>
          </div>
        </div>
        <button 
          onClick={() => setShowStats(true)}
          className="p-2 rounded-full hover:bg-[#4169E1]/20 transition-colors"
          aria-label="Statistics"
        >
          <div className="text-xl font-bold">📊</div>
        </button>
      </header>

      <main className="w-full max-w-md flex-1 flex flex-col items-center justify-start gap-6 px-4 py-6">
        {/* Progress indicator */}
        <div className="w-full bg-[#4169E1]/10 rounded-xl p-4">
          <div className="flex justify-between items-center mb-3">
            <span className="text-sm font-medium text-[#4169E1]">
              Puzzle {currentPuzzleIndex + 1} of 10
            </span>
            <span className="text-sm text-[#4169E1]/70">
              {completedCount}/10 completed
            </span>
          </div>
          <div className="flex gap-1">
            {Array.from({ length: 10 }).map((_, i) => (
              <div
                key={i}
                className={`h-2 flex-1 rounded-full transition-all duration-500 ${
                  completedPuzzles[i]
                    ? 'bg-green-500'
                    : i === currentPuzzleIndex
                    ? 'bg-[#FFD700] animate-pulse'
                    : 'bg-[#4169E1]/20'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Emoji hints */}
        <div className="bg-[#4169E1]/10 backdrop-blur-sm p-4 rounded-xl flex justify-center gap-2">
          {currentEmojis.map((emoji, i) => (
            <div key={i} className="text-4xl">{emoji}</div>
          ))}
        </div>

        <GameBoard 
          guesses={guesses} 
          currentGuess={currentGuess} 
          secretWord={currentWord}
          shake={shake}
        />

        {/* Result message */}
        {showResult && (
          <div className="text-center transition-all duration-500 transform scale-100 opacity-100">
            {gameStatus === 'won' ? (
              <div className="space-y-2">
                <div className="text-5xl animate-bounce">🎉</div>
                <div className="text-xl font-bold text-[#4169E1]">Correct!</div>
                <div className="text-md text-[#4169E1]/80">
                  {currentPuzzleIndex === 9 
                    ? 'All puzzles complete!' 
                    : `Moving to puzzle ${currentPuzzleIndex + 2}...`
                  }
                </div>
              </div>
            ) : gameStatus === 'lost' ? (
              <div className="space-y-2">
                <div className="text-5xl">😔</div>
                <div className="text-xl font-bold text-[#4169E1]">Puzzle Failed</div>
                <div className="text-md text-[#4169E1]/80">The word was: {currentWord.toUpperCase()}</div>
                {currentPuzzleIndex < 9 && (
                  <div className="text-sm text-[#4169E1]/60">Moving to next puzzle...</div>
                )}
              </div>
            ) : null}
          </div>
        )}

        {message && !showResult && (
          <div className="bg-[#4169E1]/20 backdrop-blur-sm text-[#4169E1] px-4 py-2 rounded-lg">
            {message}
          </div>
        )}

        <Keyboard 
          onKeyPress={handleKeyPress} 
          guesses={guesses} 
          secretWord={currentWord}
        />
      </main>

      {showHelp && (
        <HelpModal onClose={() => setShowHelp(false)} />
      )}

      {showStats && (
        <StatsModal 
          stats={stats} 
          onClose={() => setShowStats(false)}
          onNewGame={() => setShowStats(false)}
        />
      )}
    </div>
  );
}

export default App;