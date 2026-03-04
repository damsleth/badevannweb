import type { BeachTemperature } from '../types.js'

export class BvTemperatureList extends HTMLElement {
  private items: BeachTemperature[] = []
  private selectedId: number | null = null

  connectedCallback(): void {
    this.render()
  }

  setData(data: { items: BeachTemperature[]; selectedId: number | null }): void {
    this.items = data.items
    this.selectedId = data.selectedId
    this.render()
  }

  private render(): void {
    if (this.items.length === 0) {
      this.innerHTML = `
        <section class="panel list-panel" aria-label="Badeplasser">
          <h2>Badeplasser</h2>
          <p class="empty">Fant ingen badeplasser med de valgte filtrene.</p>
        </section>
      `
      return
    }

    const rows = this.items
      .map((item) => {
        const selectedClass = item.id === this.selectedId ? ' selected' : ''
        return `
          <li>
            <button type="button" class="list-row${selectedClass}" data-id="${item.id}">
              <span class="name">${item.location.name}</span>
              <span class="meta">${item.location.region?.name ?? 'Ukjent fylke'} / ${item.location.subregion?.name ?? 'Ukjent kommune'}</span>
              <span class="temp">${item.emoji} ${item.temperature.toFixed(1)}°C</span>
            </button>
          </li>
        `
      })
      .join('')

    this.innerHTML = `
      <section class="panel list-panel" aria-label="Badeplasser">
        <h2>Badeplasser (${this.items.length})</h2>
        <ul class="list-rows">${rows}</ul>
      </section>
    `

    this.querySelectorAll<HTMLButtonElement>('button[data-id]').forEach((button) => {
      button.addEventListener('click', () => {
        this.dispatchEvent(
          new CustomEvent('select-beach', {
            detail: Number(button.dataset.id),
            bubbles: true
          })
        )
      })
    })
  }
}

customElements.define('bv-temperature-list', BvTemperatureList)
