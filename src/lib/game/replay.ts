import { Direction } from './constants';
import { createInitialState, enqueueDirection, step } from './engine';

// Một input: tại tick `t`, người chơi đổi sang hướng `d`.
export interface InputEvent {
  t: number;
  d: Direction;
}

export interface ReplayResult {
  score: number;
  ticks: number;
  finishedNaturally: boolean; // true nếu game kết thúc do đâm (không phải do hết input)
}

const MAX_TICKS = 100_000; // chặn vòng lặp vô hạn

// Chạy lại ván từ (seed + inputLog) để server tính điểm chuẩn.
// Dùng CHUNG engine với client -> kết quả phải khớp điểm client gửi lên.
export function replay(seed: number, inputs: InputEvent[]): ReplayResult {
  const state = createInitialState(seed);
  const sorted = [...inputs].sort((a, b) => a.t - b.t);
  let i = 0;

  // Kích hoạt trạng thái playing bằng input đầu tiên.
  while (state.status !== 'over' && state.tick < MAX_TICKS) {
    while (i < sorted.length && sorted[i].t === state.tick) {
      enqueueDirection(state, sorted[i].d);
      i++;
    }
    if (state.status === 'idle') {
      // Chưa có input nào -> chưa bắt đầu. Nếu hết input thì dừng.
      if (i >= sorted.length) break;
      // Nhảy tới tick của input kế tiếp.
      state.tick = sorted[i].t;
      continue;
    }
    step(state);
  }

  return {
    score: state.score,
    ticks: state.tick,
    finishedNaturally: state.status === 'over',
  };
}
