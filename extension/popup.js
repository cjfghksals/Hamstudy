const dot = document.getElementById('dot');
const statusEl = document.getElementById('status');
const hintEl = document.getElementById('hint');

chrome.storage.session.get('connected', ({ connected }) => {
  if (connected) {
    dot.classList.add('on');
    statusEl.textContent = '연결됨 — 입력 캡처 중';
    hintEl.textContent = '어느 탭에서 타이핑하거나 마우스를 움직여도 햄스터에 반영됩니다.';
  } else {
    statusEl.textContent = '햄스터디 탭 없음';
    hintEl.textContent = '햄스터디 앱 탭을 열면 자동으로 연결됩니다.';
  }
});
