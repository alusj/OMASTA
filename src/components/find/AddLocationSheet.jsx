import { useState } from "react";
import { CircleCheck, Crosshair, Loader2, MapPin, ShieldCheck, Smartphone } from "lucide-react";

import BottomSheet from "../common/BottomSheet.jsx";
import { DemoNote } from "../common/DemoBadge.jsx";
import { forwardGeocode, formatCoordinates } from "../../services/locations/geocodingService.js";
import {
  SUBMISSION_CATEGORIES,
  SubmissionStorage,
  submitLocation,
  validateSubmission,
} from "../../services/locations/submissionService.js";

const SOURCE_LABEL = {
  device: "from your device",
  pin: "from the dropped pin",
  typed: "from the typed address",
};

/**
 * "Add location": a customer suggests an Orange place. Capturing the exact
 * point with Locate me or Drop a pin is recommended and fills the address in
 * automatically; a typed address is looked up on submit instead. Everything is
 * held for admin approval before it can appear on the map.
 */
export default function AddLocationSheet({
  open,
  draft,
  onDraftChange,
  onClose,
  onLocateMe,
  onDropPin,
  locating = false,
  resolvingAddress = false,
  locateError = "",
  canDropPin = true,
  near = null,
  onSubmitted,
}) {
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [result, setResult] = useState(null);

  const update = (patch) => {
    onDraftChange(patch);
    setErrors((current) => {
      const next = { ...current };
      Object.keys(patch).forEach((key) => delete next[key]);
      return next;
    });
  };

  const submit = async (event) => {
    event.preventDefault();
    setSubmitError("");

    const problems = validateSubmission(draft);
    setErrors(problems);

    if (Object.keys(problems).length) {
      return;
    }

    setSubmitting(true);

    try {
      let complete = draft;

      // No captured point: look the typed address up so the place can be mapped.
      if (!draft.coordinates) {
        const match = await forwardGeocode(draft.address, { near });

        if (!match) {
          setErrors({
            address: "We could not find that address on the map. Use Locate me or Drop a pin to set the exact point.",
          });
          return;
        }

        complete = { ...draft, coordinates: match.coordinates, locationSource: "typed" };
        onDraftChange({ coordinates: match.coordinates, locationSource: "typed" });

        const areaProblems = validateSubmission(complete);
        if (areaProblems.address) {
          setErrors(areaProblems);
          return;
        }
      }

      const outcome = await submitLocation(complete);
      setResult(outcome);
      onSubmitted?.(outcome);
    } catch {
      setSubmitError("The location could not be submitted. Check the details and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const close = () => {
    setResult(null);
    setErrors({});
    setSubmitError("");
    onClose(Boolean(result));
  };

  if (result) {
    const remote = result.storage === SubmissionStorage.REMOTE;

    return (
      <BottomSheet open={open} onClose={close} eyebrow="Add location" title="Thanks for the suggestion" labelledById="add-location-title">
        <div className="omasta-add-result">
          <span className="omasta-add-result-icon" aria-hidden="true">
            <CircleCheck size={26} />
          </span>
          <h3>{remote ? "Sent for approval" : "Saved on this device"}</h3>
          <p>
            <strong>{result.submission.name}</strong>
            <br />
            {result.submission.address}
          </p>
          {remote ? (
            <DemoNote>
              An Orange admin will review it. It appears on the map for everyone only after it is approved. You can
              follow it under Your submissions in the list.
            </DemoNote>
          ) : (
            <DemoNote>
              The review service could not be reached, so this suggestion is only saved on this device and has not been
              sent for approval yet.
            </DemoNote>
          )}
          <button type="button" className="orange-button orange-button--solid omasta-add-submit" onClick={close}>
            Done
          </button>
        </div>
      </BottomSheet>
    );
  }

  const capturedLabel = draft.coordinates
    ? `${formatCoordinates(draft.coordinates)} · ${SOURCE_LABEL[draft.locationSource] || "captured"}${
        draft.accuracy ? ` (±${Math.round(draft.accuracy)} m)` : ""
      }`
    : "";

  return (
    <BottomSheet
      open={open}
      onClose={close}
      eyebrow="Add location"
      title="Suggest an Orange place"
      description="Know an agent, shop, office or Money point that is missing? An Orange admin checks every suggestion before it appears on the map."
      labelledById="add-location-title"
    >
      <form className="omasta-add-form" onSubmit={submit} noValidate>
        <label className="omasta-field">
          <span>Place name</span>
          <input
            type="text"
            value={draft.name}
            maxLength={80}
            autoComplete="off"
            placeholder="e.g. Kamara Mobile Agent"
            onChange={(event) => update({ name: event.target.value })}
            aria-invalid={Boolean(errors.name)}
          />
          {errors.name ? <small className="is-error">{errors.name}</small> : null}
        </label>

        <fieldset className="omasta-field omasta-add-categories">
          <legend>What kind of place?</legend>
          <div className="omasta-add-category-options">
            {SUBMISSION_CATEGORIES.map((category) => (
              <button
                type="button"
                key={category.id}
                className={draft.category === category.id ? "is-active" : ""}
                aria-pressed={draft.category === category.id}
                onClick={() => update({ category: category.id })}
              >
                {category.label}
              </button>
            ))}
          </div>
          {errors.category ? <small className="is-error">{errors.category}</small> : null}
        </fieldset>

        <div className="omasta-field">
          <label htmlFor="add-location-address">
            <span>Address</span>
          </label>
          <div className="omasta-address-input">
            <MapPin size={16} aria-hidden="true" />
            <input
              id="add-location-address"
              type="text"
              value={resolvingAddress ? "Finding the address..." : draft.address}
              maxLength={200}
              autoComplete="street-address"
              placeholder="Street, area, town"
              readOnly={resolvingAddress}
              // Editing the text keeps a captured point, so a landmark can be added to it.
              onChange={(event) => update({ address: event.target.value })}
              aria-invalid={Boolean(errors.address)}
              aria-describedby="add-location-captured"
            />
            {resolvingAddress ? <Loader2 size={16} className="omasta-spin" aria-hidden="true" /> : null}
          </div>

          <div className="omasta-capture-row">
            <button type="button" className="omasta-capture-button" onClick={onLocateMe} disabled={locating}>
              {locating ? <Loader2 size={16} className="omasta-spin" /> : <Smartphone size={16} />}
              {locating ? "Locating..." : "Locate me"}
            </button>
            <span className="omasta-capture-recommended">Recommended</span>
            <button
              type="button"
              className="omasta-capture-button"
              onClick={onDropPin}
              disabled={!canDropPin}
              title={canDropPin ? "Place a pin on the map" : "Needs the live map"}
            >
              <Crosshair size={16} />
              Drop a pin
            </button>
          </div>

          <small id="add-location-captured" className={errors.address || locateError ? "is-error" : "omasta-captured"}>
            {errors.address ||
              locateError ||
              (capturedLabel ? (
                <>
                  <ShieldCheck size={13} aria-hidden="true" /> Exact point captured: {capturedLabel}
                </>
              ) : (
                "Use Locate me if you are there now, or Drop a pin to mark it on the map."
              ))}
          </small>
        </div>

        <label className="omasta-field">
          <span>Phone (optional)</span>
          <input
            type="tel"
            inputMode="tel"
            value={draft.phone}
            maxLength={20}
            autoComplete="off"
            placeholder="076 123 456"
            onChange={(event) => update({ phone: event.target.value })}
            aria-invalid={Boolean(errors.phone)}
          />
          {errors.phone ? <small className="is-error">{errors.phone}</small> : null}
        </label>

        <label className="omasta-field">
          <span>Notes for the reviewer (optional)</span>
          <textarea
            rows={2}
            value={draft.notes}
            maxLength={300}
            placeholder="Opening hours, landmark, services offered..."
            onChange={(event) => update({ notes: event.target.value })}
          />
          {errors.notes ? <small className="is-error">{errors.notes}</small> : null}
        </label>

        {submitError ? <p className="omasta-money-flow-error">{submitError}</p> : null}

        <button
          type="submit"
          className="orange-button orange-button--solid omasta-add-submit"
          disabled={submitting || resolvingAddress}
        >
          {submitting ? <Loader2 size={16} className="omasta-spin" /> : null}
          {submitting ? "Submitting..." : "Submit for approval"}
        </button>
      </form>
    </BottomSheet>
  );
}
