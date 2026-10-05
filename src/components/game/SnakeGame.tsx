'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Direction,
  GRID_HEIGHT,
  GRID_WIDTH,
  MS_PER_TICK,
} from '@/lib/game/constants';
import {
  GameState,
  GameStatus,
  createInitialState,
  enqueueDirection,
  step,
} from '@/lib/game/engine';
import { randomSeed } from '@/lib/game/rng';

const CELL = 28; // px mỗi ô
const BEST_KEY = 'gs_personal_best';

const KEY_MAP: Record<string, Direction> = {
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
  w: 'up',
  s: 'down',
  a: 'left',
  d: 'right',
  W: 'up',
  S: 'down',
  A: 'left',
  D: 'right',
};

interface Labels {
  score: string;
  best: string;
  start: string;
  restart: string;
  gameOver: string;
}

export default function SnakeGame({ labels }: { labels: Labels }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<GameState>(createInitialState(randomSeed()));
  const rafRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  const accRef = useRef<number>(0);

  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);
  const [status, setStatus] = useState<'idle' | 'playing' | 'over'>('idle');

  // Vẽ 1 frame
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const s = stateRef.current;

    // Nền caro
    for (let y = 0; y < GRID_HEIGHT; y++) {
      for (let x = 0; x < GRID_WIDTH; x++) {
        ctx.fillStyle = (x + y) % 2 === 0 ? '#aad751' : '#a2d149';
        ctx.fillRect(x * CELL, y * CELL, CELL, CELL);
      }
    }

    // Táo
    if (s.apple.x >= 0) {
      ctx.fillStyle = '#e7471d';
      ctx.beginPath();
      ctx.arc(
        s.apple.x * CELL + CELL / 2,
        s.apple.y * CELL + CELL / 2,
        CELL / 2 - 3,
        0,
        Math.PI * 2
      );
      ctx.fill();
    }

    // Rắn
    s.snake.forEach((p, i) => {
      ctx.fillStyle = i === 0 ? '#3a5fc8' : '#4673e8';
      const pad = 1;
      roundRect(
        ctx,
        p.x * CELL + pad,
        p.y * CELL + pad,
        CELL - pad * 2,
        CELL - pad * 2,
        6
      );
      ctx.fill();
    });
  }, []);

  const loop = useCallback(
    (time: number) => {
      const s = stateRef.current;
      if (lastTimeRef.current === 0) lastTimeRef.current = time;
      const delta = time - lastTimeRef.current;
      lastTimeRef.current = time;

      if (s.status === 'playing') {
        accRef.current += delta;
        while (accRef.current >= MS_PER_TICK) {
          step(s);
          accRef.current -= MS_PER_TICK;
          if ((s.status as GameStatus) === 'over') break;
        }
        if (s.score !== score) setScore(s.score);
        if ((s.status as GameStatus) === 'over') {
          setStatus('over');
          setBest((prev) => {
            const nb = Math.max(prev, s.score);
            try {
              localStorage.setItem(BEST_KEY, String(nb));
            } catch {}
            return nb;
          });
        }
      }

      draw();
      rafRef.current = requestAnimationFrame(loop);
    },
    [draw, score]
  );

  useEffect(() => {
    try {
      const stored = Number(localStorage.getItem(BEST_KEY) ?? '0');
      if (!Number.isNaN(stored)) setBest(stored);
    } catch {}
    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const restart = useCallback(() => {
    stateRef.current = createInitialState(randomSeed());
    accRef.current = 0;
    lastTimeRef.current = 0;
    setScore(0);
    setStatus('idle');
  }, []);

  // Bàn phím
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const dir = KEY_MAP[e.key];
      if (!dir) return;
      e.preventDefault();
      if (stateRef.current.status === 'over') return;
      enqueueDirection(stateRef.current, dir);
      if (stateRef.current.status === 'playing' && status !== 'playing') {
        setStatus('playing');
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [status]);

  // Vuốt trên mobile
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const onTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    touchStart.current = { x: t.clientX, y: t.clientY };
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart.current) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - touchStart.current.x;
    const dy = t.clientY - touchStart.current.y;
    if (Math.abs(dx) < 20 && Math.abs(dy) < 20) return;
    const dir: Direction =
      Math.abs(dx) > Math.abs(dy)
        ? dx > 0
          ? 'right'
          : 'left'
        : dy > 0
          ? 'down'
          : 'up';
    enqueueDirection(stateRef.current, dir);
    if (stateRef.current.status === 'playing' && status !== 'playing') {
      setStatus('playing');
    }
    touchStart.current = null;
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex w-full max-w-[476px] justify-between px-1 text-lg font-semibold">
        <span>
          {labels.score}: {score}
        </span>
        <span>
          {labels.best}: {best}
        </span>
      </div>

      <div
        className="relative touch-none select-none"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <canvas
          ref={canvasRef}
          width={GRID_WIDTH * CELL}
          height={GRID_HEIGHT * CELL}
          className="max-w-full rounded-lg shadow-md"
          style={{ aspectRatio: `${GRID_WIDTH} / ${GRID_HEIGHT}` }}
        />

        {status !== 'playing' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-lg bg-black/45 text-white">
            {status === 'over' && (
              <p className="text-2xl font-bold">{labels.gameOver}</p>
            )}
            {status === 'over' ? (
              <button
                onClick={restart}
                className="rounded-full bg-white px-6 py-2 font-semibold text-black transition hover:bg-gray-200"
              >
                {labels.restart}
              </button>
            ) : (
              <p className="px-4 text-center text-sm">{labels.start}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
