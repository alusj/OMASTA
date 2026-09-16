# OMASTA

Mobile-first Orange customer hub: discover, locate, buy, troubleshoot and get support through one app, with OMASTA AI as a conversational controller for the whole experience.

## Run locally

```bash
npm install
npm run dev
```

Open [http://127.0.0.1:5173/orange](http://127.0.0.1:5173/orange).

## Environment

Copy `.env.example` to `.env`. `.env` is gitignored and must never be committed.

| Variable | Purpose |
| --- | --- |
| `VITE_MAPTILER_KEY` | MapTiler tiles for the live map. `VITE_MAPTILER_API_KEY` is still accepted. Without a key the illustrated fallback map is used. |
| `VITE_SUPPORT_PHONE` | Customer care number for `tel:` links. Unset means the UI says so instead of dialling something invented. |
| `VITE_ASSISTANT_PROVIDER` | `local` (default) or `remote`. |
| `VITE_ASSISTANT_API_URL` | Only for `remote`: your own backend endpoint. A model API key must never be a `VITE_` variable, because those are public in the browser bundle. |

## Structure

```
src/
  config/        environment access
  data/          demo data, every record flagged and labelled
  services/      catalogue, locations, support, status, assistant
    assistant/   assistantTypes, intentRouter, actionDispatcher, assistantService, providers/
  context/       app UI, location and assistant providers
  hooks/         screen assistant context, media queries
  components/    layout, common, products, find, home, assistant
  screens/       shop, product detail, find, support, account
  routes/        route table
  styles/        tokens, shell, screens, assistant
```

## OMASTA AI

The assistant is not a text-only chatbot. A message is turned into a structured
reply (text plus rich cards plus actions), and every action runs through one
dispatcher (`executeAssistantAction`) that can navigate the app, open the map on
a category, request location, open a product or bundle, start support or place a
call.

Intent matching runs locally with no API cost. `services/assistant/providers/`
is the seam for a hosted model: implement `send()` against your own backend and
switch `VITE_ASSISTANT_PROVIDER` to `remote`.

## Data honesty

No verified Orange backend is connected. Products, prices, bundles, offers,
locations, opening hours and service status are **sample data for development**
and are labelled in the interface. The assistant states plainly that it cannot
see balances, usage or live network status, and any money-touching action
requires explicit confirmation before it proceeds.
