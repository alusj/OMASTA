/**
 * "Add location" submissions.
 *
 * Customers submit places; nothing appears on the map until an Orange admin
 * approves it. Storage is the Supabase table `location_submissions` (see
 * supabase/migrations). Row-level security there guarantees that:
 *   - anyone can insert, but only with status "pending";
 *   - the public can read approved rows only;
 *   - only an admin (app_metadata.role = "omasta_admin") can read pending
 *     rows or change a status.
 *
 * A copy of each of the customer's own submissions is kept on their device so
 * the list can show "Pending approval" (the public cannot read pending rows).
 * If Supabase is not configured or unreachable, the submission is kept on the
 * device only and the UI says so: it is never silently lost or faked as sent.
 */

import { supabase } from "../backend/supabaseClient.js";

const TABLE = "location_submissions";
const LOCAL_KEY = "omasta.mySubmissions";

export const SubmissionStatus = {
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
};

export const SubmissionStorage = {
  REMOTE: "remote",
  DEVICE: "device",
};

/** A blank "Add location" form. */
export const EMPTY_SUBMISSION_DRAFT = {
  name: "",
  category: "",
  address: "",
  coordinates: null,
  locationSource: null,
  accuracy: null,
  phone: "",
  notes: "",
};

/** Categories a customer can submit, in the order the form shows them. */
export const SUBMISSION_CATEGORIES = [
  { id: "agent", label: "Agent", type: "Authorised agent" },
  { id: "shop", label: "Shop", type: "Orange shop" },
  { id: "support", label: "Office", type: "Orange office" },
  { id: "money", label: "Money point", type: "Orange Money point" },
];

/** Sierra Leone bounding box, mirrored by a check constraint in the database. */
const BOUNDS = { minLat: 6.8, maxLat: 10.1, minLng: -13.5, maxLng: -10.2 };

export function isInServiceArea([lng, lat]) {
  return lat >= BOUNDS.minLat && lat <= BOUNDS.maxLat && lng >= BOUNDS.minLng && lng <= BOUNDS.maxLng;
}

export function validateSubmission(draft) {
  const errors = {};
  const name = String(draft.name || "").trim();
  const address = String(draft.address || "").trim();

  if (name.length < 2) {
    errors.name = "Enter the name of the place.";
  } else if (name.length > 80) {
    errors.name = "Keep the name under 80 characters.";
  }

  if (!SUBMISSION_CATEGORIES.some((category) => category.id === draft.category)) {
    errors.category = "Choose what kind of place this is.";
  }

  if (address.length < 3) {
    errors.address = "Enter the address, or use Locate me / Drop a pin.";
  } else if (address.length > 200) {
    errors.address = "Keep the address under 200 characters.";
  }

  if (draft.coordinates && !isInServiceArea(draft.coordinates)) {
    errors.address = "That point is outside Sierra Leone. Move the pin to the right place.";
  }

  if (draft.phone && !/^[+\d][\d\s-]{5,19}$/.test(String(draft.phone).trim())) {
    errors.phone = "Enter a valid phone number, or leave it empty.";
  }

  if (draft.notes && String(draft.notes).length > 300) {
    errors.notes = "Keep notes under 300 characters.";
  }

  return errors;
}

function readLocal() {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(LOCAL_KEY) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeLocal(items) {
  try {
    window.localStorage.setItem(LOCAL_KEY, JSON.stringify(items.slice(0, 50)));
  } catch {
    // Storage unavailable: the remote copy (if any) is still the source of truth.
  }
}

function newId() {
  if (window.crypto?.randomUUID) {
    return window.crypto.randomUUID();
  }

  return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, (c) =>
    (Number(c) ^ (window.crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (Number(c) / 4)))).toString(16)
  );
}

function typeFor(category) {
  return SUBMISSION_CATEGORIES.find((item) => item.id === category)?.type || "Orange location";
}

/** Database row -> the location shape the rest of the app already uses. */
export function toLocation(row) {
  return {
    id: row.id,
    name: row.name,
    type: typeFor(row.category),
    category: row.category,
    address: row.address,
    coordinates: [row.longitude, row.latitude],
    phone: row.phone || "",
    openingHours: null,
    services: [],
    isDemo: false,
    isCommunity: true,
  };
}

/**
 * @param {object} draft { name, category, address, coordinates: [lng, lat], locationSource, phone, notes }
 * @returns {Promise<{ storage: string, submission: object }>}
 */
export async function submitLocation(draft) {
  const errors = validateSubmission(draft);

  if (Object.keys(errors).length || !draft.coordinates) {
    throw new Error("The submission is not complete.");
  }

  const row = {
    id: newId(),
    name: draft.name.trim(),
    category: draft.category,
    address: draft.address.trim(),
    latitude: draft.coordinates[1],
    longitude: draft.coordinates[0],
    location_source: draft.locationSource || "typed",
    phone: draft.phone?.trim() || null,
    notes: draft.notes?.trim() || null,
  };

  let storage = SubmissionStorage.DEVICE;

  if (supabase) {
    // No `.select()`: the public cannot read pending rows back, by design.
    const { error } = await supabase.from(TABLE).insert(row);

    if (!error) {
      storage = SubmissionStorage.REMOTE;
    }
  }

  const submission = {
    ...row,
    status: SubmissionStatus.PENDING,
    storage,
    createdAt: new Date().toISOString(),
  };

  writeLocal([submission, ...readLocal()]);
  return { storage, submission };
}

/** The customer's own submissions, newest first, reconciled with approvals. */
export function listMySubmissions(approvedIds = new Set()) {
  return readLocal().map((item) =>
    approvedIds.has(item.id) ? { ...item, status: SubmissionStatus.APPROVED } : item
  );
}

export function removeMySubmission(id) {
  writeLocal(readLocal().filter((item) => item.id !== id));
}

/** Approved submissions, shaped as locations, for the public map and list. */
export async function listApprovedCommunityLocations() {
  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from(TABLE)
    .select("id, name, category, address, latitude, longitude, phone")
    .eq("status", SubmissionStatus.APPROVED)
    .order("created_at", { ascending: false })
    .limit(500);

  if (error || !Array.isArray(data)) {
    return [];
  }

  return data.map(toLocation);
}

/* ------------------------------------------------------------------ */
/* Admin review (row-level security only lets admins through)          */
/* ------------------------------------------------------------------ */

export async function listSubmissionsForReview(status = SubmissionStatus.PENDING) {
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .eq("status", status)
    .order("created_at", { ascending: status === SubmissionStatus.PENDING })
    .limit(200);

  if (error) {
    throw error;
  }

  return data || [];
}

export async function countSubmissionsByStatus() {
  if (!supabase) {
    return {};
  }

  const entries = await Promise.all(
    Object.values(SubmissionStatus).map(async (status) => {
      const { count } = await supabase.from(TABLE).select("id", { count: "exact", head: true }).eq("status", status);
      return [status, count ?? 0];
    })
  );

  return Object.fromEntries(entries);
}

export async function reviewSubmission(id, status, reviewNote = "") {
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  const { data: userData } = await supabase.auth.getUser();

  const { error } = await supabase
    .from(TABLE)
    .update({
      status,
      review_note: reviewNote.trim() || null,
      reviewed_at: new Date().toISOString(),
      reviewed_by: userData?.user?.id || null,
    })
    .eq("id", id);

  if (error) {
    throw error;
  }
}
