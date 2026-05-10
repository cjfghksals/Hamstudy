const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  setOverlay:         (enabled) => ipcRenderer.send('set-overlay', enabled),
  minimize:           ()        => ipcRenderer.send('minimize-app'),
  close:              ()        => ipcRenderer.send('close-app'),
  onOverlayChanged:   (cb) => ipcRenderer.on('overlay-changed',   (_, val) => cb(val)),
  resizeBy:           (dx, dy)  => ipcRenderer.send('resize-by', { dx, dy }),
  setWidth:           (width)   => ipcRenderer.send('set-width', { width }),
  setAspectRatio:     (ratio, extra) => ipcRenderer.send('set-aspect-ratio', { ratio, extra }),

  // 전역 입력 이벤트
  onGlobalKeydown:    (cb) => ipcRenderer.on('global-keydown',   (_, key) => cb(key)),
  onGlobalMousemove:  (cb) => ipcRenderer.on('global-mousemove', (_, pos) => cb(pos)),
  onGlobalMousedown:  (cb) => ipcRenderer.on('global-mousedown', ()      => cb()),
  hasGlobalHook:      ()        => ipcRenderer.invoke('has-global-hook'),
});
