import {
  DIRECTION_VECTORS,
  Direction,
  GRID_HEIGHT,
  GRID_WIDTH,
  OPPOSITE,
  POINTS_PER_APPLE,
  Point,
} from './constants';
import { createRng } from './rng';

export type GameStatus = 'idle' | 'playing' | 'over';

export interface GameState {
  snake: Point[]; // head ở index 0
  direction: Direction;
  // Hàng đợi hướng người chơi bấm (xử lý 1 hướng/tick để tránh tự đâm khi bấm nhanh)
  queued: Direction[];
  apple: Point;
  score: number;
  status: GameStatus;
  tick: number;
  rng: () => number;
}

function spawnApple(snake: Point[], rng: () => number): Point {
  const free: Point[] = [];
  const occupied = new Set(snake.map((p) => `${p.x},${p.y}`));
  for (let y = 0; y < GRID_HEIGHT; y++) {
    for (let x = 0; x < GRID_WIDTH; x++) {
      if (!occupied.has(`${x},${y}`)) free.push({ x, y });
    }
  }
  if (free.length === 0) return { x: -1, y: -1 }; // thắng (kín bàn)
  const idx = Math.floor(rng() * free.length);
  return free[idx];
}

export function createInitialState(seed: number): GameState {
  const rng = createRng(seed);
  const startX = Math.floor(GRID_WIDTH / 2);
  const startY = Math.floor(GRID_HEIGHT / 2);
  const snake: Point[] = [
    { x: startX, y: startY },
    { x: startX - 1, y: startY },
    { x: startX - 2, y: startY },
  ];
  return {
    snake,
    direction: 'right',
    queued: [],
    apple: spawnApple(snake, rng),
    score: 0,
    status: 'idle',
    tick: 0,
    rng,
  };
}

// Ghi nhận hướng người chơi muốn đi. Không cho quay đầu 180 độ.
export function enqueueDirection(state: GameState, dir: Direction): void {
  if (state.status === 'over') return;
  const last = state.queued.length
    ? state.queued[state.queued.length - 1]
    : state.direction;
  if (dir === last || dir === OPPOSITE[last]) return;
  state.queued.push(dir);
  if (state.status === 'idle') state.status = 'playing';
}

// Tiến 1 tick. Trả về chính state (mutate) để tiết kiệm bộ nhớ.
export function step(state: GameState): GameState {
  if (state.status !== 'playing') return state;

  if (state.queued.length) {
    state.direction = state.queued.shift()!;
  }

  const vec = DIRECTION_VECTORS[state.direction];
  const head = state.snake[0];
  const next: Point = { x: head.x + vec.x, y: head.y + vec.y };

  // Đâm tường
  if (next.x < 0 || next.x >= GRID_WIDTH || next.y < 0 || next.y >= GRID_HEIGHT) {
    state.status = 'over';
    return state;
  }

  const eating = next.x === state.apple.x && next.y === state.apple.y;

  // Đâm thân. Đuôi sẽ di chuyển nếu không ăn -> ô đuôi hợp lệ.
  const body = eating ? state.snake : state.snake.slice(0, -1);
  if (body.some((p) => p.x === next.x && p.y === next.y)) {
    state.status = 'over';
    return state;
  }

  state.snake.unshift(next);
  if (eating) {
    state.score += POINTS_PER_APPLE;
    state.apple = spawnApple(state.snake, state.rng);
    if (state.apple.x === -1) state.status = 'over'; // thắng
  } else {
    state.snake.pop();
  }

  state.tick += 1;
  return state;
}
