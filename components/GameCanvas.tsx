
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
  const frameCount = useRef(0);

  useEffect(() => {
    stateRef.current = gameState;
  }, [gameState]);

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
    frameCount.current++;

    const { snake, food, speed, score, length } = stateRef.current;
    const newSnake = [...snake];
    const head = { ...newSnake[0] };

    const dx = mousePos.current.x - head.x;
    const dy = mousePos.current.y - head.y;
    const targetAngle = Math.atan2(dy, dx);

    let diff = targetAngle - head.angle;
    while (diff < -Math.PI) diff += Math.PI * 2;
    while (diff > Math.PI) diff -= Math.PI * 2;
    head.angle += diff * TURN_SPEED;

    head.x += Math.cos(head.angle) * speed;
    head.y += Math.sin(head.angle) * speed;

    if (head.x < 0 || head.x > window.innerWidth || head.y < 0 || head.y > window.innerHeight) {
      onGameOver(score, length);
      return;
    }

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
      newSpeed = GAME_SPEED_BASE + (newLength / 120);
      newFood.splice(collisionFoodIdx, 1);
      newFood.push(generateFood());

      const last = newSnake[newSnake.length - 1];
      for (let i = 0; i < 2; i++) {
        newSnake.push({ ...last });
      }
    }

    for (let i = 30; i < newSnake.length; i++) {
        const seg = newSnake[i];
        const dist = Math.sqrt((head.x - seg.x)**2 + (head.y - seg.y)**2);
        if (dist < 12) {
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
    const time = frameCount.current;

    // Background Layer
    ctx.fillStyle = COLORS.background;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Organic Atmosphere: Dust/Cells
    ctx.globalAlpha = 0.15;
    for (let i = 0; i < 5; i++) {
        const x = (Math.sin(time * 0.001 + i) * 0.5 + 0.5) * canvas.width;
        const y = (Math.cos(time * 0.0015 + i) * 0.5 + 0.5) * canvas.height;
        ctx.fillStyle = COLORS.accent;
        ctx.beginPath();
        ctx.arc(x, y, 100 + i * 20, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.globalAlpha = 1.0;

    // Subtle Environment Grid
    ctx.strokeStyle = 'rgba(16, 185, 129, 0.05)';
    ctx.lineWidth = 1;
    const gridSpacing = 80;
    for(let i=0; i<canvas.width; i+=gridSpacing) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, canvas.height); ctx.stroke(); }
    for(let j=0; j<canvas.height; j+=gridSpacing) { ctx.beginPath(); ctx.moveTo(0, j); ctx.lineTo(canvas.width, j); ctx.stroke(); }

    // Draw Food with Bobbing
    food.forEach(f => {
      const bob = Math.sin(time * 0.05 + f.x) * 3;
      ctx.save();
      ctx.translate(f.x, f.y + bob);
      
      const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, 20);
      gradient.addColorStop(0, f.color + '66');
      gradient.addColorStop(1, 'transparent');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(0, 0, 20, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = f.color;
      ctx.beginPath();
      ctx.arc(0, 0, 7, 0, Math.PI * 2);
      ctx.fill();

      // Reflective spot
      ctx.fillStyle = 'white';
      ctx.globalAlpha = 0.6;
      ctx.beginPath();
      ctx.arc(-2, -2, 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    // Draw Snake with Scale Textures
    for (let i = snake.length - 1; i >= 0; i--) {
      const seg = snake[i];
      const isHead = i === 0;
      const progress = i / snake.length;
      const size = isHead ? 16 : Math.max(7, 15 * (1 - progress * 0.6));
      
      ctx.save();
      ctx.translate(seg.x, seg.y);
      ctx.rotate(seg.angle);

      // Procedural Scale Texture
      const bodyGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, size);
      bodyGrad.addColorStop(0, COLORS.snakeBody);
      bodyGrad.addColorStop(0.7, COLORS.snakeHead);
      bodyGrad.addColorStop(1, COLORS.snakeUnderbelly);

      ctx.fillStyle = bodyGrad;
      
      // Shadow
      ctx.shadowBlur = 10;
      ctx.shadowColor = 'rgba(0,0,0,0.6)';
      ctx.shadowOffsetY = 4;

      ctx.beginPath();
      if (isHead) {
        ctx.ellipse(2, 0, size + 4, size, 0, 0, Math.PI * 2);
      } else {
        ctx.arc(0, 0, size, 0, Math.PI * 2);
      }
      ctx.fill();

      // Add "Scales" visual noise
      if (!isHead && i % 2 === 0) {
          ctx.strokeStyle = 'rgba(255,255,255,0.08)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(0, 0, size * 0.8, -0.5, 0.5);
          ctx.stroke();
      }

      if (isHead) {
        // High-fidelity Eyes
        ctx.fillStyle = '#ffef00';
        ctx.beginPath(); ctx.arc(8, -6, 4.5, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(8, 6, 4.5, 0, Math.PI * 2); ctx.fill();
        
        // Pupils (vertical like a snake)
        ctx.fillStyle = 'black';
        ctx.beginPath(); ctx.ellipse(10, -6, 4, 1.5, 0, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(10, 6, 4, 1.5, 0, 0, Math.PI * 2); ctx.fill();

        // Flickering Tongue
        const distToFood = food.some(f => Math.sqrt((seg.x-f.x)**2 + (seg.y-f.y)**2) < 150);
        if (time % 60 < (distToFood ? 25 : 10)) {
            ctx.strokeStyle = '#e11d48';
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.moveTo(18, 0);
            const tongueLen = distToFood ? 18 : 10;
            ctx.lineTo(18 + tongueLen, 0);
            ctx.lineTo(18 + tongueLen + 4, -4);
            ctx.moveTo(18 + tongueLen, 0);
            ctx.lineTo(18 + tongueLen + 4, 4);
            ctx.stroke();
        }
      }

      ctx.restore();
    }
  }, []);

  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current) {
        canvasRef.current.width = window.innerWidth;
        canvasRef.current.height = window.innerHeight;
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    requestRef.current = requestAnimationFrame(update);
    return () => {
      window.removeEventListener('resize', handleResize);
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [update]);

  return (
    <canvas 
      ref={canvasRef} 
      className="block cursor-none touch-none"
    />
  );
};
