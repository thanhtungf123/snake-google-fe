/*
 * ScoreBridge — chạy trong iframe game Google (cùng origin).
 *  - /api/game/start khi bắt đầu ván (bấm hướng / chạm).
 *  - /api/game/submit khi rắn chết: điểm = độ dài thân rắn - 4 (snake.js đã patch gọi
 *    window.__GS_ON_DEATH(this.oa,'Oa') tại handler chết; this.oa.ka = thân rắn).
 */
(function () {
  'use strict';

  var sessionId = null;
  var started = false;
  // URL server API (backend tách riêng), do frontend truyền vào qua window.__GS_API__.
  var API = (window.__GS_API__ || '').replace(/\/$/, '');

  function log(tag, a, b, c) {
    try { console.log('%c[ScoreBridge] ' + tag, 'color:#4673e8', a !== undefined ? a : '', b !== undefined ? b : '', c !== undefined ? c : ''); } catch (e) {}
  }

  function startGame() {
    if (started) return;
    started = true;
    sessionId = null;
    // Báo trang cha để ẩn khung mời đăng ký khi người chơi bắt đầu ván mới.
    try { window.parent.postMessage({ type: 'gs:game-started' }, '*'); } catch (e) {}
    fetch(API + '/api/game/start', { method: 'POST', credentials: 'include' })
      .then(function (r) { return r.json(); })
      .then(function (d) { sessionId = d.sessionId; log('started', sessionId); })
      .catch(function (e) { log('start error', e); });
  }

  function submitScore(score) {
    if (!sessionId) { log('submit skip: chưa có session'); return; }
    fetch(API + '/api/game/submit', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: sessionId, score: score }),
    })
      .then(function (r) { return r.json(); })
      .then(function (d) { log('saved', d); try { window.parent.postMessage({ type: 'gs:score-saved', payload: d }, '*'); } catch (e) {} })
      .catch(function (e) { log('submit error', e); })
      .finally(function () { started = false; });
  }
  window.__gsSubmitScore = submitScore;
  window.__gsStartGame = startGame;
  window.__gsDumpLS = function () { try { return JSON.stringify(localStorage); } catch (e) { return String(e); } };

  // Bắt đầu ván khi có input điều khiển.
  var dirKeys = { ArrowUp: 1, ArrowDown: 1, ArrowLeft: 1, ArrowRight: 1, w: 1, a: 1, s: 1, d: 1, W: 1, A: 1, S: 1, D: 1 };
  document.addEventListener('keydown', function (e) { if (dirKeys[e.key]) startGame(); }, true);
  document.addEventListener('pointerdown', startGame, true);

  // (Request google.com được proxy qua backend nhờ override fetch sớm trong index.html.)

  // Khởi đầu rắn dài 4 ô; mỗi táo +1 ô. Điểm = độ dài thân (obj.ka.length) - 4.
  var SNAKE_START_LEN = 4;

  // Hook game-over: snake.js (self-host) gọi window.__GS_ON_DEATH(obj, src) khi rắn chết.
  window.__GS_ON_DEATH = function (obj, src) {
    try {
      if (src !== 'Oa') return; // chỉ nhận handler chết thật
      var len = obj && obj.ka && obj.ka.length;
      if (typeof len !== 'number') return;
      var score = Math.max(0, len - SNAKE_START_LEN);
      log('game over, score =', score);
      submitScore(score);
    } catch (e) {
      log('death hook err', e);
    }
  };

  log('ready v4', 'score auto-submit active');
})();
