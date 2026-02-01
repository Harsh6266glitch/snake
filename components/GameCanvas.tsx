
import React, { useRef, useEffect, useCallback } from 'react';
import { GameState, SnakeSegment, Food } from '../types';
import { 
  COLORS, 
  TURN_SPEED, 
  GAME_SPEED_BASE, 
  SNAKE_SEGMENT_DISTANCE 
} from '../constants';

interface GameCanvasProps {
  gameState: GameState;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
  onGameOver: (score: number, length: number) => void;
  generateFood: () => Food;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({ 
  gameState, 
  setGameState, 
  onGameOver,
  generateFood
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mousePos = useRef({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
  const requestRef = useRef<number>();
  const stateRef = useRef<GameState>(gameState);

  // Sync ref with state
  useEffect(() => {
    stateRef.current = gameState;
  }, [gameState]);

  // Handle inputs
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mousePos.current = { x: e.clientX, y: e.clientY };
    };
    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches[0]) {
        mousePos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('touchmove', handleTouchMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
    };
  }, []);

  const update = useCallback(() => {
    if (stateRef.current.isGameOver) return;

    const { snake, food, speed, score, length } = stateRef.current;
    const newSnake = [...snake];
    const head = { ...newSnake[0] };

    // 1. Calculate target angle based on mouse
    const dx = mousePos.current.x - head.x;
    const dy = mousePos.current.y - head.y;
    const targetAngle = Math.atan2(dy, dx);

    // 2. Smooth turn logic
    let diff = targetAngle - head.angle;
    while (diff < -Math.PI) diff += Math.PI * 2;
    while (diff > Math.PI) diff -= Math.PI * 2;
    head.angle += diff * TURN_SPEED;

    // 3. Move head
    head.x += Math.cos(head.angle) * speed;
    head.y += Math.sin(head.angle) * speed;

    // 4. Boundary check
    if (head.x < 0 || head.x > window.innerWidth || head.y < 0 || head.y > window.innerHeight) {
      onGameOver(score, length);
      return;
    }

    // 5. Update segments (follow logic)
    newSnake[0] = head;
    for (let i = 1; i < newSnake.length; i++) {
      const prev = newSnake[i - 1];
      const curr = newSnake[i];
      const dx = prev.x - curr.x;
      const dy = prev.y - curr.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const angle = Math.atan2(dy, dx);
      
      if (dist > SNAKE_SEGMENT_DISTANCE) {
        curr.x = prev.x - Math.cos(angle) * SNAKE_SEGMENT_DISTANCE;
        curr.y = prev.y - Math.sin(angle) * SNAKE_SEGMENT_DISTANCE;
        curr.angle = angle;
      }
    }

    // 6. Food collision
    let newFood = [...food];
    let newScore = score;
    let newLength = length;
    let newSpeed = speed;

    const collisionFoodIdx = newFood.findIndex(f => {
      const dist = Math.sqrt((head.x - f.x) ** 2 + (head.y - f.y) ** 2);
      return dist < 25;
    });

    if (collisionFoodIdx > -1) {
      const eaten = newFood[collisionFoodIdx];
      newScore += eaten.value;
      newLength += 2;
      newSpeed = GAME_SPEED_BASE + (newLength / 100);
      newFood.splice(collisionFoodIdx, 1);
      newFood.push(generateFood());

      // Grow snake body
      const last = newSnake[newSnake.length - 1];
      for (let i = 0; i < 2; i++) {
        newSnake.push({ ...last });
      }
    }

    // 7. Self collision (head with body, skip first few segments)
    for (let i = 20; i < newSnake.length; i++) {
        const seg = newSnake[i];
        const dist = Math.sqrt((head.x - seg.x)**2 + (head.y - seg.y)**2);
        if (dist < 10) {
            onGameOver(newScore, newLength);
            return;
        }
    }

    setGameState(prev => ({
      ...prev,
      snake: newSnake,
      food: newFood,
      score: newScore,
      length: newLength,
      speed: newSpeed
    }));

    draw();
    requestRef.current = requestAnimationFrame(update);
  }, [onGameOver, generateFood, setGameState]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { snake, food } = stateRef.current;

    // Clear background
    ctx.fillStyle = COLORS.background;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Subtle Grid/Environment
    ctx.strokeStyle = '#ffffff08';
    ctx.lineWidth = 1;
    for(let i=0; i<canvas.width; i+=100) { ctx.beginPath(); ctx.moveTo(i,0); ctx.lineTo(i, canvas.height); ctx.stroke(); }
    for(let j=0; j<canvas.height; j+=100) { ctx.beginPath(); ctx.moveTo(0,j); ctx.lineTo(canvas.width, j); ctx.stroke(); }

    // Draw Food
    food.forEach(f => {
      ctx.save();
      ctx.translate(f.x, f.y);
      
      // Shadow/Glow
      const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, 15);
      gradient.addColorStop(0, f.color + '88');
      gradient.addColorStop(1, 'transparent');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(0, 0, 15, 0, Math.PI * 2);
      ctx.fill();

      // Food core
      ctx.fillStyle = f.color;
      ctx.beginPath();
      ctx.arc(0, 0, 8, 0, Math.PI * 2);
      ctx.fill();

      // Highlight
      ctx.fillStyle = 'rgba(255,255,255,0.4)';
      ctx.beginPath();
      ctx.arc(-2, -2, 2, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.restore();
    });

    // Draw Snake
    // Draw body segments back to front for layering
    for (let i = snake.length - 1; i >= 0; i--) {
      const seg = snake[i];
      const isHead = i === 0;
      const size = isHead ? 15 : Math.max(8, 14 - (i / snake.length) * 10);
      
      ctx.save();
      ctx.translate(seg.x, seg.y);
      ctx.rotate(seg.angle);

      // Organic gradient for scaly look
      const bodyGrad = ctx.createLinearGradient(0, -size, 0, size);
      bodyGrad.addColorStop(0, COLORS.snakeBody);
      bodyGrad.addColorStop(0.5, COLORS.snakeHead);
      bodyGrad.addColorStop(1, COLORS.snakeUnderbelly);

      ctx.fillStyle = bodyGrad;
      
      // Draw segment shadow
      ctx.shadowBlur = isHead ? 15 : 5;
      ctx.shadowColor = 'rgba(0,0,0,0.5)';
      ctx.shadowOffsetY = 4;

      // Realistic segment shape (slightly oval)
      ctx.beginPath();
      if (isHead) {
        ctx.ellipse(0, 0, size + 4, size, 0, 0, Math.PI * 2);
      } else {
        ctx.arc(0, 0, size, 0, Math.PI * 2);
      }
      ctx.fill();

      // Details for head
      if (isHead) {
        // Eyes
        ctx.fillStyle = 'white';
        ctx.beginPath(); ctx.arc(8, -5, 4, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(8, 5, 4, 0, Math.PI * 2); ctx.fill();
        
        ctx.fillStyle = 'black';
        ctx.beginPath(); ctx.arc(10, -5, 2, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(10, 5, 2, 0, Math.PI * 2); ctx.fill();

        // Tongue (flickers occasionally)
        if (Math.sin(Date.now() / 100) > 0.8) {
            ctx.strokeStyle = '#f43f5e';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(15, 0);
            ctx.lineTo(25, 0);
            ctx.lineTo(28, -3);
            ctx.moveTo(25, 0);
            ctx.lineTo(28, 3);
            ctx.stroke();
        }
      }

      ctx.restore();
    }
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    requestRef.current = requestAnimationFrame(update);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [update]);

  return (
    <canvas 
      ref={canvasRef} 
      className="block cursor-none"
    />
  );
};
