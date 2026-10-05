// Cấu hình game. Thay đổi ở đây thì nhớ bump GAME_VERSION để replay cũ không bị lệch.
export const GAME_VERSION = '1.0.0';

export const GRID_WIDTH = 17;
export const GRID_HEIGHT = 15;

// Số tick mỗi giây (tốc độ rắn). Dùng chung client + server để replay khớp.
export const TICKS_PER_SECOND = 7;
export const MS_PER_TICK = 1000 / TICKS_PER_SECOND;

export const POINTS_PER_APPLE = 1;

export type Direction = 'up' | 'down' | 'left' | 'right';

export interface Point {
  x: number;
  y: number;
}

export const DIRECTION_VECTORS: Record<Direction, Point> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

export const OPPOSITE: Record<Direction, Direction> = {
  up: 'down',
  down: 'up',
  left: 'right',
  right: 'left',
};
