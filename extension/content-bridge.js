// 햄스터디 앱 페이지에서만 동작 — meta 태그로 식별
(() => {
  if (!document.querySelector('meta[name="app-id"][content="hamsterdy"]')) return;

  const send = msg => chrome.runtime.sendMessage(msg).catch(() => {});

  // background에 이 탭이 햄스터디임을 등록
  send({ type: 'register' });

  // background에서 다른 탭 입력 이벤트 수신 → page(app.js)로 전달
  chrome.runtime.onMessage.addListener(msg => {
    if (['keydown', 'mousemove', 'mousedown'].includes(msg.type)) {
      window.postMessage({ __hamsterdy_ext: true, ...msg }, '*');
    }
  });

  // 탭 닫히거나 페이지 이탈 시 등록 해제
  window.addEventListener('pagehide', () => send({ type: 'unregister' }));
})();
