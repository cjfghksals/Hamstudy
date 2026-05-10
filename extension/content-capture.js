// 모든 탭에서 실행 — 키보드·마우스 이벤트를 background로 전달
let lastMouseTime = 0;
const send = msg => chrome.runtime.sendMessage(msg).catch(() => {});

// capture: true → 입력 필드 포함 모든 이벤트 캡처 (노트 앱, 유튜브 댓글 등)
document.addEventListener('keydown', e => {
  send({ type: 'keydown', key: e.key });
}, true);

document.addEventListener('mousemove', e => {
  const now = Date.now();
  if (now - lastMouseTime < 50) return;
  lastMouseTime = now;
  send({
    type: 'mousemove',
    nx: Math.max(0, Math.min(1, e.screenX / screen.width)),
    ny: Math.max(0, Math.min(1, e.screenY / screen.height))
  });
}, true);

document.addEventListener('mousedown', () => {
  send({ type: 'mousedown' });
}, true);
