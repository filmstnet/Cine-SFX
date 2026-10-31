const { app, BrowserWindow, ipcMain, dialog, shell, protocol, net } = require('electron');
const path = require('path');
const fs = require('fs');
const { pathToFileURL } = require('url');
const { scanDirectory, CATEGORY_RULES } = require('./scanner.cjs');

let mainWindow = null;
const isDev = process.argv.includes('--dev') || process.env.VITE_DEV === '1';
const CACHE_FILE = path.join(app.getPath('userData'), 'sfx-library-cache.json');

// Scheme registration must occur before app is ready
protocol.registerSchemesAsPrivileged([
  {
    scheme: 'sfx-file',
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      bypassCSP: true,
      stream: true
    }
  }
]);

function createWindow() {
  const iconPath = path.join(__dirname, '../public/icon.png');
  
  if (process.platform === 'darwin' && app.dock && fs.existsSync(iconPath)) {
    try {
      app.dock.setIcon(iconPath);
    } catch (e) {
      // ignore
    }
  }

  mainWindow = new BrowserWindow({
    title: 'FilmSt - Sfx',
    icon: iconPath,
    width: 1140,
    height: 740,
    minWidth: 420,
    minHeight: 480,
    backgroundColor: '#000000',
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 14, y: 14 },
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: false // allow local audio playback seamlessly
    }
  });

  if (isDev) {
    const devUrl = 'http://localhost:3000';
    mainWindow.loadURL(devUrl).catch(() => {
      // Retry in case Vite dev server is still booting
      setTimeout(() => mainWindow.loadURL(devUrl), 1000);
    });
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  mainWindow.once('ready-to-show', () => {
    // Check for update quietly in background 3 seconds after launch
    setTimeout(async () => {
      try {
        if (mainWindow && !mainWindow.isDestroyed()) {
          const res = await checkUpdatesInternal();
          if (res && res.hasUpdate) {
            mainWindow.webContents.send('update:available', res);
          }
        }
      } catch (e) {}
    }, 3000);
  });
}

app.whenReady().then(() => {
  // Setup custom protocol for streaming local audio files
  protocol.handle('sfx-file', (request) => {
    try {
      let rawUrl = request.url.replace(/^sfx-file:\/\//, '');
      let filePath = decodeURIComponent(rawUrl);
      if (process.platform !== 'win32' && !filePath.startsWith('/')) {
        filePath = '/' + filePath;
      }
      return net.fetch(pathToFileURL(filePath).toString());
    } catch (err) {
      console.error('Error streaming audio via sfx-file:', err);
      return new Response('Error loading file', { status: 500 });
    }
  });

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// --- IPC HANDLERS ---

// Select folder dialog
ipcMain.handle('dialog:select-folder', async () => {
  if (!mainWindow) return null;
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory'],
    title: 'Chọn thư mục chứa Sound Effects (SFX)'
  });
  if (result.canceled || result.filePaths.length === 0) {
    return null;
  }
  return result.filePaths[0];
});

// Scan folder
ipcMain.handle('scanner:scan-folder', async (event, dirPath) => {
  if (!dirPath || !fs.existsSync(dirPath)) return [];
  try {
    const items = scanDirectory(dirPath, 6000);
    return items;
  } catch (err) {
    console.error('Scan error:', err);
    return [];
  }
});

// Cache management
ipcMain.handle('cache:get-library', async () => {
  try {
    if (fs.existsSync(CACHE_FILE)) {
      const data = fs.readFileSync(CACHE_FILE, 'utf8');
      const parsed = JSON.parse(data);
      if (parsed && parsed.sounds && parsed.sounds.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Failed to load cache:', e);
  }

  // If no custom folder cached yet, automatically provide starter pack with real files on disk
  try {
    const defaultDemoDir = path.resolve(__dirname, '../demo-sfx');
    if (fs.existsSync(defaultDemoDir)) {
      const starterSounds = scanDirectory(defaultDemoDir, 100);
      return {
        libraryPath: defaultDemoDir,
        sounds: starterSounds
      };
    }
  } catch (err) {
    console.error('Failed to load starter pack:', err);
  }

  return null;
});

ipcMain.handle('cache:save-library', async (event, data) => {
  try {
    fs.mkdirSync(path.dirname(CACHE_FILE), { recursive: true });
    fs.writeFileSync(CACHE_FILE, JSON.stringify(data), 'utf8');
    return true;
  } catch (e) {
    console.error('Failed to save cache:', e);
    return false;
  }
});

// Native OS Drag & Drop to NLE Timeline (DaVinci Resolve / Premiere Pro / Final Cut Pro / CapCut)
ipcMain.on('drag:start', (event, filePath) => {
  try {
    if (!filePath) return;
    const absPath = path.isAbsolute(filePath) ? filePath : path.resolve(filePath);
    if (!fs.existsSync(absPath)) {
      console.warn('[Drag] File does not exist on disk:', absPath);
      return;
    }

    const iconPath = path.join(__dirname, 'drag-icon.png');
    const fallbackIcon = path.join(__dirname, '../public/icon.png');
    const finalIcon = fs.existsSync(iconPath) ? iconPath : fallbackIcon;

    event.sender.startDrag({
      file: absPath,
      icon: finalIcon
    });
  } catch (err) {
    console.error('Error starting native drag:', err);
  }
});

// Reveal in Finder
ipcMain.handle('shell:show-item', (event, filePath) => {
  if (!filePath) return false;
  const absPath = path.isAbsolute(filePath) ? filePath : path.resolve(filePath);
  if (fs.existsSync(absPath)) {
    shell.showItemInFolder(absPath);
    return true;
  }
  return false;
});

// Permanent file deletion from hard disk (unlinks completely)
ipcMain.handle('file:delete-permanently', async (event, filePath) => {
  try {
    if (!filePath) {
      return { success: false, error: 'Đường dẫn file không hợp lệ.' };
    }
    const absPath = path.isAbsolute(filePath) ? filePath : path.resolve(filePath);
    if (!fs.existsSync(absPath)) {
      return { success: false, error: 'File không tồn tại trên ổ cứng: ' + absPath };
    }

    await fs.promises.unlink(absPath);
    console.log('[Delete] File permanently deleted from disk:', absPath);

    return { success: true, filePath: absPath };
  } catch (err) {
    console.error('[Delete] Failed to delete file from disk:', filePath, err);
    return {
      success: false,
      error: err.message || 'Không thể xóa file do hạn chế quyền truy cập hoặc file đang được sử dụng.'
    };
  }
});

// Read audio file buffer directly (fast, zero protocol overhead)
ipcMain.handle('audio:read-file-buffer', async (event, filePath) => {
  try {
    if (!filePath) return null;
    const absPath = path.isAbsolute(filePath) ? filePath : path.resolve(filePath);
    if (!fs.existsSync(absPath)) {
      console.warn('Audio file not found on disk:', absPath);
      return null;
    }
    const buf = await fs.promises.readFile(absPath);
    return new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength);
  } catch (err) {
    console.error('Failed to read audio file buffer:', filePath, err);
    return null;
  }
});

// Always on top toggle
ipcMain.handle('window:toggle-always-on-top', () => {
  if (!mainWindow) return false;
  const newState = !mainWindow.isAlwaysOnTop();
  mainWindow.setAlwaysOnTop(newState, 'floating');
  return newState;
});

ipcMain.handle('window:get-always-on-top', () => {
  return mainWindow ? mainWindow.isAlwaysOnTop() : false;
});

// Mini mode toggle
ipcMain.handle('window:set-mini-mode', (event, enable) => {
  if (!mainWindow) return false;
  if (enable) {
    mainWindow.setSize(440, 680);
    mainWindow.setAlwaysOnTop(true, 'floating');
  } else {
    mainWindow.setSize(1140, 740);
  }
  return enable;
});

// --- GITHUB RELEASES & UPDATE CHECKER ---
function compareVersions(v1, v2) {
  const p1 = (v1 || '').replace(/^v/, '').split('.').map(n => parseInt(n, 10) || 0);
  const p2 = (v2 || '').replace(/^v/, '').split('.').map(n => parseInt(n, 10) || 0);
  for (let i = 0; i < Math.max(p1.length, p2.length); i++) {
    const num1 = p1[i] || 0;
    const num2 = p2[i] || 0;
    if (num2 > num1) return 1; // v2 is newer
    if (num2 < num1) return -1;
  }
  return 0;
}

ipcMain.handle('app:get-version', () => app.getVersion());

ipcMain.handle('shell:open-external', async (event, url) => {
  if (url && (url.startsWith('https://') || url.startsWith('http://'))) {
    await shell.openExternal(url);
    return true;
  }
  return false;
});

async function checkUpdatesInternal(customRepo) {
  const currentVersion = app.getVersion();
  const repo = customRepo || 'filmst-vn/filmst-sfx';
  try {
    const apiUrl = `https://api.github.com/repos/${repo}/releases/latest`;
    const response = await net.fetch(apiUrl, {
      headers: {
        'User-Agent': `FilmSt-Sfx/${currentVersion}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });

    if (!response.ok) {
      if (response.status === 404) {
        return { hasUpdate: false, message: 'Chưa có bản phát hành trên GitHub', currentVersion };
      }
      return { hasUpdate: false, message: `GitHub API status ${response.status}`, currentVersion };
    }

    const data = await response.json();
    const latestVersion = (data.tag_name || '').replace(/^v/, '');
    const isNewer = compareVersions(currentVersion, latestVersion) > 0;

    return {
      hasUpdate: isNewer,
      currentVersion,
      latestVersion,
      releaseName: data.name || data.tag_name,
      releaseNotes: data.body || '',
      releaseUrl: data.html_url || `https://github.com/${repo}/releases`,
      publishedAt: data.published_at
    };
  } catch (err) {
    return { hasUpdate: false, error: err.message, currentVersion };
  }
}

ipcMain.handle('app:check-for-updates', async (event, customRepo) => {
  return await checkUpdatesInternal(customRepo);
});
