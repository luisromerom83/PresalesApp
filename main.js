const { app, BrowserWindow, ipcMain, dialog, shell, session, nativeImage } = require('electron');
const path = require('path');
const fs = require('fs');
const { autoUpdater } = require('electron-updater');

if (require('electron-squirrel-startup')) return app.quit();

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

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    title: "Presales LatinTool",
    icon: appIcon,
    frame: true, // Standard window frame
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      webviewTag: true, // Enable webview tag
    }
  });

  mainWindow.loadFile('index.html');
}

app.whenReady().then(() => {
  // Set App ID for Windows search and shortcuts
  if (process.platform === 'win32') {
    app.setAppUserModelId('com.presales.manager');
  }

  // Intercept headers to allow framing of Microsoft To-Do and login pages
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    const headers = details.responseHeaders;
    const url = details.url.toLowerCase();

    // Domains involved in To-Do and Microsoft Login
    const targetDomains = [
      'to-do.office.com',
      'outlook.office.com',
      'outlook.live.com',
      'login.microsoftonline.com',
      'login.live.com',
      'account.microsoft.com',
      'quadientcloud.com',
      'quadientcloud.eu'
    ];

    if (targetDomains.some(domain => url.includes(domain))) {
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

  createWindow();

  // Auto-Update Events
  autoUpdater.on('update-available', (info) => {
    if (mainWindow) mainWindow.webContents.send('update-available', info);
  });

  autoUpdater.on('update-downloaded', (info) => {
    if (mainWindow) mainWindow.webContents.send('update-downloaded', info);
  });

  autoUpdater.on('download-progress', (progressObj) => {
    if (mainWindow) mainWindow.webContents.send('update-progress', progressObj);
  });

  autoUpdater.on('error', (err) => {
    console.error('Update error:', err);
    if (mainWindow) mainWindow.webContents.send('update-error', err.message);
  });

  // Check for updates
  autoUpdater.checkForUpdatesAndNotify();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
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
  if (url) {
    await shell.openExternal(url);
    return { success: true };
  }
  return { success: false };
});

ipcMain.handle('save-file', async (event, { directory, filename, data }) => {


  try {
    const filePath = path.join(directory, filename);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('load-file', async (event, { directory, filename }) => {
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

ipcMain.handle('get-app-version', () => {
  return app.getVersion();
});

ipcMain.handle('download-update', () => {
  autoUpdater.downloadUpdate();
});

ipcMain.handle('install-update', () => {
  autoUpdater.quitAndInstall();
});

