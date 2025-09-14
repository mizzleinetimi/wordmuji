import React from 'react';

interface GameBoardProps {
  guesses: string[];
  currentGuess: string;
  secretWord: string;
  shake: boolean;
}

const GameBoard: React.FC<GameBoardProps> = ({ guesses, currentGuess, secretWord, shake }) => {
  const wordLength = secretWord.length;
  const maxGuesses = 5;
  const rows = Array(maxGuesses).fill(null);
  
  return (
    <div className="grid gap-2">
      {rows.map((_, rowIndex) => {
        const isCurrentRow = rowIndex === guesses.length;
        const isCompletedRow = rowIndex < guesses.length;
        const rowWord = isCompletedRow ? guesses[rowIndex] : isCurrentRow ? currentGuess : '';
        const displayLetters = rowWord.padEnd(wordLength, ' ').split('');
        
        return (
          <div 
            key={rowIndex} 
            className={`flex gap-2 justify-center ${isCurrentRow && shake ? 'animate-shake' : ''}`}
          >
            {Array(wordLength).fill(null).map((_, colIndex) => {
              let cellState = '';
              if (isCompletedRow && rowWord) {
                const guessLetter = displayLetters[colIndex]?.toLowerCase() || '';
                const secretLetter = secretWord[colIndex];
                
                if (guessLetter === secretLetter) {
                  cellState = 'correct';
                } else if (secretWord.includes(guessLetter) && guessLetter !== ' ') {
                  cellState = 'present';
                } else if (guessLetter !== ' ') {
                  cellState = 'absent';
                }
              }
              
              let cellClass = 'w-14 h-14 flex items-center justify-center text-2xl font-bold rounded-lg border-2 transition-all duration-300';
              
              if (cellState === 'correct') {
                cellClass += ' bg-green-500 text-white border-green-600';
              } else if (cellState === 'present') {
                cellClass += ' bg-[#FFD700] text-[#4169E1] border-[#FFD700]/60';
              } else if (cellState === 'absent') {
                cellClass += ' bg-gray-600 text-white border-gray-700';
              } else if (displayLetters[colIndex] && displayLetters[colIndex] !== ' ') {
                cellClass += ' bg-[#4169E1]/20 text-[#4169E1] border-[#4169E1]/30';
              } else {
                cellClass += ' bg-[#4169E1]/10 border-[#4169E1]/20';
              }
              
              return (
                <div key={colIndex} className={cellClass}>
                  {displayLetters[colIndex] && displayLetters[colIndex] !== ' ' ? displayLetters[colIndex].toUpperCase() : ''}
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
};

export default GameBoard;