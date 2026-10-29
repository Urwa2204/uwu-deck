import {
  app,
  BrowserWindow,
  Tray,
  Menu,
  ipcMain,
  shell,
  globalShortcut,
  screen,
  session,
  nativeImage,
  protocol,
  net,
  IpcMainEvent,
  IpcMainInvokeEvent
} from 'electron'
import path from 'path'
import { pathToFileURL } from 'url'
import icon from '../../resources/icon.png?asset'
import { isDataKey, load, save, exportData, importData, readBounds, writeBounds } from './store'
import { getSnapshot } from './system'
import { addTracks, listTracks, removeTrack, resolveTrackPath } from './audio'
import { isAllowedMusicUrl } from '../shared/urls'

// Tests run against a throwaway data folder so they never touch real user data.
if (process.env.UWU_DECK_USER_DATA) app.setPath('userData', process.env.UWU_DECK_USER_DATA)

// Local audio is served through a private scheme that only accepts opaque track ids.
protocol.registerSchemesAsPrivileged([
  { scheme: 'uwu-media', privileges: { standard: true, secure: true, stream: true, supportFetchAPI: true } }
])

const TOGGLE_SHORTCUT = 'CommandOrControl+Alt+D'
const devUrl = process.env['ELECTRON_RENDERER_URL']

let win: BrowserWindow | null = null
let tray: Tray | null = null
let quitting = false
let flushDone = false
let minimizeToTray = true

function applySettings(s: Record<string, unknown>): void {
  minimizeToTray = s.minimizeToTray !== false
  win?.setAlwaysOnTop(s.alwaysOnTop === true)
  if (app.isPackaged) app.setLoginItemSettings({ openAtLogin: s.launchAtLogin === true })
}

function openSafely(url: string): boolean {
  if (!isAllowedMusicUrl(url)) return false
  void shell.openExternal(url)
  return true
}

function trusted(e: IpcMainEvent | IpcMainInvokeEvent): boolean {
  return win !== null && !win.isDestroyed() && e.sender === win.webContents
}

function toggleWindow(): void {
  if (!win) return
  if (win.isVisible() && win.isFocused()) win.hide()
  else {
    win.show()
    win.focus()
  }
}

async function persistBounds(): Promise<void> {
  if (!win || win.isDestroyed()) return
  const maximized = win.isMaximized()
  const b = win.getNormalBounds()
  await writeBounds({ ...b, maximized })
}

async function createWindow(): Promise<void> {
  const saved = await readBounds()
  let position: { x?: number; y?: number } = {}
  if (saved && saved.x !== undefined && saved.y !== undefined) {
    const visible = screen
      .getAllDisplays()
      .some(
        (d) =>
          saved.x! < d.bounds.x + d.bounds.width - 40 &&
          saved.x! + saved.width > d.bounds.x + 40 &&
          saved.y! >= d.bounds.y &&
          saved.y! < d.bounds.y + d.bounds.height - 40
      )
    if (visible) position = { x: saved.x, y: saved.y }
  }

  win = new BrowserWindow({
    width: saved?.width ?? 1360,
    height: saved?.height ?? 860,
    ...position,
    minWidth: 900,
    minHeight: 600,
    show: false,
    frame: false,
    backgroundColor: '#171310',
    title: 'uwu-deck',
    icon,
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true
    }
  })

  win.once('ready-to-show', () => {
    if (saved?.maximized) win?.maximize()
    win?.show()
  })
  win.on('maximize', () => win?.webContents.send('win:maximized', true))
  win.on('unmaximize', () => win?.webContents.send('win:maximized', false))
  win.on('close', (e) => {
    void persistBounds()
    if (quitting) return
    e.preventDefault()
    if (minimizeToTray) win?.hide()
    else app.quit()
  })

  // Navigation lock-down: the window may only ever show our own UI; links go to the browser.
  win.webContents.setWindowOpenHandler(({ url }) => {
    openSafely(url)
    return { action: 'deny' }
  })
  win.webContents.on('will-navigate', (e, url) => {
    const own = (devUrl && url.startsWith(devUrl)) || url === win?.webContents.getURL()
    if (!own) e.preventDefault()
  })

  if (!app.isPackaged && devUrl) await win.loadURL(devUrl)
  else await win.loadFile(path.join(__dirname, '../renderer/index.html'))
}

function createTray(): void {
  tray = new Tray(nativeImage.createFromPath(icon).resize({ width: 16, height: 16 }))
  tray.setToolTip('uwu-deck')
  tray.setContextMenu(
    Menu.buildFromTemplate([
      { label: 'Show / hide uwu-deck', click: toggleWindow },
      { type: 'separator' },
      { label: 'Quit', click: () => app.quit() }
    ])
  )
  tray.on('click', toggleWindow)
}

function registerIpc(): void {
  ipcMain.handle('data:load', async (e, key: unknown) => {
    if (!trusted(e) || !isDataKey(key)) throw new Error('Invalid request')
    return load(key)
  })
  ipcMain.handle('data:save', async (e, key: unknown, value: unknown) => {
    if (!trusted(e) || !isDataKey(key)) throw new Error('Invalid request')
    await save(key, value)
    if (key === 'settings') applySettings(value as Record<string, unknown>)
  })
  ipcMain.handle('system:snapshot', (e) => {
    if (!trusted(e)) throw new Error('Invalid request')
    return getSnapshot()
  })
  ipcMain.handle('shell:open', (e, url: unknown) => trusted(e) && typeof url === 'string' && openSafely(url))
  ipcMain.handle('data:export', (e) => {
    if (!trusted(e)) throw new Error('Invalid request')
    return exportData(win)
  })
  ipcMain.handle('data:import', (e) => {
    if (!trusted(e)) throw new Error('Invalid request')
    return importData(win)
  })
  ipcMain.handle('audio:list', (e) => {
    if (!trusted(e)) throw new Error('Invalid request')
    return listTracks()
  })
  ipcMain.handle('audio:add', (e) => {
    if (!trusted(e)) throw new Error('Invalid request')
    return addTracks(win)
  })
  ipcMain.handle('audio:remove', (e, id: unknown) => {
    if (!trusted(e)) throw new Error('Invalid request')
    return removeTrack(id)
  })
  ipcMain.handle('win:is-maximized', (e) => trusted(e) && !!win?.isMaximized())
  ipcMain.on('win:minimize', (e) => {
    if (trusted(e)) win?.minimize()
  })
  ipcMain.on('win:toggle-maximize', (e) => {
    if (!trusted(e) || !win) return
    if (win.isMaximized()) win.unmaximize()
    else win.maximize()
  })
  ipcMain.on('win:close', (e) => {
    if (trusted(e)) win?.close()
  })
}

if (!app.requestSingleInstanceLock()) {
  app.quit()
} else {
  app.on('second-instance', () => {
    win?.show()
    win?.focus()
  })

  app.whenReady().then(async () => {
    // Only desktop notifications may be requested by the page.
    session.defaultSession.setPermissionRequestHandler((_wc, permission, cb) =>
      cb(permission === 'notifications')
    )
    protocol.handle('uwu-media', async (request) => {
      const id = new URL(request.url).hostname
      const filePath = await resolveTrackPath(id)
      if (!filePath) return new Response('Not found', { status: 404 })
      const range = request.headers.get('range')
      return net.fetch(pathToFileURL(filePath).toString(), range ? { headers: { range } } : undefined)
    })
    registerIpc()
    await createWindow()
    createTray()
    globalShortcut.register(TOGGLE_SHORTCUT, toggleWindow)
    const settings = await load('settings').catch(() => null)
    if (settings) applySettings(settings as Record<string, unknown>)
  })

  // Ask the renderer to flush pending autosaves once before quitting.
  app.on('before-quit', (e) => {
    if (flushDone || !win || win.isDestroyed()) {
      quitting = true
      return
    }
    e.preventDefault()
    flushDone = true
    const finish = (): void => {
      quitting = true
      app.quit()
    }
    ipcMain.once('app:flushed', finish)
    setTimeout(finish, 1500)
    win.webContents.send('app:flush')
  })

  app.on('will-quit', () => globalShortcut.unregisterAll())
  app.on('window-all-closed', () => app.quit())
}
