interface StatusData {
  loading: boolean
  error: string | null
  stale: boolean
  updatedAt: string | null
  count: number
}

export class BvStatusBar extends HTMLElement {
  private data: StatusData = {
    loading: false,
    error: null,
    stale: false,
    updatedAt: null,
    count: 0
  }

  connectedCallback(): void {
    this.setAttribute('aria-live', 'polite')
    this.render()
  }

  setData(data: StatusData): void {
    this.data = data
    this.render()
  }

  private render(): void {
    if (this.data.loading) {
      this.innerHTML = '<p class="status loading">Laster badevannsdata...</p>'
      return
    }

    if (this.data.error) {
      this.innerHTML = `<p class="status error">${this.data.error}</p>`
      return
    }

    const updated = this.data.updatedAt
      ? new Date(this.data.updatedAt).toLocaleString('nb-NO', {
          dateStyle: 'medium',
          timeStyle: 'short'
        })
      : 'ukjent'

    this.innerHTML = `
      <p class="status ok">
        Viser ${this.data.count} badeplasser. Sist oppdatert: ${updated}.
        ${this.data.stale ? '<strong>Viser mellomlagrede data.</strong>' : ''}
      </p>
    `
  }
}

customElements.define('bv-status-bar', BvStatusBar)
