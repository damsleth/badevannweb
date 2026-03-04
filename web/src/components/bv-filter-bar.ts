import type { Filters } from '../state/store.js'

export class BvFilterBar extends HTMLElement {
  private debounceTimer: number | null = null
  private counties: string[] = []
  private municipalities: string[] = []
  private filters: Filters = {
    q: '',
    county: '',
    municipality: '',
    sort: 'temperature_desc'
  }

  connectedCallback(): void {
    this.render()
  }

  setData(data: { counties: string[]; municipalities: string[]; filters: Filters }): void {
    this.counties = data.counties
    this.municipalities = data.municipalities
    this.filters = data.filters
    this.render()
  }

  private emit(patch: Partial<Filters>): void {
    this.dispatchEvent(new CustomEvent('filters-change', { detail: patch, bubbles: true }))
  }

  private render(): void {
    const countyOptions = ['<option value="">Alle fylker</option>']
      .concat(
        this.counties.map(
          (county) =>
            `<option value="${county}" ${county === this.filters.county ? 'selected' : ''}>${county}</option>`
        )
      )
      .join('')

    const municipalityOptions = ['<option value="">Alle kommuner</option>']
      .concat(
        this.municipalities.map(
          (municipality) =>
            `<option value="${municipality}" ${municipality === this.filters.municipality ? 'selected' : ''}>${municipality}</option>`
        )
      )
      .join('')

    this.innerHTML = `
      <section class="panel filter-panel" aria-label="Filtrering av badeplasser">
        <label class="field">
          <span>Sok</span>
          <input id="q" type="search" placeholder="Sok etter badeplass" value="${this.filters.q}" />
        </label>

        <label class="field">
          <span>Fylke</span>
          <select id="county">${countyOptions}</select>
        </label>

        <label class="field">
          <span>Kommune</span>
          <select id="municipality">${municipalityOptions}</select>
        </label>

        <label class="field">
          <span>Sortering</span>
          <select id="sort">
            <option value="temperature_desc" ${this.filters.sort === 'temperature_desc' ? 'selected' : ''}>Varmest foerst</option>
            <option value="temperature_asc" ${this.filters.sort === 'temperature_asc' ? 'selected' : ''}>Kaldest foerst</option>
            <option value="newest_desc" ${this.filters.sort === 'newest_desc' ? 'selected' : ''}>Nyeste maaling foerst</option>
            <option value="name_asc" ${this.filters.sort === 'name_asc' ? 'selected' : ''}>Navn A-A</option>
          </select>
        </label>
      </section>
    `

    const qInput = this.querySelector<HTMLInputElement>('#q')
    const countySelect = this.querySelector<HTMLSelectElement>('#county')
    const municipalitySelect = this.querySelector<HTMLSelectElement>('#municipality')
    const sortSelect = this.querySelector<HTMLSelectElement>('#sort')

    qInput?.addEventListener('input', () => {
      if (this.debounceTimer) {
        window.clearTimeout(this.debounceTimer)
      }

      this.debounceTimer = window.setTimeout(() => {
        this.emit({ q: qInput.value })
      }, 250)
    })

    countySelect?.addEventListener('change', () => this.emit({ county: countySelect.value }))
    municipalitySelect?.addEventListener('change', () =>
      this.emit({ municipality: municipalitySelect.value })
    )
    sortSelect?.addEventListener('change', () => this.emit({ sort: sortSelect.value as Filters['sort'] }))
  }
}

customElements.define('bv-filter-bar', BvFilterBar)
