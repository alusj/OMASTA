import { useEffect, useState } from 'react';

let geoPromise;
// Lazily loads the Sierra Leone boundaries (large) once, shared by every map.
export function useGeo() {
  const [geo, setGeo] = useState(null);
  useEffect(() => { let live = true; (geoPromise ??= import('./geo/sierraLeone.js').then(m => m.default)).then(g => live && setGeo(g)); return () => { live = false; }; }, []);
  return geo;
}
