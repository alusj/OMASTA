/**
 * Central place for every environment-driven value.
 *
 * Nothing in here may contain a literal secret: all values come from Vite env
 * variables so they can differ per environment and stay out of source control.
 * Only variables prefixed with `VITE_` reach the browser bundle.
 */

const env = import.meta.env;

/**
 * The map key moved from `VITE_MAPTILER_API_KEY` to `VITE_MAPTILER_KEY`.
 * Both are accepted so existing local/hosted environments keep working.
 */
export const MAPTILER_KEY = env.VITE_MAPTILER_KEY || env.VITE_MAPTILER_API_KEY || "";

export const hasMapTilerKey = Boolean(MAPTILER_KEY);

/**
 * Assistant provider selection.
 *
 * `local`  - offline intent matching (default, no network, no cost).
 * `remote` - proxies to a backend you own, which holds the model API key.
 *            The browser never sees a model key.
 */
export const ASSISTANT_PROVIDER = env.VITE_ASSISTANT_PROVIDER || "local";
export const ASSISTANT_API_URL = env.VITE_ASSISTANT_API_URL || "";

/** Customer care number used by tel: links. Falls back to a placeholder. */
export const SUPPORT_PHONE = env.VITE_SUPPORT_PHONE || "";

/** Global flag: no verified Orange backend is connected yet. */
export const USING_DEMO_DATA = true;

/**
 * Supabase (public project URL + anon key only). The anon key is designed to
 * be public; row-level security in `supabase/migrations` is what protects the
 * data. Never put a service-role key in a VITE_ variable.
 */
export const SUPABASE_URL = env.VITE_SUPABASE_URL || "";
export const SUPABASE_ANON_KEY = env.VITE_SUPABASE_ANON_KEY || "";
export const hasSupabase = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

/**
 * Road routing (OSRM-compatible). Defaults to the free public OSRM demo
 * server, which is fine for a prototype but has no uptime guarantee and a
 * fair-use policy. Point this at your own OSRM (or compatible) server for
 * production. When it fails, Find falls back to a straight-line guide.
 */
export const ROUTING_URL = (env.VITE_ROUTING_URL || "https://router.project-osrm.org").replace(/\/$/, "");
