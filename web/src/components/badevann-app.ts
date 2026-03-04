import { BadevannStore, getSelectedBeach } from '../state/store.js'
import type { Filters } from '../state/store.js'
import type { BvBeachDetail } from './bv-beach-detail.js'
import type { BvFilterBar } from './bv-filter-bar.js'
import type { BvStatusBar } from './bv-status-bar.js'
import type { BvTemperatureList } from './bv-temperature-list.js'
import type { BvToplist } from './bv-toplist.js'

export class BadevannApp extends HTMLElement {
  private readonly store = new BadevannStore()
  private unsubscribe: (() => void) | null = null

  connectedCallback(): void {
    this.renderShell()

    this.unsubscribe = this.store.subscribe(() => this.renderState())

    this.addEventListener('filters-change', this.onFiltersChange as EventListener)
    this.addEventListener('select-beach', this.onSelectBeach as EventListener)

    this.store.initialize().catch(() => {
      // Error state is set inside store.initialize()
    })
  }

  disconnectedCallback(): void {
    this.unsubscribe?.()
    this.removeEventListener('filters-change', this.onFiltersChange as EventListener)
    this.removeEventListener('select-beach', this.onSelectBeach as EventListener)
  }

  private onFiltersChange = (event: CustomEvent<Partial<Filters>>): void => {
    this.store.updateFilters(event.detail)
  }

  private onSelectBeach = (event: CustomEvent<number>): void => {
    this.store.selectBeach(event.detail)
  }

  private renderShell(): void {
    this.innerHTML = `
      <main class="app-shell">
        <header class="hero">
          <p class="eyebrow">Badevann Norge</p>
          <h1>Finn dagens badetemperatur</h1>
          <p>Data leveres via badevann-pakken og YR.</p>
        </header>

        <bv-status-bar></bv-status-bar>

        <section class="top-row-layout">
          <bv-filter-bar></bv-filter-bar>
          <bv-toplist></bv-toplist>
        </section>

        <section class="content-layout">
          <bv-temperature-list></bv-temperature-list>
          <bv-beach-detail></bv-beach-detail>
        </section>
      </main>
    `
  }

  private renderState(): void {
    const state = this.store.getState()

    const status = this.querySelector<BvStatusBar>('bv-status-bar')
    const filterBar = this.querySelector<BvFilterBar>('bv-filter-bar')
    const topList = this.querySelector<BvToplist>('bv-toplist')
    const list = this.querySelector<BvTemperatureList>('bv-temperature-list')
    const detail = this.querySelector<BvBeachDetail>('bv-beach-detail')

    status?.setData({
      loading: state.loading,
      error: state.error,
      stale: state.stale,
      updatedAt: state.updatedAt,
      count: state.visibleItems.length
    })

    filterBar?.setData({
      counties: state.meta?.counties ?? [],
      municipalities: state.meta?.municipalities ?? [],
      filters: state.filters
    })

    topList?.setData(state.topItems)

    list?.setData({
      items: state.visibleItems,
      selectedId: state.selectedId
    })

    detail?.setData(getSelectedBeach(state))
  }
}

customElements.define('badevann-app', BadevannApp)
