import React from 'react';
import { Delete } from 'lucide-react';

interface KeyboardProps {
  onKeyPress: (key: string) => void;
  guesses: string[];
  secretWord: string;
}

const Keyboard: React.FC<KeyboardProps> = ({ onKeyPress, guesses, secretWord }) => {
  const rows = [
    ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
    ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
    ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'BACKSPACE']
  ];

  const keyStates: Record<string, 'correct' | 'present' | 'absent' | 'unused'> = {};
  
  'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').forEach(key => {
    keyStates[key] = 'unused';
  });
  
  guesses.forEach(guess => {
    guess.split('').forEach((letter, index) => {
      const upperLetter = letter.toUpperCase();
      const secretLetter = secretWord[index]?.toUpperCase();
      
      if (upperLetter === secretLetter) {
        keyStates[upperLetter] = 'correct';
      } else if (secretWord.toUpperCase().includes(upperLetter) && keyStates[upperLetter] !== 'correct') {
        keyStates[upperLetter] = 'present';
      } else if (keyStates[upperLetter] !== 'correct' && keyStates[upperLetter] !== 'present') {
        keyStates[upperLetter] = 'absent';
      }
    });
  });

  return (
    <div className="w-full max-w-md">
      {rows.map((row, rowIndex) => (
        <div key={rowIndex} className="flex justify-center gap-1 mb-2">
          {row.map((key) => {
            let keyClass = 'rounded-lg font-bold flex items-center justify-center transition-colors';
            
            if (key === 'ENTER') {
              keyClass += ' text-xs px-2 py-4 flex-grow';
            } else if (key === 'BACKSPACE') {
              keyClass += ' px-2 py-4 flex-grow';
            } else {
              keyClass += ' w-8 h-12 sm:w-10';
            }
            
            if (key !== 'ENTER' && key !== 'BACKSPACE') {
              switch (keyStates[key]) {
                case 'correct':
                  keyClass += ' bg-green-500 text-white';
                  break;
                case 'present':
                  keyClass += ' bg-[#FFD700] text-[#4169E1]';
                  break;
                case 'absent':
                  keyClass += ' bg-gray-600 text-white';
                  break;
                default:
                  keyClass += ' bg-[#4169E1]/20 text-[#4169E1] hover:bg-[#4169E1]/30';
              }
            } else {
              keyClass += ' bg-[#4169E1]/20 text-[#4169E1] hover:bg-[#4169E1]/30';
            }
            
            return (
              <button
                key={key}
                onClick={() => onKeyPress(key)}
                className={keyClass}
              >
                {key === 'BACKSPACE' ? <Delete size={18} /> : key}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
};

export default Keyboard;