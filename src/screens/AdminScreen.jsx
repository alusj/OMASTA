import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Check, Loader2, LogOut, MapPin, RotateCw, ShieldCheck, X } from "lucide-react";

import { DemoNote } from "../components/common/DemoBadge.jsx";
import { hasSupabase } from "../config/env.js";
import { getCurrentUser, isAdminUser, onAuthChange, signInAdmin, signOutAdmin } from "../services/admin/adminAuth.js";
import { formatCoordinates } from "../services/locations/geocodingService.js";
import {
  SUBMISSION_CATEGORIES,
  SubmissionStatus,
  countSubmissionsByStatus,
  listSubmissionsForReview,
  reviewSubmission,
} from "../services/locations/submissionService.js";
import { useAppUi } from "../context/AppUiProvider.jsx";
import { useAssistantScreenContext } from "../hooks/useAssistantScreenContext.js";

const TABS = [
  { id: SubmissionStatus.PENDING, label: "Pending" },
  { id: SubmissionStatus.APPROVED, label: "Approved" },
  { id: SubmissionStatus.REJECTED, label: "Rejected" },
];

const SOURCE_LABEL = { device: "Device GPS", pin: "Dropped pin", typed: "Typed address" };

function categoryLabel(id) {
  return SUBMISSION_CATEGORIES.find((category) => category.id === id)?.type || id;
}

function previewPath(row) {
  const params = new URLSearchParams({ preview: `${row.longitude},${row.latitude}`, previewName: row.name });
  return `/find?${params.toString()}`;
}

function SignInForm({ onSignedIn }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setBusy(true);

    try {
      onSignedIn(await signInAdmin(email, password));
    } catch {
      setError("Those details did not work. Check the email and password.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="omasta-admin-signin" onSubmit={submit}>
      <label className="omasta-field">
        <span>Admin email</span>
        <input type="email" autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} required />
      </label>
      <label className="omasta-field">
        <span>Password</span>
        <input
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />
      </label>
      {error ? <p className="omasta-money-flow-error">{error}</p> : null}
      <button type="submit" className="orange-button orange-button--solid omasta-add-submit" disabled={busy}>
        {busy ? <Loader2 size={16} className="omasta-spin" /> : <ShieldCheck size={16} />}
        Sign in
      </button>
    </form>
  );
}

function SubmissionRow({ row, onReview, busy }) {
  const [note, setNote] = useState("");
  const pending = row.status === SubmissionStatus.PENDING;

  return (
    <li className="omasta-admin-row">
      <div className="omasta-admin-row-head">
        <div>
          <p>{categoryLabel(row.category)}</p>
          <h3>{row.name}</h3>
        </div>
        <time dateTime={row.created_at}>{new Date(row.created_at).toLocaleString("en-GB")}</time>
      </div>

      <dl className="omasta-spec-list">
        <div>
          <dt>Address</dt>
          <dd>{row.address}</dd>
        </div>
        <div>
          <dt>Point</dt>
          <dd>
            {formatCoordinates([row.longitude, row.latitude])} · {SOURCE_LABEL[row.location_source] || row.location_source}
          </dd>
        </div>
        {row.phone ? (
          <div>
            <dt>Phone</dt>
            <dd>{row.phone}</dd>
          </div>
        ) : null}
        {row.notes ? (
          <div>
            <dt>Notes</dt>
            <dd>{row.notes}</dd>
          </div>
        ) : null}
        {row.review_note ? (
          <div>
            <dt>Review note</dt>
            <dd>{row.review_note}</dd>
          </div>
        ) : null}
      </dl>

      <div className="omasta-admin-actions">
        <Link className="orange-button orange-button--outline" to={previewPath(row)}>
          <MapPin size={15} />
          Preview on map
        </Link>

        {pending ? (
          <>
            <input
              type="text"
              className="omasta-admin-note"
              maxLength={300}
              placeholder="Note (optional, e.g. reason for rejection)"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              aria-label={`Review note for ${row.name}`}
            />
            <button
              type="button"
              className="orange-button orange-button--solid"
              disabled={busy}
              onClick={() => onReview(row, SubmissionStatus.APPROVED, note)}
            >
              <Check size={15} />
              Approve
            </button>
            <button
              type="button"
              className="orange-button orange-button--outline omasta-admin-reject"
              disabled={busy}
              onClick={() => onReview(row, SubmissionStatus.REJECTED, note)}
            >
              <X size={15} />
              Reject
            </button>
          </>
        ) : (
          <button
            type="button"
            className="orange-button orange-button--outline"
            disabled={busy}
            onClick={() => onReview(row, SubmissionStatus.PENDING, "")}
          >
            <RotateCw size={15} />
            Move back to pending
          </button>
        )}
      </div>
    </li>
  );
}

/**
 * /admin: review customer-submitted locations.
 *
 * Only accounts with app_metadata.role = "omasta_admin" get past sign-in, and
 * the database enforces the same rule, so hiding this page is not what
 * protects the data.
 */
export default function AdminScreen() {
  const { showNotice } = useAppUi();
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);
  const [tab, setTab] = useState(SubmissionStatus.PENDING);
  const [rows, setRows] = useState([]);
  const [counts, setCounts] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);

  useAssistantScreenContext({ screen: "account" }, []);

  useEffect(() => {
    let active = true;

    getCurrentUser().then((current) => {
      if (active) {
        setUser(current);
        setChecking(false);
      }
    });

    const unsubscribe = onAuthChange((next) => setUser(next));

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  const isAdmin = isAdminUser(user);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [list, totals] = await Promise.all([listSubmissionsForReview(tab), countSubmissionsByStatus()]);
      setRows(list);
      setCounts(totals);
    } catch {
      setError("Submissions could not be loaded. Check that the database migration has been run.");
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => {
    if (isAdmin) {
      load();
    }
  }, [isAdmin, load]);

  const handleReview = async (row, status, note) => {
    setBusyId(row.id);

    try {
      await reviewSubmission(row.id, status, note);
      showNotice(
        status === SubmissionStatus.APPROVED
          ? `${row.name} is approved and now on the map.`
          : status === SubmissionStatus.REJECTED
            ? `${row.name} was rejected.`
            : `${row.name} is back in pending.`,
        "success"
      );
      await load();
    } catch {
      showNotice("That change could not be saved. Try again.");
    } finally {
      setBusyId(null);
    }
  };

  const renderBody = () => {
    if (!hasSupabase) {
      return (
        <DemoNote>
          Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY, and run the migration in
          supabase/migrations, to review submitted locations.
        </DemoNote>
      );
    }

    if (checking) {
      return (
        <p className="omasta-admin-status">
          <Loader2 size={16} className="omasta-spin" /> Checking your session...
        </p>
      );
    }

    if (!user) {
      return <SignInForm onSignedIn={setUser} />;
    }

    if (!isAdmin) {
      return (
        <div className="omasta-admin-denied">
          <p>
            <strong>{user.email}</strong> is signed in but is not an OMASTA admin. An existing admin can grant the
            role in Supabase.
          </p>
          <button type="button" className="orange-button orange-button--outline" onClick={signOutAdmin}>
            <LogOut size={15} />
            Sign out
          </button>
        </div>
      );
    }

    return (
      <>
        <div className="omasta-admin-bar">
          <div className="omasta-tabs" role="tablist" aria-label="Submission status">
            {TABS.map((item) => (
              <button
                type="button"
                role="tab"
                key={item.id}
                aria-selected={tab === item.id}
                className={tab === item.id ? "is-active" : ""}
                onClick={() => setTab(item.id)}
              >
                {item.label}
                {typeof counts[item.id] === "number" ? ` (${counts[item.id]})` : ""}
              </button>
            ))}
          </div>
          <div className="omasta-admin-user">
            <span>{user.email}</span>
            <button type="button" onClick={load} aria-label="Refresh">
              <RotateCw size={15} />
            </button>
            <button type="button" onClick={signOutAdmin} aria-label="Sign out">
              <LogOut size={15} />
            </button>
          </div>
        </div>

        {error ? <p className="omasta-money-flow-error">{error}</p> : null}

        {loading ? (
          <p className="omasta-admin-status">
            <Loader2 size={16} className="omasta-spin" /> Loading...
          </p>
        ) : rows.length ? (
          <ul className="omasta-admin-list">
            {rows.map((row) => (
              <SubmissionRow key={row.id} row={row} busy={busyId === row.id} onReview={handleReview} />
            ))}
          </ul>
        ) : (
          <div className="omasta-activity-state">
            <p>Nothing {tab} right now.</p>
          </div>
        )}
      </>
    );
  };

  return (
    <section className="orange-page-section omasta-admin" aria-labelledby="admin-title">
      <div className="orange-page-intro">
        <p className="orange-eyebrow">Orange admin</p>
        <h1 id="admin-title">Location review</h1>
        <p>Customer-suggested places appear on the Find map only after you approve them.</p>
      </div>

      {renderBody()}
    </section>
  );
}
