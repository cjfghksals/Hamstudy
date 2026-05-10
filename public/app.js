const socket = io();
let myId = null, roomCode = '';
const users = {}, timers = {};
const hamsterRatio = 2.0;

// ── 이미지 로드 ──
const images = { head: null, desk: null, hand: null, keyboard: null, mouse: null };
let loadedCount = 0;
const IMG_FILES = {
  head:     '/image/head.png',
  desk:     '/image/desk.png',
  hand:     '/image/hand.png',
  keyboard: '/image/keayboard.png',
  mouse:    '/image/mouse.png',
};
for (const [name, src] of Object.entries(IMG_FILES)) {
  const img = new Image();
  img.onload = () => {
    images[name] = img;
    loadedCount++;
    if (loadedCount === Object.keys(IMG_FILES).length) {
      for (const uid of Object.keys(users)) renderScene(uid);
    }
  };
  img.src = src;
}
document.documentElement.style.setProperty('--hamster-ratio', hamsterRatio);

// ── 씬 레이아웃 ──
// 씬 W:H = 2:1
// 책상 이미지 top이 deskTopY%, 키보드·마우스는 책상 위에 배치
const SCENE_LAYOUT = {
  deskTopY:  44,            // 책상 이미지 윗면 y%
  keyboard:  { cx: 68, cy: 58 },
  head:      { cx: 50, cy: 22 },
};

// 이미지별 표시 너비 (씬 W의 %)
const IMG_W = { head: 38, desk: 100, keyboard: 50, mouse: 17, hand: 11 };

// ── 키보드 레이아웃 ──
// 키보드: cx=68%, 너비=50% → x: 43~93%
// 키보드: cy=58%, 높이≈24.6%H → y: 45.7~70.3%
// 스페이스(R[4])가 위(햄스터 쪽), 숫자행(R[0])이 아래
const KL = 44;
const U  = 47 / 15;   // ≈ 3.13% / key unit
const R  = [61, 57, 53, 49, 45];

const KEY_POS = {
  'Escape':[KL,64], 'F1':[KL+2*U,64], 'F2':[KL+3*U,64], 'F3':[KL+4*U,64],
  'F4':[KL+5*U,64], 'F5':[KL+6*U,64], 'F6':[KL+7*U,64],
  '`':[KL+0.5*U,R[0]], '~':[KL+0.5*U,R[0]],
  '1':[KL+1.5*U,R[0]], '!':[KL+1.5*U,R[0]],
  '2':[KL+2.5*U,R[0]], '@':[KL+2.5*U,R[0]],
  '3':[KL+3.5*U,R[0]], '#':[KL+3.5*U,R[0]],
  '4':[KL+4.5*U,R[0]], '$':[KL+4.5*U,R[0]],
  '5':[KL+5.5*U,R[0]], '%':[KL+5.5*U,R[0]],
  '6':[KL+6.5*U,R[0]], '^':[KL+6.5*U,R[0]],
  '7':[KL+7.5*U,R[0]], '&':[KL+7.5*U,R[0]],
  '8':[KL+8.5*U,R[0]], '*':[KL+8.5*U,R[0]],
  '9':[KL+9.5*U,R[0]], '(':[KL+9.5*U,R[0]],
  '0':[KL+10.5*U,R[0]], ')':[KL+10.5*U,R[0]],
  '-':[KL+11.5*U,R[0]], '_':[KL+11.5*U,R[0]],
  '=':[KL+12.5*U,R[0]], '+':[KL+12.5*U,R[0]],
  'Backspace':[KL+14*U,R[0]],

  'Tab':[KL+0.75*U,R[1]],
  'q':[KL+1.75*U,R[1]], 'Q':[KL+1.75*U,R[1]],
  'w':[KL+2.75*U,R[1]], 'W':[KL+2.75*U,R[1]],
  'e':[KL+3.75*U,R[1]], 'E':[KL+3.75*U,R[1]],
  'r':[KL+4.75*U,R[1]], 'R':[KL+4.75*U,R[1]],
  't':[KL+5.75*U,R[1]], 'T':[KL+5.75*U,R[1]],
  'y':[KL+6.75*U,R[1]], 'Y':[KL+6.75*U,R[1]],
  'u':[KL+7.75*U,R[1]], 'U':[KL+7.75*U,R[1]],
  'i':[KL+8.75*U,R[1]], 'I':[KL+8.75*U,R[1]],
  'o':[KL+9.75*U,R[1]], 'O':[KL+9.75*U,R[1]],
  'p':[KL+10.75*U,R[1]], 'P':[KL+10.75*U,R[1]],
  '[':[KL+11.75*U,R[1]], '{':[KL+11.75*U,R[1]],
  ']':[KL+12.75*U,R[1]], '}':[KL+12.75*U,R[1]],
  '\\':[KL+13.75*U,R[1]], '|':[KL+13.75*U,R[1]],

  'CapsLock':[KL+0.9*U,R[2]],
  'a':[KL+2*U,R[2]], 'A':[KL+2*U,R[2]],
  's':[KL+3*U,R[2]], 'S':[KL+3*U,R[2]],
  'd':[KL+4*U,R[2]], 'D':[KL+4*U,R[2]],
  'f':[KL+5*U,R[2]], 'F':[KL+5*U,R[2]],
  'g':[KL+6*U,R[2]], 'G':[KL+6*U,R[2]],
  'h':[KL+7*U,R[2]], 'H':[KL+7*U,R[2]],
  'j':[KL+8*U,R[2]], 'J':[KL+8*U,R[2]],
  'k':[KL+9*U,R[2]], 'K':[KL+9*U,R[2]],
  'l':[KL+10*U,R[2]], 'L':[KL+10*U,R[2]],
  ';':[KL+11*U,R[2]], ':':[KL+11*U,R[2]],
  "'":[KL+12*U,R[2]], '"':[KL+12*U,R[2]],
  'Enter':[KL+13.5*U,R[2]],

  'Shift':[KL+1.1*U,R[3]],
  'z':[KL+2.5*U,R[3]], 'Z':[KL+2.5*U,R[3]],
  'x':[KL+3.5*U,R[3]], 'X':[KL+3.5*U,R[3]],
  'c':[KL+4.5*U,R[3]], 'C':[KL+4.5*U,R[3]],
  'v':[KL+5.5*U,R[3]], 'V':[KL+5.5*U,R[3]],
  'b':[KL+6.5*U,R[3]], 'B':[KL+6.5*U,R[3]],
  'n':[KL+7.5*U,R[3]], 'N':[KL+7.5*U,R[3]],
  'm':[KL+8.5*U,R[3]], 'M':[KL+8.5*U,R[3]],
  ',':[KL+9.5*U,R[3]], '<':[KL+9.5*U,R[3]],
  '.':[KL+10.5*U,R[3]], '>':[KL+10.5*U,R[3]],
  '/':[KL+11.5*U,R[3]], '?':[KL+11.5*U,R[3]],

  'Control':[KL+0.75*U,R[4]],
  'Meta':[KL+1.75*U,R[4]],
  'Alt':[KL+2.5*U,R[4]],
  ' ':[KL+6.5*U,R[4]],

  'ArrowLeft':[KL+11*U,R[4]], 'ArrowDown':[KL+12*U,R[4]],
  'ArrowRight':[KL+13*U,R[4]], 'ArrowUp':[KL+12*U,R[3]],
  'Delete':[KL+14*U,R[1]], 'Insert':[KL+13*U,R[1]],
};

// 마우스 이동 범위 (씬 %) — 왼쪽 책상 벽면(≈13%) 안쪽, 책상 윗면까지
const MOUSE_PAD = { left: 21, right: 44, top: 44, bottom: 65 };

// 손 휴식 위치: 머리(cx=50) 기준 좌우 대칭 (+/-18)
const PAW_REST = {
  left:  { x: 32, y: 45 },
  right: { x: 68, y: 45 },
};
// 마우스 기본 위치 (왼쪽)
const MOUSE_DEFAULT = { x: 30, y: 58 };

const pawStates = {};
const hiddenInOverlay = new Set();
let pipWin = null;

function getEl(id) {
  return document.getElementById(id) ||
    (pipWin && !pipWin.closed ? pipWin.document.getElementById(id) : null);
}
function setVar(name, value) {
  document.documentElement.style.setProperty(name, value);
  if (pipWin && !pipWin.closed) pipWin.document.documentElement.style.setProperty(name, value);
}

// ── 서버 연결 대기 ──
socket.on('connect', () => {
  document.getElementById('connecting-screen').classList.remove('active');
  document.getElementById('login-screen').classList.add('active');
});
socket.on('connect_error', () => {
  document.getElementById('connecting-text').textContent = '서버를 깨우는 중... (최대 30초)';
});

// ── Electron ──
const isElectron = !!window.electronAPI;
if (isElectron) {
  document.body.classList.add('is-electron');
  window.electronAPI.onOverlayChanged(enabled => {
    document.body.classList.toggle('overlay-mode', enabled);
    const btn = document.getElementById('overlay-btn');
    if (btn) btn.textContent = enabled ? '✅ 오버레이 ON' : '🖥️ 오버레이';
    if (enabled) setTimeout(adjustOverlayWidth, 80);
    else window.electronAPI.setAspectRatio(0);
  });
  document.getElementById('tb-minimize')?.addEventListener('click', () => window.electronAPI.minimize());
  document.getElementById('tb-close')?.addEventListener('click', () => window.electronAPI.close());
}
document.getElementById('overlay-btn')?.addEventListener('click', () => {
  if (isElectron) {
    window.electronAPI.setOverlay(!document.body.classList.contains('overlay-mode'));
  } else {
    document.getElementById('download-modal').classList.add('active');
  }
});
document.getElementById('download-btn')?.addEventListener('click', () => {
  document.getElementById('download-modal').classList.add('active');
});
document.getElementById('modal-close-btn')?.addEventListener('click', () => {
  document.getElementById('download-modal').classList.remove('active');
});
document.getElementById('download-modal')?.addEventListener('click', e => {
  if (e.target === e.currentTarget) e.currentTarget.classList.remove('active');
});
document.getElementById('exit-overlay-btn')?.addEventListener('click', () => {
  if (isElectron) window.electronAPI.setOverlay(false);
  else if (pipWin && !pipWin.closed) pipWin.close();
});

// ── 유틸 ──
function fmtTime(ms) {
  const s = Math.floor(ms/1000);
  return `${String((s/3600)|0).padStart(2,'0')}:${String(((s%3600)/60)|0).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;
}
function fmtKey(key) {
  const map = {' ':'Space','Enter':'↵','Backspace':'⌫','Escape':'Esc','Tab':'Tab',
    'CapsLock':'Caps','Shift':'⇧','Control':'Ctrl','Alt':'Alt','Meta':'⌘',
    'Delete':'Del','ArrowUp':'↑','ArrowDown':'↓','ArrowLeft':'←','ArrowRight':'→'};
  return map[key] || (key.length===1 ? key.toUpperCase() : key.slice(0,5));
}

// ── 패널 생성 ──
function makeCat(userId) {
  return `<div class="hamster-scene" id="cat-${userId}">
    <canvas class="scene-canvas" id="scenecanvas-${userId}"></canvas>
  </div>`;
}
function makePanel(userId, data) {
  const div = document.createElement('div');
  div.className = `cat-panel${userId===myId?' me':''}`;
  div.id = `panel-${userId}`;
  div.innerHTML = `
    <div class="username">${data.name}${userId===myId?' <span class="me-tag">나</span>':''}<button class="overlay-toggle-btn" title="오버레이 표시/숨기기">👁️</button></div>
    <div class="timer" id="timer-${userId}">00:00:00</div>
    <div class="cat-wrapper">${makeCat(userId)}</div>
    <div class="key-display" id="keys-${userId}"></div>`;
  div.querySelector('.overlay-toggle-btn').addEventListener('click', () => toggleOverlayUser(userId));
  if (hiddenInOverlay.has(userId)) {
    div.classList.add('overlay-hidden');
    div.querySelector('.overlay-toggle-btn').textContent = '🙈';
    div.querySelector('.overlay-toggle-btn').classList.add('is-hidden');
  }
  return div;
}

function toggleOverlayUser(userId) {
  if (hiddenInOverlay.has(userId)) hiddenInOverlay.delete(userId);
  else hiddenInOverlay.add(userId);
  const panel = getEl(`panel-${userId}`);
  const btn = panel?.querySelector('.overlay-toggle-btn');
  const hidden = hiddenInOverlay.has(userId);
  panel?.classList.toggle('overlay-hidden', hidden);
  if (btn) { btn.textContent = hidden ? '🙈' : '👁️'; btn.classList.toggle('is-hidden', hidden); }
  adjustOverlayWidth();
}

// ── 씬 렌더링 ──

function initPawState(userId) {
  const existing = pawStates[userId];
  if (existing) {
    if (existing.lTimer) clearTimeout(existing.lTimer);
    if (existing.rTimer) clearTimeout(existing.rTimer);
    if (existing.observer) existing.observer.disconnect();
  }
  pawStates[userId] = {
    lx: PAW_REST.left.x,  ly: PAW_REST.left.y,  lState: 'rest',
    rx: PAW_REST.right.x, ry: PAW_REST.right.y,  rState: 'rest',
    mouseX: MOUSE_DEFAULT.x, mouseY: MOUSE_DEFAULT.y,
    lTimer: null, rTimer: null,
    lRaf:   null, rRaf:   null,
    observer: null
  };
  const scene = getEl(`cat-${userId}`);
  if (scene && typeof ResizeObserver !== 'undefined') {
    const ro = new ResizeObserver(() => renderScene(userId));
    ro.observe(scene);
    pawStates[userId].observer = ro;
  }
  requestAnimationFrame(() => renderScene(userId));
}

function renderScene(userId) {
  const canvas = getEl(`scenecanvas-${userId}`);
  const scene  = getEl(`cat-${userId}`);
  if (!canvas || !scene) return;
  const W = scene.clientWidth, H = scene.clientHeight;
  if (!W || !H) return;
  if (canvas.width !== W || canvas.height !== H) {
    canvas.width = W; canvas.height = H;
  }
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, W, H);

  // 이미지를 목표 너비% 기준으로 중심 좌표에 그리기
  function drawImg(img, wPct, cx, cy) {
    if (!img) return;
    const dw = W * wPct / 100;
    const dh = dw * img.height / img.width;
    ctx.drawImage(img, W*cx/100 - dw/2, H*cy/100 - dh/2, dw, dh);
  }

  const s = pawStates[userId];
  const deskTopPx = H * SCENE_LAYOUT.deskTopY / 100;

  // 1. 햄스터 머리 (책상보다 먼저 → 책상이 하체 가림)
  drawImg(images.head, IMG_W.head, SCENE_LAYOUT.head.cx, SCENE_LAYOUT.head.cy);

  // 2. 책상 이미지 (위쪽 기준 정렬, 전체 너비)
  if (images.desk) {
    const dh = W * images.desk.height / images.desk.width;
    ctx.drawImage(images.desk, 0, deskTopPx, W, dh);
  }

  // 3. 키보드 (책상 위)
  drawImg(images.keyboard, IMG_W.keyboard, SCENE_LAYOUT.keyboard.cx, SCENE_LAYOUT.keyboard.cy);

  // 4. 마우스 (오른손 위치, 발 귀환 후에도 마지막 위치 유지)
  if (s) drawImg(images.mouse, IMG_W.mouse, s.mouseX, s.mouseY);

  if (!s) return;

  // 5. 손 (팔 없음, 발만 이동)
  if (images.hand) {
    function drawHand(px, py, state, isLeft) {
      const dw = W * IMG_W.hand / 100;
      const dh = dw * images.hand.height / images.hand.width;
      const tx = W * px / 100, ty = H * py / 100;
      const scaleY = state === 'press' ? 0.82 : 1.0;
      ctx.save();
      ctx.translate(tx, ty);
      if (isLeft) ctx.scale(-1, 1);  // 왼손 좌우 반전
      ctx.scale(1, scaleY);
      ctx.drawImage(images.hand, -dw/2, -dh/2, dw, dh);
      ctx.restore();
    }
    drawHand(s.lx, s.ly, s.lState, true);
    drawHand(s.rx, s.ry, s.rState, false);
  }

  // 6. 타이핑 횟수 (책상 아래 여백)
  const count = keyCounts[userId];
  if (count > 0) {
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const labelFs = Math.max(10, Math.round(W * 0.038));
    ctx.font = `${labelFs}px 'Segoe UI', system-ui, sans-serif`;
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.fillText('타이핑', W * 0.5, H * 0.81);
    const countFs = Math.max(13, Math.round(W * 0.062));
    ctx.font = `bold ${countFs}px 'Courier New', monospace`;
    ctx.fillStyle = 'rgba(74,222,128,0.92)';
    ctx.fillText(count.toLocaleString(), W * 0.5, H * 0.91);
    ctx.restore();
  }
}

function movePawTo(userId, side, tx, ty, state) {
  const s = pawStates[userId];
  if (!s) return;
  if (side === 'left') { s.lx = tx; s.ly = ty; s.lState = state; }
  else                 { s.rx = tx; s.ry = ty; s.rState = state; }
  renderScene(userId);
}

function scheduleReturn(userId, side, delay) {
  const s = pawStates[userId];
  if (!s) return;
  const tk = side === 'left' ? 'lTimer'  : 'rTimer';
  const rk = side === 'left' ? 'lRaf'    : 'rRaf';
  const xk = side === 'left' ? 'lx'      : 'rx';
  const yk = side === 'left' ? 'ly'      : 'ry';
  const sk = side === 'left' ? 'lState'  : 'rState';
  if (s[tk]) clearTimeout(s[tk]);
  s[tk] = setTimeout(() => {
    const rest = PAW_REST[side];
    const sx = s[xk], sy = s[yk];
    let prog = 0;
    const tick = () => {
      prog = Math.min(1, prog + 0.06);
      const t = 1 - Math.pow(1 - prog, 2);
      s[xk] = sx + (rest.x - sx) * t;
      s[yk] = sy + (rest.y - sy) * t;
      if (prog >= 0.75) s[sk] = 'rest';
      if (prog >= 1 && side === 'left') {
        s.mouseX = MOUSE_DEFAULT.x;
        s.mouseY = MOUSE_DEFAULT.y;
      }
      renderScene(userId);
      if (prog < 1) s[rk] = requestAnimationFrame(tick);
    };
    s[rk] = requestAnimationFrame(tick);
  }, delay);
}

function pressKey(userId, key) {
  const pos = KEY_POS[key];
  if (!pos) return;
  // 키보드 x축 반전: 키보드 중심(68%) 기준 대칭 → 43~93% 범위 내
  movePawTo(userId, 'right', 136 - pos[0], pos[1], 'press');
  scheduleReturn(userId, 'right', 400);
}

function moveMouse(userId, nx, ny) {
  const s = pawStates[userId];
  if (!s) return;
  const x = MOUSE_PAD.right  - nx * (MOUSE_PAD.right  - MOUSE_PAD.left);
  const y = MOUSE_PAD.bottom - ny * (MOUSE_PAD.bottom - MOUSE_PAD.top);
  s.mouseX = x; s.mouseY = y;
  movePawTo(userId, 'left', x, y, 'press');
  scheduleReturn(userId, 'left', 600);
}

function clickMouse(userId) {
  scheduleReturn(userId, 'left', 150);
}

const keyCounts = {};

function addKeyCount(userId) {
  keyCounts[userId] = (keyCounts[userId] || 0) + 1;
  renderScene(userId);
}

// ── 타이머 ──
function startTimer(userId, joinTime) {
  if (timers[userId]) clearInterval(timers[userId]);
  timers[userId] = setInterval(() => {
    const el = getEl(`timer-${userId}`);
    if (el) el.textContent = fmtTime(Date.now()-joinTime);
    else clearInterval(timers[userId]);
  }, 1000);
}

// ── 오버레이 너비 자동 계산 ──
function adjustOverlayWidth() {
  if (!document.body.classList.contains('overlay-mode')) return;
  const count = Object.keys(users).filter(uid => !hiddenInOverlay.has(uid)).length;
  if (!count) return;
  if (isElectron) {
    const h = window.innerHeight;
    const sceneH = Math.max(50, h - 78);
    const sceneW = Math.round(sceneH * hamsterRatio);
    setVar('--overlay-panel-w', (sceneW + 8) + 'px');
    const totalW = (sceneW + 8) * count + 8 * Math.max(0, count - 1) + 16;
    window.electronAPI.setWidth(Math.ceil(totalW));
    const extraW = 8 * count + 8 * Math.max(0, count - 1) + 16;
    window.electronAPI.setAspectRatio(count * hamsterRatio, { width: extraW, height: 78 });
  } else if (pipWin && !pipWin.closed) {
    const h = pipWin.innerHeight;
    const sceneH = Math.max(50, h - 78);
    const sceneW = Math.round(sceneH * hamsterRatio);
    setVar('--overlay-panel-w', (sceneW + 8) + 'px');
  }
}

// ── Room 동기화 ──
function syncRoom(usersData) {
  const container = getEl('cats-container');
  for (const uid of Object.keys(users)) {
    if (!usersData[uid]) {
      getEl(`panel-${uid}`)?.remove();
      clearInterval(timers[uid]);
      const s = pawStates[uid];
      if (s) {
        if (s.lTimer) clearTimeout(s.lTimer);
        if (s.rTimer) clearTimeout(s.rTimer);
        if (s.observer) s.observer.disconnect();
        delete pawStates[uid];
      }
      delete timers[uid]; delete users[uid]; delete keyCounts[uid];
    }
  }
  for (const [uid, data] of Object.entries(usersData)) {
    if (!users[uid]) {
      users[uid] = data;
      container.appendChild(makePanel(uid, data));
      startTimer(uid, data.joinTime);
      initPawState(uid);
    }
  }
  adjustOverlayWidth();
}

// ── 입력 캡처 ──
let lastMouseTime = 0;

if (isElectron) {
  window.electronAPI.hasGlobalHook().then(hasHook => {
    if (hasHook) {
      window.electronAPI.onGlobalKeydown(key => {
        if (!myId) return;
        pressKey(myId, key);
        addKeyCount(myId);
        socket.emit('key-event', { key, type: 'down' });
      });
      window.electronAPI.onGlobalMousemove(({ x, y }) => {
        if (!myId) return;
        moveMouse(myId, x, y);
        socket.emit('mouse-move', { x, y });
      });
      window.electronAPI.onGlobalMousedown(() => {
        if (!myId) return;
        socket.emit('key-event', { key: '__click__', type: 'down' });
        clickMouse(myId);
      });
    } else {
      attachDomListeners();
    }
  });
} else {
  attachDomListeners();
}

function attachDomListeners(targetDoc = document, targetWin = window) {
  targetDoc.addEventListener('keydown', e => {
    if (!myId) return;
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    socket.emit('key-event', { key: e.key, type: 'down' });
    pressKey(myId, e.key);
    addKeyCount(myId);
  });
  targetDoc.addEventListener('mousemove', e => {
    if (!myId) return;
    const now = Date.now();
    if (now - lastMouseTime < 50) return;
    lastMouseTime = now;
    // 화면 절대좌표 기준 → PiP 창 위에서도 정확한 위치 추적
    const sw = targetWin.screen.width  || targetWin.innerWidth;
    const sh = targetWin.screen.height || targetWin.innerHeight;
    const nx = Math.max(0, Math.min(1, e.screenX / sw));
    const ny = Math.max(0, Math.min(1, e.screenY / sh));
    socket.emit('mouse-move', { x: nx, y: ny });
    moveMouse(myId, nx, ny);
  });
  targetDoc.addEventListener('mousedown', () => {
    if (!myId) return;
    socket.emit('key-event', { key: '__click__', type: 'down' });
    clickMouse(myId);
  });
}

// ── 소켓 이벤트 ──
socket.on('room-update', ({ users: data }) => syncRoom(data));
socket.on('user-key-event', ({ userId, key, type }) => {
  if (type !== 'down') return;
  if (key === '__click__') { clickMouse(userId); return; }
  pressKey(userId, key);
  addKeyCount(userId);
});
socket.on('user-mouse-move', ({ userId, x, y }) => moveMouse(userId, x, y));

// ── UI ──
function enterRoom(code, usersData) {
  document.getElementById('room-code').textContent = code;
  document.getElementById('login-screen').classList.remove('active');
  document.getElementById('room-screen').classList.add('active');
  syncRoom(usersData);
}
document.getElementById('create-btn').addEventListener('click', () => {
  const name = document.getElementById('name-input').value.trim() || '익명';
  socket.emit('create-room', { name }, res => {
    if (!res.success) return alert(res.error);
    myId = res.myId; roomCode = res.code;
    enterRoom(res.code, res.users);
  });
});
document.getElementById('join-btn').addEventListener('click', () => {
  const name = document.getElementById('name-input').value.trim() || '익명';
  const code = document.getElementById('code-input').value.trim();
  if (!code) return alert('초대 코드를 입력해주세요.');
  socket.emit('join-room', { name, code }, res => {
    if (!res.success) return alert(res.error);
    myId = res.myId; roomCode = res.code;
    enterRoom(res.code, res.users);
  });
});
document.getElementById('copy-btn').addEventListener('click', () => {
  navigator.clipboard.writeText(roomCode);
  const btn = document.getElementById('copy-btn');
  btn.textContent = '✅'; setTimeout(() => btn.textContent = '📋', 1500);
});
document.getElementById('leave-btn').addEventListener('click', () => location.reload());
document.getElementById('code-input').addEventListener('input', e => e.target.value = e.target.value.toUpperCase());
document.getElementById('name-input').addEventListener('keydown', e => { if(e.key==='Enter') document.getElementById('create-btn').click(); });
document.getElementById('code-input').addEventListener('keydown', e => { if(e.key==='Enter') document.getElementById('join-btn').click(); });

// 오버레이 모드에서 창 크기 변경 시 패널 너비 CSS 변수 갱신
window.addEventListener('resize', () => {
  if (!document.body.classList.contains('overlay-mode')) return;
  const visibleCount = Object.keys(users).filter(uid => !hiddenInOverlay.has(uid)).length;
  if (!visibleCount) return;
  const sceneH = Math.max(50, window.innerHeight - 78);
  const sceneW = Math.round(sceneH * hamsterRatio);
  setVar('--overlay-panel-w', (sceneW + 8) + 'px');
});

// ── 웹 오버레이 (Document Picture-in-Picture) ──
async function toggleWebOverlay() {
  if (pipWin && !pipWin.closed) { pipWin.close(); return; }
  if (!('documentPictureInPicture' in window)) {
    alert('이 브라우저는 오버레이를 지원하지 않습니다.\nChrome 116 이상에서 이용해주세요.');
    return;
  }
  const visibleCount = Math.max(1, Object.keys(users).filter(uid => !hiddenInOverlay.has(uid)).length);
  const initH = 220;
  const sceneW = Math.round((initH - 78) * hamsterRatio);
  const initW = (sceneW + 8) * visibleCount + 8 * Math.max(0, visibleCount - 1) + 16;

  try {
    pipWin = await window.documentPictureInPicture.requestWindow({ width: initW, height: initH });
  } catch(e) {
    alert('오버레이 창을 열지 못했습니다: ' + e.message);
    pipWin = null; return;
  }

  // 핵심 스타일 즉시 적용 (link는 비동기라 투명 배경이 늦게 적용되는 문제 방지)
  const criticalStyle = pipWin.document.createElement('style');
  criticalStyle.textContent = `
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html, body { background: #0d0d1a !important; overflow: hidden; }
    .cats-container { display: flex; align-items: center; justify-content: center;
      height: 100vh; padding: 0 8px; background: #0d0d1a;
      flex-wrap: nowrap; overflow: hidden; gap: 8px; }
    .cat-panel { display: flex; flex-direction: column; align-items: center;
      flex: 0 0 var(--overlay-panel-w, auto); width: var(--overlay-panel-w, auto);
      height: 100%; justify-content: center; gap: 2px; padding: 4px; }
    .cat-panel.overlay-hidden { display: none !important; }
    .cat-wrapper { flex: 1; min-height: 0; width: 100%;
      display: flex; align-items: center; justify-content: center; }
    .hamster-scene { position: relative; display: block; width: 100%; height: auto;
      max-width: 100%; aspect-ratio: var(--hamster-ratio, 2); }
    .scene-canvas { position: absolute; top: 0; left: 0; width: 100%; height: 100%; display: block; }
    .username { font-family: 'Segoe UI', system-ui, sans-serif; font-size: clamp(0.7rem, 3vh, 1.1rem);
      font-weight: 700; color: rgba(255,255,255,0.95); display: flex; align-items: center; gap: 6px;
      text-shadow: 0 0 8px rgba(0,0,0,1), 0 1px 3px rgba(0,0,0,0.9); }
    .timer { font-family: 'Courier New', monospace; font-size: clamp(0.85rem, 3.8vh, 1.5rem);
      font-weight: 800; color: #4ade80; letter-spacing: 1px;
      text-shadow: 0 0 8px rgba(0,0,0,1), 0 1px 3px rgba(0,0,0,0.9); }
    .me-tag { font-size: 0.7rem; background: rgba(99,102,241,0.25);
      border: 1px solid rgba(99,102,241,0.4); color: #a5b4fc;
      padding: 1px 7px; border-radius: 10px; }
    .key-display { display: none; }
    .overlay-toggle-btn { display: none; }
  `;
  pipWin.document.head.appendChild(criticalStyle);

  // 나머지 스타일시트도 비동기 복사 (애니메이션 등 추가 스타일)
  [...document.styleSheets].forEach(ss => {
    try {
      if (ss.href) {
        const link = pipWin.document.createElement('link');
        link.rel = 'stylesheet'; link.href = ss.href;
        pipWin.document.head.appendChild(link);
      }
    } catch(_) {}
  });

  // CSS 변수 초기화
  pipWin.document.documentElement.style.setProperty('--hamster-ratio', hamsterRatio);

  // cats-container를 PiP 창으로 이동
  const container = document.getElementById('cats-container');
  pipWin.document.body.appendChild(container);
  pipWin.document.body.classList.add('overlay-mode');

  // 메인 창 UI 업데이트
  document.body.classList.add('overlay-mode');
  const btn = document.getElementById('overlay-btn');
  if (btn) btn.textContent = '✅ 오버레이 ON';

  adjustOverlayWidth();

  // DOM 이동 후 ResizeObserver 재연결
  for (const uid of Object.keys(users)) initPawState(uid);

  // PiP 창에도 입력 리스너 연결 (PiP 위로 마우스가 지나갈 때 + PiP 포커스 시 키보드)
  attachDomListeners(pipWin.document, pipWin);

  // PiP 창 리사이즈 시 CSS 변수 갱신
  pipWin.addEventListener('resize', () => {
    if (!pipWin || pipWin.closed) return;
    const vc = Object.keys(users).filter(uid => !hiddenInOverlay.has(uid)).length;
    if (!vc) return;
    const h = pipWin.innerHeight;
    const sw = Math.round(Math.max(50, h - 78) * hamsterRatio);
    setVar('--overlay-panel-w', (sw + 8) + 'px');
  });

  // PiP 창 닫힐 때 복원
  pipWin.addEventListener('pagehide', () => {
    const cont = pipWin?.document.getElementById('cats-container');
    if (cont) {
      const hint = document.getElementById('hint');
      const roomScreen = document.getElementById('room-screen');
      if (hint) roomScreen.insertBefore(cont, hint);
      else roomScreen.appendChild(cont);
    }
    pipWin = null;
    document.body.classList.remove('overlay-mode');
    const b = document.getElementById('overlay-btn');
    if (b) b.textContent = '🖥️ 오버레이';
    for (const uid of Object.keys(users)) initPawState(uid);
  });
}

// ── Chrome Extension 입력 중계 수신 ──
// content-bridge.js → window.postMessage → 여기서 수신 후 socket 전송
window.addEventListener('message', e => {
  if (e.source !== window || !e.data?.__hamsterdy_ext) return;
  if (!myId) return;
  const { type, key, nx, ny } = e.data;
  if (type === 'keydown') {
    pressKey(myId, key);
    addKeyCount(myId);
    socket.emit('key-event', { key, type: 'down' });
  } else if (type === 'mousemove') {
    moveMouse(myId, nx, ny);
    socket.emit('mouse-move', { x: nx, y: ny });
  } else if (type === 'mousedown') {
    clickMouse(myId);
    socket.emit('key-event', { key: '__click__', type: 'down' });
  }
});

// ── 크기 조절 핸들 ──
let isResizing = false, resizeLastPos = null;
document.getElementById('resize-handle')?.addEventListener('mousedown', e => {
  if (!isElectron) return;
  isResizing = true; resizeLastPos = { x: e.screenX, y: e.screenY };
  e.preventDefault();
});
document.addEventListener('mousemove', e => {
  if (!isResizing || !resizeLastPos) return;
  const dx = e.screenX - resizeLastPos.x, dy = e.screenY - resizeLastPos.y;
  resizeLastPos = { x: e.screenX, y: e.screenY };
  window.electronAPI?.resizeBy(dx, dy);
});
document.addEventListener('mouseup', () => { isResizing = false; resizeLastPos = null; });
