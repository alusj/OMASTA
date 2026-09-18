/**
 * Admin sign-in for the location review screen (Supabase Auth).
 *
 * There is no sign-up here: admin accounts are created in the Supabase
 * dashboard and given `app_metadata.role = "omasta_admin"`, which only the
 * service role can set. The database checks the same claim, so this client
 * check only decides what to show; it is not the security boundary.
 */

import { supabase } from "../backend/supabaseClient.js";

export const ADMIN_ROLE = "omasta_admin";

export function isAdminUser(user) {
  return user?.app_metadata?.role === ADMIN_ROLE;
}

export async function getCurrentUser() {
  if (!supabase) {
    return null;
  }

  const { data } = await supabase.auth.getSession();
  return data?.session?.user || null;
}

export function onAuthChange(callback) {
  if (!supabase) {
    return () => {};
  }

  const { data } = supabase.auth.onAuthStateChange((_event, session) => callback(session?.user || null));
  return () => data.subscription.unsubscribe();
}

export async function signInAdmin(email, password) {
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });

  if (error) {
    throw error;
  }

  return data.user;
}

export async function signOutAdmin() {
  await supabase?.auth.signOut();
}
