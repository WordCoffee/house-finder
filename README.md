# HomeBase — Nationwide Property Search

A premium private real estate search app designed to feel polished, fast, and practical. It runs fully in the browser, uses strong filters, supports multiple providers, and is ready for free static hosting. GitHub Pages can host this from a public repo on GitHub Free, and from public or private repos on GitHub Pro and above. [web:195][page:1]

## Files

| File | What it does |
|------|-------------|
| `index.html` | Page shell, search bar, filter bar, list/map layout, modal, saved panel |
| `styles.css` | Premium responsive UI, dark/light mode, cards, panels, states |
| `config.js` | API keys, provider settings, localStorage helpers |
| `app.js` | Search logic, filters, cards, saved homes, notes, provider switching |
| `README.md` | Setup guide |

## Run locally now

1. Put all files in one folder.
2. Open `index.html` in Chrome, Edge, Safari, or Firefox.
3. The app loads with sample nationwide-style data and all filters working client-side.

## GitHub Pages setup

### Option A — project site

1. Create a new repository, for example `house-finder`.
2. Upload `index.html`, `styles.css`, `config.js`, `app.js`, and `README.md` to the repo root.
3. Go to **Settings → Pages**.
4. Under **Build and deployment**, choose **Deploy from a branch**.
5. Choose branch `main` and folder `/ (root)`.
6. Save and wait for the site URL to appear. GitHub says publishing can take up to 10 minutes. [page:1][web:205]

Your URL will look like:
`https://your-username.github.io/house-finder/`

### Option B — user site

If you want the shortest possible URL, create a repo named:
`your-username.github.io`

Then upload the same files to that repo. The live URL becomes:
`https://your-username.github.io/` [page:1]

## Important GitHub note

On GitHub Free, GitHub Pages is available for **public repositories**. GitHub’s docs say private-repo Pages requires GitHub Pro, Team, Enterprise Cloud, or Enterprise Server. [page:1][web:208]

## Wire live APIs later

The app supports these provider slots:
- RentCast
- Realty in US (RapidAPI)
- US Real Estate Listings (RapidAPI)
- Zillow-style provider via OpenWeb Ninja

Add keys in `config.js`, then switch the source from the bottom-left toolbar.

## Current working features

- Nationwide-style search input
- Collapsible filters drawer plus always-visible quick sort strip (newest, price, lot size, days on market)
- Saved homes with heart button
- Property detail modal
- Private notes per listing
- Dark/light toggle
- Provider dropdown with estimated usage counter

## Next build step

The current UI is polished and functional on sample data. The next practical step is to connect one live provider first, ideally RentCast or Realty in US, then validate the field mapping in `app.js`.

Days-on-market sorting will work when the provider returns a matching field such as `daysOnMarket`, `daysListed`, or `listedDate`.
