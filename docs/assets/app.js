/* global L */

const DEFAULT_CENTER = [40.7128, -74.006]
const DEFAULT_ZOOM = 13

const form = document.getElementById('addSpotForm')
const msg = document.getElementById('formMsg')
const list = document.getElementById('spotsList')
const modePill = document.getElementById('modePill')

const latInput = form.elements.lat
const lngInput = form.elements.lng

const map = L.map('map').setView(DEFAULT_CENTER, DEFAULT_ZOOM)
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap contributors',
}).addTo(map)

const markers = new Map()
const LOCAL_STORAGE_KEY = 'flavormap:localSpots'

function setMode(text) {
  if (modePill) modePill.textContent = text
}

function setMsg(text, isError = false) {
  msg.textContent = text
  msg.style.color = isError ? 'rgba(220, 38, 38, 0.9)' : 'rgba(5, 150, 105, 0.9)'
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

function getLocalSpots() {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function setLocalSpots(spots) {
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(spots))
}

function mergeSpots(primary, secondary) {
  // primary wins by id
  const byId = new Map()
  for (const s of secondary || []) byId.set(s.id, s)
  for (const s of primary || []) byId.set(s.id, s)
  return [...byId.values()]
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

function apiUrl() {
  return new URL('api/spots', window.location.href).toString()
}

function seedUrl() {
  return new URL('data/spots.json', window.location.href).toString()
}

async function tryFetchJson(url) {
  const res = await fetch(url, { cache: 'no-store' })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

async function loadSpots() {
  // Prefer local API when running server.py; fall back to static seed JSON on GitHub Pages.
  try {
    const data = await tryFetchJson(apiUrl())
    setMode('API mode')
    return { mode: 'api', spots: data.spots || [] }
  } catch {
    const seed = await tryFetchJson(seedUrl()).catch(() => [])
    setMode('Static mode')
    return { mode: 'static', spots: Array.isArray(seed) ? seed : [] }
  }
}

async function refresh() {
  const { mode, spots: base } = await loadSpots()
  const merged = mergeSpots(getLocalSpots(), base)
  upsertMarkers(merged)
  renderSpots(merged)

  if (mode === 'static') {
    setMsg('Static site: spots you add are saved only in this browser.', false)
  } else {
    setMsg('', false)
  }
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

  // Try API first; if unavailable (GitHub Pages), save locally.
  try {
    const res = await fetch(apiUrl(), {
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
    return
  } catch {
    const local = getLocalSpots()
    const spot = {
      id: `local_${Date.now()}`,
      ...payload,
      createdAt: new Date().toISOString(),
    }
    local.push(spot)
    setLocalSpots(local)

    form.reset()
    setMsg('Saved locally (static site).')
    await refresh()
  }
})

refresh().catch(() => setMsg('Failed to load spots', true))
