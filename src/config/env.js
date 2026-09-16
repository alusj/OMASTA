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
