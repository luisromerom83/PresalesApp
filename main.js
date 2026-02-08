const { app, BrowserWindow, ipcMain, dialog, shell, session } = require('electron');
const path = require('path');
const fs = require('fs');
const { autoUpdater } = require('electron-updater');

if (require('electron-squirrel-startup')) return app.quit();

// Configure autoUpdater
autoUpdater.autoDownload = true;
autoUpdater.autoInstallOnAppQuit = true;

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
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
    app.setAppUserModelId('com.presales.configmanager');
  }

  const { session } = require('electron');

  // Intercept headers to allow framing of Microsoft To-Do and login pages
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    const headers = details.responseHeaders;
    const url = details.url.toLowerCase();

    // Domains involved in To-Do and Microsoft Login
    const targetDomains = [
      'to-do.office.com',
      'login.microsoftonline.com',
      'login.live.com',
      'account.microsoft.com'
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
  autoUpdater.on('update-available', () => {
    if (mainWindow) mainWindow.webContents.send('update-available');
  });

  autoUpdater.on('update-downloaded', () => {
    if (mainWindow) mainWindow.webContents.send('update-downloaded');
  });

  autoUpdater.on('error', (err) => {
    console.error('Update error:', err);
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

ipcMain.handle('save-settings', (event, settings) => {
  fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
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

