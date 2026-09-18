import { useState } from "react";
import { ArrowLeft, CircleCheck, Loader2, ShieldCheck } from "lucide-react";

import BottomSheet from "../common/BottomSheet.jsx";
import { DemoNote } from "../common/DemoBadge.jsx";
import {
  MoneyFlowKind,
  formatRecipient,
  parseAmount,
  submitMoneyFlow,
  validateAmount,
  validateRecipient,
} from "../../services/money/moneyService.js";
import { formatMoney } from "../../utils/format.js";

const COPY = {
  [MoneyFlowKind.SEND]: {
    title: "Send money",
    recipientLabel: "Send to",
    recipientHint: "The recipient's Orange number",
    reviewLead: "You are about to send",
    confirmLabel: "Confirm and send (demo)",
    resultTitle: "Simulated transfer: no money moved",
    resultBody: "This build is not connected to Orange Money. No funds left your account and the recipient received nothing.",
  },
  [MoneyFlowKind.REQUEST]: {
    title: "Request money",
    recipientLabel: "Request from",
    recipientHint: "The Orange number you are requesting from",
    reviewLead: "You are about to request",
    confirmLabel: "Confirm request (demo)",
    resultTitle: "Simulated request: nothing was sent",
    resultBody: "This build is not connected to Orange Money. No request reached the other number.",
  },
};

const STEPS = ["recipient", "amount", "review"];

/**
 * Send / Request money, as a safe demo.
 *
 * Follows the production shape (recipient, amount, review, explicit
 * confirmation, Orange authentication, result) but never moves money: the
 * service only returns a result marked as simulated, and this sheet says so.
 * It never asks for a PIN or OTP; in production those are collected by
 * Orange's own authentication step, not by this app.
 */
export default function MoneyFlowSheet({ kind, open, onClose, availableBalance, currency = "SLE", isDemoBalance }) {
  const copy = COPY[kind] || COPY[MoneyFlowKind.SEND];
  const isSend = kind === MoneyFlowKind.SEND;

  const [step, setStep] = useState("recipient");
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [fieldError, setFieldError] = useState("");
  const [result, setResult] = useState(null);
  const [submitError, setSubmitError] = useState("");

  const stepIndex = STEPS.indexOf(step);

  const goBack = () => {
    setFieldError("");
    setStep(STEPS[Math.max(stepIndex - 1, 0)]);
  };

  const submitRecipient = (event) => {
    event.preventDefault();
    const problem = validateRecipient(recipient);
    setFieldError(problem);

    if (!problem) {
      setStep("amount");
    }
  };

  const submitAmount = (event) => {
    event.preventDefault();
    const problem = validateAmount(amount, { max: isSend ? availableBalance : null });
    setFieldError(problem);

    if (!problem) {
      setStep("review");
    }
  };

  const confirm = async () => {
    setStep("processing");
    setSubmitError("");

    try {
      const outcome = await submitMoneyFlow({
        kind,
        recipient,
        amount: parseAmount(amount),
        currency,
        confirmed: true,
      });
      setResult(outcome);
      setStep("result");
    } catch {
      setSubmitError("The demo flow could not finish. Nothing was sent.");
      setStep("review");
    }
  };

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      eyebrow={step === "result" ? "Demo only" : `Demo · step ${step === "processing" ? 3 : stepIndex + 1} of 3`}
      title={copy.title}
      labelledById="money-flow-title"
    >
      <div className="omasta-money-flow">
        {stepIndex > 0 ? (
          <button type="button" className="omasta-back-button" onClick={goBack}>
            <ArrowLeft size={16} />
            Back
          </button>
        ) : null}

        {step === "recipient" ? (
          <form onSubmit={submitRecipient} noValidate>
            <label className="omasta-field">
              <span>{copy.recipientLabel}</span>
              <input
                type="tel"
                inputMode="tel"
                autoComplete="off"
                placeholder="076 123 456"
                value={recipient}
                onChange={(event) => setRecipient(event.target.value)}
                aria-invalid={Boolean(fieldError)}
                aria-describedby="money-recipient-hint"
              />
              <small id="money-recipient-hint" className={fieldError ? "is-error" : ""}>
                {fieldError || copy.recipientHint}
              </small>
            </label>
            <button type="submit" className="orange-button orange-button--solid omasta-money-flow-next">
              Continue
            </button>
          </form>
        ) : null}

        {step === "amount" ? (
          <form onSubmit={submitAmount} noValidate>
            <label className="omasta-field">
              <span>Amount ({currency})</span>
              <input
                type="text"
                inputMode="decimal"
                autoComplete="off"
                placeholder="0.00"
                value={amount}
                onChange={(event) => setAmount(event.target.value.replace(/[^\d.,]/g, ""))}
                aria-invalid={Boolean(fieldError)}
                aria-describedby="money-amount-hint"
              />
              <small id="money-amount-hint" className={fieldError ? "is-error" : ""}>
                {fieldError ||
                  (isSend
                    ? `Available: ${formatMoney(availableBalance, currency)}${isDemoBalance ? " (demo balance)" : ""}`
                    : "How much you are asking for")}
              </small>
            </label>
            <label className="omasta-field">
              <span>Note (optional)</span>
              <input
                type="text"
                maxLength={60}
                autoComplete="off"
                placeholder={isSend ? "What is it for?" : "Reason for the request"}
                value={note}
                onChange={(event) => setNote(event.target.value)}
              />
            </label>
            <button type="submit" className="orange-button orange-button--solid omasta-money-flow-next">
              Review
            </button>
          </form>
        ) : null}

        {step === "review" || step === "processing" ? (
          <div>
            <p className="omasta-money-flow-lead">{copy.reviewLead}</p>
            <p className="omasta-money-flow-total">{formatMoney(parseAmount(amount), currency)}</p>
            <dl className="omasta-spec-list omasta-money-flow-summary">
              <div>
                <dt>{copy.recipientLabel}</dt>
                <dd>{formatRecipient(recipient)}</dd>
              </div>
              {note ? (
                <div>
                  <dt>Note</dt>
                  <dd>{note}</dd>
                </div>
              ) : null}
              <div>
                <dt>Fee</dt>
                <dd>Shown by Orange Money before you approve</dd>
              </div>
            </dl>

            <p className="omasta-money-flow-auth">
              <ShieldCheck size={16} aria-hidden="true" />
              <span>
                In the live service, Orange Money would now ask you to approve with your PIN or a one-time code. This
                demo does not ask for, or store, either.
              </span>
            </p>

            {submitError ? <p className="omasta-money-flow-error">{submitError}</p> : null}

            <div className="omasta-confirm-actions">
              <button
                type="button"
                className="orange-button orange-button--solid"
                onClick={confirm}
                disabled={step === "processing"}
              >
                {step === "processing" ? <Loader2 size={16} className="omasta-spin" /> : null}
                {step === "processing" ? "Simulating..." : copy.confirmLabel}
              </button>
              <button
                type="button"
                className="orange-button orange-button--outline"
                onClick={onClose}
                disabled={step === "processing"}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : null}

        {step === "result" && result ? (
          <div className="omasta-money-flow-result">
            <span className="omasta-money-flow-result-icon" aria-hidden="true">
              <CircleCheck size={24} />
            </span>
            <h3>{copy.resultTitle}</h3>
            <p>
              {formatMoney(result.amount, result.currency)} · {result.recipient}
            </p>
            <p className="omasta-money-flow-ref">Demo reference {result.reference}</p>
            <DemoNote>{copy.resultBody} A real result will only ever come from a verified Orange Money response.</DemoNote>
            <button type="button" className="orange-button orange-button--solid omasta-money-flow-next" onClick={onClose}>
              Done
            </button>
          </div>
        ) : null}
      </div>
    </BottomSheet>
  );
}
