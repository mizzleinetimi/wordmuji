import React from 'react';
import { X } from 'lucide-react';

interface HelpModalProps {
  onClose: () => void;
}

const HelpModal: React.FC<HelpModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-[#FFF8E7] rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-4 border-b border-[#4169E1]/20 flex justify-between items-center">
          <h2 className="text-xl font-bold text-[#4169E1]">How to Play</h2>
          <button 
            onClick={onClose}
            className="p-1 rounded-full hover:bg-[#4169E1]/10"
          >
            <X size={24} className="text-[#4169E1]" />
          </button>
        </div>
        
        <div className="p-4 space-y-4 text-[#4169E1]">
          <p>
            Guess the WordMuji in 5 tries based on the emoji hints.
          </p>
          
          <div>
            <h3 className="font-bold mb-2">Emoji Hints</h3>
            <p>The emojis at the top provide clues about the secret word's meaning.</p>
            <div className="flex gap-2 my-2">
              <div className="text-2xl">🍎</div>
              <div className="text-2xl">🌳</div>
              <div className="text-2xl">🥧</div>
            </div>
            <p className="text-sm opacity-80">These emojis might hint at the word "APPLE"</p>
          </div>
          
          <div>
            <h3 className="font-bold mb-2">Letter Feedback</h3>
            <p>After each guess, the color of the tiles will change:</p>
            
            <div className="my-2">
              <div className="flex gap-1 mb-1">
                <div className="w-10 h-10 flex items-center justify-center bg-green-500 text-white font-bold rounded">A</div>
                <div className="w-10 h-10 flex items-center justify-center bg-gray-600 text-white font-bold rounded">P</div>
                <div className="w-10 h-10 flex items-center justify-center bg-gray-600 text-white font-bold rounded">P</div>
                <div className="w-10 h-10 flex items-center justify-center bg-[#FFD700] text-[#4169E1] font-bold rounded">L</div>
                <div className="w-10 h-10 flex items-center justify-center bg-gray-600 text-white font-bold rounded">E</div>
              </div>
              <p className="text-sm opacity-80">
                <span className="inline-block w-3 h-3 bg-green-500 rounded-sm mr-1"></span> 
                Green: Letter is correct and in the right position
              </p>
              <p className="text-sm opacity-80">
                <span className="inline-block w-3 h-3 bg-[#FFD700] rounded-sm mr-1"></span> 
                Yellow: Letter is in the word but in the wrong position
              </p>
              <p className="text-sm opacity-80">
                <span className="inline-block w-3 h-3 bg-gray-600 rounded-sm mr-1"></span> 
                Gray: Letter is not in the word
              </p>
            </div>
          </div>
          
          <div>
            <h3 className="font-bold">Examples</h3>
            <p>If the secret word is "BEACH" and you guess "BREAD":</p>
            <div className="flex gap-1 my-2">
              <div className="w-10 h-10 flex items-center justify-center bg-green-500 text-white font-bold rounded">B</div>
              <div className="w-10 h-10 flex items-center justify-center bg-gray-600 text-white font-bold rounded">R</div>
              <div className="w-10 h-10 flex items-center justify-center bg-[#FFD700] text-[#4169E1] font-bold rounded">E</div>
              <div className="w-10 h-10 flex items-center justify-center bg-[#FFD700] text-[#4169E1] font-bold rounded">A</div>
              <div className="w-10 h-10 flex items-center justify-center bg-gray-600 text-white font-bold rounded">D</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HelpModal;