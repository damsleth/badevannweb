import { getTemperatures } from '../api/client.js'
import type { BeachTemperature, Position, SortType } from '../types.js'

const nb = 'nb-NO'

export function distanceKm(a: Position, b: Position): number {
  const rad = Math.PI / 180
  const dLat = (b.lat - a.lat) * rad
  const dLon = (b.lon - a.lon) * rad
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLon / 2) ** 2
  return 12742 * Math.asin(Math.sqrt(h))
}

function fold(value = ''): string {
  return value.toLocaleLowerCase(nb).trim()
}

export function visibleItems(
  items: BeachTemperature[],
  q: string,
  sort: SortType,
  position: Position | null
): BeachTemperature[] {
  const needle = fold(q)
  const result = needle
    ? items.filter(({ location: l }) =>
        [l.name, l.subregion?.name, l.region?.name].some((v) => fold(v).includes(needle))
      )
    : [...items]

  switch (sort) {
    case 'temperature_asc':
      return result.sort((a, b) => a.temperature - b.temperature)
    case 'distance':
      return position
        ? result.sort(
            (a, b) => distanceKm(position, a.location.position) - distanceKm(position, b.location.position)
          )
        : result
    case 'newest_desc':
      return result.sort((a, b) => Date.parse(b.time) - Date.parse(a.time))
    case 'name_asc':
      return result.sort((a, b) => a.location.name.localeCompare(b.location.name, nb))
    default:
      return result.sort((a, b) => b.temperature - a.temperature)
  }
}

const esc = (s = ''): string => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`)

const decimal = (n: number, digits: number): string =>
  n.toLocaleString(nb, { minimumFractionDigits: digits, maximumFractionDigits: digits })

function formatDistance(km: number): string {
  return km < 10 ? `${decimal(km, 1)} km` : `${decimal(km, 0)} km`
}

function shortTime(iso: string): string {
  const date = new Date(iso)
  const days = Math.round(
    (new Date().setHours(0, 0, 0, 0) - new Date(iso).setHours(0, 0, 0, 0)) / 86_400_000
  )
  if (days === 0) return date.toLocaleTimeString(nb, { hour: '2-digit', minute: '2-digit' })
  if (days === 1) return 'i går'
  return date.toLocaleDateString(nb, { day: 'numeric', month: 'short' })
}

function tempClass(t: number): string {
  if (t >= 20) return 'warm'
  if (t < 15) return 'cold'
  return 'mild'
}

const searchIcon =
  '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>'
const locateIcon =
  '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 3 3 10.5l7.5 3 3 7.5z"/></svg>'

export class BadevannApp extends HTMLElement {
  private items: BeachTemperature[] = []
  private position: Position | null = null

  private get input(): HTMLInputElement {
    return this.querySelector('#q')!
  }

  private get sort(): HTMLSelectElement {
    return this.querySelector('#sort')!
  }

  connectedCallback(): void {
    this.innerHTML = `
      <main class="app">
        <h1 class="brand"><a href="/">Badevann</a></h1>

        <div class="search">
          <label class="search-field">
            ${searchIcon}
            <input id="q" type="search" placeholder="Finn badeplass" aria-label="Finn badeplass"
              autocomplete="off" enterkeyhint="search" />
            <button type="button" class="locate locate-icon" aria-label="Bruk min posisjon" title="Bruk min posisjon">${locateIcon}</button>
          </label>
          <div class="search-menu">
            <button type="button" class="locate locate-pill">${locateIcon}<span>Bruk min posisjon</span></button>
            <p class="locate-error" role="alert" hidden></p>
          </div>
        </div>

        <p class="status" aria-live="polite">Laster badeplasser …</p>

        <section class="results" hidden>
          <div class="results-head">
            <span class="count"></span>
            <select id="sort" aria-label="Sortering">
              <option value="temperature_desc">Varmest</option>
              <option value="temperature_asc">Kaldest</option>
              <option value="distance" hidden>Nærmest</option>
              <option value="newest_desc">Sist målt</option>
              <option value="name_asc">Navn A–Å</option>
            </select>
          </div>
          <ul class="list"></ul>
        </section>
      </main>
    `

    this.input.addEventListener('input', () => this.renderList())
    this.sort.addEventListener('change', () => this.renderList())
    // toggle doesn't bubble, so listen in the capture phase
    this.querySelector('.list')!.addEventListener('toggle', (e) => this.openMap(e.target as HTMLDetailsElement), true)

    this.querySelectorAll<HTMLButtonElement>('.locate').forEach((button) => {
      if (!('geolocation' in navigator)) button.hidden = true
      // ponytail: keep focus in the input so the :focus-within menu doesn't close before the click lands
      button.addEventListener('mousedown', (e) => e.preventDefault())
      button.addEventListener('click', () => this.locate())
    })

    void this.load()
  }

  private async load(): Promise<void> {
    const status = this.querySelector<HTMLParagraphElement>('.status')!
    try {
      const data = await getTemperatures()
      this.items = data.items
      status.className = 'status'
      status.textContent = data.stale ? 'Viser mellomlagrede data.' : ''
      status.hidden = !data.stale
      this.querySelector<HTMLElement>('.results')!.hidden = false
      this.renderList()
    } catch {
      status.className = 'status error'
      status.textContent = 'Klarte ikke hente badevannsdata. Prøv igjen snart.'
    }
  }

  private locate(): void {
    const error = this.querySelector<HTMLParagraphElement>('.locate-error')!
    const buttons = this.querySelectorAll<HTMLButtonElement>('.locate')
    const label = this.querySelector('.locate-pill span')!
    const busy = (on: boolean): void => {
      buttons.forEach((b) => (b.disabled = on))
      label.textContent = on ? 'Finner posisjon …' : 'Bruk min posisjon'
    }
    error.hidden = true
    busy(true)

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        this.position = { lat: coords.latitude, lon: coords.longitude }
        busy(false)
        const nearest = this.sort.querySelector<HTMLOptionElement>('option[value="distance"]')!
        nearest.hidden = false
        this.sort.value = 'distance'
        this.input.blur()
        this.renderList()
      },
      (err) => {
        busy(false)
        error.textContent =
          err.code === err.PERMISSION_DENIED
            ? 'Du har ikke gitt tilgang til posisjonen din.'
            : 'Fant ikke posisjonen din.'
        error.hidden = false
        this.input.focus() // opens the menu so the error is visible
      },
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 300_000 }
    )
  }

  private openMap(details: HTMLDetailsElement): void {
    const el = details.querySelector<HTMLElement>('.map')
    const item = this.items.find((i) => i.id === Number(details.dataset.id))
    if (!details.open || !el || !item || el.dataset.ready) return
    el.dataset.ready = '1'
    const { lat, lon } = item.location.position
    const label = `${esc(item.location.name)} <b class="temp ${tempClass(item.temperature)}">${decimal(item.temperature, 1)}°</b>`
    void import('./beach-map.js').then((m) => m.showMap(el, lat, lon, label))
  }

  private renderList(): void {
    const items = visibleItems(this.items, this.input.value, this.sort.value as SortType, this.position)
    this.querySelector('.count')!.textContent =
      items.length === 1 ? '1 badeplass' : `${items.length} badeplasser`

    const list = this.querySelector<HTMLUListElement>('.list')!
    if (items.length === 0) {
      list.innerHTML = '<li class="empty">Fant ingen badeplasser.</li>'
      return
    }

    list.innerHTML = items
      .map((item) => {
        const l = item.location
        const place = [...new Set([l.subregion?.name, l.region?.name])].filter(Boolean).map(esc).join(', ')
        const distance = this.position ? ` · ${formatDistance(distanceKm(this.position, l.position))}` : ''
        const measured = new Date(item.time).toLocaleString(nb, { dateStyle: 'long', timeStyle: 'short' })
        const yr = l.id ? `https://www.yr.no/nb/værvarsel/daglig-tabell/${encodeURIComponent(l.id)}/${encodeURI(l.urlPath)}` : ''

        return `
          <li>
            <details class="list-row" data-id="${item.id}">
              <summary>
                <span class="name">${esc(l.name)}</span>
                <span class="temp ${tempClass(item.temperature)}">${decimal(item.temperature, 1)}°</span>
                <span class="meta">${place}${distance}</span>
                <span class="time">${shortTime(item.time)}</span>
              </summary>
              <div class="more">
                <div class="map" aria-label="Kart over ${esc(l.name)}"></div>
                <p class="measured">
                  Målt ${measured}
                  ${yr ? `<a href="${esc(yr)}" target="_blank" rel="noreferrer">Se på Yr</a>` : ''}
                </p>
              </div>
            </details>
          </li>
        `
      })
      .join('')
  }
}

customElements.define('badevann-app', BadevannApp)
