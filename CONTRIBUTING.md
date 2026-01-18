# Contributing to FlavorMap

Thanks for helping build FlavorMap — a crowdsourced map of local food favorites with emoji-based reviews.

## Quick start

### Prereqs
- Git
- Python 3.11+ (3.12 recommended)

### Run locally
1. In the repo root:
   - `python server.py`
2. Open in your browser:
   - http://127.0.0.1:8000

### Data storage
- Spots are stored locally in `data/spots.json`.
- The server exposes a small API:
  - `GET /api/spots`
  - `POST /api/spots`

## How to contribute

### Typical workflow
1. Create a branch:
   - `git checkout -b yourname/short-description`
2. Make changes.
3. Run the server and sanity-check the page.
4. Commit:
   - `git add -A`
   - `git commit -m "Short, clear message"`
5. Push and open a PR:
   - `git push -u origin HEAD`

### Scope guidelines (for now)
- Keep changes small and focused.
- Prefer plain HTML/CSS/vanilla JS (no build tooling).
- Add new API endpoints only when necessary and keep them simple.

## Code style
- HTML/CSS/JS: keep it readable, consistent, and avoid heavy abstractions.
- Python: standard library only, clear function names, basic validation.

## Suggested next tasks
- Add “pick location from map” UX polish
- Add filters (cuisine / emoji)
- Add a details view for a spot
- Add basic moderation/reporting scaffolds
