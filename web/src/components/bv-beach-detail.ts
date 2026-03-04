import type { BeachTemperature } from '../types.js'

function formatTimestamp(value: string): string {
  return new Date(value).toLocaleString('nb-NO', {
    dateStyle: 'medium',
    timeStyle: 'short'
  })
}

export class BvBeachDetail extends HTMLElement {
  private item: BeachTemperature | null = null

  connectedCallback(): void {
    this.render()
  }

  setData(item: BeachTemperature | null): void {
    this.item = item
    this.render()
  }

  private render(): void {
    if (!this.item) {
      this.innerHTML = `
        <aside class="panel detail-panel" aria-label="Detaljer">
          <h2>Detaljer</h2>
          <p class="muted">Velg en badeplass for aa se detaljer.</p>
        </aside>
      `
      return
    }

    const mapUrl = `https://google.com/maps?q=${this.item.location.position.lat},${this.item.location.position.lon}`

    this.innerHTML = `
      <aside class="panel detail-panel" aria-label="Detaljer for valgt badeplass">
        <h2>${this.item.location.name}</h2>
        <p class="hero-temp">${this.item.emoji} ${this.item.temperature.toFixed(1)}°C</p>
        <dl>
          <dt>Maaletid</dt>
          <dd>${formatTimestamp(this.item.time)}</dd>
          <dt>Fylke</dt>
          <dd>${this.item.location.region?.name ?? 'Ukjent'}</dd>
          <dt>Kommune</dt>
          <dd>${this.item.location.subregion?.name ?? 'Ukjent'}</dd>
          <dt>Kategori</dt>
          <dd>${this.item.location.category?.name ?? 'Ukjent'}</dd>
          <dt>Sted</dt>
          <dd>${this.item.location.urlPath}</dd>
        </dl>
        <a href="${mapUrl}" target="_blank" rel="noreferrer">Aapne i kart</a>
      </aside>
    `
  }
}

customElements.define('bv-beach-detail', BvBeachDetail)
