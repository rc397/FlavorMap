/* global L */

const DEFAULT_CENTER = [40.7128, -74.006]
const DEFAULT_ZOOM = 13

const form = document.getElementById('addSpotForm')
const msg = document.getElementById('formMsg')
const list = document.getElementById('spotsList')

const latInput = form.elements.lat
const lngInput = form.elements.lng

const map = L.map('map').setView(DEFAULT_CENTER, DEFAULT_ZOOM)
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap contributors',
}).addTo(map)

const markers = new Map()

function setMsg(text, isError = false) {
  msg.textContent = text
  msg.style.color = isError ? 'rgba(248, 113, 113, 0.95)' : 'rgba(167, 243, 208, 0.9)'
}

function parseNumber(value) {
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

function escapeHtml(s) {
  return String(s)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

function renderSpots(spots) {
  list.innerHTML = ''

  for (const spot of [...spots].slice(-50).reverse()) {
    const el = document.createElement('div')
    el.className = 'item'

    el.innerHTML = `
      <div>
        <div class="itemTitle">
          <strong>${escapeHtml(spot.name)}</strong>
          <span>${escapeHtml(spot.cuisine)}</span>
        </div>
        <div class="itemNote">${escapeHtml(spot.note || '')}</div>
        <div class="hint">${escapeHtml(spot.lat)}, ${escapeHtml(spot.lng)}</div>
      </div>
      <div class="badge" title="${escapeHtml(spot.emoji)}">${escapeHtml(spot.emoji)}</div>
    `

    el.addEventListener('click', () => {
      map.setView([spot.lat, spot.lng], Math.max(map.getZoom(), 15))
      const marker = markers.get(spot.id)
      if (marker) marker.openPopup()
    })

    list.appendChild(el)
  }
}

function upsertMarkers(spots) {
  for (const spot of spots) {
    if (markers.has(spot.id)) continue

    const marker = L.marker([spot.lat, spot.lng]).addTo(map)
    marker.bindPopup(
      `<strong>${escapeHtml(spot.name)}</strong><br/>${escapeHtml(spot.cuisine)} ${escapeHtml(spot.emoji)}<br/>${escapeHtml(
        spot.note || '',
      )}`,
    )
    markers.set(spot.id, marker)
  }
}

async function refresh() {
  const res = await fetch('/api/spots')
  const data = await res.json()
  const spots = data.spots || []
  upsertMarkers(spots)
  renderSpots(spots)
}

map.on('click', (e) => {
  latInput.value = e.latlng.lat.toFixed(6)
  lngInput.value = e.latlng.lng.toFixed(6)
})

form.addEventListener('submit', async (e) => {
  e.preventDefault()
  setMsg('')

  const payload = {
    name: form.elements.name.value.trim(),
    cuisine: form.elements.cuisine.value.trim(),
    emoji: form.elements.emoji.value.trim(),
    note: form.elements.note.value.trim(),
    lat: parseNumber(latInput.value),
    lng: parseNumber(lngInput.value),
  }

  if (payload.lat === null || payload.lng === null) {
    return setMsg('Lat/Lng must be numbers', true)
  }

  const res = await fetch('/api/spots', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    return setMsg(data.error || 'Failed to save spot', true)
  }

  form.reset()
  setMsg('Saved!')
  await refresh()
})

refresh().catch(() => setMsg('Failed to load spots', true))
