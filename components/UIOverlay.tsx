
import React from 'react';
import { GameState, BiologicalFact } from '../types';

interface UIOverlayProps {
  gameState: GameState;
  lastFact: BiologicalFact | null;
  deathNote: string;
  isEvolutionLoading: boolean;
  onRestart: () => void;
}

export const UIOverlay: React.FC<UIOverlayProps> = ({ 
  gameState, 
  lastFact, 
  deathNote,
  isEvolutionLoading,
  onRestart 
}) => {
  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-8 font-mono">
      {/* Top Bar: Stats */}
      <div className="flex justify-between items-start">
        <div className="bg-black/60 backdrop-blur-md border border-emerald-500/30 p-4 rounded-xl shadow-2xl">
          <div className="text-xs text-emerald-500/70 mb-1 uppercase tracking-widest font-bold">Organism Identification</div>
          <div className="text-2xl font-black text-emerald-400 mb-2 truncate max-w-xs">
            {isEvolutionLoading ? "Mutating..." : gameState.species}
          </div>
          <div className="flex gap-6 text-sm">
            <div>
              <span className="text-emerald-500/50">SCORE:</span> 
              <span className="text-white font-bold ml-2">{gameState.score}</span>
            </div>
            <div>
              <span className="text-emerald-500/50">LENGTH:</span> 
              <span className="text-white font-bold ml-2">{gameState.length} cm</span>
            </div>
          </div>
        </div>

        {/* Dynamic Fact Bubble */}
        {lastFact && !gameState.isGameOver && (
          <div className="max-w-xs bg-emerald-950/40 backdrop-blur-md border-l-4 border-emerald-500 p-4 animate-in slide-in-from-right duration-500">
            <h4 className="text-xs font-bold text-emerald-400 mb-1 uppercase">Biological Insight</h4>
            <p className="text-xs text-emerald-100/80 leading-relaxed italic">
              "{lastFact.fact}"
            </p>
            <div className="mt-2 flex flex-wrap gap-1">
              {lastFact.traits.map((t, i) => (
                <span key={i} className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1 rounded uppercase">
                  {t}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Game Over Screen */}
      {gameState.isGameOver && (
        <div className="absolute inset-0 pointer-events-auto flex items-center justify-center bg-black/80 backdrop-blur-lg animate-in fade-in duration-700">
          <div className="max-w-lg w-full p-8 text-center bg-zinc-900/50 border border-white/10 rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.5)]">
            <h2 className="text-4xl font-black text-red-500 mb-4 uppercase tracking-tighter">Biological Failure</h2>
            
            <div className="mb-6 p-4 bg-black/40 rounded-xl">
                <p className="text-emerald-100/90 italic font-serif text-lg leading-relaxed">
                {deathNote || "Decomposition in progress..."}
                </p>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="p-4 bg-zinc-800/50 rounded-lg">
                <div className="text-xs text-zinc-500 mb-1">FINAL SCORE</div>
                <div className="text-2xl font-bold text-white">{gameState.score}</div>
              </div>
              <div className="p-4 bg-zinc-800/50 rounded-lg">
                <div className="text-xs text-zinc-500 mb-1">TOTAL EVOLUTIONS</div>
                <div className="text-2xl font-bold text-white">{gameState.evolutionHistory.length}</div>
              </div>
            </div>

            <button 
              onClick={onRestart}
              className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl transition-all shadow-lg hover:shadow-emerald-500/20 active:scale-95"
            >
              REGENERATE ORGANISM
            </button>
          </div>
        </div>
      )}

      {/* Footer Area */}
      {!gameState.isGameOver && (
          <div className="flex flex-col items-center">
             <div className="text-[10px] text-emerald-500/30 uppercase tracking-[0.4em]">
                Biosync active // Neural steering engaged
             </div>
          </div>
      )}
    </div>
  );
};
