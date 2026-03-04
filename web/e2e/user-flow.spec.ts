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
        name: 'Sorenga',
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
        name: 'Kalvoya',
        urlPath: 'Norge/Akershus/Baerum',
        position: { lat: 59.88, lon: 10.52 },
        region: { name: 'Akershus' },
        subregion: { name: 'Baerum' },
        category: { name: 'Oy' }
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
        name: 'Bygdoy',
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
        urlPath: 'Norge/Trondelag/Trondheim',
        position: { lat: 63.44, lon: 10.45 },
        region: { name: 'Trondelag' },
        subregion: { name: 'Trondheim' },
        category: { name: 'Strand' }
      },
      sourceDisplayName: null,
      emoji: ':|',
      bucket: 'cool'
    }
  ]
}

const meta = {
  updatedAt: '2026-03-04T10:00:00.000Z',
  stale: false,
  counts: {
    beaches: 4,
    counties: 3,
    municipalities: 3
  },
  counties: ['Oslo', 'Akershus', 'Trondelag'],
  municipalities: ['Oslo', 'Baerum', 'Trondheim']
}

async function setupApi(
  page: Page,
  options: { failTemperatures?: boolean; temperatureDelayMs?: number; stale?: boolean } = {}
): Promise<void> {
  await page.route('**/api/meta', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(meta)
    })
  })

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
      body: JSON.stringify({
        ...dataset,
        stale: options.stale ?? false
      })
    })
  })
}

async function capture(page: Page, testInfo: TestInfo, name: string): Promise<void> {
  const screenshotPath = testInfo.outputPath(`${name}.png`)
  await page.screenshot({
    path: screenshotPath,
    fullPage: true
  })
  await testInfo.attach(name, {
    path: screenshotPath,
    contentType: 'image/png'
  })
}

test('shows loading and then loaded data state', async ({ page }, testInfo) => {
  await setupApi(page, { temperatureDelayMs: 600 })
  const gotoPromise = page.goto('/')

  await expect(page.locator('bv-status-bar .status.loading')).toContainText('Laster badevannsdata')
  await capture(page, testInfo, 'loading-state')

  await gotoPromise
  await expect(page.locator('bv-status-bar .status.ok')).toContainText('Viser 4 badeplasser')
  await expect(page.locator('bv-toplist .top-row .name').first()).toHaveText('Bygdoy')
  await capture(page, testInfo, 'loaded-state')
})

test('search and filters update the list and empty state', async ({ page }, testInfo) => {
  await setupApi(page)
  await page.goto('/')

  await page.locator('input#q').fill('sor')
  await page.waitForTimeout(300)
  await expect(page.locator('bv-temperature-list .list-row')).toHaveCount(1)
  await expect(page.locator('bv-temperature-list .list-row').first()).toContainText('Sorenga')
  await capture(page, testInfo, 'search-filtered')

  await page.locator('input#q').fill('')
  await page.waitForTimeout(300)
  await page.selectOption('select#county', 'Akershus')
  await page.selectOption('select#municipality', 'Baerum')
  await expect(page.locator('bv-temperature-list .list-row')).toHaveCount(1)
  await expect(page.locator('bv-temperature-list .list-row').first()).toContainText('Kalvoya')
  await capture(page, testInfo, 'county-municipality-filtered')

  await page.locator('input#q').fill('zzz-not-found')
  await page.waitForTimeout(300)
  await expect(page.locator('bv-temperature-list .empty')).toContainText('Fant ingen badeplasser')
  await capture(page, testInfo, 'empty-state')
})

test('sort options reorder results', async ({ page }, testInfo) => {
  await setupApi(page)
  await page.goto('/')

  await page.selectOption('select#sort', 'temperature_asc')
  await expect(page.locator('bv-temperature-list .list-row .name').first()).toHaveText('Kalvoya')

  await page.selectOption('select#sort', 'name_asc')
  await expect(page.locator('bv-temperature-list .list-row .name').first()).toHaveText('Bygdoy')

  await page.selectOption('select#sort', 'newest_desc')
  await expect(page.locator('bv-temperature-list .list-row .name').first()).toHaveText('Lade')
  await capture(page, testInfo, 'sorted-newest')
})

test('user can open details from toplist and list', async ({ page }, testInfo) => {
  await setupApi(page)
  await page.goto('/')

  await expect(page.locator('bv-beach-detail h2')).toHaveText('Sorenga')

  await page.locator('bv-toplist .top-row').filter({ hasText: 'Bygdoy' }).click()
  await expect(page.locator('bv-beach-detail h2')).toHaveText('Bygdoy')
  await capture(page, testInfo, 'detail-from-toplist')

  await page.locator('bv-temperature-list .list-row').filter({ hasText: 'Kalvoya' }).click()
  await expect(page.locator('bv-beach-detail h2')).toHaveText('Kalvoya')
  await expect(page.locator('bv-beach-detail')).toContainText('Norge/Akershus/Baerum')
  await capture(page, testInfo, 'detail-from-list')
})

test('error and stale status states are shown', async ({ page }, testInfo) => {
  await setupApi(page, { failTemperatures: true })
  await page.goto('/')

  await expect(page.locator('bv-status-bar .status.error')).toContainText(
    'Klarte ikke hente badevannsdata'
  )
  await capture(page, testInfo, 'error-state')

  await setupApi(page, { stale: true })
  await page.reload()
  await expect(page.locator('bv-status-bar .status.ok')).toContainText('Viser mellomlagrede data')
  await capture(page, testInfo, 'stale-state')
})
