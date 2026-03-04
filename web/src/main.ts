import './style.css'
import './components/bv-filter-bar.js'
import './components/bv-toplist.js'
import './components/bv-temperature-list.js'
import './components/bv-beach-detail.js'
import './components/bv-status-bar.js'
import './components/badevann-app.js'

document.querySelector<HTMLDivElement>('#app')!.innerHTML = '<badevann-app></badevann-app>'
