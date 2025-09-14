import React from 'react';
import { X, Share2, RefreshCw, Trophy, Target, Zap, TrendingUp, Calendar, Clock } from 'lucide-react';

interface StatsModalProps {
  stats: {
    gamesPlayed: number;
    gamesWon: number;
    currentStreak: number;
    maxStreak: number;
    guessDistribution: number[];
  };
  onClose: () => void;
  onNewGame: () => void;
}

const StatsModal: React.FC<StatsModalProps> = ({ stats, onClose, onNewGame }) => {
  const winPercentage = stats.gamesPlayed > 0 
    ? Math.round((stats.gamesWon / stats.gamesPlayed) * 100) 
    : 0;
  
  const maxDistribution = Math.max(...stats.guessDistribution, 1);
  const totalGuesses = stats.guessDistribution.reduce((sum, count) => sum + count, 0);
  
  // Calculate average guesses for won games
  const averageGuesses = totalGuesses > 0 
    ? (stats.guessDistribution.reduce((sum, count, index) => sum + (count * (index + 1)), 0) / totalGuesses).toFixed(1)
    : '0';

  // Calculate daily stats
  const totalDaysPlayed = Math.ceil(stats.gamesPlayed / 10);
  const perfectDays = Math.floor(stats.gamesWon / 10);
  const currentDayProgress = stats.gamesPlayed % 10;
  const todayWins = stats.gamesWon % 10;

  // Get time until next challenge
  const getTimeUntilNext = (): string => {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    const diff = tomorrow.getTime() - now.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}h ${minutes}m`;
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-[#FFF8E7] rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-[#4169E1]/20 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="text-2xl">📊</div>
            <h2 className="text-2xl font-bold text-[#4169E1]">Your WordMuji Stats</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-[#4169E1]/10 transition-colors"
          >
            <X size={24} className="text-[#4169E1]" />
          </button>
        </div>
        
        <div className="p-6 space-y-8">
          {/* Daily Overview */}
          <div className="bg-gradient-to-r from-[#FFD700]/10 to-[#4169E1]/10 p-4 rounded-xl border border-[#FFD700]/20">
            <h3 className="font-bold text-[#4169E1] mb-3 flex items-center gap-2">
              <Calendar size={20} />
              Daily Challenge Overview
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-[#4169E1]/70">Days Played:</span>
                <span className="font-bold text-[#4169E1] ml-2">{totalDaysPlayed}</span>
              </div>
              <div>
                <span className="text-[#4169E1]/70">Perfect Days:</span>
                <span className="font-bold text-green-600 ml-2">{perfectDays}</span>
              </div>
              <div>
                <span className="text-[#4169E1]/70">Today's Progress:</span>
                <span className="font-bold text-[#4169E1] ml-2">{todayWins}/10</span>
              </div>
              <div>
                <span className="text-[#4169E1]/70">Next Challenge:</span>
                <span className="font-bold text-[#FF8C00] ml-2">{getTimeUntilNext()}</span>
              </div>
            </div>
          </div>

          {/* Main Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gradient-to-br from-[#4169E1]/10 to-[#4169E1]/5 p-4 rounded-xl border border-[#4169E1]/20">
              <div className="flex items-center gap-2 mb-2">
                <Target className="text-[#4169E1]" size={20} />
                <span className="text-sm font-medium text-[#4169E1]/80">Total Puzzles</span>
              </div>
              <div className="text-3xl font-bold text-[#4169E1]">{stats.gamesPlayed}</div>
              <div className="text-xs text-[#4169E1]/60 mt-1">Puzzles attempted</div>
            </div>

            <div className="bg-gradient-to-br from-green-500/10 to-green-500/5 p-4 rounded-xl border border-green-500/20">
              <div className="flex items-center gap-2 mb-2">
                <Trophy className="text-green-600" size={20} />
                <span className="text-sm font-medium text-green-700">Success Rate</span>
              </div>
              <div className="text-3xl font-bold text-green-600">{winPercentage}%</div>
              <div className="text-xs text-green-600/60 mt-1">{stats.gamesWon} puzzles solved</div>
            </div>

            <div className="bg-gradient-to-br from-[#FFD700]/20 to-[#FFD700]/10 p-4 rounded-xl border border-[#FFD700]/30">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="text-[#FF8C00]" size={20} />
                <span className="text-sm font-medium text-[#FF8C00]">Current Streak</span>
              </div>
              <div className="text-3xl font-bold text-[#FF8C00]">{stats.currentStreak}</div>
              <div className="text-xs text-[#FF8C00]/70 mt-1">Consecutive wins</div>
            </div>

            <div className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 p-4 rounded-xl border border-purple-500/20">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="text-purple-600" size={20} />
                <span className="text-sm font-medium text-purple-700">Best Streak</span>
              </div>
              <div className="text-3xl font-bold text-purple-600">{stats.maxStreak}</div>
              <div className="text-xs text-purple-600/60 mt-1">Personal record</div>
            </div>
          </div>

          {/* Performance Insights */}
          {stats.gamesWon > 0 && (
            <div className="bg-gradient-to-r from-[#4169E1]/5 to-[#FFD700]/5 p-4 rounded-xl border border-[#4169E1]/10">
              <h3 className="font-bold text-[#4169E1] mb-2 flex items-center gap-2">
                <div className="text-lg">🎯</div>
                Performance Insights
              </h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-[#4169E1]/70">Average Guesses:</span>
                  <span className="font-bold text-[#4169E1] ml-2">{averageGuesses}</span>
                </div>
                <div>
                  <span className="text-[#4169E1]/70">Perfect Day Rate:</span>
                  <span className="font-bold text-green-600 ml-2">
                    {totalDaysPlayed > 0 ? Math.round((perfectDays / totalDaysPlayed) * 100) : 0}%
                  </span>
                </div>
                <div>
                  <span className="text-[#4169E1]/70">Daily Average:</span>
                  <span className="font-bold text-[#4169E1] ml-2">
                    {totalDaysPlayed > 0 ? (stats.gamesWon / totalDaysPlayed).toFixed(1) : '0'}/10
                  </span>
                </div>
                <div>
                  <span className="text-[#4169E1]/70">Efficiency:</span>
                  <span className="font-bold text-purple-600 ml-2">
                    {winPercentage >= 80 ? 'Excellent' : winPercentage >= 60 ? 'Good' : winPercentage >= 40 ? 'Fair' : 'Improving'}
                  </span>
                </div>
              </div>
            </div>
          )}
          
          {/* Guess Distribution */}
          <div>
            <h3 className="font-bold mb-4 text-[#4169E1] flex items-center gap-2">
              <div className="text-lg">📈</div>
              Guess Distribution
              <span className="text-sm font-normal text-[#4169E1]/60">(Guesses needed to solve)</span>
            </h3>
            
            {stats.gamesWon === 0 ? (
              <div className="text-center py-8 text-[#4169E1]/60">
                <div className="text-4xl mb-2">🎯</div>
                <p>Solve your first puzzle to see your guess distribution!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {stats.guessDistribution.map((count, index) => {
                  const percentage = totalGuesses > 0 ? (count / totalGuesses) * 100 : 0;
                  const isHighest = count === Math.max(...stats.guessDistribution) && count > 0;
                  
                  return (
                    <div key={index} className="flex items-center gap-3">
                      <div className="w-8 text-right font-medium text-[#4169E1]">{index + 1}</div>
                      <div className="flex-1 relative">
                        <div 
                          className={`h-8 flex items-center justify-between px-3 text-white text-sm font-medium rounded-lg transition-all duration-500 ${
                            count > 0 
                              ? isHighest 
                                ? 'bg-gradient-to-r from-[#FFD700] to-[#FF8C00] shadow-lg' 
                                : 'bg-gradient-to-r from-[#4169E1] to-[#4169E1]/80'
                              : 'bg-[#4169E1]/20 text-[#4169E1]/60'
                          }`}
                          style={{ 
                            width: count > 0 ? `${Math.max((count / maxDistribution) * 100, 15)}%` : '15%'
                          }}
                        >
                          <span>{count}</span>
                          {percentage > 0 && (
                            <span className="text-xs opacity-90">{percentage.toFixed(0)}%</span>
                          )}
                        </div>
                        {isHighest && count > 0 && (
                          <div className="absolute -top-1 -right-1 text-lg">👑</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Motivational Message */}
          {stats.gamesPlayed > 0 && (
            <div className="bg-gradient-to-r from-[#FFD700]/10 to-[#4169E1]/10 p-4 rounded-xl border border-[#FFD700]/20 text-center">
              {perfectDays >= 3 ? (
                <div>
                  <div className="text-2xl mb-2">🏆</div>
                  <p className="text-[#4169E1] font-semibold">{perfectDays} perfect days! You're a WordMuji master!</p>
                </div>
              ) : stats.currentStreak >= 10 ? (
                <div>
                  <div className="text-2xl mb-2">🔥</div>
                  <p className="text-[#4169E1] font-semibold">Amazing! {stats.currentStreak} puzzles in a row!</p>
                </div>
              ) : winPercentage >= 70 ? (
                <div>
                  <div className="text-2xl mb-2">⭐</div>
                  <p className="text-[#4169E1] font-semibold">Excellent performance! {winPercentage}% success rate!</p>
                </div>
              ) : totalDaysPlayed >= 3 ? (
                <div>
                  <div className="text-2xl mb-2">💪</div>
                  <p className="text-[#4169E1] font-semibold">Keep practicing! You're improving every day!</p>
                </div>
              ) : (
                <div>
                  <div className="text-2xl mb-2">🌟</div>
                  <p className="text-[#4169E1] font-semibold">Welcome to WordMuji! Come back daily for new challenges!</p>
                </div>
              )}
            </div>
          )}
          
          <div className="flex gap-4 justify-center pt-4">
            <button 
              onClick={onClose}
              className="flex items-center gap-2 bg-[#4169E1] hover:bg-[#4169E1]/80 text-white px-6 py-3 rounded-lg transition-colors font-semibold shadow-lg"
            >
              <Clock size={18} />
              Continue Playing
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatsModal;