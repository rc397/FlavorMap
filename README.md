# FlavorMap

A crowdsourced map of local food favorites with emoji-based reviews.

## Dev Setup (Website Scaffold)
This repo is scaffolded as a simple Python + HTML website (no Node/bundler).

### Prereqs
- Install Python 3.11+ (3.12 recommended).

### Run
- `python server.py`
- Open http://127.0.0.1:8000

Data is stored locally in `data/spots.json`.

## Hosting: GitHub Pages vs “Real” Website

### Important: GitHub Pages cannot run Python
GitHub Pages only serves static files (HTML/CSS/JS). It cannot run `server.py`, so your `/api/*` endpoints will not work there.

If you want a real website with a Python backend/API, use a host that runs Python (examples below).

### Option A (recommended): Free hosting on Render (Python)
1. Push your repo to GitHub (already done).
2. Go to Render → **New** → **Web Service**
3. Connect your GitHub repo
4. Settings:
	- **Environment**: Python
	- **Build Command**: (leave blank)
	- **Start Command**: `python server.py`
5. Deploy.

Render will set `PORT` automatically; the server is configured to use it.

Note: On many free tiers, the service may sleep when idle.

### Option B: Railway (Python)
Similar flow: connect repo, set start command to `python server.py`. Railway also provides `PORT`.

### Data note (important)
Right now spots are stored in `data/spots.json` on the server.
On most free hosts, the filesystem may be ephemeral (data can reset on redeploy). For a truly crowdsourced app, you’ll eventually want a hosted database.

## GitHub Pages (static demo)
This repo also includes a static site in `docs/` for GitHub Pages demos.

### Enable Pages
1. On GitHub, go to your repo → **Settings** → **Pages**
2. Under **Build and deployment**:
	- **Source**: Deploy from a branch
	- **Branch**: `main`
	- **Folder**: `/docs`
3. Save and wait for deployment.

Your site will be available at:
`https://<your-username>.github.io/FlavorMap/`

### Important note
GitHub Pages is static, so there is no Python API there.
- In Pages mode, the map loads seed spots from `docs/data/spots.json`.
- Spots you add are saved to your browser (localStorage) unless you run `python server.py`.

## MVP (1–2 hours)
- Interactive map with pins
- Add a spot: name, cuisine, short note, emoji rating
- Browse/filter spots

## Stretch Goals
- Login + user profiles
- Photo uploads
- “Trending near me”

## Suggested Stack
- Frontend: HTML/CSS (optional Leaflet via CDN)
- Backend/DB: Python + JSON file (scaffold)

## Data Model (suggested)
- `spots`: `{ name, lat, lng, cuisine, emoji, note, createdAt, createdBy }`

## Next Steps
- Decide: Firebase vs simple REST API
- Create wireframe (home, add spot, details)

## Any thing else, put down below please!!!
