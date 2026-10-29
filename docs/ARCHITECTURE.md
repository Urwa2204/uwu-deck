# Architecture notes

Data flow: widget → `usePersisted` (state + 300 ms debounce) → `window.deck.save(key, value)` → preload → `ipcMain.handle('data:save')` → `validate()` → atomic JSON write.

Adding a new persisted data type: add the key to `DATA_KEYS` (`src/shared/api.ts`), add a validator branch in `src/main/store.ts`, then call `usePersisted('<key>', fallback)` in the renderer.

Adding a widget: create `src/renderer/src/widgets/<Name>.tsx`, add its id to `WidgetId`, `ALL_WIDGETS` and `WIDGET_LABELS` in `types.ts`, and register it in the `widgets` map in `App.tsx`.
