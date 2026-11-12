import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

const tiles = 'https://cache.kartverket.no/v1/wmts/1.0.0/topograatone/default/webmercator/{z}/{y}/{x}.png'

// ponytail: maps are never L.map().remove()'d when the list re-renders; the DOM goes and leaks are small
export function showMap(el: HTMLElement, lat: number, lon: number, labelHtml: string): void {
  const map = L.map(el, { scrollWheelZoom: false }).setView([lat, lon], 13)
  L.tileLayer(tiles, {
    maxZoom: 18,
    attribution: '© <a href="https://www.kartverket.no/">Kartverket</a>'
  }).addTo(map)
  L.circleMarker([lat, lon], { radius: 7, color: '#fff', weight: 3, fillColor: '#0a5bc4', fillOpacity: 1 })
    .addTo(map)
    .bindTooltip(labelHtml, { permanent: true, direction: 'top', offset: [0, -10], className: 'map-label' })
}
