# Orange Intelligence preview

Run `npm run dev -- --host 127.0.0.1` from this directory and open the URL printed by Vite.

The preview includes the consolidated dashboard, nine department scopes, a department switcher, sample administrator identities, editable department assignments, customer dataset analytics, CSV import/export and the Gemini-powered OMASTA assistant. Use the administrator selector in the top bar to inspect each person's navigation. As the super admin, use **Team & access** to change responsibilities. Open **Customer analysis** for dataset-driven charts and customer details.

The business overview figures, administrator identities, trends and regional hotspots are fictional development data. Customer and wallet counts are illustrative service counts, not verified unique people. The map is an illustration, not official district geography. The overview reporting-period control changes illustrative exposure figures; it does not query a historical dataset. Customer analysis uses 36 fictional records until a CSV is imported. Its statistics are calculated from the scoped, filtered rows; the business overview's fictional KPIs do not change on CSV import. OMASTA analyses the customer dataset aggregates, not the overview's illustrative business KPIs.

## Customer dataset

Download the CSV template from Customer analysis. Supported features are State, Area code, Account length, International plan, Voice mail plan, day/evening/night/international minutes, calls and charges, and Customer service calls. Familiar column forms such as `Account length`, `account_length`, `total_day_minutes`, `total_eve_calls`, and `total_intl_charge` are accepted.

An optional `churn` column accepts yes/no, true/false or 1/0. Blank or absent outcomes stay unknown. Observed churn is the number of churned records divided by records with known labels, within the current filtered cohort. It is not a prediction. An optional `department` column accepts B2C or B2B; without it, the importer chooses the default business scope. Only the super-admin preview can import. Imports replace the previous dataset, remain in browser memory and reset on reload. Limits: 5 MB and 50,000 rows. Invalid or missing feature values reject the import without replacing the current dataset.

The explorer supports location, plan and outcome filters, record search, pagination, detailed minutes/calls/charges, and cohort CSV export. Exported location values that start with formula characters are neutralised for spreadsheets. State/area code values are preserved without geographic mapping. Charge currency and tenure units remain unspecified. Orange Money needs a separate wallet dataset.

Follow-up signals identify customers with 4+ customer service calls or an international plan. These are explicit operational review rules, not calibrated churn probabilities, trained predictions or proven causes.

## OMASTA and Gemini

Set `GEMINI_API_KEY` in the server's `.env`, then restart Vite. The existing local key is used without modification. `GEMINI_MODEL` optionally overrides the default `gemini-3.8-flash`. The key is loaded server-side and is never passed to the browser. OMASTA uses the AI SDK's Google provider; provider setup is documented at [AI SDK Google provider](https://ai-sdk.dev/providers/ai-sdk-providers/google), with current model identifiers in [Google's model catalogue](https://ai.google.dev/gemini-api/docs/models).

The `/api/omasta` middleware exists only in the local Vite development server. It accepts same-origin localhost requests, caps input size and rate, and sends whitelisted numeric aggregate statistics plus user questions and recent conversation turns to Gemini. Raw customer rows, record identifiers, states, area codes, filenames and environment values are excluded from AI context. User-entered chat messages are sent to Gemini as written. Do not put personal information or secrets in chat.

The assistant shows loading, connection, quota and failure states. Provider failures never produce a fabricated local AI answer. Filtering or changing dataset/department resets the conversation so old cohort context does not carry into a new analysis. Context statistics are client-provided in this preview, so they are not a production source of truth.

Production hosting needs an authenticated backend endpoint, server-side department-scoped data queries, secret management and persisted assignments. The static build alone does not include the local AI endpoint.

Assignments are held in memory and reset on reload. The identity selector is a demo control, not authentication. Production needs authenticated identities, server-side role and department checks, persistent assignments, audit logging, verified departmental data, and agreed churn definitions before this is used with real customer records.

## Verification

- `npm test` covers department filtering, CSV parsing/validation/export, observed churn, aggregate context sanitisation, AI error handling, local-only middleware and request timeouts.
- `npm run lint`
- `npm run build`

Browser checks cover department and identity switching, assignment edits, fictional CSV import, customer details, outcome filters, the Gemini chat panel and responsive layout.
