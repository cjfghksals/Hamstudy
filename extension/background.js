let hamsterdyTabId = null;

function setConnected(connected) {
  chrome.action.setBadgeText({ text: connected ? '●' : '' });
  chrome.action.setBadgeBackgroundColor({ color: '#4ade80' });
  chrome.storage.session.set({ connected });
}

chrome.runtime.onMessage.addListener((msg, sender) => {
  if (msg.type === 'register') {
    hamsterdyTabId = sender.tab?.id ?? null;
    setConnected(true);
    return;
  }

  if (msg.type === 'unregister') {
    if (sender.tab?.id === hamsterdyTabId) {
      hamsterdyTabId = null;
      setConnected(false);
    }
    return;
  }

  // 입력 이벤트: 햄스터디 탭이 없거나 발신 탭이 햄스터디 탭이면 무시
  // (햄스터디 탭 자신의 입력은 app.js 네이티브 리스너가 처리)
  if (!hamsterdyTabId) return;
  if (sender.tab?.id === hamsterdyTabId) return;

  if (['keydown', 'mousemove', 'mousedown'].includes(msg.type)) {
    chrome.tabs.sendMessage(hamsterdyTabId, msg).catch(() => {
      hamsterdyTabId = null;
      setConnected(false);
    });
  }
});

chrome.tabs.onRemoved.addListener(tabId => {
  if (tabId === hamsterdyTabId) {
    hamsterdyTabId = null;
    setConnected(false);
  }
});
