import { expect, test, type Page, type TestInfo } from '@playwright/test'

const dataset = {
  updatedAt: '2026-03-04T10:00:00.000Z',
  stale: false,
  total: 4,
  count: 4,
  items: [
    {
      id: 1,
      temperature: 16,
      time: '2026-03-04T09:00:00+01:00',
      location: {
        name: 'Sørenga',
        urlPath: 'Norge/Oslo/Oslo',
        position: { lat: 59.90, lon: 10.75 },
        region: { name: 'Oslo' },
        subregion: { name: 'Oslo' },
        category: { name: 'Bydel' }
      },
      sourceDisplayName: null,
      emoji: ':)',
      bucket: 'cool'
    },
    {
      id: 2,
      temperature: 9,
      time: '2026-03-02T08:00:00+01:00',
      location: {
        name: 'Kalvøya',
        urlPath: 'Norge/Akershus/Bærum',
        position: { lat: 59.88, lon: 10.52 },
        region: { name: 'Akershus' },
        subregion: { name: 'Bærum' },
        category: { name: 'Øy' }
      },
      sourceDisplayName: null,
      emoji: ':(',
      bucket: 'cold'
    },
    {
      id: 3,
      temperature: 19,
      time: '2026-03-03T12:00:00+01:00',
      location: {
        name: 'Bygdøy',
        urlPath: 'Norge/Oslo/Oslo',
        position: { lat: 59.91, lon: 10.68 },
        region: { name: 'Oslo' },
        subregion: { name: 'Oslo' },
        category: { name: 'Bydel' }
      },
      sourceDisplayName: null,
      emoji: ':D',
      bucket: 'comfortable'
    },
    {
      id: 4,
      temperature: 12,
      time: '2026-03-04T11:30:00+01:00',
      location: {
        name: 'Lade',
        urlPath: 'Norge/Trøndelag/Trondheim',
        position: { lat: 63.44, lon: 10.45 },
        region: { name: 'Trøndelag' },
        subregion: { name: 'Trondheim' },
        category: { name: 'Strand' }
      },
      sourceDisplayName: null,
      emoji: ':|',
      bucket: 'cool'
    }
  ]
}

async function setupApi(
  page: Page,
  options: { failTemperatures?: boolean; temperatureDelayMs?: number; stale?: boolean } = {}
): Promise<void> {
  await page.route('**/api/temperatures', async (route) => {
    if (options.temperatureDelayMs) {
      await new Promise((resolve) => setTimeout(resolve, options.temperatureDelayMs))
    }

    if (options.failTemperatures) {
      await route.fulfill({
        status: 503,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'upstream error' })
      })
      return
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ ...dataset, stale: options.stale ?? false })
    })
  })
}

async function capture(page: Page, testInfo: TestInfo, name: string): Promise<void> {
  const screenshotPath = testInfo.outputPath(`${name}.png`)
  await page.screenshot({ path: screenshotPath, fullPage: true })
  await testInfo.attach(name, { path: screenshotPath, contentType: 'image/png' })
}

const names = (page: Page) => page.locator('.list-row .name')

test('shows loading and then loaded data state', async ({ page }, testInfo) => {
  await setupApi(page, { temperatureDelayMs: 600 })
  const gotoPromise = page.goto('/')

  await expect(page.locator('.status')).toContainText('Laster badeplasser')
  await capture(page, testInfo, 'loading-state')

  await gotoPromise
  await expect(page.locator('.count')).toHaveText('4 badeplasser')
  await expect(names(page).first()).toHaveText('Bygdøy')
  await capture(page, testInfo, 'loaded-state')
})

test('search updates the list and empty state', async ({ page }, testInfo) => {
  await setupApi(page)
  await page.goto('/')

  await page.locator('input#q').pressSequentially('sør', { delay: 150 })
  await expect(page.locator('input#q')).toBeFocused()
  await expect(names(page)).toHaveText(['Sørenga'])
  await capture(page, testInfo, 'search-filtered')

  await page.locator('input#q').fill('bærum')
  await expect(names(page)).toHaveText(['Kalvøya'])

  await page.locator('input#q').fill('trøndelag')
  await expect(names(page)).toHaveText(['Lade'])

  await page.locator('input#q').fill('zzz-not-found')
  await expect(page.locator('.empty')).toContainText('Fant ingen badeplasser')
  await capture(page, testInfo, 'empty-state')
})

test('sort options reorder results', async ({ page }, testInfo) => {
  await setupApi(page)
  await page.goto('/')

  await page.selectOption('select#sort', 'temperature_asc')
  await expect(names(page).first()).toHaveText('Kalvøya')

  await page.selectOption('select#sort', 'name_asc')
  await expect(names(page).first()).toHaveText('Bygdøy')

  await page.selectOption('select#sort', 'newest_desc')
  await expect(names(page).first()).toHaveText('Lade')
  await capture(page, testInfo, 'sorted-newest')
})

test('user can expand a beach for details', async ({ page }, testInfo) => {
  await setupApi(page)
  await page.goto('/')

  const row = page.locator('.list-row').filter({ hasText: 'Kalvøya' })
  await row.locator('summary').click()
  await expect(row.locator('.more')).toBeVisible()
  await expect(row.locator('.leaflet-container')).toBeVisible()
  await expect(row.locator('.map-label')).toContainText('Kalvøya')
  await expect(row.locator('.map-label')).toContainText('9,0°')
  await capture(page, testInfo, 'detail-expanded')
})

test('use my position sorts nearest first', async ({ page, context }, testInfo) => {
  await context.grantPermissions(['geolocation'])
  await context.setGeolocation({ latitude: 63.43, longitude: 10.4 })
  await setupApi(page)
  await page.goto('/')

  await page.locator('.locate-icon').click()
  await expect(page.locator('select#sort')).toHaveValue('distance')
  await expect(names(page).first()).toHaveText('Lade')
  await expect(page.locator('.list-row .meta').first()).toContainText('km')
  await capture(page, testInfo, 'nearest')
})

test('error and stale status states are shown', async ({ page }, testInfo) => {
  await setupApi(page, { failTemperatures: true })
  await page.goto('/')

  await expect(page.locator('.status.error')).toContainText('Klarte ikke hente badevannsdata')
  await capture(page, testInfo, 'error-state')

  await page.unrouteAll()
  await setupApi(page, { stale: true })
  await page.reload()
  await expect(page.locator('.status')).toContainText('Viser mellomlagrede data')
  await capture(page, testInfo, 'stale-state')
})
