
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GameCanvas } from './components/GameCanvas';
import { UIOverlay } from './components/UIOverlay';
import { GameState, Food, SnakeSegment, BiologicalFact } from './types';
import { 
  SNAKE_INITIAL_LENGTH, 
  COLORS, 
  MAX_FOOD_COUNT, 
  FOOD_SPAWN_INTERVAL,
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
    species: "Primitive Hatchling",
    evolutionHistory: []
  });

  const [lastFact, setLastFact] = useState<BiologicalFact | null>(null);
  const [deathNote, setDeathNote] = useState<string>("");
  const [isEvolutionLoading, setIsEvolutionLoading] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);

  // Initialize snake
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
      food: spawnInitialFood(),
      speed: 3,
      length: SNAKE_INITIAL_LENGTH,
      species: "Primitive Hatchling",
      evolutionHistory: []
    });
    setDeathNote("");
    setLastFact(null);
  }, []);

  const spawnInitialFood = (): Food[] => {
    const food: Food[] = [];
    for (let i = 0; i < 3; i++) {
      food.push(generateFood());
    }
    return food;
  };

  const generateFood = (): Food => {
    const types: ('fruit' | 'insect')[] = ['fruit', 'insect'];
    const type = types[Math.floor(Math.random() * types.length)];
    return {
      id: Math.random().toString(36).substr(2, 9),
      x: Math.random() * (window.innerWidth - 100) + 50,
      y: Math.random() * (window.innerHeight - 100) + 50,
      type: type,
      color: type === 'fruit' ? COLORS.foodFruit : COLORS.foodInsect,
      value: type === 'fruit' ? 5 : 12
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

  // Check milestones
  useEffect(() => {
    const milestone = SPECIES_MILESTONES.find(m => Math.abs(gameState.length - m.length) < 1);
    if (milestone && !gameState.evolutionHistory.includes(gameState.species) && gameState.length > SNAKE_INITIAL_LENGTH) {
      // Small debounce/logic to avoid double calls
      if (!isEvolutionLoading) {
          handleEvolution(gameState.length, gameState.score);
      }
    }
  }, [gameState.length]);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black selection:bg-emerald-500/30">
      {!hasStarted ? (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/90 backdrop-blur-sm p-6 text-center">
           <h1 className="text-6xl font-black mb-4 tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-green-600">
            BIOSNAKE
          </h1>
          <p className="max-w-md text-emerald-100/60 mb-8 font-medium">
            Experience an ultra-realistic biological simulation. Grow your organism, 
            evolve through AI-driven species generation, and survive the ecosystem.
          </p>
          <button 
            onClick={() => { setHasStarted(true); initGame(); }}
            className="px-10 py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-full transition-all hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(16,185,129,0.4)]"
          >
            INITIALIZE SIMULATION
          </button>
          <div className="mt-12 grid grid-cols-2 gap-8 text-left text-sm text-emerald-100/40 border-t border-emerald-900/50 pt-8">
            <div>
              <span className="block font-bold text-emerald-500 mb-1">CONTROLS</span>
              Use Mouse or Touch to steer.
            </div>
            <div>
              <span className="block font-bold text-emerald-500 mb-1">OBJECTIVE</span>
              Consume nutrients to trigger evolution.
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
