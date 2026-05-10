const { app, BrowserWindow, ipcMain, screen } = require('electron');
const path = require('path');

const SERVER_URL = 'https://hamstudy.onrender.com';

let win;
let uiohook = null;
let overlayAspect = { ratio: 0, extraW: 0, extraH: 0 };

// uiohook-napi: 전역 키보드/마우스 훅 (N-API 기반, ABI 호환)
try {
  const { uIOhook } = require('uiohook-napi');
  uiohook = uIOhook;
  console.log('[햄스터디] uiohook-napi 로드 성공');
} catch (e) {
  console.warn('[햄스터디] uiohook-napi 로드 실패 — DOM 이벤트로 폴백:', e.message);
}

// uiohook keycode → KeyboardEvent.key 매핑 (US 키보드 스캔코드 기준)
const KEYCODE_MAP = {
  1: 'Escape',
  2: '1', 3: '2', 4: '3', 5: '4', 6: '5', 7: '6', 8: '7',
  9: '8', 10: '9', 11: '0', 12: '-', 13: '=', 14: 'Backspace',
  15: 'Tab',
  16: 'q', 17: 'w', 18: 'e', 19: 'r', 20: 't', 21: 'y', 22: 'u',
  23: 'i', 24: 'o', 25: 'p', 26: '[', 27: ']', 28: 'Enter',
  29: 'Control',
  30: 'a', 31: 's', 32: 'd', 33: 'f', 34: 'g', 35: 'h', 36: 'j',
  37: 'k', 38: 'l', 39: ';', 40: "'", 41: '`',
  42: 'Shift', 43: '\\',
  44: 'z', 45: 'x', 46: 'c', 47: 'v', 48: 'b', 49: 'n', 50: 'm',
  51: ',', 52: '.', 53: '/',
  54: 'Shift', 56: 'Alt', 57: ' ', 58: 'CapsLock',
  59: 'F1', 60: 'F2', 61: 'F3', 62: 'F4', 63: 'F5', 64: 'F6',
  65: 'F7', 66: 'F8', 67: 'F9', 68: 'F10', 87: 'F11', 88: 'F12',
  3675: 'Meta', 3676: 'Meta',
  57373: 'Control', 57400: 'Alt',
  57416: 'ArrowUp', 57419: 'ArrowLeft',
  57424: 'ArrowDown', 57421: 'ArrowRight',
  57426: 'Insert', 57427: 'Delete',
};

app.setAppUserModelId('com.hamstudy.app');

function createWindow() {
  win = new BrowserWindow({
    width: 1100, height: 720,
    transparent: true, frame: false,
    backgroundColor: '#00000000',
    alwaysOnTop: false, resizable: true,
    icon: path.join(__dirname, 'icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });
  win.loadURL(SERVER_URL);
}

app.whenReady().then(() => {
  createWindow();

  if (uiohook) {
      let lastMouseSend = 0;

      uiohook.on('keydown', (e) => {
        const key = KEYCODE_MAP[e.keycode];
        if (key && win && !win.isDestroyed()) {
          win.webContents.send('global-keydown', key);
        }
      });

      uiohook.on('mousemove', (e) => {
        const now = Date.now();
        if (now - lastMouseSend < 50) return;
        lastMouseSend = now;
        if (win && !win.isDestroyed()) {
          const { width, height } = screen.getPrimaryDisplay().workAreaSize;
          win.webContents.send('global-mousemove', { x: e.x / width, y: e.y / height });
        }
      });

      uiohook.on('mousedown', () => {
        if (win && !win.isDestroyed()) {
          win.webContents.send('global-mousedown');
        }
      });

      uiohook.start();
      console.log('[햄스터디] uiohook 글로벌 훅 시작됨');
  }
});

app.on('window-all-closed', () => {
  if (uiohook) uiohook.stop();
  if (process.platform !== 'darwin') app.quit();
});

// 오버레이 모드 전환
ipcMain.on('set-overlay', (event, enabled) => {
  if (enabled) {
    const { width, height } = screen.getPrimaryDisplay().workAreaSize;
    win.setAlwaysOnTop(true, 'screen-saver');
    win.setSkipTaskbar(true);
    win.setResizable(true);
    win.setMinimumSize(200, 150);
    win.setBounds({ x: width - 820, y: height - 300, width: 800, height: 290 });
  } else {
    overlayAspect = { ratio: 0, extraW: 0, extraH: 0 };
    win.setAspectRatio(0);
    win.setAlwaysOnTop(false);
    win.setSkipTaskbar(false);
    win.setMinimumSize(400, 300);
    win.setSize(1100, 720);
    win.center();
  }
  win.webContents.send('overlay-changed', enabled);
});

// 창 컨트롤
ipcMain.on('minimize-app', () => win.minimize());
ipcMain.on('close-app', () => app.quit());
ipcMain.on('resize-by', (event, { dx, dy }) => {
  const [w, h] = win.getSize();
  if (overlayAspect.ratio > 0) {
    // 비율 유지: dy로 높이 결정, 너비는 비율에서 계산
    const newH = Math.max(150, h + dy);
    const newW = Math.round((newH - overlayAspect.extraH) * overlayAspect.ratio + overlayAspect.extraW);
    win.setSize(Math.max(200, newW), newH);
  } else {
    win.setSize(Math.max(200, w + dx), Math.max(150, h + dy));
  }
});
ipcMain.on('set-width', (event, { width }) => {
  const [, h] = win.getSize();
  const { width: sw } = screen.getPrimaryDisplay().workAreaSize;
  win.setSize(Math.min(sw, Math.max(200, width)), h);
});
ipcMain.on('set-aspect-ratio', (event, { ratio, extra }) => {
  overlayAspect = { ratio: ratio || 0, extraW: (extra || {}).width || 0, extraH: (extra || {}).height || 0 };
  win.setAspectRatio(ratio || 0, extra || { width: 0, height: 0 });
});

// 렌더러에 uiohook 사용 가능 여부 알림
ipcMain.handle('has-global-hook', () => !!uiohook);
