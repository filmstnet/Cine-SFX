const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  selectFolder: () => ipcRenderer.invoke('dialog:select-folder'),
  scanFolder: (dirPath) => ipcRenderer.invoke('scanner:scan-folder', dirPath),
  getCachedLibrary: () => ipcRenderer.invoke('cache:get-library'),
  saveLibraryCache: (data) => ipcRenderer.invoke('cache:save-library', data),
  startDrag: (filePath) => ipcRenderer.send('drag:start', filePath),
  showInFolder: (filePath) => ipcRenderer.invoke('shell:show-item', filePath),
  toggleAlwaysOnTop: () => ipcRenderer.invoke('window:toggle-always-on-top'),
  getAlwaysOnTop: () => ipcRenderer.invoke('window:get-always-on-top'),
  setMiniMode: (enable) => ipcRenderer.invoke('window:set-mini-mode', enable),
  readFileBuffer: (filePath) => ipcRenderer.invoke('audio:read-file-buffer', filePath),
  getAudioUrl: (filePath) => `sfx-file://${encodeURIComponent(filePath)}`,
  checkForUpdates: (repo) => ipcRenderer.invoke('app:check-for-updates', repo),
  openExternal: (url) => ipcRenderer.invoke('shell:open-external', url),
  getAppVersion: () => ipcRenderer.invoke('app:get-version'),
  onUpdateAvailable: (callback) => {
    const sub = (event, data) => callback(data);
    ipcRenderer.on('update:available', sub);
    return () => ipcRenderer.removeListener('update:available', sub);
  }
});
