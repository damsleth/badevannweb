import type { BeachTemperature } from '../types.js'

export class BvToplist extends HTMLElement {
  private items: BeachTemperature[] = []

  connectedCallback(): void {
    this.render()
  }

  setData(items: BeachTemperature[]): void {
    this.items = items
    this.render()
  }

  private render(): void {
    const rows = this.items
      .map(
        (item, index) => `
      <li>
        <button type="button" class="top-row" data-id="${item.id}">
          <span class="index">${index + 1}</span>
          <span class="name">${item.location.name}</span>
          <span class="temp">${item.emoji} ${item.temperature.toFixed(1)}°C</span>
        </button>
      </li>
    `
      )
      .join('')

    this.innerHTML = `
      <section class="panel toplist-panel" aria-label="Hoyeste temperaturer">
        <h2>Toppliste</h2>
        ${this.items.length > 0 ? `<ol>${rows}</ol>` : '<p class="muted">Ingen treff for valgte filtre.</p>'}
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

customElements.define('bv-toplist', BvToplist)
