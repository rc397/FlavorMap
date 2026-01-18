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
