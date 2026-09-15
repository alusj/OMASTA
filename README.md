# Orange Customer Hub

Mobile-first Orange Sierra Leone customer dashboard prototype.

## Run locally

```bash
npm install
npm run dev
```

Open [http://127.0.0.1:5173/orange](http://127.0.0.1:5173/orange).

## Current scope

- Orange home dashboard with featured products and quick actions
- Shop, Find, Support, and Account navigation
- Map-first Find Orange experience with shop, Money point, and agent markers
- Location filters and an Add location flow
- Search and support interactions

The Find screen uses MapLibre GL JS as its map engine. When `VITE_MAPTILER_API_KEY` is configured, it loads MapTiler Streets v4 tiles and enables the MapLibre navigation and device geolocation controls. Without a key, the app shows an offline map preview so the rest of the experience remains testable.
