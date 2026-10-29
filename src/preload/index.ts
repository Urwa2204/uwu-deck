import { contextBridge, ipcRenderer } from 'electron'
import type { DeckApi } from '../shared/api'

// Only narrow, named functions are exposed. ipcRenderer itself is never handed to the page.
const api: DeckApi = {
  load: (key) => ipcRenderer.invoke('data:load', key),
  save: (key, value) => ipcRenderer.invoke('data:save', key, value),
  system: () => ipcRenderer.invoke('system:snapshot'),
  openExternal: (url) => ipcRenderer.invoke('shell:open', url),
  exportData: () => ipcRenderer.invoke('data:export'),
  importData: () => ipcRenderer.invoke('data:import'),
  audio: {
    list: () => ipcRenderer.invoke('audio:list'),
    add: () => ipcRenderer.invoke('audio:add'),
    remove: (id) => ipcRenderer.invoke('audio:remove', id)
  },
  onFlush: (cb) => {
    ipcRenderer.on('app:flush', () => {
      Promise.resolve(cb()).finally(() => ipcRenderer.send('app:flushed'))
    })
  },
  win: {
    minimize: () => ipcRenderer.send('win:minimize'),
    toggleMaximize: () => ipcRenderer.send('win:toggle-maximize'),
    close: () => ipcRenderer.send('win:close'),
    isMaximized: () => ipcRenderer.invoke('win:is-maximized'),
    onMaximizeChange: (cb) => {
      ipcRenderer.on('win:maximized', (_e, value: boolean) => cb(value === true))
    }
  }
}

contextBridge.exposeInMainWorld('deck', api)
