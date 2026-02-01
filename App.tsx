
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GameCanvas } from './components/GameCanvas';
import { UIOverlay } from './components/UIOverlay';
import { GameState, Food, SnakeSegment, BiologicalFact } from './types';
import { 
  SNAKE_INITIAL_LENGTH, 
  COLORS, 
  SPECIES_MILESTONES 
} from './constants';
import { getEvolutionaryContext, getAIGameOverMessage } from './services/geminiService';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>({
    score: 0,
    isGameOver: false,
    snake: [],
    food: [],
    speed: 3,
    length: SNAKE_INITIAL_LENGTH,
    species: "Primary Cell",
    evolutionHistory: []
  });

  const [lastFact, setLastFact] = useState<BiologicalFact | null>(null);
  const [deathNote, setDeathNote] = useState<string>("");
  const [isEvolutionLoading, setIsEvolutionLoading] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);

  const initGame = useCallback(() => {
    const startX = window.innerWidth / 2;
    const startY = window.innerHeight / 2;
    const initialSnake: SnakeSegment[] = [];
    
    for (let i = 0; i < SNAKE_INITIAL_LENGTH; i++) {
      initialSnake.push({ x: startX - i * 8, y: startY, angle: 0 });
    }

    setGameState({
      score: 0,
      isGameOver: false,
      snake: initialSnake,
      food: [generateFood(), generateFood(), generateFood()],
      speed: 3,
      length: SNAKE_INITIAL_LENGTH,
      species: "Primary Cell",
      evolutionHistory: []
    });
    setDeathNote("");
    setLastFact(null);
  }, []);

  const generateFood = (): Food => {
    const types: ('fruit' | 'insect')[] = ['fruit', 'insect'];
    const type = types[Math.floor(Math.random() * types.length)];
    return {
      id: Math.random().toString(36).substring(2, 9),
      x: Math.random() * (window.innerWidth - 60) + 30,
      y: Math.random() * (window.innerHeight - 60) + 30,
      type: type,
      color: type === 'fruit' ? COLORS.foodFruit : COLORS.foodInsect,
      value: type === 'fruit' ? 10 : 25
    };
  };

  const handleGameOver = async (finalScore: number, finalLength: number) => {
    setGameState(prev => ({ ...prev, isGameOver: true }));
    const message = await getAIGameOverMessage(finalScore, finalLength);
    setDeathNote(message);
  };

  const handleEvolution = async (length: number, score: number) => {
    setIsEvolutionLoading(true);
    const fact = await getEvolutionaryContext(length, score);
    setLastFact(fact);
    setGameState(prev => ({
      ...prev,
      species: fact.speciesName,
      evolutionHistory: [...prev.evolutionHistory, fact.speciesName]
    }));
    setIsEvolutionLoading(false);
  };

  useEffect(() => {
    const milestone = SPECIES_MILESTONES.find(m => Math.abs(gameState.length - m.length) < 1.5);
    if (milestone && !gameState.evolutionHistory.includes(milestone.name) && gameState.length > SNAKE_INITIAL_LENGTH) {
      if (!isEvolutionLoading) {
          handleEvolution(gameState.length, gameState.score);
      }
    }
  }, [gameState.length, isEvolutionLoading]);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black selection:bg-emerald-500/30">
      {!hasStarted ? (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-[#050505] p-6 text-center">
           <div className="absolute inset-0 overflow-hidden opacity-20 pointer-events-none">
              <div className="w-full h-full bg-[radial-gradient(circle_at_center,_#10b98122_0%,_transparent_70%)]" />
           </div>

           <div className="relative z-10 flex flex-col items-center scale-90 sm:scale-100">
             <div className="text-[10px] tracking-[0.6em] text-emerald-500/50 mb-2 font-bold uppercase animate-pulse">
                System Online // Neural Core Active
             </div>
             <h1 className="text-7xl sm:text-8xl font-black mb-6 tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-emerald-300 via-emerald-500 to-green-700 drop-shadow-2xl">
              BIOSNAKE
            </h1>
            <p className="max-w-md text-emerald-100/40 mb-10 font-medium leading-relaxed">
              Initialize a high-fidelity biological proxy. Consume biomass to trigger morphological evolution guided by real-time genetic synthesis.
            </p>
            <button 
              onClick={() => { setHasStarted(true); initGame(); }}
              className="group relative px-12 py-5 overflow-hidden rounded-2xl bg-emerald-600 transition-all hover:bg-emerald-500 hover:scale-105 active:scale-95 shadow-[0_20px_40px_rgba(16,185,129,0.25)]"
            >
              <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
              <span className="relative text-white font-black tracking-widest uppercase">Start Simulation</span>
            </button>
          </div>

          <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex gap-12 text-left text-[10px] text-emerald-100/20 border-t border-emerald-900/40 pt-10 uppercase tracking-widest">
            <div>
              <span className="block font-bold text-emerald-500/40 mb-2">Navigation</span>
              Mouse / Touch Input
            </div>
            <div>
              <span className="block font-bold text-emerald-500/40 mb-2">Protocol</span>
              Evolutionary Synthesis
            </div>
          </div>
        </div>
      ) : (
        <>
          <GameCanvas 
            gameState={gameState} 
            setGameState={setGameState} 
            onGameOver={handleGameOver}
            generateFood={generateFood}
          />
          <UIOverlay 
            gameState={gameState} 
            lastFact={lastFact} 
            deathNote={deathNote}
            isEvolutionLoading={isEvolutionLoading}
            onRestart={() => { initGame(); }}
          />
        </>
      )}
    </div>
  );
};

export default App;
