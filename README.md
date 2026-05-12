# FundRadar React 🔍

Production-grade React frontend for tracking, comparing, and analysing Indian mutual funds.

## Tech stack

| Tool | Purpose |
|------|---------|
| React 18 | UI framework |
| Vite | Build tool (instant HMR) |
| Recharts | Charts (line, pie) |
| Lucide React | Icons |
| Cabinet Grotesk + Fraunces | Typography |
| mfapi.in | Free AMFI fund data |

## Folder structure

```
src/
├── App.jsx              ← Root, routing, state
├── main.jsx             ← Entry point
├── index.css            ← Global CSS variables + resets
├── components/
│   ├── Navbar.jsx       ← Top navigation
│   ├── FundModal.jsx    ← Fund detail popup
│   └── UI.jsx           ← Badge, Stars, RetCell, Spinner, Card
├── pages/
│   ├── Explore.jsx      ← Fund listing with search/filter/sort
│   ├── Compare.jsx      ← Side-by-side comparison
│   ├── SIPCalc.jsx      ← SIP calculator with charts
│   └── ReturnsCalc.jsx  ← Real NAV returns calculator
├── hooks/
│   └── useFunds.js      ← Data fetching + caching
└── utils/
    └── funds.js         ← Category classifier, normaliser, formatters
```

## Setup in Cursor

```bash
# 1. Open fundradar-react/ in Cursor

# 2. Install dependencies
npm install

# 3. Start dev server
npm run dev
```

Runs at → http://localhost:5173

## Features

- **Explore** — All 2,000+ Indian MFs with search, fund house filter, category, risk, sort
- **Compare** — Up to 3 funds side by side, best values highlighted
- **SIP Calculator** — Monthly SIP with live charts (line + donut)
- **Returns Calculator** — Real NAV history from mfapi.in, calculates actual CAGR/XIRR
- **Fund detail modal** — NAV history chart, top holdings, star rating, risk
- **Fund house column** — Every fund shows its AMC name
- **All funds** — No artificial limit, fetches all schemes from AMFI

## Connect to backend

In `src/hooks/useFunds.js`, the backend URL is already set:
```js
const API_BASE = 'http://localhost:5000/api'
```
Start the backend (`npm run dev` in fundradar-backend-simple), then the React app will automatically use it. If the backend is offline, it falls back to mfapi.in.

## Deploy

```bash
# Build for production
npm run build

# Deploy dist/ to Vercel
npx vercel --prod

# Or Netlify — drag and drop the dist/ folder
```
