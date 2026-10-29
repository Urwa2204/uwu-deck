import { _electron as electron, expect, test, ElectronApplication, Page } from '@playwright/test'
import { mkdtempSync, rmSync } from 'fs'
import { tmpdir } from 'os'
import path from 'path'

let userData = ''
test.beforeAll(() => {
  userData = mkdtempSync(path.join(tmpdir(), 'uwu-deck-e2e-'))
})
test.afterAll(() => rmSync(userData, { recursive: true, force: true }))

async function launch(): Promise<{ app: ElectronApplication; page: Page }> {
  const env = { ...process.env, UWU_DECK_USER_DATA: userData } as Record<string, string>
  delete env.ELECTRON_RENDERER_URL
  const app = await electron.launch({ args: ['.'], env })
  const page = await app.firstWindow()
  await page.waitForSelector('.shell')
  return { app, page }
}

test.describe.configure({ mode: 'serial' })

test('renderer has no Node access and exposes only the expected bridge', async () => {
  const { app, page } = await launch()
  const info = await page.evaluate(() => {
    const w = window as unknown as Record<string, unknown>
    return { require: typeof w.require, process: typeof w.process, keys: Object.keys(w.deck as object).sort() }
  })
  expect(info.require).toBe('undefined')
  expect(info.process).toBe('undefined')
  expect(info.keys).toEqual(['audio', 'exportData', 'importData', 'load', 'onFlush', 'openExternal', 'save', 'system', 'win'])
  await app.close()
})

test('a task survives restarting the app', async () => {
  const first = await launch()
  await first.page.getByLabel('New task').fill('Persist me')
  await first.page.getByLabel('New task').press('Enter')
  await expect(first.page.getByText('Persist me')).toBeVisible()
  await first.app.close()

  const second = await launch()
  await expect(second.page.getByText('Persist me')).toBeVisible()
  await second.app.close()
})

test('system monitor shows real percentages', async () => {
  const { app, page } = await launch()
  await expect(page.locator('.w-system .gauge strong').first()).toHaveText(/^\d+%$/, { timeout: 20_000 })
  await app.close()
})

test('music shortcuts reject non-YouTube links', async () => {
  const { app, page } = await launch()
  await page.getByLabel('Shortcut name').fill('Bad')
  await page.getByLabel('Shortcut link').fill('https://example.com/x')
  await page.getByRole('button', { name: 'Add shortcut' }).click()
  await expect(page.getByRole('alert')).toContainText('youtube.com')
  await app.close()
})

test('window controls work', async () => {
  const { app, page } = await launch()
  await page.getByRole('button', { name: 'Maximize' }).click()
  await expect(page.getByRole('button', { name: 'Restore' })).toBeVisible()
  await app.close()
})
