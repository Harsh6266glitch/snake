
export interface Point {
  x: number;
  y: number;
}

export interface SnakeSegment extends Point {
  angle: number;
}

export interface Food extends Point {
  id: string;
  type: 'fruit' | 'insect' | 'special';
  color: string;
  value: number;
}

export interface GameState {
  score: number;
  isGameOver: boolean;
  snake: SnakeSegment[];
  food: Food[];
  speed: number;
  length: number;
  species: string;
  evolutionHistory: string[];
}

export interface BiologicalFact {
  speciesName: string;
  fact: string;
  traits: string[];
}
