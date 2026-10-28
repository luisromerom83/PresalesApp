const { app, BrowserWindow, ipcMain, dialog, shell, session, nativeImage, Menu } = require('electron');
app.disableHardwareAcceleration();
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const { autoUpdater } = require('electron-updater');

if (require('electron-squirrel-startup')) return app.quit();

// Linux display compatibility (Wayland / X11 fractional scaling & window decorations)
if (process.platform === 'linux') {
  app.commandLine.appendSwitch('ozone-platform-hint', 'auto');
  app.commandLine.appendSwitch('enable-features', 'WaylandWindowDecorations');
}

// Force Spanish locale for date formats
app.commandLine.appendSwitch('lang', 'es-MX');
app.commandLine.appendSwitch('accept-languages', 'es-MX');

// Configure autoUpdater
autoUpdater.autoDownload = false; // Manual download
autoUpdater.autoInstallOnAppQuit = true;

let mainWindow;

function createWindow() {
  const iconPath = path.join(__dirname, 'assets', 'logo_shield.png');
  const appIcon = nativeImage.createFromPath(iconPath);

  // Disable default menu to prevent GTK menubar height offset on Linux
  Menu.setApplicationMenu(null);

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    title: "Presales Integrity Ledger",
    icon: appIcon,
    frame: true, // Standard window frame
    autoHideMenuBar: true,
    useContentSize: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      webviewTag: true, // Enable webview tag
    }
  });

  mainWindow.loadFile('index.html');

  mainWindow.webContents.on('console-message', (event, level, message, line, sourceId) => {
    console.log(`[Renderer] line ${line}: ${message}`);
  });
}

app.whenReady().then(() => {
  // Set App ID for Windows search and shortcuts
  if (process.platform === 'win32') {
    app.setAppUserModelId('com.presales.manager');
  }

  // Intercept headers to allow framing of Microsoft To-Do and login pages
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    const headers = details.responseHeaders;
    let hostname = '';
    try {
      hostname = new URL(details.url).hostname.toLowerCase();
    } catch (e) { /* non-standard URL, leave headers untouched */ }

    // Domains involved in To-Do and Microsoft Login
    const targetDomains = [
      'to-do.office.com',
      'outlook.office.com',
      'outlook.live.com',
      'login.microsoftonline.com',
      'login.live.com',
      'account.microsoft.com',
      'quadientcloud.com',
      'quadientcloud.eu',
      'spiff.com'
    ];

    if (targetDomains.some(domain => hostname === domain || hostname.endsWith('.' + domain))) {
      Object.keys(headers).forEach(header => {
        const lowerHeader = header.toLowerCase();
        if (
          lowerHeader === 'content-security-policy' ||
          lowerHeader === 'content-security-policy-report-only' ||
          lowerHeader === 'x-frame-options'
        ) {
          delete headers[header];
        }
      });
    }

    callback({ responseHeaders: headers });
  });

  const log = require('electron-log');
  autoUpdater.logger = log;
  autoUpdater.logger.transports.file.level = 'info';

  createWindow();

  // Auto-Update Events
  autoUpdater.autoDownload = false; // We will trigger download manually

  autoUpdater.on('update-available', (info) => {
    console.log('Update available:', info.version);
    if (mainWindow) mainWindow.webContents.send('update-available', info);
  });

  autoUpdater.on('update-downloaded', (info) => {
    console.log('Update downloaded:', info.version);
    if (mainWindow) mainWindow.webContents.send('update-downloaded', info);
  });

  autoUpdater.on('download-progress', (progressObj) => {
    if (mainWindow) mainWindow.webContents.send('update-progress', progressObj);
  });

  autoUpdater.on('error', (err) => {
    // Ignore 404 errors for latest-linux.yml on Linux
    if (process.platform === 'linux' && err.message.includes('latest-linux.yml')) {
      console.log('Update info not found on GitHub for Linux. Skipping update check.');
      return;
    }
    console.error('Update error:', err);
    if (mainWindow) mainWindow.webContents.send('update-error', err.message);
  });

  // Check for updates
  console.log('Update system: checking if platform is supported...', process.platform);
  // Relaxed check for testing, but added warning for Linux
  if (process.platform === 'linux') {
    console.log('Update system: Running on Linux. Auto-update for AppImage requires system integration.');
  }
  
  autoUpdater.checkForUpdatesAndNotify().catch(err => {
    console.error('Initial update check failed:', err);
  });

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Security: lock down embedded webviews (To-Do, Calendar, SPIFF) and keep the main window on local files
const ALLOWED_WEBVIEW_HOSTS = ['to-do.office.com', 'outlook.office.com', 'spiff.com'];

const isHostAllowed = (url, hosts) => {
  try {
    const { protocol, hostname } = new URL(url);
    return protocol === 'https:' && hosts.some(h => hostname === h || hostname.endsWith('.' + h));
  } catch (e) {
    return false;
  }
};

const isWebUrl = (url) => {
  try {
    return ['http:', 'https:', 'mailto:'].includes(new URL(url).protocol);
  } catch (e) {
    return false;
  }
};

app.on('web-contents-created', (event, contents) => {
  contents.on('will-attach-webview', (e, webPreferences, params) => {
    delete webPreferences.preload;
    webPreferences.nodeIntegration = false;
    webPreferences.contextIsolation = true;
    if (!isHostAllowed(params.src, ALLOWED_WEBVIEW_HOSTS)) {
      console.warn('Blocked webview with src:', params.src);
      e.preventDefault();
    }
  });

  // Popups (main window or webviews) open in the system browser instead of new Electron windows
  contents.setWindowOpenHandler(({ url }) => {
    if (contents.getType() === 'window' && url.startsWith('file://')) {
      return { action: 'allow' }; // help.html
    }
    if (isWebUrl(url)) shell.openExternal(url);
    return { action: 'deny' };
  });

  if (contents.getType() === 'window') {
    contents.on('will-navigate', (e, url) => {
      if (url.startsWith('file://')) return;
      e.preventDefault();
      if (isWebUrl(url)) shell.openExternal(url); // plain links open in the system browser
    });
  }
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

// IPC Handlers
ipcMain.handle('check-directory', async (event, dir) => {
  try {
    if (!dir || !fs.existsSync(dir)) return { exists: false, empty: true };
    const files = fs.readdirSync(dir);
    // Consider empty if no json files exist (our data files)
    const hasData = files.some(f => f.endsWith('.json'));
    return { exists: true, empty: !hasData };
  } catch (error) {
    return { exists: false, empty: true };
  }
});

ipcMain.handle('select-directory', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory']
  });
  if (result.canceled) {
    return null;
  } else {
    return result.filePaths[0];
  }
});

const settingsPath = path.join(app.getPath('userData'), 'settings.json');

ipcMain.handle('get-settings', () => {
  if (fs.existsSync(settingsPath)) {
    return JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
  }
  return {};
});

ipcMain.handle('save-settings', (event, newSettings) => {
  let existingSettings = {};
  if (fs.existsSync(settingsPath)) {
    existingSettings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
  }
  const mergedSettings = { ...existingSettings, ...newSettings };
  fs.writeFileSync(settingsPath, JSON.stringify(mergedSettings, null, 2));
  return { success: true };
});

ipcMain.handle('copy-file-to-dir', async (event, { sourcePath, destDir }) => {
  try {
    const fileName = path.basename(sourcePath);
    const destPath = path.join(destDir, fileName);
    fs.copyFileSync(sourcePath, destPath);
    return { success: true, fileName };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('migrate-files', async (event, { sourceDir, destDir }) => {
  try {
    if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });

    const files = fs.readdirSync(sourceDir);
    const relevantFiles = files.filter(f => f.endsWith('.json') || f.endsWith('.csv'));

    relevantFiles.forEach(file => {
      fs.copyFileSync(path.join(sourceDir, file), path.join(destDir, file));
    });

    return { success: true, count: relevantFiles.length };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('open-external-url', async (event, url) => {
  if (!url || !isWebUrl(url)) return { success: false };

  let browserPath = '';
  try {
    if (fs.existsSync(settingsPath)) {
      browserPath = (JSON.parse(fs.readFileSync(settingsPath, 'utf8')).browserPath || '').trim();
    }
  } catch (e) {
    console.error("Error reading settings for browser path:", e);
  }

  if (browserPath) {
    // No shell: a full path is used as-is (may contain spaces), otherwise "command --args" is split on whitespace
    const [command, ...args] = fs.existsSync(browserPath) ? [browserPath] : browserPath.split(/\s+/);
    const child = spawn(command, [...args, url], { detached: true, stdio: 'ignore' });
    child.on('error', (error) => {
      console.error(`Error opening with custom browser (${process.platform}): ${error}`);
      shell.openExternal(url); // Fallback to default
    });
    child.unref();
    return { success: true };
  }

  await shell.openExternal(url);
  return { success: true };
});

const isPlainFileName = (name) => typeof name === 'string' && name === path.basename(name) && name !== '..';

ipcMain.handle('save-file', async (event, { directory, filename, data }) => {
  if (!isPlainFileName(filename)) return { success: false, error: 'Invalid file name' };
  try {
    const filePath = path.join(directory, filename);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('load-file', async (event, { directory, filename }) => {
  if (!isPlainFileName(filename)) return null;
  try {
    const filePath = path.join(directory, filename);
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(data);
    }
    return null;
  } catch (error) {
    return null;
  }
});

ipcMain.handle('select-image', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: [
      { name: 'Images', extensions: ['jpg', 'png', 'gif', 'webp', 'svg'] }
    ]
  });
  if (result.canceled) {
    return null;
  } else {
    const filePath = result.filePaths[0];
    const fileName = path.basename(filePath);
    // Return base64 for simplicity in this version, or path if needed
    const data = fs.readFileSync(filePath);
    const base64 = data.toString('base64');
    const mimeType = `image/${path.extname(filePath).slice(1)}`;
    return `data:${mimeType};base64,${base64}`;
  }
});

ipcMain.handle('get-app-version', () => {
  return app.getVersion();
});

ipcMain.handle('download-update', async () => {
  console.log('IPC: download-update triggered');
  try {
    const result = await autoUpdater.downloadUpdate();
    console.log('Update download started successfully:', result);
    return result;
  } catch (err) {
    console.error('Update download initiation failed:', err);
    if (mainWindow) mainWindow.webContents.send('update-error', `Error al iniciar descarga: ${err.message}`);
    throw err;
  }
});

ipcMain.handle('install-update', async () => {
  console.log('IPC: install-update triggered');
  try {
    autoUpdater.quitAndInstall();
    return { success: true };
  } catch (err) {
    console.error('Install failed:', err);
    if (mainWindow) mainWindow.webContents.send('update-error', `Error al instalar: ${err.message}`);
    throw err;
  }
});

ipcMain.handle('list-files', async (event, dir) => {
  try {
    if (!fs.existsSync(dir)) return [];
    const files = fs.readdirSync(dir, { withFileTypes: true });
    return files.map(f => ({
      name: f.name,
      isDirectory: f.isDirectory(),
      size: f.isFile() ? fs.statSync(path.join(dir, f.name)).size : 0,
      mtime: fs.statSync(path.join(dir, f.name)).mtime
    }));
  } catch (error) {
    return [];
  }
});

ipcMain.handle('open-path', async (event, fullPath) => {
  if (fs.existsSync(fullPath)) {
    shell.openPath(fullPath);
    return { success: true };
  }
  return { success: false, error: 'Path not found' };
});

ipcMain.handle('notify', (event, { title, body }) => {
  const { Notification } = require('electron');
  new Notification({ title, body }).show();
});
