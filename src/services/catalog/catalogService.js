/**
 * Catalogue service.
 *
 * The single place the UI talks to for products and bundles. Today it reads the
 * local demo modules; swapping in a real Orange catalogue API means changing the
 * bodies of these functions only. Every function is async so the call sites
 * already handle loading states.
 */

import { PRODUCTS, PRODUCT_CATEGORIES } from "../../data/products.js";
import { BUNDLES, BUNDLE_TYPES } from "../../data/bundles.js";

/** Small delay so skeleton states are exercised during development. */
const SIMULATED_LATENCY_MS = 220;

function resolve(value) {
  return new Promise((done) => {
    setTimeout(() => done(value), SIMULATED_LATENCY_MS);
  });
}

export function getProductCategories() {
  return PRODUCT_CATEGORIES;
}

export function getBundleTypes() {
  return BUNDLE_TYPES;
}

/** Synchronous lookups for places that must render immediately (assistant cards). */
export function findProductSync(productId) {
  return PRODUCTS.find((product) => product.id === productId) || null;
}

export function findBundleSync(bundleId) {
  return BUNDLES.find((bundle) => bundle.id === bundleId) || null;
}

export function listProductsSync({ categoryId = "all" } = {}) {
  if (categoryId === "all") {
    return PRODUCTS;
  }

  return PRODUCTS.filter((product) => product.categoryId === categoryId);
}

export function listBundlesSync({ typeId = "all" } = {}) {
  if (typeId === "all") {
    return BUNDLES;
  }

  return BUNDLES.filter((bundle) => bundle.typeId === typeId);
}

export async function listProducts(options) {
  return resolve(listProductsSync(options));
}

export async function listBundles(options) {
  return resolve(listBundlesSync(options));
}

export async function getProduct(productId) {
  return resolve(findProductSync(productId));
}

export function getFeaturedProducts() {
  return PRODUCTS.filter((product) => product.badge || product.categoryId === "internet").slice(0, 5);
}

/** Naive relevance search across the demo catalogue. */
export function searchCatalog(query) {
  const term = query.trim().toLowerCase();

  if (!term) {
    return { products: [], bundles: [] };
  }

  const matches = (haystack) => haystack.toLowerCase().includes(term);

  return {
    products: PRODUCTS.filter((product) =>
      matches(`${product.name} ${product.category} ${product.tagline} ${product.description}`)
    ),
    bundles: BUNDLES.filter((bundle) => matches(`${bundle.name} ${bundle.description} ${bundle.validity}`)),
  };
}

/**
 * Recommends bundles for a described need. Used by the assistant so it can
 * suggest without inventing plans that are not in the catalogue.
 */
export function recommendBundles(need = "medium", limit = 3) {
  const ranked = [...BUNDLES].sort((a, b) => {
    const score = (bundle) => (bundle.bestFor === need ? 0 : 1);
    return score(a) - score(b) || a.priceValue - b.priceValue;
  });

  return ranked.slice(0, limit);
}
